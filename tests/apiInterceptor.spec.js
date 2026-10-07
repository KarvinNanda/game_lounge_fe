import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { AxiosError } from 'axios'
import { ElMessage } from 'element-plus'
import api from '@/api/index'

// Make every request fail with the given HTTP status, like the server would.
const respondWith = (status) => {
  api.defaults.adapter = (config) =>
    Promise.reject(new AxiosError('fail', 'ERR_BAD_REQUEST', config, null, {
      status, data: { message: 'server text' }, headers: {}, config,
    }))
}

describe('api response interceptor', () => {
  let location
  beforeEach(() => {
    location = { pathname: '/bookings', href: '/bookings' }
    vi.stubGlobal('location', location)
    vi.spyOn(ElMessage, 'error').mockImplementation(() => {})
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('on 403 shows one grouped "no access" message and keeps the session', async () => {
    respondWith(403)
    await expect(api.post('/bookings/1/cancel')).rejects.toBeInstanceOf(AxiosError)
    expect(ElMessage.error).toHaveBeenCalledWith({ message: 'Anda tidak punya akses untuk aksi ini.', grouping: true })
    expect(location.href).toBe('/bookings')
  })

  it('on 401 still sends the user to login', async () => {
    respondWith(401)
    await expect(api.get('/auth/me')).rejects.toBeInstanceOf(AxiosError)
    expect(location.href).toBe('/login')
    expect(ElMessage.error).not.toHaveBeenCalled()
  })

  it('leaves other errors to the calling view', async () => {
    respondWith(500)
    await expect(api.get('/bookings')).rejects.toBeInstanceOf(AxiosError)
    expect(ElMessage.error).not.toHaveBeenCalled()
    expect(location.href).toBe('/bookings')
  })
})
