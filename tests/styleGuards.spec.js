import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it, expect } from 'vitest'

const filesUnder = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f)
    return statSync(p).isDirectory() ? filesUnder(p) : [p]
  })
const ALL = [...filesUnder('src/views'), ...filesUnder('src/components')].filter((p) => p.endsWith('.vue'))

// Widened group by group (plan Tasks 3–6); at the end it equals ALL.
const G1 = ['BookingGrid', 'BookingFilterBar', 'BookingDetailPanel', 'EventDetailPanel', 'EventBookingPanel',
  'NewBookingPanel', 'BookingConfirmDialog', 'BookingSuccessDialog'].map((n) => `src/components/booking/${n}.vue`)
  .concat('src/views/booking/BookingView.vue')
const G2 = ['facility/FacilityView', 'facility/FacilityCategoryView', 'facility/FacilityFormView', 'role/RoleView',
  'room_template/RoomTemplateView', 'room_template/RoomTemplateFormView', 'pricing/PricingView', 'profile/ProfileView',
  'settings/NotificationTemplatesView', 'settings/BannerManagementView', 'settings/GlobalHolidayView', 'staff/StaffView',
  'store/StoreView', 'auth/AdminRecoveryRequestView', 'auth/AdminRecoveryResetView'].map((n) => `src/views/${n}.vue`)
const G3 = ['dashboard/DashboardView', 'fnb/FnBView', 'customer/CustomerView'].map((n) => `src/views/${n}.vue`)
const G4 = ['store/StoreCreateView', 'promotion/PromotionView', 'pricing/PricingEditView', 'play_credits/PlayCreditsView']
  .map((n) => `src/views/${n}.vue`)
const DONE = ALL   // G1–G4 converted group by group; G5 widened the guard to every file

const template = (src) => src.split(/<script|<style/)[0]
const styles = (src) => [...src.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n')

const STATIC_STYLE = /(^|\s)style="/m
const HEX = /(?<!&)#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B50}\u{2705}\u{274C}\u{2713}]/u
const EMOJI_ALLOWED = { 'src/views/settings/NotificationTemplatesView.vue': ['Emoji langsung ditulis'] }

const emojiLines = (p, src) => template(src).split('\n')
  .filter((l) => EMOJI.test(l) && !(EMOJI_ALLOWED[p] || []).some((a) => l.includes(a)))
const bareImportant = (src) => {
  const lines = styles(src).split('\n')
  const hasComment = (l = '') => /\/\*|\*\//.test(l)   // a comment opening or closing on that line
  return lines.filter((l, i) => l.includes('!important') && !hasComment(l) && !hasComment(lines[i - 1]))
}
const usedUtilities = (src) => [...template(src).matchAll(/\bu-[a-z0-9-]+/g)].map((m) => m[0])

describe('style guards: patterns', () => {
  it('catch what they should and spare what they should', () => {
    expect(STATIC_STYLE.test('<div style="color:red">')).toBe(true)
    expect(STATIC_STYLE.test('<div :style="{ color }">')).toBe(false)
    expect(HEX.test('color: #0282DE;')).toBe(true)
    expect(HEX.test('&#123;&#123;nama&#125;&#125;')).toBe(false)
    expect(EMOJI.test('🍳 Siapkan')).toBe(true)
    expect(EMOJI.test('Siapkan')).toBe(false)
  })
})

// Element Plus components whose root is a fragment (tooltip/popper): a scoped
// class on them never gets the data-v attribute, so `.cls { … }` never matches.
// Such a class must be styled through :deep() from a scoped ancestor.
const FRAGMENT_ROOT = /<(el-date-picker|el-time-picker|el-dropdown-item)\b[^>]*?\sclass="([^"]*)"/g
const unreachableClasses = (src) => [...template(src).matchAll(FRAGMENT_ROOT)]
  .flatMap((m) => m[2].split(/\s+/).filter((c) => c && !c.startsWith('u-')))
  .filter((c) => !styles(src).includes(`:deep(.${c})`))

// A class added by C3 must not reuse a name the same file already styles (later rule wins silently).
const reusedC3Classes = (src) => {
  const css = styles(src)
  const i = css.indexOf('/* C3: former inline styles */')
  if (i < 0) return []
  const defined = (part) => new Set([...part.matchAll(/(?:^|[\s,}])\.([a-z][\w-]*)\s*[{,]/g)].map((m) => m[1]))
  const before = defined(css.slice(0, i))
  return [...defined(css.slice(i))].filter((c) => before.has(c))
}

describe('style guards: scoped classes that silently miss', () => {
  it('catch what they should', () => {
    expect(unreachableClasses('<template><el-date-picker class="w" /></template><style scoped>.w{}</style>')).toEqual(['w'])
    expect(unreachableClasses('<template><el-date-picker class="w" /></template><style scoped>.a :deep(.w){}</style>')).toEqual([])
    expect(reusedC3Classes('<template></template><style scoped>.t { a: 1 }\n/* C3: former inline styles */\n.t { b: 2 }</style>')).toEqual(['t'])
  })
  it.each(ALL)('%s', (p) => {
    const src = readFileSync(p, 'utf8')
    expect({ unreachable: unreachableClasses(src), reused: reusedC3Classes(src) }).toEqual({ unreachable: [], reused: [] })
  })
})

describe('style guards: converted files', () => {
  it.each(DONE)('%s', (p) => {
    const src = readFileSync(p, 'utf8')
    expect({ inline: STATIC_STYLE.test(template(src)) }).toEqual({ inline: false })
    expect(src.split('\n').filter((l) => HEX.test(l))).toEqual([])
    expect(emojiLines(p, src)).toEqual([])
    expect(bareImportant(src)).toEqual([])
    const defined = [...readFileSync('src/assets/utilities.css', 'utf8').matchAll(/^\.(u-[a-z0-9-]+)/gm)].map((m) => m[1])
    expect(usedUtilities(src).filter((u) => !defined.includes(u))).toEqual([])
  })

  it('DONE only lists real files', () => {
    expect(DONE.filter((p) => !ALL.includes(p))).toEqual([])
  })
})
