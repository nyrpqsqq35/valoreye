import { ChevronUpDownIcon, TrashIcon } from '@heroicons/react/24/outline'
import {
  ClipboardDocumentListIcon,
  HandThumbDownIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/solid'
import clsx from 'clsx'
import { useEffect, useState } from 'react'
import ReactTooltip from 'react-tooltip'
import Button from '../components/Button'
import Loading from '../components/Loading'
import Page from '../components/Page'
import SettingsSwitch from '../components/SettingsSwitch'
import UniversalSelect from '../components/UniversalSelect'
import { TooltipClass } from '../constants'
import { useFlags } from '../flag'
import { sharedCache } from '../sharedCache'
import usePreferences from '../stores/usePreferences'
import { ValorantTeamID, VAMap, VAAgent, Preferences, Flag } from '../types'

const Empty36x36 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAkCAQAAABLCVATAAAAI0lEQVR42u3MMQEAAAwCoNm/9Er4CQHIlUQkEolEIpFItBI9yC4AJXOIyJkAAAAASUVORK5CYII='

const TeamMap = {
  [ValorantTeamID.Blue]: 0,
  [ValorantTeamID.Red]: 1,
}

function _getAutoLock(
  options: Preferences['autoLockAgent']['options'],
  map: VAMap,
  team: ValorantTeamID,
  agents: VAAgent[]
): VAAgent | null {
  const om = options[map.uuid]
  if (!om) return null
  const selop = om[TeamMap[team]]
  if (!selop) return null
  return agents.find(i => i.uuid === selop.agent) || null
}

const getAutoLock = (
    map: VAMap,
    team: ValorantTeamID,
    agents: VAAgent[]
  ): VAAgent | null =>
    _getAutoLock(
      usePreferences(e => e.autoLockAgent.options),
      map,
      team,
      agents
    ),
  getAutoLockNonHook = (
    map: VAMap,
    team: ValorantTeamID,
    agents: VAAgent[]
  ): VAAgent | null =>
    _getAutoLock(
      usePreferences.getState().autoLockAgent.options,
      map,
      team,
      agents
    )

function setAutoLock(map: VAMap, team: ValorantTeamID, agent: VAAgent | null) {
  usePreferences.setState(pref => {
    let options = pref.autoLockAgent.options || {}
    if (!options[map.uuid]) options[map.uuid] = [null, null]

    const ti = TeamMap[team]

    const arr: (typeof options)[''] = options[map.uuid]

    if (agent) {
      arr[ti] = {
        map: map.uuid,
        assetPath: map.assetPath,
        mapUrl: map.mapUrl,
        agent: agent.uuid,
        team: team,
      }
    } else {
      arr[ti] = null
    }

    return {
      ...pref,
      autoLockAgent: {
        ...pref.autoLockAgent,
        options: {
          ...options,
          [map.uuid]: [...arr],
        },
      },
    }
  })
}

function useAutoLockSettings(
  map: VAMap,
  team: ValorantTeamID,
  agents: VAAgent[]
): [() => VAAgent | null, (e: VAAgent | null) => void] {
  return [
    getAutoLock.bind(null, map, team, agents),
    setAutoLock.bind(null, map, team),
  ]
}

interface SelectorPropTypes {
  map: VAMap
  team: ValorantTeamID
  agents: VAAgent[]
  maps: VAMap[]
  tooltipId: string
}

function AgentSelector({
  map,
  team,
  maps,
  agents,
  tooltipId,
}: SelectorPropTypes) {
  const [getSelected, setSelected] = useAutoLockSettings(map, team, agents)

  const selected = getSelected()

  const imgClassName = clsx(
    'w-9 h-9 select-none [-webkit-user-drag:none]',
    !selected && 'hidden'
  )

  return (
    <div className="flex flex-row items-center gap-2 px-2">
      {selected?.uuid === 'random' ? (
        <ArrowPathIcon className={imgClassName} />
      ) : (
        <img
          className={imgClassName}
          src={selected?.displayIcon || Empty36x36} // else when u change agent and the icon isnt cached in alrdy then u get a jarring move of the select box
          draggable={false}
        />
      )}
      <UniversalSelect<VAAgent>
        list={agents}
        itemKey={'uuid'}
        keys={['displayName']}
        valueKey={i => i.uuid}
        displayKey={i => i.displayName}
        imageKey={'displayIconSmall'}
        inputClassName="border border-ctp-mantle !bg-ctp-crust py-2 pl-3 pr-10 shadow-sm sm:text-sm !rounded-md text-ctp-text"
        selected={selected}
        setSelected={setSelected}
        selectorClassName="!text-ctp-mauve"
        imageClassName="rounded-none"
        showRemoveElement
        fallbackDisplay="Disabled"
      />
      <Button
        color="primary"
        size="icon"
        icon={ChevronUpDownIcon}
        data-tip={`Copy to all ${
          team === ValorantTeamID.Attackers ? 'attacker' : 'defender'
        } slots`}
        data-for={tooltipId}
        data-class={clsx(TooltipClass)}
        className="backdrop-blur-md bg-opacity-60 !focus:ring-0 !focus:border-none"
        onClick={_ => {
          const agAtk = getAutoLockNonHook(map, team, agents)
          for (const map of maps) {
            setAutoLock(map, team, agAtk)
          }
        }}
      ></Button>
    </div>
  )
}

interface MapRowPropTypes {
  map: VAMap
  maps: VAMap[]
  agents: VAAgent[]
}
function MapRow({ map, maps, agents }: MapRowPropTypes) {
  const tooltipId = `map_${map.uuid}_tooltip`
  return (
    <div className="grid grid-cols-3">
      <div
        style={{
          backgroundImage: `url(${map.listViewIcon})`,
        }}
        className="flex flex-row items-center justify-between bg-no-repeat bg-w-16 bg-cover w-96 h-20 rounded-l-lg"
      >
        <div className="flex flex-row ml-4 gap-2">
          <Button
            color="primary"
            size="icon"
            icon={ClipboardDocumentListIcon}
            data-tip={'Copy to all maps'}
            data-for={tooltipId}
            data-class={clsx(TooltipClass)}
            className="backdrop-blur-md bg-opacity-60 !focus:ring-0 !focus:border-none"
            onClick={_ => {
              const agAtk = getAutoLockNonHook(
                  map,
                  ValorantTeamID.Attackers,
                  agents
                ),
                agDef = getAutoLockNonHook(
                  map,
                  ValorantTeamID.Defenders,
                  agents
                )
              for (const map of maps) {
                setAutoLock(map, ValorantTeamID.Attackers, agAtk)
                setAutoLock(map, ValorantTeamID.Defenders, agDef)
              }
            }}
          ></Button>
          <Button
            color="rose"
            size="icon"
            icon={TrashIcon}
            data-tip={'Clear'}
            data-for={tooltipId}
            data-class={clsx(TooltipClass)}
            className="backdrop-blur-md bg-opacity-60 !focus:ring-0 !focus:border-none"
            onClick={_ => {
              setAutoLock(map, ValorantTeamID.Attackers, null)
              setAutoLock(map, ValorantTeamID.Defenders, null)
            }}
          ></Button>
        </div>
        <span className="font-em font-black text-5xl text-white bg-ctp-mauve/25 rounded-l-lg px-2 backdrop-blur-md select-none">
          {map.displayName.toUpperCase()}
        </span>
      </div>
      <AgentSelector
        map={map}
        maps={maps}
        agents={agents}
        team={ValorantTeamID.Attackers}
        tooltipId={tooltipId}
      />
      <AgentSelector
        map={map}
        maps={maps}
        agents={agents}
        team={ValorantTeamID.Defenders}
        tooltipId={tooltipId}
      />
      <ReactTooltip id={tooltipId} />
    </div>
  )
}

function AutoLockSettings({ className }: { className?: string }) {
  const [maps, setMaps] = useState<VAMap[]>([]),
    [agents, setAgents] = useState<VAAgent[]>([])
  useEffect(() => {
    sharedCache.get<VAMap[]>('maps').then(e => e && setMaps(e))
    sharedCache.get<VAAgent[]>('agents').then(
      e =>
        e &&
        setAgents([
          // Shh
          {
            uuid: 'random',
            displayName: 'Random',
            displayIconSmall: 'meow',
          } as VAAgent,
          ...e.filter(i => i.isPlayableCharacter),
        ])
    )
  }, [])

  if (!maps.length || !agents.length) return <Loading />
  return (
    <div className={clsx('flex flex-col gap-3', className)}>
      <div className="grid grid-cols-3 select-none">
        <div>
          <div className="w-full h-auto  p-2">
            <span className="uppercase tracking-wider font-semibold">Map</span>
          </div>
        </div>
        <div className="flex items-center w-full h-auto bg-val-red/50 px-2">
          <span className="uppercase tracking-wider font-semibold">
            Attacking
          </span>
        </div>
        <div className="flex items-center w-full h-auto bg-val-blue/50 px-2">
          <span className="uppercase tracking-wider font-semibold">
            Defending
          </span>
        </div>
      </div>
      {maps
        .filter(i => i.callouts) // Hide the range
        .map(map => {
          return <MapRow key={map.uuid} map={map} maps={maps} agents={agents} />
        })}
    </div>
  )
}

export default function PageMisc() {
  const flags = useFlags()
  const autoLockFlag = flags.en(Flag.ENABLE_AUTOLOCK)
  const autoLockEnabled = usePreferences(e => e.autoLockAgent.enabled),
    showAutoLock = autoLockFlag && autoLockEnabled

  return (
    <Page>
      <Page.Header title={'Misc'} />
      <Page.Content>
        {!autoLockFlag && (
          <p>
            <HandThumbDownIcon className="w-12 h-12 animate-bounce" />
          </p>
        )}
        {autoLockFlag && (
          <SettingsSwitch
            name="autoLockAgent.enabled"
            prefPath="autoLockAgent.enabled"
            label="Auto-lock agent"
            description="Automatically select agent upon connection to pregame server"
          />
        )}
        {showAutoLock && <AutoLockSettings className="mt-8" />}
      </Page.Content>
    </Page>
  )
}
