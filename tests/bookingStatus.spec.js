import { describe, it, expect } from 'vitest'
import { bookingStatusLabel } from '@/utils/bookingStatus'

describe('bookingStatusLabel', () => {
  it('shows the API booking status in Indonesian', () => {
    expect(bookingStatusLabel('upcoming')).toBe('Akan Datang')
    expect(bookingStatusLabel('ongoing')).toBe('Berlangsung')
    expect(bookingStatusLabel('completed')).toBe('Selesai')
    expect(bookingStatusLabel('cancelled')).toBe('Dibatalkan')
  })
  it('passes an unknown status through and shows "-" when empty', () => {
    expect(bookingStatusLabel('on_hold')).toBe('on_hold')
    expect(bookingStatusLabel(null)).toBe('-')
  })
})
