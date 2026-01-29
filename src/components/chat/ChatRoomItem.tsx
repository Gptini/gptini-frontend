import { Link } from 'react-router-dom'
import type { ChatRoomListItem } from '../../types'
import styles from './ChatRoomItem.module.css'

interface ChatRoomItemProps {
  room: ChatRoomListItem
}

function formatTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '방금'
  if (minutes < 60) return `${minutes}분 전`
  if (hours < 24) return `${hours}시간 전`
  if (days < 7) return `${days}일 전`

  return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

export default function ChatRoomItem({ room }: ChatRoomItemProps) {
  return (
    <Link to={`/chat/${room.id}`} className={styles.item}>
      <div className={styles.avatar}>{room.name.charAt(0)}</div>
      <div className={styles.content}>
        <div className={styles.header}>
          <span className={styles.name}>
            {room.name}
            <span className={styles.userCount}>({room.userCount})</span>
          </span>
          <span className={styles.time}>{formatTime(room.lastMessageTime)}</span>
        </div>
        <div className={styles.preview}>
          {room.lastMessage ? (
            <span className={styles.message}>
              {room.lastMessageSender && <strong>{room.lastMessageSender}: </strong>}
              {room.lastMessage}
            </span>
          ) : (
            <span className={styles.noMessage}>아직 메시지가 없습니다</span>
          )}
          {room.unreadCount > 0 && (
            <span className={styles.unreadBadge}>
              {room.unreadCount > 99 ? '99+' : room.unreadCount}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
