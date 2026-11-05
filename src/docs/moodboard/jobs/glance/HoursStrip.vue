<script setup lang="ts">
/**
 * Today in twenty-four squares, with now as an orange line through it: the tariff, the clearing
 * window, the busy hours. One look says what now means and when that changes; point at an hour,
 * or arrow to it, to read it, and "Now" brings the reading back.
 */
import { computed, ref } from 'vue'
import { RButton } from '@/design-system'
import { num, pad, useNow, type Zone } from '../../kit'
import { TZ, zoned } from './shared'

interface State {
  id: string
  word: string
  /** Fill of the hours in this state: a token. */
  fill: string
  /** What the state means: "Rp 1.553/kWh", "Settles next working day". */
  note?: string
}

interface Level {
  upTo: number
  word: string
}

const props = withDefaults(
  defineProps<{
    label: string
    /** State mode: the legend, and each hour's state id. */
    states?: State[]
    hours?: string[]
    /** Magnitude mode: one value per hour, drawn as columns. */
    values?: number[]
    /** Words for magnitudes, ascending. */
    levels?: Level[]
    /** Unit of a magnitude: "visitors". */
    unit?: string
    zone?: Zone
  }>(),
  { states: () => [], hours: () => [], levels: () => [], zone: 'WIB' },
)

const magnitude = computed(() => !!props.values?.length)
const max = computed(() => Math.max(1, ...(props.values ?? [0])))
const now = useNow(30000)
const clock = computed(() => zoned(now.value, TZ[props.zone]))
const nowHour = computed(() => clock.value.h)
const nowAt = computed(() => ((clock.value.h + clock.value.m / 60) / 24) * 100)

const pinned = ref<number | null>(null)
const hovered = ref<number | null>(null)
const at = computed(() => hovered.value ?? pinned.value ?? nowHour.value)

const stateOf = (h: number) => props.states.find((s) => s.id === props.hours[h])
const levelOf = (v: number) => props.levels.find((l) => v <= l.upTo)?.word ?? ''
const span = (h: number) => `${pad(h)}:00–${pad((h + 1) % 24)}:00`
const reading = computed(() => {
  const h = at.value
  if (magnitude.value) {
    const v = props.values?.[h] ?? 0
    return { word: v ? levelOf(v) : 'Closed', note: v ? `${num(v)} ${props.unit ?? ''}`.trim() : '', fill: 'var(--r-chart-1)' }
  }
  const s = stateOf(h)
  return { word: s?.word ?? '', note: s?.note ?? '', fill: s?.fill ?? 'var(--r-chart-track)' }
})
const valueText = computed(() => `${span(at.value)}${at.value === nowHour.value ? ', now' : ''}, ${reading.value.word}${reading.value.note ? `, ${reading.value.note}` : ''}`)

function indexAt(event: PointerEvent | MouseEvent) {
  const box = (event.currentTarget as HTMLElement).getBoundingClientRect()
  return Math.max(0, Math.min(23, Math.floor(((event.clientX - box.left) / box.width) * 24)))
}
function onKeydown(event: KeyboardEvent) {
  const from = pinned.value ?? nowHour.value
  let next: number | undefined
  if (event.key === 'ArrowRight' || event.key === 'ArrowUp') next = from + 1
  else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') next = from - 1
  else if (event.key === 'PageUp') next = from + 6
  else if (event.key === 'PageDown') next = from - 6
  else if (event.key === 'Home') next = 0
  else if (event.key === 'End') next = 23
  if (next === undefined) return
  event.preventDefault()
  hovered.value = null
  pinned.value = Math.max(0, Math.min(23, next))
}
</script>

<template>
  <div class="mk hours">
    <div class="mk-row mk-between">
      <span class="r-label mk-truncate">{{ label }}</span>
      <span class="r-label hours__zone">{{ zone }}</span>
    </div>
    <div class="hours__strip mk-grow">
      <div
        class="hours__cells"
        :class="{ 'is-magnitude': magnitude }"
        role="slider"
        tabindex="0"
        :aria-label="`${label}, hour`"
        aria-valuemin="0"
        aria-valuemax="23"
        :aria-valuenow="at"
        :aria-valuetext="valueText"
        @pointermove="hovered = indexAt($event)"
        @pointerleave="hovered = null"
        @click="pinned = indexAt($event)"
        @keydown="onKeydown"
      >
        <span v-for="h in 24" :key="h" class="hours__cell" :class="{ 'is-on': h - 1 === at }" aria-hidden="true">
          <span
            v-if="magnitude"
            class="hours__bar"
            :style="{ height: values?.[h - 1] ? `${Math.max(6, ((values?.[h - 1] ?? 0) / max) * 100)}%` : '0' }"
          />
          <span v-else class="hours__fill" :style="{ background: stateOf(h - 1)?.fill }" />
        </span>
        <span class="hours__now" :style="{ left: `${nowAt}%` }" aria-hidden="true" />
      </div>
      <div class="hours__ticks" aria-hidden="true">
        <span v-for="t in [0, 6, 12, 18]" :key="t" :style="{ left: `${(t / 24) * 100}%` }">{{ pad(t) }}</span>
        <span class="is-end" :style="{ left: '100%' }">24</span>
      </div>
    </div>
    <div class="hours__foot">
      <p class="hours__read" aria-hidden="true">
        <span class="hours__when">{{ span(at) }}</span>
        <span v-if="at === nowHour" class="hours__nowword">Now</span>
        <span class="hours__swatch" :style="{ background: reading.fill }" />
        <span class="hours__word">{{ reading.word }}</span>
        <span v-if="reading.note" class="hours__note mk-truncate">{{ reading.note }}</span>
      </p>
      <RButton v-if="at !== nowHour" size="xs" variant="ghost" @click="(pinned = null), (hovered = null)">Now</RButton>
      <ul v-else-if="states.length" class="hours__legend" aria-hidden="true">
        <li v-for="s in states" :key="s.id"><span class="hours__swatch" :style="{ background: s.fill }" />{{ s.word }}</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.hours {
  gap: 8px;
}

.hours__zone {
  flex: none;
}

.hours__strip {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-height: 0;
}

.hours__cells {
  position: relative;
  display: flex;
  flex: 1 1 auto;
  gap: 2px;
  min-height: 18px;
  cursor: crosshair;
  touch-action: pan-y;
}

.hours__cells.is-magnitude {
  border-bottom: 1px solid var(--r-chart-axis);
}

.hours__cells:focus-visible {
  outline-offset: 3px;
}

.hours__cell {
  display: flex;
  flex: 1 1 0;
  align-items: flex-end;
  min-width: 0;
}

.hours__cell.is-on {
  outline: 1px solid var(--r-text);
  outline-offset: 1px;
}

.hours__fill {
  width: 100%;
  height: 100%;
}

.hours__bar {
  width: 100%;
  background: var(--r-chart-1);
}

/* Now: the signal-orange line, placed by the minute. */
.hours__now {
  position: absolute;
  top: -4px;
  bottom: -4px;
  width: 2px;
  background: var(--r-chart-now);
  transform: translateX(-1px);
  pointer-events: none;
}

.hours__ticks {
  position: relative;
  height: 10px;
  color: var(--r-chart-label);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.hours__ticks span {
  position: absolute;
  top: 0;
}

.hours__ticks .is-end {
  transform: translateX(-100%);
}

.hours__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
  min-height: 24px;
}

.hours__read {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  font-size: var(--r-text-xs);
}

.hours__when {
  flex: none;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-variant-numeric: tabular-nums;
}

.hours__nowword {
  flex: none;
  color: var(--r-signal-text);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.hours__swatch {
  flex: none;
  width: 8px;
  height: 8px;
}

.hours__word {
  flex: none;
  font-weight: var(--r-weight-medium);
}

.hours__note {
  color: var(--r-text-tertiary);
}

.hours__legend {
  display: flex;
  flex: none;
  gap: 10px;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.hours__legend li {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
</style>
