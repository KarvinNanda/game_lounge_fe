import { notifyError } from '@/utils/notify'

const FALLBACK = 'Terjadi kesalahan. Coba lagi.'

/**
 * Show errors nobody caught as a toast instead of printing them to the
 * console. Vue's default handler and the browser's "Uncaught (in promise)"
 * report both print the whole error; for an Axios error that includes the
 * request and response bodies (customer data). Installed in production only,
 * so local debugging keeps the full console output.
 */
export const installErrorHandlers = (app, win = window) => {
  app.config.errorHandler = (err) => notifyError(err, FALLBACK)
  win.addEventListener('unhandledrejection', (e) => {
    e.preventDefault()
    notifyError(e.reason, FALLBACK)
  })
}
