<script setup lang="ts">
import { computed, onBeforeUnmount, ref, useId } from 'vue'
import { formatNumber, withMinus } from '../composables/format'

/**
 * A rotary control, the Teenage Engineering twist: a square cap on a 270° tick ring, value in
 * mono underneath. Drag up/down, scroll, or use the arrow keys. role="slider".
 */
const model = defineModel<number>({ default: 0 })
const props = withDefaults(
  defineProps<{
    label: string
    min?: number
    max?: number
    step?: number
    size?: 'sm' | 'md' | 'lg'
    /** Colour of the lit ticks and the indicator. */
    tone?: 'neutral' | 'brand' | 'signal'
    /** Number of ticks around the ring. */
    detents?: number
    unit?: string
    format?: (value: number) => string
    disabled?: boolean
  }>(),
  { min: 0, max: 100, step: 1, size: 'md', tone: 'signal', detents: 21 },
)

const labelId = `${useId()}-label`
const dial = ref<HTMLElement | null>(null)
const dragging = ref(false)

/* ── Value ─────────────────────────────────────────────────────────────── */
const lo = computed(() => Math.min(props.min, props.max))
const hi = computed(() => Math.max(props.min, props.max))
const clamp = (v: number) => Math.min(hi.value, Math.max(lo.value, v))
const stepDecimals = computed(() => {
  const text = String(props.step)
  const at = text.indexOf('.')
  return at < 0 ? 0 : text.length - at - 1
})

const value = computed(() => clamp(Number.isFinite(model.value) ? Number(model.value) : lo.value))
const fraction = computed(() => (hi.value > lo.value ? (value.value - lo.value) / (hi.value - lo.value) : 0))

function snap(v: number): number {
  const s = props.step > 0 ? props.step : 1
  const snapped = lo.value + Math.round((clamp(v) - lo.value) / s) * s
  return clamp(Number(snapped.toFixed(Math.max(stepDecimals.value, 0))))
}

function setValue(v: number) {
  if (props.disabled) return
  const next = snap(v)
  if (next !== model.value) model.value = next
}

const text = computed(() =>
  props.format
    ? props.format(value.value)
    : withMinus(formatNumber(value.value, { minimumFractionDigits: stepDecimals.value, maximumFractionDigits: stepDecimals.value })),
)
const valueText = computed(() => (props.unit ? `${text.value} ${props.unit}` : text.value))

/* ── Geometry, in pixels so the ticks land on whole pixels at every size ─ */
const SIZES = { sm: 48, md: 64, lg: 88 } as const
const geometry = computed(() => {
  const size = SIZES[props.size]
  const c = size / 2
  const tickLength = props.size === 'sm' ? 4 : props.size === 'md' ? 5 : 7
  const tickWidth = props.size === 'lg' ? 2 : 1.5
  const outer = c - 1
  const inner = outer - tickLength
  const cap = inner - (props.size === 'sm' ? 3 : props.size === 'md' ? 4 : 6)
  return { size, c, tickLength, tickWidth, outer, cap }
})

const SWEEP = 270
const START = -135
const angle = computed(() => START + SWEEP * fraction.value)

const ticks = computed(() => {
  const n = Math.max(2, Math.round(props.detents))
  return Array.from({ length: n }, (_, i) => {
    const f = i / (n - 1)
    return { key: i, angle: START + SWEEP * f, lit: f <= fraction.value + 1e-6 }
  })
})

/* ── Pointer: drag up to turn clockwise. The whole range is 200px; Shift is fine control. ── */
let drag: { id: number; y: number; raw: number } | null = null

function onPointerDown(event: PointerEvent) {
  if (props.disabled || event.button !== 0) return
  event.preventDefault()
  dial.value?.focus({ preventScroll: true })
  dial.value?.setPointerCapture(event.pointerId)
  drag = { id: event.pointerId, y: event.clientY, raw: value.value }
  dragging.value = true
}

function onPointerMove(event: PointerEvent) {
  if (!drag || event.pointerId !== drag.id) return
  const perPixel = (hi.value - lo.value) / (event.shiftKey ? 1000 : 200)
  drag.raw = clamp(drag.raw + (drag.y - event.clientY) * perPixel)
  drag.y = event.clientY
  setValue(drag.raw)
}

function endDrag(event: PointerEvent) {
  if (!drag || event.pointerId !== drag.id) return
  if (dial.value?.hasPointerCapture(event.pointerId)) dial.value.releasePointerCapture(event.pointerId)
  drag = null
  dragging.value = false
}

/* ── Wheel: only while focused, so scrolling the page past a knob never turns it ── */
let wheelRest = 0
function onWheel(event: WheelEvent) {
  if (props.disabled || document.activeElement !== dial.value) return
  event.preventDefault()
  const delta = event.deltaMode === 1 ? event.deltaY * 33 : event.deltaY
  const multiplier = event.shiftKey ? 10 : 1
  // A mouse notch is one step; trackpad deltas add up to one.
  if (Math.abs(delta) >= 40) {
    wheelRest = 0
    setValue(value.value - Math.sign(delta) * props.step * multiplier)
    return
  }
  wheelRest += delta
  if (Math.abs(wheelRest) >= 40) {
    setValue(value.value - Math.sign(wheelRest) * props.step * multiplier)
    wheelRest = 0
  }
}

/* ── Keyboard ──────────────────────────────────────────────────────────── */
function onKeydown(event: KeyboardEvent) {
  if (props.disabled) return
  const step = props.step * (event.shiftKey ? 10 : 1)
  const page = Math.max(props.step * 10, (hi.value - lo.value) / 10)
  let next: number | null = null
  switch (event.key) {
    case 'ArrowUp':
    case 'ArrowRight':
      next = value.value + step
      break
    case 'ArrowDown':
    case 'ArrowLeft':
      next = value.value - step
      break
    case 'PageUp':
      next = value.value + page
      break
    case 'PageDown':
      next = value.value - page
      break
    case 'Home':
      next = lo.value
      break
    case 'End':
      next = hi.value
      break
  }
  if (next === null) return
  event.preventDefault()
  setValue(next)
}

onBeforeUnmount(() => {
  drag = null
})
</script>

<template>
  <div
    class="r-knob"
    :class="[`r-knob--${size}`, `r-knob--${tone}`, { 'is-disabled': disabled, 'is-dragging': dragging }]"
  >
    <span :id="labelId" class="r-knob__label">{{ label }}</span>
    <div
      ref="dial"
      class="r-knob__dial"
      role="slider"
      :tabindex="disabled ? -1 : 0"
      :aria-labelledby="labelId"
      :aria-valuemin="lo"
      :aria-valuemax="hi"
      :aria-valuenow="value"
      :aria-valuetext="valueText"
      :aria-disabled="disabled ? 'true' : undefined"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="endDrag"
      @pointercancel="endDrag"
      @lostpointercapture="endDrag"
      @keydown="onKeydown"
      @wheel="onWheel"
    >
      <svg
        class="r-knob__svg"
        :width="geometry.size"
        :height="geometry.size"
        :viewBox="`0 0 ${geometry.size} ${geometry.size}`"
        aria-hidden="true"
        focusable="false"
      >
        <rect
          v-for="tick in ticks"
          :key="tick.key"
          class="r-knob__tick"
          :class="{ 'is-lit': tick.lit }"
          :x="geometry.c - geometry.tickWidth / 2"
          :y="geometry.c - geometry.outer"
          :width="geometry.tickWidth"
          :height="geometry.tickLength"
          :transform="`rotate(${tick.angle} ${geometry.c} ${geometry.c})`"
        />
        <circle class="r-knob__cap" :cx="geometry.c" :cy="geometry.c" :r="geometry.cap - 0.5" />
        <line
          class="r-knob__indicator"
          :x1="geometry.c"
          :y1="geometry.c - geometry.cap * 0.32"
          :x2="geometry.c"
          :y2="geometry.c - geometry.cap + 4"
          :transform="`rotate(${angle} ${geometry.c} ${geometry.c})`"
        />
      </svg>
    </div>
    <span class="r-knob__value" aria-hidden="true">
      <span class="r-knob__number">{{ text }}</span>
      <span v-if="unit" class="r-knob__unit">{{ unit }}</span>
    </span>
  </div>
</template>

<style>
.r-knob {
  --r-knob-lit: var(--r-signal);
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  min-width: 0;
  color: var(--r-text);
  user-select: none;
  -webkit-user-select: none;
}

.r-knob--brand {
  --r-knob-lit: var(--r-brand);
}
.r-knob--neutral {
  --r-knob-lit: var(--r-ink);
}

.r-knob--sm {
  gap: 6px;
}

.r-knob__label {
  max-width: 100%;
  overflow: hidden;
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-weight: var(--r-weight-medium);
  line-height: 14px;
  letter-spacing: 0.08em;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
}
.r-knob--sm .r-knob__label {
  font-size: var(--r-text-3xs);
}

.r-knob__dial {
  display: block;
  flex: none;
  border-radius: var(--r-radius-control);
  cursor: ns-resize;
  touch-action: none;
}
.r-knob__dial:focus-visible {
  outline: 2px solid var(--r-focus);
  outline-offset: 2px;
}

.r-knob__svg {
  display: block;
  overflow: visible;
}

.r-knob__tick {
  fill: var(--r-border-strong);
}
.r-knob__tick.is-lit {
  fill: var(--r-knob-lit);
}

/* The cap: a round body is allowed here because a knob is a physical rotary control. */
.r-knob__cap {
  fill: var(--r-bg-surface);
  stroke: var(--r-border-strong);
  stroke-width: 1;
  transition: stroke var(--r-duration-fast) var(--r-ease-out);
}
.r-knob__dial:hover .r-knob__cap,
.r-knob.is-dragging .r-knob__cap {
  stroke: var(--r-text-tertiary);
}

.r-knob__indicator {
  stroke: var(--r-knob-lit);
  stroke-width: 2;
  stroke-linecap: square;
}
.r-knob--lg .r-knob__indicator {
  stroke-width: 2.5;
}

.r-knob__value {
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
  font-family: var(--r-font-mono);
  font-variant-numeric: tabular-nums;
  line-height: 16px;
  white-space: nowrap;
}
.r-knob__number {
  color: var(--r-text);
  font-size: var(--r-text-xs);
  font-weight: var(--r-weight-medium);
}
.r-knob--lg .r-knob__number {
  font-size: var(--r-text-sm);
}
.r-knob--sm .r-knob__number {
  font-size: var(--r-text-2xs);
}
.r-knob__unit {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-medium);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.r-knob.is-disabled {
  opacity: 0.45;
}
.r-knob.is-disabled .r-knob__dial {
  cursor: not-allowed;
}
</style>
