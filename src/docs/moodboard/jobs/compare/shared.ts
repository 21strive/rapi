/**
 * Helpers shared by the compare specimens: number formats, tidy scales and the keyboard of a
 * radio group. The small charts are drawn in plain SVG with the library's own chart classes
 * (r-chart__grid, r-chart__axis, r-chart__ref…), so a hand-drawn tile and a library chart read
 * as one instrument.
 */
import { nextTick } from 'vue'
import { formatCompact, withMinus } from '@/design-system'
import { idr, num, rp, usd } from '../../kit'
import './compare.css'

export type FormatKind = 'num' | 'pct' | 'rp' | 'idr' | 'usd' | 'compact' | 'dur' | 'min'

/** How a value is written: the kind of number and its fixed decimals. */
export interface Fmt {
  kind?: FormatKind
  decimals?: number
}

/** 372 → "6m 12s", 48 → "48s". */
export function duration(seconds: number): string {
  const s = Math.round(Math.abs(seconds))
  const m = Math.floor(s / 60)
  return m ? `${m}m ${String(s % 60).padStart(2, '0')}s` : `${s}s`
}

/** A value written the Rapi way: separators, true minus, units left to the caller. */
export function fmt(value: number, f: Fmt = {}): string {
  const d = f.decimals ?? 0
  switch (f.kind) {
    case 'pct':
      return `${num(value, d)}%`
    case 'rp':
      return rp(value)
    case 'idr':
      return idr(value, f.decimals)
    case 'usd':
      return usd(value, d)
    case 'compact':
      return withMinus(formatCompact(value, { maximumFractionDigits: d || 1 }))
    case 'dur':
      return duration(value)
    case 'min':
      return `${num(value, d)} min`
    default:
      return num(value, d)
  }
}

/** "+12.4%", "−3.1 pp", "+1,204": the sign always shown, the minus a true minus. */
export function delta(value: number, decimals = 1, suffix = '%'): string {
  const text = num(Math.abs(value), decimals)
  const sign = value > 0 ? '+' : value < 0 ? '−' : ''
  return `${sign}${text}${suffix}`
}

/** Percent change from a to b; 0 when a is 0. */
export const change = (a: number, b: number) => (a === 0 ? 0 : ((b - a) / Math.abs(a)) * 100)

/** "1st", "2nd", "3rd", "11th". */
export function ordinal(n: number): string {
  const t = n % 100
  if (t >= 11 && t <= 13) return `${n}th`
  const s = n % 10 === 1 ? 'st' : n % 10 === 2 ? 'nd' : n % 10 === 3 ? 'rd' : 'th'
  return `${n}${s}`
}

/** Identity colour of a series, by its fixed slot (0-based). Never re-assigned when others hide. */
export const slot = (i: number) => `var(--r-chart-${Math.min(7, Math.max(0, i)) + 1})`

/** A step of 1, 2, 2.5 or 5 × 10ⁿ that splits `span` into about `count` parts. */
export function niceStep(span: number, count: number): number {
  const raw = span / Math.max(1, count)
  const mag = 10 ** Math.floor(Math.log10(raw || 1))
  const n = raw / mag
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * mag
}

/** Tidy ticks around [min, max]. */
export function niceTicks(min: number, max: number, count = 4) {
  if (max === min) max = min + 1
  const step = niceStep(max - min, count)
  const lo = Math.floor(min / step + 1e-9) * step
  const hi = Math.ceil(max / step - 1e-9) * step
  const ticks: number[] = []
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(Math.round(v * 1e9) / 1e9)
  return { min: lo, max: hi, step, ticks }
}

/** A linear map from a domain to a range. */
export function linear(d0: number, d1: number, r0: number, r1: number) {
  const k = d1 === d0 ? 0 : (r1 - r0) / (d1 - d0)
  return (v: number) => r0 + (v - d0) * k
}

/** Snap a coordinate to the pixel grid so a 1px line stays crisp. */
export const crisp = (v: number) => Math.round(v) + 0.5

/**
 * Arrow keys, Home and End over a radio group, wrapping as the APG radio group does. Returns the
 * next index, or null when the key is not ours. Focus follows with `focusItem`.
 */
export function stepKeys(event: KeyboardEvent, current: number, count: number, wrap = true): number | null {
  const k = event.key
  let next: number | null = null
  if (k === 'ArrowRight' || k === 'ArrowDown') next = current + 1
  else if (k === 'ArrowLeft' || k === 'ArrowUp') next = current - 1
  else if (k === 'Home') next = 0
  else if (k === 'End') next = count - 1
  if (next === null || count < 1) return null
  event.preventDefault()
  if (wrap) return (next + count) % count
  return Math.min(count - 1, Math.max(0, next))
}

/** Moves focus to the nth item of a group after the DOM has updated. */
export function focusItem(group: HTMLElement | null | undefined, index: number, selector = '[role="radio"]') {
  nextTick(() => group?.querySelectorAll<HTMLElement>(selector)[index]?.focus())
}

/** Spreads labels at least `gap` px apart, keeping their order, inside [lo, hi]. */
export function spread(ys: number[], gap: number, lo: number, hi: number): number[] {
  const order = ys.map((y, i) => ({ y, i })).sort((a, b) => a.y - b.y)
  for (let k = 1; k < order.length; k++) order[k].y = Math.max(order[k].y, order[k - 1].y + gap)
  const overflow = order.length ? order[order.length - 1].y - hi : 0
  if (overflow > 0) for (const o of order) o.y -= overflow
  for (let k = 0; k < order.length; k++) order[k].y = Math.max(order[k].y, k ? order[k - 1].y + gap : lo)
  const out = new Array<number>(ys.length)
  for (const o of order) out[o.i] = o.y
  return out
}
