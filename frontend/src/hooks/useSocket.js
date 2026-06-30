import { useEffect, useRef } from 'react'
import { getSocket } from '../services/socket'
import useAuthStore from '../store/authStore'

export default function useSocket() {
  const token = useAuthStore((s) => s.token)
  const socketRef = useRef(null)

  useEffect(() => {
    if (!token) return

    const socket = getSocket(token)
    socketRef.current = socket

    if (!socket.connected) {
      socket.connect()
    }

    return () => {
      // Don't disconnect on unmount — the socket is a singleton
      // It will be disconnected when the user logs out
    }
  }, [token])

  return socketRef.current
}
