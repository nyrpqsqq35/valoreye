import create from 'zustand/vanilla'
import { locresCache } from '../cache'
import { GameDataPlayer, UUID, ValorantLoopState, VAMap } from '../types'

export interface ValorantStore {
  loopState: ValorantLoopState
  localPlayer: UUID
  players: GameDataPlayer[]
  map: VAMap | null
  server: string | null
  queueId: string | null

  pregameId: string | null
  coregameId: string | null
}

const store = create<ValorantStore>(() => ({
  loopState: ValorantLoopState.Menus,
  localPlayer: '',
  players: [],
  map: null,
  server: null,
  queueId: null,

  pregameId: null,
  coregameId: null,
}))

const { subscribe, getState } = store

export { subscribe, getState }

export function setLoopState(loopState: ValorantLoopState) {
  store.setState({
    loopState,
  })
}
export function setLocalPlayer(localPlayer: string) {
  store.setState({
    localPlayer,
  })
}

export function updatePlayer(player: GameDataPlayer) {
  store.setState((state) => {
    Object.assign(state.players.find((p) => p.id === player.id)!, player)
    return { players: state.players }
  })
}
export function clearPlayers() {
  store.setState({
    players: [],
  })
}
export function addPlayer(player: GameDataPlayer) {
  store.setState((state) => {
    if (state.players.find((p) => p.id === player.id)) {
      updatePlayer(player)
      return {}
    } else {
      return {
        players: [...state.players, player],
      }
    }
  })
}

export function setMap(map: VAMap | null) {
  store.setState({
    map,
  })
}

export function setServer(server: string | null) {
  store.setState({ server })
}
export function setQueueId(queueId: string | null) {
  store.setState({ queueId })
}
export function setPregameId(pregameId: string | null) {
  store.setState({
    pregameId,
  })
}
export function setCoregameId(coregameId: string | null) {
  store.setState({
    coregameId,
  })
}

export function setServerByGamePod(gamePodId: string | null) {
  let server = gamePodId ? locresCache.gamePodStrings[gamePodId] : null
  setServer(server)
}
