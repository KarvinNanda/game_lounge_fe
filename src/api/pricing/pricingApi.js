import api from '../index'

// ── Pricing Config ────────────────────────────────────────────
export const getPricings = (params) => api.get('/pricing', { params })
export const getPricingByStore = (storeId) => api.get(`/pricing/${storeId}`)
export const createPricing = (payload) => api.post('/pricing', payload)
export const updatePricingConfig = (storeId, payload) => api.put(`/pricing/${storeId}`, payload)
export const deletePricing = (storeId) => api.delete(`/pricing/${storeId}`)

// ── Happy Hour Schedules ──────────────────────────────────────
export const addHappyHourSchedule = (storeId, payload) =>
  api.post(`/pricing/${storeId}/happy-hour/schedules`, payload)
export const deleteHappyHourSchedule = (storeId, id) =>
  api.delete(`/pricing/${storeId}/happy-hour/schedules/${id}`)

// ── Happy Hour Prices ─────────────────────────────────────────
export const getHappyHourPrices = (storeId) => api.get(`/pricing/${storeId}/happy-hour/prices`)
export const upsertHappyHourPrices = (storeId, payload) =>
  api.put(`/pricing/${storeId}/happy-hour/prices`, payload)

// ── Package Prices ────────────────────────────────────────────
export const getPackagePrices = (storeId) => api.get(`/pricing/${storeId}/packages`)
export const upsertPackagePrices = (storeId, payload) =>
  api.put(`/pricing/${storeId}/packages`, payload)
export const deletePackagePrice = (storeId, id) =>
  api.delete(`/pricing/${storeId}/packages/${id}`)

// ── Flash Sales ───────────────────────────────────────────────
export const getFlashSales = (storeId) => api.get(`/pricing/${storeId}/flash-sales`)
export const createFlashSale = (storeId, payload) =>
  api.post(`/pricing/${storeId}/flash-sales`, payload)
export const updateFlashSale = (id, payload) => api.put(`/pricing/flash-sales/${id}`, payload)
export const deleteFlashSale = (id) => api.delete(`/pricing/flash-sales/${id}`)

// ── Price Calculator ──────────────────────────────────────────
export const calculatePrice = (payload) => api.post('/pricing/calculate', payload)
