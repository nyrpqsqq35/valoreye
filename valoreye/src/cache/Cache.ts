import fetch from 'node-fetch'
import { UUID, VAObject } from '../types'

import { createLogger } from '~/util/logger'
import crypto from 'crypto'

const logger = createLogger('Cache')

export default class Cache<ItemType extends VAObject> {
  #retrievedAll = false

  entity: string
  collection: Map<UUID, ItemType> = new Map()
  key: keyof ItemType = 'uuid'

  constructor(entity: string, loadAll = false, key: keyof ItemType = 'uuid') {
    this.entity = entity
    this.key = key
    if (loadAll) this.getAll()
  }

  async retrieveFromNetwork(uuid: UUID): Promise<ItemType> {
    const url = `https://valorant-api.com/v1/${this.entity}/${uuid}`,
      res = await fetch(url),
      json = await res.json()
    logger.debug(url, '=>', res.statusText)
    if (json.status !== 200) {
      // Valorant-API doesnt auto-update anymore :)))))))))))))))
      if (this.entity !== 'playercards') {
        // throw new Error(`Failed to retrieve ${uuid} for ${this.entity}`)
      }
    }
    return json.data as ItemType
  }

  async retrieveAllFromNetwork(): Promise<ItemType[]> {
    const url = `https://valorant-api.com/v1/${this.entity}`,
      res = await fetch(url),
      json = await res.json()
    logger.debug(url, '=>', res.statusText)
    if (json.status !== 200)
      throw new Error(`Failed to retrieve ${this.entity} items`)
    if (!Array.isArray(json.data))
      throw new Error(`Failed to retrieve ${this.entity} items`)
    return json.data as ItemType[]
  }

  async get(uuid: UUID, force = false): Promise<ItemType> {
    if (this.collection.has(uuid) && !force) return this.collection.get(uuid)!

    const item = await this.retrieveFromNetwork(uuid)
    this.collection.set(uuid, item)
    return item
  }

  async getAll(): Promise<ItemType[]> {
    if (!this.#retrievedAll) {
      const items = await this.retrieveAllFromNetwork()
      for (const item of items) {
        this.collection.set(item[this.key] as any as UUID, item)
      }
      this.#retrievedAll = true
      logger.debug(
        `Retrieved all items (${this.collection.size}) for ${this.constructor.name}`,
      )
      return items
    }

    return Array.from(this.collection.entries(), (y) => y[1])
  }

  filter(
    pred: (value: ItemType, index: number, array: ItemType[]) => any,
  ): ItemType[] {
    const i: ItemType[] = [...this.collection.values()].filter(pred)
    return i
  }

  randomItem(): ItemType {
    const keys = [...this.collection.keys()]
    const r = (crypto.randomBytes(2).readUInt16LE() / 2) | 0
    return this.collection.get(keys[r % keys.length])!
  }
}
