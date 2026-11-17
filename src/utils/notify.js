import { ElMessage } from 'element-plus'
import { requestIdOf } from '@/utils/requestId'

/**
 * Show a failed API call to the user.
 * - 403: nothing here; the API interceptor already shows "no access" once.
 * - Otherwise the server message when there is one, else `fallback`, plus the
 *   request code when the request had an X-Request-ID.
 */
export const notifyError = (err, fallback) => {
  if (err?.response?.status === 403) return
  const message = err?.response?.data?.message || fallback
  // Short request code (first 8 characters) so staff can report the exact failure;
  // the backend log can be searched by that prefix.
  const id = requestIdOf(err)
  ElMessage.error(id ? `${message} (Kode: ${id.slice(0, 8)})` : message)
}
