/**
 * Shared by the Identify specimens: copying on a press, the check digits real identifiers carry,
 * and the marks drawn from them (EAN-13 bars, a 2D code). Everything is computed, so a barcode
 * encodes its digits and a container number carries its true check digit.
 */
import { onBeforeUnmount, ref } from 'vue'
import { seeded } from '../../kit'

/* ── Copy ────────────────────────────────────────────────────────────────────────────── */

/**
 * Copy text when a person presses a button. `copied` names what was copied for a moment, so the
 * button can say so; `blocked` is set when the browser refused the clipboard.
 */
export function useCopy(ms = 1600) {
  const copied = ref<string | null>(null)
  const blocked = ref(false)
  let timer: number | undefined

  async function copy(text: string, key = text) {
    let ok = true
    try {
      if (!navigator.clipboard) throw new Error('no clipboard')
      await navigator.clipboard.writeText(text)
    } catch {
      ok = false
    }
    copied.value = ok ? key : null
    blocked.value = !ok
    window.clearTimeout(timer)
    timer = window.setTimeout(() => {
      copied.value = null
      blocked.value = false
    }, ms)
  }

  onBeforeUnmount(() => window.clearTimeout(timer))
  return { copied, blocked, copy }
}

/** A short-lived flag for "it happened" feedback: `flash.on('saved')`. */
export function useFlash(ms = 1400) {
  const value = ref<string | null>(null)
  let timer: number | undefined
  function on(key: string) {
    value.value = key
    window.clearTimeout(timer)
    timer = window.setTimeout(() => (value.value = null), ms)
  }
  onBeforeUnmount(() => window.clearTimeout(timer))
  return { value, on }
}

/* ── Masking ─────────────────────────────────────────────────────────────────────────── */

/** Account and card numbers only ever show their last four: "···· 2207". */
export const masked = (last4: string) => `···· ${last4}`

/* ── Theme-aware colour reading ──────────────────────────────────────────────────────── */

const themeTick = ref(0)
let themeObserver: MutationObserver | null = null

/** Bumps when the page switches theme, so specimens that print live values can re-read them. */
export function useThemeTick() {
  if (!themeObserver && typeof MutationObserver !== 'undefined') {
    themeObserver = new MutationObserver(() => themeTick.value++)
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  }
  return themeTick
}

const hex2 = (n: number) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, '0').toUpperCase()

/**
 * The colour a token resolves to right now, as the browser draws it, in hex. Read from a probe
 * inside `host`, so a dark island reads its own values.
 */
export function readToken(host: Element, token: string): string {
  const probe = document.createElement('span')
  probe.style.color = `var(${token})`
  probe.style.display = 'none'
  host.appendChild(probe)
  const value = getComputedStyle(probe).color
  probe.remove()
  const nums = value.match(/[\d.]+/g)?.map(Number) ?? []
  if (value.startsWith('color(')) {
    const [r = 0, g = 0, b = 0] = nums
    return ['#', hex2(r * 255), hex2(g * 255), hex2(b * 255)].join('')
  }
  const [r = 0, g = 0, b = 0] = nums
  return ['#', hex2(r), hex2(g), hex2(b)].join('')
}

/* ── Check digits ────────────────────────────────────────────────────────────────────── */

/** ISO 6346 letter values: A = 10, skipping 11, 22 and 33. */
function iso6346Value(char: string): number {
  if (/\d/.test(char)) return Number(char)
  let v = 10
  for (let c = 65; c < char.charCodeAt(0); c++) {
    v++
    if (v % 11 === 0) v++
  }
  return v
}

/** Check digit of a container number from its first ten characters ("CSQU305438" → 3). */
export function iso6346Check(first10: string): { digit: number; sum: number } {
  const sum = [...first10.toUpperCase()].reduce((s, ch, i) => s + iso6346Value(ch) * 2 ** i, 0)
  return { digit: (sum % 11) % 10, sum }
}

/** EAN-13 check digit from the first twelve digits. */
export function ean13Check(first12: string): number {
  const sum = [...first12].reduce((s, d, i) => s + Number(d) * (i % 2 ? 3 : 1), 0)
  return (10 - (sum % 10)) % 10
}

/** ISBN-13 uses the EAN-13 rule. */
export const isbn13Check = ean13Check

/** Luhn check digit, as on an IMEI or a card number. */
export function luhnCheck(body: string): number {
  let sum = 0
  ;[...body].reverse().forEach((d, i) => {
    let n = Number(d)
    if (i % 2 === 0) {
      n *= 2
      if (n > 9) n -= 9
    }
    sum += n
  })
  return (10 - (sum % 10)) % 10
}

/** Air waybill: the eighth digit of the serial is the first seven modulo 7. */
export const awbCheck = (serial7: string) => Number(serial7) % 7

/* ── EAN-13 bars ─────────────────────────────────────────────────────────────────────── */

const L = ['0001101', '0011001', '0010011', '0111101', '0100011', '0110001', '0101111', '0111011', '0110111', '0001011']
const G = ['0100111', '0110011', '0011011', '0100001', '0011101', '0111001', '0000101', '0010001', '0001001', '0010111']
const R = ['1110010', '1100110', '1101100', '1000010', '1011100', '1001110', '1010000', '1000100', '1001000', '1110100']
const PARITY = ['LLLLLL', 'LLGLGG', 'LLGGLG', 'LLGGGL', 'LGLLGG', 'LGGLLG', 'LGGGLL', 'LGLGLG', 'LGLGGL', 'LGGLGL']

/**
 * The 95 modules of an EAN-13 symbol as one SVG path, `height` tall, guard bars `guard` longer.
 * The first digit sets the parity of the left half, as the standard does.
 */
export function ean13Path(digits13: string, height: number, guard = 5): { d: string; width: number } {
  const ds = [...digits13].map(Number)
  const parity = PARITY[ds[0]]
  let bits = '101'
  for (let i = 1; i <= 6; i++) bits += (parity[i - 1] === 'L' ? L : G)[ds[i]]
  bits += '01010'
  for (let i = 7; i <= 12; i++) bits += R[ds[i]]
  bits += '101'
  const isGuard = (i: number) => i < 3 || (i >= 45 && i < 50) || i >= 92
  let d = ''
  let i = 0
  while (i < bits.length) {
    if (bits[i] !== '1') {
      i++
      continue
    }
    let j = i
    while (j < bits.length && bits[j] === '1' && isGuard(j) === isGuard(i)) j++
    const h = isGuard(i) ? height + guard : height
    d += `M${i} 0h${j - i}v${h}h${-(j - i)}z`
    i = j
  }
  return { d, width: bits.length }
}

/** Decorative linear bars for bands and passes (aria-hidden): seeded widths, one path. */
export function barsPath(seed: string, modules: number, height: number): string {
  const rnd = seeded(seed)
  let x = 0
  let d = ''
  while (x < modules - 2) {
    const w = 1 + Math.floor(rnd() * 3)
    const gap = 1 + Math.floor(rnd() * 3)
    d += `M${x} 0h${w}v${height}h${-w}z`
    x += w + gap
  }
  return d
}

/* ── 2D code ─────────────────────────────────────────────────────────────────────────── */

/**
 * A square 2D code, `n` modules a side, with finder squares in three corners, as one path. It is
 * a drawing of a code (seeded from the booking reference), not a scannable symbol.
 */
export function matrixPath(seed: string, n = 25): string {
  const rnd = seeded(seed)
  const inFinder = (x: number, y: number) =>
    (x < 8 && y < 8) || (x >= n - 8 && y < 8) || (x < 8 && y >= n - 8)
  let d = ''
  const finder = (ox: number, oy: number) => {
    d += `M${ox} ${oy}h7v7h-7zM${ox + 1} ${oy + 1}v5h5v-5z`
    d += `M${ox + 2} ${oy + 2}h3v3h-3z`
  }
  finder(0, 0)
  finder(n - 7, 0)
  finder(0, n - 7)
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (inFinder(x, y)) continue
      if (rnd() < 0.48) d += `M${x} ${y}h1v1h-1z`
    }
  }
  return d
}

/* ── Spelling ────────────────────────────────────────────────────────────────────────── */

const NATO: Record<string, string> = {
  A: 'Alfa', B: 'Bravo', C: 'Charlie', D: 'Delta', E: 'Echo', F: 'Foxtrot', G: 'Golf', H: 'Hotel',
  I: 'India', J: 'Juliett', K: 'Kilo', L: 'Lima', M: 'Mike', N: 'November', O: 'Oscar', P: 'Papa',
  Q: 'Quebec', R: 'Romeo', S: 'Sierra', T: 'Tango', U: 'Uniform', V: 'Victor', W: 'Whiskey',
  X: 'X-ray', Y: 'Yankee', Z: 'Zulu', '0': 'Zero', '1': 'One', '2': 'Two', '3': 'Three', '4': 'Four',
  '5': 'Five', '6': 'Six', '7': 'Seven', '8': 'Eight', '9': 'Niner', '-': 'Dash',
}

/** The radiotelephony word for one character ("N" → "November", "9" → "Niner"). */
export const spell = (char: string) => NATO[char.toUpperCase()] ?? char

/* ── Coordinates ─────────────────────────────────────────────────────────────────────── */

/** −2.5634 → "2°33′48″ S". */
export function dms(value: number, axis: 'lat' | 'lon'): string {
  const abs = Math.abs(value)
  const d = Math.floor(abs)
  const mFloat = (abs - d) * 60
  const m = Math.floor(mFloat)
  const s = Math.round((mFloat - m) * 60)
  const [mm, ss] = s === 60 ? [m + 1, 0] : [m, s]
  const hemi = axis === 'lat' ? (value < 0 ? 'S' : 'N') : value < 0 ? 'W' : 'E'
  return `${d}°${String(mm).padStart(2, '0')}′${String(ss).padStart(2, '0')}″ ${hemi}`
}

/** −2.5634 → "−2.5634", with a true minus. */
export const dec = (value: number, places = 4) => `${value < 0 ? '−' : ''}${Math.abs(value).toFixed(places)}`

/** UTC offset of the board's zones. */
export const ZONE_OFFSET = { WIB: 'UTC+7', WITA: 'UTC+8', WIT: 'UTC+9', SGT: 'UTC+8', UTC: 'UTC' } as const
