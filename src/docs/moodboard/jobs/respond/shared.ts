/**
 * Helpers shared by the Respond specimens. Clocks run on the board's shared tick, so they pause
 * while a tile is off screen and a reader always meets a fresh countdown. Stamps are what a person
 * reads after acting: "14:03 WIB".
 */
import { nextTick, ref, watch } from 'vue'
import { pad, timeZ, useTick } from '../../kit'

/** Always hours, minutes and seconds: 761 → "00:12:41". */
export function hms(total: number): string {
  const s = Math.max(0, Math.floor(Math.abs(total)))
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`
}

/** Minutes and seconds: 252 → "04:12". */
export function mmss(total: number): string {
  const s = Math.max(0, Math.floor(Math.abs(total)))
  return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`
}

/** A duration in words a person reads at a glance: "40 s", "12 min", "2 h 05 min". */
export function span(total: number): string {
  const s = Math.max(0, Math.floor(total))
  if (s < 60) return `${s} s`
  if (s < 3600) return `${Math.floor(s / 60)} min`
  return `${Math.floor(s / 3600)} h ${pad(Math.floor((s % 3600) / 60))} min`
}

/** A rough duration for forecasts: "40 min", "10 h", "2 days". */
export function roughly(total: number): string {
  const s = Math.max(0, total)
  if (s < 90 * 60) return `${Math.max(1, Math.round(s / 60))} min`
  if (s < 36 * 3600) return `${Math.round(s / 3600)} h`
  return `${Math.round(s / 86400)} days`
}

/** The time now in Jakarta: "14:03 WIB", or with seconds "14:03:11 WIB". */
export function stamp(seconds = false): string {
  return timeZ(new Date(), 'WIB', seconds)
}

/** The time in `minutes` from now: "14:47 WIB". */
export function later(minutes: number): string {
  return timeZ(new Date(Date.now() + minutes * 60_000), 'WIB')
}

/**
 * A countdown in whole seconds. `auto` starts it at once (an alarm's own clock); otherwise it
 * waits for `start()` (a clock a person started, like a silence or an undo window).
 */
export function useCountdown(total: number, options: { auto?: boolean; onDone?: () => void } = {}) {
  const left = ref(total)
  const running = ref(options.auto ?? false)
  const tick = useTick(1000)
  watch(tick, () => {
    if (!running.value) return
    left.value = Math.max(0, left.value - 1)
    if (left.value === 0) {
      running.value = false
      options.onDone?.()
    }
  })
  return {
    left,
    running,
    start(seconds = total) {
      left.value = seconds
      running.value = true
    },
    stop() {
      running.value = false
    },
  }
}

/** Seconds since something started, counting while `running` is on. */
export function useElapsed(start = 0) {
  const value = ref(start)
  const running = ref(true)
  const tick = useTick(1000)
  watch(tick, () => {
    if (running.value) value.value++
  })
  return {
    value,
    running,
    reset(to = 0) {
      value.value = to
      running.value = true
    },
  }
}

/**
 * Buttons swap when a person acts (Acknowledge becomes Undo). If focus was inside the tile, put
 * it on the control that took the place of the one that vanished, so a keyboard user is never
 * dropped back to the top of the page. Never moves focus on its own: only after a person acted
 * inside the tile, and only while focus is still theirs to lose.
 */
export function useFocusKeeper() {
  const root = ref<HTMLElement | null>(null)
  /** Bind with `:ref="bind"` on the specimen's root. */
  function bind(el: unknown) {
    root.value = el instanceof HTMLElement ? el : null
  }

  /* Two ticks: the first lets any state change made after the call queue its render, the second
     runs once that render is on screen, whichever order the caller wrote them in. */
  function after(fn: () => void) {
    nextTick(() => nextTick(fn))
  }

  function place(selector: string, force: boolean) {
    if (!root.value) return
    const active = document.activeElement
    const lost = !active || active === document.body
    // Focus that went somewhere else on the page stays there; only lost focus, or (with force)
    // focus on a control that is leaving this tile, is put back.
    if (!lost && !(force && root.value.contains(active))) return
    root.value.querySelector<HTMLElement>(selector)?.focus()
  }

  /**
   * Call when a person acts. `force` moves focus even if the old control is still in the page,
   * as a row that is fading out of a list is.
   */
  function keep(selector: string, force = false) {
    const had = !!root.value && root.value.contains(document.activeElement)
    if (had) after(() => place(selector, force))
  }

  /**
   * For work that takes a moment (a retry): note now whether focus is inside, and hand back a
   * function that restores it to `selector` when the work is done.
   */
  function hold() {
    const had = !!root.value && root.value.contains(document.activeElement)
    return (selector: string) => {
      if (had) after(() => place(selector, false))
    }
  }

  return { bind, keep, hold }
}
