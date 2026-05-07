import api from '../index'
export const getRoomTemplates = (params) => api.get('/room-templates', { params })
export const getRoomTemplateById = (id) => api.get(`/room-templates/${id}`)
export const createRoomTemplate = (payload) => api.post('/room-templates', payload)
export const updateRoomTemplate = (id, payload) => api.put(`/room-templates/${id}`, payload)
export const deleteRoomTemplate = (id) => api.delete(`/room-templates/${id}`)
