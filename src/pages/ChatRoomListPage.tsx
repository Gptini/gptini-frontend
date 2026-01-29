import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/common/Button'
import ChatRoomItem from '../components/chat/ChatRoomItem'
import CreateRoomModal from '../components/chat/CreateRoomModal'
import chatApi from '../services/chatApi'
import useAuthStore from '../stores/authStore'
import useChatStore from '../stores/chatStore'
import type { ChatRoomListItem } from '../types'
import styles from './ChatRoomListPage.module.css'

export default function ChatRoomListPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { isConnected, connect, roomUpdates } = useChatStore()
  const [rooms, setRooms] = useState<ChatRoomListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const fetchRooms = useCallback(async () => {
    try {
      const data = await chatApi.getChatRooms()
      setRooms(data)
    } catch (error) {
      console.error('채팅방 목록 조회 실패:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // WebSocket 연결
  useEffect(() => {
    console.log('[ChatRoomListPage] user:', user, 'isConnected:', isConnected)
    if (user && !isConnected) {
      connect(user.id)
    }
  }, [user, isConnected, connect])

  useEffect(() => {
    fetchRooms()
  }, [fetchRooms])

  // 실시간 업데이트와 기존 데이터 병합
  const mergedRooms = useMemo(() => {
    const merged = rooms.map((room) => {
      const update = roomUpdates.get(room.id)
      if (update) {
        return {
          ...room,
          lastMessage: update.lastMessage,
          lastMessageSender: update.lastMessageSenderNickname,
          lastMessageTime: update.lastMessageTime,
          unreadCount: update.unreadCount,
        }
      }
      return room
    })

    // 최신 메시지 시간순 정렬 (최신이 위로)
    return merged.sort(
      (a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
    )
  }, [rooms, roomUpdates])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleRoomCreated = () => {
    fetchRooms()
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>채팅</h1>
        <div className={styles.headerRight}>
          {user && <span className={styles.userName}>{user.nickname}</span>}
          <Button variant="outline" size="sm" onClick={handleLogout}>
            로그아웃
          </Button>
        </div>
      </header>

      <div className={styles.toolbar}>
        <Button onClick={() => setIsModalOpen(true)}>새 채팅방</Button>
      </div>

      <div className={styles.roomList}>
        {isLoading ? (
          <div className={styles.loading}>로딩중...</div>
        ) : mergedRooms.length === 0 ? (
          <div className={styles.empty}>
            <p>참여중인 채팅방이 없습니다</p>
            <Button onClick={() => setIsModalOpen(true)}>첫 채팅방 만들기</Button>
          </div>
        ) : (
          mergedRooms.map((room) => <ChatRoomItem key={room.id} room={room} />)
        )}
      </div>

      <nav className={styles.bottomNav}>
        <button className={`${styles.navItem} ${styles.navActive}`}>채팅</button>
        <button className={styles.navItem} onClick={() => navigate('/friends')}>
          친구
        </button>
      </nav>

      <CreateRoomModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={handleRoomCreated}
      />
    </div>
  )
}
