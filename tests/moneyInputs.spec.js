import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it, expect } from 'vitest'

const filesUnder = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f)
    return statSync(p).isDirectory() ? filesUnder(p) : [p]
  })
const views = [...filesUnder('src/views'), ...filesUnder('src/components')].filter((p) => p.endsWith('.vue'))

// The backend rejects fractional rupiah with 400 (money is integer rupiah).
// Every number input bound to a money field must round to whole rupiah.
const MONEY_MODEL = /v-model="[^"]*(\b(price|price_per_hour|eventPrice|max_discount|min_purchase|payment_amount|amount)\b|\bprices\[)[^"]*"/
const INPUT_NUMBER = /<el-input-number\b[^>]*>/gs

const moneyInputsWithoutPrecision = (src) => [...src.matchAll(INPUT_NUMBER)]
  .map((m) => m[0])
  .filter((tag) => MONEY_MODEL.test(tag) && !/:precision="0"/.test(tag))

describe('money inputs send whole rupiah', () => {
  it('the guard catches a money input without precision and spares other inputs', () => {
    expect(moneyInputsWithoutPrecision('<el-input-number v-model="form.price" :min="0" />')).toHaveLength(1)
    expect(moneyInputsWithoutPrecision('<el-input-number v-model="form.price" :precision="0" />')).toHaveLength(0)
    expect(moneyInputsWithoutPrecision('<el-input-number v-model="pkgForm.total_hours" :step="0.5" />')).toHaveLength(0)
    // Indexed models end in "]", where a trailing word boundary would never match.
    expect(moneyInputsWithoutPrecision('<el-input-number v-model="row.prices[dur]" :min="0" />')).toHaveLength(1)
  })

  it.each(views)('%s', (p) => {
    expect(moneyInputsWithoutPrecision(readFileSync(p, 'utf8'))).toEqual([])
  })

  it('a nominal voucher discount is whole rupiah; a percentage may keep decimals', () => {
    const tag = [...readFileSync('src/views/promotion/PromotionView.vue', 'utf8').matchAll(INPUT_NUMBER)]
      .map((m) => m[0]).find((t) => t.includes('form.discount_value'))
    expect(tag).toMatch(/:precision="form\.discount_type === 'nominal' \? 0 : undefined"/)
  })
})
