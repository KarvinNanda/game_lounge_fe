import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { useVisiblePolling } from '@/composables/useVisiblePolling'

let visibility = 'visible'
Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => visibility })
const setVisibility = (v) => {
  visibility = v
  document.dispatchEvent(new Event('visibilitychange'))
}

const mountWith = (fn, ms) =>
  mount(defineComponent({ setup() { useVisiblePolling(fn, ms); return () => h('div') } }))

describe('useVisiblePolling', () => {
  beforeEach(() => { vi.useFakeTimers(); visibility = 'visible' })
  afterEach(() => vi.useRealTimers())

  it('runs on mount and then every interval while visible', () => {
    const fn = vi.fn()
    mountWith(fn, 1000)
    expect(fn).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(2000)
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it('pauses while hidden and runs once when visible again', () => {
    const fn = vi.fn()
    mountWith(fn, 1000)
    setVisibility('hidden')
    vi.advanceTimersByTime(5000)
    expect(fn).toHaveBeenCalledTimes(1)
    setVisibility('visible')
    expect(fn).toHaveBeenCalledTimes(2)
    vi.advanceTimersByTime(1000)
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it('does not start when mounted in a hidden tab', () => {
    visibility = 'hidden'
    const fn = vi.fn()
    mountWith(fn, 1000)
    vi.advanceTimersByTime(3000)
    expect(fn).not.toHaveBeenCalled()
    setVisibility('visible')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('does not double-start on repeated visible events', () => {
    const fn = vi.fn()
    mountWith(fn, 1000)
    setVisibility('visible')
    setVisibility('visible')
    vi.advanceTimersByTime(1000)
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('stops completely on unmount', () => {
    const fn = vi.fn()
    const w = mountWith(fn, 1000)
    w.unmount()
    vi.advanceTimersByTime(5000)
    setVisibility('hidden')
    setVisibility('visible')
    expect(fn).toHaveBeenCalledTimes(1)
  })
})
