/**
 * Mobile banking · Arunika, the neo bank. One flow across three phones: home, the review step
 * of a transfer, and its receipt. Sari Wulandari sends Dimas Anggara his share of November's
 * rent on Tuesday 3 Nov 2026 at 10:42 WIB.
 */

export const user = { name: 'Sari Wulandari', first: 'Sari' }

export interface Account {
  id: 'main' | 'savings' | 'usd'
  label: string
  name: string
  number: string
  currency: 'IDR' | 'USD'
  balance: number
  /** Money on hold: card authorisations not yet settled. */
  pending: number
  /** Change this week. */
  week: number
}

export const accounts: Account[] = [
  { id: 'main', label: 'Main', name: 'Main account', number: '4417 2280 3301', currency: 'IDR', balance: 48_215_400, pending: 1_845_000, week: 16_284_600 },
  { id: 'savings', label: 'Savings', name: 'House, 2028', number: '4417 2280 3319', currency: 'IDR', balance: 126_400_000, pending: 0, week: 2_500_000 },
  { id: 'usd', label: 'USD', name: 'USD wallet', number: '4417 2280 3327', currency: 'USD', balance: 1_284.5, pending: 0, week: -112.4 },
]

export interface Activity {
  id: string
  day: 'Today' | 'Yesterday' | '1 Nov'
  time: string
  name: string
  detail: string
  amount: number
  pending?: boolean
}

export const activity: Activity[] = [
  { id: 'a1', day: 'Today', time: '08:12', name: 'Kopi Senja Kemang', detail: 'Food, coffee', amount: -54_000 },
  { id: 'a2', day: 'Today', time: '07:00', name: 'PT Nusantara Logistik', detail: 'Income, salary', amount: 18_750_000 },
  { id: 'a3', day: 'Yesterday', time: '19:40', name: 'Toko Buku Pena', detail: 'Shopping, books', amount: -212_000 },
  { id: 'a4', day: 'Yesterday', time: '13:05', name: 'Rina Hartono', detail: 'Income, transfer', amount: 350_000 },
  { id: 'a5', day: 'Yesterday', time: '09:30', name: 'Nusa Air', detail: 'Travel, card 4821', amount: -1_845_000, pending: true },
  { id: 'a6', day: '1 Nov', time: '21:14', name: 'Electricity token', detail: 'Bills, meter 5412 0087 331', amount: -500_000 },
  { id: 'a7', day: '1 Nov', time: '12:48', name: 'Warung Sate Pak Darmo', detail: 'Food, lunch', amount: -96_000 },
]

/** Monthly budget, IDR. Spending is summed from November's outgoing rows by category. */
export const budget = 9_000_000
export const categoryOf = (a: Activity) => a.detail.split(',')[0]

export const recipient = {
  name: 'Dimas Anggara',
  bank: 'Bank Kencana',
  number: '1188 4420 9915',
  saved: 'Saved 12 Mar 2025 · 9 transfers',
}

export const transfer = {
  amount: 2_750_000,
  reference: 'Rent, November',
  speeds: {
    instant: { label: 'Instant', fee: 2_500, arrival: 'Within a minute' },
    standard: { label: 'Standard', fee: 0, arrival: 'Today by 15:00 WIB' },
  },
}

/* ── Formatting ──────────────────────────────────────────────────────────────────────────── */

const MINUS = '−'
export const rp = (v: number) => `Rp ${new Intl.NumberFormat('id-ID').format(Math.round(Math.abs(v)))}`
export const signedRp = (v: number) => `${v < 0 ? MINUS : '+'}${rp(v)}`
export const usd = (v: number) =>
  `USD ${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(v))}`
export const money = (v: number, currency: 'IDR' | 'USD') => (currency === 'IDR' ? rp(v) : usd(v))
export const signedMoney = (v: number, currency: 'IDR' | 'USD') => `${v < 0 ? MINUS : '+'}${money(v, currency)}`
