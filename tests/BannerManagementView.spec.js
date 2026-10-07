import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ElementPlus from 'element-plus'
import * as Icons from '@element-plus/icons-vue'

vi.mock('@/api/banner/bannerApi', () => ({
  getBannersAdmin: vi.fn().mockResolvedValue({ data: { data: [
    { id: 'b1', title: 'Promo', image_url: 'a.png', is_active: true, sort_order: 0 },
    { id: 'b2', title: 'Event', image_url: 'b.png', is_active: false, sort_order: 1 },
  ] } }),
  createBanner: vi.fn(), updateBanner: vi.fn(), deleteBanner: vi.fn(), toggleBanner: vi.fn(), reorderBanners: vi.fn(),
}))

import BannerManagementView from '@/views/settings/BannerManagementView.vue'
import { getBannersAdmin } from '@/api/banner/bannerApi'
import { useAuthStore } from '@/stores/authStore'

const mountAs = async (permissions) => {
  const pinia = createPinia()
  setActivePinia(pinia)
  useAuthStore().staff = { username: 'x', role: { name: 'R', is_system: false, permissions } }
  const w = mount(BannerManagementView, { global: { plugins: [pinia, ElementPlus], components: Icons } })
  await flushPromises()
  return w
}

describe('BannerManagementView permissions', () => {
  it('hides every mutation control without settings.branches', async () => {
    const w = await mountAs([])
    expect(w.text()).toContain('Promo')
    expect(w.findAll('button').some((b) => b.text().includes('Tambah Banner'))).toBe(false)
    expect(w.find('.banner-actions').exists()).toBe(false)
    expect(w.findComponent({ name: 'ElSwitch' }).exists()).toBe(false)
  })

  it('shows them with settings.branches', async () => {
    const w = await mountAs(['settings.branches'])
    expect(w.findAll('button').some((b) => b.text().includes('Tambah Banner'))).toBe(true)
    expect(w.findAll('.banner-actions')).toHaveLength(2)
  })

  it('empty list: only staff who can add see the "Tambah Banner" hint', async () => {
    getBannersAdmin.mockResolvedValueOnce({ data: { data: [] } })
    const without = await mountAs([])
    expect(without.text()).toContain('Belum ada banner.')
    expect(without.text()).not.toContain('Klik "Tambah Banner"')

    getBannersAdmin.mockResolvedValueOnce({ data: { data: [] } })
    const withPerm = await mountAs(['settings.branches'])
    expect(withPerm.text()).toContain('Klik "Tambah Banner" untuk mulai.')
  })
})
