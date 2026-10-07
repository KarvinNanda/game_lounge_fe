import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import ElementPlus from 'element-plus'
import * as Icons from '@element-plus/icons-vue'

vi.mock('@/api/booking/bookingApi', () => ({
  getSessionsEndingSoon: vi.fn().mockResolvedValue({ data: { data: [] } }),
}))
vi.mock('@/api/store/storeApi', () => ({
  getStores: vi.fn().mockResolvedValue({ data: { data: [{ id: 'b', name: 'Beta' }, { id: 'c', name: 'Gamma' }] } }),
}))

import AdminLayout from '@/layouts/AdminLayout.vue'
import { getSessionsEndingSoon } from '@/api/booking/bookingApi'
import { useAuthStore } from '@/stores/authStore'

const setWidth = (w) => Object.defineProperty(window, 'innerWidth', { configurable: true, value: w })

const SYSTEM_STAFF = {
  username: 'admin',
  role: { is_system: true, name: 'Owner' },
  store_access: { all_stores: true, store_ids: [] },
}
const branchStaff = (store_ids) => ({
  username: 'spv',
  role: { is_system: false, name: 'Supervisor', permissions: ['bookings.view'] },
  store_access: { all_stores: false, store_ids },
})
const bellButton = (wrapper) => wrapper.find('button[aria-label^="Sesi hampir selesai"]')

const mountLayout = async (path = '/dashboard', staff = SYSTEM_STAFF) => {
  const pinia = createPinia()
  setActivePinia(pinia)
  useAuthStore().staff = staff
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:p(.*)*', component: { render: () => null } }],
  })
  router.push(path)
  await router.isReady()
  const wrapper = mount(AdminLayout, {
    global: {
      plugins: [pinia, router, ElementPlus],
      components: Icons,
    },
  })
  await flushPromises()
  return { wrapper, router }
}

const groupButton = (wrapper, text) =>
  wrapper.findAll('button.nav-group-header').find((b) => b.text().includes(text))

describe('AdminLayout', () => {
  beforeEach(() => {
    setWidth(1280)
    getSessionsEndingSoon.mockReset()
    getSessionsEndingSoon.mockResolvedValue({ data: { data: [] } })
  })

  it('all-branches staff poll the bell once, without store_id', async () => {
    const { wrapper } = await mountLayout()
    expect(getSessionsEndingSoon.mock.calls).toEqual([[undefined]])
    expect(bellButton(wrapper).exists()).toBe(true)
  })

  it('multi-branch staff poll once per allowed branch and see every session', async () => {
    getSessionsEndingSoon.mockImplementation(async (storeId) => ({ data: { data: [{ id: `s-${storeId}` }] } }))
    const { wrapper } = await mountLayout('/dashboard', branchStaff(['b', 'c']))
    expect(getSessionsEndingSoon.mock.calls).toEqual([['b'], ['c']])
    expect(bellButton(wrapper).attributes('aria-label')).toBe('Sesi hampir selesai: 2')
  })

  it('keeps the branches that answered when one branch fails', async () => {
    getSessionsEndingSoon.mockImplementation(async (storeId) => {
      if (storeId === 'b') throw new Error('400')
      return { data: { data: [{ id: 's-c' }] } }
    })
    const { wrapper } = await mountLayout('/dashboard', branchStaff(['b', 'c']))
    expect(bellButton(wrapper).attributes('aria-label')).toBe('Sesi hampir selesai: 1')
  })

  it('polls right away when bell access arrives after mount (no 60 s wait)', async () => {
    const { wrapper } = await mountLayout('/dashboard', { username: 'late', role: { is_system: true, name: 'Owner' } })
    expect(getSessionsEndingSoon).not.toHaveBeenCalled()
    useAuthStore().staff = SYSTEM_STAFF
    await flushPromises()
    expect(getSessionsEndingSoon).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })

  it('makes no bell request when /me has no store_access (fail closed)', async () => {
    const legacy = { username: 'old', role: { is_system: true, name: 'Owner' } }
    await mountLayout('/dashboard', legacy)
    expect(getSessionsEndingSoon).not.toHaveBeenCalled()
  })

  it('hides the bell and never polls without bookings.view (avoids a 403 every minute)', async () => {
    const cashier = { username: 'kasir', role: { is_system: false, name: 'Kasir', permissions: ['customers.view'] } }
    const { wrapper } = await mountLayout('/dashboard', cashier)
    expect(getSessionsEndingSoon).not.toHaveBeenCalled()
    expect(wrapper.find('button[aria-label^="Sesi hampir selesai"]').exists()).toBe(false)
  })

  it('group headers are buttons that toggle aria-expanded', async () => {
    const { wrapper } = await mountLayout('/dashboard')
    const settings = groupButton(wrapper, 'Settings')
    expect(settings.attributes('aria-expanded')).toBe('false')
    await settings.trigger('click')
    expect(settings.attributes('aria-expanded')).toBe('true')
  })

  it('opens the group that contains the current route', async () => {
    const { wrapper } = await mountLayout('/staff')
    expect(groupButton(wrapper, 'Settings').attributes('aria-expanded')).toBe('true')
  })

  it('on narrow screens the sidebar starts hidden and hides again after navigation', async () => {
    setWidth(800)
    const { wrapper, router } = await mountLayout('/dashboard')
    const sidebar = () => wrapper.find('#admin-sidebar')
    expect(sidebar().classes()).toContain('collapsed')

    await wrapper.find('button[aria-controls="admin-sidebar"]').trigger('click')
    expect(sidebar().classes()).not.toContain('collapsed')

    await router.push('/bookings')
    await flushPromises()
    expect(sidebar().classes()).toContain('collapsed')
  })

  it('Escape closes the overlay sidebar and returns focus to the toggle', async () => {
    setWidth(800)
    const { wrapper } = await mountLayout('/dashboard')
    document.body.appendChild(wrapper.element)
    const toggle = wrapper.find('button[aria-controls="admin-sidebar"]')
    await toggle.trigger('click')
    expect(wrapper.find('#admin-sidebar').classes()).not.toContain('collapsed')

    await wrapper.find('#admin-sidebar').trigger('keydown', { key: 'Escape' })
    expect(wrapper.find('#admin-sidebar').classes()).toContain('collapsed')
    expect(document.activeElement).toBe(toggle.element)
    wrapper.element.remove()
  })

  it('does not add the light-mode class to body', async () => {
    await mountLayout()
    expect(document.body.classList.contains('light-mode')).toBe(false)
  })
})
