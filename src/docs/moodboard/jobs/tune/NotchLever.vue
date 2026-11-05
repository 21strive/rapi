<script setup lang="ts">
/**
 * A lever in a notched gate: a train's master controller, a flap lever, a ship's engine
 * telegraph, a transformer's tap changer. One position per notch, in a fixed order, and nothing
 * in between. Drag the handle, click a notch, or use the arrow keys (Home and End for the ends).
 * The train's lever drives a small live model, so the speed answers the notch.
 */
import { computed, ref, useId, watch } from 'vue'
import { useTick } from '../../kit'
import { capture, clamp } from './shared'

interface Notch {
  label: string
  /** A rule above this notch, with an optional group word ("Astern"). */
  group?: string
  /** What the notch means, shown under the readout. */
  note?: string
  tone?: 'success' | 'warning' | 'danger'
}

const props = withDefaults(
  defineProps<{
    label: string
    notches: Notch[]
    value: number
    /** Big readout for a notch; defaults to its label. */
    readout?: (index: number) => string
    unit?: string
    /** A live model: acceleration per notch in km/h per second, and a starting speed. */
    accel?: number[]
    speed?: number
    maxSpeed?: number
  }>(),
  { maxSpeed: 100 },
)

const id = useId()
const index = ref(props.value)
const slot = ref<HTMLElement | null>(null)
const current = computed(() => props.notches[index.value])
const set = (i: number) => (index.value = clamp(Math.round(i), 0, props.notches.length - 1))
const at = (i: number) => `${(i / Math.max(1, props.notches.length - 1)) * 100}%`
/** Halfway between notch i − 1 and notch i: where a group rule goes. */
const between = (i: number) => `${((i - 0.5) / Math.max(1, props.notches.length - 1)) * 100}%`

/* ── Pointer: the notch nearest the pointer ──────────────────────────────── */
let dragging = false
function fromPointer(event: PointerEvent) {
  if (!slot.value) return
  const box = slot.value.getBoundingClientRect()
  set(((event.clientY - box.top) / box.height) * (props.notches.length - 1))
}
function onPointerdown(event: PointerEvent) {
  if (event.button !== 0) return
  event.preventDefault()
  const el = event.currentTarget as HTMLElement
  el.focus({ preventScroll: true })
  capture(el, event)
  dragging = true
  fromPointer(event)
}
function onPointermove(event: PointerEvent) {
  if (dragging) fromPointer(event)
}
function onPointerup() {
  dragging = false
}

function onKeydown(event: KeyboardEvent) {
  const keys: Record<string, number> = {
    ArrowUp: index.value - 1,
    ArrowLeft: index.value - 1,
    ArrowDown: index.value + 1,
    ArrowRight: index.value + 1,
    Home: 0,
    End: props.notches.length - 1,
  }
  if (!(event.key in keys)) return
  event.preventDefault()
  set(keys[event.key])
}

const big = computed(() => (props.readout ? props.readout(index.value) : current.value.label))

/* ── The live model: speed follows the notch, while the tile is on screen ─── */
const speed = ref(props.speed ?? 0)
const tick = props.accel ? useTick(250) : ref(0)
watch(tick, () => {
  if (!props.accel) return
  const a = props.accel[index.value] ?? 0
  speed.value = clamp(speed.value + a * 0.25, 0, props.maxSpeed)
})
</script>

<template>
  <div class="mk lever">
    <p :id="`${id}-label`" class="r-label mk-truncate">{{ label }}</p>
    <div class="lever__readout">
      <p class="lever__big">
        <span class="mk-fig">{{ big }}</span>
        <span v-if="unit" class="mk-unit">{{ unit }}</span>
      </p>
      <p v-if="current.note" class="lever__note" :class="current.tone ? `is-${current.tone}` : undefined">{{ current.note }}</p>
      <p v-if="accel" class="lever__speed" aria-live="off">
        <span class="r-label">Speed</span>
        <span class="lever__kmh">{{ Math.round(speed) }}</span>
        <span class="mk-unit">km/h</span>
      </p>
    </div>

    <div
      class="lever__gate mk-grow"
      role="slider"
      tabindex="0"
      aria-orientation="vertical"
      :aria-labelledby="`${id}-label`"
      :aria-valuemin="0"
      :aria-valuemax="notches.length - 1"
      :aria-valuenow="index"
      :aria-valuetext="current.note ? `${current.label}, ${current.note}` : current.label"
      @pointerdown="onPointerdown"
      @pointermove="onPointermove"
      @pointerup="onPointerup"
      @pointercancel="onPointerup"
      @lostpointercapture="onPointerup"
      @keydown="onKeydown"
    >
      <div ref="slot" class="lever__slot">
        <template v-for="(n, i) in notches" :key="i">
          <span v-if="n.group !== undefined && i > 0" class="lever__group" :style="{ top: between(i) }" aria-hidden="true">
            <span class="lever__rule" />
            <span v-if="n.group" class="lever__word">{{ n.group }}</span>
          </span>
          <span class="lever__notch" :class="{ 'is-on': i === index }" :style="{ top: at(i) }" aria-hidden="true">
            <span class="lever__label">{{ n.label }}</span>
            <span class="lever__tick" />
          </span>
        </template>
        <span class="lever__channel" aria-hidden="true" />
        <span class="lever__handle" :style="{ top: at(index) }" aria-hidden="true" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.lever {
  gap: 8px;
}

.lever__readout {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--r-border-subtle);
}

.lever__big {
  display: flex;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
}
.lever__big .mk-fig {
  overflow: hidden;
  font-size: var(--r-text-2xl);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lever__note {
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  line-height: 1.35;
}
.lever__note.is-success {
  color: var(--r-success-text);
}
.lever__note.is-warning {
  color: var(--r-warning-text);
}
.lever__note.is-danger {
  color: var(--r-danger-text);
}

.lever__speed {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-top: 4px;
}
.lever__kmh {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-md);
  font-weight: var(--r-weight-medium);
  font-variant-numeric: tabular-nums;
}

.lever__gate {
  display: flex;
  padding: 10px 0;
  cursor: ns-resize;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}
.lever__gate:focus-visible {
  outline: none;
}
.lever__gate:focus-visible .lever__handle {
  outline: 2px solid var(--r-focus);
  outline-offset: 2px;
}

.lever__slot {
  position: relative;
  flex: 1;
}

.lever__channel {
  position: absolute;
  top: -6px;
  bottom: -6px;
  left: calc(62% - 3px);
  width: 6px;
  border: 1px solid var(--r-border-strong);
  background: var(--r-bg-muted);
}

.lever__notch {
  position: absolute;
  right: 0;
  left: 0;
  display: flex;
  align-items: center;
  height: 0;
}

.lever__label {
  position: absolute;
  right: calc(38% + 24px);
  overflow: hidden;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-medium);
  line-height: 12px;
  letter-spacing: 0.04em;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
  transform: translateY(-50%);
}
.lever__notch.is-on .lever__label {
  color: var(--r-text);
  font-weight: var(--r-weight-semibold);
}

.lever__tick {
  position: absolute;
  left: calc(62% + 6px);
  width: 8px;
  height: 1px;
  background: var(--r-border-strong);
}
.lever__notch.is-on .lever__tick {
  background: var(--r-brand);
}

.lever__group {
  position: absolute;
  right: 0;
  left: 0;
  display: flex;
  align-items: center;
  gap: 4px;
  height: 12px;
  transform: translateY(-50%);
}
.lever__rule {
  flex: 1;
  height: 1px;
  background: var(--r-border);
}
.lever__word {
  flex: none;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.04em;
  line-height: 12px;
  text-transform: uppercase;
}

/* The handle: a square ink cap across the channel, as on the fader. */
.lever__handle {
  position: absolute;
  left: calc(62% - 18px);
  width: 36px;
  height: 14px;
  background: var(--r-ink);
  transform: translateY(-50%);
  transition: top var(--r-duration-fast) var(--r-ease-out);
}
.lever__handle::after {
  content: '';
  position: absolute;
  top: 50%;
  right: 3px;
  left: 3px;
  height: 1px;
  background: var(--r-on-ink);
}
</style>
