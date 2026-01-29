import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Input } from '../components/common'
import useAuthStore from '../stores/authStore'
import styles from './AuthPage.module.css'

export default function SignUpPage() {
  const navigate = useNavigate()
  const { signUp, isLoading } = useAuthStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [nickname, setNickname] = useState('')
  const [errors, setErrors] = useState<{
    email?: string
    password?: string
    passwordConfirm?: string
    nickname?: string
    general?: string
  }>({})

  const validate = () => {
    const newErrors: typeof errors = {}

    if (!email.trim()) {
      newErrors.email = '이메일을 입력해주세요'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = '올바른 이메일 형식이 아닙니다'
    }

    if (!password) {
      newErrors.password = '비밀번호를 입력해주세요'
    } else if (password.length < 8) {
      newErrors.password = '비밀번호는 8자 이상이어야 합니다'
    }

    if (password !== passwordConfirm) {
      newErrors.passwordConfirm = '비밀번호가 일치하지 않습니다'
    }

    if (!nickname.trim()) {
      newErrors.nickname = '닉네임을 입력해주세요'
    } else if (nickname.length < 2 || nickname.length > 20) {
      newErrors.nickname = '닉네임은 2-20자 사이여야 합니다'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    try {
      await signUp(email, password, nickname)
      navigate('/chat')
    } catch (err: any) {
      const message = err?.response?.data?.message || '회원가입에 실패했습니다'
      setErrors({ general: message })
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>회원가입</h1>
        <p className={styles.subtitle}>GPTini 계정을 만들어보세요</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          {errors.general && (
            <div className={styles.errorAlert}>{errors.general}</div>
          )}

          <Input
            type="email"
            label="이메일"
            placeholder="이메일을 입력하세요"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            fullWidth
          />

          <Input
            type="text"
            label="닉네임"
            placeholder="닉네임을 입력하세요"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            error={errors.nickname}
            fullWidth
          />

          <Input
            type="password"
            label="비밀번호"
            placeholder="비밀번호를 입력하세요 (8자 이상)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            fullWidth
          />

          <Input
            type="password"
            label="비밀번호 확인"
            placeholder="비밀번호를 다시 입력하세요"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            error={errors.passwordConfirm}
            helperText={
              passwordConfirm
                ? password === passwordConfirm
                  ? '비밀번호가 일치합니다'
                  : '비밀번호가 일치하지 않습니다'
                : undefined
            }
            helperType={password === passwordConfirm ? 'success' : 'error'}
            fullWidth
          />

          <Button type="submit" fullWidth isLoading={isLoading}>
            회원가입
          </Button>
        </form>

        <p className={styles.footer}>
          이미 계정이 있으신가요? <Link to="/login">로그인</Link>
        </p>
      </div>
    </div>
  )
}
