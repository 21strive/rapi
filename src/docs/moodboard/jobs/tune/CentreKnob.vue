<script setup lang="ts">
/**
 * A knob with a centre detent: zero at twelve o'clock, the lit ticks running from the centre to
 * the value, and a word at each end of the sweep ("Cooler", "Warmer"). Turning through zero
 * holds there for a moment, the way a detent clicks. Drag up or down, scroll while focused, or
 * use the arrow keys; double-click, 0 or Delete return to the centre.
 *
 * With a `target`, a slip ball under the knob shows how far the value is from where it should be,
 * as on an aircraft's turn coordinator: trim until the ball is centred.
 */
import { computed, ref, useId } from 'vue'
import { capture, clamp, decimalsOf, focusedWheel, plusMinus, sliderKey, snapTo } from './shared'

const props = withDefaults(
  defineProps<{
    label: string
    /** Symmetric range: −range … +range. */
    range: number
    step?: number
    value?: number
    unit?: string
    /** Words at the two ends of the sweep. */
    ends: [string, string]
    format?: (v: number) => string
    note?: (v: number) => string
    /** Where the value should be; shows the slip ball. */
    target?: number
    /** How close counts as centred. */
    tolerance?: number
  }>(),
  { step: 1, value: 0, tolerance: 0.25 },
)

const id = useId()
const value = ref(props.value)
const dial = ref<HTMLElement | null>(null)
const dragging = ref(false)
const fraction = computed(() => value.value / props.range)

const text = computed(() => (props.format ? props.format(value.value) : plusMinus(value.value, decimalsOf(props.step))))
const valueText = computed(() => [text.value, props.unit].filter(Boolean).join(' '))

function set(v: number) {
  value.value = snapTo(v, -props.range, props.range, props.step)
}

/* ── Geometry ─────────────────────────────────────────────────────────────── */
const SIZE = 76
const C = SIZE / 2
const OUTER = C - 1
const TICK = 5
const CAP = OUTER - TICK - 5
const DETENTS = 21
const SWEEP = 270
const angle = computed(() => (SWEEP / 2) * fraction.value)
const ticks = computed(() =>
  Array.from({ length: DETENTS }, (_, i) => {
    const f = (i / (DETENTS - 1)) * 2 - 1
    const lo = Math.min(0, fraction.value) - 1e-6
    const hi = Math.max(0, fraction.value) + 1e-6
    return { i, angle: (SWEEP / 2) * f, centre: i === (DETENTS - 1) / 2, lit: f >= lo && f <= hi && fraction.value !== 0 }
  }),
)

/* ── Pointer: drag up to turn clockwise; 200px is the whole sweep, Shift is fine control.
      Crossing zero holds there for 4% of the range: the detent. ───────────────────────── */
let drag: { id: number; y: number; raw: number; held: number } | null = null

function onPointerdown(event: PointerEvent) {
  if (event.button !== 0) return
  event.preventDefault()
  dial.value?.focus({ preventScroll: true })
  capture(dial.value, event)
  drag = { id: event.pointerId, y: event.clientY, raw: value.value, held: 0 }
  dragging.value = true
}

function onPointermove(event: PointerEvent) {
  if (!drag || event.pointerId !== drag.id) return
  const span = props.range * 2
  const delta = (drag.y - event.clientY) * (span / (event.shiftKey ? 1000 : 200))
  drag.y = event.clientY
  const before = drag.raw
  let next = clamp(before + delta, -props.range, props.range)
  if ((before > 0 && next < 0) || (before < 0 && next > 0)) {
    drag.held = 0
    next = 0
  }
  if (before === 0 && next !== 0 && drag.held < span * 0.04) {
    drag.held += Math.abs(delta)
    next = 0
  }
  drag.raw = next
  set(next)
}

function onPointerup(event: PointerEvent) {
  if (!drag || event.pointerId !== drag.id) return
  if (dial.value?.hasPointerCapture(event.pointerId)) dial.value.releasePointerCapture(event.pointerId)
  drag = null
  dragging.value = false
}

const onWheel = focusedWheel((dir, event) => set(value.value + dir * props.step * (event.shiftKey ? 10 : 1)))

function onKeydown(event: KeyboardEvent) {
  if (event.key === '0' || event.key === 'Delete' || event.key === 'Backspace') {
    event.preventDefault()
    set(0)
    return
  }
  const next = sliderKey(event, value.value, { min: -props.range, max: props.range, step: props.step })
  if (next === null) return
  event.preventDefault()
  set(next)
}

/* ── Slip ball ────────────────────────────────────────────────────────────── */
const off = computed(() => (props.target === undefined ? 0 : value.value - props.target))
const centred = computed(() => Math.abs(off.value) <= props.tolerance)
const ball = computed(() => clamp(off.value / (props.range * 0.6), -1, 1))
const offText = computed(() => {
  if (props.target === undefined) return ''
  const need = -off.value
  const t = props.format ? props.format(need) : plusMinus(need, decimalsOf(props.step))
  return `${t} to go`
})
</script>

<template>
  <div class="mk centre" :class="{ 'centre--slip': target !== undefined }">
    <div class="mk-row mk-between centre__head">
      <span :id="`${id}-label`" class="r-label mk-truncate">{{ label }}</span>
      <span class="centre__value">
        <span class="centre__number">{{ text }}</span>
        <span v-if="unit" class="mk-unit">{{ unit }}</span>
      </span>
    </div>

    <div class="centre__body">
      <span class="centre__end" aria-hidden="true">{{ ends[0] }}</span>
      <div
        ref="dial"
        class="centre__dial"
        :class="{ 'is-dragging': dragging }"
        role="slider"
        tabindex="0"
        :aria-labelledby="`${id}-label`"
        :aria-valuemin="-range"
        :aria-valuemax="range"
        :aria-valuenow="value"
        :aria-valuetext="valueText"
        @pointerdown="onPointerdown"
        @pointermove="onPointermove"
        @pointerup="onPointerup"
        @pointercancel="onPointerup"
        @lostpointercapture="onPointerup"
        @wheel="onWheel"
        @keydown="onKeydown"
        @dblclick="set(0)"
      >
        <svg :width="SIZE" :height="SIZE" :viewBox="`0 0 ${SIZE} ${SIZE}`" aria-hidden="true" focusable="false">
          <rect
            v-for="t in ticks"
            :key="t.i"
            class="centre__tick"
            :class="{ 'is-lit': t.lit, 'is-centre': t.centre }"
            :x="C - (t.centre ? 1 : 0.75)"
            :y="C - OUTER - (t.centre ? 2 : 0)"
            :width="t.centre ? 2 : 1.5"
            :height="t.centre ? TICK + 2 : TICK"
            :transform="`rotate(${t.angle} ${C} ${C})`"
          />
          <circle class="centre__cap" :cx="C" :cy="C" :r="CAP" />
          <line
            class="centre__pointer"
            :x1="C"
            :y1="C - CAP * 0.3"
            :x2="C"
            :y2="C - CAP + 4"
            :transform="`rotate(${angle} ${C} ${C})`"
          />
        </svg>
      </div>
      <span class="centre__end centre__end--right" aria-hidden="true">{{ ends[1] }}</span>
    </div>

    <p v-if="note" class="centre__note mk-truncate">{{ note(value) }}</p>

    <div v-if="target !== undefined" class="centre__slip">
      <div class="mk-row mk-between">
        <span class="r-label">Slip</span>
        <span class="centre__word" :class="centred ? 'is-good' : 'is-off'" aria-live="polite">
          {{ centred ? 'Ball centred' : offText }}
        </span>
      </div>
      <div class="centre__tube" aria-hidden="true">
        <span class="centre__cage" />
        <span class="centre__ball" :class="{ 'is-centred': centred }" :style="{ '--b': ball }" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.centre {
  gap: 6px;
  padding-top: 2px;
  padding-bottom: 10px;
}

.centre__head {
  align-items: baseline;
}

.centre__value {
  display: inline-flex;
  flex: none;
  align-items: baseline;
  gap: 4px;
  white-space: nowrap;
}

.centre__number {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-md);
  font-weight: var(--r-weight-medium);
  font-variant-numeric: tabular-nums;
}

/* The dial in the middle; the end words sit in the gap at the bottom of the sweep. */
.centre__body {
  position: relative;
  display: flex;
  justify-content: center;
  padding-bottom: 6px;
}

.centre__end {
  position: absolute;
  bottom: 0;
  max-width: calc(50% - 8px);
  overflow: hidden;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-medium);
  line-height: 12px;
  letter-spacing: 0.06em;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
}
.centre__end:first-child {
  right: calc(50% + 10px);
  text-align: right;
}
.centre__end--right {
  left: calc(50% + 10px);
  text-align: left;
}

.centre__dial {
  display: block;
  touch-action: none;
  cursor: ns-resize;
  user-select: none;
  -webkit-user-select: none;
}
.centre__dial:focus-visible {
  outline: 2px solid var(--r-focus);
  outline-offset: 2px;
}
.centre__dial svg {
  display: block;
  overflow: visible;
}

.centre__tick {
  fill: var(--r-border-strong);
}
.centre__tick.is-centre {
  fill: var(--r-text-tertiary);
}
.centre__tick.is-lit {
  fill: var(--r-brand);
}

/* A knob is a physical rotary control: its cap is the one round body allowed here. */
.centre__cap {
  fill: var(--r-bg-surface);
  stroke: var(--r-border-strong);
  stroke-width: 1;
  transition: stroke var(--r-duration-fast) var(--r-ease-out);
}
.centre__dial:hover .centre__cap,
.centre__dial.is-dragging .centre__cap {
  stroke: var(--r-text-tertiary);
}

.centre__pointer {
  stroke: var(--r-text);
  stroke-width: 2;
  stroke-linecap: square;
}

.centre__note {
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  line-height: 16px;
  text-align: center;
}

/* Slip ball: a straight tube with a cage in the middle. */
.centre--slip .centre__body {
  margin-top: auto;
}
.centre__slip {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: auto;
  padding-top: 10px;
  border-top: 1px solid var(--r-border-subtle);
}

.centre__word {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-medium);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  white-space: nowrap;
}
.centre__word.is-good {
  color: var(--r-success-text);
}
.centre__word.is-off {
  color: var(--r-text-secondary);
}

.centre__tube {
  position: relative;
  height: 16px;
  border: 1px solid var(--r-border-strong);
  background: var(--r-bg-muted);
}

.centre__cage {
  position: absolute;
  top: -1px;
  bottom: -1px;
  left: 50%;
  width: 18px;
  border-right: 1px solid var(--r-text-tertiary);
  border-left: 1px solid var(--r-text-tertiary);
  transform: translateX(-50%);
}

.centre__ball {
  position: absolute;
  top: 2px;
  left: calc(50% + var(--b) * (50% - 10px));
  width: 10px;
  height: 10px;
  border-radius: var(--r-radius-round);
  background: var(--r-text);
  transform: translateX(-50%);
  transition: left var(--r-duration-base) var(--r-ease-out);
}
.centre__ball.is-centred {
  background: var(--r-status-good);
}
</style>
