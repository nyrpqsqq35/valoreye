// https://cs.github.com/electron/asar/blob/main/lib/filesystem.js

import {
  DirectoryMetadata,
  DirectoryRecord,
  EntryMetadata,
} from '@electron/asar'
import path from 'path/posix'

export class Filesystem {
  src: string
  header: DirectoryRecord = { files: {} }
  headerSize: number
  offset = 0n
  constructor(src: string) {
    this.src = path.resolve(src)
  }

  searchNodeFromDirectory(p: string): EntryMetadata {
    let json = this.header as any
    const dirs = p.split(path.sep)
    for (const dir of dirs) {
      if (dir !== '.') {
        if (!json.files[dir]) {
          json.files[dir] = { files: {} }
        }
        json = json.files[dir]
      }
    }
    return json
  }
  getNode(p: string) {
    const node = this.searchNodeFromDirectory(path.dirname(p))
    const name = path.basename(p)
    if (name) {
      return (node as DirectoryMetadata).files[name]
    } else {
      return node
    }
  }
  getFile(p: string, followLinks = true) {
    const info = this.getNode(p)
    if ((info as any).link && followLinks) {
      return this.getFile((info as any).link)
    } else {
      return info
    }
  }
}
