import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ElementPlus from 'element-plus'
import * as Icons from '@element-plus/icons-vue'

vi.mock('@/api/customer/customerApi', () => ({
  getCustomers: vi.fn().mockResolvedValue({ data: { data: [
    { id: 'c1', name: 'Lina Tanoto', whatsapp: '0857', type: 'member', status: 'active', total_visit: 1, last_visit_date: '2026-10-09', last_visit_time: '20:00' },
    { id: 'c2', name: 'Fajar Nugroho', whatsapp: '0858', type: 'regular', status: 'active', total_visit: 0, last_visit_date: null, last_visit_time: null },
  ], meta: { total: 2 } } }),
  getCustomerById: vi.fn(), createCustomer: vi.fn(), updateCustomer: vi.fn(),
  updateCustomerNotes: vi.fn(), deleteCustomer: vi.fn(), resendPassword: vi.fn(),
}))
vi.mock('@/api/room_template/roomTemplateApi', () => ({ getRoomTemplates: vi.fn().mockResolvedValue({ data: { data: [] } }) }))

import CustomerView from '@/views/customer/CustomerView.vue'
import { useAuthStore } from '@/stores/authStore'

// The backend sends last_visit_date as YYYY-MM-DD; show it like the other dates on this page.
describe('Customers: Kunjungan Terakhir', () => {
  it('shows the last visit as a readable date with its start time, "-" when never visited', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    useAuthStore().staff = { username: 'x', role: { name: 'R', is_system: true, permissions: [] } }
    const w = mount(CustomerView, { global: { plugins: [pinia, ElementPlus], components: Icons, stubs: { AuditTrail: true } } })
    await flushPromises()

    const row = (name) => w.findAll('.el-table__row').find((r) => r.text().includes(name))
    expect(row('Lina Tanoto').text()).toContain('09 Oktober 2026')
    expect(row('Lina Tanoto').text()).toContain('20:00')
    expect(row('Lina Tanoto').text()).not.toContain('2026-10-09')
    expect(row('Fajar Nugroho').text()).toContain('-')
  })
})
