import { useNavigate } from 'react-router-dom'
import useAuthStore from '../stores/authStore'
import useThemeStore, { type Theme } from '../stores/themeStore'
import styles from './SettingsPage.module.css'

const THEME_OPTIONS: { value: Theme; label: string; description: string; swatch: string }[] = [
  { value: 'default', label: '기본', description: '보라색 강조', swatch: '#4f46e5' },
  { value: 'gray', label: '그레이', description: '무채색에 가까운 톤다운', swatch: '#64748b' },
]

export default function SettingsPage() {
  const navigate = useNavigate()
  const { logout } = useAuthStore()
  const { theme, setTheme } = useThemeStore()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>설정</h1>
      </header>

      <div className={styles.content}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>테마</h2>
          <div className={styles.themeGrid}>
            {THEME_OPTIONS.map((option) => (
              <button
                key={option.value}
                className={`${styles.themeCard} ${theme === option.value ? styles.themeCardActive : ''}`}
                onClick={() => setTheme(option.value)}
              >
                <span className={styles.swatch} style={{ backgroundColor: option.swatch }} />
                <span className={styles.themeLabel}>{option.label}</span>
                <span className={styles.themeDescription}>{option.description}</span>
              </button>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <button className={styles.logoutButton} onClick={handleLogout}>
            로그아웃
          </button>
        </section>
      </div>

      <nav className={styles.bottomNav}>
        <button className={styles.navItem} onClick={() => navigate('/chat')}>
          채팅
        </button>
        <button className={styles.navItem} onClick={() => navigate('/friends')}>
          친구
        </button>
        <button className={`${styles.navItem} ${styles.navActive}`}>설정</button>
      </nav>
    </div>
  )
}
