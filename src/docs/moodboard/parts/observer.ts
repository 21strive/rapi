/**
 * Two shared IntersectionObservers for a thousand tiles: one mounts a tile shortly before it
 * scrolls into view (and keeps it, so what a reader did to it stays), the other tracks whether it
 * is on screen right now, which pauses live tiles that are out of sight.
 */
type Callback = (inside: boolean) => void

function shared(rootMargin: string) {
  const callbacks = new WeakMap<Element, Callback>()
  let io: IntersectionObserver | null = null
  const get = () =>
    (io ??= new IntersectionObserver(
      (records) => {
        for (const record of records) callbacks.get(record.target)?.(record.isIntersecting)
      },
      { rootMargin },
    ))
  return {
    observe(el: Element, cb: Callback) {
      callbacks.set(el, cb)
      get().observe(el)
    },
    unobserve(el: Element) {
      callbacks.delete(el)
      io?.unobserve(el)
    },
  }
}

/** Mount a little ahead of the scroll: one and a half screens. */
export const nearViewport = shared('150% 0px 150% 0px')
/** On screen now. */
export const inViewport = shared('0px')
