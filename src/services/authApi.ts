import apiClient from './apiClient'
import type { ApiResponse, LoginRequest, SignUpRequest, SignUpResponse, TokenResponse, User } from '../types'

export const authApi = {
  login: async (data: LoginRequest): Promise<TokenResponse> => {
    const response = await apiClient.post<ApiResponse<TokenResponse>>('/api/v1/auth/login', data)
    return response.data.data
  },

  signUp: async (data: SignUpRequest): Promise<SignUpResponse> => {
    const response = await apiClient.post<ApiResponse<SignUpResponse>>('/api/v1/auth/signup', data)
    return response.data.data
  },

  refreshToken: async (refreshToken: string): Promise<TokenResponse> => {
    const response = await apiClient.post<ApiResponse<TokenResponse>>('/api/v1/auth/refresh-token', {
      refreshToken,
    })
    return response.data.data
  },

  getMe: async (): Promise<User> => {
    const response = await apiClient.get<ApiResponse<User>>('/api/v1/users/me')
    return response.data.data
  },
}

export default authApi
