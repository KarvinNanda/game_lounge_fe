// The API caps per_page at 100, so one large request silently returns only
// the first 100 rows. Use this when every row is needed (exports, dropdowns).
const PER_PAGE = 100
const MAX_PAGES = 100 // 10,000 rows; beyond that, fail loudly instead of truncating

/**
 * Fetch every page of a paginated list endpoint.
 * @param {(params: { page: number, per_page: number }) => Promise<{ data: { data: any[], meta?: { total?: number } } }>} fetchPage
 * @returns {Promise<any[]>}
 */
export const fetchAllPages = async (fetchPage) => {
  const rows = []
  for (let page = 1; page <= MAX_PAGES; page++) {
    const { data } = await fetchPage({ page, per_page: PER_PAGE })
    const batch = Array.isArray(data?.data) ? data.data : []
    rows.push(...batch)

    const total = data?.meta?.total
    const reachedTotal = typeof total === 'number' && rows.length >= total
    if (batch.length < PER_PAGE || reachedTotal) return rows
  }
  throw new Error(`Too many rows: stopped after ${MAX_PAGES} pages`)
}
