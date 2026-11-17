import { describe, it, expect } from 'vitest'
import { formatRp, formatDateDisplay, formatDate, formatPercent, formatCompact, hhmm } from '@/utils/format'

describe('format', () => {
  it('formatRp uses Indonesian grouping and treats empty as 0', () => {
    expect(formatRp(1500000)).toBe('Rp 1.500.000')
    expect(formatRp(null)).toBe('Rp 0')
  })
  it('formatRp rounds to whole rupiah (an average like 1.322.000 / 9 must not show decimals)', () => {
    expect(formatRp(1322000 / 9)).toBe('Rp 146.889')
  })
  it('formatDateDisplay gives the long Indonesian date, "-" when empty', () => {
    expect(formatDateDisplay('2026-10-07')).toBe('Rabu, 07 Oktober 2026')
    expect(formatDateDisplay('')).toBe('-')
  })
  it('formatDate gives the short date, "-" when empty', () => {
    expect(formatDate('2026-10-07')).toBe('07 Okt 2026')
    expect(formatDate(null)).toBe('-')
  })
  it('formatPercent uses a decimal comma and at most one decimal', () => {
    expect(formatPercent(15.2)).toBe('15,2%')
    expect(formatPercent(84.83)).toBe('84,8%')
    expect(formatPercent(74)).toBe('74%')
    expect(formatPercent(null)).toBe('0%')
  })
  it('formatCompact shortens chart axis amounts the Indonesian way (jt, rb)', () => {
    expect(formatCompact(1800000)).toBe('1,8 jt')
    expect(formatCompact(1500000)).toBe('1,5 jt')
    expect(formatCompact(900000)).toBe('900 rb')
    expect(formatCompact(0)).toBe('0')
  })
  it('hhmm drops the seconds the API sends, empty stays empty', () => {
    expect(hhmm('10:00:00')).toBe('10:00')
    expect(hhmm('09:30')).toBe('09:30')
    expect(hhmm(null)).toBe('')
  })
})
