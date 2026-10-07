// User-facing message for a failed login.
// Never echo the server message: if the backend words "unknown user" and
// "wrong password" differently, showing it lets an attacker enumerate
// usernames. One message for every credential failure.
export const loginErrorMessage = (err) => {
  const status = err?.response?.status
  if (!status) return 'Tidak dapat terhubung ke server.'
  if (status === 429) return 'Terlalu banyak percobaan. Coba lagi nanti.'
  if (status === 400 || status === 401 || status === 422) return 'Username atau password salah.'
  return 'Login gagal. Coba lagi.'
}
