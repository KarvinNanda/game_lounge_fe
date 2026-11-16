import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ElementPlus from 'element-plus'
import * as Icons from '@element-plus/icons-vue'

vi.mock('@/api/role/roleApi', () => ({
  getRoles: vi.fn().mockResolvedValue({ data: { data: [
    { id: 'r1', name: 'Kasir', is_system: false, permissions: ['bookings.view', 'orders_fnb.view'] },
  ] } }),
  createRole: vi.fn(),
  updateRole: vi.fn().mockResolvedValue({ data: {} }),
  deleteRole: vi.fn(),
}))

import { isFnbEnabled } from '@/config/features'
import RoleView from '@/views/role/RoleView.vue'
import { updateRole } from '@/api/role/roleApi'
import { useAuthStore } from '@/stores/authStore'

afterEach(() => vi.unstubAllEnvs())

describe('FnB feature flag (mirrors backend FNB_ENABLED, default off)', () => {
  it('is off unless VITE_FNB_ENABLED is exactly "true"', () => {
    expect(isFnbEnabled({})).toBe(false)
    expect(isFnbEnabled({ VITE_FNB_ENABLED: 'false' })).toBe(false)
    expect(isFnbEnabled({ VITE_FNB_ENABLED: '1' })).toBe(false)
    expect(isFnbEnabled({ VITE_FNB_ENABLED: 'true' })).toBe(true)
  })

  it('does not register /fnb when off (every /api/admin/fnb call would 404)', async () => {
    vi.resetModules()
    const { default: router } = await import('@/router')
    expect(router.getRoutes().some((r) => r.path === '/fnb')).toBe(false)
  })

  it('registers /fnb when on', async () => {
    vi.stubEnv('VITE_FNB_ENABLED', 'true')
    vi.resetModules()
    const { default: router } = await import('@/router')
    expect(router.getRoutes().some((r) => r.path === '/fnb')).toBe(true)
  })
})

describe('role editor with FnB off', () => {
  const mountRoleView = async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    useAuthStore().staff = { username: 'x', role: { name: 'R', is_system: false, permissions: ['settings.staff_role'] } }
    const w = mount(RoleView, { attachTo: document.body, global: { plugins: [pinia, ElementPlus], components: Icons } })
    await flushPromises()
    return w
  }

  it('hides the Orders (F&B) group but keeps a role\'s existing FnB permission on save', async () => {
    const w = await mountRoleView()
    const edit = w.findAll('button').find((b) => b.find('svg').exists() && b.attributes('class')?.includes('is-circle'))
    await edit.trigger('click')
    await flushPromises()

    expect(document.body.textContent).toContain('Ubah Role')
    expect(document.body.textContent).not.toContain('Orders (F&B)')

    const save = [...document.querySelectorAll('button')].find((b) => b.textContent.includes('Simpan Perubahan'))
    save.click()
    await flushPromises()

    expect(updateRole).toHaveBeenCalledTimes(1)
    const [, payload] = updateRole.mock.calls[0]
    expect(payload.permissions).toEqual(expect.arrayContaining(['bookings.view', 'orders_fnb.view']))
    w.unmount()
  })
})
