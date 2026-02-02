import type { FriendRequest } from '../../types'
import { formatDateTime } from '../../utils/dateFormat'
import Button from '../common/Button'
import styles from './FriendRequestItem.module.css'

interface FriendRequestItemProps {
  request: FriendRequest
  type: 'received' | 'sent'
  onAccept?: (requestId: number) => void
  onReject?: (requestId: number) => void
  isLoading?: boolean
}

export default function FriendRequestItem({
  request,
  type,
  onAccept,
  onReject,
  isLoading,
}: FriendRequestItemProps) {
  const user = request.requester

  return (
    <div className={styles.item}>
      <div className={styles.avatar}>
        {user.profileImageUrl ? (
          <img src={user.profileImageUrl} alt={user.nickname} />
        ) : (
          <span>{user.nickname.charAt(0)}</span>
        )}
      </div>
      <div className={styles.info}>
        <span className={styles.nickname}>{user.nickname}</span>
        <span className={styles.date}>{formatDateTime(request.createdAt)}</span>
      </div>
      {type === 'received' && (
        <div className={styles.actions}>
          <Button size="sm" onClick={() => onAccept?.(request.id)} isLoading={isLoading}>
            수락
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onReject?.(request.id)}
            isLoading={isLoading}
          >
            거절
          </Button>
        </div>
      )}
      {type === 'sent' && <span className={styles.pending}>대기중</span>}
    </div>
  )
}
