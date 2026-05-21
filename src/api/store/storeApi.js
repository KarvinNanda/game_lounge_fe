import api from '../index'
export const getStores = (params) => api.get('/stores', { params })
export const getStoreById = (id) => api.get(`/stores/${id}`)
export const createStore = (payload) => api.post('/stores', payload)
export const updateStore = (id, payload) => api.put(`/stores/${id}`, payload)
export const deleteStore = (id) => api.delete(`/stores/${id}`)

// Room toggle
export const updateStoreRoom  = (roomId, payload)   => api.patch(`/rooms/${roomId}`, payload)
export const toggleStoreRoom  = (roomId, isActive)  => api.patch(`/store-rooms/${roomId}/toggle`, { is_active: isActive })

// Effective operating hours (considers global holiday & store holiday)
export const getEffectiveOperatingHours = (storeId, date) =>
  api.get('/stores/operating-hours', { params: { store_id: storeId, date } })

// Global Holidays
export const getGlobalHolidays = (params) => api.get('/global-holidays', { params })
export const createGlobalHoliday = (payload) => api.post('/global-holidays', payload)
export const updateGlobalHoliday = (id, payload) => api.put(`/global-holidays/${id}`, payload)
export const deleteGlobalHoliday = (id) => api.delete(`/global-holidays/${id}`)
