<script setup lang="ts">
/**
 * Ninety days as ninety squares, a month to a row. Quiet days stay grey so the bad ones are the
 * only colour on the tile. Point at a day, or arrow along the strip, to read it; a click pins it.
 */
import { computed, ref } from 'vue'
import { num, weekday } from '../../kit'
import { lampOf, type Level } from './shared'

const props = withDefaults(
  defineProps<{
    label: string
    /** What a day measures: "Uptime", "On time". */
    metric?: string
    /** One value per day, oldest first; null for a day with no data. */
    values: (number | null)[]
    /** A day at or above `warn` is good, at or above `bad` degraded, below that bad. */
    warn: number
    bad: number
    /** Words for good, degraded and bad days. */
    words?: [string, string, string]
    /** Notes on particular days, by index: "Elevated 5xx for 14 min". */
    notes?: Record<number, string>
    cols?: number
    decimals?: number
  }>(),
  { metric: 'Uptime', words: () => ['Operational', 'Degraded', 'Outage'], notes: () => ({}), cols: 30, decimals: 2 },
)

const n = computed(() => props.values.length)
const today = new Date()
const dateOf = (i: number) => new Date(today.getTime() - (n.value - 1 - i) * 86400000)

function levelOf(v: number | null): Level {
  if (v == null) return 'off'
  return v >= props.warn ? 'good' : v >= props.bad ? 'warning' : 'critical'
}
const wordOf = (v: number | null) => {
  const l = levelOf(v)
  return l === 'off' ? 'No data' : props.words[l === 'good' ? 0 : l === 'warning' ? 1 : 2]
}

const days = computed(() => props.values.map((v, i) => ({ i, v, level: levelOf(v) })))
const measured = computed(() => props.values.filter((v): v is number => v != null))
const average = computed(() => measured.value.reduce((s, v) => s + v, 0) / Math.max(1, measured.value.length))
const present = computed(() => new Set(days.value.map((d) => d.level)))

const pinned = ref(n.value - 1)
const hovered = ref<number | null>(null)
const shown = computed(() => hovered.value ?? pinned.value)
const day = computed(() => days.value[shown.value])
const valueText = (v: number | null) => (v == null ? 'no data' : `${num(v, props.decimals)}%`)
const readout = computed(
  () => `${weekday(dateOf(shown.value))} · ${valueText(day.value.v)} · ${wordOf(day.value.v)}`,
)

function onPointer(event: PointerEvent) {
  const i = Number((event.target as HTMLElement).dataset.i)
  if (Number.isFinite(i)) hovered.value = i
}
function onClick(event: MouseEvent) {
  const i = Number((event.target as HTMLElement).dataset.i)
  if (Number.isFinite(i)) pinned.value = i
}
function onKeydown(event: KeyboardEvent) {
  const moves: Record<string, number> = {
    ArrowRight: 1,
    ArrowLeft: -1,
    ArrowDown: props.cols,
    ArrowUp: -props.cols,
    PageDown: props.cols,
    PageUp: -props.cols,
  }
  let next: number | undefined
  if (event.key in moves) next = pinned.value + moves[event.key]
  else if (event.key === 'Home') next = 0
  else if (event.key === 'End') next = n.value - 1
  if (next === undefined) return
  event.preventDefault()
  hovered.value = null
  pinned.value = Math.max(0, Math.min(n.value - 1, next))
}

const legend = computed(() =>
  (
    [
      ['good', props.words[0]],
      ['warning', props.words[1]],
      ['critical', props.words[2]],
      ['off', 'No data'],
    ] as [Level, string][]
  ).filter(([l]) => l === 'good' || present.value.has(l)),
)
const swatch = (l: Level) => (l === 'good' ? 'var(--r-chart-context)' : l === 'off' ? undefined : lampOf(l))
</script>

<template>
  <div class="mk uptime">
    <div class="mk-row mk-between">
      <span class="r-label mk-truncate">{{ label }} · {{ metric }}</span>
      <span class="uptime__avg">
        <span class="mk-fig">{{ num(average, decimals) }}%</span>
        <span class="r-label">{{ n }} days</span>
      </span>
    </div>
    <div
      class="uptime__grid"
      :style="{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }"
      role="slider"
      tabindex="0"
      :aria-label="`${label}, ${metric.toLowerCase()} by day`"
      aria-valuemin="1"
      :aria-valuemax="n"
      :aria-valuenow="pinned + 1"
      :aria-valuetext="readout"
      @pointermove="onPointer"
      @pointerleave="hovered = null"
      @click="onClick"
      @keydown="onKeydown"
    >
      <span
        v-for="d in days"
        :key="d.i"
        class="uptime__day"
        :class="[`is-${d.level}`, { 'r-hatch': d.level === 'off', 'is-on': d.i === shown }]"
        :data-i="d.i"
      />
    </div>
    <div class="uptime__foot mk-end">
      <p class="uptime__read" aria-hidden="true">
        <span class="uptime__lamp" :class="`is-${day.level}`" />
        <span class="mk-truncate">{{ readout }}</span>
      </p>
      <ul class="uptime__legend" aria-hidden="true">
        <li v-for="[l, w] in legend" :key="l">
          <span class="uptime__swatch" :class="{ 'r-hatch': l === 'off' }" :style="{ background: swatch(l) }" />{{ w }}
        </li>
      </ul>
    </div>
    <p v-if="notes[shown]" class="uptime__note mk-truncate">{{ notes[shown] }}</p>
  </div>
</template>

<style scoped>
.uptime {
  gap: 8px;
}

.uptime__avg {
  display: inline-flex;
  flex: none;
  align-items: baseline;
  gap: 6px;
}

.uptime__avg .mk-fig {
  font-size: var(--r-text-lg);
}

.uptime__grid {
  display: grid;
  gap: 2px;
  cursor: crosshair;
  touch-action: pan-y;
}

.uptime__grid:focus-visible {
  outline-offset: 3px;
}

.uptime__day {
  aspect-ratio: 1;
  min-width: 0;
  background-color: var(--r-chart-context);
}

.uptime__day.is-warning {
  background-color: var(--r-status-warning);
}

.uptime__day.is-critical {
  background-color: var(--r-status-critical);
}

.uptime__day.is-off {
  background-color: var(--r-bg-muted);
}

.uptime__day.is-on {
  outline: 1px solid var(--r-text);
  outline-offset: 1px;
}

.uptime__foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 4px 12px;
  min-width: 0;
}

.uptime__read {
  display: flex;
  flex: 1 1 auto;
  align-items: center;
  gap: 6px;
  min-width: 0;
  font-size: var(--r-text-xs);
  font-variant-numeric: tabular-nums;
}

.uptime__lamp {
  flex: none;
  width: 6px;
  height: 6px;
  border-radius: var(--r-radius-round);
  background: var(--r-status-good);
}

.uptime__lamp.is-warning {
  background: var(--r-status-warning);
}

.uptime__lamp.is-critical {
  background: var(--r-status-critical);
}

.uptime__lamp.is-off {
  background: var(--r-status-off);
}

.uptime__legend {
  display: flex;
  flex: none;
  gap: 10px;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.uptime__legend li {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.uptime__swatch {
  width: 8px;
  height: 8px;
}

.uptime__swatch.r-hatch {
  background-color: var(--r-bg-muted);
}

.uptime__note {
  margin-top: -4px;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}
</style>
