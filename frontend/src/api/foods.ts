import { api } from './client'
import type { Food, FoodEstimate, FoodSearchResult } from './types'

export const foodsApi = {
  async search(query: string, signal?: AbortSignal) {
    const { data } = await api.get<FoodSearchResult>('/foods/search', { params: { q: query }, signal })
    return data
  },

  async get(id: number) {
    const { data } = await api.get<Food>(`/foods/${id}`)
    return data
  },

  async aiEnabled() {
    const { data } = await api.get<{ enabled: boolean }>('/foods/ai-status')
    return data.enabled
  },

  /** The AI can take a few seconds; nothing is saved. */
  async estimate(description: string) {
    const { data } = await api.post<FoodEstimate>('/foods/estimate', { description }, { timeout: 60_000 })
    return data
  },
}
