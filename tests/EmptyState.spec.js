import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import EmptyState from '@/components/ui/EmptyState.vue'

describe('EmptyState', () => {
  it('renders title, description, icon and action', () => {
    const w = mount(EmptyState, {
      props: { title: 'Tidak ada pesanan FnB', description: 'Coba ubah filter.' },
      slots: { icon: '<i class="ic" />', action: '<button>Tambah</button>' },
    })
    expect(w.find('.ui-empty__title').text()).toBe('Tidak ada pesanan FnB')
    expect(w.find('.ui-empty__desc').text()).toBe('Coba ubah filter.')
    expect(w.find('.ui-empty__icon').attributes('aria-hidden')).toBe('true')
    expect(w.find('.ui-empty__action button').exists()).toBe(true)
  })

  it('renders only the title when nothing else is given', () => {
    const w = mount(EmptyState, { props: { title: 'Kosong' } })
    expect(w.find('.ui-empty__desc').exists()).toBe(false)
    expect(w.find('.ui-empty__icon').exists()).toBe(false)
    expect(w.find('.ui-empty__action').exists()).toBe(false)
  })
})
