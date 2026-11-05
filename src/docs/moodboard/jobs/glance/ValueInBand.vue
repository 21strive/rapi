<script setup lang="ts">
/**
 * A reading on its scale with the normal band drawn in, so "is 38.2 high?" answers itself: the
 * mark is either inside the band or it is not, and the word says which. Keys switch the reading;
 * the list shows them all and a press says what normal is.
 */
import { computed, ref } from 'vue'
import { RSegmented, RStatus } from '@/design-system'
import { num } from '../../kit'
import { useRoving } from './shared'

interface Reading {
  id: string
  label: string
  value: number
  unit: string
  decimals?: number
  /** Ends of the scale. */
  min: number
  max: number
  /** The normal band. */
  low: number
  high: number
  /** Words below, inside and above the band. */
  words?: [string, string, string]
  /** "Above since 13:40 WIB". */
  note?: string
}

const props = withDefaults(
  defineProps<{
    label: string
    /** Mono caps at the right of the label. */
    meta?: string
    readings: Reading[]
    /** `single`: one scale and keys. `list`: a row per reading. */
    layout?: 'single' | 'list'
  }>(),
  { layout: 'single' },
)

const id = ref(props.readings[0]?.id)
const roving = useRoving({ count: () => props.readings.length })
const reading = computed(() =>
  props.layout === 'list'
    ? (props.readings[roving.active.value] ?? props.readings[0])
    : (props.readings.find((r) => r.id === id.value) ?? props.readings[0]),
)

const WORDS: [string, string, string] = ['Low', 'Normal', 'High']
function stateOf(r: Reading) {
  const words = r.words ?? WORDS
  if (r.value < r.low) return { tone: 'warning' as const, word: words[0] }
  if (r.value > r.high) return { tone: 'warning' as const, word: words[2] }
  return { tone: 'success' as const, word: words[1] }
}
const at = (r: Reading, v: number) => `${Math.max(0, Math.min(100, ((v - r.min) / (r.max - r.min)) * 100))}%`
const fig = (r: Reading, v = r.value) => num(v, r.decimals ?? 0)
/* The ends of the scale are labelled only where they do not crowd the band's own labels. */
const roomBelow = (r: Reading) => (r.low - r.min) / (r.max - r.min) > 0.25
const roomAbove = (r: Reading) => (r.max - r.high) / (r.max - r.min) > 0.25
const options = computed(() => props.readings.map((r) => ({ label: r.label, value: r.id })))
</script>

<template>
  <div class="mk band" :class="`band--${layout}`">
    <div class="mk-row mk-between">
      <span class="r-label mk-truncate">{{ label }}</span>
      <span v-if="meta" class="r-label band__meta">{{ meta }}</span>
      <RStatus v-else-if="layout === 'single'" class="keep" size="sm" :tone="stateOf(reading).tone" :label="stateOf(reading).word" />
    </div>

    <template v-if="layout === 'single'">
      <p class="band__figure" aria-live="polite">
        <span class="mk-fig">{{ fig(reading) }}</span>
        <span class="mk-unit">{{ reading.unit }}</span>
        <span class="band__what r-label">{{ reading.label }}</span>
      </p>
      <div class="band__scale mk-end" aria-hidden="true">
        <span class="band__track">
          <span class="band__ok" :style="{ left: at(reading, reading.low), right: `calc(100% - ${at(reading, reading.high)})` }" />
          <span class="band__mark" :style="{ left: at(reading, reading.value) }" />
        </span>
        <span class="band__ticks">
          <span v-if="roomBelow(reading)" :style="{ left: '0%' }">{{ fig(reading, reading.min) }}</span>
          <span class="is-edge" :class="{ 'is-start': reading.min === reading.low }" :style="{ left: at(reading, reading.low) }">
            {{ fig(reading, reading.low) }}
          </span>
          <span class="is-edge" :class="{ 'is-end': reading.max === reading.high }" :style="{ left: at(reading, reading.high) }">
            {{ fig(reading, reading.high) }}
          </span>
          <span v-if="roomAbove(reading)" class="is-end" :style="{ left: '100%' }">{{ fig(reading, reading.max) }}</span>
        </span>
      </div>
      <RSegmented v-if="readings.length > 1" v-model="id" :options="options" size="sm" block :label="`${label}, reading`" />
    </template>

    <template v-else>
      <div class="band__rows mk-grow" role="radiogroup" :aria-label="label" @keydown="roving.onKeydown">
        <button
          v-for="(r, i) in readings"
          :key="r.id"
          :ref="roving.bind(i)"
          type="button"
          role="radio"
          class="band__row mk-reset"
          :class="{ 'is-on': i === roving.active.value }"
          :aria-checked="i === roving.active.value"
          :aria-label="`${r.label}, ${fig(r)} ${r.unit}, ${stateOf(r).word}`"
          :tabindex="i === roving.active.value ? 0 : -1"
          @click="roving.go(i)"
        >
          <span class="band__row-label">{{ r.label }}</span>
          <span class="band__track band__track--row" aria-hidden="true">
            <span class="band__ok" :style="{ left: at(r, r.low), right: `calc(100% - ${at(r, r.high)})` }" />
            <span class="band__mark" :style="{ left: at(r, r.value) }" />
          </span>
          <span class="band__row-fig">{{ fig(r) }}<span class="mk-unit">{{ r.unit }}</span></span>
          <RStatus class="keep" size="sm" :tone="stateOf(r).tone" :label="stateOf(r).word" />
        </button>
      </div>
      <p class="band__detail" aria-live="polite">
        <span class="r-label">Normal</span>
        <span>{{ fig(reading, reading.low) }}–{{ fig(reading, reading.high) }} {{ reading.unit }}</span>
        <span v-if="reading.note" class="band__note mk-truncate">· {{ reading.note }}</span>
      </p>
    </template>
  </div>
</template>

<style scoped>
.band__meta {
  flex: none;
}

.band__figure {
  display: flex;
  align-items: baseline;
  gap: 4px;
  min-width: 0;
}

.band__figure .mk-fig {
  font-size: var(--r-text-3xl);
}

.band__what {
  margin-left: 6px;
}

.band__scale {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 0 1px;
}

.band__track {
  position: relative;
  height: 8px;
  background: var(--r-chart-track);
}

/* The normal band: a soft green field edged in its own colour. */
.band__ok {
  position: absolute;
  top: 0;
  bottom: 0;
  border-right: 1px solid var(--r-success);
  border-left: 1px solid var(--r-success);
  background: color-mix(in srgb, var(--r-success) 28%, transparent);
}

.band__mark {
  position: absolute;
  top: -4px;
  bottom: -4px;
  width: 2px;
  background: var(--r-text);
  transform: translateX(-1px);
  transition: left var(--r-duration-base) var(--r-ease-out);
}

.band__ticks {
  position: relative;
  height: 10px;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.band__ticks span {
  position: absolute;
  top: 0;
  white-space: nowrap;
}

.band__ticks .is-edge {
  color: var(--r-success-text);
  transform: translateX(-50%);
}

.band__ticks .is-start {
  transform: none;
}

.band__ticks .is-end {
  transform: translateX(-100%);
}

/* List: one row per reading. */
.band__rows {
  display: grid;
  grid-auto-rows: minmax(0, 1fr);
  border-top: 1px solid var(--r-border-subtle);
}

.band__row {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr) 64px 74px;
  align-items: center;
  gap: 10px;
  padding: 0 6px;
  border-bottom: 1px solid var(--r-border-subtle);
  border-left: 2px solid transparent;
  cursor: pointer;
  transition: background-color var(--r-duration-fast) var(--r-ease-out);
}

.band__row:hover {
  background: var(--r-bg-hover);
}

.band__row.is-on {
  border-left-color: var(--r-brand);
  background: var(--r-bg-selected);
}

.band__row:focus-visible {
  outline-offset: -2px;
}

.band__row-label {
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  letter-spacing: 0.04em;
}

.band__track--row {
  height: 6px;
}

.band__row-fig {
  display: inline-flex;
  align-items: baseline;
  justify-content: flex-end;
  gap: 3px;
  font-size: var(--r-text-md);
  font-weight: var(--r-weight-semibold);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.band__detail {
  display: flex;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
  font-size: var(--r-text-xs);
  font-variant-numeric: tabular-nums;
}

.band__note {
  color: var(--r-text-tertiary);
}

/* The status word stays whole; the label beside it truncates instead. */
.keep {
  flex: none;
}
</style>
