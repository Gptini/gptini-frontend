import { useState, useRef } from 'react'
import type { KeyboardEvent, ClipboardEvent, ChangeEvent } from 'react'
import imageCompression from 'browser-image-compression'
import type { SendMessageRequest, MessageType } from '../../types'
import styles from './MessageInput.module.css'

interface MessageInputProps {
  onSend: (message: SendMessageRequest) => void
  onFileUpload?: (file: File) => Promise<{ url: string; fileName: string }>
  disabled?: boolean
}

const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]

const MAX_FILE_SIZE_MB = 50
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024

function getMessageType(mimeType: string): MessageType {
  if (mimeType === 'image/gif') return 'GIF'
  return 'IMAGE'
}

async function compressImage(file: File): Promise<File> {
  // GIF는 압축하면 애니메이션이 깨지므로 그대로 반환
  if (file.type === 'image/gif') return file

  // 1MB 이하면 압축 불필요
  if (file.size <= 1 * 1024 * 1024) return file

  return imageCompression(file, {
    maxSizeMB: 1,
    maxWidthOrHeight: 2048,
    useWebWorker: true,
  })
}

export default function MessageInput({ onSend, onFileUpload, disabled }: MessageInputProps) {
  const [text, setText] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSendText = () => {
    const trimmed = text.trim()
    if (!trimmed) return

    onSend({ type: 'TEXT', content: trimmed })
    setText('')
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // 한글 조합 중(IME composing)에는 전송하지 않음
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      handleSendText()
    }
  }

  const handleFileSelect = async (file: File) => {
    if (!onFileUpload) return
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      alert('이미지 파일만 업로드할 수 있습니다. (JPG, PNG, GIF, WebP)')
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      alert(`파일 크기는 ${MAX_FILE_SIZE_MB}MB 이하만 가능합니다.`)
      return
    }

    setIsUploading(true)
    try {
      const compressed = await compressImage(file)
      const { url, fileName } = await onFileUpload(compressed)
      const type = getMessageType(file.type)
      onSend({ type, fileUrl: url, fileName })
    } catch (error) {
      console.error('파일 업로드 실패:', error)
      alert('파일 업로드에 실패했습니다.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
    e.target.value = ''
  }

  const handlePaste = async (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault()
        const file = item.getAsFile()
        if (file) {
          await handleFileSelect(file)
        }
        return
      }
    }
  }

  return (
    <div className={styles.container}>
      <button
        type="button"
        className={styles.attachButton}
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || isUploading}
      >
        📎
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_FILE_TYPES.join(',')}
        onChange={handleFileInputChange}
        hidden
      />
      <textarea
        className={styles.input}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        placeholder="메시지를 입력하세요"
        rows={1}
        disabled={disabled || isUploading}
      />
      <button
        type="button"
        className={styles.sendButton}
        onClick={handleSendText}
        disabled={disabled || isUploading || !text.trim()}
      >
        {isUploading ? '...' : '전송'}
      </button>
    </div>
  )
}
