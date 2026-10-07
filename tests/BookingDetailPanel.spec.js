import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ElementPlus, { ElMessageBox } from 'element-plus'
import * as Icons from '@element-plus/icons-vue'

const m = vi.hoisted(() => ({ cancelBooking: vi.fn(), completeBooking: vi.fn() }))
vi.mock('@/api/booking/bookingApi', () => ({ cancelBooking: m.cancelBooking, completeBooking: m.completeBooking }))

import BookingDetailPanel from '@/components/booking/BookingDetailPanel.vue'
import { useAuthStore } from '@/stores/authStore'

const FUTURE = { id: 'b1', booking_code: 'BK-1', status: 'upcoming', customer_name: 'Budi',
  booking_date: '2099-01-01', start_time: '14:00:00', end_time: '15:00:00', duration_hours: 1, total_price: 100000 }
const STARTED = { ...FUTURE, booking_date: '2000-01-01' }

const mountPanel = async (booking = FUTURE, permissions = ['bookings.view', 'bookings.edit', 'bookings.cancel']) => {
  const pinia = createPinia()
  setActivePinia(pinia)
  useAuthStore().staff = { username: 'x', role: { is_system: false, permissions } }
  const w = mount(BookingDetailPanel, {
    props: { booking },
    attachTo: document.body,
    global: { plugins: [pinia, ElementPlus], components: Icons, stubs: { AuditTrail: true } },
  })
  await flushPromises()
  return w
}
const button = (w, text) => w.findAll('button').find((b) => b.text().includes(text))

describe('BookingDetailPanel', () => {
  beforeEach(() => {
    m.cancelBooking.mockReset().mockResolvedValue({})
    m.completeBooking.mockReset().mockResolvedValue({})
  })
  afterEach(() => { vi.restoreAllMocks(); document.body.innerHTML = '' })

  it('shows Cancel only with bookings.cancel and before the start time', async () => {
    expect(button(await mountPanel(), 'Cancel Booking')).toBeTruthy()
    expect(button(await mountPanel(STARTED), 'Cancel Booking')).toBeUndefined()
    expect(button(await mountPanel(FUTURE, ['bookings.view', 'bookings.edit']), 'Cancel Booking')).toBeUndefined()
  })

  it('cancel sends the reason and emits cancelled', async () => {
    const w = await mountPanel()
    await button(w, 'Cancel Booking').trigger('click')
    await flushPromises()
    await w.find('textarea').setValue('Customer tidak jadi datang')
    await button(w, 'Konfirmasi Batalkan').trigger('click')
    await flushPromises()
    expect(m.cancelBooking).toHaveBeenCalledWith('b1', { reason: 'Customer tidak jadi datang' })
    expect(w.emitted('cancelled')).toHaveLength(1)
  })

  it('cancel needs a reason of at least 5 characters', async () => {
    const w = await mountPanel()
    await button(w, 'Cancel Booking').trigger('click')
    await flushPromises()
    await w.find('textarea').setValue('abc')
    await button(w, 'Konfirmasi Batalkan').trigger('click')
    await flushPromises()
    expect(m.cancelBooking).not.toHaveBeenCalled()
  })

  it('complete asks for confirmation and emits completed', async () => {
    vi.spyOn(ElMessageBox, 'confirm').mockResolvedValue('confirm')
    const w = await mountPanel()
    await button(w, 'Mark as Completed').trigger('click')
    await flushPromises()
    expect(m.completeBooking).toHaveBeenCalledWith('b1')
    expect(w.emitted('completed')).toHaveLength(1)
  })

  it('close button emits close', async () => {
    const w = await mountPanel()
    await w.find('.panel-header button').trigger('click')
    expect(w.emitted('close')).toHaveLength(1)
  })

  it('payment and WhatsApp use icons instead of emoji, text unchanged', async () => {
    const credits = await mountPanel({ ...FUTURE, payment_method: 'play_credits', customer_whatsapp: '0812' })
    expect(credits.text()).toContain('Play Credits')
    expect(credits.text()).toContain('0812')
    expect(credits.text()).not.toMatch(/[\u{1F300}-\u{1FAFF}]/u)
    expect(credits.findComponent(Icons.Coin).exists()).toBe(true)
    expect(credits.findComponent(Icons.Iphone).exists()).toBe(true)
    const cash = await mountPanel({ ...FUTURE, payment_method: 'cash' })
    expect(cash.text()).toContain('Cash')
    expect(cash.findComponent(Icons.Money).exists()).toBe(true)
  })
})
