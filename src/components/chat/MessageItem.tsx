import { useMemo } from 'react'
import type { ChatMessage } from '../../types'
import { formatTime } from '../../utils/dateFormat'
import styles from './MessageItem.module.css'

interface MessageItemProps {
  message: ChatMessage
  isOwn: boolean
  participants: Map<number, number>
  myUserId: number
}

export default function MessageItem({ message, isOwn, participants, myUserId }: MessageItemProps) {
  // 내 메시지일 때만 "N명 안 읽음" 계산
  const unreadCount = useMemo(() => {
    if (!isOwn) return 0

    let count = 0
    participants.forEach((lastReadId, userId) => {
      if (userId !== myUserId && lastReadId < message.messageId) {
        count++
      }
    })
    return count
  }, [isOwn, participants, message.messageId, myUserId])

  const renderContent = () => {
    switch (message.type) {
      case 'IMAGE':
      case 'GIF':
        return (
          <img
            src={message.fileUrl || ''}
            alt={message.fileName || '이미지'}
            className={styles.image}
            onError={(e) => {
              const target = e.currentTarget
              target.style.display = 'none'
              const placeholder = document.createElement('span')
              placeholder.className = styles.expired
              placeholder.textContent = '만료된 이미지입니다'
              target.parentElement?.appendChild(placeholder)
            }}
          />
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
          {isOwn && unreadCount > 0 && (
            <span className={styles.unread}>{unreadCount}</span>
          )}
          <span className={styles.time}>{formatTime(message.createdAt)}</span>
        </div>
      </div>
    </div>
  )
}
