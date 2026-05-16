import api from '../index'

// Dashboard utama: stats + revenue by type/branch/room
export const getSalesSummary = (params) => api.get('/sales/summary', { params })
// Data trend untuk line chart
export const getSalesTrend = (params) => api.get('/sales/trend', { params })
// Daftar transaksi (untuk modal detail & export)
export const getTransactions = (params) => api.get('/sales/transactions', { params })
