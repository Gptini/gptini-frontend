import { useState, useEffect, useMemo } from 'react'
import Modal from '../common/Modal'
import Input from '../common/Input'
import Button from '../common/Button'
import friendApi from '../../services/friendApi'
import chatApi from '../../services/chatApi'
import type { Friend } from '../../types'
import styles from './CreateRoomModal.module.css'

interface CreateRoomModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated: () => void
}

export default function CreateRoomModal({ isOpen, onClose, onCreated }: CreateRoomModalProps) {
  const [roomName, setRoomName] = useState('')
  const [filterKeyword, setFilterKeyword] = useState('')
  const [friends, setFriends] = useState<Friend[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true)
      friendApi
        .getFriends()
        .then(setFriends)
        .catch(() => setFriends([]))
        .finally(() => setIsLoading(false))
    } else {
      setRoomName('')
      setFilterKeyword('')
      setFriends([])
      setSelectedIds(new Set())
    }
  }, [isOpen])

  const filteredFriends = useMemo(() => {
    if (!filterKeyword.trim()) return friends
    const keyword = filterKeyword.toLowerCase()
    return friends.filter(
      (f) => f.nickname.toLowerCase().includes(keyword) || f.email.toLowerCase().includes(keyword)
    )
  }, [friends, filterKeyword])

  const handleToggleSelect = (friendId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(friendId)) {
        next.delete(friendId)
      } else {
        next.add(friendId)
      }
      return next
    })
  }

  const handleCreate = async () => {
    if (!roomName.trim() || selectedIds.size === 0) return

    setIsCreating(true)
    try {
      await chatApi.createRoom(roomName.trim(), Array.from(selectedIds))
      onCreated()
      onClose()
    } catch (error) {
      console.error('채팅방 생성 실패:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const selectedFriends = friends.filter((f) => selectedIds.has(f.id))

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="새 채팅방 만들기">
      <div className={styles.form}>
        <Input
          label="채팅방 이름"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
          placeholder="채팅방 이름을 입력하세요"
          fullWidth
        />

        <div className={styles.userSection}>
          <Input
            label="참여자 선택"
            value={filterKeyword}
            onChange={(e) => setFilterKeyword(e.target.value)}
            placeholder="친구 검색 (닉네임 또는 이메일)"
            fullWidth
          />

          {isLoading ? (
            <p className={styles.searching}>친구 목록 불러오는 중...</p>
          ) : friends.length === 0 ? (
            <p className={styles.empty}>친구가 없습니다. 먼저 친구를 추가해주세요.</p>
          ) : (
            <ul className={styles.friendList}>
              {filteredFriends.map((friend) => (
                <li
                  key={friend.id}
                  className={`${styles.friendItem} ${selectedIds.has(friend.id) ? styles.selected : ''}`}
                  onClick={() => handleToggleSelect(friend.id)}
                >
                  <span className={styles.checkbox}>{selectedIds.has(friend.id) ? '✓' : ''}</span>
                  <span className={styles.userNickname}>{friend.nickname}</span>
                  <span className={styles.userEmail}>{friend.email}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {selectedFriends.length > 0 && (
          <div className={styles.selectedUsers}>
            <label className={styles.label}>선택된 참여자 ({selectedFriends.length}명)</label>
            <div className={styles.chips}>
              {selectedFriends.map((friend) => (
                <span key={friend.id} className={styles.chip}>
                  {friend.nickname}
                  <button type="button" onClick={() => handleToggleSelect(friend.id)}>
                    &times;
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        <Button
          onClick={handleCreate}
          disabled={!roomName.trim() || selectedIds.size === 0}
          isLoading={isCreating}
          fullWidth
        >
          채팅방 만들기
        </Button>
      </div>
    </Modal>
  )
}
