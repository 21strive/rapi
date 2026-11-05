<script setup lang="ts">
/**
 * A response curve shaped by hand: points at fixed inputs, dragged up or down, joined by straight
 * lines or steps. A fan curve, a throttle curve, a price ladder, a tone curve. A probe line reads
 * the curve at the input that matters today. Drag a point (or anywhere in its column); with a
 * point focused, up and down move it (Shift for ten), left and right move to its neighbour.
 */
import { computed, nextTick, ref } from 'vue'
import { useElementSize } from '@/design-system'
import { capture, clamp, points as pts, snapTo } from './shared'

interface Axis {
  label: string
  min: number
  max: number
  ticks: number[]
  format: (v: number) => string
}
interface Say {
  text: string
  word?: string
  tone?: 'success' | 'warning' | 'danger'
}

const props = withDefaults(
  defineProps<{
    label: string
    meta?: string
    x: Axis
    y: Axis
    points: { x: number; y: number }[]
    step?: number
    curve?: 'linear' | 'step'
    /** Keep the curve rising or falling as points move. */
    monotone?: 'up' | 'down'
    /** A dashed 1:1 reference (tone curves). */
    identity?: boolean
    probe?: { x: number; label: string }
    say: (ys: number[], probe: number) => Say
  }>(),
  { step: 1, curve: 'linear' },
)

const ys = ref(props.points.map((p) => p.y))
const xs = props.points.map((p) => p.x)
const focus = ref(0)

const plot = ref<HTMLElement | null>(null)
const { width, height } = useElementSize(plot)
const PAD = { l: 36, r: 12, t: 10, b: 18 }
const W = computed(() => Math.max(120, width.value))
const H = computed(() => Math.max(60, height.value))
const sx = (v: number) => PAD.l + ((v - props.x.min) / (props.x.max - props.x.min)) * (W.value - PAD.l - PAD.r)
const sy = (v: number) => PAD.t + (1 - (v - props.y.min) / (props.y.max - props.y.min)) * (H.value - PAD.t - PAD.b)

function limits(i: number): [number, number] {
  let lo = props.y.min
  let hi = props.y.max
  if (props.monotone === 'down') {
    if (i > 0) hi = Math.min(hi, ys.value[i - 1])
    if (i < ys.value.length - 1) lo = Math.max(lo, ys.value[i + 1])
  } else if (props.monotone === 'up') {
    if (i > 0) lo = Math.max(lo, ys.value[i - 1])
    if (i < ys.value.length - 1) hi = Math.min(hi, ys.value[i + 1])
  }
  return [lo, hi]
}
function set(i: number, v: number) {
  const [lo, hi] = limits(i)
  const next = [...ys.value]
  next[i] = snapTo(clamp(v, lo, hi), props.y.min, props.y.max, props.step)
  ys.value = next
}

/** Value of the curve at an input. */
function at(x: number) {
  if (x <= xs[0]) return ys.value[0]
  for (let i = 1; i < xs.length; i++) {
    if (x <= xs[i]) {
      if (props.curve === 'step') return ys.value[i - 1]
      const f = (x - xs[i - 1]) / (xs[i] - xs[i - 1])
      return ys.value[i - 1] + f * (ys.value[i] - ys.value[i - 1])
    }
  }
  return ys.value[ys.value.length - 1]
}
const probeY = computed(() => (props.probe ? at(props.probe.x) : 0))
const said = computed(() => props.say(ys.value, probeY.value))

const line = computed(() => {
  const out: [number, number][] = []
  xs.forEach((x, i) => {
    if (props.curve === 'step' && i > 0) out.push([sx(x), sy(ys.value[i - 1])])
    out.push([sx(x), sy(ys.value[i])])
  })
  if (props.curve === 'step') out.push([sx(props.x.max), sy(ys.value[ys.value.length - 1])])
  return pts(out)
})

/* ── Pointer: the point whose column is nearest, dragged up and down ───────── */
const handles = ref<HTMLElement[]>([])
let dragging: number | null = null
function onPointerdown(event: PointerEvent) {
  if (event.button !== 0 || !plot.value) return
  event.preventDefault()
  const box = plot.value.getBoundingClientRect()
  const px = event.clientX - box.left
  let best = 0
  xs.forEach((x, i) => {
    if (Math.abs(sx(x) - px) < Math.abs(sx(xs[best]) - px)) best = i
  })
  capture(plot.value, event)
  dragging = best
  focus.value = best
  handles.value[best]?.focus({ preventScroll: true })
  onPointermove(event)
}
function onPointermove(event: PointerEvent) {
  if (dragging === null || !plot.value) return
  const box = plot.value.getBoundingClientRect()
  const f = 1 - (event.clientY - box.top - PAD.t) / (H.value - PAD.t - PAD.b)
  set(dragging, props.y.min + f * (props.y.max - props.y.min))
}
function onPointerup() {
  dragging = null
}

function onKeydown(i: number, event: KeyboardEvent) {
  const s = props.step * (event.shiftKey ? 10 : 1)
  const move = (to: number) => {
    event.preventDefault()
    focus.value = clamp(to, 0, xs.length - 1)
    nextTick(() => handles.value[focus.value]?.focus())
  }
  switch (event.key) {
    case 'ArrowUp':
      event.preventDefault()
      return set(i, ys.value[i] + s)
    case 'ArrowDown':
      event.preventDefault()
      return set(i, ys.value[i] - s)
    case 'PageUp':
      event.preventDefault()
      return set(i, ys.value[i] + props.step * 10)
    case 'PageDown':
      event.preventDefault()
      return set(i, ys.value[i] - props.step * 10)
    case 'Home':
      event.preventDefault()
      return set(i, props.y.min)
    case 'End':
      event.preventDefault()
      return set(i, props.y.max)
    case 'ArrowLeft':
      return move(i - 1)
    case 'ArrowRight':
      return move(i + 1)
  }
}
</script>

<template>
  <div class="mk curve">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ label }}</span>
      <span v-if="meta" class="r-label curve__meta">{{ meta }}</span>
    </div>
    <div class="curve__say" aria-live="polite">
      <span class="curve__text">{{ said.text }}</span>
      <span v-if="said.word" class="curve__word" :class="`is-${said.tone}`">{{ said.word }}</span>
    </div>

    <div
      ref="plot"
      class="curve__plot mk-grow"
      role="group"
      :aria-label="`${label}: ${y.label} by ${x.label}`"
      @pointerdown="onPointerdown"
      @pointermove="onPointermove"
      @pointerup="onPointerup"
      @pointercancel="onPointerup"
      @lostpointercapture="onPointerup"
    >
      <svg :width="W" :height="H" aria-hidden="true" focusable="false">
        <g class="curve__grid">
          <line v-for="v in y.ticks" :key="v" :x1="PAD.l" :x2="W - PAD.r" :y1="Math.round(sy(v)) + 0.5" :y2="Math.round(sy(v)) + 0.5" />
        </g>
        <line class="curve__axis" :x1="PAD.l" :x2="W - PAD.r" :y1="H - PAD.b + 0.5" :y2="H - PAD.b + 0.5" />
        <text v-for="v in y.ticks" :key="`y${v}`" class="curve__tick" :x="PAD.l - 6" :y="sy(v) + 3" text-anchor="end">{{ y.format(v) }}</text>
        <text v-for="v in x.ticks" :key="`x${v}`" class="curve__tick" :x="sx(v)" :y="H - 4" text-anchor="middle">{{ x.format(v) }}</text>
        <line
          v-if="identity"
          class="curve__ref"
          :x1="sx(x.min)"
          :y1="sy(y.min)"
          :x2="sx(x.max)"
          :y2="sy(y.max)"
        />
        <template v-if="probe">
          <line class="curve__probe" :x1="sx(probe.x)" :x2="sx(probe.x)" :y1="PAD.t" :y2="H - PAD.b" />
          <text class="curve__tick curve__probe-label" :x="sx(probe.x) + 4" :y="PAD.t + 8">{{ probe.label }}</text>
        </template>
        <polyline class="curve__line" :points="line" />
        <circle
          v-for="(xv, i) in xs"
          :key="i"
          class="curve__pt"
          :class="{ 'is-focus': i === focus }"
          :cx="sx(xv)"
          :cy="sy(ys[i])"
          r="5"
        />
      </svg>
      <span
        v-for="(xv, i) in xs"
        :key="`h${i}`"
        :ref="(el) => (handles[i] = el as HTMLElement)"
        class="curve__handle"
        :style="{ left: `${sx(xv)}px`, top: `${sy(ys[i])}px` }"
        role="slider"
        :tabindex="i === focus ? 0 : -1"
        :aria-label="`${x.label} ${x.format(xv)}`"
        aria-orientation="vertical"
        :aria-valuemin="y.min"
        :aria-valuemax="y.max"
        :aria-valuenow="ys[i]"
        :aria-valuetext="`${y.format(ys[i])}`"
        @keydown="onKeydown(i, $event)"
        @focus="focus = i"
      />
    </div>
  </div>
</template>

<style scoped>
.curve {
  gap: 6px;
}

.curve__meta {
  flex: none;
}

.curve__say {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
  font-size: var(--r-text-sm);
  line-height: 1.35;
}
.curve__text {
  min-width: 0;
}
.curve__word {
  flex: none;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.curve__word.is-success {
  color: var(--r-success-text);
}
.curve__word.is-warning {
  color: var(--r-warning-text);
}
.curve__word.is-danger {
  color: var(--r-danger-text);
}

.curve__plot {
  position: relative;
  min-height: 90px;
  cursor: ns-resize;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}
.curve__plot svg {
  position: absolute;
  inset: 0;
  display: block;
}

.curve__grid line {
  stroke: var(--r-chart-grid);
}
.curve__axis {
  stroke: var(--r-chart-axis);
}
.curve__tick {
  fill: var(--r-chart-label);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-variant-numeric: tabular-nums;
}
.curve__ref {
  stroke: var(--r-text-tertiary);
  stroke-width: 1;
  stroke-dasharray: 4 3;
}
.curve__probe {
  stroke: var(--r-text-tertiary);
  stroke-width: 1;
  stroke-dasharray: 2 3;
}
.curve__probe-label {
  fill: var(--r-text-secondary);
}
.curve__line {
  fill: none;
  stroke: var(--r-chart-1);
  stroke-width: 2;
  stroke-linejoin: miter;
}

/* Points are circles with a surface ring, as everywhere in Rapi charts. */
.curve__pt {
  fill: var(--r-chart-1);
  stroke: var(--r-chart-surface);
  stroke-width: 2;
}
.curve__plot:focus-within .curve__pt.is-focus {
  fill: var(--r-ink);
}

.curve__handle {
  position: absolute;
  width: 18px;
  height: 18px;
  margin: -9px 0 0 -9px;
}
.curve__handle:focus-visible {
  outline: 2px solid var(--r-focus);
  outline-offset: 0;
}
</style>
