/**
 * Corporate cards · PT Nusantara Logistik on the Arunika Business programme.
 * Billing cycle 26 Oct – 25 Nov 2026; today is 3 Nov, day 9 of 31. Amounts in IDR millions
 * unless written out in full.
 */
import type { BulletRow } from '@/design-system'

export const cycle = { label: '26 Oct – 25 Nov', day: 9, days: 31 }
export const totalCards = 48

export type CardType = 'physical' | 'virtual'

export interface Channels {
  online: boolean
  atm: boolean
  contactless: boolean
  abroad: boolean
}

export interface Txn {
  id: string
  when: string
  merchant: string
  category: string
  amount: number
  status: 'settled' | 'pending' | 'declined'
  note?: string
  receipt: 'attached' | 'missing' | 'not needed'
}

export interface Card {
  id: string
  holder: string
  team: string
  purpose: string
  type: CardType
  last4: string
  expiry: string
  /** Monthly limit, IDR millions. */
  limit: number
  /** Spent this cycle, IDR millions. */
  spent: number
  frozen: boolean
  channels: Channels
  issued: string
  approver: string
  costCentre: string
  txns: Txn[]
}

const T = (id: string, when: string, merchant: string, category: string, amount: number, status: Txn['status'], receipt: Txn['receipt'], note?: string): Txn => ({
  id,
  when,
  merchant,
  category,
  amount,
  status,
  receipt,
  note,
})

export const cards: Card[] = [
  {
    id: 'CRD-0412',
    holder: 'Rizky Pratama',
    team: 'Operations & fleet',
    purpose: 'Fleet fuel and tolls',
    type: 'physical',
    last4: '4821',
    expiry: '09/29',
    limit: 150,
    spent: 38.4,
    frozen: false,
    channels: { online: false, atm: true, contactless: true, abroad: false },
    issued: '14 Sep 2025',
    approver: 'Fajar Nugroho',
    costCentre: 'CC-210 Fleet',
    txns: [
      T('TXN-88412', '3 Nov 09:12', 'SPBU Jagorawi KM 21', 'Fuel & tolls', 1_850_000, 'pending', 'missing'),
      T('TXN-88377', '2 Nov 17:40', 'Tol Cikampek–Palimanan', 'Fuel & tolls', 412_500, 'settled', 'not needed'),
      T('TXN-88301', '2 Nov 08:05', 'Bengkel Truk Sentosa', 'Fleet maintenance', 6_240_000, 'settled', 'attached'),
      T('TXN-88264', '1 Nov 22:31', 'Tol Batang–Semarang', 'Fuel & tolls', 289_000, 'settled', 'not needed'),
      T('TXN-88190', '31 Oct 14:20', 'SPBU Cikarang Barat', 'Fuel & tolls', 2_100_000, 'settled', 'attached'),
      T('TXN-88102', '30 Oct 06:48', 'Fuelstop Johor Bahru', 'Fuel & tolls', 1_420_000, 'declined', 'not needed', 'Use abroad is off'),
    ],
  },
  {
    id: 'CRD-0418',
    holder: 'Ayu Lestari',
    team: 'Sales & marketing',
    purpose: 'Advertising and software',
    type: 'virtual',
    last4: '7730',
    expiry: '03/28',
    limit: 80,
    spent: 61.2,
    frozen: false,
    channels: { online: true, atm: false, contactless: false, abroad: true },
    issued: '02 Mar 2025',
    approver: 'Sarah Lim',
    costCentre: 'CC-410 Marketing',
    txns: [
      T('TXN-88420', '3 Nov 10:02', 'Sinar Media Digital', 'Advertising', 18_500_000, 'pending', 'missing'),
      T('TXN-88351', '2 Nov 13:15', 'Stackwise Inc.', 'Cloud & software', 4_870_000, 'settled', 'attached'),
      T('TXN-88288', '1 Nov 09:00', 'Grafik Data Ltd', 'Cloud & software', 2_310_000, 'settled', 'attached'),
      T('TXN-88177', '31 Oct 11:44', 'Sinar Media Digital', 'Advertising', 21_000_000, 'settled', 'attached'),
      T('TXN-88061', '29 Oct 16:30', 'Kopi Senja Kemang', 'Meals', 645_000, 'settled', 'missing'),
    ],
  },
  {
    id: 'CRD-0425',
    holder: 'Daniel Wirawan',
    team: 'Travel',
    purpose: 'Client visits',
    type: 'physical',
    last4: '1094',
    expiry: '11/27',
    limit: 120,
    spent: 0,
    frozen: true,
    channels: { online: true, atm: false, contactless: true, abroad: true },
    issued: '20 Nov 2024',
    approver: 'Sarah Lim',
    costCentre: 'CC-120 Commercial',
    txns: [
      T('TXN-88233', '1 Nov 19:52', 'Nusa Air', 'Air travel', 3_480_000, 'declined', 'not needed', 'Card frozen'),
      T('TXN-87990', '24 Oct 08:10', 'Sagara Hotel Surabaya', 'Hotels', 2_950_000, 'settled', 'attached'),
      T('TXN-87921', '23 Oct 18:22', 'Nusa Air', 'Air travel', 2_715_000, 'settled', 'attached'),
    ],
  },
  {
    id: 'CRD-0431',
    holder: 'Mei Tanaka',
    team: 'Procurement',
    purpose: 'Spare parts and supplies',
    type: 'virtual',
    last4: '5562',
    expiry: '06/28',
    limit: 200,
    spent: 142.7,
    frozen: false,
    channels: { online: true, atm: false, contactless: false, abroad: true },
    issued: '11 Jun 2025',
    approver: 'Rizky Pratama',
    costCentre: 'CC-310 Procurement',
    txns: [
      T('TXN-88415', '3 Nov 09:40', 'Suku Cadang Prima', 'Fleet maintenance', 24_600_000, 'pending', 'missing'),
      T('TXN-88340', '2 Nov 11:05', 'Kaiyo Parts Co., Ltd.', 'Fleet maintenance', 38_200_000, 'settled', 'attached'),
      T('TXN-88250', '1 Nov 10:30', 'Toko Buku Pena', 'Office & supplies', 1_240_000, 'settled', 'attached'),
      T('TXN-88144', '30 Oct 15:18', 'Suku Cadang Prima', 'Fleet maintenance', 42_900_000, 'settled', 'attached'),
    ],
  },
  {
    id: 'CRD-0437',
    holder: 'Fajar Nugroho',
    team: 'Operations & fleet',
    purpose: 'Warehouse, Cikarang',
    type: 'physical',
    last4: '3318',
    expiry: '01/29',
    limit: 50,
    spent: 18.9,
    frozen: false,
    channels: { online: true, atm: true, contactless: true, abroad: false },
    issued: '08 Jan 2026',
    approver: 'Rizky Pratama',
    costCentre: 'CC-220 Warehousing',
    txns: [
      T('TXN-88398', '3 Nov 08:30', 'Kurir Kilat Nusantara', 'Freight & couriers', 3_150_000, 'settled', 'attached'),
      T('TXN-88322', '2 Nov 12:12', 'Warung Sate Pak Darmo', 'Meals', 860_000, 'settled', 'missing'),
      T('TXN-88207', '31 Oct 16:45', 'Toko Bangunan Makmur', 'Office & supplies', 4_720_000, 'settled', 'attached'),
    ],
  },
  {
    id: 'CRD-0442',
    holder: 'Sarah Lim',
    team: 'Finance & admin',
    purpose: 'Executive travel',
    type: 'physical',
    last4: '9047',
    expiry: '08/28',
    limit: 250,
    spent: 96.3,
    frozen: false,
    channels: { online: true, atm: true, contactless: true, abroad: true },
    issued: '17 Aug 2025',
    approver: 'Board, two signatures',
    costCentre: 'CC-010 Executive',
    txns: [
      T('TXN-88407', '3 Nov 07:55', 'Changi Airport Lounge', 'Meals', 1_120_000, 'settled', 'attached'),
      T('TXN-88368', '2 Nov 20:10', 'Marina Bay Suites', 'Hotels', 14_800_000, 'pending', 'missing'),
      T('TXN-88272', '1 Nov 06:30', 'Nusa Air', 'Air travel', 28_400_000, 'settled', 'attached'),
    ],
  },
  {
    id: 'CRD-0446',
    holder: 'Dimas Anggara',
    team: 'Engineering',
    purpose: 'Cloud and infrastructure',
    type: 'virtual',
    last4: '2275',
    expiry: '12/27',
    limit: 100,
    spent: 74.8,
    frozen: false,
    channels: { online: true, atm: false, contactless: false, abroad: true },
    issued: '05 Dec 2024',
    approver: 'Sarah Lim',
    costCentre: 'CC-510 Platform',
    txns: [
      T('TXN-88402', '3 Nov 00:00', 'Nimbus Cloud Services', 'Cloud & software', 41_250_000, 'settled', 'attached'),
      T('TXN-88301B', '1 Nov 00:00', 'Stackwise Inc.', 'Cloud & software', 9_870_000, 'settled', 'attached'),
      T('TXN-88199', '31 Oct 14:02', 'Grafik Data Ltd', 'Cloud & software', 6_300_000, 'settled', 'attached'),
    ],
  },
  {
    id: 'CRD-0451',
    holder: 'Putri Maharani',
    team: 'Sales & marketing',
    purpose: 'Events and sponsorship',
    type: 'virtual',
    last4: '6603',
    expiry: '05/27',
    limit: 40,
    spent: 12.1,
    frozen: false,
    channels: { online: true, atm: false, contactless: false, abroad: false },
    issued: '30 May 2025',
    approver: 'Ayu Lestari',
    costCentre: 'CC-420 Events',
    txns: [
      T('TXN-88389', '2 Nov 15:40', 'Balai Kartini Events', 'Advertising', 9_500_000, 'settled', 'attached'),
      T('TXN-88241', '1 Nov 12:00', 'Percetakan Cahaya', 'Office & supplies', 2_600_000, 'settled', 'missing'),
    ],
  },
]

/* ── Programme totals for all 48 cards, this cycle ──────────────────────────────────────── */

const teams: { team: string; spent: number; limit: number; scale: number }[] = [
  { team: 'Operations & fleet', spent: 212.4, limit: 600, scale: 800 },
  { team: 'Engineering', spent: 245.9, limit: 300, scale: 400 },
  { team: 'Procurement', spent: 184.3, limit: 400, scale: 500 },
  { team: 'Travel', spent: 117.9, limit: 350, scale: 400 },
  { team: 'Sales & marketing', spent: 96.5, limit: 250, scale: 300 },
  { team: 'Finance & admin', spent: 22.7, limit: 100, scale: 120 },
]

export const teamRows: BulletRow[] = teams.map((t) => ({
  label: t.team,
  sublabel: `${Math.round((t.spent / t.limit) * 100)}% of ${t.limit}`,
  value: t.spent,
  target: t.limit,
  ranges: [t.limit * 0.75, t.limit, t.scale],
}))

export const teamNearest = teams.reduce((a, b) => (b.spent / b.limit > a.spent / a.limit ? b : a))

export const categories = [
  { label: 'Cloud & software', value: 238.5 },
  { label: 'Fuel & tolls', value: 196.2 },
  { label: 'Freight & couriers', value: 142.8 },
  { label: 'Air travel', value: 96.4 },
  { label: 'Advertising', value: 74.1 },
  { label: 'Hotels', value: 52.6 },
  { label: 'Meals', value: 41.3 },
  { label: 'Office & supplies', value: 37.8 },
]

export const programmeSpent = teams.reduce((s, t) => s + t.spent, 0)

/** Declined payments in the last seven days, across the cards on this screen. */
export const declines = [
  { id: 'DCL-3317', when: '3 Nov 07:31', card: 'CRD-0418', merchant: 'ATM Kencana Sudirman', reason: 'ATM is off on a virtual card', amount: 2_500_000 },
  { id: 'DCL-3302', when: '2 Nov 21:14', card: 'CRD-0446', merchant: 'Stackwise Inc.', reason: 'Over the Rp 50.000.000 single-payment cap', amount: 52_000_000 },
  { id: 'DCL-3281', when: '1 Nov 19:52', card: 'CRD-0425', merchant: 'Nusa Air', reason: 'Card frozen', amount: 3_480_000 },
  { id: 'DCL-3240', when: '30 Oct 06:48', card: 'CRD-0412', merchant: 'Fuelstop Johor Bahru', reason: 'Use abroad is off', amount: 1_420_000 },
]
export const programmeLimit = teams.reduce((s, t) => s + t.limit, 0)
export const missingReceipts = 23
export const frozenCount = 2

export const employees = [
  { value: 'Bagus Santoso', label: 'Bagus Santoso · Operations & fleet' },
  { value: 'Citra Ayuningtyas', label: 'Citra Ayuningtyas · Procurement' },
  { value: 'Hendra Kusuma', label: 'Hendra Kusuma · Engineering' },
  { value: 'Laila Rahmawati', label: 'Laila Rahmawati · Sales & marketing' },
  { value: 'Kenji Mori', label: 'Kenji Mori · Travel' },
]

export const channelMeta: { key: keyof Channels; label: string; description: string }[] = [
  { key: 'online', label: 'Online and in-app', description: 'Card-not-present payments and subscriptions' },
  { key: 'atm', label: 'ATM withdrawals', description: 'Up to Rp 5.000.000 a day' },
  { key: 'contactless', label: 'Contactless', description: 'Tap to pay up to Rp 1.000.000' },
  { key: 'abroad', label: 'Use abroad', description: 'Outside Indonesia, FX at the network rate' },
]

/* ── Formatting ──────────────────────────────────────────────────────────────────────────── */

export const rp = (v: number) => `Rp ${new Intl.NumberFormat('id-ID').format(Math.round(v))}`
/** IDR millions, English decimals: "38.4". */
export const m = (v: number, digits = 1) =>
  new Intl.NumberFormat('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(v)
