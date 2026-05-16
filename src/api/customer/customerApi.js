import api from '../index'

// Mengambil list customer dengan filter & pagination
export const getCustomers = (params) => api.get('/customers', { params })
// Mengambil detail 1 customer beserta riwayat booking
export const getCustomerById = (id) => api.get(`/customers/${id}`)
// Membuat customer baru (auto-generate & kirim password via email)
export const createCustomer = (payload) => api.post('/customers', payload)
// Update data customer
export const updateCustomer = (id, payload) => api.put(`/customers/${id}`, payload)
// Update catatan saja
export const updateCustomerNotes = (id, payload) => api.patch(`/customers/${id}/notes`, payload)
// Hapus customer
export const deleteCustomer = (id) => api.delete(`/customers/${id}`)
// Kirim ulang password ke email
export const resendPassword = (id) => api.post(`/customers/${id}/resend-password`)
