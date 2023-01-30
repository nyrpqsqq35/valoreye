// Share JS objects over WebSocket between webapp and server and caches them
// if the server is unreachable

export type Key = string | number | Date | BufferSource | Key[]

abstract class BackingStorage {
  constructor() {}
  public abstract open(): Promise<boolean>
  public abstract get<T = any>(key: Key): Promise<T | undefined>
  public abstract set<T = any>(key: Key, value: T): Promise<void>
  public static supported: boolean
}

class IDBBackend extends BackingStorage {
  private databaseName: string
  private storeName = 'kv_store'
  private db?: IDBDatabase
  constructor(databaseName: string = 'sc0') {
    super()
    this.databaseName = databaseName
  }

  public open() {
    return new Promise<boolean>((resolve, reject) => {
      const req = indexedDB.open(this.databaseName)
      req.addEventListener('error', e => {
        const tgt = e.target as any
        reject(new Error(`indexeddb error: ${tgt.errorCode}`))
      })
      req.addEventListener('success', e => {
        const db = (e.target as any).result as IDBDatabase
        this.updateDatabase(db)

        console.log('Success opening')
        resolve(true)
      })
      req.addEventListener('blocked', e => {
        reject(new Error('Close other tabs, please'))
      })
      req.addEventListener('upgradeneeded', e => {
        const db = (e.target as any).result as IDBDatabase
        const cache = db.createObjectStore(this.storeName, { keyPath: 'key' })
        cache.transaction.oncomplete = _ => {
          this.updateDatabase(db)
          resolve(true)
        }
      })
    })
  }
  public get<T = any>(key: Key): Promise<T | undefined> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('Database is not ready'))
      const req = this.db
        .transaction(this.storeName)
        .objectStore(this.storeName)
        .get(key)
      req.onerror = _ =>
        reject(new Error('Error while retrieving data from IndexedDB'))
      req.onsuccess = e => {
        if (!e.target)
          throw new TypeError(
            'Missing EventTarget on IDBRequest "success" event'
          )
        resolve((e.target as any).result.value as T)
      }
    })
  }
  public set<T = any>(key: Key, value: T): Promise<void> {
    return new Promise(async (resolve, reject) => {
      if (!this.db) return reject(new Error('Database is not ready'))
      const req = this.db
        .transaction(this.storeName, 'readwrite')
        .objectStore(this.storeName)
        .put({ key, value })
      req.onerror = _ =>
        reject(new Error('Error while setting data in IndexedDB'))
      req.onsuccess = _ => {
        resolve()
      }
    })
  }
  public static get supported() {
    return 'indexedDB' in window
  }

  private updateDatabase(db: IDBDatabase) {
    this.db = db
    this.db.onversionchange = this.onVersionChange
  }

  private onVersionChange = (e: IDBVersionChangeEvent) => {
    this.db?.close()
    throw new Error('Please reload page')
  }
}

export interface ISharedCache {
  storage: BackingStorage | undefined
  initialized: boolean
  init(): Promise<void>
  get<T = any>(key: Key): Promise<T | undefined>
  set<T = any>(key: Key, value: T): Promise<void>
}

export const sharedCache: ISharedCache = {
  storage: undefined,
  initialized: false,
  async init() {
    if (!IDBBackend.supported) return
    if (this.initialized) return
    this.storage = new IDBBackend()
    await this.storage.open()
    this.initialized = true
  },
  async get<T = any>(key: Key): Promise<T | undefined> {
    if (!this.storage || !this.initialized) await this.init()
    return this.storage!.get<T>(key)
  },
  async set<T = any>(key: Key, value: T): Promise<void> {
    if (!this.storage || !this.initialized) await this.init()
    return this.storage!.set<T>(key, value)
  },
}

// export class LSBackend extends BackingStorage {}
