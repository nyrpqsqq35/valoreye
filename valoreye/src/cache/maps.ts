import { VAMap } from '../types'
import Cache from './Cache'

export default class MapsCache extends Cache<VAMap> {
  constructor() {
    super('maps', true, 'mapUrl')
  }
}
