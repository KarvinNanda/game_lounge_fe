import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ElementPlus, { ElMessageBox } from 'element-plus'
import * as Icons from '@element-plus/icons-vue'

// A staff username is user-controlled data. The reset-password dialog must show it
// as text: rendered as HTML, `<img onerror>` would run script in the admin's session.
const EVIL = '<img src=x onerror="window.__xss=1">'
const m = vi.hoisted(() => ({
  getStaffs: vi.fn(), resetStaffPassword: vi.fn(), getRoles: vi.fn(), getStores: vi.fn(),
}))
vi.mock('@/api/staff/staffApi', () => ({ getStaffs: m.getStaffs, createStaff: vi.fn(), updateStaff: vi.fn(),
  deleteStaff: vi.fn(), resetStaffPassword: m.resetStaffPassword }))
vi.mock('@/api/role/roleApi', () => ({ getRoles: m.getRoles }))
vi.mock('@/api/store/storeApi', () => ({ getStores: m.getStores }))

import StaffView from '@/views/staff/StaffView.vue'
import { useAuthStore } from '@/stores/authStore'

const empty = { data: { data: [], meta: { total: 0 } } }

describe('StaffView reset password dialog', () => {
  afterEach(() => { vi.restoreAllMocks(); delete window.__xss; document.body.innerHTML = '' })

  it('shows the username as text, never as HTML', async () => {
    m.getStaffs.mockResolvedValue({ data: { data: [{ id: 's9', username: EVIL, email: 'e@x.id', role: { name: 'Kasir' } }], meta: { total: 1 } } })
    m.getRoles.mockResolvedValue(empty)
    m.getStores.mockResolvedValue(empty)
    const confirm = vi.spyOn(ElMessageBox, 'confirm').mockRejectedValue('cancel')
    const pinia = createPinia()
    setActivePinia(pinia)
    useAuthStore().staff = { id: 'me', username: 'root', role: { is_system: true, name: 'Owner' } }
    const w = mount(StaffView, { attachTo: document.body, global: { plugins: [pinia, ElementPlus], components: Icons, stubs: { AuditTrail: true } } })
    await flushPromises()

    await w.findComponent(Icons.Key).element.closest('button').click()
    await flushPromises()

    expect(confirm).toHaveBeenCalledTimes(1)
    const [message, , options] = confirm.mock.calls[0]
    expect(options?.dangerouslyUseHTMLString).toBeFalsy()
    const rendered = mount({ render: () => message })
    expect(rendered.text()).toContain(EVIL)
    expect(rendered.find('img').exists()).toBe(false)
    expect(rendered.text()).toContain('Password baru akan dikirimkan ke email staff.')
  })
})
