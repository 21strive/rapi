<script setup lang="ts">
/**
 * A tuning tape: the scale slides under a fixed cobalt index, as on a radio dial or a heading
 * tape. Tuning is a search, so the scale around the value stays in view while it moves. Drag the
 * tape sideways, click a mark to jump, scroll while focused, or use the arrow keys (Shift for ten
 * steps, Page keys for bigger jumps). Works on a continuous scale, a circular one (headings) or a
 * row of click stops (shutter speeds, headways, tenors).
 */
import { computed, ref, useId } from 'vue'
import { RButton, RReadout, useElementSize } from '@/design-system'
import { num } from '../../kit'
import { capture, clamp, decimalsOf, focusedWheel, sliderKey, snapTo } from './shared'

interface Stop {
  label: string
  /** Text printed on the tape when it differs from the label. */
  short?: string
}
interface Preset {
  label: string
  value: number
}

const props = withDefaults(
  defineProps<{
    label: string
    /** Continuous scale. Ignored when `stops` is given. */
    min?: number
    max?: number
    step?: number
    value: number
    /** Pixels per step on the tape. */
    px?: number
    /** A tick every N steps, a label every M steps. */
    tickEvery?: number
    labelEvery?: number
    /** 0 = 360: the value wraps around (headings). */
    wrap?: boolean
    /** Click stops instead of a scale; `value` is then the index. */
    stops?: Stop[]
    unit?: string
    format?: (v: number) => string
    /** Tape label for a mark, when it differs from the readout format. */
    mark?: (v: number) => string
    note?: (v: number) => string
    presets?: Preset[]
    font?: 'mono' | 'pixel' | 'sans'
    size?: 'sm' | 'md'
  }>(),
  { min: 0, max: 100, step: 1, px: 4, tickEvery: 1, labelEvery: 10, wrap: false, font: 'mono', size: 'md' },
)

const id = useId()
const stepped = computed(() => !!props.stops?.length)
const lo = computed(() => (stepped.value ? 0 : props.min))
const hi = computed(() => (stepped.value ? props.stops!.length - 1 : props.max))
const step = computed(() => (stepped.value ? 1 : props.step))
const px = computed(() => (stepped.value ? Math.max(props.px, 48) : props.px))
const value = ref(props.value)

function norm(v: number) {
  if (props.wrap) {
    const span = hi.value - lo.value + step.value
    return snapTo(((((v - lo.value) % span) + span) % span) + lo.value, lo.value, hi.value, step.value)
  }
  return snapTo(v, lo.value, hi.value, step.value)
}
const set = (v: number) => (value.value = norm(v))

const text = (v: number) => {
  if (stepped.value) return props.stops![Math.round(v)]?.label ?? ''
  return props.format ? props.format(v) : num(v, decimalsOf(props.step))
}
const markText = (v: number) => {
  if (stepped.value) {
    const s = props.stops![Math.round(v)]
    return s?.short ?? s?.label ?? ''
  }
  return props.mark ? props.mark(v) : text(v)
}

/* ── Tape geometry: only the ticks in view are drawn ────────────────────────── */
const tape = ref<HTMLElement | null>(null)
const { width } = useElementSize(tape)
const W = computed(() => Math.max(100, width.value))
const H = 40
const ticks = computed(() => {
  const half = W.value / 2 / px.value + 2
  const out: { k: number; v: number; x: number; major: boolean; label: string }[] = []
  const first = Math.ceil((value.value - lo.value) / step.value - half)
  const last = Math.floor((value.value - lo.value) / step.value + half)
  const count = Math.round((hi.value - lo.value) / step.value)
  for (let k = first; k <= last; k++) {
    let idx = k
    if (props.wrap) idx = ((k % (count + 1)) + count + 1) % (count + 1)
    else if (k < 0 || k > count) continue
    if (!stepped.value && idx % props.tickEvery !== 0) continue
    const v = lo.value + idx * step.value
    const x = W.value / 2 + (k * step.value + lo.value - value.value) * (px.value / step.value)
    const major = stepped.value || idx % props.labelEvery === 0
    out.push({ k, v, x, major, label: major ? markText(v) : '' })
  }
  return out
})

/* ── Pointer: pull the tape; a tap without movement jumps to that mark ─────── */
let start: { id: number; x: number; v: number; moved: number } | null = null
function onPointerdown(event: PointerEvent) {
  if (event.button !== 0 || !tape.value) return
  event.preventDefault()
  tape.value.focus({ preventScroll: true })
  capture(tape.value, event)
  start = { id: event.pointerId, x: event.clientX, v: value.value, moved: 0 }
}
function onPointermove(event: PointerEvent) {
  if (!start || event.pointerId !== start.id) return
  const dx = event.clientX - start.x
  start.moved = Math.max(start.moved, Math.abs(dx))
  set(start.v - (dx / px.value) * step.value)
}
function onPointerup(event: PointerEvent) {
  if (!start || event.pointerId !== start.id) return
  if (start.moved < 3 && tape.value) {
    const box = tape.value.getBoundingClientRect()
    set(start.v + ((event.clientX - box.left - box.width / 2) / px.value) * step.value)
  }
  start = null
}

const onWheel = focusedWheel((dir, event) => set(value.value + dir * step.value * (event.shiftKey ? 10 : 1)))

function onKeydown(event: KeyboardEvent) {
  const page = stepped.value ? 1 : step.value * props.labelEvery
  const next = sliderKey(event, value.value, { min: lo.value, max: hi.value, step: step.value, page })
  if (next === null) return
  event.preventDefault()
  // On a circular scale, Home and End mean north, not the ends of a line.
  if (props.wrap && (event.key === 'Home' || event.key === 'End')) return set(lo.value)
  set(props.wrap ? next : clamp(next, lo.value, hi.value))
}

const valueText = computed(() => [text(value.value), props.unit].filter(Boolean).join(' '))
const noteText = computed(() => props.note?.(value.value) ?? '')
</script>

<template>
  <div class="mk tape" :class="`tape--${size}`">
    <div class="tape__top">
      <RReadout :label="label" :value="text(value)" :unit="unit" :font="font" :ghost="font === 'pixel'" :size="size" />
      <div v-if="presets?.length" class="tape__presets" role="group" :aria-label="`${label} presets`">
        <RButton
          v-for="p in presets"
          :key="p.label"
          size="xs"
          :variant="Math.abs(value - p.value) < step / 2 ? 'solid' : 'outline'"
          @click="set(p.value)"
        >
          {{ p.label }}
        </RButton>
      </div>
    </div>

    <div
      :id="id"
      ref="tape"
      class="tape__tape"
      role="slider"
      tabindex="0"
      :aria-label="`${label} tape`"
      :aria-valuemin="lo"
      :aria-valuemax="hi"
      :aria-valuenow="value"
      :aria-valuetext="valueText"
      @pointerdown="onPointerdown"
      @pointermove="onPointermove"
      @pointerup="onPointerup"
      @pointercancel="onPointerup"
      @wheel="onWheel"
      @keydown="onKeydown"
    >
      <svg :width="W" :height="H" aria-hidden="true" focusable="false">
        <g v-for="t in ticks" :key="t.k">
          <rect class="tape__tick" :class="{ 'is-major': t.major }" :x="Math.round(t.x) - 0.5" :y="t.major ? 22 : 28" width="1" :height="t.major ? 18 : 12" />
          <text v-if="t.label" class="tape__label" :x="t.x" y="14" text-anchor="middle">{{ t.label }}</text>
        </g>
        <rect class="tape__index" :x="W / 2 - 1" y="0" width="2" :height="H" />
      </svg>
    </div>

    <p v-if="noteText" class="tape__note mk-truncate" aria-live="polite">{{ noteText }}</p>
  </div>
</template>

<style scoped>
.tape {
  gap: 8px;
}

.tape__top {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
}

.tape__presets {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 4px;
  min-width: 0;
}

.tape__tape {
  position: relative;
  flex: none;
  height: 40px;
  overflow: hidden;
  border-top: 1px solid var(--r-border);
  border-bottom: 1px solid var(--r-border);
  background: var(--r-bg-muted);
  cursor: ew-resize;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}
.tape__tape:focus-visible {
  outline: 2px solid var(--r-focus);
  outline-offset: 1px;
}
.tape__tape svg {
  display: block;
}

.tape__tick {
  fill: var(--r-border-strong);
}
.tape__tick.is-major {
  fill: var(--r-text-tertiary);
}

.tape__label {
  fill: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
}

.tape__index {
  fill: var(--r-brand);
}

.tape__note {
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  line-height: 16px;
}
</style>
