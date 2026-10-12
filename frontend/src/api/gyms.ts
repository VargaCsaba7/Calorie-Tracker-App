import { api } from './client'
import type { GymSearchResult } from './types'

export const gymsApi = {
  /** The public map data service can be slow when busy, so this allows up to a minute. */
  async nearby(lat: number, lon: number, radiusM: number) {
    const { data } = await api.get<GymSearchResult>('/gyms/nearby', {
      params: { lat, lon, radius_m: radiusM },
      timeout: 70_000,
    })
    return data
  },
}
