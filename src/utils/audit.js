const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
// Rows created by the seed script or a background job, not by a person.
const SYSTEM = new Set(['seed', 'system'])

/**
 * Who to show in an audit row. created_by / updated_by hold a staff username,
 * "seed", or a customer id (online bookings). The backend resolves them into
 * created_by_name / updated_by_name on list and detail endpoints; a name wins.
 * A raw id means nothing to staff, so it is hidden.
 */
export const auditUser = (by, name) => {
  const shown = name || by
  if (typeof shown === 'string' && SYSTEM.has(shown)) return 'Sistem'
  if (name) return name
  if (by && typeof by === 'object') return by.name || by.username || null
  if (typeof by === 'string' && by && !UUID.test(by)) return by
  return null
}
