/**
 * Helpers the tune chapter shares: the keys every slider-like control answers to, rotary and
 * wheel input that only acts on the focused control, press-and-hold repeat for steppers, and
 * signed figures with a true minus. Nothing here listens on window or document.
 */
import { onBeforeUnmount } from 'vue'

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/** Decimals of a step, so 0.5 steps read 2.5 and 0.025 steps read 243.025. */
export function decimalsOf(step: number): number {
  const text = String(step)
  const at = text.indexOf('.')
  return at < 0 ? 0 : text.length - at - 1
}

/** Snap to the step grid from `min`, clamp, and drop float noise. */
export function snapTo(v: number, min: number, max: number, step: number): number {
  const snapped = min + Math.round((v - min) / step) * step
  return Number(clamp(snapped, min, max).toFixed(decimalsOf(step)))
}

/**
 * The keys of a slider: arrows step (Shift ten steps), Page keys a tenth of the range, Home and
 * End the ends. Returns the next raw value, or null when the key is not one of them.
 */
export function sliderKey(
  event: KeyboardEvent,
  value: number,
  o: { min: number; max: number; step: number; page?: number },
): number | null {
  const step = o.step * (event.shiftKey ? 10 : 1)
  const page = o.page ?? Math.max(o.step * 10, (o.max - o.min) / 10)
  switch (event.key) {
    case 'ArrowUp':
    case 'ArrowRight':
      return value + step
    case 'ArrowDown':
    case 'ArrowLeft':
      return value - step
    case 'PageUp':
      return value + page
    case 'PageDown':
      return value - page
    case 'Home':
      return o.min
    case 'End':
      return o.max
  }
  return null
}

/** A signed figure with a true minus: 1.5 → "+1.5", −2 → "−2.0", 0 → "0.0". */
export function plusMinus(v: number, decimals = 1): string {
  const abs = Math.abs(v).toFixed(decimals)
  if (Number(abs) === 0) return Number(0).toFixed(decimals)
  return v > 0 ? `+${abs}` : `−${abs}`
}

/** A figure with a true minus and no plus: −2 → "−2". */
export function minus(text: string | number): string {
  return String(text).replace(/^-/, '−')
}

/**
 * Capture the pointer on an element for a drag. A pointer that has already ended cannot be
 * captured; that is ignored rather than thrown, so a lost capture never takes the tile down.
 */
export function capture(el: Element | null | undefined, event: PointerEvent) {
  try {
    el?.setPointerCapture(event.pointerId)
  } catch {
    // The drag still follows the pointer while it is over the element.
  }
}

/** Angle of a pointer around an element's centre, in degrees clockwise from 12 o'clock (−180…180). */
export function pointerAngle(event: PointerEvent | MouseEvent, el: Element): number {
  const box = el.getBoundingClientRect()
  const x = event.clientX - (box.left + box.width / 2)
  const y = event.clientY - (box.top + box.height / 2)
  return (Math.atan2(x, -y) * 180) / Math.PI
}

/** The shortest signed turn from one angle to another, in degrees (−180…180). */
export function turn(from: number, to: number): number {
  let d = to - from
  while (d > 180) d -= 360
  while (d < -180) d += 360
  return d
}

/**
 * A wheel handler that acts only while the control has focus, so scrolling the page past a
 * control never changes it. A mouse notch is one step; trackpad deltas add up to one.
 * `dir` is +1 for wheel up (or left), −1 for down.
 */
export function focusedWheel(onNotch: (dir: 1 | -1, event: WheelEvent) => void) {
  let rest = 0
  return (event: WheelEvent) => {
    const el = event.currentTarget as HTMLElement | null
    if (!el || document.activeElement !== el) return
    event.preventDefault()
    const raw = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX
    const delta = event.deltaMode === 1 ? raw * 33 : raw
    if (Math.abs(delta) >= 40) {
      rest = 0
      onNotch(delta < 0 ? 1 : -1, event)
      return
    }
    rest += delta
    if (Math.abs(rest) >= 40) {
      onNotch(rest < 0 ? 1 : -1, event)
      rest = 0
    }
  }
}

/**
 * Press and hold to repeat, for stepper keys: one step on press, then steps every 160 ms after a
 * 400 ms pause, speeding up to every 50 ms. Keyboard activation (Enter, Space) comes through
 * `onClick` with detail 0, and the system's own key repeat repeats it.
 */
export function useRepeat(fn: () => void) {
  let timer: number | undefined
  let every = 160
  const stop = () => {
    window.clearTimeout(timer)
    timer = undefined
  }
  const again = () => {
    fn()
    every = Math.max(50, every * 0.86)
    timer = window.setTimeout(again, every)
  }
  onBeforeUnmount(stop)
  return {
    onPointerdown(event: PointerEvent) {
      if (event.button !== 0) return
      capture(event.currentTarget as HTMLElement, event)
      stop()
      fn()
      every = 160
      timer = window.setTimeout(again, 400)
    },
    onPointerup: stop,
    onPointercancel: stop,
    onLostpointercapture: stop,
    onClick(event: MouseEvent) {
      if (event.detail === 0) fn()
    },
    onContextmenu: (event: Event) => event.preventDefault(),
  }
}

/** Index of the band a value falls in, from a list of upper bounds. */
export function bandOf(value: number, bounds: number[]): number {
  const i = bounds.findIndex((b) => value <= b)
  return i < 0 ? bounds.length - 1 : i
}

/** Down-sample a series to `n` points by averaging. */
export function shrink(values: number[], n: number): number[] {
  if (values.length <= n) return values
  const size = values.length / n
  return Array.from({ length: n }, (_, i) => {
    const from = Math.floor(i * size)
    const to = Math.max(from + 1, Math.floor((i + 1) * size))
    const part = values.slice(from, to)
    return part.reduce((s, v) => s + v, 0) / part.length
  })
}

/** Points of a polyline for an SVG `points` attribute. */
export const points = (xy: [number, number][]) => xy.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
