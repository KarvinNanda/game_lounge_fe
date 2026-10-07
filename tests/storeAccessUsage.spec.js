import { readFileSync } from 'node:fs'
import { describe, it, expect } from 'vitest'

describe('branch access', () => {
  // Staff/Promotion edit is_all_stores as data of *another* record; that is
  // fine. These files decide what the *logged-in* staff may use.
  it.each([
    'src/views/booking/BookingView.vue',
    'src/views/dashboard/DashboardView.vue',
    'src/views/fnb/FnBView.vue',
    'src/layouts/AdminLayout.vue',
    'src/views/profile/ProfileView.vue',
  ])('%s does not derive branch access from is_all_stores or staff_stores', (file) => {
    expect(readFileSync(file, 'utf8')).not.toMatch(/is_all_stores|staff_stores/)
  })

  it.each([
    ['src/views/dashboard/DashboardView.vue', true],
    ['src/views/fnb/FnBView.vue', true],
    ['src/views/booking/BookingView.vue', false],
  ])('%s picks branches through useAllowedStores (allowAll: %s)', (file, allowAll) => {
    expect(readFileSync(file, 'utf8')).toContain(`useAllowedStores({ allowAll: ${allowAll} })`)
  })
})
