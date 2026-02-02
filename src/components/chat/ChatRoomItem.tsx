import { Link } from 'react-router-dom'
import type { ChatRoomListItem } from '../../types'
import { formatRelativeTime } from '../../utils/dateFormat'
import styles from './ChatRoomItem.module.css'

interface ChatRoomItemProps {
  room: ChatRoomListItem
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
          <span className={styles.time}>{formatRelativeTime(room.lastMessageTime)}</span>
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
