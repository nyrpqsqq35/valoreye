import { VASeason } from '../types'
import Cache from './Cache'

export default class SeasonsCache extends Cache<VASeason> {
  constructor() {
    super('seasons/competitive', true, 'seasonUuid')
  }
}
