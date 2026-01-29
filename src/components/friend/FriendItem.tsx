import type { Friend } from '../../types'
import Button from '../common/Button'
import styles from './FriendItem.module.css'

interface FriendItemProps {
  friend: Friend
  onDelete: (friendId: number) => void
  isDeleting?: boolean
}

export default function FriendItem({ friend, onDelete, isDeleting }: FriendItemProps) {
  return (
    <div className={styles.item}>
      <div className={styles.avatar}>
        {friend.profileImageUrl ? (
          <img src={friend.profileImageUrl} alt={friend.nickname} />
        ) : (
          <span>{friend.nickname.charAt(0)}</span>
        )}
      </div>
      <div className={styles.info}>
        <span className={styles.nickname}>{friend.nickname}</span>
        <span className={styles.email}>{friend.email}</span>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onDelete(friend.id)}
        isLoading={isDeleting}
      >
        삭제
      </Button>
    </div>
  )
}
