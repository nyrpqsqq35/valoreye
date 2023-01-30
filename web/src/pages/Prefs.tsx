import Page from '../components/Page'
import { WrenchIcon, CogIcon } from '@heroicons/react/20/solid'
import clsx from 'clsx'
import {
  Link,
  useLocation,
  useMatch,
  useNavigate,
  useParams,
} from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { OpCode, ValorantPlayerSetting, ValorantPlayerSettings } from 'shared'
import { RadioGroup } from '@headlessui/react'
import { TooltipClass } from '../constants'
import ReactTooltip from 'react-tooltip'
import useVPrefs, {
  addPreset,
  renamePreset,
  updatePreset,
} from '../stores/useVPrefs'
import Button from '../components/Button'
import {
  CheckIcon,
  PlusIcon,
  PencilIcon,
  XMarkIcon,
  CloudArrowUpIcon,
  CalendarIcon,
  UsersIcon,
  MapPinIcon,
} from '@heroicons/react/24/solid'
import useGameData from '../stores/useGameData'
import TextField from '../components/TextField'
import ws from '../api'

interface Tab {
  key: string
  name: string
  to: string
  icon: React.ElementType
  current: boolean
}

const tabs: Tab[] = [
  {
    key: 'current',
    name: 'Current',
    to: '/prefs/current',
    icon: CogIcon,
    current: false,
  },
  {
    key: 'presets',
    name: 'Presets',
    to: '/prefs/presets',
    icon: WrenchIcon,
    current: true,
  },
]

interface EditState {
  name: string
  oldValue: string | number | boolean
  newValue: string | number | boolean
}

export interface PreferenceEditorPropTypes extends React.PropsWithChildren {
  className?: string
  prefs: ValorantPlayerSettings
  presetId?: string
  pKey: 'boolSettings' | 'floatSettings' | 'intSettings' | 'stringSettings'
}

export function SegmentSelector({
  segment,
  setSegment,
}: {
  segment: Segment
  setSegment: (m: Segment) => any
}) {
  return (
    <RadioGroup value={segment} onChange={setSegment}>
      <RadioGroup.Label className="sr-only">
        {' '}
        Choose a preference section{' '}
      </RadioGroup.Label>
      <div className="isolate inline-flex rounded-md shadow-sm">
        {settingSegments.map((option, i) => (
          <RadioGroup.Option
            key={option.name}
            value={option}
            className={({ active, checked }) =>
              clsx(
                'inline-flex items-center justify-center px-4 py-2 border text-sm font-medium sm:flex-1 select-none',
                'cursor-pointer focus:outline-none focus:z-10',
                active ? 'ring-1 ring-indigo-500' : '',
                checked
                  ? 'bg-indigo-600 border-transparent text-ctp-text hover:bg-indigo-700'
                  : 'bg-ctp-crust border-slate-800 text-ctp-subtext0 hover:bg-ctp-mantle',
                ' items-center  ',
                {
                  'rounded-l-md': i === 0,
                  'rounded-r-md': i >= settingSegments.length - 1,
                }
              )
            }
          >
            <RadioGroup.Label as="span">{option.name}</RadioGroup.Label>
          </RadioGroup.Option>
        ))}
      </div>
    </RadioGroup>
  )
}

export function PreferenceEditor({
  className,
  children,
  prefs,
  presetId,
  pKey,
}: PreferenceEditorPropTypes) {
  const [editing, setEditing] = useState<EditState | null>(null)
  const settings = prefs[pKey]
  const canEdit = !!presetId
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => {
    ReactTooltip.rebuild()
    if (!editing) {
      ;(ref as any).current = null
    }
  }, [prefs, editing])

  useEffect(() => setEditing(null), [pKey])

  return (
    <>
      <div className="px-4 sm:px-0">
        <div className="mt-8 flex flex-col">
          <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="table-fixed min-w-full divide-y divide-ctp-crust">
                  <thead className="bg-ctp-crust">
                    <tr>
                      <th
                        scope="col"
                        className="w-112 py-3 pl-4 pr-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 select-none sm:pl-6"
                      >
                        Name
                      </th>
                      <th
                        scope="col"
                        className="w-80 px-3 py-3 text-left text-xs font-medium uppercase tracking-wide select-none text-gray-500"
                      >
                        Value
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wide select-none text-gray-500"
                      >
                        <span className="sr-only">Meta</span>
                      </th>
                      <th
                        scope="col"
                        className="relative py-3 pl-3 pr-4 sm:pr-6 select-none"
                      >
                        <span className="sr-only">Edit</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ctp-crust bg-ctp-mantle">
                    {settings.map(s => {
                      let editingThis =
                        editing && editing.name === s.settingEnum
                      return (
                        <tr key={s.settingEnum}>
                          <td className="whitespace-nowrap py-2 pl-4 pr-3 text-sm font-medium text-ctp-text sm:pl-6">
                            {s.settingEnum.split('::')[1]}
                          </td>
                          <td className="px-3 py-2 text-sm text-ctp-subtext0 max-w-xs truncate flex items-center">
                            {typeof s.value === 'boolean' ? (
                              <input
                                type="checkbox"
                                checked={
                                  editingThis
                                    ? (editing!.newValue as boolean)
                                    : s.value
                                }
                                className="h-4 w-4 rounded bg-ctp-crust border-ctp-mantle text-ctp-lavender outline-none disabled:cursor-not-allowed"
                                onChange={e => {
                                  console.log('ayyeee')
                                  setEditing({
                                    ...(editing as EditState),
                                    newValue: e.target.checked,
                                  })
                                }}
                                disabled={!editingThis}
                              />
                            ) : (
                              <input
                                type="text"
                                className="h-4 px-0 bg-transparent border-x-0 border-t-0 pb-3 outline-none tex-tsm text-ctp-subtext0 border-b-2 border-b-transparent focus:text-ctp-text focus:ring-0 focus:border-b-2 focus:border-b-ctp-mauve disabled:cursor-not-allowed"
                                value={
                                  editingThis
                                    ? editing!.newValue.toString()
                                    : s.value.toString()
                                }
                                disabled={!editingThis}
                                autoFocus={!!editingThis}
                                onChange={e => {
                                  setEditing({
                                    ...(editing as EditState),
                                    newValue: e.target.value,
                                  })
                                }}
                                ref={e => {
                                  if (editingThis) {
                                    ;(ref as any).current = e
                                    e?.focus()
                                  }
                                }}
                              />
                            )}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 text-sm text-ctp-subtext0"></td>
                          <td className="relative whitespace-nowrap py-2 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            {canEdit && (
                              <>
                                {!editing && (
                                  <a
                                    href="#"
                                    className="text-ctp-lavender hover:text-ctp-mauve select-none"
                                    onClick={e => {
                                      e.preventDefault()
                                      setEditing({
                                        name: s.settingEnum,
                                        oldValue: s.value,
                                        newValue: s.value,
                                      })
                                    }}
                                  >
                                    Edit
                                    <span className="sr-only">
                                      , {s.settingEnum}
                                    </span>
                                  </a>
                                )}
                                {editingThis && (
                                  <>
                                    {' '}
                                    <a
                                      href="#"
                                      className="text-ctp-maroon hover:text-ctp-red select-none mr-3"
                                      onClick={e => {
                                        e.preventDefault()
                                        setEditing(null)
                                      }}
                                    >
                                      Cancel
                                    </a>
                                    <a
                                      href="#"
                                      className="text-ctp-lavender hover:text-ctp-mauve select-none"
                                      onClick={e => {
                                        e.preventDefault()
                                        // (prefs[pKey] as ValorantPlayerSetting<any>[]).find(i=>i.settingEnum === s.settingEnum)
                                        switch (pKey) {
                                          case 'intSettings':
                                            {
                                              let v = parseInt(
                                                editing!.newValue.toString()
                                              )
                                              if (isNaN(v)) break
                                              s.value = v
                                            }
                                            break
                                          case 'floatSettings':
                                            {
                                              let v = parseFloat(
                                                editing!.newValue.toString()
                                              )
                                              if (isNaN(v)) break
                                              s.value = v
                                            }
                                            break
                                          case 'stringSettings':
                                          case 'boolSettings':
                                            s.value = editing!.newValue
                                            break
                                        }
                                        updatePreset(presetId, prefs)
                                        setEditing(null)
                                      }}
                                    >
                                      Save
                                    </a>
                                  </>
                                )}
                              </>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

interface Segment {
  key: 'boolSettings' | 'floatSettings' | 'intSettings' | 'stringSettings'
  name: string
}

const settingSegments: Segment[] = [
  { key: 'boolSettings', name: 'Bool' },
  { key: 'floatSettings', name: 'Float' },
  { key: 'intSettings', name: 'Int' },
  { key: 'stringSettings', name: 'String' },
]

function PrefsCurrent() {
  const navigate = useNavigate()
  const pName = useGameData(e => e.localPlayerName)
  const vPrefs = useVPrefs()
  const [segment, setSegment] = useState(settingSegments[0])
  if (!vPrefs.current) return <>prefs not loaded yet !!</>
  return (
    <>
      <div className="flex flex-row justify-between mt-7">
        <div>
          <Button
            icon={PlusIcon}
            onClick={e => {
              e.preventDefault()
              const id = addPreset('New Preset', pName, vPrefs.current!)
              navigate('/prefs/presets/' + id)
            }}
            className="px-4 py-2"
          >
            New Preset
          </Button>
        </div>
        <div>
          <SegmentSelector segment={segment} setSegment={setSegment} />
        </div>
      </div>
      <PreferenceEditor prefs={vPrefs.current} pKey={segment.key} />
    </>
  )
}

function PrefsPreset() {
  const presets = useVPrefs(e => e.presets)
  const params = useParams()
  const [editing, setEditing] = useState<string | null>(null)
  const [segment, setSegment] = useState(settingSegments[0])
  const [saving, setSaving] = useState(0)
  if (!params.id)
    return (
      <div className="overflow-hidden bg-ctp-crust shadow sm:rounded-md hover:ring-2 hover:ring-ctp-mauve">
        <ul role="list" className="divide-y divide-ctp-crust">
          {presets.map(preset => (
            <li key={preset.id}>
              <Link
                to={`/prefs/presets/${preset.id}`}
                className="block hover:bg-ctp-mantle"
              >
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <p className="truncate text-sm font-medium text-ctp-lavender">
                      {preset.name}
                    </p>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500">
                        <UsersIcon
                          className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400"
                          aria-hidden="true"
                        />
                        {preset.accountName}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                      <CalendarIcon
                        className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400"
                        aria-hidden="true"
                      />
                      <p>
                        Last updated on{' '}
                        <time dateTime={preset.lastSaved as unknown as string}>
                          {new Date(preset.lastSaved).toLocaleString()}
                        </time>
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    )

  const preset = presets.find(i => i.id === params.id)
  if (!preset) return <>Could not find that preset</>

  return (
    <>
      <div className="flex flex-row justify-between mt-5">
        <div>
          <h1 className="text-xl font-semibold flex flex-row items-center">
            {typeof editing !== 'string' ? (
              <>
                {preset.name}{' '}
                <a
                  href="#"
                  className="text-slate-400/40 hover:text-ctp-text transition-colors"
                  onClick={e => {
                    e.preventDefault()
                    setEditing(preset.name)
                  }}
                >
                  <PencilIcon className="ml-2 h-4 w-4" />
                </a>
              </>
            ) : (
              <>
                <TextField
                  className="!mt-0 border-slate-800"
                  name="preset_name"
                  value={editing}
                  setValue={setEditing}
                  autoFocus
                />
                <a
                  href="#"
                  className="text-ctp-teal hover:text-ctp-green transition-colors"
                  onClick={e => {
                    e.preventDefault()
                    renamePreset(preset.id, editing)
                    setEditing(null)
                  }}
                >
                  <CheckIcon className="ml-2 h-5 w-5" />
                </a>
                <a
                  href="#"
                  className="text-ctp-maroon hover:text-ctp-red transition-colors"
                  onClick={e => {
                    e.preventDefault()
                    setEditing(null)
                  }}
                >
                  <XMarkIcon className="ml-2 h-5 w-5" />
                </a>
              </>
            )}
          </h1>
          <span className="text-sm text-slate-400">
            From {preset.accountName}
          </span>
        </div>
        <div>
          <SegmentSelector segment={segment} setSegment={setSegment} />
          <Button
            icon={CloudArrowUpIcon}
            loading={saving > 0}
            onClick={e => {
              e.preventDefault()
              setSaving(1)
              ReactTooltip.rebuild()
              ws.send(OpCode.SET_VPREF, preset.data)
              setTimeout(() => {
                setSaving(2)
              }, Math.random() * 350 + 150)
              // navigate('/prefs/presets/' + id)
            }}
            className="px-4 py-2 mt-2 float-right"
            data-event="click"
          >
            {saving > 0
              ? saving === 1
                ? 'Applying...'
                : 'Applied! Restart your game!!'
              : 'Apply to VALORANT'}
          </Button>
        </div>
      </div>
      <PreferenceEditor
        prefs={preset.data}
        presetId={preset.id}
        pKey={segment.key}
      />
    </>
  )
}

export default function PagePrefs() {
  const location = useLocation(),
    navigate = useNavigate()

  const [activeTab, setTab] = useState<Tab>(
    tabs.find(
      i =>
        i.key ===
        (location.pathname.includes('current') ? 'current' : 'presets')
    )!
  )

  useEffect(() => {
    let current = location.pathname.includes('current')
    if (current && activeTab.key !== 'current') {
      setTab(tabs.find(i => i.key === 'current')!)
    } else if (!current && activeTab.key !== 'presets') {
      setTab(tabs.find(i => i.key === 'presets')!)
    }
  }, [location])

  return (
    <Page>
      <Page.Header title={'VALORANT Preferences'} />
      <Page.Content>
        <div className="mb-3">
          <div className="sm:hidden">
            <label htmlFor="tabs" className="sr-only">
              Select a tab
            </label>
            {/* Use an "onChange" listener to redirect the user to the selected tab URL. */}
            <select
              id="tabs"
              name="tabs"
              className="block w-full rounded-md bg-ctp-mantle border-slate-800 focus:border-ctp-lavender focus:ring-ctp-lavender"
              defaultValue={activeTab.key}
              onChange={e => {
                setTab(tabs.find(i => i.key === e.target.value)!)
                navigate(
                  e.target.value === 'current'
                    ? '/prefs/current'
                    : '/prefs/presets'
                )
              }}
            >
              {tabs.map(tab => (
                <option key={tab.key} value={tab.key}>
                  {tab.name}
                </option>
              ))}
            </select>
          </div>
          <div className="hidden sm:block">
            <div className="border-b border-ctp-crust">
              <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                {tabs.map(tab => {
                  const current = tab.key === activeTab.key
                  return (
                    <Link
                      key={tab.key}
                      to={tab.to}
                      onClick={e => {
                        setTab(tabs.find(i => i.key === tab.key)!)
                      }}
                      className={clsx(
                        current
                          ? 'border-ctp-lavender text-ctp-lavender'
                          : 'border-transparent text-slate-500 hover:text-slate-300 hover:border-slate-300',
                        'group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm select-none'
                      )}
                      aria-current={current ? 'page' : undefined}
                    >
                      <tab.icon
                        className={clsx(
                          current
                            ? 'text-ctp-lavender'
                            : 'text-slate-500 group-hover:text-slate-300',
                          '-ml-0.5 mr-2 h-5 w-5'
                        )}
                        aria-hidden="true"
                      />
                      <span>{tab.name}</span>
                    </Link>
                  )
                })}
              </nav>
            </div>
          </div>
        </div>
        <div>
          {activeTab.key === 'current' && <PrefsCurrent />}
          {activeTab.key === 'presets' && <PrefsPreset />}
        </div>
      </Page.Content>
    </Page>
  )
}
