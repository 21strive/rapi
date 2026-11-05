/**
 * Time on the board. A thousand tiles cannot each run their own timer, so every tile shares one
 * interval per period, and a tile only ticks while it is on screen and the tab is visible.
 */
import { inject, onBeforeUnmount, ref, watch, type InjectionKey, type Ref } from 'vue'

/** Provided by MoodTile: true while the tile is inside the viewport. */
export const tileVisibleKey: InjectionKey<Ref<boolean>> = Symbol('mood-tile-visible')

interface Channel {
  timer: number | undefined
  subs: Set<() => void>
}

const channels = new Map<number, Channel>()

function subscribe(ms: number, fn: () => void) {
  let channel = channels.get(ms)
  if (!channel) {
    channel = { timer: undefined, subs: new Set() }
    channels.set(ms, channel)
  }
  channel.subs.add(fn)
  if (channel.timer === undefined) {
    const c = channel
    c.timer = window.setInterval(() => {
      if (document.hidden) return
      c.subs.forEach((sub) => sub())
    }, ms)
  }
}

function unsubscribe(ms: number, fn: () => void) {
  const channel = channels.get(ms)
  if (!channel) return
  channel.subs.delete(fn)
  if (!channel.subs.size && channel.timer !== undefined) {
    window.clearInterval(channel.timer)
    channel.timer = undefined
  }
}

/** True while the tile this component sits in is on screen. Outside a tile it is always true. */
export function useTileVisible(): Ref<boolean> {
  return inject(tileVisibleKey, ref(true))
}

/**
 * A counter that goes up by one every `ms` while the tile is visible. Watch it, or read it in a
 * computed, to drive anything live: `const tick = useTick(1000)`.
 */
export function useTick(ms = 1000): Ref<number> {
  const tick = ref(0)
  const visible = useTileVisible()
  const fn = () => {
    tick.value++
  }
  watch(
    visible,
    (on) => {
      if (on) subscribe(ms, fn)
      else unsubscribe(ms, fn)
    },
    { immediate: true },
  )
  onBeforeUnmount(() => unsubscribe(ms, fn))
  return tick
}

/** The current time, refreshed every `ms` while the tile is visible. */
export function useNow(ms = 1000): Ref<Date> {
  const now = ref(new Date())
  const tick = useTick(ms)
  watch(tick, () => {
    now.value = new Date()
  })
  return now
}

/** The reader asked for less motion: hold animations still, keep the numbers updating. */
export function reducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
