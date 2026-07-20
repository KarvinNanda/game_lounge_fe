import { defineStore } from 'pinia'
import { getMe, login, logout } from '@/api/auth/authApi'
import { getRoleById } from '@/api/role/roleApi'

// Migrasi cookie-only: bersihkan token peninggalan auth lama (pre-httpOnly).
// Berjalan sekali setiap app load — idempotent, aman jika sudah tidak ada.
localStorage.removeItem('token')

// Auth berbasis cookie httpOnly (staff_token) — JavaScript tidak bisa membaca
// cookie tersebut, jadi satu-satunya cara mengetahui status login adalah
// menanyakan server via GET /me. `authChecked` menandai pengecekan itu
// sudah dilakukan untuk page-load ini.
export const useAuthStore = defineStore('auth', {
  state: () => ({
    staff: null,
    authChecked: false,
  }),
  getters: {
    isLoggedIn: (s) => !!s.staff,
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
      // Server mengirim Set-Cookie httpOnly — tidak ada token di response body
      this.authChecked = true

      if (data.data?.staff) {
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
        this.staff = null
      } finally {
        this.authChecked = true
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
      // Server meng-clear cookie (Max-Age=0); client cukup reset state
      try { await logout() } catch {}
      this.staff = null
    },
  },
})
