/**
 * What the Enter chapter shares: reading what people type (rupiah with shorthand, grouped codes,
 * phone numbers), Indonesian amounts in words, clock arithmetic across zones, short timers that a
 * person starts, and focus that stays in the tile when the control in use is swapped out.
 */
import { nextTick, onBeforeUnmount, type Ref } from 'vue'
import { rp, type Zone } from '../../kit'
import { formatNumber } from '@/design-system'
import './enter.css'

export type Currency = 'IDR' | 'USD' | 'SGD'

/** Digits only: "+62 812-3456" → "628123456". */
export const digitsOf = (text: string) => text.replace(/\D/g, '')

/** Splits into groups: group("58130274", 4) → "5813 0274"; group("8123456789", [3, 4]) → "812 3456 789". */
export function group(text: string, size: number | number[], sep = ' '): string {
  const sizes = Array.isArray(size) ? size : [size]
  const out: string[] = []
  let i = 0
  let k = 0
  while (i < text.length) {
    const n = sizes[Math.min(k, sizes.length - 1)]
    out.push(text.slice(i, i + n))
    i += n
    k++
  }
  return out.join(sep)
}

/* ── Money ─────────────────────────────────────────────────────────────────────────── */

const IDR_WORDS: [RegExp, number][] = [
  [/^(rb|ribu|k)$/i, 1e3],
  [/^(jt|juta)$/i, 1e6],
  [/^(m|miliar|milyar)$/i, 1e9],
]
const INTL_WORDS: [RegExp, number][] = [
  [/^k$/i, 1e3],
  [/^(m|mn)$/i, 1e6],
  [/^(b|bn)$/i, 1e9],
]

/**
 * Reads an amount the way people type it. Rupiah: "1.500.000", "1,5jt", "250rb", "2 juta",
 * "1,2 M" (miliar); a dot groups and a comma is the decimal. Dollars: "1,500.50", "250k", "1.2m".
 * Returns null when the text is not an amount.
 */
export function parseAmount(text: string, currency: Currency): number | null {
  const t = text.trim().replace(/^(rp|idr|usd|sgd|s?\$)\s*/i, '')
  if (!t) return null
  const m = t.match(/^([\d.,\s]+?)\s*([a-z]+)?$/i)
  if (!m) return null
  let [, figure, word] = m
  figure = figure.replace(/\s/g, '')
  const words = currency === 'IDR' ? IDR_WORDS : INTL_WORDS
  let scale = 1
  if (word) {
    const hit = words.find(([re]) => re.test(word))
    if (!hit) return null
    scale = hit[1]
  }
  let value: number
  if (currency === 'IDR') {
    // "1.500.000" groups; "1,5" is one and a half. A lone dot before 1–2 digits with a word ("1.5jt")
    // is read as a decimal too, because that is what people mean.
    if (word && /^\d+\.\d{1,2}$/.test(figure)) value = Number(figure)
    else value = Number(figure.replace(/\./g, '').replace(',', '.'))
  } else {
    value = Number(figure.replace(/,/g, ''))
  }
  if (!Number.isFinite(value)) return null
  return Math.round(value * scale * 100) / 100
}

/** The figure as the field shows it: IDR "1.500.000", USD "1,500.50". */
export function groupAmount(value: number, currency: Currency): string {
  if (currency === 'IDR') return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(Math.round(value))
  const cents = Math.round(value * 100) % 100 !== 0
  return formatNumber(value, { minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: 2 })
}

/** Money as people read it: "Rp 1.500.000", "USD 1,500.00", "SGD 250.00". */
export function money(value: number, currency: Currency): string {
  if (currency === 'IDR') return rp(value)
  const sign = value < 0 ? '−' : ''
  return `${sign}${currency} ${formatNumber(Math.abs(value), { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const ONES = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas']

function below1000(n: number): string {
  if (n < 12) return ONES[n]
  if (n < 20) return `${ONES[n - 10]} belas`
  if (n < 100) return `${ONES[Math.floor(n / 10)]} puluh ${ONES[n % 10]}`.trim()
  if (n < 200) return `seratus ${below1000(n - 100)}`.trim()
  return `${ONES[Math.floor(n / 100)]} ratus ${below1000(n % 100)}`.trim()
}

/** The amount in Indonesian words, as a transfer slip spells it: 1500000 → "satu juta lima ratus ribu". */
export function terbilang(value: number): string {
  let n = Math.floor(Math.abs(value))
  if (n === 0) return 'nol'
  const parts: string[] = []
  const scales: [number, string][] = [
    [1e12, 'triliun'],
    [1e9, 'miliar'],
    [1e6, 'juta'],
    [1e3, 'ribu'],
  ]
  for (const [size, word] of scales) {
    const chunk = Math.floor(n / size)
    if (chunk) {
      parts.push(size === 1e3 && chunk === 1 ? 'seribu' : `${below1000(chunk)} ${word}`)
      n %= size
    }
  }
  if (n) parts.push(below1000(n))
  return parts.join(' ').replace(/\s+/g, ' ').trim()
}

/* ── Clock ─────────────────────────────────────────────────────────────────────────── */

export const ZONE_OFFSET: Record<Zone, number> = { WIB: 7, WITA: 8, WIT: 9, UTC: 0, SGT: 8 }

/** "14:30" → 870. */
export function toMin(hhmm: string): number | null {
  const m = /^(\d{2}):(\d{2})$/.exec(hhmm)
  if (!m) return null
  return Number(m[1]) * 60 + Number(m[2])
}

/** 870 → "14:30", wrapping round the day. */
export function toHHMM(min: number): string {
  const m = ((Math.round(min) % 1440) + 1440) % 1440
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

/** Minutes since midnight in a zone. */
export function minutesIn(date: Date, zone: Zone): number {
  const utc = date.getUTCHours() * 60 + date.getUTCMinutes()
  return (((utc + ZONE_OFFSET[zone] * 60) % 1440) + 1440) % 1440
}

/** 130 → "2 h 10 min", 45 → "45 min", 240 → "4 h". */
export function span(minutes: number): string {
  const m = Math.round(Math.abs(minutes))
  const h = Math.floor(m / 60)
  const r = m % 60
  if (!h) return `${r} min`
  return r ? `${h} h ${r} min` : `${h} h`
}

/* ── Timers and focus ──────────────────────────────────────────────────────────────── */

/** Short timers a person starts (a check, an upload). All cleared when the tile unmounts. */
export function useTimers() {
  const ids = new Set<number>()
  onBeforeUnmount(() => {
    ids.forEach((id) => window.clearTimeout(id))
    ids.clear()
  })
  return {
    later(fn: () => void, ms: number) {
      const id = window.setTimeout(() => {
        ids.delete(id)
        fn()
      }, ms)
      ids.add(id)
      return id
    },
    clear() {
      ids.forEach((id) => window.clearTimeout(id))
      ids.clear()
    },
  }
}

/**
 * Keeps keyboard focus inside the tile when the control that has it is replaced (a Send button
 * that turns into a receipt). Only acts when focus was inside the tile, so nothing is ever pulled
 * in from elsewhere on the page.
 */
export function keepFocus(root: Ref<HTMLElement | null>, selector?: string) {
  const el = root.value
  if (!el || !el.contains(document.activeElement)) return
  nextTick(() => {
    const now = document.activeElement
    if (now && now !== document.body && el.contains(now)) return
    const target =
      (selector ? el.querySelector<HTMLElement>(selector) : null) ??
      el.querySelector<HTMLElement>('input:not([disabled]), button:not([disabled]), [tabindex="0"]')
    target?.focus()
  })
}

/**
 * Re-formats a field while it is typed and keeps the caret after the same digit, so grouping
 * never makes the cursor jump. `format` gets the digits and returns the text to show.
 */
export function reformat(el: HTMLInputElement, format: (digits: string) => string): string {
  const raw = el.value
  const caret = el.selectionStart ?? raw.length
  const before = raw.slice(0, caret).replace(/\D/g, '').length
  const next = format(raw.replace(/\D/g, ''))
  el.value = next
  let pos = 0
  for (let seen = 0; pos < next.length && seen < before; pos++) if (/\d/.test(next[pos])) seen++
  if (document.activeElement === el) el.setSelectionRange(pos, pos)
  return next
}
