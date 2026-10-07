import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ElementPlus from 'element-plus'
import * as Icons from '@element-plus/icons-vue'
import TablePagination from '@/components/ui/TablePagination.vue'
import FilterBar from '@/components/ui/FilterBar.vue'
import { useAuthStore } from '@/stores/authStore'

// Every list API answers 95 rows, so page 3 of 10 stays valid and Element
// Plus never clamps the page on its own (that would hide the bug).
const m = vi.hoisted(() => {
  const fns = {}
  const reply = () => Promise.resolve({ data: { data: [], meta: { total: 95 } } })
  const mod = (names) => Object.fromEntries(names.map((n) => [n, (fns[n] ??= vi.fn(reply))]))
  return { fns, mod, reply }
})
vi.mock('@/api/staff/staffApi', () => m.mod(['getStaffs', 'createStaff', 'updateStaff', 'deleteStaff', 'resetStaffPassword']))
vi.mock('@/api/role/roleApi', () => m.mod(['getRoles']))
vi.mock('@/api/store/storeApi', () => m.mod(['getStores', 'deleteStore', 'updateStore', 'updateStoreRoom',
  'getGlobalHolidays', 'createGlobalHoliday', 'updateGlobalHoliday', 'deleteGlobalHoliday']))
vi.mock('@/api/facility/facilityApi', () => m.mod(['getFacilities', 'deleteFacility', 'updateFacility', 'getFacilityCategories']))
vi.mock('@/api/room_template/roomTemplateApi', () => m.mod(['getRoomTemplates', 'updateRoomTemplate', 'deleteRoomTemplate']))
vi.mock('@/api/voucher/voucherApi', () => m.mod(['getVouchers', 'getVoucherById', 'generateCode', 'createVoucher',
  'updateVoucher', 'deleteVoucher', 'getVoucherRecipientCount']))
vi.mock('@/api/customer/customerApi', () => m.mod(['getCustomers', 'getCustomerById', 'createCustomer', 'updateCustomer',
  'updateCustomerNotes', 'deleteCustomer', 'resendPassword']))
vi.mock('@/api/play_credits/playCreditsApi', () => m.mod(['getPackages', 'getActivePackages', 'createPackage',
  'updatePackage', 'deletePackage', 'getMemberCredits', 'assignCredit', 'adjustCredit']))

const SYSTEM = { username: 'admin', role: { is_system: true, name: 'Owner' }, store_access: { all_stores: true, store_ids: [] } }

const mountView = async (load) => {
  const pinia = createPinia()
  setActivePinia(pinia)
  useAuthStore().staff = SYSTEM
  const w = mount((await load()).default, {
    global: { plugins: [pinia, ElementPlus], components: Icons, stubs: { AuditTrail: true } },
  })
  await flushPromises()
  return w
}

// Trigger kinds: 'search' (type into the first input of the filter bar, wait
// for the 400 ms debounce), 'select:<placeholder>[@n]' (n-th select with that
// placeholder), 'picker' (first date picker), 'reset' (the Reset button).
const fire = async (w, bar, kind) => {
  if (kind === 'search') {
    bar.findAllComponents({ name: 'ElInput' })[0].vm.$emit('input', 'abc')
    vi.advanceTimersByTime(400)
  } else if (kind.startsWith('select:')) {
    const [ph, n = '0'] = kind.slice(7).split('@')
    const sel = w.findAllComponents({ name: 'ElSelect' }).filter((s) => s.props('placeholder') === ph)[Number(n)]
    sel.vm.$emit('change', 'x')
  } else if (kind === 'picker') {
    bar.findAllComponents({ name: 'ElDatePicker' })[0].vm.$emit('change', '2026')
  } else if (kind === 'reset') {
    await bar.findAll('button').find((b) => b.text().includes('Reset')).trigger('click')
  }
  await flushPromises()
}

// view, list API, which TablePagination / FilterBar (index) belong to the table, triggers
const CASES = [
  { view: 'Staff', load: () => import('@/views/staff/StaffView.vue'), api: 'getStaffs', table: 0,
    triggers: ['search', 'select:Semua Role', 'select:Semua Cabang', 'reset'] },
  { view: 'Facility', load: () => import('@/views/facility/FacilityView.vue'), api: 'getFacilities', table: 0,
    triggers: ['search', 'select:Semua Kategori', 'select:Semua Status', 'reset'] },
  { view: 'Store', load: () => import('@/views/store/StoreView.vue'), api: 'getStores', table: 0,
    triggers: ['search', 'select:Semua Status', 'reset'] },
  { view: 'RoomTemplate', load: () => import('@/views/room_template/RoomTemplateView.vue'), api: 'getRoomTemplates', table: 0,
    triggers: ['search', 'reset'] },
  { view: 'GlobalHoliday', load: () => import('@/views/settings/GlobalHolidayView.vue'), api: 'getGlobalHolidays', table: 0,
    triggers: ['search', 'picker', 'reset'] },
  { view: 'Promotion', load: () => import('@/views/promotion/PromotionView.vue'), api: 'getVouchers', table: 0,
    triggers: ['select:Semua Status', 'select:Semua Jenis'] },
  { view: 'Customer', load: () => import('@/views/customer/CustomerView.vue'), api: 'getCustomers', table: 0,
    triggers: ['select:Semua Status', 'select:Semua Gender'] },
  { view: 'PlayCredits packages', load: () => import('@/views/play_credits/PlayCreditsView.vue'), api: 'getPackages', table: 0,
    triggers: ['select:Semua Status@0'] },
  { view: 'PlayCredits members', load: () => import('@/views/play_credits/PlayCreditsView.vue'), api: 'getMemberCredits', table: 1,
    triggers: ['select:Semua Paket', 'select:Semua Status@1'] },
]

const listCalls = (api) => m.fns[api].mock.calls.filter(([p]) => p && 'page' in p)

describe('filter changes start again at page 1', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    Object.values(m.fns).forEach((fn) => { fn.mockReset(); fn.mockImplementation(m.reply) })
  })
  afterEach(() => {
    vi.useRealTimers()
    document.body.innerHTML = ''
  })

  for (const c of CASES) {
    for (const t of c.triggers) {
      it(`${c.view}: ${t} on page 3 fetches page 1 once`, async () => {
        const w = await mountView(c.load)
        w.findAllComponents(TablePagination)[c.table].vm.$emit('update:page', 3)
        await flushPromises()
        const before = listCalls(c.api).length
        await fire(w, w.findAllComponents(FilterBar)[c.table], t)
        const calls = listCalls(c.api)
        expect(calls.length).toBe(before + 1)
        expect(calls.at(-1)[0].page).toBe(1)
      })
    }

    it(`${c.view}: the pager still fetches the clicked page`, async () => {
      const w = await mountView(c.load)
      const pager = w.findAllComponents(TablePagination)[c.table]
      pager.findComponent({ name: 'ElPagination' }).vm.$emit('update:current-page', 4)
      await flushPromises()
      expect(listCalls(c.api).at(-1)[0].page).toBe(4)
    })
  }
})
