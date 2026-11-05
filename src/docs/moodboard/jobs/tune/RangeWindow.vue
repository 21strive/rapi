<script setup lang="ts">
/**
 * A window with two thumbs over the distribution it cuts: a price band over the catalogue, a
 * departure window over the timetable, a target range over two weeks of readings. The bars
 * inside the window turn cobalt and the count updates as either thumb moves. Drag a thumb, drag
 * the band between them to slide the whole window, or click the track; arrow keys on each thumb.
 */
import { computed, ref, useId } from 'vue'
import { num } from '../../kit'
import { capture, clamp, sliderKey, snapTo } from './shared'

interface Figure {
  label: string
  value: string
  unit?: string
  tone?: 'success' | 'warning'
  word?: string
}

const props = withDefaults(
  defineProps<{
    label: string
    min: number
    max: number
    step: number
    value: [number, number]
    /** Counts per equal bin across min…max. */
    bins: number[]
    format?: (v: number) => string
    /** Accessible names of the two thumbs. */
    thumbs?: [string, string]
    /** Plural noun of what the bins count: "products". */
    noun?: string
    /** Scale labels under the track; defaults to min, middle, max. */
    scale?: string[]
    /** Smallest gap between the thumbs, in steps. */
    gap?: number
    /** A figure for the window instead of the plain count. */
    figure?: (inside: number, total: number, lo: number, hi: number) => Figure
    /** Quiet line under the count. */
    note?: (inside: number, total: number, lo: number, hi: number) => string
  }>(),
  { thumbs: () => ['From', 'To'], noun: 'items', gap: 1 },
)

const id = useId()
const lo = ref(props.value[0])
const hi = ref(props.value[1])
const control = ref<HTMLElement | null>(null)
const span = computed(() => props.max - props.min)
const pct = (v: number) => ((v - props.min) / span.value) * 100
const fmt = (v: number) => (props.format ? props.format(v) : num(v))

/* ── Bins inside the window: partial bins count in proportion ───────────────── */
const peak = computed(() => Math.max(1, ...props.bins))
const total = computed(() => props.bins.reduce((s, b) => s + b, 0))
const binW = computed(() => span.value / props.bins.length)
const inside = computed(() =>
  Math.round(
    props.bins.reduce((sum, b, i) => {
      const a = props.min + i * binW.value
      const z = a + binW.value
      const overlap = Math.max(0, Math.min(z, hi.value) - Math.max(a, lo.value))
      return sum + b * (overlap / binW.value)
    }, 0),
  ),
)
const isIn = (i: number) => {
  const mid = props.min + (i + 0.5) * binW.value
  return mid >= lo.value && mid <= hi.value
}
const fig = computed(() => props.figure?.(inside.value, total.value, lo.value, hi.value))
const note = computed(() => props.note?.(inside.value, total.value, lo.value, hi.value))
const scale = computed(() => props.scale ?? [fmt(props.min), fmt(props.min + span.value / 2), fmt(props.max)])

/* ── Setting, keeping the thumbs apart ──────────────────────────────────── */
const minGap = computed(() => props.gap * props.step)
const thumbKeys = ['lo', 'hi'] as const
function setLo(v: number) {
  lo.value = snapTo(clamp(v, props.min, hi.value - minGap.value), props.min, props.max, props.step)
}
function setHi(v: number) {
  hi.value = snapTo(clamp(v, lo.value + minGap.value, props.max), props.min, props.max, props.step)
}

function keyFor(which: 'lo' | 'hi', event: KeyboardEvent) {
  const now = which === 'lo' ? lo.value : hi.value
  const next = sliderKey(event, now, { min: props.min, max: props.max, step: props.step })
  if (next === null) return
  event.preventDefault()
  if (which === 'lo') setLo(next)
  else setHi(next)
}

/* ── Pointer: nearest thumb, or the whole band when grabbed between them ───── */
let mode: 'lo' | 'hi' | 'band' | null = null
let grabAt = 0
let grabLo = 0
let grabHi = 0
const valueAt = (event: PointerEvent) => {
  const box = control.value!.getBoundingClientRect()
  return props.min + clamp((event.clientX - box.left) / box.width, 0, 1) * span.value
}
function onPointerdown(event: PointerEvent) {
  if (event.button !== 0 || !control.value) return
  event.preventDefault()
  capture(control.value, event)
  const v = valueAt(event)
  const box = control.value.getBoundingClientRect()
  const px = (d: number) => (Math.abs(d) / span.value) * box.width
  const dLo = px(v - lo.value)
  const dHi = px(v - hi.value)
  if (v > lo.value && v < hi.value && dLo > 12 && dHi > 12) {
    mode = 'band'
    grabAt = v
    grabLo = lo.value
    grabHi = hi.value
  } else {
    mode = dLo <= dHi ? 'lo' : 'hi'
    if (mode === 'lo') setLo(v)
    else setHi(v)
  }
  const thumb = control.value.querySelector<HTMLElement>(`[data-thumb="${mode === 'hi' ? 'hi' : 'lo'}"]`)
  thumb?.focus({ preventScroll: true })
}
function onPointermove(event: PointerEvent) {
  if (!mode) return
  const v = valueAt(event)
  if (mode === 'lo') setLo(v)
  else if (mode === 'hi') setHi(v)
  else {
    const width = grabHi - grabLo
    const from = clamp(grabLo + (v - grabAt), props.min, props.max - width)
    lo.value = snapTo(from, props.min, props.max, props.step)
    hi.value = snapTo(from + width, props.min, props.max, props.step)
  }
}
function onPointerup() {
  mode = null
}
</script>

<template>
  <div class="mk range">
    <div class="mk-row mk-between">
      <span :id="`${id}-label`" class="r-label mk-truncate">{{ label }}</span>
      <span class="range__values">{{ fmt(lo) }} – {{ fmt(hi) }}</span>
    </div>

    <div
      ref="control"
      class="range__control mk-grow"
      @pointerdown="onPointerdown"
      @pointermove="onPointermove"
      @pointerup="onPointerup"
      @pointercancel="onPointerup"
      @lostpointercapture="onPointerup"
    >
      <div class="range__bins" aria-hidden="true">
        <span
          v-for="(b, i) in bins"
          :key="i"
          class="range__bin"
          :class="{ 'is-in': isIn(i) }"
          :style="{ height: `${(b / peak) * 100}%` }"
        />
      </div>
      <div class="range__track" aria-hidden="true">
        <span class="range__fill" :style="{ left: `${pct(lo)}%`, right: `${100 - pct(hi)}%` }" />
      </div>
      <span
        v-for="t in thumbKeys"
        :key="t"
        :data-thumb="t"
        class="range__thumb"
        role="slider"
        tabindex="0"
        :style="{ left: `${pct(t === 'lo' ? lo : hi)}%` }"
        :aria-label="t === 'lo' ? thumbs[0] : thumbs[1]"
        :aria-describedby="`${id}-label`"
        :aria-valuemin="t === 'lo' ? min : lo + minGap"
        :aria-valuemax="t === 'lo' ? hi - minGap : max"
        :aria-valuenow="t === 'lo' ? lo : hi"
        :aria-valuetext="fmt(t === 'lo' ? lo : hi)"
        @keydown="keyFor(t, $event)"
      />
    </div>
    <div class="range__scale" aria-hidden="true">
      <span v-for="s in scale" :key="s">{{ s }}</span>
    </div>

    <div class="range__out" aria-live="polite">
      <p v-if="fig" class="range__fig">
        <span class="r-label">{{ fig.label }}</span>
        <span class="mk-fig">{{ fig.value }}</span>
        <span v-if="fig.unit" class="mk-unit">{{ fig.unit }}</span>
        <span v-if="fig.word" class="range__word" :class="`is-${fig.tone}`">{{ fig.word }}</span>
      </p>
      <p v-else class="range__fig">
        <span class="mk-fig">{{ num(inside) }}</span>
        <span class="range__of">of {{ num(total) }} {{ noun }}</span>
      </p>
      <p v-if="note" class="range__note mk-truncate">{{ note }}</p>
    </div>
  </div>
</template>

<style scoped>
.range {
  gap: 6px;
}

.range__values {
  flex: none;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
  font-weight: var(--r-weight-medium);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.range__control {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 34px;
  margin: 0 7px;
  cursor: pointer;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}

.range__bins {
  display: flex;
  flex: 1 1 auto;
  align-items: flex-end;
  gap: 2px;
  min-height: 14px;
  padding-bottom: 6px;
}
.range__bin {
  flex: 1 1 0;
  min-width: 1px;
  min-height: 1px;
  background: var(--r-chart-context);
  transition: background-color var(--r-duration-fast) var(--r-ease-out);
}
.range__bin.is-in {
  background: var(--r-chart-1);
}

.range__track {
  position: relative;
  flex: none;
  height: 2px;
  margin-bottom: 9px;
  background: var(--r-border-strong);
}
.range__fill {
  position: absolute;
  top: 0;
  bottom: 0;
  background: var(--r-brand);
}

.range__thumb {
  position: absolute;
  bottom: 3px;
  width: 14px;
  height: 14px;
  border: 1px solid var(--r-text);
  background: var(--r-bg-surface);
  transform: translateX(-50%);
  cursor: ew-resize;
}
.range__thumb:hover {
  background: var(--r-bg-hover);
}
.range__thumb:focus-visible {
  z-index: 1;
  outline: none;
  box-shadow: var(--r-focus-ring);
}

.range__scale {
  display: flex;
  justify-content: space-between;
  margin-top: -4px;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-variant-numeric: tabular-nums;
}

.range__out {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 2px 12px;
  min-width: 0;
}

.range__fig {
  display: flex;
  flex: none;
  align-items: baseline;
  gap: 6px;
  white-space: nowrap;
}
.range__fig .mk-fig {
  font-size: var(--r-text-xl);
}
.range__of {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

.range__word {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.range__word.is-success {
  color: var(--r-success-text);
}
.range__word.is-warning {
  color: var(--r-warning-text);
}

.range__note {
  flex: 1 1 auto;
  min-width: 0;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
  text-align: right;
}
</style>
