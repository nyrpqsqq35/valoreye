import { VALevelBorder } from '../types'
import Cache from './Cache'

export default class LevelBordersCache extends Cache<VALevelBorder> {
  constructor() {
    super('levelborders', true)
  }
}
