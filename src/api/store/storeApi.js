import api from '../index'
export const getStores = (params) => api.get('/stores', { params })
export const getStoreById = (id) => api.get(`/stores/${id}`)
export const createStore = (payload) => api.post('/stores', payload)
export const updateStore = (id, payload) => api.put(`/stores/${id}`, payload)
export const deleteStore = (id) => api.delete(`/stores/${id}`)
