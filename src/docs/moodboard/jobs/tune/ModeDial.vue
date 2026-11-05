<script setup lang="ts">
/**
 * A rotary selector: a pointer knob with its positions printed around it, like a camera's mode
 * dial or a pump's Hand–Off–Auto switch. Every mode is visible at once and the pointer says which
 * one is live. Drag around the dial or click a position; arrows, Home and End step through; the
 * wheel turns it while it has focus. Wide tiles add a ruled legend of what each position does.
 */
import { computed, ref, useId } from 'vue'
import { capture, clamp, focusedWheel, pointerAngle } from './shared'

interface Position {
  label: string
  /** Text printed on the dial, when it differs from the label ("1", "AUTO"). */
  dial?: string
  /** What the position does, in a short plain line. */
  note: string
}

const props = withDefaults(
  defineProps<{
    label: string
    positions: Position[]
    value?: number
    /** Degrees the positions spread over, centred on twelve o'clock. */
    sweep?: number
    /** A ruled legend beside the dial (wide tiles). */
    legend?: boolean
  }>(),
  { value: 0, sweep: 270, legend: false },
)

const id = useId()
const index = ref(props.value)
const current = computed(() => props.positions[index.value])
const dial = ref<HTMLElement | null>(null)

/* ── Geometry ─────────────────────────────────────────────────────────────── */
const W = 148
const H = 88
const CX = W / 2
const CY = 48
const CAP = 19
const RING = 26
const LABEL = 39

const angleOf = (i: number) => {
  const n = props.positions.length
  return n < 2 ? 0 : -props.sweep / 2 + (props.sweep * i) / (n - 1)
}
const rad = (deg: number) => (deg * Math.PI) / 180

const marks = computed(() =>
  props.positions.map((p, i) => {
    const a = angleOf(i)
    const s = Math.sin(rad(a))
    const c = Math.cos(rad(a))
    return {
      i,
      a,
      text: p.dial ?? p.label.toUpperCase(),
      x: CX + LABEL * s,
      y: CY - LABEL * c,
      anchor: s > 0.3 ? 'start' : s < -0.3 ? 'end' : 'middle',
    }
  }),
)

function select(i: number) {
  index.value = clamp(i, 0, props.positions.length - 1)
}

/* ── Pointer: the position nearest the pointer's angle ───────────────────── */
let dragging = false
function nearest(event: PointerEvent) {
  const a = pointerAngle(event, dial.value!)
  let best = 0
  let gap = Infinity
  props.positions.forEach((_, i) => {
    const d = Math.abs(a - angleOf(i))
    if (d < gap) {
      gap = d
      best = i
    }
  })
  select(best)
}
function onPointerdown(event: PointerEvent) {
  if (event.button !== 0) return
  event.preventDefault()
  dial.value?.focus({ preventScroll: true })
  capture(dial.value, event)
  dragging = true
  nearest(event)
}
function onPointermove(event: PointerEvent) {
  if (dragging) nearest(event)
}
function onPointerup() {
  dragging = false
}

const onWheel = focusedWheel((dir) => select(index.value + dir))

function onKeydown(event: KeyboardEvent) {
  const map: Record<string, number> = {
    ArrowRight: index.value + 1,
    ArrowUp: index.value + 1,
    ArrowLeft: index.value - 1,
    ArrowDown: index.value - 1,
    Home: 0,
    End: props.positions.length - 1,
  }
  if (!(event.key in map)) return
  event.preventDefault()
  select(map[event.key])
}
</script>

<template>
  <div class="mk dial" :class="{ 'dial--legend': legend }">
    <div class="dial__main">
      <p :id="`${id}-label`" class="r-label mk-truncate dial__label">{{ label }}</p>
      <div
        ref="dial"
        class="dial__knob"
        role="slider"
        tabindex="0"
        :aria-labelledby="`${id}-label`"
        :aria-valuemin="0"
        :aria-valuemax="positions.length - 1"
        :aria-valuenow="index"
        :aria-valuetext="current.label"
        @pointerdown="onPointerdown"
        @pointermove="onPointermove"
        @pointerup="onPointerup"
        @pointercancel="onPointerup"
        @lostpointercapture="onPointerup"
        @wheel="onWheel"
        @keydown="onKeydown"
      >
        <svg :width="W" :height="H" :viewBox="`0 0 ${W} ${H}`" aria-hidden="true" focusable="false">
          <g v-for="m in marks" :key="m.i">
            <rect
              class="dial__tick"
              :class="{ 'is-on': m.i === index }"
              :x="CX - 1"
              :y="CY - RING - 5"
              width="2"
              height="5"
              :transform="`rotate(${m.a} ${CX} ${CY})`"
            />
            <text class="dial__text" :class="{ 'is-on': m.i === index }" :x="m.x" :y="m.y" dy="0.35em" :text-anchor="m.anchor">
              {{ m.text }}
            </text>
          </g>
          <!-- The cap is a physical rotary control, the one round body allowed. -->
          <circle class="dial__cap" :cx="CX" :cy="CY" :r="CAP" />
          <g class="dial__pointer" :style="{ transform: `rotate(${angleOf(index)}deg)` }">
            <rect class="dial__bar" :x="CX - 3" :y="CY - CAP" width="6" :height="CAP * 2" />
            <rect class="dial__nose" :x="CX - 1" :y="CY - CAP + 2" width="2" height="8" />
          </g>
        </svg>
      </div>
      <p v-if="!legend" class="dial__note mk-truncate">{{ current.note }}</p>
    </div>

    <ol v-if="legend" class="dial__legend">
      <li v-for="(p, i) in positions" :key="p.label">
        <button type="button" class="dial__row mk-reset" :class="{ 'is-on': i === index }" :aria-pressed="i === index" @click="select(i)">
          <span class="dial__key">{{ p.dial ?? i }}</span>
          <span class="dial__name">
            <span class="mk-truncate">{{ p.label }}</span>
            <span v-if="i === index" class="dial__spec mk-truncate">{{ p.note }}</span>
          </span>
        </button>
      </li>
    </ol>
  </div>
</template>

<style scoped>
.dial {
  align-items: center;
  gap: 2px;
  padding-top: 0;
  padding-bottom: 10px;
}

.dial__main {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-width: 0;
  max-width: 100%;
}

.dial__label {
  max-width: 100%;
}

.dial__knob {
  cursor: grab;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}
.dial__knob:active {
  cursor: grabbing;
}
.dial__knob:focus-visible {
  outline: 2px solid var(--r-focus);
  outline-offset: 0;
}
.dial__knob svg {
  display: block;
}

.dial__tick {
  fill: var(--r-border-strong);
}
.dial__tick.is-on {
  fill: var(--r-brand);
}

.dial__text {
  fill: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-medium);
  letter-spacing: 0.04em;
  transition: fill var(--r-duration-fast) var(--r-ease-out);
}
.dial__text.is-on {
  fill: var(--r-text);
  font-weight: var(--r-weight-semibold);
}

.dial__cap {
  fill: var(--r-bg-surface);
  stroke: var(--r-border-strong);
  stroke-width: 1;
}
.dial__knob:hover .dial__cap {
  stroke: var(--r-text-tertiary);
}

.dial__pointer {
  transform-box: view-box;
  transform-origin: 74px 48px;
  transition: transform var(--r-duration-base) var(--r-ease-out);
}
.dial__bar {
  fill: var(--r-ink);
}
.dial__nose {
  fill: var(--r-on-ink);
}

.dial__note {
  max-width: 100%;
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  line-height: 16px;
  text-align: center;
}

/* Wide: the dial on the left, a ruled legend of positions on the right. */
.dial--legend {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: stretch;
  gap: 12px;
  padding-top: 4px;
  padding-bottom: 12px;
}

.dial__legend {
  display: flex;
  flex-direction: column;
  min-width: 0;
  border-top: 1px solid var(--r-border-subtle);
}
.dial__legend li {
  display: flex;
  flex: 1 1 0;
  min-height: 0;
  border-bottom: 1px solid var(--r-border-subtle);
}

.dial__row {
  display: flex;
  flex: 1;
  align-items: center;
  gap: 8px;
  min-width: 0;
  padding: 0 6px;
  border-left: 2px solid transparent;
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  cursor: pointer;
}
.dial__row:hover {
  background: var(--r-bg-hover);
  color: var(--r-text);
}
.dial__row.is-on {
  border-left-color: var(--r-brand);
  background: var(--r-bg-selected);
  color: var(--r-text);
}
.dial__row:focus-visible {
  outline-offset: -2px;
}

.dial__key {
  flex: none;
  width: 14px;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
}

.dial__name {
  display: flex;
  flex-direction: column;
  min-width: 0;
  line-height: 1.3;
}
.dial__row.is-on .dial__name > :first-child {
  font-weight: var(--r-weight-medium);
}
.dial__spec {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-3xs);
}
</style>
