/**
 * Treasury, now · the same group treasury as the Then screen: PT Nusantara Logistik, Tuesday
 * 3 Nov 2026, mid-morning WIB. Every figure the Then screen shows comes from its own data module,
 * so the pair compares like for like. What is new here is what Simpul works out from the same
 * series: the Q3 dividend moved to the 20th, the days inside W48 and W49 that a weekly chart
 * hides, the pending USD sweep and the EUR hedge.
 */
import type { TrailItem } from '../_kit/desk'
import {
  type Account,
  type Payment,
  accounts,
  availableChange,
  availableLiquidity,
  bn,
  changeOver,
  fixings,
  flows,
  fx,
  fxRows,
  lastFour,
  lcr,
  lcrPolicy,
  liquidity,
  minimumBuffer,
  money,
  nowWeek,
  payments,
  rangeBaseline,
  signedBn,
  toIdrBn,
  troughValue,
  troughWeek,
  undrawnFacility,
  weekLabels,
} from '../treasury/data'

export type { Account, Payment }
export {
  accounts,
  bn,
  fixings,
  fx,
  fxRows,
  lastFour,
  liquidity,
  minimumBuffer,
  money,
  nowWeek,
  signedBn,
  toIdrBn,
  troughValue,
  troughWeek,
  weekLabels,
}

export const businessDay = 'Tue 3 Nov 2026'

/** The people on the screen: the treasurer who talks to Simpul and the CFO who signs second. */
export const people = { you: 'Ayu Lestari', cfo: 'Rizky Pratama' }

/* ── The cash position, as on the Then screen's KPI row ────────────────────────────────── */

const today = changeOver('today')
const flowToday = flows('today')

export const position = {
  total: today.now,
  totalChange: today.pct,
  baseline: rangeBaseline.today,
  available: availableLiquidity(),
  availableChange: availableChange('today'),
  undrawn: undrawnFacility,
  net: flowToday.net,
  inflow: flowToday.inflow,
  outflow: flowToday.outflow,
  lcr: lcr.today,
  lcrPolicy,
}

/* ── The dividend: set by the board on 28 Oct for Wed 2 Dec; Ayu asks about the 20th ───── */

export const dividend = {
  id: 'PAY-26112001',
  amount: 150_000_000_000,
  bn: 150,
  board: '28 Oct',
  planned: 'Wed 2 Dec',
  proposed: 'Fri 20 Nov',
  value: 'Fri 20 Nov 2026, 09:00 WIB',
}

/** Index of each forecast week in `weekLabels` (W33 is 0). */
const W = (week: number) => week - 33

/** The weekly closes with the dividend paid in W47 (19 or 20 Nov): W47 and W48 carry it, W49 no longer does. */
export const closesOn20 = liquidity.map((v, i) => (i === W(47) || i === W(48) ? v - dividend.bn : v))

const r1 = (v: number) => Math.round(v * 10) / 10

/** The 13-week chart: the plan, and the draft as a branch from the last shared week (W46). */
export function forecastSeries(state: 'draft' | 'scheduled' | 'dropped', day = 20) {
  if (state === 'scheduled') return [{ name: `Plan, dividend ${day} Nov`, values: closesOn20.map(r1) }]
  const plan = { name: 'Plan, dividend 2 Dec', values: liquidity.map(r1) }
  if (state === 'dropped') return [plan]
  return [
    plan,
    {
      name: `Draft, dividend ${day} Nov`,
      values: closesOn20.map((v, i) => (i < W(46) ? null : r1(v))),
      color: 'var(--r-chart-3)',
    },
  ]
}

/* ── Inside the weeks: the days a weekly close hides ─────────────────────────────────────── */

interface Day {
  day: string
  flow: number
  note: string
}

/** W48 (23–27 Nov): payroll, then the supplier run, then month-end collections. Sums to the W48 step. */
const w48Step = liquidity[W(48)] - liquidity[W(47)]
const w48: Day[] = [
  { day: 'Mon 23 Nov', flow: 0, note: 'Opening' },
  { day: 'Tue 24 Nov', flow: -126.4, note: 'Payroll' },
  { day: 'Wed 25 Nov', flow: -131.2, note: 'Supplier run' },
  { day: 'Thu 26 Nov', flow: 54.6, note: 'Collections' },
]
w48.push({ day: 'Fri 27 Nov', flow: w48Step - w48.reduce((s, d) => s + d.flow, 0), note: 'Collections' })

/** W49 (30 Nov–4 Dec) without the dividend: the tax instalment on Monday, receipts after. */
const w49Step = liquidity[W(49)] - liquidity[W(48)] + dividend.bn
const w49: Day[] = [
  { day: 'Mon 30 Nov', flow: -96.5, note: 'Corporate tax instalment' },
  { day: 'Tue 1 Dec', flow: 20, note: 'Receipts' },
  { day: 'Wed 2 Dec', flow: 12, note: 'Receipts' },
  { day: 'Thu 3 Dec', flow: 15.4, note: 'Receipts' },
]
w49.push({ day: 'Fri 4 Dec', flow: w49Step - w49.reduce((s, d) => s + d.flow, 0), note: 'Receipts' })

function walk(open: number, days: Day[], extra: Record<string, number> = {}) {
  let level = open
  return days.map((d) => {
    level += d.flow + (extra[d.day] ?? 0)
    return { ...d, level, flow: d.flow + (extra[d.day] ?? 0) }
  })
}

/** W48 day by day with the dividend on the 20th: the working behind "why the 25th". */
export const week48 = walk(closesOn20[W(47)], w48)

/** The lowest day with the dividend on the 20th, and on 2 Dec (the plan). */
const draftDays = [...week48, ...walk(closesOn20[W(48)], w49)]
const planDays = [...walk(liquidity[W(47)], w48), ...walk(liquidity[W(48)], w49, { 'Wed 2 Dec': -dividend.bn })]
const lowest = (days: { day: string; level: number }[]) => days.reduce((a, b) => (b.level < a.level ? b : a))

export const lowDraft = lowest(draftDays)
export const lowPlan = lowest(planDays)

/** If month-end collections (26–27 Nov) slip a week to 3–4 Dec, with the dividend on the 20th. */
const slipped = [
  ...walk(closesOn20[W(47)], w48, { 'Thu 26 Nov': -w48[3].flow, 'Fri 27 Nov': -w48[4].flow }),
]
export const slip = (() => {
  const w49Days = walk(slipped[slipped.length - 1].level, w49, { 'Thu 3 Dec': w48[3].flow, 'Fri 4 Dec': w48[4].flow })
  const all = [...slipped, ...w49Days]
  const low = lowest(all)
  const under = all.filter((d) => d.level < minimumBuffer)
  const draw = 50
  const rate = 7.4
  const nights = 3
  return {
    low,
    under,
    draw,
    rate,
    nights,
    interest: Math.round((draw * 1e9 * (rate / 100) * nights) / 360),
  }
})()

/* ── Needs you: this week's payments, the USD sweep and the EUR hedge ────────────────────── */

/** The four payments waiting for a signature, in release order; the two scheduled ones stay quiet. */
export const openPayments: Payment[] = payments
  .filter((p) => p.status === 'awaiting')
  .sort((a, b) => releaseOrder(a) - releaseOrder(b))

function releaseOrder(p: Payment) {
  const [day] = p.release.split(' ')
  return Number(day) * 100 + Number(p.release.match(/(\d\d):/)?.[1] ?? 0)
}

export const openPaymentsBn = openPayments.reduce((s, p) => s + toIdrBn(p.amount, p.currency), 0)
export const scheduledPayments = payments.filter((p) => p.status === 'scheduled')

/** Bremer Lift is due Sat 7 Nov; Simpul moved its release to Friday at 08:40. */
export const bremer = { id: 'PAY-26110424', moved: '6 Nov 15:00 WIB', was: '7 Nov 09:00 WIB' }

/** Release time of a payment as a short "4 Nov 10:00". */
export function releaseShort(p: Payment, bremerMoved: boolean) {
  const release = p.id === bremer.id && !bremerMoved ? bremer.was : p.release.replace(' 2026', '')
  return release.replace(' WIB', '')
}

const usdOperating = accounts.find((a) => a.id === 'ACC-08') as Account
const sgdOperating = accounts.find((a) => a.id === 'ACC-07') as Account

export const sweep = {
  amount: usdOperating.balance - 6_000_000,
  from: 'ACC-08',
  to: 'ACC-09',
  at: '17:00 ET',
  atWib: '05:00 WIB Wed',
}

/** The SGD excess Simpul held back: Meridian Port's SGD payment leaves the same account on 6 Nov. */
export const sgdHeld = sgdOperating.balance - 4_500_000

const eurUsd = fx.EUR / fx.USD
const eurLimit = fxRows.find((r) => r.label === 'EUR')
export const hedge = {
  id: 'FXF-26110307',
  eur: 1_500_000,
  rate: 18_769,
  points: 18_769 - fx.EUR,
  value: 'Fri 4 Dec 2026',
  bank: 'Nordhafen Bank',
  limit: eurLimit?.target ?? 8,
  before: eurLimit?.value ?? 7.1,
}

/** EUR exposure in USD M eq. after selling `eur` forward, and its share of the limit. */
export function eurAfter(eur: number) {
  const value = hedge.before - (eur * eurUsd) / 1e6
  return { value, pct: Math.round((value / hedge.limit) * 100) }
}
export const eurBeforePct = Math.round((hedge.before / hedge.limit) * 100)

/* ── The cash wall: every account in IDR bn eq., the exceptions named ───────────────────── */

const flagOf: Partial<Record<Account['status'], { label: string; tone: 'warning' | 'neutral' | 'brand' }>> = {
  low: { label: 'Low', tone: 'warning' },
  term: { label: 'Term', tone: 'neutral' },
  restricted: { label: 'Restricted', tone: 'neutral' },
  sweep: { label: 'Sweep pending', tone: 'brand' },
}

/** "USD 6.24M", "JPY 182.45M". */
export function compact(value: number, currency: string) {
  return `${currency} ${(value / 1e6).toFixed(2)}M`
}

export const wall = accounts.map((a) => ({
  id: a.id,
  name: a.name,
  bank: a.bank,
  last4: lastFour(a.number),
  currency: a.currency,
  balance: a.balance,
  bn: a.idr / 1e9,
  native: a.currency === 'IDR' ? '' : compact(a.balance, a.currency),
  flag: flagOf[a.status],
}))

/* ── The record: what Simpul did before Ayu asked anything ───────────────────────────────── */

export const fixingLine = fixings.map((f) => `${f.pair} ${bn(f.rate, f.digits)}`).join(' · ')

export const morning: TrailItem[] = [
  { id: 'fixing', at: '10:00', who: 'Simpul', text: 'Recorded the 10:00 WIB fixing', detail: fixingLine },
  {
    id: 'sgd-held',
    at: '09:30',
    who: 'Simpul',
    text: 'Held the SGD sweep for Meridian Port',
    detail: `ACC-07 keeps ${money(sgdHeld, 'SGD')} for the 6 Nov payment`,
    canRevert: true,
  },
  {
    id: 'checked',
    at: '09:12',
    who: 'Simpul',
    text: 'Checked the 4 open payments',
    detail: 'Invoices match · payee banks unchanged',
  },
  {
    id: 'bremer',
    at: '08:40',
    who: 'Simpul',
    text: 'Moved Bremer Lift to Fri 6 Nov',
    detail: `7 Nov is a Saturday · was ${bremer.was}`,
    canRevert: true,
  },
  {
    id: 'va',
    at: '08:06',
    who: 'Simpul',
    text: 'Matched the 08:00 VA settlement',
    detail: `${money(24_300_000_000, 'IDR')} · 1,862 receipts · ACC-02`,
  },
  { id: 'mt940', at: '07:30', who: 'Simpul', text: 'Pulled overnight statements', detail: 'MT940 · 12 accounts at 8 banks' },
]

/* ── Formatting ───────────────────────────────────────────────────────────────────────────── */

/** "EUR 1,500,000": a notional, no cents. */
export const eurText = (value: number) => `EUR ${bn(value, 0)}`

/** "EUR 1.5M", for a dense line. */
export const eurShort = (value: number) => `EUR ${Number((value / 1e6).toFixed(2))}M`

/** "Rp 25.000.000.000". */
export const rp = (value: number) => money(value, 'IDR')

/** "IDR 150 bn", "IDR 12.48 bn" for prose. */
export function idrBn(value: number, digits = 0) {
  return `IDR ${bn(value, digits)} bn`
}

/** The Then and Now cost of the opening job, counted in DESIGN.md's terms. */
export const cost = {
  then: [
    { value: 2, unit: 'steps' },
    { value: 5, unit: 'fields' },
  ],
  now: [
    { value: 1, unit: 'sentence' },
    { value: 1, unit: 'check' },
    { value: 1, unit: 'confirm' },
  ],
}
