import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { authApi } from '../api/auth'
import { setUnauthorizedHandler } from '../api/client'
import type { RegisterPayload, User } from '../api/types'
import { tokenStorage } from '../lib/token'
import { AuthContext } from './AuthContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(() => tokenStorage.get() !== null)

  // On startup, turn a stored token back into a user (or drop it if it expired).
  useEffect(() => {
    if (!tokenStorage.get()) return
    authApi
      .getMe()
      .then(setUser)
      .catch(() => tokenStorage.clear())
      .finally(() => setIsLoading(false))
  }, [])

  // Any 401 from the API (e.g. expired token) logs the user out.
  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null))
    return () => setUnauthorizedHandler(null)
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    const { access_token } = await authApi.login(username, password)
    tokenStorage.set(access_token)
    setUser(await authApi.getMe())
  }, [])

  const register = useCallback(
    async (payload: RegisterPayload) => {
      await authApi.register(payload)
      await login(payload.username, payload.password)
    },
    [login],
  )

  const logout = useCallback(() => {
    tokenStorage.clear()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, isLoading, login, register, logout, setUser }),
    [user, isLoading, login, register, logout],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
