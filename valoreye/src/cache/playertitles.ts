import { VAPlayerTitle } from '../types'
import Cache from './Cache'

export default class PlayerTitlesCache extends Cache<VAPlayerTitle> {
  constructor() {
    super('playertitles', true)
  }
}
