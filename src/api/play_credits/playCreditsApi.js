import api from '../index'

// ── Packages ──────────────────────────────────────────────────
export const getPackages = (params) => api.get('/play-credits/packages', { params })
export const getActivePackages = () => api.get('/play-credits/packages/active')
export const getPackageById = (id) => api.get(`/play-credits/packages/${id}`)
export const createPackage = (formData) => api.post('/play-credits/packages', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
})
export const updatePackage = (id, payload) => api.put(`/play-credits/packages/${id}`, payload)
export const deletePackage = (id) => api.delete(`/play-credits/packages/${id}`)

// ── Member Credits ────────────────────────────────────────────
export const getMemberCredits = (params) => api.get('/play-credits/members', { params })
export const getCreditById = (id) => api.get(`/play-credits/members/${id}`)
export const assignCredit = (payload) => api.post('/play-credits/members', payload)
export const adjustCredit = (id, payload) => api.patch(`/play-credits/members/${id}/adjust`, payload)
export const deleteCredit = (id) => api.delete(`/play-credits/members/${id}`)
