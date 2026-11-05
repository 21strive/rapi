<script setup lang="ts">
/**
 * A spring-return joystick for steering something that moves: a PTZ camera, a quay crane, a
 * ground-station antenna. The further the stick goes, the faster the thing moves; let go and the
 * stick springs back and the motion stops. Drag the stick, or hold the arrow keys on it (Shift
 * for slow); Home and the preset keys send it to a stored position.
 */
import { computed, ref, useId, watch } from 'vue'
import { RButton } from '@/design-system'
import { useTick } from '../../kit'
import { capture, clamp } from './shared'

interface Axis {
  label: string
  min: number
  max: number
  value: number
  /** Units per second at full deflection. */
  rate: number
  format: (v: number) => string
  /** The value wraps around (azimuth). */
  wrap?: boolean
}
interface Preset {
  label: string
  x: number
  y: number
}
interface Landmark {
  label: string
  at: number
}

const props = defineProps<{
  label: string
  meta?: string
  x: Axis
  y: Axis
  view: 'ptz' | 'crane' | 'sky'
  presets?: Preset[]
  /** Landmarks along the pan range (PTZ). */
  landmarks?: Landmark[]
  /** A point to hold the aim on (sky). */
  target?: { x: number; y: number; label: string }
}>()

const id = useId()
const xv = ref(props.x.value)
const yv = ref(props.y.value)
/** Stick deflection, −1…1 on each axis. */
const dx = ref(0)
const dy = ref(0)
const held = ref(false)
const well = ref<HTMLElement | null>(null)

function move(axis: Axis, v: number) {
  if (axis.wrap) {
    const span = axis.max - axis.min
    return ((((v - axis.min) % span) + span) % span) + axis.min
  }
  return clamp(v, axis.min, axis.max)
}

/* ── Motion: integrate the deflection while the tile is on screen ──────────── */
const tick = useTick(50)
let slow = false
watch(tick, () => {
  if (!dx.value && !dy.value) return
  const k = (slow ? 0.25 : 1) * 0.05
  xv.value = move(props.x, xv.value + dx.value * Math.abs(dx.value) * props.x.rate * k)
  yv.value = move(props.y, yv.value + dy.value * Math.abs(dy.value) * props.y.rate * k)
})

/* ── Pointer ─────────────────────────────────────────────────────────────── */
function deflect(event: PointerEvent) {
  if (!well.value) return
  const box = well.value.getBoundingClientRect()
  const r = box.width / 2 - 14
  dx.value = clamp((event.clientX - (box.left + box.width / 2)) / r, -1, 1)
  dy.value = clamp(-(event.clientY - (box.top + box.height / 2)) / r, -1, 1)
}
function onPointerdown(event: PointerEvent) {
  if (event.button !== 0 || !well.value) return
  event.preventDefault()
  well.value.focus({ preventScroll: true })
  capture(well.value, event)
  held.value = true
  slow = event.shiftKey
  deflect(event)
}
function onPointermove(event: PointerEvent) {
  if (held.value) deflect(event)
}
function letGo() {
  held.value = false
  dx.value = 0
  dy.value = 0
}

/* ── Keys: an arrow held is the stick held over ─────────────────────────── */
const down = new Set<string>()
function fromKeys() {
  dx.value = (down.has('ArrowRight') ? 1 : 0) - (down.has('ArrowLeft') ? 1 : 0)
  dy.value = (down.has('ArrowUp') ? 1 : 0) - (down.has('ArrowDown') ? 1 : 0)
}
function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Home') {
    event.preventDefault()
    go(props.x.value, props.y.value)
    return
  }
  if (!event.key.startsWith('Arrow')) return
  event.preventDefault()
  slow = event.shiftKey
  down.add(event.key)
  fromKeys()
}
function onKeyup(event: KeyboardEvent) {
  if (!event.key.startsWith('Arrow')) return
  down.delete(event.key)
  fromKeys()
}
function onBlur() {
  down.clear()
  letGo()
}

function go(x: number, y: number) {
  xv.value = x
  yv.value = y
}

const valueText = computed(() => `${props.x.label} ${props.x.format(xv.value)}, ${props.y.label} ${props.y.format(yv.value)}`)
const fx = computed(() => (xv.value - props.x.min) / (props.x.max - props.x.min))
const fy = computed(() => (yv.value - props.y.min) / (props.y.max - props.y.min))
/** Where a tilt of 0° sits in the PTZ strip. */
const horizon = computed(() => `${(1 - (0 - props.y.min) / (props.y.max - props.y.min)) * 100}%`)

/* ── Sky plot: elevation rings, azimuth from north clockwise ──────────────── */
const sky = (az: number, el: number) => {
  const r = (1 - el / 90) * 46
  const a = (az * Math.PI) / 180
  return { x: 50 + r * Math.sin(a), y: 50 - r * Math.cos(a) }
}
const aim = computed(() => sky(xv.value, yv.value))
const goal = computed(() => (props.target ? sky(props.target.x, props.target.y) : null))
const off = computed(() => {
  if (!props.target) return 0
  // Angular distance on the sky, in degrees.
  const r = Math.PI / 180
  const [a1, e1, a2, e2] = [xv.value * r, yv.value * r, props.target.x * r, props.target.y * r]
  const c = Math.sin(e1) * Math.sin(e2) + Math.cos(e1) * Math.cos(e2) * Math.cos(a1 - a2)
  return Math.acos(clamp(c, -1, 1)) / r
})
const locked = computed(() => !!props.target && off.value < 0.5)
</script>

<template>
  <div class="mk stick">
    <div class="mk-row mk-between">
      <span :id="`${id}-label`" class="r-eyebrow mk-truncate">{{ label }}</span>
      <span v-if="meta" class="r-label stick__meta">{{ meta }}</span>
    </div>

    <dl class="stick__read">
      <div>
        <dt class="r-label">{{ x.label }}</dt>
        <dd>{{ x.format(xv) }}</dd>
      </div>
      <div>
        <dt class="r-label">{{ y.label }}</dt>
        <dd>{{ y.format(yv) }}</dd>
      </div>
      <div v-if="target" class="stick__lock">
        <dt class="r-label">{{ target.label }}</dt>
        <dd :class="locked ? 'is-locked' : undefined">{{ locked ? 'On target' : `${off.toFixed(1)}° off` }}</dd>
      </div>
    </dl>

    <div class="stick__body mk-grow">
      <div class="stick__view" aria-hidden="true">
        <!-- PTZ: the camera's view box over a strip of the whole pan range. -->
        <template v-if="view === 'ptz'">
          <span
            v-for="l in landmarks"
            :key="l.label"
            class="stick__mark"
            :class="{ 'is-flip': (l.at - x.min) / (x.max - x.min) > 0.75 }"
            :style="{ left: `${((l.at - x.min) / (x.max - x.min)) * 100}%`, top: horizon }"
          >
            <span>{{ l.label }}</span>
          </span>
          <span class="stick__horizon" :style="{ top: horizon }" />
          <span class="stick__fov" :style="{ left: `${fx * 100}%`, top: `${(1 - fy) * 100}%` }" />
        </template>

        <!-- Crane: seen from the side, the trolley on the boom and the spreader on its ropes. -->
        <template v-else-if="view === 'crane'">
          <span class="stick__boom" />
          <span class="stick__quay"><span>Quay</span></span>
          <span class="stick__hull"><span>Vessel</span></span>
          <span class="stick__trolley" :style="{ left: `${fx * 100}%` }" />
          <span class="stick__rope" :style="{ left: `${fx * 100}%`, height: `${(1 - fy) * 78}%` }" />
          <span class="stick__spreader" :style="{ left: `${fx * 100}%`, top: `${10 + (1 - fy) * 78}%` }" />
        </template>

        <!-- Sky: rings at 0, 30 and 60 degrees of elevation, north up. -->
        <svg v-else class="stick__sky" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
          <circle v-for="e in [0, 30, 60]" :key="e" class="stick__ring" cx="50" cy="50" :r="(1 - e / 90) * 46" />
          <line class="stick__ring" x1="50" y1="4" x2="50" y2="96" />
          <line class="stick__ring" x1="4" y1="50" x2="96" y2="50" />
          <text class="stick__cardinal" x="50" y="3" text-anchor="middle">N</text>
          <circle v-if="goal" class="stick__goal" :cx="goal.x" :cy="goal.y" r="3" />
          <rect class="stick__aim" :x="aim.x - 3" :y="aim.y - 3" width="6" height="6" />
        </svg>
      </div>

      <div
        ref="well"
        class="stick__well"
        role="slider"
        tabindex="0"
        :aria-labelledby="`${id}-label`"
        :aria-valuemin="x.min"
        :aria-valuemax="x.max"
        :aria-valuenow="Math.round(xv)"
        :aria-valuetext="valueText"
        @pointerdown="onPointerdown"
        @pointermove="onPointermove"
        @pointerup="letGo"
        @pointercancel="letGo"
        @lostpointercapture="letGo"
        @keydown="onKeydown"
        @keyup="onKeyup"
        @blur="onBlur"
      >
        <span class="stick__axis stick__axis--v" aria-hidden="true" />
        <span class="stick__axis stick__axis--h" aria-hidden="true" />
        <span
          class="stick__head"
          :class="{ 'is-held': held || dx || dy }"
          :style="{ transform: `translate(calc(-50% + ${dx * 38}px), calc(-50% - ${dy * 38}px))` }"
          aria-hidden="true"
        />
      </div>
    </div>

    <div v-if="presets?.length" class="stick__presets" role="group" :aria-label="`${label} presets`">
      <span class="r-label">Go to</span>
      <RButton v-for="p in presets" :key="p.label" size="xs" variant="outline" @click="go(p.x, p.y)">{{ p.label }}</RButton>
    </div>
  </div>
</template>

<style scoped>
.stick {
  gap: 8px;
}

.stick__meta {
  flex: none;
}

.stick__read {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 16px;
}
.stick__read div {
  display: flex;
  align-items: baseline;
  gap: 6px;
}
.stick__read dd {
  margin: 0;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-medium);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.stick__read dd.is-locked {
  color: var(--r-success-text);
}
.stick__lock {
  margin-left: auto;
}

.stick__body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 112px;
  gap: 12px;
  min-height: 0;
}

.stick__view {
  position: relative;
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--r-border);
  background: var(--r-bg-muted);
}

/* PTZ */
.stick__horizon {
  position: absolute;
  right: 0;
  left: 0;
  height: 1px;
  background: var(--r-border-strong);
}
.stick__mark {
  position: absolute;
  bottom: 0;
  width: 1px;
  background: var(--r-border);
}
.stick__mark span {
  position: absolute;
  bottom: 4px;
  left: 4px;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  white-space: nowrap;
}
.stick__mark.is-flip span {
  right: 4px;
  left: auto;
}
.stick__fov {
  position: absolute;
  width: 34%;
  height: 46%;
  border: 2px solid var(--r-brand);
  transform: translate(-50%, -50%);
}

/* Crane */
.stick__boom {
  position: absolute;
  top: 10%;
  right: 4%;
  left: 4%;
  height: 2px;
  background: var(--r-text-secondary);
}
.stick__quay {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 30%;
  height: 18%;
  border-top: 1px solid var(--r-border-strong);
  border-right: 1px solid var(--r-border-strong);
}
.stick__hull {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 58%;
  height: 34%;
  border-top: 1px solid var(--r-border-strong);
  border-left: 1px solid var(--r-border-strong);
}
.stick__quay span,
.stick__hull span {
  position: absolute;
  bottom: 4px;
  left: 6px;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.stick__trolley {
  position: absolute;
  top: calc(10% - 5px);
  width: 14px;
  height: 10px;
  background: var(--r-ink);
  transform: translateX(-50%);
}
.stick__rope {
  position: absolute;
  top: 10%;
  width: 1px;
  background: var(--r-text-secondary);
}
.stick__spreader {
  position: absolute;
  width: 30px;
  height: 6px;
  background: var(--r-brand);
  transform: translateX(-50%);
}

/* Sky */
.stick__sky {
  position: absolute;
  inset: 4px;
  width: calc(100% - 8px);
  height: calc(100% - 8px);
}
.stick__ring {
  fill: none;
  stroke: var(--r-border-strong);
  stroke-width: 0.5;
}
.stick__cardinal {
  fill: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: 5px;
}
.stick__goal {
  fill: var(--r-chart-1);
  stroke: var(--r-bg-muted);
  stroke-width: 1;
}
.stick__aim {
  fill: none;
  stroke: var(--r-ink);
  stroke-width: 1;
}

/* The well: a square gate with a cross, the stick head springs back to the middle. */
.stick__well {
  position: relative;
  align-self: center;
  width: 112px;
  height: 112px;
  border: 1px solid var(--r-border-strong);
  background: var(--r-bg-muted);
  cursor: grab;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}
.stick__well:active {
  cursor: grabbing;
}
.stick__well:focus-visible {
  outline: 2px solid var(--r-focus);
  outline-offset: 2px;
}
.stick__axis {
  position: absolute;
  background: var(--r-border);
}
.stick__axis--v {
  top: 8px;
  bottom: 8px;
  left: 50%;
  width: 1px;
}
.stick__axis--h {
  top: 50%;
  right: 8px;
  left: 8px;
  height: 1px;
}
.stick__head {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 28px;
  height: 28px;
  border: 2px solid var(--r-bg-surface);
  background: var(--r-ink);
  transition: transform var(--r-duration-base) var(--r-ease-out);
}
.stick__head.is-held {
  transition: none;
}

.stick__presets {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}
.stick__presets .r-label {
  margin-right: 4px;
}
</style>
