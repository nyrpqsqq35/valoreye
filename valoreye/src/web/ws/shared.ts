import riot from '~/interaction/riot'
import { Flag, OpCode, Preferences } from '~/types'
import { createLogger } from '~/util/logger'
import { flagDis } from '~/util/runtime'
import { setPreferences } from '../prefs'
import { publish } from './nws'

const logger = createLogger('Web')

export async function messageHandler(
  message: Buffer | ArrayBuffer | Buffer[],
  isBinary: boolean
) {
  if (Array.isArray(message)) message = Buffer.concat(message)
  try {
    if (isBinary) throw 'Is binary'
    const p = JSON.parse(Buffer.from(message).toString()) as {
      op: OpCode
      p: any
    }
    switch (p.op) {
      case OpCode.PREFERENCES:
        {
          let prefs = JSON.parse(p.p) as Preferences
          setPreferences(prefs)
          logger.info('Received preferences')
        }
        break
      case OpCode.INVITE_PLAYER:
        {
          if (flagDis(Flag.PARTY_INVITE)) return
          let [username, tag] = p.p
          logger.info('Inviting', username + '#' + tag, 'to party...')
          await riot.inviteToParty(username, tag)
        }
        break
      case OpCode.ADD_FRIEND:
        {
          if (flagDis(Flag.ADD_FRIEND)) return
          let [username, tag] = p.p
          logger.info('Adding', username + '#' + tag, 'as a friend...')
          await riot.addFriend(username, tag)
        }
        break
      case OpCode.QUIT_PREGAME:
        {
          try {
            logger.debug('Quitting pregame')
            await riot.quitPreGame(await riot.getPregameMatchId())
          } catch (err) {}
        }
        break
      case OpCode.DISASSOCIATE_COREGAME:
        {
          try {
            logger.debug('Disassociating')
            await riot.disassociate(await riot.getCoregameMatchId())
          } catch (err) {}
        }
        break
      case OpCode.VPREF_UPDATED:
        {
          try {
            publish(OpCode.VPREF_UPDATED, (await riot.getSettings()).data)
          } catch (err) {
            logger.error(
              'Error while sending VALORANT preferences to webapp',
              err
            )
          }
        }
        break
      case OpCode.SET_VPREF:
        {
          if (!Flag.PREF_EDITOR) break
          try {
            logger.info('Updating VALORANT preferences')
            const res = await riot.setSettings(p.p)
            if (!res.data)
              throw 'Missing data, probably not updated successfully ):'
            logger.success(
              'Updated VALORANT preferences successfully! You must close your game IMMEDIATELY or they will be overwrote'
            )
          } catch (err) {
            logger.error('Error while updating VALORANT preferences', err)
          }
        }
        break
    }
    logger.debug('Received over WebSocket:', p)
  } catch (err) {
    logger.error('Unhandled WebSocket recv error:', err.toString())
  }
}
