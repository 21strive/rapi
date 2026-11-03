/* Sample data for the Charts page. Seeded so it looks lived-in but never changes between reloads. */
import type { BulletRow, CandlePoint, GanttRow, RadarContact, ScatterSeries, WaterfallStep } from '@/design-system'

const wave = (n: number, base: number, amp: number, seed: number) =>
  Array.from({ length: n }, (_, i) =>
    base + amp * (0.6 * Math.sin(i / 2.1 + seed) + 0.3 * Math.sin(i / 0.9 + seed * 2) + 0.1 * Math.cos(i * 1.7)),
  )
const r1 = (v: number) => Math.round(v * 10) / 10

/* Line · liquidity with a forecast and a minimum buffer */
export const weeks = Array.from({ length: 19 }, (_, i) => `W${String(i + 32).padStart(2, '0')}`)
export const liquidity = wave(19, 412, 38, 0.4).map((v, i) => r1(v + i * 2.4))
export const liquidityBuffer = 360

/* Line · latency by region, 24 hours, step curve */
export const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`)
export const latency = [
  { name: 'Jakarta', values: wave(24, 182, 36, 0.2).map(Math.round) },
  { name: 'Singapore', values: wave(24, 128, 22, 1.7).map(Math.round) },
  { name: 'Frankfurt', values: wave(24, 236, 48, 3.1).map((v, i) => Math.round(i === 17 ? v + 120 : v)) },
]

/* Columns · settled volume against targets */
export const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
export const settled = [18.4, 22.1, 19.6, 24.8, 27.3, 9.2, 6.1]
export const settledTargets = [20, 20, 20, 22, 25, 8, 8]

/* Columns · status codes by hour (status colours: these series mean good and bad) */
export const statusHours = ['00', '02', '04', '06', '08', '10', '12', '14', '16', '18', '20', '22']
export const statusCodes = [
  { name: '2xx', values: [412, 388, 365, 520, 940, 1210, 1302, 1268, 1190, 1040, 820, 560], color: 'var(--r-chart-1)' },
  { name: '4xx', values: [22, 18, 17, 25, 48, 66, 71, 64, 58, 50, 38, 27], color: 'var(--r-status-warning)' },
  { name: '5xx', values: [2, 1, 1, 3, 6, 9, 41, 12, 7, 5, 3, 2], color: 'var(--r-status-critical)' },
]

/* Bar list · top paths */
export const topPaths = [
  { label: '/v1/payments', values: 482_120 },
  { label: '/v1/accounts/:id', values: 351_904 },
  { label: '/v1/transfers', values: 228_310 },
  { label: '/v1/fx/quotes', values: 141_772 },
  { label: '/v1/statements', values: 96_480 },
  { label: '/v1/webhooks', values: 41_205 },
]

/* Bullet · quarter targets */
export const quarter: BulletRow[] = [
  { label: 'Revenue', sublabel: 'IDR bn', value: 182.4, target: 200, ranges: [140, 180, 220], previous: 166.2 },
  { label: 'Net new accounts', sublabel: 'thousands', value: 48.2, target: 45, ranges: [30, 42, 55] },
  { label: 'Card spend', sublabel: 'IDR bn', value: 61.7, target: 72, ranges: [50, 65, 80], previous: 58.9 },
  { label: 'Uptime', sublabel: 'percent', value: 99.96, target: 99.95, ranges: [99.5, 99.9, 100] },
]

/* Waterfall · operating cash flow */
export const cashflow: WaterfallStep[] = [
  { label: 'Opening', value: 48.2, kind: 'total' },
  { label: 'Collections', value: 31.4 },
  { label: 'Interest', value: 2.1 },
  { label: 'Payroll', value: -14.8 },
  { label: 'Vendors', value: -9.6 },
  { label: 'Tax', value: -4.2 },
  { label: 'FX', value: -1.3 },
  { label: 'Closing', value: 0, kind: 'total' },
]

/* Candles · 5-minute bars */
export const candles: CandlePoint[] = (() => {
  const out: CandlePoint[] = []
  let price = 142.3
  for (let i = 0; i < 40; i++) {
    const drift = Math.sin(i / 4.3) * 0.9 + Math.cos(i / 1.7) * 0.6 + (i > 26 ? 0.35 : -0.05)
    const open = price
    const close = Math.round((open + drift) * 100) / 100
    const high = Math.round((Math.max(open, close) + 0.3 + Math.abs(Math.sin(i * 2.1)) * 0.9) * 100) / 100
    const low = Math.round((Math.min(open, close) - 0.3 - Math.abs(Math.cos(i * 1.3)) * 0.8) * 100) / 100
    const minutes = 9 * 60 + 30 + i * 5
    const t = `${String(Math.floor(minutes / 60) % 24).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
    out.push({ t, open, high, low, close, volume: Math.round(180_000 + Math.abs(Math.sin(i * 0.7)) * 420_000 + (i === 30 ? 600_000 : 0)) })
    price = close
  }
  return out
})()

/* Scatter · credit exposure vs probability of default */
export const exposure: ScatterSeries[] = [
  {
    name: 'Corporate',
    points: [
      { x: 0.4, y: 182, label: 'PT Arunika Energi' },
      { x: 0.7, y: 141 },
      { x: 1.1, y: 96 },
      { x: 0.9, y: 120 },
      { x: 2.6, y: 154, label: 'PT Samudra Logistik' },
      { x: 1.6, y: 72 },
    ],
  },
  {
    name: 'SME',
    points: [
      { x: 1.8, y: 38 },
      { x: 2.2, y: 44 },
      { x: 3.1, y: 29 },
      { x: 2.7, y: 52 },
      { x: 4.4, y: 61, label: 'CV Kopi Lereng' },
      { x: 3.6, y: 33 },
      { x: 1.4, y: 47 },
    ],
  },
  {
    name: 'Retail',
    points: [
      { x: 3.8, y: 12 },
      { x: 4.9, y: 9 },
      { x: 5.6, y: 14 },
      { x: 6.4, y: 8 },
      { x: 4.2, y: 18 },
      { x: 7.1, y: 11 },
    ],
  },
]

/* Heatmap · sign-ins by weekday and hour */
export const heatRows = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
export const heatCols = Array.from({ length: 12 }, (_, i) => String(i * 2).padStart(2, '0'))
export const heat = heatRows.map((_, r) =>
  heatCols.map((_, c) => {
    const work = r < 5 ? 1 : 0.45
    const day = Math.max(0, Math.sin(((c - 3) / 9) * Math.PI))
    return Math.max(0, Math.round((40 + 880 * day * work + 60 * Math.sin(r * 1.3 + c)) / 10) * 10)
  }),
)

/* Gantt · ground-station passes (minutes after 00:00 UTC) */
export const passDomain: [number, number] = [6 * 60, 14 * 60]
export const passTicks = [6, 7, 8, 9, 10, 11, 12, 13, 14].map((h) => h * 60)
export const passNow = 9 * 60 + 41
export const passes: GanttRow[] = [
  {
    id: 'svb',
    label: 'Svalbard',
    meta: 'SVB-2 · 13 M',
    items: [
      { start: 382, end: 394, label: 'RS-07' },
      { start: 476, end: 489, label: 'RS-11' },
      { start: 571, end: 583, label: 'RS-07' },
      { start: 664, end: 677, label: 'RS-11' },
      { start: 760, end: 772, label: 'RS-07' },
    ],
  },
  {
    id: 'pta',
    label: 'Punta Arenas',
    meta: 'PTA-1 · 7.3 M',
    items: [
      { start: 410, end: 421, label: 'RS-04' },
      { start: 540, end: 600, label: 'Maintenance', tone: 'context', hatch: true },
      { start: 702, end: 714, label: 'RS-04' },
    ],
  },
  {
    id: 'sin',
    label: 'Singapore',
    meta: 'SIN-3 · 9 M',
    items: [
      { start: 455, end: 466, label: 'RS-02' },
      { start: 590, end: 604, label: 'RS-09', tone: 'signal' },
      { start: 648, end: 648, label: 'Burn window', milestone: true },
      { start: 735, end: 747, label: 'RS-02' },
    ],
  },
  {
    id: 'awa',
    label: 'Awarua',
    meta: 'AWA-1 · 13 M',
    items: [
      { start: 396, end: 409, label: 'RS-09' },
      { start: 520, end: 533, label: 'RS-04' },
      { start: 618, end: 640, label: 'RS-11 · tentative', tone: 'context', hatch: true },
      { start: 790, end: 803, label: 'RS-09' },
    ],
  },
]

/* Radar · air picture */
export const tracks: RadarContact[] = [
  { id: 'T-104', bearing: 34, range: 42, kind: 'friendly', heading: 210 },
  { id: 'T-117', bearing: 92, range: 71, kind: 'unknown', heading: 280 },
  { id: 'T-122', bearing: 148, range: 58, kind: 'neutral', heading: 330 },
  { id: 'T-131', bearing: 212, range: 86, kind: 'hostile', heading: 40 },
  { id: 'T-139', bearing: 287, range: 24, kind: 'friendly', heading: 90 },
  { id: 'T-142', bearing: 322, range: 64, kind: 'unknown', heading: 150 },
]

/* Sparklines · watchlist */
export const watchlist = [
  { symbol: 'STRV', name: '21 Strive', price: 142.3, change: 1.84, values: wave(24, 140, 3, 0.3).map((v, i) => v + i * 0.12) },
  { symbol: 'IDR', name: 'USD/IDR', price: 15_642, change: -0.32, values: wave(24, 15_700, 40, 1.4).map((v, i) => v - i * 3) },
  { symbol: 'XAU', name: 'Gold', price: 2_384.1, change: 0.41, values: wave(24, 2_370, 12, 2.2).map((v, i) => v + i * 0.6) },
  { symbol: 'BTC', name: 'Bitcoin', price: 68_420, change: -2.12, values: wave(24, 70_000, 900, 0.9).map((v, i) => v - i * 60) },
]

/* Range bars · response time p5–p95 by day */
export const rangeDays = ['1 Nov', '2 Nov', '3 Nov', '4 Nov', '5 Nov', '6 Nov', '7 Nov', '8 Nov', '9 Nov', '10 Nov', '11 Nov', '12 Nov', '13 Nov', '14 Nov']
export const responseRanges: [number, number][] = rangeDays.map((_, i) => {
  const lo = Math.round(62 + 8 * Math.sin(i / 1.8))
  const hi = Math.round(lo + 140 + 40 * Math.cos(i / 2.3) + (i === 9 ? 120 : 0))
  return [lo, hi]
})

/* Dot matrix · shipments per week */
export const shipWeeks = Array.from({ length: 16 }, (_, i) => `W${i + 30}`)
export const shipments = [
  { name: 'Domestic', values: wave(16, 3400, 900, 0.6).map(Math.round) },
  { name: 'Export', values: wave(16, 1500, 500, 2.4).map(Math.round) },
]

/* Radial gauge · storage by tier */
export const storage = [
  { label: 'Hot', value: 182 },
  { label: 'Warm', value: 96 },
  { label: 'Cold', value: 48 },
]
