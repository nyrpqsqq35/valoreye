import { WebSocketServer } from 'ws'
import {
  agentsCache,
  competitiveTiersCache,
  levelBordersCache,
  mapsCache,
  playerCardsCache,
  playerTitlesCache,
} from '~/cache'
import { WebSocketMountPath } from '~/constants'
import riot from '~/interaction/riot'
import { CachePayload, OpCode } from '~/types'
import { createLogger } from '~/util/logger'
import { Ports } from '~/util/ports'
import { getRuntimeOptions } from '~/util/runtime'
import { messageHandler } from './shared'

const wss = new WebSocketServer({
  noServer: true,
  path: WebSocketMountPath,
})

const logger = createLogger('Web')
wss.on('connection', async (ws, req) => {
  const vsend = (op: OpCode, data?: any) => {
    ws.send(JSON.stringify({ op, p: data }))
  }
  ws.on('message', async (message, isBinary) => {
    await messageHandler(message, isBinary)
  })
  vsend(OpCode.LOCALPLAYER_UPDATED, [riot.playerId, riot.playerName])
  vsend(OpCode.CLEAR_PLAYERS)
  vsend(OpCode.CACHE_UPDATED, {
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
})

export function publish(op: OpCode, data?: any) {
  const payload = JSON.stringify({ op, p: data })
  wss.clients.forEach((ws) => ws.send(payload))
}

export { wss }

// export function listenWebSocket(port = Ports.webSocket): Promise<void> {
//   return new Promise((resolve, reject) => {
//     resolve()
//   })
// }
