import { describe, it, expect } from 'vitest'
import { loginErrorMessage } from '@/utils/authErrors'

const httpError = (status, message = 'User admin not found') => ({ response: { status, data: { message } } })

describe('loginErrorMessage', () => {
  it.each([400, 401, 422])('gives one generic message for %i', (status) => {
    expect(loginErrorMessage(httpError(status))).toBe('Username atau password salah.')
  })

  it('tells the user to wait on 429', () => {
    expect(loginErrorMessage(httpError(429))).toBe('Terlalu banyak percobaan. Coba lagi nanti.')
  })

  it('reports a network failure when there is no response', () => {
    expect(loginErrorMessage(new Error('Network Error'))).toBe('Tidak dapat terhubung ke server.')
  })

  it('falls back to a generic message for anything else', () => {
    expect(loginErrorMessage(httpError(500))).toBe('Login gagal. Coba lagi.')
  })

  it('never returns the server message', () => {
    for (const status of [400, 401, 403, 404, 422, 429, 500]) {
      expect(loginErrorMessage(httpError(status, 'SECRET-SERVER-TEXT'))).not.toContain('SECRET')
    }
  })
})
