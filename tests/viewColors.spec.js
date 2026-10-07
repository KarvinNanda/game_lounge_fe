import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it, expect } from 'vitest'

const filesUnder = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f)
    return statSync(p).isDirectory() ? filesUnder(p) : [p]
  })

// Text colours from the old dark theme: on the light theme they fall far
// below 4.5:1 (e.g. #fbbf24 on white is 1.7:1).
const DARK_THEME_TEXT = /color:\s*#(fbbf24|93c5fd|a78bfa|34d399|fcd34d|86efcd|fca5a5|7debff|c9d4e2)\b/gi

describe('view colours', () => {
  it('no text uses old dark-theme colours', () => {
    const offenders = filesUnder('src')
      .filter((p) => p.endsWith('.vue'))
      .flatMap((p) => [...readFileSync(p, 'utf8').matchAll(DARK_THEME_TEXT)].map((m) => `${p}: ${m[0]}`))
    expect(offenders).toEqual([])
  })
})
