import { formatRp } from '@/utils/format'

// Client-side preview of a voucher on a booking price (moved unchanged from
// NewBookingPanel). The backend decides the real total.
export const computeVoucherDiscount = (voucher, basePrice) => {
  const v = voucher
  const base = basePrice
  if (!v || !base) return null

  // Cek minimum pembelian
  if (v.min_purchase && base < v.min_purchase) {
    return { amount: 0, invalid: true, reason: `Min. pembelian ${formatRp(v.min_purchase)}` }
  }

  let amount
  if (v.discount_type === 'percentage') {
    amount = Math.round(base * v.discount_value / 100)
    if (v.max_discount && amount > v.max_discount) amount = v.max_discount
  } else {
    amount = Math.min(v.discount_value, base)
  }

  return { amount, invalid: false, finalPrice: base - amount }
}
