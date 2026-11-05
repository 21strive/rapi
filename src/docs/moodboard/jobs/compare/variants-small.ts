/** Variants of the small hand-drawn patterns: 1x1 and narrow tiles. */
import type { MoodEntry } from '../../types'
import * as d from './data'
import { bullet, month, pick, share, slope, thenNow, waffle } from './patterns'

const avg = (xs: number[]) => Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10
const initials = d.months.map((m) => m[0])

export const small: MoodEntry[] = [
  /* ── Then and now ── */
  thenNow({
    id: 'compare-then-build',
    size: '1x1',
    domain: 'devops',
    name: 'Build time, then and now',
    props: {
      label: 'Build time · p50',
      points: [
        { label: 'Oct', value: 372 },
        { label: 'Nov', value: 168 },
      ],
      format: { kind: 'dur' },
      invert: true,
    },
  }),
  thenNow({
    id: 'compare-then-kwh',
    size: '1x1',
    domain: 'home',
    surface: 'muted',
    name: 'Power use, then and now',
    props: {
      label: 'Household use',
      unit: 'kWh',
      points: [
        { label: 'Sep', value: 412 },
        { label: 'Oct', value: 356 },
      ],
      invert: true,
    },
  }),
  thenNow({
    id: 'compare-then-qris',
    size: '1x1',
    domain: 'payments',
    surface: 'brand',
    name: 'QRIS, then and now',
    props: {
      label: 'QRIS payments a day',
      points: [
        { label: 'Jan', value: 12480 },
        { label: 'Oct', value: 28960 },
      ],
    },
  }),
  thenNow({
    id: 'compare-then-wait',
    size: '1x1',
    domain: 'health',
    name: 'ER wait, then and now',
    props: {
      label: 'ER wait · median',
      unit: 'min',
      points: [
        { label: 'Q2', value: 48 },
        { label: 'Q3', value: 31 },
      ],
      invert: true,
    },
  }),
  thenNow({
    id: 'compare-then-fuel',
    size: '1x1',
    domain: 'aerospace',
    surface: 'dark',
    name: 'Fuel burn, then and now',
    props: {
      label: 'Fuel per block hour',
      unit: 'kg',
      points: [
        { label: '2024', value: 2560 },
        { label: '2026', value: 2190 },
      ],
      invert: true,
    },
  }),
  thenNow({
    id: 'compare-then-riders',
    size: '2x1',
    domain: 'transit',
    name: 'Riders, year by year',
    props: {
      label: 'Riders a weekday · Line B',
      points: [
        { label: '2022', value: 38400 },
        { label: '2023', value: 51200 },
        { label: '2024', value: 60900 },
        { label: '2025', value: 68300 },
        { label: '2026', value: 74310 },
      ],
    },
  }),

  /* ── Out of a hundred ── */
  waffle({
    id: 'compare-waffle-ontime',
    size: '1x1',
    domain: 'logistics',
    name: 'On time, two hubs',
    props: {
      label: 'Delivered on time',
      noun: 'deliveries on time',
      groups: [
        { key: 'JKT', name: 'Jakarta hub', value: 94 },
        { key: 'SBY', name: 'Surabaya hub', value: 87 },
      ],
    },
  }),
  waffle({
    id: 'compare-waffle-water',
    size: '1x1',
    domain: 'civic',
    surface: 'muted',
    name: 'Piped water, Kupang',
    props: {
      label: 'Homes with piped water',
      noun: 'homes with piped water',
      groups: [
        { key: '2020', name: '2020', value: 68 },
        { key: '2026', name: '2026', value: 83 },
      ],
      initial: 1,
    },
  }),
  waffle({
    id: 'compare-waffle-phish',
    size: '1x1',
    domain: 'security',
    surface: 'dark',
    name: 'Phishing test, two years',
    props: {
      label: 'Clicked the test mail',
      noun: 'staff who clicked',
      groups: [
        { key: '2025', name: '2025', value: 18 },
        { key: '2026', name: '2026', value: 6 },
      ],
      initial: 1,
    },
  }),
  waffle({
    id: 'compare-waffle-desks',
    size: '1x1',
    domain: 'workspace',
    name: 'Desks in use, two days',
    props: {
      label: 'Desks in use at noon',
      noun: 'desks in use',
      groups: [
        { key: 'Tue', name: 'Tuesday', value: 64 },
        { key: 'Fri', name: 'Friday', value: 21 },
      ],
    },
  }),
  waffle({
    id: 'compare-waffle-solar',
    size: '1x1',
    domain: 'home',
    surface: 'brand',
    name: 'Solar share, two months',
    props: {
      label: 'Use covered by solar',
      noun: 'kWh from the roof',
      groups: [
        { key: 'Jun', name: 'June', value: 74 },
        { key: 'Dec', name: 'December', value: 38 },
      ],
    },
  }),

  /* ── Columns, pick one ── */
  pick({
    id: 'compare-pick-chargebacks',
    size: '1x1',
    domain: 'payments',
    name: 'Chargebacks by day',
    props: {
      label: 'Chargebacks',
      ...d.chargebacks,
      reference: { value: avg(d.chargebacks.values), label: 'Avg', kind: 'average' },
      format: { decimals: 0 },
      initial: 4,
    },
  }),
  pick({
    id: 'compare-pick-rain',
    size: '1x1',
    domain: 'agri',
    surface: 'muted',
    name: 'Rain by month, Malang',
    props: {
      label: 'Rain · 2025',
      unit: 'mm',
      values: d.rain2025,
      names: d.months.map((m) => `${m} 2025`),
      ticks: initials,
      reference: { value: avg(d.rain2025), label: 'Avg', kind: 'average' },
      initial: 6,
    },
  }),
  pick({
    id: 'compare-pick-plays',
    size: '1x1',
    domain: 'audio',
    surface: 'dark',
    name: 'Plays by day',
    props: {
      label: 'Plays',
      unit: 'K',
      ...d.plays,
      reference: { value: avg(d.plays.values), label: 'Avg', kind: 'average' },
      format: { decimals: 1 },
      initial: 5,
    },
  }),
  pick({
    id: 'compare-pick-boardings',
    size: '2x1',
    domain: 'transit',
    name: 'Boardings by hour',
    props: {
      label: 'Boardings by hour · Dukuh Atas',
      ...d.boardings,
      reference: { value: Math.round(avg(d.boardings.values)), label: 'Avg', kind: 'average' },
      initial: 13,
    },
  }),
  pick({
    id: 'compare-pick-peak',
    size: '2x1',
    domain: 'energy',
    surface: 'dark',
    name: 'Feeder load against its rating',
    props: {
      label: 'Feeder 7 load',
      unit: '% of rating',
      ...d.feederLoad,
      reference: { value: 100, label: 'Rating', kind: 'threshold' },
      initial: 12,
    },
  }),

  /* ── Two points, one slope ── */
  slope({
    id: 'compare-slope-broadband',
    size: '1x2',
    domain: 'civic',
    name: 'Broadband by province',
    props: {
      label: 'Fixed broadband · % of homes',
      from: '2022',
      to: '2026',
      change: 'pp',
      format: { kind: 'pct' },
      items: [
        { name: 'DKI Jakarta', code: 'JKT', a: 61, b: 78 },
        { name: 'Jawa Barat', code: 'JBR', a: 38, b: 57 },
        { name: 'Jawa Timur', code: 'JTM', a: 35, b: 52 },
        { name: 'Bali', code: 'BAL', a: 44, b: 63 },
        { name: 'Sulawesi Selatan', code: 'SSL', a: 27, b: 41 },
        { name: 'Papua', code: 'PAP', a: 9, b: 18 },
      ],
      initial: 5,
    },
  }),
  slope({
    id: 'compare-slope-ontime',
    size: '1x2',
    domain: 'aerospace',
    surface: 'dark',
    name: 'On-time departures by airport',
    props: {
      label: 'On time · Nusa Air · %',
      from: 'Q2',
      to: 'Q3',
      change: 'pp',
      format: { kind: 'pct' },
      items: [
        { name: 'Jakarta', code: 'CGK', a: 78, b: 84 },
        { name: 'Denpasar', code: 'DPS', a: 81, b: 79 },
        { name: 'Surabaya', code: 'SUB', a: 74, b: 83 },
        { name: 'Makassar', code: 'UPG', a: 69, b: 77 },
        { name: 'Medan', code: 'KNO', a: 72, b: 71 },
      ],
      initial: 2,
    },
  }),
  slope({
    id: 'compare-slope-nim',
    size: '1x1',
    domain: 'banking',
    surface: 'brand',
    name: 'Margin by segment',
    props: {
      label: 'Net interest margin',
      from: '2025',
      to: '2026',
      change: 'pp',
      format: { kind: 'pct', decimals: 1 },
      items: [
        { name: 'Retail', code: 'RTL', a: 5.8, b: 6.1 },
        { name: 'SME', code: 'SME', a: 6.9, b: 6.4 },
        { name: 'Corporate', code: 'CORP', a: 3.1, b: 3.3 },
      ],
      initial: 1,
    },
  }),
  slope({
    id: 'compare-slope-rice',
    size: '1x1',
    domain: 'commerce',
    name: 'Rice price by city',
    props: {
      label: 'Rice · Rp thousand/kg',
      from: 'Jan',
      to: 'Oct',
      format: { decimals: 1 },
      invert: true,
      items: [
        { name: 'Medan', code: 'MDN', a: 13.4, b: 14.1 },
        { name: 'Jakarta', code: 'JKT', a: 14.2, b: 15.1 },
        { name: 'Makassar', code: 'MKS', a: 12.9, b: 13.2 },
      ],
      initial: 1,
    },
  }),
  slope({
    id: 'compare-slope-ready',
    size: '1x1',
    domain: 'defense',
    surface: 'dark',
    name: 'Readiness by squadron',
    props: {
      label: 'Mission capable · %',
      from: 'Q2',
      to: 'Q3',
      change: 'pp',
      format: { kind: 'pct' },
      items: [
        { name: 'Squadron A', code: 'SQ-A', a: 71, b: 82 },
        { name: 'Squadron B', code: 'SQ-B', a: 84, b: 80 },
        { name: 'Squadron C', code: 'SQ-C', a: 66, b: 74 },
      ],
      initial: 1,
    },
  }),

  /* ── A month in squares ── */
  month({
    id: 'compare-month-rain',
    size: '1x1',
    domain: 'agri',
    name: 'Rain in Malang, by day',
    props: { label: 'Rain', unit: 'mm', months: [{ name: 'Oct 2026', start: '2026-10-01', values: d.rainOct }] },
  }),
  month({
    id: 'compare-month-outage',
    size: '1x1',
    domain: 'energy',
    surface: 'muted',
    name: 'Outage minutes, feeder 7',
    props: { label: 'Outage', unit: 'min', months: [{ name: 'Oct 2026', start: '2026-10-01', values: d.outageOct }] },
  }),
  month({
    id: 'compare-month-clinic',
    size: '1x1',
    domain: 'health',
    surface: 'dark',
    name: 'Clinic visits by day',
    props: { label: 'Visits', months: [{ name: 'Oct 2026', start: '2026-10-01', values: d.clinicOct }] },
  }),
  month({
    id: 'compare-month-deploys',
    size: '1x2',
    domain: 'devops',
    name: 'Deploys, this month and last',
    props: {
      label: 'Deploys a day',
      stack: true,
      today: '2026-11-05',
      months: [
        { name: 'Oct 2026', start: '2026-10-01', values: d.deploysOct },
        { name: 'Nov 2026', start: '2026-11-01', values: d.deploysNov },
      ],
    },
  }),
  month({
    id: 'compare-month-orders',
    size: '1x2',
    domain: 'commerce',
    name: 'Orders around twin-date sales',
    props: {
      label: 'Orders',
      stack: true,
      legend: true,
      months: [
        { name: 'Sep 2026', start: '2026-09-01', values: d.ordersSep },
        { name: 'Oct 2026', start: '2026-10-01', values: d.ordersOct },
      ],
    },
  }),

  /* ── Share of the whole ── */
  share({
    id: 'compare-share-grid',
    size: '2x1',
    domain: 'energy',
    name: 'Grid mix, two years',
    props: {
      label: 'Java–Bali grid mix',
      names: ['Coal', 'Gas', 'Hydro', 'Geothermal', 'Solar'],
      unit: 'TWh',
      format: { decimals: 1 },
      periods: [
        { key: '2025', label: '2025', parts: [118.4, 48.6, 12.2, 10.1, 6.3] },
        { key: '2026', label: '2026', parts: [114.9, 49.8, 12.6, 11.4, 10.8] },
      ],
    },
  }),
  share({
    id: 'compare-share-device',
    size: '2x1',
    domain: 'media',
    surface: 'muted',
    name: 'Audience by device',
    props: {
      label: 'Audience by device',
      names: ['Phone', 'TV', 'Desktop', 'Tablet'],
      unit: 'M people',
      format: { decimals: 1 },
      periods: [
        { key: '2025', label: '2025', parts: [21.4, 6.8, 3.9, 1.2] },
        { key: '2026', label: '2026', parts: [25.1, 5.6, 3.3, 1.1] },
      ],
    },
  }),
  share({
    id: 'compare-share-pay',
    size: '1x1',
    domain: 'payments',
    name: 'How customers pay',
    props: {
      label: 'How customers pay',
      names: ['QRIS', 'VA', 'Card', 'Wallet', 'Cash'],
      compact: true,
      periods: [{ key: 'oct', label: 'Oct', parts: [41, 23, 14, 15, 7] }],
    },
  }),
  share({
    id: 'compare-share-grade',
    size: '1x1',
    domain: 'agri',
    name: 'Harvest by grade',
    props: {
      label: 'Harvest by grade',
      names: ['Grade A', 'Grade B', 'Grade C', 'Reject'],
      compact: true,
      periods: [{ key: 'gadu', label: 'Gadu', parts: [46, 31, 17, 6] }],
    },
  }),
  share({
    id: 'compare-share-cloud',
    size: '3x1',
    domain: 'devops',
    surface: 'dark',
    name: 'Cloud spend by service',
    props: {
      label: 'Cloud spend by service',
      names: ['Compute', 'Database', 'Storage', 'Network', 'Other'],
      format: { kind: 'usd' },
      periods: [
        { key: 'sep', label: 'Sep', parts: [48200, 19600, 14100, 9800, 4300] },
        { key: 'oct', label: 'Oct', parts: [44100, 22900, 13800, 10600, 4000] },
      ],
    },
  }),

  /* ── Measure against target ── */
  bullet({
    id: 'compare-bullet-revenue',
    size: '1x1',
    domain: 'banking',
    name: 'Revenue against target',
    props: {
      label: 'Revenue',
      unit: 'IDR bn',
      format: { decimals: 1 },
      periods: [
        { key: 'sep', label: 'Sep', value: 61.8, target: 60, ranges: [48, 58, 70] },
        { key: 'oct', label: 'Oct', value: 58.4, target: 64, ranges: [50, 62, 74], previous: 61.8 },
      ],
    },
  }),
  bullet({
    id: 'compare-bullet-vax',
    size: '1x1',
    domain: 'health',
    surface: 'muted',
    name: 'Measles coverage against target',
    props: {
      label: 'Measles',
      format: { kind: 'pct', decimals: 1 },
      periods: [
        { key: '2025', label: '2025', value: 88.4, target: 95, ranges: [80, 90, 100] },
        { key: '2026', label: '2026', value: 95.6, target: 95, ranges: [80, 90, 100], previous: 88.4 },
      ],
    },
  }),
  bullet({
    id: 'compare-bullet-budget',
    size: '1x1',
    domain: 'devops',
    surface: 'dark',
    name: 'Error budget against its cap',
    props: {
      label: 'Budget',
      format: { kind: 'pct' },
      lowerIsBetter: true,
      met: 'Within',
      missed: 'Over',
      periods: [
        { key: 'oct', label: 'Oct', value: 62, target: 100, ranges: [50, 100, 150] },
        { key: 'nov', label: 'Nov', value: 118, target: 100, ranges: [50, 100, 150] },
      ],
    },
  }),
  bullet({
    id: 'compare-bullet-hydro',
    size: '2x1',
    domain: 'energy',
    name: 'Generation against plan',
    props: {
      label: 'Generation vs plan · PLTA Cirata',
      unit: 'GWh',
      periods: [
        { key: 'oct', label: 'Oct', value: 41.8, target: 46, ranges: [35, 44, 52] },
        { key: 'ytd', label: 'YTD', value: 1212, target: 1180, ranges: [1000, 1150, 1300] },
      ],
    },
  }),
  bullet({
    id: 'compare-bullet-sales',
    size: '2x1',
    domain: 'commerce',
    name: 'Sales against target',
    props: {
      label: 'Sales vs target · Kopi Lereng',
      unit: 'Rp M',
      periods: [
        { key: 'week', label: 'Week', value: 412, target: 450, ranges: [350, 430, 500], previous: 398 },
        { key: 'oct', label: 'Oct', value: 1871, target: 1800, ranges: [1500, 1750, 2000], previous: 1702 },
      ],
    },
  }),
]
