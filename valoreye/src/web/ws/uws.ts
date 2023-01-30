import { CachePayload, OpCode } from '~/types'
import { App, DEDICATED_COMPRESSOR_3KB, WebSocket } from 'uWebSockets.js'
import riot from '~/interaction/riot'
import { createLogger } from '~/util/logger'
import { Ports } from '~/util/ports'
import {
  agentsCache,
  competitiveTiersCache,
  levelBordersCache,
  mapsCache,
  playerCardsCache,
  playerTitlesCache,
} from '~/cache'
import { getRuntimeOptions } from '~/util/runtime'
import { messageHandler } from './shared'

const logger = createLogger('Web')

interface ExtendedWS extends WebSocket {
  vsend?: (op: OpCode, data?: any) => void
}

const app = App({}).ws('/*', {
  idleTimeout: 32,
  maxBackpressure: 1024,
  maxPayloadLength: 8192,
  compression: DEDICATED_COMPRESSOR_3KB,

  open: async (ws: ExtendedWS) => {
    const subscribe = (op: OpCode) => ws.subscribe('OP_' + op)
    ws.vsend = (op: OpCode, data?: any) =>
      ws.send(JSON.stringify({ op, p: data }), false, false)

    ws.subscribe('update')
    subscribe(OpCode.LOCALPLAYER_UPDATED)
    subscribe(OpCode.GAMESTATE_UPDATED)
    subscribe(OpCode.PLAYER_ADDED)
    subscribe(OpCode.PLAYER_REMOVED)
    subscribe(OpCode.CLEAR_PLAYERS)
    subscribe(OpCode.MAP_UPDATED)
    subscribe(OpCode.SERVER_UPDATED)
    subscribe(OpCode.QUEUEID_UPDATED)
    ws.vsend(OpCode.LOCALPLAYER_UPDATED, [riot.playerId, riot.playerName])
    ws.vsend(OpCode.CLEAR_PLAYERS)
    ws.vsend(OpCode.CACHE_UPDATED, {
      levelBorders: await levelBordersCache.getAll(),
      playerCards: await playerCardsCache.getAll(),
      playerTitles: await playerTitlesCache.getAll(),
      competitiveTiers: await competitiveTiersCache.getAll(),
      maps: await mapsCache.getAll(),
      agents: await agentsCache.getAll(),
      flags: getRuntimeOptions().flags,
    } as CachePayload)
    global.republish = true
    logger.debug('Client connected')
  },
  message: async (ws: ExtendedWS, message, isBinary) => {
    await messageHandler(message, isBinary)
  },
  // origin check would go in upgrade handler
})

export function publish(op: OpCode, data?: any) {
  app.publish('OP_' + op, JSON.stringify({ op, p: data }), false, false)
}
export function listenWebSocket(port = Ports.webSocket): Promise<void> {
  return new Promise((resolve, reject) => {
    app.listen(port, (socket) => {
      if (socket) {
        logger.success('Listening on port 9585')
        resolve()
      } else {
        reject(new Error('Failed to listen'))
      }
    })
  })
}
export default app
