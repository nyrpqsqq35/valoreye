import EventEmitter from 'eventemitter3'
import {
  CachePayload,
  GameDataPlayer,
  LicenseKey,
  OpCode,
  UUID,
  ValorantLoopState,
  ValorantPlayerSettings,
} from './types'
import gameDataStore from './stores/useGameData'
import useGameData from './stores/useGameData'
import usePreferences, { serializePreferences } from './stores/usePreferences'
import { sharedCache } from './sharedCache'
import useEphemeral from './stores/useEphemeral'
import useVPrefs from './stores/useVPrefs'

class EWS extends EventEmitter {
  url!: string
  retries = 0
  selfClose = false
  reconnecting = false
  retryTime = 200
  ws?: WebSocket

  send(op: OpCode, data: any) {
    if (!this.ws) return
    if (this.ws.readyState !== WebSocket.OPEN) return
    return this.ws.send(
      JSON.stringify({
        op,
        p: data,
      })
    )
  }
  close() {
    this.selfClose = true
    if (this.ws) this.ws.close()
  }
  reconnect() {
    this.reconnecting = true
    setTimeout(() => {
      this.connect()
    }, this.retries * this.retryTime)
  }
  async connect() {
    // !
    const res = await fetch(
      BUILD_META.env === 'production'
        ? '/__valoreye/ports'
        : 'http://localhost:9586/__valoreye/ports'
    )
    const json = await res.json()
    this.url = json.websocket
    this.ws = new WebSocket(this.url)
    this.ws.addEventListener('open', this.onOpen)
    this.ws.addEventListener('message', this.onMessage)
    this.ws.addEventListener('error', this.onError)
    this.ws.addEventListener('close', this.onClose)
  }
  onError = (e: Event) => {
    if (this.reconnecting) {
      this.retries++
    }
    console.error('Error in WebSocket', e)
  }
  onOpen = (e: Event) => {
    this.retries = 0
    this.reconnecting = false
    this.emit('open')
    useGameData.getState().setConnected(true)
  }
  onMessage = (e: MessageEvent) => {
    let str = e.data.toString()
    try {
      let payload = JSON.parse(str)
      console.log(payload)
      this.emit('message', payload)
      if (payload.op) {
        this.emit(payload.op, payload)
      }
    } catch (ex) {
      console.error('Failed to parse', str, 'ex: \n', ex)
    }
  }

  onClose = (e: CloseEvent) => {
    this.emit('close')
    if (this.selfClose) return
    this.reconnect()
    useGameData.getState().setConnected(false)
  }
}
const ws = new EWS()

interface Message<T> {
  op: OpCode
  p: T
}

usePreferences.subscribe(async (state, prevState) => {
  ws.send(OpCode.PREFERENCES, serializePreferences())
})

ws.on('open', () => {
  console.log('WS open, sending preferences')
  ws.send(OpCode.PREFERENCES, serializePreferences())
})
ws.on('close', () => console.log('WS closed'))

ws.on(OpCode.LOCALPLAYER_UPDATED, ({ p }: Message<[string, string]>) => {
  // playerId, playerName
  gameDataStore.getState().setLocalPlayer(...p)
})

ws.on(OpCode.PLAYER_ADDED, ({ p: player }: Message<GameDataPlayer>) => {
  gameDataStore.getState().addPlayer(player)
})

ws.on(OpCode.PLAYER_REMOVED, ({ p: player }: Message<UUID>) => {
  gameDataStore.getState().removePlayer(player)
})

ws.on(OpCode.CLEAR_PLAYERS, () => {
  gameDataStore.getState().clearPlayers()
})

ws.on(
  OpCode.GAMESTATE_UPDATED,
  ({ p: loopState }: Message<ValorantLoopState>) => {
    gameDataStore.getState().setLoopState(loopState)
  }
)

ws.on(OpCode.MAP_UPDATED, ({ p: map }: Message<any>) => {
  gameDataStore.getState().setMap(map)
})

ws.on(OpCode.SERVER_UPDATED, ({ p: server }: Message<string>) => {
  gameDataStore.getState().setServer(server)
})

ws.on(OpCode.CACHE_UPDATED, async ({ p }: Message<CachePayload>) => {
  // TypeScript ...........
  const keys = Object.keys(p) as (keyof CachePayload)[]
  await Promise.all(
    keys.map(async key => {
      await sharedCache.set(key, p[key])
    })
  )
  useEphemeral.setState(e => ({ ...e, reloadFlags: true }))
})

ws.on(OpCode.QUEUEID_UPDATED, ({ p: queueId }: Message<string>) => {
  gameDataStore.getState().setQueueId(queueId)
})

ws.on(OpCode.LICENSE_UPDATED, ({ p }: Message<LicenseKey>) => {
  useEphemeral.setState(e => ({ ...e, license: p }))
})
ws.on(OpCode.VPREF_UPDATED, ({ p }: Message<ValorantPlayerSettings>) => {
  console.log('Updated vprefs', p)
  useVPrefs.setState(e => ({ ...e, current: p }))
})
export default ws
