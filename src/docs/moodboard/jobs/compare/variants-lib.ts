/** Variants of the patterns built on the library charts: 2x2 and larger only, they are heavy. */
import type { MoodEntry } from '../../types'
import * as d from './data'
import { bridge, bullets, candles, cols, heat, lastYear, lines, rank, ranges, scatter, schedule, tally } from './patterns'

const avg = (xs: number[]) => Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10
const at = (h: number, m = 0) => h * 60 + m

export const lib: MoodEntry[] = [
  /* ── Lines you can switch ── */
  lines({
    id: 'compare-lines-latency',
    size: '2x2',
    domain: 'devops',
    surface: 'dark',
    name: 'Latency by region',
    props: {
      label: 'p95 latency by region',
      note: 'Last 24 h · WIB',
      yUnit: 'ms',
      labels: d.latencyHours,
      curve: 'step',
      series: d.latencyRegions,
      references: [{ value: 300, label: 'SLO 300 ms', kind: 'threshold' }],
    },
  }),
  lines({
    id: 'compare-lines-monitors',
    size: '2x2',
    domain: 'audio',
    name: 'Frequency response, three sources',
    props: {
      label: 'Frequency response',
      note: 'Hz · at the desk',
      yUnit: 'dB',
      labels: d.freqs,
      curve: 'monotone',
      series: d.monitors,
      references: [{ value: 0, label: 'Flat', kind: 'target' }],
      format: { decimals: 1 },
      axis: { decimals: 0 },
      initial: [0, 2],
    },
  }),
  lines({
    id: 'compare-lines-fx',
    size: '3x2',
    domain: 'banking',
    name: 'Rupiah against the majors',
    props: {
      label: 'Rupiah per unit, rebased',
      note: '1 Oct = 100',
      labels: d.fxDays,
      series: d.fx,
      endLabels: true,
      min: 96,
      max: 104,
      format: { decimals: 2 },
      axis: { decimals: 0 },
      references: [{ value: 100, label: '1 Oct', kind: 'average', align: 'start' }],
    },
  }),
  lines({
    id: 'compare-lines-ports',
    size: '4x2',
    domain: 'logistics',
    name: 'Throughput by port',
    props: {
      label: 'Container throughput by port',
      note: 'Thousand TEU a week',
      yUnit: 'K TEU',
      labels: d.portWeeks,
      series: d.ports,
      endLabels: true,
      format: { decimals: 1 },
      axis: { decimals: 0 },
    },
  }),

  /* ── This year over last ── */
  lastYear({
    id: 'compare-year-demand',
    size: '2x2',
    domain: 'energy',
    name: 'Peak demand, year on year',
    props: {
      label: 'Peak demand, Java–Bali',
      yUnit: 'GW',
      labels: d.weeks52,
      current: { name: '2026', values: d.demand2026 },
      previous: [
        { name: '2025', values: d.demand2025 },
        { name: '2024', values: d.demand2024 },
      ],
      now: 44,
      forecastFrom: 44,
      min: 27,
      format: { decimals: 1 },
    },
  }),
  lastYear({
    id: 'compare-year-rain',
    size: '3x2',
    domain: 'agri',
    surface: 'muted',
    name: 'Rain by month, year on year',
    props: {
      label: 'Rain by month, Malang',
      yUnit: 'mm',
      labels: d.months,
      current: { name: '2026', values: d.rain2026 },
      previous: [
        { name: '2025', values: d.rain2025 },
        { name: '2024', values: d.rain2024 },
      ],
      now: 10,
      forecastFrom: 9,
    },
  }),
  lastYear({
    id: 'compare-year-dps',
    size: '2x2',
    domain: 'aerospace',
    surface: 'dark',
    name: 'Passengers at DPS, year on year',
    props: {
      label: 'Passengers through DPS',
      yUnit: 'M',
      labels: d.months,
      current: { name: '2026', values: d.dps2026 },
      previous: [
        { name: '2025', values: d.dps2025 },
        { name: '2024', values: d.dps2024 },
      ],
      now: 10,
      forecastFrom: 9,
      min: 1.4,
      format: { decimals: 2 },
      axis: { decimals: 1 },
    },
  }),

  /* ── Ranked, with a switch ── */
  rank({
    id: 'compare-rank-products',
    size: '2x2',
    domain: 'commerce',
    name: 'Products by revenue or units',
    props: {
      label: 'Top products, October',
      names: ['Kopi susu 1 L', 'Arabica Gayo 250 g', 'Robusta Dampit 1 kg', 'Cold brew, 6', 'Drip bags, 10', 'Gula aren 500 g', 'Tumbler 500 ml'],
      metrics: [
        { key: 'rev', label: 'Revenue', unit: 'Rp M', format: { decimals: 1 }, values: [182.4, 141.2, 96.8, 88.1, 61.5, 38.9, 34.2] },
        { key: 'units', label: 'Units', unit: 'units', values: [4120, 1490, 760, 640, 1980, 2310, 310] },
      ],
    },
  }),
  rank({
    id: 'compare-rank-paths',
    size: '2x2',
    domain: 'devops',
    surface: 'dark',
    name: 'Paths by traffic or errors',
    props: {
      label: 'Top paths, last 24 h',
      names: ['/v1/payments', '/v1/accounts/:id', '/v1/transfers', '/v1/fx/quotes', '/v1/statements', '/v1/webhooks'],
      metrics: [
        { key: 'req', label: 'Requests', unit: 'requests', format: { kind: 'compact' }, values: [482120, 351904, 228310, 141772, 96480, 41205] },
        { key: 'err', label: '5xx', unit: 'errors', values: [214, 38, 402, 61, 12, 288] },
      ],
    },
  }),
  rank({
    id: 'compare-rank-districts',
    size: '2x2',
    domain: 'civic',
    surface: 'muted',
    name: 'Reports by district',
    props: {
      label: 'Reports, Surabaya',
      names: ['Tegalsari', 'Wonokromo', 'Rungkut', 'Tambaksari', 'Sukolilo', 'Genteng', 'Kenjeran'],
      metrics: [
        { key: 'all', label: 'Reports', unit: 'reports', values: [412, 388, 301, 276, 254, 190, 162] },
        { key: 'open', label: 'Still open', unit: 'open', values: [38, 71, 22, 64, 18, 9, 41] },
      ],
    },
  }),

  /* ── Columns, one in focus ── */
  cols({
    id: 'compare-cols-settled',
    size: '2x2',
    domain: 'payments',
    name: 'Settlement by day against target',
    props: {
      label: 'Settled, 26 Oct to 1 Nov',
      yUnit: 'IDR bn',
      ...d.settled,
      format: { decimals: 1 },
      hideYAxis: true,
      initial: 3,
    },
  }),
  cols({
    id: 'compare-cols-admissions',
    size: '2x2',
    domain: 'health',
    name: 'Admissions by month',
    props: {
      label: 'Admissions · Ward 3',
      ...d.admissions,
      showValues: false,
      references: [{ value: avg(d.admissions.values), label: 'Avg', kind: 'average' }],
    },
  }),
  cols({
    id: 'compare-cols-streams',
    size: '3x2',
    domain: 'media',
    name: 'Streams by hour',
    props: {
      label: 'Streams by hour · Sesi Radio, Tue 3 Nov',
      yUnit: 'K',
      ...d.streams,
      references: [{ value: avg(d.streams.values), label: 'Avg', kind: 'average' }],
      format: { decimals: 1 },
      axis: { decimals: 0 },
      initial: 7,
    },
  }),

  /* ── Against the target, row by row ── */
  bullets({
    id: 'compare-bullets-quarter',
    size: '2x2',
    domain: 'banking',
    name: 'Quarter results against targets',
    props: {
      label: 'Quarter results',
      format: { decimals: 1 },
      periods: [
        {
          key: 'q2',
          label: 'Q2',
          rows: [
            { label: 'Revenue', sublabel: 'IDR bn', value: 166.2, target: 170, ranges: [130, 165, 205] },
            { label: 'New accounts', sublabel: 'thousand', value: 41.6, target: 40, ranges: [28, 38, 50] },
            { label: 'Card spend', sublabel: 'IDR bn', value: 58.9, target: 60, ranges: [45, 58, 72] },
            { label: 'Disputes in SLA', sublabel: 'percent', value: 93.1, target: 95, ranges: [85, 92, 100] },
          ],
        },
        {
          key: 'q3',
          label: 'Q3',
          rows: [
            { label: 'Revenue', sublabel: 'IDR bn', value: 182.4, target: 180, ranges: [140, 175, 220], previous: 166.2 },
            { label: 'New accounts', sublabel: 'thousand', value: 48.2, target: 45, ranges: [30, 42, 55], previous: 41.6 },
            { label: 'Card spend', sublabel: 'IDR bn', value: 61.7, target: 72, ranges: [50, 65, 80], previous: 58.9 },
            { label: 'Disputes in SLA', sublabel: 'percent', value: 96.4, target: 95, ranges: [85, 92, 100], previous: 93.1 },
          ],
        },
      ],
    },
  }),
  bullets({
    id: 'compare-bullets-budget',
    size: '2x2',
    domain: 'devops',
    name: 'Error budget left by service',
    props: {
      label: 'Error budget left',
      format: { decimals: 0 },
      periods: [
        {
          key: 'oct',
          label: 'Oct',
          rows: [
            { label: 'api-gateway', sublabel: '% left', value: 71, target: 25, ranges: [25, 50, 100] },
            { label: 'payments-core', sublabel: '% left', value: 34, target: 25, ranges: [25, 50, 100] },
            { label: 'ledger', sublabel: '% left', value: 93, target: 25, ranges: [25, 50, 100] },
            { label: 'auth', sublabel: '% left', value: 12, target: 25, ranges: [25, 50, 100] },
          ],
        },
        {
          key: 'nov',
          label: 'Nov',
          rows: [
            { label: 'api-gateway', sublabel: '% left', value: 62, target: 25, ranges: [25, 50, 100] },
            { label: 'payments-core', sublabel: '% left', value: 18, target: 25, ranges: [25, 50, 100] },
            { label: 'ledger', sublabel: '% left', value: 91, target: 25, ranges: [25, 50, 100] },
            { label: 'auth', sublabel: '% left', value: 44, target: 25, ranges: [25, 50, 100] },
          ],
        },
      ],
    },
  }),
  bullets({
    id: 'compare-bullets-plants',
    size: '2x2',
    domain: 'energy',
    surface: 'muted',
    name: 'Output against plan by plant',
    props: {
      label: 'Output vs plan · GWh',
      format: { decimals: 0 },
      periods: [
        {
          key: 'sep',
          label: 'Sep',
          rows: [
            { label: 'PLTA Cirata', sublabel: 'hydro', value: 39, target: 42, ranges: [32, 40, 48] },
            { label: 'PLTU Paiton', sublabel: 'coal', value: 1812, target: 1800, ranges: [1500, 1750, 2000] },
            { label: 'PLTP Kamojang', sublabel: 'geothermal', value: 131, target: 132, ranges: [110, 126, 145] },
            { label: 'PLTS Cirata', sublabel: 'solar', value: 17, target: 16, ranges: [12, 15, 19] },
          ],
        },
        {
          key: 'oct',
          label: 'Oct',
          rows: [
            { label: 'PLTA Cirata', sublabel: 'hydro', value: 42, target: 46, ranges: [35, 44, 52] },
            { label: 'PLTU Paiton', sublabel: 'coal', value: 1840, target: 1800, ranges: [1500, 1750, 2000] },
            { label: 'PLTP Kamojang', sublabel: 'geothermal', value: 128, target: 132, ranges: [110, 126, 145] },
            { label: 'PLTS Cirata', sublabel: 'solar', value: 19, target: 17, ranges: [12, 15, 20] },
          ],
        },
      ],
    },
  }),

  /* ── From one total to the next ── */
  bridge({
    id: 'compare-bridge-cash',
    size: '3x2',
    domain: 'banking',
    name: 'Operating cash flow',
    props: {
      label: 'Operating cash flow',
      unit: 'IDR bn',
      format: { decimals: 1 },
      axis: { decimals: 0 },
      periods: [
        {
          key: 'sep',
          label: 'Sep',
          steps: [
            { label: 'Opening', value: 41.7, kind: 'total' },
            { label: 'Collections', value: 30.8 },
            { label: 'Payroll', value: -14.6 },
            { label: 'Vendors', value: -8.1 },
            { label: 'Tax and FX', value: -0.6 },
            { label: 'Closing', value: 0, kind: 'total' },
          ],
        },
        {
          key: 'oct',
          label: 'Oct',
          steps: [
            { label: 'Opening', value: 49.2, kind: 'total' },
            { label: 'Collections', value: 33.5 },
            { label: 'Payroll', value: -14.8 },
            { label: 'Vendors', value: -9.6 },
            { label: 'Tax and FX', value: -5.5 },
            { label: 'Closing', value: 0, kind: 'total' },
          ],
        },
      ],
    },
  }),
  bridge({
    id: 'compare-bridge-heads',
    size: '2x2',
    domain: 'workspace',
    name: 'Headcount, start to end',
    props: {
      label: 'Headcount',
      unit: 'people',
      periods: [
        {
          key: 'q2',
          label: 'Q2',
          steps: [
            { label: 'Start', value: 396, kind: 'total' },
            { label: 'Hires', value: 41 },
            { label: 'Leavers', value: -25 },
            { label: 'End', value: 0, kind: 'total' },
          ],
        },
        {
          key: 'q3',
          label: 'Q3',
          steps: [
            { label: 'Start', value: 412, kind: 'total' },
            { label: 'Hires', value: 38 },
            { label: 'Leavers', value: -25 },
            { label: 'End', value: 0, kind: 'total' },
          ],
        },
      ],
    },
  }),
  bridge({
    id: 'compare-bridge-energy',
    size: '4x2',
    domain: 'energy',
    surface: 'dark',
    name: 'From generation to the meter',
    props: {
      label: 'From generation to the meter',
      unit: 'GWh',
      periods: [
        {
          key: 'sep',
          label: 'Sep',
          steps: [
            { label: 'Generated', value: 2086, kind: 'total' },
            { label: 'Imports', value: 58 },
            { label: 'Own use', value: -84 },
            { label: 'Transmission', value: -50 },
            { label: 'Distribution', value: -152 },
            { label: 'Non-technical', value: -34 },
            { label: 'Billed', value: 0, kind: 'total' },
          ],
        },
        {
          key: 'oct',
          label: 'Oct',
          steps: [
            { label: 'Generated', value: 2140, kind: 'total' },
            { label: 'Imports', value: 64 },
            { label: 'Own use', value: -86 },
            { label: 'Transmission', value: -52 },
            { label: 'Distribution', value: -148 },
            { label: 'Non-technical', value: -31 },
            { label: 'Billed', value: 0, kind: 'total' },
          ],
        },
      ],
    },
  }),

  /* ── Two measures at once ── */
  scatter({
    id: 'compare-scatter-credit',
    size: '2x2',
    domain: 'banking',
    surface: 'dark',
    name: 'Exposure against default risk',
    props: {
      label: 'Credit book',
      xLabel: 'PD %',
      yLabel: 'USD M',
      series: d.credit,
      yReferences: [{ value: 150, label: 'Limit 150', kind: 'threshold' }],
      formatX: { decimals: 1 },
      over: 'over the single-name limit',
    },
  }),
  scatter({
    id: 'compare-scatter-stores',
    size: '2x2',
    domain: 'commerce',
    name: 'Footfall against conversion',
    props: {
      label: 'Stores',
      xLabel: 'Visitors a day',
      yLabel: 'Conversion %',
      series: d.storesScatter,
      yReferences: [{ value: 12, label: 'Target 12%', kind: 'target' }],
      formatX: { kind: 'compact' },
      formatY: { decimals: 1 },
      over: 'above the 12% target',
    },
  }),
  scatter({
    id: 'compare-scatter-ports',
    size: '3x2',
    domain: 'logistics',
    name: 'Throughput against dwell time',
    props: {
      label: 'Throughput against dwell time',
      xLabel: 'K TEU a week',
      yLabel: 'Dwell days',
      series: d.portsScatter,
      yReferences: [{ value: 4, label: 'Dwell limit 4 days', kind: 'threshold' }],
      formatY: { decimals: 1 },
      over: 'over four days',
    },
  }),

  /* ── Hour by day ── */
  heat({
    id: 'compare-heat-signins',
    size: '2x2',
    domain: 'security',
    surface: 'dark',
    name: 'Sign-ins by weekday and hour',
    props: {
      label: 'Sign-ins, last 4 weeks',
      rows: d.weekdays,
      cols: d.signInCols,
      colNames: d.signInCols.map((h) => `${h}:00`),
      note: 'WIB',
      metrics: [
        { key: 'all', label: 'All', values: d.signIns },
        { key: 'failed', label: 'Failed', values: d.signInFails },
      ],
    },
  }),
  heat({
    id: 'compare-heat-gates',
    size: '3x2',
    domain: 'transit',
    name: 'Gate entries by station and hour',
    props: {
      label: 'Gate entries by station and hour',
      rows: d.stations,
      cols: d.stationHours,
      colNames: d.stationHours.map((h) => `${h}:00`),
      note: 'WIB',
      metrics: [
        { key: 'weekday', label: 'Weekday', values: d.gatesWeekday },
        { key: 'weekend', label: 'Weekend', values: d.gatesWeekend },
      ],
    },
  }),
  heat({
    id: 'compare-heat-er',
    size: '4x2',
    domain: 'health',
    name: 'ER arrivals by weekday and hour',
    props: {
      label: 'Emergency arrivals, last 8 weeks',
      rows: d.weekdays,
      cols: d.hours24,
      colNames: d.hours24.map((h) => `${h}:00`),
      note: 'WITA',
      metrics: [
        { key: 'arrivals', label: 'Arrivals', unit: 'a week', values: d.erArrivals },
        { key: 'waits', label: 'Waited 1 h+', unit: 'a week', values: d.erWaits },
      ],
    },
  }),

  /* ── Open, high, low, close ── */
  candles({
    id: 'compare-candles-usdidr',
    size: '2x2',
    domain: 'banking',
    surface: 'dark',
    name: 'USD/IDR candles',
    props: {
      label: 'USD/IDR',
      decimals: 0,
      ranges: [
        { key: '1d', label: '1D', data: d.usdIdrDay },
        { key: '1m', label: '1M', data: d.usdIdrMonth },
      ],
    },
  }),
  candles({
    id: 'compare-candles-cpo',
    size: '3x2',
    domain: 'agri',
    name: 'Palm oil candles',
    props: {
      label: 'Crude palm oil, tender',
      unit: 'IDR/kg',
      decimals: 0,
      ranges: [
        { key: '1m', label: '1M', data: d.cpoMonth },
        { key: '3m', label: '3M', data: d.cpoQuarter },
      ],
    },
  }),
  candles({
    id: 'compare-candles-brent',
    size: '2x2',
    domain: 'energy',
    name: 'Brent candles',
    props: {
      label: 'Brent crude',
      unit: 'USD/bbl',
      decimals: 2,
      ranges: [
        { key: '1m', label: '1M', data: d.brentMonth },
        { key: '3m', label: '3M', data: d.brentQuarter },
      ],
    },
  }),

  /* ── Low to high, per day ── */
  ranges({
    id: 'compare-range-temp',
    size: '2x2',
    domain: 'civic',
    name: 'Temperature, two cities',
    props: {
      label: 'Temperature',
      unit: '°C',
      labels: d.days14,
      sets: [
        { key: 'bdg', label: 'Bandung', ranges: d.tempBandung, average: 23.6 },
        { key: 'jkt', label: 'Jakarta', ranges: d.tempJakarta, average: 29.4 },
      ],
    },
  }),
  ranges({
    id: 'compare-range-commute',
    size: '2x2',
    domain: 'transit',
    name: 'Commute by train or by car',
    props: {
      label: 'Bekasi to Sudirman',
      unit: 'min',
      labels: d.workdays10,
      sets: [
        { key: 'train', label: 'Train', ranges: d.commuteTrain, average: 60 },
        { key: 'car', label: 'Car', ranges: d.commuteCar, average: 84 },
      ],
      min: 30,
      max: 140,
    },
  }),
  ranges({
    id: 'compare-range-humid',
    size: '2x2',
    domain: 'home',
    name: 'Humidity, two rooms',
    props: {
      label: 'Humidity',
      unit: '%',
      labels: d.days14,
      sets: [
        { key: 'living', label: 'Living room', ranges: d.humidLiving, average: 62 },
        { key: 'bedroom', label: 'Bedroom', ranges: d.humidBedroom, average: 70 },
      ],
      min: 40,
      max: 90,
    },
  }),

  /* ── Counted in dots ── */
  tally({
    id: 'compare-tally-ship',
    size: '2x2',
    domain: 'logistics',
    surface: 'dark',
    name: 'Shipments a week, as pixels',
    props: {
      label: 'Shipments a week',
      labels: d.shipWeeks,
      series: [
        { name: 'Domestic', values: d.shipDomestic },
        { name: 'Export', values: d.shipExport },
      ],
      shape: 'pixel',
      per: 'a week',
    },
  }),
  tally({
    id: 'compare-tally-plays',
    size: '2x2',
    domain: 'audio',
    name: 'Plays a day by source',
    props: {
      label: 'Plays a day · thousand',
      labels: d.days14,
      ticks: d.days14Short,
      series: [
        { name: 'App', values: d.playsApp },
        { name: 'Web', values: d.playsWeb },
        { name: 'Radio', values: d.playsRadio },
      ],
      per: 'a day',
    },
  }),
  tally({
    id: 'compare-tally-sorties',
    size: '2x2',
    domain: 'defense',
    surface: 'muted',
    name: 'Sorties a day by role',
    props: {
      label: 'Sorties a day',
      labels: d.days14,
      ticks: d.days14Short,
      series: [
        { name: 'Fighter', values: d.sortiesFighter },
        { name: 'Transport', values: d.sortiesTransport },
        { name: 'Patrol', values: d.sortiesPatrol },
      ],
      shape: 'pixel',
      per: 'a day',
    },
  }),

  /* ── Side by side in time ── */
  schedule({
    id: 'compare-sched-passes',
    size: '4x2',
    domain: 'aerospace',
    surface: 'dark',
    name: 'Ground-station passes',
    props: {
      label: 'Ground-station passes, 5 Nov',
      zone: 'UTC',
      rows: d.passes,
      domain: [at(6), at(14)],
      ticks: [6, 7, 8, 9, 10, 11, 12, 13, 14].map((h) => at(h)),
      now: at(9, 41),
      labelWidth: 130,
      initial: [2, 1],
    },
  }),
  schedule({
    id: 'compare-sched-berths',
    size: '3x2',
    domain: 'logistics',
    name: 'Berths at Tanjung Priok',
    props: {
      label: 'Berths at Tanjung Priok, 5 Nov',
      zone: 'WIB',
      rows: d.berths,
      domain: [at(6), at(18)],
      ticks: [6, 8, 10, 12, 14, 16, 18].map((h) => at(h)),
      now: at(10, 12),
      labelWidth: 110,
      initial: [0, 1],
    },
  }),
  schedule({
    id: 'compare-sched-patrols',
    size: '2x2',
    domain: 'defense',
    name: 'Patrol windows by sector',
    props: {
      label: 'Patrol windows, 5 Nov',
      zone: 'WITA',
      rows: d.patrols,
      domain: [at(6), at(14)],
      ticks: [6, 8, 10, 12, 14].map((h) => at(h)),
      now: at(9, 20),
      labelWidth: 96,
      initial: [2, 0],
    },
  }),
]
