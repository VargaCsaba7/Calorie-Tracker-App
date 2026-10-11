import { createContext } from 'react'
import type { RegisterPayload, User } from '../api/types'

export interface AuthContextValue {
  user: User | null
  /** True while the stored token is being checked on startup. */
  isLoading: boolean
  login: (username: string, password: string) => Promise<void>
  register: (payload: RegisterPayload) => Promise<void>
  logout: () => void
  setUser: (user: User) => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
