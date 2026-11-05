/**
 * Helpers shared by the glance specimens: status levels and the words that travel with them,
 * roving focus for rows and grids of cells, copy with feedback, and clock maths in any zone.
 */
import { onBeforeUnmount, ref } from 'vue'
import { seeded } from '../../kit'

/* ── Levels ──────────────────────────────────────────────────────────────────────────── */

/** The lamp states of the language. A level is never shown without its word. */
export type Level = 'good' | 'warning' | 'serious' | 'critical' | 'off'

/** The RStatus tone that carries a level. Serious has no tone of its own and reads as danger. */
export function toneOf(level: Level): 'success' | 'warning' | 'danger' | 'neutral' {
  if (level === 'good') return 'success'
  if (level === 'warning') return 'warning'
  if (level === 'off') return 'neutral'
  return 'danger'
}

/** The lamp colour of a level, for marks a specimen draws itself. */
export function lampOf(level: Level): string {
  return `var(--r-status-${level})`
}

/* ── Roving focus: one tab stop for a row or grid of cells, arrows move inside ────────── */

export function useRoving(options: {
  count: () => number
  /** Cells per row; leave out for a single row. */
  cols?: () => number
  initial?: number
  onMove?: (index: number) => void
}) {
  const active = ref(options.initial ?? 0)
  const els: (HTMLElement | null)[] = []

  /** Template ref for cell `i`: `:ref="bind(i)"`. */
  const bind = (i: number) => (el: unknown) => {
    els[i] = (el as HTMLElement | null) ?? null
  }

  function go(index: number, focus = true) {
    const n = options.count()
    if (!n) return
    const next = Math.max(0, Math.min(n - 1, index))
    active.value = next
    options.onMove?.(next)
    if (focus) els[next]?.focus()
  }

  function onKeydown(event: KeyboardEvent) {
    const n = options.count()
    const cols = Math.min(n, options.cols?.() ?? n)
    const at = active.value
    const single = cols >= n
    const moves: Record<string, number> = {
      ArrowRight: at + 1,
      ArrowLeft: at - 1,
      ArrowDown: single ? at + 1 : at + cols,
      ArrowUp: single ? at - 1 : at - cols,
      Home: 0,
      End: n - 1,
    }
    if (!(event.key in moves)) return
    event.preventDefault()
    go(moves[event.key])
  }

  return { active, bind, go, onKeydown }
}

/* ── Copy with feedback inside the tile ──────────────────────────────────────────────── */

export function useCopy(ms = 1400) {
  const copied = ref<string | null>(null)
  const failed = ref<string | null>(null)
  let timer: number | undefined

  /* The older route, for pages where the async clipboard is refused. */
  function legacy(text: string): boolean {
    const back = document.activeElement as HTMLElement | null
    const area = document.createElement('textarea')
    area.value = text
    area.setAttribute('readonly', '')
    area.style.position = 'fixed'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.select()
    let ok = false
    try {
      ok = document.execCommand('copy')
    } catch {
      ok = false
    }
    area.remove()
    back?.focus()
    return ok
  }

  async function copy(key: string, text: string) {
    let ok = false
    try {
      await navigator.clipboard.writeText(text)
      ok = true
    } catch {
      ok = legacy(text)
    }
    copied.value = ok ? key : null
    failed.value = ok ? null : key
    window.clearTimeout(timer)
    timer = window.setTimeout(() => {
      copied.value = null
      failed.value = null
    }, ms)
  }

  onBeforeUnmount(() => window.clearTimeout(timer))
  return { copied, failed, copy }
}

/* ── Time in any zone ────────────────────────────────────────────────────────────────── */

export const TZ = {
  WIB: 'Asia/Jakarta',
  WITA: 'Asia/Makassar',
  WIT: 'Asia/Jayapura',
  SGT: 'Asia/Singapore',
  UTC: 'UTC',
} as const

const formats = new Map<string, Intl.DateTimeFormat>()

function partsIn(date: Date, tz: string): Record<string, string> {
  let f = formats.get(tz)
  if (!f) {
    f = new Intl.DateTimeFormat('en-GB', {
      timeZone: tz,
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    })
    formats.set(tz, f)
  }
  const out: Record<string, string> = {}
  for (const p of f.formatToParts(date)) out[p.type] = p.value
  return out
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export interface Zoned {
  h: number
  m: number
  s: number
  /** "Thu". */
  weekday: string
  /** "5 Nov". */
  date: string
  /** Minutes east of UTC. */
  offset: number
  /** Comparable calendar day, "2026-10-05". */
  key: string
}

/** The wall clock of a zone at `date`. */
export function zoned(date: Date, tz: string): Zoned {
  const p = partsIn(date, tz)
  const h = Number(p.hour) % 24
  const m = Number(p.minute)
  const s = Number(p.second)
  const month = MONTHS.indexOf(p.month)
  const asUtc = Date.UTC(Number(p.year), month, Number(p.day), h, m, s)
  const offset = Math.round((asUtc - date.getTime()) / 60000)
  return {
    h,
    m,
    s,
    weekday: p.weekday,
    date: `${Number(p.day)} ${p.month}`,
    offset,
    key: `${p.year}-${String(month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`,
  }
}

/** "UTC+7", "UTC+5:30", "UTC−5", "UTC". */
export function offsetText(minutes: number): string {
  if (!minutes) return 'UTC'
  const sign = minutes > 0 ? '+' : '−'
  const abs = Math.abs(minutes)
  const h = Math.floor(abs / 60)
  const m = abs % 60
  return `UTC${sign}${h}${m ? `:${String(m).padStart(2, '0')}` : ''}`
}

/** A difference in hours, "+1 h", "−7 h", "0 h". */
export function hoursText(minutes: number): string {
  if (!minutes) return '0 h'
  const sign = minutes > 0 ? '+' : '−'
  const abs = Math.abs(minutes)
  const h = abs / 60
  return `${sign}${Number.isInteger(h) ? h : h.toFixed(1)} h`
}

/* ── Data helpers for the index ──────────────────────────────────────────────────────── */

/**
 * A daily series that sits near `base`, with a few days set by hand (incidents, gaps).
 * `null` before `start` means the day was not measured yet.
 */
export function daily(
  seed: string,
  n: number,
  { base = 100, jitter = 0.02, set = {}, start = 0, decimals = 2 }: { base?: number; jitter?: number; set?: Record<number, number>; start?: number; decimals?: number } = {},
): (number | null)[] {
  const rnd = seeded(seed)
  const f = 10 ** decimals
  return Array.from({ length: n }, (_, i) => {
    const r = rnd()
    if (i < start) return null
    if (i in set) return set[i]
    return Math.round(Math.min(100, base - r * jitter) * f) / f
  })
}

export interface Cell {
  id: string
  level: Level
  note: string
}

/** A bank of cells, mostly healthy, with the exceptions written out. */
export function bank(
  prefix: string,
  n: number,
  okNote: string,
  exceptions: Record<number, [Level, string]>,
  pad = 2,
): Cell[] {
  return Array.from({ length: n }, (_, i) => {
    const e = exceptions[i + 1]
    return {
      id: `${prefix}${String(i + 1).padStart(pad, '0')}`,
      level: e ? e[0] : 'good',
      note: e ? e[1] : okNote,
    }
  })
}
