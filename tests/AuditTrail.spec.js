import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import * as Icons from '@element-plus/icons-vue'
import AuditTrail from '@/components/AuditTrail.vue'
import { auditUser } from '@/utils/audit'

const ID = '37e0d3d6-a712-4786-89e2-add3d6c80c5a'

describe('auditUser', () => {
  it('never shows a raw staff id', () => {
    expect(auditUser(ID)).toBeNull()
    expect(auditUser(ID.toUpperCase())).toBeNull()
  })
  it('prefers a name: separate field, then an object, then a plain non-id string', () => {
    expect(auditUser(ID, 'Rina')).toBe('Rina')
    expect(auditUser({ id: ID, name: 'Rina' })).toBe('Rina')
    expect(auditUser({ id: ID, username: 'rina' })).toBe('rina')
    expect(auditUser('system')).toBe('system')
    expect(auditUser(null)).toBeNull()
  })
})

describe('AuditTrail', () => {
  const mountTrail = (props) => mount(AuditTrail, { props, global: { plugins: [ElementPlus], components: Icons } })

  it('shows the date but not the id when only an id is known', () => {
    const w = mountTrail({ createdBy: ID, createdAt: '2026-11-16T13:05:00Z' })
    expect(w.text()).not.toContain(ID)
    expect(w.find('.at-user').exists()).toBe(false)
    expect(w.text()).toContain('2026')
  })

  it('shows the staff name when the backend sends it', () => {
    const w = mountTrail({ createdBy: ID, createdByName: 'Rina', createdAt: '2026-11-16T13:05:00Z' })
    expect(w.find('.at-user').text()).toBe('Rina')
  })

  it('renders nothing when there is only an id and no dates', () => {
    expect(mountTrail({ createdBy: ID }).find('.audit-trail').exists()).toBe(false)
  })
})
