// Booking calendar grid geometry (moved unchanged from BookingView.vue).
// One column per hour; times before the opening hour belong to the next day.

export const SLOT_WIDTH = 100 // px per hour
export const ROW_HEIGHT = 56  // px per room row

/** Hourly slot labels from open to close, crossing midnight when close <= open. */
export const buildTimeSlots = (openTime = '10:00:00', closeTime = '02:00:00') => {
  const openHour = parseInt(openTime.split(':')[0])
  let closeHour = parseInt(closeTime.split(':')[0])
  if (closeHour <= openHour) closeHour += 24

  const slots = []
  for (let h = openHour; h < closeHour; h++) {
    slots.push(`${String(h % 24).padStart(2, '0')}:00`)
  }
  return { slots, openHour, closeHour }
}

/** Horizontal pixel offset of a "HH:MM" time from the opening hour. */
export const timeToOffset = (timeStr, openHour) => {
  if (!timeStr) return 0
  const parts = timeStr.split(':')
  let h = parseInt(parts[0])
  const m = parseInt(parts[1] || 0)
  if (h < openHour) h += 24
  return ((h - openHour) + m / 60) * SLOT_WIDTH
}

export const bookingBlockStyle = (bk, openHour) => {
  const startPx = timeToOffset(bk.start_time, openHour)
  const endPx = timeToOffset(bk.end_time, openHour)
  const width = Math.max(endPx - startPx - 4, 30)
  return { left: startPx + 'px', width: width + 'px' }
}

export const blockClass = (status) => ({
  upcoming: 'block-upcoming',
  ongoing: 'block-ongoing',
  completed: 'block-completed',
  cancelled: 'block-cancelled',
}[status] || 'block-upcoming')

/** Merged event block covering every room row of the active tab. */
export const eventBlockStyle = (event, openHour, roomCount) => {
  const startPx = timeToOffset(event.start_time, openHour)
  const endPx = timeToOffset(event.end_time, openHour)
  const width = Math.max(endPx - startPx - 4, 20)
  return {
    left: startPx + 'px',
    width: width + 'px',
    height: (roomCount * ROW_HEIGHT - 8) + 'px',
    top: '4px',
  }
}

/** Full-venue events show in every tab; per-room-type only where a room's template is selected. */
export const isEventInRoomGroup = (event, rooms) => {
  if (!event.booking_scope || event.booking_scope === 'full_venue') return true
  let ids = event.selected_room_template_ids
  if (!ids) return false
  if (typeof ids === 'string') {
    try { ids = JSON.parse(ids) } catch { return false }
  }
  if (!Array.isArray(ids) || ids.length === 0) return false
  return rooms.some(r => ids.includes(r.room_template?.id))
}

/** Rooms grouped by template name, in first-seen order; "Other" without a template. */
export const groupRoomsByTemplate = (rooms) => {
  const groups = {}
  for (const room of rooms) {
    const tname = room.room_template?.name || 'Other'
    if (!groups[tname]) groups[tname] = { templateName: tname, rooms: [] }
    groups[tname].rooms.push(room)
  }
  return Object.values(groups)
}
