import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import ElementPlus, { ElPagination } from 'element-plus'
import TablePagination from '@/components/ui/TablePagination.vue'

const global = { plugins: [ElementPlus] }
const pager = (w) => w.findComponent(ElPagination)

// A real parent wired like a view's v-model:page / v-model:page-size. Render
// function, not a template string: the test build of Vue has no runtime
// compiler. The listener is kebab-case on purpose (the strictest spelling).
const Parent = defineComponent({
  setup(_, { expose }) {
    const page = ref(3)
    const size = ref(10)
    const calls = ref(0)
    expose({ page, size, calls })
    return () => h(TablePagination, {
      page: page.value,
      'onUpdate:page': (v) => { page.value = v },
      pageSize: size.value,
      'onUpdate:page-size': (v) => { size.value = v },
      total: 95,
      onChange: () => { calls.value++ },
    })
  },
})

describe('TablePagination', () => {
  it('uses page sizes 10/20/50/100 and no total in the layout', () => {
    const p = pager(mount(TablePagination, { props: { page: 1, total: 40 }, global }))
    expect(p.props('pageSizes')).toEqual([10, 20, 50, 100])
    expect(Math.max(...p.props('pageSizes'))).toBeLessThanOrEqual(100)
    expect(p.props('layout')).toBe('sizes, prev, pager, next')
  })

  it('drops the size picker when sizes is false and keeps the given page size', () => {
    const p = pager(mount(TablePagination, { props: { page: 1, pageSize: 20, total: 40, sizes: false }, global }))
    expect(p.props('layout')).toBe('prev, pager, next')
    expect(p.props('pageSize')).toBe(20)
  })

  it('page click: parent page updates, then one change', async () => {
    const w = mount(Parent, { global })
    pager(w).vm.$emit('update:current-page', 4)
    await nextTick()
    await nextTick()
    expect(w.vm.page).toBe(4)
    expect(w.vm.calls).toBe(1)
  })

  it('kebab v-model:page-size receives the new size', async () => {
    const w = mount(Parent, { global })
    pager(w).vm.$emit('update:page-size', 50)
    await nextTick()
    await nextTick()
    expect(w.vm.size).toBe(50)
  })

  it('size pick that clamps the page gives one change, not two', async () => {
    const w = mount(Parent, { global })
    const p = pager(w)
    p.vm.$emit('update:page-size', 100)
    p.vm.$emit('update:current-page', 1)
    await nextTick()
    await nextTick()
    expect(w.vm.calls).toBe(1)
    expect(w.vm.page).toBe(1)
    expect(w.vm.size).toBe(100)
  })

  it('page set by the view in code does not emit change', async () => {
    const w = mount(Parent, { global })
    w.vm.page = 1
    await nextTick()
    await nextTick()
    expect(w.vm.calls).toBe(0)
  })

  // Through real Element Plus (no hand-emitted events): the reviewer's B scenarios.
  const RealParent = (startPage, startTotal) => defineComponent({
    setup(_, { expose }) {
      const page = ref(startPage)
      const size = ref(10)
      const total = ref(startTotal)
      const calls = ref(0)
      expose({ page, size, total, calls })
      return () => h(TablePagination, {
        page: page.value, 'onUpdate:page': (v) => { page.value = v },
        pageSize: size.value, 'onUpdate:page-size': (v) => { size.value = v },
        total: total.value, onChange: () => { calls.value++ },
      })
    },
  })

  it('real size picker: size 100 on page 9 of 95 gives one change, at page 1', async () => {
    const w = mount(RealParent(9, 95), { global })
    // EP's sizes component listens to the select's `change` (what a real pick fires).
    pager(w).findComponent({ name: 'ElSelect' }).vm.$emit('change', 100)
    await flushPromises()
    expect(w.vm.calls).toBe(1)
    expect([w.vm.page, w.vm.size]).toEqual([1, 100])
  })

  it('total shrinking below the current page clamps once and emits one change', async () => {
    const w = mount(RealParent(5, 95), { global })
    w.vm.total = 12
    await flushPromises()
    expect(w.vm.calls).toBe(1)
    expect(w.vm.page).toBe(2)
  })
})
