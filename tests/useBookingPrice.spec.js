import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { reactive, ref } from 'vue'
import { flushPromises } from '@vue/test-utils'

const m = vi.hoisted(() => ({ calculatePrice: vi.fn() }))
vi.mock('@/api/booking/bookingApi', () => ({ calculatePrice: m.calculatePrice }))

import { useBookingPrice } from '@/composables/useBookingPrice'

const ROOM = { id: 'r1', room_template_id: 't1' }
const setup = (over = {}) => {
  const form = reactive({ store_id: 's1', room_id: 'r1', booking_date: '2099-01-01',
    start_time: '14:00', end_time: '15:00', duration_hours: 1, voucher_code: '', ...over })
  const vouchers = ref([])
  const onPriced = vi.fn()
  return { form, vouchers, onPriced, ...useBookingPrice({ form, rooms: () => [ROOM], vouchers, onPriced }) }
}
const settle = async () => { vi.advanceTimersByTime(600); await flushPromises() }

describe('useBookingPrice', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    m.calculatePrice.mockReset()
    m.calculatePrice.mockResolvedValue({ data: { data: { final_price: 100000 } } })
  })
  afterEach(() => vi.useRealTimers())

  it('two quick calls make one request after 600 ms', async () => {
    const p = setup()
    p.recalculatePrice()
    p.recalculatePrice()
    vi.advanceTimersByTime(599)
    expect(m.calculatePrice).not.toHaveBeenCalled()
    await settle()
    expect(m.calculatePrice).toHaveBeenCalledTimes(1)
    expect(m.calculatePrice).toHaveBeenCalledWith({ store_id: 's1', room_template_id: 't1',
      booking_date: '2099-01-01', start_time: '14:00', end_time: '15:00' })
    expect(p.priceCalc.value).toEqual({ final_price: 100000 })
  })

  it('does nothing without a start time', async () => {
    const p = setup({ start_time: '' })
    p.recalculatePrice()
    await settle()
    expect(m.calculatePrice).not.toHaveBeenCalled()
  })

  it('an unknown room makes no request and no credits refresh', async () => {
    const p = setup({ room_id: 'zz' })
    p.recalculatePrice()
    await settle()
    expect(m.calculatePrice).not.toHaveBeenCalled()
    expect(p.onPriced).not.toHaveBeenCalled()
  })

  it('recomputes the duration across midnight', async () => {
    const p = setup({ start_time: '22:00', end_time: '02:00' })
    p.recalculatePrice()
    await settle()
    expect(p.form.duration_hours).toBe(4)
  })

  it('calls onPriced after a price, and after a failed price', async () => {
    const p = setup()
    p.recalculatePrice()
    await settle()
    expect(p.onPriced).toHaveBeenCalledTimes(1)
    m.calculatePrice.mockRejectedValueOnce(new Error('500'))
    p.recalculatePrice()
    await settle()
    expect(p.priceCalc.value).toBeNull()
    expect(p.onPriced).toHaveBeenCalledTimes(2)
  })

  it('cancelPriceCalc stops a pending request', async () => {
    const p = setup()
    p.recalculatePrice()
    p.cancelPriceCalc()
    await settle()
    expect(m.calculatePrice).not.toHaveBeenCalled()
  })

  it('previews the voucher picked in the form on the current price', async () => {
    const p = setup()
    p.vouchers.value = [{ code: 'V10', name: 'Diskon 10%', discount_type: 'percentage', discount_value: 10 }]
    p.form.voucher_code = 'V10'
    p.recalculatePrice()
    await settle()
    expect(p.selectedVoucherData.value.name).toBe('Diskon 10%')
    expect(p.voucherDiscount.value).toEqual({ amount: 10000, invalid: false, finalPrice: 90000 })
  })
})
