import api from './index'

export const uploadFile = (file, folder = 'img') => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('folder', folder)
  return api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}
