import express from 'express'
import path from 'path'
import presenceRouter from '~/presence/router'
import { createLogger } from '~/util/logger'
import { Ports } from '~/util/ports'
import sharedConfigRouter from '~/presence/sharedConfig'
import http from 'http'
import { wss } from './ws'
import { WebSocketMountPath } from '~/constants'
import cors from 'cors'
import { flagDis, getRuntimeOptions } from '~/util/runtime'
import { Flag } from '~/types'
import { execSync } from 'child_process'
import staticFiles from '../../dist/static.asar'
import { Pickle } from '~/util/pickle'
import { Filesystem } from '~/util/asar'
import type { DirectoryRecord } from '@electron/asar'
const app = express()

const logger = createLogger('Web')

const sfBuffer = Buffer.from(staticFiles.buffer)

app.get('/__valoreye/ports', cors(), (req, res) => {
  res.json({
    websocket: `ws://localhost:${Ports.webServer}${WebSocketMountPath}`,
  })
})

// :)
app.get('/__valoreye/opts', cors(), (req, res) => {
  res.json(getRuntimeOptions())
})

const BasePath = '/'
let fs_: Filesystem

function readAsar(): Filesystem {
  if (!fs_) {
    fs_ = new Filesystem(BasePath)
  }
  const sizeBuf = Buffer.alloc(8)
  sfBuffer.copy(sizeBuf, 0, 0, 8)

  const size = new Pickle(sizeBuf).createIterator().readUInt32()
  const headerBuf = Buffer.alloc(size)
  sfBuffer.copy(headerBuf, 0, 8, 8 + size)

  const hp = new Pickle(headerBuf)
  const strHeader = hp.createIterator().readString()

  const header = JSON.parse(strHeader) as DirectoryRecord
  fs_.header = header
  fs_.headerSize = size

  return fs_
}

app.disable('x-powered-by')

app.use('/api', presenceRouter)
app.use('/v1', sharedConfigRouter)

const SERVE_FROM_ASAR = BUILD_META.env === 'production'

const serveFromAsar = (url: string, res: express.Response) => {
  const fs = readAsar()
  const ext = path.extname(url)
  url = '.' + url

  let hf = fs.getFile(url, true)
  const offset = 8 + fs.headerSize + parseInt(hf.offset!)
  res.contentType(ext).send(sfBuffer.slice(offset, offset + hf.size!))
}

if (SERVE_FROM_ASAR) {
  app.use((req, res, next) => {
    try {
      let url = req.url
      serveFromAsar(url, res)
    } catch (err) {
      serveFromAsar('/index.html', res)
    }
  })
} else {
  app.use(express.static(path.join(__dirname, 'static')))
  app.use((req, res, next) => {
    res.sendFile(path.join(__dirname, 'static', 'index.html'))
  })
}

const server = http.createServer(app)
server.on('upgrade', (req, sock, head) => {
  if (
    !req.headers['origin'] ||
    req.headers['origin'].includes('@') ||
    !(
      req.headers['origin'].startsWith('http://localhost:') ||
      req.headers['origin'].startsWith('http://127.0.0.1:')
    )
  )
    return sock.end()
  wss.handleUpgrade(req, sock, head, (ws) => {
    wss.emit('connection', ws, req)
  })
})
export default function listenHttpServer(
  port = Ports.webServer
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      server.listen(port, () => {
        const url = `http://localhost:${port}/`

        logger.success(`Web UI accessible on ${url} (Ctrl+Click)`)

        // to disable auto launching:
        // -f NL
        if (flagDis(Flag.NO_AUTOLAUNCH)) execSync(`start ${url}`)
        resolve()
      })
    } catch (err) {
      if (err.code === 'EADDRINUSE') {
        logger.warn(
          'Port',
          port,
          'already in use, randomizing port and trying again...'
        )
        Ports.webServer = Ports.random()
        resolve(listenHttpServer())
      } else {
        reject(err)
      }
    }
  })
}
