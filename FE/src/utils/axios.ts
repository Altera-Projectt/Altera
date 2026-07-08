import axios from 'axios'
import type { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/store/authStore'

/**
 * Singleton Axios instance for all ALTERA API calls.
 * - Reads base URL from VITE_API_URL env var
 * - Automatically injects JWT token from authStore
 * - Handles 401 → auto logout
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api/v1',
  timeout: 25_000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ── Request interceptor: attach token ──────────────────────────────────────
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: AxiosError) => Promise.reject(error),
)

// ── Response interceptor: handle auth errors ───────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired or invalid → clear auth state
      useAuthStore.getState().logout()
      // Redirect to login (avoid direct window.location in hooks/components)
      if (window.location.pathname !== '/auth/login') {
        window.location.href = '/auth/login'
      }
    }
    return Promise.reject(error)
  },
)

export default api
