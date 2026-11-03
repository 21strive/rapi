/**
 * Fleet operations · depot Cikarang (CKG-1), 12 Nov 2026 at 13:20 WIB. Ten vehicles on
 * routes across Bekasi and Cikarang. Each route is a list of legs; stops are spread over the
 * legs, so the Gantt, the KPIs, the exceptions and each driver's stop list agree.
 */
import type { SpecItem, StatusTone } from '@/design-system'

export const NOW = 13 * 60 + 20
/** 06:00 to 20:00, plus ten minutes so the last tick label has room. */
export const DAY: [number, number] = [6 * 60, 20 * 60 + 10]
export const TICKS = Array.from({ length: 8 }, (_, i) => DAY[0] + i * 120)

const pad = (n: number) => String(Math.floor(n)).padStart(2, '0')
export const hhmm = (min: number) => `${pad(min / 60)}:${pad(min % 60)}`
const at = (h: number, m = 0) => h * 60 + m

function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/* ── Places ─────────────────────────────────────────────────────────────────────────── */
const CUSTOMERS = [
  ['Toko Sinar Jaya', 'Jl. Raya Bekasi Km 21'],
  ['PT Maju Bersama', 'Kawasan MM2100 Blok C-4'],
  ['Apotek Sehat Selalu', 'Jl. Teuku Umar 18, Cibitung'],
  ['Warung Bu Tini', 'Jl. Kalimalang 88'],
  ['CV Karya Mandiri', 'Jl. Industri Selatan 5'],
  ['Toko Bangunan Sumber Rejeki', 'Jl. Siliwangi 3'],
  ['Klinik Pratama Medika', 'Ruko Grand Galaxy A-17'],
  ['PT Daya Kencana', 'Kawasan Jababeka Blok F-2'],
  ['Toko Elektronik Cahaya', 'Jl. Ahmad Yani 140'],
  ['Minimarket Berkah', 'Perum Harapan Indah Blok H'],
  ['Bengkel Jaya Motor', 'Jl. Cut Meutia 12'],
  ['Kedai Kopi Senja', 'Jl. Juanda 61'],
  ['Toko Kue Lestari', 'Jl. Pramuka 9'],
  ['Gudang Sembako Makmur', 'Jl. Raya Setu 220'],
  ['Laundry Bersih Kilat', 'Jl. Kemakmuran 31'],
  ['Percetakan Aksara', 'Jl. Mustika Jaya 44'],
  ['Toko Buku Pelita', 'Jl. Chairil Anwar 7'],
  ['Optik Terang', 'Jl. Sultan Agung 52'],
  ['Toko Mainan Ceria', 'Mall Lippo Cikarang, Lt. 2'],
  ['Salon Ayu', 'Jl. Imam Bonjol 15'],
] as const

/* ── Vehicles and legs ──────────────────────────────────────────────────────────────── */
export type LegKind = 'route' | 'break' | 'return'

export interface Leg {
  kind: LegKind
  start: number
  end: number
  stops?: number
}

export interface StopEvent {
  /** Stop number on the route, 1-based. Every event here is in the past at 13:20. */
  n: number
  /** Minutes late on arrival; the arrival time is the planned time plus this. */
  late?: number
  failed?: string
  damaged?: string
}

export interface Vehicle {
  id: string
  plate: string
  type: string
  driver: string
  phone: string
  route: string
  shift: [number, number]
  capacityKg: number
  loadKg: number
  energy: string
  odometer: number
  legs: Leg[]
  events: StopEvent[]
}

export const vehicles: Vehicle[] = [
  {
    id: 'v1', plate: 'B 9412 TXA', type: '3.5 t box van', driver: 'Agus Pratama', phone: '+62 812-8841-2207', route: 'R-07',
    shift: [at(6, 30), at(16, 30)], capacityKg: 1500, loadKg: 640, energy: 'Diesel 58%', odometer: 84213,
    legs: [
      { kind: 'route', start: at(6, 45), end: at(9, 40), stops: 9 },
      { kind: 'break', start: at(9, 40), end: at(10, 0) },
      { kind: 'route', start: at(10, 0), end: at(12, 15), stops: 7 },
      { kind: 'break', start: at(12, 15), end: at(12, 50) },
      { kind: 'route', start: at(12, 50), end: at(15, 40), stops: 8 },
      { kind: 'return', start: at(15, 40), end: at(16, 20) },
    ],
    events: [{ n: 14, late: 18 }, { n: 17, late: 9 }],
  },
  {
    id: 'v2', plate: 'B 9387 TXA', type: '3.5 t box van', driver: 'Siti Rahmawati', phone: '+62 813-1170-4492', route: 'R-02',
    shift: [at(6, 0), at(15, 0)], capacityKg: 1500, loadKg: 410, energy: 'Diesel 41%', odometer: 102877,
    legs: [
      { kind: 'route', start: at(6, 15), end: at(9, 20), stops: 10 },
      { kind: 'break', start: at(9, 20), end: at(9, 40) },
      { kind: 'route', start: at(9, 40), end: at(12, 0), stops: 8 },
      { kind: 'break', start: at(12, 0), end: at(12, 30) },
      { kind: 'route', start: at(12, 30), end: at(14, 20), stops: 6 },
      { kind: 'return', start: at(14, 20), end: at(14, 55) },
    ],
    events: [{ n: 12, failed: 'Recipient not present, second attempt 15:30' }],
  },
  {
    id: 'v3', plate: 'B 9530 TXB', type: 'EV van 1.5 t', driver: 'Budi Santoso', phone: '+62 811-9033-5521', route: 'R-11',
    shift: [at(7, 0), at(17, 0)], capacityKg: 900, loadKg: 520, energy: 'Charge 46%', odometer: 21490,
    legs: [
      { kind: 'route', start: at(7, 10), end: at(10, 5), stops: 9 },
      { kind: 'break', start: at(10, 5), end: at(10, 25) },
      { kind: 'route', start: at(10, 25), end: at(12, 40), stops: 7 },
      { kind: 'break', start: at(12, 40), end: at(13, 15) },
      { kind: 'route', start: at(13, 15), end: at(16, 20), stops: 9 },
      { kind: 'return', start: at(16, 20), end: at(16, 55) },
    ],
    events: [{ n: 10, damaged: 'Carton crushed, 2 of 6 units broken' }],
  },
  {
    id: 'v4', plate: 'B 9118 TXC', type: '1 t panel van', driver: 'Dewi Lestari', phone: '+62 857-2209-1184', route: 'R-04',
    shift: [at(7, 30), at(16, 30)], capacityKg: 1000, loadKg: 300, energy: 'Petrol 63%', odometer: 56702,
    legs: [
      { kind: 'route', start: at(7, 40), end: at(10, 30), stops: 11 },
      { kind: 'break', start: at(10, 30), end: at(10, 50) },
      { kind: 'route', start: at(10, 50), end: at(13, 0), stops: 9 },
      { kind: 'break', start: at(13, 0), end: at(13, 35) },
      { kind: 'route', start: at(13, 35), end: at(15, 50), stops: 8 },
      { kind: 'return', start: at(15, 50), end: at(16, 20) },
    ],
    events: [],
  },
  {
    id: 'v5', plate: 'B 9204 TXA', type: '3.5 t box van', driver: 'Rizky Maulana', phone: '+62 812-6650-3398', route: 'R-09',
    shift: [at(6, 30), at(16, 0)], capacityKg: 1500, loadKg: 870, energy: 'Diesel 37%', odometer: 131054,
    legs: [
      { kind: 'route', start: at(6, 40), end: at(9, 50), stops: 8 },
      { kind: 'break', start: at(9, 50), end: at(10, 10) },
      { kind: 'route', start: at(10, 10), end: at(12, 50), stops: 7 },
      { kind: 'break', start: at(12, 50), end: at(13, 25) },
      { kind: 'route', start: at(13, 25), end: at(15, 25), stops: 6 },
      { kind: 'return', start: at(15, 25), end: at(15, 55) },
    ],
    events: [{ n: 6, late: 22 }, { n: 11, late: 31 }, { n: 13, late: 26 }],
  },
  {
    id: 'v6', plate: 'B 9661 TXB', type: 'EV van 1.5 t', driver: 'Yohanes Simanjuntak', phone: '+62 821-4471-0936', route: 'R-05',
    shift: [at(8, 0), at(18, 0)], capacityKg: 900, loadKg: 690, energy: 'Charge 71%', odometer: 18877,
    legs: [
      { kind: 'route', start: at(8, 10), end: at(11, 10), stops: 9 },
      { kind: 'break', start: at(11, 10), end: at(11, 30) },
      { kind: 'route', start: at(11, 30), end: at(14, 0), stops: 8 },
      { kind: 'break', start: at(14, 0), end: at(14, 35) },
      { kind: 'route', start: at(14, 35), end: at(17, 15), stops: 8 },
      { kind: 'return', start: at(17, 15), end: at(17, 50) },
    ],
    events: [{ n: 15, failed: 'Address not found, gate code missing' }],
  },
  {
    id: 'v7', plate: 'B 9075 TXC', type: '1 t panel van', driver: 'Putu Ayu Wulandari', phone: '+62 878-3021-5567', route: 'R-03',
    shift: [at(7, 0), at(16, 0)], capacityKg: 1000, loadKg: 180, energy: 'Petrol 49%', odometer: 64125,
    legs: [
      { kind: 'route', start: at(7, 10), end: at(10, 0), stops: 12 },
      { kind: 'break', start: at(10, 0), end: at(10, 20) },
      { kind: 'route', start: at(10, 20), end: at(12, 30), stops: 10 },
      { kind: 'break', start: at(12, 30), end: at(13, 5) },
      { kind: 'route', start: at(13, 5), end: at(14, 50), stops: 7 },
      { kind: 'return', start: at(14, 50), end: at(15, 25) },
    ],
    events: [{ n: 22, late: 12 }],
  },
  {
    id: 'v8', plate: 'B 9821 TXA', type: '3.5 t box van', driver: 'Mei Ling Tan', phone: '+62 815-7789-2045', route: 'R-12',
    shift: [at(9, 0), at(19, 0)], capacityKg: 1500, loadKg: 1120, energy: 'Diesel 82%', odometer: 77340,
    legs: [
      { kind: 'route', start: at(9, 15), end: at(12, 10), stops: 8 },
      { kind: 'break', start: at(12, 10), end: at(12, 45) },
      { kind: 'route', start: at(12, 45), end: at(15, 30), stops: 8 },
      { kind: 'break', start: at(15, 30), end: at(15, 50) },
      { kind: 'route', start: at(15, 50), end: at(18, 15), stops: 7 },
      { kind: 'return', start: at(18, 15), end: at(18, 50) },
    ],
    events: [],
  },
  {
    id: 'v9', plate: 'B 9346 TXB', type: 'EV van 1.5 t', driver: 'Fajar Nugroho', phone: '+62 819-0412-7763', route: 'R-06',
    shift: [at(7, 30), at(17, 30)], capacityKg: 900, loadKg: 430, energy: 'Charge 34%', odometer: 25611,
    legs: [
      { kind: 'route', start: at(7, 45), end: at(10, 40), stops: 10 },
      { kind: 'break', start: at(10, 40), end: at(11, 0) },
      { kind: 'route', start: at(11, 0), end: at(13, 30), stops: 8 },
      { kind: 'break', start: at(13, 30), end: at(14, 5) },
      { kind: 'route', start: at(14, 5), end: at(16, 40), stops: 8 },
      { kind: 'return', start: at(16, 40), end: at(17, 15) },
    ],
    events: [{ n: 7, late: 14 }],
  },
  {
    id: 'v10', plate: 'B 9790 TXC', type: '1 t panel van', driver: 'Rina Kusuma', phone: '+62 856-9934-1270', route: 'R-10',
    shift: [at(10, 0), at(20, 0)], capacityKg: 1000, loadKg: 760, energy: 'Petrol 88%', odometer: 41290,
    legs: [
      { kind: 'route', start: at(10, 15), end: at(13, 0), stops: 9 },
      { kind: 'break', start: at(13, 0), end: at(13, 30) },
      { kind: 'route', start: at(13, 30), end: at(16, 30), stops: 9 },
      { kind: 'break', start: at(16, 30), end: at(16, 50) },
      { kind: 'route', start: at(16, 50), end: at(19, 10), stops: 7 },
      { kind: 'return', start: at(19, 10), end: at(19, 45) },
    ],
    events: [{ n: 4, damaged: 'Wet packaging, contents checked and fine' }],
  },
]

/* ── Stops, spread evenly over each leg ─────────────────────────────────────────────── */
export type StopStatus = 'Delivered' | 'Late' | 'Failed' | 'Damaged' | 'Next' | 'Planned'

export interface Stop {
  n: number
  /** Planned arrival. */
  planned: number
  /** Actual or expected arrival. */
  at: number
  customer: string
  address: string
  shipment: string
  status: StopStatus
  late?: number
  note?: string
}

export const STOP_TONE: Record<StopStatus, StatusTone> = {
  Delivered: 'success',
  Late: 'signal',
  Failed: 'danger',
  Damaged: 'warning',
  Next: 'brand',
  Planned: 'neutral',
}

export function stopsOf(v: Vehicle): Stop[] {
  const rand = mulberry32(Number(v.id.slice(1)) * 7919)
  const out: Stop[] = []
  let n = 0
  for (const leg of v.legs) {
    if (leg.kind !== 'route' || !leg.stops) continue
    const span = (leg.end - leg.start) / leg.stops
    for (let k = 0; k < leg.stops; k++) {
      n += 1
      const t = Math.round(leg.start + span * (k + 0.5))
      const [customer, address] = CUSTOMERS[Math.floor(rand() * CUSTOMERS.length)]
      const ev = v.events.find((e) => e.n === n)
      const time = t + (ev?.late ?? 0)
      let status: StopStatus = time <= NOW ? 'Delivered' : 'Planned'
      if (ev?.late) status = 'Late'
      if (ev?.failed) status = 'Failed'
      if (ev?.damaged) status = 'Damaged'
      out.push({
        n,
        planned: t,
        at: time,
        customer,
        address,
        shipment: `SHP-2611-0${4700 + Number(v.id.slice(1)) * 37 + n}`,
        status,
        late: ev?.late,
        note: ev?.failed ?? ev?.damaged ?? (ev?.late ? `Arrived ${ev.late} min after the window` : undefined),
      })
    }
  }
  const next = out.find((s) => s.at > NOW && s.status === 'Planned')
  if (next) next.status = 'Next'
  return out
}

/* ── Exceptions ─────────────────────────────────────────────────────────────────────── */
export interface Exception {
  id: string
  kind: 'Late' | 'Failed' | 'Damaged'
  vehicleId: string
  plate: string
  driver: string
  stop: Stop
}

export const exceptions: Exception[] = vehicles
  .flatMap((v) =>
    stopsOf(v)
      .filter((s) => s.status === 'Late' || s.status === 'Failed' || s.status === 'Damaged')
      .map((s) => ({ id: `${v.id}-${s.n}`, kind: s.status as Exception['kind'], vehicleId: v.id, plate: v.plate, driver: v.driver, stop: s })),
  )
  .sort((a, b) => b.stop.at - a.stop.at)

export const KIND_TONE: Record<Exception['kind'], StatusTone> = { Late: 'signal', Failed: 'danger', Damaged: 'warning' }

/* ── Totals and history ─────────────────────────────────────────────────────────────── */
const allStops = vehicles.flatMap((v) => stopsOf(v))
const doneStops = allStops.filter((s) => s.at <= NOW)
const late = allStops.filter((s) => s.status === 'Late').length
const failed = allStops.filter((s) => s.status === 'Failed').length

export const totals = {
  stops: allStops.length,
  done: doneStops.length,
  late,
  failed,
  onTime: ((doneStops.length - late - failed) / doneStops.length) * 100,
  km: 1284,
}

/** The last 14 working days, oldest first; today is the last value. */
export const history = {
  onTime: [95.8, 96.4, 94.9, 95.6, 96.8, 95.1, 93.7, 94.6, 96.2, 95.9, 94.8, 95.4, 96.1, Math.round(totals.onTime * 10) / 10],
  stops: [482, 497, 471, 505, 512, 468, 449, 488, 501, 514, 476, 493, 508, totals.stops],
  late: [11, 8, 14, 10, 7, 12, 19, 13, 9, 8, 12, 10, 9, late],
  failed: [4, 3, 6, 5, 2, 4, 7, 5, 3, 4, 5, 3, 4, failed],
  stopTime: [4.9, 4.7, 5.1, 4.8, 4.6, 5.0, 5.4, 5.0, 4.7, 4.6, 4.9, 4.8, 4.7, 4.8],
}

/* ── Depot ──────────────────────────────────────────────────────────────────────────── */
export const depot = [
  { label: 'Dock doors', used: 9, total: 12, unit: 'in use' },
  { label: 'Staging lanes', used: 11, total: 16, unit: 'full' },
  { label: 'Cold room', used: 68, total: 100, unit: '%' },
  { label: 'Sorter', used: 1240, total: 1800, unit: 'parcels/h' },
  { label: 'EV chargers', used: 5, total: 8, unit: 'busy' },
]

export const depotNotes: SpecItem[] = [
  { label: 'Next linehaul', value: '14:30 · SUB-07', mono: true, hint: '1,840 parcels from Surabaya' },
  { label: 'Same-day cut-off', value: '15:00', mono: true },
  { label: 'Returns waiting', value: '63 parcels', mono: true },
]
