import api from '../index'
export const getStaffs = (params) => api.get('/staffs', { params })
export const getStaffById = (id) => api.get(`/staffs/${id}`)
export const createStaff = (payload) => api.post('/staffs', payload)
export const updateStaff = (id, payload) => api.put(`/staffs/${id}`, payload)
export const deleteStaff = (id) => api.delete(`/staffs/${id}`)
