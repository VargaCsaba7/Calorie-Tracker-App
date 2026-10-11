import { api } from './client'
import type { DailyNutritionSummary, ListParams, Meal, MealFromFoodInput, MealInput, MealUpdate } from './types'

export const mealsApi = {
  async list(params?: ListParams) {
    const { data } = await api.get<Meal[]>('/meals', { params })
    return data
  },

  /** Daily totals; defaults to today on the server if no date is given. */
  async summary(date?: string) {
    const { data } = await api.get<DailyNutritionSummary>('/meals/summary', {
      params: date ? { date } : undefined,
    })
    return data
  },

  async create(payload: MealInput | MealFromFoodInput) {
    const { data } = await api.post<Meal>('/meals', payload)
    return data
  },

  async update(id: number, payload: MealUpdate) {
    const { data } = await api.patch<Meal>(`/meals/${id}`, payload)
    return data
  },

  async remove(id: number) {
    await api.delete(`/meals/${id}`)
  },
}
