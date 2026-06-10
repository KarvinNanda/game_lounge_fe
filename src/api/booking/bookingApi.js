import api from '../index'

// Mengambil list booking dengan filter & pagination
export const getBookings = (params) => api.get('/bookings', { params })
// Mengambil detail 1 booking
export const getBookingById = (id) => api.get(`/bookings/${id}`)
// Membuat booking baru
export const createBooking = (payload) => api.post('/bookings', payload)
// Batalkan booking (wajib isi alasan)
export const cancelBooking = (id, payload) => api.patch(`/bookings/${id}/cancel`, payload)
// Tandai booking selesai
export const completeBooking = (id) => api.patch(`/bookings/${id}/complete`)
// Data kalender grid (semua booking sebuah store pada tanggal tertentu)
export const getDashboard = (params) => api.get('/bookings/dashboard', { params })
// Sesi yang akan berakhir dalam 30 menit (untuk bell notification)
export const getSessionsEndingSoon = (storeId) =>
  api.get('/bookings/sessions-ending-soon', { params: { store_id: storeId } })
// Play credits tersedia untuk customer di store tertentu
export const getAvailableCredits = (customerId, storeId, bookingDate) =>
  api.get('/bookings/available-credits', { params: { customer_id: customerId, store_id: storeId, booking_date: bookingDate } })
// Hitung harga booking (dari pricing engine)
export const calculatePrice = (payload) => api.post('/pricing/calculate', payload)
