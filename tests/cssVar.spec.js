import { describe, it, expect } from 'vitest'
import { cssVar } from '@/utils/cssVar'

describe('cssVar', () => {
  it('reads a token from :root, trimmed', () => {
    document.documentElement.style.setProperty('--test-token', '  #123456 ')
    expect(cssVar('--test-token')).toBe('#123456')
  })

  it('returns an empty string for an unknown token', () => {
    expect(cssVar('--does-not-exist')).toBe('')
  })
})
