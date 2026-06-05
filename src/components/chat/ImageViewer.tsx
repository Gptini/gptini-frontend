import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import styles from './ImageViewer.module.css'

interface ImageViewerProps {
  src: string
  alt: string
  onClose: () => void
}

export default function ImageViewer({ src, alt, onClose }: ImageViewerProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <button className={styles.closeButton} onClick={onClose}>✕</button>
      <img
        src={src}
        alt={alt}
        className={styles.image}
        onClick={(e) => e.stopPropagation()}
      />
    </div>,
    document.body
  )
}
