/**
 * Ground station · Waingapu (WGS), Sumba. Four antennas sold as a service to several operators.
 * Snapshot of 12 Nov 2026 at 08:42 UTC (16:42 WITA). Each selectable pass carries its own sky
 * track, signal-to-noise profile and downlink files, so the panels agree.
 */
import type { SpecItem, StatusTone } from '@/design-system'

export const NOW = 8 * 60 + 42
export const DAY_FROM = 6 * 60
/** The axis runs ten minutes past 14:00 so the last tick label has room. */
export const DAY_TO = 14 * 60 + 10
export const HOUR_TICKS = Array.from({ length: 9 }, (_, i) => DAY_FROM + i * 60)

const pad = (n: number, w = 2) => String(Math.floor(n)).padStart(w, '0')
export const hhmm = (min: number) => `${pad(min / 60)}:${pad(((min % 60) + 60) % 60)}`
/** 8.5 min → "08:30" style clock with seconds: 522.5 → "08:42:30" */
export const hhmmss = (min: number) => `${hhmm(Math.floor(min))}:${pad(Math.round((min % 1) * 60))}`

/* ── Antennas ───────────────────────────────────────────────────────────────────────── */
export interface Antenna {
  id: string
  dish: string
  status: string
  tone: StatusTone
  detail: string
  live?: boolean
}

export const antennas: Antenna[] = [
  { id: 'ANT-1', dish: '7.3 m · X/S', status: 'Ready', tone: 'success', detail: 'Next LINTAS-5 at 08:51' },
  { id: 'ANT-2', dish: '7.3 m · X/S', status: 'Tracking', tone: 'brand', detail: 'RS-12 at 63° elevation', live: true },
  { id: 'ANT-3', dish: '3.7 m · S/UHF', status: 'Ready', tone: 'success', detail: 'Next CAKRA-1A at 09:05' },
  { id: 'ANT-4', dish: '13 m · X/Ka', status: 'Maintenance', tone: 'warning', detail: 'Back at 11:00 UTC' },
]

export const siteSystems: Antenna[] = [
  { id: 'UPS', dish: '2 × 120 kVA', status: 'Nominal', tone: 'success', detail: 'On mains · 100%' },
  { id: 'Fibre', dish: 'Backhaul', status: 'Nominal', tone: 'success', detail: '10 Gbit/s · 18 ms' },
]

/* ── Schedule ───────────────────────────────────────────────────────────────────────── */
export interface Booking {
  antenna: string
  label: string
  start: number
  end: number
  kind?: 'maintenance' | 'calibration'
}

const at = (h: number, m: number) => h * 60 + m

export const bookings: Booking[] = [
  { antenna: 'ANT-1', label: 'NUSA-2', start: at(6, 12), end: at(6, 25) },
  { antenna: 'ANT-1', label: 'RS-17', start: at(7, 12), end: at(7, 23) },
  { antenna: 'ANT-1', label: 'AURA-3', start: at(7, 58), end: at(8, 9) },
  { antenna: 'ANT-1', label: 'LINTAS-5', start: at(8, 51), end: at(9, 2) },
  { antenna: 'ANT-1', label: 'NUSA-2', start: at(9, 47), end: at(10, 0) },
  { antenna: 'ANT-1', label: 'RS-12', start: at(10, 22), end: at(10, 33) },
  { antenna: 'ANT-1', label: 'AURA-3', start: at(11, 30), end: at(11, 42) },
  { antenna: 'ANT-1', label: 'RS-17', start: at(12, 44), end: at(12, 55) },

  { antenna: 'ANT-2', label: 'LINTAS-5', start: at(6, 40), end: at(6, 51) },
  { antenna: 'ANT-2', label: 'RS-12', start: at(7, 0), end: at(7, 11) },
  { antenna: 'ANT-2', label: 'NUSA-2', start: at(7, 42), end: at(7, 55) },
  { antenna: 'ANT-2', label: 'RS-12', start: at(8, 36), end: at(8, 48) },
  { antenna: 'ANT-2', label: 'RS-17', start: at(9, 24), end: at(9, 35) },
  { antenna: 'ANT-2', label: 'Calibration', start: at(10, 30), end: at(11, 0), kind: 'calibration' },
  { antenna: 'ANT-2', label: 'LINTAS-5', start: at(12, 10), end: at(12, 21) },
  { antenna: 'ANT-2', label: 'NUSA-2', start: at(13, 5), end: at(13, 18) },

  { antenna: 'ANT-3', label: 'CAKRA-1A', start: at(6, 30), end: at(6, 38) },
  { antenna: 'ANT-3', label: 'CAKRA-1A', start: at(8, 4), end: at(8, 12) },
  { antenna: 'ANT-3', label: 'CAKRA-1A', start: at(9, 5), end: at(9, 14) },
  { antenna: 'ANT-3', label: 'AURA-3', start: at(10, 6), end: at(10, 15) },
  { antenna: 'ANT-3', label: 'CAKRA-1A', start: at(11, 40), end: at(11, 48) },
  { antenna: 'ANT-3', label: 'CAKRA-1A', start: at(13, 14), end: at(13, 22) },

  { antenna: 'ANT-4', label: 'RS-17', start: at(6, 50), end: at(7, 1) },
  { antenna: 'ANT-4', label: 'Maintenance · feed alignment', start: at(8, 0), end: at(11, 0), kind: 'maintenance' },
  { antenna: 'ANT-4', label: 'NUSA-2', start: at(11, 36), end: at(11, 49) },
  { antenna: 'ANT-4', label: 'RS-12', start: at(12, 58), end: at(13, 9) },
]

/* ── Passes · sky track and signal ──────────────────────────────────────────────────── */
export interface PassSample {
  t: number
  az: number
  el: number
  snr: number
}

export interface PassDetail {
  antenna: string
  spacecraft: string
  operator: string
  band: string
  aos: number
  los: number
  maxEl: number
  aosAz: number
  losAz: number
  rate: string
  samples: PassSample[]
}

function noise(i: number, seed: number) {
  const x = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453
  return x - Math.floor(x) - 0.5
}

/** A pass sampled once a minute: elevation follows a sine, azimuth sweeps from AOS to LOS. */
function track(aos: number, los: number, aosAz: number, losAz: number, maxEl: number, gain: number, seed: number): PassSample[] {
  const n = Math.round(los - aos)
  let sweep = losAz - aosAz
  if (sweep > 180) sweep -= 360
  if (sweep < -180) sweep += 360
  return Array.from({ length: n + 1 }, (_, i) => {
    const u = i / n
    const el = maxEl * Math.sin(Math.PI * u)
    const az = (aosAz + sweep * u + 360) % 360
    // Signal improves with elevation (shorter slant range, less atmosphere). Steps of 0.1 dB.
    const snr = Math.round((3.2 + gain * Math.sin((Math.max(el, 0.5) * Math.PI) / 180) ** 0.6 + noise(i, seed) * 0.6) * 10) / 10
    return { t: aos + i, az: Math.round(az * 10) / 10, el: Math.round(el * 10) / 10, snr }
  })
}

export const passDetails: PassDetail[] = [
  {
    antenna: 'ANT-1',
    spacecraft: 'LINTAS-5',
    operator: 'Lintas Maritim',
    band: 'X-band · 8.2 GHz',
    aos: at(8, 51),
    los: at(9, 2),
    maxEl: 34,
    aosAz: 312,
    losAz: 168,
    rate: '150 Mbit/s',
    samples: track(at(8, 51), at(9, 2), 312, 168, 34, 9.4, 3),
  },
  {
    antenna: 'ANT-2',
    spacecraft: 'RS-12',
    operator: 'Rasi Earth Imaging',
    band: 'X-band · 8.1 GHz',
    aos: at(8, 36),
    los: at(8, 48),
    maxEl: 63,
    aosAz: 204,
    losAz: 26,
    rate: '800 Mbit/s',
    samples: track(at(8, 36), at(8, 48), 204, 26, 63, 12.6, 7),
  },
  {
    antenna: 'ANT-3',
    spacecraft: 'CAKRA-1A',
    operator: 'Cakra Space Lab',
    band: 'S-band · 2.25 GHz',
    aos: at(9, 5),
    los: at(9, 14),
    maxEl: 21,
    aosAz: 146,
    losAz: 58,
    rate: '2 Mbit/s',
    samples: track(at(9, 5), at(9, 14), 146, 58, 21, 8.1, 11),
  },
]

export const LOCK_THRESHOLD = 6

/* ── Downlink queue ─────────────────────────────────────────────────────────────────── */
export type FileStatus = 'Downlinking' | 'Queued' | 'Verified' | 'Delivered' | 'Failed'

export interface DownlinkFile {
  id: string
  file: string
  spacecraft: string
  antenna: string
  sizeMb: number
  priority: 'P1' | 'P2' | 'P3'
  eta: string
  status: FileStatus
  progress?: number
  note?: string
}

export const files: DownlinkFile[] = [
  { id: 'f1', file: 'RS12_L0_20261112T0836_X.bin', spacecraft: 'RS-12', antenna: 'ANT-2', sizeMb: 4820, priority: 'P1', eta: '08:47', status: 'Downlinking', progress: 61 },
  { id: 'f2', file: 'RS12_HK_20261112T0836.tlm', spacecraft: 'RS-12', antenna: 'ANT-2', sizeMb: 8.6, priority: 'P2', eta: '08:44', status: 'Downlinking', progress: 92 },
  { id: 'f3', file: 'LINTAS5_AIS_20261112T0851.dat', spacecraft: 'LINTAS-5', antenna: 'ANT-1', sizeMb: 184, priority: 'P2', eta: '08:53', status: 'Queued' },
  { id: 'f4', file: 'CAKRA1A_HK_20261112T0905.tlm', spacecraft: 'CAKRA-1A', antenna: 'ANT-3', sizeMb: 12.4, priority: 'P2', eta: '09:07', status: 'Queued' },
  { id: 'f5', file: 'RS17_L0_20261112T0924_X.bin', spacecraft: 'RS-17', antenna: 'ANT-2', sizeMb: 5040, priority: 'P1', eta: '09:33', status: 'Queued' },
  { id: 'f6', file: 'NUSA2_SAR_STRIP_0398.h5', spacecraft: 'NUSA-2', antenna: 'ANT-2', sizeMb: 2070, priority: 'P1', eta: '09:52', status: 'Failed', note: 'CRC mismatch on block 1,184 of 2,070' },
  { id: 'f7', file: 'AURA3_SCI_20261112T0758.tar', spacecraft: 'AURA-3', antenna: 'ANT-1', sizeMb: 1380, priority: 'P3', eta: '08:09', status: 'Verified' },
  { id: 'f8', file: 'NUSA2_SAR_STRIP_0397.h5', spacecraft: 'NUSA-2', antenna: 'ANT-2', sizeMb: 2110, priority: 'P1', eta: '07:55', status: 'Delivered' },
  { id: 'f9', file: 'RS12_L0_20261112T0700_X.bin', spacecraft: 'RS-12', antenna: 'ANT-2', sizeMb: 4760, priority: 'P1', eta: '07:11', status: 'Delivered' },
  { id: 'f10', file: 'CAKRA1A_HK_20261112T0804.tlm', spacecraft: 'CAKRA-1A', antenna: 'ANT-3', sizeMb: 11.8, priority: 'P2', eta: '08:12', status: 'Delivered' },
]

export const FILE_TONE: Record<FileStatus, StatusTone> = {
  Downlinking: 'brand',
  Queued: 'neutral',
  Verified: 'success',
  Delivered: 'success',
  Failed: 'danger',
}

/* ── Weather ────────────────────────────────────────────────────────────────────────── */
export const weather: SpecItem[] = [
  { label: 'Conditions', value: 'Light rain · 2.4 mm/h' },
  { label: 'Cloud', value: '70 % · base 1,400 m', mono: true },
  { label: 'Wind', value: '18 km/h from 110°', mono: true, hint: 'Gusts 31 · stow at 72' },
  { label: 'Air', value: '29.4 °C · RH 81 %', mono: true },
  { label: 'Pressure', value: '1,008.6 hPa', mono: true },
  { label: 'Fade margin X', value: '6.2 dB', mono: true, tone: 'success', hint: 'At 10° elevation' },
  { label: 'Fade margin Ka', value: '1.8 dB', mono: true, tone: 'warning', hint: 'Below 3 dB, ANT-4 only' },
  { label: 'Next rain cell', value: '09:20 UTC · 40 min', mono: true, hint: 'From radar, 22 km east' },
]
