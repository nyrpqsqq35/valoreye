import {
  agentsCache,
  levelBordersCache,
  mapsCache,
  playerCardsCache,
  playerTitlesCache,
} from './cache'
import { getPreferences } from './web/prefs'
import riot from './interaction/riot'
import {
  addPlayer,
  clearPlayers,
  getState,
  setCoregameId,
  setLocalPlayer,
  setLoopState,
  setMap,
  setPregameId,
  setQueueId,
  setServer,
  setServerByGamePod,
  subscribe,
  ValorantStore,
} from './store'
import {
  Flag,
  GameDataPlayer,
  OpCode,
  RiotPresences,
  VAAgent,
  ValorantCharacterSelectionState,
  ValorantLoopState,
  ValorantPlayer,
  ValorantPrivatePresence,
  ValorantTeamID,
} from './types'
import { publish } from './web/ws'

import listenHttpServer from './web/server'

import logger, { createLogger, setKillOut } from './util/logger'
import { printHeader } from '~/util/header'
import { flagDis, flagEn, getRuntimeOptions } from '~/util/runtime'
import { launchRC } from '~/presence/proc'
import { getTaskList } from '~/win'
import { listenChat } from '~/presence/chat'
import { randomItem } from './util/util'
import { clearIs, persistedStateStore } from './store/persistedState'
import { checkForUpdates } from './updater'

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function convertPlayer(
  player: ValorantPlayer,
  index: number,
  total: number,
  ourPrivatePresence: ValorantPrivatePresence
): Promise<GameDataPlayer> {
  const nsp = await riot.getNameByUUID(player.Subject)
  let presence: ValorantPrivatePresence | null = null
  try {
    presence = await riot.getPrivatePresence(player.Subject)
  } catch (err) {}
  if (
    player.PlayerIdentity.PreferredLevelBorderID ===
    '00000000-0000-0000-0000-000000000000'
  )
    player.PlayerIdentity.PreferredLevelBorderID =
      'ebc736cd-4b6a-137b-e2b0-1486e31312c9'
  const gdp: GameDataPlayer = {
    id: player.Subject,
    disconnected: presence == null,
    teamId: player.TeamID!,
    partyId: presence?.partyId || player.Subject,
    partySize: presence?.partySize || 1,

    playerName: nsp.GameName,
    tagLine: nsp.TagLine,

    rank: await riot.getRankByUUID(player.Subject),

    accountLevel: player.PlayerIdentity.AccountLevel,

    levelBorder: await levelBordersCache.get(
      player.PlayerIdentity.PreferredLevelBorderID
    ),
    playerCard: await playerCardsCache.get(player.PlayerIdentity.PlayerCardID),
    playerTitle: player.PlayerIdentity.PlayerTitleID
      ? await playerTitlesCache.get(player.PlayerIdentity.PlayerTitleID)
      : null,

    agent: player.CharacterID
      ? await agentsCache.get(player.CharacterID)
      : null,

    streamerMode: player.PlayerIdentity.Incognito,
    hideAccountLevel: player.PlayerIdentity.HideAccountLevel,

    seasonalBadgeInfo: player.SeasonalBadgeInfo,
  }

  if (player.CharacterSelectionState) {
    gdp.pregame = {
      selectionState: player.CharacterSelectionState,
    }
  }

  if (ourPrivatePresence.queueId === 'deathmatch') {
    gdp.teamId = index < total / 2 ? ValorantTeamID.Red : ValorantTeamID.Blue
  }

  return gdp
}

function ensureConsistency(
  state: ValorantStore,
  p: ValorantPrivatePresence
): Promise<ValorantStore> {
  return new Promise(async (resolve, reject) => {
    setLoopState(p.sessionLoopState)

    const bInMenus = p.sessionLoopState === ValorantLoopState.Menus

    if (bInMenus) {
      // No game in progress

      if (state.players.length) clearPlayers()
      setMap(null)
      setServer(null)

      setPregameId(null)
      setCoregameId(null)
      setQueueId(p.queueId)
    } else {
      if (!state.map) {
        let mapId = p.matchMap

        try {
          if (p.sessionLoopState === ValorantLoopState.Pregame) {
            logger.debug('Fetching pregame match for map')
            const pregameId = await riot.getPregameMatchId()
            const pregameMatch = await riot.getPregameMatch(pregameId)
            mapId = pregameMatch.MapID
          }
        } catch (err) {}
        if (mapId) setMap(await mapsCache.get(mapId))
      }
    }
    process.nextTick(() => {
      resolve(getState())
    })
  })
}

const TeamMap = {
  [ValorantTeamID.Defenders]: 0,
  [ValorantTeamID.Attackers]: 1,
}

function getAutoLockAgent(
  state: ValorantStore,
  teamId?: ValorantTeamID
): string | undefined {
  if (typeof teamId === 'undefined') return
  if (!state.map) return
  const alaOpt = getPreferences().autoLockAgent.options
  if (!alaOpt) return
  const alaMap = alaOpt[state.map.uuid]
  if (!alaMap) return

  return alaMap[TeamMap[teamId]]?.agent
}

const MISSING_MATCH_ID = 'MISSING_MATCH_ID'

async function handleMenus(
  state: ValorantStore,
  presence: ValorantPrivatePresence
) {}
async function handlePregame(
  state: ValorantStore,
  presence: ValorantPrivatePresence
) {
  try {
    let pregameId = state.pregameId
    if (!pregameId) throw new Error(MISSING_MATCH_ID)
    const match = await riot.getPregameMatch(pregameId)
    if (state.coregameId) setCoregameId(null)
    setQueueId(match.QueueID)
    const prefs = getPreferences()
    if (prefs.autoLockAgent.enabled && flagEn(Flag.ENABLE_AUTOLOCK)) {
      let player = match.AllyTeam.Players.find(
        (i) => i.Subject === riot.playerId
      )
      if (player) {
        if (
          player.CharacterSelectionState !==
          ValorantCharacterSelectionState.Locked
        ) {
          // Fuck
          const correctTeam = state.players.find(
            (i) => i.id === player?.Subject && i.teamId
          )?.teamId
          const foundAutoLockAgentId = getAutoLockAgent(state, correctTeam)
          logger.debug(
            'foundAutoLockAgentId =',
            foundAutoLockAgentId,
            player,
            state.map,
            pregameId
          )
          if (foundAutoLockAgentId) {
            process.nextTick(
              async (pregameId: string, foundAutoLockAgentId: string) => {
                // logger.log('State on lock', inspect(state, false, 100, true))

                // const autoLockAgent = AgentIds[prefs.autoLockAgent.agent!]!
                if (foundAutoLockAgentId === 'random') {
                  foundAutoLockAgentId = randomItem(
                    await riot.getUnlockedChars()
                  )
                }
                logger.log(
                  'Selecting character for map =',
                  state.map?.displayName,
                  'team =',
                  correctTeam
                )
                await riot.selectCharacter(pregameId, foundAutoLockAgentId)
                logger.log('Locking character')
                await riot.lockCharacter(pregameId, foundAutoLockAgentId)
              },
              pregameId,
              foundAutoLockAgentId
            )
          }
        }
      }
    }

    await riot.getNamesByUUIDs(match.AllyTeam.Players.map((i) => i.Subject))
    let index = 0
    for (const p of match.AllyTeam.Players) {
      let gdp = await convertPlayer(
        p,
        index,
        match.AllyTeam.Players.length,
        presence
      )
      gdp.teamId = match.AllyTeam.TeamID
      addPlayer(gdp)
      ++index
    }
    setServerByGamePod(match.GamePodID)
  } catch (err) {
    if (err.message === MISSING_MATCH_ID) {
      logger.info('Fetching pregame match id')
      setPregameId(await riot.getPregameMatchId())
    } else {
      logger.error('Failed to handle pregame state', err)
      setPregameId(null)
    }
  }
}
async function handleInGame(
  state: ValorantStore,
  presence: ValorantPrivatePresence
) {
  try {
    let coregameId = state.coregameId
    if (!coregameId) throw new Error(MISSING_MATCH_ID)

    const match = await riot.getCoregameMatch(coregameId)
    if (state.pregameId) setPregameId(null)
    await riot.getNamesByUUIDs(match.Players.map((i) => i.Subject))
    let index = 0
    for (const p of match.Players) {
      let gdp = await convertPlayer(p, index, match.Players.length, presence)
      addPlayer(gdp)
      ++index
    }
    setServerByGamePod(match.GamePodID)
  } catch (err) {
    if (err.message === MISSING_MATCH_ID) {
      logger.info('Fetching coregame match id')
      setCoregameId(await riot.getCoregameMatchId())
    } else {
      logger.error('Failed to handle ingame state', err)
      setCoregameId(null)
    }
  }
}

async function handleStateUpdate(state: ValorantStore, prev: ValorantStore) {
  // if (prev.localPlayer !== state.localPlayer)
  //   publish(OpCode.LOCALPLAYER_UPDATED, state.localPlayer)
  if (prev.loopState !== state.loopState)
    publish(OpCode.GAMESTATE_UPDATED, state.loopState)
  if (prev.map !== state.map) publish(OpCode.MAP_UPDATED, state.map)
  if (prev.server !== state.server) publish(OpCode.SERVER_UPDATED, state.server)
  if (prev.queueId !== state.queueId)
    publish(OpCode.QUEUEID_UPDATED, state.queueId)

  if (prev.players.length) {
    if (!state.players.length) {
      publish(OpCode.CLEAR_PLAYERS)
    }
  }
  if (state.players.length) {
    if (state.players.length > prev.players.length) {
      let newPlayers = state.players.filter(
        (i) => prev.players.findIndex((x) => x.id === i.id) === -1
      )
      newPlayers.forEach((p) => publish(OpCode.PLAYER_ADDED, p))
    } else if (state.players.length < prev.players.length) {
      let oldPlayers = prev.players.filter(
        (i) => state.players.findIndex((x) => x.id === i.id) !== -1
      )
      oldPlayers.forEach((p) => publish(OpCode.PLAYER_REMOVED, p))
    } else {
      for (const player of state.players) {
        publish(OpCode.PLAYER_ADDED, player)
      }
    }
  }

  // if (prev.loopState === 'INGAME' && state.loopState === 'PREGAME') {
  //   clearPlayers()
  //   setPregameId(null)
  //   setCoregameId(null)
  // }
}

async function main() {
  console.clear()
  try {
    const dead = await checkForUpdates()
    if (dead) return
  } catch (err) {
    setKillOut(false)
    createLogger('Updater').error('Failed to check for updates:', err)
  } finally {
    setKillOut(false)
  }
  printHeader()

  let bBreak = false
  let ready = false
  let failures = 0
  try {
    logger.log('Loading...')
    await listenHttpServer()
    await sleep(1000)
    const opt = getRuntimeOptions()

    if (opt.launchValorant) {
      await listenChat()
      let tasklist = getTaskList()
      if (tasklist.includes('RiotClientServices.exe')) {
        if (!persistedStateStore.getState().chatContext.host) {
          logger.error(
            'Riot Client is already running, please close VALORANT/Riot Client before starting valoreye again'
          )
          // process.exit(0)
        }
      } else {
        clearIs()
        await sleep(1000)
        launchRC(true)
      }
    }

    // await listenWebSocket()

    let presences: RiotPresences
    do {
      try {
        logger.debug('Loading entitlements and presence')
        await riot.getEntitlements()
        logger.debug('Acquired entitlements')
        presences = await riot.getPresences()
        logger.success('Acquired entitlements & presence')
      } catch (err) {
        logger.debug(err)
        switch (err.code) {
          case 'ENOENT':
            logger.warn(
              'Waiting for Riot Client/VALORANT (missing RC lockfile, game not started)'
            )
            await sleep(1500)
            break
          case 'ECONNREFUSED':
            riot.clearLocalUrl()
            logger.warn('Waiting for Riot Client/VALORANT (RC still starting)')
            await sleep(1500)
            break
          default:
            if (err.toString().includes('Failure while requesting')) {
              // logger.warn(
              //   'Waiting for Riot Client/VALORANT (RC still starting)'
              // )
              await sleep(1500)
              break
            }
            logger.error('Error while requesting entitlements/presence:', err)
            process.exit(1)
        }
      }
      // @ts-ignore  HAHAHAHUADSHUFAD IJG KDJLAGOIDSHGJK:DSHGU:OJSDHJEAJODGKlajg OUasdghUOdsajgOIDsg
    } while (!presences)
    setLocalPlayer(riot.playerId)

    subscribe(handleStateUpdate)
  } catch (err) {
    logger.error('Error while initializing valoreye', err)
  }
  while (!bBreak) {
    try {
      const p = await riot.getPrivatePresence(riot.playerId)
      if (!ready) {
        logger.success('Ready!')
        ready = true
        riot.events.connect()
        riot.events.on('pregame', async (m) => {
          try {
            const match = await riot.getPregameMatch(m)
            setPregameId(m)
            setMap(await mapsCache.get(match.MapID))
          } catch (err) {
            logger.error('Error while fetching pregame match', err)
          }
        })
        riot.events.on('coregame', async (m) => {
          try {
            const match = await riot.getCoregameMatch(m)
            setCoregameId(m)
            setMap(await mapsCache.get(match.MapID))
          } catch (err) {
            logger.error('Error while fetching coregame match', err)
          }
        })
        // publish(OpCode.VPREF_UPDATED, (await riot.getSettings()).data)
      }

      // TODO: move consistency checks to handleStateUpdate
      const state = await ensureConsistency(getState(), p)
      if (global.republish) {
        // web/ws.ts
        publish(OpCode.LOCALPLAYER_UPDATED, [riot.playerId, riot.playerName])
        publish(OpCode.GAMESTATE_UPDATED, state.loopState)
        publish(OpCode.MAP_UPDATED, state.map)
        publish(OpCode.SERVER_UPDATED, state.server)
        publish(OpCode.QUEUEID_UPDATED, state.queueId)
        // publish(OpCode.VPREF_UPDATED, (await riot.getSettings()).data)
        global.republish = false
      }
      switch (p.sessionLoopState) {
        case 'MENUS':
          await handleMenus(state, p)
          await sleep(1000)
          break
        case 'PREGAME':
          await handlePregame(state, p)
          await sleep(500)
          break
        case 'INGAME':
          await handleInGame(state, p)
          await sleep(2000)
          break
      }
      failures = 0
    } catch (err) {
      setLoopState(ValorantLoopState.Menus)
      if (err.message.includes('Player not found'))
        logger.warn(
          `Waiting for VALORANT (${
            ready ? 'is VALORANT running?' : 'still starting'
          })`
        )
      else logger.error('Error occurred while processing game data', err)
      if (++failures > 30_000 / 1500) {
        logger.error('Failed to find player data, is VALORANT running?')
      }
      await sleep(1500)
    }
  }
}

process
  .on('unhandledRejection', (r, p) => {
    logger.warn('Unhandled Promise rejection:', r)
  })
  .on('uncaughtException', (err, orig) => {
    logger.warn('Uncaught Exception:', orig, err)
  })

main()
