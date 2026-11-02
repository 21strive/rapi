<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import ChartTooltip from './ChartTooltip.vue'
import { chartWidth, colorAt, linearPath, linearScale, monotonePath, niceDomain, useChartFocus, type Point } from './utils'
import { useElementSize } from '../composables/dom'
import { formatCompact, formatNumber } from '../composables/format'
import type { ChartSeries } from '../types'

interface LineSeries extends ChartSeries {
  /** Fill under the line with a soft gradient. Defaults to the chart's `area` for the first series. */
  area?: boolean
  dashed?: boolean
}

const props = withDefaults(
  defineProps<{
    labels: string[]
    series: LineSeries[]
    height?: number
    /** Gradient area under the first series. */
    area?: boolean
    curve?: 'monotone' | 'linear'
    yTicks?: number
    min?: number
    max?: number
    /** Index to mark with a soft bar and a value pill, like "today" or the best day. */
    highlight?: number | null
    /** Hide the y axis labels (compact cards). */
    hideYAxis?: boolean
    legend?: boolean
    format?: (value: number) => string
    axisFormat?: (value: number) => string
    label: string
  }>(),
  { height: 240, area: true, curve: 'monotone', yTicks: 4, highlight: null },
)

const root = ref<HTMLElement | null>(null)
const { width: measured } = useElementSize(root)
const width = chartWidth(measured)
const uid = useId()
const hintId = `${uid}-hint`

const fmt = (v: number) => (props.format ? props.format(v) : formatNumber(v))
const axisFmt = (v: number) => (props.axisFormat ? props.axisFormat(v) : formatCompact(v))

const margin = computed(() => ({
  top: props.highlight != null ? 36 : 10,
  right: 10,
  bottom: 28,
  left: props.hideYAxis ? 10 : 44,
}))

const values = computed(() => props.series.flatMap((s) => s.values.filter((v): v is number => v != null)))
const domain = computed(() => {
  const lo = props.min ?? Math.min(0, ...values.value)
  const hi = props.max ?? Math.max(1, ...values.value)
  return niceDomain(lo, hi, props.yTicks)
})

const geometry = computed(() => {
  const m = margin.value
  const plotW = Math.max(1, width.value - m.left - m.right)
  const plotH = Math.max(1, props.height - m.top - m.bottom)
  const n = props.labels.length
  const x = (i: number) => m.left + (n <= 1 ? plotW / 2 : (plotW * i) / (n - 1))
  const y = linearScale(domain.value.min, domain.value.max, m.top + plotH, m.top)
  return { plotW, plotH, x, y, bottom: m.top + plotH }
})

const lines = computed(() =>
  props.series.map((s, i) => {
    const { x, y, bottom } = geometry.value
    const color = colorAt(i, s.color)
    // Gaps (null) split the line into separate runs.
    const runs: Point[][] = []
    let run: Point[] = []
    s.values.forEach((v, j) => {
      if (v == null) {
        if (run.length) runs.push(run)
        run = []
      } else run.push([x(j), y(v)])
    })
    if (run.length) runs.push(run)
    const draw = props.curve === 'monotone' ? monotonePath : linearPath
    const path = runs.map(draw).join('')
    const fill = s.area ?? (props.area && i === 0)
    const areaPath = fill
      ? runs
          .map((r) => `${draw(r)}L${r[r.length - 1][0]},${bottom}L${r[0][0]},${bottom}Z`)
          .join('')
      : ''
    return { name: s.name, color, path, areaPath, dashed: s.dashed, gradient: `${uid}-area-${i}` }
  }),
)

const yTicks = computed(() => domain.value.ticks.map((v) => ({ v, y: geometry.value.y(v) })))

const xTicks = computed(() => {
  const n = props.labels.length
  const every = Math.max(1, Math.ceil(56 / (geometry.value.plotW / Math.max(1, n - 1))))
  return props.labels
    .map((text, i) => ({ text, x: geometry.value.x(i), i }))
    .filter((t) => t.i % every === 0 || t.i === n - 1)
    .filter((t, k, all) => !(t.i === n - 1 && k > 0 && t.i - all[k - 1].i < every))
})

const focus = useChartFocus(
  () => props.labels.length,
  (i) => `${props.labels[i]}: ${props.series.map((s) => `${s.name} ${s.values[i] == null ? 'no data' : fmt(s.values[i] as number)}`).join(', ')}`,
)

function onPointerMove(event: PointerEvent) {
  const box = (event.currentTarget as SVGElement).getBoundingClientRect()
  const px = event.clientX - box.left
  const n = props.labels.length
  if (!n) return
  const step = n <= 1 ? 1 : geometry.value.plotW / (n - 1)
  const i = Math.round((px - margin.value.left) / step)
  focus.onPointer(Math.min(n - 1, Math.max(0, i)))
}

const cursor = computed(() => {
  const i = focus.active.value
  if (i === null) return null
  const { x, y } = geometry.value
  const points = props.series
    .map((s, k) => ({ v: s.values[i], color: colorAt(k, s.color), name: s.name }))
    .filter((p): p is { v: number; color: string; name: string } => p.v != null)
    .map((p) => ({ ...p, cy: y(p.v) }))
  return {
    x: x(i),
    points,
    title: props.labels[i],
    anchorY: points.length ? Math.min(...points.map((p) => p.cy)) : geometry.value.bottom,
    rows: points.map((p) => ({ label: p.name, value: fmt(p.v), color: p.color })),
  }
})

const marker = computed(() => {
  const i = props.highlight
  const s = props.series[0]
  if (i == null || !s || s.values[i] == null) return null
  const { x, y, bottom } = geometry.value
  const v = s.values[i] as number
  const text = fmt(v)
  const pillW = Math.max(36, text.length * 7.4 + 18)
  return { x: x(i), y: y(v), bottom, text, pillW, color: colorAt(0, s.color) }
})
</script>

<template>
  <figure
    ref="root"
    class="r-chart r-line-chart"
    tabindex="0"
    :aria-describedby="hintId"
    @keydown="focus.onKeydown"
    @blur="focus.onBlur"
  >
    <ul v-if="legend" class="r-chart__legend" aria-hidden="true">
      <li v-for="l in lines" :key="l.name">
        <span class="r-chart__legend-line" :style="{ background: l.color }" />
        {{ l.name }}
      </li>
    </ul>
    <div class="r-line-chart__plot">
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
          <linearGradient
            v-for="l in lines"
            :id="l.gradient"
            :key="l.gradient"
            gradientUnits="userSpaceOnUse"
            x1="0"
            x2="0"
            :y1="margin.top"
            :y2="geometry.bottom"
          >
            <stop offset="0%" :style="{ stopColor: l.color, stopOpacity: 0.26 }" />
            <stop offset="100%" :style="{ stopColor: l.color, stopOpacity: 0 }" />
          </linearGradient>
          <linearGradient v-if="marker" :id="`${uid}-marker`" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" :style="{ stopColor: 'var(--r-ink)', stopOpacity: 0.16 }" />
            <stop offset="100%" :style="{ stopColor: 'var(--r-ink)', stopOpacity: 0.02 }" />
          </linearGradient>
        </defs>

        <g class="r-chart__grid">
          <line
            v-for="t in yTicks"
            :key="t.v"
            :x1="margin.left"
            :x2="width - margin.right"
            :y1="Math.round(t.y) + 0.5"
            :y2="Math.round(t.y) + 0.5"
          />
        </g>
        <g class="r-chart__axis">
          <template v-if="!hideYAxis">
            <text v-for="t in yTicks" :key="`y${t.v}`" :x="0" :y="t.y" dy="0.32em">{{ axisFmt(t.v) }}</text>
          </template>
          <text v-for="t in xTicks" :key="`x${t.i}`" :x="t.x" :y="height - 8" text-anchor="middle">{{ t.text }}</text>
        </g>

        <g v-if="marker" class="r-line-chart__marker">
          <rect
            :x="marker.x - 12"
            :y="marker.y"
            width="24"
            :height="Math.max(0, marker.bottom - marker.y)"
            rx="12"
            :fill="`url(#${uid}-marker)`"
          />
        </g>

        <path v-for="l in lines" v-show="l.areaPath" :key="`a${l.name}`" :d="l.areaPath" :fill="`url(#${l.gradient})`" />
        <path
          v-for="l in lines"
          :key="`l${l.name}`"
          class="r-line-chart__line"
          :class="{ 'is-dashed': l.dashed }"
          :d="l.path"
          :style="{ stroke: l.color }"
        />

        <g v-if="marker" class="r-line-chart__marker">
          <rect :x="marker.x - marker.pillW / 2" :y="marker.y - 34" :width="marker.pillW" height="24" rx="12" class="r-line-chart__pill" />
          <text :x="marker.x" :y="marker.y - 22" dy="0.34em" text-anchor="middle" class="r-line-chart__pill-text">{{ marker.text }}</text>
          <circle :cx="marker.x" :cy="marker.y" r="4.5" class="r-line-chart__dot" :style="{ stroke: marker.color }" />
        </g>

        <g v-if="cursor" class="r-line-chart__cursor">
          <line :x1="cursor.x" :x2="cursor.x" :y1="margin.top" :y2="geometry.bottom" />
          <circle
            v-for="p in cursor.points"
            :key="p.name"
            :cx="cursor.x"
            :cy="p.cy"
            r="4.5"
            class="r-line-chart__dot"
            :style="{ stroke: p.color }"
          />
        </g>
      </svg>

      <ChartTooltip
        v-if="cursor"
        :x="cursor.x"
        :y="cursor.anchorY"
        :bounds="{ width, height }"
        :title="cursor.title"
        :rows="cursor.rows"
      />
    </div>

    <table class="r-sr-only">
      <caption>{{ label }}</caption>
      <thead>
        <tr>
          <th scope="col">Label</th>
          <th v-for="s in series" :key="s.name" scope="col">{{ s.name }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(l, i) in labels" :key="i">
          <th scope="row">{{ l }}</th>
          <td v-for="s in series" :key="s.name">{{ s.values[i] == null ? '—' : fmt(s.values[i] as number) }}</td>
        </tr>
      </tbody>
    </table>
    <span :id="hintId" hidden>Use the arrow keys to read each point.</span>
    <span class="r-sr-only" aria-live="polite">{{ focus.announce.value }}</span>
  </figure>
</template>

<style>
.r-line-chart__plot {
  position: relative;
}

.r-line-chart__line {
  fill: none;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.r-line-chart__line.is-dashed {
  stroke-dasharray: 4 5;
}

.r-line-chart__cursor line {
  stroke: var(--r-chart-axis);
  stroke-dasharray: 2 3;
  opacity: 0.8;
}

.r-line-chart__dot {
  fill: var(--r-bg-surface);
  stroke-width: 2.5;
}

.r-card--brand .r-line-chart__dot,
.r-card--flame .r-line-chart__dot {
  fill: #fff;
}

.r-line-chart__pill {
  fill: var(--r-ink);
}
.r-line-chart__pill-text {
  fill: var(--r-on-ink);
  font-size: 12px;
  font-weight: var(--r-weight-semibold);
  font-variant-numeric: tabular-nums;
}

.r-chart__legend {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 18px;
  margin-bottom: 12px;
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
}
.r-chart__legend li {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.r-chart__legend-line {
  width: 14px;
  height: 3px;
  border-radius: 2px;
}
</style>
