import { describe, it, expect } from 'vitest'
import { readStoreAccess, allowedStores, defaultStoreId } from '@/utils/storeAccess'

const STORES = [{ id: 'a', name: 'Alpha' }, { id: 'b', name: 'Beta' }, { id: 'c', name: 'Gamma' }]
const staffWith = (store_access) => ({ username: 'x', store_access })

describe('readStoreAccess', () => {
  it('reads all-branches access', () => {
    expect(readStoreAccess(staffWith({ all_stores: true, store_ids: [] }))).toEqual({ allStores: true, storeIds: [] })
  })

  it('reads a limited branch list', () => {
    expect(readStoreAccess(staffWith({ all_stores: false, store_ids: ['b', 'c'] }))).toEqual({ allStores: false, storeIds: ['b', 'c'] })
  })

  it('fails closed when /me has no store_access (old backend)', () => {
    expect(readStoreAccess({ username: 'x', is_all_stores: true })).toEqual({ allStores: false, storeIds: [] })
    expect(readStoreAccess(null)).toEqual({ allStores: false, storeIds: [] })
  })

  it('only trusts a real boolean true for all_stores', () => {
    expect(readStoreAccess(staffWith({ all_stores: 'true', store_ids: [] })).allStores).toBe(false)
  })
})

describe('allowedStores', () => {
  it('keeps every branch for all-branches staff', () => {
    expect(allowedStores(STORES, { allStores: true, storeIds: [] })).toEqual(STORES)
  })

  it('keeps only the branches in store_ids', () => {
    expect(allowedStores(STORES, { allStores: false, storeIds: ['c', 'a'] }).map((s) => s.id)).toEqual(['a', 'c'])
  })

  it('keeps nothing when access is missing', () => {
    expect(allowedStores(STORES, { allStores: false, storeIds: [] })).toEqual([])
  })
})

describe('defaultStoreId', () => {
  const all = { allStores: true, storeIds: [] }
  const two = { allStores: false, storeIds: ['b', 'c'] }

  it('is "" (all branches) for all-branches staff on views that support it', () => {
    expect(defaultStoreId(STORES, all, { allowAll: true })).toBe('')
  })

  it('is the first branch for all-branches staff on views that need one branch', () => {
    expect(defaultStoreId(STORES, all, { allowAll: false })).toBe('a')
  })

  it('is the first allowed branch for limited staff, even where "all" is supported', () => {
    expect(defaultStoreId(STORES, two, { allowAll: true })).toBe('b')
  })

  it('is "" when the staff has no branch at all', () => {
    expect(defaultStoreId(STORES, { allStores: false, storeIds: [] }, { allowAll: false })).toBe('')
  })
})
