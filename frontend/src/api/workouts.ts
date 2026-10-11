import { api } from './client'
import type { ListParams, Workout, WorkoutInput, WorkoutUpdate } from './types'

export const workoutsApi = {
  async list(params?: ListParams) {
    const { data } = await api.get<Workout[]>('/workouts', { params })
    return data
  },

  async get(id: number) {
    const { data } = await api.get<Workout>(`/workouts/${id}`)
    return data
  },

  async create(payload: WorkoutInput) {
    const { data } = await api.post<Workout>('/workouts', payload)
    return data
  },

  async update(id: number, payload: WorkoutUpdate) {
    const { data } = await api.patch<Workout>(`/workouts/${id}`, payload)
    return data
  },

  async remove(id: number) {
    await api.delete(`/workouts/${id}`)
  },
}
