import api from '../index'

export const getBannersAdmin  = ()            => api.get('/banners/admin')
export const getBannerById    = (id)          => api.get(`/banners/${id}`)
export const createBanner     = (payload)     => api.post('/banners', payload)
export const updateBanner     = (id, payload) => api.put(`/banners/${id}`, payload)
export const deleteBanner     = (id)          => api.delete(`/banners/${id}`)
export const toggleBanner     = (id)          => api.patch(`/banners/${id}/toggle`)
export const reorderBanners   = (orders)      => api.patch('/banners/reorder', { orders })
