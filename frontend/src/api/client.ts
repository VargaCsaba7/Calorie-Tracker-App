import axios from 'axios'
import { tokenStorage } from '../lib/token'

export const api = axios.create({
  // In dev, Vite proxies /api to the backend (see vite.config.ts).
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  timeout: 10_000,
})

api.interceptors.request.use((config) => {
  const token = tokenStorage.get()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// The auth provider registers a callback here, so the client can trigger a
// logout on an expired token without importing anything from React.
let onUnauthorized: (() => void) | null = null

export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = error.config?.url === '/auth/login'
    if (axios.isAxiosError(error) && error.response?.status === 401 && !isLoginRequest) {
      tokenStorage.clear()
      onUnauthorized?.()
    }
    return Promise.reject(error)
  },
)
