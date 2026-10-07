import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'

const m = vi.hoisted(() => ({ getDashboard: vi.fn(), getEffectiveOperatingHours: vi.fn(), getEventDashboard: vi.fn() }))
vi.mock('@/api/booking/bookingApi', () => ({ getDashboard: m.getDashboard }))
vi.mock('@/api/booking/eventBookingApi', () => ({ getEventDashboard: m.getEventDashboard }))
vi.mock('@/api/store/storeApi', () => ({ getEffectiveOperatingHours: m.getEffectiveOperatingHours }))

import { useBookingDashboard } from '@/composables/useBookingDashboard'

const ok = (data) => Promise.resolve({ data: { data } })
const setup = (store = 's1', date = '2099-01-01', room = '') => {
  const refs = { store: ref(store), date: ref(date), room: ref(room) }
  let api
  mount(defineComponent({ setup() { api = useBookingDashboard(refs); return () => h('div') } }))
  return { api, refs }
}

describe('useBookingDashboard', () => {
  beforeEach(() => {
    Object.values(m).forEach((fn) => fn.mockReset())
    m.getDashboard.mockImplementation(() => ok({ rooms: [{ id: 'r1' }], operating_hours: '09:00 – 21:00' }))
    m.getEffectiveOperatingHours.mockImplementation(() => ok({ open_time: '10:00:00', close_time: '22:00:00' }))
    m.getEventDashboard.mockImplementation(() => ok([{ id: 'e1' }]))
  })

  it('does nothing without branch or date', async () => {
    await setup('').api.load()
    await setup('s1', '').api.load()
    expect(m.getDashboard).not.toHaveBeenCalled()
  })

  it('sends room_id only when a room is chosen', async () => {
    await setup().api.load()
    expect(m.getDashboard).toHaveBeenLastCalledWith({ store_id: 's1', date: '2099-01-01' })
    await setup('s1', '2099-01-01', 'r9').api.load()
    expect(m.getDashboard).toHaveBeenLastCalledWith({ store_id: 's1', date: '2099-01-01', room_id: 'r9' })
  })

  it('uses the effective operating hours for slots', async () => {
    const { api } = setup()
    await api.load()
    expect(api.operatingHours.value).toBe('10:00 – 22:00')
    expect(api.timeSlots.value).toHaveLength(12)
    expect(api.openHour.value).toBe(10)
    expect(api.allRooms.value).toEqual([{ id: 'r1' }])
    expect(api.eventBookings.value).toEqual([{ id: 'e1' }])
  })

  it('falls back to default slots when operating hours fail', async () => {
    m.getEffectiveOperatingHours.mockRejectedValue(new Error('x'))
    const { api } = setup()
    await api.load()
    expect(api.effectiveHours.value).toBeNull()
    expect(api.timeSlots.value).toHaveLength(16)
    expect(api.operatingHours.value).toBe('09:00 – 21:00')
  })

  it('keeps the dashboard when only events fail', async () => {
    m.getEventDashboard.mockRejectedValue(new Error('x'))
    const { api } = setup()
    await api.load()
    expect(api.eventBookings.value).toEqual([])
    expect(api.allRooms.value).toHaveLength(1)
  })
})
