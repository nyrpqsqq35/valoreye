import semver from 'semver'
import fetch from 'node-fetch'
import { createLogger, setKillOut } from './util/logger'
import { ok } from 'assert'
import fs from 'fs'
import { execSync, spawn } from 'child_process'
import readline from 'readline/promises'
import chalk from 'chalk'

const logger = createLogger('Updater', false, true)
const GH_ACCEPT = 'application/vnd.github+json'
const GH_API_VERSION = '2022-11-28'
const USER_AGENT = `valoreye/${BUILD_META.version} Node.js/${process.version}`

interface Meta {
  '//': 've autoupdater'
  // semver
  v: string
  // asset name
  name: string
  // can launch without update
  required: boolean
  // will forcefully update
  forced?: boolean
  // short message
  sm?: string
}

const MetaPattern = /<!-- (?<meta>{"\/\/": "ve autoupdater".+) -->/i

async function getRelease(
  repo = 'nyrpqsqq35/valoreye',
  release = 'latest'
): Promise<{
  html_url: string
  assets: { name: string; browser_download_url: string }[]
  body: string
}> {
  const res = await fetch(
    `https://api.github.com/repos/${repo}/releases/${release}`,
    {
      headers: {
        Accept: GH_ACCEPT,
        'X-GitHub-Api-Version': GH_API_VERSION,
        'User-Agent': USER_AGENT,
      },
    }
  )
  const rel = await res.json()
  ok(!rel.draft, 'Release is in draft state')
  ok(!rel.prerelease, 'Release is in pre-release state')
  ok(Array.isArray(rel.assets), 'Release assets is not an array')
  ok(rel.assets.length, 'Release has no assets')
  ok(
    rel.assets.every((i) => i.name && i.browser_download_url),
    'Release assets are invalid (might not have name or browser download)'
  )
  ok(rel.body, 'Missing or empty release body')
  ok(rel.html_url, 'Missing or empty release url')
  return rel
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function replaceSelfWithAsset(url: string) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
    },
  })
  const text = await res.text()

  fs.writeFileSync(__filename, text, 'utf8')
}

export function restartProcess() {
  delete require.cache[__filename]
  console.clear()
  require(__filename)
}

const openInBrowser = (url: string) => {
  if (
    url.match(
      /^https?:\/\/(?:www\.)?github\.com\/nyrpqsqq35\/valoreye\/releases\/tag\/[\d\w.]+$/gi
    )
  ) {
    logger.warn('Opening more information in browser.')
    execSync(`start ${url}`)
  }
}

/**
 * @returns dead
 */
export async function checkForUpdates(): Promise<boolean> {
  if (BUILD_META.env !== 'production') {
    logger.debug('Not checking for updates (we are in', BUILD_META.env, 'env)')
    return false
  }
  logger.info('Checking for updates')

  setKillOut(true)

  const rel = await getRelease()

  const m = rel.body.match(MetaPattern)
  ok(m, 'Missing autoupdater metadata from release')
  ok(m.groups, 'Missing the autoupdater metadata from release')
  const meta = JSON.parse(m.groups.meta) as Meta

  const ver = semver.coerce(meta.v)
  ok(ver, 'Version for release is invalid')
  const gt = ver.compare(BUILD_META.version)

  // need to upd8
  if (gt === 1) {
    let openReleaseInBrowser = openInBrowser.bind(null, rel.html_url)
    const asset = rel.assets.find((i) => i.name)
    ok(asset, 'Specified release asset is missing!')

    let shouldUpdate = meta.forced
    logger.success('A new update is available!')
    logger.success('You have', BUILD_META.version)
    logger.success('Latest version is', meta.v)
    if (meta.sm) logger.success(meta.sm)
    logger.success(
      'View more information at:',
      chalk.blueBright.underline(rel.html_url) + ' (Ctrl + Click)'
    )
    const txtReq = chalk.yellow('REQUIRED')
    if (meta.required) logger.warn('This update is', txtReq + '.')

    if (shouldUpdate) {
      openReleaseInBrowser()
      await sleep(1_000)
      logger.error('This update will apply automatically.')
      logger.warn(
        'To cancel the update, press Ctrl + C on your keyboard here within the next 10 seconds'
      )

      await sleep(5_000)
      logger.warn('5 seconds...')
      await sleep(5_000)
    }

    if (!shouldUpdate) {
      setKillOut(true)
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      })
      shouldUpdate = (
        await rl.question('Download and apply the update? [y/N] ')
      )
        .toLowerCase()
        .trim()
        .startsWith('y') // Defaults to N(o)
      rl.close()
    }

    if (!shouldUpdate && (meta.required || meta.forced)) {
      logger.error('This update is', txtReq, 'and cannot be skipped.')
      openReleaseInBrowser()
      process.exit(0)
    } else if (shouldUpdate) {
      logger.info('Downloading update...')
      await replaceSelfWithAsset(asset.browser_download_url)
      logger.success('Update success. Restarting...')
      await sleep(500)
      process.nextTick(() => restartProcess())
      return true
    }
  }
  setKillOut(false)
  logger.success('No updates found!')
  return false
}
