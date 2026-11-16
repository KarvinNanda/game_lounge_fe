import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it, expect } from 'vitest'

const filesUnder = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f)
    return statSync(p).isDirectory() ? filesUnder(p) : [p]
  })
const sources = [...filesUnder('src/views'), ...filesUnder('src/components')]
  .filter((p) => p.endsWith('.vue') || p.endsWith('.js'))

// A local copy of the "Rp ..." formatter. Copies drifted from src/utils/format.js
// and showed float averages with decimals (Rp 146.888,889) on the dashboard.
const LOCAL_FORMAT_RP = /const\s+formatRp\s*=\s*\([^)]*\)\s*=>\s*`Rp /

describe('formatRp adoption', () => {
  it('no view or component defines its own Rp formatter; they import @/utils/format', () => {
    const offenders = sources.filter((p) => LOCAL_FORMAT_RP.test(readFileSync(p, 'utf8')))
    expect(offenders).toEqual([])
  })

  it('the guard pattern catches the old copy and spares the import', () => {
    expect(LOCAL_FORMAT_RP.test("const formatRp        = (v) => `Rp ${(v || 0).toLocaleString('id-ID')}`")).toBe(true)
    expect(LOCAL_FORMAT_RP.test("import { formatRp } from '@/utils/format'")).toBe(false)
  })
})
