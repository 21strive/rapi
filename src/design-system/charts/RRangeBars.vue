<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import ChartTooltip from './ChartTooltip.vue'
import { chartWidth, linearScale, useChartFocus } from './utils'
import { useElementSize } from '../composables/dom'
import { formatNumber } from '../composables/format'

const props = withDefaults(
  defineProps<{
    labels: string[]
    /** [min, max] per label. */
    ranges: [number, number][]
    /** Draws a dashed line with a pill label, e.g. "Avg. 57". */
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

const margin = computed(() => ({ top: 12, right: 4, bottom: 28, left: props.average != null ? 70 : 4 }))

const geometry = computed(() => {
  const m = margin.value
  const all = props.ranges.flat()
  const span = Math.max(1, Math.max(...all) - Math.min(...all))
  const lo = props.min ?? Math.min(...all) - span * 0.12
  const hi = props.max ?? Math.max(...all) + span * 0.08
  const plotW = Math.max(1, width.value - m.left - m.right)
  const plotH = Math.max(1, props.height - m.top - m.bottom)
  const n = Math.max(1, props.labels.length)
  const colW = plotW / n
  const barW = Math.min(30, Math.max(8, colW * 0.42))
  const y = linearScale(lo, hi, m.top + plotH, m.top)
  return { plotW, plotH, colW, barW, y, bottom: m.top + plotH }
})

const bars = computed(() =>
  props.ranges.map(([a, b], i) => {
    const { colW, barW, y } = geometry.value
    const cx = margin.value.left + colW * (i + 0.5)
    const top = y(Math.max(a, b))
    const bottom = y(Math.min(a, b))
    const h = Math.max(barW, bottom - top)
    return { cx, x: cx - barW / 2, y: bottom - h, w: barW, h, min: Math.min(a, b), max: Math.max(a, b) }
  }),
)

const averageText = computed(() => props.averageLabel ?? (props.average != null ? `Avg. ${fmt(props.average)}` : ''))

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
    y: bar.y + bar.h / 2,
    title: props.labels[i],
    rows: [{ label: 'Range', value: withUnit(`${fmt(bar.min)}–${fmt(bar.max)}`) }],
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
    <svg
      :width="width"
      :height="height"
      :viewBox="`0 0 ${width} ${height}`"
      role="img"
      :aria-label="label"
      @pointermove="onPointerMove"
      @pointerleave="focus.onPointer(null)"
    >
      <defs>
        <linearGradient :id="`${uid}-bar`" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" :style="{ stopColor: color }" />
          <stop offset="100%" :style="{ stopColor: `color-mix(in srgb, ${color} 52%, var(--r-bg-surface))` }" />
        </linearGradient>
      </defs>
      <g class="r-range-bars__columns">
        <line
          v-for="i in labels.length + 1"
          :key="i"
          :x1="Math.round(margin.left + geometry.colW * (i - 1)) + 0.5"
          :x2="Math.round(margin.left + geometry.colW * (i - 1)) + 0.5"
          :y1="margin.top"
          :y2="height - 6"
        />
      </g>
      <g class="r-chart__axis">
        <text v-for="(l, i) in labels" :key="i" :x="margin.left + geometry.colW * i + 8" :y="height - 8">{{ l }}</text>
      </g>
      <line
        v-if="average != null"
        class="r-range-bars__average"
        :x1="margin.left - 4"
        :x2="width - margin.right"
        :y1="geometry.y(average)"
        :y2="geometry.y(average)"
      />
      <rect
        v-for="(bar, i) in bars"
        :key="i"
        class="r-range-bars__bar"
        :class="{ 'is-active': focus.active.value === i }"
        :x="bar.x"
        :y="bar.y"
        :width="bar.w"
        :height="bar.h"
        :rx="bar.w / 2"
        :fill="`url(#${uid}-bar)`"
        :style="{ animationDelay: `${i * 40}ms` }"
      />
      <g v-if="average != null" class="r-range-bars__pill">
        <rect x="2" :y="geometry.y(average) - 12" :width="margin.left - 16" height="24" rx="7" />
        <path
          :d="`M${margin.left - 15},${geometry.y(average) - 6} L${margin.left - 9},${geometry.y(average)} L${margin.left - 15},${geometry.y(average) + 6} Z`"
        />
        <text :x="2 + (margin.left - 16) / 2" :y="geometry.y(average)" dy="0.34em" text-anchor="middle">{{ averageText }}</text>
      </g>
    </svg>

    <ChartTooltip
      v-if="tooltip"
      :x="tooltip.x"
      :y="tooltip.y"
      :bounds="{ width, height }"
      :title="tooltip.title"
      :rows="tooltip.rows"
    />

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
            <td>{{ fmt(bars[i].min) }}</td>
            <td>{{ fmt(bars[i].max) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <span :id="`${uid}-hint`" hidden>Use the arrow keys to read each range.</span>
    <span class="r-sr-only" aria-live="polite">{{ focus.announce.value }}</span>
  </figure>
</template>

<style>
.r-range-bars__columns line {
  stroke: var(--r-chart-grid);
  shape-rendering: crispEdges;
}

.r-range-bars__average {
  stroke: var(--r-chart-axis);
  stroke-dasharray: 3 4;
  opacity: 0.7;
}

.r-range-bars__bar {
  animation: r-range-in var(--r-duration-slower) var(--r-ease-out) both;
  transform-box: fill-box;
  transform-origin: center;
  transition: opacity var(--r-duration-fast) var(--r-ease-out);
}
.r-range-bars.is-focused .r-range-bars__bar:not(.is-active) {
  opacity: 0.4;
}

@keyframes r-range-in {
  from {
    opacity: 0;
    transform: scaleY(0.3);
  }
}

@media (prefers-reduced-motion: reduce) {
  .r-range-bars__bar {
    animation: none;
  }
}

.r-range-bars__pill rect,
.r-range-bars__pill path {
  fill: var(--r-ink);
}
.r-range-bars__pill text {
  fill: var(--r-on-ink);
  font-size: 12px;
  font-weight: var(--r-weight-semibold);
  font-variant-numeric: tabular-nums;
}
</style>
