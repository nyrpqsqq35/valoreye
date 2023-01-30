import chalk from 'chalk'
import day from 'dayjs'
import murmurhash from 'murmurhash-js'
import { getRuntimeOptions } from './runtime'
import { noop } from './util'

type Level = 'debug' | 'log' | 'info' | 'success' | 'warn' | 'error'
type LoggerFunc = (...msg: any[]) => void

type Logger = Record<Level, LoggerFunc>

let killOut = false

const ScopeColors = [
    chalk.redBright,
    chalk.greenBright,
    chalk.yellowBright,
    chalk.blueBright,
    chalk.magentaBright,
    chalk.cyanBright,
  ],
  MaxScopeColors = ScopeColors.length

const LogMap: Record<Level, chalk.Chalk> = {
    debug: chalk.magentaBright,
    log: chalk.cyanBright,
    info: chalk.blueBright,
    success: chalk.greenBright,
    warn: chalk.yellowBright,
    error: chalk.redBright,
  },
  ScopeMap: Record<string, Logger> = {}
const createTimestamp = (level: Level = 'log') =>
    LogMap[level](`[` + day().format('HH:mm:ss.SSS') + `]`),
  createScope = (scope: string) => {
    const num = (murmurhash.murmur3(scope, 0x108c93e0) / 2) >>> 0
    return chalk.underline(ScopeColors[num % MaxScopeColors](scope))
  }
const shouldDebug =
  BUILD_META.env === 'development' || getRuntimeOptions().debug.length

const alwaysLogger: Logger = {
  debug: shouldDebug
    ? (...msg: any[]) => console.log(createTimestamp('debug'), ...msg)
    : noop,
  log: (...msg: any[]) => console.log(createTimestamp('log'), ...msg),
  info: (...msg: any[]) => console.info(createTimestamp('info'), ...msg),
  success: (...msg: any[]) => console.info(createTimestamp('success'), ...msg),
  warn: (...msg: any[]) => console.warn(createTimestamp('warn'), ...msg),
  error: (...msg: any[]) => console.error(createTimestamp('error'), ...msg),
}
const logger: Logger = {
  debug: shouldDebug
    ? (...msg: any[]) => !killOut && alwaysLogger.debug(...msg)
    : noop,
  log: (...msg: any[]) => !killOut && alwaysLogger.log(...msg),
  info: (...msg: any[]) => !killOut && alwaysLogger.info(...msg),
  success: (...msg: any[]) => !killOut && alwaysLogger.success(...msg),
  warn: (...msg: any[]) => !killOut && alwaysLogger.warn(...msg),
  error: (...msg: any[]) => !killOut && alwaysLogger.error(...msg),
}

export function createLogger(
  scope: string,
  explicitDebug = false,
  ignoreKillOut = false
): Logger {
  if (ScopeMap[scope]) return ScopeMap[scope]

  const scopePrefix = createScope(scope),
    lowerScope = scope.toLowerCase()

  const shouldDebug =
    (!explicitDebug && BUILD_META.env === 'development') ||
    getRuntimeOptions().debug.includes(lowerScope)

  let ologger = ignoreKillOut ? alwaysLogger : logger

  ScopeMap[scope] = {
    debug: shouldDebug ? ologger.debug.bind(null, scopePrefix) : noop,
    log: ologger.log.bind(null, scopePrefix),
    info: ologger.info.bind(null, scopePrefix),
    success: ologger.success.bind(null, scopePrefix),
    warn: ologger.warn.bind(null, scopePrefix),
    error: ologger.error.bind(null, scopePrefix),
  }

  return ScopeMap[scope]
}

export function setKillOut(value: boolean): void {
  killOut = value
}

export default logger
