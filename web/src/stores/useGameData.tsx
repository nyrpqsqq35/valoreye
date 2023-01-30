import create from 'zustand'
import {
  GameDataPlayer,
  UUID,
  VAAgent,
  VALevelBorder,
  ValorantCharacterSelectionState,
  ValorantLoopState,
  ValorantSeasonalBadgeInfo,
  ValorantTeamID,
  VAMap,
  VAPlayerCard,
  VAPlayerTitle,
} from '../types'

interface GDParties {
  colorMap: { [x: UUID]: string }
}

interface GameDataStore {
  connected: boolean
  gameRunning: boolean
  loopState: ValorantLoopState
  localPlayer: UUID
  localPlayerName: string
  players: GameDataPlayer[]
  map: VAMap | null
  parties: GDParties
  queueId: string
  server: string
  setConnected(connected: boolean): void
  setLocalPlayer(localPlayer: UUID, localPlayerText: string): void
  setLoopState(loopState: ValorantLoopState): void
  addPlayer(player: GameDataPlayer): void
  removePlayer(uuid: UUID): void
  clearPlayers(): void
  setQueueId(queueId: string): void
  setMap(map: VAMap): void
  setServer(server: string): void
}

export default create<GameDataStore>(set => ({
  connected: false,
  gameRunning: false,
  loopState: ValorantLoopState.Menus,
  localPlayer: '',
  localPlayerName: '',
  players: [],
  map: null,
  parties: {
    colorMap: {},
  },
  queueId: '',
  server: '',

  setConnected: connected => set(state => ({ connected })),

  setLocalPlayer: (localPlayer, localPlayerName) =>
    set(state => ({ localPlayer, localPlayerName })),

  setLoopState: loopState => set(state => ({ loopState })),

  addPlayer: player =>
    set(state => {
      if (state.players.find(p => p.id === player.id)) {
        Object.assign(state.players.find(p => p.id === player.id)!, player)
        return { players: state.players }
      }
      return {
        players: [...state.players, player],
      }
    }),
  removePlayer: uuid =>
    set(state => ({ players: state.players.filter(p => p.id !== uuid) })),
  clearPlayers: () =>
    set(state => ({ players: [], parties: { colorMap: {} } })),
  setQueueId: queueId => set(state => ({ queueId })),
  setMap: map => set(state => ({ map })),
  setServer: server => set(state => ({ server })),
}))
