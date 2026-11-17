const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Who to show in an audit row. The backend sends the staff id in created_by /
 * updated_by; a raw id means nothing to staff, so it is hidden. A name wins
 * when the backend sends one (created_by_name, or created_by as { name }).
 */
export const auditUser = (by, name) => {
  if (name) return name
  if (by && typeof by === 'object') return by.name || by.username || null
  if (typeof by === 'string' && by && !UUID.test(by)) return by
  return null
}
