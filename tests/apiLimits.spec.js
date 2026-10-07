import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it, expect } from 'vitest'

const filesUnder = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f)
    return statSync(p).isDirectory() ? filesUnder(p) : [p]
  })

describe('API limits', () => {
  it('never asks for more than 100 rows per page (the API caps it silently)', () => {
    const offenders = filesUnder('src')
      .filter((p) => /\.(vue|js)$/.test(p))
      .flatMap((p) =>
        [...readFileSync(p, 'utf8').matchAll(/per_page\s*[:=]\s*(\d+)/g)]
          .filter((m) => Number(m[1]) > 100)
          .map((m) => `${p}: ${m[0]}`),
      )
    expect(offenders).toEqual([])
  })
})
