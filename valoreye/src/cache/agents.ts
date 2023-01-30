import { VAAgent } from '../types'
import Cache from './Cache'

export default class AgentsCache extends Cache<VAAgent> {
  constructor() {
    super('agents', true)
  }
}
