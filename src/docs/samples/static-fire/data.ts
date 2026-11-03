/**
 * Engine test stand TS-3, Waingapu. SE-1 engine serial 0412, test 0412-03: a full-duration
 * mainstage of 180 s with a throttle step to 90% between T+100 and T+130 s.
 * Times are seconds from T-0 (main valves open). One model feeds every trace, dial, limit and
 * log line, so an abort shows up everywhere at once.
 */
import type { StatusTone } from '@/design-system'

export const TEST_ID = '0412-03'
export const START_T = 42
export const CUTOFF = 180
export const SHUTDOWN_END = 183
/** Plot window, sampled every 4 s: T−20 … T+200. */
export const PLOT_FROM = -20
export const PLOT_TO = 200
export const PLOT_STEP = 4
export const plotTimes = Array.from({ length: (PLOT_TO - PLOT_FROM) / PLOT_STEP + 1 }, (_, i) => PLOT_FROM + i * PLOT_STEP)
export const plotLabels = plotTimes.map((t) => `T${t < 0 ? '−' : '+'}${Math.abs(t)}`)

const pad = (n: number, w = 2) => String(Math.floor(n)).padStart(w, '0')

/** −10 → "T−00:10", 42 → "T+00:42" */
export function testClock(t: number) {
  const s = Math.abs(Math.trunc(t))
  return `T${t < 0 ? '−' : '+'}${pad(s / 60)}:${pad(s % 60)}`
}

export function mmss(s: number) {
  const v = Math.max(0, Math.ceil(s))
  return `${pad(v / 60)}:${pad(v % 60)}`
}

/** Log stamp: 1.84 → "T+001.840" */
export function stamp(t: number) {
  const sign = t < 0 ? '−' : '+'
  const v = Math.abs(t)
  return `T${sign}${v.toFixed(3).padStart(7, '0')}`
}

/* ── The engine model ───────────────────────────────────────────────────────────────── */
const PC_RATED = 97.2
const K_THRUST = 8.71 // kN per bar
const K_RPM = 333.6 // RPM per bar

/** Throttle setting at t, as a share of rated chamber pressure. */
function throttle(t: number) {
  if (t >= 100 && t < 130) return 0.9
  return 1
}

/** Chamber pressure as planned, in bar. */
export function plannedPc(t: number) {
  if (t < 0 || t >= CUTOFF + 2) return 0
  if (t < 0.4) return 6 * (t / 0.4)
  if (t < 1.8) return 6 + (101.4 - 6) * ((t - 0.4) / 1.4)
  if (t < 3) return 101.4 + (PC_RATED - 101.4) * ((t - 1.8) / 1.2)
  if (t >= CUTOFF) return PC_RATED * Math.exp(-(t - CUTOFF) / 0.25)
  // Throttle steps ramp over two seconds.
  const target = PC_RATED * throttle(t)
  const prev = PC_RATED * throttle(t - 2)
  const edge = [100, 130].find((e) => t >= e && t < e + 2)
  if (edge != null) return prev + (target - prev) * ((t - edge) / 2)
  return target
}

/** Small, repeatable sensor noise. */
function noise(t: number, seed: number) {
  const x = Math.sin(t * 12.9898 + seed * 78.233) * 43758.5453
  return x - Math.floor(x) - 0.5
}

export interface Reading {
  pcA: number
  pcB: number
  thrust: number
  rpm: number
  turbineTemp: number
  loxInlet: number
  fuelInlet: number
  vibration: number
  mixture: number
}

/** What the sensors read at t. After an abort at `abortAt`, pressure decays in about 0.6 s. */
export function reading(t: number, abortAt: number | null = null): Reading {
  let pc = plannedPc(t)
  if (abortAt != null && t > abortAt) pc = plannedPc(abortAt) * Math.exp(-(t - abortAt) / 0.2)
  const running = pc > 1
  const pcA = Math.max(0, pc + (running ? noise(t, 1) * 0.6 : 0))
  const pcB = Math.max(0, pc + (running ? noise(t, 2) * 0.6 - 0.3 : 0))
  return {
    pcA,
    pcB,
    thrust: Math.max(0, pc * K_THRUST + (running ? noise(t, 3) * 3 : 0)),
    rpm: Math.max(0, pc * K_RPM + (running ? noise(t, 4) * 60 : 0)),
    turbineTemp: 291 + (pc / PC_RATED) * 630 + (running ? noise(t, 5) * 4 : 0),
    loxInlet: running ? 4.12 + noise(t, 6) * 0.06 : 4.8,
    fuelInlet: running ? 3.18 + noise(t, 7) * 0.05 : 3.6,
    vibration: running ? 18.6 + noise(t, 8) * 2.2 : 0.4,
    mixture: running ? 2.36 + noise(t, 9) * 0.02 : 0,
  }
}

/** The previous test, 0412-02: 150 s at rated thrust, no throttle step. */
export function previousThrust(t: number) {
  if (t < 0 || t > 151) return 0
  if (t < 2) return (t / 2) * PC_RATED * K_THRUST
  if (t >= 150) return PC_RATED * K_THRUST * Math.exp(-(t - 150) / 0.25)
  return PC_RATED * K_THRUST * 0.995 + noise(t, 11) * 3
}

/* ── Limits ─────────────────────────────────────────────────────────────────────────── */
export interface AbortLimit {
  id: keyof Reading
  label: string
  min?: number
  max?: number
  unit: string
  decimals: number
  /** Limits that only apply in mainstage. */
  mainstageOnly?: boolean
}

export const limits: AbortLimit[] = [
  { id: 'pcA', label: 'Chamber pressure', min: 80, max: 108, unit: 'bar', decimals: 1, mainstageOnly: true },
  { id: 'thrust', label: 'Thrust', min: 700, unit: 'kN', decimals: 0, mainstageOnly: true },
  { id: 'rpm', label: 'Turbopump speed', max: 36000, unit: 'rpm', decimals: 0 },
  { id: 'turbineTemp', label: 'Turbine inlet', max: 1060, unit: 'K', decimals: 0 },
  { id: 'loxInlet', label: 'LOX pump inlet', min: 3.4, unit: 'bar', decimals: 2 },
  { id: 'fuelInlet', label: 'Fuel pump inlet', min: 2.6, unit: 'bar', decimals: 2 },
  { id: 'vibration', label: 'Pump vibration', max: 42, unit: 'g RMS', decimals: 1 },
  { id: 'mixture', label: 'Mixture ratio', min: 2.24, max: 2.44, unit: 'O/F', decimals: 2, mainstageOnly: true },
]

/* ── Valves ─────────────────────────────────────────────────────────────────────────── */
export type Stage = 'hold' | 'count' | 'run' | 'shutdown' | 'safed'
export type ValveState = 'Open' | 'Closed' | 'Fault'

export interface Valve {
  tag: string
  name: string
  /** Position by stage. A fault overrides it. */
  states: Record<Stage, ValveState>
  fault?: string
}

const all = (s: ValveState): Record<Stage, ValveState> => ({ hold: s, count: s, run: s, shutdown: s, safed: s })

export const valves: Valve[] = [
  { tag: 'MOV-101', name: 'Main oxidizer', states: { hold: 'Closed', count: 'Closed', run: 'Open', shutdown: 'Closed', safed: 'Closed' } },
  { tag: 'MFV-201', name: 'Main fuel', states: { hold: 'Closed', count: 'Closed', run: 'Open', shutdown: 'Closed', safed: 'Closed' } },
  { tag: 'GGO-301', name: 'Gas generator ox', states: { hold: 'Closed', count: 'Closed', run: 'Open', shutdown: 'Closed', safed: 'Closed' } },
  { tag: 'GGF-302', name: 'Gas generator fuel', states: { hold: 'Closed', count: 'Closed', run: 'Open', shutdown: 'Closed', safed: 'Closed' } },
  { tag: 'IGN-401', name: 'Igniter TEA-TEB', states: all('Closed') },
  { tag: 'HSV-501', name: 'Helium spin start', states: all('Closed') },
  { tag: 'PGV-601', name: 'GN2 purge', states: { hold: 'Closed', count: 'Closed', run: 'Closed', shutdown: 'Open', safed: 'Open' } },
  { tag: 'CDV-103', name: 'Chill-down return', states: { hold: 'Open', count: 'Closed', run: 'Closed', shutdown: 'Closed', safed: 'Closed' } },
  { tag: 'PRV-104', name: 'LOX pressurant', states: { hold: 'Open', count: 'Open', run: 'Open', shutdown: 'Closed', safed: 'Closed' } },
  { tag: 'PRV-203', name: 'Fuel pressurant', states: { hold: 'Open', count: 'Open', run: 'Open', shutdown: 'Closed', safed: 'Closed' } },
  { tag: 'LOV-102', name: 'LOX tank vent', states: { hold: 'Closed', count: 'Closed', run: 'Closed', shutdown: 'Closed', safed: 'Open' } },
  { tag: 'FVV-202', name: 'Fuel tank vent', states: all('Closed'), fault: 'Position indicators disagree since T+12.4 s' },
]

export const VALVE_TONE: Record<ValveState, StatusTone> = { Open: 'brand', Closed: 'neutral', Fault: 'danger' }

/* ── Sequence ───────────────────────────────────────────────────────────────────────── */
export const steps = [
  { label: 'Chill-down', description: 'T−300 to T−10 s' },
  { label: 'Ignition', description: 'T−3 to T+2 s' },
  { label: 'Mainstage', description: 'T+2 to T+180 s' },
  { label: 'Shutdown', description: 'T+180 s, 0.6 s decay' },
  { label: 'Safing', description: 'Purge, vent, lock out' },
]

/* ── Data log ───────────────────────────────────────────────────────────────────────── */
export interface LogLine {
  id: string
  t: number
  source: 'SEQ' | 'VLV' | 'DAQ' | 'LIM' | 'OPS'
  message: string
  value?: string
  tone?: StatusTone
}

export const bootLog: LogLine[] = [
  { id: 'l1', t: -300, source: 'SEQ', message: 'Chill-down start, CDV-103 open', value: '' },
  { id: 'l2', t: -182.4, source: 'DAQ', message: 'LOX pump inlet below 95 K, pump chilled', value: '94.6 K' },
  { id: 'l3', t: -30, source: 'SEQ', message: 'Terminal count, auto-sequence running', value: '' },
  { id: 'l4', t: -10, source: 'OPS', message: 'Ignition armed by D. Hutapea', value: '' },
  { id: 'l5', t: -3, source: 'VLV', message: 'HSV-501 open, helium spin start', value: '' },
  { id: 'l6', t: -1.2, source: 'VLV', message: 'IGN-401 fire, TEA-TEB', value: 'green flash' },
  { id: 'l7', t: 0, source: 'VLV', message: 'MOV-101 open', value: '100 %' },
  { id: 'l8', t: 0.15, source: 'VLV', message: 'MFV-201 open', value: '100 %' },
  { id: 'l9', t: 1.84, source: 'DAQ', message: 'PC-A above 90 bar', value: '90.4 bar' },
  { id: 'l10', t: 2, source: 'SEQ', message: 'Mainstage', value: '', tone: 'brand' },
  { id: 'l11', t: 12.4, source: 'VLV', message: 'FVV-202 position indicators disagree', value: 'monitored', tone: 'danger' },
]
