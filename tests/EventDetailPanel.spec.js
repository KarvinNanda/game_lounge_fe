import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import * as Icons from '@element-plus/icons-vue'

const m = vi.hoisted(() => ({ cancelEventBooking: vi.fn() }))
vi.mock('@/api/booking/eventBookingApi', () => ({ cancelEventBooking: m.cancelEventBooking }))

import EventDetailPanel from '@/components/booking/EventDetailPanel.vue'

const EVENT = { id: 'e1', event_name: 'Turnamen', status: 'confirmed', booking_date: '2099-01-01',
  start_time: '18:00:00', end_time: '20:00:00', duration_hours: 2, customer_name: 'Budi', total_price: 500000 }

const mountPanel = async (event = EVENT) => {
  const w = mount(EventDetailPanel, { props: { event }, attachTo: document.body,
    global: { plugins: [ElementPlus], components: Icons } })
  await flushPromises()
  return w
}
const button = (w, text) => w.findAll('button').find((b) => b.text().includes(text))

describe('EventDetailPanel', () => {
  beforeEach(() => { m.cancelEventBooking.mockReset().mockResolvedValue({}) })
  afterEach(() => { document.body.innerHTML = '' })

  it('shows the event', async () => {
    const w = await mountPanel()
    expect(w.text()).toContain('DETAIL EVENT')
    expect(w.text()).toContain('Turnamen')
  })

  it('cancel sends the reason and emits cancelled', async () => {
    const w = await mountPanel()
    await button(w, 'Batalkan Event').trigger('click')
    await flushPromises()
    await w.find('textarea').setValue('Venue sedang direnovasi')
    await button(w, 'Konfirmasi Batalkan').trigger('click')
    await flushPromises()
    expect(m.cancelEventBooking).toHaveBeenCalledWith('e1', { reason: 'Venue sedang direnovasi' })
    expect(w.emitted('cancelled')).toHaveLength(1)
  })

  it('cancel needs a reason of at least 5 characters', async () => {
    const w = await mountPanel()
    await button(w, 'Batalkan Event').trigger('click')
    await flushPromises()
    await w.find('textarea').setValue('abc')
    await button(w, 'Konfirmasi Batalkan').trigger('click')
    await flushPromises()
    expect(m.cancelEventBooking).not.toHaveBeenCalled()
  })

  it('close button emits close', async () => {
    const w = await mountPanel()
    await w.find('.panel-header button').trigger('click')
    expect(w.emitted('close')).toHaveLength(1)
  })
})
