<script setup lang="ts">
/**
 * A channel fader, as on a mixing desk: a square cap on a rail, a printed scale, and a live level
 * meter beside it. Drag the cap or click the rail; arrow keys move one step, Page keys ten, Home
 * and End the ends; double-click puts it back to its reset value.
 */
import { computed, ref, watch } from 'vue'
import { capturePointer, reducedMotion, snap, useTick } from '../../kit'

const props = withDefaults(
  defineProps<{
    /** Channel name in mono caps: "VOX 1". */
    label: string
    /** Quiet line under the label: "Lead vocal". */
    sub?: string
    min?: number
    max?: number
    step?: number
    value?: number
    /** Where a double-click returns the fader. */
    reset?: number
    unit?: string
    /** Printed scale, top to bottom. */
    marks?: number[]
    /** A live level meter beside the rail. */
    meter?: boolean
    /** The bottom of the scale reads −∞ (fully off), as on an audio fader. */
    infinity?: boolean
    /** Fixed decimals for the readout. */
    decimals?: number
  }>(),
  {
    min: -60,
    max: 6,
    step: 0.5,
    value: 0,
    reset: 0,
    unit: 'dB',
    marks: () => [6, 0, -6, -12, -24, -40, -60],
    meter: true,
    infinity: true,
    decimals: 1,
  },
)

const value = ref(props.value)
const track = ref<HTMLElement | null>(null)
const span = computed(() => props.max - props.min)
const ratio = computed(() => (value.value - props.min) / span.value)

function text(v: number, decimals = props.decimals) {
  if (props.infinity && v <= props.min) return '−∞'
  const abs = Math.abs(v).toFixed(decimals)
  return v > 0 ? `+${abs}` : v < 0 ? `−${abs}` : abs
}
const markText = (m: number) => text(m, 0)
const markAt = (m: number) => `${((m - props.min) / span.value) * 100}%`

function setFromPointer(event: PointerEvent) {
  const box = track.value!.getBoundingClientRect()
  const cap = 14
  const t = 1 - (event.clientY - box.top - cap / 2) / (box.height - cap)
  value.value = snap(props.min + t * span.value, props.min, props.max, props.step)
}

function onPointerdown(event: PointerEvent) {
  if (event.button !== 0) return
  const el = event.currentTarget as HTMLElement
  capturePointer(el, event.pointerId)
  el.focus()
  setFromPointer(event)
  const move = (e: PointerEvent) => setFromPointer(e)
  const up = () => {
    el.removeEventListener('pointermove', move)
    el.removeEventListener('pointerup', up)
    el.removeEventListener('pointercancel', up)
  }
  el.addEventListener('pointermove', move)
  el.addEventListener('pointerup', up)
  el.addEventListener('pointercancel', up)
}

function onKeydown(event: KeyboardEvent) {
  const big = props.step * 10
  const keys: Record<string, number> = {
    ArrowUp: props.step,
    ArrowRight: props.step,
    ArrowDown: -props.step,
    ArrowLeft: -props.step,
    PageUp: big,
    PageDown: -big,
  }
  let next: number | undefined
  if (event.key in keys) next = value.value + keys[event.key]
  else if (event.key === 'Home') next = props.min
  else if (event.key === 'End') next = props.max
  if (next === undefined) return
  event.preventDefault()
  value.value = snap(next, props.min, props.max, props.step)
}

/* ── Meter: follows the fader, with a little life in it ──────────────────────────────── */
const SEGMENTS = 18
const tick = useTick(90)
const level = ref(ratio.value * 0.86)
const still = reducedMotion()
watch([tick, ratio], () => {
  const base = ratio.value * 0.86
  level.value = still ? base : Math.max(0, Math.min(1, base + (Math.random() - 0.55) * 0.18 * (base > 0 ? 1 : 0)))
})
const lit = computed(() => Math.round(level.value * SEGMENTS))
</script>

<template>
  <div class="mk fader">
    <p class="fader__readout">
      <span class="mk-fig">{{ text(value) }}</span>
      <span class="mk-unit">{{ unit }}</span>
    </p>
    <div class="fader__body mk-grow">
      <ol class="fader__scale" aria-hidden="true">
        <li v-for="m in marks" :key="m" :style="{ bottom: markAt(m) }">{{ markText(m) }}</li>
      </ol>
      <div
        ref="track"
        class="fader__track"
        role="slider"
        tabindex="0"
        :aria-label="sub ? `${label}, ${sub}` : label"
        aria-orientation="vertical"
        :aria-valuemin="min"
        :aria-valuemax="max"
        :aria-valuenow="value"
        :aria-valuetext="`${text(value)} ${unit}`"
        :style="{ '--p': ratio }"
        @pointerdown="onPointerdown"
        @keydown="onKeydown"
        @dblclick="value = reset"
      >
        <span class="fader__rail" />
        <span class="fader__fill" />
        <span class="fader__cap" />
      </div>
      <div v-if="meter" class="fader__meter" aria-hidden="true">
        <span
          v-for="i in SEGMENTS"
          :key="i"
          :class="{ 'is-on': SEGMENTS - i < lit, 'is-peak': i === 1 && lit >= SEGMENTS }"
        />
      </div>
    </div>
    <p class="fader__label">
      <span class="r-eyebrow mk-truncate">{{ label }}</span>
      <span v-if="sub" class="fader__sub mk-truncate">{{ sub }}</span>
    </p>
  </div>
</template>

<style scoped>
.fader {
  gap: 10px;
}

.fader__readout {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 4px;
}

.fader__readout .mk-fig {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-lg);
  font-weight: var(--r-weight-medium);
  letter-spacing: 0;
}

.fader__body {
  display: grid;
  grid-template-columns: 1fr 40px 1fr;
  align-items: stretch;
}

.fader__scale {
  position: relative;
  margin: 7px 0;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.fader__scale li {
  position: absolute;
  right: 0;
  display: flex;
  align-items: center;
  gap: 4px;
  transform: translateY(50%);
}

.fader__scale li::after {
  content: '';
  width: 6px;
  height: 1px;
  background: var(--r-border-strong);
}

.fader__track {
  position: relative;
  cursor: ns-resize;
  touch-action: none;
  outline: none;
}

.fader__track:focus-visible .fader__cap {
  outline: 2px solid var(--r-focus);
  outline-offset: 2px;
}

.fader__rail,
.fader__fill {
  position: absolute;
  left: 50%;
  width: 2px;
  transform: translateX(-50%);
}

.fader__rail {
  top: 7px;
  bottom: 7px;
  background: var(--r-border-strong);
}

.fader__fill {
  bottom: 7px;
  height: calc(var(--p) * (100% - 14px));
  background: var(--r-brand);
}

.fader__cap {
  position: absolute;
  bottom: calc(var(--p) * (100% - 14px));
  left: 50%;
  width: 32px;
  height: 14px;
  background: var(--r-ink);
  transform: translateX(-50%);
}

.fader__cap::after {
  content: '';
  position: absolute;
  top: 50%;
  right: 3px;
  left: 3px;
  height: 1px;
  background: var(--r-on-ink);
}

.fader__meter {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 6px;
  margin: 7px 0;
}

.fader__meter span {
  flex: 1;
  background: var(--r-bg-track);
}

.fader__meter span.is-on {
  background: var(--r-text-secondary);
}

.fader__meter span.is-peak {
  background: var(--r-signal);
}

.fader__label {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  text-align: center;
}

.fader__sub {
  max-width: 100%;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}
</style>
