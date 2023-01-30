import { Switch } from '@headlessui/react'
import clsx from 'clsx'
import { useState } from 'react'
import usePreferences, { getPref, setPref } from '../../stores/usePreferences'

export interface SettingsSwitchPropTypes extends React.PropsWithChildren {
  name: string
  prefPath: string

  className?: string
  label?: string
  description?: string
}

export default function SettingsSwitch({
  className,
  name,
  prefPath,

  label,
  description,

  children,
}: SettingsSwitchPropTypes) {
  const value = usePreferences(getPref(prefPath))
  return (
    <Switch.Group
      as="div"
      className={clsx('flex items-center justify-between', className)}
    >
      <span className="flex flex-grow flex-col">
        {label && (
          <Switch.Label
            as="span"
            className="text-sm font-medium text-ctp-text select-none"
            passive
          >
            {label}
          </Switch.Label>
        )}

        {description && (
          <Switch.Description
            as="span"
            className="text-sm text-ctp-subtext0 select-none"
          >
            {description}
          </Switch.Description>
        )}
      </span>
      <Switch
        checked={value}
        onChange={setPref(prefPath)}
        className={clsx(
          'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-ctp-mauve focus:ring-offset-2 bg-ctp-crust',
          {
            'bg-ctp-mauve': value,
          }
        )}
      >
        <span
          className={clsx(
            'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out translate-x-0',
            {
              'translate-x-5': value,
            }
          )}
        />
      </Switch>
    </Switch.Group>
  )
}
