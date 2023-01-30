import https from 'https'
import fetch, { HeadersInit, RequestInit } from 'node-fetch'

import { Builders } from '../constants'
import { btoa, encodeJSONRiotLike } from '../util/util'
import valorant from './valorant'
import { getWindowsVersion } from '../win'

import {
  NameServicePlayer,
  OpCode,
  RiotEntitlements,
  RiotPresence,
  RiotPresences,
  UUID,
  ValorantContent,
  ValorantCoregameMatch,
  ValorantItemType,
  ValorantMMRReply,
  ValorantPlayerSettings,
  ValorantPregameMatch,
  ValorantPrivatePresence,
  ValorantStoreEntitlements,
  VERank,
} from '../types'
import { publish } from '../web/ws'
import { agentsCache, competitiveTiersCache, seasonsCache } from '../cache'
import { createLogger } from '~/util/logger'
import { inspect } from 'util'
import RiotRTE from './rte'

const logger = createLogger('Riot'),
  httpLogger = createLogger('Riot/HTTP', true)

export class RiotAPI {
  #urlBaseLocal: string
  #urlBasePd: string
  #urlBaseGlz: string
  #urlBaseShared: string
  #localHeaders?: HeadersInit | undefined
  #playerId: string
  #playerName: string
  #authErrors = 0
  headers: HeadersInit
  agent = new https.Agent({
    rejectUnauthorized: false,
  })

  #cache = new Map<string, any>()
  #playerNameMap = new Map<UUID, NameServicePlayer>()
  #mmrMap = new Map<UUID, VERank>()

  events = new RiotRTE(this)

  // #region getters/setters
  get urlBasePd() {
    if (!this.#urlBasePd) {
      this.#urlBasePd = Builders.buildPdUrl(valorant.region)
      logger.debug('Created Valorant PD URL base:', this.#urlBasePd)
    }
    return this.#urlBasePd
  }
  get urlBaseGlz() {
    if (!this.#urlBaseGlz) {
      this.#urlBaseGlz = Builders.buildGlzUrl(
        valorant.region,
        valorant.regionFull
      )
      logger.debug('Created Valorant GLZ URL base:', this.#urlBaseGlz)
    }
    return this.#urlBaseGlz
  }
  get urlBaseShared() {
    if (!this.#urlBaseShared) {
      this.#urlBaseShared = Builders.buildSharedUrl(valorant.region)
      logger.debug('Created Valorant Shared URL base:', this.#urlBaseShared)
    }
    return this.#urlBaseShared
  }
  get urlBaseLocal() {
    if (!this.#urlBaseLocal) {
      const { protocol, host, port } = valorant.getLockfileContent()
      this.#urlBaseLocal = `${protocol}://${host}:${port}`
      logger.debug('Created Riot Client API URL base:', this.#urlBaseLocal)
    }
    return this.#urlBaseLocal
  }
  get localHeaders(): HeadersInit {
    if (!this.#localHeaders) {
      const { username, password } = valorant.getLockfileContent()
      this.#localHeaders = {
        Authorization: 'Basic ' + btoa([username, password].join(':')),
      }
    }
    return this.#localHeaders
  }
  get playerId(): string {
    return this.#playerId
  }
  set playerId(pid: string) {
    this.#playerId = pid
    publish(OpCode.LOCALPLAYER_UPDATED, [pid, this.playerName])
  }
  get playerName(): string {
    return this.#playerName
  }
  set playerName(pn: string) {
    this.#playerName = pn
    publish(OpCode.LOCALPLAYER_UPDATED, [this.playerId, pn])
  }
  // #endregion

  clearAuth() {
    this.#localHeaders = undefined
    this.headers['Authorization'] = null
  }

  clearLocalUrl() {
    this.#urlBaseLocal = ''
  }

  // #region http helpers
  url(base: string, endpoint: string) {
    return new URL(endpoint, base).toString()
  }

  async getLocal<T = any>(endpoint: string): Promise<T> {
    const url = this.url(this.urlBaseLocal, endpoint)
    const res = await fetch(url, {
      agent: this.agent,
      headers: this.localHeaders,
    })
    if (!res.ok)
      throw new Error(
        `Failure while requesting ${url} (${res.status} ${res.statusText})`
      )
    const json = await res.json()

    if (
      endpoint !== '/chat/v4/presences' &&
      endpoint !== '/entitlements/v1/token'
    )
      // very chatty
      httpLogger.debug(
        `GET ${endpoint} => ${res.status} ${res.statusText}\n${
          res.status !== 200 ? inspect(json, false, 4, true) : ''
        }\n`
      )
    return json
  }
  async postLocal<T = any>(endpoint: string, body?: any): Promise<T> {
    const url = this.url(this.urlBaseLocal, endpoint)
    const res = await fetch(url, {
      agent: this.agent,
      headers: { ...this.localHeaders, 'Content-Type': 'application/json' },
      method: 'POST',
      body: JSON.stringify(body),
    })
    if (!res.ok)
      throw new Error(
        `Failure while requesting ${url} (${res.status} ${res.statusText})`
      )
    const json = await res.json()

    if (
      endpoint !== '/chat/v4/presences' &&
      endpoint !== '/entitlements/v1/token'
    )
      // very chatty
      httpLogger.debug(
        `POST ${endpoint} => ${res.status} ${res.statusText}\n${
          res.status !== 200 ? inspect(json, false, 4, true) : ''
        }\n`
      )
    return json
  }
  async putLocal<T = any>(endpoint: string, body?: any): Promise<T> {
    const url = this.url(this.urlBaseLocal, endpoint)
    const res = await fetch(url, {
      agent: this.agent,
      headers: { ...this.localHeaders, 'Content-Type': 'application/json' },
      method: 'PUT',
      body: JSON.stringify(body),
    })
    if (!res.ok)
      throw new Error(
        `Failure while requesting ${url} (${res.status} ${res.statusText})`
      )
    const json = await res.json()

    if (
      endpoint !== '/chat/v4/presences' &&
      endpoint !== '/entitlements/v1/token'
    )
      // very chatty
      httpLogger.debug(
        `PUT ${endpoint} => ${res.status} ${res.statusText}\n${
          res.status !== 200 ? inspect(json, false, 4, true) : ''
        }\n`
      )
    return json
  }
  async http<T = any>(
    method: string,
    base: string,
    endpoint: string,
    cache: boolean,
    body?: any
  ): Promise<T> {
    const url = this.url(base, endpoint)
    if (cache && this.#cache.has(url)) return this.#cache.get(url)
    const init: RequestInit = {
      headers: this.headers,
      method,
    }
    if (method !== 'GET' && method !== 'HEAD' && body) {
      init.headers!['Content-Type'] = 'application/json'
      init.body = JSON.stringify(body)
    }
    const res = await fetch(url, init)

    if (!res.ok) {
      const body = await res.json()
      httpLogger.debug(
        'Request error ->',
        url,
        res.status,
        res.statusText,
        body
      )
      if (body.errorCode === 'BAD_CLAIMS') {
        this.#authErrors++
        this.clearAuth()
        await this.getEntitlements()
        if (++this.#authErrors > 400)
          throw new Error('RSO auth errors exceeded')
        return this.http(method, base, endpoint, cache, body)
      }
      throw new Error(
        `Failure while requesting ${url} (${res.status} ${res.statusText})`
      )
    }
    const json = await res.json()
    if (endpoint !== '/store/v1/offers/')
      httpLogger.debug(
        `${method} ${endpoint} => ${res.status} ${res.statusText}\n${
          res.status !== 200 ? inspect(json, false, 4, true) : ''
        }\n`
      )
    if (cache) this.#cache.set(url, json)
    return json
  }
  async get<T = any>(
    base: string,
    endpoint: string,
    cache = false
  ): Promise<T> {
    return this.http('GET', base, endpoint, cache)
  }
  async post<T = any>(base: string, endpoint: string, body?: any): Promise<T> {
    return this.http('POST', base, endpoint, false, body)
  }
  async put<T = any>(base: string, endpoint: string, body?: any): Promise<T> {
    return this.http('PUT', base, endpoint, false, body)
  }
  // #endregion

  async getEntitlements(): Promise<RiotEntitlements> {
    const entitlements = await this.getLocal('/entitlements/v1/token')
    if (entitlements.subject && !this.playerId) {
      this.playerId = entitlements.subject
      logger.debug('Found player UUID:', this.playerId)
    }
    if (
      entitlements.accessToken &&
      entitlements.token &&
      (!this.headers || !this.headers['Authorization'])
    ) {
      logger.debug('Found access token & token, setup headers')
      const windowsVersion = getWindowsVersion()
      this.headers = {
        Authorization: 'Bearer ' + entitlements.accessToken,
        'X-Riot-Entitlements-JWT': entitlements.token,
        'X-Riot-ClientPlatform': btoa(
          encodeJSONRiotLike({
            platformType: 'PC',
            platformOS: 'Windows',
            platformOSVersion: windowsVersion,
            platformChipset: 'Unknown',
          })
        ),
        'X-Riot-ClientVersion': valorant.version!,
        'User-Agent': 'ShooterGame/22 Windows/' + windowsVersion,
      }
    }
    if (this.playerId && !this.playerName) {
      let name = await this.getNameByUUID(this.playerId)
      this.playerName = `${name.GameName}#${name.TagLine}`
      logger.debug('Got player name in entitlements', this.playerName)
    }
    return entitlements
  }

  /**
   * @returns presences for Valorant only
   */
  async getPresences(): Promise<RiotPresences> {
    const presences = await this.getLocal<RiotPresences>('/chat/v4/presences')
    if (this.playerId && !this.playerName) {
      let op = presences.presences.find((i) => i.pid === this.playerId)
      if (op) {
        this.playerName = `${op.game_name}#${op.game_tag}`
        logger.debug('Got player name in presences', this.playerName)
      }
    }
    return {
      presences: presences.presences.filter((i) => i.product === 'valorant'),
    }
  }

  async getPresence(playerId: string): Promise<RiotPresence | undefined> {
    let cachedPres = this.events.getCachedPresence(playerId)
    if (cachedPres) {
      return cachedPres
    }
    const { presences } = await this.getPresences()
    return presences.find((i) => i.puuid === playerId)
  }

  async getPrivatePresence(
    playerUuid: string
  ): Promise<ValorantPrivatePresence> {
    const p = await this.getPresence(playerUuid)
    if (!p) throw new Error('Player not found')
    if (!p.private) throw new Error('No private presence for player')
    const json = JSON.parse(atob(p.private))
    return json as ValorantPrivatePresence
  }

  async getPregameMatchId(): Promise<string> {
    const response = await this.get(
      this.urlBaseGlz,
      '/pregame/v1/players/' + this.playerId
    )
    return response.MatchID as string
  }
  async getPregameMatch(matchId: string): Promise<ValorantPregameMatch> {
    const response = await this.get(
      this.urlBaseGlz,
      '/pregame/v1/matches/' + matchId
    )
    return response
  }
  async selectCharacter(matchId: string, character: UUID): Promise<any> {
    return this.post(
      this.urlBaseGlz,
      `/pregame/v1/matches/${matchId}/select/${character}`
    )
  }
  async lockCharacter(matchId: string, character: UUID): Promise<any> {
    return this.post(
      this.urlBaseGlz,
      `/pregame/v1/matches/${matchId}/lock/${character}`
    )
  }

  async getCoregameMatchId(): Promise<string> {
    const response = await this.get(
      this.urlBaseGlz,
      '/core-game/v1/players/' + this.playerId
    )
    return response.MatchID as string
  }
  async getCoregameMatch(matchId: string): Promise<ValorantCoregameMatch> {
    const response = await this.get(
      this.urlBaseGlz,
      '/core-game/v1/matches/' + matchId
    )
    return response
  }

  // mmr
  async getMMR(playerId: string): Promise<ValorantMMRReply> {
    const response = await this.get<ValorantMMRReply>(
      this.urlBasePd,
      '/mmr/v1/players/' + playerId
    )
    return response
  }

  async getContent(): Promise<ValorantContent> {
    const response = await this.get<ValorantContent>(
      this.urlBaseShared,
      '/content-service/v3/content',
      true
    )
    return response
  }

  // Store
  async getStorefront(playerId: string) {
    const response = await this.get(
      this.urlBasePd,
      '/store/v2/storefront/' + playerId
    )
    return response
  }

  async getOffers() {
    const response = await this.get(this.urlBasePd, '/store/v1/offers/')
    return response
  }

  async getStoreEntitlements<T extends ValorantItemType>(
    itemType: T
  ): Promise<ValorantStoreEntitlements<T>> {
    const response = await this.get(
      this.urlBasePd,
      `/store/v1/entitlements/${this.playerId}/${itemType}`
    )
    return response
  }

  /**
   * @returns Array of unlocked agent UUIDS
   */
  async getUnlockedChars(): Promise<UUID[]> {
    const baseChars = agentsCache.filter(
      (i) => i.isBaseContent && i.isPlayableCharacter
    )

    const { Entitlements } = await this.getStoreEntitlements(
      ValorantItemType.CharacterContentType
    )
    return [
      ...baseChars.map((i) => i.uuid),
      ...Entitlements.map((i) => i.ItemID),
    ]
  }

  // misc
  async getCustomGameConfigs(): Promise<any> {
    return this.get(this.urlBaseGlz, '/parties/v1/parties/customgameconfigs')
  }

  // name
  async getNamesByUUIDs(uuids: UUID[]): Promise<NameServicePlayer[]> {
    let filtered = uuids.filter((u) => !this.#playerNameMap.has(u))
    if (filtered.length > 0) {
      let players = await this.put<NameServicePlayer[]>(
        this.urlBasePd,
        '/name-service/v2/players',
        filtered
      )
      for (const p of players) {
        this.#playerNameMap.set(p.Subject, p)
      }
    }

    return uuids.map((i) => this.#playerNameMap.get(i)!)
  }
  async getNameByUUID(uuid: UUID): Promise<NameServicePlayer> {
    return (await this.getNamesByUUIDs([uuid]))[0]
  }

  async getCurrentSeasonID(): Promise<string> {
    const content = await this.getContent()
    return content.Seasons.find((i) => i.Type === 'act' && i.IsActive)!.ID
    // 7a85de9a-4032-61a9-61d8-f4aa2b4a84b6
  }

  async getRankByUUID(uuid: UUID): Promise<VERank> {
    const seasonId = await this.getCurrentSeasonID()
    if (this.#mmrMap.has(uuid)) return this.#mmrMap.get(uuid)!

    const content = await this.getContent()
    const mmr = await this.getMMR(uuid)
    const qs = mmr.QueueSkills.competitive

    let ret: VERank = {
      rank: 0,
      rankName: 'Unranked',
      rr: 0,
      leaderboard: 0,
      rankColor: 'ffffffff',
      backgroundColor: '00000000',
      smallIcon: '',
      largeIcon: '',

      peakRank: 0,
      peakSeasonId: '8d9e3688-470b-c0e0-5b20-ca964d907adb',
    }

    if (qs.SeasonalInfoBySeasonID) {
      if (qs.SeasonalInfoBySeasonID[seasonId]) {
        const cs = qs.SeasonalInfoBySeasonID[seasonId]
        ret.rank = cs.CompetitiveTier
        ret.leaderboard = cs.LeaderboardRank
        ret.rr = cs.RankedRating
      }

      for (const season of Object.values(qs.SeasonalInfoBySeasonID)) {
        let peakTier = Math.max(
          0,
          ...Object.keys(season.WinsByTier || {}).map((i) => parseInt(i))
        )
        if (peakTier >= ret.peakRank!) {
          ret.peakSeasonId = season.SeasonID
          ret.peakRank = peakTier
        }
      }
    }

    const vaSeason = await seasonsCache.get(seasonId)
    const vaCT = await competitiveTiersCache.get(vaSeason.competitiveTiersUuid)!
    const tier = vaCT.tiers.find((t) => t.tier === ret.rank)!
    ret.rankName = tier.tierName
    ret.rankColor = tier.color
    ret.backgroundColor = tier.backgroundColor
    ret.smallIcon = tier.smallIcon
    ret.largeIcon = tier.largeIcon

    if (typeof ret.peakRank === 'number') {
      const paSeason = await seasonsCache.get(ret.peakSeasonId!)
      const paCT = await competitiveTiersCache.get(
        paSeason.competitiveTiersUuid
      )!
      const tier = paCT.tiers.find((t) => t.tier === ret.peakRank!)!
      const ep = paCT.assetObjectName.match(/(\d+)/gi)![0]
      const act = content.Seasons.find(
        (i) => i.ID === ret.peakSeasonId!
      )?.Name.match(/(\d+)/gi)![0]

      ret.peakRankName = tier.tierName
      ret.peakSeasonAct = `s${ep}a${act}`
      ret.peakRankColor = tier.color
      ret.peakBackgroundColor = tier.backgroundColor
      ret.peakSmallIcon = tier.smallIcon
      ret.peakLargeIcon = tier.largeIcon
    }
    this.#mmrMap.set(uuid, ret)
    return ret
  }

  async inviteToParty(displayName: string, tag: string): Promise<void> {
    const privPres = await this.getPrivatePresence(this.playerId)
    return this.post(
      this.urlBaseGlz,
      `/parties/v1/parties/${privPres.partyId}/invites/name/${displayName}/tag/${tag}`
    )
  }

  async addFriend(displayName: string, tag: string): Promise<void> {
    return this.postLocal('/chat/v4/friendrequests', {
      game_name: displayName,
      game_tag: tag,
    })
  }

  async quitPreGame(matchId: string): Promise<void> {
    return this.post(this.urlBaseGlz, `/pregame/v1/matches/${matchId}/quit`)
  }
  async disassociate(matchId: string): Promise<void> {
    return this.post(
      this.urlBaseGlz,
      `/core-game/v1/players/${this.playerId}/disassociate/${matchId}`
    )
  }

  async getSettings(): Promise<{
    data: ValorantPlayerSettings
    modified: number
    type: 'Ares.PlayerSettings'
  }> {
    return this.getLocal('/player-preferences/v1/data-json/Ares.PlayerSettings')
  }
  async setSettings(settings: ValorantPlayerSettings): Promise<any> {
    return this.putLocal(
      '/player-preferences/v1/data-json/Ares.PlayerSettings',
      settings
    )
  }
}

const riot = new RiotAPI()

export default riot
