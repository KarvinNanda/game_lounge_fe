// Feature flags, read from the Vite env at build time.
//
// VITE_FNB_ENABLED mirrors FNB_ENABLED on the backend (default off). While it is off,
// every /api/admin/fnb/* route returns 404, so the admin app must not offer FnB.
export const isFnbEnabled = (env = import.meta.env) => env.VITE_FNB_ENABLED === 'true'
