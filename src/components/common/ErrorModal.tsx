import Modal from './Modal'
import Button from './Button'
import useErrorStore from '../../stores/errorStore'
import styles from './ErrorModal.module.css'

export default function ErrorModal() {
  const { isOpen, title, message, closeError } = useErrorStore()

  return (
    <Modal isOpen={isOpen} onClose={closeError} title={title}>
      <div className={styles.content}>
        <p className={styles.message}>{message}</p>
        <Button onClick={closeError} fullWidth>
          확인
        </Button>
      </div>
    </Modal>
  )
}
