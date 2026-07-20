import { useState, useRef, useEffect } from 'react'
import type { KeyboardEvent, ClipboardEvent, ChangeEvent } from 'react'
import imageCompression from 'browser-image-compression'
import type { SendMessageRequest, MessageType } from '../../types'
import styles from './MessageInput.module.css'

interface MessageInputProps {
  onSend: (message: SendMessageRequest) => void
  onFileUpload?: (file: File) => Promise<{ url: string; fileName: string }>
  disabled?: boolean
}

interface PendingImage {
  file: File
  previewUrl: string
  type: MessageType
}

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const ALLOWED_FILE_TYPES = [
  ...IMAGE_TYPES,
  'application/pdf',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]

const MAX_FILE_SIZE_MB = 50
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024

function getMessageType(mimeType: string): MessageType {
  if (mimeType === 'image/gif') return 'GIF'
  if (mimeType.startsWith('image/')) return 'IMAGE'
  return 'FILE'
}

async function compressImage(file: File): Promise<File> {
  if (file.type === 'image/gif') return file
  if (file.size <= 1 * 1024 * 1024) return file

  return imageCompression(file, {
    maxSizeMB: 1,
    maxWidthOrHeight: 2048,
    useWebWorker: true,
  })
}

export default function MessageInput({ onSend, onFileUpload, disabled }: MessageInputProps) {
  const [text, setText] = useState('')
  const [pendingImage, setPendingImage] = useState<PendingImage | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 미리보기 objectURL 정리
  useEffect(() => {
    return () => {
      if (pendingImage) URL.revokeObjectURL(pendingImage.previewUrl)
    }
  }, [pendingImage])

  const clearPendingImage = () => {
    if (pendingImage) URL.revokeObjectURL(pendingImage.previewUrl)
    setPendingImage(null)
  }

  const validateFile = (file: File) => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      alert('지원하지 않는 파일 형식입니다.')
      return false
    }
    if (file.size > MAX_FILE_SIZE) {
      alert(`파일 크기는 ${MAX_FILE_SIZE_MB}MB 이하만 가능합니다.`)
      return false
    }
    return true
  }

  const handleSend = async () => {
    const trimmed = text.trim()

    if (pendingImage && onFileUpload) {
      setIsUploading(true)
      try {
        const compressed = await compressImage(pendingImage.file)
        const { url, fileName } = await onFileUpload(compressed)

        if (trimmed) {
          onSend({ type: 'TEXT', content: trimmed })
        }
        onSend({ type: pendingImage.type, fileUrl: url, fileName })

        setText('')
        clearPendingImage()
      } catch (error) {
        console.error('파일 업로드 실패:', error)
        alert('파일 업로드에 실패했습니다.')
      } finally {
        setIsUploading(false)
      }
      return
    }

    if (trimmed) {
      onSend({ type: 'TEXT', content: trimmed })
      setText('')
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // 한글 조합 중(IME composing)에는 전송하지 않음
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFileSelect = async (file: File) => {
    if (!validateFile(file)) return

    const type = getMessageType(file.type)

    if (type === 'IMAGE' || type === 'GIF') {
      clearPendingImage()
      setPendingImage({ file, previewUrl: URL.createObjectURL(file), type })
      return
    }

    // 이미지가 아닌 첨부 파일(PDF, 엑셀 등)은 미리보기 없이 바로 전송
    if (!onFileUpload) return
    setIsUploading(true)
    try {
      const { url, fileName } = await onFileUpload(file)
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
    <div className={styles.wrapper}>
      {pendingImage && (
        <div className={styles.previewRow}>
          <img src={pendingImage.previewUrl} alt="미리보기" className={styles.previewThumb} />
          <button
            type="button"
            className={styles.previewRemove}
            onClick={clearPendingImage}
            disabled={isUploading}
          >
            ✕
          </button>
        </div>
      )}
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
          placeholder={pendingImage ? '메시지를 추가하거나 Enter로 전송' : '메시지를 입력하세요'}
          rows={1}
          disabled={disabled || isUploading}
        />
        <button
          type="button"
          className={styles.sendButton}
          onClick={handleSend}
          disabled={disabled || isUploading || (!text.trim() && !pendingImage)}
        >
          {isUploading ? '...' : '전송'}
        </button>
      </div>
    </div>
  )
}
