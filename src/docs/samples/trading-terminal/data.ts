/**
 * Markets terminal · Bursa Nusantara (BNX), a fictional exchange. Each instrument has one
 * seeded one-minute price path over 66 trading days; every timeframe, the day's statistics,
 * the watchlist sparkline and the order book are derived from it, so they all agree.
 * Session 1 09:00–12:00, session 2 13:30–15:50 WIB. "Now" is Tue 3 Nov 2026, 10:44 WIB.
 */
import type { CandlePoint } from '@/design-system'

export type Timeframe = '1m' | '5m' | '15m' | '1H' | '1D'
export const timeframes: { label: string; value: Timeframe }[] = [
  { label: '1m', value: '1m' },
  { label: '5m', value: '5m' },
  { label: '15m', value: '15m' },
  { label: '1H', value: '1H' },
  { label: '1D', value: '1D' },
]

export const LOT = 100
export const clockStart = { h: 10, m: 44, s: 12 }

export interface Instrument {
  ticker: string
  name: string
  sector: string
  /** Last price at 10:44 WIB. */
  last: number
  /** Change on the previous close, %. */
  change: number
  /** Shares outstanding, billions. */
  shares: number
  /** Typical lots traded per minute. */
  liquidity: number
  /** Daily volatility. */
  vol: number
}

export const instruments: Instrument[] = [
  { ticker: 'SGRD', name: 'PT Sagara Daya Tbk', sector: 'Utilities · Renewables', last: 4820, change: 2.34, shares: 15.0, liquidity: 4600, vol: 0.026 },
  { ticker: 'ARNK', name: 'PT Arunika Bank Tbk', sector: 'Financials · Banks', last: 2140, change: -0.93, shares: 24.6, liquidity: 7800, vol: 0.017 },
  { ticker: 'NSLG', name: 'PT Nusantara Logistik Tbk', sector: 'Industrials · Logistics', last: 1385, change: 1.1, shares: 8.2, liquidity: 3100, vol: 0.019 },
  { ticker: 'SMNG', name: 'PT Bank Samudra Niaga Tbk', sector: 'Financials · Banks', last: 7250, change: 0.35, shares: 31.4, liquidity: 5200, vol: 0.013 },
  { ticker: 'KNCN', name: 'PT Kencana Properti Tbk', sector: 'Real estate · Developers', last: 458, change: -2.98, shares: 19.1, liquidity: 9400, vol: 0.031 },
  { ticker: 'TRBA', name: 'PT Tirta Baja Tbk', sector: 'Materials · Steel', last: 3610, change: 0.84, shares: 6.4, liquidity: 1800, vol: 0.022 },
  { ticker: 'MRPI', name: 'PT Merapi Semen Tbk', sector: 'Materials · Cement', last: 9875, change: -0.25, shares: 5.9, liquidity: 900, vol: 0.016 },
  { ticker: 'LNTR', name: 'PT Lentera Telekomunikasi Tbk', sector: 'Communication · Telecom', last: 2890, change: 0.7, shares: 99.1, liquidity: 6100, vol: 0.012 },
]

export const composite = { name: 'BNX Composite', value: 7412.36, change: 0.41 }

/* ── Price helpers ─────────────────────────────────────────────────────────────────────── */

/** BNX tick sizes by price band. */
export function tickFor(price: number) {
  if (price < 200) return 1
  if (price < 500) return 2
  if (price < 2000) return 5
  if (price < 5000) return 10
  return 25
}

const roundTo = (value: number, tick: number) => Math.round(value / tick) * tick

function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function seedOf(text: string) {
  let h = 2166136261
  for (const c of text) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  return h >>> 0
}

function gaussian(rand: () => number) {
  const u = Math.max(1e-9, rand())
  const v = rand()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

/* ── The trading calendar ──────────────────────────────────────────────────────────────── */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAYS = 66
const NOW_MINUTE = 10 * 60 + 44

/** Trading days, oldest first, ending today (Tue 3 Nov 2026). */
const tradingDays: { label: string; short: string }[] = (() => {
  const out: { label: string; short: string }[] = []
  const d = new Date(Date.UTC(2026, 10, 3))
  while (out.length < DAYS) {
    const wd = d.getUTCDay()
    if (wd !== 0 && wd !== 6) out.push({ label: `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`, short: `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}` })
    d.setUTCDate(d.getUTCDate() - 1)
  }
  return out.reverse()
})()

/** Session minutes as minutes after midnight. */
const SESSION: number[] = [
  ...Array.from({ length: 180 }, (_, i) => 9 * 60 + i),
  ...Array.from({ length: 140 }, (_, i) => 13 * 60 + 30 + i),
]
const TODAY_SESSION = SESSION.filter((m) => m <= NOW_MINUTE)

const hhmm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`

export interface MinuteBar extends CandlePoint {
  day: number
  minute: number
  volume: number
}

export interface Series {
  instrument: Instrument
  tick: number
  minutes: MinuteBar[]
  prevClose: number
  /** Index of today's first minute. */
  todayStart: number
}

function buildSeries(instrument: Instrument): Series {
  const rand = mulberry32(seedOf(instrument.ticker))
  const sigma = instrument.vol / Math.sqrt(SESSION.length)
  const slots: { day: number; minute: number; ret: number }[] = []
  for (let day = 0; day < DAYS; day++) {
    const minutes = day === DAYS - 1 ? TODAY_SESSION : SESSION
    minutes.forEach((minute, i) => {
      // The overnight gap rides on the first minute of the day.
      const gap = i === 0 && day > 0 ? gaussian(rand) * instrument.vol * 0.3 : 0
      slots.push({ day, minute, ret: gaussian(rand) * sigma + gap })
    })
  }
  // Today's returns are shifted so the day closes on the instrument's change.
  const todayStart = slots.length - TODAY_SESSION.length
  const target = Math.log(1 + instrument.change / 100)
  const actual = slots.slice(todayStart).reduce((s, x) => s + x.ret, 0)
  const shift = (target - actual) / TODAY_SESSION.length
  for (let i = todayStart; i < slots.length; i++) slots[i].ret += shift

  // Anchor the path on today's last price.
  const tick = tickFor(instrument.last)
  let cum = 0
  const cums = slots.map((s) => (cum += s.ret))
  const end = cums[cums.length - 1]
  const closes = cums.map((c) => instrument.last * Math.exp(c - end))

  const minutes: MinuteBar[] = slots.map((s, i) => {
    const close = roundTo(closes[i], tick)
    // Each bar opens on the previous close; the day's first bar opens on most of the gap.
    const isDayOpen = i > 0 && s.minute === SESSION[0]
    const o = i === 0 ? close : roundTo(isDayOpen ? closes[i - 1] * Math.exp(s.ret * 0.6) : closes[i - 1], tick)
    const wiggle = Math.abs(gaussian(rand)) * sigma * instrument.last * 1.5
    const high = Math.max(o, close, roundTo(Math.max(o, close) + wiggle, tick))
    const low = Math.min(o, close, roundTo(Math.min(o, close) - wiggle, tick))
    // Volume: heavier at the open and the close of each session.
    const pos = SESSION.indexOf(s.minute)
    const inSession = pos < 180 ? pos / 179 : (pos - 180) / 139
    const smile = 0.55 + 1.6 * Math.pow(inSession - 0.5, 2) * 2
    const volume = Math.max(10, Math.round(instrument.liquidity * smile * Math.exp(gaussian(rand) * 0.45)))
    return { t: hhmm(s.minute), day: s.day, minute: s.minute, open: o, high, low, close, volume }
  })

  const prevClose = minutes[todayStart - 1].close
  return { instrument, tick, minutes, prevClose, todayStart }
}

export const seriesByTicker: Record<string, Series> = Object.fromEntries(instruments.map((i) => [i.ticker, buildSeries(i)]))

/* ── Aggregation ───────────────────────────────────────────────────────────────────────── */

function bucketKey(bar: MinuteBar, tf: Timeframe) {
  if (tf === '1D') return `${bar.day}`
  const size = tf === '1m' ? 1 : tf === '5m' ? 5 : tf === '15m' ? 15 : 60
  // Buckets restart with each session, so a bar never spans the lunch break.
  const sessionStart = bar.minute >= 13 * 60 + 30 ? 13 * 60 + 30 : 9 * 60
  const slot = Math.floor((bar.minute - sessionStart) / size)
  return `${bar.day}-${sessionStart}-${slot}`
}

/** The last `count` bars of a timeframe, labelled for the x axis. */
export function candles(series: Series, tf: Timeframe, count = 64): CandlePoint[] {
  const out: (CandlePoint & { day: number; minute: number })[] = []
  let key = ''
  for (const bar of series.minutes) {
    const k = bucketKey(bar, tf)
    if (k !== key) {
      out.push({ t: '', day: bar.day, minute: bar.minute, open: bar.open, high: bar.high, low: bar.low, close: bar.close, volume: bar.volume })
      key = k
    } else {
      const c = out[out.length - 1]
      c.high = Math.max(c.high, bar.high)
      c.low = Math.min(c.low, bar.low)
      c.close = bar.close
      c.volume = (c.volume ?? 0) + bar.volume
    }
  }
  const tail = out.slice(-count)
  return tail.map((c, i) => {
    const newDay = i === 0 || tail[i - 1].day !== c.day
    const t = tf === '1D' ? tradingDays[c.day].label : newDay && tf !== '1m' ? tradingDays[c.day].short : hhmm(c.minute)
    return { t, open: c.open, high: c.high, low: c.low, close: c.close, volume: c.volume }
  })
}

export function dayStats(series: Series) {
  const today = series.minutes.slice(series.todayStart)
  const volume = today.reduce((s, b) => s + b.volume, 0)
  const value = today.reduce((s, b) => s + b.volume * LOT * ((b.high + b.low + b.close) / 3), 0)
  return {
    open: today[0].open,
    high: Math.max(...today.map((b) => b.high)),
    low: Math.min(...today.map((b) => b.low)),
    last: today[today.length - 1].close,
    prevClose: series.prevClose,
    volume,
    value,
    vwap: value / (volume * LOT),
  }
}

/** Today's path every five minutes, for the watchlist. */
export function intraday(series: Series) {
  const today = series.minutes.slice(series.todayStart)
  return today.filter((_, i) => i % 5 === 0 || i === today.length - 1).map((b) => b.close)
}

/* ── Order book and tape ───────────────────────────────────────────────────────────────── */

export interface Level {
  price: number
  lots: number
  orders: number
}

export function book(series: Series, last: number, levels = 10, salt = 0) {
  const rand = mulberry32(seedOf(series.instrument.ticker) + 17 + salt)
  const tick = series.tick
  const size = () => {
    const base = series.instrument.liquidity * (0.15 + rand() * 0.6)
    return Math.round(rand() < 0.12 ? base * (3 + rand() * 4) : base)
  }
  const bestBid = last
  const bids: Level[] = Array.from({ length: levels }, (_, i) => {
    const lots = size()
    return { price: bestBid - i * tick, lots, orders: Math.max(1, Math.round(lots / (60 + rand() * 140))) }
  })
  const asks: Level[] = Array.from({ length: levels }, (_, i) => {
    const lots = size()
    return { price: bestBid + (i + 1) * tick, lots, orders: Math.max(1, Math.round(lots / (60 + rand() * 140))) }
  })
  return { bids, asks }
}

export interface Trade {
  id: number
  time: string
  price: number
  lots: number
  side: 'buy' | 'sell'
}

export function initialTape(series: Series, count = 28): Trade[] {
  const rand = mulberry32(seedOf(series.instrument.ticker) + 99)
  const tick = series.tick
  const last = series.instrument.last
  const out: Trade[] = []
  let secs = clockStart.h * 3600 + clockStart.m * 60 + clockStart.s
  for (let i = 0; i < count; i++) {
    const side = rand() < 0.55 ? 'buy' : 'sell'
    const price = side === 'buy' ? last + (rand() < 0.2 ? tick : 0) : last - (rand() < 0.75 ? 0 : tick)
    out.push({ id: count - i, time: clock(secs), price, lots: lotSize(rand, series.instrument.liquidity), side })
    secs -= 1 + Math.floor(rand() * 5)
  }
  return out
}

export function lotSize(rand: () => number, liquidity: number) {
  const r = rand()
  if (r > 0.97) return Math.round(liquidity * (0.2 + rand() * 0.3))
  if (r > 0.8) return Math.round(20 + rand() * 480)
  return Math.round(1 + rand() * 60)
}

/** Session state for a minute of the day. */
export function sessionAt(minute: number): 'session-1' | 'break' | 'session-2' | 'closed' {
  if (minute >= 9 * 60 && minute < 12 * 60) return 'session-1'
  if (minute >= 12 * 60 && minute < 13 * 60 + 30) return 'break'
  if (minute >= 13 * 60 + 30 && minute < 15 * 60 + 50) return 'session-2'
  return 'closed'
}

export const hhmmOf = hhmm

export const clock = (secs: number) => {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(Math.floor(secs / 3600) % 24)}:${pad(Math.floor(secs / 60) % 60)}:${pad(secs % 60)}`
}

export { mulberry32 }

/* ── Portfolio ─────────────────────────────────────────────────────────────────────────── */

export interface Position {
  ticker: string
  lots: number
  avg: number
}

export const positions: Position[] = [
  { ticker: 'SGRD', lots: 120, avg: 4612 },
  { ticker: 'NSLG', lots: 300, avg: 1420 },
  { ticker: 'SMNG', lots: 40, avg: 6980 },
  { ticker: 'LNTR', lots: 150, avg: 2955 },
  { ticker: 'TRBA', lots: 80, avg: 3402 },
]

export interface Order {
  id: string
  time: string
  ticker: string
  side: 'buy' | 'sell'
  type: 'Limit' | 'Market'
  price: number | null
  lots: number
  filled: number
  status: 'Open' | 'Partial' | 'Filled' | 'Withdrawn'
}

export const openOrders: Order[] = [
  { id: 'ORD-0912-4471', time: '09:12:44', ticker: 'ARNK', side: 'buy', type: 'Limit', price: 2120, lots: 200, filled: 0, status: 'Open' },
  { id: 'ORD-0931-4608', time: '09:31:02', ticker: 'KNCN', side: 'sell', type: 'Limit', price: 470, lots: 500, filled: 120, status: 'Partial' },
]

/** Cash in the trading account, IDR. */
export const buyingPower = 1_250_000_000
/** Broker fee on buys, and fee plus 0.1% final tax on sells. */
export const feeRate = { buy: 0.0015, sell: 0.0025 }

/* ── Formatting ────────────────────────────────────────────────────────────────────────── */

const MINUS = '−'
export const price = (v: number) => new Intl.NumberFormat('en-US').format(v)
export const idr = (v: number) => `Rp ${new Intl.NumberFormat('id-ID').format(Math.round(v))}`
export const signedIdr = (v: number) => `${v < 0 ? MINUS : '+'}${idr(Math.abs(v)).replace('Rp ', 'Rp ')}`
export const lots = (v: number) => new Intl.NumberFormat('en-US').format(v)
export const compact = (v: number) =>
  new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(v)
export const pct = (v: number, digits = 2) => `${v < 0 ? MINUS : v > 0 ? '+' : ''}${Math.abs(v).toFixed(digits)}%`
export const signed = (v: number) => `${v < 0 ? MINUS : v > 0 ? '+' : ''}${price(Math.abs(v))}`
/** IDR in trillions/billions, English decimals: "IDR 72.3 tn". */
export function idrScale(v: number) {
  if (v >= 1e12) return `${(v / 1e12).toFixed(1)} tn`
  if (v >= 1e9) return `${(v / 1e9).toFixed(1)} bn`
  return `${(v / 1e6).toFixed(1)} M`
}
