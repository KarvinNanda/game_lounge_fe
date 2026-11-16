// Room types and unit counts for the store wizard (Room Setup step).
//
// PUT /admin/stores/:id treats unit_count as a target: a higher count adds units,
// the same count changes nothing, and a lower count is rejected with 400 (units are
// taken out of service with the per-unit toggle instead). The backend counts every
// unit that is not deleted, inactive ones included, so the same count is used here
// as the floor (existing_units) when editing a branch.
//
// The backend also rejects new units for an inactive (or deleted) room type, on both
// create and update; sending the current count for such a type is still accepted.
// So an inactive type is hidden unless the branch already has units of it, and then
// it can be kept but not grown (can_add = false).

const templateIdOf = (room) => room.room_template?.id ?? room.room_template_id

export const roomSetupRows = (templates, storeRooms = []) => {
  const current = {}
  for (const room of storeRooms) {
    const id = templateIdOf(room)
    if (id != null) current[id] = (current[id] || 0) + 1
  }
  return templates
    .map((t) => {
      const existing = current[t.id] || 0
      return {
        ...t,
        existing_units: existing,
        can_add: t.is_active !== false,
        selected: existing > 0,
        unit_count: Math.max(existing, 1),
      }
    })
    .filter((r) => r.can_add || r.existing_units > 0)
}

export const roomsPayload = (rows) => rows
  .filter((r) => r.selected)
  .map((r) => ({ room_template_id: r.id, unit_count: r.unit_count }))
