import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it, expect } from 'vitest'

const filesUnder = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f)
    return statSync(p).isDirectory() ? filesUnder(p) : [p]
  })

// toISOString() is UTC: between 00:00 and 06:59 WIB it gives yesterday.
// Use todayWIB() / shiftDate() from @/utils/bookingTime instead.
const UTC_DATE_CUT =
  /new Date\(\)\.toISOString\(\)|\.toISOString\(\)\.(split\(\s*['"]T['"]\s*\)|slice\(\s*0\s*,\s*10\s*\)|substring\(\s*0\s*,\s*10\s*\))|\.toJSON\(\)/

describe('no UTC "today"', () => {
  it('the pattern catches the ways a UTC date gets cut to YYYY-MM-DD', () => {
    const samples = [
      "new Date().toISOString().split('T')[0]",
      'd.toISOString().split("T")[0]',
      'new Date(Date.now()).toISOString().slice(0, 10)',
      'when.toISOString().substring(0,10)',
      'new Date().toJSON()',
    ]
    expect(samples.filter((s) => !UTC_DATE_CUT.test(s))).toEqual([])
  })

  it('no source outside bookingTime.js cuts a UTC date', () => {
    const offenders = filesUnder('src')
      .filter((p) => /\.(vue|js)$/.test(p) && !p.endsWith('utils/bookingTime.js'))
      .filter((p) => UTC_DATE_CUT.test(readFileSync(p, 'utf8')))
    expect(offenders).toEqual([])
  })
})
