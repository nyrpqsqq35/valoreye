export const Patterns = {
  GetRegion: /https?:\/\/pd\.(\w+)\.a\.pvp\.net\/account-xp\/v1\//i,
  GetRegionFull: /https?:\/\/glz-([\w\d-]+).\w+\.a\.pvp\.net\//i,
  GetVersion: /CI server version: (release[\w\d-.]+)/i,

  WinBuildVersion: /version: ([\w\d.]+bit)/,

  PreGameMatchId:
    /(?:\/riot-messaging-service\/v1\/message\/)?ares-pregame\/pregame\/v1\/matches\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i,
  CoreGameMatchId:
    /(?:\/riot-messaging-service\/v1\/message\/)?ares-core-game\/core-game\/v1\/matches\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i,
}

export const Builders = {
  buildPdUrl: (region: string) => `https://pd.${region}.a.pvp.net`,
  buildGlzUrl: (region: string, regionFull: string) =>
    `https://glz-${regionFull}.${region}.a.pvp.net`,
  buildSharedUrl: (region: string) => `https://shared.${region}.a.pvp.net`,
}

export const DefaultChatUrl = 'na2.chat.si.riotgames.com'
export const DefaultChatPort = 5223
export const DefaultChatSecure = true
export const ClientConfigUrl = 'https://clientconfig.rpg.riotgames.com'
export const SharedConfigUrl = 'https://shared.na.a.pvp.net'

export const WebSocketMountPath = '/__valoreye/wss'
