import { Client } from '@stomp/stompjs'
import type { IMessage } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:8080/ws'

export interface StompClientOptions {
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: string) => void
}

export function createStompClient(options?: StompClientOptions): Client {
  const token = localStorage.getItem('accessToken')

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
      options?.onConnect?.()
    },

    onDisconnect: () => {
      console.log('[STOMP] Disconnected')
      options?.onDisconnect?.()
    },

    onStompError: (frame) => {
      console.error('[STOMP] Error:', frame.headers['message'])
      options?.onError?.(frame.headers['message'] || 'Unknown error')
    },

    onWebSocketError: (event) => {
      console.error('[WebSocket] Error:', event)
      options?.onError?.('WebSocket connection error')
    },
  })

  return client
}

// 메시지 구독 헬퍼
export function subscribeToRoom(
  client: Client,
  roomId: number,
  onMessage: (message: IMessage) => void
) {
  return client.subscribe(`/sub/chat/rooms/${roomId}`, onMessage)
}

// 읽음 상태 구독 헬퍼
export function subscribeToReadStatus(
  client: Client,
  roomId: number,
  onReadStatus: (message: IMessage) => void
) {
  return client.subscribe(`/sub/chat/rooms/${roomId}/read`, onReadStatus)
}

// 메시지 전송 헬퍼
export function publishMessage(
  client: Client,
  roomId: number,
  body: object
) {
  client.publish({
    destination: `/pub/chat/rooms/${roomId}`,
    body: JSON.stringify(body),
  })
}

// 읽음 상태 전송 헬퍼
export function publishReadStatus(
  client: Client,
  roomId: number,
  messageId: number
) {
  client.publish({
    destination: `/pub/chat/rooms/${roomId}/read`,
    body: JSON.stringify({ messageId }),
  })
}

export default createStompClient
