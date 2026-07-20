/**
 * security.js — utility keamanan terpusat
 *
 * Kumpulan helper untuk sanitasi input/output di sisi client.
 * Catatan: validasi client HANYA untuk UX & defense-in-depth —
 * validasi otoritatif tetap wajib di backend.
 */

// Skema URL yang diizinkan untuk gambar / link eksternal
const SAFE_URL_SCHEMES = ['http:', 'https:', 'blob:', 'data:']

// data: URI hanya boleh untuk gambar (mencegah data:text/html XSS)
const SAFE_DATA_PREFIX = /^data:image\/(png|jpe?g|gif|webp|svg\+xml|x-icon);/i

/**
 * Escape karakter HTML spesial. Dipakai saat perlu menyisipkan
 * string tak terpercaya ke konteks HTML di luar interpolasi Vue
 * (interpolasi {{ }} Vue sudah otomatis escape).
 */
export const escapeHtml = (str) => {
  if (str === null || str === undefined) return ''
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

/**
 * Validasi URL terhadap allowlist skema.
 * Menolak javascript:, vbscript:, file:, dan data: non-gambar.
 * @returns {string|null} URL jika aman, null jika tidak
 */
export const sanitizeUrl = (url) => {
  if (!url || typeof url !== 'string') return null
  const trimmed = url.trim()

  // Relative path ("/assets/img/x.jpg") selalu aman — tidak punya skema
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return trimmed

  let parsed
  try {
    parsed = new URL(trimmed)
  } catch {
    return null // bukan URL absolut valid dan bukan relative path
  }

  if (!SAFE_URL_SCHEMES.includes(parsed.protocol)) return null
  if (parsed.protocol === 'data:' && !SAFE_DATA_PREFIX.test(trimmed)) return null

  return trimmed
}

/**
 * Buka URL eksternal di tab baru dengan noopener+noreferrer
 * (mencegah tab-nabbing / reverse tabnabbing).
 * URL yang tidak lolos sanitizeUrl tidak dibuka sama sekali.
 */
export const safeOpen = (url) => {
  const safe = sanitizeUrl(url)
  if (!safe) return false
  window.open(safe, '_blank', 'noopener,noreferrer')
  return true
}

/**
 * Normalisasi nomor WhatsApp Indonesia → digit murni dengan prefix 62.
 * Menolak input yang setelah dibersihkan bukan nomor valid (8–15 digit).
 * @returns {string|null}
 */
export const normalizeWhatsApp = (number) => {
  if (!number || typeof number !== 'string') return null
  const digits = number.replace(/\D/g, '')
  if (digits.length < 8 || digits.length > 15) return null
  if (digits.startsWith('62')) return digits
  if (digits.startsWith('0')) return `62${digits.slice(1)}`
  return `62${digits}`
}

/**
 * Validasi format email sederhana (RFC-lite, cukup untuk UX).
 */
export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false
  if (email.length > 254) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)
}

/**
 * Truncate + strip karakter kontrol dari string bebas (nama, notes, dsb)
 * sebelum dikirim ke API. Mencegah payload aneh (null byte, escape seq).
 */
// Karakter kontrol C0 (kecuali tab/newline/CR yang sah di textarea) + DEL
const isControlChar = (code) =>
  (code < 32 && code !== 9 && code !== 10 && code !== 13) || code === 127

export const sanitizeText = (str, maxLength = 1000) => {
  if (str === null || str === undefined) return ''
  let out = ''
  for (const ch of String(str)) {
    if (!isControlChar(ch.charCodeAt(0))) out += ch
  }
  return out.slice(0, maxLength)
}
