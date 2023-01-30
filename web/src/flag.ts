import { useEffect, useState } from 'react'
import { sharedCache } from './sharedCache'
import useEphemeral from './stores/useEphemeral'
import { Flag } from './types'

export interface IFlags {
  flags: Flag[]
  en: (f: Flag) => boolean
  dis: (f: Flag) => boolean
}

export function useFlags(): IFlags {
  const [flags, setFlags] = useState<Flag[]>([])
  const reloadFlags = useEphemeral(e => e.reloadFlags)

  useEffect(() => {
    sharedCache
      .get('flags')
      .then(e => {
        if (e && Array.isArray(e)) setFlags(e)
        useEphemeral.setState(e => ({ ...e, reloadFlags: false }))
      })
      .catch(err => console.error('Error attempting to fetch flags', err))
  }, [reloadFlags])

  return {
    flags,
    en: (f: Flag) => flags.includes(f),
    dis: (f: Flag) => !flags.includes(f),
  }
}
