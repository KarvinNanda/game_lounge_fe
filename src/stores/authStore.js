import { defineStore } from 'pinia'
import { getMe, login, logout } from '@/api/auth/authApi'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || null,
    staff: null,
  }),
  getters: {
    isLoggedIn: (s) => !!s.token,
    isSystem: (s) => s.staff?.role?.is_system || false,
    permissions: (s) => s.staff?.role?.permissions || s.staff?.permissions || [],
  },
  actions: {
    async doLogin(username, password) {
      const { data } = await login({ username, password })
      this.token = data.data.token
      localStorage.setItem('token', this.token)

      // Simpan staff dari response login, atau fetch ulang kalau tidak ada
      if (data.data.staff) {
        this.staff = data.data.staff
      } else {
        await this.fetchMe()
      }
    },

    async fetchMe() {
      try {
        const { data } = await getMe()
        this.staff = data.data
      } catch {
        // Token tidak valid, bersihkan
        this.token = null
        this.staff = null
        localStorage.removeItem('token')
      }
    },

    async doLogout() {
      try { await logout() } catch {}
      this.token = null
      this.staff = null
      localStorage.removeItem('token')
    },
  },
})
