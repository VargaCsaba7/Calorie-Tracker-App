import { api } from './client'
import type { ListParams, RestDay, WeeklyStats, WeightEntry } from './types'

export const progressApi = {
  async restDays(params?: Pick<ListParams, 'date_from' | 'date_to'>) {
    const { data } = await api.get<RestDay[]>('/rest-days', { params })
    return data
  },

  async markRestDay(date: string) {
    await api.put(`/rest-days/${date}`)
  },

  async unmarkRestDay(date: string) {
    await api.delete(`/rest-days/${date}`)
  },

  async weights(params?: Pick<ListParams, 'date_from' | 'date_to'>) {
    const { data } = await api.get<WeightEntry[]>('/weights', { params })
    return data
  },

  /** Creates or replaces the weigh-in for that day. */
  async saveWeight(date: string, weightKg: number) {
    const { data } = await api.put<WeightEntry>(`/weights/${date}`, { weight_kg: weightKg })
    return data
  },

  async deleteWeight(date: string) {
    await api.delete(`/weights/${date}`)
  },

  async weeklyStats(weeks = 12) {
    const { data } = await api.get<WeeklyStats[]>('/stats/weekly', { params: { weeks } })
    return data
  },
}
