import { useState } from 'react'
import Modal from '../common/Modal'
import Input from '../common/Input'
import Button from '../common/Button'
import friendApi from '../../services/friendApi'
import type { User } from '../../types'
import styles from './AddFriendModal.module.css'

interface AddFriendModalProps {
  isOpen: boolean
  onClose: () => void
  onRequestSent: () => void
}

export default function AddFriendModal({ isOpen, onClose, onRequestSent }: AddFriendModalProps) {
  const [code, setCode] = useState('')
  const [searchResult, setSearchResult] = useState<User | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState('')

  const handleSearch = async () => {
    if (code.trim().length !== 8) {
      setError('친구 코드는 8자리입니다')
      return
    }

    setIsSearching(true)
    setError('')
    setSearchResult(null)

    try {
      const user = await friendApi.searchByCode(code.trim().toUpperCase())
      setSearchResult(user)
    } catch {
      setError('해당 코드의 사용자를 찾을 수 없습니다')
    } finally {
      setIsSearching(false)
    }
  }

  const handleSendRequest = async () => {
    if (!searchResult) return

    setIsSending(true)
    try {
      await friendApi.sendRequest(code.trim().toUpperCase())
      onRequestSent()
      handleClose()
    } catch (err: any) {
      const message = err?.response?.data?.message || '친구 요청 전송에 실패했습니다'
      setError(message)
    } finally {
      setIsSending(false)
    }
  }

  const handleClose = () => {
    setCode('')
    setSearchResult(null)
    setError('')
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="친구 추가">
      <div className={styles.container}>
        <div className={styles.searchSection}>
          <Input
            label="친구 코드"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="8자리 코드 입력"
            maxLength={8}
            fullWidth
          />
          <Button onClick={handleSearch} isLoading={isSearching} disabled={code.length !== 8}>
            검색
          </Button>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        {searchResult && (
          <div className={styles.result}>
            <div className={styles.userInfo}>
              <div className={styles.avatar}>
                {searchResult.profileImageUrl ? (
                  <img src={searchResult.profileImageUrl} alt={searchResult.nickname} />
                ) : (
                  <span>{searchResult.nickname.charAt(0)}</span>
                )}
              </div>
              <div className={styles.details}>
                <span className={styles.nickname}>{searchResult.nickname}</span>
                <span className={styles.email}>{searchResult.email}</span>
              </div>
            </div>
            <Button onClick={handleSendRequest} isLoading={isSending} fullWidth>
              친구 요청 보내기
            </Button>
          </div>
        )}
      </div>
    </Modal>
  )
}
