/**
 * Satellite constellation · Rasi, 24 Earth-observation satellites in four sun-synchronous
 * planes at about 540 km. Snapshot of 12 Nov 2026 at 08:42 UTC. Orbital elements are built
 * from each plane and slot, and the two-line sets carry real column positions and checksums.
 */
import type { SpecItem, StatusTone } from '@/design-system'

/** Minutes since 00:00 UTC. */
export const NOW_MIN = 8 * 60 + 42
/** 07:00 to 11:00, with 15 minutes of room after the last tick for the labels of late passes. */
export const WINDOW: [number, number] = [7 * 60, 11 * 60 + 15]
export const TICKS = Array.from({ length: 9 }, (_, i) => 7 * 60 + i * 30)

const pad = (n: number, w = 2) => String(Math.floor(n)).padStart(w, '0')
export const hhmm = (min: number) => `${pad(min / 60)}:${pad(min % 60)}`

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

/* ── Ground stations ────────────────────────────────────────────────────────────────── */
/** North to south. */
export const stations = [
  { id: 'SVB-2', name: 'Svalbard', dish: '13 m · X/S' },
  { id: 'INV-1', name: 'Inuvik', dish: '11 m · X/S' },
  { id: 'KIR-1', name: 'Kiruna', dish: '7.3 m · X/S' },
  { id: 'KPG-1', name: 'Kupang', dish: '9 m · X/S' },
  { id: 'AWA-1', name: 'Awarua', dish: '7.3 m · X/S' },
  { id: 'PTA-1', name: 'Punta Arenas', dish: '7.3 m · X/S' },
  { id: 'TRL-1', name: 'Troll', dish: '7.3 m · X/S' },
] as const

export type StationId = (typeof stations)[number]['id']

export interface Pass {
  station: StationId
  sat: string
  start: number
  end: number
  /** failed = no lock; maintenance = the antenna is out of service. */
  kind?: 'failed' | 'maintenance' | 'beacon' | 'recovery'
}

const t = (h: number, m: number) => h * 60 + m

export const passes: Pass[] = [
  { station: 'SVB-2', sat: 'RS-03', start: t(7, 4), end: t(7, 14) },
  { station: 'SVB-2', sat: 'RS-11', start: t(7, 31), end: t(7, 40) },
  { station: 'SVB-2', sat: 'RS-19', start: t(8, 2), end: t(8, 13) },
  { station: 'SVB-2', sat: 'RS-07', start: t(8, 36), end: t(8, 47) },
  { station: 'SVB-2', sat: 'RS-15', start: t(9, 10), end: t(9, 20) },
  { station: 'SVB-2', sat: 'RS-23', start: t(9, 43), end: t(9, 52) },
  { station: 'SVB-2', sat: 'RS-01', start: t(10, 15), end: t(10, 26) },
  { station: 'SVB-2', sat: 'RS-09', start: t(10, 47), end: t(10, 57) },

  { station: 'INV-1', sat: 'RS-02', start: t(7, 16), end: t(7, 26) },
  { station: 'INV-1', sat: 'RS-10', start: t(7, 52), end: t(8, 3) },
  { station: 'INV-1', sat: 'RS-18', start: t(8, 27), end: t(8, 37) },
  { station: 'INV-1', sat: 'RS-05', start: t(9, 4), end: t(9, 15) },
  { station: 'INV-1', sat: 'RS-13', start: t(9, 38), end: t(9, 48) },
  { station: 'INV-1', sat: 'RS-21', start: t(10, 12), end: t(10, 22) },
  { station: 'INV-1', sat: 'RS-06', start: t(10, 46), end: t(10, 56) },

  { station: 'KIR-1', sat: 'RS-08', start: t(7, 12), end: t(7, 21) },
  { station: 'KIR-1', sat: 'RS-16', start: t(7, 47), end: t(7, 57) },
  { station: 'KIR-1', sat: 'RS-14', start: t(8, 22), end: t(8, 31), kind: 'failed' },
  { station: 'KIR-1', sat: 'RS-04', start: t(9, 0), end: t(9, 9) },
  { station: 'KIR-1', sat: 'Maintenance · feed swap', start: t(9, 30), end: t(10, 30), kind: 'maintenance' },
  { station: 'KIR-1', sat: 'RS-20', start: t(10, 41), end: t(10, 51) },

  { station: 'KPG-1', sat: 'RS-22', start: t(7, 20), end: t(7, 29) },
  { station: 'KPG-1', sat: 'RS-06', start: t(8, 5), end: t(8, 15) },
  { station: 'KPG-1', sat: 'RS-12', start: t(8, 50), end: t(8, 59) },
  { station: 'KPG-1', sat: 'RS-17', start: t(10, 2), end: t(10, 12) },
  { station: 'KPG-1', sat: 'RS-02', start: t(10, 40), end: t(10, 50) },

  { station: 'AWA-1', sat: 'RS-13', start: t(7, 8), end: t(7, 18) },
  { station: 'AWA-1', sat: 'RS-05', start: t(7, 49), end: t(7, 58) },
  { station: 'AWA-1', sat: 'RS-21', start: t(8, 29), end: t(8, 39) },
  { station: 'AWA-1', sat: 'RS-10', start: t(9, 12), end: t(9, 21) },
  { station: 'AWA-1', sat: 'RS-18', start: t(9, 58), end: t(10, 8) },
  { station: 'AWA-1', sat: 'RS-24', start: t(10, 39), end: t(10, 49) },

  { station: 'PTA-1', sat: 'RS-09', start: t(7, 25), end: t(7, 35) },
  { station: 'PTA-1', sat: 'RS-14', start: t(8, 6), end: t(8, 14), kind: 'beacon' },
  { station: 'PTA-1', sat: 'RS-20', start: t(8, 58), end: t(9, 8) },
  { station: 'PTA-1', sat: 'RS-03', start: t(9, 41), end: t(9, 50) },
  { station: 'PTA-1', sat: 'RS-11', start: t(10, 22), end: t(10, 32) },

  { station: 'TRL-1', sat: 'RS-17', start: t(7, 35), end: t(7, 44) },
  { station: 'TRL-1', sat: 'RS-04', start: t(8, 12), end: t(8, 21) },
  { station: 'TRL-1', sat: 'RS-22', start: t(8, 53), end: t(9, 3) },
  { station: 'TRL-1', sat: 'RS-12', start: t(9, 27), end: t(9, 36) },
  { station: 'TRL-1', sat: 'RS-08', start: t(10, 5), end: t(10, 15) },
  { station: 'TRL-1', sat: 'RS-16', start: t(10, 44), end: t(10, 54) },
]

/** The recovery pass the operator can book from the anomaly banner. */
export const recoveryPass: Pass = { station: 'KPG-1', sat: 'RS-14', start: t(9, 19), end: t(9, 28), kind: 'recovery' }

/** The pass in progress at 08:42, shown on the link-margin dial. */
export const currentPass = {
  sat: 'RS-07',
  station: 'SVB-2',
  aos: '08:36',
  los: '08:47',
  elevation: '41.8°',
  range: '812 km',
  bands: {
    x: { label: 'X-band', margin: 6.4, rate: '800 Mbit/s', ebn0: '13.2 dB', required: '6.8 dB' },
    s: { label: 'S-band', margin: 11.8, rate: '2 Mbit/s', ebn0: '18.6 dB', required: '6.8 dB' },
  },
}

/* ── Satellites ─────────────────────────────────────────────────────────────────────── */
export type Health = 'Nominal' | 'Watch' | 'Degraded' | 'Safe mode' | 'Commissioning'

export const HEALTH_TONE: Record<Health, StatusTone> = {
  Nominal: 'success',
  Watch: 'warning',
  Degraded: 'warning',
  'Safe mode': 'danger',
  Commissioning: 'brand',
}

export interface Satellite {
  id: string
  plane: 'A' | 'B' | 'C' | 'D'
  slot: number
  catalog: number
  intl: string
  altitude: number
  battery: number
  batterySeries: number[]
  panelTemp: number
  thermalSeries: number[]
  lastContact: string
  nextPass: string
  health: Health
  note: string
  elements: SpecItem[]
  tle: [string, string, string]
}

const PLANES = [
  { plane: 'A' as const, raan: 128.4471, intl: '25031', catalog: 63211, revs: 9120, launched: 2025.2 },
  { plane: 'B' as const, raan: 158.4206, intl: '25118', catalog: 64102, revs: 7684, launched: 2025.5 },
  { plane: 'C' as const, raan: 188.3912, intl: '26009', catalog: 65530, revs: 4710, launched: 2026.05 },
  { plane: 'D' as const, raan: 218.4385, intl: '26041', catalog: 66118, revs: 3392, launched: 2026.25 },
]

const SPECIAL: Record<string, { health: Health; note: string }> = {
  'RS-03': { health: 'Degraded', note: 'X-band transmitter B only since 4 Nov' },
  'RS-09': { health: 'Watch', note: 'Battery dips to 41% in eclipse, cell 6 reads low' },
  'RS-14': { health: 'Safe mode', note: 'Reaction wheel 3 overspeed at 08:12 UTC' },
  'RS-23': { health: 'Commissioning', note: 'Payload calibration, day 38 of 60' },
  'RS-24': { health: 'Commissioning', note: 'Payload calibration, day 38 of 60' },
}

const MU = 398600.4418
const RE = 6378.137

/** Digits summed, minus signs count 1, modulo 10. */
function checksum(line: string) {
  let sum = 0
  for (const ch of line) {
    if (ch >= '0' && ch <= '9') sum += Number(ch)
    else if (ch === '-') sum += 1
  }
  return sum % 10
}

const fixed = (v: number, width: number, digits: number) => v.toFixed(digits).padStart(width, ' ')

/** 0.00010270 → " 10270-3" (TLE exponent notation, decimal point assumed). */
function tleExp(v: number) {
  if (v === 0) return ' 00000-0'
  const exp = Math.floor(Math.log10(Math.abs(v))) + 1
  const mant = Math.round((Math.abs(v) / 10 ** exp) * 1e5)
  const sign = v < 0 ? '-' : ' '
  return `${sign}${String(mant).padStart(5, '0')}${exp < 0 ? '-' : '+'}${Math.abs(exp)}`
}

function buildTle(sat: { id: string; catalog: number; intl: string; piece: string; inc: number; raan: number; ecc: number; argp: number; ma: number; mm: number; ndot: number; bstar: number; rev: number; elset: number }) {
  const epoch = '26316.29166667'
  const ndot = `${sat.ndot < 0 ? '-' : ' '}${Math.abs(sat.ndot).toFixed(8).slice(1)}`
  const intl = `${sat.intl}${sat.piece}`.padEnd(8, ' ')
  let l1 = `1 ${sat.catalog}U ${intl} ${epoch} ${ndot}  00000-0 ${tleExp(sat.bstar)} 0 ${String(sat.elset).padStart(4, ' ')}`
  l1 += checksum(l1)
  const ecc = Math.round(sat.ecc * 1e7)
    .toString()
    .padStart(7, '0')
  let l2 = `2 ${sat.catalog} ${fixed(sat.inc, 8, 4)} ${fixed(sat.raan, 8, 4)} ${ecc} ${fixed(sat.argp, 8, 4)} ${fixed(sat.ma, 8, 4)} ${sat.mm.toFixed(8).padStart(11, ' ')}${String(sat.rev).padStart(5, ' ')}`
  l2 += checksum(l2)
  return [sat.id, l1, l2] as [string, string, string]
}

/** Battery over the last six orbits: charge in sunlight, discharge in eclipse. */
function batteryTrace(rand: () => number, low: number, offset: number, kink?: 'drop') {
  const out: number[] = []
  let soc = 92
  const n = 114
  for (let i = 0; i < n; i++) {
    const phase = ((i + offset) % 19) / 19
    const sunlit = phase < 0.64
    soc += sunlit ? (100 - soc) * 0.16 : -(100 - low) / 7
    soc = Math.min(99.5, Math.max(low - 2, soc))
    let v = soc + (rand() - 0.5) * 0.8
    if (kink === 'drop' && i > n - 16) v -= (i - (n - 16)) * 1.9
    out.push(Math.round(v * 10) / 10)
  }
  return out
}

/** Solar panel temperature over the same six orbits, in °C. */
function thermalTrace(rand: () => number, hot: number, offset: number) {
  const out: number[] = []
  let temp = 10
  for (let i = 0; i < 114; i++) {
    const phase = ((i + offset) % 19) / 19
    const target = phase < 0.64 ? hot : -26
    temp += (target - temp) * 0.34
    out.push(Math.round((temp + (rand() - 0.5) * 1.2) * 10) / 10)
  }
  return out
}

const contactStations = ['SVB-2', 'INV-1', 'KIR-1', 'KPG-1', 'AWA-1', 'PTA-1', 'TRL-1']

/** Last and next contact from the pass plan; outside the window, about two orbits away. */
function contactsOf(id: string, rand: () => number) {
  const mine = passes.filter((p) => p.sat === id && p.kind !== 'failed')
  const current = mine.find((p) => p.start <= NOW_MIN && p.end > NOW_MIN)
  const done = mine.filter((p) => p.end <= NOW_MIN).sort((a, b) => b.end - a.end)[0]
  const upcoming = mine.filter((p) => p.start > NOW_MIN).sort((a, b) => a.start - b.start)[0]
  const n = Number(id.slice(3))
  const last = current
    ? `${hhmm(NOW_MIN)} · ${current.station}`
    : done
      ? `${hhmm(done.end)} · ${done.station}`
      : `${hhmm(WINDOW[0] - 8 - Math.round(rand() * 40))} · ${contactStations[(n * 3) % 7]}`
  const lastEnd = done?.end ?? NOW_MIN
  const next = current
    ? `In contact · ${current.station}`
    : upcoming
      ? `${hhmm(upcoming.start)} · ${upcoming.station}`
      : id === 'RS-14'
        ? 'None booked'
        : `${hhmm(Math.max(WINDOW[1] + 4, lastEnd + 190) + Math.round(rand() * 30))} · ${contactStations[(n * 5 + 2) % 7]}`
  return { last, next }
}

function buildSatellites(): Satellite[] {
  const rand = mulberry32(2107)
  const list: Satellite[] = []
  PLANES.forEach((p, pi) => {
    for (let s = 0; s < 6; s++) {
      const n = pi * 6 + s + 1
      const id = `RS-${pad(n)}`
      const special = SPECIAL[id]
      const altitude = Math.round((538 + rand() * 8 - (pi === 3 && s >= 4 ? 34 : 0)) * 10) / 10
      const ecc = 0.0008 + rand() * 0.0008
      const a = RE + altitude
      const mm = (Math.sqrt(MU / a ** 3) * 86400) / (2 * Math.PI)
      const inc = 97.48 + rand() * 0.08
      const raan = p.raan + (rand() - 0.5) * 0.02
      const argp = 60 + rand() * 60
      const ma = (s * 60 + 12 + rand() * 4) % 360
      const bstar = 0.8e-4 + rand() * 2.6e-4
      const ndot = 0.000012 + rand() * 0.00002
      const rev = p.revs + Math.round(rand() * 40)
      const catalog = p.catalog + s
      const piece = String.fromCharCode(65 + s)
      const low = id === 'RS-09' ? 41 : id === 'RS-14' ? 66 : 72 + rand() * 10
      // Satellites in a plane are 60° apart, so each one is at its own point of the orbit.
      const offset = (s * 3 + pi * 5) % 19
      const batterySeries = batteryTrace(rand, low, offset, id === 'RS-14' ? 'drop' : undefined)
      const thermalSeries = thermalTrace(rand, 31 + rand() * 7, offset)
      const period = 1440 / mm
      const perigee = a * (1 - ecc) - RE
      const apogee = a * (1 + ecc) - RE
      const contacts = contactsOf(id, rand)
      const health: Health = special?.health ?? 'Nominal'
      list.push({
        id,
        plane: p.plane,
        slot: s + 1,
        catalog,
        intl: `${p.intl}${piece}`,
        altitude,
        battery: batterySeries[batterySeries.length - 1],
        batterySeries,
        panelTemp: thermalSeries[thermalSeries.length - 1],
        thermalSeries,
        lastContact: contacts.last,
        nextPass: contacts.next,
        health,
        note: special?.note ?? 'All subsystems within limits',
        elements: [
          { label: 'Epoch', value: '26316.29166667', mono: true, hint: '12 Nov 2026 07:00:00 UTC' },
          { label: 'Inclination', value: `${inc.toFixed(4)}°`, mono: true },
          { label: 'RAAN', value: `${raan.toFixed(4)}°`, mono: true },
          { label: 'Eccentricity', value: ecc.toFixed(7), mono: true },
          { label: 'Arg. of perigee', value: `${argp.toFixed(4)}°`, mono: true },
          { label: 'Mean anomaly', value: `${ma.toFixed(4)}°`, mono: true },
          { label: 'Mean motion', value: `${mm.toFixed(8)} rev/d`, mono: true },
          { label: 'Period', value: `${period.toFixed(2)} min`, mono: true },
          { label: 'Semi-major axis', value: `${a.toLocaleString('en-US', { maximumFractionDigits: 1, minimumFractionDigits: 1 })} km`, mono: true },
          { label: 'Perigee × apogee', value: `${perigee.toFixed(1)} × ${apogee.toFixed(1)} km`, mono: true },
          { label: 'B* drag', value: `${(bstar * 1e4).toFixed(4)} × 10⁻⁴`, mono: true },
          { label: 'Revolution', value: rev.toLocaleString('en-US'), mono: true },
        ],
        tle: buildTle({ id, catalog, intl: p.intl, piece, inc, raan, ecc, argp, ma, mm, ndot, bstar, rev, elset: 990 + (n % 9) }),
      })
    }
  })
  return list
}

export const satellites = buildSatellites()

export const planeOptions = [
  { label: 'All', value: 'all' },
  { label: 'Plane A', value: 'A' },
  { label: 'Plane B', value: 'B' },
  { label: 'Plane C', value: 'C' },
  { label: 'Plane D', value: 'D' },
]

export const kpis = {
  passesDone: passes.filter((p) => p.end <= NOW_MIN && p.kind !== 'maintenance').length + 54,
  passesTotal: 142,
  downlinkedTb: 1.84,
  downlinkTrend: 6.2,
}
