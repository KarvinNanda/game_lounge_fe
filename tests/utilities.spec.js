import { readFileSync } from 'node:fs'
import { describe, it, expect } from 'vitest'

// Spec §1: the closed utility list. Adding a class means changing the spec first.
const CLOSED = ['u-w-full', 'u-flex-1', 'u-flex', 'u-justify-between', 'u-gap-1', 'u-gap-2', 'u-gap-3',
  'u-text-xs', 'u-text-sm', 'u-fw-semibold', 'u-fw-bold',
  'u-text-secondary', 'u-text-muted', 'u-text-action', 'u-text-success', 'u-text-danger',
  'u-mt-1', 'u-mt-2', 'u-mt-3', 'u-mt-4', 'u-mb-1', 'u-mb-2', 'u-mb-3', 'u-mb-4']

const css = () => readFileSync('src/assets/utilities.css', 'utf8')

describe('utilities.css', () => {
  it('defines exactly the closed list', () => {
    const defined = [...css().matchAll(/^\.(u-[a-z0-9-]+)\s*\{/gm)].map((m) => m[1])
    expect(defined.sort()).toEqual([...CLOSED].sort())
  })
  it('uses tokens, never raw values for colour or spacing', () => {
    expect(css()).not.toMatch(/#[0-9a-fA-F]{3,6}\b/)
    expect(css()).not.toMatch(/(margin|gap)[^;]*\d+px/)
  })
  it('is loaded after theme.css', () => {
    const main = readFileSync('src/main.js', 'utf8')
    expect(main.indexOf("'./assets/utilities.css'")).toBeGreaterThan(main.indexOf("'./assets/theme.css'"))
  })
  it('defines the new tokens', () => {
    const tokens = readFileSync('src/assets/tokens.css', 'utf8')
    expect(tokens).toMatch(/--text-on-action:\s*#FFFFFF/)
    expect(tokens).toMatch(/--brand-whatsapp:\s*#25D366/)
  })
})
