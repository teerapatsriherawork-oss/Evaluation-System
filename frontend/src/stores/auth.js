import axios from 'axios'
import { defineStore } from 'pinia'

const api = axios.create({
  baseURL: '/api',
  withCredentials: true
})

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('user')) || null,
    isAuthenticated: !!localStorage.getItem('user'),
    loading: false,
    error: null
  }),

  getters: {
    isHR: (state) => state.user?.role === 'hr',
    isEvaluatee: (state) => state.user?.role === 'evaluatee',
    isCommittee: (state) => state.user?.role === 'committee',
    userRole: (state) => state.user?.role || '',
    userName: (state) => state.user?.full_name || '',
  },

  actions: {
    async login(username, password) {
      this.loading = true
      this.error = null
      try {
        const { data } = await api.post('/auth/login', { username, password })
        this.user = data.data
        this.isAuthenticated = true
        localStorage.setItem('user', JSON.stringify(data.data))
        return data
      } catch (err) {
        this.error = err.response?.data?.message || 'เกิดข้อผิดพลาด'
        throw err
      } finally {
        this.loading = false
      }
    },

    async register(userData) {
      this.loading = true
      this.error = null
      try {
        const { data } = await api.post('/auth/register', userData)
        return data
      } catch (err) {
        this.error = err.response?.data?.message || 'เกิดข้อผิดพลาด'
        throw err
      } finally {
        this.loading = false
      }
    },

    async logout() {
      try {
        await api.post('/auth/logout')
      } catch (e) { /* ignore */ }
      this.user = null
      this.isAuthenticated = false
      localStorage.removeItem('user')
    },

    async fetchMe() {
      try {
        const { data } = await api.get('/auth/me')
        this.user = data.data
        this.isAuthenticated = true
        localStorage.setItem('user', JSON.stringify(data.data))
      } catch (e) {
        this.user = null
        this.isAuthenticated = false
        localStorage.removeItem('user')
      }
    }
  }
})

// Export api instance for use in other stores/views
export { api }
