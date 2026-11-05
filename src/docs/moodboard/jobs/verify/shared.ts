/**
 * Helpers shared by the Verify chapter: copying a reference, short feedback flags, countdowns that
 * run only while the tile is on screen, short step sequences a person starts, and arrow-key
 * movement for the custom lists. Every timer here is started by a press and cleared on unmount.
 */
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import type { StatusTone } from '@/design-system'
import { timeZ, useTick, type Zone } from '../../kit'

/** Copy text to the clipboard. Resolves true when it worked; the tile shows feedback either way. */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    /* fall through to the old way */
  }
  try {
    const area = document.createElement('textarea')
    area.value = text
    area.setAttribute('readonly', '')
    area.style.position = 'fixed'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.select()
    const ok = document.execCommand('copy')
    area.remove()
    return ok
  } catch {
    return false
  }
}

/** A flag that turns itself off again: "Copied" for a moment after a press. */
export function useFlash(ms = 1600) {
  const on = ref(false)
  let timer: number | undefined
  function flash() {
    on.value = true
    window.clearTimeout(timer)
    timer = window.setTimeout(() => (on.value = false), ms)
  }
  onBeforeUnmount(() => window.clearTimeout(timer))
  return { on, flash }
}

/**
 * Seconds counting down on the board's shared clock, so it only runs while the tile is on screen.
 * `start()` (re)arms it; `onEnd` fires once when it reaches zero.
 */
export function useCountdown(seconds: number, onEnd?: () => void) {
  const left = ref(seconds)
  const running = ref(false)
  const tick = useTick(1000)
  watch(tick, () => {
    if (!running.value) return
    left.value = Math.max(0, left.value - 1)
    if (left.value === 0) {
      running.value = false
      onEnd?.()
    }
  })
  function start(from = seconds) {
    left.value = from
    running.value = from > 0
  }
  function stop() {
    running.value = false
  }
  return { left, running, start, stop }
}

/**
 * A short sequence a person starts: `step` walks 0 → count, one step every `ms`. While running,
 * items below `step` are done and the item at `step` is in progress. Cleared on unmount.
 */
export function useSequence() {
  const step = ref(-1)
  const running = ref(false)
  let timer: number | undefined
  function run(count: number, ms: number, done?: () => void) {
    window.clearTimeout(timer)
    running.value = true
    step.value = 0
    const next = () => {
      step.value++
      if (step.value >= count) {
        running.value = false
        done?.()
        return
      }
      timer = window.setTimeout(next, ms)
    }
    timer = window.setTimeout(next, ms)
  }
  function reset() {
    window.clearTimeout(timer)
    running.value = false
    step.value = -1
  }
  onBeforeUnmount(() => window.clearTimeout(timer))
  return { step, running, run, reset }
}

/** The time a log line prints for something that happened just now: "14:02:11 WIB". */
export function stamp(zone: Zone = 'WIB', seconds = true): string {
  return timeZ(new Date(), zone, seconds)
}

/**
 * Where an arrow key moves a cursor in a list or grid of `count` items, or null when the key is
 * not a movement key. Stops at the ends instead of wrapping, as a ruled list does.
 */
export function arrowMove(
  event: KeyboardEvent,
  index: number,
  count: number,
  orientation: 'horizontal' | 'vertical' | 'grid' = 'vertical',
  cols = count,
): number | null {
  const step: Record<string, number> =
    orientation === 'grid'
      ? { ArrowRight: 1, ArrowLeft: -1, ArrowDown: cols, ArrowUp: -cols }
      : orientation === 'horizontal'
        ? { ArrowRight: 1, ArrowLeft: -1 }
        : { ArrowDown: 1, ArrowUp: -1 }
  if (event.key === 'Home') return 0
  if (event.key === 'End') return count - 1
  if (!(event.key in step)) return null
  const next = index + step[event.key]
  return next < 0 || next >= count ? index : next
}

/** The result of one check, with its word and tone. Colour never travels without the word. */
export type Verdict = 'pass' | 'fail' | 'warn' | 'skip'

export const verdictTone: Record<Verdict, StatusTone> = {
  pass: 'success',
  fail: 'danger',
  warn: 'warning',
  skip: 'neutral',
}

export const verdictWord: Record<Verdict, string> = {
  pass: 'Pass',
  fail: 'Fail',
  warn: 'Warn',
  skip: 'Skip',
}

/** A status a variant passes in: a tone and the word that goes with it. */
export interface Mark {
  tone: StatusTone
  label: string
}

/**
 * After a press swaps one control for another (Match becomes Undo), put the keyboard focus on the
 * new control inside `root`, so a keyboard user is not dropped back to the top of the page.
 */
export function focusAfter(root: HTMLElement | null | undefined, selector: string) {
  nextTick(() => root?.querySelector<HTMLElement>(selector)?.focus())
}
