import { defineStore } from 'pinia'
import { getMe, login, logout } from '@/api/auth/authApi'
import { getRoleById } from '@/api/role/roleApi'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || null,
    staff: null,
  }),
  getters: {
    isLoggedIn: (s) => !!s.token,
    isSystem:   (s) => !!(s.staff?.role?.is_system),
    // Normalize permissions to a flat array of strings
    // (backend may return string[] OR object[] with a 'name'/'slug'/'code' field)
    permissions: (s) => {
      const raw = s.staff?.role?.permissions ?? s.staff?.permissions ?? []
      return raw.map(p => (typeof p === 'string' ? p : (p?.name ?? p?.slug ?? p?.code ?? '')))
    },
  },
  actions: {
    async doLogin(username, password) {
      const { data } = await login({ username, password })
      this.token = data.data.token
      localStorage.setItem('token', this.token)

      if (data.data.staff) {
        this.staff = data.data.staff
      } else {
        await this.fetchMe()
        return   // fetchMe already calls _syncRolePermissions
      }
      await this._syncRolePermissions()
    },

    async fetchMe() {
      try {
        const { data } = await getMe()
        this.staff = data.data
        await this._syncRolePermissions()
      } catch {
        this.token = null
        this.staff = null
        localStorage.removeItem('token')
      }
    },

    // Jika backend login/me tidak menyertakan permissions di dalam role,
    // panggil GET /roles/:id untuk mengambil permissions secara terpisah.
    async _syncRolePermissions() {
      const roleId = this.staff?.role?.id
      if (!roleId) return

      // Sudah ada permissions? Tidak perlu fetch lagi
      const existing = this.staff?.role?.permissions ?? []
      if (existing.length > 0) return

      try {
        const { data } = await getRoleById(roleId)
        const perms = data?.data?.permissions ?? []
        if (perms.length > 0 && this.staff) {
          // Merge permissions ke dalam staff.role tanpa mengganti field lain
          this.staff = {
            ...this.staff,
            role: { ...this.staff.role, permissions: perms },
          }
        }
      } catch {
        // Silently fail — permissions tetap kosong, bukan crash
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
