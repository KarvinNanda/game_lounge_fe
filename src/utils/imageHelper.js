import { uploadFile } from '@/api/uploadApi'
import { sanitizeUrl } from '@/utils/security'

// Strip suffix /api/admin (atau /api legacy) untuk mendapatkan host backend —
// asset statis (/assets/img/...) diserve dari root, bukan di bawah prefix API
const getBaseUrl = () =>
  (import.meta.env.VITE_API_URL || 'http://localhost:8080/api/admin').replace(/\/api(\/admin)?$/, '')

/**
 * Convert a relative path ("/assets/img/x.jpg") to the full backend URL.
 * Blob/data-image/http(s) URLs are returned as-is — after passing the
 * scheme allowlist in sanitizeUrl (javascript:, data:text/html, etc. are rejected).
 */
export const getImageUrl = (path) => {
  if (!path) return null
  const safe = sanitizeUrl(path)
  if (!safe) return null
  // Relative path → prefix with backend host
  if (safe.startsWith('/')) return `${getBaseUrl()}${safe}`
  return safe
}

/**
 * Upload a File object to the backend.
 * Returns the saved path string, e.g. "/assets/img/wifi.svg"
 */
export const uploadImage = async (file, folder = 'img') => {
  const { data } = await uploadFile(file, folder)
  return data.data.url
}
