import { createBrowserRouter, Navigate } from 'react-router-dom'
import { LoginPage, SignUpPage, ChatRoomListPage, ChatRoomPage, FriendsPage, SettingsPage } from '../pages'
import PrivateRoute from './PrivateRoute'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/signup',
    element: <SignUpPage />,
  },
  {
    path: '/',
    element: <PrivateRoute />,
    children: [
      {
        index: true,
        element: <Navigate to="/chat" replace />,
      },
      {
        path: 'chat',
        element: <ChatRoomListPage />,
      },
      {
        path: 'chat/:roomId',
        element: <ChatRoomPage />,
      },
      {
        path: 'friends',
        element: <FriendsPage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
    ],
  },
])

export default router
