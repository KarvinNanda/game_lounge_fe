import { describe, it, expect, vi } from 'vitest'
import { fetchAllPages } from '@/utils/fetchAllPages'

// Fake list endpoint: `total` rows, honours page/per_page like the API.
const endpoint = (total, { withMeta = true } = {}) =>
  vi.fn(async ({ page, per_page }) => {
    const start = (page - 1) * per_page
    const data = Array.from({ length: Math.max(0, Math.min(per_page, total - start)) }, (_, i) => ({ id: start + i }))
    return { data: { data, ...(withMeta && { meta: { total } }) } }
  })

describe('fetchAllPages', () => {
  it('asks for 100 rows per page (the API cap)', async () => {
    const fetchPage = endpoint(5)
    await fetchAllPages(fetchPage)
    expect(fetchPage).toHaveBeenCalledWith({ page: 1, per_page: 100 })
  })

  it('returns a single short page with one request', async () => {
    const fetchPage = endpoint(42)
    expect(await fetchAllPages(fetchPage)).toHaveLength(42)
    expect(fetchPage).toHaveBeenCalledTimes(1)
  })

  it('collects every page until meta.total is reached', async () => {
    const fetchPage = endpoint(250)
    const rows = await fetchAllPages(fetchPage)
    expect(rows).toHaveLength(250)
    expect(rows.at(-1).id).toBe(249)
    expect(fetchPage).toHaveBeenCalledTimes(3)
  })

  it('stops on a short page when the response has no meta', async () => {
    const fetchPage = endpoint(230, { withMeta: false })
    expect(await fetchAllPages(fetchPage)).toHaveLength(230)
    expect(fetchPage).toHaveBeenCalledTimes(3)
  })

  it('returns an empty list for an empty endpoint', async () => {
    expect(await fetchAllPages(endpoint(0))).toEqual([])
  })

  it('throws instead of looping forever or silently truncating', async () => {
    const endless = vi.fn(async () => ({ data: { data: Array(100).fill({}) } }))
    await expect(fetchAllPages(endless)).rejects.toThrow(/too many/i)
    expect(endless).toHaveBeenCalledTimes(100)
  })
})
