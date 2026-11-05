<script setup lang="ts">
/**
 * Rank and its change: a short leaderboard where each row says how far it moved since the last
 * period, with an arrow as well as a colour. Switch the period and the rows slide to their new
 * places; pick a row to read it in full.
 */
import { computed, ref } from 'vue'
import { ArrowDown, ArrowUp, Minus } from 'lucide-vue-next'
import { pad } from '../../kit'
import { fmt, focusItem, stepKeys, type Fmt } from './shared'
import Keys from './Keys.vue'

interface Row {
  name: string
  value: number
  /** Rank in the period before; null when the row is new. */
  prev: number | null
}

interface Period {
  key: string
  label: string
  /** "last week", for the readout. */
  since: string
  rows: Row[]
}

const props = withDefaults(
  defineProps<{
    label: string
    unit?: string
    periods: Period[]
    format?: Fmt
    /** Lower is better (time, cost): the smallest value ranks first. */
    invert?: boolean
  }>(),
  { format: () => ({}) },
)

const key = ref(props.periods[0].key)
const period = computed(() => props.periods.find((p) => p.key === key.value) ?? props.periods[0])
const options = computed(() => props.periods.map((p) => ({ value: p.key, label: p.label })))

const ranked = computed(() =>
  [...period.value.rows]
    .sort((a, b) => (props.invert ? a.value - b.value : b.value - a.value))
    .map((r, i) => ({ ...r, rank: i + 1, move: r.prev == null ? null : r.prev - (i + 1) })),
)

const sel = ref(props.periods[0].rows[0]?.name ?? '')
const selIndex = computed(() => Math.max(0, ranked.value.findIndex((r) => r.name === sel.value)))
const current = computed(() => ranked.value[selIndex.value])
const list = ref<{ $el?: HTMLElement } | null>(null)

const moveText = (m: number | null) =>
  m == null ? 'new in the ranking' : m > 0 ? `up ${m} ${m === 1 ? 'place' : 'places'}` : m < 0 ? `down ${-m} ${m === -1 ? 'place' : 'places'}` : 'same place'
const valueText = (v: number) => `${fmt(v, props.format)}${props.unit ? ` ${props.unit}` : ''}`

function onKey(event: KeyboardEvent) {
  const next = stepKeys(event, selIndex.value, ranked.value.length)
  if (next === null) return
  sel.value = ranked.value[next].name
  focusItem(list.value?.$el, next)
}
</script>

<template>
  <div class="mk cmp lb">
    <div class="mk-row mk-between">
      <span class="r-label mk-truncate">{{ label }}</span>
      <Keys v-if="periods.length > 1" v-model="key" :options="options" :label="`${label}: period`" />
    </div>
    <TransitionGroup
      ref="list"
      tag="ol"
      name="lb"
      class="lb__rows mk-grow"
      role="radiogroup"
      :aria-label="`${label}, ${period.label}`"
      @keydown="onKey"
    >
      <li v-for="r in ranked" :key="r.name" role="none" class="lb__item">
        <button
          type="button"
          role="radio"
          class="lb__row mk-reset"
          :class="{ 'is-on': r.name === current.name }"
          :aria-checked="r.name === current.name"
          :tabindex="r.name === current.name ? 0 : -1"
          :aria-label="`${r.rank}. ${r.name}, ${valueText(r.value)}, ${moveText(r.move)}`"
          @click="sel = r.name"
        >
          <span class="lb__rank">{{ pad(r.rank) }}</span>
          <span class="lb__name">{{ r.name }}</span>
          <span class="lb__value">{{ fmt(r.value, format) }}</span>
          <span
            class="lb__move"
            :class="r.move == null ? 'is-new' : r.move > 0 ? 'is-up' : r.move < 0 ? 'is-down' : 'is-same'"
            aria-hidden="true"
          >
            <template v-if="r.move == null">New</template>
            <template v-else-if="r.move === 0"><Minus :size="12" /></template>
            <template v-else>
              <ArrowUp v-if="r.move > 0" :size="12" />
              <ArrowDown v-else :size="12" />
              {{ Math.abs(r.move) }}
            </template>
          </span>
        </button>
      </li>
    </TransitionGroup>
    <p class="lb__read">
      <span class="lb__read-name">{{ current.name }}</span>
      {{ valueText(current.value) }}, {{ moveText(current.move) }} since {{ period.since }}
    </p>
  </div>
</template>

<style scoped>
.lb {
  gap: 6px;
  container-type: inline-size;
}

.lb__rows {
  position: relative;
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  border-top: 1px solid var(--r-border-subtle);
  list-style: none;
}

.lb__item {
  display: flex;
  flex: 1 1 0;
  max-height: 40px;
  min-height: 0;
  border-bottom: 1px solid var(--r-border-subtle);
}

.lb-move {
  transition: transform var(--r-duration-slow) var(--r-ease-out);
}

.lb__row {
  display: grid;
  flex: 1;
  grid-template-columns: 16px minmax(0, 1fr) auto 26px;
  align-items: center;
  gap: 6px;
  padding: 0 4px 0 6px;
  border-left: 2px solid transparent;
  cursor: pointer;
  transition: background-color var(--r-duration-fast) var(--r-ease-out);
}

.lb__row:hover {
  background: var(--r-bg-hover);
}

.lb__row.is-on {
  border-left-color: var(--cmp-select);
  background: var(--r-bg-selected);
}

.lb__row:focus-visible {
  outline-offset: -2px;
}

.lb__rank {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-variant-numeric: tabular-nums;
}

.lb__name {
  overflow: hidden;
  color: var(--r-text);
  font-size: var(--r-text-xs);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lb__value {
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.lb__move {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 1px;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-semibold);
  font-variant-numeric: tabular-nums;
}

.lb__move.is-up {
  color: var(--r-success-text);
}

.lb__move.is-down {
  color: var(--r-danger-text);
}

.lb__move.is-same {
  color: var(--r-text-tertiary);
}

.lb__move.is-new {
  color: var(--r-brand-text);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

/* Narrow tiles: the value moves under the name, so the name keeps its width. */
@container (max-width: 240px) {
  .lb__row {
    grid-template-columns: 16px minmax(0, 1fr) 24px;
    grid-template-rows: auto auto;
    row-gap: 1px;
    align-content: center;
  }

  .lb__rank {
    grid-row: 1 / span 2;
  }

  .lb__value {
    grid-column: 2;
    grid-row: 2;
    text-align: left;
  }

  .lb__move {
    grid-column: 3;
    grid-row: 1 / span 2;
  }
}

.lb__read {
  min-width: 0;
  overflow: hidden;
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  line-height: 1.35;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.lb__read-name {
  color: var(--r-text);
  font-weight: var(--r-weight-semibold);
}
</style>
