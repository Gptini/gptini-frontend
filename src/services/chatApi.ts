import apiClient from './apiClient'
import type { ApiResponse, ChatRoom, ChatRoomListItem, ChatMessage, User } from '../types'

export const chatApi = {
  // 채팅방 목록 조회
  getChatRooms: async (): Promise<ChatRoomListItem[]> => {
    const response = await apiClient.get<ApiResponse<ChatRoomListItem[]>>('/api/v1/chat/rooms')
    return response.data.data
  },

  // 채팅방 생성
  createRoom: async (name: string, userIds: number[]): Promise<ChatRoom> => {
    const response = await apiClient.post<ApiResponse<ChatRoom>>('/api/v1/chat/rooms', {
      name,
      userIds,
    })
    return response.data.data
  },

  // 채팅방 상세 조회
  getChatRoom: async (roomId: number): Promise<ChatRoom> => {
    const response = await apiClient.get<ApiResponse<ChatRoom>>(`/api/v1/chat/rooms/${roomId}`)
    return response.data.data
  },

  // 채팅방 나가기
  leaveRoom: async (roomId: number): Promise<void> => {
    await apiClient.delete(`/api/v1/chat/rooms/${roomId}/leave`)
  },

  // 채팅방 참여자 목록
  getRoomUsers: async (roomId: number): Promise<User[]> => {
    const response = await apiClient.get<ApiResponse<User[]>>(`/api/v1/chat/rooms/${roomId}/users`)
    return response.data.data
  },

  // 메시지 목록 조회 (페이징)
  getMessages: async (roomId: number, beforeId?: number, size = 50): Promise<ChatMessage[]> => {
    const params = new URLSearchParams({ size: String(size) })
    if (beforeId) {
      params.append('beforeId', String(beforeId))
    }
    const response = await apiClient.get<ApiResponse<ChatMessage[]>>(
      `/api/v1/chat/rooms/${roomId}/messages?${params}`
    )
    return response.data.data
  },

  // 읽음 처리
  updateLastRead: async (roomId: number, messageId: number): Promise<void> => {
    await apiClient.put(`/api/v1/chat/rooms/${roomId}/read`, { messageId })
  },
}

export default chatApi
