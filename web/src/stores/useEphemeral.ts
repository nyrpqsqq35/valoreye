import { LicenseKey } from '../types'
import create from 'zustand'

export enum HoverState {
  None = 0,
  PlayerTitle,
  LevelBorder,
  PlayerCard,
  QueueID,
  LeaderboardPos,
  PlayerLevel,
  CompetitiveRank,
}

interface EphemeralStore {
  presence: {
    hoverState: HoverState
    setHoverState: (state: HoverState) => void
    clearHoverState: (state: HoverState) => void
  }

  reloadFlags: boolean
  license?: LicenseKey
}

export default create<EphemeralStore>(set => ({
  presence: {
    hoverState: HoverState.None,
    setHoverState: state =>
      set(e => ({
        ...e,
        presence: {
          ...e.presence,
          hoverState: state,
        },
      })),
    clearHoverState: state =>
      set(e => ({
        ...e,
        presence: {
          ...e.presence,
          hoverState:
            e.presence.hoverState === state
              ? HoverState.None
              : e.presence.hoverState,
        },
      })),
  },
  reloadFlags: false,
}))
