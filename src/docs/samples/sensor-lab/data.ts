/**
 * AQ-4 air-quality stations in Research building B, Bandung. Tuesday 03 Nov 2026, 14:20 WIB.
 * CO₂ is simulated from room occupancy with a ventilation lag, so the curves, the heatmap and
 * the readouts tell the same story: Merapi has had twelve people in it since 13:00.
 */

export const NOW = { day: 'Tue 03 Nov 2026', clock: '14:20:08', hour: 14 + 20 / 60 }

/** [start hour, end hour, occupancy 0–1] */
type Block = [number, number, number]

export interface Device {
  id: string
  room: string
  floor: string
  /** CO₂ with nobody in the room, ppm. */
  base: number
  /** CO₂ the room settles at when full, ppm. */
  full: number
  blocks: Block[]
  /** Ventilation time constant, hours. */
  tau: number
  pm: number
  voc: number
  temp: number
  rh: number
  battery: number
  rssi: number
  firmware: string
  /** Last report, HH:MM:SS WIB. */
  lastSeen: string
  online: boolean
}

const office: Block[] = [
  [7.5, 10, 0.55],
  [10, 12, 1],
  [12, 13, 0.6],
  [13, 16.5, 1],
  [16.5, 19, 0.35],
]

export const devices: Device[] = [
  { id: 'AQ4-0121', room: 'Meeting room Merapi', floor: '3.02', base: 450, full: 1400, blocks: [[9, 10.5, 0.75], [13, 15.5, 1]], tau: 0.7, pm: 8.1, voc: 168, temp: 25.4, rh: 58, battery: 64, rssi: -61, firmware: '1.8.2', lastSeen: '14:20:02', online: true },
  { id: 'AQ4-0112', room: 'Wet lab', floor: '2.14', base: 460, full: 880, blocks: office, tau: 0.5, pm: 6.4, voc: 131, temp: 22.8, rh: 49, battery: 88, rssi: -57, firmware: '1.8.2', lastSeen: '14:20:05', online: true },
  { id: 'AQ4-0113', room: 'Clean room antechamber', floor: '2.09', base: 430, full: 640, blocks: office, tau: 0.35, pm: 2.1, voc: 74, temp: 21.0, rh: 45, battery: 91, rssi: -63, firmware: '1.8.2', lastSeen: '14:20:01', online: true },
  { id: 'AQ4-0120', room: 'Open office', floor: '3.10', base: 470, full: 1090, blocks: office, tau: 0.8, pm: 11.6, voc: 142, temp: 24.9, rh: 55, battery: 52, rssi: -70, firmware: '1.8.2', lastSeen: '14:19:58', online: true },
  { id: 'AQ4-0127', room: 'Server room', floor: 'B1.03', base: 420, full: 520, blocks: [[9, 9.5, 1], [15, 15.5, 1]], tau: 0.4, pm: 3.3, voc: 61, temp: 19.2, rh: 41, battery: 77, rssi: -74, firmware: '1.8.1', lastSeen: '14:20:06', online: true },
  { id: 'AQ4-0131', room: 'Lobby', floor: '1.00', base: 440, full: 760, blocks: [[7, 9.5, 1], [11.5, 13.5, 0.8], [16.5, 18.5, 1]], tau: 0.45, pm: 17.8, voc: 118, temp: 26.3, rh: 63, battery: 34, rssi: -66, firmware: '1.8.2', lastSeen: '14:19:55', online: true },
  { id: 'AQ4-0134', room: 'Workshop', floor: '1.05', base: 450, full: 980, blocks: office, tau: 0.6, pm: 22.4, voc: 196, temp: 27.1, rh: 60, battery: 3, rssi: -82, firmware: '1.7.4', lastSeen: '09:12:40', online: false },
  { id: 'AQ4-0140', room: 'Rooftop, outdoor', floor: 'R', base: 418, full: 440, blocks: [[7, 9, 1], [16.5, 19, 1]], tau: 0.3, pm: 24.6, voc: 88, temp: 29.8, rh: 71, battery: 96, rssi: -59, firmware: '1.8.2', lastSeen: '14:20:07', online: true },
]

export const OUTDOOR_ID = 'AQ4-0140'

/** A small deterministic generator, so every device draws the same curves on every visit. */
export function seeded(seed: number) {
  let s = (seed * 2654435761) >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

const seedOf = (id: string) => Number(id.slice(-4))

function occupancy(blocks: Block[], hour: number, weekend: boolean) {
  if (weekend) return 0
  const h = ((hour % 24) + 24) % 24
  for (const [a, b, o] of blocks) if (h >= a && h < b) return o
  return 0
}

/**
 * CO₂ every `step` hours from `from` (hours relative to today's midnight, may be negative)
 * for `count` samples. Simulates a day of warm-up first so the curve starts settled.
 */
export function co2Series(device: Device, from: number, count: number, step: number, weekendOf: (hour: number) => boolean) {
  const rnd = seeded(seedOf(device.id) + Math.round(from * 7))
  let c = device.base
  const out: number[] = []
  const dt = 0.25
  const start = from - 24
  for (let t = start; t < from + count * step - 1e-9; t += dt) {
    const occ = occupancy(device.blocks, t, weekendOf(t))
    const target = device.base + occ * (device.full - device.base)
    c += (target - c) * (1 - Math.exp(-dt / device.tau))
    const k = (t - from) / step
    if (k > -1e-9 && Math.abs(k - Math.round(k)) < 1e-6) out.push(Math.round(c + (rnd() - 0.5) * 18))
  }
  return out.slice(0, count)
}

/** The last 24 hours at 15-minute means, ending at 14:15 today. */
export const TREND_STEP = 0.25
export const TREND_COUNT = 96
export const TREND_FROM = 14.25 - (TREND_COUNT - 1) * TREND_STEP
export const trendLabels = Array.from({ length: TREND_COUNT }, (_, i) => {
  const h = (((TREND_FROM + i * TREND_STEP) % 24) + 24) % 24
  return `${String(Math.floor(h)).padStart(2, '0')}:${String(Math.round((h % 1) * 60)).padStart(2, '0')}`
})
export const trendFor = (d: Device) => co2Series(d, TREND_FROM, TREND_COUNT, TREND_STEP, () => false)

/** The last seven full days, hourly. Sat 31 Oct and Sun 01 Nov the building is closed. */
export const heatDays = ['Tue 27', 'Wed 28', 'Thu 29', 'Fri 30', 'Sat 31', 'Sun 01', 'Mon 02']
export const heatHours = Array.from({ length: 24 }, (_, h) => String(h).padStart(2, '0'))
const weekendIndex = [4, 5]

export type Metric = 'co2' | 'pm' | 'voc'

export function heatFor(d: Device, metric: Metric): number[][] {
  return heatDays.map((_, day) => {
    const weekend = weekendIndex.includes(day)
    const rnd = seeded(seedOf(d.id) * 31 + day * 7 + metric.length)
    if (metric === 'co2') {
      const series = co2Series(d, 0, 24, 1, () => weekend)
      return series.map((v) => Math.round(v + (rnd() - 0.5) * 24))
    }
    if (metric === 'pm') {
      // Indoor PM follows the street: rush hours at 07–09 and 17–19, lower at weekends.
      return heatHours.map((_, h) => {
        const rush = (h >= 7 && h <= 9) || (h >= 17 && h <= 19) ? 1 : 0
        const v = d.pm * (weekend ? 0.7 : 1) * (0.75 + rush * 0.6) + (rnd() - 0.5) * 3
        return Math.max(1, Math.round(v * 10) / 10)
      })
    }
    // VOC index: 100 is the room's own average. The cleaning crew passes at 06:00 on weekdays.
    return heatHours.map((_, h) => {
      const occ = occupancy(d.blocks, h, weekend)
      const cleaning = !weekend && h === 6 ? 140 : 0
      return Math.round(92 + occ * (d.voc - 92) + cleaning + (rnd() - 0.5) * 16)
    })
  })
}

export interface Thresholds {
  co2Warn: number
  co2Crit: number
  pmWarn: number
  vocWarn: number
}

export const defaultThresholds: Thresholds = { co2Warn: 1000, co2Crit: 1500, pmWarn: 15, vocWarn: 150 }
