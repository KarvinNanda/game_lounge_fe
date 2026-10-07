import { readFileSync } from 'node:fs'
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PageHeader from '@/components/ui/PageHeader.vue'

describe('PageHeader', () => {
  it('renders breadcrumb, title as h1 and description', () => {
    const w = mount(PageHeader, { props: { title: 'Staff', breadcrumb: 'Settings → Staff', description: 'Kelola akun staff.' } })
    expect(w.find('h1').text()).toBe('Staff')
    expect(w.find('.ui-page-header__crumb').text()).toBe('Settings → Staff')
    expect(w.find('.ui-page-header__desc').text()).toBe('Kelola akun staff.')
  })

  it('puts the full description in the title attribute (it is cut to one line)', () => {
    const long = 'Banner slider yang tampil di halaman home customer. Drag untuk mengubah urutan, atau gunakan tombol panah.'
    expect(mount(PageHeader, { props: { title: 'T', description: long } }).find('.ui-page-header__desc').attributes('title')).toBe(long)
  })

  it('omits breadcrumb, description and actions when not given', () => {
    const w = mount(PageHeader, { props: { title: 'Play Credits' } })
    expect(w.find('.ui-page-header__crumb').exists()).toBe(false)
    expect(w.find('.ui-page-header__desc').exists()).toBe(false)
    expect(w.find('.ui-page-header__actions').exists()).toBe(false)
  })

  it('renders the actions slot', () => {
    const w = mount(PageHeader, { props: { title: 'T' }, slots: { actions: '<button>Tambah</button>' } })
    expect(w.find('.ui-page-header__actions button').text()).toBe('Tambah')
  })

  // jsdom has no layout: pin the rule. Two lines keep Banner/Pricing instructions readable on phones.
  it('clamps the description to two lines instead of one', () => {
    const css = readFileSync('src/components/ui/PageHeader.vue', 'utf8')
    const rule = css.match(/\.ui-page-header__desc \{[^}]*\}/)[0]
    expect(rule).toMatch(/-webkit-line-clamp: 2/)
    expect(rule).not.toMatch(/nowrap/)
  })
})
