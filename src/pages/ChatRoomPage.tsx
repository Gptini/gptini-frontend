import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import MessageItem from '../components/chat/MessageItem'
import MessageInput from '../components/chat/MessageInput'
import chatApi from '../services/chatApi'
import fileApi from '../services/fileApi'
import useAuthStore from '../stores/authStore'
import useChatStore from '../stores/chatStore'
import type { ChatMessage, ChatRoom, SendMessageRequest } from '../types'
import styles from './ChatRoomPage.module.css'

export default function ChatRoomPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const {
    isConnected,
    connect,
    subscribeToRoom,
    subscribeToReadStatus,
    unsubscribeFromRoom,
    sendMessage: storeSendMessage,
    markAsRead: storeMarkAsRead,
    clearRoomUpdate,
  } = useChatStore()

  const [room, setRoom] = useState<ChatRoom | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const isInitialLoad = useRef(true)

  const numericRoomId = Number(roomId)

  const handleNewMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => [...prev, message])
  }, [])

  const handleReadStatusUpdate = useCallback(
    (data: { userId: number; messageId: number }) => {
      if (data.userId === user?.id) return

      setMessages((prev) =>
        prev.map((msg) =>
          msg.messageId <= data.messageId && msg.unreadCount > 0
            ? { ...msg, unreadCount: msg.unreadCount - 1 }
            : msg
        )
      )
    },
    [user?.id]
  )

  // WebSocket 연결 확인 (채팅 목록에서 이미 연결되어 있을 수 있음)
  useEffect(() => {
    if (user && !isConnected) {
      connect(user.id)
    }
  }, [user, isConnected, connect])

  // 방 구독 및 해제
  useEffect(() => {
    if (isConnected) {
      subscribeToRoom(numericRoomId, handleNewMessage)
      subscribeToReadStatus(numericRoomId, handleReadStatusUpdate)

      // 이 방의 unreadCount 클리어 (목록에서 업데이트된 것)
      clearRoomUpdate(numericRoomId)
    }

    return () => {
      unsubscribeFromRoom(numericRoomId)
    }
  }, [isConnected, numericRoomId, handleNewMessage, handleReadStatusUpdate, subscribeToRoom, subscribeToReadStatus, unsubscribeFromRoom, clearRoomUpdate])

  const sendMessage = useCallback(
    (request: SendMessageRequest) => {
      storeSendMessage(numericRoomId, request)
    },
    [numericRoomId, storeSendMessage]
  )

  const markAsRead = useCallback(
    (messageId: number) => {
      storeMarkAsRead(numericRoomId, messageId)
    },
    [numericRoomId, storeMarkAsRead]
  )

  // 채팅방 정보 로드
  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const data = await chatApi.getChatRoom(numericRoomId)
        setRoom(data)
      } catch (error) {
        console.error('채팅방 조회 실패:', error)
        navigate('/chat')
      }
    }
    fetchRoom()
  }, [numericRoomId, navigate])

  // 메시지 목록 로드
  useEffect(() => {
    const fetchMessages = async () => {
      setIsLoading(true)
      try {
        const data = await chatApi.getMessages(numericRoomId)
        setMessages(data)
        setHasMore(data.length >= 50)
        isInitialLoad.current = true
      } catch (error) {
        console.error('메시지 조회 실패:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchMessages()
  }, [numericRoomId])

  // 스크롤 최하단으로 이동 (초기 로드, 새 메시지)
  useEffect(() => {
    if (isInitialLoad.current && messages.length > 0 && !isLoading) {
      messagesEndRef.current?.scrollIntoView()
      isInitialLoad.current = false

      // 마지막 메시지 읽음 처리
      const lastMsg = messages[messages.length - 1]
      if (lastMsg) {
        markAsRead(lastMsg.messageId)
        chatApi.updateLastRead(numericRoomId, lastMsg.messageId)
      }
    }
  }, [messages, isLoading, markAsRead, numericRoomId])

  // 새 메시지 도착시 스크롤
  useEffect(() => {
    if (!isInitialLoad.current && messages.length > 0) {
      // 새 메시지 오면 항상 아래로 스크롤
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })

      // 마지막 메시지 읽음 처리
      const lastMsg = messages[messages.length - 1]
      if (lastMsg) {
        markAsRead(lastMsg.messageId)
        chatApi.updateLastRead(numericRoomId, lastMsg.messageId)
      }
    }
  }, [messages.length, markAsRead, numericRoomId])

  // 무한 스크롤 (위로)
  const handleScroll = async () => {
    const container = messagesContainerRef.current
    if (!container || isLoadingMore || !hasMore) return

    if (container.scrollTop < 100) {
      setIsLoadingMore(true)
      const prevScrollHeight = container.scrollHeight

      try {
        const oldestMessage = messages[0]
        const data = await chatApi.getMessages(numericRoomId, oldestMessage?.messageId)
        if (data.length < 50) setHasMore(false)
        if (data.length > 0) {
          setMessages((prev) => [...data, ...prev])

          // 스크롤 위치 유지
          requestAnimationFrame(() => {
            const newScrollHeight = container.scrollHeight
            container.scrollTop = newScrollHeight - prevScrollHeight
          })
        }
      } catch (error) {
        console.error('이전 메시지 조회 실패:', error)
      } finally {
        setIsLoadingMore(false)
      }
    }
  }

  const handleSendMessage = (request: SendMessageRequest) => {
    sendMessage(request)
  }

  const handleFileUpload = async (file: File) => {
    return fileApi.upload(file)
  }

  if (isLoading || !room) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>로딩중...</div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate('/chat')}>
          ←
        </button>
        <div className={styles.roomInfo}>
          <h1 className={styles.roomName}>{room.name}</h1>
          <span className={styles.userCount}>{room.users.length}명</span>
        </div>
        <span className={`${styles.status} ${isConnected ? styles.connected : ''}`}>
          {isConnected ? '연결됨' : '연결중...'}
        </span>
      </header>

      <div className={styles.messages} ref={messagesContainerRef} onScroll={handleScroll}>
        {isLoadingMore && <div className={styles.loadingMore}>이전 메시지 로딩중...</div>}
        {messages.map((msg) => (
          <MessageItem key={msg.messageId} message={msg} isOwn={msg.senderId === user?.id} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <MessageInput
        onSend={handleSendMessage}
        onFileUpload={handleFileUpload}
        disabled={!isConnected}
      />
    </div>
  )
}
