/** Variants of the hand-drawn patterns that need a strip, a column or a panel. */
import type { MoodEntry } from '../../types'
import * as d from './data'
import { board, diverging, funnel, hist, multiples, plan, strip } from './patterns'

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b)
  const m = s.length / 2
  return Math.round((s.length % 2 ? s[Math.floor(m)] : (s[m - 1] + s[m]) / 2) * 100) / 100
}

export const mid: MoodEntry[] = [
  /* ── Where it falls ── */
  strip({
    id: 'compare-strip-rate',
    size: '2x1',
    domain: 'banking',
    name: 'Deposit rate among 18 banks',
    props: {
      label: '12-month deposit rate',
      items: d.depositRates,
      mine: 'Arunika Bank',
      references: [{ value: median(d.depositRates.map((r) => r.value)), label: 'Median', kind: 'average' }],
      format: { kind: 'pct', decimals: 2 },
      axis: { kind: 'pct', decimals: 1 },
    },
  }),
  strip({
    id: 'compare-strip-courier',
    size: '2x1',
    domain: 'logistics',
    surface: 'muted',
    name: 'Delivery time among couriers',
    props: {
      label: 'Days to deliver · 14 couriers',
      unit: 'days',
      items: d.courierDays,
      mine: 'Kurir Kilat',
      invert: true,
      references: [{ value: 2, label: 'Target', kind: 'target' }],
      format: { decimals: 1 },
      axis: { decimals: 0 },
    },
  }),
  strip({
    id: 'compare-strip-loud',
    size: '3x1',
    domain: 'audio',
    surface: 'dark',
    name: 'Loudness across the album',
    props: {
      label: 'Loudness by track',
      unit: 'LUFS',
      items: d.loudness,
      mine: 'Pulang',
      ranked: false,
      against: { value: -14, label: 'target', unit: 'LU' },
      references: [{ value: -14, label: 'Target', kind: 'target' }],
      format: { decimals: 1 },
      axis: { decimals: 0 },
    },
  }),
  strip({
    id: 'compare-strip-pm25',
    size: '4x1',
    domain: 'civic',
    name: 'Air quality across Jakarta',
    props: {
      label: 'PM2.5 by station, Jakarta, 24 h mean',
      unit: 'µg/m³',
      items: d.pm25,
      mine: 'Kemayoran',
      invert: true,
      references: [
        { value: 15, label: 'WHO', kind: 'target' },
        { value: 55, label: 'Limit', kind: 'threshold' },
      ],
    },
  }),

  /* ── How it spreads ── */
  hist({
    id: 'compare-hist-latency',
    size: '2x1',
    domain: 'devops',
    surface: 'dark',
    name: 'Response time, before and after',
    props: {
      label: 'Checkout response',
      unit: 'ms',
      noun: 'requests',
      edges: d.latencyEdges,
      series: [
        { key: 'before', label: '4.11', counts: d.latencyBefore, p50: 310, p95: 690 },
        { key: 'after', label: '4.12', counts: d.latencyAfter, p50: 182, p95: 410 },
      ],
    },
  }),
  hist({
    id: 'compare-hist-basket',
    size: '2x1',
    domain: 'commerce',
    name: 'Basket size, two months',
    props: {
      label: 'Basket · Rp thousand',
      noun: 'orders',
      edges: d.basketEdges,
      series: [
        { key: 'sep', label: 'Sep', counts: d.basketOct, p50: 118, p95: 342 },
        { key: 'oct', label: 'Oct', counts: d.basketNov, p50: 131, p95: 365 },
      ],
    },
  }),
  hist({
    id: 'compare-hist-trip',
    size: '3x1',
    domain: 'transit',
    surface: 'muted',
    name: 'Trip length, weekday and weekend',
    props: {
      label: 'Trip length · Line B',
      unit: 'min',
      noun: 'trips',
      edges: d.tripEdges,
      series: [
        { key: 'weekend', label: 'Weekend', counts: d.tripWeekend, p50: 27, p95: 58 },
        { key: 'weekday', label: 'Weekday', counts: d.tripWeekday, p50: 34, p95: 71 },
      ],
    },
  }),
  hist({
    id: 'compare-hist-age',
    size: '1x2',
    domain: 'health',
    name: 'Patients by age, two wards',
    props: {
      label: 'Age',
      noun: 'patients',
      edges: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90],
      binNames: d.ageBands,
      orientation: 'rows',
      series: [
        { key: 'w5', label: 'Ward 5', counts: d.ward5 },
        { key: 'w3', label: 'Ward 3', counts: d.ward3 },
      ],
    },
  }),

  /* ── Rank and its change ── */
  board({
    id: 'compare-board-hubs',
    size: '1x2',
    domain: 'logistics',
    name: 'Hubs by on-time rate',
    props: {
      label: 'On time',
      unit: '%',
      format: { decimals: 1 },
      periods: [
        { key: 'week', label: 'Week', since: 'last week', rows: d.hubsWeek },
        { key: 'month', label: 'Month', since: 'last month', rows: d.hubsMonth },
      ],
    },
  }),
  board({
    id: 'compare-board-stores',
    size: '1x2',
    domain: 'commerce',
    name: 'Stores by sales',
    props: {
      label: 'Sales',
      unit: 'Rp M',
      periods: [
        { key: 'week', label: 'Week', since: 'last week', rows: d.storesWeek },
        { key: 'month', label: 'Month', since: 'last month', rows: d.storesMonth },
      ],
    },
  }),
  board({
    id: 'compare-board-coops',
    size: '1x2',
    domain: 'agri',
    surface: 'muted',
    name: 'Co-ops by rice yield',
    props: {
      label: 'Yield',
      unit: 't/ha',
      format: { decimals: 1 },
      periods: [
        { key: 'gadu', label: 'Gadu', since: 'the wet season', rows: d.coopsGadu },
        { key: 'rendeng', label: 'Rendeng', since: 'last year’s wet season', rows: d.coopsRendeng },
      ],
    },
  }),
  board({
    id: 'compare-board-shows',
    size: '1x3',
    domain: 'media',
    surface: 'dark',
    name: 'Shows by listeners',
    props: {
      label: 'Listeners',
      unit: 'thousand',
      format: { decimals: 1 },
      periods: [
        { key: 'week', label: 'Week', since: 'last week', rows: d.showsWeek },
        { key: 'month', label: 'Month', since: 'last month', rows: d.showsMonth },
      ],
    },
  }),

  /* ── Where it narrows ── */
  funnel({
    id: 'compare-funnel-checkout',
    size: '1x2',
    domain: 'commerce',
    name: 'Checkout, week on week',
    props: {
      label: 'Checkout',
      steps: ['Visited', 'Product', 'Cart', 'Checkout', 'Paid'],
      periods: [
        { key: 'w44', label: 'W44', values: [45100, 19800, 6020, 2440, 1910] },
        { key: 'w45', label: 'W45', values: [48200, 21400, 6850, 3120, 2480] },
      ],
    },
  }),
  funnel({
    id: 'compare-funnel-account',
    size: '1x2',
    domain: 'banking',
    surface: 'dark',
    name: 'Account opening, month on month',
    props: {
      label: 'Accounts',
      steps: ['Download', 'Sign-up', 'KYC passed', 'Funded', 'Active'],
      periods: [
        { key: 'sep', label: 'Sep', values: [16900, 11800, 7100, 4600, 3500] },
        { key: 'oct', label: 'Oct', values: [18400, 12100, 8300, 5100, 3900] },
      ],
    },
  }),
  funnel({
    id: 'compare-funnel-alerts',
    size: '1x2',
    domain: 'security',
    name: 'From alerts to incidents',
    props: {
      label: 'Alerts',
      steps: ['Alerts', 'Triaged', 'Escalated', 'Incidents'],
      periods: [
        { key: 'sep', label: 'Sep', values: [10410, 1180, 104, 11] },
        { key: 'oct', label: 'Oct', values: [8932, 1240, 86, 7] },
      ],
    },
  }),
  funnel({
    id: 'compare-funnel-hiring',
    size: '2x1',
    domain: 'workspace',
    surface: 'muted',
    name: 'Hiring, quarter on quarter',
    props: {
      label: 'Hiring',
      orientation: 'columns',
      steps: ['Applied', 'Screened', 'Interview', 'Offer', 'Hired'],
      periods: [
        { key: 'q2', label: 'Q2', values: [1120, 290, 76, 21, 15] },
        { key: 'q3', label: 'Q3', values: [1240, 310, 84, 19, 14] },
      ],
    },
  }),

  /* ── Over and under ── */
  diverging({
    id: 'compare-div-budget',
    size: '2x2',
    domain: 'workspace',
    name: 'Budget against actual by team',
    props: {
      label: 'Budget vs actual · IDR M',
      unit: 'IDR M',
      pos: 'Under budget',
      neg: 'Over budget',
      items: [
        { name: 'Engineering', value: -120, note: 'Plan 1,840 · actual 1,960' },
        { name: 'Sales', value: 86, note: 'Plan 1,210 · actual 1,124' },
        { name: 'Marketing', value: -42, note: 'Plan 640 · actual 682' },
        { name: 'Support', value: 31, note: 'Plan 420 · actual 389' },
        { name: 'Finance', value: 12, note: 'Plan 310 · actual 298' },
        { name: 'Operations', value: -64, note: 'Plan 880 · actual 944' },
        { name: 'Design', value: 18, note: 'Plan 260 · actual 242' },
      ],
    },
  }),
  diverging({
    id: 'compare-div-flows',
    size: '2x1',
    domain: 'banking',
    name: 'Net flows by segment',
    props: {
      label: 'Net flows · IDR bn',
      unit: 'IDR bn',
      pos: 'In',
      neg: 'Out',
      sortable: false,
      inlineLegend: true,
      format: { decimals: 1 },
      items: [
        { name: 'Retail', value: 2.1, note: 'In 14.8 · out 12.7' },
        { name: 'SME', value: -0.8, note: 'In 6.2 · out 7.0' },
        { name: 'Corporate', value: 4.6, note: 'In 22.4 · out 17.8' },
        { name: 'Treasury', value: -3.2, note: 'In 9.1 · out 12.3' },
      ],
    },
  }),
  diverging({
    id: 'compare-div-yield',
    size: '2x1',
    domain: 'agri',
    surface: 'muted',
    name: 'Yield against the five-year average',
    props: {
      label: 'Yield vs 5-year avg · t/ha',
      unit: 't/ha',
      pos: 'Above',
      neg: 'Below',
      sortable: false,
      inlineLegend: true,
      format: { decimals: 1 },
      items: [
        { name: 'Block A', value: 0.6, note: '6.4 against 5.8' },
        { name: 'Block B', value: -0.3, note: '5.2 against 5.5' },
        { name: 'Block C', value: 1.1, note: '7.0 against 5.9' },
        { name: 'Block D', value: -0.9, note: '4.6 against 5.5' },
      ],
    },
  }),
  diverging({
    id: 'compare-div-transfer',
    size: '1x2',
    domain: 'energy',
    surface: 'dark',
    name: 'Net transfer by region',
    props: {
      label: 'Net transfer · MW',
      unit: 'MW',
      pos: 'Export',
      neg: 'Import',
      sortable: false,
      values: false,
      items: [
        { name: 'Banten', value: 1240, note: 'Suralaya on 4 units' },
        { name: 'Jabar', value: -860 },
        { name: 'DKI', value: -1920, note: 'Evening peak' },
        { name: 'Jateng', value: 410 },
        { name: 'DIY', value: -180 },
        { name: 'Jatim', value: 1050, note: 'Paiton on 6 units' },
        { name: 'Bali', value: -310, note: 'Cable at 62%' },
      ],
    },
  }),

  /* ── Panels on one scale ── */
  multiples({
    id: 'compare-multi-cpu',
    size: '2x2',
    domain: 'devops',
    surface: 'dark',
    name: 'CPU by node',
    props: { label: 'CPU by node', unit: '%', panels: d.cpu, range: ['13:05', '14:05 WIB'], min: 0, max: 100 },
  }),
  multiples({
    id: 'compare-multi-dams',
    size: '2x2',
    domain: 'energy',
    name: 'Reservoirs on one scale',
    props: {
      label: 'Reservoir level · % of capacity',
      unit: '%',
      panels: d.dams,
      range: ['Dec 2025', 'Nov 2026'],
      min: 0,
      max: 100,
    },
  }),
  multiples({
    id: 'compare-multi-stores',
    size: '4x1',
    domain: 'commerce',
    surface: 'muted',
    name: 'Sales a day by store',
    props: {
      label: 'Sales a day · Rp M',
      panels: d.storesDaily,
      range: ['7 Oct', '5 Nov'],
      cols: 4,
      format: { decimals: 1 },
    },
  }),
  multiples({
    id: 'compare-multi-lines',
    size: '2x1',
    domain: 'transit',
    name: 'Riders by line',
    props: {
      label: 'Riders · thousand a day',
      panels: d.lines,
      range: ['W34', 'W45'],
      cols: 4,
      ranges: false,
    },
  }),

  /* ── Side by side ── */
  plan({
    id: 'compare-plan-power',
    size: '2x2',
    domain: 'home',
    name: 'Power plans side by side',
    props: {
      label: 'Power for a 2,200 VA home',
      options: [
        { name: 'Prepaid', sub: 'Top up', summary: 'Pay before you use; the meter stops at zero.' },
        { name: 'Postpaid', sub: 'Bill', summary: 'One bill a month and a deposit up front.' },
        { name: 'Two-rate', sub: 'Bill', summary: 'Cheaper after 22:00, dearer at the evening peak.' },
      ],
      rows: [
        { label: 'Night', values: ['Rp 1.444', 'Rp 1.444', 'Rp 1.035'], best: 2 },
        { label: 'Day', values: ['Rp 1.444', 'Rp 1.444', 'Rp 1.950'], best: 0 },
        { label: 'Minimum', values: ['None', '40 h', '40 h'], best: 0 },
        { label: 'Deposit', values: ['None', 'Rp 330.000', 'Rp 330.000'], best: 0 },
        { label: 'Meter', values: ['Smart', 'Smart', 'Smart'] },
      ],
    },
  }),
  plan({
    id: 'compare-plan-workers',
    size: '2x2',
    domain: 'devops',
    name: 'Worker types side by side',
    props: {
      label: 'Workers for the ingest queue',
      initial: 1,
      options: [
        { name: 'General 4', sub: '$0.192/h', summary: '22 workers keep up with 40,000 messages a second.' },
        { name: 'Compute 4', sub: '$0.170/h', summary: '18 workers are enough; memory is not the limit here.' },
        { name: 'Memory 4', sub: '$0.252/h', summary: '23 workers, and most of the memory sits idle.' },
      ],
      rows: [
        { label: 'vCPU', values: ['4', '4', '4'] },
        { label: 'Memory', values: ['16 GB', '8 GB', '32 GB'], best: 2 },
        { label: 'Msg/s each', values: ['1,840', '2,310', '1,790'], best: 1 },
        { label: 'Workers', values: ['22', '18', '23'], best: 1 },
        { label: 'A month', values: ['$3,084', '$2,234', '$4,238'], best: 1 },
      ],
    },
  }),
  plan({
    id: 'compare-plan-sesi',
    size: '2x2',
    domain: 'workspace',
    surface: 'muted',
    name: 'Sesi plans side by side',
    props: {
      label: 'Sesi for 40 people',
      options: [
        { name: 'Team', summary: 'Enough for one office that signs in with passwords.' },
        { name: 'Business', summary: 'Single sign-on and a year of audit log.' },
        { name: 'Enterprise', summary: 'Seven years of audit log and support within the hour.' },
      ],
      rows: [
        { label: 'A month', values: ['IDR 3.0 M', 'IDR 5.6 M', 'Quote'] },
        { label: 'Storage', values: ['1 TB', '5 TB', 'No cap'], best: 2 },
        { label: 'SSO', values: ['No', 'Yes', 'Yes'], best: 1 },
        { label: 'Audit log', values: ['30 days', '1 year', '7 years'], best: 2 },
        { label: 'Support', values: ['Email', 'Chat, 8 h', '24/7, 1 h'], best: 2 },
        { label: 'Data in ID', values: ['Yes', 'Yes', 'Yes'] },
      ],
    },
  }),
]
