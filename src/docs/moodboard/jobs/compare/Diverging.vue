<script setup lang="ts">
/**
 * Over and under: signed amounts as bars from a centre line, cobalt one way and orange the
 * other (the diverging pair), each with its signed figure. Sort by size to see the extremes, or
 * by name to find a row; pick a row to read the figures behind it.
 */
import { computed, ref } from 'vue'
import { fmt, focusItem, stepKeys, type Fmt } from './shared'
import Keys from './Keys.vue'

interface Item {
  name: string
  value: number
  /** One line behind the figure: "Plan 1,840 · actual 1,960". */
  note?: string
}

const props = withDefaults(
  defineProps<{
    label: string
    unit?: string
    items: Item[]
    format?: Fmt
    /** Words for the two sides, shown with their colours: "Under budget", "Over budget". */
    pos: string
    neg: string
    /** Offer the sort keys. Without them the legend moves up into the head. */
    sortable?: boolean
    /** Print the signed figure at the end of each bar; off for narrow tiles (the readout keeps it). */
    values?: boolean
    /** The legend in the head row, for short tiles without sort keys. */
    inlineLegend?: boolean
  }>(),
  { format: () => ({}), sortable: true, values: true },
)

const sort = ref('size')
const sortOptions = [
  { value: 'size', label: 'Size' },
  { value: 'name', label: 'A–Z' },
]
const rows = computed(() => {
  const list = [...props.items]
  if (sort.value === 'name') return list.sort((a, b) => a.name.localeCompare(b.name))
  return list.sort((a, b) => b.value - a.value)
})
const maxAbs = computed(() => Math.max(1e-9, ...props.items.map((it) => Math.abs(it.value))))

const sel = ref(props.items[0].name)
const selIndex = computed(() => Math.max(0, rows.value.findIndex((r) => r.name === sel.value)))
const current = computed(() => rows.value[selIndex.value])
const group = ref<HTMLElement | null>(null)

const signedText = (v: number) => {
  const text = fmt(Math.abs(v), props.format)
  return v > 0 ? `+${text}` : v < 0 ? `−${text}` : text
}
const reserve = computed(() => (props.values ? '44px' : '2px'))
const barStyle = (v: number) => {
  const w = `calc((50% - ${reserve.value}) * ${Math.abs(v) / maxAbs.value})`
  return v >= 0 ? { left: '50%', width: w } : { right: '50%', width: w }
}
const valueStyle = (v: number) => {
  const off = `calc(50% + (50% - ${reserve.value}) * ${Math.abs(v) / maxAbs.value} + 4px)`
  return v >= 0 ? { left: off } : { right: off }
}

function onKey(event: KeyboardEvent) {
  const next = stepKeys(event, selIndex.value, rows.value.length)
  if (next === null) return
  sel.value = rows.value[next].name
  focusItem(group.value, next)
}

</script>

<template>
  <div class="mk cmp r-chart div">
    <div class="mk-row mk-between">
      <span class="r-label mk-truncate">{{ label }}</span>
      <Keys v-if="sortable" v-model="sort" :options="sortOptions" :label="`Sort ${label}`" />
      <p v-else-if="inlineLegend" class="div__legend" aria-hidden="true">
        <span><i class="is-neg" />{{ neg }}</span>
        <span><i class="is-pos" />{{ pos }}</span>
      </p>
    </div>
    <p v-if="sortable || !inlineLegend" class="div__legend" aria-hidden="true">
      <span><i class="is-neg" />{{ neg }}</span>
      <span><i class="is-pos" />{{ pos }}</span>
    </p>
    <div ref="group" class="div__rows mk-grow" role="radiogroup" :aria-label="label" @keydown="onKey">
      <button
        v-for="r in rows"
        :key="r.name"
        type="button"
        role="radio"
        class="div__row mk-reset"
        :class="{ 'is-on': r.name === current.name }"
        :aria-checked="r.name === current.name"
        :tabindex="r.name === current.name ? 0 : -1"
        :aria-label="`${r.name}: ${signedText(r.value)}${unit ? ` ${unit}` : ''}, ${r.value >= 0 ? pos : neg}`"
        @click="sel = r.name"
      >
        <span class="div__name">{{ r.name }}</span>
        <span class="div__plot">
          <span class="div__bar" :class="r.value >= 0 ? 'is-pos' : 'is-neg'" :style="barStyle(r.value)" />
          <span v-if="values" class="div__value" :style="valueStyle(r.value)">{{ signedText(r.value) }}</span>
        </span>
      </button>
    </div>
    <p class="div__read">
      <span class="div__read-name">{{ current.name }}</span>
      <span>{{ signedText(current.value) }}{{ unit ? ` ${unit}` : '' }}</span>
      <span v-if="current.note" class="div__read-note">{{ current.note }}</span>
    </p>
  </div>
</template>

<style scoped>
.div {
  gap: 6px;
}

.div__legend {
  display: flex;
  flex: none;
  gap: 12px;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.div__legend span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.div__legend i {
  width: 8px;
  height: 8px;
}

.is-pos {
  background: var(--r-div-pos);
}

.is-neg {
  background: var(--r-div-neg);
}

.div__rows {
  display: flex;
  flex-direction: column;
}

.div__row {
  display: grid;
  flex: 1 1 0;
  grid-template-columns: minmax(0, 34%) minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  max-height: 30px;
  min-height: 0;
  padding: 0 4px;
  margin: 0 -4px;
  cursor: pointer;
  transition: background-color var(--r-duration-fast) var(--r-ease-out);
}

.div__row:hover {
  background: var(--r-bg-hover);
}

.div__row.is-on {
  background: var(--r-bg-selected);
}

.div__row:focus-visible {
  outline-offset: -2px;
}

.div__name {
  overflow: hidden;
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.div__row.is-on .div__name {
  color: var(--r-text);
}

.div__plot {
  position: relative;
  align-self: stretch;
}

.div__plot::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  width: 1px;
  background: var(--r-chart-axis);
}

.div__bar {
  position: absolute;
  top: 50%;
  height: min(12px, 60%);
  transform: translateY(-50%);
}

.div__value {
  position: absolute;
  top: 50%;
  color: var(--r-text);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-variant-numeric: tabular-nums;
  line-height: 1;
  white-space: nowrap;
  transform: translateY(-50%);
}

.div__read {
  display: flex;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
  overflow: hidden;
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.div__read-name {
  flex: none;
  color: var(--r-text);
  font-family: var(--r-font-sans);
  font-size: var(--r-text-xs);
  font-weight: var(--r-weight-semibold);
}

.div__read-note {
  overflow: hidden;
  color: var(--r-text-tertiary);
  text-overflow: ellipsis;
}
</style>
