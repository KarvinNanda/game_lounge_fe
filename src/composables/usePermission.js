import { useAuthStore } from '@/stores/authStore'

/**
 * Composable untuk mengecek permission user.
 * Gunakan di setiap view:
 *
 *   import { usePermission } from '@/composables/usePermission'
 *   const { can } = usePermission()
 *
 * Di template:
 *   <el-button v-if="can('bookings.create')" ...>
 */
export function usePermission() {
  const authStore = useAuthStore()

  /**
   * @param {string} perm - permission key, e.g. 'bookings.create'
   * @returns {boolean}
   */
  const can = (perm) => {
    if (!perm) return true
    if (authStore.isSystem) return true
    return authStore.permissions.includes(perm)
  }

  return { can }
}
