<script setup lang="ts">
/**
 * A bank of small faders that together draw a shape: a graphic EQ, a battery's plan for the day,
 * minutes per sprinkler zone, trains per hour. Sweep the pointer across the bank to draw the
 * whole shape in one stroke, or drag one band. With a band focused, up and down move it (Shift
 * for ten steps), left and right go to the neighbours, Home and End are the ends; double-click a
 * band to put it back.
 */
import { computed, nextTick, ref } from 'vue'
import { RButton, useElementSize } from '@/design-system'
import { capture, clamp, points, snapTo } from './shared'

interface Band {
  label: string
  /** Longer name, shown in the head while the band is focused. */
  name?: string
  value: number
}
interface Say {
  text: string
  word?: string
  tone?: 'success' | 'warning' | 'danger'
}

const props = withDefaults(
  defineProps<{
    label: string
    bands: Band[]
    min: number
    max: number
    step: number
    unit?: string
    /** Bands fill from zero, up or down. */
    bipolar?: boolean
    format?: (v: number) => string
    say: (values: number[]) => Say
    /** Label the bands every N (dense banks). */
    labelEvery?: number
  }>(),
  { bipolar: false, labelEvery: 1 },
)

const values = ref(props.bands.map((b) => b.value))
const focus = ref(0)
const active = ref<number | null>(null)
const rails = ref<HTMLElement | null>(null)
const handles = ref<HTMLElement[]>([])
const { width, height } = useElementSize(rails)

const CAP = 8
const frac = (v: number) => (v - props.min) / (props.max - props.min)
const zero = computed(() => (props.bipolar ? frac(0) : 0))
const fmt = (v: number) => (props.format ? props.format(v) : String(v))

function set(i: number, v: number) {
  const next = [...values.value]
  next[i] = snapTo(v, props.min, props.max, props.step)
  values.value = next
}

/* ── The shape through the caps ─────────────────────────────────────────── */
const line = computed(() => {
  const n = values.value.length
  const w = width.value
  const h = height.value - CAP
  return points(values.value.map((v, i) => [((i + 0.5) / n) * w, CAP / 2 + (1 - frac(v)) * h]))
})

/* ── Pointer: draw across the bands ─────────────────────────────────────── */
function fromPointer(event: PointerEvent) {
  if (!rails.value) return
  const box = rails.value.getBoundingClientRect()
  const n = values.value.length
  const i = clamp(Math.floor(((event.clientX - box.left) / box.width) * n), 0, n - 1)
  const f = 1 - (event.clientY - box.top - CAP / 2) / (box.height - CAP)
  set(i, props.min + clamp(f, 0, 1) * (props.max - props.min))
  if (focus.value !== i) {
    focus.value = i
    handles.value[i]?.focus({ preventScroll: true })
  }
  active.value = i
}
function onPointerdown(event: PointerEvent) {
  if (event.button !== 0 || !rails.value) return
  event.preventDefault()
  capture(rails.value, event)
  fromPointer(event)
  handles.value[focus.value]?.focus({ preventScroll: true })
}
function onPointermove(event: PointerEvent) {
  if (active.value !== null) fromPointer(event)
}
function onPointerup() {
  active.value = null
}

function onKeydown(i: number, event: KeyboardEvent) {
  const s = props.step * (event.shiftKey ? 10 : 1)
  const go = (to: number) => {
    focus.value = clamp(to, 0, values.value.length - 1)
    nextTick(() => handles.value[focus.value]?.focus())
  }
  const map: Record<string, () => void> = {
    ArrowUp: () => set(i, values.value[i] + s),
    ArrowDown: () => set(i, values.value[i] - s),
    PageUp: () => set(i, values.value[i] + props.step * 10),
    PageDown: () => set(i, values.value[i] - props.step * 10),
    Home: () => set(i, props.min),
    End: () => set(i, props.max),
    ArrowLeft: () => go(i - 1),
    ArrowRight: () => go(i + 1),
  }
  const fn = map[event.key]
  if (!fn) return
  event.preventDefault()
  fn()
}

function resetAll() {
  values.value = props.bands.map((b) => b.value)
}

const said = computed(() => props.say(values.value))
const current = computed(() => props.bands[focus.value])
const changed = computed(() => values.value.some((v, i) => v !== props.bands[i].value))
</script>

<template>
  <div class="mk fbank">
    <div class="mk-row mk-between fbank__head">
      <span class="r-eyebrow mk-truncate">{{ label }}</span>
      <span class="fbank__focus mk-truncate">
        <span class="fbank__name">{{ current.name ?? current.label }}</span>
        <span class="fbank__val">{{ fmt(values[focus]) }}</span>
        <span v-if="unit" class="mk-unit">{{ unit }}</span>
      </span>
    </div>

    <div class="fbank__bank mk-grow" :style="{ '--n': values.length }">
      <div
        ref="rails"
        class="fbank__rails"
        @pointerdown="onPointerdown"
        @pointermove="onPointermove"
        @pointerup="onPointerup"
        @pointercancel="onPointerup"
        @lostpointercapture="onPointerup"
      >
        <span v-if="bipolar" class="fbank__zero" :style="{ bottom: `calc(${CAP / 2}px + ${zero} * (100% - ${CAP}px))` }" aria-hidden="true" />
        <svg class="fbank__shape" :width="width" :height="height" aria-hidden="true" focusable="false">
          <polyline :points="line" />
        </svg>
        <div
          v-for="(v, i) in values"
          :key="i"
          :ref="(el) => (handles[i] = el as HTMLElement)"
          class="fbank__band"
          :class="{ 'is-focus': i === focus, 'is-active': i === active }"
          :style="{ '--f': frac(v), '--lo': Math.min(frac(v), zero), '--hi': Math.max(frac(v), zero) }"
          role="slider"
          aria-orientation="vertical"
          :tabindex="i === focus ? 0 : -1"
          :aria-label="bands[i].name ?? bands[i].label"
          :aria-valuemin="min"
          :aria-valuemax="max"
          :aria-valuenow="v"
          :aria-valuetext="[fmt(v), unit].filter(Boolean).join(' ')"
          @keydown="onKeydown(i, $event)"
          @focus="focus = i"
          @dblclick="set(i, bands[i].value)"
        >
          <span class="fbank__rail" />
          <span class="fbank__fill" />
          <span class="fbank__cap" />
        </div>
      </div>
      <div class="fbank__labels" aria-hidden="true">
        <span v-for="(b, i) in bands" :key="i" :class="{ 'is-focus': i === focus }">{{ i % labelEvery === 0 ? b.label : '' }}</span>
      </div>
    </div>

    <div class="fbank__foot">
      <p class="fbank__say" aria-live="polite">
        <span class="fbank__text">{{ said.text }}</span>
        <span v-if="said.word" class="fbank__word" :class="`is-${said.tone}`">{{ said.word }}</span>
      </p>
      <RButton size="xs" variant="ghost" :disabled="!changed" @click="resetAll">Reset</RButton>
    </div>
  </div>
</template>

<style scoped>
.fbank {
  gap: 8px;
}

.fbank__head {
  min-height: 18px;
}
.fbank__focus {
  display: inline-flex;
  flex: 0 1 auto;
  align-items: baseline;
  gap: 6px;
}
.fbank__name {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
}
.fbank__val {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-medium);
  font-variant-numeric: tabular-nums;
}

.fbank__bank {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.fbank__rails {
  position: relative;
  display: grid;
  flex: 1 1 auto;
  grid-template-columns: repeat(var(--n), minmax(0, 1fr));
  min-height: 60px;
  cursor: ns-resize;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}

.fbank__zero {
  position: absolute;
  right: 0;
  left: 0;
  height: 1px;
  background: var(--r-border-strong);
  pointer-events: none;
}

.fbank__shape {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: visible;
}
.fbank__shape polyline {
  fill: none;
  stroke: var(--r-text-tertiary);
  stroke-width: 1;
  stroke-linejoin: miter;
}

.fbank__band {
  position: relative;
  outline: none;
}
.fbank__band:focus-visible .fbank__cap {
  outline: 2px solid var(--r-focus);
  outline-offset: 2px;
}

.fbank__rail,
.fbank__fill {
  position: absolute;
  left: 50%;
  width: 2px;
  transform: translateX(-50%);
}
.fbank__rail {
  top: 4px;
  bottom: 4px;
  background: var(--r-border);
}
/* The fill runs from zero (or the bottom) to the cap. */
.fbank__fill {
  bottom: calc(4px + var(--lo) * (100% - 8px));
  height: calc((var(--hi) - var(--lo)) * (100% - 8px));
  background: var(--r-brand);
}

.fbank__cap {
  position: absolute;
  bottom: calc(var(--f) * (100% - 8px));
  left: 50%;
  width: min(20px, 70%);
  height: 8px;
  background: var(--r-ink);
  transform: translateX(-50%);
}
.fbank__rails:focus-within .fbank__band.is-focus .fbank__cap,
.fbank__band.is-active .fbank__cap {
  background: var(--r-brand);
}

.fbank__labels {
  display: grid;
  grid-template-columns: repeat(var(--n), minmax(0, 1fr));
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
  text-align: center;
  white-space: nowrap;
}
.fbank__bank:focus-within .fbank__labels .is-focus {
  color: var(--r-text);
  font-weight: var(--r-weight-semibold);
}

.fbank__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
}
.fbank__say {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 2px 12px;
  min-width: 0;
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
}
.fbank__word {
  flex: none;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.fbank__word.is-success {
  color: var(--r-success-text);
}
.fbank__word.is-warning {
  color: var(--r-warning-text);
}
.fbank__word.is-danger {
  color: var(--r-danger-text);
}
</style>
