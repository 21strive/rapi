<script setup lang="ts">
/**
 * A line that scrolls as readings arrive, "now" the orange line at its right edge, and the limits a
 * person watches for drawn dashed. Pause holds the picture while readings keep coming underneath;
 * the pointer, or the arrow keys on the plot, read any point.
 */
import { computed, ref } from 'vue'
import { Pause, Play } from 'lucide-vue-next'
import { RIconButton, RStatus } from '@/design-system'
import { num, signed, time, type Zone } from '../../kit'
import { clamp, extent, linePath, stepKey, useElementSize, useLive } from './shared'

interface Limit {
  value: number
  label: string
}

const props = withDefaults(
  defineProps<{
    label: string
    unit?: string
    start: number
    /** How far a reading moves in a tick, as a share of `start`. */
    vol?: number
    /** Pull back toward `start` each tick, 0–1. */
    revert?: number
    /** Chance per tick of a jump, for spiky series such as latency. */
    jump?: number
    decimals?: number
    /** A fixed scale; otherwise it follows the window and the limits. */
    range?: [number, number]
    /** Dashed lines a person watches: a limit, a target, a band edge. */
    limits?: Limit[]
    /** Readings between these two are fine. */
    band?: [number, number]
    /** The state words below, inside and above the band. */
    words?: [string, string, string]
    seed: string
    ms?: number
    points?: number
    zone?: Zone
    layout?: 'panel' | 'strip' | 'mini'
  }>(),
  {
    vol: 0.01,
    revert: 0.08,
    jump: 0,
    decimals: 0,
    limits: () => [],
    words: () => ['Below band', 'In band', 'Above band'],
    ms: 1000,
    points: 60,
    zone: 'WIB',
    layout: 'panel',
  },
)

const { shown, latest, frozen, freeze, missed } = useLive({
  seed: props.seed,
  size: props.points,
  ms: props.ms,
  start: props.start,
  next: (last, rnd) => {
    let v = last + (rnd() - 0.5) * 2 * props.vol * props.start + (props.start - last) * props.revert
    if (props.jump && rnd() < props.jump) v += (0.3 + rnd()) * props.vol * 9 * props.start
    return v
  },
})

const values = computed(() => shown.value.map((s) => s.v))
const n = computed(() => values.value.length)
const axis = props.layout === 'panel'
const domain = computed(() =>
  extent(props.layout === 'mini' ? values.value : [...values.value, ...props.limits.map((l) => l.value)], 0.12, props.range),
)

const plot = ref<HTMLElement | null>(null)
const { width, height } = useElementSize(plot)
const M = { left: axis ? 38 : 0, right: 2, top: 16, bottom: axis ? 16 : 4 }
const plotW = computed(() => Math.max(1, width.value - M.left - M.right))
const plotH = computed(() => Math.max(1, height.value - M.top - M.bottom))
const x = (i: number) => M.left + (i / Math.max(1, n.value - 1)) * plotW.value
const y = (v: number) => {
  const [lo, hi] = domain.value
  return M.top + (1 - (clamp(v, lo, hi) - lo) / (hi - lo)) * plotH.value
}
const path = computed(() => linePath(values.value, plotW.value, plotH.value, domain.value[0], domain.value[1]))

function niceStep(raw: number) {
  const p = 10 ** Math.floor(Math.log10(raw))
  const f = raw / p
  return (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * p
}
const ticks = computed(() => {
  if (!axis) return []
  const [lo, hi] = domain.value
  const step = niceStep((hi - lo) / 3)
  const places = Math.max(0, -Math.floor(Math.log10(step)))
  const out: { v: number; text: string }[] = []
  for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) out.push({ v, text: num(v, places) })
  return out
})

const cursor = ref<number | null>(null)
const reading = computed(() => (cursor.value == null ? latest.value : shown.value[cursor.value]))
const announce = ref('')

function onMove(event: PointerEvent) {
  const box = plot.value!.getBoundingClientRect()
  cursor.value = clamp(Math.round(((event.clientX - box.left - M.left) / plotW.value) * (n.value - 1)), 0, n.value - 1)
}
function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    cursor.value = null
    return
  }
  const next = stepKey(event, cursor.value ?? n.value - 1, n.value)
  if (next == null) return
  cursor.value = next
  const s = shown.value[next]
  announce.value = `${time(new Date(s.t), props.zone, true)}, ${num(s.v, props.decimals)} ${props.unit ?? ''}`
}

const state = computed(() => {
  if (!props.band) return null
  const v = reading.value.v
  if (v < props.band[0]) return { tone: 'warning' as const, label: props.words[0] }
  if (v > props.band[1]) return { tone: 'warning' as const, label: props.words[2] }
  return { tone: 'success' as const, label: props.words[1] }
})
const delta = computed(() => {
  const d = reading.value.v - values.value[0]
  return `${signed(d, props.decimals, props.unit ? ` ${props.unit}` : '')} in ${Math.round((n.value * props.ms) / 1000)} s`
})
const nowX = computed(() => x(n.value - 1))
</script>

<template>
  <div class="mk line" :class="`line--${layout}`">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ label }}</span>
      <span class="mk-row line__meta">
        <template v-if="layout === 'strip'">
          <span class="line__inline mk-fig">{{ num(reading.v, decimals) }}</span>
          <span v-if="unit" class="mk-unit">{{ unit }}</span>
        </template>
        <RStatus v-if="cursor != null" size="sm" :label="time(new Date(reading.t), zone, true)" />
        <RStatus v-else-if="frozen" size="sm" :label="`Held · ${missed} new`" />
        <RStatus v-else tone="signal" pulse size="sm" label="Live" />
        <RIconButton :label="frozen ? 'Resume live' : 'Pause the line'" size="xs" variant="ghost" :pressed="frozen" @click="freeze()">
          <Play v-if="frozen" :size="14" />
          <Pause v-else :size="14" />
        </RIconButton>
      </span>
    </div>

    <div v-if="layout !== 'strip'" class="line__figures">
      <p class="line__value">
        <span class="mk-fig">{{ num(reading.v, decimals) }}</span>
        <span v-if="unit" class="mk-unit">{{ unit }}</span>
      </p>
      <RStatus v-if="state" :tone="state.tone" shape="square" size="sm" :label="state.label" class="line__state" />
      <span v-if="layout === 'panel'" class="line__delta mk-truncate">{{ delta }}</span>
    </div>

    <div
      ref="plot"
      class="line__plot mk-grow"
      tabindex="0"
      role="group"
      aria-roledescription="live chart"
      :aria-label="`${label}, last ${n} readings. Arrow keys read a point.`"
      @pointermove="onMove"
      @pointerleave="cursor = null"
      @keydown="onKeydown"
      @blur="cursor = null"
    >
      <svg :width="width" :height="height" aria-hidden="true">
        <g v-if="axis" class="line__grid">
          <template v-for="t in ticks" :key="t.v">
            <line :x1="M.left" :x2="M.left + plotW" :y1="y(t.v)" :y2="y(t.v)" />
            <text :x="M.left - 6" :y="y(t.v)" dy="0.32em" text-anchor="end">{{ t.text }}</text>
          </template>
        </g>
        <g class="line__limits">
          <template v-for="l in limits" :key="l.label">
            <line :x1="M.left" :x2="M.left + plotW" :y1="y(l.value)" :y2="y(l.value)" />
            <text :x="M.left + plotW - 36" :y="y(l.value) - 4" text-anchor="end">{{ l.label }}</text>
          </template>
        </g>
        <path class="line__path" :d="path" :transform="`translate(${M.left} ${M.top})`" />
        <g class="line__now" :class="{ 'is-held': frozen }">
          <line :x1="nowX" :x2="nowX" :y1="M.top - 2" :y2="M.top + plotH" />
          <rect :x="nowX - 31" :y="0" width="31" height="12" />
          <text :x="nowX - 15.5" y="9" text-anchor="middle">{{ frozen ? 'HELD' : 'NOW' }}</text>
        </g>
        <circle class="line__dot" :cx="nowX" :cy="y(values[n - 1])" r="3.5" />
        <g v-if="cursor != null" class="line__cursor">
          <line :x1="x(cursor)" :x2="x(cursor)" :y1="M.top" :y2="M.top + plotH" />
          <circle :cx="x(cursor)" :cy="y(values[cursor])" r="4" />
        </g>
        <g v-if="axis" class="line__grid">
          <text :x="M.left" :y="height - 3">{{ time(new Date(shown[0].t), zone, true) }}</text>
          <text :x="M.left + plotW" :y="height - 3" text-anchor="end">{{ time(new Date(shown[n - 1].t), zone, true) }}</text>
        </g>
      </svg>
      <span class="r-sr-only" aria-live="polite">{{ announce }}</span>
    </div>
  </div>
</template>

<style scoped>
.line {
  gap: 6px;
}

.line__meta {
  flex: none;
  gap: 6px;
}

.line__inline {
  font-size: var(--r-text-xl);
}

.line__figures {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.line__value {
  display: flex;
  flex: none;
  align-items: baseline;
  gap: 4px;
}

.line__value .mk-fig {
  font-size: var(--r-text-3xl);
}

.line--mini .line__value .mk-fig {
  font-size: var(--r-text-2xl);
}

.line__delta {
  margin-left: auto;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-variant-numeric: tabular-nums;
}

.line__plot {
  position: relative;
  min-height: 40px;
  cursor: crosshair;
  outline: none;
}

.line__plot:focus-visible {
  outline: 2px solid var(--r-focus);
  outline-offset: 2px;
}

.line__plot svg {
  position: absolute;
  inset: 0;
  display: block;
  overflow: visible;
}

.line__grid line {
  stroke: var(--r-chart-grid);
  stroke-width: 1;
}

.line__grid text,
.line__limits text {
  fill: var(--r-chart-label);
  font-family: var(--r-font-mono);
  font-size: 10px;
  font-variant-numeric: tabular-nums;
}

.line__limits line {
  stroke: var(--r-chart-ink);
  stroke-dasharray: 4 3;
  stroke-width: 1;
}

.line__path {
  fill: none;
  stroke: var(--r-chart-1);
  stroke-linejoin: round;
  stroke-width: 2;
}

.line__now line {
  stroke: var(--r-chart-now);
  stroke-width: 1;
}

.line__now rect {
  fill: var(--r-chart-now);
}

.line__now text {
  fill: var(--r-on-signal);
  font-family: var(--r-font-mono);
  font-size: 9px;
  font-weight: var(--r-weight-semibold);
  letter-spacing: 0.06em;
}

.line__now.is-held line {
  stroke: var(--r-chart-axis);
}
.line__now.is-held rect {
  fill: var(--r-chart-axis);
}
.line__now.is-held text {
  fill: var(--r-chart-surface);
}

.line__dot {
  fill: var(--r-chart-1);
  stroke: var(--r-chart-surface);
  stroke-width: 2;
}

.line__cursor line {
  stroke: var(--r-chart-axis);
  stroke-width: 1;
}

.line__cursor circle {
  fill: var(--r-chart-surface);
  stroke: var(--r-chart-ink);
  stroke-width: 2;
}
</style>
