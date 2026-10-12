import { api } from './client'
import type { ExerciseInfo, ExerciseInfoList, MuscleGroup } from './types'

export interface BrowseParams {
  group?: MuscleGroup
  q?: string
  category?: string
  skip?: number
  limit?: number
}

export const exerciseLibraryApi = {
  async browse(params: BrowseParams, signal?: AbortSignal) {
    const { data } = await api.get<ExerciseInfoList>('/exercise-library', { params, signal })
    return data
  },

  /** The library entry for a name typed in a workout; null if nothing matches. */
  async match(name: string) {
    try {
      const { data } = await api.get<ExerciseInfo>('/exercise-library/match', { params: { name } })
      return data
    } catch (err) {
      if ((err as { response?: { status?: number } }).response?.status === 404) return null
      throw err
    }
  },
}
