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

/** 'YYYY-MM-DD' of `now` in WIB, independent of the laptop's timezone. */
export const todayWIB = (now = new Date()) =>
  new Date(now.getTime() + WIB_OFFSET_HOURS * 3600000).toISOString().slice(0, 10)

/** Calendar arithmetic on a 'YYYY-MM-DD' string; no timezone involved. */
export const shiftDate = (ymd, days) => {
  const [y, m, d] = ymd.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10)
}

// A business day runs from opening past midnight to closing (latest close is
// 02:00, earliest opening 10:00). Until this hour the dashboard stays on the
// business day that is still running, so night staff see their sessions.
// Change it if a branch ever closes after 06:00 or opens before it.
const BUSINESS_DAY_CUTOFF_HOURS = 6

/** 'YYYY-MM-DD' of the business day running at `now` (WIB, 06:00 cutoff). */
export const businessDayWIB = (now = new Date()) =>
  todayWIB(new Date(now.getTime() - BUSINESS_DAY_CUTOFF_HOURS * 3600000))
