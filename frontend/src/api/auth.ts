import { api } from './client'
import type { RegisterPayload, Token, User, UserUpdate } from './types'

export const authApi = {
  async login(username: string, password: string) {
    // The OAuth2 password flow expects form data, not JSON.
    const form = new URLSearchParams({ username, password })
    const { data } = await api.post<Token>('/auth/login', form)
    return data
  },

  async register(payload: RegisterPayload) {
    const { data } = await api.post<User>('/auth/register', payload)
    return data
  },

  async getMe() {
    const { data } = await api.get<User>('/users/me')
    return data
  },

  async updateMe(payload: UserUpdate) {
    const { data } = await api.patch<User>('/users/me', payload)
    return data
  },
}
