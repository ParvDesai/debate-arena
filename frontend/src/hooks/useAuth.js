import { useState, useEffect, useCallback } from 'react'
import api from '../services/api'
import useAuthStore from '../store/authStore'

export default function useAuth() {
  const { user, token, setUser, setToken, clearUser } = useAuthStore()
  const [loading, setLoading] = useState(true)

  // Check session on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (!token) {
        setLoading(false)
        return
      }
      try {
        const { data } = await api.get('/auth/me')
        setUser(data.user)
      } catch {
        clearUser()
      } finally {
        setLoading(false)
      }
    }
    checkAuth()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    setToken(data.token)
    setUser(data.user)
    return data
  }, [setToken, setUser])

  const register = useCallback(async (username, email, password) => {
    const { data } = await api.post('/auth/register', { username, email, password })
    setToken(data.token)
    setUser(data.user)
    return data
  }, [setToken, setUser])

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // Continue even if the request fails
    }
    clearUser()
  }, [clearUser])

  return { user, token, loading, login, register, logout }
}
