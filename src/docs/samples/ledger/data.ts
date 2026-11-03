/**
 * Ledger & reconciliation · Arunika Bank, payments operations, general ledger GL-ARN-01.
 * Business date Tuesday 3 Nov 2026, 10:42 WIB. Functional currency IDR; the one USD leg sits
 * on its own position account so each currency balances on its own.
 */
import type { StatusTone, StepItem } from '@/design-system'

export const businessDate = '3 Nov 2026'
export const asOf = '10:42 WIB'

/* ── Chart of accounts (the part this screen touches) ─────────────────────────────────── */

export const accounts: Record<string, string> = {
  '1010': 'Settlement account, central bank',
  '1020': 'Nostro USD, Atlantic Meridian',
  '1110': 'Clearing receivable, instant',
  '1990': 'FX position, USD',
  '1991': 'FX position, IDR',
  '2010': 'Customer deposits, current',
  '2110': 'Clearing payable, instant',
  '2120': 'Card scheme payable, NCN',
  '2310': 'Merchant settlement payable',
  '4100': 'Fee income, transfers',
  '4110': 'Interchange income',
  '5200': 'Scheme and network fees',
  '5210': 'Clearing fees',
}

export interface JournalLine {
  id: string
  entry: string
  memo: string
  /** First line of its entry: carries the entry id and memo in the table. */
  lead: boolean
  account: string
  debit: number | null
  credit: number | null
  currency: 'IDR' | 'USD'
  posted: string
}

interface Entry {
  entry: string
  memo: string
  posted: string
  lines: [account: string, debit: number | null, credit: number | null, currency?: 'IDR' | 'USD'][]
}

const entries: Entry[] = [
  {
    entry: 'JE-20261103-00412',
    memo: 'Instant transfers in, batch STL-1103-01',
    posted: '08:00:14',
    lines: [
      ['1110', 18_412_500_000, null],
      ['2010', null, 18_412_500_000],
    ],
  },
  {
    entry: 'JE-20261103-00413',
    memo: 'Clearing settlement, 08:00 window',
    posted: '08:05:02',
    lines: [
      ['1010', 18_412_500_000, null],
      ['1110', null, 18_412_500_000],
    ],
  },
  {
    entry: 'JE-20261103-00418',
    memo: 'Card purchases, scheme file NCN-1103-01',
    posted: '08:30:41',
    lines: [
      ['2010', 6_284_910_000, null],
      ['2120', null, 6_190_636_350],
      ['4110', null, 94_273_650],
    ],
  },
  {
    entry: 'JE-20261103-00425',
    memo: 'Instant transfers out, batch STL-1103-04',
    posted: '09:15:00',
    lines: [
      ['2010', 12_912_800_000, null],
      ['2110', null, 12_906_300_000],
      ['4100', null, 6_500_000],
    ],
  },
  {
    entry: 'JE-20261103-00431',
    memo: 'Merchant payouts, 1,284 merchants',
    posted: '09:30:12',
    lines: [
      ['2310', 9_640_000_000, null],
      ['2010', null, 9_640_000_000],
    ],
  },
  {
    entry: 'JE-20261103-00436',
    memo: 'Clearing settlement, 09:15 window',
    posted: '10:00:00',
    lines: [
      ['2110', 12_906_300_000, null],
      ['1010', null, 12_906_300_000],
    ],
  },
  {
    entry: 'JE-20261103-00440',
    memo: 'Nostro funding, deal FX-26110304 at 16,240',
    posted: '10:12:33',
    lines: [
      ['1020', 500_000, null, 'USD'],
      ['1990', null, 500_000, 'USD'],
      ['1991', 8_120_000_000, null],
      ['1010', null, 8_120_000_000],
    ],
  },
  {
    entry: 'JE-20261103-00444',
    memo: 'Scheme fees October, invoice NCN-INV-2610',
    posted: '10:20:05',
    lines: [
      ['5200', 412_880_000, null],
      ['2120', null, 412_880_000],
    ],
  },
  {
    entry: 'JE-20261103-00447',
    memo: 'Clearing fees October, domestic clearing',
    posted: '10:31:50',
    lines: [
      ['5210', 84_600_000, null],
      ['1010', null, 84_600_000],
    ],
  },
]

export const journal: JournalLine[] = entries.flatMap((e) =>
  e.lines.map(([account, debit, credit, currency], i) => ({
    id: `${e.entry}-${i + 1}`,
    entry: e.entry,
    memo: e.memo,
    lead: i === 0,
    account,
    debit,
    credit,
    currency: currency ?? 'IDR',
    posted: e.posted,
  })),
)

export const entriesShown = entries.length
export const entriesToday = 1284

export function totalsByCurrency(lines: JournalLine[]) {
  const out: Record<string, { debit: number; credit: number }> = {}
  for (const l of lines) {
    out[l.currency] ??= { debit: 0, credit: 0 }
    out[l.currency].debit += l.debit ?? 0
    out[l.currency].credit += l.credit ?? 0
  }
  return out
}

/** The whole day, all 1,284 entries, IDR equivalent. */
export const dayTotals = { debit: 4_812_604_318_250, credit: 4_812_604_318_250 }

/* ── Net flows on the settlement account today, IDR bn ────────────────────────────────── */

export const flows = [
  { label: 'Opening', value: 312.4, kind: 'total' as const },
  { label: 'Transfers in', value: 268.5 },
  { label: 'Card', value: 96.4 },
  { label: 'Payouts', value: -188.2 },
  { label: 'Transfers out', value: -201.5 },
  { label: 'Payroll', value: -74.0 },
  { label: 'Nostro', value: -8.1 },
  { label: 'Closing', value: 0, kind: 'total' as const },
]

/** Entries posted per 30 minutes since 00:00 WIB, the last bucket still filling. */
export const postingsByHalfHour = [
  6, 4, 3, 2, 2, 3, 2, 4, 5, 9, 14, 22, 31, 46, 58, 71, 88, 112, 164, 131, 117, 142, 108, 96, 52,
]

export const closing = flows.reduce((sum, f) => (f.kind === 'total' ? sum : sum + f.value), flows[0].value)

/* ── Settlement batches ──────────────────────────────────────────────────────────────── */

export type BatchStatus = 'reconciled' | 'settled' | 'submitted' | 'awaiting' | 'failed' | 'scheduled'

export const batchStatus: Record<BatchStatus, { label: string; tone: StatusTone }> = {
  reconciled: { label: 'Reconciled', tone: 'success' },
  settled: { label: 'Settled', tone: 'brand' },
  submitted: { label: 'Submitted', tone: 'neutral' },
  awaiting: { label: 'Awaiting cut-off', tone: 'warning' },
  failed: { label: 'Rejected', tone: 'danger' },
  scheduled: { label: 'Scheduled', tone: 'neutral' },
}

export interface Batch {
  id: string
  rail: string
  window: string
  items: number | null
  amount: number | null
  currency: 'IDR' | 'USD'
  status: BatchStatus
  file: string
  counterparty: string
  /** Times for each lifecycle step that has happened. */
  times: string[]
  error?: string
}

export const lifecycle = ['Created', 'Validated', 'Submitted', 'Acknowledged', 'Settled', 'Reconciled']

export const batches: Batch[] = [
  {
    id: 'STL-1103-01',
    rail: 'Instant transfers in',
    window: '08:00',
    items: 4812,
    amount: 18_412_500_000,
    currency: 'IDR',
    status: 'reconciled',
    file: 'FAST-IN-20261103-0800.xml',
    counterparty: 'Instant clearing house',
    times: ['07:58:40', '07:58:52', '08:00:00', '08:00:03', '08:05:02', '08:21:17'],
  },
  {
    id: 'STL-1103-02',
    rail: 'Virtual accounts',
    window: '08:00',
    items: 1906,
    amount: 24_300_000_000,
    currency: 'IDR',
    status: 'reconciled',
    file: 'VA-20261103-0800.csv',
    counterparty: 'Collections, 62 billers',
    times: ['07:59:10', '07:59:31', '08:00:00', '08:00:12', '08:06:44', '08:30:02'],
  },
  {
    id: 'STL-1103-03',
    rail: 'Card scheme, NCN file 01',
    window: '08:30',
    items: 61284,
    amount: 6_284_910_000,
    currency: 'IDR',
    status: 'settled',
    file: 'NCN-1103-01.ipm',
    counterparty: 'Nusa Card Network',
    times: ['08:24:05', '08:26:18', '08:30:00', '08:30:41', '09:02:10'],
  },
  {
    id: 'STL-1103-04',
    rail: 'Instant transfers out',
    window: '09:15',
    items: 3977,
    amount: 12_906_300_000,
    currency: 'IDR',
    status: 'reconciled',
    file: 'FAST-OUT-20261103-0915.xml',
    counterparty: 'Instant clearing house',
    times: ['09:13:22', '09:13:40', '09:15:00', '09:15:02', '10:00:00', '10:04:51'],
  },
  {
    id: 'STL-1103-05',
    rail: 'Merchant payouts',
    window: '09:30',
    items: 1284,
    amount: 9_640_000_000,
    currency: 'IDR',
    status: 'settled',
    file: 'PAYOUT-20261103-0930.csv',
    counterparty: '1,284 merchants',
    times: ['09:28:00', '09:28:44', '09:30:00', '09:30:12', '09:41:30'],
  },
  {
    id: 'STL-1103-06',
    rail: 'Domestic clearing',
    window: '10:00',
    items: 642,
    amount: 31_780_000_000,
    currency: 'IDR',
    status: 'submitted',
    file: 'SKN-20261103-1000.txt',
    counterparty: 'Domestic clearing system',
    times: ['09:52:11', '09:54:03', '10:00:00'],
  },
  {
    id: 'STL-1103-07',
    rail: 'RTGS, payroll',
    window: '10:15',
    items: 18,
    amount: 74_000_000_000,
    currency: 'IDR',
    status: 'settled',
    file: 'RTGS-20261103-1015.xml',
    counterparty: '18 corporate clients',
    times: ['10:08:30', '10:09:02', '10:15:00', '10:15:04', '10:16:40'],
  },
  {
    id: 'STL-1103-08',
    rail: 'Cross-border wire',
    window: '10:30',
    items: 7,
    amount: 500_000,
    currency: 'USD',
    status: 'submitted',
    file: 'WIRE-20261103-1030.xml',
    counterparty: 'Atlantic Meridian Bank',
    times: ['10:22:14', '10:24:50', '10:30:00'],
  },
  {
    id: 'STL-1103-09',
    rail: 'Instant transfers out',
    window: '10:45',
    items: 2206,
    amount: 7_880_400_000,
    currency: 'IDR',
    status: 'awaiting',
    file: 'FAST-OUT-20261103-1045.xml',
    counterparty: 'Instant clearing house',
    times: ['10:38:02', '10:38:19'],
  },
  {
    id: 'STL-1103-10',
    rail: 'Domestic clearing',
    window: '12:00',
    items: null,
    amount: null,
    currency: 'IDR',
    status: 'scheduled',
    file: 'Opens 11:30',
    counterparty: 'Domestic clearing system',
    times: [],
  },
  {
    id: 'STL-1103-11',
    rail: 'Card scheme, NCN file 02',
    window: '12:30',
    items: null,
    amount: null,
    currency: 'IDR',
    status: 'scheduled',
    file: 'Expected 12:20',
    counterparty: 'Nusa Card Network',
    times: [],
  },
  {
    id: 'STL-1102-14',
    rail: 'Domestic clearing',
    window: '2 Nov 15:00',
    items: 388,
    amount: 4_112_000_000,
    currency: 'IDR',
    status: 'failed',
    file: 'SKN-20261102-1500.txt',
    counterparty: 'Domestic clearing system',
    times: ['2 Nov 14:51:09', '2 Nov 14:52:40', '2 Nov 15:00:00'],
    error: 'Rejected at acknowledgement: duplicate file id SKN-1102-1500. Resubmit with a new id.',
  },
]

/** RSteps items for a batch: completed steps carry their time; a rejection marks its step. */
export function stepsFor(batch: Batch): { items: StepItem[]; current: number } {
  const done = batch.times.length
  const items: StepItem[] = lifecycle.map((label, i) => {
    if (batch.status === 'failed' && i === done) return { label, description: batch.error, status: 'error' }
    return { label, description: batch.times[i] ? `${batch.times[i]} WIB` : undefined }
  })
  return { items, current: done }
}

/* ── Reconciliation breaks ───────────────────────────────────────────────────────────── */

export type BreakType = 'amount' | 'missing-bank' | 'missing-ledger' | 'duplicate'

export const breakTypes: { value: BreakType | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'amount', label: 'Amount mismatch' },
  { value: 'missing-bank', label: 'Missing in bank' },
  { value: 'missing-ledger', label: 'Missing in ledger' },
  { value: 'duplicate', label: 'Duplicate' },
]

export interface Side {
  ref: string
  date: string
  amount: number
  counterparty: string
  account: string
  narrative: string
}

export interface Break {
  id: string
  type: BreakType
  ageDays: number
  ledger: Side | null
  bank: Side | null
  suggestion?: string
}

const L = (ref: string, date: string, amount: number, counterparty: string, account: string, narrative: string): Side => ({
  ref,
  date,
  amount,
  counterparty,
  account,
  narrative,
})

export const breaks: Break[] = [
  {
    id: 'BRK-1030-007',
    type: 'missing-ledger',
    ageDays: 4,
    ledger: null,
    bank: L('MT940 1030/88412', '30 Oct 2026', 48_200_000, 'PT Graha Niaga Sentosa', '1010', 'Incoming credit, ref INV-7731'),
  },
  {
    id: 'BRK-1031-012',
    type: 'amount',
    ageDays: 3,
    ledger: L('JE-20261031-00988', '31 Oct 2026', 12_500_000, 'CV Tunas Baru', '2010', 'Instant transfer out'),
    bank: L('MT940 1031/90127', '31 Oct 2026', 12_497_500, 'CV Tunas Baru', '1010', 'Instant transfer out, fee netted'),
    suggestion: 'Post Rp 2.500 to 5210 Clearing fees',
  },
  {
    id: 'BRK-1101-003',
    type: 'duplicate',
    ageDays: 2,
    ledger: L('JE-20261101-00301', '1 Nov 2026', 7_880_000, 'Sari Wulandari', '2010', 'Posted twice by retry'),
    bank: L('MT940 1101/00514', '1 Nov 2026', 7_880_000, 'Sari Wulandari', '1010', 'Instant transfer out'),
    suggestion: 'Reverse the second posting',
  },
  {
    id: 'BRK-1102-021',
    type: 'missing-bank',
    ageDays: 1,
    ledger: L('JE-20261102-01177', '2 Nov 2026', 64_100_000, 'Toko Mebel Jaya Abadi', '2310', 'Merchant payout'),
    bank: null,
  },
  {
    id: 'BRK-1102-022',
    type: 'amount',
    ageDays: 1,
    ledger: L('JE-20261102-01203', '2 Nov 2026', 3_250_000, 'Hendra Kusuma', '2010', 'Instant transfer out'),
    bank: L('MT940 1102/30551', '2 Nov 2026', 3_245_000, 'Hendra Kusuma', '1010', 'Instant transfer out'),
    suggestion: 'Post Rp 5.000 to 5210 Clearing fees',
  },
  {
    id: 'BRK-1102-029',
    type: 'missing-bank',
    ageDays: 1,
    ledger: L('JE-20261102-01390', '2 Nov 2026', 18_900_000, 'PT Kopi Lereng Merapi', '2310', 'Merchant payout'),
    bank: null,
  },
  {
    id: 'BRK-1103-001',
    type: 'amount',
    ageDays: 0,
    ledger: L('JE-20261103-00418', '3 Nov 2026', 94_273_650, 'Nusa Card Network', '4110', 'Interchange, file NCN-1103-01'),
    bank: L('NCN-1103-01 summary', '3 Nov 2026', 94_270_150, 'Nusa Card Network', '2120', 'Interchange per scheme'),
    suggestion: 'Post Rp 3.500 to 4110 Interchange income',
  },
  {
    id: 'BRK-1103-004',
    type: 'missing-ledger',
    ageDays: 0,
    ledger: null,
    bank: L('MT940 1103/01120', '3 Nov 2026', 21_600_000, 'State treasury', '1010', 'Tax refund credit'),
  },
  {
    id: 'BRK-1103-006',
    type: 'missing-bank',
    ageDays: 0,
    ledger: L('JE-20261103-00433', '3 Nov 2026', 9_450_000, 'Rina Hartono', '2010', 'Instant transfer out'),
    bank: null,
  },
  {
    id: 'BRK-1103-008',
    type: 'amount',
    ageDays: 0,
    ledger: L('JE-20261103-00451', '3 Nov 2026', 1_100_000, 'Yusuf Maulana', '2010', 'Instant transfer out'),
    bank: L('MT940 1103/01244', '3 Nov 2026', 1_097_500, 'Yusuf Maulana', '1010', 'Instant transfer out'),
    suggestion: 'Post Rp 2.500 to 5210 Clearing fees',
  },
  {
    id: 'BRK-1103-009',
    type: 'duplicate',
    ageDays: 0,
    ledger: L('JE-20261103-00455', '3 Nov 2026', 2_400_000, 'Ahmad Fauzi', '2010', 'Posted twice by retry'),
    bank: L('MT940 1103/01251', '3 Nov 2026', 2_400_000, 'Ahmad Fauzi', '1010', 'Instant transfer out'),
    suggestion: 'Reverse the second posting',
  },
  {
    id: 'BRK-1103-011',
    type: 'missing-ledger',
    ageDays: 0,
    ledger: null,
    bank: L('MT940 1103/01302', '3 Nov 2026', 30_000_000, 'PT Samudra Kargo Utama', '1010', 'Incoming credit, ref PO-55120'),
  },
  {
    id: 'BRK-1103-013',
    type: 'missing-bank',
    ageDays: 0,
    ledger: L('JE-20261103-00462', '3 Nov 2026', 4_520_000, 'Lia Permatasari', '2010', 'Instant transfer out'),
    bank: null,
  },
  {
    id: 'BRK-1103-015',
    type: 'amount',
    ageDays: 0,
    ledger: L('JE-20261103-00470', '3 Nov 2026', 5_000_000, 'Bambang Setiawan', '2010', 'Instant transfer out'),
    bank: L('MT940 1103/01377', '3 Nov 2026', 4_997_500, 'Bambang Setiawan', '1010', 'Instant transfer out'),
    suggestion: 'Post Rp 2.500 to 5210 Clearing fees',
  },
]

export const typeLabel: Record<BreakType, string> = {
  amount: 'Amount mismatch',
  'missing-bank': 'Missing in bank',
  'missing-ledger': 'Missing in ledger',
  duplicate: 'Duplicate',
}

/** The amount a break holds out of reconciliation. */
export const breakAmount = (b: Break) => Math.max(b.ledger?.amount ?? 0, b.bank?.amount ?? 0)
export const breakDifference = (b: Break) => (b.ledger?.amount ?? 0) - (b.bank?.amount ?? 0)

/* ── Formatting ──────────────────────────────────────────────────────────────────────── */

const MINUS = '−'
export const idr = (v: number) => new Intl.NumberFormat('id-ID').format(Math.round(v))
export const usd = (v: number) => new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)
export const amount = (v: number, currency: 'IDR' | 'USD') => (currency === 'IDR' ? idr(v) : usd(v))
export const rp = (v: number) => `Rp ${idr(v)}`
export const signedRp = (v: number) => (v === 0 ? 'Rp 0' : `${v < 0 ? MINUS : '+'}Rp ${idr(Math.abs(v))}`)
export const bn = (v: number, digits = 1) =>
  new Intl.NumberFormat('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(v).replace('-', MINUS)
/** "312.4 M" style, IDR millions. */
export const millions = (v: number) => `${bn(v / 1e6)} M`
