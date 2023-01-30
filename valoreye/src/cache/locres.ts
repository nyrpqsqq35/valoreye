import fetch from 'node-fetch'

export default class LocresCache {
  gamePodStrings: { [x: string]: string } = {}
  constructor() {
    this.getData()
  }

  async getData() {
    const res = await fetch('https://valorant-api.com/internal/locres/en-US')
    const json = await res.json()
    if (json.status !== 200) throw 'Failed to get locres data'
    this.gamePodStrings = json.data.UI_GamePodStrings
  }
}
