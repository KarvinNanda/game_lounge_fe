import { readFileSync } from 'node:fs'
import { describe, it, expect } from 'vitest'

const conf = readFileSync('nginx.conf', 'utf8')
const csp = conf.match(/Content-Security-Policy "([^"]+)"/)[1]
const directive = (name) => csp.split(';').map((d) => d.trim()).find((d) => d.startsWith(`${name} `))

describe('production CSP', () => {
  it('only lets the browser call our own API domain', () => {
    expect(directive('connect-src')).toBe("connect-src 'self' https://*.quantumgamingcenter.com")
  })

  it('never allows a local development backend in production', () => {
    expect(csp).not.toMatch(/localhost|127\.0\.0\.1/)
  })
})
