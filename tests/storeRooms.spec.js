import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ElementPlus from 'element-plus'
import * as Icons from '@element-plus/icons-vue'

import { roomSetupRows, roomsPayload } from '@/utils/storeRooms'

const TEMPLATES = [
  { id: 1, name: 'Regular Room', capacity_min: 1, capacity_max: 4 },
  { id: 2, name: 'VIP Room', capacity_min: 2, capacity_max: 6 },
  { id: 3, name: 'Family Room', capacity_min: 3, capacity_max: 8 },
]
// Two Regular units (one inactive: the backend still counts it) and one VIP unit.
const STORE_ROOMS = [
  { id: 'a', is_active: true, room_template: { id: 1, name: 'Regular Room' } },
  { id: 'b', is_active: false, room_template: { id: 1, name: 'Regular Room' } },
  { id: 'c', is_active: true, room_template: { id: 2, name: 'VIP Room' } },
]

describe('roomSetupRows', () => {
  it('create mode: nothing selected, one unit proposed per type', () => {
    const rows = roomSetupRows(TEMPLATES)
    expect(rows.map((r) => [r.id, r.selected, r.unit_count, r.existing_units])).toEqual([
      [1, false, 1, 0], [2, false, 1, 0], [3, false, 1, 0],
    ])
  })

  it('edit mode: types the branch has are selected, current count (inactive included) is the floor', () => {
    const rows = roomSetupRows(TEMPLATES, STORE_ROOMS)
    expect(rows.map((r) => [r.id, r.selected, r.unit_count, r.existing_units])).toEqual([
      [1, true, 2, 2], [2, true, 1, 1], [3, false, 1, 0],
    ])
  })
})

describe('roomSetupRows with inactive room types (backend rejects adding units to them)', () => {
  const INACTIVE = { id: 4, name: 'Old Room', capacity_min: 1, capacity_max: 2, is_active: false }
  const INACTIVE_UNUSED = { id: 5, name: 'Retired Room', capacity_min: 1, capacity_max: 2, is_active: false }

  it('create mode hides inactive types', () => {
    expect(roomSetupRows([...TEMPLATES, INACTIVE]).map((r) => r.id)).toEqual([1, 2, 3])
  })

  it('edit mode keeps an inactive type the branch already has, at its current count, and blocks adding', () => {
    const rows = roomSetupRows([...TEMPLATES, INACTIVE, INACTIVE_UNUSED], [
      ...STORE_ROOMS, { id: 'd', is_active: true, room_template: { id: 4, name: 'Old Room' } },
    ])
    expect(rows.map((r) => r.id)).toEqual([1, 2, 3, 4])
    const old = rows.find((r) => r.id === 4)
    expect([old.selected, old.unit_count, old.existing_units, old.can_add]).toEqual([true, 1, 1, false])
    expect(rows.filter((r) => r.id !== 4).every((r) => r.can_add)).toBe(true)
  })
})

describe('roomsPayload', () => {
  it('sends the target unit count per selected type only', () => {
    const rows = roomSetupRows(TEMPLATES, STORE_ROOMS)
    rows[1].unit_count = 3 // VIP 1 -> 3: backend adds two units
    rows[2].selected = true // add Family to this branch with one unit
    expect(roomsPayload(rows)).toEqual([
      { room_template_id: 1, unit_count: 2 },
      { room_template_id: 2, unit_count: 3 },
      { room_template_id: 3, unit_count: 1 },
    ])
  })
})

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { id: 's1' } }),
  useRouter: () => ({ push: vi.fn() }),
}))
vi.mock('@/api/room_template/roomTemplateApi', () => ({
  getRoomTemplates: vi.fn().mockResolvedValue({ data: { data: TEMPLATES } }),
}))
vi.mock('@/api/store/storeApi', () => ({
  getStoreById: vi.fn().mockResolvedValue({ data: { data: {
    name: 'Quantum BSD', address: 'Jl. BSD', whatsapp: '0812', link_gmaps: 'https://maps.example', status: 'active',
    operating_hours: [], rooms: STORE_ROOMS,
  } } }),
  updateStore: vi.fn().mockResolvedValue({ data: {} }),
  createStore: vi.fn(),
  toggleStoreRoom: vi.fn(),
}))

describe('StoreCreateView in edit mode', () => {
  it('keeps the current unit counts on save (never fewer, never an empty list)', async () => {
    const { default: StoreCreateView } = await import('@/views/store/StoreCreateView.vue')
    const { updateStore } = await import('@/api/store/storeApi')
    setActivePinia(createPinia())
    const w = mount(StoreCreateView, { global: { plugins: [ElementPlus], components: Icons } })
    await flushPromises()

    expect(w.text()).toContain('Ruangan — 2 tipe dipilih')
    // Existing types say what they already have, so the total is not read as "units to add".
    expect(w.text()).toContain('Saat ini: 2')
    expect(w.findAll('.existing-tag')).toHaveLength(2)
    // The per-unit on/off list is visible without clicking a tab first.
    expect(w.find('.room-mgmt-tabs .el-tabs__item.is-active').exists()).toBe(true)

    await w.findAll('button').find((b) => b.text().includes('Simpan & Keluar')).trigger('click')
    await flushPromises()

    expect(updateStore).toHaveBeenCalledTimes(1)
    expect(updateStore.mock.calls[0][1].rooms).toEqual([
      { room_template_id: 1, unit_count: 2 },
      { room_template_id: 2, unit_count: 1 },
    ])
  })
  it('disables + for an inactive type the branch already has', async () => {
    const { default: StoreCreateView } = await import('@/views/store/StoreCreateView.vue')
    const { getRoomTemplates } = await import('@/api/room_template/roomTemplateApi')
    const { getStoreById } = await import('@/api/store/storeApi')
    getRoomTemplates.mockResolvedValueOnce({ data: { data: [
      ...TEMPLATES, { id: 4, name: 'Old Room', capacity_min: 1, capacity_max: 2, is_active: false },
    ] } })
    getStoreById.mockResolvedValueOnce({ data: { data: {
      name: 'Quantum BSD', address: 'Jl. BSD', whatsapp: '0812', link_gmaps: 'https://maps.example', status: 'active',
      operating_hours: [], rooms: [...STORE_ROOMS, { id: 'd', is_active: true, room_template: { id: 4, name: 'Old Room' } }],
    } } })
    setActivePinia(createPinia())
    const w = mount(StoreCreateView, { global: { plugins: [ElementPlus], components: Icons } })
    await flushPromises()

    const row = w.findAll('.el-table__row').find((r) => r.text().includes('Old Room'))
    const plus = row.findAll('button').at(-1)
    expect(plus.attributes('disabled')).toBeDefined()
    expect(row.text()).toContain('Tipe nonaktif')
  })
  it('review shows opening hours as HH:mm, not with seconds', async () => {
    const { default: StoreCreateView } = await import('@/views/store/StoreCreateView.vue')
    const { getStoreById } = await import('@/api/store/storeApi')
    getStoreById.mockResolvedValueOnce({ data: { data: {
      name: 'Quantum BSD', address: 'Jl. BSD', whatsapp: '0812', link_gmaps: 'https://maps.example', status: 'active',
      operating_hours: [
        { day_type: 'weekday', open_time: '10:00:00', close_time: '23:00:00', is_active: true },
        { day_type: 'weekend', open_time: '09:00:00', close_time: '02:00:00', is_active: true },
      ],
      rooms: STORE_ROOMS,
    } } })
    setActivePinia(createPinia())
    const w = mount(StoreCreateView, { global: { plugins: [ElementPlus], components: Icons } })
    await flushPromises()
    const review = w.findAll('.review-box').map((b) => b.text()).join(' ')
    expect(review).toContain('10:00 – 23:00')
    expect(review).toContain('09:00 – 02:00')
    expect(review).not.toMatch(/\d\d:\d\d:\d\d/)
  })
})
