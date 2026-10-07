import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('@/api/store/storeApi', () => ({ getStores: vi.fn() }))

import { getStores } from '@/api/store/storeApi'
import { useAuthStore } from '@/stores/authStore'
import { useAllowedStores } from '@/composables/useAllowedStores'

const STORES = [{ id: 'a', name: 'Alpha' }, { id: 'b', name: 'Beta' }, { id: 'c', name: 'Gamma' }]

const setup = (store_access, options) => {
  const pinia = createPinia()
  setActivePinia(pinia)
  useAuthStore().staff = { username: 'x', ...(store_access && { store_access }) }
  let api
  mount(defineComponent({ setup() { api = useAllowedStores(options); return () => h('div') } }), { global: { plugins: [pinia] } })
  return api
}

describe('useAllowedStores', () => {
  beforeEach(() => {
    getStores.mockReset()
    getStores.mockResolvedValue({ data: { data: STORES, meta: { total: 3 } } })
  })

  it('all-branches staff on an "all branches" view: every branch, "" pre-selected', async () => {
    const api = setup({ all_stores: true, store_ids: [] }, { allowAll: true })
    expect(await api.loadStores()).toBe('')
    expect(api.stores.value).toEqual(STORES)
    expect(api.canPickAll.value).toBe(true)
  })

  it('all-branches staff on a one-branch view: first branch pre-selected, no "all" option', async () => {
    const api = setup({ all_stores: true, store_ids: [] }, { allowAll: false })
    expect(await api.loadStores()).toBe('a')
    expect(api.canPickAll.value).toBe(false)
  })

  it('limited staff: only their branches, first one pre-selected, no "all" option', async () => {
    const api = setup({ all_stores: false, store_ids: ['c', 'b'] }, { allowAll: true })
    expect(await api.loadStores()).toBe('b')
    expect(api.stores.value.map((s) => s.id)).toEqual(['b', 'c'])
    expect(api.canPickAll.value).toBe(false)
  })

  it('no store_access: no request, no branches, noAccess flag set', async () => {
    const api = setup(null, { allowAll: true })
    expect(await api.loadStores()).toBe('')
    expect(getStores).not.toHaveBeenCalled()
    expect(api.stores.value).toEqual([])
    expect(api.noAccess.value).toBe(true)
  })

  it('limited staff whose branches are all inactive: noAccess, so views send nothing', async () => {
    const api = setup({ all_stores: false, store_ids: ['z'] }, { allowAll: true })
    expect(await api.loadStores()).toBe('')
    expect(api.stores.value).toEqual([])
    expect(api.noAccess.value).toBe(true)
  })

  it('noAccess stays false while branches are still loading', () => {
    const api = setup({ all_stores: false, store_ids: ['z'] }, { allowAll: true })
    expect(api.noAccess.value).toBe(false)
  })

  it('asks for active branches within the per_page cap', async () => {
    await setup({ all_stores: true, store_ids: [] }, { allowAll: true }).loadStores()
    expect(getStores).toHaveBeenCalledWith({ status: 'active', page: 1, per_page: 100 })
  })
})
