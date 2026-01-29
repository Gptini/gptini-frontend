# React + TypeScript 패턴 가이드

GPTini 프론트엔드 개발 시 참고할 패턴들입니다.

---

## Component Patterns

### Composition Over Inheritance

```typescript
interface CardProps {
  children: React.ReactNode
  variant?: 'default' | 'outlined'
}

export function Card({ children, variant = 'default' }: CardProps) {
  return <div className={`card card-${variant}`}>{children}</div>
}

export function CardHeader({ children }: { children: React.ReactNode }) {
  return <div className="card-header">{children}</div>
}

export function CardBody({ children }: { children: React.ReactNode }) {
  return <div className="card-body">{children}</div>
}

// Usage
<Card>
  <CardHeader>Title</CardHeader>
  <CardBody>Content</CardBody>
</Card>
```

### Compound Components

```typescript
interface TabsContextValue {
  activeTab: string
  setActiveTab: (tab: string) => void
}

const TabsContext = createContext<TabsContextValue | undefined>(undefined)

export function Tabs({ children, defaultTab }: {
  children: React.ReactNode
  defaultTab: string
}) {
  const [activeTab, setActiveTab] = useState(defaultTab)

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </TabsContext.Provider>
  )
}
```

---

## Custom Hooks

### useToggle

```typescript
export function useToggle(initialValue = false): [boolean, () => void] {
  const [value, setValue] = useState(initialValue)

  const toggle = useCallback(() => {
    setValue(v => !v)
  }, [])

  return [value, toggle]
}

// Usage
const [isOpen, toggleOpen] = useToggle()
```

### useDebounce

```typescript
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}

// Usage
const [searchQuery, setSearchQuery] = useState('')
const debouncedQuery = useDebounce(searchQuery, 500)
```

---

## State Management

### Context + Reducer Pattern

```typescript
interface State {
  user: User | null
  loading: boolean
}

type Action =
  | { type: 'SET_USER'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload }
    case 'LOGOUT':
      return { ...state, user: null }
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    default:
      return state
  }
}

const AuthContext = createContext<{
  state: State
  dispatch: Dispatch<Action>
} | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    user: null,
    loading: false
  })

  return (
    <AuthContext.Provider value={{ state, dispatch }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
```

---

## Performance Optimization

### Memoization

```typescript
// useMemo for expensive computations
const sortedMessages = useMemo(() => {
  return messages.sort((a, b) => a.createdAt - b.createdAt)
}, [messages])

// useCallback for functions passed to children
const handleSend = useCallback((content: string) => {
  sendMessage(content)
}, [sendMessage])

// React.memo for pure components
export const MessageItem = React.memo<MessageItemProps>(({ message }) => {
  return (
    <div className="message">
      <span>{message.sender}</span>
      <p>{message.content}</p>
    </div>
  )
})
```

### Lazy Loading

```typescript
import { lazy, Suspense } from 'react'

const ChatRoom = lazy(() => import('./ChatRoom'))

export function App() {
  return (
    <Suspense fallback={<Loading />}>
      <ChatRoom />
    </Suspense>
  )
}
```

---

## Form Handling

### Controlled Form with Validation

```typescript
interface FormData {
  email: string
  password: string
}

interface FormErrors {
  email?: string
  password?: string
}

export function LoginForm() {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: ''
  })

  const [errors, setErrors] = useState<FormErrors>({})

  const validate = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.email.trim()) {
      newErrors.email = '이메일을 입력해주세요'
    }

    if (!formData.password) {
      newErrors.password = '비밀번호를 입력해주세요'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    // submit logic
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={formData.email}
        onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
      />
      {errors.email && <span className="error">{errors.email}</span>}
      {/* ... */}
    </form>
  )
}
```

---

## Error Boundary

```typescript
interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: null
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h2>오류가 발생했습니다</h2>
          <button onClick={() => this.setState({ hasError: false })}>
            다시 시도
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
```

---

## Keyboard & Accessibility

### Keyboard Navigation

```typescript
const handleKeyDown = (e: React.KeyboardEvent) => {
  switch (e.key) {
    case 'Enter':
      e.preventDefault()
      handleSubmit()
      break
    case 'Escape':
      handleClose()
      break
  }
}
```

### Focus Management

```typescript
export function Modal({ isOpen, onClose, children }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      modalRef.current?.focus()
    }
  }, [isOpen])

  return isOpen ? (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
      onKeyDown={e => e.key === 'Escape' && onClose()}
    >
      {children}
    </div>
  ) : null
}
```

---

## 파일 구조 권장

```
src/
├── components/       # 재사용 가능한 UI 컴포넌트
│   ├── common/       # Button, Input, Modal 등
│   └── chat/         # 채팅 관련 컴포넌트
├── pages/            # 페이지 컴포넌트
├── hooks/            # 커스텀 훅
├── contexts/         # Context providers
├── services/         # API 호출
├── types/            # TypeScript 타입 정의
└── utils/            # 유틸리티 함수
```
