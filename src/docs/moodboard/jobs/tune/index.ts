import { archetype, idr, num, pad, rp, seeded, usd } from '../../kit'
import type { MoodEntry } from '../../types'
import CentreKnob from './CentreKnob.vue'
import CropRegion from './CropRegion.vue'
import CurveEditor from './CurveEditor.vue'
import Fader from './Fader.vue'
import FaderBank from './FaderBank.vue'
import HourPainter from './HourPainter.vue'
import JogWheel from './JogWheel.vue'
import Joystick from './Joystick.vue'
import KnobPanel from './KnobPanel.vue'
import LedDimmer from './LedDimmer.vue'
import LimitSlider from './LimitSlider.vue'
import ModeDial from './ModeDial.vue'
import ModeSwitch from './ModeSwitch.vue'
import NotchLever from './NotchLever.vue'
import RangeWindow from './RangeWindow.vue'
import RotaryKnob from './RotaryKnob.vue'
import { minus, plusMinus } from './shared'
import SplitBar from './SplitBar.vue'
import StepGrid from './StepGrid.vue'
import Stepper from './Stepper.vue'
import TapTempo from './TapTempo.vue'
import ThresholdChart from './ThresholdChart.vue'
import ToggleBank from './ToggleBank.vue'
import TuningTape from './TuningTape.vue'
import XYPad from './XYPad.vue'

/* ── Data helpers: seeded, so every load and every screenshot is the same ────────────── */

/** A bell of counts over `n` bins, centred on bin `mid`, with seeded noise. */
function bell(seed: string, n: number, mid: number, spread: number, peak: number, skew = 0) {
  const rnd = seeded(seed)
  return Array.from({ length: n }, (_, i) => {
    const d = (i - mid) / (spread * (i > mid ? 1 + skew : 1))
    return Math.max(0, Math.round(peak * Math.exp(-0.5 * d * d) * (0.85 + rnd() * 0.3)))
  })
}

/** Cutoff knob: 0–100 on a log scale from 20 Hz to 20 kHz. */
const hz = (v: number) => 20 * 1000 ** (v / 100)
const hzText = (v: number) => {
  const f = hz(v)
  return f < 1000 ? num(f) : (f / 1000).toFixed(f < 10000 ? 2 : 1)
}

const pad3 = (v: number) => String(Math.round(v) % 360).padStart(3, '0')
const clock = (min: number) => `${pad(Math.floor(min / 60))}:${pad(min % 60)}`
const duration = (hours: number) => `${Math.floor(hours)} h ${pad(Math.round((hours % 1) * 60))} min`

/** Overnight SpO₂, one reading every five minutes, with a few dips. */
const spo2 = (() => {
  const rnd = seeded('tune-spo2')
  const dips = [14, 31, 33, 52, 67, 80]
  return Array.from({ length: 96 }, (_, i) => {
    const near = Math.min(...dips.map((d) => Math.abs(d - i)))
    const dip = near === 0 ? 6.5 : near === 1 ? 3 : 0
    return Math.round((95.2 + (rnd() - 0.5) * 2.2 - dip) * 10) / 10
  })
})()

/** Katulampa weir, every two hours for a week: dry days and three rain fronts. */
const river = (() => {
  const rnd = seeded('tune-katulampa')
  const storms = [
    { at: 18, h: 70 },
    { at: 44, h: 175 },
    { at: 70, h: 125 },
  ]
  return Array.from({ length: 84 }, (_, i) => {
    const s = storms.reduce((sum, st) => sum + st.h * Math.exp(-((i - st.at) ** 2) / (st.at === 44 ? 10 : 6)), 0)
    return Math.round(42 + (rnd() - 0.5) * 14 + s)
  })
})()

/** Bags of 250 g coffee sold a day over a month. */
const demand = (() => {
  const rnd = seeded('tune-kopi-demand')
  return Array.from({ length: 30 }, (_, i) => Math.round(14 + rnd() * 12 + (i % 7 === 5 || i % 7 === 6 ? 7 : 0)))
})()

/** Requests a second on a gateway route, the opening window of the live chart. */
const traffic = (() => {
  const rnd = seeded('tune-gateway')
  return Array.from({ length: 40 }, (_, i) => Math.round(1150 * (i > 26 && i < 31 ? 1.42 : 1) * (0.88 + rnd() * 0.24)))
})()

/* ── 01 Channel fader (the lead's specimen, three variants, plus one) ────────────────── */

const fader = archetype(Fader, {
  name: 'Channel fader',
  hint: 'Drag the cap or click the rail; arrow and Page keys step; double-click resets',
  why: 'A level is found by ear and hand in a second; describing it in words takes three tries.',
  tags: ['fader', 'slider', 'level', 'drag'],
})

const faders: MoodEntry[] = [
  fader({ id: 'tune-fader-vox', size: '1x2', domain: 'audio', props: { label: 'Vox 1', sub: 'Lead vocal', value: -4.5 } }),
  fader({
    id: 'tune-fader-main',
    size: '1x3',
    domain: 'media',
    surface: 'dark',
    name: 'Main bus fader',
    props: { label: 'Main', sub: 'Programme out', value: 0, marks: [6, 3, 0, -3, -6, -12, -24, -40, -60] },
  }),
  fader({
    id: 'tune-fader-flow',
    size: '1x2',
    domain: 'agri',
    name: 'Flow fader',
    props: {
      label: 'Block C',
      sub: 'Drip line flow',
      min: 0,
      max: 120,
      step: 1,
      value: 64,
      reset: 60,
      unit: 'L/min',
      marks: [120, 90, 60, 30, 0],
      meter: false,
      infinity: false,
      decimals: 0,
    },
  }),
  fader({
    id: 'tune-fader-reactive',
    size: '1x2',
    domain: 'energy',
    surface: 'muted',
    name: 'Reactive power fader',
    tags: ['grid', 'setpoint'],
    props: {
      label: 'Gen 3',
      sub: 'Reactive power',
      min: -40,
      max: 40,
      step: 1,
      value: 12,
      reset: 0,
      unit: 'Mvar',
      marks: [40, 20, 0, -20, -40],
      meter: false,
      infinity: false,
      decimals: 0,
    },
  }),
]

/* ── 02 Rotary knob ──────────────────────────────────────────────────────────────────── */

const knob = archetype(RotaryKnob, {
  name: 'Rotary knob',
  hint: 'Drag up or down, scroll while focused, or use the arrow keys; double-click resets',
  why: 'Turning until it sounds or feels right is faster than naming a number nobody knows yet.',
  tags: ['knob', 'rotary', 'dial'],
})

const knobs: MoodEntry[] = [
  knob({
    id: 'tune-knob-cutoff',
    size: '1x1',
    domain: 'audio',
    surface: 'dark',
    name: 'Filter cutoff',
    tags: ['synth', 'filter'],
    props: {
      label: 'Cutoff',
      value: 62,
      tone: 'signal',
      format: hzText,
      unitOf: (v: number) => (hz(v) < 1000 ? 'Hz' : 'kHz'),
      note: (v: number) => {
        const f = hz(v)
        return f < 400 ? 'Muffled, bass only' : f < 1500 ? 'Warm, vocals soft' : f < 6000 ? 'Clear, slightly dark' : 'Fully open'
      },
    },
  }),
  knob({
    id: 'tune-knob-heater',
    size: '1x1',
    domain: 'home',
    name: 'Water heater',
    tags: ['temperature', 'home'],
    props: {
      label: 'Setpoint',
      value: 55,
      min: 35,
      max: 75,
      unit: '°C',
      tone: 'brand',
      note: (v: number) => `Hot in ${Math.round((v - 28) * 0.9)} min`,
    },
  }),
  knob({
    id: 'tune-knob-oxygen',
    size: '2x1',
    domain: 'health',
    name: 'Oxygen flow',
    tags: ['ward', 'flow'],
    props: {
      label: 'O₂ flow',
      value: 2,
      min: 0,
      max: 15,
      step: 0.5,
      unit: 'L/min',
      tone: 'neutral',
      eyebrow: 'Device for this flow',
      bands: [
        { upTo: 6, label: 'Nasal cannula', meta: '1–6 L/min', at: 2 },
        { upTo: 10, label: 'Simple mask', meta: '5–10 L/min', at: 7 },
        { upTo: 15, label: 'Non-rebreather', meta: '10–15 L/min', at: 12 },
      ],
      note: (v: number) => {
        if (v === 0) return 'Off'
        const fio2 = v <= 6 ? 21 + 4 * v : v <= 10 ? 35 + (v - 5) * 4 : Math.min(90, 60 + (v - 10) * 6)
        return `FiO₂ about ${Math.round(fio2)}%`
      },
    },
  }),
  knob({
    id: 'tune-knob-cashback',
    size: '1x1',
    domain: 'payments',
    surface: 'brand',
    name: 'Cashback rate',
    tags: ['campaign', 'merchant'],
    props: {
      label: 'Cashback',
      value: 5,
      min: 0,
      max: 20,
      step: 0.5,
      unit: '%',
      tone: 'neutral',
      note: (v: number) => (v === 0 ? 'Campaign paused' : `Costs ${idr(368e6 * (v / 100))} a day`),
    },
  }),
  knob({
    id: 'tune-knob-clutter',
    size: '1x1',
    domain: 'defense',
    surface: 'dark',
    name: 'Sea clutter',
    tags: ['radar', 'patrol'],
    props: {
      label: 'Sea clutter',
      value: 40,
      unit: '%',
      tone: 'brand',
      note: (v: number) => (v === 0 ? 'Every return shown' : `Clears to ${((v / 100) * 4).toFixed(1)} NM`),
    },
  }),
  knob({
    id: 'tune-knob-grind',
    size: '2x1',
    domain: 'commerce',
    name: 'Grind size',
    tags: ['coffee', 'cafe'],
    props: {
      label: 'Grind',
      value: 640,
      min: 200,
      max: 1200,
      step: 10,
      unit: 'µm',
      tone: 'neutral',
      eyebrow: 'Kopi Lereng · grinder 2',
      bands: [
        { upTo: 300, label: 'Espresso', meta: '200–300', at: 260 },
        { upTo: 500, label: 'Moka pot', meta: '300–500', at: 420 },
        { upTo: 800, label: 'Pour-over', meta: '500–800', at: 640 },
        { upTo: 1000, label: 'French press', meta: '800–1,000', at: 900 },
        { upTo: 1200, label: 'Cold brew', meta: '1,000–1,200', at: 1100 },
      ],
      note: (v: number) => `Brews in ${v <= 300 ? '28 s' : v <= 500 ? '4 min' : v <= 800 ? '3 min 30 s' : v <= 1000 ? '4 min' : '14 h'}`,
    },
  }),
]

/* ── 03 Centre-detent knob ───────────────────────────────────────────────────────────── */

const centre = archetype(CentreKnob, {
  name: 'Centre-detent knob',
  hint: 'Drag up or down, scroll while focused, or use the arrow keys; double-click, 0 or Delete return to the centre',
  why: '“A bit warmer” is a guess; a knob with a centre detent says exactly how much, and where neutral is.',
  tags: ['knob', 'bipolar', 'offset', 'trim'],
})

const centres: MoodEntry[] = [
  centre({
    id: 'tune-offset-thermostat',
    size: '1x1',
    domain: 'home',
    name: 'Thermostat offset',
    tags: ['temperature', 'comfort'],
    props: {
      label: 'Offset',
      range: 3,
      step: 0.5,
      value: 1.5,
      unit: '°C',
      ends: ['Cooler', 'Warmer'],
      note: (v: number) => `Living room · ${num(24 + v, 1)} °C`,
    },
  }),
  centre({
    id: 'tune-offset-pan',
    size: '1x1',
    domain: 'audio',
    surface: 'dark',
    name: 'Pan',
    tags: ['mix', 'stereo'],
    props: {
      label: 'Gtr 2 pan',
      range: 100,
      step: 1,
      value: -30,
      ends: ['L', 'R'],
      format: (v: number) => (v === 0 ? 'C' : v < 0 ? `L ${-v}` : `R ${v}`),
      note: (v: number) => (v < -10 ? 'Left of the vocal' : v > 10 ? 'Right of the vocal' : 'With the vocal'),
    },
  }),
  centre({
    id: 'tune-offset-skew',
    size: '1x1',
    domain: 'banking',
    surface: 'muted',
    name: 'Price skew',
    tags: ['fx', 'treasury', 'quote'],
    props: {
      label: 'USD/IDR skew',
      range: 10,
      step: 0.5,
      value: 2,
      unit: 'bps',
      ends: ['Bid', 'Ask'],
      note: (v: number) => {
        const mid = 16252
        return `Bid ${num(mid * (1 - 0.001 + v * 0.0001))} · Ask ${num(mid * (1 + 0.001 + v * 0.0001))}`
      },
    },
  }),
  centre({
    id: 'tune-offset-trim',
    size: '1x2',
    domain: 'aerospace',
    surface: 'dark',
    name: 'Rudder trim',
    tags: ['cockpit', 'trim'],
    hint: 'Turn the knob until the slip ball is centred; arrows, wheel while focused, 0 for neutral',
    props: {
      label: 'Rudder trim',
      range: 10,
      step: 0.5,
      value: 0,
      ends: ['Left', 'Right'],
      format: (v: number) => (v === 0 ? '0.0' : `${Math.abs(v).toFixed(1)} ${v < 0 ? 'L' : 'R'}`),
      note: () => 'Engine 2 out, 160 kt',
      target: -3.5,
    },
  }),
]

/* ── 04 Knob panel ───────────────────────────────────────────────────────────────────── */

const panel = archetype(KnobPanel, {
  name: 'Knob panel',
  hint: 'Turn any knob (drag, wheel while focused, arrow keys) and watch the curve redraw',
  why: 'Values that shape one curve are tuned together while watching the curve, not described one by one.',
  tags: ['knob', 'panel', 'curve'],
})

const panels: MoodEntry[] = [
  panel({
    id: 'tune-panel-envelope',
    size: '3x2',
    domain: 'audio',
    surface: 'dark',
    name: 'Amp envelope',
    hint: 'Turn the four knobs; hold the play key (or Space on it) to run a note through the envelope',
    tags: ['synth', 'adsr', 'live'],
    props: {
      kind: 'adsr',
      eyebrow: 'Synth 2 · amp envelope',
      tone: 'signal',
      knobs: [
        { key: 'attack', label: 'Attack', min: 0, max: 2000, step: 10, value: 240, unit: 'ms' },
        { key: 'decay', label: 'Decay', min: 0, max: 2000, step: 10, value: 620, unit: 'ms' },
        { key: 'sustain', label: 'Sustain', min: 0, max: 100, step: 1, value: 58, unit: '%' },
        { key: 'release', label: 'Release', min: 0, max: 4000, step: 10, value: 1400, unit: 'ms' },
      ],
    },
  }),
  panel({
    id: 'tune-panel-voice',
    size: '2x2',
    domain: 'media',
    name: 'Voice compressor',
    tags: ['podcast', 'dynamics'],
    props: {
      kind: 'comp',
      eyebrow: 'Podcast · voice bus',
      meta: 'Ep. 48',
      probeDb: -6,
      knobs: [
        { key: 'threshold', label: 'Threshold', min: -40, max: 0, step: 1, value: -18, unit: 'dB' },
        { key: 'ratio', label: 'Ratio', min: 1, max: 10, step: 0.5, value: 3 },
        { key: 'makeup', label: 'Makeup', min: 0, max: 12, step: 0.5, value: 4, unit: 'dB' },
      ],
    },
  }),
  panel({
    id: 'tune-panel-gimbal',
    size: '2x2',
    domain: 'defense',
    surface: 'dark',
    name: 'Gimbal loop tuning',
    tags: ['pid', 'drone', 'control'],
    props: {
      kind: 'pid',
      eyebrow: 'Patrol drone · pitch gimbal',
      meta: 'Step 1 rad',
      knobs: [
        { key: 'p', label: 'P', min: 0, max: 20, step: 0.5, value: 9 },
        { key: 'i', label: 'I', min: 0, max: 5, step: 0.1, value: 1 },
        { key: 'd', label: 'D', min: 0, max: 3, step: 0.05, value: 1 },
      ],
    },
  }),
  panel({
    id: 'tune-panel-droop',
    size: '2x2',
    domain: 'energy',
    surface: 'muted',
    name: 'Governor droop',
    tags: ['grid', 'frequency', 'generator'],
    props: {
      kind: 'droop',
      eyebrow: 'Unit 2 · governor',
      meta: '200 MW',
      ratedMw: 200,
      probeHz: 49.8,
      knobs: [
        { key: 'droop', label: 'Droop', min: 2, max: 10, step: 0.5, value: 5, unit: '%' },
        { key: 'deadband', label: 'Deadband', min: 0, max: 200, step: 1, value: 36, unit: 'mHz' },
        { key: 'limit', label: 'Limit', min: 0, max: 20, step: 1, value: 10, unit: '%' },
      ],
    },
  }),
]

/* ── 05 Fader bank ───────────────────────────────────────────────────────────────────── */

const bank = archetype(FaderBank, {
  name: 'Fader bank',
  hint: 'Sweep across the bands to draw the shape, or drag one; on a focused band, up and down move it, left and right change band',
  why: 'A shape across many bands is drawn with one sweep of the hand; spoken, it is a list of numbers.',
  tags: ['fader', 'bank', 'shape', 'draw'],
})

const eqBands = ['31', '63', '125', '250', '500', '1k', '2k', '4k', '8k', '16k']
const bandName = (b: string) => (b.endsWith('k') ? `${b.slice(0, -1)} kHz` : `${b} Hz`)
const zoneFlow = [9, 11, 6, 7, 3, 14]
const banks: MoodEntry[] = [
  bank({
    id: 'tune-bank-eq',
    size: '3x2',
    domain: 'audio',
    name: 'Graphic EQ',
    tags: ['eq', 'mix'],
    props: {
      label: 'Graphic EQ · Studio B monitors',
      min: -12,
      max: 12,
      step: 0.5,
      unit: 'dB',
      bipolar: true,
      format: (v: number) => plusMinus(v, 1),
      bands: [2, 3, 1, -1, -2, 0, 1.5, 3, 1, -1].map((value, i) => ({ label: eqBands[i], name: bandName(eqBands[i]), value })),
      say: (v: number[]) => {
        const hi = v.indexOf(Math.max(...v))
        const lo = v.indexOf(Math.min(...v))
        const lift = v.filter((x) => x > 0).reduce((s, x) => s + x, 0)
        return {
          text: `Most lift at ${bandName(eqBands[hi])}, most cut at ${bandName(eqBands[lo])}`,
          word: lift > 24 ? 'Little headroom' : undefined,
          tone: 'warning' as const,
        }
      },
    },
  }),
  bank({
    id: 'tune-bank-battery',
    size: '3x2',
    domain: 'energy',
    name: 'Battery day plan',
    tags: ['battery', 'microgrid', 'schedule'],
    props: {
      label: 'Battery plan · Sumba microgrid',
      min: -50,
      max: 50,
      step: 5,
      unit: 'kW',
      bipolar: true,
      format: (v: number) => plusMinus(v, 0),
      bands: [-20, -15, -5, 10, 35, 45, 40, 25, -10, -40, -45, -30].map((value, i) => ({
        label: pad(i * 2),
        name: `${pad(i * 2)}:00–${pad(i * 2 + 2)}:00`,
        value,
      })),
      say: (v: number[]) => {
        const charge = v.filter((x) => x > 0).reduce((s, x) => s + x * 2, 0)
        const out = -v.filter((x) => x < 0).reduce((s, x) => s + x * 2, 0)
        let soc = 250
        let low = soc
        let high = soc
        v.forEach((x) => {
          soc += x * 2
          low = Math.min(low, soc)
          high = Math.max(high, soc)
        })
        const word = high > 500 ? 'Over capacity' : low < 0 ? 'Runs flat' : 'Within capacity'
        const tone = high > 500 || low < 0 ? ('danger' as const) : ('success' as const)
        return { text: `Charges ${num(charge)} kWh, gives back ${num(out)} kWh`, word, tone }
      },
    },
  }),
  bank({
    id: 'tune-bank-sprinkler',
    size: '2x2',
    domain: 'home',
    surface: 'muted',
    name: 'Sprinkler zones',
    tags: ['garden', 'water', 'schedule'],
    props: {
      label: 'Garden · watering at 05:30',
      min: 0,
      max: 30,
      step: 1,
      unit: 'min',
      bands: [
        { label: 'Z1', name: 'Front lawn', value: 12 },
        { label: 'Z2', name: 'Back lawn', value: 15 },
        { label: 'Z3', name: 'Vegetable bed', value: 8 },
        { label: 'Z4', name: 'Hedge', value: 6 },
        { label: 'Z5', name: 'Pots', value: 4 },
        { label: 'Z6', name: 'Fruit trees', value: 20 },
      ],
      say: (v: number[]) => {
        const total = v.reduce((s, x) => s + x, 0)
        const litres = v.reduce((s, x, i) => s + x * zoneFlow[i], 0)
        return {
          text: `${total} min, about ${num(litres)} L`,
          word: total > 90 ? 'Runs past 07:00' : undefined,
          tone: 'warning' as const,
        }
      },
    },
  }),
  bank({
    id: 'tune-bank-service',
    size: '4x2',
    domain: 'transit',
    name: 'Service plan',
    tags: ['trains', 'timetable', 'frequency'],
    props: {
      label: 'Bogor line · trains per hour',
      min: 0,
      max: 24,
      step: 1,
      unit: 'trains/h',
      labelEvery: 2,
      bands: [6, 14, 18, 16, 10, 8, 8, 8, 8, 9, 12, 16, 18, 16, 12, 9, 7, 5, 3].map((value, i) => ({
        label: pad(i + 5),
        name: `${pad(i + 5)}:00–${pad(i + 6)}:00`,
        value,
      })),
      say: (v: number[]) => {
        const trips = v.reduce((s, x) => s + x, 0)
        const sets = Math.ceil((Math.max(...v) * 140) / 60)
        return {
          text: `${trips} trips a day; the peak needs ${sets} trainsets`,
          word: sets > 44 ? 'Short of trainsets' : undefined,
          tone: 'danger' as const,
        }
      },
    },
  }),
]

/* ── 06 LED dimmer ───────────────────────────────────────────────────────────────────── */

const dimmer = archetype(LedDimmer, {
  name: 'LED dimmer',
  hint: 'Click or drag along the segments, or use the arrow keys; the power key turns it off and back',
  why: 'Light and speed are judged by eye; stepping until it looks right beats guessing a percentage.',
  tags: ['led', 'segments', 'level'],
})

const dimmers: MoodEntry[] = [
  dimmer({
    id: 'tune-dimmer-lounge',
    size: '1x2',
    domain: 'home',
    name: 'Lounge lights',
    tags: ['lights', 'dimmer'],
    props: {
      label: 'Lounge',
      steps: 10,
      value: 6,
      readout: (l: number) => (l ? `${l * 10}` : 'Off'),
      unit: '%',
      note: (l: number) => (l ? `${num(l * 90)} lm · ${(l * 0.9).toFixed(1)} W` : 'Off since 22:40'),
    },
  }),
  dimmer({
    id: 'tune-dimmer-runway',
    size: '1x2',
    domain: 'aerospace',
    surface: 'dark',
    name: 'Runway lights',
    tags: ['airport', 'lighting'],
    props: {
      label: 'RWY 25R · edge',
      steps: 5,
      value: 3,
      pixel: true,
      readout: (l: number) => (l ? `Step ${l}` : 'Off'),
      stepLabels: ['1%', '3%', '10%', '30%', '100%'],
      note: (l: number) => ['Off', 'Night, clear', 'Night', 'Dusk or haze', 'Day, poor visibility', 'Day, low visibility'][l],
    },
  }),
  dimmer({
    id: 'tune-dimmer-street',
    size: '2x1',
    domain: 'civic',
    surface: 'muted',
    name: 'Street lighting',
    tags: ['city', 'lights', 'energy'],
    props: {
      label: 'Jl. Sudirman · 412 lamps',
      steps: 10,
      value: 6,
      orientation: 'horizontal',
      readout: (l: number) => (l ? `${l * 10}` : 'Off'),
      unit: '%',
      tone: 'brand',
      note: (l: number) => (l === 10 ? 'Full output' : `Saves ${num(Math.round(412 * 0.15 * (1 - l / 10) * 11))} kWh a night`),
    },
  }),
  dimmer({
    id: 'tune-dimmer-conveyor',
    size: '1x1',
    domain: 'logistics',
    name: 'Conveyor speed',
    tags: ['warehouse', 'sorter', 'speed'],
    props: {
      label: 'Belt 3',
      steps: 5,
      value: 3,
      orientation: 'horizontal',
      compact: true,
      power: false,
      indicator: 'conveyor',
      readout: (l: number) => (l ? (l * 0.4).toFixed(1) : 'Stop'),
      unit: 'm/s',
      note: (l: number) => (l ? `${num(l * 1600)} parcels an hour` : 'Belt stopped'),
    },
  }),
  dimmer({
    id: 'tune-dimmer-infrared',
    size: '1x1',
    domain: 'security',
    surface: 'dark',
    name: 'Infrared illuminator',
    tags: ['cctv', 'night'],
    props: {
      label: 'Cam 12 · IR',
      steps: 8,
      value: 5,
      orientation: 'horizontal',
      compact: true,
      readout: (l: number) => (l ? `${l * 6}` : 'Off'),
      unit: 'm',
      note: (l: number) => (l ? 'Range in the dark' : 'Colour mode only'),
    },
  }),
]

/* ── 07 Mode dial ────────────────────────────────────────────────────────────────────── */

const dial = archetype(ModeDial, {
  name: 'Mode dial',
  hint: 'Drag around the dial or click a position; arrows, Home and End step through it',
  why: 'A dial shows every mode at once and which one is live; a sentence names one at a time.',
  tags: ['dial', 'selector', 'mode', 'rotary'],
})

const dials: MoodEntry[] = [
  dial({
    id: 'tune-dial-camera',
    size: '1x1',
    domain: 'media',
    surface: 'dark',
    name: 'Camera mode',
    tags: ['camera', 'exposure'],
    props: {
      label: 'Mode',
      value: 2,
      positions: [
        { label: 'Auto', dial: 'AUTO', note: 'Camera decides' },
        { label: 'Program', dial: 'P', note: 'Shiftable auto' },
        { label: 'Aperture priority', dial: 'A', note: 'Aperture priority' },
        { label: 'Shutter priority', dial: 'S', note: 'Shutter priority' },
        { label: 'Manual', dial: 'M', note: 'Full manual' },
        { label: 'Video', dial: 'VIDEO', note: '4K at 25 fps' },
      ],
    },
  }),
  dial({
    id: 'tune-dial-pump',
    size: '1x1',
    domain: 'civic',
    surface: 'muted',
    name: 'Pump selector',
    tags: ['flood', 'pump', 'hand-off-auto'],
    props: {
      label: 'Pump 4 · Pluit',
      value: 2,
      sweep: 90,
      positions: [
        { label: 'Hand', dial: 'HAND', note: 'Runs, ignores the level' },
        { label: 'Off', dial: 'OFF', note: 'Stopped and locked' },
        { label: 'Auto', dial: 'AUTO', note: 'On at 2.4 m, off 1.1 m' },
      ],
    },
  }),
  dial({
    id: 'tune-dial-room',
    size: '2x1',
    domain: 'workspace',
    name: 'Room scene',
    tags: ['meeting room', 'lights'],
    props: {
      label: 'Room 7.02 · Rinjani',
      value: 2,
      legend: true,
      positions: [
        { label: 'Off', dial: '0', note: 'Everything off' },
        { label: 'Present', dial: '1', note: 'Lights 70%, blinds half' },
        { label: 'Video call', dial: '2', note: 'Lights 90%, camera on' },
        { label: 'Workshop', dial: '3', note: 'All lights, walls lit' },
      ],
    },
  }),
  dial({
    id: 'tune-dial-washer',
    size: '1x1',
    domain: 'home',
    name: 'Washing programme',
    tags: ['laundry', 'appliance'],
    props: {
      label: 'Programme',
      value: 3,
      positions: [
        { label: 'Rinse', note: 'Rinse · 20 min' },
        { label: 'Quick', note: 'Quick · 30 min' },
        { label: 'Cotton', note: 'Cotton · 2 h 10 min' },
        { label: 'Eco', note: 'Eco · 3 h 10 min' },
        { label: 'Wool', note: 'Wool · 40 min' },
        { label: 'Spin', note: 'Spin · 12 min' },
      ],
    },
  }),
]

/* ── 08 Jog wheel ────────────────────────────────────────────────────────────────────── */

const jog = archetype(JogWheel, {
  name: 'Jog wheel',
  hint: 'Turn the wheel around its centre, use the arrow keys (Shift for ten, Page keys for a minute), or click the strip',
  why: 'Finding the exact frame or second is a feel for motion, not a timestamp anyone can say in advance.',
  tags: ['jog', 'scrub', 'wheel', 'time'],
})

const jogs: MoodEntry[] = [
  jog({
    id: 'tune-jog-timecode',
    size: '2x2',
    domain: 'media',
    surface: 'dark',
    name: 'Timecode jog',
    tags: ['edit', 'video', 'frame'],
    props: {
      eyebrow: 'Edit · Episode 12',
      meta: '25 fps',
      kind: 'timecode',
      fps: 25,
      length: 24 * 60 * 25,
      value: 12 * 60 * 25 + 4 * 25 + 17,
      pixel: true,
    },
  }),
  jog({
    id: 'tune-jog-cctv',
    size: '2x2',
    domain: 'security',
    surface: 'dark',
    name: 'Footage scrub',
    tags: ['cctv', 'playback'],
    props: {
      eyebrow: 'Cam 07 · loading dock',
      meta: 'Night of 11 Nov',
      kind: 'clock',
      from: 0,
      length: 6 * 3600,
      value: 2 * 3600 + 14 * 60 + 7,
      events: [1920, 4410, 8047, 8260, 11530, 15880, 19210],
      eventLabel: 'Motion',
    },
  }),
  jog({
    id: 'tune-jog-logs',
    size: '3x2',
    domain: 'devops',
    name: 'Log scrub',
    tags: ['incident', 'logs'],
    props: {
      eyebrow: 'Incident 2291 · payments-core',
      meta: '12 Nov',
      kind: 'log',
      from: 14 * 3600,
      length: 1800,
      value: 131,
      events: [131, 132, 175, 262],
      lines: [
        { t: 4, level: 'INFO', service: 'ledger', text: 'Batch 8812 committed, 1,204 rows' },
        { t: 61, level: 'INFO', service: 'auth', text: 'Token refresh rate normal' },
        { t: 97, level: 'WARN', service: 'payments-core', text: 'p95 412 ms, over the 300 ms target' },
        { t: 131, level: 'ERROR', service: 'payments-core', text: 'Bank gateway timed out after 5,000 ms' },
        { t: 132, level: 'ERROR', service: 'api-gateway', text: '503 on POST /v1/transfers, 38 in 1 s' },
        { t: 160, level: 'INFO', service: 'payments-core', text: 'Circuit open, retries paused' },
        { t: 175, level: 'ERROR', service: 'settlement', text: 'Batch 0412 waiting on payments-core' },
        { t: 214, level: 'WARN', service: 'risk-engine', text: 'Queue depth 4,812' },
        { t: 262, level: 'ERROR', service: 'notifications', text: 'Push failed for 212 transfers' },
        { t: 380, level: 'INFO', service: 'payments-core', text: 'Circuit half open, 1 in 10 let through' },
        { t: 465, level: 'INFO', service: 'payments-core', text: 'Recovered, p95 188 ms' },
        { t: 720, level: 'INFO', service: 'settlement', text: 'Batch 0412 settled, IDR 4.82 bn' },
        { t: 1310, level: 'INFO', service: 'notifications', text: 'Backlog of 212 pushes sent' },
      ],
    },
  }),
]

/* ── 09 Limit slider ─────────────────────────────────────────────────────────────────── */

const limit = archetype(LimitSlider, {
  name: 'Limit slider',
  hint: 'Drag the thumb or use the arrow keys; the consequence updates as it moves',
  why: 'Sliding a limit while its consequence updates shows where the trade-off sits; a typed number hides it.',
  tags: ['slider', 'limit', 'consequence'],
})

/** Replicas that keep 8.4 vCPU of peak load under the target. */
const replicasAt = (target: number) => Math.ceil(Math.round((840 / target) * 1000) / 1000)

const limits: MoodEntry[] = [
  limit({
    id: 'tune-slider-transfer',
    size: '2x1',
    domain: 'banking',
    name: 'Daily transfer limit',
    tags: ['limits', 'transfers'],
    props: {
      label: 'Daily transfer limit',
      min: 0,
      max: 100_000_000,
      step: 1_000_000,
      value: 25_000_000,
      format: rp,
      marks: [
        { value: 0, label: '0' },
        { value: 25_000_000, label: '25 M' },
        { value: 50_000_000, label: '50 M' },
        { value: 100_000_000, label: '100 M' },
      ],
      figure: (v: number) => ({ label: 'Left today', value: rp(Math.max(0, v - 4_200_000)) }),
      say: (v: number) =>
        v === 0
          ? { text: 'Transfers stop until it is raised', badge: 'Paused', tone: 'danger' as const }
          : v > 50_000_000
            ? { text: 'Above Rp 50.000.000', badge: 'Second approver', tone: 'warning' as const }
            : { text: 'From 00:00 WIB tomorrow' },
    },
  }),
  limit({
    id: 'tune-slider-shipping',
    size: '2x1',
    domain: 'commerce',
    name: 'Free shipping threshold',
    tags: ['shop', 'promotion'],
    props: {
      label: 'Free shipping from',
      min: 0,
      max: 500_000,
      step: 25_000,
      value: 150_000,
      format: rp,
      marks: [
        { value: 0, label: '0' },
        { value: 100_000, label: '100K' },
        { value: 250_000, label: '250K' },
        { value: 500_000, label: '500K' },
      ],
      figure: (v: number) => ({ label: 'Orders that qualify', value: `${Math.round(100 / (1 + (v / 180_000) ** 2.2))}%` }),
      say: (v: number) => {
        const cost = 48_000 * (1 / (1 + (v / 180_000) ** 2.2)) * 14_000
        return cost > 450e6
          ? { text: `${idr(cost)} a month`, badge: 'Over budget', tone: 'warning' as const }
          : { text: `${idr(cost)} a month in postage` }
      },
    },
  }),
  limit({
    id: 'tune-slider-speed',
    size: '2x1',
    domain: 'logistics',
    name: 'Fleet speed limit',
    tags: ['trucks', 'fuel', 'toll'],
    props: {
      label: 'Truck speed limit',
      min: 60,
      max: 100,
      step: 5,
      value: 80,
      unit: 'km/h',
      marks: [
        { value: 60, label: '60' },
        { value: 80, label: '80' },
        { value: 100, label: '100' },
      ],
      figure: (v: number) => ({ label: 'Jakarta–Surabaya', value: duration(780 / (0.82 * v)) }),
      say: (v: number) => {
        const litres = 780 / (4.6 - (v - 60) * 0.03)
        return v > 80
          ? { text: `Diesel ${rp(Math.round(litres * 6800))} a trip`, badge: 'Over truck limit', tone: 'danger' as const }
          : { text: `Diesel ${rp(Math.round(litres * 6800))} a trip` }
      },
    },
  }),
  limit({
    id: 'tune-slider-autoscale',
    size: '2x1',
    domain: 'devops',
    name: 'Autoscale target',
    tags: ['kubernetes', 'cost', 'capacity'],
    props: {
      label: 'Target CPU · payments-core',
      min: 30,
      max: 90,
      step: 5,
      value: 60,
      unit: '%',
      marks: [
        { value: 30, label: '30' },
        { value: 50, label: '50' },
        { value: 70, label: '70' },
        { value: 90, label: '90' },
      ],
      figure: (v: number) => ({ label: 'At today’s peak', value: String(replicasAt(v)), unit: 'replicas' }),
      say: (v: number) => {
        const cost = usd(replicasAt(v) * 38)
        return v > 80
          ? { text: `${cost} a month`, badge: 'Little headroom', tone: 'warning' as const }
          : { text: `${cost} a month` }
      },
    },
  }),
  limit({
    id: 'tune-slider-reserve',
    size: '2x1',
    domain: 'aerospace',
    name: 'Return-home reserve',
    tags: ['drone', 'battery', 'survey'],
    props: {
      label: 'Return-home reserve · Merapi survey',
      min: 15,
      max: 50,
      step: 1,
      value: 25,
      unit: '%',
      marks: [
        { value: 15, label: '15' },
        { value: 25, label: '25' },
        { value: 50, label: '50' },
      ],
      figure: (v: number) => ({ label: 'On station', value: String(Math.max(0, Math.round((100 - v - 22) * 0.38))), unit: 'min' }),
      say: (v: number) =>
        v < 20
          ? { text: `Lands with about ${v - 11}%`, badge: 'Thin in crater wind', tone: 'warning' as const }
          : { text: `Turns back at ${v}%, lands with about ${v - 11}%` },
    },
  }),
]

/* ── 10 Range window ─────────────────────────────────────────────────────────────────── */

const range = archetype(RangeWindow, {
  name: 'Range window',
  hint: 'Drag either thumb, drag between them to slide the window, or use the arrow keys on a thumb',
  why: 'Two thumbs over the distribution show what a window keeps before anyone commits to it.',
  tags: ['range', 'slider', 'window', 'histogram'],
})

const departures = Array.from({ length: 36 }, (_, i) => {
  const h = 5 + i / 2
  return h < 6 ? 3 : h < 9.5 ? 6 : h < 16 ? 3 : h < 19.5 ? 6 : h < 21 ? 4 : 2
})

const ranges: MoodEntry[] = [
  range({
    id: 'tune-range-price',
    size: '2x1',
    domain: 'commerce',
    name: 'Price window',
    tags: ['shop', 'filter', 'price'],
    props: {
      label: 'Batik tulis · price',
      min: 0,
      max: 1_000_000,
      step: 10_000,
      value: [150_000, 450_000],
      bins: bell('tune-batik', 25, 7, 4, 120, 0.8),
      format: rp,
      noun: 'pieces',
      thumbs: ['Lowest price', 'Highest price'],
      scale: ['0', '500K', '1M'],
    },
  }),
  range({
    id: 'tune-range-departures',
    size: '3x1',
    domain: 'transit',
    name: 'Departure window',
    tags: ['trains', 'timetable', 'time'],
    props: {
      label: 'Manggarai → Bogor · departures',
      min: 300,
      max: 1380,
      step: 15,
      value: [390, 540],
      bins: departures,
      format: clock,
      noun: 'trains',
      thumbs: ['Earliest', 'Latest'],
      scale: ['05:00', '14:00', '23:00'],
      note: (inside: number, _t: number, lo: number, hi: number) => (inside ? `One every ${Math.round((hi - lo) / inside)} min on average` : 'No trains in this window'),
    },
  }),
  range({
    id: 'tune-range-glucose',
    size: '2x1',
    domain: 'health',
    name: 'Glucose target range',
    tags: ['cgm', 'diabetes', 'target'],
    props: {
      label: 'Target range · mg/dL',
      min: 40,
      max: 300,
      step: 5,
      value: [70, 180],
      bins: bell('tune-cgm', 26, 9.5, 4.2, 95, 0.5),
      thumbs: ['Low target', 'High target'],
      scale: ['40', '170', '300'],
      figure: (inside: number, total: number) => {
        const share = Math.round((inside / total) * 100)
        return { label: 'Time in range', value: String(share), unit: '%', word: share >= 70 ? 'On target' : 'Below goal', tone: share >= 70 ? 'success' : 'warning' }
      },
    },
  }),
  range({
    id: 'tune-range-fxband',
    size: '2x2',
    domain: 'banking',
    surface: 'muted',
    name: 'Rate alert band',
    tags: ['fx', 'alert', 'treasury'],
    props: {
      label: 'USD/IDR · alert band',
      min: 15_800,
      max: 16_800,
      step: 10,
      value: [16_150, 16_450],
      bins: bell('tune-usdidr', 50, 24, 7, 9, 0.2),
      thumbs: ['Alert below', 'Alert above'],
      scale: ['15,800', '16,300', '16,800'],
      figure: (inside: number, total: number) => ({ label: 'Inside the band', value: `${inside}`, unit: `of ${total} days` }),
      note: (inside: number, total: number) => `Would have alerted on ${total - inside} days`,
    },
  }),
  range({
    id: 'tune-range-moisture',
    size: '2x1',
    domain: 'agri',
    name: 'Soil moisture band',
    tags: ['irrigation', 'sensor', 'pump'],
    props: {
      label: 'Soil moisture · Blok C',
      min: 10,
      max: 60,
      step: 1,
      value: [28, 42],
      bins: bell('tune-soil', 25, 12, 3.6, 60, 0.2),
      format: (v: number) => `${v}%`,
      thumbs: ['Pump on below', 'Pump off at'],
      scale: ['10%', '35%', '60%'],
      figure: (_i: number, _t: number, lo: number, hi: number) => ({ label: 'Pump runs about', value: String(Math.max(1, Math.round(42 / (hi - lo)))), unit: 'times a day' }),
    },
  }),
]

/* ── 11 Tuning tape ──────────────────────────────────────────────────────────────────── */

const tape = archetype(TuningTape, {
  name: 'Tuning tape',
  hint: 'Drag the tape sideways, click a mark, scroll while focused, or use the arrow keys',
  why: 'Tuning is a search: the scale passes under the index and the hand stops where it is right.',
  tags: ['tape', 'tuner', 'scale', 'scrub'],
})

const uhfPresets = [
  { label: 'Guard', value: 243 },
  { label: 'Tower', value: 251.4 },
  { label: 'Ops 2', value: 311.2 },
]
const headways = [3, 4, 5, 6, 8, 10, 12, 15]
const tenorRates = [3.25, 3.5, 3.75, 4, 4.25]

const tapes: MoodEntry[] = [
  tape({
    id: 'tune-tape-uhf',
    size: '3x1',
    domain: 'defense',
    name: 'Radio tuner',
    tags: ['radio', 'frequency'],
    props: {
      label: 'UHF · radio 2',
      min: 225,
      max: 399.975,
      step: 0.025,
      value: 243,
      px: 3,
      tickEvery: 4,
      labelEvery: 40,
      unit: 'MHz',
      font: 'pixel',
      format: (v: number) => v.toFixed(3),
      mark: (v: number) => v.toFixed(0),
      presets: uhfPresets,
      note: (v: number) => {
        const p = uhfPresets.find((x) => Math.abs(x.value - v) < 0.0125)
        return p ? (p.label === 'Guard' ? 'Guard, for emergencies only' : `${p.label} channel`) : 'Not a stored channel'
      },
    },
  }),
  tape({
    id: 'tune-tape-heading',
    size: '1x1',
    domain: 'aerospace',
    surface: 'dark',
    name: 'Heading bug',
    tags: ['autopilot', 'cockpit'],
    props: {
      label: 'Heading',
      min: 0,
      max: 359,
      step: 1,
      value: 274,
      px: 4,
      tickEvery: 5,
      labelEvery: 10,
      wrap: true,
      unit: '°',
      size: 'sm',
      format: pad3,
      mark: (v: number) => (v % 90 === 0 ? ['N', 'E', 'S', 'W'][v / 90] : String(v / 10)),
      note: (v: number) => {
        const d = ((v - 262 + 540) % 360) - 180
        return d === 0 ? 'On heading' : `Turn ${d > 0 ? 'right' : 'left'} ${Math.abs(d)}°`
      },
    },
  }),
  tape({
    id: 'tune-tape-speedzone',
    size: '2x1',
    domain: 'civic',
    name: 'Speed limit by street',
    tags: ['traffic', 'road safety'],
    props: {
      label: 'Speed limit · Jl. Diponegoro',
      value: 1,
      unit: 'km/h',
      stops: ['20', '30', '40', '50', '60', '80'].map((label) => ({ label })),
      note: (i: number) =>
        ['Shared street, people first', 'Settlement area', 'School zone hours', 'Urban road maximum', 'Arterial, outside the city', 'Highway maximum'][i],
    },
  }),
  tape({
    id: 'tune-tape-headway',
    size: '2x1',
    domain: 'transit',
    name: 'Headway',
    tags: ['trains', 'frequency'],
    props: {
      label: 'Headway · Bogor line, peak',
      value: 2,
      unit: 'min',
      stops: headways.map((m) => ({ label: String(m) })),
      note: (i: number) => `${Math.round(60 / headways[i])} trains an hour, ${Math.ceil(140 / headways[i])} trainsets`,
    },
  }),
  tape({
    id: 'tune-tape-tenor',
    size: '1x1',
    domain: 'banking',
    name: 'Deposit tenor',
    tags: ['deposit', 'savings', 'rate'],
    props: {
      label: 'Tenor',
      value: 3,
      unit: 'months',
      size: 'sm',
      stops: ['1', '3', '6', '12', '24'].map((label) => ({ label })),
      note: (i: number) => `${tenorRates[i].toFixed(2)}% a year`,
    },
  }),
]

/* ── 12 Split bar ────────────────────────────────────────────────────────────────────── */

const split = archetype(SplitBar, {
  name: 'Split bar',
  hint: 'Drag a divider, or focus it and use the arrow keys; double-click a divider to even out its neighbours',
  why: 'Moving a divider keeps the parts adding up to the whole; three spoken percentages do not.',
  tags: ['split', 'allocation', 'divider'],
})

const splits: MoodEntry[] = [
  split({
    id: 'tune-split-canary',
    size: '2x1',
    domain: 'devops',
    surface: 'dark',
    name: 'Canary traffic',
    tags: ['deploy', 'rollout', 'traffic'],
    props: {
      label: 'payments-core v2.41',
      totalText: '12,840 req/s',
      parts: [
        { label: 'Stable', value: 90 },
        { label: 'Canary', value: 10 },
      ],
      amount: (s: number) => `${num((12_840 * s) / 100)} req/s`,
      note: (s: number[]) =>
        s[1] === 0
          ? { text: 'Canary gets no traffic', word: 'Paused', tone: 'warning' as const }
          : { text: 'Errors 0.12% on canary, 0.10% stable', word: 'Healthy', tone: 'success' as const },
    },
  }),
  split({
    id: 'tune-split-pockets',
    size: '3x1',
    domain: 'banking',
    surface: 'brand',
    name: 'Salary pockets',
    tags: ['salary', 'savings', 'budget'],
    props: {
      label: 'Salary · 25 Nov',
      totalText: 'Rp 12.500.000',
      parts: [
        { label: 'Tabungan', value: 30 },
        { label: 'Belanja', value: 50 },
        { label: 'Darurat', value: 20 },
      ],
      least: 5,
      amount: (s: number) => rp((12_500_000 * s) / 100),
      note: (s: number[]) => ({ text: `Darurat reaches Rp 30.000.000 in ${Math.ceil(30_000_000 / ((12_500_000 * s[2]) / 100))} months` }),
    },
  }),
  split({
    id: 'tune-split-feed',
    size: '3x1',
    domain: 'agri',
    surface: 'muted',
    name: 'Feed mix',
    tags: ['poultry', 'ration', 'protein'],
    props: {
      label: 'Broiler grower feed',
      totalText: '1,000 kg batch',
      parts: [
        { label: 'Corn', value: 58 },
        { label: 'Soybean meal', value: 30 },
        { label: 'Rice bran', value: 12 },
      ],
      least: 2,
      amount: (s: number) => `${num(s * 10)} kg`,
      note: (s: number[]) => {
        const protein = (s[0] * 8.5 + s[1] * 44 + s[2] * 12.5) / 100
        const ok = protein >= 19 && protein <= 21
        return {
          text: `Crude protein ${protein.toFixed(1)}%, grower target 19–21%`,
          word: ok ? 'In range' : protein < 19 ? 'Too low' : 'Too high',
          tone: ok ? ('success' as const) : ('warning' as const),
        }
      },
    },
  }),
  split({
    id: 'tune-split-week',
    size: '4x1',
    domain: 'workspace',
    name: 'Week split',
    tags: ['calendar', 'focus', 'time'],
    props: {
      label: 'Your week · Rina Hartono',
      totalText: '40 h',
      parts: [
        { label: 'Focus', value: 40 },
        { label: 'Meetings', value: 35 },
        { label: 'Admin', value: 15 },
        { label: 'Learning', value: 10 },
      ],
      least: 5,
      amount: (s: number) => `${num((40 * s) / 100, 1)} h`,
      note: (s: number[]) =>
        s[0] < 30
          ? { text: `Only ${num((40 * s[0]) / 100, 0)} h of focus held in the calendar`, word: 'Little focus', tone: 'warning' as const }
          : { text: `${num((40 * s[0]) / 100, 0)} h of focus held in the calendar, mornings first` },
    },
  }),
]

/* ── 13 Notched lever ────────────────────────────────────────────────────────────────── */

const lever = archetype(NotchLever, {
  name: 'Notched lever',
  hint: 'Drag the handle, click a notch, or use the arrow keys; Home and End go to the ends',
  why: 'A lever with notches is felt, not read: one position per notch, the order fixed, nothing in between.',
  tags: ['lever', 'notch', 'detent'],
})

const trainAccel = [3, 2.4, 1.8, 1, -0.1, -0.6, -1.2, -1.8, -2.4, -3, -3.6, -4.2, -4.8]
const tapKv = (i: number) => 20 * (1 + (8 - i) * 0.0125)
const levers: MoodEntry[] = [
  lever({
    id: 'tune-lever-train',
    size: '1x3',
    domain: 'transit',
    surface: 'dark',
    name: 'Master controller',
    tags: ['train', 'cab', 'live'],
    props: {
      label: 'KRL 1204 · controller',
      value: 4,
      speed: 46,
      accel: trainAccel,
      notches: ['P4', 'P3', 'P2', 'P1', 'N', 'B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'EB'].map((label, i) => ({
        label,
        group: label === 'N' || label === 'EB' ? '' : label === 'B1' ? 'Brake' : undefined,
        note:
          label === 'N'
            ? 'Coasting'
            : label === 'EB'
              ? 'Emergency brake'
              : trainAccel[i] > 0
                ? `Power, ${trainAccel[i].toFixed(1)} km/h/s`
                : `Brake, ${(-trainAccel[i]).toFixed(1)} km/h/s`,
        tone: label === 'EB' ? ('danger' as const) : undefined,
      })),
    },
  }),
  lever({
    id: 'tune-lever-flaps',
    size: '1x2',
    domain: 'aerospace',
    name: 'Flap lever',
    tags: ['cockpit', 'flaps'],
    props: {
      label: 'Flaps · PK-NAJ',
      value: 2,
      notches: [
        { label: 'Up', note: 'Clean, 250 kt max' },
        { label: '1', note: '230 kt max' },
        { label: '5', note: '220 kt max' },
        { label: '15', note: 'Take-off, 200 kt max' },
        { label: '30', note: 'Landing, 175 kt max' },
      ],
    },
  }),
  lever({
    id: 'tune-lever-telegraph',
    size: '1x3',
    domain: 'logistics',
    surface: 'muted',
    name: 'Engine telegraph',
    tags: ['ship', 'port', 'engine'],
    props: {
      label: 'MV Samudra 7',
      value: 4,
      unit: 'rpm',
      readout: (i: number) => ['96', '78', '55', '35', '0', '35', '55', '78', '96'][i],
      notches: [
        { label: 'Full', note: 'Full ahead' },
        { label: 'Half', note: 'Half ahead' },
        { label: 'Slow', note: 'Slow ahead' },
        { label: 'Dead slow', note: 'Dead slow ahead' },
        { label: 'Stop', group: 'Ahead', note: 'Stop' },
        { label: 'Dead slow', group: 'Astern', note: 'Dead slow astern' },
        { label: 'Slow', note: 'Slow astern' },
        { label: 'Half', note: 'Half astern' },
        { label: 'Full', note: 'Full astern' },
      ],
    },
  }),
  lever({
    id: 'tune-lever-tap',
    size: '1x2',
    domain: 'energy',
    name: 'Tap changer',
    tags: ['transformer', 'voltage', 'grid'],
    props: {
      label: 'Trafo 2 · GI Cawang',
      value: 8,
      unit: 'kV',
      readout: (i: number) => tapKv(i).toFixed(2),
      notches: Array.from({ length: 17 }, (_, i) => {
        const kv = tapKv(i)
        return {
          label: String(i + 1),
          note: kv > 21 ? `Tap ${i + 1}, above 21 kV` : kv < 19 ? `Tap ${i + 1}, below 19 kV` : `Tap ${i + 1}, inside 20 kV ± 5%`,
          tone: kv > 21 || kv < 19 ? ('warning' as const) : undefined,
        }
      }),
    },
  }),
]

/* ── 14 Stepper ──────────────────────────────────────────────────────────────────────── */

const stepper = archetype(Stepper, {
  name: 'Stepper',
  hint: 'Press minus or plus and hold to run; arrows, Page keys, Home and End on the value',
  why: 'Small counts are nudged one at a time while the consequence updates; the hand stops at the right one.',
  tags: ['stepper', 'count', 'spin'],
})

const steppers: MoodEntry[] = [
  stepper({
    id: 'tune-stepper-replicas',
    size: '2x1',
    domain: 'devops',
    name: 'Replica count',
    tags: ['scale', 'cost'],
    props: {
      label: 'Replicas · search',
      value: 6,
      min: 1,
      max: 24,
      pips: true,
      wide: true,
      note: (v: number) => ({
        text: `${usd(v * 38)} a month · ${num(v * 420)} req/s`,
        word: v < 4 ? 'Below peak load' : undefined,
        tone: 'warning' as const,
      }),
    },
  }),
  stepper({
    id: 'tune-stepper-desks',
    size: '1x1',
    domain: 'workspace',
    surface: 'muted',
    name: 'Desk booking',
    tags: ['office', 'booking'],
    props: {
      label: 'Desks · Floor 7, Thu',
      value: 4,
      min: 1,
      max: 8,
      note: (v: number) => (v === 8 ? { text: 'Takes the last free desk', word: 'Floor full', tone: 'warning' as const } : `${8 - v} left on the floor`),
    },
  }),
  stepper({
    id: 'tune-stepper-beds',
    size: '1x1',
    domain: 'health',
    name: 'Beds open',
    tags: ['ward', 'staffing'],
    props: {
      label: 'Beds open · Ward 3',
      value: 24,
      min: 18,
      max: 32,
      note: (v: number) => {
        const nurses = Math.ceil(v / 4)
        return { text: `Needs ${nurses} nurses at 1:4`, word: nurses > 7 ? 'Short tonight' : undefined, tone: 'warning' as const }
      },
    },
  }),
  stepper({
    id: 'tune-stepper-formation',
    size: '1x1',
    domain: 'transit',
    name: 'Train formation',
    tags: ['train', 'capacity'],
    props: {
      label: 'Cars · KRL 1204',
      value: 10,
      allowed: [8, 10, 12],
      pips: true,
      note: (v: number) => `${num(v * 250)} riders at crush load`,
    },
  }),
  stepper({
    id: 'tune-stepper-instalments',
    size: '1x1',
    domain: 'payments',
    name: 'Instalments',
    tags: ['paylater', 'checkout'],
    props: {
      label: 'Pay over · months',
      value: 3,
      allowed: [1, 3, 6, 12],
      note: (v: number) => {
        if (v === 1) return 'Rp 3.250.000 today'
        const fee = v === 3 ? 0 : v === 6 ? 0.0295 : 0.059
        const monthly = Math.ceil((3_250_000 * (1 + fee)) / v / 100) * 100
        return { text: `${rp(monthly)} a month`, word: fee === 0 ? 'No interest' : `${(fee * 100).toFixed(2)}% fee`, tone: fee === 0 ? ('success' as const) : undefined }
      },
    },
  }),
]

/* ── 15 Mode switch ──────────────────────────────────────────────────────────────────── */

const mode = archetype(ModeSwitch, {
  name: 'Mode switch',
  hint: 'Pick a mode with a click or the arrow keys; the figure shows what it costs',
  why: 'Modes side by side, each with what it costs, are compared at a look instead of asked about one by one.',
  tags: ['segmented', 'mode', 'choice'],
})

const modes: MoodEntry[] = [
  mode({
    id: 'tune-mode-charging',
    size: '1x1',
    domain: 'energy',
    name: 'Charging mode',
    tags: ['ev', 'tariff'],
    props: {
      label: 'EV · tonight',
      value: 'eco',
      modes: [
        { value: 'eco', label: 'Eco', caption: 'Full by', figure: '06:40', detail: 'Rp 42.500, off-peak' },
        { value: 'solar', label: 'Solar', caption: 'Full by', figure: '15:10', detail: 'Rp 6.200, from the roof' },
        { value: 'fast', label: 'Fast', caption: 'Full by', figure: '23:55', detail: 'Rp 60.700, 11 kW now' },
      ],
    },
  }),
  mode({
    id: 'tune-mode-settlement',
    size: '2x1',
    domain: 'payments',
    name: 'Settlement speed',
    tags: ['merchant', 'payout', 'fees'],
    props: {
      label: 'Payouts · Toko Kelontong Bu Ratna',
      value: 'same',
      modes: [
        { value: 'instant', label: 'Instant', caption: 'Fee', figure: '0.7', unit: '%', detail: 'Within a minute · Rp 18.900 on today’s sales' },
        { value: 'same', label: 'Same day', caption: 'Fee', figure: '0.3', unit: '%', detail: 'Lands 17:00 WIB · Rp 8.100 on today’s sales' },
        { value: 'next', label: 'Next day', caption: 'Fee', figure: '0', unit: '%', detail: 'Lands 09:00 WIB tomorrow, no fee', word: 'Free', tone: 'success' },
      ],
    },
  }),
  mode({
    id: 'tune-mode-posture',
    size: '2x1',
    domain: 'security',
    surface: 'dark',
    name: 'Sign-in policy',
    tags: ['identity', 'mfa', 'policy'],
    props: {
      label: 'Sign-in policy · workspace',
      value: 'standard',
      modes: [
        { value: 'open', label: 'Open', caption: 'Sign-ins challenged', figure: '0.4', unit: '%', detail: 'Password on known devices', word: 'Weak', tone: 'warning' },
        { value: 'standard', label: 'Standard', caption: 'Sign-ins challenged', figure: '2.1', unit: '%', detail: 'Step-up for new devices and countries' },
        { value: 'strict', label: 'Strict', caption: 'Sign-ins challenged', figure: '6.8', unit: '%', detail: 'Passkey every time, no SMS', word: 'More tickets', tone: 'warning' },
      ],
    },
  }),
  mode({
    id: 'tune-mode-density',
    size: '2x2',
    domain: 'rapi',
    surface: 'brand',
    name: 'Table density',
    tags: ['density', 'table', 'language'],
    props: {
      label: 'Row density',
      value: 'comfortable',
      modes: [
        { value: 'compact', label: 'Compact', caption: 'Rows of 32 px', figure: '', detail: 'For dense desks: treasury, the SOC floor', row: 32 },
        { value: 'comfortable', label: 'Comfortable', caption: 'Rows of 40 px', figure: '', detail: 'The default for reading and review', row: 40 },
      ],
      table: {
        columns: ['Account', 'Owner', 'Balance'],
        rows: [
          ['Operating', 'Ayu Lestari', 'IDR 4.82 bn'],
          ['Payroll', 'Sari Wulandari', 'IDR 1.20 bn'],
          ['Escrow', 'Dewi Anggraini', 'IDR 640 M'],
          ['USD clearing', 'Grace Liu', 'USD 1.84 M'],
          ['SGD float', 'Grace Liu', 'SGD 412K'],
          ['Tax reserve', 'Maya Kartika', 'IDR 310 M'],
          ['Refunds', 'Putri Maharani', 'IDR 86 M'],
          ['Petty cash', 'Lina Wijaya', 'IDR 12 M'],
        ],
      },
    },
  }),
]

/* ── 16 Toggle bank ──────────────────────────────────────────────────────────────────── */

const toggles = archetype(ToggleBank, {
  name: 'Toggle bank',
  hint: 'Flip any switch with a click or Space; the line at the bottom says what the set means',
  why: 'A bank of switches shows every on and off at once, and flips one without a conversation.',
  tags: ['switch', 'toggle', 'settings'],
})

const regionShare = [0.62, 0.21, 0.09, 0.08]
const checkoutShare = [0.46, 0.21, 0.18, 0.15]
const toggleBanks: MoodEntry[] = [
  toggles({
    id: 'tune-toggles-card',
    size: '2x2',
    domain: 'banking',
    name: 'Card controls',
    tags: ['card', 'controls'],
    props: {
      eyebrow: 'Card ···· 4417 · Arunika Bank',
      items: [
        { label: 'Online payments', description: 'Marketplaces and subscriptions', on: true },
        { label: 'Contactless', description: 'Tap to pay up to Rp 1.000.000', on: true },
        { label: 'ATM withdrawals', description: 'Up to Rp 10.000.000 a day', on: false },
        { label: 'Use abroad', description: 'Outside Indonesia', on: false },
      ],
      summary: (on: boolean[]) => {
        const ways = [on[0] && 'online', on[1] && 'by tap', on[2] && 'at ATMs'].filter(Boolean) as string[]
        if (!ways.length) return { text: 'The card is frozen; nothing goes through', word: 'Frozen', tone: 'danger' as const }
        return { text: `Works ${ways.join(', ')}, ${on[3] ? 'in Indonesia and abroad' : 'in Indonesia only'}` }
      },
    },
  }),
  toggles({
    id: 'tune-toggles-flags',
    size: '2x2',
    domain: 'devops',
    surface: 'dark',
    name: 'Feature flag by region',
    tags: ['flag', 'rollout', 'regions'],
    props: {
      eyebrow: 'Flag · new-checkout',
      items: [
        { label: 'ap-southeast-3', description: 'Jakarta', on: true, share: regionShare[0] },
        { label: 'ap-southeast-1', description: 'Singapore', on: true, share: regionShare[1] },
        { label: 'eu-west-1', description: 'Ireland', on: false, share: regionShare[2] },
        { label: 'us-east-1', description: 'Virginia', on: false, share: regionShare[3] },
      ],
      summary: (on: boolean[]) => {
        const share = Math.round(on.reduce((s, x, i) => s + (x ? regionShare[i] : 0), 0) * 100)
        return share === 100
          ? { text: 'Live for every buyer', word: 'Fully live', tone: 'success' as const }
          : share === 0
            ? { text: 'Off everywhere; the old checkout serves all' }
            : { text: `Live for ${share}% of buyers` }
      },
    },
  }),
  toggles({
    id: 'tune-toggles-signin',
    size: '1x2',
    domain: 'security',
    surface: 'muted',
    name: 'Sign-in methods',
    tags: ['identity', 'mfa'],
    props: {
      eyebrow: 'Sign-in',
      items: [
        { label: 'Passkey', on: true },
        { label: 'Authenticator', on: true },
        { label: 'SMS code', on: true },
        { label: 'Email link', on: false },
      ],
      summary: (on: boolean[]) => {
        if (!on.some(Boolean)) return { text: 'Nobody can sign in', word: 'Locked out', tone: 'danger' as const }
        if (!on[2]) return { text: '14 people use only SMS and need another way in', word: 'Action needed', tone: 'warning' as const }
        return { text: 'SMS stays on for the 14 people who rely on it' }
      },
    },
  }),
  toggles({
    id: 'tune-toggles-checkout',
    size: '2x1',
    domain: 'payments',
    name: 'Payment methods',
    tags: ['checkout', 'qris', 'methods'],
    props: {
      eyebrow: 'Checkout · PT Graha Niaga',
      columns: 2,
      items: [
        { label: 'QRIS', on: true },
        { label: 'Cards', on: true },
        { label: 'Virtual account', on: true },
        { label: 'Paylater', on: false },
      ],
      summary: (on: boolean[]) => {
        const share = Math.round(on.reduce((s, x, i) => s + (x ? checkoutShare[i] : 0), 0) * 100)
        return { text: `Covers ${share}% of buyers’ first choice`, word: share < 80 ? 'Losing buyers' : undefined, tone: 'warning' as const }
      },
    },
  }),
]

/* ── 17 XY pad ───────────────────────────────────────────────────────────────────────── */

const xy = archetype(XYPad, {
  name: 'XY pad',
  hint: 'Drag on the pad, or use the arrows on the handle (left and right for one value, up and down for the other); Home or double-click resets',
  why: 'Two values that act together are set together, with one point, instead of two sentences.',
  tags: ['xy', 'pad', 'two values'],
})

const signedInt = (v: number) => plusMinus(v, 0)
const xyPads: MoodEntry[] = [
  xy({
    id: 'tune-xy-light',
    size: '2x2',
    domain: 'home',
    name: 'Light warmth and level',
    tags: ['lights', 'colour temperature'],
    props: {
      label: 'Bedroom · ceiling light',
      backdrop: 'warmth',
      x: { label: 'Warmth', min: 2700, max: 6500, step: 100, value: 3000, format: (v: number) => `${num(v)} K`, ends: ['Warm', 'Cool'] },
      y: { label: 'Level', min: 0, max: 100, step: 1, value: 45, format: (v: number) => `${v}%`, ends: ['Dim', 'Bright'] },
      presets: [
        { label: 'Relax', x: 2700, y: 35 },
        { label: 'Read', x: 3500, y: 80 },
        { label: 'Focus', x: 5000, y: 100 },
      ],
      status: (_x: number, y: number) => ({ text: y ? `${num(Math.round(y * 11))} lm · ${((y / 100) * 9.5).toFixed(1)} W` : 'Off' }),
    },
  }),
  xy({
    id: 'tune-xy-thermal',
    size: '2x2',
    domain: 'defense',
    surface: 'dark',
    name: 'Thermal level and span',
    tags: ['thermal', 'camera', 'contrast'],
    props: {
      label: 'Thermal · mast camera',
      backdrop: 'thermal',
      x: { label: 'Level', min: 0, max: 60, step: 0.5, value: 30, format: (v: number) => `${v.toFixed(1)} °C`, ends: ['Cold', 'Hot'] },
      y: { label: 'Span', min: 2, max: 40, step: 0.5, value: 24, format: (v: number) => `${v.toFixed(1)} °C`, ends: ['Narrow', 'Wide'] },
      status: (x: number, y: number) => ({
        text: `White hot, ${minus(Math.round(x - y / 2))} to ${minus(Math.round(x + y / 2))} °C`,
        word: y < 6 ? 'High contrast' : undefined,
        tone: 'warning' as const,
      }),
    },
  }),
  xy({
    id: 'tune-xy-grade',
    size: '2x2',
    domain: 'media',
    name: 'White balance',
    tags: ['grade', 'colour', 'video'],
    props: {
      label: 'Grade · shot 14A',
      x: { label: 'Temp', min: -100, max: 100, step: 1, value: 12, format: signedInt, ends: ['Cool', 'Warm'] },
      y: { label: 'Tint', min: -100, max: 100, step: 1, value: -6, format: signedInt, ends: ['Green', 'Magenta'] },
      presets: [
        { label: 'Daylight', x: 0, y: 0 },
        { label: 'Tungsten', x: -45, y: 5 },
        { label: 'Shade', x: 30, y: 8 },
      ],
    },
  }),
  xy({
    id: 'tune-xy-load',
    size: '2x2',
    domain: 'logistics',
    surface: 'muted',
    name: 'Load centre of gravity',
    tags: ['truck', 'axle', 'load plan'],
    props: {
      label: 'Load plan · B 9612 UXT, 16 t',
      backdrop: 'truck',
      x: { label: 'Across', min: -1.2, max: 1.2, step: 0.05, value: 0.1, format: (v: number) => `${minus(v.toFixed(2))} m` },
      y: { label: 'From rear axle', min: -1, max: 7, step: 0.05, value: 1.1, format: (v: number) => `${minus(v.toFixed(2))} m` },
      status: (x: number, y: number) => {
        const front = 4 + 16 * (y / 6)
        const rear = 4 + 16 * (1 - y / 6)
        const text = `Front ${front.toFixed(1)} t · rear ${rear.toFixed(1)} t`
        if (front > 8) return { text, word: 'Front over 8 t', tone: 'danger' as const }
        if (rear > 18) return { text, word: 'Rear over 18 t', tone: 'danger' as const }
        if (Math.abs(x) > 0.3) return { text, word: 'Off centre', tone: 'warning' as const }
        return { text, word: 'Within limits', tone: 'success' as const }
      },
    },
  }),
]

/* ── 18 Joystick ─────────────────────────────────────────────────────────────────────── */

const stick = archetype(Joystick, {
  name: 'Joystick',
  hint: 'Drag the stick and let go, or hold the arrow keys on it (Shift for slow); Home and the preset keys jump',
  why: 'Pointing a camera or a crane is continuous steering; only a hand closes that loop fast enough.',
  tags: ['joystick', 'steer', 'rate'],
})

const deg = (v: number) => `${minus(Math.round(v))}°`
const sticks: MoodEntry[] = [
  stick({
    id: 'tune-stick-ptz',
    size: '2x2',
    domain: 'security',
    surface: 'dark',
    name: 'PTZ camera',
    tags: ['cctv', 'pan', 'tilt'],
    props: {
      label: 'PTZ · Gate 3',
      meta: 'Cam 04',
      view: 'ptz',
      x: { label: 'Pan', min: -170, max: 170, value: -20, rate: 40, format: deg },
      y: { label: 'Tilt', min: -45, max: 20, value: -12, rate: 20, format: deg },
      landmarks: [
        { label: 'Fence', at: -140 },
        { label: 'Gate', at: -20 },
        { label: 'Dock', at: 60 },
      ],
      presets: [
        { label: 'Gate', x: -20, y: -12 },
        { label: 'Dock', x: 60, y: -18 },
      ],
    },
  }),
  stick({
    id: 'tune-stick-crane',
    size: '2x2',
    domain: 'logistics',
    name: 'Quay crane',
    tags: ['port', 'crane', 'container'],
    props: {
      label: 'STS crane 4 · Tanjung Priok',
      meta: 'MV Samudra 7',
      view: 'crane',
      x: { label: 'Trolley', min: -20, max: 50, value: 32, rate: 6, format: (v: number) => `${minus(v.toFixed(1))} m` },
      y: { label: 'Hoist', min: 0, max: 40, value: 22, rate: 4, format: (v: number) => `${v.toFixed(1)} m` },
      presets: [
        { label: 'Quay', x: -12, y: 30 },
        { label: 'Bay 14', x: 38, y: 12 },
      ],
    },
  }),
  stick({
    id: 'tune-stick-antenna',
    size: '2x2',
    domain: 'aerospace',
    surface: 'dark',
    name: 'Antenna pointing',
    tags: ['ground station', 'satellite', 'tracking'],
    props: {
      label: 'Ground station · Biak',
      meta: 'Pass 0412',
      view: 'sky',
      x: { label: 'Az', min: 0, max: 360, value: 142, rate: 20, wrap: true, format: (v: number) => `${pad3(v)}°` },
      y: { label: 'El', min: 0, max: 90, value: 31, rate: 10, format: (v: number) => `${Math.round(v)}°` },
      target: { x: 150.5, y: 36.2, label: 'Nusa-2' },
      presets: [{ label: 'Stow', x: 0, y: 90 }],
    },
  }),
]

/* ── 19 Region handles ───────────────────────────────────────────────────────────────── */

const crop = archetype(CropRegion, {
  name: 'Region handles',
  hint: 'Drag inside to move, drag a corner to resize; with the region focused, arrows move it and + or − resize it',
  why: 'Framing is judged by eye; dragging the edges beats describing pixels.',
  tags: ['crop', 'region', 'frame', 'handles'],
})

const crops: MoodEntry[] = [
  crop({
    id: 'tune-crop-post',
    size: '2x2',
    domain: 'media',
    name: 'Crop for a post',
    tags: ['photo', 'aspect'],
    props: {
      label: 'Post · Pasar Beringharjo',
      meta: 'IMG_2041',
      source: { w: 6000, h: 4000 },
      region: { x: 0.3, y: 0.08, w: 0.448, h: 0.84 },
      aspects: [
        { label: '4:5', ratio: 0.8 },
        { label: '1:1', ratio: 1 },
        { label: '16:9', ratio: 16 / 9 },
        { label: 'Free', ratio: null },
      ],
      aspect: '4:5',
      scene: 'photo',
    },
  }),
  crop({
    id: 'tune-crop-motion',
    size: '3x2',
    domain: 'security',
    surface: 'dark',
    name: 'Motion zone',
    tags: ['cctv', 'alerts', 'zone'],
    props: {
      label: 'Motion zone · Cam 07',
      meta: 'Loading dock',
      source: { w: 1920, h: 1080 },
      region: { x: 0.12, y: 0.2, w: 0.5, h: 0.38 },
      scene: 'camera',
    },
  }),
  crop({
    id: 'tune-crop-photo',
    size: '2x2',
    domain: 'civic',
    name: 'ID photo crop',
    tags: ['e-ktp', 'passport', 'photo'],
    props: {
      label: 'ID photo · e-KTP renewal',
      meta: '3 × 4',
      source: { w: 2400, h: 3000 },
      region: { x: 0.125, y: 0.1, w: 0.75, h: 0.8 },
      aspects: [{ label: '3:4', ratio: 0.75 }],
      aspect: '3:4',
      scene: 'portrait',
    },
  }),
]

/* ── 20 Threshold on history ─────────────────────────────────────────────────────────── */

const threshold = archetype(ThresholdChart, {
  name: 'Threshold on history',
  hint: 'Drag the line or its tag, or focus the tag and use the arrow keys (Shift for ten steps)',
  why: 'Dragging a threshold over real history shows how often it would have fired before anyone gets paged.',
  tags: ['threshold', 'alert', 'chart', 'limit'],
})

const genuine = [2400, 1900, 1500, 1100, 800, 560, 380, 240, 140, 70]
const fraud = [12, 18, 26, 38, 56, 80, 110, 150, 190, 240]
const thresholds: MoodEntry[] = [
  threshold({
    id: 'tune-threshold-spo2',
    size: '2x2',
    domain: 'health',
    name: 'Alarm limit',
    tags: ['monitor', 'alarm fatigue', 'ward'],
    props: {
      kind: 'line',
      label: 'SpO₂ low alarm · Bed 12',
      meta: '22:00–06:00',
      data: spo2,
      direction: 'below',
      y: { min: 84, max: 100, ticks: [84, 88, 92, 96, 100] },
      x: {
        ticks: [
          { at: 0, label: '22:00' },
          { at: 24, label: '00:00' },
          { at: 48, label: '02:00' },
          { at: 72, label: '04:00' },
        ],
      },
      limit: { value: 90, min: 85, max: 96, step: 1, label: 'Alarm below', format: (v: number) => `${v}%` },
      say: (s: Record<string, number>) => ({
        text: s.episodes === 0 ? 'Would have stayed silent all night' : `Would have alarmed ${s.episodes} times tonight`,
        word: s.episodes > 6 ? 'Alarm fatigue' : undefined,
        tone: 'warning' as const,
      }),
    },
  }),
  threshold({
    id: 'tune-threshold-fraud',
    size: '3x2',
    domain: 'payments',
    name: 'Fraud cut-off',
    tags: ['risk', 'cards', 'histogram'],
    props: {
      kind: 'histogram',
      label: 'Risk score cut-off · card payments',
      meta: 'Last 30 days',
      data: genuine,
      data2: fraud,
      totals: [412_000, 1_000],
      names: ['Genuine', 'Fraud'],
      y: { min: 0, max: 2500, ticks: [0, 500, 1000, 1500, 2000, 2500], format: (v: number) => num(v) },
      x: {
        ticks: [
          { at: 0, label: '50' },
          { at: 2, label: '60' },
          { at: 4, label: '70' },
          { at: 6, label: '80' },
          { at: 8, label: '90' },
          { at: 10, label: '100' },
        ],
      },
      limit: { value: 80, min: 50, max: 100, step: 5, label: 'Block from score', format: (v: number) => `${v}` },
      say: (s: Record<string, number>) => ({
        text: `Blocks ${s.blocked.toFixed(2)}% of payments, catches ${Math.round(s.caught)}% of fraud`,
        word: s.blocked > 1 ? 'Many false blocks' : undefined,
        tone: 'warning' as const,
      }),
    },
  }),
  threshold({
    id: 'tune-threshold-river',
    size: '2x2',
    domain: 'civic',
    surface: 'muted',
    name: 'Flood alert level',
    tags: ['river', 'flood', 'sms'],
    props: {
      kind: 'line',
      label: 'Katulampa weir · SMS alert',
      meta: '5–11 Nov',
      data: river,
      y: { min: 0, max: 250, ticks: [0, 50, 100, 150, 200, 250] },
      x: {
        ticks: [
          { at: 0, label: '5 Nov' },
          { at: 24, label: '7 Nov' },
          { at: 48, label: '9 Nov' },
          { at: 72, label: '11 Nov' },
        ],
      },
      limit: { value: 150, min: 50, max: 240, step: 5, label: 'Alert at', format: (v: number) => `${v} cm` },
      say: (s: Record<string, number>) => ({
        text: s.episodes ? `${s.episodes} alerts to 21,400 people this week` : 'No alerts this week',
        word: s.threshold < 80 ? 'Siaga 4' : s.threshold < 150 ? 'Siaga 3' : s.threshold < 200 ? 'Siaga 2' : 'Siaga 1',
      }),
    },
  }),
  threshold({
    id: 'tune-threshold-reorder',
    size: '2x2',
    domain: 'commerce',
    name: 'Reorder point',
    tags: ['stock', 'inventory'],
    props: {
      kind: 'stock',
      label: 'Reorder point · Kopi Lereng 250 g',
      meta: '12 Oct–10 Nov',
      data: demand,
      stock: { start: 220, order: 300, lead: 5 },
      y: { min: 0, max: 400, ticks: [0, 100, 200, 300, 400] },
      x: {
        ticks: [
          { at: 0, label: '12 Oct' },
          { at: 10, label: '22 Oct' },
          { at: 20, label: '1 Nov' },
          { at: 29, label: '10 Nov' },
        ],
      },
      limit: { value: 90, min: 0, max: 300, step: 10, label: 'Reorder at', format: (v: number) => `${v} bags` },
      say: (s: Record<string, number>) => ({
        text: `${s.orders} orders, ${Math.round(s.avg)} bags held on average`,
        word: s.outs > 0 ? `${s.outs} days out` : 'Never out',
        tone: s.outs > 0 ? ('danger' as const) : ('success' as const),
      }),
    },
  }),
  threshold({
    id: 'tune-threshold-ratelimit',
    size: '3x2',
    domain: 'devops',
    surface: 'dark',
    name: 'Rate limit',
    hint: 'Drag the limit over live traffic, or focus its tag and use the arrow keys; the chart keeps moving',
    tags: ['gateway', 'live', '429'],
    props: {
      kind: 'live',
      label: 'Rate limit · POST /v1/transfers',
      meta: 'Live, last 40 s',
      data: traffic,
      y: { min: 0, max: 2000, ticks: [0, 500, 1000, 1500, 2000], format: (v: number) => num(v) },
      x: {
        ticks: [
          { at: 0, label: '−40 s' },
          { at: 20, label: '−20 s' },
          { at: 39, label: 'Now' },
        ],
      },
      limit: { value: 1500, min: 500, max: 2000, step: 50, label: 'Limit', format: (v: number) => `${num(v)} req/s` },
      say: (s: Record<string, number>) => ({
        text: s.rejected ? `${s.rejected.toFixed(1)}% of requests rejected in the last 40 s` : 'Nothing rejected in the last 40 s',
        word: s.rejected > 5 ? 'Too tight' : undefined,
        tone: 'warning' as const,
      }),
    },
  }),
]

/* ── 21 Curve editor ─────────────────────────────────────────────────────────────────── */

const curve = archetype(CurveEditor, {
  name: 'Curve editor',
  hint: 'Drag a point up or down; with a point focused, arrows move it and left or right picks the next',
  why: 'A response curve is a shape; shaping it by hand is exact, describing it is not.',
  tags: ['curve', 'points', 'response'],
})

const pct = (v: number) => `${v}%`
const tierNames = ['1+', '10+', '50+', '100+', '200+']
const curves: MoodEntry[] = [
  curve({
    id: 'tune-curve-throttle',
    size: '2x2',
    domain: 'defense',
    name: 'Throttle curve',
    tags: ['drone', 'flight', 'expo'],
    props: {
      label: 'Throttle curve · Quad 3',
      meta: 'Mode 2',
      x: { label: 'Stick', min: 0, max: 100, ticks: [0, 25, 50, 75, 100], format: pct },
      y: { label: 'Throttle', min: 0, max: 100, ticks: [0, 25, 50, 75, 100], format: (v: number) => `${v}` },
      points: [
        { x: 0, y: 0 },
        { x: 25, y: 30 },
        { x: 50, y: 46 },
        { x: 75, y: 68 },
        { x: 100, y: 100 },
      ],
      monotone: 'up',
      probe: { x: 50, label: 'Mid stick' },
      say: (_ys: number[], p: number) => {
        const d = Math.round(p) - 44
        return {
          text: `Mid stick gives ${Math.round(p)}% throttle; hover needs 44%`,
          word: Math.abs(d) <= 2 ? 'Holds height' : d > 0 ? 'Climbs' : 'Sinks',
          tone: Math.abs(d) <= 2 ? ('success' as const) : ('warning' as const),
        }
      },
    },
  }),
  curve({
    id: 'tune-curve-tiers',
    size: '2x2',
    domain: 'commerce',
    name: 'Quantity pricing',
    tags: ['wholesale', 'price ladder'],
    props: {
      label: 'Price ladder · Arabika 1 kg',
      meta: 'Wholesale',
      x: { label: 'Bags', min: 0, max: 4.6, ticks: [0, 1, 2, 3, 4], format: (i: number) => tierNames[i] },
      y: { label: 'Price', min: 120_000, max: 200_000, ticks: [120_000, 140_000, 160_000, 180_000, 200_000], format: (v: number) => `${v / 1000}K` },
      points: [185_000, 172_000, 160_000, 150_000, 142_000].map((y, i) => ({ x: i, y })),
      step: 1000,
      curve: 'step',
      monotone: 'down',
      probe: { x: 2.3, label: '64 bags' },
      say: (ys: number[], p: number) => {
        const margin = Math.round(((ys[4] - 128_000) / ys[4]) * 100)
        return {
          text: `64 bags cost ${rp(64 * p)}`,
          word: `${margin}% margin at 200+`,
          tone: margin < 8 ? ('warning' as const) : undefined,
        }
      },
    },
  }),
  curve({
    id: 'tune-curve-tone',
    size: '2x2',
    domain: 'media',
    surface: 'muted',
    name: 'Tone curve',
    tags: ['grade', 'contrast', 'photo'],
    props: {
      label: 'Tone curve · shot 14A',
      x: { label: 'In', min: 0, max: 255, ticks: [0, 64, 128, 192, 255], format: (v: number) => `${v}` },
      y: { label: 'Out', min: 0, max: 255, ticks: [0, 64, 128, 192, 255], format: (v: number) => `${v}` },
      points: [
        { x: 0, y: 0 },
        { x: 64, y: 52 },
        { x: 128, y: 128 },
        { x: 192, y: 206 },
        { x: 255, y: 255 },
      ],
      identity: true,
      monotone: 'up',
      say: (ys: number[]) => {
        const c = Math.round(((ys[3] - ys[1]) / 128 - 1) * 100)
        return {
          text: `Midtone contrast ${c > 0 ? '+' : c < 0 ? '−' : ''}${Math.abs(c)}%`,
          word: ys[1] < 30 ? 'Crushed shadows' : ys[3] > 240 ? 'Clipped highlights' : undefined,
          tone: 'warning' as const,
        }
      },
    },
  }),
  curve({
    id: 'tune-curve-irrigation',
    size: '2x2',
    domain: 'agri',
    name: 'Valve by moisture',
    tags: ['irrigation', 'sensor', 'valve'],
    props: {
      label: 'Valve by soil moisture · Blok C',
      x: { label: 'Moisture', min: 10, max: 50, ticks: [10, 20, 30, 40, 50], format: pct },
      y: { label: 'Valve', min: 0, max: 100, ticks: [0, 25, 50, 75, 100], format: pct },
      points: [
        { x: 10, y: 100 },
        { x: 20, y: 80 },
        { x: 30, y: 45 },
        { x: 40, y: 10 },
        { x: 50, y: 0 },
      ],
      monotone: 'down',
      probe: { x: 27, label: 'Now 27%' },
      say: (_ys: number[], p: number) => ({ text: `At today’s 27% the valve opens ${Math.round(p)}%, about ${num(Math.round(p * 1.2))} L/min` }),
    },
  }),
]

/* ── 22 Hour painter ─────────────────────────────────────────────────────────────────── */

const hoursPattern = archetype(HourPainter, {
  name: 'Hour painter',
  hint: 'Press a cell and drag across others to paint them; arrows and Space work on a focused cell',
  why: 'Painting hours across a day shows the gaps and overlaps that a list of times hides.',
  tags: ['schedule', 'hours', 'paint'],
})

const discounted = (h: number) => h >= 22 || h < 5
const painters: MoodEntry[] = [
  hoursPattern({
    id: 'tune-hours-offpeak',
    size: '3x1',
    domain: 'energy',
    name: 'Charging hours',
    tags: ['ev', 'tariff', 'off-peak'],
    props: {
      label: 'Home charger · 7 kW',
      value: [[
        [22, 24],
        [0, 5],
      ]],
      band: { from: 17, to: 22, label: 'Peak' },
      say: (hours: number, ranges: string[], grid: boolean[][]) => {
        const on = grid[0].map((x, h) => (x ? h : -1)).filter((h) => h >= 0)
        const cost = on.reduce((s, h) => s + 7 * (discounted(h) ? 1011.29 : 1444.7), 0)
        const peak = on.some((h) => h >= 17 && h < 22)
        return {
          text: hours ? `${ranges.join(', ')} · ${hours * 7} kWh · ${rp(Math.round(cost))}` : 'Charging off',
          word: peak ? 'Peak hours' : on.length && on.every(discounted) ? '30% off' : undefined,
          tone: peak ? ('warning' as const) : ('success' as const),
        }
      },
    },
  }),
  hoursPattern({
    id: 'tune-hours-quiet',
    size: '2x1',
    domain: 'workspace',
    name: 'Quiet hours',
    tags: ['notifications', 'focus'],
    props: {
      label: 'Quiet hours · notifications',
      value: [[
        [0, 7],
        [22, 24],
      ]],
      say: (hours: number, ranges: string[]) => ({
        text: hours ? `Held ${ranges.join(', ')}; on-call pages still ring` : 'Notifications at any hour',
      }),
    },
  }),
  hoursPattern({
    id: 'tune-hours-oddeven',
    size: '3x1',
    domain: 'civic',
    surface: 'muted',
    name: 'Odd–even plate hours',
    tags: ['traffic', 'jakarta', 'policy'],
    props: {
      label: 'Odd–even plates · Jl. Sudirman',
      value: [[
        [6, 10],
        [16, 21],
      ]],
      say: (hours: number, ranges: string[]) => ({
        text: hours ? `Weekdays ${ranges.join(' and ')}, ${hours} h a day` : 'No odd–even hours',
        word: hours > 10 ? 'Longer than today' : undefined,
        tone: 'warning' as const,
      }),
    },
  }),
  hoursPattern({
    id: 'tune-hours-deploy',
    size: '3x2',
    domain: 'devops',
    name: 'Deploy windows',
    tags: ['release', 'change freeze', 'week'],
    props: {
      label: 'Deploy windows · production',
      rows: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      per: 2,
      value: [
        [[10, 16]],
        [[10, 16]],
        [[10, 16], [20, 22]],
        [[10, 16]],
        [[10, 14]],
        [],
        [],
      ],
      say: (hours: number, _r: string[], grid: boolean[][]) => {
        const fridayLate = grid[4].some((on, c) => on && c * 2 >= 16)
        const weekend = grid[5].some(Boolean) || grid[6].some(Boolean)
        return {
          text: `${hours} h a week, ${weekend ? 'weekends included' : 'none at weekends'}`,
          word: fridayLate ? 'Friday evening' : undefined,
          tone: 'warning' as const,
        }
      },
    },
  }),
]

/* ── 23 Step grid ────────────────────────────────────────────────────────────────────── */

const steps = archetype(StepGrid, {
  name: 'Step grid',
  hint: 'Click cells or drag to paint; arrows and Space on a focused cell; play runs the playhead',
  why: 'A pattern of on and off across time is seen and edited as a grid, not dictated step by step.',
  tags: ['sequencer', 'grid', 'steps', 'pattern'],
})

const hourOf = (c: number) => `${pad(c * 2)}:00`
const stepGrids: MoodEntry[] = [
  steps({
    id: 'tune-steps-drums',
    size: '4x2',
    domain: 'audio',
    surface: 'dark',
    name: 'Drum pattern',
    tags: ['drums', 'beat', 'live'],
    props: {
      label: 'Pattern A · Sesi 2',
      bpm: 122,
      cols: ['1', '2', '3', '4'],
      tracks: [
        { name: 'Kick', steps: 'x...x...x...x...' },
        { name: 'Snare', steps: '....x.......x...' },
        { name: 'Hat', steps: 'x.x.x.x.x.x.x.xx' },
        { name: 'Clap', steps: '....x.......x..x' },
      ],
      say: (g: boolean[][]) => ({ text: `${g.flat().filter(Boolean).length} hits in 16 steps` }),
    },
  }),
  steps({
    id: 'tune-steps-signal',
    size: '3x2',
    domain: 'civic',
    name: 'Signal plan',
    tags: ['traffic lights', 'junction', 'phases'],
    props: {
      label: 'Signal plan · Simpang Dago',
      meta: '120 s cycle',
      exclusive: true,
      stepMs: 400,
      group: 3,
      cols: ['0 s', '30 s', '60 s', '90 s'],
      tracks: [
        { name: 'N–S', steps: 'xxxxx.......' },
        { name: 'N–S turn', steps: '.....xx.....' },
        { name: 'E–W', steps: '.......xxxx.' },
        { name: 'Walk', steps: '...........x' },
      ],
      say: (g: boolean[][]) => {
        const secs = g.map((row) => row.filter(Boolean).length * 10)
        const red = g[0].map((_, c) => g.every((row) => !row[c])).filter(Boolean).length
        return {
          text: `N–S ${secs[0]} s · turns ${secs[1]} s · E–W ${secs[2]} s · walk ${secs[3]} s`,
          word: secs[3] === 0 ? 'No walk phase' : red ? `All red ${red * 10} s` : undefined,
          tone: secs[3] === 0 ? ('warning' as const) : undefined,
        }
      },
    },
  }),
  steps({
    id: 'tune-steps-fertigation',
    size: '2x2',
    domain: 'agri',
    name: 'Fertigation plan',
    tags: ['nutrients', 'greenhouse', 'melon'],
    props: {
      label: 'Fertigation · melon, Blok C',
      group: 7,
      now: 4,
      cols: ['5 Nov', '12 Nov'],
      tracks: [
        { name: 'N', steps: 'x.x.x.x.x.x.x.' },
        { name: 'P', steps: 'x.....x.....x.' },
        { name: 'K', steps: '...x..x..x..xx' },
      ],
      say: (g: boolean[][]) => {
        const [n, p, k] = g.map((row) => row.filter(Boolean).length)
        return { text: `N ${n} days · P ${p} · K ${k} in 14 days`, word: k < 4 ? 'K low for fruiting' : undefined, tone: 'warning' as const }
      },
    },
  }),
  steps({
    id: 'tune-steps-turning',
    size: '2x2',
    domain: 'health',
    name: 'Turning schedule',
    tags: ['nursing', 'pressure care'],
    props: {
      label: 'Turning schedule · Bed 7',
      exclusive: true,
      group: 3,
      now: 7,
      cols: ['00', '06', '12', '18'],
      tracks: [
        { name: 'Left', steps: 'x..x..x..x..' },
        { name: 'Back', steps: '.x..x..x..x.' },
        { name: 'Right', steps: '..x..x..x..x' },
      ],
      say: (g: boolean[][]) => {
        const at = g[0].map((_, c) => g.findIndex((row) => row[c]))
        const gap = at.indexOf(-1)
        const twice = at.findIndex((r, c) => c > 0 && r >= 0 && r === at[c - 1])
        const back = at.filter((r) => r === 1).length
        if (gap >= 0) return { text: `Nobody turns the patient at ${hourOf(gap)}`, word: 'Gap', tone: 'danger' as const }
        if (twice >= 0) return { text: `Same position twice at ${hourOf(twice)}`, word: 'Check', tone: 'warning' as const }
        return { text: `Every 2 h; on the back ${back} times`, word: 'All sides', tone: 'success' as const }
      },
    },
  }),
]

/* ── 24 Tap tempo ────────────────────────────────────────────────────────────────────── */

const tap = archetype(TapTempo, {
  name: 'Tap tempo',
  hint: 'Press the key on each beat (pointer, Space, Enter or T); a pause starts a new count',
  why: 'A rhythm is quicker to tap than to count; the hand already knows it.',
  tags: ['tap', 'tempo', 'rhythm', 'rate'],
})

const taps: MoodEntry[] = [
  tap({
    id: 'tune-tap-bpm',
    size: '1x1',
    domain: 'audio',
    surface: 'dark',
    name: 'Tap tempo',
    tags: ['bpm', 'live'],
    props: { label: 'Tempo · Sesi 2', cap: 'Tap', unit: 'BPM', value: 122, tempo: true, pixel: true },
  }),
  tap({
    id: 'tune-tap-cpr',
    size: '2x1',
    domain: 'health',
    name: 'Compression rate',
    tags: ['cpr', 'training', 'first aid'],
    props: {
      label: 'CPR practice · compressions',
      cap: 'Press',
      start: 'Press on each beat',
      wide: true,
      scale: { min: 60, max: 160, lo: 100, hi: 120 },
      bands: [
        { upTo: 99, word: 'Too slow', tone: 'warning' },
        { upTo: 120, word: 'In range', tone: 'success' },
        { upTo: 400, word: 'Too fast', tone: 'warning' },
      ],
    },
  }),
  tap({
    id: 'tune-tap-breaths',
    size: '1x1',
    domain: 'agri',
    surface: 'muted',
    name: 'Breathing rate',
    tags: ['dairy', 'heat stress', 'livestock'],
    props: {
      label: 'Cow 214 · breaths',
      cap: 'Breath',
      start: 'Tap each breath',
      value: 72,
      bands: [
        { upTo: 60, word: 'Normal', tone: 'success' },
        { upTo: 80, word: 'Heat stress', tone: 'warning' },
        { upTo: 400, word: 'Severe', tone: 'danger' },
      ],
    },
  }),
]

/* ── The chapter, in board order: sizes, surfaces and domains alternate ──────────────── */

const all = [
  ...faders,
  ...knobs,
  ...centres,
  ...panels,
  ...banks,
  ...dimmers,
  ...dials,
  ...jogs,
  ...limits,
  ...ranges,
  ...tapes,
  ...splits,
  ...levers,
  ...steppers,
  ...modes,
  ...toggleBanks,
  ...xyPads,
  ...sticks,
  ...crops,
  ...thresholds,
  ...curves,
  ...painters,
  ...stepGrids,
  ...taps,
]

/** Alternates sizes, surfaces and domains, and keeps a pattern's variants apart. */
const ORDER: string[] = [
  'tune-steps-drums',
  'tune-tap-cpr',
  'tune-threshold-reorder',
  'tune-stepper-formation',
  'tune-fader-vox',
  'tune-stick-ptz',
  'tune-mode-settlement',
  'tune-tape-heading',
  'tune-bank-sprinkler',
  'tune-slider-shipping',
  'tune-jog-logs',
  'tune-tap-bpm',
  'tune-range-departures',
  'tune-threshold-river',
  'tune-hours-offpeak',
  'tune-xy-light',
  'tune-offset-skew',
  'tune-fader-main',
  'tune-slider-reserve',
  'tune-stick-crane',
  'tune-knob-grind',
  'tune-dial-pump',
  'tune-panel-envelope',
  'tune-range-fxband',
  'tune-hours-quiet',
  'tune-offset-thermostat',
  'tune-slider-autoscale',
  'tune-xy-grade',
  'tune-dimmer-street',
  'tune-crop-motion',
  'tune-toggles-card',
  'tune-stepper-desks',
  'tune-split-canary',
  'tune-curve-tone',
  'tune-tape-uhf',
  'tune-dimmer-conveyor',
  'tune-steps-signal',
  'tune-toggles-signin',
  'tune-crop-post',
  'tune-slider-speed',
  'tune-mode-charging',
  'tune-jog-cctv',
  'tune-tape-speedzone',
  'tune-lever-telegraph',
  'tune-steps-turning',
  'tune-knob-clutter',
  'tune-stepper-replicas',
  'tune-curve-tiers',
  'tune-range-glucose',
  'tune-bank-battery',
  'tune-tape-tenor',
  'tune-split-feed',
  'tune-toggles-flags',
  'tune-knob-oxygen',
  'tune-dial-washer',
  'tune-stick-antenna',
  'tune-hours-deploy',
  'tune-range-moisture',
  'tune-curve-throttle',
  'tune-mode-posture',
  'tune-knob-heater',
  'tune-threshold-spo2',
  'tune-split-pockets',
  'tune-lever-train',
  'tune-stepper-instalments',
  'tune-dimmer-lounge',
  'tune-panel-gimbal',
  'tune-fader-reactive',
  'tune-dial-camera',
  'tune-xy-load',
  'tune-bank-service',
  'tune-lever-tap',
  'tune-jog-timecode',
  'tune-range-price',
  'tune-dimmer-infrared',
  'tune-threshold-fraud',
  'tune-fader-flow',
  'tune-panel-droop',
  'tune-stepper-beds',
  'tune-hours-oddeven',
  'tune-xy-thermal',
  'tune-dial-room',
  'tune-threshold-ratelimit',
  'tune-tap-breaths',
  'tune-mode-density',
  'tune-dimmer-runway',
  'tune-crop-photo',
  'tune-toggles-checkout',
  'tune-offset-pan',
  'tune-split-week',
  'tune-lever-flaps',
  'tune-steps-fertigation',
  'tune-knob-cutoff',
  'tune-tape-headway',
  'tune-panel-voice',
  'tune-offset-trim',
  'tune-bank-eq',
  'tune-knob-cashback',
  'tune-curve-irrigation',
  'tune-slider-transfer',
]

const byId = new Map(all.map((e) => [e.id, e]))
export const entries: MoodEntry[] = ORDER.map((id) => byId.get(id)).filter((e): e is MoodEntry => !!e)
