/**
 * Focus never falls to the page when a control is replaced. When `source` changes and the focus
 * was inside `root`, it moves to the element marked `data-focus` in the new state, or to `root`.
 */
import { type Ref, type WatchSource, nextTick, watch } from 'vue'

export function useKeepFocus(root: Ref<HTMLElement | null>, source: WatchSource) {
  let had = false
  watch(source, () => (had = !!root.value?.contains(document.activeElement)), { flush: 'pre' })
  watch(
    source,
    () => {
      if (!had) return
      had = false
      nextTick(() => {
        const el = root.value
        if (!el || el.contains(document.activeElement)) return
        ;(el.querySelector<HTMLElement>('[data-focus]') ?? el).focus({ preventScroll: true })
      })
    },
    { flush: 'post' },
  )
}
