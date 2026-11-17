import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import * as Icons from '@element-plus/icons-vue'

vi.mock('vue-router', () => ({ useRoute: () => ({ params: {} }), useRouter: () => ({ push: vi.fn() }) }))
vi.mock('@/utils/fetchAllPages', () => ({ fetchAllPages: vi.fn().mockResolvedValue([]) }))
vi.mock('@/api/room_template/roomTemplateApi', () => ({
  createRoomTemplate: vi.fn(), updateRoomTemplate: vi.fn(), getRoomTemplateById: vi.fn(),
}))
vi.mock('@/api/facility/facilityApi', () => ({ getFacilities: vi.fn() }))

import RoomTemplateFormView from '@/views/room_template/RoomTemplateFormView.vue'

const realWidth = window.innerWidth
afterEach(() => { window.innerWidth = realWidth })

const positions = async (width) => {
  window.innerWidth = width
  const w = mount(RoomTemplateFormView, { global: { plugins: [ElementPlus], components: Icons } })
  await flushPromises()
  return w.findAllComponents({ name: 'ElInputNumber' }).map((n) => n.props('controlsPosition'))
}

describe('room type capacity steppers', () => {
  it('keep the compact right-side arrows on desktop', async () => {
    expect(await positions(1280)).toEqual(['right', 'right'])
  })
  it('use the larger - and + buttons on phones (right arrows are about 15px tall)', async () => {
    expect(await positions(375)).toEqual(['', ''])
  })
})
