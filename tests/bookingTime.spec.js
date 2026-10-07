import process from 'node:process'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { hasStarted, todayWIB, shiftDate, businessDayWIB } from '@/utils/bookingTime'

// Branch times are WIB (UTC+7). Run in another timezone to prove the
// result does not depend on the staff laptop's timezone setting.
let originalTz
beforeAll(() => { originalTz = process.env.TZ; process.env.TZ = 'America/New_York' })
afterAll(() => { process.env.TZ = originalTz })

const booking = { booking_date: '2026-10-07', start_time: '14:00:00' }
const wib = (hh, mm) => new Date(Date.UTC(2026, 9, 7, hh - 7, mm)) // WIB = UTC+7

describe('hasStarted (WIB)', () => {
  it('is false before the start time in WIB', () => {
    expect(hasStarted(booking, wib(13, 59))).toBe(false)
  })

  it('is true exactly at the start time in WIB', () => {
    expect(hasStarted(booking, wib(14, 0))).toBe(true)
  })

  it('is true after the start time', () => {
    expect(hasStarted(booking, wib(15, 30))).toBe(true)
  })

  it('handles a WIB start time that is still the previous day in UTC', () => {
    const early = { booking_date: '2026-10-07', start_time: '02:00' }
    expect(hasStarted(early, wib(1, 59))).toBe(false)
    expect(hasStarted(early, wib(2, 0))).toBe(true)
  })

  it('uses only the date part of an ISO booking_date', () => {
    const iso = { booking_date: '2026-10-07T00:00:00Z', start_time: '14:00' }
    expect(hasStarted(iso, wib(13, 0))).toBe(false)
    expect(hasStarted(iso, wib(14, 0))).toBe(true)
  })

  it('is false when date or time is missing, so the backend decides', () => {
    expect(hasStarted({ start_time: '14:00' }, wib(23, 0))).toBe(false)
    expect(hasStarted({ booking_date: '2026-10-07' }, wib(23, 0))).toBe(false)
    expect(hasStarted(null, wib(23, 0))).toBe(false)
  })
})

describe('todayWIB', () => {
  it('is the same day until 16:59:59 UTC', () => {
    expect(todayWIB(new Date('2026-10-07T16:59:59Z'))).toBe('2026-10-07')
  })
  it('is the next day from 17:00 UTC (00:00 WIB)', () => {
    expect(todayWIB(new Date('2026-10-07T17:00:00Z'))).toBe('2026-10-08')
  })
  it('is the next day at 23:30 UTC (06:30 WIB)', () => {
    expect(todayWIB(new Date('2026-10-07T23:30:00Z'))).toBe('2026-10-08')
  })
})

describe('shiftDate', () => {
  it('crosses a month end', () => expect(shiftDate('2026-10-31', 1)).toBe('2026-11-01'))
  it('crosses a year start backwards', () => expect(shiftDate('2026-01-01', -1)).toBe('2025-12-31'))
  it('lands on a leap day', () => expect(shiftDate('2028-02-28', 1)).toBe('2028-02-29'))
})

// A business day runs from opening (10:00) past midnight to closing (02:00 at
// the latest); it ends at the 06:00 WIB cutoff.
describe('businessDayWIB', () => {
  it('is still yesterday at 00:30 WIB (sessions of last night are running)', () => {
    expect(businessDayWIB(new Date('2026-10-07T17:30:00Z'))).toBe('2026-10-07')
  })
  it('is still yesterday at 05:59 WIB', () => {
    expect(businessDayWIB(new Date('2026-10-07T22:59:00Z'))).toBe('2026-10-07')
  })
  it('turns over at 06:00 WIB', () => {
    expect(businessDayWIB(new Date('2026-10-07T23:00:00Z'))).toBe('2026-10-08')
  })
  it('is the calendar day during opening hours', () => {
    expect(businessDayWIB(new Date('2026-10-08T05:00:00Z'))).toBe('2026-10-08') // 12:00 WIB
  })
})
