import { forwardRef, useState } from 'react'
import type { InputHTMLAttributes } from 'react'
import styles from './Input.module.css'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  helperType?: 'success' | 'error' | 'default'
  fullWidth?: boolean
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, helperType = 'default', fullWidth = false, className = '', type, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false)
    const isPassword = type === 'password'

    return (
      <div className={`${styles.wrapper} ${fullWidth ? styles.fullWidth : ''}`}>
        {label && <label className={styles.label}>{label}</label>}
        <div className={styles.inputWrapper}>
          <input
            ref={ref}
            type={isPassword && showPassword ? 'text' : type}
            className={`${styles.input} ${error ? styles.error : ''} ${isPassword ? styles.hasToggle : ''} ${className}`}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              className={styles.toggleButton}
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? '숨기기' : '보기'}
            </button>
          )}
        </div>
        {error && <span className={styles.errorText}>{error}</span>}
        {!error && helperText && (
          <span className={`${styles.helperText} ${styles[helperType]}`}>{helperText}</span>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
