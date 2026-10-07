import { describe, it, expect } from 'vitest'
import {
  SLOT_WIDTH, buildTimeSlots, timeToOffset, bookingBlockStyle, blockClass,
  eventBlockStyle, isEventInRoomGroup, groupRoomsByTemplate,
} from '@/utils/bookingGrid'

describe('bookingGrid', () => {
  it('builds hourly slots past midnight', () => {
    expect(buildTimeSlots('22:00:00', '02:00:00')).toEqual({ slots: ['22:00', '23:00', '00:00', '01:00'], openHour: 22, closeHour: 26 })
  })
  it('defaults to 10:00–02:00', () => {
    const { slots, openHour, closeHour } = buildTimeSlots()
    expect([slots.length, openHour, closeHour]).toEqual([16, 10, 26])
  })
  it('maps a time to pixels, hours before opening belong to the next day', () => {
    expect(timeToOffset('11:30', 10)).toBe(1.5 * SLOT_WIDTH)
    expect(timeToOffset('01:00', 10)).toBe(15 * SLOT_WIDTH)
    expect(timeToOffset('', 10)).toBe(0)
  })
  it('booking block width has a 30px minimum and a 4px gap', () => {
    expect(bookingBlockStyle({ start_time: '10:00', end_time: '11:00' }, 10)).toEqual({ left: '0px', width: '96px' })
    expect(bookingBlockStyle({ start_time: '10:00', end_time: '10:10' }, 10).width).toBe('30px')
  })
  it('maps status to block class, upcoming by default', () => {
    expect(blockClass('ongoing')).toBe('block-ongoing')
    expect(blockClass('weird')).toBe('block-upcoming')
  })
  it('event block spans the room rows of the active tab', () => {
    expect(eventBlockStyle({ start_time: '10:00', end_time: '12:00' }, 10, 3)).toEqual({ left: '0px', width: '196px', height: '160px', top: '4px' })
  })
  it('full-venue events show in every tab; per-room-type only where a template matches', () => {
    const rooms = [{ room_template: { id: 't1' } }]
    expect(isEventInRoomGroup({ booking_scope: 'full_venue' }, rooms)).toBe(true)
    expect(isEventInRoomGroup({ booking_scope: 'per_room_type', selected_room_template_ids: '["t1"]' }, rooms)).toBe(true)
    expect(isEventInRoomGroup({ booking_scope: 'per_room_type', selected_room_template_ids: ['t2'] }, rooms)).toBe(false)
    expect(isEventInRoomGroup({ booking_scope: 'per_room_type', selected_room_template_ids: 'not json' }, rooms)).toBe(false)
  })
  it('groups rooms by template name, "Other" when missing', () => {
    const groups = groupRoomsByTemplate([{ id: 1, room_template: { name: 'VIP' } }, { id: 2 }, { id: 3, room_template: { name: 'VIP' } }])
    expect(groups.map((g) => [g.templateName, g.rooms.length])).toEqual([['VIP', 2], ['Other', 1]])
  })
})
