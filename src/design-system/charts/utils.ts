import { computed, ref, type Ref } from 'vue'

/** The chart palette, in order. Series without a colour take the next one. */
export const CHART_COLORS = [
  'var(--r-chart-1)',
  'var(--r-chart-2)',
  'var(--r-chart-3)',
  'var(--r-chart-4)',
  'var(--r-chart-5)',
  'var(--r-chart-6)',
]

export const colorAt = (index: number, explicit?: string) => explicit ?? CHART_COLORS[index % CHART_COLORS.length]

export interface TooltipRow {
  label: string
  value: string
  color?: string
}

export const round = (value: number, places = 2) => {
  const f = 10 ** places
  return Math.round(value * f) / f
}

export const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

/** A step of 1, 2, 2.5 or 5 × 10ⁿ that splits `span` into roughly `count` parts. */
export function niceStep(span: number, count: number): number {
  const raw = span / Math.max(1, count)
  const magnitude = 10 ** Math.floor(Math.log10(raw || 1))
  const normalized = raw / magnitude
  const nice = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 2.5 ? 2.5 : normalized <= 5 ? 5 : 10
  return nice * magnitude
}

/** Rounds a domain out to tidy ticks: [0, 92921] with 4 ticks → 0, 25K, 50K, 75K, 100K. */
export function niceDomain(min: number, max: number, count = 4) {
  if (max === min) max = min + 1
  const step = niceStep(max - min, count)
  const lo = Math.floor(min / step) * step
  const hi = Math.ceil(max / step) * step
  const ticks: number[] = []
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(round(v, 10))
  return { min: lo, max: hi, step, ticks }
}

export function linearScale(d0: number, d1: number, r0: number, r1: number) {
  const k = d1 === d0 ? 0 : (r1 - r0) / (d1 - d0)
  return (value: number) => r0 + (value - d0) * k
}

export type Point = [number, number]

export function linearPath(points: Point[]): string {
  return points.map(([x, y], i) => `${i ? 'L' : 'M'}${round(x)},${round(y)}`).join('')
}

/**
 * Monotone cubic interpolation (Fritsch–Carlson): smooth, but never overshoots the data,
 * so a peak in the line is a peak in the numbers.
 */
export function monotonePath(points: Point[]): string {
  const n = points.length
  if (n < 3) return linearPath(points)
  const dx: number[] = []
  const slope: number[] = []
  for (let i = 0; i < n - 1; i++) {
    dx[i] = points[i + 1][0] - points[i][0]
    slope[i] = dx[i] === 0 ? 0 : (points[i + 1][1] - points[i][1]) / dx[i]
  }
  const tangent: number[] = new Array(n)
  tangent[0] = slope[0]
  tangent[n - 1] = slope[n - 2]
  for (let i = 1; i < n - 1; i++) {
    if (slope[i - 1] * slope[i] <= 0) {
      tangent[i] = 0
    } else {
      const w1 = 2 * dx[i] + dx[i - 1]
      const w2 = dx[i] + 2 * dx[i - 1]
      tangent[i] = (w1 + w2) / (w1 / slope[i - 1] + w2 / slope[i])
    }
  }
  let d = `M${round(points[0][0])},${round(points[0][1])}`
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = points[i]
    const [x1, y1] = points[i + 1]
    const h = dx[i] / 3
    d += `C${round(x0 + h)},${round(y0 + tangent[i] * h)} ${round(x1 - h)},${round(y1 - tangent[i + 1] * h)} ${round(x1)},${round(y1)}`
  }
  return d
}

/**
 * Keyboard exploration shared by the charts: arrow keys move an index, Home/End jump,
 * Escape clears. `announce` is read out through a polite live region.
 */
export function useChartFocus(count: () => number, describe: (index: number) => string) {
  const active = ref<number | null>(null)
  const keyboard = ref(false)
  const announce = computed(() => (keyboard.value && active.value !== null ? describe(active.value) : ''))

  function onKeydown(event: KeyboardEvent) {
    const n = count()
    if (!n) return
    const current = active.value ?? -1
    let next: number | null = null
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = Math.min(n - 1, current + 1)
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = current < 0 ? n - 1 : Math.max(0, current - 1)
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = n - 1
    else if (event.key === 'Escape') {
      active.value = null
      return
    }
    if (next === null) return
    event.preventDefault()
    keyboard.value = true
    active.value = next
  }

  function onPointer(index: number | null) {
    keyboard.value = false
    active.value = index
  }

  function onBlur() {
    if (keyboard.value) active.value = null
    keyboard.value = false
  }

  return { active, announce, onKeydown, onPointer, onBlur }
}

/** Width of the container, for charts that draw in real pixels (crisp 1px lines, round dots). */
export function chartWidth(width: Ref<number>, fallback = 600) {
  return computed(() => Math.max(1, Math.floor(width.value || fallback)))
}
