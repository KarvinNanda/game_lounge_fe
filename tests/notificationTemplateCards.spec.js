import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import * as Icons from '@element-plus/icons-vue'

vi.mock('@/api/notification_template/notificationTemplateApi', () => ({
  getTemplates: vi.fn().mockResolvedValue({ data: { data: [
    { notification_key: 'booking_confirmed', name: 'Konfirmasi Booking', description: 'x',
      is_email_active: true, is_whatsapp_active: true, email_subject: 's', email_body: 'b', whatsapp_body: 'w' },
  ] } }),
  updateTemplate: vi.fn(),
  previewTemplate: vi.fn(),
}))

import NotificationTemplatesView from '@/views/settings/NotificationTemplatesView.vue'

const mountView = async () => {
  const w = mount(NotificationTemplatesView, { attachTo: document.body, global: { plugins: [ElementPlus], components: Icons } })
  await flushPromises()
  return w
}

describe('Notification template cards', () => {
  it('shows an active Email channel in the same green as an active WhatsApp channel', async () => {
    const w = await mountView()
    const tags = w.findAll('.card-channels .el-tag')
    expect(tags).toHaveLength(2)
    expect(tags.every((t) => t.classes().includes('el-tag--success'))).toBe(true)
    w.unmount()
  })

  it('opens the editor from the keyboard (the card is the button)', async () => {
    const w = await mountView()
    const card = w.find('.template-card')
    expect(card.attributes('role')).toBe('button')
    expect(card.attributes('tabindex')).toBe('0')
    expect(card.attributes('aria-label')).toBe('Ubah template Konfirmasi Booking')
    expect(w.find('.card-edit-hint').attributes('aria-hidden')).toBe('true')
    await card.trigger('keydown', { key: 'Enter' })
    await flushPromises()
    expect(document.querySelector('.el-drawer')).not.toBeNull()
    w.unmount()
  })
})
