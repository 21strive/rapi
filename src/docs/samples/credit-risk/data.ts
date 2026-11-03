/**
 * Credit risk · Bank Samudra Niaga, enterprise risk. Month-end run as of 31 Oct 2026, computed
 * 2 Nov 2026 06:40 WIB. Exposure at default (EAD) in IDR bn, probability of default (PD) one
 * year ahead in %. The watchlist is every plotted name with PD at or above the 5% trigger, plus
 * any name over its limit.
 */
import type { BulletRow } from '@/design-system'

export type Segment = 'Corporate' | 'SME' | 'Retail'
export type SegmentFilter = 'All' | Segment

export const segmentOptions: { label: string; value: SegmentFilter }[] = [
  { label: 'All', value: 'All' },
  { label: 'Corporate', value: 'Corporate' },
  { label: 'SME', value: 'SME' },
  { label: 'Retail', value: 'Retail' },
]

export const watchTrigger = 5

/** Single-name limits: the legal lending limit for corporates, internal limits below it. */
export const nameLimit: Record<SegmentFilter, { value: number; label: string }> = {
  All: { value: 1250, label: 'Legal lending limit 1,250' },
  Corporate: { value: 1250, label: 'Legal lending limit 1,250' },
  SME: { value: 150, label: 'SME single-name limit 150' },
  Retail: { value: 20, label: 'Retail single-name limit 20' },
}

export interface Obligor {
  id: string
  name: string
  segment: Segment
  sector: string
  /** IDR bn. */
  ead: number
  /** %. */
  pd: number
  /** %. */
  lgd: number
  dpd: number
  reason?: string
  owner: string
  since?: string
}

const O = (
  id: string,
  name: string,
  segment: Segment,
  sector: string,
  ead: number,
  pd: number,
  lgd: number,
  dpd: number,
  owner: string,
  reason?: string,
  since?: string,
): Obligor => ({ id, name, segment, sector, ead, pd, lgd, dpd, owner, reason, since })

export const obligors: Obligor[] = [
  O('CRP-1042', 'PT Selat Baja Utama', 'Corporate', 'Manufacturing', 1312, 2.4, 42, 0, 'Andika Saputra', 'Over the legal lending limit', '29 Oct 2026'),
  O('CRP-1007', 'PT Garda Energi Persada', 'Corporate', 'Energy & utilities', 1104, 0.8, 38, 0, 'Andika Saputra'),
  O('CRP-1118', 'PT Kencana Properti Tbk', 'Corporate', 'Property & construction', 846, 6.8, 45, 31, 'Maya Kartika', 'Pre-sales down 38% year on year', '14 Aug 2026'),
  O('CRP-1015', 'PT Nusantara Logistik Tbk', 'Corporate', 'Transport & logistics', 512, 0.9, 40, 0, 'Bima Prasetyo'),
  O('CRP-1093', 'PT Tirta Baja Tbk', 'Corporate', 'Manufacturing', 438, 1.7, 42, 0, 'Andika Saputra'),
  O('CRP-1061', 'PT Merapi Semen Tbk', 'Corporate', 'Manufacturing', 690, 1.1, 40, 0, 'Bima Prasetyo'),
  O('CRP-1002', 'PT Lentera Telekomunikasi Tbk', 'Corporate', 'Energy & utilities', 980, 0.4, 35, 0, 'Maya Kartika'),
  O('CRP-1077', 'PT Sawit Lestari Nusantara', 'Corporate', 'Palm oil & plantations', 774, 3.6, 45, 0, 'Rudi Hartanto'),
  O('CRP-1084', 'PT Batubara Kalimantan Raya', 'Corporate', 'Mining & coal', 620, 4.9, 48, 0, 'Rudi Hartanto'),
  O('CRP-1131', 'PT Samudra Kargo Utama', 'Corporate', 'Transport & logistics', 355, 7.9, 50, 62, 'Bima Prasetyo', 'Charter rates below breakeven', '02 Sep 2026'),
  O('CRP-1049', 'PT Graha Niaga Sentosa', 'Corporate', 'Trade & retail', 298, 2.2, 45, 0, 'Maya Kartika'),
  O('CRP-1011', 'PT Sagara Daya Tbk', 'Corporate', 'Energy & utilities', 905, 0.6, 35, 0, 'Andika Saputra'),
  O('CRP-1146', 'PT Pelita Tekstil Indonesia', 'Corporate', 'Manufacturing', 214, 11.4, 55, 94, 'Rudi Hartanto', 'Covenant breach, DSCR 0.84', '20 Jun 2026'),
  O('CRP-1122', 'PT Dharma Konstruksi', 'Corporate', 'Property & construction', 467, 8.6, 52, 45, 'Maya Kartika', 'Receivables from stalled projects', '11 Jul 2026'),
  O('CRP-1068', 'PT Cahaya Rantai Dingin', 'Corporate', 'Transport & logistics', 142, 2.9, 45, 0, 'Bima Prasetyo'),
  O('CRP-1073', 'PT Sinar Armada Kargo', 'Corporate', 'Transport & logistics', 188, 3.1, 45, 0, 'Bima Prasetyo'),
  O('CRP-1109', 'PT Bumi Agro Makmur', 'Corporate', 'Palm oil & plantations', 402, 5.6, 48, 12, 'Rudi Hartanto', 'CPO price fall, leverage 4.6×', '30 Sep 2026'),
  O('CRP-1055', 'PT Prima Kimia Jaya', 'Corporate', 'Manufacturing', 260, 1.4, 42, 0, 'Andika Saputra'),

  O('SME-4410', 'CV Tunas Baru', 'SME', 'Trade & retail', 12, 4.2, 50, 0, 'Dewi Anggraini'),
  O('SME-4471', 'PT Kopi Lereng Merapi', 'SME', 'Trade & retail', 18, 2.8, 50, 0, 'Dewi Anggraini'),
  O('SME-4502', 'Toko Mebel Jaya Abadi', 'SME', 'Trade & retail', 9, 6.1, 55, 18, 'Dewi Anggraini', 'Two late instalments', '05 Oct 2026'),
  O('SME-4388', 'PT Mitra Plastik Sejahtera', 'SME', 'Manufacturing', 64, 3.3, 50, 0, 'Fikri Ramadhan'),
  O('SME-4355', 'PT Anugerah Pangan Lestari', 'SME', 'Trade & retail', 138, 2.1, 45, 0, 'Fikri Ramadhan'),
  O('SME-4529', 'PT Rotan Cirebon Kreasi', 'SME', 'Manufacturing', 22, 9.4, 55, 47, 'Fikri Ramadhan', 'Export orders cancelled', '22 Aug 2026'),
  O('SME-4417', 'PT Bengkel Truk Sentosa', 'SME', 'Transport & logistics', 15, 3.9, 50, 0, 'Dewi Anggraini'),
  O('SME-4436', 'PT Suku Cadang Prima', 'SME', 'Trade & retail', 41, 2.6, 50, 0, 'Fikri Ramadhan'),
  O('SME-4548', 'CV Batik Pekalongan Indah', 'SME', 'Manufacturing', 7, 12.8, 60, 88, 'Dewi Anggraini', 'Restructured twice', '14 May 2026'),
  O('SME-4515', 'PT Percetakan Cahaya', 'SME', 'Manufacturing', 11, 5.2, 55, 9, 'Fikri Ramadhan', 'Main customer lost', '17 Oct 2026'),
  O('SME-4362', 'PT Kurir Kilat Nusantara', 'SME', 'Transport & logistics', 88, 1.9, 45, 0, 'Fikri Ramadhan'),
  O('SME-4537', 'PT Agro Tani Subur', 'SME', 'Palm oil & plantations', 57, 7.3, 55, 33, 'Dewi Anggraini', 'Harvest below plan', '08 Sep 2026'),
  O('SME-4449', 'PT Mebel Ukir Jepara', 'SME', 'Manufacturing', 26, 4.6, 50, 0, 'Dewi Anggraini'),
  O('SME-4458', 'PT Es Kristal Bahari', 'SME', 'Manufacturing', 33, 3.0, 50, 0, 'Fikri Ramadhan'),

  O('RTL-20419', 'Private mortgage · RTL-20419', 'Retail', 'Households', 16.8, 0.9, 20, 0, 'Lina Wijaya'),
  O('RTL-31877', 'Private mortgage · RTL-31877', 'Retail', 'Households', 12.4, 1.2, 20, 0, 'Lina Wijaya'),
  O('RTL-44102', 'Micro business loan · RTL-44102', 'Retail', 'Micro business', 3.1, 6.4, 60, 21, 'Yoga Pranata', 'Turnover down 45%', '01 Oct 2026'),
  O('RTL-18833', 'Lombard loan · RTL-18833', 'Retail', 'Households', 18.2, 0.6, 15, 0, 'Lina Wijaya'),
  O('RTL-52290', 'Auto loan, owner-driver · RTL-52290', 'Retail', 'Micro business', 2.4, 8.8, 55, 40, 'Yoga Pranata', 'Ride-hailing income lost', '19 Aug 2026'),
  O('RTL-60714', 'Private mortgage · RTL-60714', 'Retail', 'Households', 9.7, 1.8, 20, 0, 'Lina Wijaya'),
  O('RTL-71206', 'Micro business loan · RTL-71206', 'Retail', 'Micro business', 1.6, 11.2, 65, 75, 'Yoga Pranata', 'Three missed instalments', '30 Jul 2026'),
  O('RTL-38150', 'Payroll loan · RTL-38150', 'Retail', 'Households', 0.9, 2.4, 45, 0, 'Yoga Pranata'),
  O('RTL-27744', 'Lombard loan · RTL-27744', 'Retail', 'Households', 14.1, 0.7, 15, 0, 'Lina Wijaya'),
  O('RTL-90031', 'Micro business loan · RTL-90031', 'Retail', 'Micro business', 2.2, 5.6, 60, 14, 'Yoga Pranata', 'Stall relocated by city', '12 Oct 2026'),
  O('RTL-15520', 'Private mortgage · RTL-15520', 'Retail', 'Households', 7.5, 3.1, 25, 0, 'Lina Wijaya'),
  O('RTL-66208', 'Professional credit line · RTL-66208', 'Retail', 'Households', 4.8, 4.4, 45, 0, 'Lina Wijaya'),
]

export const isWatch = (o: Obligor) => o.pd >= watchTrigger || o.ead > nameLimit[o.segment].value

/** Rating bands from PD, with the true minus sign. */
export function ratingOf(pd: number) {
  if (pd < 0.5) return 'A'
  if (pd < 1) return 'BBB+'
  if (pd < 2) return 'BBB'
  if (pd < 3) return 'BBB−'
  if (pd < 4) return 'BB+'
  if (pd < 5) return 'BB'
  if (pd < 7) return 'BB−'
  if (pd < 10) return 'B+'
  if (pd < 15) return 'B'
  return 'CCC'
}

export const el = (o: Obligor) => (o.ead * o.pd * o.lgd) / 10000

/* ── Portfolio figures by segment, whole book (not only the names plotted) ──────────────── */

interface Book {
  /** IDR tn. */
  ead: number
  /** Expected loss, bps of EAD. */
  elBps: number
  /** Gross NPL ratio, %, and change on last quarter in pp. */
  npl: number
  nplChange: number
  /** Loan-loss reserves over NPL, %. */
  coverage: number
}

const books: Record<Segment, Book> = {
  Corporate: { ead: 92.6, elBps: 74, npl: 1.9, nplChange: 0.2, coverage: 236 },
  SME: { ead: 41.3, elBps: 182, npl: 4.6, nplChange: 0.4, coverage: 148 },
  Retail: { ead: 48.5, elBps: 141, npl: 2.8, nplChange: -0.1, coverage: 187 },
}

export function bookOf(filter: SegmentFilter): Book {
  if (filter !== 'All') return books[filter]
  const parts = Object.values(books)
  const ead = parts.reduce((s, b) => s + b.ead, 0)
  const w = (k: keyof Book) => parts.reduce((s, b) => s + b[k] * b.ead, 0) / ead
  return { ead, elBps: w('elBps'), npl: w('npl'), nplChange: w('nplChange'), coverage: w('coverage') }
}

/* ── Rating migration over the last 12 months, % of obligors by count ───────────────────── */

export const ratingsFrom = ['AAA', 'AA', 'A', 'BBB', 'BB', 'B', 'CCC']
export const ratingsTo = ['AAA', 'AA', 'A', 'BBB', 'BB', 'B', 'CCC', 'D']

const offDiagonal: number[][] = [
  [0, 9.8, 0.7, 0.3, 0.1, 0, 0, 0],
  [0.6, 0, 9.9, 0.8, 0.2, 0.1, 0, 0],
  [0.1, 1.9, 0, 7.4, 0.6, 0.3, 0, 0.1],
  [0, 0.2, 3.8, 0, 6.2, 1.3, 0.4, 0.2],
  [0, 0.1, 0.3, 5.6, 0, 9.9, 1.8, 1.1],
  [0, 0, 0.2, 0.4, 6.1, 0, 8.7, 4.8],
  [0, 0, 0.3, 0.6, 1.6, 11.3, 0, 32.0],
]

/** Each row sums to 100: the diagonal is whatever stayed put. */
export const migration: number[][] = offDiagonal.map((row, r) => {
  const moved = row.reduce((s, v) => s + v, 0)
  return row.map((v, c) => (c === r ? Math.round((100 - moved) * 10) / 10 : v))
})

/** The colour scale stops here so movements off the diagonal show. */
export const migrationCap = 12

/* ── Sector concentration, whole book ───────────────────────────────────────────────────── */

const sectors: { sector: string; share: number; limit: number; scale: number }[] = [
  { sector: 'Manufacturing', share: 16.2, limit: 25, scale: 30 },
  { sector: 'Trade & retail', share: 14.7, limit: 20, scale: 24 },
  { sector: 'Property & construction', share: 13.8, limit: 15, scale: 20 },
  { sector: 'Palm oil & plantations', share: 9.1, limit: 12, scale: 16 },
  { sector: 'Mining & coal', share: 8.4, limit: 10, scale: 12 },
  { sector: 'Transport & logistics', share: 7.9, limit: 10, scale: 12 },
  { sector: 'Energy & utilities', share: 6.3, limit: 12, scale: 16 },
]

export const sectorRows: BulletRow[] = sectors.map((s) => ({
  label: s.sector,
  sublabel: `${Math.round((s.share / s.limit) * 100)}% of limit ${s.limit}%`,
  value: s.share,
  target: s.limit,
  ranges: [s.limit * 0.75, s.limit, s.scale],
}))

export const sectorNearest = sectors.reduce((a, b) => (b.share / b.limit > a.share / a.limit ? b : a))

/** Tier 1 capital, IDR bn. The legal lending limit is 25% of it. */
export const capital = 5000
export const topNames = [...obligors]
  .sort((a, b) => b.ead - a.ead)
  .slice(0, 6)
  .map((o) => ({ label: o.name.replace(/^PT /, '').replace(/ Tbk$/, ''), value: Math.round((o.ead / capital) * 1000) / 10 }))

/** PD history for the drawer: twelve month-ends ending Oct 2026, drifting into today's PD. */
export function pdHistory(o: Obligor) {
  let h = 0
  for (const c of o.id) h = (h * 31 + c.charCodeAt(0)) >>> 0
  const start = o.pd * (o.pd >= watchTrigger ? 0.38 : 0.85 + ((h % 20) / 100))
  return Array.from({ length: 12 }, (_, i) => {
    const t = i / 11
    const wobble = Math.sin((h % 7) + i * 1.3) * o.pd * 0.04
    return Math.round((start + (o.pd - start) * t * t + (i === 11 ? 0 : wobble)) * 100) / 100
  })
}
export const months = ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct']

/* ── Formatting ────────────────────────────────────────────────────────────────────────── */

export const num = (v: number, digits = 1) =>
  new Intl.NumberFormat('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(v)
