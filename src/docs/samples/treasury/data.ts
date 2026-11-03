/**
 * Treasury · PT Nusantara Logistik, group treasury. Every figure on the screen is derived from
 * the account histories below, so the totals, the deltas and the chart's "now" point agree.
 * Business date: Tuesday 3 Nov 2026, 10:42 WIB. FX at the 10:00 WIB fixing, held flat.
 */
import type { BulletRow, StatusTone } from '@/design-system'

export type Range = 'today' | '7d' | '30d' | 'qtd'
export type Currency = 'IDR' | 'USD' | 'SGD' | 'EUR' | 'JPY' | 'CNY'

/** Seeded so the screen is the same on every load. */
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

export const businessDate = '3 Nov 2026'
export const clockStart = { h: 10, m: 42, s: 18 }

/** IDR per unit, 10:00 WIB fixing. */
export const fx: Record<Currency, number> = {
  IDR: 1,
  USD: 16240,
  SGD: 12482,
  EUR: 18705,
  JPY: 107.62,
  CNY: 2281.4,
}

export const ranges: { label: string; value: Range }[] = [
  { label: 'Today', value: 'today' },
  { label: '7D', value: '7d' },
  { label: '30D', value: '30d' },
  { label: 'QTD', value: 'qtd' },
]

/** Days back to the baseline of each range; QTD runs from the 30 Sep close. */
export const rangeDays: Record<Range, number> = { today: 1, '7d': 7, '30d': 30, qtd: 34 }
export const rangeBaseline: Record<Range, string> = {
  today: 'vs 2 Nov close',
  '7d': 'vs 27 Oct close',
  '30d': 'vs 4 Oct close',
  qtd: 'vs 30 Sep close',
}

export type AccountStatus = 'active' | 'low' | 'term' | 'restricted' | 'sweep'

export const statusMeta: Record<AccountStatus, { label: string; tone: StatusTone }> = {
  active: { label: 'Active', tone: 'success' },
  low: { label: 'Low balance', tone: 'warning' },
  term: { label: 'Term', tone: 'neutral' },
  restricted: { label: 'Restricted', tone: 'neutral' },
  sweep: { label: 'Sweep pending', tone: 'brand' },
}

interface AccountSeed {
  id: string
  bank: string
  name: string
  number: string
  currency: Currency
  balance: number
  status: AccountStatus
  bic: string
  branch: string
  opened: string
  rate: string
  sweep: string
  signatories: string
  /** Daily volatility as a share of the balance. */
  vol: number
  /** Daily drift as a share of the balance (positive = the account has been growing). */
  drift: number
}

const seeds: AccountSeed[] = [
  {
    id: 'ACC-01',
    bank: 'Arunika Bank',
    name: 'Operating',
    number: '7701 0042 8812',
    currency: 'IDR',
    balance: 486_210_400_000,
    status: 'active',
    bic: 'ARNKIDJA',
    branch: 'Jakarta, Sudirman',
    opened: '14 Mar 2019',
    rate: '2.75% p.a., paid monthly',
    sweep: 'Target 450 bn, excess to ACC-05',
    signatories: '2 of 4 · R. Pratama, A. Lestari, D. Wirawan, M. Tanaka',
    vol: 0.018,
    drift: 0.0012,
  },
  {
    id: 'ACC-02',
    bank: 'Bank Samudra Niaga',
    name: 'Collections',
    number: '0412 3307 0091',
    currency: 'IDR',
    balance: 612_884_150_000,
    status: 'active',
    bic: 'BSNIIDJA',
    branch: 'Jakarta, Kuningan',
    opened: '02 Aug 2016',
    rate: '2.10% p.a., paid monthly',
    sweep: 'Zero balance to ACC-01 at 16:00 WIB',
    signatories: '2 of 3 · R. Pratama, A. Lestari, S. Lim',
    vol: 0.021,
    drift: 0.0016,
  },
  {
    id: 'ACC-03',
    bank: 'Bank Samudra Niaga',
    name: 'Payroll',
    number: '0412 3315 0144',
    currency: 'IDR',
    balance: 38_402_000_000,
    status: 'low',
    bic: 'BSNIIDJA',
    branch: 'Jakarta, Kuningan',
    opened: '02 Aug 2016',
    rate: 'None',
    sweep: 'Funded from ACC-01 on the 24th',
    signatories: '2 of 3 · A. Lestari, F. Nugroho, S. Lim',
    vol: 0.03,
    drift: -0.011,
  },
  {
    id: 'ACC-04',
    bank: 'Bank Kencana',
    name: 'Tax & duties',
    number: '1188 0921 4470',
    currency: 'IDR',
    balance: 142_500_000_000,
    status: 'active',
    bic: 'BKNCIDJA',
    branch: 'Jakarta, Gatot Subroto',
    opened: '21 Jan 2020',
    rate: '1.50% p.a., paid monthly',
    sweep: 'None',
    signatories: '2 of 2 · R. Pratama, A. Lestari',
    vol: 0.006,
    drift: 0.0021,
  },
  {
    id: 'ACC-05',
    bank: 'Arunika Bank',
    name: 'Term deposit 3M',
    number: '7701 0042 5530',
    currency: 'IDR',
    balance: 300_000_000_000,
    status: 'term',
    bic: 'ARNKIDJA',
    branch: 'Jakarta, Sudirman',
    opened: '14 Oct 2026',
    rate: '5.40% p.a., matures 14 Jan 2027',
    sweep: 'Receives excess from ACC-01',
    signatories: '2 of 4 · R. Pratama, A. Lestari, D. Wirawan, M. Tanaka',
    vol: 0,
    drift: 0,
  },
  {
    id: 'ACC-06',
    bank: 'Arunika Bank',
    name: 'Escrow, Cikarang DC',
    number: '7701 0042 7719',
    currency: 'IDR',
    balance: 85_000_000_000,
    status: 'restricted',
    bic: 'ARNKIDJA',
    branch: 'Bekasi, Cikarang',
    opened: '30 Jun 2026',
    rate: '3.10% p.a., to the escrow',
    sweep: 'None, released on handover',
    signatories: 'Escrow agent and 1 of 2 · R. Pratama, A. Lestari',
    vol: 0,
    drift: 0,
  },
  {
    id: 'ACC-07',
    bank: 'Straits Meridian Bank',
    name: 'SGD operating',
    number: '501-284711-001',
    currency: 'SGD',
    balance: 4_812_300.55,
    status: 'active',
    bic: 'STMBSGSG',
    branch: 'Singapore, Raffles Place',
    opened: '09 May 2018',
    rate: '1.85% p.a. above SGD 1M',
    sweep: 'Target SGD 4.5M, excess to ACC-09',
    signatories: '2 of 3 · M. Tanaka, S. Lim, R. Pratama',
    vol: 0.024,
    drift: 0.0008,
  },
  {
    id: 'ACC-08',
    bank: 'Straits Meridian Bank',
    name: 'USD operating',
    number: '501-284711-002',
    currency: 'USD',
    balance: 6_240_118.2,
    status: 'active',
    bic: 'STMBSGSG',
    branch: 'Singapore, Raffles Place',
    opened: '09 May 2018',
    rate: '3.20% p.a. above USD 1M',
    sweep: 'Excess over USD 6M to ACC-09',
    signatories: '2 of 3 · M. Tanaka, S. Lim, R. Pratama',
    vol: 0.022,
    drift: 0.0011,
  },
  {
    id: 'ACC-09',
    bank: 'Atlantic Meridian Bank',
    name: 'USD concentration',
    number: '0044 1932 7781',
    currency: 'USD',
    balance: 12_905_442.73,
    status: 'sweep',
    bic: 'ATMBUS33',
    branch: 'New York, Water Street',
    opened: '17 Feb 2021',
    rate: '4.05% p.a., overnight sweep',
    sweep: 'Header account, sweeps in at 17:00 ET',
    signatories: '2 of 3 · R. Pratama, M. Tanaka, D. Wirawan',
    vol: 0.012,
    drift: 0.0006,
  },
  {
    id: 'ACC-10',
    bank: 'Nordhafen Bank',
    name: 'EUR operating',
    number: 'DE89 2104 0010 0532 0130 00',
    currency: 'EUR',
    balance: 1_384_906.1,
    status: 'active',
    bic: 'NRDHDEHH',
    branch: 'Hamburg, Speicherstadt',
    opened: '11 Nov 2022',
    rate: '1.40% p.a. above EUR 500K',
    sweep: 'None',
    signatories: '2 of 2 · D. Wirawan, M. Tanaka',
    vol: 0.028,
    drift: -0.0009,
  },
  {
    id: 'ACC-11',
    bank: 'Sakuragawa Bank',
    name: 'JPY operating',
    number: '012-7730481',
    currency: 'JPY',
    balance: 182_450_000,
    status: 'active',
    bic: 'SKRGJPJT',
    branch: 'Tokyo, Nihonbashi',
    opened: '06 Apr 2023',
    rate: 'None',
    sweep: 'None',
    signatories: '2 of 2 · M. Tanaka, R. Pratama',
    vol: 0.02,
    drift: 0.0004,
  },
  {
    id: 'ACC-12',
    bank: 'Lianhe Pacific Bank',
    name: 'CNY operating',
    number: '6217 8800 3412 0057',
    currency: 'CNY',
    balance: 9_820_544.8,
    status: 'active',
    bic: 'LHPBCNSZ',
    branch: 'Shenzhen, Futian',
    opened: '23 Sep 2024',
    rate: '0.85% p.a.',
    sweep: 'None',
    signatories: '2 of 2 · S. Lim, M. Tanaka',
    vol: 0.019,
    drift: 0.0013,
  },
]

/** 91 days of daily closes ending today, plus today's intraday position as the last point. */
const HISTORY = 92

export interface Account extends AccountSeed {
  /** Native currency, oldest first, last = now. */
  history: number[]
  /** IDR equivalent of the balance. */
  idr: number
}

export const accounts: Account[] = seeds.map((seed, k) => {
  const rand = mulberry32(2026 + k * 97)
  const history = new Array<number>(HISTORY)
  history[HISTORY - 1] = seed.balance
  // Walk back from today's balance, so the last point is exactly the balance on the screen.
  for (let i = HISTORY - 2; i >= 0; i--) {
    const shock = (rand() - 0.5) * 2 * seed.vol
    const next = history[i + 1]
    history[i] = Math.max(next * 0.2, next / (1 + seed.drift + shock))
  }
  // The term deposit was placed on 14 Oct (20 days ago); before that the cash sat in ACC-01.
  if (seed.id === 'ACC-05') for (let i = 0; i < HISTORY - 21; i++) history[i] = 0
  if (seed.id === 'ACC-06') for (let i = 0; i < HISTORY - 60; i++) history[i] = 85_000_000_000
  return { ...seed, history, idr: seed.balance * fx[seed.currency] }
})

// ACC-01 carried the 300 bn before the deposit was placed: keep the group total continuous.
{
  const op = accounts[0]
  for (let i = 0; i < HISTORY - 21; i++) op.history[i] += 300_000_000_000
  // This morning's collections: the 08:00 WIB virtual-account settlement landed in ACC-02.
  accounts[1].history[HISTORY - 2] -= 24_300_000_000
}

const BN = 1e9

/** Group total in IDR bn for each day of the history. */
export const totalHistory: number[] = Array.from({ length: HISTORY }, (_, i) =>
  accounts.reduce((sum, a) => sum + a.history[i] * fx[a.currency], 0) / BN,
)

export const totalCash = totalHistory[HISTORY - 1]

export const undrawnFacility = 750
export const termDeposits = 300
export const restrictedCash = 85

/** Unrestricted cash plus the undrawn revolving facility. */
export const availableLiquidity = (dayIndex = HISTORY - 1) =>
  totalHistory[dayIndex] - termDeposits - restrictedCash + undrawnFacility

export function changeOver(range: Range) {
  const now = totalHistory[HISTORY - 1]
  const then = totalHistory[HISTORY - 1 - rangeDays[range]]
  return { now, then, abs: now - then, pct: ((now - then) / then) * 100 }
}

export function availableChange(range: Range) {
  const now = availableLiquidity()
  const then = availableLiquidity(HISTORY - 1 - rangeDays[range])
  return ((now - then) / then) * 100
}

export function accountChange(account: Account, range: Range) {
  const now = account.history[HISTORY - 1] * fx[account.currency]
  const then = account.history[HISTORY - 1 - rangeDays[range]] * fx[account.currency]
  return (now - then) / BN
}

/**
 * Gross flows for the net-flow card. Net is the change in the group total; gross inflows are
 * the receipts booked over the range, outflows are inflows minus net.
 */
const grossIn: Record<Range, number> = { today: 141.8, '7d': 684.2, '30d': 2912.7, qtd: 3318.4 }
export function flows(range: Range) {
  const net = changeOver(range).abs
  const inflow = grossIn[range]
  return { inflow, outflow: inflow - net, net }
}

/** Liquidity coverage ratio, % (policy minimum 120%, regulatory 100%). */
export const lcr: Record<Range, number> = { today: 148, '7d': 146, '30d': 141, qtd: 139 }
export const lcrPolicy = 120

/* ── 13-week liquidity: weekly closes from the history, then a six-week forecast ─────────── */

export const weekLabels = Array.from({ length: 19 }, (_, i) => `W${33 + i}`)
const weeklyActual = Array.from({ length: 13 }, (_, w) => totalHistory[HISTORY - 1 - (12 - w) * 7])
const last = weeklyActual[12]
/** W46–W51: Q4 receipts, then the corporate tax instalment and Q3 dividend in W49. */
const forecastSteps = [38.6, -71.4, -158.2, -183.7, 92.3, 61.8]
const weeklyForecast: number[] = []
forecastSteps.reduce((level, step) => {
  const next = level + step
  weeklyForecast.push(next)
  return next
}, last)

export const liquidity = [...weeklyActual, ...weeklyForecast]
export const nowWeek = 12
export const minimumBuffer = 1600
export const troughWeek = liquidity.indexOf(Math.min(...weeklyForecast))
export const troughValue = liquidity[troughWeek]

/* ── FX exposure: net open position in USD M equivalent against each limit ─────────────────── */

/** `scale` is the end of each track, a round number a little past the limit. */
const fxLimits: { ccy: string; value: number; limit: number; scale: number }[] = [
  { ccy: 'USD', value: 22.4, limit: 30, scale: 40 },
  { ccy: 'SGD', value: 7.9, limit: 12, scale: 16 },
  { ccy: 'EUR', value: 7.1, limit: 8, scale: 10 },
  { ccy: 'JPY', value: 1.8, limit: 6, scale: 8 },
  { ccy: 'CNY', value: 4.6, limit: 6, scale: 8 },
]

export const fxRows: BulletRow[] = fxLimits.map((r) => ({
  label: r.ccy,
  sublabel: `${Math.round((r.value / r.limit) * 100)}% of ${r.limit.toFixed(0)}`,
  value: r.value,
  target: r.limit,
  ranges: [r.limit * 0.75, r.limit, r.scale],
}))

/** 10:00 WIB fixing against IDR, change on the previous fixing in %. */
export const fixings: { pair: string; rate: number; digits: number; change: number }[] = [
  { pair: 'USD', rate: fx.USD, digits: 0, change: 0.18 },
  { pair: 'SGD', rate: fx.SGD, digits: 0, change: 0.05 },
  { pair: 'EUR', rate: fx.EUR, digits: 0, change: -0.22 },
  { pair: 'JPY', rate: fx.JPY, digits: 2, change: -0.41 },
  { pair: 'CNY', rate: fx.CNY, digits: 1, change: 0.09 },
]

export const fxNearest = fxLimits.reduce((a, b) => (b.value / b.limit > a.value / a.limit ? b : a))

/* ── Payments due this week ────────────────────────────────────────────────────────────────── */

export type PaymentStatus = 'awaiting' | 'approved' | 'scheduled'

export interface Payment {
  id: string
  payee: string
  purpose: string
  currency: Currency
  amount: number
  due: string
  release: string
  status: PaymentStatus
  /** Approvals so far / needed. */
  approvals: [number, number]
}

export const payments: Payment[] = [
  {
    id: 'PAY-26110412',
    payee: 'PT Sinar Armada Kargo',
    purpose: 'Line-haul freight, October',
    currency: 'IDR',
    amount: 4_218_000_000,
    due: '4 Nov',
    release: '4 Nov 2026 10:00 WIB',
    status: 'awaiting',
    approvals: [1, 2],
  },
  {
    id: 'PAY-26110418',
    payee: 'Kaiyo Shipping Co., Ltd.',
    purpose: 'Charter hire, voyage 2611',
    currency: 'JPY',
    amount: 24_600_000,
    due: '5 Nov',
    release: '5 Nov 2026 08:00 WIB',
    status: 'scheduled',
    approvals: [2, 2],
  },
  {
    id: 'PAY-26110421',
    payee: 'Meridian Port Services Pte. Ltd.',
    purpose: 'Terminal handling, Q3 true-up',
    currency: 'SGD',
    amount: 312_480,
    due: '6 Nov',
    release: '6 Nov 2026 09:00 WIB',
    status: 'awaiting',
    approvals: [0, 2],
  },
  {
    id: 'PAY-26110415',
    payee: 'State treasury',
    purpose: 'Withholding tax, article 23',
    currency: 'IDR',
    amount: 1_284_500_000,
    due: '6 Nov',
    release: '6 Nov 2026 11:00 WIB',
    status: 'scheduled',
    approvals: [2, 2],
  },
  {
    id: 'PAY-26110424',
    payee: 'Bremer Lift GmbH',
    purpose: 'Forklift lease, 24 units',
    currency: 'EUR',
    amount: 86_200,
    due: '7 Nov',
    release: '6 Nov 2026 15:00 WIB',
    status: 'awaiting',
    approvals: [1, 2],
  },
  {
    id: 'PAY-26110427',
    payee: 'PT Cahaya Rantai Dingin',
    purpose: 'Cold-chain storage, Cibitung',
    currency: 'IDR',
    amount: 2_746_350_000,
    due: '9 Nov',
    release: '9 Nov 2026 10:00 WIB',
    status: 'awaiting',
    approvals: [0, 2],
  },
]

/* ── Formatting ────────────────────────────────────────────────────────────────────────────── */

const MINUS = '−'

/** "486.21" for IDR bn values in a column. */
export function bn(value: number, digits = 1) {
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })
    .format(value)
    .replace('-', MINUS)
}

export function signedBn(value: number, digits = 1) {
  const text = bn(Math.abs(value), digits)
  return `${value < 0 ? MINUS : '+'}${text}`
}

/** IDR in Indonesian notation, other currencies in English notation, code first. */
export function money(value: number, currency: Currency) {
  if (currency === 'IDR') return `Rp ${new Intl.NumberFormat('id-ID').format(Math.round(value))}`
  const digits = currency === 'JPY' ? 0 : 2
  return `${currency} ${new Intl.NumberFormat('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value)}`
}

export const toIdrBn = (value: number, currency: Currency) => (value * fx[currency]) / BN

/** The last four digits, whatever the separators: "DE89 2104 … 0130 00" → "3000". */
export const lastFour = (number: string) => number.replace(/\D/g, '').slice(-4)

/** Cash by bank, IDR bn eq., largest first, with the share of the group total. */
export const byBank = Object.entries(
  accounts.reduce<Record<string, number>>((acc, a) => {
    acc[a.bank] = (acc[a.bank] ?? 0) + a.idr / BN
    return acc
  }, {}),
)
  .map(([bank, value]) => ({ bank, value, share: (value / totalCash) * 100 }))
  .sort((a, b) => b.value - a.value)

/** Counterparty policy: no bank holds more than 45% of group cash. */
export const bankLimitShare = 45

export const historyLength = HISTORY
