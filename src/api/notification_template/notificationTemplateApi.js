import api from '../index'

export const getTemplates     = ()          => api.get('/notification-templates')
export const getTemplateByKey = (key)       => api.get(`/notification-templates/${key}`)
export const updateTemplate   = (key, data) => api.put(`/notification-templates/${key}`, data)
export const previewTemplate  = (payload)   => api.post('/notification-templates/preview', payload)
