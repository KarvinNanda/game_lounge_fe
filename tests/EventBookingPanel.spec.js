import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import * as Icons from '@element-plus/icons-vue'

const m = vi.hoisted(() => ({ createEventBooking: vi.fn(), previewEventPrice: vi.fn(), publicGet: vi.fn(), getCustomers: vi.fn() }))
vi.mock('@/api/booking/eventBookingApi', () => ({ createEventBooking: m.createEventBooking, previewEventPrice: m.previewEventPrice }))
vi.mock('@/api/customer/customerApi', () => ({ getCustomers: m.getCustomers }))
vi.mock('@/api/index', () => ({ default: { get: vi.fn() }, publicApi: { get: m.publicGet } }))

import EventBookingPanel from '@/components/booking/EventBookingPanel.vue'

const mountPanel = async () => {
  const w = mount(EventBookingPanel, {
    props: { store: 's1', date: '2099-01-01', dashboardData: { open_time: '10:00:00', close_time: '22:00:00' } },
    attachTo: document.body,
    global: { plugins: [ElementPlus], components: Icons },
  })
  await flushPromises()
  return w
}
const choose = async (w, selector, text) =>
  w.findAll(selector).find((l) => l.text().includes(text)).find('input').setValue(true)
const fillRequired = async (w) => {
  await w.find('input[placeholder="Contoh: Birthday Party, Tournament PS5"]').setValue('Ulang Tahun')
  await w.find('input[placeholder="Nama penyelenggara"]').setValue('Budi')
}
const confirm = (w) => w.findAll('button').find((b) => b.text().includes('Konfirmasi Event Booking'))

describe('EventBookingPanel', () => {
  beforeEach(() => {
    Object.values(m).forEach((fn) => fn.mockReset())
    m.publicGet.mockResolvedValue({ data: { data: [{ id: 't1', name: 'VIP' }, { id: 't2', name: 'Regular' }] } })
    m.previewEventPrice.mockResolvedValue({ data: { data: { total_price: 500000 } } })
    m.createEventBooking.mockResolvedValue({ data: { data: {} } })
  })
  afterEach(() => { document.body.innerHTML = '' })

  it('opens on the given branch and loads its room types', async () => {
    const w = await mountPanel()
    expect(m.publicGet).toHaveBeenCalledWith('/public/room-templates?store_id=s1')
    expect(w.text()).toContain('EVENT BOOKING BARU')
  })

  it('full-day: previews with the opening hours and sends today\'s payload', async () => {
    const w = await mountPanel()
    await fillRequired(w)
    await choose(w, '.el-radio-button', 'Full 1 Hari')
    await flushPromises()
    expect(m.previewEventPrice).toHaveBeenLastCalledWith({ store_id: 's1', duration_type: 'full_day',
      booking_date: '2099-01-01', start_time: '10:00:00', end_time: '22:00:00' })
    await confirm(w).trigger('click')
    await flushPromises()
    expect(m.createEventBooking).toHaveBeenCalledWith({
      store_id: 's1', event_name: 'Ulang Tahun', description: '', customer_id: null,
      customer_name: 'Budi', customer_whatsapp: '', customer_email: '', booking_date: '2099-01-01',
      start_time: '', end_time: '', notes: '', duration_type: 'full_day',
      booking_scope: 'full_venue', selected_room_template_ids: [],
    })
    expect(w.emitted('created')).toHaveLength(1)
  })

  it('per room type: sends the chosen room types', async () => {
    const w = await mountPanel()
    await fillRequired(w)
    await choose(w, '.el-radio-button', 'Full 1 Hari')
    await choose(w, '.el-radio-button', 'Per Tipe Ruangan')
    await choose(w, '.el-checkbox', 'VIP')
    await confirm(w).trigger('click')
    await flushPromises()
    expect(m.createEventBooking.mock.calls[0][0]).toMatchObject({ booking_scope: 'per_room_type', selected_room_template_ids: ['t1'] })
  })

  it('close button emits close', async () => {
    const w = await mountPanel()
    await w.find('.panel-header button').trigger('click')
    expect(w.emitted('close')).toHaveLength(1)
  })

  it('duration and scope options show icons instead of emoji, labels unchanged', async () => {
    const w = await mountPanel()
    const labels = w.findAll('.el-radio-button').map((b) => b.text().trim())
    expect(labels).toEqual(expect.arrayContaining(['Per Jam', 'Full 1 Hari', 'Full 1 Gedung', 'Per Tipe Ruangan']))
    expect(w.text()).not.toMatch(/[\u{1F300}-\u{1FAFF}]/u)
    for (const icon of [Icons.Clock, Icons.Calendar, Icons.House, Icons.List, Icons.Opportunity]) {
      expect(w.findComponent(icon).exists()).toBe(true)
    }
  })
})
