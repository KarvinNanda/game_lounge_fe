import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import * as Icons from '@element-plus/icons-vue'

vi.mock('vue-router', () => ({ useRoute: () => ({ params: { token: 'used-token' } }) }))
vi.mock('@/api/auth/authApi', () => ({
  validateResetToken: vi.fn().mockRejectedValue(new Error('invalid')),
  resetPassword: vi.fn(),
}))

import AdminRecoveryResetView from '@/views/auth/AdminRecoveryResetView.vue'

describe('AdminRecoveryResetView with an invalid or used link', () => {
  // The page cannot tell whose token it was. Staff links come from a Super Admin
  // reset; only the Super Admin can request a new link from /admin-recovery.
  it('tells staff to ask a Super Admin, and points only the Super Admin to the request button', async () => {
    const w = mount(AdminRecoveryResetView, { global: { plugins: [ElementPlus], components: Icons, mocks: { $router: { push: vi.fn() } } } })
    await flushPromises()

    expect(w.text()).toContain('Link Tidak Valid')
    expect(w.text()).toContain('Staff: Minta Super Admin untuk reset ulang.')
    expect(w.text()).toContain('Super Admin: Minta link baru lewat tombol di bawah.')
    // The label stays short: a longer one overflowed the card at 375px.
    const button = w.findAll('button').find((b) => b.text().includes('Minta Link Baru'))
    expect(button.text()).toBe('Minta Link Baru')
  })
})
