import { readFileSync } from 'node:fs'
import { describe, it, expect } from 'vitest'

const css = readFileSync('src/assets/tokens.css', 'utf8')

// Resolve a token to its final value, following var(--x) references.
const resolve = (value, seen = new Set()) => {
  if (value.startsWith('#')) return value
  const name = value.match(/^var\((--[\w-]+)\)$/)?.[1] ?? value
  if (seen.has(name)) throw new Error(`cycle at ${name}`)
  seen.add(name)
  const m = css.match(new RegExp(`(?<![\\w-])${name}:\\s*([^;]+);`))
  if (!m) throw new Error(`token ${name} not found`)
  return resolve(m[1].trim(), seen)
}

const luminance = (hex) => {
  const [r, g, b] = hex.slice(1).match(/\w\w/g).map((x) => {
    const v = parseInt(x, 16) / 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const contrast = (a, b) => {
  const [hi, lo] = [luminance(resolve(a)), luminance(resolve(b))].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

describe('design tokens', () => {
  it.each([
    ['--text-primary', '--surface'],
    ['--text-secondary', '--surface'],
    ['--text-muted', '--surface'],
    ['--text-muted', '--surface-page'],
    ['--text-muted', '--surface-muted'],
    ['--action', '--surface'],
    ['--violet', '--surface'],
    ['#FFFFFF', '--el-color-primary'],
    ['#FFFFFF', '--el-color-success'],
    ['#FFFFFF', '--el-color-warning'],
    ['#FFFFFF', '--el-color-danger'],
    ['--sidebar-text', '--sidebar-bg'],
    ['--sidebar-label', '--sidebar-bg'],
  ])('%s on %s passes WCAG AA for text (4.5:1)', (fg, bg) => {
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5)
  })

  it.each([
    ['--border-strong', '--surface'],
    ['--focus-ring', '--surface'],
  ])('%s on %s passes WCAG AA for UI parts (3:1)', (fg, bg) => {
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(3)
  })

  // Element Plus "light" components (tag, plain button, alert, message)
  // draw the base colour as text on its light-9 background.
  it.each(['primary', 'success', 'warning', 'danger', 'info'])(
    '%s text on its light-9 background passes 4.5:1',
    (type) => {
      expect(contrast(`--el-color-${type}`, `--el-color-${type}-light-9`)).toBeGreaterThanOrEqual(4.5)
    },
  )

  it.each(['', '-light-3', '-light-5', '-light-7', '-light-8', '-light-9', '-dark-2', '-rgb'])(
    'maps --el-color-error%s to the danger scale',
    (suffix) => {
      const m = css.match(new RegExp(`--el-color-error${suffix}:\\s*([^;]+);`))
      expect(m?.[1].trim()).toBe(`var(--el-color-danger${suffix})`)
    },
  )

  it('defines the primary colour once (Element Plus reads the brand token)', () => {
    expect(css).toMatch(/--el-color-primary:\s*var\(--blue-600\);/)
    expect(css).toMatch(/--el-color-primary-dark-2:\s*var\(--blue-700\);/)
  })

  it('keeps the legacy names views still use', () => {
    for (const name of ['--bg-main', '--bg-card', '--bg-card-hover', '--border-color', '--color-primary', '--text-muted']) {
      expect(() => resolve(name)).not.toThrow()
    }
  })
})
