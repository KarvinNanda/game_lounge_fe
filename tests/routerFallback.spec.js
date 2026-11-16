import { describe, it, expect } from 'vitest'
import router from '@/router'

describe('unknown URLs', () => {
  it('redirect to the dashboard instead of rendering a blank page', () => {
    const last = router.resolve('/halaman-yang-tidak-ada').matched.at(-1)
    expect(last?.redirect).toBe('/dashboard')
  })

  it('does not swallow real routes', () => {
    expect(router.resolve('/bookings').name).toBe('Bookings')
    expect(router.resolve('/login').name).toBe('Login')
  })
})
