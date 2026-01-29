import { useEffect } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import useAuthStore from '../stores/authStore'

export default function PrivateRoute() {
  const { isAuthenticated, user, isLoading, fetchMe } = useAuthStore()

  useEffect(() => {
    if (isAuthenticated && !user && !isLoading) {
      fetchMe()
    }
  }, [isAuthenticated, user, isLoading, fetchMe])

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (isLoading || !user) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>로딩중...</div>
  }

  return <Outlet />
}
