import api from '../index'
export const login = (payload) => api.post('/auth/login', payload)
export const getMe = () => api.get('/auth/me')
export const logout = () => api.post('/auth/logout')
