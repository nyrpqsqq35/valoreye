import Page from '../components/Page'
import Select from '../components/Select'
import SettingsSwitch from '../components/SettingsSwitch'
import { PresenceStates } from '../constants'
import usePreferences, {
  getPref,
  getPreferenceValue,
  setPref,
  usePreferenceState,
} from '../stores/usePreferences'

import style from './Presence.module.scss'
import clsx from 'clsx'
import { sharedCache } from '../sharedCache'
import React, { useEffect, useState } from 'react'
import {
  VALevelBorder,
  VAPlayerTitle,
  VACompetitiveTier,
  VARealCompetitiveTier,
  Flag,
  VAPlayerCard,
} from '../types'
import { useFlags } from '../flag'
import TextField from '../components/TextField'
import useEphemeral, { HoverState } from '../stores/useEphemeral'
import UniversalSelect, { IBadge } from '../components/UniversalSelect'
import Loading from '../components/Loading'
;(window as any).sharedCache = sharedCache

// all of this should be rewrote

const aw = (fn: Function) => () => {
  fn()
}

type VALB = Omit<VALevelBorder, 'startingLevel'> & {
  startingLevel: string
}

enum PlayerStatus {
  Available = 'available',
  Away = 'away',
  InGame = 'inGame',
  Offline = 'offline',
}

interface PresenceEditorPropTypes {
  status?: PlayerStatus
  accountLevel?: number
  leaderboardPos?: number
}

function PresenceEditor({
  status = PlayerStatus.Offline,
  accountLevel = 0,
  leaderboardPos = 0,
}: PresenceEditorPropTypes) {
  const [playerTitles, setPlayerTitles] = useState<VAPlayerTitle[]>([]),
    [levelBorders, setLevelBorders] = useState<VALB[]>([]),
    [compTiers, setCompTiers] = useState<VARealCompetitiveTier[]>([]),
    hoverState = useEphemeral(e => e.presence.hoverState),
    presence = usePreferences(e => e.presence),
    [selectedTitle, setSelectedTitle] = usePreferenceState<VAPlayerTitle>(
      'presence.playerTitle',
      'uuid',
      playerTitles
    ),
    [selectedBorder, setSelectedLevelBorder] = usePreferenceState<VALB>(
      'presence.levelBorder',
      'uuid',
      levelBorders
    ),
    [selectedTier, setSelectedTier] = usePreferenceState<VARealCompetitiveTier>(
      'presence.tier',
      'tier',
      compTiers
    )

  useEffect(
    aw(async () => {
      const titles =
          (await sharedCache.get<VAPlayerTitle[]>('playerTitles')) || [],
        borders_ =
          (await sharedCache.get<VALevelBorder[]>('levelBorders')) || [],
        tiers_ =
          (await sharedCache.get<VACompetitiveTier[]>('competitiveTiers')) || []

      const newBorders = borders_.map(i => {
        return { ...i, startingLevel: i.startingLevel.toString() }
      }) as VALB[]

      setPlayerTitles(titles || [])
      setLevelBorders(newBorders || [])
      setCompTiers(tiers_[tiers_.length - 1].tiers)
    }),
    []
  )

  if (!playerTitles.length) return <Loading />
  const statusClass = style[status],
    statusMap = {
      [PlayerStatus.Available]: 'Available',
      [PlayerStatus.Away]: 'Away',
      // Agent Select ({queueId})
      // In Game ({queueId})
      // {queueId}\u00A0\u00A0{teamScore}-{enemyScore}
      [PlayerStatus.InGame]: `${
        presence.spoofQueueId ? presence.queueId : 'Unrated'
      }\u00A0\u00A00 - 5`,
      [PlayerStatus.Offline]: 'Offline',
    }

  return (
    <div>
      <div className={style.presenceContainer}>
        <div className={clsx(style.playerHeader, statusClass)}>
          <div className={style.playerAndTitle}>
            <div className={style.ntContainer}>
              <span className={style.playerName}>name</span>
              <span className={style.playerTag}>#tag</span>
            </div>
            <UniversalSelect<VAPlayerTitle>
              list={playerTitles}
              itemKey={'uuid'}
              keys={['titleText']}
              valueKey={i => i.uuid}
              displayKey={i => i.titleText || '\u00A0'}
              defaultValue={'5c3e2030-4d8a-a242-04b1-ff872557ebfd'}
              className={style.playerTitleContainer}
              inputClassName={style.playerTitle}
              selected={selectedTitle}
              setSelected={setSelectedTitle}
              highlight={hoverState === HoverState.PlayerTitle}
              border
              getBadges={i => {
                let badges: IBadge[] = []
                if (i.isHiddenIfNotOwned)
                  badges.push({
                    name: 'Hidden',
                    className: 'bg-red-100 text-red-800',
                  })
                return badges
              }}
            />
            {/* <span className={style.playerTitle}>title</span> */}
          </div>
          <div className={style.cardContainer}>
            <div className={style.cardLevel}>
              {/* <div
                className={style.levelBackground}
                style={{
                  backgroundImage: `url(https://media.valorant-api.com/levelborders/5d0d6c6c-4f0a-dc65-e506-b786cc27dbe1/levelnumberappearance.png)`,
                }}
              >
                <span className={style.levelText}>111</span>
              </div> */}
              <UniversalSelect<VALB>
                list={levelBorders}
                itemKey="uuid"
                keys="startingLevel"
                valueKey="uuid"
                displayKey="startingLevel"
                defaultValue={'ebc736cd-4b6a-137b-e2b0-1486e31312c9'}
                className={style.levelBackground}
                divStyles={v => {
                  if (!v) return {}
                  return {
                    backgroundImage: `url(${v.levelNumberAppearance})`,
                  }
                }}
                inputClassName={style.levelText}
                selected={selectedBorder}
                setSelected={setSelectedLevelBorder}
                realDisplayKey={i =>
                  presence.spoofLevel
                    ? accountLevel.toString()
                    : i.startingLevel.toString()
                }
                highlight={[
                  HoverState.PlayerLevel,
                  HoverState.LevelBorder,
                ].includes(hoverState)}
                border
              />
              <img
                className={style.playerCard}
                src={`https://media.valorant-api.com/playercards/${
                  presence.spoofPlayerCard
                    ? presence.playerCard
                    : '9fb348bc-41a0-91ad-8a3e-818035c4e561'
                }/smallart.png`}
                draggable={false}
              />
              <img
                className={style.levelBorder}
                src={
                  selectedBorder?.smallPlayerCardAppearance ||
                  'https://media.valorant-api.com/levelborders/ebc736cd-4b6a-137b-e2b0-1486e31312c9/smallplayercardappearance.png'
                }
                draggable={false}
              />
            </div>
          </div>
        </div>
        <div className={clsx(style.statusBar, statusClass)}>
          <span className={style.statusText}>{statusMap[status]}</span>
        </div>
        <div className={clsx(style.rankBanner, statusClass)}>
          <img
            className={clsx(
              style.rankImage,
              !selectedTier?.smallIcon && 'opacity-0'
            )}
            src={
              selectedTier?.smallIcon ||
              'https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/0/smallicon.png'
            }
            draggable={false}
          />

          <div className={style.rankTextContainer}>
            <UniversalSelect<VARealCompetitiveTier>
              list={compTiers}
              itemKey="tier"
              keys="tierName"
              valueKey="tier"
              displayKey={i => i.tierName}
              defaultValue={0}
              inputStyles={v => {
                if (!v) return {}
                return {
                  color: `#${v.color}`,
                }
              }}
              inputClassName={style.rankText}
              selected={selectedTier}
              setSelected={setSelectedTier}
              optionClassName="capitalize"
              post={
                presence.spoofLBPos && leaderboardPos
                  ? ' #' + leaderboardPos.toLocaleString()
                  : undefined
              }
              highlight={[
                HoverState.CompetitiveRank,
                HoverState.LeaderboardPos,
              ].includes(hoverState)}
              border
            >
              <span className={style.rankLabel}>Rank</span>
            </UniversalSelect>
            {/* <span className={style.rankText}>rank #1,234</span> */}
          </div>
        </div>
      </div>
    </div>
  )
}

const PresenceStates_ = [
  { id: PlayerStatus.Available, title: 'Available' },
  { id: PlayerStatus.InGame, title: 'In Game' },
  { id: PlayerStatus.Away, title: 'Away' },
  { id: PlayerStatus.Offline, title: 'Offline' },
]

function StatusPreviewPane({
  status,
  setStatus,
}: {
  status: PlayerStatus
  setStatus: React.Dispatch<React.SetStateAction<PlayerStatus>>
}) {
  return (
    <div>
      <label className="text-sm font-medium text-ctp-text">Preview</label>
      <p className="text-sm text-ctp-subtext0">
        Change how the <strong>preview</strong> hovercard is displayed on this
        page
      </p>
      <fieldset className="mt-4">
        <legend className="sr-only">Notification method</legend>
        <div className="space-y-4">
          {PresenceStates_.map(i => (
            <div key={i.id} className="flex items-center">
              <input
                id={i.id}
                name="presence-preview-state"
                type="radio"
                defaultChecked={i.id === status}
                className="h-4 w-4 bg-ctp-crust border-ctp-mantle text-ctp-mauve focus:ring-ctp-mauve"
                onChange={e => {
                  if (e.target.checked) setStatus(i.id)
                }}
              />
              <label
                htmlFor={i.id}
                className="ml-3 block text-sm font-medium text-ctp-text0"
              >
                {i.title}
              </label>
            </div>
          ))}
        </div>
      </fieldset>
    </div>
  )
}

function CheckboxRow({
  label,
  prefPath,
  id = prefPath,
  name = prefPath,
  hoverState,
}: {
  label: string
  prefPath: string
  id?: string
  name?: string
  hoverState: HoverState
}) {
  const { setHoverState, clearHoverState } = useEphemeral(e => ({
    setHoverState: e.presence.setHoverState,
    clearHoverState: e.presence.clearHoverState,
  }))
  const value = usePreferences(getPref(prefPath))
  return (
    <div
      className="relative flex items-start"
      onMouseEnter={e => setHoverState(hoverState)}
      onMouseLeave={e => clearHoverState(hoverState)}
    >
      <div className="flex h-5 items-center">
        <input
          id={id}
          name={name}
          type="checkbox"
          checked={value}
          className="h-4 w-4 rounded bg-ctp-crust border-ctp-mantle text-ctp-mauve focus:ring-ctp-mauve"
          onChange={e => {
            setPref(prefPath)(e.target.checked)
          }}
        />
      </div>
      <label
        htmlFor={id}
        className="ml-3 block text-sm font-medium text-ctp-text0"
      >
        {label}
      </label>
    </div>
  )
}

function Settings() {
  return (
    <fieldset className="space-y-5">
      <legend className="sr-only">Notifications</legend>
      <CheckboxRow
        label="Spoof player title"
        prefPath="presence.spoofPlayerTitle"
        hoverState={HoverState.PlayerTitle}
      />
      <CheckboxRow
        label="Spoof level border"
        prefPath="presence.spoofLevelBorder"
        hoverState={HoverState.LevelBorder}
      />
      <CheckboxRow
        label="Spoof player card"
        prefPath="presence.spoofPlayerCard"
        hoverState={HoverState.PlayerCard}
      />
      <CheckboxRow
        label="Spoof competitive rank"
        prefPath="presence.spoofTier"
        hoverState={HoverState.CompetitiveRank}
      />
      <CheckboxRow
        label="Spoof player level"
        prefPath="presence.spoofLevel"
        hoverState={HoverState.PlayerLevel}
      />
      <CheckboxRow
        label="Spoof leaderboard pos"
        prefPath="presence.spoofLBPos"
        hoverState={HoverState.LeaderboardPos}
      />
      <CheckboxRow
        label="Spoof queue ID"
        prefPath="presence.spoofQueueId"
        hoverState={HoverState.QueueID}
      />
    </fieldset>
  )
}

function PlayerCardEditor() {
  const [playerCards, setPlayerCards] = useState<VAPlayerCard[]>([])
  const [selectedCard, setSelectedCard] = usePreferenceState<VAPlayerCard>(
    'presence.playerCard',
    'uuid',
    playerCards
  )
  const hoverState = useEphemeral(e => e.presence.hoverState)
  useEffect(
    aw(async () => {
      const playerCards =
        (await sharedCache.get<VAPlayerCard[]>('playerCards')) || []
      setPlayerCards(playerCards || [])
    }),
    []
  )
  return (
    <div>
      <label className="text-sm font-medium text-ctp-text">
        Change playercard
      </label>
      <p className="text-sm text-ctp-subtext0">Spoof your playercard</p>
      <UniversalSelect<VAPlayerCard>
        list={playerCards}
        itemKey={'uuid'}
        keys={['displayName']}
        valueKey={i => i.uuid}
        displayKey={i => i.displayName || '\u00A0'}
        imageKey={'smallArt'}
        defaultValue={'9fb348bc-41a0-91ad-8a3e-818035c4e561'}
        inputClassName="border border-ctp-mantle !bg-ctp-crust py-2 pl-3 pr-10 shadow-sm sm:text-sm text-ctp-text"
        selected={selectedCard}
        setSelected={setSelectedCard}
        imageClassName="rounded-none"
        selectorClassName="!text-ctp-mauve"
        highlight={hoverState === HoverState.PlayerCard}
        getBadges={i => {
          let badges: IBadge[] = []
          if (i.isHiddenIfNotOwned)
            badges.push({
              name: 'Hidden',
              className: 'bg-red-100 text-red-800',
            })
          return badges
        }}
        border
      />
    </div>
  )
}

export default function PagePresence() {
  const presence = usePreferences(e => e.presence)
  const flags = useFlags()

  const [status, setStatus] = useState(PlayerStatus.Available)
  const hoverState = useEphemeral(e => e.presence.hoverState)

  const [accLevel, _setAccLevel] = useState(presence.level.toString())
  const [lbPos, _setLbPos] = useState(presence.lbPos.toString())
  const [queueId, _setQueueId] = useState(presence.queueId)
  const setAccLevel = (val: string) => {
    const setter = setPref('presence.level')
    if (!val) {
      setter(0)
    } else {
      setter(parseInt(val, 10))
    }
    _setAccLevel(val)
  }
  const setLbPos = (val: string) => {
    const setter = setPref('presence.lbPos')
    if (!val) {
      setter(0)
    } else {
      setter(parseInt(val, 10))
    }
    _setLbPos(val)
  }
  const setQueueId = (val: string) => {
    const setter = setPref('presence.queueId')
    if (!val) {
      setter('')
    } else {
      setter(val)
    }
    _setQueueId(val)
  }

  return (
    <Page>
      <Page.Header title={'Presence'} />
      <Page.Content>
        {flags.en(Flag.STATUS_SPOOFING) && (
          <>
            <SettingsSwitch
              name="presence.enabled"
              prefPath="presence.enabled"
              label="Status spoofing"
              description="Change your online status displayed to others in-game"
            />
            <Select
              prefPath="presence.status"
              items={PresenceStates}
              defaultValue={getPreferenceValue('presence.status')}
            />
          </>
        )}

        {flags.en(Flag.PRESENCE_SPOOFING) && (
          <>
            <SettingsSwitch
              className="mt-2"
              name="presence.spoofPresence"
              prefPath="presence.spoofPresence"
              label="Presence spoofing"
              description="Change your hovercard displayed to others in-game"
            />
            {presence.spoofPresence && (
              <>
                <Settings />
                <PlayerCardEditor />
                <div className="flex flex-col sm:flex-row mt-4">
                  <PresenceEditor
                    status={status}
                    accountLevel={parseInt(accLevel)}
                    leaderboardPos={parseInt(lbPos)}
                  />
                  <div className="ml-0 mt-2 sm:ml-4 sm:mt-0">
                    <StatusPreviewPane status={status} setStatus={setStatus} />
                    {presence.spoofLevel && (
                      <TextField
                        label="Account Level"
                        name="accountLevel"
                        type="number"
                        value={accLevel}
                        setValue={setAccLevel}
                        highlight={hoverState === HoverState.PlayerLevel}
                      />
                    )}
                    {presence.spoofLBPos && (
                      <TextField
                        label="Leaderboard #"
                        name="leaderboardPos"
                        type="number"
                        value={lbPos}
                        setValue={setLbPos}
                        highlight={hoverState === HoverState.LeaderboardPos}
                      />
                    )}
                    {presence.spoofQueueId && (
                      <TextField
                        label="Queue ID"
                        name="queueId"
                        type="text"
                        value={queueId}
                        setValue={setQueueId}
                        highlight={hoverState === HoverState.QueueID}
                      />
                    )}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </Page.Content>
    </Page>
  )
}
