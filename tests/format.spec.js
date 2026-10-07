import { describe, it, expect } from 'vitest'
import { formatRp, formatDateDisplay, formatDate } from '@/utils/format'

describe('format', () => {
  it('formatRp uses Indonesian grouping and treats empty as 0', () => {
    expect(formatRp(1500000)).toBe('Rp 1.500.000')
    expect(formatRp(null)).toBe('Rp 0')
  })
  it('formatDateDisplay gives the long Indonesian date, "-" when empty', () => {
    expect(formatDateDisplay('2026-10-07')).toBe('Rabu, 07 Oktober 2026')
    expect(formatDateDisplay('')).toBe('-')
  })
  it('formatDate gives the short date, "-" when empty', () => {
    expect(formatDate('2026-10-07')).toBe('07 Okt 2026')
    expect(formatDate(null)).toBe('-')
  })
})
