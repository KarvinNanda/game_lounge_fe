import { readFileSync } from 'node:fs'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ElementPlus from 'element-plus'
import * as Icons from '@element-plus/icons-vue'

const { get } = vi.hoisted(() => ({ get: vi.fn() }))
vi.mock('@/api/index', () => ({ default: { get, post: vi.fn(), put: vi.fn() }, publicApi: { get: vi.fn() } }))

import router from '@/router'
import FnBView from '@/views/fnb/FnBView.vue'
import { useAuthStore } from '@/stores/authStore'

const PENDING_ORDER = { id: 1, status: 'pending', items: [], total_amount: 0, customer: { name: 'Budi' } }

const ALL_STORES = { all_stores: true, store_ids: [] }

const mountAs = async (permissions, store_access = ALL_STORES) => {
  get.mockImplementation(async (url) => {
    if (url.includes('orders')) return { data: { data: [PENDING_ORDER] } }
    if (url === '/stores') return { data: { data: [{ id: 'a', name: 'Alpha' }] } }
    return { data: { data: [] } }
  })
  const pinia = createPinia()
  setActivePinia(pinia)
  useAuthStore().staff = { username: 'x', role: { is_system: false, permissions }, ...(store_access && { store_access }) }
  const w = mount(FnBView, { global: { plugins: [pinia, ElementPlus], components: Icons } })
  await flushPromises()
  return w
}
const buttonTexts = (w) => w.findAll('button').map((b) => b.text())

describe('FnB', () => {
  afterEach(() => get.mockReset())

  it('route is guarded by orders_fnb.view (the permission the backend enforces)', () => {
    expect(router.getRoutes().find((r) => r.path === '/fnb').meta.permission).toBe('orders_fnb.view')
  })

  it('RoleView offers exactly the FnB permissions the backend uses', () => {
    const roleView = readFileSync('src/views/role/RoleView.vue', 'utf8')
    expect([...roleView.matchAll(/value: '(orders_fnb\.\w+)'/g)].map((m) => m[1])).toEqual([
      'orders_fnb.view',
      'orders_fnb.edit',
    ])
  })

  it('calls the API without a doubled /admin prefix', async () => {
    await mountAs(['orders_fnb.view'])
    const urls = get.mock.calls.map(([url]) => url)
    expect(urls).toContain('/fnb/orders')
    expect(urls.filter((u) => u.startsWith('/admin/'))).toEqual([])
  })

  it('without store_access, orders are not requested and a warning shows (fail closed)', async () => {
    const w = await mountAs(['orders_fnb.view'], null)
    expect(get.mock.calls.map(([url]) => url)).not.toContain('/fnb/orders')
    expect(w.text()).toContain('Tidak ada cabang aktif yang bisa Anda akses')
  })

  it('view-only staff see menu and orders but no write actions', async () => {
    const texts = buttonTexts(await mountAs(['orders_fnb.view']))
    for (const label of ['Sync dari Moka', 'Kategori Baru', 'Tambah Item', 'Siapkan', 'Batalkan']) {
      expect(texts.some((t) => t.includes(label)), label).toBe(false)
    }
  })

  it('staff with orders_fnb.edit get the write actions', async () => {
    const texts = buttonTexts(await mountAs(['orders_fnb.view', 'orders_fnb.edit']))
    for (const label of ['Sync dari Moka', 'Kategori Baru', 'Tambah Item', 'Siapkan', 'Batalkan']) {
      expect(texts.some((t) => t.includes(label)), label).toBe(true)
    }
  })

  it('view-only staff get no empty actions group in the menu toolbar', async () => {
    const w = await mountAs(['orders_fnb.view'])
    expect(w.findAll('.ui-filter-bar')[0].find('.ui-filter-bar__actions').exists()).toBe(false)
  })

  it('tabs and order actions use icons instead of emoji', async () => {
    const w = await mountAs(['orders_fnb.view', 'orders_fnb.edit'])
    expect(w.text()).not.toMatch(/[\u{1F300}-\u{1FAFF}\u{2705}\u{274C}]/u)
    expect(w.text()).toContain('Menu')
    expect(w.text()).toContain('Pesanan FnB')
    for (const icon of [Icons.Food, Icons.List, Icons.Refresh, Icons.KnifeFork, Icons.CircleClose]) {
      expect(w.findComponent(icon).exists(), icon.name).toBe(true)
    }
  })
})
