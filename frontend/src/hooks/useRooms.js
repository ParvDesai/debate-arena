import { useState, useEffect, useCallback, useRef } from 'react'
import api from '../services/api'

export default function useRooms() {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const isInitialMount = useRef(true)

  const fetchRooms = useCallback(async (isInitial = false) => {
    try {
      // Only set loading on initial mount
      if (isInitial) {
        setLoading(true)
      }
      const { data } = await api.get('/rooms')
      setRooms(data.rooms || [])
    } catch (err) {
      console.error('Failed to fetch rooms:', err.message)
    } finally {
      // Only clear loading on initial mount
      if (isInitial) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    // Fetch on initial mount
    if (isInitialMount.current) {
      fetchRooms(true)
      isInitialMount.current = false
    }

    // Poll every 10 seconds (without loading state)
    const interval = setInterval(() => {
      fetchRooms(false)
    }, 10000)

    return () => clearInterval(interval)
  }, [fetchRooms])

  return { rooms, loading, refetch: () => fetchRooms(false) }
}
