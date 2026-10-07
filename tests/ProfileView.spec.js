import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ElementPlus from 'element-plus'
import * as Icons from '@element-plus/icons-vue'

vi.mock('@/api/store/storeApi', () => ({
  getStores: vi.fn().mockResolvedValue({ data: { data: [{ id: 'b', name: 'Beta' }, { id: 'c', name: 'Gamma' }] } }),
}))
vi.mock('@/api/staff/staffApi', () => ({ updateStaff: vi.fn() }))

import ProfileView from '@/views/profile/ProfileView.vue'
import { useAuthStore } from '@/stores/authStore'

const mountAs = async (staff) => {
  const pinia = createPinia()
  setActivePinia(pinia)
  useAuthStore().staff = { username: 'x', role: { name: 'R', permissions: [] }, ...staff }
  const w = mount(ProfileView, { global: { plugins: [pinia, ElementPlus], components: Icons } })
  await flushPromises()
  return w
}

describe('ProfileView branch access', () => {
  it('shows "Semua Cabang" from store_access, even when the old is_all_stores flag is false', async () => {
    const w = await mountAs({ is_all_stores: false, store_access: { all_stores: true, store_ids: [] } })
    expect(w.text()).toContain('Semua Cabang')
  })

  it('lists the names of the branches in store_access', async () => {
    const w = await mountAs({ store_access: { all_stores: false, store_ids: ['c'] } })
    expect(w.text()).toContain('Gamma')
    expect(w.text()).not.toContain('Beta')
    expect(w.text()).not.toContain('Semua Cabang')
  })
})
