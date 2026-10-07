import { describe, it, expect } from 'vitest'
import { computeVoucherDiscount } from '@/utils/voucher'

describe('computeVoucherDiscount (client preview)', () => {
  it('percentage: rounds half up', () => {
    expect(computeVoucherDiscount({ discount_type: 'percentage', discount_value: 10 }, 125005))
      .toEqual({ amount: 12501, invalid: false, finalPrice: 112504 })
  })
  it('percentage: caps at max_discount', () => {
    expect(computeVoucherDiscount({ discount_type: 'percentage', discount_value: 50, max_discount: 20000 }, 100000))
      .toEqual({ amount: 20000, invalid: false, finalPrice: 80000 })
  })
  it('fixed: takes the value', () => {
    expect(computeVoucherDiscount({ discount_type: 'fixed', discount_value: 30000 }, 100000))
      .toEqual({ amount: 30000, invalid: false, finalPrice: 70000 })
  })
  it('fixed: never more than the price', () => {
    expect(computeVoucherDiscount({ discount_type: 'fixed', discount_value: 150000 }, 100000))
      .toEqual({ amount: 100000, invalid: false, finalPrice: 0 })
  })
  it('min_purchase not met: invalid with a reason', () => {
    expect(computeVoucherDiscount({ discount_type: 'fixed', discount_value: 10000, min_purchase: 200000 }, 100000))
      .toEqual({ amount: 0, invalid: true, reason: 'Min. pembelian Rp 200.000' })
  })
  it('no voucher, or no price yet: null', () => {
    expect(computeVoucherDiscount(null, 100000)).toBeNull()
    expect(computeVoucherDiscount({ discount_type: 'fixed', discount_value: 1 }, 0)).toBeNull()
    expect(computeVoucherDiscount({ discount_type: 'fixed', discount_value: 1 }, undefined)).toBeNull()
  })
})
