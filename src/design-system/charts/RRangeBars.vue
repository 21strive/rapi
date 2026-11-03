<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import ChartTooltip from './ChartTooltip.vue'
import { chartWidth, crisp, linearScale, niceDomain, useChartFocus } from './utils'
import { useElementSize } from '../composables/dom'
import { formatNumber } from '../composables/format'

const props = withDefaults(
  defineProps<{
    labels: string[]
    /** [min, max] per label. */
    ranges: [number, number][]
    /** A dashed line with a tag, e.g. "AVG 57". */
    average?: number
    averageLabel?: string
    color?: string
    height?: number
    min?: number
    max?: number
    unit?: string
    format?: (value: number) => string
    label: string
  }>(),
  { color: 'var(--r-chart-1)', height: 240 },
)

const root = ref<HTMLElement | null>(null)
const { width: measured } = useElementSize(root)
const width = chartWidth(measured)
const uid = useId()

const fmt = (v: number) => (props.format ? props.format(v) : formatNumber(v))
const withUnit = (text: string) => (props.unit ? `${text} ${props.unit}` : text)

const margin = computed(() => ({ top: props.unit ? 22 : 12, right: props.average != null ? 62 : 4, bottom: 26, left: 48 }))

const domain = computed(() => {
  const all = props.ranges.flat()
  const span = Math.max(1, Math.max(...all) - Math.min(...all))
  return niceDomain(props.min ?? Math.min(...all) - span * 0.1, props.max ?? Math.max(...all) + span * 0.06, 4)
})

const geometry = computed(() => {
  const plotW = Math.max(1, width.value - margin.value.left - margin.value.right)
  const plotH = Math.max(1, props.height - margin.value.top - margin.value.bottom)
  const n = Math.max(1, props.labels.length)
  const colW = plotW / n
  const barW = Math.min(12, Math.max(4, colW * 0.3))
  const y = linearScale(domain.value.min, domain.value.max, margin.value.top + plotH, margin.value.top)
  return { plotW, plotH, colW, barW, y, top: margin.value.top, bottom: margin.value.top + plotH, left: margin.value.left, right: margin.value.left + plotW }
})

const bars = computed(() =>
  props.ranges.map(([a, b], i) => {
    const { colW, barW, y } = geometry.value
    const cx = margin.value.left + colW * (i + 0.5)
    const top = y(Math.max(a, b))
    const bottom = y(Math.min(a, b))
    const h = Math.max(2, bottom - top)
    return { cx, x: cx - barW / 2, y: top, w: barW, h, min: Math.min(a, b), max: Math.max(a, b) }
  }),
)

const yTicks = computed(() => domain.value.ticks.map((v) => ({ v, y: geometry.value.y(v) })))
const xEvery = computed(() => Math.max(1, Math.ceil(40 / geometry.value.colW)))

const averageTag = computed(() => {
  if (props.average == null) return null
  const text = (props.averageLabel ?? `Avg ${fmt(props.average)}`).toUpperCase()
  return { text, w: text.length * 6.4 + 10, y: geometry.value.y(props.average) }
})

const focus = useChartFocus(
  () => props.labels.length,
  (i) => `${props.labels[i]}: ${withUnit(`${fmt(bars.value[i].min)} to ${fmt(bars.value[i].max)}`)}`,
)

function onPointerMove(event: PointerEvent) {
  const box = (event.currentTarget as SVGElement).getBoundingClientRect()
  const i = Math.floor((event.clientX - box.left - margin.value.left) / geometry.value.colW)
  focus.onPointer(i >= 0 && i < props.labels.length ? i : null)
}

const tooltip = computed(() => {
  const i = focus.active.value
  if (i === null) return null
  const bar = bars.value[i]
  return {
    x: bar.cx,
    y: bar.y,
    title: props.labels[i],
    rows: [
      { label: 'Max', value: withUnit(fmt(bar.max)), color: props.color, kind: 'rect' as const },
      { label: 'Min', value: withUnit(fmt(bar.min)), color: props.color, kind: 'rect' as const },
    ],
  }
})
</script>

<template>
  <figure
    ref="root"
    class="r-chart r-range-bars"
    :class="{ 'is-focused': focus.active.value !== null }"
    tabindex="0"
    :aria-describedby="`${uid}-hint`"
    @keydown="focus.onKeydown"
    @blur="focus.onBlur"
  >
    <div class="r-chart__plot">
      <svg
        :width="width"
        :height="height"
        :viewBox="`0 0 ${width} ${height}`"
        role="img"
        :aria-label="label"
        @pointermove="onPointerMove"
        @pointerleave="focus.onPointer(null)"
      >
        <g class="r-chart__grid">
          <line v-for="t in yTicks" :key="t.v" :x1="geometry.left" :x2="geometry.right" :y1="crisp(t.y)" :y2="crisp(t.y)" />
        </g>
        <g class="r-chart__axis">
          <text v-if="unit" class="r-chart__unit" :x="geometry.left - 8" :y="geometry.top - 12" text-anchor="end">{{ unit }}</text>
          <text v-for="t in yTicks" :key="`y${t.v}`" :x="geometry.left - 8" :y="t.y" dy="0.32em" text-anchor="end">{{ fmt(t.v) }}</text>
          <template v-for="(l, i) in labels" :key="i">
            <text v-if="i % xEvery === 0" :x="bars[i].cx" :y="height - 6" text-anchor="middle">{{ l }}</text>
          </template>
        </g>
        <line class="r-chart__baseline" :x1="geometry.left" :x2="geometry.right" :y1="crisp(geometry.bottom)" :y2="crisp(geometry.bottom)" />

        <g
          v-for="(bar, i) in bars"
          :key="i"
          class="r-range-bars__bar"
          :class="{ 'is-active': focus.active.value === i }"
        >
          <rect :x="bar.x" :y="bar.y" :width="bar.w" :height="bar.h" :style="{ fill: color }" />
          <line class="r-range-bars__cap" :x1="bar.x - 3" :x2="bar.x + bar.w + 3" :y1="crisp(bar.y)" :y2="crisp(bar.y)" />
          <line class="r-range-bars__cap" :x1="bar.x - 3" :x2="bar.x + bar.w + 3" :y1="crisp(bar.y + bar.h) - 1" :y2="crisp(bar.y + bar.h) - 1" />
        </g>

        <g v-if="averageTag" class="r-chart__ref r-chart__ref--average">
          <line :x1="geometry.left" :x2="geometry.right" :y1="crisp(averageTag.y)" :y2="crisp(averageTag.y)" />
          <g class="r-chart__flag">
            <rect :x="geometry.right + 2" :y="averageTag.y - 7.5" :width="averageTag.w" height="15" />
            <text :x="geometry.right + 2 + averageTag.w / 2" :y="averageTag.y" dy="0.34em" text-anchor="middle">{{ averageTag.text }}</text>
          </g>
        </g>
      </svg>

      <ChartTooltip
        v-if="tooltip"
        :x="tooltip.x"
        :y="tooltip.y"
        :bounds="{ width, height }"
        :title="tooltip.title"
        :rows="tooltip.rows"
        placement="top"
      />
    </div>

    <div class="r-sr-only">
      <table>
        <caption>{{ label }}</caption>
        <thead>
          <tr>
            <th scope="col">Label</th>
            <th scope="col">Min</th>
            <th scope="col">Max</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(l, i) in labels" :key="i">
            <th scope="row">{{ l }}</th>
            <td>{{ withUnit(fmt(bars[i].min)) }}</td>
            <td>{{ withUnit(fmt(bars[i].max)) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <span :id="`${uid}-hint`" hidden>Use the arrow keys to read each range.</span>
    <span class="r-sr-only" aria-live="polite">{{ focus.announce.value }}</span>
  </figure>
</template>

<style>
.r-range-bars__bar {
  transition: opacity var(--r-duration-fast) var(--r-ease-out);
}

.r-range-bars.is-focused .r-range-bars__bar:not(.is-active) {
  opacity: 0.4;
}

.r-range-bars__cap {
  stroke: var(--r-chart-ink);
  stroke-width: 1;
  shape-rendering: crispEdges;
}
</style>
