import { readFileSync } from 'node:fs'
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import StatStrip from '@/components/ui/StatStrip.vue'

const mountStrip = (items) => mount(StatStrip, { props: { items } })

describe('StatStrip', () => {
  it('renders label and value per item, in order', () => {
    const w = mountStrip([{ label: 'Total Staff', value: 12 }, { label: 'Role Tersedia', value: 3 }])
    expect(w.findAll('.ui-stat__label').map((n) => n.text())).toEqual(['Total Staff', 'Role Tersedia'])
    expect(w.findAll('.ui-stat__value').map((n) => n.text())).toEqual(['12', '3'])
  })

  it('renders 0 as 0 and a missing value as —', () => {
    const w = mountStrip([{ label: 'A', value: 0 }, { label: 'B', value: undefined }, { label: 'C', value: null }])
    expect(w.findAll('.ui-stat__value').map((n) => n.text())).toEqual(['0', '—', '—'])
  })

  it('applies the tone class and falls back to default', () => {
    const w = mountStrip([{ label: 'A', value: 1, tone: 'success' }, { label: 'B', value: 1 }, { label: 'C', value: 1, tone: 'pink' }])
    const cls = w.findAll('.ui-stat__value').map((n) => n.classes())
    expect(cls[0]).toContain('ui-stat__value--success')
    expect(cls[1]).toContain('ui-stat__value--default')
    expect(cls[2]).toContain('ui-stat__value--default')
  })

  it('renders the hint only when given', () => {
    const w = mountStrip([{ label: 'Total Revenue', value: 'Rp 1', hint: '↑ 12% vs bulan lalu' }, { label: 'B', value: 2 }])
    const hints = w.findAll('.ui-stat__hint')
    expect(hints).toHaveLength(1)
    expect(hints[0].text()).toBe('↑ 12% vs bulan lalu')
  })

  it('renders an empty strip without crashing', () => {
    expect(mountStrip([]).findAll('.ui-stat')).toHaveLength(0)
  })

  // jsdom has no layout: a money value like "Rp 1.234.567.890" in a narrow cell
  // must wrap, never be cut to "Rp 1.234.56…" (a misleading number).
  it('never truncates a value', () => {
    const css = readFileSync('src/components/ui/StatStrip.vue', 'utf8')
    const rule = css.match(/\.ui-stat__value \{[^}]*\}/)[0]
    expect(rule).not.toMatch(/text-overflow|nowrap/)
    expect(rule).toMatch(/overflow-wrap: anywhere/)
  })
})
