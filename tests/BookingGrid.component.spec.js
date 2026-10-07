import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import * as Icons from '@element-plus/icons-vue'
import BookingGrid from '@/components/booking/BookingGrid.vue'
import { buildTimeSlots } from '@/utils/bookingGrid'

const BK = { id: 'b1', status: 'upcoming', customer_name: 'Budi', start_time: '14:00:00', end_time: '15:00:00' }
const VIP = { id: 'r1', name: 'VIP 1', room_template: { id: 't1', name: 'VIP' }, bookings: [BK] }
const REG = { id: 'r2', name: 'Reg 1', room_template: { id: 't2', name: 'Regular' }, bookings: [] }
const PER_TYPE_EVENT = { id: 'e1', event_name: 'Turnamen', start_time: '18:00', end_time: '20:00',
  booking_scope: 'per_room_type', selected_room_template_ids: ['t2'] }
const { slots } = buildTimeSlots('10:00:00', '22:00:00')

const mountGrid = (props = {}) => mount(BookingGrid, {
  props: { date: '2099-01-01', store: 's1', loading: false, dashboardData: { rooms: [VIP, REG] },
    timeSlots: slots, openHour: 10, eventBookings: [], isNewBookingMode: false, withPanel: false, ...props },
  global: { plugins: [ElementPlus], components: Icons },
})
const roomNames = (w) => w.findAll('.room-row .room-label-cell').map((c) => c.text())

describe('BookingGrid', () => {
  it('shows the first room-type tab, and another tab on click', async () => {
    const w = mountGrid()
    expect(roomNames(w)[0]).toContain('VIP 1')
    await w.findAll('.room-type-tab')[1].trigger('click')
    expect(roomNames(w)[0]).toContain('Reg 1')
  })

  it('goes back to the first tab when the date changes', async () => {
    const w = mountGrid()
    await w.findAll('.room-type-tab')[1].trigger('click')
    await w.setProps({ date: '2099-01-02' })
    expect(roomNames(w)[0]).toContain('VIP 1')
  })

  it('shows a per-room-type event only in a matching tab', async () => {
    const w = mountGrid({ eventBookings: [PER_TYPE_EVENT] })
    expect(w.find('.event-merged-block').exists()).toBe(false)
    await w.findAll('.room-type-tab')[1].trigger('click')
    expect(w.find('.event-merged-block').exists()).toBe(true)
  })

  it('marks empty slots clickable only in new-booking mode', async () => {
    expect(mountGrid().find('.empty-slot.clickable').exists()).toBe(false)
    expect(mountGrid({ isNewBookingMode: true }).find('.empty-slot.clickable').exists()).toBe(true)
  })

  it('emits slot, booking, event and date clicks with their payloads', async () => {
    const w = mountGrid({ eventBookings: [{ ...PER_TYPE_EVENT, booking_scope: 'full_venue' }] })
    await w.findAll('.room-row .empty-slot')[4].trigger('click')
    expect(w.emitted('slot-click')[0]).toEqual([VIP, '14:00', 4])
    await w.find('.booking-block').trigger('click')
    expect(w.emitted('booking-click')[0]).toEqual([BK])
    await w.find('.event-merged-block').trigger('click')
    expect(w.emitted('event-click')[0][0].id).toBe('e1')
    await w.findAll('.grid-area button')[0].trigger('click')
    await w.findAll('.grid-area button')[1].trigger('click')
    expect(w.emitted('change-date')).toEqual([[-1], [1]])
  })

  it('places a booking block from its start and end time', () => {
    const style = mountGrid().find('.booking-block').attributes('style')
    expect(style).toContain('left: 400px')
    expect(style).toContain('width: 96px')
  })
})
