import {
  EyeSlashIcon,
  GlobeAltIcon,
  BoltIcon,
  MapIcon,
  UserPlusIcon,
} from '@heroicons/react/24/solid'
import clsx from 'clsx'
import { useEffect } from 'react'
import ReactTooltip from 'react-tooltip'
import ws from '../api'
import Button from '../components/Button'

import Page from '../components/Page'
import { SubItem } from '../components/Page/Header'
import { TooltipClass } from '../constants'
import { useFlags } from '../flag'
import { RankTable } from '../ranks'
import useGameData from '../stores/useGameData'
import {
  Flag,
  GameDataPlayer,
  OpCode,
  ValorantLoopState,
  ValorantTeamID,
} from '../types'
export interface PlayerPropTypes {
  player: GameDataPlayer
}

const PossibleColors = [
  'bg-ctp-red',
  'bg-ctp-sapphire',
  'bg-ctp-green',
  'bg-ctp-peach',
  'bg-ctp-pink',
]

const getPartyColor = (partyId: string, partySize: number): string => {
  let { parties } = useGameData.getState()
  if (partySize <= 1) return ''
  if (parties.colorMap[partyId]) return parties.colorMap[partyId]
  let colors = PossibleColors.filter(
    i => !Object.values(parties.colorMap).includes(i)
  )
  let color = colors[0]
  parties.colorMap[partyId] = color

  return color
}

const Transparent256x256 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAQAAAD2e2DtAAABu0lEQVR42u3SQREAAAzCsOHf9F6oIJXQS07TxQIABIAAEAACQAAIAAEgAASAABAAAkAACAABIAAEgAAQAAJAAAgAASAABIAAEAACQAAIAAEgAASAABAAAkAACAABIAAEgAAQAAJAAAgAASAABIAAEAACQAAIAAEgAASAABAAAkAACAABIAAEgAAQAAJAAAgAASAABIAAEAACQAAIAAEgAASAABAAAgAACwAQAAJAAAgAASAABIAAEAACQAAIAAEgAASAABAAAkAACAABIAAEgAAQAAJAAAgAASAABIAAEAACQAAIAAEgAASAABAAAkAACAABIAAEgAAQAAJAAAgAASAABIAAEAACQAAIAAEgAASAABAAAkAACAABIAAEgAAQAAJAAAgAASAABIAAEAACQAAIAAAsAEAACAABIAAEgAAQAAJAAAgAASAABIAAEAACQAAIAAEgAASAABAAAkAACAABIAAEgAAQAAJAAAgAASAABIAAEAACQAAIAAEgAASAABAAAkAACAABIAAEgAAQAAJAAAgAASAABIAAEAACQAAIAAEgAASAABAAAkAACAABIAAEgAAQAAJAAKg9kK0BATSHu+YAAAAASUVORK5CYII='

const StreamerModeLevelBackground =
  'https://media.valorant-api.com/levelborders/ebc736cd-4b6a-137b-e2b0-1486e31312c9/levelnumberappearance.png'

function Player({ player }: PlayerPropTypes) {
  const { localPlayer } = useGameData(state => ({
    localPlayer: state.localPlayer,
  }))
  const partyColor = getPartyColor(player.partyId, player.partySize)

  const flags = useFlags()

  const isLocalPlayer = player.id === localPlayer

  const gStreamerMode =
      player.streamerMode && flags.dis(Flag.NAMES_VISIBLE) && !isLocalPlayer,
    gHideAccountLevel =
      player.hideAccountLevel &&
      flags.dis(Flag.LEVELS_VISIBLE) &&
      !isLocalPlayer
  ;(window as any).player = player
  useEffect(() => {
    ReactTooltip.rebuild()
  }, [])
  return (
    <li key={player.id} className="py-4 flex items-center">
      <div
        className={clsx('flex flex-row w-full h-12 px-2', {
          grayscale: player.disconnected,
        })}
      >
        <div className="flex items-center flex-grow">
          <img
            className={clsx('h-10 w-10 rounded-full select-none', {
              'grayscale animate-pulse':
                player.pregame?.selectionState === 'selected',
            })}
            draggable={false}
            src={player.agent?.displayIcon || Transparent256x256}
            alt={player.agent?.displayName}
          />

          <span
            className={clsx(
              'w-4 h-4 rounded-full ml-4 mr-1',
              partyColor || 'bg-transparent'
            )}
          />
          <div
            className="flex justify-center items-center"
            style={{
              width: '76px',
              height: '32px',
              backgroundImage: `url(${
                gHideAccountLevel
                  ? StreamerModeLevelBackground
                  : player.levelBorder?.levelNumberAppearance
              })`,
            }}
          >
            <span
              className={clsx('text-xs text-white select-none', {
                'text-ctp-sky': player.hideAccountLevel,
              })}
            >
              {gHideAccountLevel ? (
                <EyeSlashIcon className="w-4 h-4 text-ctp-sky" />
              ) : (
                player.accountLevel
              )}
            </span>
          </div>

          <div className={clsx('w-84', { 'ml-3': player.agent })}>
            <p
              className={clsx(
                'text-sm font-medium text-ctp-text',
                gStreamerMode && 'text-ctp-sky animate-pulse',
                isLocalPlayer && 'text-ctp-yellow'
              )}
            >
              {
                gStreamerMode
                  ? player.agent // gStreamerMode is true
                    ? player.agent.displayName // use agent name
                    : 'Player' // use generic name, no agent locked yet
                  : player.playerName // Show player name if gStreamerMode is false
              }
              <span className="font-normal text-ctp-subtext0 hover:text-ctp-text transition">
                {!gStreamerMode && '#' + player.tagLine}
              </span>
            </p>
            <p className="text-sml text-ctp-subtext0">
              {player.playerTitle && player.playerTitle.titleText}
            </p>
          </div>
          <div className="flex-grow" />
          {player.streamerMode && (
            <EyeSlashIcon
              className="w-6 h-6 mr-4 text-ctp-mauve hover:text-inherit transition"
              data-tip={[
                player.streamerMode && 'Streamer mode',
                player.hideAccountLevel && 'Account level',
              ]
                .filter(a => a)
                .join(', ')}
              data-for={`player_${player.id}_tooltip`}
              data-class={TooltipClass}
            />
          )}
        </div>
        <div className="flex items-center">
          {flags.en(Flag.PARTY_INVITE) && (
            <Button
              color="primary"
              size="icon"
              icon={UserPlusIcon}
              data-tip={`Invite ${player.playerName}#${player.tagLine} to party`}
              data-for={`player_${player.id}_tooltip`}
              data-class={clsx(TooltipClass)}
              className="backdrop-blur-md bg-opacity-60 !focus:ring-0 !focus:border-none mr-4"
              onClick={_ => {
                ws.send(OpCode.INVITE_PLAYER, [
                  player.playerName,
                  player.tagLine,
                ])
              }}
            ></Button>
          )}
          <img
            className="h-10 w-10 select-none"
            draggable={false}
            src={player.rank.smallIcon}
            alt={player.rank.rankName}
            data-tip={
              player.rank.rankName +
              (player.rank.leaderboard > 0
                ? ' #' + player.rank.leaderboard
                : '') +
              (player.rank.rr ? ' (' + player.rank.rr.toString() + ' RR)' : '')
            }
            data-for={`player_${player.id}_tooltip`}
            data-class={clsx(TooltipClass, {
              [RankTable[player.rank.rankName]]: true,
            })}
          />
          <img
            className="h-10 w-10 ml-4 select-none"
            draggable={false}
            src={player.rank.peakSmallIcon}
            alt={player.rank.peakRankName}
            data-tip={
              player.rank.peakRankName + ' in ' + player.rank.peakSeasonAct
            }
            data-for={`player_${player.id}_tooltip`}
            data-class={clsx(TooltipClass, {
              [RankTable[player.rank.peakRankName!]]: true,
            })}
          />
        </div>
      </div>
      <ReactTooltip id={`player_${player.id}_tooltip`} />
    </li>
  )
}

const LSM: Record<ValorantLoopState, string> = {
    [ValorantLoopState.Menus]: 'Menus',
    [ValorantLoopState.Pregame]: 'Agent Select',
    [ValorantLoopState.InGame]: 'In Game',
    [ValorantLoopState.Invalid]: 'Invalid',
  },
  QIM: Record<string, string> = {
    unrated: 'Unrated',
    swiftplay: 'Swiftplay',
    competitive: 'Competitive',
    spikerush: 'Spike Rush',
    deathmatch: 'Deathmatch',
    onefa: 'Replication',
    ggteam: 'Escalation',
  }

const getLoopState = (ls: ValorantLoopState) => LSM[ls] || ls,
  getQueueId = (qid: string) => (!qid ? 'Custom' : QIM[qid] || qid)

export default function PageGame() {
  const { players, server, loopState, map, queueId } = useGameData(state => ({
    players: state.players,
    server: state.server,
    loopState: state.loopState,
    map: state.map,
    queueId: state.queueId,
  }))

  const redTeam = players.filter(p => p.teamId === ValorantTeamID.Red)
  const blueTeam = players.filter(p => p.teamId === ValorantTeamID.Blue)

  const subitems: SubItem[] = [
    {
      icon: BoltIcon,
      key: 'loopState',
      value: getLoopState(loopState),
    },
    {
      icon: GlobeAltIcon,
      key: 'queueId',
      value: getQueueId(queueId),
    },
  ]

  if (loopState !== ValorantLoopState.Menus) {
    subitems.push(
      {
        icon: GlobeAltIcon,
        key: 'location',
        value: server,
      },
      {
        icon: MapIcon,
        key: 'map',
        value: map?.displayName,
      }
    )
  }
  useEffect(() => {
    ReactTooltip.rebuild()
  }, [])
  const flags = useFlags()
  return (
    <Page>
      <Page.Header
        title={'Game'}
        subitems={subitems}
        image={map?.listViewIcon}
      />
      <Page.Content>
        <div className="px-4 py-6 sm:px-0">
          <div className="lg:grid lg:grid-cols-2 lg:gap-4">
            <div>
              <div className="w-full h-auto bg-val-red/50 p-2 flex content-center justify-between">
                <span className="uppercase tracking-wider font-semibold select-none">
                  Attacking
                </span>
                {flags.en(Flag.PARTY_INVITE) && (
                  <Button
                    color="primary"
                    size="icon"
                    icon={UserPlusIcon}
                    data-tip={`Invite all Attackers to party`}
                    data-for="gametip"
                    data-class={clsx(TooltipClass)}
                    className="backdrop-blur-md bg-opacity-60 !focus:ring-0 !focus:border-none"
                    onClick={_ => {
                      for (const p of redTeam) {
                        ws.send(OpCode.INVITE_PLAYER, [p.playerName, p.tagLine])
                      }
                    }}
                  ></Button>
                )}
              </div>
              <ul role="list" className="divide-y divide-ctp-surface1">
                {redTeam.map(p => (
                  <Player player={p} />
                ))}
              </ul>
            </div>
            <div>
              <div className="w-full h-auto bg-val-blue/50 p-2 flex content-center justify-between">
                <span className="uppercase tracking-wider font-semibold select-none">
                  Defending
                </span>
                {flags.en(Flag.PARTY_INVITE) && (
                  <Button
                    color="primary"
                    size="icon"
                    icon={UserPlusIcon}
                    data-tip={`Invite all Defenders to party`}
                    data-for="gametip"
                    data-class={clsx(TooltipClass)}
                    className="backdrop-blur-md bg-opacity-60 !focus:ring-0 !focus:border-none"
                    onClick={_ => {
                      for (const p of blueTeam) {
                        ws.send(OpCode.INVITE_PLAYER, [p.playerName, p.tagLine])
                      }
                    }}
                  ></Button>
                )}
              </div>
              <ul role="list" className="divide-y divide-ctp-surface1">
                {blueTeam.map(p => (
                  <Player player={p} />
                ))}
              </ul>
            </div>
          </div>
        </div>
        <ReactTooltip id={'gametip'} />
        {BUILD_META.env === 'development' && (
          <div className="flex flex-row gap-4 float-right">
            {loopState === ValorantLoopState.InGame && (
              <Button
                size="xs"
                color="rose"
                secondary
                onClick={_ => ws.send(OpCode.DISASSOCIATE_COREGAME, {})}
              >
                Disassociate coregame
              </Button>
            )}

            {loopState === ValorantLoopState.Pregame && (
              <Button
                size="xs"
                color="rose"
                onClick={_ => ws.send(OpCode.QUIT_PREGAME, {})}
              >
                Quit pregame
              </Button>
            )}
          </div>
        )}
      </Page.Content>
    </Page>
  )
}
