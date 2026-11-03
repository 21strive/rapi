/**
 * Sample 10 · Air picture. Everything here is invented: the Sector 3 Control and Reporting
 * Centre, its radar sites, the crew, the call signs and the tracks. Positions are measured from
 * the CRC: bearing in degrees true, range in nautical miles. The screen runs on the real clock,
 * so log times are stored as "seconds before the page opened".
 */
import type { StatusTone } from '@/design-system'

export type TrackKind = 'friendly' | 'hostile' | 'unknown' | 'neutral'

/**
 * How a track moves: `orbit` circles at a fixed turn rate, `cruise` flies straight, `probe`
 * steers at the CRC, `withdraw` heads outbound, `intercept` / `shadow` / `return` are the
 * fighter's legs once it is assigned.
 */
export type TrackMode = 'orbit' | 'cruise' | 'probe' | 'withdraw' | 'intercept' | 'shadow' | 'return'

export interface TrackSeed {
  id: string
  callsign: string | null
  kind: TrackKind
  /** What the track is, in a few words. */
  type: string
  /** Straight-line tracks: where they start and where they point. */
  at?: { bearing: number; range: number; heading: number }
  /** Orbiting tracks: the orbit centre, where on the circle they start, the turn rate in °/s. */
  orbit?: { bearing: number; range: number; phase: number; turnRate: number }
  /** Ground speed in knots. */
  speed: number
  /** Feet. */
  altitude: number
  /** Feet per minute, negative when descending. */
  vrate: number
  mode: TrackMode
  /** The sensor holding the track. */
  source: string
  iff: string
  /** Seconds between plots, and where in that cycle the track starts. */
  period: number
  offset: number
}

export const trackSeeds: TrackSeed[] = [
  {
    id: 'T-104',
    callsign: 'TALON 21',
    kind: 'friendly',
    type: 'Interceptor, CAP South',
    orbit: { bearing: 168, range: 32, phase: 20, turnRate: 1.2 },
    speed: 420,
    altitude: 24000,
    vrate: 0,
    mode: 'orbit',
    source: 'LINK 3',
    iff: 'Mode 5 valid',
    period: 4,
    offset: 1,
  },
  {
    id: 'T-105',
    callsign: 'TALON 22',
    kind: 'friendly',
    type: 'Interceptor, CAP South',
    orbit: { bearing: 168, range: 32, phase: 200, turnRate: 1.2 },
    speed: 420,
    altitude: 26000,
    vrate: 0,
    mode: 'orbit',
    source: 'LINK 3',
    iff: 'Mode 5 valid',
    period: 4,
    offset: 3,
  },
  {
    id: 'T-110',
    callsign: 'HERON 07',
    kind: 'friendly',
    type: 'Airborne early warning',
    orbit: { bearing: 304, range: 66, phase: 120, turnRate: 0.45 },
    speed: 310,
    altitude: 30000,
    vrate: 0,
    mode: 'orbit',
    source: 'LINK 3',
    iff: 'Mode 5 valid',
    period: 4,
    offset: 2,
  },
  {
    id: 'T-112',
    callsign: 'KITE 31',
    kind: 'friendly',
    type: 'Tanker, track Kilo',
    orbit: { bearing: 334, range: 80, phase: 250, turnRate: 0.5 },
    speed: 290,
    altitude: 22000,
    vrate: 0,
    mode: 'orbit',
    source: 'LINK 3',
    iff: 'Mode 5 valid',
    period: 4,
    offset: 0,
  },
  {
    id: 'T-117',
    callsign: null,
    kind: 'unknown',
    type: 'Unknown, no flight plan',
    at: { bearing: 92, range: 71, heading: 279 },
    speed: 380,
    altitude: 18000,
    vrate: 0,
    mode: 'cruise',
    source: 'RS-2',
    iff: 'No reply',
    period: 12,
    offset: 5,
  },
  {
    id: 'T-122',
    callsign: 'CIV 4471',
    kind: 'neutral',
    type: 'Civil airliner, airway W12',
    at: { bearing: 148, range: 58, heading: 331 },
    speed: 452,
    altitude: 35000,
    vrate: 0,
    mode: 'cruise',
    source: 'RS-2',
    iff: 'Mode 3/A 4471',
    period: 12,
    offset: 9,
  },
  {
    id: 'T-126',
    callsign: 'CIV 2210',
    kind: 'neutral',
    type: 'Civil airliner, airway R4',
    at: { bearing: 251, range: 92, heading: 68 },
    speed: 468,
    altitude: 37000,
    vrate: 0,
    mode: 'cruise',
    source: 'RS-1',
    iff: 'Mode 3/A 2210',
    period: 10,
    offset: 7,
  },
  {
    id: 'T-131',
    callsign: null,
    kind: 'hostile',
    type: 'Fast jet, single ship',
    at: { bearing: 212, range: 46, heading: 31 },
    speed: 480,
    altitude: 12400,
    vrate: -1200,
    mode: 'probe',
    source: 'RS-2',
    iff: 'No reply to 3 challenges',
    period: 12,
    offset: 0,
  },
  {
    id: 'T-139',
    callsign: null,
    kind: 'unknown',
    type: 'Low and slow, possibly rotary',
    at: { bearing: 250, range: 27, heading: 75 },
    speed: 140,
    altitude: 4500,
    vrate: 0,
    mode: 'cruise',
    source: 'RS-3',
    iff: 'No reply',
    period: 12,
    offset: 4,
  },
  {
    id: 'T-142',
    callsign: null,
    kind: 'unknown',
    type: 'Unknown, squawking 2000',
    at: { bearing: 322, range: 64, heading: 152 },
    speed: 210,
    altitude: 8000,
    vrate: 0,
    mode: 'cruise',
    source: 'RS-1',
    iff: 'Mode 3/A 2000',
    period: 10,
    offset: 8,
  },
]

/** The ring an air-defence alert is raised for. */
export const ALERT_RING_NM = 50

export const KIND_LABEL: Record<TrackKind, string> = {
  friendly: 'Friendly',
  hostile: 'Hostile',
  unknown: 'Unknown',
  neutral: 'Neutral',
}

/** Badge tones: the same meaning the scope gives each kind, always with the word. */
export const KIND_TONE: Record<TrackKind, 'brand' | 'signal' | 'warning' | 'neutral'> = {
  friendly: 'brand',
  hostile: 'signal',
  unknown: 'warning',
  neutral: 'neutral',
}

/** Threat order for sorting by kind: hostile first. */
export const KIND_RANK: Record<TrackKind, number> = { hostile: 0, unknown: 1, neutral: 2, friendly: 3 }

export type SensorStatus = 'nominal' | 'degraded' | 'offline'

export interface SensorSite {
  code: string
  name: string
  role: string
  status: SensorStatus
  /** Signal quality, 0–100. */
  quality: number
  /** Antenna rotation in seconds; null when the site is down. */
  rotation: number | null
  /** Probability of detection on the reference target. */
  pd: number | null
  /** Plots per minute into the picture. */
  plots: number
  /** Hours from now until the site is back, for offline sites. */
  backInHours?: number
  note?: string
}

export const sensorSites: SensorSite[] = [
  { code: 'RS-1', name: 'Karang', role: 'Long-range surveillance', status: 'nominal', quality: 92, rotation: 10, pd: 0.94, plots: 412 },
  { code: 'RS-2', name: 'Tanjung Batu', role: 'Long-range surveillance', status: 'nominal', quality: 86, rotation: 12, pd: 0.91, plots: 388 },
  {
    code: 'RS-3',
    name: 'Pasir Putih',
    role: 'Coastal gap filler',
    status: 'degraded',
    quality: 54,
    rotation: 12,
    pd: 0.71,
    plots: 164,
    note: 'Sea clutter, sea state 5',
  },
  {
    code: 'RS-4',
    name: 'Bukit Angin',
    role: 'Long-range surveillance',
    status: 'offline',
    quality: 0,
    rotation: null,
    pd: null,
    plots: 0,
    backInHours: 3.5,
    note: 'Planned maintenance',
  },
  { code: 'AEW', name: 'HERON 07', role: 'Airborne, orbit north-west', status: 'nominal', quality: 81, rotation: 10, pd: 0.89, plots: 296 },
]

export const SENSOR_STATUS: Record<SensorStatus, { word: string; tone: 'success' | 'warning' | 'danger' }> = {
  nominal: { word: 'Nominal', tone: 'success' },
  degraded: { word: 'Degraded', tone: 'warning' },
  offline: { word: 'Offline', tone: 'danger' },
}

export interface LogEntry {
  id: number
  /** Epoch milliseconds. */
  at: number
  title: string
  body?: string
  meta?: string
  tone?: StatusTone
}

/** The watch so far, newest first. `ago` is seconds before the page opened. */
export const logSeeds: (Omit<LogEntry, 'id' | 'at'> & { ago: number })[] = [
  {
    ago: 30,
    title: 'T-131 entered the 50 NM ring',
    body: 'Bearing 212, closing at 480 kn, descending through FL130.',
    meta: 'RS-2',
    tone: 'signal',
  },
  {
    ago: 125,
    title: 'T-131 classified hostile',
    body: 'No reply to three IFF challenges. Speed and profile match last week’s probe.',
    meta: 'TIO H. Siregar',
    tone: 'warning',
  },
  {
    ago: 270,
    title: 'T-117 held as unknown',
    body: 'Inbound from the east at FL180 without a flight plan. Identification request sent to the civil centre.',
    meta: 'TIO H. Siregar',
  },
  { ago: 552, title: 'TALON 21 and 22 on station at CAP South', meta: 'WD R. Dewi', tone: 'success' },
  { ago: 1004, title: 'KITE 31 on tanker track Kilo, FL220', meta: 'WD J. Okoro', tone: 'brand' },
  {
    ago: 1445,
    title: 'HERON 07 on station, data link up',
    body: 'Low-level coverage to the north-west extended to 240 NM.',
    meta: 'SO M. Tan',
    tone: 'success',
  },
  {
    ago: 2490,
    title: 'RS-4 Bukit Angin offline for maintenance',
    body: 'South-east coverage falls back to RS-2 and HERON 07.',
    meta: 'SO M. Tan',
    tone: 'warning',
  },
  { ago: 3480, title: 'Crew B on watch', body: 'Handover complete, readiness state 2.', meta: 'MCC A. Prasetyo' },
]

/** The weapons director who assigns fighters on this watch. */
export const WEAPONS_DIRECTOR = 'WD R. Dewi'

/* ── Formatting ─────────────────────────────────────────────────────────────────── */

const pad = (n: number, width = 2) => String(Math.floor(Math.abs(n))).padStart(width, '0')

/** 212.4 → "212" (three digits, 0–359). */
export const bearingText = (deg: number) => pad(((Math.round(deg) % 360) + 360) % 360, 3)

/** 12400 → "FL124". */
export const flightLevel = (feet: number) => `FL${pad(Math.round(feet / 100), 3)}`

/** Epoch ms → "05:31:07Z". */
export function zulu(ms: number) {
  const d = new Date(ms)
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}Z`
}

/** Epoch ms → "05:31Z". */
export function zuluShort(ms: number) {
  const d = new Date(ms)
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}Z`
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** Epoch ms → "03 Nov 2026" (UTC). */
export function zuluDate(ms: number) {
  const d = new Date(ms)
  return `${pad(d.getUTCDate())} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

/** Seconds → "05:52"; past an hour → "1:05:52". */
export function clockText(seconds: number) {
  const s = Math.max(0, Math.round(seconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  return h ? `${h}:${pad(m)}:${pad(s % 60)}` : `${pad(m)}:${pad(s % 60)}`
}
