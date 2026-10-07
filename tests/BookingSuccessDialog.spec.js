import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import * as Icons from '@element-plus/icons-vue'
import BookingSuccessDialog from '@/components/booking/BookingSuccessDialog.vue'

// el-dialog opens in onMounted and renders its body one tick later.
const mountDialog = async (props = {}) => {
  const w = mount(BookingSuccessDialog, {
    props: { modelValue: true, code: 'BK-NEW', ...props },
    global: { plugins: [ElementPlus], components: Icons },
  })
  await flushPromises()
  return w
}
const btn = (w, text) => w.findAll('button').find((b) => b.text().includes(text))
const notice = (w) => w.text().match(/Konfirmasi dikirim ke customer[^.]*\./)?.[0].replace(/\s+/g, ' ')

describe('BookingSuccessDialog', () => {
  it('shows the booking code', async () => {
    expect((await mountDialog()).text()).toContain('BK-NEW')
  })

  it('says how the customer was notified', async () => {
    expect(notice(await mountDialog())).toBeUndefined()
    expect(notice(await mountDialog({ email: 'a@b.c' }))).toBe('Konfirmasi dikirim ke customer via email.')
    expect(notice(await mountDialog({ whatsapp: '08' }))).toBe('Konfirmasi dikirim ke customer & WhatsApp.')
    expect(notice(await mountDialog({ email: 'a@b.c', whatsapp: '08' }))).toBe('Konfirmasi dikirim ke customer via email & WhatsApp.')
  })

  it('buttons emit view and again', async () => {
    const w = await mountDialog()
    await btn(w, 'Lihat di Kalender').trigger('click')
    await btn(w, '+ Booking Lain').trigger('click')
    expect(w.emitted('view')).toHaveLength(1)
    expect(w.emitted('again')).toHaveLength(1)
  })

  it('closing through el-dialog itself reaches the parent v-model', async () => {
    const w = await mountDialog()
    w.findComponent({ name: 'ElDialog' }).vm.$emit('update:modelValue', false)
    expect(w.emitted('update:modelValue').at(-1)).toEqual([false])
  })
})
