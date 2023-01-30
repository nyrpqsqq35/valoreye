import { Preferences, PresenceStatus } from '../types'

let prefs: Preferences = {
  autoLockAgent: {
    enabled: false,
    options: {},
  },
  presence: {
    enabled: false,
    status: PresenceStatus.Online,

    spoofPresence: false,
    spoofPlayerTitle: false,
    spoofLevelBorder: false,
    spoofPlayerCard: false,
    spoofQueueId: false,
    spoofLBPos: false,
    spoofLevel: false,
    spoofTier: false,

    playerTitle: '5c3e2030-4d8a-a242-04b1-ff872557ebfd',
    levelBorder: 'ebc736cd-4b6a-137b-e2b0-1486e31312c9',
    playerCard: '9fb348bc-41a0-91ad-8a3e-818035c4e561',
    queueId: 'unrated',
    lbPos: 0,
    level: 1,
    tier: 0,
  },
  uuid: '?',
}
export function getPreferences(): Preferences {
  return prefs
}
export function setPreferences(p: Preferences) {
  prefs = { ...prefs, ...p }
}
