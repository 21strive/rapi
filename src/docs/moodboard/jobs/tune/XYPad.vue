<script setup lang="ts">
/**
 * Two values that act together, set with one point: warmth and brightness of a light, level and
 * span of a thermal camera, temperature and tint of a grade, where a load's centre of gravity
 * sits on a truck bed. Drag anywhere on the pad, or focus the handle and use the arrow keys
 * (left and right for one value, up and down for the other, Shift for ten steps); Home or a
 * double-click returns to the start, and presets jump.
 */
import { computed, ref, useId } from 'vue'
import { RButton } from '@/design-system'
import { capture, clamp, sliderKey, snapTo } from './shared'

interface Axis {
  label: string
  min: number
  max: number
  step: number
  value: number
  format: (v: number) => string
  /** Words at the two ends of the axis, low then high. */
  ends?: [string, string]
}
interface Preset {
  label: string
  x: number
  y: number
}
interface Say {
  text: string
  word?: string
  tone?: 'success' | 'warning' | 'danger'
}

const props = defineProps<{
  label: string
  x: Axis
  y: Axis
  presets?: Preset[]
  /** What sits behind the pad. */
  backdrop?: 'warmth' | 'truck' | 'thermal'
  status?: (x: number, y: number) => Say
}>()

const id = useId()
const xv = ref(props.x.value)
const yv = ref(props.y.value)
const pad = ref<HTMLElement | null>(null)
const handle = ref<HTMLElement | null>(null)
const dragging = ref(false)

const fx = computed(() => (xv.value - props.x.min) / (props.x.max - props.x.min))
const fy = computed(() => (yv.value - props.y.min) / (props.y.max - props.y.min))
const setX = (v: number) => (xv.value = snapTo(v, props.x.min, props.x.max, props.x.step))
const setY = (v: number) => (yv.value = snapTo(v, props.y.min, props.y.max, props.y.step))

function fromPointer(event: PointerEvent) {
  if (!pad.value) return
  const box = pad.value.getBoundingClientRect()
  const px = clamp((event.clientX - box.left) / box.width, 0, 1)
  const py = clamp(1 - (event.clientY - box.top) / box.height, 0, 1)
  setX(props.x.min + px * (props.x.max - props.x.min))
  setY(props.y.min + py * (props.y.max - props.y.min))
}
function onPointerdown(event: PointerEvent) {
  if (event.button !== 0 || !pad.value) return
  event.preventDefault()
  handle.value?.focus({ preventScroll: true })
  capture(pad.value, event)
  dragging.value = true
  fromPointer(event)
}
function onPointermove(event: PointerEvent) {
  if (dragging.value) fromPointer(event)
}
function onPointerup() {
  dragging.value = false
}

function reset() {
  xv.value = props.x.value
  yv.value = props.y.value
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Home') {
    event.preventDefault()
    reset()
    return
  }
  const horizontal = event.key === 'ArrowLeft' || event.key === 'ArrowRight'
  const vertical = event.key === 'ArrowUp' || event.key === 'ArrowDown'
  if (!horizontal && !vertical) return
  event.preventDefault()
  if (horizontal) {
    const next = sliderKey(event, xv.value, { min: props.x.min, max: props.x.max, step: props.x.step })
    if (next !== null) setX(next)
  } else {
    const next = sliderKey(event, yv.value, { min: props.y.min, max: props.y.max, step: props.y.step })
    if (next !== null) setY(next)
  }
}

const said = computed(() => props.status?.(xv.value, yv.value))

/** Thermal: 24 cells across the x range; inside the window (level ± span / 2) they step from
 *  dark to light as a white-hot palette does, outside they are off. */
const thermal = computed(() => {
  const n = 24
  const lo = xv.value - yv.value / 2
  const hi = xv.value + yv.value / 2
  return Array.from({ length: n }, (_, i) => {
    const t = props.x.min + ((i + 0.5) / n) * (props.x.max - props.x.min)
    if (t < lo) return 0
    if (t > hi) return 100
    return Math.round(((t - lo) / Math.max(1e-6, hi - lo)) * 4) * 25
  })
})
const valueText = computed(() => `${props.x.label} ${props.x.format(xv.value)}, ${props.y.label} ${props.y.format(yv.value)}`)
const isPreset = (p: Preset) => p.x === xv.value && p.y === yv.value
</script>

<template>
  <div class="mk xy">
    <div class="mk-row mk-between">
      <span :id="`${id}-label`" class="r-eyebrow mk-truncate">{{ label }}</span>
    </div>

    <dl class="xy__read">
      <div>
        <dt class="r-label">{{ x.label }}</dt>
        <dd>{{ x.format(xv) }}</dd>
      </div>
      <div>
        <dt class="r-label">{{ y.label }}</dt>
        <dd>{{ y.format(yv) }}</dd>
      </div>
    </dl>

    <div
      ref="pad"
      class="xy__pad mk-grow"
      :class="[backdrop ? `xy__pad--${backdrop}` : null, { 'is-dragging': dragging }]"
      @pointerdown="onPointerdown"
      @pointermove="onPointermove"
      @pointerup="onPointerup"
      @pointercancel="onPointerup"
      @lostpointercapture="onPointerup"
      @dblclick="reset"
    >
      <div v-if="backdrop === 'warmth'" class="xy__warmth" aria-hidden="true">
        <span v-for="n in 6" :key="n" :class="`is-${n}`" />
      </div>
      <div v-if="backdrop === 'truck'" class="xy__truck" aria-hidden="true">
        <span class="xy__cab">Cab</span>
        <span class="xy__axle" style="top: 12.5%"><span>Front axle</span></span>
        <span class="xy__axle" style="top: 87.5%"><span>Rear axles</span></span>
      </div>
      <span v-for="g in [25, 50, 75]" :key="`v${g}`" class="xy__rule xy__rule--v" :style="{ left: `${g}%` }" aria-hidden="true" />
      <span v-for="g in [25, 50, 75]" :key="`h${g}`" class="xy__rule xy__rule--h" :style="{ top: `${g}%` }" aria-hidden="true" />
      <span class="xy__cross xy__cross--v" :style="{ left: `${fx * 100}%` }" aria-hidden="true" />
      <span class="xy__cross xy__cross--h" :style="{ top: `${(1 - fy) * 100}%` }" aria-hidden="true" />
      <span v-if="x.ends" class="xy__end xy__end--l" aria-hidden="true">{{ x.ends[0] }}</span>
      <span v-if="x.ends" class="xy__end xy__end--r" aria-hidden="true">{{ x.ends[1] }}</span>
      <span v-if="y.ends" class="xy__end xy__end--b" aria-hidden="true">{{ y.ends[0] }}</span>
      <span v-if="y.ends" class="xy__end xy__end--t" aria-hidden="true">{{ y.ends[1] }}</span>
      <span
        ref="handle"
        class="xy__handle"
        :style="{ left: `${fx * 100}%`, top: `${(1 - fy) * 100}%` }"
        role="slider"
        tabindex="0"
        :aria-labelledby="`${id}-label`"
        :aria-valuemin="x.min"
        :aria-valuemax="x.max"
        :aria-valuenow="xv"
        :aria-valuetext="valueText"
        @keydown="onKeydown"
      />
    </div>

    <div v-if="backdrop === 'thermal'" class="xy__window" aria-hidden="true">
      <span
        v-for="(c, i) in thermal"
        :key="i"
        class="xy__cell"
        :style="{ background: `color-mix(in srgb, var(--r-ink) ${c}%, var(--r-bg-muted))` }"
      />
    </div>

    <div v-if="said" class="xy__say" aria-live="polite">
      <span class="mk-truncate">{{ said.text }}</span>
      <span v-if="said.word" class="xy__word" :class="`is-${said.tone}`">{{ said.word }}</span>
    </div>

    <div v-if="presets?.length" class="xy__presets" role="group" :aria-label="`${label} presets`">
      <RButton
        v-for="p in presets"
        :key="p.label"
        size="xs"
        :variant="isPreset(p) ? 'solid' : 'outline'"
        @click="(setX(p.x), setY(p.y))"
      >
        {{ p.label }}
      </RButton>
    </div>
  </div>
</template>

<style scoped>
.xy {
  gap: 8px;
}

.xy__read {
  display: flex;
  gap: 16px;
}
.xy__read div {
  display: flex;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
}
.xy__read dd {
  margin: 0;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-medium);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.xy__pad {
  position: relative;
  min-height: 80px;
  border: 1px solid var(--r-border-strong);
  cursor: crosshair;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}

/* Ruled into quarters, like graph paper. */
.xy__rule {
  position: absolute;
  pointer-events: none;
  background: var(--r-border);
}
.xy__rule--v {
  top: 0;
  bottom: 0;
  width: 1px;
}
.xy__rule--h {
  right: 0;
  left: 0;
  height: 1px;
}

.xy__cross {
  position: absolute;
  pointer-events: none;
  background: var(--r-text-tertiary);
}
.xy__cross--v {
  top: 0;
  bottom: 0;
  width: 1px;
}
.xy__cross--h {
  right: 0;
  left: 0;
  height: 1px;
}

.xy__handle {
  position: absolute;
  z-index: 1;
  width: 14px;
  height: 14px;
  border: 2px solid var(--r-bg-surface);
  background: var(--r-ink);
  transform: translate(-50%, -50%);
  cursor: grab;
}
.xy__pad.is-dragging .xy__handle {
  cursor: grabbing;
}
.xy__handle:focus-visible {
  outline: 2px solid var(--r-focus);
  outline-offset: 1px;
}

.xy__end {
  position: absolute;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.04em;
  line-height: 12px;
  text-transform: uppercase;
  pointer-events: none;
}
.xy__end--l {
  bottom: 4px;
  left: 6px;
}
.xy__end--r {
  right: 6px;
  bottom: 4px;
}
.xy__end--b {
  right: 6px;
  bottom: 18px;
}
.xy__end--t {
  top: 4px;
  right: 6px;
}

/* Warmth: six stepped columns from warm to cool, never a gradient. */
.xy__warmth {
  position: absolute;
  inset: 0;
  display: flex;
}
.xy__warmth span {
  flex: 1;
}
.xy__warmth .is-1 {
  background: color-mix(in srgb, var(--r-div-neg) 18%, transparent);
}
.xy__warmth .is-2 {
  background: color-mix(in srgb, var(--r-div-neg) 11%, transparent);
}
.xy__warmth .is-3 {
  background: color-mix(in srgb, var(--r-div-neg) 5%, transparent);
}
.xy__warmth .is-4 {
  background: color-mix(in srgb, var(--r-div-pos) 5%, transparent);
}
.xy__warmth .is-5 {
  background: color-mix(in srgb, var(--r-div-pos) 11%, transparent);
}
.xy__warmth .is-6 {
  background: color-mix(in srgb, var(--r-div-pos) 18%, transparent);
}

/* Truck bed seen from above: the cab at the top, the axles as rules. */
.xy__truck {
  position: absolute;
  inset: 0;
  background: var(--r-bg-muted);
}
.xy__cab {
  position: absolute;
  top: -1px;
  right: 30%;
  left: 30%;
  height: 8%;
  border: 1px solid var(--r-border-strong);
  border-top: 0;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.04em;
  line-height: 1.6;
  text-align: center;
  text-transform: uppercase;
}
.xy__axle {
  position: absolute;
  right: 0;
  left: 0;
  height: 1px;
  background: var(--r-border-strong);
}
.xy__axle span {
  position: absolute;
  right: 6px;
  bottom: 3px;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.xy__window {
  display: flex;
  gap: 1px;
  height: 10px;
}
.xy__cell {
  flex: 1;
}

.xy__say {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
}
.xy__word {
  flex: none;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.xy__word.is-success {
  color: var(--r-success-text);
}
.xy__word.is-warning {
  color: var(--r-warning-text);
}
.xy__word.is-danger {
  color: var(--r-danger-text);
}

.xy__presets {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
</style>
