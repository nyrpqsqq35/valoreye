import { VAPlayerCard } from '../types'
import Cache from './Cache'

export default class PlayerCardsCache extends Cache<VAPlayerCard> {
  constructor() {
    super('playercards', true)
  }
}
