/**
 * Sesi Admin · settlements and KYC. Sesi is 21 Strive's booking platform; this is its internal
 * admin. Today is Thursday 12 Nov 2026, 14:20 WIB.
 *
 * Everything is deterministic and derived from one source, so the screen agrees with itself:
 * the batch table, the settled-per-day chart, "Settled today" and "Pending settlement" are all
 * computed from the same batches.
 */
import type { StatusTone } from '@/design-system'

/* ── Clock ──────────────────────────────────────────────────────────────────────────── */

export const NOW_LABEL = '12 Nov 2026 · 14:20 WIB'
/** Minutes since 00:00 WIB on 12 Nov 2026. */
export const NOW_MINUTES = 14 * 60 + 20

/* ── Formatting ─────────────────────────────────────────────────────────────────────── */

const idr = new Intl.NumberFormat('id-ID')
const en = new Intl.NumberFormat('en-US')

/** 486250000 → "486.250.000" (Indonesian grouping, for amounts in a column under an "Rp" head). */
export const rupiahDigits = (value: number) => idr.format(Math.round(value))
/** 486250000 → "Rp 486.250.000" */
export const rupiah = (value: number) => `Rp ${rupiahDigits(value)}`
/** 1527680000 → "1.53" (billions, English decimal point, as in "IDR 1.53 bn"). */
export const billions = (value: number, digits = 2) => (value / 1e9).toFixed(digits)
/** 268400000 → "268.4" (millions). */
export const millions = (value: number, digits = 1) => (value / 1e6).toFixed(digits)
/** Counts in English: 4812 → "4,812". */
export const count = (value: number) => en.format(value)

/** 135 → "2 h 15 m" */
export function duration(minutes: number) {
  const m = Math.abs(Math.round(minutes))
  const h = Math.floor(m / 60)
  return h ? `${h} h ${String(m % 60).padStart(2, '0')} m` : `${m} m`
}

const clock = (minutes: number) =>
  `${String(Math.floor(minutes / 60) % 24).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`

/* ── Deterministic noise ────────────────────────────────────────────────────────────── */

function mulberry32(seed: number) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/* ── Days: 14 Oct – 12 Nov 2026 ─────────────────────────────────────────────────────── */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const TODAY_UTC = Date.UTC(2026, 10, 12)

export interface Day {
  index: number
  /** "12 Nov" */
  label: string
  /** "12 Nov 2026" */
  long: string
  weekday: string
  weekend: boolean
  isToday: boolean
  /** "20261112", for batch ids. */
  ymd: string
}

export const DAY_COUNT = 30

export const days: Day[] = Array.from({ length: DAY_COUNT }, (_, index) => {
  const date = new Date(TODAY_UTC - (DAY_COUNT - 1 - index) * 86_400_000)
  const d = date.getUTCDate()
  const month = MONTHS[date.getUTCMonth()]
  const dow = date.getUTCDay()
  return {
    index,
    label: `${d} ${month}`,
    long: `${d} ${month} ${date.getUTCFullYear()}`,
    weekday: WEEKDAYS[dow],
    weekend: dow === 0 || dow === 6,
    isToday: index === DAY_COUNT - 1,
    ymd: `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, '0')}${String(d).padStart(2, '0')}`,
  }
})

export const TODAY_INDEX = DAY_COUNT - 1

/* ── Settlement batches ─────────────────────────────────────────────────────────────── */

export const BANKS = ['Arta Kencana', 'Nusa Raya', 'Sagara', 'Lestari Jaya'] as const
export type Bank = (typeof BANKS)[number]

export type BatchStatus = 'SETTLED' | 'PROCESSING' | 'QUEUED' | 'PARTIAL' | 'FAILED'

export interface Batch {
  id: string
  day: number
  /** Settlement window, WIB. */
  window: string
  bank: Bank
  /** Payouts in the batch. */
  items: number
  amount: number
  status: BatchStatus
  /** "12 Nov 07:41", WIB. */
  settledAt: string | null
  settledItems: number
  settledAmount: number
  /** Why a batch failed or came back partial. */
  note?: string
}

export const STATUS_TONE: Record<BatchStatus, StatusTone> = {
  SETTLED: 'success',
  PROCESSING: 'brand',
  QUEUED: 'neutral',
  PARTIAL: 'warning',
  FAILED: 'danger',
}

const BANK_WEIGHT: Record<Bank, number> = { 'Arta Kencana': 0.35, 'Nusa Raya': 0.26, Sagara: 0.17, 'Lestari Jaya': 0.22 }
const WEEKDAY_WINDOWS = [
  { at: '07:00', weight: 0.46 },
  { at: '11:00', weight: 0.31 },
  { at: '15:00', weight: 0.23 },
]
/** The two banks on the real-time rail also settle at weekends, in one window. */
const WEEKEND_SLOTS: { bank: Bank; weight: number }[] = [
  { bank: 'Nusa Raya', weight: 0.58 },
  { bank: 'Sagara', weight: 0.42 },
]

/** Daily settled totals for 14 Oct – 11 Nov, IDR billions. Mondays carry the weekend. */
const PAST_TOTALS_BN = [
  1.71, 1.64, 1.88, 0.52, 0.41, 2.26, 1.79, 1.68, 1.73, 1.95, 0.58, 0.44, 2.31, 1.84, 1.77, 1.81, 2.04, 0.63, 0.47, 2.42,
  1.92, 1.86, 1.9, 2.11, 0.66, 0.49, 2.48, 1.97, 2.02,
]

function buildPast(): Batch[] {
  const rand = mulberry32(20261112)
  const out: Batch[] = []
  PAST_TOTALS_BN.forEach((bn, dayIndex) => {
    const day = days[dayIndex]
    // A few million either side, so no day lands on a round figure.
    const total = Math.round((bn * 1e9 + (rand() - 0.5) * 9.8e6) / 10_000) * 10_000
    const slots = day.weekend
      ? WEEKEND_SLOTS.map((s) => ({ window: '11:00', bank: s.bank, weight: s.weight }))
      : WEEKDAY_WINDOWS.flatMap((w) => BANKS.map((bank) => ({ window: w.at, bank, weight: w.weight * BANK_WEIGHT[bank] })))
    const weights = slots.map((s) => s.weight * (0.92 + rand() * 0.16))
    const sum = weights.reduce((a, b) => a + b, 0)
    let left = total
    slots.forEach((slot, i) => {
      const amount = i === slots.length - 1 ? left : Math.round((total * weights[i]) / sum / 10_000) * 10_000
      left -= amount
      const items = Math.max(12, Math.round(amount / (2_270_000 * (0.88 + rand() * 0.24))))
      const [h, m] = slot.window.split(':').map(Number)
      const settled = h * 60 + m + 34 + Math.floor(rand() * 29)
      out.push({
        id: `STL-${day.ymd}-${String(i + 1).padStart(2, '0')}`,
        day: dayIndex,
        window: slot.window,
        bank: slot.bank,
        items,
        amount,
        status: 'SETTLED',
        settledAt: `${day.label} ${clock(settled)}`,
        settledItems: items,
        settledAmount: amount,
      })
    })
  })

  // Friday 6 Nov: three payouts to Bank Sagara bounced (closed accounts) and went back to the merchants.
  const partial = out.find((b) => days[b.day].label === '6 Nov' && b.window === '11:00' && b.bank === 'Sagara')
  if (partial) {
    partial.status = 'PARTIAL'
    partial.settledItems = partial.items - 3
    partial.settledAmount = partial.amount - 6_420_000
    partial.note = '3 payouts returned: account closed (code 014)'
  }
  return out
}

/** Today's twelve batches, three windows × four banks. The 15:00 window is still filling. */
function buildToday(): Batch[] {
  const day = days[TODAY_INDEX]
  const rows: [Bank, string, number, number, BatchStatus, string | null][] = [
    ['Arta Kencana', '07:00', 214, 486_250_000, 'SETTLED', '07:41'],
    ['Nusa Raya', '07:00', 168, 352_910_000, 'SETTLED', '07:44'],
    ['Sagara', '07:00', 97, 201_480_000, 'PARTIAL', '07:58'],
    ['Lestari Jaya', '07:00', 133, 291_770_000, 'SETTLED', '07:49'],
    ['Arta Kencana', '11:00', 142, 318_460_000, 'PROCESSING', null],
    ['Nusa Raya', '11:00', 109, 241_380_000, 'FAILED', null],
    ['Sagara', '11:00', 61, 132_940_000, 'PROCESSING', null],
    ['Lestari Jaya', '11:00', 94, 208_630_000, 'SETTLED', '11:36'],
    ['Arta Kencana', '15:00', 112, 214_870_000, 'QUEUED', null],
    ['Nusa Raya', '15:00', 84, 163_240_000, 'QUEUED', null],
    ['Sagara', '15:00', 47, 96_180_000, 'QUEUED', null],
    ['Lestari Jaya', '15:00', 58, 117_230_000, 'QUEUED', null],
  ]
  return rows.map(([bank, window, items, amount, status, at], i) => {
    const batch: Batch = {
      id: `STL-${day.ymd}-${String(i + 1).padStart(2, '0')}`,
      day: TODAY_INDEX,
      window,
      bank,
      items,
      amount,
      status,
      settledAt: at ? `${day.label} ${at}` : null,
      settledItems: status === 'SETTLED' ? items : 0,
      settledAmount: status === 'SETTLED' ? amount : 0,
    }
    if (status === 'PARTIAL') {
      batch.settledItems = 91
      batch.settledAmount = 188_120_000
      batch.note = '6 payouts returned: name does not match account'
    }
    if (status === 'FAILED') batch.note = 'Bank rejected the file at 11:07: invalid X-SIGNATURE'
    return batch
  })
}

/** Every batch of the last 30 days, oldest first. */
export const initialBatches: Batch[] = [...buildPast(), ...buildToday()]

export const isInFlight = (b: Batch) => b.status === 'PROCESSING' || b.status === 'QUEUED' || b.status === 'FAILED'

/* ── Balance ────────────────────────────────────────────────────────────────────────── */

export const balance = {
  /** Collected from customers, not yet in a batch. */
  available: 4_812_650_000,
  reserve: 268_400_000,
  disputes: 43_600_000,
}

/* ── KYC review queue ───────────────────────────────────────────────────────────────── */

export type Risk = 'LOW' | 'MEDIUM' | 'HIGH'
export const RISK_TONE: Record<Risk, StatusTone> = { LOW: 'success', MEDIUM: 'warning', HIGH: 'danger' }

/** `card` an ID-sized card · `portrait` a selfie · `page` an A4 document. */
export type DocKind = 'card' | 'portrait' | 'page'

export interface KycField {
  label: string
  value: string
  mono?: boolean
  /** What the application says, when the document disagrees. Marks the field as flagged. */
  expected?: string
  /** What `expected` is: "Application" (default) or "Threshold". */
  expectedFrom?: string
  /** The flag's word: "Mismatch" (default) or "Below threshold". */
  flag?: string
  hint?: string
}

export interface KycDocument {
  /** Option label: "KTP front". */
  label: string
  /** Frame caption: "KTP · FRONT". */
  caption: string
  kind: DocKind
  pixels: string
  uploaded: string
  hash: string
  fields: KycField[]
}

export interface KycCheck {
  label: string
  value: string
  tone: StatusTone
  hint?: string
}

export interface KycApplicant {
  id: string
  business: string
  owner: string
  category: string
  city: string
  docType: string
  risk: Risk
  /** Minutes from 00:00 WIB on 12 Nov 2026; negative is the day before. */
  submitted: number
  /** Automated match score, 0–1. */
  score: number
  documents: KycDocument[]
  checks: KycCheck[]
}

/** Review within 24 hours of submission. */
export const SLA_MINUTES = 24 * 60

export function slaOf(a: KycApplicant) {
  const left = a.submitted + SLA_MINUTES - NOW_MINUTES
  if (left < 0) return { left, tone: 'danger' as const, word: 'Breached', text: `${duration(left)} over` }
  if (left < 6 * 60) return { left, tone: 'warning' as const, word: 'Due soon', text: `${duration(left)} left` }
  return { left, tone: 'success' as const, word: 'On track', text: `${duration(left)} left` }
}

export function submittedLabel(minutes: number) {
  const dayLabel = minutes < 0 ? '11 Nov' : '12 Nov'
  return `${dayLabel} ${clock(((minutes % 1440) + 1440) % 1440)}`
}

const CARD = '2480 × 1565 px'
const SELFIE = '1536 × 2048 px'
const PAGE = '2480 × 3508 px'

function ktpFront(f: { nik: string; name: string; expectedName?: string; born: string; expectedBorn?: string; address: string; job?: string; uploaded: string; hash: string }): KycDocument {
  return {
    label: 'KTP front',
    caption: 'KTP · front',
    kind: 'card',
    pixels: CARD,
    uploaded: f.uploaded,
    hash: f.hash,
    fields: [
      { label: 'NIK', value: f.nik, mono: true },
      { label: 'Name', value: f.name, expected: f.expectedName },
      { label: 'Place, date of birth', value: f.born, expected: f.expectedBorn },
      { label: 'Address', value: f.address },
      { label: 'Occupation', value: f.job ?? 'WIRASWASTA', hint: 'Self-employed' },
      { label: 'Valid until', value: 'SEUMUR HIDUP', hint: 'Lifetime' },
    ],
  }
}

function selfie(f: { match: string; expected?: string; captured: string; device: string; uploaded: string; hash: string }): KycDocument {
  return {
    label: 'Selfie',
    caption: 'Selfie with KTP',
    kind: 'portrait',
    pixels: SELFIE,
    uploaded: f.uploaded,
    hash: f.hash,
    fields: [
      {
        label: 'Face match',
        value: f.match,
        mono: true,
        expected: f.expected,
        expectedFrom: 'Threshold',
        flag: 'Below threshold',
        hint: f.expected ? undefined : 'Threshold 0.80',
      },
      { label: 'Liveness', value: 'Passed', hint: 'Blink and turn, 3 frames' },
      { label: 'Captured', value: f.captured, mono: true },
      { label: 'Device', value: f.device },
    ],
  }
}

function npwp(f: { number: string; name: string; address: string; uploaded: string; hash: string }): KycDocument {
  return {
    label: 'NPWP',
    caption: 'NPWP · tax id',
    kind: 'card',
    pixels: CARD,
    uploaded: f.uploaded,
    hash: f.hash,
    fields: [
      { label: 'NPWP', value: f.number, mono: true },
      { label: 'Name', value: f.name },
      { label: 'Registered address', value: f.address },
    ],
  }
}

function nib(f: { number: string; name: string; kbli: string; address: string; issued: string; uploaded: string; hash: string }): KycDocument {
  return {
    label: 'NIB',
    caption: 'NIB · business licence',
    kind: 'page',
    pixels: PAGE,
    uploaded: f.uploaded,
    hash: f.hash,
    fields: [
      { label: 'NIB', value: f.number, mono: true },
      { label: 'Business name', value: f.name },
      { label: 'KBLI', value: f.kbli },
      { label: 'Address', value: f.address },
      { label: 'Issued', value: f.issued, mono: true },
      { label: 'Registry status', value: 'Active' },
    ],
  }
}

export const initialQueue: KycApplicant[] = [
  {
    id: 'KYC-2026-004169',
    business: 'Lapangan Futsal Garuda',
    owner: 'Hendra Wijaya',
    category: 'Futsal courts',
    city: 'Bekasi',
    docType: 'Bank statement',
    risk: 'HIGH',
    submitted: -1440 + 12 * 60 + 31,
    score: 0.58,
    documents: [
      {
        label: 'Statement p. 1',
        caption: 'Bank statement · page 1 of 2',
        kind: 'page',
        pixels: PAGE,
        uploaded: '11 Nov 12:29 WIB',
        hash: 'C41A…07FE',
        fields: [
          { label: 'Bank', value: 'Bank Nusa Raya' },
          { label: 'Account holder', value: 'CV GARUDA SPORTINDO', expected: 'Hendra Wijaya' },
          { label: 'Account', value: '•••• •••• 7712', mono: true },
          { label: 'Period', value: '1–31 Oct 2026' },
          { label: 'Closing balance', value: 'Rp 84.215.300', mono: true },
        ],
      },
      {
        label: 'Statement p. 2',
        caption: 'Bank statement · page 2 of 2',
        kind: 'page',
        pixels: PAGE,
        uploaded: '11 Nov 12:29 WIB',
        hash: '5D90…B2C3',
        fields: [
          { label: 'Transactions', value: '142', mono: true },
          { label: 'Largest credit', value: 'Rp 12.500.000 · 18 Oct', mono: true },
          { label: 'Round-sum transfers', value: '3 in 48 hours', hint: 'Above the usual pattern for a court' },
          { label: 'PDF producer', value: 'Edited after issue', hint: 'Metadata differs from the bank template' },
        ],
      },
      ktpFront({
        nik: '3275 0418 0279 0011',
        name: 'HENDRA WIJAYA',
        born: 'BEKASI, 18-02-1979',
        address: 'JL. GARUDA NO. 7, RT 003/RW 011, BEKASI TIMUR',
        uploaded: '11 Nov 12:27 WIB',
        hash: '8E13…4A9D',
      }),
    ],
    checks: [
      { label: 'Account holder vs applicant', value: 'Mismatch', tone: 'danger', hint: 'Business account, applicant is a person' },
      { label: 'Statement authenticity', value: 'Edited after issue', tone: 'danger' },
      { label: 'Population registry', value: 'Match', tone: 'success' },
      { label: 'Sanctions and PEP screening', value: 'Clear', tone: 'success' },
      { label: 'Device velocity', value: '3 applications in 7 days', tone: 'warning' },
    ],
  },
  {
    id: 'KYC-2026-004171',
    business: 'Barbershop Kapten',
    owner: 'Yoga Prasetyo',
    category: 'Barbershop',
    city: 'Yogyakarta',
    docType: 'KTP',
    risk: 'HIGH',
    submitted: -1440 + 16 * 60 + 5,
    score: 0.64,
    documents: [
      ktpFront({
        nik: '3404 0907 9501 0003',
        name: 'YOGA PRASETYO',
        born: 'SLEMAN, 09-07-1995',
        address: 'JL. KALIURANG KM 5, CATURTUNGGAL, DEPOK, SLEMAN',
        uploaded: '11 Nov 16:02 WIB',
        hash: '2B7C…91E0',
      }),
      selfie({ match: '0.71', expected: '0.80', captured: '11 Nov 2026 16:01 WIB', device: 'Android 13 · emulator suspected', uploaded: '11 Nov 16:03 WIB', hash: 'F0A2…3C58' }),
      npwp({ number: '71.502.118.6-541.000', name: 'YOGA PRASETYO', address: 'JL. KALIURANG KM 5, SLEMAN', uploaded: '11 Nov 16:04 WIB', hash: '6C11…D7A4' }),
    ],
    checks: [
      { label: 'Face match', value: '0.71', tone: 'danger', hint: 'Below the 0.80 threshold' },
      { label: 'Device integrity', value: 'Emulator suspected', tone: 'warning' },
      { label: 'Population registry', value: 'Match', tone: 'success' },
      { label: 'Sanctions and PEP screening', value: 'Clear', tone: 'success' },
    ],
  },
  {
    id: 'KYC-2026-004174',
    business: 'Bengkel Motor Jaya Abadi',
    owner: 'Agus Salim',
    category: 'Motorcycle workshop',
    city: 'Surabaya',
    docType: 'KTP',
    risk: 'MEDIUM',
    submitted: -1440 + 19 * 60 + 58,
    score: 0.79,
    documents: [
      ktpFront({
        nik: '3578 1708 8602 0007',
        name: 'AGUS SALIM',
        born: 'SURABAYA, 17-08-1986',
        expectedBorn: '17 Aug 1985',
        address: 'JL. KAPAS KRAMPUNG NO. 41, TAMBAKSARI, SURABAYA',
        uploaded: '11 Nov 19:55 WIB',
        hash: '3F88…0B1D',
      }),
      selfie({ match: '0.91', captured: '11 Nov 2026 19:54 WIB', device: 'iOS 19 · Sesi app 4.12.0', uploaded: '11 Nov 19:56 WIB', hash: 'A9D4…62F7' }),
      npwp({ number: '84.611.903.2-619.000', name: 'AGUS SALIM', address: 'JL. KAPAS KRAMPUNG NO. 41, SURABAYA', uploaded: '11 Nov 19:57 WIB', hash: '0E5B…C834' }),
    ],
    checks: [
      { label: 'Date of birth vs application', value: 'Mismatch', tone: 'warning', hint: 'One year apart' },
      { label: 'Population registry', value: 'Match', tone: 'success' },
      { label: 'Face match', value: '0.91', tone: 'success' },
      { label: 'Sanctions and PEP screening', value: 'Clear', tone: 'success' },
    ],
  },
  {
    id: 'KYC-2026-004177',
    business: 'Klinik Gigi Senyum Sehat',
    owner: 'drg. Arif Hidayat',
    category: 'Dental clinic',
    city: 'Bandung',
    docType: 'NIB',
    risk: 'LOW',
    submitted: -1440 + 21 * 60 + 40,
    score: 0.97,
    documents: [
      nib({
        number: '9120 0123 4567 8',
        name: 'KLINIK GIGI SENYUM SEHAT',
        kbli: '86230 · Dental practice',
        address: 'JL. DAGO NO. 112, COBLONG, BANDUNG',
        issued: '03-02-2024',
        uploaded: '11 Nov 21:36 WIB',
        hash: '7A20…E9C1',
      }),
      ktpFront({
        nik: '3273 0211 8104 0002',
        name: 'ARIF HIDAYAT',
        born: 'BANDUNG, 02-11-1981',
        address: 'JL. CIUMBULEUIT NO. 30, CIDADAP, BANDUNG',
        job: 'DOKTER GIGI',
        uploaded: '11 Nov 21:37 WIB',
        hash: 'B3E6…1F42',
      }),
      npwp({ number: '62.017.335.4-423.000', name: 'ARIF HIDAYAT', address: 'JL. DAGO NO. 112, BANDUNG', uploaded: '11 Nov 21:38 WIB', hash: '4D7F…A06B' }),
    ],
    checks: [
      { label: 'Business registry', value: 'Active', tone: 'success' },
      { label: 'Population registry', value: 'Match', tone: 'success' },
      { label: 'Owner vs licence', value: 'Match', tone: 'success' },
      { label: 'Sanctions and PEP screening', value: 'Clear', tone: 'success' },
    ],
  },
  {
    id: 'KYC-2026-004182',
    business: 'Studio Lentera Pilates',
    owner: 'Dewi Anggraini',
    category: 'Pilates studio',
    city: 'Jakarta Selatan',
    docType: 'KTP',
    risk: 'MEDIUM',
    submitted: 9 * 60 + 14,
    score: 0.86,
    documents: [
      ktpFront({
        nik: '3174 0512 8803 0004',
        name: 'DEWI ANGGRAENI',
        expectedName: 'Dewi Anggraini',
        born: 'BANDUNG, 12-03-1988',
        address: 'JL. KEMANG RAYA NO. 18, RT 004/RW 002, BANGKA, MAMPANG PRAPATAN',
        uploaded: '12 Nov 09:12 WIB',
        hash: '9F2C…E41A',
      }),
      {
        label: 'KTP back',
        caption: 'KTP · back',
        kind: 'card',
        pixels: CARD,
        uploaded: '12 Nov 09:12 WIB',
        hash: '1C6E…5B08',
        fields: [
          { label: 'Issued in', value: 'JAKARTA SELATAN' },
          { label: 'Issued on', value: '21-06-2017', mono: true },
          { label: 'Signature', value: 'Present' },
        ],
      },
      selfie({ match: '0.94', captured: '12 Nov 2026 09:11 WIB', device: 'Android 15 · Sesi app 4.12.0', uploaded: '12 Nov 09:13 WIB', hash: 'E27D…8C90' }),
      npwp({ number: '09.254.294.3-407.000', name: 'DEWI ANGGRAINI', address: 'JL. KEMANG RAYA NO. 18, JAKARTA SELATAN', uploaded: '12 Nov 09:14 WIB', hash: '5A3B…F162' }),
    ],
    checks: [
      { label: 'Name vs application', value: 'Mismatch', tone: 'warning', hint: 'One letter: ANGGRAENI on the KTP' },
      { label: 'Name on NPWP', value: 'Match', tone: 'success' },
      { label: 'Population registry', value: 'Match', tone: 'success' },
      { label: 'Face match', value: '0.94', tone: 'success' },
      { label: 'Sanctions and PEP screening', value: 'Clear', tone: 'success' },
    ],
  },
  {
    id: 'KYC-2026-004186',
    business: 'Rumah Yoga Ubud',
    owner: 'I Made Suarta',
    category: 'Yoga studio',
    city: 'Gianyar',
    docType: 'NPWP',
    risk: 'LOW',
    submitted: 11 * 60 + 2,
    score: 0.95,
    documents: [
      npwp({ number: '35.880.412.7-907.000', name: 'I MADE SUARTA', address: 'JL. RAYA UBUD NO. 9, GIANYAR', uploaded: '12 Nov 11:00 WIB', hash: 'D815…27AE' }),
      ktpFront({
        nik: '5104 0612 7703 0001',
        name: 'I MADE SUARTA',
        born: 'GIANYAR, 06-12-1977',
        address: 'JL. RAYA UBUD NO. 9, PELIATAN, UBUD, GIANYAR',
        uploaded: '12 Nov 10:58 WIB',
        hash: '64C0…9B3F',
      }),
      selfie({ match: '0.96', captured: '12 Nov 2026 10:57 WIB', device: 'iOS 19 · Sesi app 4.12.0', uploaded: '12 Nov 10:59 WIB', hash: '2F9A…C4D1' }),
    ],
    checks: [
      { label: 'Tax registry', value: 'Valid', tone: 'success' },
      { label: 'Population registry', value: 'Match', tone: 'success' },
      { label: 'Face match', value: '0.96', tone: 'success' },
      { label: 'Sanctions and PEP screening', value: 'Clear', tone: 'success' },
    ],
  },
  {
    id: 'KYC-2026-004188',
    business: 'Salon Cantika',
    owner: 'Rina Kusuma',
    category: 'Beauty salon',
    city: 'Medan',
    docType: 'Akta pendirian',
    risk: 'MEDIUM',
    submitted: 12 * 60 + 47,
    score: 0.82,
    documents: [
      {
        label: 'Akta',
        caption: 'Akta pendirian · deed of establishment',
        kind: 'page',
        pixels: PAGE,
        uploaded: '12 Nov 12:44 WIB',
        hash: '0B4D…7E25',
        fields: [
          { label: 'Deed', value: 'No. 14 · 08-05-2023', mono: true },
          { label: 'Notary', value: 'Siti Rahmawati, S.H., M.Kn.' },
          { label: 'Company', value: 'PT CANTIKA INDAH LESTARI' },
          { label: 'Director', value: 'RINA KUSUMAWATI', expected: 'Rina Kusuma' },
          { label: 'Paid-up capital', value: 'Rp 50.000.000', mono: true },
        ],
      },
      ktpFront({
        nik: '1271 0306 9007 0005',
        name: 'RINA KUSUMAWATI',
        born: 'MEDAN, 03-06-1990',
        address: 'JL. GATOT SUBROTO NO. 77, PETISAH TENGAH, MEDAN',
        uploaded: '12 Nov 12:45 WIB',
        hash: 'C9E2…14B6',
      }),
      npwp({ number: '53.204.771.9-113.000', name: 'PT CANTIKA INDAH LESTARI', address: 'JL. GATOT SUBROTO NO. 77, MEDAN', uploaded: '12 Nov 12:46 WIB', hash: '87AF…3D02' }),
    ],
    checks: [
      { label: 'Director vs applicant', value: 'Mismatch', tone: 'warning', hint: 'Application uses a short name' },
      { label: 'Business registry', value: 'Active', tone: 'success' },
      { label: 'Population registry', value: 'Match', tone: 'success' },
      { label: 'Sanctions and PEP screening', value: 'Clear', tone: 'success' },
    ],
  },
  {
    id: 'KYC-2026-004190',
    business: 'Padel Club Senayan',
    owner: 'Kevin Tanoto',
    category: 'Padel courts',
    city: 'Jakarta Pusat',
    docType: 'NIB',
    risk: 'LOW',
    submitted: 13 * 60 + 55,
    score: 0.93,
    documents: [
      nib({
        number: '9120 0876 5432 1',
        name: 'PADEL CLUB SENAYAN',
        kbli: '93112 · Sports facilities',
        address: 'JL. ASIA AFRIKA NO. 8, GELORA, TANAH ABANG',
        issued: '19-09-2025',
        uploaded: '12 Nov 13:51 WIB',
        hash: '3E70…B8A9',
      }),
      ktpFront({
        nik: '3171 2205 9206 0008',
        name: 'KEVIN TANOTO',
        born: 'JAKARTA, 22-05-1992',
        address: 'JL. SENAYAN NO. 21, RAWA BARAT, KEBAYORAN BARU',
        uploaded: '12 Nov 13:52 WIB',
        hash: 'A1C5…60EF',
      }),
      npwp({ number: '44.710.208.1-075.000', name: 'KEVIN TANOTO', address: 'JL. SENAYAN NO. 21, JAKARTA SELATAN', uploaded: '12 Nov 13:53 WIB', hash: '9B26…DF14' }),
    ],
    checks: [
      { label: 'Business registry', value: 'Active', tone: 'success' },
      { label: 'Population registry', value: 'Match', tone: 'success' },
      { label: 'Owner vs licence', value: 'Match', tone: 'success' },
      { label: 'Sanctions and PEP screening', value: 'Clear', tone: 'success' },
    ],
  },
]

export const REJECT_REASONS = [
  { label: 'Name does not match the ID', value: 'name' },
  { label: 'Document unreadable or cropped', value: 'unreadable' },
  { label: 'Document expired', value: 'expired' },
  { label: 'Suspected tampering', value: 'tampering' },
  { label: 'Business details do not match the registry', value: 'registry' },
  { label: 'Other', value: 'other' },
]

/* ── Error groups ───────────────────────────────────────────────────────────────────── */

export type ErrorLevel = 'ERROR' | 'WARNING'
export type ErrorState = 'OPEN' | 'RESOLVED' | 'MUTED'

export interface ErrorGroup {
  id: string
  level: ErrorLevel
  message: string
  service: string
  /** Events per hour, 15:00 yesterday → 14:00 today. */
  hourly: number[]
  firstSeen: string
  lastSeen: string
  state: ErrorState
  /** First seen in the last 24 hours. */
  isNew?: boolean
}

/** Spreads `total` events over 24 hours following `shape`, so the counts add up exactly. */
function spread(total: number, shape: number[]): number[] {
  const sum = shape.reduce((a, b) => a + b, 0)
  const raw = shape.map((s) => (s / sum) * total)
  const out = raw.map(Math.floor)
  let left = total - out.reduce((a, b) => a + b, 0)
  const order = raw.map((r, i) => ({ i, f: r - Math.floor(r) })).sort((a, b) => b.f - a.f)
  for (const { i } of order) {
    if (left <= 0) break
    out[i] += 1
    left -= 1
  }
  return out
}

// Index 0 is 15:00 yesterday, index 16 is 07:00 today, 20 is 11:00, 23 is 14:00.
const windows = [3, 2, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 2, 9, 4, 2, 2, 8, 3, 2, 3]

export const initialErrors: ErrorGroup[] = [
  {
    id: 'ERR-9K4',
    level: 'ERROR',
    message: 'webhook /settlement: invalid X-SIGNATURE from Bank Nusa Raya',
    service: 'api',
    hourly: spread(268, [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 22, 31, 28, 34]),
    firstSeen: '12 Nov 11:07',
    lastSeen: '14:19',
    state: 'OPEN',
    isNew: true,
  },
  {
    id: 'ERR-7Q2',
    level: 'ERROR',
    message: 'SettlementTotalMismatch: batch total 6908.139999999999 ≠ 6908.14',
    service: 'settlement-worker',
    hourly: spread(142, windows),
    firstSeen: '2 Nov 08:12',
    lastSeen: '14:18',
    state: 'OPEN',
  },
  {
    id: 'ERR-3HD',
    level: 'ERROR',
    message: 'payout.create: bank rejected account (code 014)',
    service: 'payout-worker',
    hourly: spread(37, [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 14, 3, 0, 0, 6, 0, 0, 0]),
    firstSeen: '28 Oct 10:44',
    lastSeen: '11:36',
    state: 'OPEN',
  },
  {
    id: 'ERR-5MX',
    level: 'WARNING',
    message: 'kyc.ocr: timeout after 30 s (provider ocr-2)',
    service: 'kyc-worker',
    hourly: spread(19, [0, 0, 0, 0, 0, 0, 0, 2, 1, 0, 0, 0, 0, 0, 0, 0, 1, 2, 3, 2, 1, 3, 2, 0]),
    firstSeen: '11 Nov 22:40',
    lastSeen: '13:52',
    state: 'OPEN',
    isNew: true,
  },
  {
    id: 'ERR-8RT',
    level: 'ERROR',
    message: 'booking.refund: idempotency key reused (409)',
    service: 'api',
    hourly: spread(8, [1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 2, 0, 0, 0, 0]),
    firstSeen: '5 Nov 16:20',
    lastSeen: '10:31',
    state: 'OPEN',
  },
  {
    id: 'ERR-2PL',
    level: 'WARNING',
    message: 'ledger.balance: drift of 0.01 on account PLATFORM',
    service: 'ledger',
    hourly: spread(3, [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0]),
    firstSeen: '9 Nov 05:10',
    lastSeen: '11:47',
    state: 'OPEN',
  },
]
