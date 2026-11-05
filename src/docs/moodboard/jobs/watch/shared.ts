/**
 * Helpers the Watch specimens share. Everything live runs on the kit's shared ticks (`useTick`,
 * `useNow`), so a tile that is off screen, or a hidden tab, costs nothing. Seeded randomness keeps
 * every load the same until time moves it on.
 */
import { computed, ref, shallowRef, watch } from 'vue'
import { useElementSize } from '@/design-system'
import { seeded, useTick } from '../../kit'

export { useElementSize }

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/** 1 → "1st", 4 → "4th", 22 → "22nd". */
export function ordinal(n: number): string {
  const s = n % 100
  if (s >= 11 && s <= 13) return `${n}th`
  return `${n}${['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'}`
}

export interface Sample {
  v: number
  /** When it was taken, epoch ms. */
  t: number
}

/**
 * A rolling window of live samples. It opens full (seeded, so every load looks the same) and takes
 * one sample per tick while the tile is on screen. `freeze()` holds what is shown while samples keep
 * arriving underneath, the way a paused monitor still records; `missed` counts them.
 */
export function useLive(options: {
  seed: string
  size: number
  ms: number
  start: number
  next: (last: number, rnd: () => number, step: number) => number
}) {
  const rnd = seeded(options.seed)
  let step = 0
  let last = options.start
  const opened = Date.now()
  const first: Sample[] = []
  for (let k = options.size - 1; k >= 0; k--) {
    last = options.next(last, rnd, step++)
    first.push({ v: last, t: opened - k * options.ms })
  }
  const live = shallowRef<Sample[]>(first)
  const held = shallowRef<Sample[] | null>(null)
  const missed = ref(0)
  const tick = useTick(options.ms)

  function push() {
    last = options.next(last, rnd, step++)
    live.value = [...live.value.slice(1), { v: last, t: Date.now() }]
    if (held.value) missed.value++
  }
  watch(tick, push)

  const shown = computed(() => held.value ?? live.value)
  const frozen = computed(() => held.value !== null)
  const latest = computed(() => shown.value[shown.value.length - 1])
  function freeze(on = !frozen.value) {
    held.value = on ? live.value : null
    missed.value = 0
  }
  return { live, shown, latest, frozen, freeze, missed, tick, push }
}

/** Low and high of a window, padded so a line never sits on the frame. */
export function extent(values: number[], pad = 0.12, fixed?: [number, number]): [number, number] {
  if (fixed) return fixed
  let lo = Math.min(...values)
  let hi = Math.max(...values)
  if (hi === lo) {
    hi += 1
    lo -= 1
  }
  const p = (hi - lo) * pad
  return [lo - p, hi + p]
}

/** Straight segments through `values`, scaled into `w` × `h` between `lo` and `hi`. */
export function linePath(values: number[], w: number, h: number, lo: number, hi: number, top = 0): string {
  const n = values.length
  if (!n || w <= 0) return ''
  const span = hi - lo || 1
  let d = ''
  for (let i = 0; i < n; i++) {
    const x = n === 1 ? w : (i / (n - 1)) * w
    const y = top + (1 - (clamp(values[i], lo, hi) - lo) / span) * h
    d += `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`
  }
  return d
}

/**
 * Square columns as one SVG path, so a strip of 30 bars is one node to redraw on every tick.
 * Columns share the width with a 2px gap and grow from the bottom; anything above zero shows.
 */
export function columnsPath(values: number[], w: number, h: number, max: number, gap = 2): string {
  const n = values.length
  if (!n || w <= 0) return ''
  const bw = Math.max(1, (w - gap * (n - 1)) / n)
  let d = ''
  for (let i = 0; i < n; i++) {
    const v = values[i]
    if (v <= 0) continue
    const bh = Math.max(2, Math.round((Math.min(v, max) / (max || 1)) * h))
    const x = i * (bw + gap)
    d += `M${x.toFixed(1)} ${h - bh}h${bw.toFixed(1)}v${bh}h${(-bw).toFixed(1)}Z`
  }
  return d
}

/** Which column a pointer is over, for strips drawn with `columnsPath`. */
export function columnAt(event: PointerEvent, n: number): number {
  const box = (event.currentTarget as HTMLElement).getBoundingClientRect()
  return clamp(Math.floor(((event.clientX - box.left) / box.width) * n), 0, n - 1)
}

/** Arrow-key movement through a list of `n`: returns the next index, or null for other keys. */
export function stepKey(event: KeyboardEvent, current: number, n: number, wrap = false): number | null {
  const keys: Record<string, number> = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }
  let next: number
  if (event.key in keys) next = current + keys[event.key]
  else if (event.key === 'Home') next = 0
  else if (event.key === 'End') next = n - 1
  else return null
  event.preventDefault()
  if (wrap) return (next + n) % n
  return clamp(next, 0, n - 1)
}

/** "1.9 GB" from megabytes. */
export function bytes(mb: number): string {
  if (mb >= 1024) return `${(mb / 1024).toFixed(mb >= 10240 ? 0 : 1)} GB`
  return `${Math.round(mb)} MB`
}

/** Minutes as words: 6 → "6 min", 72 → "1 h 12 min". */
export function minutes(total: number): string {
  const m = Math.max(0, Math.round(total))
  if (m < 60) return `${m} min`
  return `${Math.floor(m / 60)} h ${m % 60} min`
}
