import { useEffect, useState } from 'react'
import create from 'zustand'
import { persist, devtools } from 'zustand/middleware'
import { Preferences } from '../types'

export type PreferencesStore = Preferences

const usePreferences = create(
  devtools(
    persist(
      (): Preferences => ({
        autoLockAgent: {
          enabled: false,
          options: {},
        },
        presence: {
          enabled: false,
          status: 0,

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
        uuid: crypto.randomUUID(),
      }),
      {
        name: 'valoreye__preferences',
      }
    )
  )
)

export function setPref(path: string) {
  return (value: any) => {
    usePreferences.setState(state => {
      let a: any = {},
        b: any = { ...state },
        spl = path.split('.'),
        i = 0

      for (const stop of spl) {
        let atParent = ++i === spl.length - 1
        let lastStop = spl[i]
        b = b[stop]
        if (atParent) {
          a[stop] = {
            ...b,
            [lastStop]: value,
          }
          break
        } else {
          a = a[stop] = {}
        }
      }

      return a
    })
  }
}

export function usePreferenceState<S>(
  path: string,
  itemKey: keyof S,
  itemArray: S[]
) {
  const [didSet, setDidSet] = useState(false)

  let x = useState<S>()
  let oldDispatch = x[1]

  let prefValue = getPreferenceValue(path)

  useEffect(() => {
    if (didSet) return
    if (!itemArray.length) return
    oldDispatch(itemArray.find(i => i[itemKey] === prefValue))
    setDidSet(true)
  }, [itemArray])

  const prefSetter = setPref(path)
  x[1] = function (value: React.SetStateAction<S | undefined>) {
    let nv: S = value as any
    if (typeof value !== 'undefined') {
      // @ts-ignore
      if (typeof value === 'function') nv = value(x[0])

      prefSetter(nv[itemKey])
    }
    return oldDispatch.call(this, nv)
  }
  return x
}

export function getPrefParent<T = any>(
  path: string
): (e: PreferencesStore) => T {
  return (e: PreferencesStore) => {
    let tmp = { ...e } as any
    let spl = path.split('.').slice(0, -1) // Parent of path

    for (const stop of spl) {
      tmp = tmp[stop]
    }
    return tmp as T
  }
}

export function getPref<T = any>(path: string): (e: PreferencesStore) => T {
  return (e: PreferencesStore) => {
    let tmp = { ...e } as any
    let spl = path.split('.')

    for (const stop of spl) {
      tmp = tmp[stop]
    }
    return tmp as T
  }
}

export function getPreferenceValue<T = any>(path: string): T {
  let tmp: any = usePreferences.getState(),
    spl = path.split('.')

  for (const stop of spl) {
    tmp = tmp[stop]
  }
  return tmp as T
}

export function serializePreferences(): string {
  return JSON.stringify(usePreferences.getState())
}

export default usePreferences
