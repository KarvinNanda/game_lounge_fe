import { readFileSync } from 'node:fs'
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import FilterBar from '@/components/ui/FilterBar.vue'

describe('FilterBar', () => {
  it('renders fields and actions in their own groups', () => {
    const w = mount(FilterBar, { slots: { default: '<input class="f" />', actions: '<button>Reset</button>' } })
    expect(w.find('.ui-filter-bar__fields .f').exists()).toBe(true)
    expect(w.find('.ui-filter-bar__actions button').text()).toBe('Reset')
  })

  it('omits the actions group without the slot', () => {
    expect(mount(FilterBar, { slots: { default: '<input />' } }).find('.ui-filter-bar__actions').exists()).toBe(false)
  })

  // jsdom has no layout: pin the rule that beats the views' inline widths on phones.
  it('stretches inputs, selects and date pickers to full width under 640px', () => {
    const css = readFileSync('src/components/ui/FilterBar.vue', 'utf8')
    const mobile = css.slice(css.indexOf('@media (max-width: 639px)'))
    expect(mobile).toMatch(/:slotted\(\.el-input\)[\s\S]*width: 100% !important/)
    // Date pickers render no scoped root, so :slotted never reaches them.
    expect(mobile).toMatch(/\.ui-filter-bar__fields :deep\(\.el-date-editor\)\s*\{\s*width: 100% !important/)
  })
})
