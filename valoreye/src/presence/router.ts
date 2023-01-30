import { ClientConfigUrl } from '../constants'
import express from 'express'
import fetch from 'node-fetch'
import { createLogger } from '~/util/logger'
import jwt from 'jsonwebtoken'
import { Ports } from '~/util/ports'

import type { Router } from 'express'
import { persistedStateStore } from '~/store/persistedState'

const presenceRouter: Router = express.Router()
const logger = createLogger('ConfigProxy')

interface IReplacer {
  key: string
  replacer: (value: any, config: any) => any
}
function cr(key: string, value: any): IReplacer {
  return {
    key,
    replacer: (_) => value,
  }
}
function updateConfig(
  config: any,
  replacers: IReplacer[]
): Record<string, any> {
  const originalValues = {}
  for (const rep of replacers) {
    if (typeof config[rep.key] === 'undefined') continue
    originalValues[rep.key] = config[rep.key]
    config[rep.key] = rep.replacer(config[rep.key], config)
    // logger.debug(
    //   'overwrote',
    //   rep.key,
    //   'old =',
    //   originalValues[rep.key],
    //   'new =',
    //   config[rep.key]
    // )
  }
  return originalValues
}

// https://cs.github.com/molenzwiebel/Deceive/blob/master/Deceive/ConfigProxy.cs
presenceRouter.use(async (req, res, next) => {
  logger.debug(req.method, req.originalUrl)
  let headers = { ...req.headers } as Record<string, string>
  delete headers['accept-encoding']
  delete headers['host']
  const or = await fetch(`${ClientConfigUrl}/${req.originalUrl}`, {
    method: req.method,
    headers,
    body: req.body,
  })
  let ore = await or.text()

  const NEW_CHAT_HOST = 'localhost',
    NEW_CHAT_PORT = Ports.chatServer,
    NEW_CHAT_TLS = true
  let chatHost = '',
    chatPort = 0,
    chatTls = true

  try {
    const config = JSON.parse(ore)

    // logger.debug(config)

    const oldValues = updateConfig(config, [
      cr('chat.allow_bad_cert.enabled', true),
      cr('chat.host', NEW_CHAT_HOST),
      cr('chat.port', NEW_CHAT_PORT),
      cr('chat.use_tls.enabled', NEW_CHAT_TLS),
      {
        key: 'chat.affinities',
        replacer: (v) => {
          let y = {}
          for (const key in v) {
            y[key] = NEW_CHAT_HOST
          }
          return y
        },
      },
      // cr('valorant.client.config_endpoint', sharedConfigEp),
      // {
      //   key: 'valorant.client.config_endpoint_by_affinity',
      //   replacer: (v) => {
      //     let y = {}
      //     for (const key in v) {
      //       y[key] = sharedConfigEp
      //     }
      //     return y
      //   },
      // },
    ])

    chatHost = oldValues['chat.host'] || chatHost
    chatPort = oldValues['chat.port'] || chatPort
    chatTls =
      typeof oldValues['chat.use_tls.enabled'] === 'boolean'
        ? oldValues['chat.use_tls.enabled']
        : chatTls
    persistedStateStore.setState((e) => ({
      ...e,
      chatContext: {
        ...e.chatContext,
        host: chatHost || e.chatContext.host,
        port: chatPort || e.chatContext.port,
        secure: typeof chatTls === 'boolean' ? chatTls : e.chatContext.secure,
      },
    }))

    if (req.headers.authorization && oldValues['chat.affinities']) {
      const r = await fetch(
        'https://riot-geo.pas.si.riotgames.com/pas/v1/service/chat',
        {
          headers: {
            Authorization: req.headers.authorization,
          },
        }
      )
      const j = await r.text()
      const dec = jwt.decode(j)
      if (typeof dec !== 'string') {
        const { affinity } = dec as any
        let newHost = oldValues['chat.affinities'][affinity] || chatHost
        chatHost = newHost
        persistedStateStore.setState((e) => ({
          ...e,
          chatContext: {
            ...e.chatContext,
            host: newHost,
          },
        }))
        logger.debug(
          'Found affinity, new chat host is',
          newHost,
          'affinity is',
          affinity
        )
      }
    }
    ore = JSON.stringify(config)

    // ore = ore.replace(
    //   /-config-endpoint=https:\/\/shared\.na\.a\.pvp\.net/gi,
    //   "-LogCmds='LogD3D11RHI off'"
    // )
  } catch (err) {}

  // charles
  for (const [k, v] of or.headers) {
    if (['connection', 'content-encoding'].includes(k)) continue
    res.setHeader(k, v)
  }
  res.statusMessage = or.statusText
  res.status(or.status).send(ore)
})

export default presenceRouter
