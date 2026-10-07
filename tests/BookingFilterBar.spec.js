import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import * as Icons from '@element-plus/icons-vue'
import BookingFilterBar from '@/components/booking/BookingFilterBar.vue'

const STORES = [{ id: 's1', name: 'Alpha' }, { id: 's2', name: 'Beta' }]
const base = {
  date: '2099-01-01', store: 's1', room: '', stores: STORES, rooms: [{ id: 'r1', name: 'Room 1' }],
  noAccess: false, isStoreLocked: false, lockedStoreName: '', operatingHours: '10:00 – 22:00', effectiveHours: null,
}
const mountBar = (props = {}) =>
  mount(BookingFilterBar, { props: { ...base, ...props }, global: { plugins: [ElementPlus], components: Icons } })

describe('BookingFilterBar', () => {
  it('shows a select for several branches', () => {
    const w = mountBar()
    expect(w.find('.store-locked-badge').exists()).toBe(false)
    expect(w.text()).toContain('Jam Operasional: 10:00 – 22:00')
  })

  it('shows a locked badge for one branch', () => {
    expect(mountBar({ isStoreLocked: true, lockedStoreName: 'Beta' }).find('.store-locked-badge').text()).toContain('Beta')
  })

  it('shows the warning without branch access', () => {
    expect(mountBar({ noAccess: true }).text()).toContain('Tidak ada cabang aktif yang bisa Anda akses')
  })

  it('room change emits update:room first, then change (the page reloads with the new value)', async () => {
    const w = mountBar()
    const roomSelect = w.findAllComponents({ name: 'ElSelect' }).at(-1)
    roomSelect.vm.$emit('update:modelValue', 'r1')
    roomSelect.vm.$emit('change', 'r1')
    expect(Object.keys(w.emitted())).toEqual(expect.arrayContaining(['update:room', 'change']))
    expect(w.emitted('update:room')[0]).toEqual(['r1'])
  })

  it('holiday banner: calendar icon instead of an emoji, text unchanged', () => {
    for (const [type, text] of [['global', 'Hari Libur Nasional'], ['branch', 'Tanggal Merah Cabang']]) {
      const banner = mountBar({ effectiveHours: { is_holiday: true, holiday_type: type, holiday_name: 'Natal', open_time: '12:00:00', close_time: '20:00:00' } }).find('.holiday-banner')
      expect(banner.text()).toContain(`${text} — Natal`)
      expect(banner.text()).not.toMatch(/[\u{1F300}-\u{1FAFF}]/u)
      expect(banner.findComponent(Icons.Calendar).exists()).toBe(true)
    }
  })

  it('shows the holiday banner only on holidays', () => {
    expect(mountBar().find('.holiday-banner').exists()).toBe(false)
    const w = mountBar({ effectiveHours: { is_holiday: true, holiday_type: 'global', holiday_name: 'Natal', open_time: '12:00:00', close_time: '20:00:00' } })
    expect(w.find('.holiday-banner').text()).toContain('Natal')
  })

  // Review C3: el-date-picker renders no scoped root, so `.filter-date[data-v]` never
  // matched. The rule is now `.filter-bar[data-v] .filter-date`; prove that selector matches.
  it('the date picker width rule reaches the picker', () => {
    const w = mountBar()
    const scope = Object.keys(w.find('.filter-bar').element.dataset).length
      ? [...w.find('.filter-bar').element.attributes].find((a) => a.name.startsWith('data-v-')).name : null
    expect(scope).toBeTruthy()
    expect(w.element.querySelector(`.filter-bar[${scope}] .filter-date`)).not.toBeNull()
    expect(w.element.querySelector(`.filter-date[${scope}]`)).toBeNull() // the old selector form misses
  })
})
