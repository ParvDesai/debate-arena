import { create } from 'zustand'

const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('da_token') || null,
  setUser: (user) => set({ user }),
  setToken: (token) => {
    if (token) {
      localStorage.setItem('da_token', token)
    } else {
      localStorage.removeItem('da_token')
    }
    set({ token })
  },
  clearUser: () => {
    localStorage.removeItem('da_token')
    set({ user: null, token: null })
  },
}))

export default useAuthStore
