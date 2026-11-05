<script setup lang="ts">
/**
 * Charge and what it buys: the cell, the percentage, and the distance or time it still covers
 * in the chosen mode. A driver asks "will it make it?", and the answer is one look, not a
 * calculation.
 */
import { computed, ref } from 'vue'
import { RSegmented, RStatus } from '@/design-system'
import { num, reducedMotion } from '../../kit'

interface Mode {
  id: string
  label: string
  /** What the charge still covers in this mode. */
  range: number
  /** "km", "min", "ha". */
  unit: string
  decimals?: number
}

const props = withDefaults(
  defineProps<{
    label: string
    /** Plate, serial or pack id, set in mono. */
    id?: string
    /** State of charge, 0–100. */
    charge: number
    charging?: boolean
    /** "Full at 16:40 WIB", "Parked at Depot Cakung". */
    state: string
    modes: Mode[]
    /** What the range is called: "Range", "Flight time". */
    rangeLabel?: string
    /** The state word when not charging and not low: "Parked", "Discharging". */
    word?: string
    /** A two-module tile: a taller cell and larger figures. */
    large?: boolean
  }>(),
  { charging: false, rangeLabel: 'Range', large: false },
)

const modeId = ref(props.modes[0]?.id)
const mode = computed(() => props.modes.find((m) => m.id === modeId.value) ?? props.modes[0])
const options = computed(() => props.modes.map((m) => ({ label: m.label, value: m.id })))

const BLOCKS = 10
const lit = computed(() => Math.max(props.charge > 0 ? 1 : 0, Math.round((props.charge / 100) * BLOCKS)))
const level = computed(() => (props.charge < 10 ? 'danger' : props.charge < 20 ? 'warning' : 'neutral'))
const word = computed(() =>
  props.charging ? 'Charging' : level.value === 'danger' ? 'Very low' : level.value === 'warning' ? 'Low' : (props.word ?? 'Idle'),
)
const tone = computed(() => (props.charging ? 'signal' : level.value))
const still = reducedMotion()
</script>

<template>
  <div class="mk cell" :class="[`is-${level}`, { 'cell--large': large }]">
    <div class="mk-row mk-between">
      <span class="r-label mk-truncate">{{ label }}<template v-if="id"> · <span class="cell__id">{{ id }}</span></template></span>
      <RStatus class="keep" size="sm" :tone="tone" :label="word" :pulse="charging" />
    </div>
    <div class="cell__body mk-grow">
      <div class="cell__charge">
        <span class="cell__battery" role="img" :aria-label="`Charge ${charge}%`">
          <span
            v-for="i in BLOCKS"
            :key="i"
            class="cell__block"
            :class="{ 'is-lit': i <= lit, 'is-next': charging && !still && i === lit + 1 }"
          />
        </span>
        <span class="cell__pct mk-fig">{{ charge }}%</span>
      </div>
      <div class="cell__range">
        <span class="r-label">{{ rangeLabel }} · {{ mode.label }}</span>
        <span class="cell__fig">
          <span class="mk-fig">{{ num(mode.range, mode.decimals ?? 0) }}</span>
          <span class="mk-unit">{{ mode.unit }}</span>
        </span>
      </div>
    </div>
    <p class="cell__state mk-truncate">{{ state }}</p>
    <RSegmented v-if="modes.length > 1" v-model="modeId" :options="options" size="sm" block :label="`${label}, mode`" />
  </div>
</template>

<style scoped>
.cell {
  container-type: inline-size;
  gap: 8px;
}

.cell__id {
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
}

.cell__body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  align-items: end;
  gap: 12px;
}

.cell__charge {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

/* A square cell: ten blocks inside a 1px case, with the terminal nub on the right. */
.cell__battery {
  position: relative;
  display: grid;
  grid-template-columns: repeat(10, minmax(0, 1fr));
  gap: 2px;
  width: calc(100% - 4px);
  height: 22px;
  padding: 2px;
  border: 1px solid var(--r-border-strong);
}

.cell__battery::after {
  content: '';
  position: absolute;
  top: 6px;
  right: -5px;
  width: 3px;
  height: 8px;
  background: var(--r-border-strong);
}

.cell__block {
  background: var(--r-chart-track);
}

.cell__block.is-lit {
  background: var(--r-text);
}

.cell.is-warning .cell__block.is-lit {
  background: var(--r-status-warning);
}

.cell.is-danger .cell__block.is-lit {
  background: var(--r-status-critical);
}

/* The block being filled blinks in two steps while the cell charges. */
.cell__block.is-next {
  background: var(--r-text-tertiary);
  animation: r-blink 1.2s linear infinite;
}

.cell__pct {
  font-size: var(--r-text-3xl);
}

.cell__range {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.cell__range .r-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cell__fig {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.cell__fig .mk-fig {
  font-size: var(--r-text-3xl);
}

.cell__state {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

/* Large: the cell stands taller and the figures grow. */
.cell--large .cell__body {
  align-items: center;
}

.cell--large .cell__battery {
  height: 56px;
  padding: 3px;
  gap: 3px;
}

.cell--large .cell__battery::after {
  top: 18px;
  right: -6px;
  width: 4px;
  height: 18px;
}

.cell--large .cell__pct,
.cell--large .cell__fig .mk-fig {
  font-size: var(--r-text-5xl);
}

/* One module wide: the cell over the figures, everything smaller. */
@container (max-width: 240px) {
  .cell__body {
    grid-template-columns: minmax(0, 1fr);
    align-content: start;
    align-items: start;
    gap: 6px;
  }

  .cell__pct,
  .cell__fig .mk-fig {
    font-size: var(--r-text-xl);
  }

  .cell__charge {
    flex-direction: row;
    align-items: center;
    gap: 10px;
  }

  .cell__battery {
    flex: 1 1 auto;
    height: 18px;
  }

  .cell__range {
    flex-direction: row;
    align-items: baseline;
    justify-content: space-between;
  }
}

/* The status word stays whole; the label beside it truncates instead. */
.keep {
  flex: none;
}
</style>
