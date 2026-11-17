import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ElementPlus from 'element-plus'
import * as Icons from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/authStore'

vi.mock('vue-router', () => ({ useRoute: () => ({ query: {}, params: {} }), useRouter: () => ({ push: vi.fn() }) }))

const m = vi.hoisted(() => {
  const STORE = {
    id: 's1', name: 'Quantum Jelambar', status: 'active', address: 'Jl. Jelambar Utama No. 12', description: 'Gaming lounge',
    room_count: 5, whatsapp: '0812',
    operating_hours: [
      { day_type: 'weekday', open_time: '10:00:00', close_time: '23:00:00', is_active: true },
      { day_type: 'weekend', open_time: '09:00:00', close_time: '02:00:00', is_active: true },
    ],
    holidays: [{ date: '2026-12-25', open_time: '12:00:00', close_time: '22:00:00' }],
  }
  return { STORE, updateStore: vi.fn(), updateFacility: vi.fn() }
})
vi.mock('@/api/store/storeApi', () => ({
  getStores: vi.fn().mockResolvedValue({ data: { data: [m.STORE], meta: { total: 1 } } }),
  deleteStore: vi.fn(), updateStore: m.updateStore, updateStoreRoom: vi.fn(),
  getGlobalHolidays: vi.fn().mockResolvedValue({ data: { data: [] } }),
}))
vi.mock('@/api/facility/facilityApi', () => ({
  getFacilities: vi.fn().mockResolvedValue({ data: { data: [
    { id: 'f1', name: 'AC & Wi-Fi', is_active: true, category_id: 'c1', category: { name: 'Amenities' } },
  ], meta: { total: 1 } } }),
  deleteFacility: vi.fn(), updateFacility: m.updateFacility,
  getFacilityCategories: vi.fn().mockResolvedValue({ data: { data: [] } }),
}))

import StoreView from '@/views/store/StoreView.vue'
import FacilityView from '@/views/facility/FacilityView.vue'

const realWidth = window.innerWidth
afterEach(() => { window.innerWidth = realWidth })

const mountAt = async (View, width) => {
  window.innerWidth = width
  const pinia = createPinia()
  setActivePinia(pinia)
  useAuthStore().staff = { username: 'x', role: { is_system: true, permissions: [] } }
  const w = mount(View, { global: { plugins: [pinia, ElementPlus], components: Icons } })
  await flushPromises()
  return w
}

describe('Daftar Cabang table', () => {
  it('shows opening hours as HH:MM, without seconds', async () => {
    const w = await mountAt(StoreView, 1280)
    const text = w.text()
    expect(text).toContain('10:00 – 23:00')
    expect(text).toContain('12:00 – 22:00')
    expect(text).not.toMatch(/\d\d:\d\d:\d\d/)
  })

  it('hides "Status Ruangan" when the list has no rooms (it was a column of dashes)', async () => {
    const w = await mountAt(StoreView, 1280)
    expect(w.text()).not.toContain('Status Ruangan')
  })
})

describe('phone cards can activate and deactivate, like the desktop rows', () => {
  it('branch card toggles the status', async () => {
    m.updateStore.mockReset().mockResolvedValue({})
    const w = await mountAt(StoreView, 375)
    const toggle = w.find('.m-card-actions [aria-label="Nonaktifkan"]')
    expect(toggle.exists()).toBe(true)
    await toggle.trigger('click')
    await flushPromises()
    expect(m.updateStore).toHaveBeenCalledWith('s1', expect.objectContaining({ status: 'inactive' }))
  })

  it('facility card toggles is_active', async () => {
    m.updateFacility.mockReset().mockResolvedValue({})
    const w = await mountAt(FacilityView, 375)
    const toggle = w.find('.m-card-actions [aria-label="Nonaktifkan"]')
    expect(toggle.exists()).toBe(true)
    await toggle.trigger('click')
    await flushPromises()
    expect(m.updateFacility).toHaveBeenCalledWith('f1', expect.objectContaining({ is_active: false }))
  })
})
