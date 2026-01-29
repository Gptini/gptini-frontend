import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Tippy from '@tippyjs/react'
import 'tippy.js/dist/tippy.css'
import Button from '../components/common/Button'
import FriendItem from '../components/friend/FriendItem'
import FriendRequestItem from '../components/friend/FriendRequestItem'
import AddFriendModal from '../components/friend/AddFriendModal'
import friendApi from '../services/friendApi'
import useAuthStore from '../stores/authStore'
import type { Friend, FriendRequest } from '../types'
import styles from './FriendsPage.module.css'

type TabType = 'friends' | 'received' | 'sent'

export default function FriendsPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  const [activeTab, setActiveTab] = useState<TabType>('friends')
  const [friends, setFriends] = useState<Friend[]>([])
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([])
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [processingId, setProcessingId] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)

  const handleCopyCode = async () => {
    if (!user?.friendCode) return
    try {
      await navigator.clipboard.writeText(user.friendCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 1000)
    } catch (error) {
      console.error('복사 실패:', error)
    }
  }

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [friendsData, receivedData, sentData] = await Promise.all([
        friendApi.getFriends(),
        friendApi.getReceivedRequests(),
        friendApi.getSentRequests(),
      ])
      setFriends(friendsData)
      setReceivedRequests(receivedData)
      setSentRequests(sentData)
    } catch (error) {
      console.error('데이터 조회 실패:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleAccept = async (requestId: number) => {
    setProcessingId(requestId)
    try {
      await friendApi.acceptRequest(requestId)
      await fetchData()
    } catch (error) {
      console.error('수락 실패:', error)
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (requestId: number) => {
    setProcessingId(requestId)
    try {
      await friendApi.rejectRequest(requestId)
      setReceivedRequests((prev) => prev.filter((r) => r.id !== requestId))
    } catch (error) {
      console.error('거절 실패:', error)
    } finally {
      setProcessingId(null)
    }
  }

  const handleDeleteFriend = async (friendId: number) => {
    setProcessingId(friendId)
    try {
      await friendApi.deleteFriend(friendId)
      setFriends((prev) => prev.filter((f) => f.id !== friendId))
    } catch (error) {
      console.error('삭제 실패:', error)
    } finally {
      setProcessingId(null)
    }
  }

  const renderContent = () => {
    if (isLoading) {
      return <div className={styles.empty}>로딩중...</div>
    }

    switch (activeTab) {
      case 'friends':
        return friends.length === 0 ? (
          <div className={styles.empty}>
            <p>아직 친구가 없습니다</p>
            <Button onClick={() => setIsModalOpen(true)}>친구 추가하기</Button>
          </div>
        ) : (
          friends.map((friend) => (
            <FriendItem
              key={friend.id}
              friend={friend}
              onDelete={handleDeleteFriend}
              isDeleting={processingId === friend.id}
            />
          ))
        )

      case 'received':
        return receivedRequests.length === 0 ? (
          <div className={styles.empty}>받은 친구 요청이 없습니다</div>
        ) : (
          receivedRequests.map((request) => (
            <FriendRequestItem
              key={request.id}
              request={request}
              type="received"
              onAccept={handleAccept}
              onReject={handleReject}
              isLoading={processingId === request.id}
            />
          ))
        )

      case 'sent':
        return sentRequests.length === 0 ? (
          <div className={styles.empty}>보낸 친구 요청이 없습니다</div>
        ) : (
          sentRequests.map((request) => (
            <FriendRequestItem key={request.id} request={request} type="sent" />
          ))
        )
    }
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>친구</h1>
        <div className={styles.headerRight}>
          {user && <span className={styles.userName}>{user.nickname}</span>}
          <Button variant="outline" size="sm" onClick={handleLogout}>
            로그아웃
          </Button>
        </div>
      </header>

      <div className={styles.myCode}>
        <span className={styles.codeLabel}>내 친구 코드</span>
        <Tippy
          content="복사되었습니다!"
          visible={copied}
          placement="top"
          animation="fade"
        >
          <button className={styles.codeButton} onClick={handleCopyCode}>
            {user?.friendCode || '-'}
          </button>
        </Tippy>
      </div>

      <div className={styles.toolbar}>
        <Button onClick={() => setIsModalOpen(true)}>친구 추가</Button>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'friends' ? styles.active : ''}`}
          onClick={() => setActiveTab('friends')}
        >
          친구 목록 ({friends.length})
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'received' ? styles.active : ''}`}
          onClick={() => setActiveTab('received')}
        >
          받은 요청 ({receivedRequests.length})
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'sent' ? styles.active : ''}`}
          onClick={() => setActiveTab('sent')}
        >
          보낸 요청 ({sentRequests.length})
        </button>
      </div>

      <div className={styles.content}>{renderContent()}</div>

      <nav className={styles.bottomNav}>
        <button className={styles.navItem} onClick={() => navigate('/chat')}>
          채팅
        </button>
        <button className={`${styles.navItem} ${styles.navActive}`}>친구</button>
      </nav>

      <AddFriendModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onRequestSent={fetchData}
      />
    </div>
  )
}
