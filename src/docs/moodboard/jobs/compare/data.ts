/**
 * Data for the compare chapter. Seeded, so every load and every screenshot is the same, and
 * shaped after the real thing: wet and dry seasons in Malang, twin-date sales, the Java–Bali
 * grid, port throughput, rupiah against the majors. Organisations are invented; places are real.
 * The board lives in the first week of November 2026: today is Thursday 5 Nov.
 */
import type { CandlePoint, GanttRow, ScatterSeries } from '@/design-system'
import { pad, seeded, walk, wave, weekday } from '../../kit'

const round = (v: number, d = 0) => Math.round(v * 10 ** d) / 10 ** d
const day = (iso: string, plus = 0) => new Date(new Date(`${iso}T12:00:00+07:00`).getTime() + plus * 86400000)
/** "Mon 26 Oct" for n days from a start. */
export const days = (iso: string, n: number) => Array.from({ length: n }, (_, i) => weekday(day(iso, i)))
const dm = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'Asia/Jakarta' })
/** "5 Nov" for n days from a start. */
const dayNum = (iso: string, n: number) => Array.from({ length: n }, (_, i) => dm.format(day(iso, i)))

export const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
export const hours = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => `${pad(from + i)}:00`)

/* ── Pick columns ───────────────────────────────────────────────────────────────────────── */

export const chargebacks = {
  values: [12, 9, 14, 11, 21, 6, 4],
  names: days('2026-10-26', 7),
  ticks: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
}

/** Malang, mm a month in 2025: the wet season from November to April. */
export const rain2025 = [362, 341, 318, 205, 112, 58, 34, 21, 38, 104, 236, 318]
export const rain2026 = [355, 330, 296, 188, 97, 41, 22, 15, 31, 121, 246, 331]
export const rain2024 = [341, 362, 280, 221, 131, 66, 41, 30, 52, 96, 214, 302]

export const plays = {
  values: [42.1, 39.8, 44.6, 47.2, 58.9, 71.4, 66.0],
  names: days('2026-10-26', 7),
  ticks: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
}

/** Boardings an hour at Dukuh Atas on a weekday, 05:00 to 23:00. */
export const boardings = {
  values: [1240, 4810, 9620, 8130, 4210, 3080, 2960, 3410, 3240, 3580, 4120, 5930, 8840, 9910, 7230, 4620, 3010, 2080, 910],
  names: hours(5, 23).map((h, i) => `${h}–${pad(6 + i)}:00`),
  ticks: hours(5, 23).map((h, i) => (i % 3 === 0 ? h.slice(0, 2) : '')),
}

/** Evening peak on feeder 7 (Denpasar), percent of its rating, 23 Oct to 5 Nov. */
export const feederLoad = {
  values: [71, 68, 64, 74, 82, 88, 93, 79, 70, 66, 77, 96, 104, 99],
  names: days('2026-10-23', 14),
  ticks: dayNum('2026-10-23', 14).map((d) => d.split(' ')[0]),
}

/* ── Month squares ──────────────────────────────────────────────────────────────────────── */

export const rainOct = [0, 0, 0, 2, 0, 0, 0, 0, 5, 0, 0, 12, 0, 0, 0, 3, 0, 8, 22, 0, 0, 14, 31, 6, 0, 18, 27, 9, 0, 35, 12]
export const outageOct = [0, 0, 0, 0, 12, 0, 0, 0, 0, 0, 0, 0, 0, 48, 0, 0, 0, 0, 0, 0, 0, 7, 0, 0, 0, 0, 0, 0, 96, 0, 0]

function byWeekday(seed: string, start: string, n: number, work: number, sat: number, sun: number, spread = 0.12) {
  const rnd = seeded(seed)
  return Array.from({ length: n }, (_, i) => {
    const dow = day(start, i).getUTCDay()
    const base = dow === 0 ? sun : dow === 6 ? sat : work
    return Math.max(0, Math.round(base * (1 + (rnd() - 0.5) * 2 * spread)))
  })
}

export const clinicOct = byWeekday('cmp-clinic', '2026-10-01', 31, 164, 92, 0)
export const deploysOct = byWeekday('cmp-deploy-oct', '2026-10-01', 31, 14, 2, 1, 0.45)
export const deploysNov = [...byWeekday('cmp-deploy-nov', '2026-11-01', 5, 16, 2, 1, 0.4), ...Array<null>(25).fill(null)]

function orders(seed: string, start: string, n: number, spike: number, lift: number) {
  const base = byWeekday(seed, start, n, 1840, 2310, 2160, 0.1)
  return base.map((v, i) => (i + 1 === spike ? Math.round(v * lift) : i + 1 >= 25 && i + 1 <= 27 ? Math.round(v * 1.18) : v))
}
export const ordersAug = orders('cmp-orders-aug', '2026-08-01', 31, 8, 3.4)
export const ordersSep = orders('cmp-orders-sep', '2026-09-01', 30, 9, 3.9)
export const ordersOct = orders('cmp-orders-oct', '2026-10-01', 31, 10, 4.6)

/* ── Dot strips ─────────────────────────────────────────────────────────────────────────── */

export const depositRates = [
  { name: 'Arunika Bank', value: 5.25 },
  { name: 'Bank Sagara', value: 4.75 },
  { name: 'Bank Lestari Jaya', value: 5.5 },
  { name: 'Bank Pesisir', value: 4.25 },
  { name: 'Kencana Syariah', value: 4.9 },
  { name: 'Bank Rinjani', value: 3.75 },
  { name: 'Bank Kemuning', value: 6.0 },
  { name: 'Bank Teratai', value: 4.5 },
  { name: 'Bank Lembayung', value: 3.25 },
  { name: 'Bank Pelita Timur', value: 5.75 },
  { name: 'Bank Gemilang', value: 4.6 },
  { name: 'Bank Andalas Raya', value: 4.0 },
  { name: 'Bank Karimun', value: 6.25 },
  { name: 'Bank Tenggara', value: 4.8 },
  { name: 'Bank Kawi', value: 3.5 },
  { name: 'Bank Selat', value: 5.1 },
  { name: 'Bank Jatiluhur', value: 4.4 },
  { name: 'Bank Mahakam', value: 5.0 },
]

export const courierDays = [
  { name: 'Kurir Kilat', value: 1.8 },
  { name: 'Antar Cepat', value: 2.4 },
  { name: 'Paket Nusantara', value: 3.1 },
  { name: 'Kirim Kita', value: 2.6 },
  { name: 'Sigap Express', value: 2.0 },
  { name: 'Lintas Kargo', value: 3.8 },
  { name: 'Jalur Timur', value: 4.2 },
  { name: 'Kurir Rakyat', value: 2.9 },
  { name: 'Titip Kirim', value: 2.2 },
  { name: 'Paket Sore', value: 3.4 },
  { name: 'Rantai Biru', value: 2.7 },
  { name: 'Kilau Logistik', value: 1.6 },
  { name: 'Bawa Dulu', value: 3.0 },
  { name: 'Sampai Esok', value: 2.5 },
]

/** Integrated loudness of an album in mastering, LUFS. "Pulang" is the track on the desk. */
export const loudness = [
  { name: 'Pagi', value: -13.2 },
  { name: 'Kota Lama', value: -12.6 },
  { name: 'Laut Biru', value: -14.1 },
  { name: 'Senja', value: -15.8 },
  { name: 'Pulang', value: -9.8 },
  { name: 'Arus', value: -11.4 },
  { name: 'Kabut', value: -16.3 },
  { name: 'Lampu Jalan', value: -12.1 },
  { name: 'Rindu Rumah', value: -13.7 },
  { name: 'Teduh', value: -14.6 },
  { name: 'Gerimis', value: -15.1 },
  { name: 'Sunyi', value: -17.2 },
]

/** PM2.5 by monitoring station in Jakarta, 24-hour mean, 4 Nov 2026. */
export const pm25 = [
  ['Kemayoran', 41],
  ['Bundaran HI', 38],
  ['Kelapa Gading', 47],
  ['Jagakarsa', 33],
  ['Lubang Buaya', 52],
  ['Kebon Jeruk', 45],
  ['Cilincing', 61],
  ['Tanjung Priok', 66],
  ['Senayan', 36],
  ['Kuningan', 39],
  ['Cempaka Putih', 43],
  ['Pasar Minggu', 35],
  ['Cengkareng', 57],
  ['Kalideres', 54],
  ['Grogol', 48],
  ['Tebet', 40],
  ['Cawang', 50],
  ['Pulo Gadung', 58],
  ['Rawamangun', 44],
  ['Ancol', 49],
  ['Menteng', 34],
  ['Glodok', 46],
  ['Tomang', 42],
  ['Cipayung', 31],
].map(([name, value]) => ({ name: name as string, value: value as number }))

/* ── Histograms ─────────────────────────────────────────────────────────────────────────── */

/** Counts for a skewed spread: a peak near `mode` bins in and a long right tail. */
function skew(seed: string, bins: number, mode: number, total: number, tail = 0.35) {
  const rnd = seeded(seed)
  const raw = Array.from({ length: bins }, (_, i) => {
    const x = (i + 0.5 - mode) / Math.max(1, mode)
    const shape = x < 0 ? Math.exp(-x * x * 2.2) : Math.exp(-x * (1 - tail) * 1.6) * (1 + tail * x * 0.15)
    return Math.max(0, shape * (0.9 + rnd() * 0.2))
  })
  const sum = raw.reduce((a, b) => a + b, 0)
  return raw.map((v) => Math.round((v / sum) * total))
}

export const latencyEdges = Array.from({ length: 17 }, (_, i) => i * 50)
export const latencyBefore = skew('cmp-lat-before', 16, 5.6, 18420, 0.55)
export const latencyAfter = skew('cmp-lat-after', 16, 3.2, 19260, 0.4)

export const basketEdges = Array.from({ length: 21 }, (_, i) => i * 25)
export const basketOct = skew('cmp-basket-oct', 20, 4.2, 6120, 0.5)
export const basketNov = skew('cmp-basket-nov', 20, 4.8, 6480, 0.55)

export const tripEdges = Array.from({ length: 19 }, (_, i) => i * 5)
export const tripWeekday = skew('cmp-trip-wd', 18, 6.4, 41200, 0.45)
export const tripWeekend = skew('cmp-trip-we', 18, 5.0, 23800, 0.4)

export const ageBands = ['0–9', '10–19', '20–29', '30–39', '40–49', '50–59', '60–69', '70–79', '80+']
export const ward3 = [4, 6, 11, 14, 19, 27, 33, 26, 12]
export const ward5 = [22, 15, 18, 16, 14, 12, 9, 6, 3]

/* ── Leaderboards ───────────────────────────────────────────────────────────────────────── */

export const hubsWeek = [
  { name: 'Cikarang', value: 96.1, prev: 2 },
  { name: 'Surabaya', value: 95.4, prev: 1 },
  { name: 'Medan', value: 94.0, prev: 5 },
  { name: 'Makassar', value: 93.2, prev: 3 },
  { name: 'Semarang', value: 92.7, prev: 4 },
  { name: 'Denpasar', value: 91.9, prev: 6 },
  { name: 'Balikpapan', value: 89.4, prev: 8 },
  { name: 'Pontianak', value: 88.1, prev: 7 },
]
export const hubsMonth = [
  { name: 'Surabaya', value: 95.0, prev: 1 },
  { name: 'Cikarang', value: 94.6, prev: 3 },
  { name: 'Makassar', value: 93.8, prev: 2 },
  { name: 'Semarang', value: 92.9, prev: 4 },
  { name: 'Medan', value: 92.1, prev: 6 },
  { name: 'Denpasar', value: 91.2, prev: 5 },
  { name: 'Pontianak', value: 89.0, prev: 8 },
  { name: 'Balikpapan', value: 88.7, prev: 7 },
]

export const storesWeek = [
  { name: 'Braga', value: 412, prev: 1 },
  { name: 'Kemang', value: 398, prev: 3 },
  { name: 'Tunjungan', value: 371, prev: 2 },
  { name: 'Malioboro', value: 344, prev: 6 },
  { name: 'Sudirman', value: 322, prev: 4 },
  { name: 'Panakkukang', value: 287, prev: 5 },
  { name: 'Sanur', value: 251, prev: 8 },
  { name: 'Dago', value: 198, prev: 7 },
]
export const storesMonth = [
  { name: 'Kemang', value: 1712, prev: 2 },
  { name: 'Braga', value: 1688, prev: 1 },
  { name: 'Tunjungan', value: 1534, prev: 3 },
  { name: 'Sudirman', value: 1421, prev: 4 },
  { name: 'Malioboro', value: 1302, prev: 5 },
  { name: 'Panakkukang', value: 1188, prev: 6 },
  { name: 'Dago', value: 902, prev: 8 },
  { name: 'Sanur', value: 887, prev: 7 },
]

export const coopsRendeng = [
  { name: 'Sumber Rejeki', value: 6.8, prev: 2 },
  { name: 'Tani Makmur', value: 6.6, prev: 1 },
  { name: 'Subur Jaya', value: 6.1, prev: 4 },
  { name: 'Mekar Sari', value: 5.9, prev: 3 },
  { name: 'Maju Bersama', value: 5.6, prev: 6 },
  { name: 'Sri Rejeki', value: 5.4, prev: 5 },
  { name: 'Harapan', value: 5.0, prev: null },
  { name: 'Lestari', value: 4.7, prev: 7 },
]
export const coopsGadu = [
  { name: 'Tani Makmur', value: 5.9, prev: 1 },
  { name: 'Subur Jaya', value: 5.7, prev: 3 },
  { name: 'Sumber Rejeki', value: 5.5, prev: 2 },
  { name: 'Mekar Sari', value: 5.2, prev: 4 },
  { name: 'Lestari', value: 5.0, prev: 8 },
  { name: 'Sri Rejeki', value: 4.8, prev: 5 },
  { name: 'Maju Bersama', value: 4.6, prev: 6 },
  { name: 'Harapan', value: 4.1, prev: 7 },
]

const SHOWS = ['Kopi Pagi', 'Obrolan Senja', 'Bola Kampung', 'Dapur Ibu', 'Kabar Kota', 'Cerita Malam', 'Teknologi Kita', 'Pasar Pagi', 'Musik Daerah', 'Jalan-Jalan']
export const showsWeek = [
  [184.2, 2],
  [171.6, 1],
  [158.9, 3],
  [142.3, 6],
  [139.8, 4],
  [121.4, 5],
  [98.7, 9],
  [92.1, 7],
  [88.4, 8],
  [61.2, null],
].map(([value, prev], i) => ({ name: SHOWS[i], value: value as number, prev: prev as number | null }))
export const showsMonth = [
  [702.4, 1],
  [688.1, 2],
  [611.0, 3],
  [540.2, 5],
  [552.9, 4],
  [470.3, 6],
  [366.8, 8],
  [384.5, 7],
  [341.2, 9],
  [190.4, 10],
].map(([value, prev], i) => ({ name: SHOWS[i], value: value as number, prev: prev as number | null }))

/* ── Small multiples ────────────────────────────────────────────────────────────────────── */

export const cpu = ['node-a', 'node-b', 'node-c', 'node-d'].map((name, i) => ({
  name,
  values: walk(`cmp-cpu-${name}`, 60, [46, 58, 31, 72][i], 0.07, { min: 8, max: 97, decimals: 0 }),
}))

export const dams = [
  { name: 'Jatiluhur', values: [62, 71, 79, 84, 86, 83, 76, 68, 59, 52, 49, 54] },
  { name: 'Cirata', values: [58, 66, 74, 80, 82, 79, 72, 63, 55, 47, 44, 50] },
  { name: 'Saguling', values: [55, 63, 72, 77, 78, 74, 66, 57, 48, 41, 38, 45] },
  { name: 'Gajah Mungkur', values: [41, 52, 64, 72, 75, 70, 59, 46, 35, 27, 24, 31] },
]

export const storesDaily = ['Braga', 'Kemang', 'Tunjungan', 'Malioboro'].map((name, i) => ({
  name,
  values: wave(`cmp-store-${name}`, 30, { base: [58, 54, 49, 44][i], amp: [9, 7, 6, 11][i], period: 7, phase: i, noise: 0.06, decimals: 1 }),
}))

export const lines = ['Line A', 'Line B', 'Line C', 'Line D'].map((name, i) => ({
  name,
  values: walk(`cmp-line-${name}`, 12, [128, 74, 51, 22][i], 0.04, { drift: [0.12, 0.2, -0.05, 0.3][i], decimals: 1 }),
}))

/* ── Lines ──────────────────────────────────────────────────────────────────────────────── */

export const latencyHours = hours(0, 24)
export const latencyRegions = [
  { name: 'Jakarta', values: wave('cmp-lat-jkt', 25, { base: 182, amp: 36, noise: 0.05 }) },
  { name: 'Singapore', values: wave('cmp-lat-sin', 25, { base: 128, amp: 22, phase: 3, noise: 0.05 }) },
  { name: 'Frankfurt', values: wave('cmp-lat-fra', 25, { base: 236, amp: 40, phase: 8, noise: 0.06 }) },
]

export const freqs = ['20', '50', '100', '200', '500', '1k', '2k', '5k', '10k', '20k']
export const monitors = [
  { name: 'Nearfield 5', values: [-9.5, -3.1, -0.6, 0.2, 0, 0.3, -0.2, 0.4, -0.6, -3.2] },
  { name: 'Midfield 8', values: [-4.2, -1.1, 0.5, 0.8, 0.2, -0.3, 0.1, 0.6, 0.2, -2.1] },
  { name: 'Room at seat', values: [2.1, 6.2, 4.4, -3.1, 1.0, -1.6, 0.5, -0.8, -2.6, -6.4] },
]

/** Business days 1 Oct to 5 Nov, rupiah per unit rebased to 100 on 1 Oct. */
const businessDays = (from: string, n: number) => {
  const out: string[] = []
  for (let i = 0; out.length < n; i++) {
    const d = day(from, i)
    if (d.getUTCDay() !== 0 && d.getUTCDay() !== 6) out.push(dm.format(d))
  }
  return out
}
export const fxDays = businessDays('2026-10-01', 26)
export const fx = [
  { name: 'USD', values: walk('cmp-fx-usd', fxDays.length, 100, 0.0035, { drift: 0.08, decimals: 2 }) },
  { name: 'SGD', values: walk('cmp-fx-sgd', fxDays.length, 100, 0.003, { drift: 0.05, decimals: 2 }) },
  { name: 'EUR', values: walk('cmp-fx-eur', fxDays.length, 100, 0.004, { drift: -0.04, decimals: 2 }) },
  { name: 'JPY', values: walk('cmp-fx-jpy', fxDays.length, 100, 0.005, { drift: -0.12, decimals: 2 }) },
]

export const portWeeks = Array.from({ length: 26 }, (_, i) => `W${20 + i}`)
export const ports = [
  { name: 'Tanjung Priok', values: walk('cmp-port-tp', 26, 134, 0.03, { drift: 0.06, decimals: 1 }) },
  { name: 'Tanjung Perak', values: walk('cmp-port-pk', 26, 73, 0.035, { drift: 0.03, decimals: 1 }) },
  { name: 'Belawan', values: walk('cmp-port-bl', 26, 27, 0.05, { decimals: 1 }) },
  { name: 'Makassar', values: walk('cmp-port-mk', 26, 17, 0.06, { drift: 0.1, decimals: 1 }) },
]

/** Weekly peak demand on the Java–Bali grid, GW. 2026 runs to W45 and is forecast after. */
export const weeks52 = Array.from({ length: 52 }, (_, i) => `W${i + 1}`)
const demand = (seed: string, base: number) =>
  wave(seed, 52, { base, amp: 0.9, period: 52, phase: 10, noise: 0.004, decimals: 2 }).map((v, i) => round(v + i * 0.012, 2))
export const demand2026 = demand('cmp-demand-26', 31.4)
export const demand2025 = demand('cmp-demand-25', 30.1)
export const demand2024 = demand('cmp-demand-24', 28.9)

export const dps2026 = [2.08, 1.82, 1.95, 2.06, 2.1, 2.25, 2.56, 2.61, 2.31, 2.22, 2.12, 2.41]
export const dps2025 = [1.98, 1.71, 1.89, 1.93, 1.97, 2.12, 2.41, 2.46, 2.18, 2.09, 1.99, 2.27]
export const dps2024 = [1.79, 1.6, 1.74, 1.81, 1.85, 1.98, 2.24, 2.31, 2.05, 1.96, 1.88, 2.14]

/* ── Columns ────────────────────────────────────────────────────────────────────────────── */

export const settled = {
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  names: days('2026-10-26', 7),
  values: [18.4, 22.1, 19.6, 24.8, 27.3, 9.2, 6.1],
  targets: [20, 20, 20, 22, 25, 8, 8],
}

export const admissions = {
  labels: ['N', 'D', 'J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O'],
  names: ['Nov 2025', 'Dec 2025', 'Jan 2026', 'Feb 2026', 'Mar 2026', 'Apr 2026', 'May 2026', 'Jun 2026', 'Jul 2026', 'Aug 2026', 'Sep 2026', 'Oct 2026'],
  values: [312, 298, 341, 356, 329, 301, 288, 276, 294, 308, 322, 347],
}

export const streams = {
  labels: Array.from({ length: 24 }, (_, i) => pad(i)),
  names: hours(0, 23).map((h, i) => `${h}–${pad((i + 1) % 24)}:00`),
  values: wave('cmp-streams', 24, { base: 21, amp: 13, period: 24, phase: -2, noise: 0.08, decimals: 1 }).map((v, i) =>
    round(v + (i >= 6 && i <= 8 ? 9 : 0) + (i >= 17 && i <= 19 ? 7 : 0), 1),
  ),
}

/* ── Scatter ────────────────────────────────────────────────────────────────────────────── */

export const credit: ScatterSeries[] = [
  {
    name: 'Corporate',
    points: [
      { x: 0.4, y: 182, label: 'PT Sagara Daya' },
      { x: 0.7, y: 141 },
      { x: 1.1, y: 96 },
      { x: 0.9, y: 120 },
      { x: 3.4, y: 168, label: 'PT Samudra Kargo' },
      { x: 1.6, y: 72 },
    ],
  },
  {
    name: 'SME',
    points: [
      { x: 1.8, y: 38 },
      { x: 2.2, y: 44 },
      { x: 3.1, y: 29 },
      { x: 2.7, y: 52 },
      { x: 4.4, y: 61, label: 'CV Rotan Cirebon' },
      { x: 3.6, y: 33 },
      { x: 1.4, y: 47 },
    ],
  },
  {
    name: 'Retail',
    points: [
      { x: 3.8, y: 12 },
      { x: 4.9, y: 9 },
      { x: 5.6, y: 14 },
      { x: 6.4, y: 8 },
      { x: 4.2, y: 18 },
      { x: 7.1, y: 11 },
    ],
  },
]

export const storesScatter: ScatterSeries[] = [
  {
    name: 'Mall',
    points: [
      { x: 2140, y: 9.8, label: 'Tunjungan' },
      { x: 1880, y: 11.2 },
      { x: 2460, y: 8.1, label: 'Panakkukang' },
      { x: 1620, y: 12.6 },
      { x: 1990, y: 10.4 },
    ],
  },
  {
    name: 'Street',
    points: [
      { x: 880, y: 16.4, label: 'Braga' },
      { x: 1040, y: 14.9, label: 'Kemang' },
      { x: 760, y: 13.1 },
      { x: 1210, y: 12.2 },
      { x: 640, y: 17.8, label: 'Dago' },
      { x: 950, y: 11.6 },
    ],
  },
]

export const portsScatter: ScatterSeries[] = [
  {
    name: 'Java',
    points: [
      { x: 134, y: 3.1, label: 'Tanjung Priok' },
      { x: 73, y: 3.3, label: 'Tanjung Perak' },
      { x: 18, y: 2.4 },
      { x: 12, y: 2.9 },
      { x: 9, y: 4.6 },
    ],
  },
  {
    name: 'Outside Java',
    points: [
      { x: 27, y: 4.4, label: 'Belawan' },
      { x: 17, y: 3.8 },
      { x: 11, y: 5.2, label: 'Bitung' },
      { x: 6, y: 6.1, label: 'Sorong' },
      { x: 8, y: 3.4 },
      { x: 14, y: 2.7 },
      { x: 5, y: 4.9 },
    ],
  },
]

/* ── Heatmaps ───────────────────────────────────────────────────────────────────────────── */

export const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function grid(rows: number, cols: number, cell: (r: number, c: number, rnd: () => number) => number, seed: string) {
  const rnd = seeded(seed)
  return Array.from({ length: rows }, (_, r) => Array.from({ length: cols }, (_, c) => Math.max(0, Math.round(cell(r, c, rnd)))))
}

export const signInCols = Array.from({ length: 12 }, (_, i) => pad(i * 2))
export const signIns = grid(7, 12, (r, c, rnd) => {
  const work = r < 5 ? 1 : 0.42
  const dayCurve = Math.max(0, Math.sin(((c - 3) / 9) * Math.PI))
  return (40 + 880 * dayCurve * work) * (0.9 + rnd() * 0.2)
}, 'cmp-signins')
export const signInFails = grid(7, 12, (r, c, rnd) => {
  const night = c <= 2 || c >= 11 ? 1 : 0.25
  return (8 + 46 * night * (r === 5 || r === 6 ? 1.6 : 1)) * (0.7 + rnd() * 0.6)
}, 'cmp-signin-fails')

export const stations = ['Dukuh Atas', 'Sudirman', 'Manggarai', 'Tanah Abang', 'Bekasi', 'Bogor']
export const stationHours = Array.from({ length: 19 }, (_, i) => pad(5 + i))
const peaks = (c: number, morning: number, evening: number) =>
  morning * Math.exp(-((c - 2) ** 2) / 2.2) + evening * Math.exp(-((c - 13) ** 2) / 2.6)
export const gatesWeekday = grid(6, 19, (r, c, rnd) => {
  const size = [9.6, 8.4, 7.2, 6.8, 5.6, 6.1][r]
  const inbound = r >= 4 ? 1.5 : 0.7
  return (0.6 + peaks(c, size * inbound, size * (2.1 - inbound))) * 1000 * (0.92 + rnd() * 0.16)
}, 'cmp-gates-wd')
export const gatesWeekend = grid(6, 19, (r, c, rnd) => {
  const size = [3.2, 2.6, 4.8, 6.4, 3.1, 4.4][r]
  return (0.5 + size * Math.exp(-((c - 8) ** 2) / 18)) * 1000 * (0.9 + rnd() * 0.2)
}, 'cmp-gates-we')

export const hours24 = Array.from({ length: 24 }, (_, i) => pad(i))
export const erArrivals = grid(7, 24, (r, c, rnd) => {
  const daily = 2 + 9 * Math.exp(-((c - 11) ** 2) / 22) + 5 * Math.exp(-((c - 20) ** 2) / 10)
  return daily * (r === 0 ? 1.25 : r >= 5 ? 1.1 : 1) * (0.8 + rnd() * 0.4)
}, 'cmp-er')
export const erWaits = grid(7, 24, (r, c, rnd) => {
  const load = Math.max(0, Math.exp(-((c - 13) ** 2) / 14) * 6 + Math.exp(-((c - 21) ** 2) / 8) * 5 - 1.2)
  return load * (r === 0 ? 1.5 : 1) * (0.6 + rnd() * 0.8)
}, 'cmp-er-wait')

/* ── Candles ────────────────────────────────────────────────────────────────────────────── */

function candles(seed: string, labels: string[], start: number, vol: number, drift = 0, volume = 1): CandlePoint[] {
  const rnd = seeded(seed)
  let price = start
  return labels.map((t) => {
    const open = price
    const close = open * (1 + (rnd() - 0.5 + drift) * 2 * vol)
    const high = Math.max(open, close) * (1 + rnd() * vol * 0.9)
    const low = Math.min(open, close) * (1 - rnd() * vol * 0.9)
    price = close
    return {
      t,
      open: round(open, 2),
      high: round(high, 2),
      low: round(low, 2),
      close: round(close, 2),
      volume: Math.round(volume * (0.5 + rnd()) * 1e6),
    }
  })
}

const fiveMin = Array.from({ length: 40 }, (_, i) => {
  const m = 9 * 60 + i * 5
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`
})
export const usdIdrDay = candles('cmp-usdidr-5m', fiveMin, 16232, 0.0006, 0.02, 0.4)
export const usdIdrMonth = candles('cmp-usdidr-1m', businessDays('2026-10-07', 22), 16118, 0.003, 0.04, 6)
export const cpoMonth = candles('cmp-cpo-1m', businessDays('2026-10-07', 22), 13620, 0.009, 0.03, 2)
export const cpoQuarter = candles('cmp-cpo-3m', businessDays('2026-08-10', 63), 12840, 0.01, 0.025, 2)
export const brentMonth = candles('cmp-brent-1m', businessDays('2026-10-07', 22), 74.2, 0.012, -0.02, 3)
export const brentQuarter = candles('cmp-brent-3m', businessDays('2026-08-10', 63), 78.6, 0.013, -0.025, 3)

/* ── Range bars ─────────────────────────────────────────────────────────────────────────── */

export const days14 = dayNum('2026-10-23', 14)
const spread = (seed: string, n: number, lo: number, hi: number, wobble: number): [number, number][] => {
  const rnd = seeded(seed)
  return Array.from({ length: n }, () => {
    const a = round(lo + (rnd() - 0.5) * wobble, 0)
    const b = round(hi + (rnd() - 0.5) * wobble * 1.4, 0)
    return [Math.min(a, b - 2), Math.max(b, a + 2)]
  })
}
export const tempBandung = spread('cmp-t-bdg', 14, 18, 29, 3)
export const tempJakarta = spread('cmp-t-jkt', 14, 25, 34, 2)
export const workdays10 = days('2026-10-26', 12).filter((d) => !/^(Sat|Sun)/.test(d)).map((d) => d.replace(/ (Oct|Nov)$/, ''))
export const commuteTrain = spread('cmp-commute-train', 10, 52, 68, 6)
export const commuteCar = spread('cmp-commute-car', 10, 58, 112, 22)
export const humidLiving = spread('cmp-hum-living', 14, 52, 71, 6)
export const humidBedroom = spread('cmp-hum-bed', 14, 58, 82, 6)

/* ── Dot matrix ─────────────────────────────────────────────────────────────────────────── */

export const shipWeeks = Array.from({ length: 16 }, (_, i) => `W${30 + i}`)
export const shipDomestic = wave('cmp-ship-dom', 16, { base: 3400, amp: 900, period: 9, phase: 1, noise: 0.06 })
export const shipExport = wave('cmp-ship-exp', 16, { base: 1500, amp: 500, period: 7, phase: 4, noise: 0.08 })

export const days14Short = days14.map((d) => d.split(' ')[0])
export const playsApp = wave('cmp-plays-app', 14, { base: 38, amp: 9, period: 7, phase: 2, noise: 0.06 })
export const playsWeb = wave('cmp-plays-web', 14, { base: 14, amp: 4, period: 7, phase: 5, noise: 0.08 })
export const playsRadio = wave('cmp-plays-radio', 14, { base: 9, amp: 2, period: 7, phase: 0, noise: 0.1 })

export const sortiesFighter = wave('cmp-sortie-f', 14, { base: 9, amp: 2, period: 7, noise: 0.15 })
export const sortiesTransport = wave('cmp-sortie-t', 14, { base: 4, amp: 1, period: 7, phase: 3, noise: 0.2 })
export const sortiesPatrol = wave('cmp-sortie-p', 14, { base: 6, amp: 1, period: 7, phase: 5, noise: 0.15 })

/* ── Gantt ──────────────────────────────────────────────────────────────────────────────── */

export const passes: GanttRow[] = [
  {
    id: 'svb',
    label: 'Svalbard',
    meta: 'SVB-2 · 13 M',
    items: [
      { start: 382, end: 394, label: 'RS-07' },
      { start: 476, end: 489, label: 'RS-11' },
      { start: 571, end: 583, label: 'RS-07' },
      { start: 664, end: 677, label: 'RS-11' },
      { start: 760, end: 772, label: 'RS-07' },
    ],
  },
  {
    id: 'pta',
    label: 'Punta Arenas',
    meta: 'PTA-1 · 7.3 M',
    items: [
      { start: 410, end: 421, label: 'RS-04' },
      { start: 540, end: 600, label: 'Maintenance', tone: 'context', hatch: true },
      { start: 702, end: 714, label: 'RS-04' },
    ],
  },
  {
    id: 'sin',
    label: 'Singapore',
    meta: 'SIN-3 · 9 M',
    items: [
      { start: 455, end: 466, label: 'RS-02' },
      { start: 590, end: 604, label: 'RS-09', tone: 'signal' },
      { start: 648, end: 648, label: 'Burn window', milestone: true },
      { start: 735, end: 747, label: 'RS-02' },
    ],
  },
  {
    id: 'awa',
    label: 'Awarua',
    meta: 'AWA-1 · 13 M',
    items: [
      { start: 396, end: 409, label: 'RS-09' },
      { start: 520, end: 533, label: 'RS-04' },
      { start: 618, end: 640, label: 'RS-11 · tentative', tone: 'context', hatch: true },
      { start: 790, end: 803, label: 'RS-09' },
    ],
  },
]

export const berths: GanttRow[] = [
  {
    id: 'b1',
    label: 'Berth 1',
    meta: 'North quay · 14 M',
    items: [
      { start: 6 * 60, end: 9 * 60 + 40, label: 'MV Sagara Jaya' },
      { start: 10 * 60 + 30, end: 16 * 60 + 10, label: 'MV Kopra Star' },
    ],
  },
  {
    id: 'b2',
    label: 'Berth 2',
    meta: 'North quay · 14 M',
    items: [
      { start: 7 * 60, end: 12 * 60 + 20, label: 'KM Lentera Timur' },
      { start: 13 * 60, end: 17 * 60 + 30, label: 'MV Tirta Baja', hatch: true, tone: 'context' },
    ],
  },
  {
    id: 'b3',
    label: 'Berth 3',
    meta: 'East quay · 12 M',
    items: [
      { start: 6 * 60 + 20, end: 8 * 60, label: 'Dredging', tone: 'context', hatch: true },
      { start: 8 * 60 + 40, end: 14 * 60 + 50, label: 'MV Samudra Biru' },
    ],
  },
  {
    id: 'b4',
    label: 'Berth 4',
    meta: 'East quay · 11 M',
    items: [
      { start: 9 * 60 + 15, end: 9 * 60 + 15, label: 'Pilot on board', milestone: true },
      { start: 11 * 60, end: 15 * 60 + 40, label: 'MV Graha Niaga' },
    ],
  },
]

export const patrols: GanttRow[] = [
  {
    id: 'a',
    label: 'Sector A',
    meta: 'Selat Makassar',
    items: [
      { start: 6 * 60 + 10, end: 8 * 60 + 40, label: 'P-2' },
      { start: 10 * 60, end: 12 * 60 + 30, label: 'P-5' },
    ],
  },
  {
    id: 'b',
    label: 'Sector B',
    meta: 'Laut Sulawesi',
    items: [
      { start: 7 * 60, end: 9 * 60 + 50, label: 'UAV-3' },
      { start: 11 * 60 + 20, end: 13 * 60 + 40, label: 'UAV-3 · planned', hatch: true, tone: 'context' },
    ],
  },
  {
    id: 'c',
    label: 'Sector C',
    meta: 'Laut Flores',
    items: [
      { start: 8 * 60 + 30, end: 11 * 60, label: 'P-7', tone: 'signal' },
      { start: 12 * 60, end: 12 * 60, label: 'Handover', milestone: true },
    ],
  },
]
