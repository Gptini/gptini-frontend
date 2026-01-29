import axios from 'axios'
import type { AxiosError, InternalAxiosRequestConfig } from 'axios'
import useErrorStore from '../stores/errorStore'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 에러 모달 표시 함수
const showErrorModal = (status: number, message?: string) => {
  const { showError } = useErrorStore.getState()

  if (status >= 500) {
    showError('서버 오류', '서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.')
  } else if (status === 400) {
    showError('요청 오류', message || '잘못된 요청입니다.')
  } else if (status === 403) {
    showError('접근 거부', message || '접근 권한이 없습니다.')
  } else if (status === 404) {
    showError('찾을 수 없음', message || '요청한 정보를 찾을 수 없습니다.')
  } else if (status !== 401) {
    // 401은 토큰 갱신 로직에서 처리하므로 제외
    showError('오류', message || '요청 처리 중 문제가 발생했습니다.')
  }
}

// Request interceptor - 토큰 추가
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor - 에러 처리 & 토큰 갱신
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ success: boolean; message?: string }>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
    const status = error.response?.status || 0
    const message = error.response?.data?.message

    // 401 에러 & 재시도 안 한 경우 토큰 갱신 시도
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      const refreshToken = localStorage.getItem('refreshToken')
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_URL}/api/v1/auth/refresh-token`, {
            refreshToken,
          })

          const { accessToken, refreshToken: newRefreshToken } = response.data.data
          localStorage.setItem('accessToken', accessToken)
          localStorage.setItem('refreshToken', newRefreshToken)

          originalRequest.headers.Authorization = `Bearer ${accessToken}`
          return apiClient(originalRequest)
        } catch {
          // 토큰 갱신 실패 - 로그아웃 처리
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          window.location.href = '/login'
          return Promise.reject(error)
        }
      }
    }

    // 에러 모달 표시
    showErrorModal(status, message)

    return Promise.reject(error)
  }
)

export default apiClient
