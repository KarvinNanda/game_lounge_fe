import api from '../index'
export const login = (payload) => api.post('/auth/login', payload)
export const getMe = () => api.get('/auth/me')
export const logout = () => api.post('/auth/logout')

// ── Admin Recovery (Forgot Password) ──────────────────────────
// Request reset password — kirim link ke email
export const requestPasswordReset = (email) =>
  api.post('/admin-recovery/request', { email })

// Validasi token sebelum tampilkan form reset
export const validateResetToken = (token) =>
  api.get(`/admin-recovery/${token}/validate`)

// Reset password dengan token yang valid
export const resetPassword = (token, payload) =>
  api.post(`/admin-recovery/${token}/reset`, payload)
