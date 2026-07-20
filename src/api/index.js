import axios from 'axios'

// Semua rute admin berada di bawah prefix /api/admin (cookie staff_token
// ber-Path=/api/admin — tidak pernah terkirim ke rute customer/public)
const ADMIN_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/admin'

// Rute public (/api/public/*) TIDAK berada di bawah /api/admin
const PUBLIC_BASE = ADMIN_BASE.replace(/\/admin$/, '')

const api = axios.create({
  baseURL: ADMIN_BASE,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
  // Auth via cookie httpOnly (staff_token) — browser otomatis melampirkan
  // cookie ke setiap request. Token tidak pernah tersentuh JavaScript.
  withCredentials: true,
  // Batas ukuran payload (10 MB) — mencegah response bomb menggantung tab
  maxContentLength: 10 * 1024 * 1024,
  maxBodyLength: 10 * 1024 * 1024,
})

// Instance untuk endpoint public — tanpa credentials (tidak butuh cookie)
export const publicApi = axios.create({
  baseURL: PUBLIC_BASE,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Session habis / tidak valid — arahkan ke login.
      // Guard: jangan redirect-loop jika sudah di halaman login / recovery
      const path = window.location.pathname
      if (path !== '/login' && !path.startsWith('/admin-recovery')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
