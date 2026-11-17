// X-Request-ID: one ID per API request so a staff report ("Kode: 1a2b3c4d") can be
// matched with the backend log. The backend accepts 1-64 characters [A-Za-z0-9_-]
// and echoes the ID in its response header.

const hex = (bytes) => Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')

export const newRequestId = (cryptoImpl = globalThis.crypto) => {
  if (cryptoImpl?.randomUUID) return cryptoImpl.randomUUID()
  // Fallbacks for browsers without randomUUID (it needs a secure context).
  if (cryptoImpl?.getRandomValues) return hex(cryptoImpl.getRandomValues(new Uint8Array(16)))
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
}

// The ID of a failed request: the one the server returned, else the one we sent.
export const requestIdOf = (err) =>
  err?.response?.headers?.['x-request-id'] || err?.config?.headers?.['X-Request-ID'] || ''
