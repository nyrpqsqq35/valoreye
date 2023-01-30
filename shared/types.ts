export type UUID = string

/**
 * RRGGBBAA string
 * @example 90e3fdff
 */
export type RGBAHexString = string

export interface RiotEntitlements {
  accessToken: string
  entitlements: any[]
  issuer: string
  subject: string
  token: string
}

export interface RiotPresence {
  actor: any
  basic: string
  details: any
  game_name: string
  game_tag: string
  location: string
  msg: string
  name: string
  patchline: string
  pid: string
  platform: string
  private: string
  privateJwt: string
  product: 'valorant' | 'league_of_legends' | 'bacon' | 'keystone' | 'wildrift'
  puuid: string
  region: string
  resource: string
  state: 'chat' | 'dnd' | 'away' | 'online' | 'unknown'
  summary: string
  time: number
}

export interface RiotPresences {
  presences: RiotPresence[]
}

export enum ValorantLoopState {
  Menus = 'MENUS',
  Pregame = 'PREGAME',
  InGame = 'INGAME',
  Invalid = 'INVALID',
}
export enum ValorantProvisioningFlow {
  Invalid = 'Invalid',
  ShootingRange = 'ShootingRange',
  SkillTest = 'SkillTest',
  CustomGame = 'CustomGame',
  Matchmaking = 'Matchmaking',
  NewPlayerExperience = 'NewPlayerExperience',
  Tournament = 'Tournament',
}
export enum ValorantPartyState {
  Default = 'DEFAULT',
  CustomGameSetup = 'CUSTOM_GAME_SETUP',
  CustomGameStarting = 'CUSTOM_GAME_STARTING',
  Matchmaking = 'MATCHMAKING',
  StartingMatchmaking = 'STARTING_MATCHMAKING',
  LeavingMatchmaking = 'LEAVING_MATCHMAKING',
  MatchmadeGameStarting = 'MATCHMADE_GAME_STARTING',
  SoloExperienceStarting = 'SOLO_EXPERIENCE_STARTING',
  TournamentSetupStarting = 'TOURNAMENT_SETUP_STARTING',
  TournamentSetup = 'TOURNAMENT_SETUP',
  RosterSetupStarting = 'ROSTER_SETUP_STARTING',
  RosterSetup = 'ROSTER_SETUP',
  TournamentStarting = 'TOURNAMENT_STARTING',
  Tournament = 'TOURNAMENT',
  TournamentLeaving = 'TOURNAMENT_LEAVING',
  Invalid = 'INVALID',
}
export enum ValorantPartyAccessibility {
  Invalid = 'INVALID',
  Open = 'OPEN',
  Closed = 'CLOSED',
}
export enum ValorantCustomGameTeam {
  Attackers = 'TeamTwo',
  Defenders = 'TeamOne',
  Spectators = 'TeamSpectate',
}
export type ValorantQueueId =
  | 'unrated' /* Unrated */
  | 'competitive' /* Competitive */
  | 'spikerush' /* Spike Rush */
  | 'deathmatch' /* Deathmatch */
  | 'onefa' /* Replication */
  | 'ggteam' /* Escalation */
  | 'newmap' /* One map (pearl, lotus, ...) */
  | 'swiftplay' /* Swiftplay */
  | 'seeding'

export type ValorantMapID = string // eg '/Game/Maps/Ascent/Ascent'
export type ValorantModeID = string // eg '/Game/GameModes/Bomb/BombGameMode.BombGameMode_C'

export interface ValorantPrivatePresence {
  isValid: boolean
  sessionLoopState: ValorantLoopState
  partyOwnerSessionLoopState: ValorantLoopState
  customGameName: string
  customGameTeam: ValorantCustomGameTeam
  partyOwnerMatchMap: string
  partyOwnerMatchCurrentTeam: string
  partyOwnerMatchScoreAllyTeam: number
  partyOwnerMatchScoreEnemyTeam: number
  partyOwnerProvisioningFlow: ValorantProvisioningFlow
  provisioningFlow: ValorantProvisioningFlow
  matchMap: string
  partyId: UUID
  isPartyOwner: boolean
  partyState: ValorantPartyState
  partyAccessibility: ValorantPartyAccessibility
  maxPartySize: number
  queueId: ValorantQueueId
  partyLFM: boolean
  partyClientVersion: string
  partySize: number
  tournamentId: string
  rosterId: string
  partyVersion: number
  queueEntryTime: string // YYYY.MM.DD-HH.MM.SS
  playerCardId: UUID
  playerTitleId: UUID
  preferredLevelBorderId: string
  accountLevel: number
  competitiveTier: number
  leaderboardPosition: number
  isIdle: boolean
}

export enum ValorantTeamID {
  Blue = 'Blue',
  Red = 'Red',
  Defenders = Blue,
  Attackers = Red,
}
export enum ValorantCharacterSelectionState {
  None = '',
  Selected = 'selected',
  Locked = 'locked',
}
export enum ValorantPregamePlayerState {
  None = '',
  Joined = 'joined',
}
export enum ValorantPregameState {
  MapSelectReady = 'map_select_ready',
  MapSelectActive = 'map_select_active',
  CharacterSelectActive = 'character_select_active',
  CharacterSelectFinished = 'character_select_finished',
  Provisioned = 'provisioned',
}
export interface ValorantPlayerIdentity {
  Subject: UUID
  PlayerCardID: UUID
  PlayerTitleID?: UUID
  AccountLevel: number
  PreferredLevelBorderID: UUID
  Incognito: boolean // Streamer mode
  HideAccountLevel: boolean
}
export interface ValorantSeasonalBadgeInfo {
  SeasonID: string
  NumberOfWins: number
  WinsByTier: any
  Rank: number
  LeaderboardRank: number
}
export interface ValorantPlayer {
  Subject: UUID
  TeamID?: ValorantTeamID // In Coregame only
  CharacterID?: UUID
  PlayerIdentity: ValorantPlayerIdentity
  SeasonalBadgeInfo: ValorantSeasonalBadgeInfo

  // pregame
  CharacterSelectionState?: ValorantCharacterSelectionState
  PregamePlayerState?: ValorantPregamePlayerState
  CompetitiveTier?: number
  IsCaptain?: boolean

  // coregame
  IsCoach?: boolean
  IsAssociated?: boolean
}
export interface ValorantTeam {
  TeamID: ValorantTeamID
  Players: ValorantPlayer[]
}

export interface ValorantPregameMatch {
  ID: UUID
  Version: number
  Teams: ValorantTeam[]
  AllyTeam: ValorantTeam
  EnemyTeam: ValorantTeam
  ObserverSubjects: any[]
  MatchCoaches: any[]
  EnemyTeamSize: number
  EnemyTeamLockCount: number
  PregameState: ValorantPregameState
  LastUpdated: string // YYYY-MM-DDTHH:MM:SSZ (ISO)
  MapID: ValorantMapID
  MapSelectPool: any[]
  CastedVotes: {}
  MapSelectSteps: any[]
  MapSelectStep: number
  Team1: ValorantTeamID
  GamePodID: string // 'aresriot.<cloud>-<cloud-region>-<env>.<region>' eg 'aresriot.aws-use1-prod.na-gp-ashburn-1'
  Mode: ValorantModeID
  VoiceSessionID: UUID
  MUCName: string // 'UUID-1@ares-pregame.na1.pvp.net'
  QueueID: string // ''
  ProvisioningFlowID: ValorantProvisioningFlow
  IsRanked: boolean
  PhaseTimeRemainingNS: number
  StepTimeRemainingNS: number
  altModesFlagADA: boolean
  TournamentMetadata: any
  RosterMetadata: any
}

export enum ValorantCoregameState {
  Preprovision = 'PREPROVISION',
  Provisioning = 'PROVISIONING',
  InProgress = 'IN_PROGRESS',
  PostGame = 'POST_GAME',
  Closed = 'CLOSED',
  Pending = 'PENDING',
  Invalid = 'INVALID',
}

export interface ValorantCoregameMatch {
  MatchID: UUID
  Version: number
  State: ValorantCoregameState
  MapID: ValorantMapID
  ModeID: ValorantModeID
  ProvisioningFlow: ValorantProvisioningFlow
  GamePodID: string
  AllMUCName: string // (matchid-all@ares-coregame.na1.pvp.net)
  TeamMUCName: string // (matchid-teamname@ares-coregame.na1.pvp.net)
  TeamVoiceID: string // (matchhid-tm1)
  IsReconnectable: boolean
  ConnectionDetails: {
    GameServerHosts: string[]
    GameServerHost: string
    GameServerPort: number
    GameServerObfuscatedIP: number
    GameClientHash: number
    PlayerKey: string
  }
  PostGameDetails: any
  Players: ValorantPlayer[]
  MatchhmakingData: null
}

export interface ValorantSeasonInfo {
  SeasonID: UUID
  NumberOfWins: number
  NumberOfWinsWithPlacements: number
  NumberOfGames: number
  Rank: number
  CapstoneWins: number
  LeaderboardRank: number
  CompetitiveTier: number
  RankedRating: number
  WinsByTier: {
    [x: string]: number
  }
  GamesNeededForRating: number
  TotalWinsNeededForRank: number
}

export interface ValorantQueueSkill {
  TotalGamesNeededForRating: number
  TotalGamesNeededForLeaderboard: number
  CurrentSeasonGamesNeededForRating: number
  SeasonalInfoBySeasonID: { [x: string]: ValorantSeasonInfo }
}

export interface ValorantContent {
  DisabledIDs: unknown[]
  Seasons: {
    ID: UUID
    Name: string
    Type: 'episode' | 'act'
    StartTime: string // ISO 8601
    EndTime: string // ISO 8601
    IsActive: boolean
  }[]
  Events: {
    ID: UUID
    Name: string
    StartTime: string // ISO 8601
    EndTime: string // ISO 8601
    IsActive: boolean
  }[]
}

export interface ValorantMMRReply {
  Version: number
  Subject: UUID
  NewPlayerExperienceFinished: boolean
  QueueSkills: {
    competitive: ValorantQueueSkill
    custom: ValorantQueueSkill
    deathmatch: ValorantQueueSkill
    ggteam: ValorantQueueSkill
    newmap: ValorantQueueSkill
    onefa: ValorantQueueSkill
    seeding: ValorantQueueSkill
    spikerush: ValorantQueueSkill
    unrated: ValorantQueueSkill
  }
  LatestCompetitiveUpdate: {
    MatchID: UUID
    MapID: ValorantMapID
    SeasonID: UUID
    MatchStartTime: number
    TierAfterUpdate: number
    TierBeforeUpdate: number
    RankedRatingAfterUpdate: number
    RankedRatingBeforeUpdate: number
    RankedRatingEarned: number
    RankedRatingPerformanceBonus: number
    CompetitiveMovement: string
    AFKPenalty: number
  }
  IsLeaderboardAnonymized: boolean
  IsActRankBadgeHidden: boolean
}

export enum ValorantContentType {
  EquippableSkin = 0,
  EquippableSkinLevel,
  EquippableSkinChroma,
  EquippableCharm,
  Character,
  CharacterRole,
  Contract,
  EquippableAttachment,
  Equippable,
  Map,
  Socket,
  Spray,
  GameMode,
  Currency,
  EquippableCharmLevel,
  SprayLevel,
  PlayerCard,
  PremiumContract,
  Mission,
  StorefrontItem,
  PlayerTitle,
  Season,
  ActRankBorder,
  ContractChapter,
  ContentTier,
  Loyalty,
  CompetitiveSeason,
  PremierSeason,
  MatchmakingQueue,
  LevelBorder,
  Event,
  JuiceBox,
  Ceremony,
  TournamentsTeamIcon,
  MassRewardsCeremony,
  Archive,
  Invalid = 36,
  Count = 37,
}

export enum ValorantItemType {
  AresPoint = '85ad13f7-3d1b-5128-9eb2-7cd8ee0b5741',
  UpgradeToken = 'e59aa87c-4cbf-517a-5983-6e81511be9b7',
  RecruitmentToken = 'f08d4ae3-939c-4576-ab26-09ce1f23bb37',
  ActPointsAsset = 'C7962062-400D-7598-EEE2-93B347E6046A',
  JuiceEnergyCurrency = '537BDF46-41CE-832A-8D79-328EC29D8A96',
  JuiceMaxEnergyCurrency = '1E259454-4958-6AB9-1DE7-739FE08C46BD',
  EquippableContentType = '51c9eb99-3e6b-4658-801f-a5a7fd64bb9d',
  EquippableSkinContentType = 'bcef87d6-209b-46c6-8b19-fbe40bd95abc',
  EquippableSkinLevelContentType = 'e7c63390-eda7-46e0-bb7a-a6abdacd2433',
  EquippableSkinChromaContentType = '3ad1b2b2-acdb-4524-852f-954a76ddae0a',
  EquippableCharmContentType = '77258665-71d1-4623-bc72-44db9bd5b3b3',
  EquippableCharmLevelContentType = 'dd3bf334-87f3-40bd-b043-682a57a8dc3a',
  EquippableAttachmentContentType = '6520634c-bd1e-4fc4-81af-cac5dc723105',
  CharacterContentType = '01bb38e1-da47-4e6a-9b3d-945fe4655707',
  SprayContentType = 'd5f120f8-ff8c-4aac-92ea-f2b5acbe9475',
  SprayLevelContentType = '290f8769-97c6-492a-a1a8-caacf3d5b325',
  PlayerCardContentType = '3f296c07-64c3-494c-923b-fe692a4fa1bd',
  MissionContentType = 'ac3c307a-368f-4db8-940d-68914b26d89a',
  PlayerTitleContentType = 'de7caa6b-adf7-4588-bbd1-143831e786c6',
  ContractContentType = '0381b6a6-e901-4225-a30c-b18afc6d0ad4',
  PremiumContractContentType = 'f85cb6f7-33e5-4dc8-b609-ec7212301948',
  LoyaltyEntitlementType = 'e632de5f-3ef9-45fe-97f2-10ee16ac1d50',
  PermanentEntitlementType = '4e60e748-bce6-4faa-9327-ebbe6089d5fe',
  CurrencyRewardType = 'ea6fcd2e-8373-4137-b1c0-b458947aa86d',
  ContractXPCurrency = '8e755510-5d2b-4921-ad75-bed2de113b18',
  F2PEntitlementType = 'ca37f5be-0b15-4917-a0e7-a6e8600489f2',
}

export interface ValorantStoreEntitlements<
  T extends ValorantItemType = ValorantItemType
> {
  ItemTypeID: T
  Entitlements: { TypeID: T; ItemID: UUID }[]
}

// Each entry is 0-255.
export interface ValorantXHairColor {
  r: number
  g: number
  b: number
  a: number
}
export interface ValorantXHairLineVar {
  bAllowVertScaling: boolean
  bShowLines: boolean
  bShowMinError: boolean
  bShowMovementError: boolean
  bShowShootingError: boolean
  firingErrorScale: number // float
  lineLength: number
  lineLengthVertical: number
  lineOffset: number
  lineThickness: number
  movementErrorScale: number // float
  opacity: number // float, min 0/1 max
}
export interface ValorantXHairVar {
  bDisplayCenterDot: boolean
  bFadeCrosshairWithFiringError: boolean
  bFixMinErrorAcrossWeapons: boolean
  bHasOutline: boolean
  bHideCrosshair: boolean
  bShowSpectatedPlayerCrosshair: boolean
  bTouchCrosshairHighlightEnabled: boolean
  bUseCustomColor: boolean
  centerDotOpacity: number // float, min 0/1 max
  centerDotSize: number
  color: ValorantXHairColor
  colorCustom: ValorantXHairColor
  innerLines: ValorantXHairLineVar
  outerLines: ValorantXHairLineVar
  outlineColor: ValorantXHairColor
  outlineOpacity: number // float, min 0/1 max
  outlineThickness: number
  touchCrosshairHighlightColor: ValorantXHairColor // rgba(0,0,0,0)
}
export interface ValorantXHairProfile {
  bUseAdvancedOptions: boolean
  bUseCustomCrosshairOnAllPrimary: boolean
  bUsePrimaryCrosshairForADS: boolean
  profileName: string
  primary: ValorantXHairVar
  aDS: ValorantXHairVar
  sniper: {
    bDisplayCenterDot: boolean
    bUseCustomCenterDotColor: boolean
    centerDotColor: ValorantXHairColor
    centerDotColorCustom: ValorantXHairColor
    centerDotOpacity: number // float, min 0/1 max
    centerDotSize: number
  }
}

export interface ValorantActionMapping {
  ctrl: boolean
  cmd: boolean
  alt: boolean
  shift: boolean

  characterName: string
  key: string
  name: string
  bindIndex: number
}

export interface ValorantPlayerSetting<T> {
  settingEnum: string
  value: T
}

export interface ValorantPlayerSettings {
  actionMappings: ValorantActionMapping[]
  axisMappings: {}[]
  boolSettings: ValorantPlayerSetting<boolean>[]
  floatSettings: ValorantPlayerSetting<number>[]
  intSettings: ValorantPlayerSetting<number>[]
  roamingSetttingsVersion: number // Riot fucking games
  settingsProfiles: string[] // "developerName"
  stringSettings: ValorantPlayerSetting<string>[]
}

export interface VERank {
  rank: number
  rankName: string
  rr: number
  leaderboard: number
  rankColor: RGBAHexString
  backgroundColor: RGBAHexString
  smallIcon: string
  largeIcon: string

  peakSeasonId?: UUID
  peakRank?: number
  peakRankName?: string
  peakSeasonAct?: string
  peakRankColor?: RGBAHexString
  peakBackgroundColor?: RGBAHexString
  peakSmallIcon?: string
  peakLargeIcon?: string
}

export interface VAObject {
  uuid: UUID
}

export interface VASeason extends VAObject {
  startTime: string
  endTime: string
  seasonUuid: string
  competitiveTiersUuid: string
  borders: {
    uuid: string
    level: number
    winsRequired: number
    displayIcon: string
    smallIcon: string
    assetPath: string
  }[]
  assetPath: string
}

export interface VARealCompetitiveTier {
  tier: number
  tierName: string
  division: string
  divisionName: string
  color: RGBAHexString
  backgroundColor: RGBAHexString
  smallIcon: string
  largeIcon: string
  rankTriangleDownIcon?: string
  rankTriangleUpIcon?: string
}

export interface VACompetitiveTier extends VAObject {
  assetObjectName: string
  tiers: VARealCompetitiveTier[]
  assetPath: string
}

export interface VAAgent extends VAObject {
  displayName: string
  description: string
  developerName: string
  characterTags: unknown
  displayIcon: string
  displayIconSmall: string
  bustPortrait?: string
  fullPortrait: string
  fullPortraitV2?: string
  killfeedPortrait?: string
  background: string
  backgroundGradientColors: RGBAHexString[]
  assetPath: string
  isFullPortraitRightFacing: boolean
  isPlayableCharacter: boolean
  isAvailableForTest: boolean
  isBaseContent: boolean
  role: {
    uuid: string
    displayName: string
    description: string
    displayIcon: string
    assetPath: string
  }
  abilities: {
    slot: string
    displayName: string
    description: string
    displayIcon: string
  }[]
  voiceLine: {
    minDuration: number
    maxDuration: number
    mediaList: { id: number; wwise: string; wave: string }[]
  }
}

export interface VAPlayerTitle extends VAObject {
  displayName: string
  titleText: string
  isHiddenIfNotOwned: boolean
  assetPath: string
}
export interface VAPlayerCard extends VAObject {
  displayName: string
  isHiddenIfNotOwned: boolean
  themeUuid: unknown
  displayIcon: string
  smallArt: string
  wideArt: string
  largeArt: string
  assetPath: string
}

export interface VALevelBorder extends VAObject {
  uuid: string
  startingLevel: number
  levelNumberAppearance: string
  smallPlayerCardAppearance: string
  assetPath: string
}

export interface VAMap extends VAObject {
  displayName: string
  coordinates: string
  displayIcon: string
  listViewIcon: string
  splash: string
  assetPath: string
  mapUrl: string
  xMultiplier: number
  yMultiplier: number
  xScalarToAdd: number
  yScalarToAdd: number
  callouts: {
    regionName: string
    superRegionMain: string
    location: {
      x: number
      y: number
    }
  }[]
}

export enum OpCode {
  LOCALPLAYER_UPDATED = 'LOCALPLAYER_UPDATED',
  GAMESTATE_UPDATED = 'GAMESTATE_UPDATED',
  PLAYER_ADDED = 'PLAYER_ADDED',
  PLAYER_REMOVED = 'PLAYER_REMOVED',
  CLEAR_PLAYERS = 'CLEAR_PLAYERS',
  MAP_UPDATED = 'MAP_UPDATED',
  SERVER_UPDATED = 'SERVER_UPDATED',
  INVITE_PLAYER = 'INVITE_PLAYER',
  PREFERENCES = 'PREFERENCES',
  ADD_FRIEND = 'ADD_FRIEND',
  CACHE_UPDATED = 'CACHE_UPDATED',
  QUIT_PREGAME = 'QUIT_PREGAME',
  DISASSOCIATE_COREGAME = 'DISASSOCIATE_COREGAME',
  QUEUEID_UPDATED = 'QUEUEID_UPDATED',
  LICENSE_UPDATED = 'LICENSE_UPDATED',
  VPREF_UPDATED = 'VPREF_UPDATED',
  SET_VPREF = 'SET_VPREF',
}

export interface NameServicePlayer {
  DisplayName: string
  Subject: UUID
  GameName: string
  TagLine: string
}

export interface GameDataPlayer {
  id: string // Subject
  disconnected: boolean
  teamId: ValorantTeamID // TeamID
  partyId: UUID
  partySize: number

  playerName: string
  tagLine: string

  rank: VERank

  accountLevel: number
  levelBorder: VALevelBorder
  playerCard: VAPlayerCard
  playerTitle: VAPlayerTitle | null

  agent: VAAgent | null

  streamerMode: boolean // PlayerIdentity.Incognito
  hideAccountLevel: boolean // PlayerIdentity.HideAccountLevel

  seasonalBadgeInfo: ValorantSeasonalBadgeInfo

  pregame?: {
    selectionState: ValorantCharacterSelectionState
  }
}

export enum PresenceStatus {
  Online, // 'chat'
  Offline, // ?
  Away, // 'away'
  Mobile, // 'mobile'
}

export type Preferences = {
  autoLockAgent: {
    enabled: boolean
    options: {
      [mapUuid: UUID]: [
        (Omit<IAutoLockOption, 'team'> & { team: ValorantTeamID.Blue }) | null,
        (Omit<IAutoLockOption, 'team'> & { team: ValorantTeamID.Red }) | null
      ]
    }
  }
  presence: {
    enabled: boolean
    status: PresenceStatus

    spoofPresence: boolean
    spoofPlayerTitle: boolean
    spoofLevelBorder: boolean
    spoofPlayerCard: boolean
    spoofQueueId: boolean
    spoofLBPos: boolean
    spoofLevel: boolean
    spoofTier: boolean
    playerTitle: UUID
    levelBorder: UUID
    playerCard: UUID
    queueId: string
    lbPos: number
    level: number
    tier: number
  }
  uuid: string
}

export interface CachePayload {
  levelBorders: VALevelBorder[]
  playerCards: VAPlayerCard[]
  playerTitles: VAPlayerTitle[]
  competitiveTiers: VACompetitiveTier[]
  maps: VAMap[]
  agents: VAAgent[]
  flags: Flag[]
}

// values must be upper case !
export enum Flag {
  NAMES_VISIBLE = 'NAMES_VISIBLE',
  LEVELS_VISIBLE = 'LEVELS_VISIBLE',
  STATUS_SPOOFING = 'STATUS_SPOOFING',
  PRESENCE_SPOOFING = 'PRESENCE_SPOOFING',
  ENABLE_AUTOLOCK = 'ENABLE_AUTOLOCK',
  ADD_FRIEND = 'ADD_FRIEND',
  PARTY_INVITE = 'PARTY_INVITE',
  NO_AUTOLAUNCH = 'NL',
  XHAIR_EDITOR = 'XHAIR_EDITOR',
  PREF_EDITOR = 'PREF_EDITOR',
}

export interface IAutoLockOption {
  map: string
  assetPath: string
  mapUrl: string
  team: ValorantTeamID
  agent: string
}

declare global {
  // Added by esbuild#define
  const BUILD_META: {
    version: string
    commit: string
    buildDate: string
    env: 'development' | 'production'
  }
}
