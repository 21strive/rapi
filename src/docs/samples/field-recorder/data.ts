/**
 * FR-1 pocket recorder, session S-0412: a dawn chorus at the Muara Angke mangrove, Jakarta,
 * on 03 Nov 2026. Four channels into 32-bit float WAV. Take 08 is rolling when the screen opens:
 * it started at 06:31:02 WIB and has run 12:41, so the time of day is 06:43:43 WIB.
 */

export type InputId = 'mic-l' | 'mic-r' | 'xlr-1' | 'xlr-2' | 'line' | 'usb'

export interface Channel {
  index: string
  name: string
  input: InputId
  /** Preamp gain in dB. */
  gain: number
  /** The gain the level profile was measured at; level moves 1:1 with gain from here. */
  gainRef: number
  /** Typical level at gainRef, dBFS. */
  floor: number
  /** How strongly bird calls reach this input (0–1). */
  calls: number
  mute: boolean
  solo: boolean
  phantom: boolean
}

export const inputs: { label: string; value: InputId; phantom: boolean }[] = [
  { label: 'Built-in mic L', value: 'mic-l', phantom: false },
  { label: 'Built-in mic R', value: 'mic-r', phantom: false },
  { label: 'XLR 1', value: 'xlr-1', phantom: true },
  { label: 'XLR 2', value: 'xlr-2', phantom: true },
  { label: 'Line in 3.5 mm', value: 'line', phantom: false },
  { label: 'USB return', value: 'usb', phantom: false },
]

export const channels: Channel[] = [
  { index: '01', name: 'XY left', input: 'mic-l', gain: 38, gainRef: 38, floor: -40, calls: 1, mute: false, solo: false, phantom: false },
  { index: '02', name: 'XY right', input: 'mic-r', gain: 38, gainRef: 38, floor: -41, calls: 0.9, mute: false, solo: false, phantom: false },
  { index: '03', name: 'Hydrophone', input: 'xlr-1', gain: 52, gainRef: 52, floor: -33, calls: 0.15, mute: true, solo: false, phantom: true },
  { index: '04', name: 'Shotgun', input: 'xlr-2', gain: 44, gainRef: 44, floor: -43, calls: 1.25, mute: false, solo: false, phantom: true },
]

export const session = {
  id: 'S-0412',
  name: 'Muara Angke, dawn chorus',
  date: '03 Nov 2026',
  place: 'Muara Angke mangrove, Jakarta',
  coords: '6.1069° S · 106.7713° E',
}

export const device = {
  model: 'FR-1',
  serial: 'FR1-2408-0812',
  firmware: '2.4.1',
  battery: 78,
  /** Minutes left at the current load (four channels, two on phantom power). */
  batteryMinutes: 342,
  cardGb: 128,
  /** Free space when the screen opens, GB (decimal). */
  freeGb: 61.4,
  tempC: 31.2,
}

/** Bytes per second for four channels of 32-bit float. */
export const bytesPerSecond = (rateKhz: number) => rateKhz * 1000 * 4 * 4

export interface Take {
  id: string
  name: string
  /** Start, seconds after midnight WIB. */
  start: number
  /** Seconds; null while the take is still recording. */
  duration: number | null
  /** Highest sample peak, dBFS. */
  peak: number
  marks: number
  rate: 48 | 96
  seed: number
}

const hms = (h: number, m: number, s: number) => h * 3600 + m * 60 + s

// Starts and lengths line up: each take begins about a minute after the one before ends.
export const takes: Take[] = [
  { id: 'T08', name: 'Take 08', start: hms(6, 31, 2), duration: null, peak: -4.2, marks: 3, rate: 48, seed: 8 },
  { id: 'T07', name: 'Take 07', start: hms(6, 12, 40), duration: 1046, peak: -6.1, marks: 5, rate: 48, seed: 7 },
  { id: 'T06', name: 'Take 06', start: hms(5, 58, 15), duration: 742, peak: -9.8, marks: 2, rate: 48, seed: 6 },
  { id: 'T05', name: 'Take 05', start: hms(5, 49, 3), duration: 488, peak: -3.4, marks: 1, rate: 48, seed: 5 },
  { id: 'T04', name: 'Take 04', start: hms(5, 37, 44), duration: 612, peak: -7.7, marks: 2, rate: 48, seed: 4 },
  { id: 'T03', name: 'Take 03', start: hms(5, 30, 10), duration: 401, peak: -11.2, marks: 0, rate: 48, seed: 3 },
  { id: 'T02', name: 'Take 02', start: hms(5, 21, 26), duration: 455, peak: -8.9, marks: 1, rate: 48, seed: 2 },
  { id: 'T01', name: 'Take 01', start: hms(5, 12, 8), duration: 498, peak: -14.6, marks: 0, rate: 48, seed: 1 },
]

/** Take 08 has run 12:41 and 7 frames when the screen opens. */
export const rollingElapsed = 761 + 7 / 25

/** A small deterministic generator, so the same take always draws the same waveform. */
export function seeded(seed: number) {
  let s = (seed * 2654435761) >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

/**
 * Peak level per column on the meter scale (0 = −60 dBFS, 60 = 0 dBFS): a steady floor of
 * insects and water, with bird calls arriving in bursts.
 */
export function makeWave(seed: number, columns: number): number[] {
  const rnd = seeded(seed)
  const out: number[] = []
  let burst = 0
  let height = 0
  for (let i = 0; i < columns; i++) {
    if (burst <= 0 && rnd() < 0.16) {
      burst = 1 + Math.floor(rnd() * 4)
      height = 40 + rnd() * 14
    }
    const floor = 20 + rnd() * 7
    const value = burst > 0 ? height - rnd() * 8 : floor
    burst -= 1
    out.push(Math.round(Math.max(8, Math.min(57, value))))
  }
  return out
}

export const pad2 = (n: number) => String(Math.floor(n)).padStart(2, '0')

/** 761.28 → "00:12:41:07" at 25 frames a second. */
export function timecode(seconds: number) {
  const s = Math.max(0, seconds)
  const frames = Math.floor((s % 1) * 25)
  return `${pad2(s / 3600)}:${pad2((s % 3600) / 60)}:${pad2(s % 60)}:${pad2(frames)}`
}

/** 1046 → "17:26" */
export const minutes = (seconds: number) => `${pad2(seconds / 60)}:${pad2(seconds % 60)}`

/** Seconds after midnight → "06:43:43" */
export const clock = (seconds: number) => {
  const s = ((seconds % 86400) + 86400) % 86400
  return `${pad2(s / 3600)}:${pad2((s % 3600) / 60)}:${pad2(s % 60)}`
}
