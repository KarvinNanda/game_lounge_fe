import { ElMessage } from 'element-plus'

/**
 * Show a failed API call to the user.
 * - 403: nothing here; the API interceptor already shows "no access" once.
 * - Otherwise the server message when there is one, else `fallback`.
 */
export const notifyError = (err, fallback) => {
  if (err?.response?.status === 403) return
  ElMessage.error(err?.response?.data?.message || fallback)
}
