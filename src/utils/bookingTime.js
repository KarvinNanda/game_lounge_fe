// Branch times (booking_date + start_time) are wall-clock WIB.
// WIB is a fixed UTC+7 offset with no daylight saving.
const WIB_OFFSET_HOURS = 7

/**
 * True when the booking's start time has passed. The backend only allows
 * cancelling bookings that have not started, so the UI hides Cancel then.
 *
 * booking_date may be "YYYY-MM-DD" or an ISO timestamp; only its date part
 * is used. The result does not depend on the laptop's timezone, only on its
 * clock; the backend still makes the final decision.
 */
export const hasStarted = (booking, now = new Date()) => {
  const [y, m, d] = String(booking?.booking_date ?? '').slice(0, 10).split('-').map(Number)
  const [hh, mm] = String(booking?.start_time ?? '').slice(0, 5).split(':').map(Number)
  if (![y, m, d, hh, mm].every(Number.isFinite)) return false
  return now.getTime() >= Date.UTC(y, m - 1, d, hh - WIB_OFFSET_HOURS, mm)
}
