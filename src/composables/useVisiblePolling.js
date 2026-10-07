import { onMounted, onUnmounted } from 'vue'

/**
 * Run `fn` now and every `intervalMs`, but only while the tab is visible.
 * A hidden tab makes no requests; when it becomes visible again, `fn`
 * runs once right away so the data is fresh.
 */
export function useVisiblePolling(fn, intervalMs) {
  let timer = null

  const start = () => {
    if (timer) return
    fn()
    timer = setInterval(fn, intervalMs)
  }
  const stop = () => {
    clearInterval(timer)
    timer = null
  }
  const onVisibilityChange = () => {
    if (document.visibilityState === 'hidden') stop()
    else start()
  }

  onMounted(() => {
    document.addEventListener('visibilitychange', onVisibilityChange)
    if (document.visibilityState !== 'hidden') start()
  })
  onUnmounted(() => {
    document.removeEventListener('visibilitychange', onVisibilityChange)
    stop()
  })
}
