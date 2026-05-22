import api from '../index'

export const getEventBookings    = (params)           => api.get('/event-bookings', { params })
export const getEventBookingById = (id)               => api.get(`/event-bookings/${id}`)
export const createEventBooking  = (payload)          => api.post('/event-bookings', payload)
export const cancelEventBooking  = (id, payload)      => api.patch(`/event-bookings/${id}/cancel`, payload)
export const getEventDashboard   = (params)           => api.get('/event-bookings/dashboard', { params })
export const previewEventPrice   = (params)           => api.get('/event-bookings/preview-price', { params })
export const getEventPrice       = (storeId)          => api.get(`/stores/${storeId}/event-price`)
export const upsertEventPrice    = (storeId, payload) => api.put(`/stores/${storeId}/event-price`, payload)
