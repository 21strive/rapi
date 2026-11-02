<script setup lang="ts">
import { computed, onMounted, ref, useId } from 'vue'
import ChartTooltip from './ChartTooltip.vue'
import { colorAt, niceDomain, useChartFocus } from './utils'
import { useElementSize } from '../composables/dom'
import { formatCompact, formatNumber } from '../composables/format'

interface BarItem {
  label: string
  /** One value per series. A single number for a plain bar. */
  values: number[] | number
}

interface BarSeries {
  name: string
  color?: string
}

const props = withDefaults(
  defineProps<{
    items: BarItem[]
    /** Names (and colours) for stacked values. */
    series?: BarSeries[]
    max?: number
    /** Value axis with gridlines underneath. */
    axis?: boolean
    showValues?: boolean
    legend?: boolean
    /** Soft left-to-right gradient on the first series. */
    gradient?: boolean
    barHeight?: number
    format?: (value: number) => string
    label: string
  }>(),
  { showValues: true, gradient: true, barHeight: 28 },
)

const plot = ref<HTMLElement | null>(null)
const { width: plotWidth } = useElementSize(plot)
const uid = useId()

const fmt = (v: number) => (props.format ? props.format(v) : formatNumber(v))
const valuesOf = (item: BarItem) => (Array.isArray(item.values) ? item.values : [item.values])
const totals = computed(() => props.items.map((item) => valuesOf(item).reduce((a, b) => a + b, 0)))
const domain = computed(() => niceDomain(0, props.max ?? Math.max(1, ...totals.value), 3))
const scale = computed(() => (props.axis ? domain.value.max : (props.max ?? Math.max(1, ...totals.value))))

const seriesList = computed(() => {
  const count = Math.max(1, ...props.items.map((i) => valuesOf(i).length))
  return Array.from({ length: count }, (_, i) => ({
    name: props.series?.[i]?.name ?? `Series ${i + 1}`,
    color: props.series?.[i]?.color ?? (i === 0 ? 'var(--r-chart-1)' : i === 1 ? 'var(--r-chart-1-soft)' : colorAt(i)),
  }))
})

const rows = computed(() =>
  props.items.map((item, r) => {
    let start = 0
    const segments = valuesOf(item).map((v, i) => {
      const seg = { left: (start / scale.value) * 100, width: (v / scale.value) * 100, color: seriesList.value[i].color, value: v, i }
      start += v
      return seg
    })
    return { label: item.label, segments, total: totals.value[r] }
  }),
)

const focus = useChartFocus(
  () => props.items.length,
  (r) => `${rows.value[r].label}: ${rows.value[r].segments.map((s) => `${seriesList.value[s.i].name} ${fmt(s.value)}`).join(', ')}`,
)

const tooltip = computed(() => {
  const r = focus.active.value
  if (r === null || !plot.value) return null
  const row = rows.value[r]
  const rowEl = plot.value.querySelectorAll<HTMLElement>('.r-bar-list__track')[r]
  if (!rowEl) return null
  const end = row.segments.reduce((m, s) => Math.max(m, s.left + s.width), 0)
  return {
    x: rowEl.offsetLeft + (rowEl.offsetWidth * end) / 100,
    y: rowEl.offsetTop + rowEl.offsetHeight / 2,
    title: row.label,
    rows: row.segments.map((s) => ({ label: seriesList.value[s.i].name, value: fmt(s.value), color: s.color })),
  }
})

const grown = ref(false)
onMounted(() => requestAnimationFrame(() => (grown.value = true)))
</script>

<template>
  <figure
    class="r-chart r-bar-list"
    :class="{ 'is-grown': grown, 'is-focused': focus.active.value !== null, 'r-bar-list--gradient': gradient }"
    tabindex="0"
    :aria-describedby="`${uid}-hint`"
    @keydown="focus.onKeydown"
    @blur="focus.onBlur"
  >
    <div ref="plot" class="r-bar-list__plot" role="img" :aria-label="label" @pointerleave="focus.onPointer(null)">
      <div
        v-for="(row, r) in rows"
        :key="row.label"
        class="r-bar-list__row"
        :class="{ 'is-active': focus.active.value === r }"
        @pointerenter="focus.onPointer(r)"
      >
        <span class="r-bar-list__label">{{ row.label }}</span>
        <span class="r-bar-list__track" :style="{ height: `${barHeight}px` }">
          <span v-if="axis" class="r-bar-list__lines" aria-hidden="true">
            <i v-for="t in domain.ticks" :key="t" :style="{ left: `${(t / domain.max) * 100}%` }" />
          </span>
          <span
            v-for="s in row.segments"
            :key="s.i"
            class="r-bar-list__segment"
            :class="{ 'is-first': s.i === 0 }"
            :style="{ left: `${s.left}%`, width: grown ? `${s.width}%` : '0%', '--r-seg': s.color, transitionDelay: `${r * 60}ms` }"
          />
        </span>
        <span v-if="showValues" class="r-bar-list__value">{{ fmt(row.total) }}</span>
      </div>
      <div v-if="axis" class="r-bar-list__axis" aria-hidden="true">
        <span class="r-bar-list__label" />
        <span class="r-bar-list__ticks">
          <span v-for="t in domain.ticks" :key="t" :style="{ left: `${(t / domain.max) * 100}%` }">{{ formatCompact(t) }}</span>
        </span>
        <span v-if="showValues" class="r-bar-list__value" />
      </div>
      <ChartTooltip
        v-if="tooltip"
        :x="tooltip.x"
        :y="tooltip.y"
        :bounds="{ width: plotWidth, height: 9999 }"
        :title="tooltip.title"
        :rows="tooltip.rows"
      />
    </div>

    <ul v-if="legend && seriesList.length > 1" class="r-chart__legend r-bar-list__legend" aria-hidden="true">
      <li v-for="s in seriesList" :key="s.name">
        <span class="r-bar-list__legend-dot" :style="{ background: s.color }" />
        {{ s.name }}
      </li>
    </ul>

    <table class="r-sr-only">
      <caption>{{ label }}</caption>
      <thead>
        <tr>
          <th scope="col">Label</th>
          <th v-for="s in seriesList" :key="s.name" scope="col">{{ s.name }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.label">
          <th scope="row">{{ row.label }}</th>
          <td v-for="s in row.segments" :key="s.i">{{ fmt(s.value) }}</td>
        </tr>
      </tbody>
    </table>
    <span :id="`${uid}-hint`" hidden>Use the arrow keys to read each bar.</span>
    <span class="r-sr-only" aria-live="polite">{{ focus.announce.value }}</span>
  </figure>
</template>

<style>
.r-bar-list__plot {
  position: relative;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 14px 14px;
}

.r-bar-list__row,
.r-bar-list__axis {
  display: contents;
}

.r-bar-list__label {
  grid-column: 1;
  max-width: 160px;
  overflow: hidden;
  color: var(--r-text-secondary);
  font-size: var(--r-text-sm);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.r-bar-list__track {
  position: relative;
  z-index: 0;
  grid-column: 2;
  display: block;
  isolation: isolate;
}

.r-bar-list__segment {
  position: absolute;
  top: 0;
  bottom: 0;
  border-radius: 0 7px 7px 0;
  background: var(--r-seg);
  transition:
    width var(--r-duration-slower) var(--r-ease-out),
    opacity var(--r-duration-fast) var(--r-ease-out);
}
.r-bar-list__segment.is-first {
  z-index: 1;
  border-radius: 7px;
}
.r-bar-list--gradient .r-bar-list__segment.is-first {
  background: linear-gradient(90deg, color-mix(in srgb, var(--r-seg) 45%, var(--r-bg-surface)), var(--r-seg));
}
.r-bar-list__segment:not(.is-first) {
  margin-left: -7px;
  padding-left: 7px;
  box-sizing: content-box;
}

.r-bar-list.is-focused .r-bar-list__row:not(.is-active) .r-bar-list__segment {
  opacity: 0.45;
}

.r-bar-list__value {
  grid-column: 3;
  color: var(--r-text);
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-semibold);
  font-variant-numeric: tabular-nums;
  text-align: right;
}

/* Gridlines live in each track and overhang into the row gap, so they read as one line. */
.r-bar-list__lines {
  position: absolute;
  z-index: -1;
  top: -8px;
  bottom: -8px;
  left: 0;
  right: 0;
  pointer-events: none;
}
.r-bar-list__lines i {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  background: var(--r-chart-grid);
}

.r-bar-list__ticks {
  position: relative;
  grid-column: 2;
  height: 14px;
  color: var(--r-chart-axis);
  font-size: var(--r-text-2xs);
  font-variant-numeric: tabular-nums;
}
.r-bar-list__ticks span {
  position: absolute;
  top: 0;
  transform: translateX(-50%);
  white-space: nowrap;
}
.r-bar-list__ticks span:first-child {
  transform: none;
}

.r-bar-list__legend {
  margin: 16px 0 0;
}
.r-bar-list__legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 3px;
}
</style>
