import apiClient from './apiClient'
import type { ApiResponse } from '../types'

interface UploadResponse {
  url: string
  fileName: string
}

export const fileApi = {
  upload: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await apiClient.post<ApiResponse<UploadResponse>>('/api/v1/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data.data
  },
}

export default fileApi
