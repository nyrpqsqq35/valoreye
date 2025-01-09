import create from 'zustand/vanilla'
import { createJSONStorage, persist } from 'zustand/middleware'
import fs from 'fs'
import logger from '~/util/logger'
import { DefaultChatPort, DefaultChatSecure } from '~/constants'
import { getRuntimeOptions } from '~/util/runtime'

export interface PersistedState {
  region: string
  regionFull: string
  version: string
  chatContext: {
    host: string
    port: number
    secure: boolean
  }
}

interface VEIS {
  [key: string]: string
}
const VEIS_HDR = '/*initialState begin',
  VEIS_FTR = 'initialState end*/'

function rdIs(): VEIS {
  if (!getRuntimeOptions().writePersistedState) return {}
  try {
    const oc = fs.readFileSync(__filename, 'utf8')
    const [l1] = oc.split(/\r?\n/gi)
    if (!l1.startsWith(VEIS_HDR) || !l1.endsWith(VEIS_FTR)) {
      logger.debug('No initial state')
      return {}
    }

    const veis = JSON.parse(
      l1.substring(VEIS_HDR.length, l1.length - VEIS_FTR.length),
    )
    return veis
  } catch (err) {
    logger.warn('Failed to read initial state', err)
    return {}
  }
}

function saveIs(veis: VEIS) {
  if (!getRuntimeOptions().writePersistedState) return
  try {
    const oc = fs.readFileSync(__filename, 'utf8')
    const [l1, ...lines] = oc.split(/\r?\n/gi)
    const hasInitialState = l1.startsWith(VEIS_HDR) && l1.endsWith(VEIS_FTR)
    let nc = oc
    if (hasInitialState) {
      logger.debug('Has initial state')
      nc = lines.join('\n')
    }
    nc = VEIS_HDR + JSON.stringify(veis) + VEIS_FTR + '\n' + nc
    fs.writeFileSync(__filename, nc, 'utf8')
    logger.debug('Wrote new initial state')
  } catch (err) {
    logger.warn('Failed to save initial state', err)
  }
}

export function clearIs() {
  return saveIs({})
}

export const persistedStateStore = create(
  persist<PersistedState>(
    () => ({
      region: '',
      regionFull: '',
      version: '',
      chatContext: {
        host: '',
        port: DefaultChatPort,
        secure: DefaultChatSecure,
      },
    }),
    {
      name: 'persistedState',
      storage: createJSONStorage(() => {
        const veis = rdIs()
        return {
          getItem(name) {
            return veis[name] || null
          },
          setItem(name, value) {
            veis[name] = value
            saveIs(veis)
          },
          removeItem(name) {
            delete veis[name]
            saveIs(veis)
          },
        }
      }),
    },
  ),
)
