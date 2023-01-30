import path from 'path'
import fs from 'fs'
import { Patterns } from '../constants'
import { createLogger } from '~/util/logger'
import { persistedStateStore } from '~/store/persistedState'

const logger = createLogger('Riot')

class Valorant {
  #region: string
  #regionFull: string
  #version: string

  getLocalAppData() {
    return process.env.LOCALAPPDATA! as string
  }

  getRiotClientPath() {
    return path.resolve(this.getLocalAppData(), 'Riot Games', 'Riot Client')
  }
  getLockfilePath() {
    return path.resolve(this.getRiotClientPath(), 'Config', 'lockfile')
  }
  getLockfileContent() {
    const lockfile = fs.readFileSync(this.getLockfilePath(), 'utf8')
    const parsedLockfile = lockfile.split(':')
    return {
      name: parsedLockfile[0],
      pid: parseInt(parsedLockfile[1], 10),
      host: '127.0.0.1',
      port: parseInt(parsedLockfile[2], 10),
      username: 'riot',
      password: parsedLockfile[3],
      protocol: parsedLockfile[4],
    }
  }

  getSavedPath() {
    return path.resolve(this.getLocalAppData(), 'VALORANT', 'Saved')
  }
  getLogPath() {
    return path.resolve(this.getSavedPath(), 'Logs', 'ShooterGame.log')
  }
  getLogContent() {
    return fs.readFileSync(this.getLogPath(), 'utf8')
  }

  getInstallsPath() {
    return path.resolve(
      process.env.PROGRAMDATA!,
      'Riot Games',
      'RiotClientInstalls.json'
    )
  }
  getInstalls() {
    const rci = JSON.parse(fs.readFileSync(this.getInstallsPath(), 'utf8')) as {
      associated_client: {
        [gamePath: string]: string
      }
      patchlines: {
        [patchline: string]: string
      }
      rc_default: string
      rc_live?: string
      rc_beta?: string
    }
    return rci
  }
  getRiotClientServicesExe() {
    return this.getInstalls().rc_default
  }

  get region() {
    let c: string
    if ((c = persistedStateStore.getState().region)) return c
    if (!this.#region) {
      const lc = this.getLogContent()
      const matches = lc.match(Patterns.GetRegion)
      if (!matches) {
        logger.warn('Failed to find region')
        return 'na'
      }
      this.#region = matches[1]
      logger.debug('Found valorant region', this.#region)
    }
    if (this.#region)
      persistedStateStore.setState((e) => ({ ...e, region: this.#region }))
    return this.#region
  }
  get regionFull() {
    let c: string
    if ((c = persistedStateStore.getState().regionFull)) return c
    if (!this.#regionFull) {
      const lc = this.getLogContent()
      const matches = lc.match(Patterns.GetRegionFull)
      if (!matches) {
        logger.warn('Failed to find full region')
        return 'na-1'
      }
      this.#regionFull = matches[1]
      logger.debug('Found valorant full region', this.#regionFull)
    }
    if (this.#regionFull)
      persistedStateStore.setState((e) => ({
        ...e,
        regionFull: this.#regionFull,
      }))
    return this.#regionFull
  }
  get version() {
    let c: string
    if ((c = persistedStateStore.getState().version)) return c
    if (!this.#version) {
      const lc = this.getLogContent()
      const matches = lc.match(Patterns.GetVersion)
      if (!matches) {
        logger.warn('Failed to find version')
        return null
      }
      // release-(MAJ).(MIN)-(\d{2})-(\d{6})
      let version_ = matches[1].split('-')

      // needs to be release-(MAJ).(MIN)-shipping-(\d{2})-(\d{6})
      version_.splice(2, 0, 'shipping')
      this.#version = version_.join('-')

      logger.debug('Found valorant version', this.#version)
    }
    if (this.#version)
      persistedStateStore.setState((e) => ({ ...e, version: this.#version }))
    return this.#version
  }
}

const valorant = new Valorant()

export default valorant
