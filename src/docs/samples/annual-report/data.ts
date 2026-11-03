/**
 * A specimen annual report for fiscal year 2025 (1 Jan – 31 Dec 2025), published March 2026.
 * Every figure is illustrative and they agree with each other: quarters add up to the year,
 * segments add up to the total, the cash bridge closes, and the margins are weighted correctly.
 * Amounts in IDR billions unless a line says otherwise.
 */

export const report = {
  year: 2025,
  title: 'Annual report 2025',
  period: 'Fiscal year ended 31 December 2025',
  published: '31 March 2026',
}

export const contents = [
  { page: '03', title: 'Letter from the founder' },
  { page: '04', title: 'The year in figures' },
  { page: '05', title: 'Financial review' },
  { page: '06', title: 'Results by segment' },
]

export const glance = [
  'Revenue rose 38% to IDR 48.6 bn, with every segment growing.',
  'Payments carried IDR 1.92 tn for our customers, up 64%.',
  'The ledger posted 214 million entries and lost none.',
  'Rapi became the design language of every product we ship.',
]

/** Revenue by quarter and segment, IDR bn. Quarters add up to 9.8, 11.4, 12.9 and 14.5. */
export const quarters = ['Q1', 'Q2', 'Q3', 'Q4']
export const revenueBySegment = [
  { name: 'Payments', values: [4.1, 5.0, 5.8, 6.5] },
  { name: 'Ledger', values: [2.3, 2.6, 2.9, 3.4] },
  { name: 'Scheduling', values: [1.6, 1.9, 2.1, 2.3] },
  { name: 'Services', values: [1.8, 1.9, 2.1, 2.3] },
]

/** Cash, 1 Jan → 31 Dec 2025, IDR bn: 21.4 + 14.2 − 2.1 − 3.1 − 4.6 + 0.6 = 26.4. */
export const cashBridge = [
  { label: 'Opening', value: 21.4, kind: 'total' as const },
  { label: 'Operations', value: 14.2 },
  { label: 'Tax paid', value: -2.1 },
  { label: 'Equipment', value: -3.1 },
  { label: 'Development', value: -4.6 },
  { label: 'Interest', value: 0.6 },
  { label: 'Closing', value: 0, kind: 'total' as const },
]

/** Payment volume by month, IDR bn. 2025 sums to 1,920; 2024 to 1,171. */
export const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
export const volume2025 = [118, 124, 133, 139, 146, 152, 160, 167, 173, 181, 196, 231]
export const volume2024 = [78, 81, 86, 88, 92, 95, 98, 101, 104, 107, 113, 128]

export interface Segment {
  name: string
  rev: number
  prev: number
  margin: number
}

/** Margins weight to 61.2% overall: 11.21 + 8.84 + 5.73 + 3.96 = 29.74 of 48.6. */
export const segments: Segment[] = [
  { name: 'Payments', rev: 21.4, prev: 14.6, margin: 52.4 },
  { name: 'Ledger', rev: 11.2, prev: 7.4, margin: 78.9 },
  { name: 'Scheduling', rev: 7.9, prev: 6.3, margin: 72.5 },
  { name: 'Services', rev: 8.1, prev: 6.9, margin: 48.9 },
]

export const keyFigures = [
  { label: 'Revenue', value: 48.6, decimals: 1, prefix: 'IDR ', unit: 'bn', trend: 38.1, note: '1' },
  { label: 'Gross margin', value: 61.2, decimals: 1, suffix: '%', trendText: '+3.4 pp vs 2024', note: '2' },
  { label: 'Payment volume', value: 1.92, decimals: 2, prefix: 'IDR ', unit: 'tn', trend: 64, note: '3' },
  { label: 'Ledger entries', value: 214, decimals: 0, unit: 'M', trend: 81 },
  { label: 'Business accounts', value: 3410, decimals: 0, trendText: '+1,120 in the year' },
  { label: 'API availability', value: 99.97, decimals: 2, suffix: '%', trendText: 'Target 99.95%', note: '4' },
  { label: 'Median API response', value: 38, decimals: 0, unit: 'ms', trend: -19.1, invert: true },
  { label: 'People', value: 38, decimals: 0, trendText: '+11, of whom 4 in operations' },
]

export const keyNotes = [
  '1 Revenue recognised under PSAK 72, the Indonesian equivalent of IFRS 15. 2024: IDR 35.2 bn.',
  '2 Revenue less partner bank fees, hosting and the cost of staff who deliver services.',
  '3 Total value of payments routed for customers. It is not revenue; our fee is a share of it.',
  '4 Successful responses over all requests, 1 Jan – 31 Dec 2025, measured at the edge.',
]
