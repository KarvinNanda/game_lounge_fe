import { uploadFile } from '@/api/uploadApi'

const getBaseUrl = () =>
  (import.meta.env.VITE_API_URL || 'http://localhost:8080/api').replace(/\/api.*$/, '')

/**
 * Convert a relative path ("/assets/img/x.jpg") to the full backend URL.
 * Blob/data/http URLs are returned as-is.
 */
export const getImageUrl = (path) => {
  if (!path) return null
  if (path.startsWith('http') || path.startsWith('blob:') || path.startsWith('data:')) return path
  return `${getBaseUrl()}${path}`
}

/**
 * Upload a File object to the backend.
 * Returns the saved path string, e.g. "/assets/img/wifi.svg"
 */
export const uploadImage = async (file, folder = 'img') => {
  const { data } = await uploadFile(file, folder)
  return data.data.url
}
