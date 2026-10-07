import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import * as Icons from '@element-plus/icons-vue'

// Panel → BookingConfirmDialog / BookingSuccessDialog / useBookingPrice wiring.
// The children have their own specs; these prove the panel connects them.
const m = vi.hoisted(() => ({ createBooking: vi.fn(), calculatePrice: vi.fn(), getAvailableCredits: vi.fn(), getCustomers: vi.fn(), apiGet: vi.fn() }))
vi.mock('@/api/booking/bookingApi', () => ({
  createBooking: m.createBooking, calculatePrice: m.calculatePrice, getAvailableCredits: m.getAvailableCredits,
}))
vi.mock('@/api/customer/customerApi', () => ({ getCustomers: m.getCustomers }))
vi.mock('@/api/index', () => ({ default: { get: m.apiGet }, publicApi: { get: vi.fn() } }))

import NewBookingPanel from '@/components/booking/NewBookingPanel.vue'
import BookingConfirmDialog from '@/components/booking/BookingConfirmDialog.vue'
import BookingSuccessDialog from '@/components/booking/BookingSuccessDialog.vue'

const ROOM = { id: 'r1', name: 'Room 1', room_template_id: 't1' }
const SELECTION = { storeId: 's1', roomId: 'r1', roomName: 'Room 1', date: '2099-01-01', startTime: '14:00', endTime: '15:00' }
const MEMBER = { id: 'c1', name: 'Budi', type: 'member', whatsapp: '0812', email: 'b@x.id' }
const VOUCHER = { code: 'V10', name: 'Diskon 10%', discount_type: 'percentage', discount_value: 10 }

const mountPanel = async () => {
  const w = mount(NewBookingPanel, {
    props: { selection: SELECTION, store: 's1', rooms: [ROOM] },
    attachTo: document.body,
    global: { plugins: [ElementPlus], components: Icons },
  })
  await flushPromises()
  return w
}
const settlePrice = async () => { vi.advanceTimersByTime(600); await flushPromises() }
const button = (w, text) => w.findAll('button').find((b) => b.text().trim().startsWith(text))
const pickMember = async (w) => {
  const customer = w.findComponent({ name: 'ElSelect' })
  await customer.props('remoteMethod')('Bud')
  await flushPromises()
  customer.vm.$emit('update:modelValue', 'c1')
  customer.vm.$emit('change', 'c1')
  await flushPromises()
}
const createWalkIn = async (w) => {
  await w.find('input[placeholder="Nama customer"]').setValue('Walk In')
  await button(w, 'Lanjutkan').trigger('click')
  await flushPromises()
  await button(w, 'Konfirmasi Booking').trigger('click')
  await flushPromises()
}

describe('NewBookingPanel wiring', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    Object.values(m).forEach((fn) => fn.mockReset())
    m.calculatePrice.mockResolvedValue({ data: { data: { final_price: 100000, breakdown: [] } } })
    m.createBooking.mockResolvedValue({ data: { data: { booking_code: 'BK-NEW' } } })
    m.getCustomers.mockResolvedValue({ data: { data: [MEMBER] } })
    m.getAvailableCredits.mockResolvedValue({ data: { data: [] } })
    m.apiGet.mockResolvedValue({ data: { data: [VOUCHER] } })
  })
  afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); document.body.innerHTML = '' })

  it('a member with a voucher: the confirm dialog gets the voucher name and the discounted total', async () => {
    const w = await mountPanel()
    await settlePrice()
    await pickMember(w)
    const voucher = w.findAllComponents({ name: 'ElSelect' }).at(-1)
    voucher.vm.$emit('update:modelValue', 'V10')
    await flushPromises()
    await button(w, 'Lanjutkan').trigger('click')
    await flushPromises()
    const dialog = w.findComponent(BookingConfirmDialog)
    expect(dialog.props('modelValue')).toBe(true)
    expect(dialog.props('voucherName')).toBe('Diskon 10%')
    expect(dialog.props('voucherDiscount')).toEqual({ amount: 10000, invalid: false, finalPrice: 90000 })
    expect(dialog.text()).toMatch(/Total Bayar\s*Rp 90\.000/)
  })

  it('closing the confirm dialog through el-dialog (X / Esc) closes it in the panel', async () => {
    const w = await mountPanel()
    await settlePrice()
    await w.find('input[placeholder="Nama customer"]').setValue('Walk In')
    await button(w, 'Lanjutkan').trigger('click')
    await flushPromises()
    const dialog = w.findComponent(BookingConfirmDialog)
    dialog.findComponent({ name: 'ElDialog' }).vm.$emit('update:modelValue', false)
    await flushPromises()
    expect(dialog.props('modelValue')).toBe(false)
  })

  it('success dialog: gets the code and contact; "Lihat di Kalender" emits view-booking', async () => {
    const w = await mountPanel()
    await settlePrice()
    await pickMember(w)
    await button(w, 'Lanjutkan').trigger('click')
    await flushPromises()
    await button(w, 'Konfirmasi Booking').trigger('click')
    await flushPromises()
    const success = w.findComponent(BookingSuccessDialog)
    expect(success.props()).toMatchObject({ modelValue: true, code: 'BK-NEW', whatsapp: '0812', email: 'b@x.id' })
    await button(w, 'Lihat di Kalender').trigger('click')
    expect(w.emitted('view-booking')).toHaveLength(1)
    expect(success.props('modelValue')).toBe(false)
  })

  it('closing the success dialog through el-dialog (Esc / overlay) closes it in the panel', async () => {
    const w = await mountPanel()
    await settlePrice()
    await createWalkIn(w)
    const success = w.findComponent(BookingSuccessDialog)
    expect(success.props('modelValue')).toBe(true)
    success.findComponent({ name: 'ElDialog' }).vm.$emit('update:modelValue', false)
    await flushPromises()
    expect(success.props('modelValue')).toBe(false)
  })

  it('"+ Booking Lain" clears the customer and the old price', async () => {
    const w = await mountPanel()
    await settlePrice()
    await createWalkIn(w)
    await button(w, '+ Booking Lain').trigger('click')
    await flushPromises()
    expect(w.find('input[placeholder="Nama customer"]').element.value).toBe('')
    expect(button(w, 'Lanjutkan').attributes('disabled')).toBeDefined()
    expect(w.emitted('view-booking')).toBeUndefined()
  })

  it('a new price for a member refreshes play credits for the form branch and date', async () => {
    const w = await mountPanel()
    await settlePrice()
    await pickMember(w)
    const before = m.getAvailableCredits.mock.calls.length
    await button(w, '3j').trigger('click')
    await settlePrice()
    expect(m.getAvailableCredits.mock.calls.length).toBe(before + 1)
    expect(m.getAvailableCredits).toHaveBeenLastCalledWith('c1', 's1', '2099-01-01')
  })

  it('a member sees payment options with icons instead of emoji', async () => {
    m.getAvailableCredits.mockResolvedValue({ data: { data: [{ id: 'cr1', package: { name: 'Paket 5 Jam' }, remaining_hours: 5, expires_at: '2099-01-31' }] } })
    const w = await mountPanel()
    await settlePrice()
    await pickMember(w)
    expect(w.text()).toContain('Pakai Play Credits?')
    expect(w.text()).toContain('Paket 5 Jam')
    expect(w.text()).not.toMatch(/[\u{1F300}-\u{1FAFF}]/u)
    expect(w.findComponent(Icons.Money).exists()).toBe(true)
    expect(w.findComponent(Icons.Coin).exists()).toBe(true)
  })
})
