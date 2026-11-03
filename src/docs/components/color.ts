import { nextTick, onMounted, ref, watch, type Ref } from 'vue'
import { useTheme } from '@/design-system'

/* Docs-only colour helpers: resolve a token to a real colour in a given theme context,
 * show it as hex, and work out WCAG contrast. */

export interface RGBA {
  r: number
  g: number
  b: number
  a: number
}

const clamp255 = (v: number) => Math.min(255, Math.max(0, Math.round(v)))

let canvasContext: CanvasRenderingContext2D | null | undefined

function viaCanvas(value: string): RGBA | null {
  if (canvasContext === undefined) {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 1
    canvasContext = canvas.getContext('2d', { willReadFrequently: true })
  }
  const ctx = canvasContext
  if (!ctx) return null
  ctx.clearRect(0, 0, 1, 1)
  ctx.fillStyle = '#000'
  ctx.fillStyle = value
  ctx.fillRect(0, 0, 1, 1)
  const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data
  return { r, g, b, a: a / 255 }
}

/** Parses what getComputedStyle hands back: rgb(), rgba(), or color(srgb …). */
export function parseColor(value: string): RGBA | null {
  const v = value.trim()
  if (!v) return null
  const rgb = v.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/i)
  if (rgb) {
    const alpha = rgb[4] === undefined ? 1 : rgb[4].endsWith('%') ? parseFloat(rgb[4]) / 100 : parseFloat(rgb[4])
    return { r: +rgb[1], g: +rgb[2], b: +rgb[3], a: alpha }
  }
  const srgb = v.match(/^color\(\s*srgb\s+([\d.e-]+)\s+([\d.e-]+)\s+([\d.e-]+)(?:\s*\/\s*([\d.]+%?))?\s*\)$/i)
  if (srgb) {
    const alpha = srgb[4] === undefined ? 1 : srgb[4].endsWith('%') ? parseFloat(srgb[4]) / 100 : parseFloat(srgb[4])
    return { r: clamp255(+srgb[1] * 255), g: clamp255(+srgb[2] * 255), b: clamp255(+srgb[3] * 255), a: alpha }
  }
  return viaCanvas(v)
}

/** Resolves CSS values (usually `var(--token)`) inside `context`, so theme islands give their own answer. */
export function resolveColors(context: Element, values: string[]): (RGBA | null)[] {
  const probes = values.map((value) => {
    const probe = document.createElement('span')
    probe.style.color = value
    probe.style.display = 'none'
    context.appendChild(probe)
    return probe
  })
  const out = probes.map((probe) => parseColor(getComputedStyle(probe).color))
  for (const probe of probes) probe.remove()
  return out
}

const hex2 = (n: number) => clamp255(n).toString(16).padStart(2, '0')

export function toHex(c: RGBA): string {
  return `#${hex2(c.r)}${hex2(c.g)}${hex2(c.b)}`.toUpperCase()
}

/** "#1B3AAB" or "#4970EB · 16%" for translucent colours. */
export function describe(c: RGBA | null | undefined): string {
  if (!c) return '—'
  return c.a < 0.999 ? `${toHex(c)} · ${Math.round(c.a * 100)}%` : toHex(c)
}

export function composite(top: RGBA, bottom: RGBA): RGBA {
  const a = top.a + bottom.a * (1 - top.a)
  if (a === 0) return { r: 0, g: 0, b: 0, a: 0 }
  const mix = (t: number, b: number) => (t * top.a + b * bottom.a * (1 - top.a)) / a
  return { r: mix(top.r, bottom.r), g: mix(top.g, bottom.g), b: mix(top.b, bottom.b), a }
}

function channel(v: number) {
  const s = v / 255
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}

export function luminance(c: RGBA): number {
  return 0.2126 * channel(c.r) + 0.7152 * channel(c.g) + 0.0722 * channel(c.b)
}

/** WCAG contrast. Translucent colours are laid over what is under them first. */
export function contrast(foreground: RGBA, background: RGBA, base: RGBA = { r: 255, g: 255, b: 255, a: 1 }): number {
  const bg = background.a < 1 ? composite(background, base) : background
  const fg = foreground.a < 1 ? composite(foreground, bg) : foreground
  const l1 = luminance(fg)
  const l2 = luminance(bg)
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
}

export function grade(ratio: number): string {
  if (ratio >= 7) return 'AAA'
  if (ratio >= 4.5) return 'AA'
  if (ratio >= 3) return 'AA large'
  return 'Low'
}

/** White or the 21 Strive black, whichever reads better on `c`. */
export function readableOn(c: RGBA | null | undefined): string {
  if (!c) return 'inherit'
  const white = contrast({ r: 255, g: 255, b: 255, a: 1 }, c)
  const ink = contrast({ r: 21, g: 21, b: 21, a: 1 }, c)
  if (white >= ink && white >= 4.5) return '#fff'
  if (ink >= 4.5) return '#151515'
  // Mid-tones where neither passes: pure black still does.
  const black = contrast({ r: 0, g: 0, b: 0, a: 1 }, c)
  return black > white ? '#000' : '#fff'
}

/**
 * Resolves a list of tokens in the context of `root` and re-reads them whenever the theme or the
 * token list changes. Returns a map from token to colour.
 */
export function useTokenColors(root: Ref<HTMLElement | null>, tokens: () => string[]) {
  const colors = ref<Record<string, RGBA | null>>({})
  const { resolved } = useTheme()

  function read() {
    const el = root.value
    if (!el) return
    const list = tokens()
    const values = resolveColors(
      el,
      list.map((t) => (t.startsWith('--') ? `var(${t})` : t)),
    )
    const next: Record<string, RGBA | null> = {}
    list.forEach((t, i) => (next[t] = values[i]))
    colors.value = next
  }

  function soon() {
    nextTick(() => requestAnimationFrame(read))
  }

  onMounted(read)
  watch([resolved, () => tokens().join()], soon)

  return { colors, read }
}

/** Plain CSS custom property values (spacing, radius, shadows) that follow the theme. */
export function useTokenValues(tokens: () => string[]) {
  const values = ref<Record<string, string>>({})
  const { resolved } = useTheme()

  function read() {
    const style = getComputedStyle(document.documentElement)
    const next: Record<string, string> = {}
    for (const t of tokens()) next[t] = style.getPropertyValue(t).trim()
    values.value = next
  }

  onMounted(read)
  watch([resolved], () => nextTick(() => requestAnimationFrame(read)))

  return { values, read }
}
