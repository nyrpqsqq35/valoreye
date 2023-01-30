import { ValorantPlayerSettings } from 'shared'
import { persist } from 'zustand/middleware'
import create from 'zustand'
import { createId } from '@paralleldrive/cuid2'

interface VPrefPreset {
  id: string
  name: string
  accountName: string
  lastSaved: Date
  data: ValorantPlayerSettings
}

interface VPrefStore {
  current?: ValorantPlayerSettings
  presets: VPrefPreset[]
}

const useVPrefs = create(
  persist<VPrefStore>(
    () => ({
      current: undefined,
      presets: [],
    }),
    {
      name: 'valoreye__vprefs',
    }
  )
)

/**
 * @returns preset id for da redirect wallah
 */
export function addPreset(
  name: string,
  accountName: string,
  data: ValorantPlayerSettings
): string {
  let preset = {
    id: createId(),
    name,
    accountName,
    lastSaved: new Date(),
    data,
  }
  useVPrefs.setState(e => ({
    ...e,
    presets: [...e.presets, preset],
  }))
  return preset.id
}

export function removePreset(id: string) {
  useVPrefs.setState(e => {
    let presets = e.presets.filter(i => i.id !== id)
    return {
      ...e,
      presets,
    }
  })
}

export function updatePreset(id: string, data: ValorantPlayerSettings) {
  useVPrefs.setState(e => {
    let presets = e.presets
    let p = presets.find(i => i.id === id)
    if (p) {
      p.data = { ...data }
      p.lastSaved = new Date()
    }
    return {
      ...e,
      presets,
    }
  })
}

export function renamePreset(id: string, name: string) {
  useVPrefs.setState(e => {
    let presets = e.presets
    let p = presets.find(i => i.id === id)
    if (p) {
      p.name = name
      p.lastSaved = new Date()
    }
    return {
      ...e,
      presets,
    }
  })
}

export default useVPrefs
