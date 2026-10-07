import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import * as Icons from '@element-plus/icons-vue'
import BookingConfirmDialog from '@/components/booking/BookingConfirmDialog.vue'

const FORM = { customer_name: 'Budi', customer_whatsapp: '0812', customer_email: '', room_name: 'Room 1',
  booking_date: '2099-01-01', start_time: '14:00', end_time: '16:00', duration_hours: 2,
  payment_method: 'cash', voucher_code: '' }
// The breakdown sums to more than final_price (as with a flash sale), so 'Rp 200.000'
// can only come from the Total Bayar row.
const PRICE = { final_price: 200000, breakdown: [{ time_range: '14-16', description: '2 jam', amount: 210000 }] }
const totalText = (w) => w.text().match(/Total Bayar\s*(Rp [\d.]+)/)?.[1]

// el-dialog opens in onMounted and renders its body one tick later.
const mountDialog = async (props = {}) => {
  const w = mount(BookingConfirmDialog, {
    props: { modelValue: true, form: FORM, priceCalc: PRICE, voucherDiscount: null, ...props },
    global: { plugins: [ElementPlus], components: Icons },
  })
  await flushPromises()
  return w
}
const btn = (w, text) => w.findAll('button').find((b) => b.text().includes(text))

describe('BookingConfirmDialog', () => {
  it('shows the summary and the plain total without a voucher', async () => {
    const w = await mountDialog()
    expect(w.text()).toContain('Budi')
    expect(w.text()).toContain('14:00 – 16:00 (2 Jam)')
    expect(totalText(w)).toBe('Rp 200.000')
    expect(w.text()).not.toContain('Voucher')
  })

  it('shows the voucher row and the discounted total for a valid voucher', async () => {
    const w = await mountDialog({
      form: { ...FORM, voucher_code: 'V10' },
      voucherDiscount: { amount: 20000, invalid: false, finalPrice: 180000 },
      voucherName: 'Diskon 10%',
    })
    expect(w.text()).toContain('Diskon 10%')
    expect(w.text()).toContain('- Rp 20.000')
    expect(totalText(w)).toBe('Rp 180.000')
    expect(w.text()).toContain('V10')
  })

  it('an invalid voucher keeps the plain total and no discount row', async () => {
    const w = await mountDialog({ voucherDiscount: { amount: 0, invalid: true, reason: 'Min. pembelian Rp 300.000' }, voucherName: 'X' })
    expect(w.text()).not.toContain('- Rp')
    expect(totalText(w)).toBe('Rp 200.000')
  })

  it('shows the flash sale row', async () => {
    const w = await mountDialog({ priceCalc: { ...PRICE, has_flash_sale: true, flash_discount: 5000 } })
    expect(w.text()).toContain('Flash Sale')
    expect(w.text()).toContain('- Rp 5.000')
  })

  it('Konfirmasi Booking emits confirm; Kembali closes', async () => {
    const w = await mountDialog()
    await btn(w, 'Konfirmasi Booking').trigger('click')
    expect(w.emitted('confirm')).toHaveLength(1)
    await btn(w, 'Kembali').trigger('click')
    expect(w.emitted('update:modelValue').at(-1)).toEqual([false])
  })

  it('closing through el-dialog itself reaches the parent v-model', async () => {
    const w = await mountDialog()
    w.findComponent({ name: 'ElDialog' }).vm.$emit('update:modelValue', false)
    expect(w.emitted('update:modelValue').at(-1)).toEqual([false])
  })

  it('uses icons instead of emoji for flash sale, voucher and payment', async () => {
    const w = await mountDialog({
      form: { ...FORM, voucher_code: 'V10', payment_method: 'play_credits' },
      priceCalc: { ...PRICE, has_flash_sale: true, flash_discount: 5000 },
      voucherDiscount: { amount: 20000, invalid: false, finalPrice: 180000 }, voucherName: 'Diskon 10%',
    })
    expect(w.text()).not.toMatch(/[\u{1F300}-\u{1FAFF}\u{26A1}]/u)
    expect(w.text()).toContain('Play Credits')
    for (const icon of [Icons.Lightning, Icons.Ticket, Icons.Coin]) expect(w.findComponent(icon).exists()).toBe(true)
    const cash = await mountDialog()
    expect(cash.findComponent(Icons.Money).exists()).toBe(true)
  })
})
