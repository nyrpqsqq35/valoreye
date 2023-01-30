import { Flag } from '~/types'

export interface IRuntimeOptions {
  flags: Flag[]
  debug: string[]
  launchValorant: boolean
  writePersistedState: boolean

  setup: boolean
}

enum Token {
  None = 0,
  Flags,
  Debug,
}

export const cachedOptions: IRuntimeOptions = {
  flags: [],
  debug: [],
  launchValorant: false,
  writePersistedState: false,

  setup: false,
}

const LVExclusiveFlags = [Flag.STATUS_SPOOFING, Flag.PRESENCE_SPOOFING]

export function getRuntimeOptions(): IRuntimeOptions {
  if (cachedOptions.setup) return cachedOptions
  let waiting = Token.None
  try {
    for (const item of process.argv) {
      switch (waiting) {
        case Token.None:
          {
            switch (item) {
              case '-lv':
                cachedOptions.launchValorant = true
                cachedOptions.writePersistedState = true
                break
              case '-f':
                waiting = Token.Flags
                break
              case '-d':
                waiting = Token.Debug
                break
            }
          }
          break
        case Token.Flags:
          cachedOptions.flags.push(item.toUpperCase() as Flag)
          waiting = Token.None
          break
        case Token.Debug:
          cachedOptions.debug.push(item.toLowerCase())
          waiting = Token.None
          break
        default:
          break
      }
    }
  } catch (err) {}
  if (waiting) throw new Error('Missing flag in parameters')

  cachedOptions.flags.push(
    Flag.ADD_FRIEND,
    Flag.ENABLE_AUTOLOCK,
    Flag.LEVELS_VISIBLE,
    Flag.NAMES_VISIBLE,
    Flag.PARTY_INVITE,
    Flag.PREF_EDITOR
  )

  if (cachedOptions.launchValorant) {
    cachedOptions.flags.push(Flag.PRESENCE_SPOOFING, Flag.STATUS_SPOOFING)
    // cachedOptions.flags.push(...LVExclusiveFlags)
  } else if (BUILD_META.env === 'production') {
    cachedOptions.flags = cachedOptions.flags.filter(
      (i) => !LVExclusiveFlags.includes(i)
    )
  }
  cachedOptions.setup = true
  return cachedOptions
}

export function flagEn(flag: Flag) {
  return getRuntimeOptions().flags.includes(flag)
}

export function flagDis(flag: Flag) {
  return !flagEn(flag)
}
