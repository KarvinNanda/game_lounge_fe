import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ElementPlus, { ElMessageBox } from 'element-plus'
import * as Icons from '@element-plus/icons-vue'

const m = vi.hoisted(() => ({
  getDashboard: vi.fn(), createBooking: vi.fn(), cancelBooking: vi.fn(), completeBooking: vi.fn(),
  getAvailableCredits: vi.fn(), calculatePrice: vi.fn(),
  getEventDashboard: vi.fn(), createEventBooking: vi.fn(), cancelEventBooking: vi.fn(), previewEventPrice: vi.fn(),
  getEffectiveOperatingHours: vi.fn(), getStores: vi.fn(), getCustomers: vi.fn(),
  apiGet: vi.fn(), publicGet: vi.fn(),
}))
vi.mock('@/api/booking/bookingApi', () => ({
  getDashboard: m.getDashboard, createBooking: m.createBooking, cancelBooking: m.cancelBooking,
  completeBooking: m.completeBooking, getAvailableCredits: m.getAvailableCredits,
  calculatePrice: m.calculatePrice, getSessionsEndingSoon: vi.fn(),
}))
vi.mock('@/api/booking/eventBookingApi', () => ({
  getEventDashboard: m.getEventDashboard, createEventBooking: m.createEventBooking,
  cancelEventBooking: m.cancelEventBooking, previewEventPrice: m.previewEventPrice,
}))
vi.mock('@/api/store/storeApi', () => ({
  getStores: m.getStores, getEffectiveOperatingHours: m.getEffectiveOperatingHours,
}))
vi.mock('@/api/customer/customerApi', () => ({ getCustomers: m.getCustomers }))
vi.mock('@/api/index', () => ({ default: { get: m.apiGet }, publicApi: { get: m.publicGet } }))

import BookingView from '@/views/booking/BookingView.vue'
import { useAuthStore } from '@/stores/authStore'

const TODAY = '2099-01-01'
const FUTURE = { id: 'b1', booking_code: 'BK-1', status: 'upcoming', customer_name: 'Budi',
  booking_date: TODAY, start_time: '14:00:00', end_time: '15:00:00', duration_hours: 1, total_price: 100000 }
const ROOM = { id: 'r1', name: 'Room 1', room_template_id: 't1', room_template: { id: 't1', name: 'VIP' }, bookings: [FUTURE] }
const EVENT = { id: 'e1', event_name: 'Turnamen', booking_date: TODAY, start_time: '18:00:00',
  end_time: '20:00:00', booking_scope: 'full_venue', total_price: 500000 }

const STAFF_ALL = { username: 'admin', role: { is_system: true, name: 'Owner' },
  store_access: { all_stores: true, store_ids: [] } }

const ok = (data) => Promise.resolve({ data: { data } })

const mountView = async (staff = STAFF_ALL) => {
  const pinia = createPinia()
  setActivePinia(pinia)
  useAuthStore().staff = staff
  const w = mount(BookingView, {
    attachTo: document.body,
    global: { plugins: [pinia, ElementPlus], components: Icons, stubs: { AuditTrail: true } },
  })
  await flushPromises()
  return w
}
const buttonByText = (w, text) => w.findAll('button').find((b) => b.text().includes(text))
const lastCall = (fn) => fn.mock.calls.at(-1)

describe('BookingView (characterization)', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] })
    vi.setSystemTime(new Date(`${TODAY}T03:00:00Z`))
    Object.values(m).forEach((fn) => fn.mockReset())
    m.getStores.mockResolvedValue({ data: { data: [{ id: 's1', name: 'Alpha' }, { id: 's2', name: 'Beta' }], meta: { total: 2 } } })
    m.getDashboard.mockImplementation(() => ok({ rooms: [structuredClone(ROOM)], open_time: '10:00:00', close_time: '22:00:00' }))
    m.getEffectiveOperatingHours.mockImplementation(() => ok({ open_time: '10:00:00', close_time: '22:00:00', is_holiday: false }))
    m.getEventDashboard.mockImplementation(() => ok([structuredClone(EVENT)]))
    m.calculatePrice.mockImplementation(() => ok({ final_price: 100000 }))
    m.createBooking.mockImplementation(() => ok({ booking_code: 'BK-NEW' }))
    m.cancelBooking.mockImplementation(() => ok({}))
    m.completeBooking.mockImplementation(() => ok({}))
    m.cancelEventBooking.mockImplementation(() => ok({}))
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    document.body.innerHTML = ''
  })

  it('loads dashboard, operating hours and events for the first branch and today', async () => {
    await mountView()
    expect(m.getDashboard).toHaveBeenCalledWith({ store_id: 's1', date: TODAY })
    expect(m.getEffectiveOperatingHours).toHaveBeenCalledWith('s1', TODAY)
    expect(m.getEventDashboard).toHaveBeenCalledWith({ store_id: 's1', date: TODAY })
  })

  it('renders booking blocks, event blocks and the operating hours', async () => {
    const w = await mountView()
    expect(w.find('.booking-block').text()).toContain('Budi')
    expect(w.find('.event-merged-block').text()).toContain('Turnamen')
    expect(w.text()).toContain('Jam Operasional: 10:00 – 22:00')
  })

  it('after midnight, opens on the business day still running (cutoff 06:00 WIB)', async () => {
    vi.setSystemTime(new Date('2099-01-01T22:00:00Z')) // 05:00 WIB on 2 Jan
    await mountView()
    expect(m.getDashboard).toHaveBeenCalledWith({ store_id: 's1', date: '2099-01-01' })
  })

  it('from 06:00 WIB, opens on the new day', async () => {
    vi.setSystemTime(new Date('2099-01-01T23:00:00Z')) // 06:00 WIB on 2 Jan
    await mountView()
    expect(m.getDashboard).toHaveBeenCalledWith({ store_id: 's1', date: '2099-01-02' })
  })

  it('next-day button after clearing the date picker steps from today', async () => {
    const w = await mountView()
    w.findComponent({ name: 'BookingFilterBar' }).vm.$emit('update:date', null)
    await flushPromises()
    await w.findAll('.grid-area button')[1].trigger('click')
    await flushPromises()
    expect(lastCall(m.getDashboard)[0]).toEqual({ store_id: 's1', date: '2099-01-02' })
  })

  it('next-day button reloads with the next date', async () => {
    const w = await mountView()
    await w.findAll('.grid-area button')[1].trigger('click')
    await flushPromises()
    expect(lastCall(m.getDashboard)[0]).toEqual({ store_id: 's1', date: '2099-01-02' })
  })

  it('shows a locked badge for one-branch staff', async () => {
    const w = await mountView({ ...STAFF_ALL, role: { is_system: false, permissions: ['bookings.view'] },
      store_access: { all_stores: false, store_ids: ['s2'] } })
    expect(w.find('.store-locked-badge').text()).toContain('Beta')
    expect(m.getDashboard).toHaveBeenCalledWith({ store_id: 's2', date: TODAY })
  })

  it('shows a warning and loads nothing without branch access', async () => {
    const w = await mountView({ ...STAFF_ALL, store_access: undefined })
    expect(w.text()).toContain('Tidak ada cabang aktif yang bisa Anda akses')
    expect(m.getDashboard).not.toHaveBeenCalled()
  })

  it('booking click opens the detail panel next to the grid', async () => {
    const w = await mountView()
    await w.find('.booking-block').trigger('click')
    expect(w.text()).toContain('DETAIL BOOKING')
    expect(w.find('.grid-area').classes()).toContain('with-panel')
  })

  it('Cancel Booking shows for future bookings and hides once started', async () => {
    const w = await mountView()
    await w.find('.booking-block').trigger('click')
    expect(buttonByText(w, 'Cancel Booking')).toBeTruthy()

    m.getDashboard.mockImplementation(() => ok({ rooms: [{ ...structuredClone(ROOM),
      bookings: [{ ...FUTURE, booking_date: '2000-01-01' }] }] }))
    const w2 = await mountView()
    await w2.find('.booking-block').trigger('click')
    expect(buttonByText(w2, 'Cancel Booking')).toBeUndefined()
  })

  it('cancel booking sends the reason, closes the panel and reloads', async () => {
    const w = await mountView()
    await w.find('.booking-block').trigger('click')
    await buttonByText(w, 'Cancel Booking').trigger('click')
    await flushPromises()
    const reason = w.findAll('textarea').find((t) => t.attributes('placeholder')?.startsWith('Contoh: Customer'))
    await reason.setValue('Customer tidak jadi datang')
    const loads = m.getDashboard.mock.calls.length
    await w.findAll('button').filter((b) => b.text().includes('Konfirmasi Batalkan')).at(-1).trigger('click')
    await flushPromises()
    expect(m.cancelBooking).toHaveBeenCalledWith('b1', { reason: 'Customer tidak jadi datang' })
    expect(m.getDashboard.mock.calls.length).toBe(loads + 1)
    expect(w.text()).not.toContain('DETAIL BOOKING')
  })

  it('complete booking asks for confirmation, calls the API and reloads', async () => {
    vi.spyOn(ElMessageBox, 'confirm').mockResolvedValue('confirm')
    const w = await mountView()
    await w.find('.booking-block').trigger('click')
    const loads = m.getDashboard.mock.calls.length
    await buttonByText(w, 'Mark as Completed').trigger('click')
    await flushPromises()
    expect(m.completeBooking).toHaveBeenCalledWith('b1')
    expect(m.getDashboard.mock.calls.length).toBe(loads + 1)
  })

  it('new booking: pick mode, slot click fills the form and calculates the price', async () => {
    const w = await mountView()
    w.findComponent({ name: 'ElDropdown' }).vm.$emit('command', 'regular')
    await flushPromises()
    expect(w.text()).toContain('NEW BOOKING MODE')

    await w.findAll('.room-row .empty-slot')[4].trigger('click') // 10:00 + 4 h
    expect(w.text()).toContain('BOOKING BARU')
    expect(w.find('.room-chip').text()).toContain('Room 1')
    expect(w.find('.room-chip').text()).toContain('14:00 – 15:00')

    vi.advanceTimersByTime(600)
    await flushPromises()
    expect(m.calculatePrice).toHaveBeenCalledWith({ store_id: 's1', room_template_id: 't1',
      booking_date: TODAY, start_time: '14:00', end_time: '15:00' })
  })

  it('create booking sends exactly today\'s payload and shows the booking code', async () => {
    const w = await mountView()
    w.findComponent({ name: 'ElDropdown' }).vm.$emit('command', 'regular')
    await flushPromises()
    await w.findAll('.room-row .empty-slot')[4].trigger('click')
    vi.advanceTimersByTime(600)
    await flushPromises()
    await w.find('input[placeholder="Nama customer"]').setValue('Walk In')
    await buttonByText(w, 'Lanjutkan').trigger('click')
    await flushPromises()
    await buttonByText(w, 'Konfirmasi Booking').trigger('click')
    await flushPromises()
    expect(m.createBooking).toHaveBeenCalledWith({
      store_id: 's1', room_id: 'r1', customer_id: null, customer_name: 'Walk In',
      customer_whatsapp: null, customer_email: null, booking_date: TODAY,
      start_time: '14:00', end_time: '15:00', payment_method: 'cash',
      play_credit_id: null, voucher_code: null, notes: null,
    })
    expect(w.text()).toContain('BK-NEW')
  })

  it('event click opens event detail; cancel event sends the reason and reloads', async () => {
    const w = await mountView()
    await w.find('.event-merged-block').trigger('click')
    expect(w.text()).toContain('DETAIL EVENT')
    expect(w.find('.grid-area').classes()).not.toContain('with-panel')
    await buttonByText(w, 'Batalkan Event').trigger('click')
    await flushPromises()
    const reason = w.findAll('textarea').find((t) => t.attributes('placeholder') === 'Alasan pembatalan...')
    await reason.setValue('Venue sedang direnovasi')
    await w.findAll('button').filter((b) => b.text().includes('Konfirmasi Batalkan')).at(0).trigger('click')
    await flushPromises()
    expect(m.cancelEventBooking).toHaveBeenCalledWith('e1', { reason: 'Venue sedang direnovasi' })
  })

  it('closing a booking detail opened over an event detail shows the event detail again (finding)', async () => {
    const w = await mountView()
    await w.find('.event-merged-block').trigger('click')
    await w.find('.booking-block').trigger('click')
    expect(w.text()).toContain('DETAIL BOOKING')
    await w.find('.right-panel .panel-header button').trigger('click')
    expect(w.text()).toContain('DETAIL EVENT')
  })

  it('event form opens with the selected branch and date', async () => {
    const w = await mountView()
    w.findComponent({ name: 'ElDropdown' }).vm.$emit('command', 'event')
    await flushPromises()
    expect(w.text()).toContain('EVENT BOOKING BARU')
    expect(m.publicGet).toHaveBeenCalledWith('/public/room-templates?store_id=s1')
  })

  it('API failures go through notifyError (403 shows no extra toast)', async () => {
    m.cancelBooking.mockRejectedValue({ response: { status: 403, data: { message: 'x' } } })
    const { ElMessage } = await import('element-plus')
    const error = vi.spyOn(ElMessage, 'error').mockImplementation(() => {})
    const w = await mountView()
    await w.find('.booking-block').trigger('click')
    await buttonByText(w, 'Cancel Booking').trigger('click')
    await flushPromises()
    await w.findAll('textarea').find((t) => t.attributes('placeholder')?.startsWith('Contoh: Customer')).setValue('alasan panjang')
    await w.findAll('button').filter((b) => b.text().includes('Konfirmasi Batalkan')).at(-1).trigger('click')
    await flushPromises()
    expect(error).not.toHaveBeenCalled()
  })
})
