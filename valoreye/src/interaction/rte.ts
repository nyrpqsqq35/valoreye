import { WebSocket, RawData } from 'ws'
import { RiotAPI } from './riot'
import { EventEmitter } from 'eventemitter3'
import { createLogger } from '~/util/logger'
import valorant from './valorant'
import {
  UUID,
  ValorantPrivatePresence,
  RiotPresences,
  RiotPresence,
  OpCode,
} from '~/types'
import { atob } from '~/util/util'
import { Patterns } from '~/constants'
import { publish } from '~/web/ws'

const logger = createLogger('Riot/RTE', true)

enum EventNames {
  Presences = 'OnJsonApiEvent_chat_v4_presences',
  RMSMessage = 'OnJsonApiEvent_riot-messaging-service_v1_message',
  RMSMessages = 'OnJsonApiEvent_riot-messaging-service_v1_messages',
}

const DefaultEvents = [
  EventNames.Presences,
  EventNames.RMSMessage,
  EventNames.RMSMessages,
]

export enum MessageCode {
  Welcome = 0,
  Prefix = 1,
  Call = 2,
  CallResult = 3,
  CallError = 4,
  Subscribe = 5,
  Unsubscribe = 6,
  Publish = 7,
  Event = 8,
}

type WM = [MessageCode, ...any[]]
type DC<T> = { data: T }
export default class RiotRTE extends EventEmitter<{
  open: void
  close: void
  event: (event: string, ...a: any[]) => void
  presence: (
    playerUuid: UUID,
    state: string, // chat | dnd | away | offline ?
    presence: ValorantPrivatePresence
  ) => void
  pregame: (matchId: UUID) => void
  coregame: (matchId: UUID) => void
}> {
  #opts = {
    cachePresence: true,
  }

  riot: RiotAPI
  ws?: WebSocket

  subscribedEvents: string[] = []

  #presenceCache = new Map<UUID /*PlayerUUID*/, RiotPresence>()

  #lastPregameId = ''
  #lastCoregameId = ''

  constructor(riot: RiotAPI) {
    super()
    this.riot = riot
    this.on('event', this.onEvent)
  }

  private onError = (err: Error) => {
    logger.warn('Error in RC connection', err)
  }
  private onOpen = () => {
    logger.info('Connected to RC via WebSocket')
    for (const evt of DefaultEvents) this.subscribe(evt)
    this.emit('open')
  }
  private onClose = (code: number, reason: Buffer) => {
    logger.warn('RC connection closed:', code, reason.toString())
    this.emit('close')
  }
  private onMessage = async (data: RawData, isBinary: boolean) => {
    logger.debug('Received message from RC ws', data.toString())
    try {
      const msg = JSON.parse(data.toString()) as WM
      switch (msg[0]) {
        case MessageCode.Event:
          {
            const [eventName, ...a] = msg.slice(1)
            this.emit('event', eventName, ...a)
          }
          break
        default:
          break
      }
    } catch (err) {
      if (err.toString().includes('JSON')) return
      logger.warn('Error in RC websocket receiver', err)
    }
  }
  private onEvent = async (event: string, ...a: any[]) => {
    switch (event) {
      case EventNames.Presences:
        {
          const { presences } = (a[0] as DC<RiotPresences>).data
          for (const p of presences) {
            if (p.product !== 'valorant') continue
            const pp = JSON.parse(atob(p.private)) as ValorantPrivatePresence
            logger.debug(
              'Presence received for',
              p.puuid,
              'in state',
              p.state,
              `(${pp.sessionLoopState})`
            )
            const { puuid, state } = p
            if (this.#opts.cachePresence) {
              this.#presenceCache.set(puuid, p)
            }
            this.emit('presence', puuid, state, pp)
          }
        }
        break
      case EventNames.RMSMessage:
        {
          logger.debug('RMS message:', ...a)
          const { resource, service } = (
            a[0] as DC<{ resource?: string; service?: string }>
          ).data
          if (!resource || !service) return
          switch (service) {
            case 'pregame':
              {
                const matches = resource.match(Patterns.PreGameMatchId)
                if (!matches) return
                const id = matches[1]
                this.#lastPregameId = id
                if (this.#lastCoregameId !== id) {
                  this.#lastCoregameId = ''
                  this.emit('pregame', id)
                }
              }
              break
            case 'core-game':
              {
                const matches = resource.match(Patterns.CoreGameMatchId)
                if (!matches) return
                const id = matches[1]
                this.#lastPregameId = ''
                this.#lastCoregameId = id
                this.emit('coregame', id)
              }
              break
            default:
              break
          }
        }
        break
    }
  }

  get open() {
    return this.ws?.readyState === WebSocket.OPEN
  }

  send(mc: MessageCode, data: any): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.ws || !this.open)
        return reject(new Error('WebSocket is not open or ready'))
      this.ws?.send(JSON.stringify([mc, data]), (err) => {
        if (err) return reject(err)
        resolve()
      })
    })
  }

  destroyWs() {
    // are event subscriptions per socket?
    this.subscribedEvents.length = 0
    this.#presenceCache.clear()

    const { ws } = this
    if (!ws) return
    logger.debug('Destroying ws')
    ws.close(1006)
    delete this.ws
  }

  connect() {
    if (this.ws) this.destroyWs()
    logger.debug('Connecting to RC')
    const { host, port } = valorant.getLockfileContent()

    this.ws = new WebSocket(`wss://${host}:${port}`, {
      headers: {
        // Shh
        ...(this.riot.localHeaders as any),
      },
      // Self signed
      rejectUnauthorized: false,
    })
    this.ws
      .on('error', this.onError)
      .on('open', this.onOpen)
      .on('close', this.onClose)
      .on('message', this.onMessage)
  }

  async subscribe(event: string) {
    if (this.subscribedEvents.includes(event)) return
    this.subscribedEvents.push(event)
    logger.debug('Subscribed to', event)
    return this.send(MessageCode.Subscribe, event)
  }
  async unsubscribe(event: string) {
    if (!this.subscribedEvents.includes(event)) return
    this.subscribedEvents = this.subscribedEvents.filter((i) => i !== event)
    logger.debug('Unsubscribed from', event)
    return this.send(MessageCode.Unsubscribe, event)
  }

  getCachedPresence(ply: UUID): RiotPresence | undefined {
    return this.#presenceCache.get(ply)
  }
}
