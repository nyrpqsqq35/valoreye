import { ClientConfigUrl, SharedConfigUrl } from '../constants'
import express from 'express'
import fetch from 'node-fetch'
import { createLogger } from '~/util/logger'
import jwt from 'jsonwebtoken'
import { Ports } from '~/util/ports'

import type { Router } from 'express'

const sharedConfigRouter: Router = express.Router()
const logger = createLogger('ConfigProxy2')

sharedConfigRouter.use(async (req, res, next) => {
  logger.debug(req.method, req.originalUrl)
  let headers = { ...req.headers } as Record<string, string>
  delete headers['accept-encoding']
  delete headers['host']
  const or = await fetch(`${SharedConfigUrl}/${req.originalUrl}`, {
    method: req.method,
    headers,
    body: req.body,
  })
  let ore = await or.text()

  try {
    const config = JSON.parse(ore)
    // No
    ore = JSON.stringify(config)
  } catch (err) {}

  for (const [k, v] of or.headers) {
    if (['connection', 'content-encoding'].includes(k)) continue
    res.setHeader(k, v)
  }
  res.statusMessage = or.statusText
  res.status(or.status).send(ore)
})

export default sharedConfigRouter
