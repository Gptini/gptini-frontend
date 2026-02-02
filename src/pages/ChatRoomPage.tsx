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
  const [showMenu, setShowMenu] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)

  // participants 상태 (read 이벤트로 업데이트됨)
  const [participants, setParticipants] = useState<Map<number, number>>(new Map())

  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const isInitialLoad = useRef(true)
  const menuRef = useRef<HTMLDivElement>(null)

  // 읽음 처리 coalescing용 ref
  const lastSentReadIdRef = useRef<number | null>(null)
  const pendingReadIdRef = useRef<number | null>(null)
  const readTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 재동기화용 ref
  const unreadSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSyncTimeRef = useRef<number>(0)

  const numericRoomId = Number(roomId)

  const handleNewMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => [...prev, message])
  }, [])

  // participants의 lastReadMessageId 갱신
  const handleReadStatusUpdate = useCallback(
    (data: { userId: number; messageId: number }) => {
      setParticipants(prev => {
        const next = new Map(prev)
        const current = next.get(data.userId) ?? 0
        if (data.messageId > current) {
          next.set(data.userId, data.messageId)
        }
        return next
      })
    },
    []
  )

  // participants 재동기화 함수 (REST 기반)
  const syncParticipants = useCallback(async () => {
    try {
      const data = await chatApi.getParticipants(numericRoomId)
      // idempotent merge: 기존 값보다 큰 경우에만 업데이트
      setParticipants(prev => {
        const next = new Map(prev)
        data.forEach(p => {
          const current = next.get(p.id) ?? 0
          if (p.lastReadMessageId > current) {
            next.set(p.id, p.lastReadMessageId)
          }
        })
        return next
      })
    } catch (error) {
      console.error('participants 동기화 실패:', error)
    }
  }, [numericRoomId])

  // 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMenu])

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

  // 실제 서버 전송
  const flushRead = useCallback(() => {
    const messageId = pendingReadIdRef.current

    // 타이머 정리 (항상 먼저 실행)
    if (readTimerRef.current) {
      clearTimeout(readTimerRef.current)
      readTimerRef.current = null
    }

    if (messageId === null) return
    if (messageId === lastSentReadIdRef.current) return  // 중복 방지

    storeMarkAsRead(numericRoomId, messageId)

    lastSentReadIdRef.current = messageId
    pendingReadIdRef.current = null
  }, [numericRoomId, storeMarkAsRead])

  // 읽음 처리 스케줄링 (throttle)
  const scheduleReadFlush = useCallback((messageId: number) => {
    // pending 값은 항상 덮어쓰기 (마지막 ID만 유지)
    pendingReadIdRef.current = messageId

    // 이미 타이머가 있으면 스킵 (throttle)
    if (readTimerRef.current) return

    readTimerRef.current = setTimeout(() => {
      flushRead()
    }, 300)  // 300ms throttle
  }, [flushRead])

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

  // room 로드 시 participants 초기화
  useEffect(() => {
    if (room) {
      const map = new Map<number, number>()
      ;(room.participants ?? []).forEach(p => map.set(p.id, p.lastReadMessageId))
      setParticipants(map)
    }
  }, [room])

  // 트리거 1: 탭 포커스 복귀 시 재동기화
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncParticipants()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [syncParticipants])

  // 트리거 2: unread 지속 감지 시 재동기화
  useEffect(() => {
    // 성능 최적화: 내 마지막 메시지만 검사
    const myLastMessage = [...messages].reverse().find(msg => msg.senderId === user?.id)

    let hasUnread = false
    if (myLastMessage) {
      participants.forEach((lastReadId, otherId) => {
        if (otherId !== user?.id && lastReadId < myLastMessage.messageId) {
          hasUnread = true
        }
      })
    }

    if (hasUnread) {
      // 이미 타이머가 있으면 스킵
      if (unreadSyncTimerRef.current) return

      // 마지막 동기화로부터 5초 이내면 스킵
      if (Date.now() - lastSyncTimeRef.current < 5000) return

      unreadSyncTimerRef.current = setTimeout(() => {
        syncParticipants()
        lastSyncTimeRef.current = Date.now()
        unreadSyncTimerRef.current = null
      }, 3000)
    } else {
      // unread가 없으면 타이머 클리어
      if (unreadSyncTimerRef.current) {
        clearTimeout(unreadSyncTimerRef.current)
        unreadSyncTimerRef.current = null
      }
    }
  }, [messages, participants, user?.id, syncParticipants])

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (unreadSyncTimerRef.current) {
        clearTimeout(unreadSyncTimerRef.current)
      }
    }
  }, [])

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

  // 스크롤 최하단으로 이동 (초기 로드)
  useEffect(() => {
    if (isInitialLoad.current && messages.length > 0 && !isLoading) {
      messagesEndRef.current?.scrollIntoView()
      isInitialLoad.current = false

      // 마지막 메시지 읽음 처리 (즉시 전송)
      const lastMsg = messages[messages.length - 1]
      if (lastMsg) {
        pendingReadIdRef.current = lastMsg.messageId
        flushRead()
      }
    }
  }, [messages, isLoading, flushRead])

  // 새 메시지 도착시 스크롤 + throttle로 읽음 처리
  useEffect(() => {
    if (!isInitialLoad.current && messages.length > 0) {
      // 새 메시지 오면 항상 아래로 스크롤
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })

      // 마지막 메시지 읽음 처리 (throttle 적용)
      const lastMsg = messages[messages.length - 1]
      if (lastMsg) {
        scheduleReadFlush(lastMsg.messageId)
      }
    }
  }, [messages.length, scheduleReadFlush])

  // 채팅방 나갈 때 pending 읽음 처리 즉시 전송
  useEffect(() => {
    return () => {
      if (readTimerRef.current) {
        clearTimeout(readTimerRef.current)
        readTimerRef.current = null
      }
      // pending이 있으면 즉시 전송
      if (pendingReadIdRef.current !== null && pendingReadIdRef.current !== lastSentReadIdRef.current) {
        storeMarkAsRead(numericRoomId, pendingReadIdRef.current)
      }
    }
  }, [numericRoomId, storeMarkAsRead])

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

  const handleLeaveRoom = async () => {
    if (!window.confirm('정말 채팅방을 나가시겠습니까?')) return

    setIsLeaving(true)
    try {
      await chatApi.leaveRoom(numericRoomId)
      navigate('/chat')
    } catch (error) {
      console.error('채팅방 나가기 실패:', error)
      alert('채팅방 나가기에 실패했습니다.')
    } finally {
      setIsLeaving(false)
      setShowMenu(false)
    }
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
          <span className={styles.userCount}>{(room.participants ?? []).length}명</span>
        </div>
        <div className={styles.headerRight}>
          <span className={`${styles.status} ${isConnected ? styles.connected : ''}`}>
            {isConnected ? '연결됨' : '연결중...'}
          </span>
          <div className={styles.menuWrapper} ref={menuRef}>
            <button className={styles.menuButton} onClick={() => setShowMenu(!showMenu)}>
              ⋮
            </button>
            {showMenu && (
              <div className={styles.menuDropdown}>
                <button
                  className={styles.menuItem}
                  onClick={handleLeaveRoom}
                  disabled={isLeaving}
                >
                  {isLeaving ? '나가는 중...' : '채팅방 나가기'}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className={styles.messages} ref={messagesContainerRef} onScroll={handleScroll}>
        {isLoadingMore && <div className={styles.loadingMore}>이전 메시지 로딩중...</div>}
        {messages.map((msg) => (
          <MessageItem
            key={msg.messageId}
            message={msg}
            isOwn={msg.senderId === user?.id}
            participants={participants}
            myUserId={user?.id ?? 0}
          />
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
