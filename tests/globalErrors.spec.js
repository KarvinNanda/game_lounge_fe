import { readFileSync } from 'node:fs'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const m = vi.hoisted(() => ({ error: vi.fn() }))
vi.mock('element-plus', () => ({ ElMessage: { error: m.error } }))

import { installErrorHandlers } from '@/utils/globalErrors'

const FALLBACK = 'Terjadi kesalahan. Coba lagi.'

const install = () => {
  const app = { config: {} }
  const win = new EventTarget()
  installErrorHandlers(app, win)
  return { app, win }
}
const rejection = (reason) => {
  const e = new Event('unhandledrejection', { cancelable: true })
  e.reason = reason
  return e
}

describe('installErrorHandlers', () => {
  beforeEach(() => m.error.mockReset())

  it('Vue errors become a toast with the server message', () => {
    const { app } = install()
    app.config.errorHandler({ response: { status: 500, data: { message: 'Server sibuk' } } })
    expect(m.error).toHaveBeenCalledWith('Server sibuk')
  })

  it('Vue errors without a server message use the fallback', () => {
    const { app } = install()
    app.config.errorHandler(new TypeError('x is undefined'))
    expect(m.error).toHaveBeenCalledWith(FALLBACK)
  })

  it('an unhandled rejection is shown and its default console report is cancelled', () => {
    const { win } = install()
    const e = rejection({ response: { status: 422, data: { message: 'Data tidak valid' } } })
    win.dispatchEvent(e)
    expect(e.defaultPrevented).toBe(true)
    expect(m.error).toHaveBeenCalledWith('Data tidak valid')
  })

  it('403 shows no toast here (the API interceptor already did)', () => {
    const { app, win } = install()
    app.config.errorHandler({ response: { status: 403 } })
    win.dispatchEvent(rejection({ response: { status: 403 } }))
    expect(m.error).not.toHaveBeenCalled()
  })

  it('main.js installs the handlers only in production builds', () => {
    const main = readFileSync('src/main.js', 'utf8')
    expect(main).toMatch(/if \(import\.meta\.env\.PROD\) installErrorHandlers\(app\)/)
  })
})
