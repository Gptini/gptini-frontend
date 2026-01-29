import { useEffect, useRef, useState, useCallback } from 'react'
import { Client } from '@stomp/stompjs'
import { createStompClient } from '../services/stompClient'

interface UseWebSocketOptions {
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: string) => void
  autoConnect?: boolean
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { autoConnect = true } = options
  const clientRef = useRef<Client | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  const connect = useCallback(() => {
    if (clientRef.current?.connected) return

    const client = createStompClient({
      onConnect: () => {
        setIsConnected(true)
        options.onConnect?.()
      },
      onDisconnect: () => {
        setIsConnected(false)
        options.onDisconnect?.()
      },
      onError: options.onError,
    })

    clientRef.current = client
    client.activate()
  }, [options])

  const disconnect = useCallback(() => {
    if (clientRef.current?.connected) {
      clientRef.current.deactivate()
      clientRef.current = null
      setIsConnected(false)
    }
  }, [])

  useEffect(() => {
    if (autoConnect) {
      connect()
    }

    return () => {
      disconnect()
    }
  }, [autoConnect, connect, disconnect])

  return {
    client: clientRef.current,
    isConnected,
    connect,
    disconnect,
  }
}

export default useWebSocket
