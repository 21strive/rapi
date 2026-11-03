/**
 * Grid operations · Nusa Grid control centre, 12 Nov 2026 at 14:00 WIB. Three regional systems
 * share the screen; each has its own load curve, generation mix, reserves, substations and
 * curtailments. The hourly mix adds up to the metered load of the same hour.
 */
import type { BulletRow, StatusTone, TimelineItem } from '@/design-system'

export type RegionId = 'jb' | 'sum' | 'sul'

const pad = (n: number) => String(Math.floor(n)).padStart(2, '0')
export const halfHourLabels = Array.from({ length: 49 }, (_, i) => `${pad(i / 2)}:${i % 2 ? '30' : '00'}`)
/** 14:00 is sample 28 of the half-hourly day. */
export const NOW_INDEX = 28

function noise(i: number, seed: number) {
  const x = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453
  return x - Math.floor(x) - 0.5
}

/** Shape of a weekday load in Jawa–Bali, as a share of the evening peak, every 30 min. */
const SHAPE = [
  0.79, 0.77, 0.75, 0.74, 0.73, 0.72, 0.71, 0.71, 0.715, 0.73, 0.76, 0.79, 0.82, 0.84, 0.86, 0.88, 0.895, 0.905, 0.915, 0.925,
  0.93, 0.935, 0.94, 0.935, 0.925, 0.92, 0.925, 0.93, 0.92, 0.915, 0.91, 0.915, 0.925, 0.94, 0.96, 0.98, 0.99, 1.0, 0.995,
  0.985, 0.97, 0.95, 0.93, 0.905, 0.88, 0.86, 0.84, 0.82, 0.8,
]

/** Solar share of capacity by hour of the day, 0 at night. */
const SUN = (h: number) => (h < 6 || h > 18 ? 0 : Math.max(0, Math.sin(((h - 6) / 12) * Math.PI)) ** 1.3)

export interface Substation {
  id: string
  name: string
  kv: number
  loadMw: number
  transformer: number
  status: 'Normal' | 'Alarm' | 'Outage' | 'Maintenance'
  note: string
}

export const SUB_TONE: Record<Substation['status'], StatusTone> = {
  Normal: 'success',
  Alarm: 'warning',
  Outage: 'danger',
  Maintenance: 'neutral',
}

export interface Region {
  id: RegionId
  name: string
  zone: string
  peak: number
  capacity: number
  frequency: number
  rocof: string
  inertia: string
  /** Installed solar and wind, GW. */
  solarGw: number
  windGw: number
  hydroGw: number
  coalBase: number
  reserves: BulletRow[]
  substations: Substation[]
  curtailments: (TimelineItem & { active?: boolean; mw?: number })[]
  curtailedMwh: number
}

export const regions: Region[] = [
  {
    id: 'jb',
    name: 'Jawa–Bali',
    zone: 'WIB',
    peak: 31.6,
    capacity: 34.2,
    frequency: 49.97,
    rocof: '−0.008 Hz/s',
    inertia: '142 GW·s',
    solarGw: 3.4,
    windGw: 0.9,
    hydroGw: 2.6,
    coalBase: 16.4,
    reserves: [
      { label: 'Spinning', sublabel: 'Target 1,500', value: 1180, target: 1500, ranges: [800, 1500, 2400] },
      { label: 'Fast start', sublabel: 'Target 1,800', value: 1950, target: 1800, ranges: [1000, 1800, 3000] },
      { label: 'Cold standby', sublabel: 'Target 3,000', value: 3400, target: 3000, ranges: [2000, 3000, 5000] },
    ],
    substations: [
      { id: 'jb1', name: 'GITET Cibatu Baru', kv: 500, loadMw: 1842, transformer: 78, status: 'Normal', note: 'Both IBT in service' },
      { id: 'jb2', name: 'GITET Kembangan', kv: 500, loadMw: 2210, transformer: 84, status: 'Normal', note: 'Bus coupler closed' },
      { id: 'jb3', name: 'GITET Ungaran', kv: 500, loadMw: 1365, transformer: 61, status: 'Maintenance', note: 'Bay 4 breaker, back 18:00' },
      { id: 'jb4', name: 'GI Cawang', kv: 150, loadMw: 412, transformer: 96, status: 'Alarm', note: 'Transformer 2 at 96%, oil 81 °C' },
      { id: 'jb5', name: 'GI Gandul', kv: 150, loadMw: 388, transformer: 72, status: 'Normal', note: 'Normal' },
      { id: 'jb6', name: 'GI Krian', kv: 150, loadMw: 296, transformer: 88, status: 'Normal', note: 'Line to Gresik at 98%' },
      { id: 'jb7', name: 'GI Bekasi', kv: 150, loadMw: 341, transformer: 69, status: 'Normal', note: 'Normal' },
      { id: 'jb8', name: 'GI Kapal', kv: 150, loadMw: 0, transformer: 0, status: 'Outage', note: 'Line trip 13:42, reclose failed' },
      { id: 'jb9', name: 'GI Pesanggaran', kv: 150, loadMw: 254, transformer: 91, status: 'Normal', note: 'Carrying Kapal load' },
      { id: 'jb10', name: 'GI Ngimbang', kv: 150, loadMw: 187, transformer: 58, status: 'Normal', note: 'Normal' },
    ],
    curtailments: [
      { id: 'c1', time: '13:52', title: 'Solar held back 140 MW', body: 'Cluster Jatim-3, line 150 kV Krian–Gresik at 98%', meta: 'ACTIVE', tone: 'warning', active: true, mw: 140 },
      { id: 'c2', time: '13:42', title: 'GI Kapal line trip', body: 'Bali south fed from Pesanggaran, 62 MW shifted', meta: 'OPEN', tone: 'danger' },
      { id: 'c3', time: '12:30', title: 'Solar held back 85 MW', body: 'Coal units at minimum stable load at midday', meta: 'ENDED 13:10', tone: 'neutral' },
      { id: 'c4', time: '09:40', title: 'Wind held back 25 MW', body: 'Frequency above 50.08 Hz for 40 s', meta: 'ENDED 09:55', tone: 'neutral' },
    ],
    curtailedMwh: 212,
  },
  {
    id: 'sum',
    name: 'Sumatra',
    zone: 'WIB',
    peak: 7.12,
    capacity: 7.9,
    frequency: 50.02,
    rocof: '+0.004 Hz/s',
    inertia: '31 GW·s',
    solarGw: 0.42,
    windGw: 0.05,
    hydroGw: 1.25,
    coalBase: 3.5,
    reserves: [
      { label: 'Spinning', sublabel: 'Target 330', value: 352, target: 330, ranges: [200, 330, 520] },
      { label: 'Fast start', sublabel: 'Target 400', value: 310, target: 400, ranges: [220, 400, 640] },
      { label: 'Cold standby', sublabel: 'Target 650', value: 720, target: 650, ranges: [420, 650, 1100] },
    ],
    substations: [
      { id: 's1', name: 'GITET Muara Enim', kv: 275, loadMw: 612, transformer: 74, status: 'Normal', note: 'Normal' },
      { id: 's2', name: 'GITET Lahat', kv: 275, loadMw: 488, transformer: 81, status: 'Normal', note: 'Normal' },
      { id: 's3', name: 'GI Payakumbuh', kv: 150, loadMw: 132, transformer: 67, status: 'Normal', note: 'Normal' },
      { id: 's4', name: 'GI Binjai', kv: 150, loadMw: 214, transformer: 93, status: 'Alarm', note: 'Transformer 1 at 93%' },
      { id: 's5', name: 'GI Paya Pasir', kv: 150, loadMw: 178, transformer: 71, status: 'Normal', note: 'Normal' },
      { id: 's6', name: 'GI Teluk Betung', kv: 150, loadMw: 201, transformer: 76, status: 'Normal', note: 'Normal' },
      { id: 's7', name: 'GI Bangkinang', kv: 150, loadMw: 96, transformer: 54, status: 'Maintenance', note: 'Relay test, back 16:00' },
      { id: 's8', name: 'GI Sungai Rumbai', kv: 150, loadMw: 88, transformer: 49, status: 'Normal', note: 'Normal' },
    ],
    curtailments: [
      { id: 'c1', time: '12:05', title: 'Hydro spill 30 MW', body: 'Reservoir Koto Panjang at 99.4%', meta: 'ACTIVE', tone: 'warning', active: true, mw: 30 },
      { id: 'c2', time: '10:15', title: 'Solar held back 12 MW', body: 'Line 150 kV Lahat–Lubuk Linggau at 97%', meta: 'ENDED 11:30', tone: 'neutral' },
    ],
    curtailedMwh: 48,
  },
  {
    id: 'sul',
    name: 'Sulawesi',
    zone: 'WITA',
    peak: 2.84,
    capacity: 3.12,
    frequency: 49.91,
    rocof: '−0.021 Hz/s',
    inertia: '9.8 GW·s',
    solarGw: 0.12,
    windGw: 0.21,
    hydroGw: 0.95,
    coalBase: 1.0,
    reserves: [
      { label: 'Spinning', sublabel: 'Target 140', value: 95, target: 140, ranges: [80, 140, 220] },
      { label: 'Fast start', sublabel: 'Target 160', value: 172, target: 160, ranges: [100, 160, 260] },
      { label: 'Cold standby', sublabel: 'Target 260', value: 240, target: 260, ranges: [160, 260, 420] },
    ],
    substations: [
      { id: 'u1', name: 'GI Sidrap', kv: 150, loadMw: 168, transformer: 88, status: 'Alarm', note: 'Line to Maros at 98%' },
      { id: 'u2', name: 'GI Maros', kv: 150, loadMw: 214, transformer: 82, status: 'Normal', note: 'Normal' },
      { id: 'u3', name: 'GI Tello', kv: 150, loadMw: 302, transformer: 79, status: 'Normal', note: 'Normal' },
      { id: 'u4', name: 'GI Bakaru', kv: 150, loadMw: 126, transformer: 63, status: 'Normal', note: 'Hydro at 92%' },
      { id: 'u5', name: 'GI Pinrang', kv: 150, loadMw: 74, transformer: 57, status: 'Normal', note: 'Normal' },
      { id: 'u6', name: 'GI Palopo', kv: 150, loadMw: 88, transformer: 61, status: 'Normal', note: 'Normal' },
      { id: 'u7', name: 'GI Bulukumba', kv: 150, loadMw: 0, transformer: 0, status: 'Outage', note: 'Feeder fault 13:58, crew on site' },
      { id: 'u8', name: 'GI Mamuju', kv: 150, loadMw: 51, transformer: 48, status: 'Normal', note: 'Normal' },
    ],
    curtailments: [
      { id: 'c1', time: '14:20', title: 'Wind held back 48 MW', body: 'Line 150 kV Sidrap–Maros at 98%', meta: 'ACTIVE', tone: 'warning', active: true, mw: 48 },
      { id: 'c2', time: '13:58', title: 'GI Bulukumba feeder fault', body: '31 MW of load off, crew on site', meta: 'OPEN', tone: 'danger' },
      { id: 'c3', time: '11:45', title: 'Hydro spill 18 MW', body: 'Bakaru reservoir above 99.2%', meta: 'ENDED 12:40', tone: 'neutral' },
    ],
    curtailedMwh: 71,
  },
]

/* ── Derived profiles ───────────────────────────────────────────────────────────────── */
export interface Profiles {
  actual: (number | null)[]
  intraday: number[]
  dayAhead: number[]
  mixLabels: string[]
  mix: { name: string; values: number[] }[]
}

const SEED: Record<RegionId, number> = { jb: 3, sum: 5, sul: 9 }

export function profiles(r: Region): Profiles {
  const seed = SEED[r.id]
  // Day-ahead forecast: the shape scaled to the forecast peak.
  const dayAhead = SHAPE.map((s) => Math.round(s * r.peak * 100) / 100)
  // Metered load ran 1–2% above the day-ahead in the late morning heat, with noise.
  const metered = SHAPE.map((s, i) => {
    const warm = i >= 18 && i <= 28 ? 1 + 0.012 * Math.sin(((i - 18) / 10) * Math.PI) : 1
    return Math.round(s * r.peak * warm * (1 + noise(i, seed) * 0.008) * 100) / 100
  })
  const actual = metered.map((v, i) => (i <= NOW_INDEX ? v : null))
  // Intraday forecast: metered up to now, then the day-ahead nudged by the morning error.
  const bias = metered[NOW_INDEX] / dayAhead[NOW_INDEX]
  const intraday = dayAhead.map((v, i) => (i <= NOW_INDEX ? metered[i] : Math.round(v * (1 + (bias - 1) * Math.max(0, 1 - (i - NOW_INDEX) / 12)) * 100) / 100))

  // Hourly mix for the last 24 hours, 15:00 yesterday to 14:00 today, adding up to the load.
  const hours = Array.from({ length: 24 }, (_, k) => (15 + k) % 24)
  const mixLabels = hours.map((h) => pad(h))
  const solar: number[] = []
  const wind: number[] = []
  const hydro: number[] = []
  const gas: number[] = []
  const coal: number[] = []
  hours.forEach((h, k) => {
    const load = metered[h * 2] * (k < 9 ? 1.01 : 1)
    const s = Math.round(r.solarGw * SUN(h) * (0.92 + noise(k, seed + 1) * 0.1) * 100) / 100
    const w = Math.round(r.windGw * (0.42 + 0.25 * Math.sin((k / 24) * Math.PI * 2 + seed) + noise(k, seed + 2) * 0.1) * 100) / 100
    const hy = Math.round(r.hydroGw * (h >= 17 && h <= 21 ? 0.95 : 0.62) * 100) / 100
    const c = Math.min(r.coalBase, load - s - w - hy)
    const g = Math.max(0, Math.round((load - s - w - hy - c) * 100) / 100)
    solar.push(s)
    wind.push(w)
    hydro.push(hy)
    gas.push(g)
    coal.push(Math.round(c * 100) / 100)
  })
  return {
    actual,
    intraday,
    dayAhead,
    mixLabels,
    // Stacked from the base up: the steady sources first, the variable ones on top.
    mix: [
      { name: 'Coal', values: coal },
      { name: 'Gas', values: gas },
      { name: 'Hydro', values: hydro },
      { name: 'Wind', values: wind },
      { name: 'Solar', values: solar },
    ],
  }
}

export const regionOptions = regions.map((r) => ({ label: r.name, value: r.id }))
