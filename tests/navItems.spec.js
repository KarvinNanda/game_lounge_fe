import { describe, it, expect } from 'vitest'
import { NAV_SECTIONS, visibleSections, groupKeyForPath } from '@/layouts/navItems'
import router from '@/router'

const canWith = (perms, system = false) => (p) => !p || system || perms.includes(p)
const labels = (sections) => sections.flatMap((s) => s.items.map((i) => i.label))

describe('sidebar navigation', () => {
  it('shows everything to a system user', () => {
    const all = NAV_SECTIONS.flatMap((s) => s.items).length
    expect(labels(visibleSections(NAV_SECTIONS, canWith([], true)))).toHaveLength(all)
  })

  it('hides FnB until its backend API exists', () => {
    const all = NAV_SECTIONS.flatMap((s) => s.items).map((i) => i.to)
    expect(all).not.toContain('/fnb')
  })

  it('shows only Dashboard to a user with no permissions', () => {
    expect(labels(visibleSections(NAV_SECTIONS, canWith([])))).toEqual(['Dashboard'])
  })

  it('shows holiday and banner settings to a settings.branches-only user', () => {
    const settings = visibleSections(NAV_SECTIONS, canWith(['settings.branches']))
      .find((s) => s.group?.key === 'settings')
    expect(settings.items.map((i) => i.to)).toEqual(['/settings/global-holidays', '/settings/banners'])
  })

  it('uses the same permission as the route guard for every link', () => {
    for (const item of NAV_SECTIONS.flatMap((s) => s.items)) {
      const route = router.getRoutes().find((r) => r.path === item.to)
      expect(route, `route for ${item.to}`).toBeTruthy()
      expect(item.perm, `perm for ${item.to}`).toBe(route.meta.permission)
    }
  })

  it('maps a path to the group that owns it', () => {
    expect(groupKeyForPath('/store/create')).toBe('store')
    expect(groupKeyForPath('/settings/banners')).toBe('settings')
    expect(groupKeyForPath('/bookings')).toBeUndefined()
  })
})
