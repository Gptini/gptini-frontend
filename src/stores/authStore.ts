import { create } from 'zustand'
import type { User } from '../types'
import authApi from '../services/authApi'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean

  // Actions
  login: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, nickname: string) => Promise<void>
  logout: () => void
  fetchMe: () => Promise<void>
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: !!localStorage.getItem('accessToken'),
  isLoading: false,

  login: async (email, password) => {
    set({ isLoading: true })
    try {
      const { accessToken, refreshToken } = await authApi.login({ email, password })
      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', refreshToken)

      const user = await authApi.getMe()
      set({ user, isAuthenticated: true })
    } finally {
      set({ isLoading: false })
    }
  },

  signUp: async (email, password, nickname) => {
    set({ isLoading: true })
    try {
      const { user, accessToken, refreshToken } = await authApi.signUp({ email, password, nickname })
      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', refreshToken)
      set({ user, isAuthenticated: true })
    } finally {
      set({ isLoading: false })
    }
  },

  logout: () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    set({ user: null, isAuthenticated: false })
  },

  fetchMe: async () => {
    set({ isLoading: true })
    try {
      const user = await authApi.getMe()
      set({ user })
    } catch {
      // 토큰이 유효하지 않으면 로그아웃
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      set({ user: null, isAuthenticated: false })
    } finally {
      set({ isLoading: false })
    }
  },

  initialize: async () => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      try {
        const user = await authApi.getMe()
        set({ user, isAuthenticated: true })
      } catch {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        set({ user: null, isAuthenticated: false })
      }
    }
  },
}))

export default useAuthStore
