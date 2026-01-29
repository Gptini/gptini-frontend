import { create } from 'zustand'
import { Client } from '@stomp/stompjs'
import type { IMessage, StompSubscription } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import type { ChatMessage, RoomUpdate, SendMessageRequest } from '../types'

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:8080/ws'

interface ChatState {
  // WebSocket 상태
  isConnected: boolean
  client: Client | null

  // 채팅방 목록 실시간 데이터
  roomUpdates: Map<number, RoomUpdate>

  // 현재 보고 있는 방
  currentRoomId: number | null
  messages: ChatMessage[]

  // 구독 관리
  subscriptions: Map<string, StompSubscription>

  // Actions
  connect: (userId: number) => void
  disconnect: () => void
  subscribeToUserRooms: (userId: number) => void
  subscribeToRoom: (roomId: number, onMessage: (message: ChatMessage) => void) => void
  subscribeToReadStatus: (roomId: number, onReadStatus: (data: { userId: number; messageId: number }) => void) => void
  unsubscribeFromRoom: (roomId: number) => void
  setCurrentRoom: (roomId: number | null) => void
  setMessages: (messages: ChatMessage[]) => void
  addMessage: (message: ChatMessage) => void
  sendMessage: (roomId: number, request: SendMessageRequest) => void
  markAsRead: (roomId: number, messageId: number) => void
  updateRoomData: (roomId: number, update: RoomUpdate) => void
  clearRoomUpdate: (roomId: number) => void
}

export const useChatStore = create<ChatState>((set, get) => ({
  isConnected: false,
  client: null,
  roomUpdates: new Map(),
  currentRoomId: null,
  messages: [],
  subscriptions: new Map(),

  connect: (userId: number) => {
    const { client: existingClient } = get()
    // 이미 연결되었거나 연결 시도 중이면 무시
    if (existingClient?.active) {
      console.log('[STOMP] Already active, skipping connect')
      return
    }

    const token = localStorage.getItem('accessToken')
    console.log('[STOMP] Connecting...', { userId, hasToken: !!token })

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,

      onConnect: () => {
        console.log('[STOMP] Connected')
        set({ isConnected: true })

        // 유저별 룸 업데이트 토픽 구독
        get().subscribeToUserRooms(userId)
      },

      onDisconnect: () => {
        console.log('[STOMP] Disconnected')
        set({ isConnected: false })
      },

      onStompError: (frame) => {
        console.error('[STOMP] Error:', frame.headers['message'])
      },

      onWebSocketError: (event) => {
        console.error('[WebSocket] Error:', event)
      },
    })

    set({ client })
    client.activate()
  },

  disconnect: () => {
    const { client, subscriptions } = get()

    // 모든 구독 해제
    subscriptions.forEach((sub) => sub.unsubscribe())

    if (client) {
      client.deactivate()
    }

    set({
      client: null,
      isConnected: false,
      subscriptions: new Map(),
      roomUpdates: new Map(),
      currentRoomId: null,
      messages: [],
    })
  },

  subscribeToUserRooms: (userId: number) => {
    const { client, subscriptions } = get()
    if (!client?.connected) return

    const topic = `/sub/users/${userId}/rooms`
    if (subscriptions.has(topic)) return

    console.log('[STOMP] Subscribing to:', topic)
    const subscription = client.subscribe(topic, (message: IMessage) => {
      const roomUpdate: RoomUpdate = JSON.parse(message.body)
      console.log('[STOMP] Room update received:', roomUpdate)
      get().updateRoomData(roomUpdate.roomId, roomUpdate)
    })

    set({ subscriptions: new Map(subscriptions).set(topic, subscription) })
  },

  subscribeToRoom: (roomId: number, onMessage: (message: ChatMessage) => void) => {
    const { client, subscriptions } = get()
    if (!client?.connected) return

    const topic = `/sub/chat/rooms/${roomId}`
    if (subscriptions.has(topic)) return

    const subscription = client.subscribe(topic, (message: IMessage) => {
      const chatMessage: ChatMessage = JSON.parse(message.body)
      onMessage(chatMessage)
    })

    set({ subscriptions: new Map(subscriptions).set(topic, subscription) })
  },

  subscribeToReadStatus: (roomId: number, onReadStatus: (data: { userId: number; messageId: number }) => void) => {
    const { client, subscriptions } = get()
    if (!client?.connected) return

    const topic = `/sub/chat/rooms/${roomId}/read`
    if (subscriptions.has(topic)) return

    const subscription = client.subscribe(topic, (message: IMessage) => {
      const data = JSON.parse(message.body)
      onReadStatus(data)
    })

    set({ subscriptions: new Map(subscriptions).set(topic, subscription) })
  },

  unsubscribeFromRoom: (roomId: number) => {
    const { subscriptions } = get()
    const newSubscriptions = new Map(subscriptions)

    const messageTopic = `/sub/chat/rooms/${roomId}`
    const readTopic = `/sub/chat/rooms/${roomId}/read`

    if (newSubscriptions.has(messageTopic)) {
      newSubscriptions.get(messageTopic)?.unsubscribe()
      newSubscriptions.delete(messageTopic)
    }

    if (newSubscriptions.has(readTopic)) {
      newSubscriptions.get(readTopic)?.unsubscribe()
      newSubscriptions.delete(readTopic)
    }

    set({ subscriptions: newSubscriptions })
  },

  setCurrentRoom: (roomId: number | null) => {
    set({ currentRoomId: roomId, messages: [] })
  },

  setMessages: (messages: ChatMessage[]) => {
    set({ messages })
  },

  addMessage: (message: ChatMessage) => {
    set((state) => ({
      messages: [...state.messages, message],
    }))
  },

  sendMessage: (roomId: number, request: SendMessageRequest) => {
    const { client } = get()
    if (client?.connected) {
      client.publish({
        destination: `/pub/chat/rooms/${roomId}`,
        body: JSON.stringify(request),
      })
    }
  },

  markAsRead: (roomId: number, messageId: number) => {
    const { client } = get()
    if (client?.connected) {
      client.publish({
        destination: `/pub/chat/rooms/${roomId}/read`,
        body: JSON.stringify({ messageId }),
      })
    }
  },

  updateRoomData: (roomId: number, update: RoomUpdate) => {
    set((state) => {
      const newRoomUpdates = new Map(state.roomUpdates)
      newRoomUpdates.set(roomId, update)
      return { roomUpdates: newRoomUpdates }
    })
  },

  clearRoomUpdate: (roomId: number) => {
    set((state) => {
      const newRoomUpdates = new Map(state.roomUpdates)
      newRoomUpdates.delete(roomId)
      return { roomUpdates: newRoomUpdates }
    })
  },
}))

export default useChatStore
