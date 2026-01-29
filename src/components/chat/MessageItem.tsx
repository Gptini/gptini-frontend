import type { ChatMessage } from '../../types'
import styles from './MessageItem.module.css'

interface MessageItemProps {
  message: ChatMessage
  isOwn: boolean
}

function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function MessageItem({ message, isOwn }: MessageItemProps) {
  const renderContent = () => {
    switch (message.type) {
      case 'IMAGE':
      case 'GIF':
        return (
          <img src={message.fileUrl || ''} alt={message.fileName || '이미지'} className={styles.image} />
        )
      case 'FILE':
        return (
          <a href={message.fileUrl || ''} download={message.fileName} className={styles.file}>
            📎 {message.fileName}
          </a>
        )
      default:
        return <span className={styles.text}>{message.content}</span>
    }
  }

  return (
    <div className={`${styles.container} ${isOwn ? styles.own : ''}`}>
      {!isOwn && (
        <div className={styles.avatar}>
          {message.senderProfileImageUrl ? (
            <img src={message.senderProfileImageUrl} alt={message.senderNickname} />
          ) : (
            <span>{message.senderNickname.charAt(0)}</span>
          )}
        </div>
      )}
      <div className={styles.content}>
        {!isOwn && <span className={styles.sender}>{message.senderNickname}</span>}
        <div className={styles.bubble}>{renderContent()}</div>
        <div className={styles.meta}>
          {message.unreadCount > 0 && (
            <span className={styles.unread}>{message.unreadCount}</span>
          )}
          <span className={styles.time}>{formatTime(message.createdAt)}</span>
        </div>
      </div>
    </div>
  )
}
