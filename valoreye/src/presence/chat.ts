import { DefaultChatPort, DefaultChatSecure } from '../constants'
import { Element, Parser } from '@xmpp/xml'
import tls from 'tls'
import net from 'net'
import { createLogger } from '~/util/logger'
import { flagDis, flagEn, getRuntimeOptions } from '~/util/runtime'
import { inspect } from 'util'
import {
  Side,
  createReplacer,
  modifyElement,
  CERTIFICATE,
  KEY,
  WANTED_SIGALGS,
  xmpp,
} from './consts'
import { Ports } from '~/util/ports'
import { getPreferences } from '~/web/prefs'
import {
  Flag,
  PresenceStatus,
  ValorantPartyState,
  ValorantPrivatePresence,
  ValorantQueueId,
} from '~/types'
import { atob, btoa, encodeJSONRiotLike } from '~/util/util'
import { persistedStateStore } from '~/store/persistedState'
const logger = createLogger('Chat'),
  dataLogger = createLogger('Chat/Data', true)

const presenceMap = {
  [PresenceStatus.Online]: 'chat',
  [PresenceStatus.Away]: 'away',
  [PresenceStatus.Mobile]: 'mobile',
  [PresenceStatus.Offline]: 'offline',
}

function decodePresence(
  valorantGame?: Element
): ValorantPrivatePresence | undefined {
  if (!valorantGame) return
  const presenceText = valorantGame.getChild('p')?.text()
  if (!presenceText) return
  return JSON.parse(atob(presenceText))
}

function fixPresence(p?: ValorantPrivatePresence) {
  if (!p) return
  if (flagDis(Flag.STATUS_SPOOFING) && flagDis(Flag.PRESENCE_SPOOFING)) return
  const { presence } = getPreferences()

  if (
    presence.enabled &&
    presence.status !== PresenceStatus.Offline &&
    flagEn(Flag.STATUS_SPOOFING)
  ) {
    if (presence.status === PresenceStatus.Away) {
      // Hide game and go idle
      p.isIdle = true
      p.partyOwnerMatchMap = ''
      p.partyOwnerMatchCurrentTeam = ''
      p.partyOwnerMatchScoreAllyTeam = 0
      p.partyOwnerMatchScoreEnemyTeam = 0
      p.partyState = ValorantPartyState.Default
    }
  }
  if (presence.spoofPresence && flagEn(Flag.PRESENCE_SPOOFING)) {
    // Spoof hovercard presence
    if (presence.spoofPlayerTitle) p.playerTitleId = presence.playerTitle
    if (presence.spoofLevelBorder)
      p.preferredLevelBorderId = presence.levelBorder
    if (presence.spoofPlayerCard) p.playerCardId = presence.playerCard
    if (presence.spoofQueueId) p.queueId = presence.queueId as ValorantQueueId
    if (presence.spoofLBPos) p.leaderboardPosition = presence.lbPos
    if (presence.spoofLevel) p.accountLevel = presence.level
    if (presence.spoofTier) p.competitiveTier = presence.tier
  }
}

function replacePresence(
  valorantGame?: Element,
  presence?: ValorantPrivatePresence
) {
  if (!valorantGame) return
  if (!presence) return
  valorantGame.getChild('p')?.text(btoa(encodeJSONRiotLike(presence)))
}

const replacers = [
  createReplacer(Side.Client, (e) => {
    e
    if (e.name !== 'presence') return
    dataLogger.debug(
      'Presence found',
      inspect(e, false, 100, true),
      e.toString()
    )
    const { presence } = getPreferences()

    const games = e.getChild('games')?.getChildElements()
    if (!games) return

    const valorantGame = e.getChild('games')?.getChild('valorant')
    const p = decodePresence(valorantGame)

    const old = { ...p }

    // Spoof status
    e.getChild('show')?.text(presenceMap[presence.status])
    for (const game of games) {
      game.getChild('st')?.text(presenceMap[presence.status])
    }
    if (presence.enabled && presence.status === PresenceStatus.Offline)
      e.getChild('games')?.remove('valorant')

    fixPresence(p)

    replacePresence(valorantGame, p)

    dataLogger.debug('Replaced presence old=', old, 'new =', p)
    dataLogger.debug(valorantGame?.getChild('p')?.text())
  }),
]

// Each parser seems to only emit a 'start' for the first <stream> opened
// So we create a new parser every time we receive chunk that starts with <?xml
// (which should always be the start of a stream header in regards to riot xmpp)
function createParser(
  side: Side,
  dst: tls.TLSSocket | net.Socket,
  arr: Parser[]
): Parser {
  const prefix = side === Side.Client ? '[c-> s]' : '[c <-s]'

  const parser = new Parser()
  parser
    .on('start', (e: Element) => {
      logger.debug(prefix, e.name, 'started')
      dst.write(xmpp.header(e))
    })
    .on('element', (e: Element) => {
      modifyElement(side, e, replacers)
      let built = e.toString()
      dataLogger.debug(prefix, built)
      dst.write(built)
    })
    .on('end', (e: Element) => {
      logger.debug(prefix, e.name, 'ended')
      dst.write(xmpp.footer(e))

      arr.shift()
    })

  arr.unshift(parser)
  logger.debug(prefix, 'created new parser, #parsers =', arr.length)
  return parser
}

// https://cs.github.com/molenzwiebel/Deceive/blob/master/Deceive/StartupHandler.cs
const chatServer = tls
  .createServer(
    {
      sigalgs: WANTED_SIGALGS,
      cert: CERTIFICATE,
      key: KEY,
      enableTrace: getRuntimeOptions().debug.includes('tls_server'),
    },
    (sock) => {
      logger.info('Client connected')

      const { chatContext } = persistedStateStore.getState()

      let out = tls.connect({
        host: chatContext.host,
        port: chatContext.port,
        enableTrace: getRuntimeOptions().debug.includes('tls_client'),
      })
      out.on('secureConnect', () => {
        logger.info(
          'Connected to Riot chat',
          chatContext.host,
          '(' + out.remoteAddress + ')'
        )
      })

      const incomingParsers: Parser[] = [], // c <-s
        outgoingParsers: Parser[] = [] // c-> s

      const end = () => {
        if (sock.readyState === 'open') sock.end()
        if (out.readyState === 'open') out.end()
        incomingParsers.length = 0
        outgoingParsers.length = 0
      }

      sock
        .on('data', (data) => {
          if (data.toString().startsWith('<?xml'))
            createParser(Side.Client, out, outgoingParsers)
          if (!outgoingParsers.length) return end()
          outgoingParsers[0].write(data)
          // xmlLogger.info('[c-> s]#', data.length, data.toString())
        })
        .on('error', (err) => {
          logger.error('Incoming chat errored', err)
          end()
        })
        .on('end', (_) => {
          logger.warn('Incoming chat ended')
          end()
        })

      out
        .on('data', (data) => {
          if (data.toString().startsWith('<?xml'))
            createParser(Side.Server, sock, incomingParsers)
          if (!incomingParsers.length) return end()
          incomingParsers[0].write(data)
          // xmlLogger.debug('[c <-s]#', data.length, data.toString())
        })
        .on('error', (err) => {
          logger.error('Outgoing chat errored', err)
          end()
        })
        .on('end', (_) => {
          logger.warn('Outgoing chat ended')
          end()
        })
    }
  )
  .on('tlsClientError', (err, sock) => {
    logger.debug('Encountered a tlsClientError from', sock.remoteAddress, err)
  })

export function listenChat(port = Ports.chatServer): Promise<number> {
  return new Promise((resolve, reject) => {
    try {
      chatServer.listen(port, () => {
        logger.success('Listening on port', port)
        Ports.chatServer = port
        resolve(port)
      })
    } catch (err) {
      if (err.code === 'EADDRINUSE') {
        logger.warn(
          'Port',
          port,
          'already in use, randomizing port and trying again...'
        )
        Ports.chatServer = Ports.random()
        resolve(listenChat())
      } else {
        reject(err)
      }
    }
  })
}
