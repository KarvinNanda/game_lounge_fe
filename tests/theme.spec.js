import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it, expect } from 'vitest'

const theme = readFileSync('src/assets/theme.css', 'utf8')

const filesUnder = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f)
    return statSync(p).isDirectory() ? filesUnder(p) : [p]
  })

describe('theme.css', () => {
  it('uses fewer than 20 !important', () => {
    expect((theme.match(/!important/g) || []).length).toBeLessThan(20)
  })

  it('turns motion off for reduced-motion users', () => {
    expect(theme).toContain('@media (prefers-reduced-motion: reduce)')
  })

  it('gives Element Plus buttons the 3:1 focus ring colour', () => {
    expect(theme).toMatch(/\.el-button\s*\{[^}]*--el-button-outline-color:\s*var\(--focus-ring\)/)
  })

  it('does not draw a second focus ring inside filterable selects', () => {
    expect(theme).toMatch(/\.el-select__input:focus-visible\s*\{\s*outline:\s*none;?\s*\}/)
  })

  it('keeps loading spinners turning under reduced motion (a frozen spinner looks broken)', () => {
    const reduced = theme.slice(theme.indexOf('@media (prefers-reduced-motion: reduce)'))
    expect(reduced).toMatch(/\.is-loading[^{]*\{[^}]*animation-iteration-count:\s*infinite/)
  })

  it('sizes dialogs from their own top margin so they never overflow the viewport', () => {
    expect(theme).toMatch(/max-height:\s*calc\(100dvh - var\(--el-dialog-margin-top/)
  })

  it('compacts only default-size tables, so size="small" and "large" still work', () => {
    expect(theme).toContain('.el-table--default .el-table__cell')
    expect(theme).not.toMatch(/\.el-table \.el-table__cell\s*\{/)
  })

  it('never uses transition: all', () => {
    expect(theme).not.toMatch(/transition:\s*all/)
  })

  it('has no light-mode leftovers anywhere in src or index.html', () => {
    const offenders = [...filesUnder('src'), 'index.html']
      .filter((p) => /\.(vue|js|css|html)$/.test(p))
      .filter((p) => readFileSync(p, 'utf8').includes('light-mode'))
    expect(offenders).toEqual([])
  })
})
