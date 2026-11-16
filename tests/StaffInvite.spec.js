import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ElementPlus, { ElMessage } from 'element-plus'
import * as Icons from '@element-plus/icons-vue'

const m = vi.hoisted(() => ({ createStaff: vi.fn() }))
vi.mock('@/api/staff/staffApi', () => ({
  getStaffs: vi.fn().mockResolvedValue({ data: { data: [], meta: { total: 0 } } }),
  createStaff: m.createStaff, updateStaff: vi.fn(), deleteStaff: vi.fn(), resetStaffPassword: vi.fn(),
}))
vi.mock('@/api/role/roleApi', () => ({
  getRoles: vi.fn().mockResolvedValue({ data: { data: [{ id: 'r1', name: 'Kasir' }] } }),
}))
vi.mock('@/api/store/storeApi', () => ({ getStores: vi.fn().mockResolvedValue({ data: { data: [] } }) }))

import StaffView from '@/views/staff/StaffView.vue'
import { useAuthStore } from '@/stores/authStore'

// The backend now rejects a password from the admin: a new staff member gets a
// 72-hour invitation link by email and sets their own password.
describe('Tambah Staff sends an invitation instead of a password', () => {
  afterEach(() => { vi.restoreAllMocks(); document.body.innerHTML = '' })

  const openCreateDrawer = async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    useAuthStore().staff = { id: 'me', username: 'root', role: { is_system: true, name: 'Owner' } }
    const w = mount(StaffView, { attachTo: document.body, global: { plugins: [pinia, ElementPlus], components: Icons, stubs: { AuditTrail: true } } })
    await flushPromises()
    await w.findAll('button').find((b) => b.text().includes('Tambah Staff')).trigger('click')
    await flushPromises()
    return w
  }

  it('has no password fields and says an invitation will be emailed', async () => {
    await openCreateDrawer()
    const drawer = document.querySelector('.el-drawer')
    expect(drawer.querySelectorAll('input[type="password"]')).toHaveLength(0)
    expect(drawer.textContent).toContain('email undangan (berlaku 72 jam)')
  })

  it('creates the staff without a password and confirms the invitation', async () => {
    m.createStaff.mockResolvedValue({ data: {} })
    const success = vi.spyOn(ElMessage, 'success').mockImplementation(() => {})
    const w = await openCreateDrawer()

    const input = (ph) => w.findAll('input').find((i) => i.attributes('placeholder') === ph)
    await input('Masukkan username').setValue('kasir.baru')
    await input('Masukkan email').setValue('kasir.baru@example.com')
    const roleSelect = w.findAllComponents({ name: 'ElSelect' }).find((s) => s.props('placeholder') === 'Pilih role')
    roleSelect.vm.$emit('update:modelValue', 'r1')
    await flushPromises()

    const save = [...document.querySelectorAll('.el-drawer button')].find((b) => b.textContent.includes('Tambah Staff'))
    save.click()
    await flushPromises()

    expect(m.createStaff).toHaveBeenCalledTimes(1)
    const payload = m.createStaff.mock.calls[0][0]
    expect(payload).toMatchObject({ username: 'kasir.baru', email: 'kasir.baru@example.com', role_id: 'r1' })
    expect(payload).not.toHaveProperty('password')
    expect(success).toHaveBeenCalledWith('Staff ditambahkan. Undangan untuk membuat password telah dikirim ke email staff.')
  })
})
