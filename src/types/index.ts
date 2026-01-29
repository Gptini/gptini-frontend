// User
export interface User {
  id: number
  email: string
  nickname: string
  profileImageUrl: string | null
  friendCode: string | null
}

// Auth
export interface TokenResponse {
  accessToken: string
  refreshToken: string
}

export interface SignUpResponse {
  user: User
  accessToken: string
  refreshToken: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface SignUpRequest {
  email: string
  password: string
  nickname: string
}

// Chat Room
export interface ChatRoom {
  id: number
  name: string
  type: 'PRIVATE' | 'GROUP'
  createdAt: string
  users: User[]
}

export interface ChatRoomListItem {
  id: number
  name: string
  type: 'PRIVATE' | 'GROUP'
  userCount: number
  lastMessage: string | null
  lastMessageSender: string | null
  lastMessageTime: string
  unreadCount: number
}

// Message
export type MessageType = 'TEXT' | 'IMAGE' | 'FILE' | 'GIF'

export interface ChatMessage {
  messageId: number
  roomId: number
  senderId: number
  senderNickname: string
  senderProfileImageUrl: string | null
  type: MessageType
  content: string | null
  fileUrl: string | null
  fileName: string | null
  createdAt: string
  unreadCount: number
}

export interface SendMessageRequest {
  type: MessageType
  content?: string
  fileUrl?: string
  fileName?: string
}

// Friend
export type FriendRequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED'

export interface FriendRequest {
  id: number
  requester: User
  status: FriendRequestStatus
  createdAt: string
}

export interface Friend {
  id: number
  email: string
  nickname: string
  profileImageUrl: string | null
  friendSince: string
}

// API Response
export interface ApiResponse<T> {
  success: boolean
  message: string | null
  data: T
}

// WebSocket Room Update
export interface RoomUpdate {
  type: 'ROOM_UPDATE'
  roomId: number
  lastMessage: string | null
  lastMessageTime: string
  lastMessageSenderId: number
  lastMessageSenderNickname: string
  unreadCount: number
}
