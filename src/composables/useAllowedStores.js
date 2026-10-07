import { ref, computed } from 'vue'
import { getStores } from '@/api/store/storeApi'
import { useAuthStore } from '@/stores/authStore'
import { fetchAllPages } from '@/utils/fetchAllPages'
import { readStoreAccess, allowedStores, defaultStoreId } from '@/utils/storeAccess'

/**
 * Branch dropdown for a view, limited to the staff's store_access.
 * @param {{ allowAll: boolean }} options  allowAll: the view can show
 *   "all branches" (store_id omitted). Only all-branches staff get it.
 */
export function useAllowedStores({ allowAll }) {
  const authStore = useAuthStore()
  const access = computed(() => readStoreAccess(authStore.staff))

  const stores = ref([])
  const loaded = ref(false)
  const canPickAll = computed(() => allowAll && access.value.allStores)
  // No usable branch: none granted, or none of the granted ones is active.
  // Views must not call branch-scoped APIs then (the backend answers 400).
  const noAccess = computed(
    () =>
      (!access.value.allStores && access.value.storeIds.length === 0) ||
      (loaded.value && stores.value.length === 0),
  )

  /** Load the allowed branches; returns the store_id to pre-select. */
  const loadStores = async () => {
    if (noAccess.value) {
      stores.value = []
      return ''
    }
    const all = await fetchAllPages((page) => getStores({ status: 'active', ...page }))
    stores.value = allowedStores(all, access.value)
    loaded.value = true
    return defaultStoreId(stores.value, access.value, { allowAll })
  }

  return { stores, canPickAll, noAccess, loadStores }
}
