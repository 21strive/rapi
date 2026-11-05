<script setup lang="ts">
/**
 * A trace that writes itself across the screen like a bedside monitor: the write head moves right,
 * the old trace is overwritten behind a small gap, the orange point is now. Straight segments only.
 * Freeze holds the trace to look at a beat or a tremor; the channel keys switch the lead or axis.
 */
import { computed, ref, watch } from 'vue'
import { Pause, Play } from 'lucide-vue-next'
import { RIconButton, RSegmented, RStatus } from '@/design-system'
import { num, reducedMotion, seeded, time, useTick, type Zone } from '../../kit'
import { clamp, useElementSize } from './shared'

interface Figure {
  label: string
  value: number
  unit: string
  decimals?: number
  /** How far it wanders, as a share of value. */
  vol?: number
}

const props = withDefaults(
  defineProps<{
    label: string
    kind: 'ecg' | 'pleth' | 'seismic' | 'vibration'
    /** The figure beside the trace. For seismic and vibration traces it is read off the trace. */
    figure: Figure
    extra?: Figure
    /** Leads or axes; each draws the same signal with its own shape and gain. */
    channels?: string[]
    /** A dashed level on the trace, in the figure's unit. */
    limit?: { value: number; label: string }
    seed: string
    zone?: Zone
    layout?: 'strip' | 'card' | 'mini'
  }>(),
  { channels: () => [], zone: 'WIB', layout: 'strip' },
)

const RATE = 50
const N = 125
const GAP = 6
const still = reducedMotion()
const rnd = seeded(props.seed)

const channel = ref(props.channels[0] ?? '')
const gain = computed(() => 1 - props.channels.indexOf(channel.value) * 0.22)
const shape = computed(() => Math.max(0, props.channels.indexOf(channel.value)))

const rate = ref(props.figure.value)
const extraValue = ref(props.extra?.value ?? 0)
let event = 0

/** One sample of the signal at time t, in seconds. */
function sample(t: number): number {
  const noise = (rnd() - 0.5) * 0.04
  if (props.kind === 'ecg') {
    const p = (t % (60 / rate.value)) / (60 / rate.value)
    const bump = (c: number, w: number, h: number) => (Math.abs(p - c) < w ? h * (1 - Math.abs(p - c) / w) : 0)
    const r = shape.value === 1 ? 0.35 : shape.value === 2 ? 1.25 : 1
    const s = shape.value === 1 ? -0.9 : -0.28
    return (bump(0.12, 0.05, 0.12) + bump(0.22, 0.015, -0.12) + bump(0.25, 0.022, r) + bump(0.285, 0.02, s) + bump(0.48, 0.08, 0.26)) * gain.value + noise
  }
  if (props.kind === 'pleth') {
    const p = (t % (60 / (props.extra?.value ?? 72))) / (60 / (props.extra?.value ?? 72))
    const v = p < 0.16 ? p / 0.16 : Math.exp(-(p - 0.16) * 3.2) + (Math.abs(p - 0.5) < 0.08 ? 0.08 * (1 - Math.abs(p - 0.5) / 0.08) : 0)
    return v * gain.value + noise
  }
  const amp = props.figure.value * gain.value
  if (props.kind === 'seismic') {
    event = event > 0 ? event * 0.985 : rnd() < 0.0015 ? 9 : 0
    return (rnd() - 0.5) * 2 * amp * (1 + event)
  }
  const wobble = 1 + Math.sin(t * 0.7) * 0.15
  return (Math.sin(t * 2 * Math.PI * 4.2) * 0.8 + Math.sin(t * 2 * Math.PI * 9.6) * 0.35) * amp * 1.55 * wobble + (rnd() - 0.5) * amp * 0.4
}

const buffer: number[] = Array.from({ length: N }, () => 0)
let head = 0
let t = 0
for (let i = 0; i < N; i++) {
  buffer[i] = sample(t)
  t += 1 / RATE
}
if (props.kind === 'seismic') event = 7
const version = ref(0)
const frozen = ref(false)
const frozenAt = ref<Date | null>(null)

const ms = still ? 500 : 100
const tick = useTick(ms)
watch(tick, (n) => {
  if (n % (1000 / ms) === 0) {
    const f = props.figure
    if (props.kind === 'ecg' || props.kind === 'pleth') {
      const lo = props.kind === 'pleth' ? 94 : f.value * 0.85
      const hi = props.kind === 'pleth' ? 100 : f.value * 1.15
      rate.value = clamp(rate.value + (rnd() - 0.5) * 2 * (f.vol ?? 0.02) * f.value, lo, hi)
    }
    if (props.extra) extraValue.value = clamp(extraValue.value + (rnd() - 0.5) * 2 * (props.extra.vol ?? 0.02) * props.extra.value, props.extra.value * 0.85, props.extra.value * 1.15)
  }
  if (frozen.value) return
  const k = Math.round((RATE * ms) / 1000)
  for (let i = 0; i < k; i++) {
    buffer[head] = sample(t)
    head = (head + 1) % N
    t += 1 / RATE
  }
  version.value++
})

const box = ref<HTMLElement | null>(null)
const { width, height } = useElementSize(box)

const range = computed<[number, number]>(() => {
  if (props.kind === 'ecg') return [-0.95, 1.4]
  if (props.kind === 'pleth') return [-0.15, 1.2]
  const top = Math.max(props.limit?.value ?? 0, props.figure.value * (props.kind === 'seismic' ? 9 : 2.6)) * 1.15
  return [-top, top]
})
const y = (v: number) => {
  const [lo, hi] = range.value
  return 6 + (1 - (clamp(v, lo, hi) - lo) / (hi - lo)) * (height.value - 12)
}
const x = (i: number) => (i / (N - 1)) * width.value

const paths = computed(() => {
  void version.value
  void width.value
  const seg = (from: number, to: number) => {
    let d = ''
    for (let i = from; i < to; i++) d += `${i === from ? 'M' : 'L'}${x(i).toFixed(1)} ${y(buffer[i]).toFixed(1)}`
    return d
  }
  return { before: seg(0, head), after: seg(Math.min(N, head + GAP), N) }
})
const headPoint = computed(() => {
  void version.value
  const i = (head - 1 + N) % N
  return { x: x(i), y: y(buffer[i]) }
})

const shown = computed(() => {
  void version.value
  if (props.kind === 'ecg' || props.kind === 'pleth') return rate.value
  if (props.kind === 'seismic') return Math.max(...buffer.map(Math.abs))
  return Math.sqrt(buffer.reduce((a, v) => a + v * v, 0) / N)
})

function toggle() {
  frozen.value = !frozen.value
  frozenAt.value = frozen.value ? new Date() : null
}
const options = computed(() => props.channels.map((c) => ({ label: c, value: c })))
</script>

<template>
  <div class="mk sweep" :class="`sweep--${layout}`">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ label }}</span>
      <span class="mk-row sweep__meta">
        <RSegmented v-if="channels.length > 1 && layout === 'strip'" v-model="channel" :options="options" size="sm" :label="`${label} channel`" />
        <RStatus v-if="frozen" size="sm" :label="`Frozen ${frozenAt ? time(frozenAt, zone, true) : ''}`" />
        <RStatus v-else-if="layout !== 'mini'" tone="signal" pulse size="sm" label="Live" />
        <RIconButton :label="frozen ? 'Resume the trace' : 'Freeze the trace'" size="xs" variant="ghost" :pressed="frozen" @click="toggle">
          <Play v-if="frozen" :size="14" />
          <Pause v-else :size="14" />
        </RIconButton>
      </span>
    </div>

    <div class="sweep__body">
      <div class="sweep__figs">
        <p class="sweep__fig">
          <span class="sweep__name">{{ figure.label }}</span>
          <span class="sweep__value">
            <span class="mk-fig">{{ num(shown, figure.decimals ?? 0) }}</span>
            <span class="mk-unit">{{ figure.unit }}</span>
          </span>
        </p>
        <p v-if="extra && layout !== 'mini'" class="sweep__fig sweep__fig--extra">
          <span class="sweep__name">{{ extra.label }}</span>
          <span class="sweep__value">
            <span class="mk-fig">{{ num(extraValue, extra.decimals ?? 0) }}</span>
            <span class="mk-unit">{{ extra.unit }}</span>
          </span>
        </p>
      </div>
      <div ref="box" class="sweep__trace" role="img" :aria-label="`${label}, ${figure.label} ${num(shown, figure.decimals ?? 0)} ${figure.unit}`">
        <svg :width="width" :height="height" aria-hidden="true">
          <line v-if="limit" class="sweep__limit" :x1="0" :x2="width" :y1="y(limit.value)" :y2="y(limit.value)" />
          <line v-if="limit" class="sweep__limit" :x1="0" :x2="width" :y1="y(-limit.value)" :y2="y(-limit.value)" />
          <text v-if="limit" class="sweep__limit-label" x="2" :y="y(limit.value) - 4">{{ limit.label }}</text>
          <path class="sweep__path" :d="paths.before" />
          <path class="sweep__path" :d="paths.after" />
          <circle v-if="!frozen" class="sweep__head" :cx="headPoint.x" :cy="headPoint.y" r="3" />
        </svg>
      </div>
    </div>

    <RSegmented v-if="channels.length > 1 && layout !== 'strip'" v-model="channel" :options="options" size="sm" :label="`${label} channel`" class="sweep__channels" />
  </div>
</template>

<style scoped>
.sweep {
  gap: 6px;
}

.sweep__meta {
  flex: none;
  gap: 8px;
}

.sweep__body {
  display: flex;
  flex: 1 1 auto;
  gap: 14px;
  min-height: 0;
}

.sweep__figs {
  display: flex;
  flex: none;
  flex-direction: column;
  justify-content: center;
  gap: 10px;
}

.sweep__fig {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sweep__name {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.sweep__value {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.sweep__value .mk-fig {
  font-size: var(--r-text-3xl);
}

.sweep__fig--extra .mk-fig {
  font-size: var(--r-text-xl);
}

.sweep__trace {
  position: relative;
  flex: 1 1 auto;
  min-width: 0;
  min-height: 32px;
}

.sweep__trace svg {
  position: absolute;
  inset: 0;
  overflow: visible;
}

.sweep__path {
  fill: none;
  stroke: var(--r-chart-1);
  stroke-linejoin: round;
  stroke-width: 1.75;
}

.sweep__head {
  fill: var(--r-chart-now);
}

.sweep__limit {
  stroke: var(--r-chart-ink);
  stroke-dasharray: 4 3;
  stroke-width: 1;
}

.sweep__limit-label {
  fill: var(--r-chart-label);
  font-family: var(--r-font-mono);
  font-size: 10px;
}

.sweep__channels {
  flex: none;
  align-self: flex-start;
}

.sweep--card .sweep__body,
.sweep--mini .sweep__body {
  flex-direction: column;
  gap: 6px;
}

.sweep--card .sweep__figs {
  flex-direction: row;
  justify-content: flex-start;
  gap: 24px;
}

.sweep--mini .sweep__value .mk-fig {
  font-size: var(--r-text-2xl);
}
</style>
