/**
 * Sample 28 · Usage & billing. Simpul, 21 Strive's developer platform, billing page of the
 * organization Kopra Labs. Every figure on the screen comes from the simulation below, so the
 * meters, the forecast, the breakdown and the plan header always agree.
 */
import { formatNumber } from '@/design-system'

export type PlanId = 'team' | 'scale' | 'business' | 'enterprise'
export type MetricId = 'requests' | 'storage' | 'build' | 'seats'

export interface Plan {
  id: PlanId
  name: string
  /** Platform fee, USD per month. Usage is metered on top. */
  fee: number
  quota: { requests: number; storage: number; seats: number; build: number }
  rate: { requests: number; storage: number; build: number; seat: number }
  concurrentBuilds: number
  logRetention: string
  sso: string
  support: string
  sla: string
}

/** Requests millions, storage GB, build minutes; rates in USD per million, per GB-month, per minute, per seat-month. */
export const plans: Plan[] = [
  {
    id: 'team',
    name: 'Team',
    fee: 120,
    quota: { requests: 10, storage: 250, seats: 10, build: 2000 },
    rate: { requests: 14, storage: 0.28, build: 0.07, seat: 24 },
    concurrentBuilds: 2,
    logRetention: '7 days',
    sso: 'Email and passkeys',
    support: 'Email, 48 h',
    sla: '99.9%',
  },
  {
    id: 'scale',
    name: 'Scale',
    fee: 400,
    quota: { requests: 50, storage: 1024, seats: 25, build: 6000 },
    rate: { requests: 12, storage: 0.25, build: 0.06, seat: 20 },
    concurrentBuilds: 6,
    logRetention: '30 days',
    sso: 'Email and passkeys',
    support: 'Chat, 8 h',
    sla: '99.95%',
  },
  {
    id: 'business',
    name: 'Business',
    fee: 1200,
    quota: { requests: 200, storage: 5120, seats: 75, build: 25000 },
    rate: { requests: 10, storage: 0.22, build: 0.05, seat: 18 },
    concurrentBuilds: 12,
    logRetention: '90 days',
    sso: 'SAML single sign-on',
    support: 'Chat and phone, 2 h',
    sla: '99.99%',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    fee: 3500,
    quota: { requests: 1000, storage: 20480, seats: 250, build: 100000 },
    rate: { requests: 8, storage: 0.18, build: 0.04, seat: 15 },
    concurrentBuilds: 32,
    logRetention: '1 year',
    sso: 'SAML and SCIM',
    support: 'Named engineer, 1 h',
    sla: '99.99% + credits',
  },
]

export const planById = (id: PlanId) => plans.find((p) => p.id === id) as Plan

/** Usage past a quota is billed at this multiple of the plan rate. */
export const OVERAGE = 1.5

export const org = {
  name: 'Kopra Labs',
  legal: 'PT Kopra Labs Indonesia',
  account: 'SMP-20418',
  billingEmail: 'finance@kopralabs.io',
  address: 'Jl. Senopati No. 41, Jakarta 12190',
  taxId: '01.234.567.8-012.000',
  /** The organization's cap on spend per cycle, platform fee included. */
  spendLimit: 2000,
  vat: 0.11,
}

export const projects = [
  { id: 'api-gateway', name: 'api-gateway', share: { requests: 0.58, storage: 0.18, build: 0.42 } },
  { id: 'storefront-web', name: 'storefront-web', share: { requests: 0.31, storage: 0.09, build: 0.38 } },
  { id: 'ingest-workers', name: 'ingest-workers', share: { requests: 0.11, storage: 0.73, build: 0.2 } },
] as const

export type CycleId = 'current' | 'previous'

interface CycleSpec {
  id: CycleId
  month: string
  monthLong: string
  year: number
  days: number
  /** Day of the week of the 1st, 0 = Sunday. */
  firstDow: number
  /** Last day with measured usage; later days are forecast. Null for a closed cycle. */
  today: number | null
  requests: { base: number; slope: number }
  storage: { start: number; slope: number }
  build: { weekday: number; weekend: number }
  seats: number
  seed: number
}

export const cycles: Record<CycleId, CycleSpec> = {
  current: {
    id: 'current',
    month: 'Nov',
    monthLong: 'November',
    year: 2026,
    days: 30,
    firstDow: 0,
    today: 18,
    requests: { base: 2.24, slope: 0.03 },
    storage: { start: 586, slope: 1.45 },
    build: { weekday: 205, weekend: 58 },
    seats: 13,
    seed: 11,
  },
  previous: {
    id: 'previous',
    month: 'Oct',
    monthLong: 'October',
    year: 2026,
    days: 31,
    firstDow: 4,
    today: null,
    requests: { base: 1.42, slope: 0.004 },
    storage: { start: 548, slope: 1.16 },
    build: { weekday: 192, weekend: 52 },
    seats: 12,
    seed: 7,
  },
}

export const today = { label: 'Wed 18 Nov 2026', time: '14:20 WIB', day: 18 }

export interface DayRow {
  day: number
  label: string
  weekend: boolean
  forecast: boolean
  /** Millions of requests that day, and so far this cycle. */
  requests: number
  requestsCum: number
  /** Stored GB at the end of the day. */
  storage: number
  build: number
  buildCum: number
  cost: { fee: number; requests: number; storage: number; build: number; seats: number }
  /** Everything billed so far this cycle, platform fee included, USD. */
  totalCum: number
}

// Small deterministic wobble so the days don't look machine-made.
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

const cents = (v: number) => Math.round(v * 100) / 100

/** Splits a day's units into the part inside the quota and the part past it, priced accordingly. */
function priced(units: number, before: number, quota: number, rate: number) {
  const inside = Math.min(units, Math.max(0, quota - before))
  return inside * rate + (units - inside) * rate * OVERAGE
}

/**
 * One billing cycle, day by day. `planAt(day)` gives the plan in force that day, so an upgrade
 * part way through re-prices the rest of the cycle and prorates the platform fee.
 */
export function simulate(spec: CycleSpec, planAt: (day: number) => Plan): DayRow[] {
  const rand = mulberry32(spec.seed)
  const rows: DayRow[] = []
  let requestsCum = 0
  let buildCum = 0
  let total = 0
  for (let day = 1; day <= spec.days; day++) {
    const plan = planAt(day)
    const previousPlan = day > 1 ? planAt(day - 1) : null
    const dow = (spec.firstDow + day - 1) % 7
    const weekend = dow === 0 || dow === 6
    const wobble = () => 1 + (rand() - 0.5) * 0.08

    const requests = (spec.requests.base + spec.requests.slope * day) * (weekend ? 0.82 : 1) * wobble()
    const storage = spec.storage.start + spec.storage.slope * day + (rand() - 0.5) * 2
    const build = Math.round((weekend ? spec.build.weekend : spec.build.weekday) * wobble())

    let fee = 0
    if (day === 1) fee = plan.fee
    else if (previousPlan && previousPlan.id !== plan.id) fee = ((plan.fee - previousPlan.fee) * (spec.days - day + 1)) / spec.days

    const cost = {
      fee,
      requests: priced(requests, requestsCum, plan.quota.requests, plan.rate.requests),
      storage: (storage * plan.rate.storage) / spec.days,
      build: priced(build, buildCum, plan.quota.build, plan.rate.build),
      seats: (spec.seats * plan.rate.seat) / spec.days,
    }
    requestsCum += requests
    buildCum += build
    total += cost.fee + cost.requests + cost.storage + cost.build + cost.seats
    rows.push({
      day,
      label: `${day} ${spec.month}`,
      weekend,
      forecast: spec.today != null && day > spec.today,
      requests,
      requestsCum,
      storage,
      build,
      buildCum,
      cost,
      totalCum: cents(total),
    })
  }
  return rows
}

export interface CycleSummary {
  spec: CycleSpec
  rows: DayRow[]
  /** Index of the last measured day in `rows`. */
  nowIndex: number
  now: DayRow
  end: DayRow
  daysLeft: number
  /** Totals so far, by line, USD. */
  toDate: { fee: number; requests: number; storage: number; build: number; seats: number; usage: number; total: number }
  used: { requests: number; storage: number; build: number; seats: number }
  projected: { requests: number; storage: number; build: number; seats: number; total: number }
  /** The whole cycle by line, measured plus forecast, USD; with the quantities behind it. */
  byLine: { fee: number; requests: number; storage: number; build: number; seats: number }
  quantities: { requests: number; gbMonths: number; build: number; seats: number }
  /** Day the requests quota is (or was) passed, if it is. */
  requestsQuotaDay: number | null
  /** Day the spend limit is (or would be) passed, if it is. */
  limitDay: number | null
}

export function summarize(spec: CycleSpec, planAt: (day: number) => Plan): CycleSummary {
  const rows = simulate(spec, planAt)
  const nowIndex = (spec.today ?? spec.days) - 1
  const measured = rows.slice(0, nowIndex + 1)
  const sum = (key: keyof DayRow['cost']) => cents(measured.reduce((t, r) => t + r.cost[key], 0))
  const toDate = {
    fee: sum('fee'),
    requests: sum('requests'),
    storage: sum('storage'),
    build: sum('build'),
    seats: sum('seats'),
    usage: 0,
    total: rows[nowIndex].totalCum,
  }
  toDate.usage = cents(toDate.requests + toDate.storage + toDate.build + toDate.seats)
  const now = rows[nowIndex]
  const end = rows[rows.length - 1]
  const whole = (key: keyof DayRow['cost']) => cents(rows.reduce((t, r) => t + r.cost[key], 0))
  const byLine = { fee: whole('fee'), requests: whole('requests'), storage: whole('storage'), build: whole('build'), seats: whole('seats') }
  const quantities = {
    requests: rows[rows.length - 1].requestsCum,
    gbMonths: rows.reduce((t, r) => t + r.storage, 0) / spec.days,
    build: rows[rows.length - 1].buildCum,
    seats: spec.seats,
  }
  const quotaRow = rows.find((r) => r.requestsCum > planAt(r.day).quota.requests)
  const limitRow = rows.find((r) => r.totalCum > org.spendLimit)
  return {
    spec,
    rows,
    nowIndex,
    now,
    end,
    daysLeft: spec.days - (spec.today ?? spec.days),
    toDate,
    used: { requests: now.requestsCum, storage: now.storage, build: now.buildCum, seats: spec.seats },
    projected: { requests: end.requestsCum, storage: end.storage, build: end.buildCum, seats: spec.seats, total: end.totalCum },
    byLine,
    quantities,
    requestsQuotaDay: quotaRow?.day ?? null,
    limitDay: limitRow?.day ?? null,
  }
}

/* ── Invoices ─────────────────────────────────────────────────────────────────────── */

export type InvoiceStatus = 'upcoming' | 'paid' | 'applied'

export interface Invoice {
  id: string
  number: string
  period: string
  issued: string
  /** USD, VAT included. Negative for a credit note. */
  amount: number
  status: InvoiceStatus
  kind: 'invoice' | 'credit'
}

/** October's invoice is the closed simulation plus VAT; earlier months are history. */
export function invoiceHistory(october: CycleSummary, upcomingTotal: number): Invoice[] {
  const withVat = (v: number) => cents(v * (1 + org.vat))
  const paid = (id: string, n: number, period: string, issued: string, amount: number): Invoice => ({
    id,
    number: `INV-20418-${String(n).padStart(3, '0')}`,
    period,
    issued,
    amount,
    status: 'paid',
    kind: 'invoice',
  })
  return [
    { id: 'draft', number: 'Draft', period: '1–30 Nov 2026', issued: 'Due 1 Dec 2026', amount: withVat(upcomingTotal), status: 'upcoming', kind: 'invoice' },
    paid('2026-10', 16, '1–31 Oct 2026', '1 Nov 2026', withVat(october.end.totalCum)),
    paid('2026-09', 15, '1–30 Sep 2026', '1 Oct 2026', 1612.48),
    paid('2026-08', 14, '1–31 Aug 2026', '1 Sep 2026', 1544.2),
    { id: 'cn-2026-07', number: 'CN-20418-002', period: 'Incident 14 Jul 2026', issued: '22 Jul 2026', amount: -120, status: 'applied', kind: 'credit' },
    paid('2026-07', 13, '1–31 Jul 2026', '1 Aug 2026', 1498.06),
    paid('2026-06', 12, '1–30 Jun 2026', '1 Jul 2026', 1451.73),
    paid('2026-05', 11, '1–31 May 2026', '1 Jun 2026', 1402.55),
    paid('2026-04', 10, '1–30 Apr 2026', '1 May 2026', 1350.12),
    paid('2026-03', 9, '1–31 Mar 2026', '1 Apr 2026', 1288.4),
    paid('2026-02', 8, '1–28 Feb 2026', '1 Mar 2026', 1201.75),
    paid('2026-01', 7, '1–31 Jan 2026', '1 Feb 2026', 1145.3),
    paid('2025-12', 6, '1–31 Dec 2025', '1 Jan 2026', 1098.2),
    paid('2025-11', 5, '1–30 Nov 2025', '1 Dec 2025', 1052.64),
    paid('2025-10', 4, '1–31 Oct 2025', '1 Nov 2025', 998.1),
    paid('2025-09', 3, '1–30 Sep 2025', '1 Oct 2025', 941.33),
    paid('2025-08', 2, '1–31 Aug 2025', '1 Sep 2025', 880.75),
    paid('2025-07', 1, '14–31 Jul 2025', '1 Aug 2025', 612.4),
  ]
}

export interface InvoiceLine {
  label: string
  detail: string
  amount: number
}

export interface InvoiceDetail {
  lines: InvoiceLine[]
  subtotal: number
  vat: number
  total: number
  note: string
}

/**
 * Line items for an invoice. November is the forecast, October the closed simulation; older
 * months keep October's mix of usage, scaled to their total.
 */
export function invoiceDetail(invoice: Invoice, november: CycleSummary, october: CycleSummary, plan: Plan): InvoiceDetail {
  if (invoice.kind === 'credit') {
    const lines = [{ label: 'Service credit', detail: 'API error rate above SLA, 41 min on 14 Jul 2026', amount: invoice.amount }]
    return { lines, subtotal: invoice.amount, vat: 0, total: invoice.amount, note: 'Taken off the July invoice.' }
  }
  const fromCycle = (s: CycleSummary): InvoiceLine[] => [
    { label: 'Platform fee', detail: `${plan.name}, 1 month`, amount: s.byLine.fee },
    { label: 'Requests', detail: `${millions(s.quantities.requests)} × ${usd(plan.rate.requests)} per million${s.quantities.requests > plan.quota.requests ? `, past ${quotaMillions(plan.quota.requests)} at ${OVERAGE}×` : ''}`, amount: s.byLine.requests },
    { label: 'Storage', detail: `${formatNumber(s.quantities.gbMonths, { maximumFractionDigits: 1 })} GB-months × ${usd(plan.rate.storage)}`, amount: s.byLine.storage },
    { label: 'Build minutes', detail: `${minutes(s.quantities.build)} × ${usd(plan.rate.build)}`, amount: s.byLine.build },
    { label: 'Seats', detail: `${s.quantities.seats} × ${usd(plan.rate.seat)} a month`, amount: s.byLine.seats },
  ]
  let lines: InvoiceLine[]
  let note: string
  if (invoice.id === 'draft') {
    lines = fromCycle(november)
    note = 'An estimate at the current rate. The invoice is issued on 1 Dec 2026 and charged the same day.'
  } else if (invoice.id === '2026-10') {
    lines = fromCycle(october)
    note = `Paid on ${invoice.issued} with the card ending ${paymentMethod.last4}.`
  } else {
    const base = fromCycle(october)
    const usageOct = base.slice(1).reduce((t, l) => t + l.amount, 0)
    const usageThen = invoice.amount / (1 + org.vat) - plan.fee
    const k = usageThen / usageOct
    lines = base.map((l, i) => (i === 0 ? l : { label: l.label, detail: 'Metered', amount: cents(l.amount * k) }))
    note = `Paid on ${invoice.issued} with the card ending ${paymentMethod.last4}.`
  }
  const subtotal = cents(lines.reduce((t, l) => t + l.amount, 0))
  const vat = cents(subtotal * org.vat)
  return { lines, subtotal, vat, total: cents(subtotal + vat), note }
}

export const paymentMethod = {
  issuer: 'Arta Kencana Bank',
  kind: 'Corporate debit',
  last4: '4821',
  expires: '08/29',
  holder: 'Kopra Labs Indonesia',
  backup: 'Bank transfer to virtual account 8810 2041 8000',
}

/* ── Formatting ───────────────────────────────────────────────────────────────────── */

/** USD with cents and the true minus: "USD 1,401.55", "−USD 120.00". */
export function usd(value: number, digits = 2) {
  const text = formatNumber(Math.abs(value), { minimumFractionDigits: digits, maximumFractionDigits: digits })
  return `${value < 0 ? '−' : ''}USD ${text}`
}

/** Millions of requests: "43.19M". */
export const millions = (value: number) => `${formatNumber(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}M`

/** Quota in millions: "50M", "1B". */
export const quotaMillions = (value: number) => (value >= 1000 ? `${formatNumber(value / 1000)}B` : `${formatNumber(value)}M`)

/** Storage: "612 GB", "1 TB". */
export const storageText = (gb: number) => (gb >= 1024 ? `${formatNumber(gb / 1024, { maximumFractionDigits: 1 })} TB` : `${formatNumber(Math.round(gb))} GB`)

export const minutes = (value: number) => formatNumber(Math.round(value))

export const percent = (value: number) => `${formatNumber(value, { maximumFractionDigits: 0 })}%`
