import apiClient from './apiClient'
import type { ApiResponse, User, FriendRequest, Friend } from '../types'

export const friendApi = {
  // 친구 코드로 유저 검색
  searchByCode: async (code: string): Promise<User> => {
    const response = await apiClient.get<ApiResponse<User>>('/api/v1/users/search', {
      params: { code },
    })
    return response.data.data
  },

  // 친구 요청 보내기
  sendRequest: async (friendCode: string): Promise<FriendRequest> => {
    const response = await apiClient.post<ApiResponse<FriendRequest>>('/api/v1/friend-requests', {
      friendCode,
    })
    return response.data.data
  },

  // 받은 친구 요청 목록
  getReceivedRequests: async (): Promise<FriendRequest[]> => {
    const response = await apiClient.get<ApiResponse<FriendRequest[]>>('/api/v1/friend-requests')
    return response.data.data
  },

  // 보낸 친구 요청 목록
  getSentRequests: async (): Promise<FriendRequest[]> => {
    const response = await apiClient.get<ApiResponse<FriendRequest[]>>('/api/v1/friend-requests/sent')
    return response.data.data
  },

  // 친구 요청 수락
  acceptRequest: async (requestId: number): Promise<void> => {
    await apiClient.put(`/api/v1/friend-requests/${requestId}/accept`)
  },

  // 친구 요청 거절
  rejectRequest: async (requestId: number): Promise<void> => {
    await apiClient.put(`/api/v1/friend-requests/${requestId}/reject`)
  },

  // 친구 목록
  getFriends: async (): Promise<Friend[]> => {
    const response = await apiClient.get<ApiResponse<Friend[]>>('/api/v1/friends')
    return response.data.data
  },

  // 친구 삭제
  deleteFriend: async (friendId: number): Promise<void> => {
    await apiClient.delete(`/api/v1/friends/${friendId}`)
  },
}

export default friendApi
