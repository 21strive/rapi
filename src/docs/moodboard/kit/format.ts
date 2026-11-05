/**
 * Formatting for the board, following the Rapi copy rules: thousands separators, true minus signs,
 * 24-hour times with a zone, dates like "12 Nov 2026", units after the figure in their own case.
 */
import { formatNumber, withMinus } from '@/design-system'

export type Zone = 'WIB' | 'WITA' | 'WIT' | 'UTC' | 'SGT'

const ZONES: Record<Zone, string> = {
  WIB: 'Asia/Jakarta',
  WITA: 'Asia/Makassar',
  WIT: 'Asia/Jayapura',
  UTC: 'UTC',
  SGT: 'Asia/Singapore',
}

const timeFormats = new Map<string, Intl.DateTimeFormat>()
function fmt(key: string, make: () => Intl.DateTimeFormat) {
  let f = timeFormats.get(key)
  if (!f) {
    f = make()
    timeFormats.set(key, f)
  }
  return f
}

/** "14:02" or, with seconds, "14:02:11". */
export function time(date: Date, zone: Zone = 'WIB', seconds = false): string {
  return fmt(`t${zone}${seconds}`, () =>
    new Intl.DateTimeFormat('en-GB', {
      timeZone: ZONES[zone],
      hour: '2-digit',
      minute: '2-digit',
      second: seconds ? '2-digit' : undefined,
      hourCycle: 'h23',
    }),
  ).format(date)
}

/** "14:02 WIB". */
export function timeZ(date: Date, zone: Zone = 'WIB', seconds = false): string {
  return `${time(date, zone, seconds)} ${zone}`
}

/** "12 Nov 2026". */
export function day(date: Date, zone: Zone = 'WIB'): string {
  return fmt(`d${zone}`, () =>
    new Intl.DateTimeFormat('en-GB', { timeZone: ZONES[zone], day: 'numeric', month: 'short', year: 'numeric' }),
  ).format(date)
}

/** "Thu 12 Nov". */
export function weekday(date: Date, zone: Zone = 'WIB'): string {
  return fmt(`w${zone}`, () =>
    new Intl.DateTimeFormat('en-GB', { timeZone: ZONES[zone], weekday: 'short', day: 'numeric', month: 'short' }),
  ).format(date)
}

/** Grouped figures, en-US: 1284 → "1,284". */
export function num(value: number, decimals = 0): string {
  return withMinus(formatNumber(value, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }))
}

/** Rupiah the way people in Indonesia read it: 2450000 → "Rp 2.450.000". */
export function rp(value: number): string {
  const text = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(Math.abs(value))
  return `${value < 0 ? '−' : ''}Rp ${text}`
}

/** Compact rupiah for treasury and reports: 4820000000 → "IDR 4.82 bn". */
export function idr(value: number, decimals?: number): string {
  const abs = Math.abs(value)
  const sign = value < 0 ? '−' : ''
  const scale: [number, string][] = [
    [1e12, 'tn'],
    [1e9, 'bn'],
    [1e6, 'M'],
    [1e3, 'K'],
  ]
  for (const [size, word] of scale) {
    if (abs >= size) {
      const v = abs / size
      const d = decimals ?? (v >= 100 ? 0 : v >= 10 ? 1 : 2)
      return `${sign}IDR ${formatNumber(v, { minimumFractionDigits: d, maximumFractionDigits: d })} ${word}`
    }
  }
  return `${sign}IDR ${formatNumber(abs)}`
}

/** "$1,284" or "$1,284.50". */
export function usd(value: number, decimals = 0): string {
  return withMinus(
    formatNumber(value, { style: 'currency', currency: 'USD', minimumFractionDigits: decimals, maximumFractionDigits: decimals }),
  )
}

/** A signed change with a true minus: "+1.9%", "−0.4 pp", "0.0%". */
export function signed(value: number, decimals = 1, suffix = '%'): string {
  const text = formatNumber(Math.abs(value), { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
  const sign = value > 0 ? '+' : value < 0 ? '−' : ''
  return `${sign}${text}${suffix}`
}

export function pad(value: number, width = 2): string {
  return String(Math.trunc(value)).padStart(width, '0')
}

/** Seconds as a clock: 252 → "04:12", 3852 → "1:04:12". */
export function clock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return h ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`
}

/** "T−00:04:12" for countdowns, "T+00:01:12" after zero. */
export function tMinus(secondsToZero: number): string {
  const sign = secondsToZero > 0 ? '−' : '+'
  const s = Math.abs(Math.round(secondsToZero))
  return `T${sign}${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`
}

export { withMinus }
