import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import ElementPlus, { ElMessage } from 'element-plus'
import * as Icons from '@element-plus/icons-vue'

const m = vi.hoisted(() => ({ createBooking: vi.fn(), calculatePrice: vi.fn(), getAvailableCredits: vi.fn(), getCustomers: vi.fn(), apiGet: vi.fn() }))
vi.mock('@/api/booking/bookingApi', () => ({
  createBooking: m.createBooking, calculatePrice: m.calculatePrice, getAvailableCredits: m.getAvailableCredits,
}))
vi.mock('@/api/customer/customerApi', () => ({ getCustomers: m.getCustomers }))
vi.mock('@/api/index', () => ({ default: { get: m.apiGet }, publicApi: { get: vi.fn() } }))

import NewBookingPanel from '@/components/booking/NewBookingPanel.vue'

const ROOM = { id: 'r1', name: 'Room 1', room_template_id: 't1', room_template: { id: 't1', name: 'VIP' } }
const SELECTION = { storeId: 's1', roomId: 'r1', roomName: 'Room 1', date: '2099-01-01', startTime: '14:00', endTime: '15:00' }

const mountPanel = async (selection = SELECTION) => {
  const w = mount(NewBookingPanel, {
    props: { selection, store: 's1', rooms: [ROOM] },
    attachTo: document.body,
    global: { plugins: [ElementPlus], components: Icons },
  })
  await flushPromises()
  return w
}
const settlePrice = async () => { vi.advanceTimersByTime(600); await flushPromises() }
const button = (w, text) => w.findAll('button').find((b) => b.text().trim().startsWith(text))

describe('NewBookingPanel', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    Object.values(m).forEach((fn) => fn.mockReset())
    m.calculatePrice.mockResolvedValue({ data: { data: { final_price: 100000 } } })
    m.createBooking.mockResolvedValue({ data: { data: { booking_code: 'BK-NEW' } } })
  })
  afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); document.body.innerHTML = '' })

  it('fills the form from the selected slot and prices it after the debounce', async () => {
    const w = await mountPanel()
    expect(w.find('.room-chip').text()).toContain('14:00 – 15:00')
    expect(m.calculatePrice).not.toHaveBeenCalled()
    await settlePrice()
    expect(m.calculatePrice).toHaveBeenCalledWith({ store_id: 's1', room_template_id: 't1',
      booking_date: '2099-01-01', start_time: '14:00', end_time: '15:00' })
  })

  it('duration button sets the end time and prices again', async () => {
    const w = await mountPanel()
    await settlePrice()
    await button(w, '3j').trigger('click')
    await settlePrice()
    expect(w.find('.room-chip').text()).toContain('14:00 – 17:00')
    expect(m.calculatePrice).toHaveBeenLastCalledWith(expect.objectContaining({ end_time: '17:00' }))
  })

  it('a new slot selection refills the form', async () => {
    const w = await mountPanel()
    await w.setProps({ selection: { ...SELECTION, startTime: '18:00', endTime: '19:00' } })
    expect(w.find('.room-chip').text()).toContain('18:00 – 19:00')
  })

  it('needs a customer name before confirming', async () => {
    const warning = vi.spyOn(ElMessage, 'warning').mockImplementation(() => {})
    const w = await mountPanel()
    await settlePrice()
    await button(w, 'Lanjutkan').trigger('click')
    expect(warning).toHaveBeenCalledWith('Nama customer wajib diisi')
  })

  it('creates the booking without duration_hours and emits created', async () => {
    const w = await mountPanel()
    await settlePrice()
    await w.find('input[placeholder="Nama customer"]').setValue('Walk In')
    await button(w, 'Lanjutkan').trigger('click')
    await flushPromises()
    await w.findAll('button').find((b) => b.text().includes('Konfirmasi Booking')).trigger('click')
    await flushPromises()
    expect(m.createBooking.mock.calls[0][0]).not.toHaveProperty('duration_hours')
    expect(m.createBooking.mock.calls[0][0]).toMatchObject({ room_id: 'r1', start_time: '14:00', end_time: '15:00', customer_name: 'Walk In' })
    expect(w.emitted('created')).toHaveLength(1)
    expect(w.text()).toContain('BK-NEW')
  })

  it('stops a pending price request when it unmounts', async () => {
    const w = await mountPanel()
    w.unmount()
    await settlePrice()
    expect(m.calculatePrice).not.toHaveBeenCalled()
  })

  it('a member customer sees play credits with their expiry date', async () => {
    m.getCustomers.mockResolvedValue({ data: { data: [{ id: 'c1', name: 'Budi', type: 'member', whatsapp: '08' }] } })
    m.getAvailableCredits.mockResolvedValue({ data: { data: [{ id: 'cr1', package_name: 'Paket 5 Jam', remaining_hours: 5, expires_at: '2099-01-31' }] } })
    m.apiGet.mockResolvedValue({ data: { data: [] } })
    const w = await mountPanel()
    await settlePrice()
    const customer = w.findComponent({ name: 'ElSelect' })
    await customer.props('remoteMethod')('Bud')
    await flushPromises()
    customer.vm.$emit('update:modelValue', 'c1')
    customer.vm.$emit('change', 'c1')
    await flushPromises()
    expect(w.text()).toContain('exp. 31 Jan 2099')
  })

  it('close button emits close', async () => {
    const w = await mountPanel()
    await w.find('.panel-header button').trigger('click')
    expect(w.emitted('close')).toHaveLength(1)
  })
})
