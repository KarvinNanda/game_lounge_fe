import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it, expect } from 'vitest'

const filesUnder = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f)
    return statSync(p).isDirectory() ? filesUnder(p) : [p]
  })
const views = filesUnder('src/views').filter((p) => p.endsWith('.vue'))
const templateOf = (p) => readFileSync(p, 'utf8').split('<script')[0]

// Copied markup that the shared components in src/components/ui replace.
const BANNED = [
  /class="page-header"/,
  /class="stats-(row|grid)"/,
  /class="stat-(item|card)"/,
  /class="(filter-bar|table-toolbar|toolbar)"/,
  /class="empty-state"/,
  /<el-pagination\b/,
]

const PAGE_HEADER_VIEWS = [
  'booking/BookingView', 'dashboard/DashboardView', 'facility/FacilityCategoryView', 'facility/FacilityFormView',
  'facility/FacilityView', 'fnb/FnBView', 'play_credits/PlayCreditsView', 'pricing/PricingEditView',
  'pricing/PricingView', 'profile/ProfileView', 'promotion/PromotionView', 'role/RoleView',
  'room_template/RoomTemplateFormView', 'room_template/RoomTemplateView', 'settings/BannerManagementView',
  'settings/GlobalHolidayView', 'settings/NotificationTemplatesView', 'staff/StaffView',
  'store/StoreCreateView', 'store/StoreView',
]

describe('shared UI adoption', () => {
  it('no view keeps the copied header, stats, filter, empty-state or pager markup', () => {
    const offenders = views.flatMap((p) =>
      BANNED.filter((re) => re.test(templateOf(p))).map((re) => `${p}: ${re}`))
    expect(offenders).toEqual([])
  })

  it('the guard patterns catch the old markup', () => {
    const old = '<div class="page-header"><div class="stats-row"><div class="table-toolbar"><el-pagination />'
    expect(BANNED.filter((re) => re.test(old))).toHaveLength(4)
  })

  it.each(PAGE_HEADER_VIEWS)('%s uses PageHeader', (v) => {
    expect(templateOf(`src/views/${v}.vue`)).toContain('<PageHeader')
  })
})
