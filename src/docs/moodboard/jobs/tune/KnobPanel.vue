<script setup lang="ts">
/**
 * A row of knobs that shape one curve, with the curve drawn above them and redrawn as they turn:
 * an amp envelope, a compressor's transfer curve, a gimbal loop's step response, a generator's
 * droop line. Every knob is the library's RKnob (drag, wheel while focused, arrow keys).
 * The envelope can be played: hold the key and the live cursor runs through it.
 */
import { computed, reactive, ref, watch } from 'vue'
import { RButton, RKnob, useElementSize } from '@/design-system'
import { reducedMotion, useTick } from '../../kit'
import { capture, clamp, plusMinus, points } from './shared'

type Kind = 'adsr' | 'comp' | 'pid' | 'droop'

interface Knob {
  key: string
  label: string
  min: number
  max: number
  step: number
  value: number
  unit?: string
}

const props = withDefaults(
  defineProps<{
    kind: Kind
    eyebrow: string
    /** Mono caps at the right of the head: a preset, a unit id. */
    meta?: string
    knobs: Knob[]
    tone?: 'neutral' | 'brand' | 'signal'
    /** Rated output of the unit, for the droop readout. */
    ratedMw?: number
    /** Frequency the droop readout is taken at. */
    probeHz?: number
    /** Input level the compressor readout is taken at. */
    probeDb?: number
  }>(),
  { tone: 'brand', ratedMw: 200, probeHz: 49.8, probeDb: -12 },
)

const v = reactive<Record<string, number>>(Object.fromEntries(props.knobs.map((k) => [k.key, k.value])))

const knobFormat: Record<string, (x: number) => string> = {
  ratio: (x) => `${x.toFixed(1).replace(/\.0$/, '')}:1`,
  threshold: (x) => plusMinus(x, 0),
  makeup: (x) => plusMinus(x, 1),
}

/* ── Plot frame ───────────────────────────────────────────────────────────── */
const plot = ref<HTMLElement | null>(null)
const { width, height } = useElementSize(plot)
const PAD = { l: 30, r: 8, t: 8, b: 18 }
const W = computed(() => Math.max(120, width.value))
const H = computed(() => Math.max(60, height.value))
const iw = computed(() => W.value - PAD.l - PAD.r)
const ih = computed(() => H.value - PAD.t - PAD.b)

interface Frame {
  x: [number, number]
  y: [number, number]
  xTicks: { at: number; label: string }[]
  yTicks: { at: number; label: string }[]
}

const frame = computed<Frame>(() => {
  switch (props.kind) {
    case 'adsr':
      return { x: [0, 1], y: [0, 1], xTicks: [], yTicks: [0, 0.5, 1].map((at) => ({ at, label: `${at * 100}` })) }
    case 'comp':
      return {
        x: [-60, 0],
        y: [-60, 12],
        xTicks: [-60, -40, -20, 0].map((at) => ({ at, label: plusMinus(at, 0) })),
        yTicks: [-60, -40, -20, 0].map((at) => ({ at, label: plusMinus(at, 0) })),
      }
    case 'pid':
      return {
        x: [0, 3],
        y: [0, 1.75],
        xTicks: [0, 1, 2, 3].map((at) => ({ at, label: `${at} s` })),
        yTicks: [0, 0.5, 1, 1.5].map((at) => ({ at, label: at.toFixed(1) })),
      }
    case 'droop':
      return {
        x: [-0.5, 0.5],
        y: [-20, 20],
        xTicks: [-0.5, -0.25, 0, 0.25, 0.5].map((at) => ({ at, label: (50 + at).toFixed(2) })),
        yTicks: [-20, -10, 0, 10, 20].map((at) => ({ at, label: plusMinus(at, 0) })),
      }
  }
  return { x: [0, 1], y: [0, 1], xTicks: [], yTicks: [] }
})

const sx = (x: number) => PAD.l + ((x - frame.value.x[0]) / (frame.value.x[1] - frame.value.x[0])) * iw.value
const sy = (y: number) => PAD.t + (1 - (clamp(y, frame.value.y[0], frame.value.y[1]) - frame.value.y[0]) / (frame.value.y[1] - frame.value.y[0])) * ih.value

/* ── ADSR: segment widths on a square-root scale, so short times stay visible ── */
const adsrX = computed(() => {
  const a = Math.sqrt((v.attack ?? 0) / 2000) * 0.24
  const d = a + Math.sqrt((v.decay ?? 0) / 2000) * 0.22
  const h = d + 0.2
  const r = h + Math.sqrt((v.release ?? 0) / 4000) * 0.34
  return { a, d, h, r }
})

/* ── PID: a gimbal axis, J·θ'' = u − b·θ', stepped from 0 to 1 rad ───────── */
const pid = computed(() => {
  const P = v.p ?? 0
  const I = v.i ?? 0
  const D = v.d ?? 0
  const J = 0.2
  const b = 0.5
  const dt = 0.005
  let th = 0
  let w = 0
  let integ = 0
  let prev = 1
  let max = 0
  let settle = 0
  let unstable = false
  const out: [number, number][] = []
  for (let k = 0; k <= 3 / dt; k++) {
    const t = k * dt
    const e = 1 - th
    integ += e * dt
    const de = k === 0 ? 0 : (e - prev) / dt
    prev = e
    const u = P * e + I * integ + D * de
    w += ((u - b * w) / J) * dt
    th += w * dt
    if (!Number.isFinite(th) || Math.abs(th) > 4) {
      unstable = true
      out.push([t, th > 0 ? 1.75 : 0])
      break
    }
    if (k % 12 === 0) out.push([t, th])
    max = Math.max(max, th)
    if (Math.abs(th - 1) > 0.02) settle = t
  }
  if (settle > 2.95 && !unstable) unstable = Math.abs(th - 1) > 0.25
  return { out, over: Math.max(0, (max - 1) * 100), settle, unstable, settled: settle < 2.95 }
})

/* ── Droop: ΔP = −(Δf beyond the deadband ÷ 50 Hz) ÷ droop, clamped to the limit ── */
function droopAt(df: number) {
  const db = (v.deadband ?? 0) / 1000
  const eff = Math.abs(df) <= db ? 0 : df - Math.sign(df) * db
  const p = (-(eff / 50) / ((v.droop ?? 5) / 100)) * 100
  return clamp(p, -(v.limit ?? 10), v.limit ?? 10)
}

/* ── Compressor: hard knee, then makeup gain ─────────────────────────────── */
function compAt(x: number) {
  const T = v.threshold ?? -20
  const R = v.ratio ?? 4
  const out = x <= T ? x : T + (x - T) / R
  return out + (v.makeup ?? 0)
}

const line = computed(() => {
  switch (props.kind) {
    case 'adsr': {
      const { a, d, h, r } = adsrX.value
      const s = (v.sustain ?? 0) / 100
      return points([
        [sx(0), sy(0)],
        [sx(a), sy(1)],
        [sx(d), sy(s)],
        [sx(h), sy(s)],
        [sx(r), sy(0)],
      ])
    }
    case 'comp':
      return points([-60, v.threshold ?? -20, 0].map((x) => [sx(x), sy(compAt(x))]))
    case 'pid':
      return points(pid.value.out.map(([t, y]) => [sx(t), sy(y)]))
    case 'droop': {
      const db = (v.deadband ?? 0) / 1000
      const xs = [-0.5, -db, db, 0.5]
      // Where the limit is reached, the line turns flat: add those corners.
      const knee = ((v.limit ?? 10) / 100) * ((v.droop ?? 5) / 100) * 50 + db
      if (knee < 0.5) xs.push(-knee, knee)
      return points(xs.sort((p, q) => p - q).map((x) => [sx(x), sy(droopAt(x))]))
    }
  }
  return ''
})

/** The flat fill under the envelope. */
const area = computed(() => (props.kind === 'adsr' ? `${line.value} ${sx(adsrX.value.r).toFixed(1)},${sy(0)} ${sx(0)},${sy(0)}` : ''))

/* ── Readouts in the head ────────────────────────────────────────────────── */
const readouts = computed<{ label: string; value: string; tone?: 'danger' | 'success' }[]>(() => {
  switch (props.kind) {
    case 'adsr': {
      const total = (v.attack ?? 0) + (v.decay ?? 0)
      return [{ label: 'To sustain', value: `${total.toLocaleString('en-US')} ms` }]
    }
    case 'comp': {
      const out = compAt(props.probeDb)
      return [{ label: 'Peaks', value: `${plusMinus(props.probeDb, 0)} → ${plusMinus(out, 1)} dB` }]
    }
    case 'pid':
      if (pid.value.unstable) return [{ label: 'Loop', value: 'Unstable', tone: 'danger' }]
      return [
        { label: 'Overshoot', value: `${pid.value.over.toFixed(0)}%` },
        { label: 'Settles', value: pid.value.settled ? `${pid.value.settle.toFixed(2)} s` : 'Not in 3 s' },
      ]
    case 'droop': {
      const mw = (droopAt(props.probeHz - 50) / 100) * props.ratedMw
      return [{ label: 'Response', value: `${plusMinus(mw, 0)} MW at ${props.probeHz.toFixed(2)} Hz` }]
    }
  }
  return []
})

/* ── Envelope gate: hold the key to play a note, release to let it go ──────── */
const gate = ref(false)
const running = ref(false)
let t0 = 0
let releasedAt = 0
let releaseFrom = 0
const level = ref(0)
const cursor = ref<number | null>(null)
// Only the envelope plays; the other panels never subscribe to the clock.
const tick = props.kind === 'adsr' ? useTick(40) : ref(0)
const still = reducedMotion()

function levelAt(ms: number) {
  const A = Math.max(1, v.attack ?? 0)
  const D = Math.max(1, v.decay ?? 0)
  const S = (v.sustain ?? 0) / 100
  if (ms < A) return ms / A
  if (ms < A + D) return 1 - (1 - S) * ((ms - A) / D)
  return S
}

function xAt(ms: number, released: number | null) {
  const { a, d, h, r } = adsrX.value
  const A = Math.max(1, v.attack ?? 0)
  const D = Math.max(1, v.decay ?? 0)
  if (released !== null) return h + (r - h) * clamp(released / Math.max(1, v.release ?? 0), 0, 1)
  if (ms < A) return a * (ms / A)
  if (ms < A + D) return a + (d - a) * ((ms - A) / D)
  return d + (h - d) * clamp((ms - A - D) / 1000, 0, 1)
}

function press() {
  if (gate.value) return
  gate.value = true
  running.value = true
  t0 = performance.now()
}
function release() {
  if (!gate.value) return
  gate.value = false
  releasedAt = performance.now()
  releaseFrom = level.value
}

watch(tick, () => {
  if (!running.value) return
  const now = performance.now()
  if (gate.value) {
    const ms = now - t0
    level.value = levelAt(ms)
    cursor.value = still ? null : xAt(ms, null)
    return
  }
  const R = Math.max(1, v.release ?? 0)
  const since = now - releasedAt
  level.value = Math.max(0, releaseFrom * (1 - since / R))
  cursor.value = still ? null : xAt(0, since)
  if (since >= R) {
    running.value = false
    cursor.value = null
    level.value = 0
  }
})

const gateHandlers = {
  onPointerdown: (event: PointerEvent) => {
    if (event.button !== 0) return
    capture(event.currentTarget as HTMLElement, event)
    press()
  },
  onPointerup: release,
  onPointercancel: release,
  onLostpointercapture: release,
  onKeydown: (event: KeyboardEvent) => {
    if ((event.key === ' ' || event.key === 'Enter') && !event.repeat) {
      event.preventDefault()
      press()
    }
  },
  onKeyup: (event: KeyboardEvent) => {
    if (event.key === ' ' || event.key === 'Enter') release()
  },
  onBlur: release,
  onContextmenu: (event: Event) => event.preventDefault(),
}

const label = computed(() => `${props.eyebrow}: ${readouts.value.map((r) => `${r.label} ${r.value}`).join(', ')}`)
</script>

<template>
  <div class="mk panel">
    <div class="mk-row mk-between panel__head">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <span v-if="meta && kind !== 'adsr'" class="r-label panel__meta">{{ meta }}</span>
      <RButton
        v-if="kind === 'adsr'"
        size="xs"
        :variant="gate ? 'solid' : 'outline'"
        :tone="gate ? 'signal' : 'neutral'"
        class="panel__gate"
        v-bind="gateHandlers"
      >
        {{ gate ? 'Playing' : 'Hold to play' }}
      </RButton>
    </div>

    <dl class="panel__readouts" aria-live="polite">
      <div v-for="r in readouts" :key="r.label" class="panel__readout">
        <dt class="r-label">{{ r.label }}</dt>
        <dd :class="r.tone ? `is-${r.tone}` : undefined">{{ r.value }}</dd>
      </div>
      <div v-if="kind === 'adsr'" class="panel__readout">
        <dt class="r-label">Level</dt>
        <dd>{{ Math.round(level * 100) }}%</dd>
      </div>
    </dl>

    <div ref="plot" class="panel__plot mk-grow">
      <svg :width="W" :height="H" role="img" :aria-label="label">
        <g class="panel__grid">
          <line v-for="t in frame.yTicks" :key="`y${t.at}`" :x1="PAD.l" :x2="W - PAD.r" :y1="sy(t.at)" :y2="sy(t.at)" />
        </g>
        <line class="panel__axis" :x1="PAD.l" :x2="W - PAD.r" :y1="H - PAD.b + 0.5" :y2="H - PAD.b + 0.5" />
        <text v-for="t in frame.yTicks" :key="`yl${t.at}`" class="panel__tick" :x="PAD.l - 6" :y="sy(t.at) + 3" text-anchor="end">
          {{ t.label }}
        </text>
        <text v-for="t in frame.xTicks" :key="`xl${t.at}`" class="panel__tick" :x="sx(t.at)" :y="H - 4" text-anchor="middle">
          {{ t.label }}
        </text>

        <!-- References: unity for the compressor, the set point for the loop, nominal for droop. -->
        <line v-if="kind === 'comp'" class="panel__ref" :x1="sx(-60)" :y1="sy(-60)" :x2="sx(0)" :y2="sy(0)" />
        <line v-if="kind === 'pid'" class="panel__ref" :x1="PAD.l" :x2="W - PAD.r" :y1="sy(1)" :y2="sy(1)" />
        <line v-if="kind === 'droop'" class="panel__ref" :x1="sx(0)" :x2="sx(0)" :y1="PAD.t" :y2="H - PAD.b" />
        <line v-if="kind === 'droop'" class="panel__ref" :x1="sx(probeHz - 50)" :x2="sx(probeHz - 50)" :y1="PAD.t" :y2="H - PAD.b" />

        <template v-if="kind === 'adsr'">
          <polygon class="panel__area" :points="area" />
          <text
            v-for="(s, i) in ['A', 'D', 'S', 'R']"
            :key="s"
            class="panel__tick"
            :x="sx([adsrX.a / 2, (adsrX.a + adsrX.d) / 2, (adsrX.d + adsrX.h) / 2, (adsrX.h + adsrX.r) / 2][i])"
            :y="H - 4"
            text-anchor="middle"
          >
            {{ s }}
          </text>
        </template>

        <polyline class="panel__line" :points="line" />

        <circle v-if="kind === 'comp'" class="panel__knee" :cx="sx(v.threshold ?? -20)" :cy="sy(compAt(v.threshold ?? -20))" r="4" />
        <line v-if="cursor !== null" class="panel__now" :x1="sx(cursor)" :x2="sx(cursor)" :y1="PAD.t" :y2="H - PAD.b" />
      </svg>
    </div>

    <div class="panel__knobs" :style="{ '--n': knobs.length }">
      <div v-for="k in knobs" :key="k.key" class="panel__knob">
        <RKnob
          v-model="v[k.key]"
          :label="k.label"
          :min="k.min"
          :max="k.max"
          :step="k.step"
          :unit="k.key === 'ratio' ? undefined : k.unit"
          :format="knobFormat[k.key]"
          :tone="tone"
          :detents="11"
          size="sm"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.panel {
  gap: 8px;
}

.panel__head {
  min-height: 24px;
}

.panel__meta {
  flex: none;
}

.panel__gate {
  flex: none;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}

.panel__readouts {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 16px;
  min-height: 16px;
}
.panel__readout {
  display: flex;
  align-items: baseline;
  gap: 6px;
}
.panel__readout dd {
  margin: 0;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
  font-weight: var(--r-weight-medium);
  font-variant-numeric: tabular-nums;
}
.panel__readout dd.is-danger {
  color: var(--r-danger-text);
}

.panel__plot {
  position: relative;
  min-height: 60px;
  overflow: hidden;
}
.panel__plot svg {
  position: absolute;
  inset: 0;
  display: block;
}

.panel__grid line {
  stroke: var(--r-chart-grid);
  stroke-width: 1;
}
.panel__axis {
  stroke: var(--r-chart-axis);
  stroke-width: 1;
}
.panel__tick {
  fill: var(--r-chart-label);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-variant-numeric: tabular-nums;
}
.panel__ref {
  stroke: var(--r-text-tertiary);
  stroke-width: 1;
  stroke-dasharray: 4 3;
}
.panel__area {
  fill: color-mix(in srgb, var(--r-chart-1) 10%, transparent);
}
.panel__line {
  fill: none;
  stroke: var(--r-chart-1);
  stroke-width: 2;
  stroke-linejoin: miter;
}
.panel__knee {
  fill: var(--r-chart-1);
  stroke: var(--r-chart-surface);
  stroke-width: 2;
}
.panel__now {
  stroke: var(--r-chart-now);
  stroke-width: 2;
}

.panel__knobs {
  display: grid;
  grid-template-columns: repeat(var(--n), minmax(0, 1fr));
  border-top: 1px solid var(--r-border-subtle);
}
.panel__knob {
  display: flex;
  justify-content: center;
  min-width: 0;
  padding-top: 8px;
}
.panel__knob + .panel__knob {
  border-left: 1px solid var(--r-border-subtle);
}
</style>
