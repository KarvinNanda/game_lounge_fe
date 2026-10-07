// Branch access for the logged-in staff, from GET /auth/me `store_access`.
// This is exactly what the backend enforces; do not derive it from
// role.is_system, is_all_stores or staff_stores.
//
// Fails closed: if /me has no store_access (older backend), the staff gets
// no branches instead of guessing.

/** @returns {{ allStores: boolean, storeIds: string[] }} */
export const readStoreAccess = (staff) => {
  const access = staff?.store_access
  return {
    allStores: access?.all_stores === true,
    storeIds: Array.isArray(access?.store_ids) ? access.store_ids : [],
  }
}

/** Branches from GET /stores that this staff may use. */
export const allowedStores = (stores, access) =>
  access.allStores ? stores : stores.filter((s) => access.storeIds.includes(s.id))

/**
 * Branch to pre-select. '' means "all branches", which only all-branches
 * staff get, and only on views that support it (`allowAll`).
 */
export const defaultStoreId = (stores, access, { allowAll }) => {
  if (allowAll && access.allStores) return ''
  return allowedStores(stores, access)[0]?.id ?? ''
}
