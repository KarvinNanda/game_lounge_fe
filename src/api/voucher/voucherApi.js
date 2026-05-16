import api from '../index'

export const getVouchers = (params) => api.get('/vouchers', { params })
export const getVoucherById = (id) => api.get(`/vouchers/${id}`)
export const generateCode = (name) => api.get('/vouchers/generate-code', { params: { name } })
export const createVoucher = (payload) => api.post('/vouchers', payload)
export const updateVoucher = (id, payload) => api.put(`/vouchers/${id}`, payload)
export const deleteVoucher = (id) => api.delete(`/vouchers/${id}`)
export const validateVoucher = (payload) => api.post('/vouchers/validate', payload)
