/**
 * Launch telemetry · Strive-1, flight 21S-07 (rideshare to sun-synchronous orbit).
 * Liftoff 12 Nov 2026 07:10:00 UTC from LC-2, Sumba. Stage 1 returns to LZ-2.
 * Every figure on the screen comes from these profiles, so the readouts, the trajectory,
 * the event list and the phase chart agree at any second.
 */
import type { SpecItem, StatusTone, TimelineItem } from '@/design-system'

export const LIFTOFF_UTC = Date.UTC(2026, 10, 12, 7, 10, 0)
/** Seconds after liftoff when the screen opens: T+00:03:30, eight seconds before boostback cutoff. */
export const START_T = 210
/** The plots run from T+00:00 to T+10:00. */
export const WINDOW = 600
export const SAMPLE_STEP = 15

const pad = (n: number, w = 2) => String(Math.floor(n)).padStart(w, '0')

/** 200 → "T+00:03:20" */
export function missionClock(t: number) {
  const s = Math.max(0, Math.floor(t))
  return `T+${pad(s / 3600)}:${pad((s % 3600) / 60)}:${pad(s % 60)}`
}

/** 200 → "03:20" */
export function mmss(t: number) {
  const s = Math.max(0, Math.round(t))
  return `${pad(s / 60)}:${pad(s % 60)}`
}

/** UTC wall clock for a mission time: 200 → "07:13:20" */
export function utcAt(t: number) {
  const d = new Date(LIFTOFF_UTC + Math.floor(t) * 1000)
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`
}

/* ── Profiles · [t s, altitude km, velocity m/s, downrange km, acceleration g] ──────────── */
type Key = [number, number, number, number, number]

const ascent: Key[] = [
  [0, 0, 0, 0, 1.25],
  [10, 0.2, 40, 0, 1.3],
  [20, 0.8, 90, 0.05, 1.35],
  [30, 1.9, 160, 0.2, 1.4],
  [40, 3.4, 240, 0.6, 1.5],
  [50, 5.4, 330, 1.3, 1.55],
  [60, 8.0, 430, 2.4, 1.6],
  [72, 11.9, 560, 4.3, 1.45],
  [80, 14.9, 650, 5.9, 1.5],
  [90, 19.2, 780, 8.4, 1.8],
  [100, 24.0, 920, 11.6, 2.05],
  [110, 29.4, 1080, 15.6, 2.3],
  [120, 35.4, 1260, 20.6, 2.6],
  [130, 42.0, 1460, 26.8, 2.9],
  [140, 49.3, 1700, 34.4, 3.3],
  [148, 55.6, 1912, 41.6, 3.6],
  [151, 57.9, 1905, 44.3, 0],
]

const stage1: Key[] = [
  ...ascent,
  [160, 64.6, 1860, 52.3, 0],
  [170, 71.0, 1815, 60.2, 0],
  [180, 76.3, 1560, 67.0, 2.6],
  [190, 80.9, 1280, 72.4, 2.7],
  [200, 84.7, 1010, 76.3, 2.7],
  [210, 87.8, 820, 78.8, 2.8],
  [218, 89.8, 760, 79.9, 0],
  [230, 96.9, 640, 75.6, 0],
  [245, 103.8, 500, 70.2, 0],
  [260, 108.5, 400, 64.8, 0],
  [284, 111.4, 360, 56.2, 0],
  [300, 110.1, 400, 50.4, 0],
  [320, 105.0, 500, 43.2, 0],
  [340, 96.0, 640, 36.0, 0],
  [360, 83.2, 800, 28.8, 0],
  [375, 71.0, 920, 23.4, 0],
  [386, 61.4, 1060, 19.4, 0],
  [396, 54.2, 820, 16.6, 2.5],
  [408, 47.4, 580, 14.2, 2.4],
  [420, 41.0, 610, 12.6, 0.6],
  [440, 30.6, 520, 11.0, 1.3],
  [455, 21.4, 430, 10.2, 1.6],
  [466, 13.6, 360, 9.7, 1.4],
  [470, 10.6, 270, 9.5, 3.0],
  [474, 6.8, 180, 9.3, 3.2],
  [477, 3.4, 95, 9.2, 3.3],
  [480, 0.9, 30, 9.15, 2.2],
  [482, 0, 0, 9.1, 1.0],
  [600, 0, 0, 9.1, 1.0],
]

const stage2: Key[] = [
  ...ascent,
  [159, 63.7, 1890, 51.4, 0],
  [160, 64.4, 1898, 52.3, 0.85],
  [170, 71.2, 1985, 61.5, 0.88],
  [180, 77.6, 2075, 71.0, 0.9],
  [195, 86.4, 2215, 86.0, 0.93],
  [200, 89.2, 2265, 91.4, 0.98],
  [220, 100.8, 2470, 114.6, 1.03],
  [240, 111.6, 2685, 139.8, 1.09],
  [270, 126.4, 3030, 181.2, 1.18],
  [300, 139.4, 3405, 228.0, 1.29],
  [330, 150.6, 3815, 280.6, 1.41],
  [360, 160.0, 4265, 339.8, 1.55],
  [390, 167.8, 4760, 406.4, 1.72],
  [420, 174.0, 5310, 481.6, 1.93],
  [450, 178.8, 5925, 566.4, 2.2],
  [480, 182.4, 6620, 662.0, 2.55],
  [500, 184.2, 7130, 733.4, 2.9],
  [515, 185.3, 7560, 790.2, 3.35],
  [524, 185.8, 7835, 826.0, 3.6],
  [525, 185.9, 7835, 833.8, 0],
  [540, 186.6, 7832, 951.2, 0],
  [570, 188.6, 7826, 1185.9, 0],
  [600, 191.4, 7819, 1420.4, 0],
]

export interface StageState {
  altitude: number
  velocity: number
  downrange: number
  acceleration: number
}

function sample(keys: Key[], t: number): StageState {
  const time = Math.min(Math.max(t, 0), WINDOW)
  let i = 1
  while (i < keys.length - 1 && keys[i][0] < time) i++
  const a = keys[i - 1]
  const b = keys[i]
  const k = b[0] === a[0] ? 0 : Math.min(1, Math.max(0, (time - a[0]) / (b[0] - a[0])))
  const lerp = (n: number) => a[n] + (b[n] - a[n]) * k
  return { altitude: lerp(1), velocity: lerp(2), downrange: lerp(3), acceleration: lerp(4) }
}

export const stage1At = (t: number) => sample(stage1, t)
export const stage2At = (t: number) => sample(stage2, t)

/** Sample times for the trajectory plot: T+00:00 … T+10:00 every 15 s. */
export const sampleTimes = Array.from({ length: WINDOW / SAMPLE_STEP + 1 }, (_, i) => i * SAMPLE_STEP)
export const sampleLabels = sampleTimes.map((t) => `T+${mmss(t)}`)

export type Quantity = 'altitude' | 'velocity' | 'acceleration'

export const quantities: Record<
  Quantity,
  { label: string; title: string; unit: string; decimals: number; reference?: { value: number; label: string; kind: 'target' | 'threshold' | 'average' } }
> = {
  altitude: { label: 'Altitude', title: 'Altitude against time', unit: 'km', decimals: 1, reference: { value: 100, label: 'Kármán line 100 km', kind: 'average' } },
  velocity: { label: 'Velocity', title: 'Velocity against time', unit: 'm/s', decimals: 0, reference: { value: 7800, label: 'Orbital 7,800 m/s', kind: 'average' } },
  acceleration: { label: 'Acceleration', title: 'Acceleration against time', unit: 'g', decimals: 2, reference: { value: 6, label: 'Payload limit 6.0 g', kind: 'threshold' } },
}

/* ── Flight events ──────────────────────────────────────────────────────────────────── */
export interface FlightEvent {
  id: string
  /** Start, seconds after liftoff. */
  t: number
  /** End of a burn or phase. Instant events have none. */
  end?: number
  title: string
  body: string
}

export const events: FlightEvent[] = [
  { id: 'liftoff', t: 0, title: 'LIFTOFF', body: 'Nine SE-1 at 100%, tower clear at T+00:00:07' },
  { id: 'maxq', t: 72, title: 'MAX-Q', body: '34.6 kPa at 11.9 km, throttle at 74%' },
  { id: 'meco', t: 148, title: 'MECO', body: 'Cutoff at 55.6 km and 1,912 m/s' },
  { id: 'sep', t: 151, title: 'STAGE SEP', body: 'Pneumatic pushers, both loops confirmed' },
  { id: 'ses1', t: 159, end: 524, title: 'SES-1', body: 'SE-1V at 100%, 365 s burn planned' },
  { id: 'boostback', t: 170, end: 218, title: 'BOOSTBACK', body: 'Three engines for 48 s, target LZ-2' },
  { id: 'fairing', t: 195, title: 'FAIRING SEP', body: 'Both halves clear, recovery by MV Lintang' },
  { id: 'entry', t: 386, end: 408, title: 'ENTRY BURN', body: 'Three engines for 22 s from 61 km' },
  { id: 'landing', t: 466, end: 482, title: 'LANDING', body: 'Single engine at LZ-2, 9.1 km downrange' },
  { id: 'seco1', t: 524, title: 'SECO-1', body: 'Transfer orbit 186 × 538 km at 97.5°' },
]

export type Phase = 'done' | 'current' | 'upcoming'

export function phaseOf(start: number, end: number | undefined, t: number): Phase {
  if (end == null) return t >= start ? 'done' : 'upcoming'
  if (t >= end) return 'done'
  return t >= start ? 'current' : 'upcoming'
}

const EVENT_TONE: Record<Phase, StatusTone> = { done: 'success', current: 'brand', upcoming: 'neutral' }

export function timelineAt(t: number): TimelineItem[] {
  return events.map((e) => {
    const phase = phaseOf(e.t, e.end, t)
    const meta = phase === 'done' ? 'Confirmed' : phase === 'current' ? 'In progress' : `In ${mmss(e.t - t)}`
    return { id: e.id, time: missionClock(e.t), title: e.title, body: e.body, meta: meta.toUpperCase(), tone: EVENT_TONE[phase] }
  })
}

export function nextEvent(t: number) {
  return events.find((e) => e.t > t) ?? null
}

/* ── Sequence phases for the Gantt ──────────────────────────────────────────────────── */
interface PhaseItem {
  start: number
  end: number
  label: string
  milestone?: boolean
}

export const phaseRows: { id: string; label: string; meta: string; items: PhaseItem[] }[] = [
  {
    id: 's1',
    label: 'Stage 1',
    meta: 'B1021 · 4th flight',
    items: [
      { start: 0, end: 148, label: 'Ascent' },
      { start: 170, end: 218, label: 'Boostback' },
      { start: 386, end: 408, label: 'Entry' },
      { start: 466, end: 482, label: 'Landing' },
    ],
  },
  {
    id: 's2',
    label: 'Stage 2',
    meta: 'SE-1V vacuum',
    items: [
      { start: 159, end: 524, label: 'SES-1 burn' },
      { start: 524, end: 524, label: 'SECO-1', milestone: true },
    ],
  },
  {
    id: 'fairing',
    label: 'Fairing',
    meta: 'Halves A and B',
    items: [
      { start: 195, end: 195, label: 'Sep', milestone: true },
      { start: 240, end: 600, label: 'Ballistic coast' },
    ],
  },
  {
    id: 'link',
    label: 'Ground link',
    meta: 'S-band 2.2 GHz',
    items: [
      { start: 0, end: 310, label: 'Sumba TT&C' },
      { start: 310, end: 540, label: 'Kupang TT&C' },
      { start: 540, end: 600, label: 'Relay' },
    ],
  },
]

export const phaseTicks = [0, 60, 120, 180, 240, 300, 360, 420, 480, 540, 600]

/* ── Subsystems ─────────────────────────────────────────────────────────────────────── */
export interface Subsystem {
  id: string
  name: string
  status: string
  tone: StatusTone
  detail: string
  owner: string
  channels: SpecItem[]
  log: TimelineItem[]
}

export const subsystems: Subsystem[] = [
  {
    id: 'avionics',
    name: 'Avionics',
    status: 'Nominal',
    tone: 'success',
    detail: '3 of 3 flight computers',
    owner: 'AVI · Rina Wulandari',
    channels: [
      { label: 'Flight computer A', value: 'In command', mono: true, tone: 'success' },
      { label: 'Flight computer B', value: 'Voting', mono: true, tone: 'success' },
      { label: 'Flight computer C', value: 'Voting', mono: true, tone: 'success' },
      { label: 'Frame overruns', value: '0', mono: true },
      { label: 'Bus load', value: '61 %', mono: true },
    ],
    log: [{ time: 'T+00:02:31', title: 'Stage 1 and 2 computers split', body: 'Both stacks report independent control', tone: 'neutral' }],
  },
  {
    id: 'propulsion',
    name: 'Propulsion',
    status: 'Nominal',
    tone: 'success',
    detail: 'SE-1V Pc 96.8 bar',
    owner: 'PROP · Daniel Hutapea',
    channels: [
      { label: 'SE-1V chamber pressure', value: '96.8 bar', mono: true, tone: 'success', hint: 'Limits 88.0 to 104.0' },
      { label: 'LOX tank ullage', value: '3.42 bar', mono: true },
      { label: 'RP-1 tank ullage', value: '2.81 bar', mono: true },
      { label: 'Mixture ratio', value: '2.36', mono: true },
      { label: 'Stage 1 engines lit', value: '3 of 9', mono: true, hint: 'Boostback' },
    ],
    log: [{ time: 'T+00:02:39', title: 'SES-1 confirmed', body: 'Chamber pressure above 90 bar in 1.8 s', tone: 'success' }],
  },
  {
    id: 'gnc',
    name: 'GNC',
    status: 'Nominal',
    tone: 'success',
    detail: 'IMU A and B agree to 0.02°',
    owner: 'GNC · Kevin Tanoto',
    channels: [
      { label: 'Attitude error', value: '0.04°', mono: true },
      { label: 'IMU disagreement', value: '0.02°', mono: true },
      { label: 'GPS satellites', value: '11', mono: true },
      { label: 'Target LZ-2 miss', value: '14 m', mono: true, hint: 'Predicted at touchdown' },
    ],
    log: [{ time: 'T+00:02:50', title: 'Boostback steering on', body: 'Target LZ-2 locked', tone: 'neutral' }],
  },
  {
    id: 'comms',
    name: 'Comms',
    status: 'Nominal',
    tone: 'success',
    detail: 'Sumba TT&C, Eb/N0 11.4 dB',
    owner: 'COMM · Ayu Lestari',
    channels: [
      { label: 'Station', value: 'Sumba TT&C', mono: true, tone: 'success' },
      { label: 'Eb/N0', value: '11.4 dB', mono: true },
      { label: 'Next handover', value: 'Kupang at T+00:05:10', mono: true },
      { label: 'Frame loss', value: '0.02 %', mono: true },
    ],
    log: [{ time: 'T+00:00:00', title: 'Downlink locked', body: 'Both stages on S-band', tone: 'neutral' }],
  },
  {
    id: 'power',
    name: 'Power',
    status: 'Nominal',
    tone: 'success',
    detail: 'Bus 28.4 V, 41 A',
    owner: 'PWR · Bayu Saputra',
    channels: [
      { label: 'Bus A', value: '28.4 V', mono: true },
      { label: 'Bus B', value: '28.2 V', mono: true },
      { label: 'Load current', value: '41.2 A', mono: true },
      { label: 'Battery S2', value: '96 %', mono: true },
    ],
    log: [{ time: 'T−00:01:00', title: 'Internal power', body: 'Umbilical power off', tone: 'neutral' }],
  },
  {
    id: 'range',
    name: 'Range safety',
    status: 'Armed',
    tone: 'brand',
    detail: 'FTS armed, 2 of 2 receivers',
    owner: 'RSO · Maria Gonzaga',
    channels: [
      { label: 'Receiver A', value: 'Locked', mono: true, tone: 'success' },
      { label: 'Receiver B', value: 'Locked', mono: true, tone: 'success' },
      { label: 'Impact point', value: 'Inside corridor', mono: true },
      { label: 'Destruct line margin', value: '42.6 km', mono: true },
    ],
    log: [{ time: 'T−00:00:30', title: 'FTS armed', body: 'Range safety officer go', tone: 'brand' }],
  },
  {
    id: 'thermal',
    name: 'Thermal',
    status: 'Watch',
    tone: 'warning',
    detail: 'S2 engine bay 412 K',
    owner: 'THRM · Wahyu Nugroho',
    channels: [
      { label: 'S2 engine bay', value: '412 K', mono: true, tone: 'warning', hint: 'Watch 400 K · limit 450 K' },
      { label: 'S2 LOX tank wall', value: '93 K', mono: true },
      { label: 'Avionics bay', value: '301 K', mono: true },
      { label: 'Payload adapter', value: '288 K', mono: true },
    ],
    log: [
      { time: 'T+00:03:02', title: 'Engine bay above watch level', body: '400 K crossed, rising 0.6 K/s', tone: 'warning' },
      { time: 'T+00:02:39', title: 'SES-1', body: 'Engine bay at 318 K', tone: 'neutral' },
    ],
  },
  {
    id: 'tvc',
    name: 'TVC',
    status: 'Nominal',
    tone: 'success',
    detail: 'Gimbal 0.8° of 4.0°',
    owner: 'PROP · Daniel Hutapea',
    channels: [
      { label: 'S2 pitch gimbal', value: '0.8°', mono: true },
      { label: 'S2 yaw gimbal', value: '−0.3°', mono: true },
      { label: 'Hydraulic pressure', value: '206 bar', mono: true },
    ],
    log: [],
  },
  {
    id: 'rcs',
    name: 'RCS',
    status: 'Nominal',
    tone: 'success',
    detail: 'N2 at 241 bar',
    owner: 'GNC · Kevin Tanoto',
    channels: [
      { label: 'S1 nitrogen', value: '241 bar', mono: true },
      { label: 'S2 nitrogen', value: '288 bar', mono: true },
      { label: 'Thruster firings', value: '1,412', mono: true },
    ],
    log: [],
  },
  {
    id: 'telemetry',
    name: 'Telemetry',
    status: 'Nominal',
    tone: 'success',
    detail: '2 Mbit/s, 2 streams',
    owner: 'COMM · Ayu Lestari',
    channels: [
      { label: 'Stage 1 stream', value: '1.0 Mbit/s', mono: true },
      { label: 'Stage 2 stream', value: '1.0 Mbit/s', mono: true },
      { label: 'Recorder', value: '3.1 GB', mono: true },
    ],
    log: [],
  },
  {
    id: 'recovery',
    name: 'Recovery',
    status: 'Go',
    tone: 'success',
    detail: 'LZ-2 clear, wind 4 m/s',
    owner: 'REC · Yosef Manuhutu',
    channels: [
      { label: 'LZ-2', value: 'Clear', mono: true, tone: 'success' },
      { label: 'Surface wind', value: '4 m/s from 110°', mono: true },
      { label: 'MV Lintang', value: 'On station', mono: true, hint: 'Fairing recovery, 612 km downrange' },
    ],
    log: [],
  },
  {
    id: 'payload',
    name: 'Payload',
    status: 'Nominal',
    tone: 'success',
    detail: '14 of 14 satellites',
    owner: 'PAY · Lim Wei Jie',
    channels: [
      { label: 'Satellites powered', value: '14 of 14', mono: true, tone: 'success' },
      { label: 'Dispenser', value: 'Safed', mono: true },
      { label: 'First deploy', value: 'T+00:54:30', mono: true },
    ],
    log: [],
  },
]
