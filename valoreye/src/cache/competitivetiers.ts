import { VACompetitiveTier } from '../types'
import Cache from './Cache'

export default class CompetitiveTiersCache extends Cache<VACompetitiveTier> {
  constructor() {
    super('competitivetiers')
  }
}
