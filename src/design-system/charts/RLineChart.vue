<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import ChartTooltip from './ChartTooltip.vue'
import ChartLegend from './ChartLegend.vue'
import ChartHatch from './ChartHatch.vue'
import {
  chartWidth,
  colorAt,
  crisp,
  linearPath,
  linearScale,
  monotonePath,
  niceDomain,
  stepPath,
  useChartFocus,
  type Point,
} from './utils'
import { useElementSize } from '../composables/dom'
import { formatCompact, formatNumber } from '../composables/format'
import type { ChartReference, ChartSeries } from '../types'

interface LineSeries extends ChartSeries {
  /** Flat 8% fill under this line. Defaults to on when the chart has a single series. */
  area?: boolean
  dashed?: boolean
}

const props = withDefaults(
  defineProps<{
    labels: string[]
    series: LineSeries[]
    height?: number
    /** Fill under the first series. Defaults to on for a single series, off for several. */
    area?: boolean
    /** `linear` (default) joins samples with straight segments; `step` holds each value until the
     *  next sample; `monotone` smooths without overshooting, for truly continuous data. */
    curve?: 'linear' | 'step' | 'monotone'
    yTicks?: number
    min?: number
    max?: number
    /** Index to mark with a value tag, like today or the peak. */
    highlight?: number | null
    /** Index of the current moment: a signal-orange line tagged NOW. */
    now?: number | null
    /** From this index on, lines are dashed and the plot is hatched: a forecast. */
    forecastFrom?: number | null
    /** Dashed horizontal lines: targets, thresholds, averages. */
    references?: ChartReference[]
    /** Unit printed above the y axis in mono caps, e.g. "USD M". */
    yUnit?: string
    /** Value at the end of each line (four series at most). */
    endLabels?: boolean
    hideYAxis?: boolean
    /** Defaults to on for two or more series. */
    legend?: boolean
    format?: (value: number) => string
    axisFormat?: (value: number) => string
    label: string
  }>(),
  {
    height: 240,
    area: undefined,
    curve: 'linear',
    yTicks: 4,
    highlight: null,
    now: null,
    forecastFrom: null,
    legend: undefined,
  },
)

const root = ref<HTMLElement | null>(null)
const { width: measured } = useElementSize(root)
const width = chartWidth(measured)
const uid = useId()
const hintId = `${uid}-hint`
const hatchId = `${uid}-hatch`

const fmt = (v: number) => (props.format ? props.format(v) : formatNumber(v))
const axisFmt = (v: number) => (props.axisFormat ? props.axisFormat(v) : formatCompact(v))

const showLegend = computed(() => props.legend ?? props.series.length > 1)
const showEnd = computed(() => props.endLabels && props.series.length <= 4)

const margin = computed(() => ({
  top: props.highlight != null || props.yUnit || props.now != null ? 26 : 10,
  right: showEnd.value ? 60 : 8,
  bottom: 26,
  left: props.hideYAxis ? 8 : 52,
}))

const values = computed(() => props.series.flatMap((s) => s.values.filter((v): v is number => v != null)))
const domain = computed(() => {
  const refs = (props.references ?? []).map((r) => r.value)
  const lo = props.min ?? Math.min(0, ...values.value, ...refs)
  const hi = props.max ?? Math.max(1, ...values.value, ...refs)
  return niceDomain(lo, hi, props.yTicks)
})

const geometry = computed(() => {
  const m = margin.value
  const plotW = Math.max(1, width.value - m.left - m.right)
  const plotH = Math.max(1, props.height - m.top - m.bottom)
  const n = props.labels.length
  const x = (i: number) => m.left + (n <= 1 ? plotW / 2 : (plotW * i) / (n - 1))
  const y = linearScale(domain.value.min, domain.value.max, m.top + plotH, m.top)
  return { plotW, plotH, x, y, top: m.top, bottom: m.top + plotH, left: m.left, right: m.left + plotW }
})

const draw = computed(() => (props.curve === 'step' ? stepPath : props.curve === 'monotone' ? monotonePath : linearPath))

const lines = computed(() =>
  props.series.map((s, i) => {
    const { x, y, bottom } = geometry.value
    const color = colorAt(i, s.color)
    const f = props.forecastFrom
    // Gaps (null) split the line into runs; a forecast splits each run into actual + forecast.
    const runs: { points: Point[]; forecast: boolean }[] = []
    let run: Point[] = []
    let runForecast = false
    s.values.forEach((v, j) => {
      const isForecast = f != null && j > f
      if (v == null) {
        if (run.length) runs.push({ points: run, forecast: runForecast })
        run = []
        return
      }
      const point: Point = [x(j), y(v)]
      if (run.length && isForecast !== runForecast) {
        runs.push({ points: run, forecast: runForecast })
        run = [run[run.length - 1]]
      }
      runForecast = isForecast
      run.push(point)
    })
    if (run.length) runs.push({ points: run, forecast: runForecast })
    const fill = s.area ?? (i === 0 && (props.area ?? props.series.length === 1))
    const area = (r: Point[]) => `${draw.value(r)}L${r[r.length - 1][0]},${bottom}L${r[0][0]},${bottom}Z`
    let last: { x: number; y: number; v: number } | null = null
    s.values.forEach((v, j) => {
      if (v != null) last = { x: x(j), y: y(v), v }
    })
    return {
      name: s.name,
      color,
      dashed: s.dashed,
      actual: runs.filter((r) => !r.forecast).map((r) => draw.value(r.points)).join(''),
      forecast: runs.filter((r) => r.forecast).map((r) => draw.value(r.points)).join(''),
      areaActual: fill ? runs.filter((r) => !r.forecast).map((r) => area(r.points)).join('') : '',
      areaForecast: fill ? runs.filter((r) => r.forecast).map((r) => area(r.points)).join('') : '',
      last: last as { x: number; y: number; v: number } | null,
    }
  }),
)

// End labels: nudged apart vertically, with a leader line when a label had to move.
const ends = computed(() => {
  if (!showEnd.value) return []
  const items = lines.value
    .filter((l) => l.last)
    .map((l) => ({ name: l.name, color: l.color, x: l.last!.x, y: l.last!.y, ty: l.last!.y, text: fmt(l.last!.v) }))
    .sort((a, b) => a.y - b.y)
  for (let i = 1; i < items.length; i++) {
    if (items[i].ty - items[i - 1].ty < 13) items[i].ty = items[i - 1].ty + 13
  }
  return items
})

const yTicks = computed(() => domain.value.ticks.map((v) => ({ v, y: geometry.value.y(v) })))

const xTicks = computed(() => {
  const n = props.labels.length
  const every = Math.max(1, Math.ceil(64 / (geometry.value.plotW / Math.max(1, n - 1))))
  return props.labels
    .map((text, i) => ({ text, x: geometry.value.x(i), i, anchor: i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle' }))
    .filter((t) => t.i % every === 0 || t.i === n - 1)
    .filter((t, k, all) => !(t.i === n - 1 && k > 0 && t.i - all[k - 1].i < every))
})

const refs = computed(() =>
  (props.references ?? []).map((r) => {
    const text = r.label ?? `${r.kind ?? 'target'} ${fmt(r.value)}`
    return { ...r, y: geometry.value.y(r.value), text, w: text.length * 6.2 + 8 }
  }),
)

const forecastBand = computed(() => {
  if (props.forecastFrom == null) return null
  const { x, top, bottom, right } = geometry.value
  const x0 = x(props.forecastFrom)
  return { x: x0, y: top, w: Math.max(0, right - x0), h: bottom - top }
})

const nowLine = computed(() => (props.now == null ? null : { x: geometry.value.x(props.now) }))

const legendItems = computed(() => {
  const items: { name: string; color: string; kind?: 'line' | 'hatch'; dashed?: boolean }[] = lines.value.map((l) => ({
    name: l.name,
    color: l.color,
    dashed: l.dashed,
  }))
  if (props.forecastFrom != null) items.push({ name: 'Forecast', color: 'var(--r-text-tertiary)', kind: 'hatch' })
  return items
})

const focus = useChartFocus(
  () => props.labels.length,
  (i) =>
    `${props.labels[i]}: ${props.series
      .map((s) => `${s.name} ${s.values[i] == null ? 'no data' : fmt(s.values[i] as number)}`)
      .join(', ')}`,
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
  const title = props.labels[i] + (props.forecastFrom != null && i > props.forecastFrom ? ' · forecast' : '')
  const flagW = props.labels[i].length * 6.4 + 12
  return {
    x: x(i),
    points,
    title,
    flag: { text: props.labels[i], w: flagW },
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
  const w = text.length * 6.6 + 12
  return { x: x(i), y: y(v), bottom, text, w, color: colorAt(0, s.color) }
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
    <ChartLegend v-if="showLegend" :items="legendItems" />
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
        <defs>
          <ChartHatch :id="hatchId" />
        </defs>

        <g v-if="forecastBand" class="r-line-chart__forecast-band">
          <rect :x="forecastBand.x" :y="forecastBand.y" :width="forecastBand.w" :height="forecastBand.h" :fill="`url(#${hatchId})`" opacity="0.5" />
          <text class="r-chart__unit" :x="forecastBand.x + 6" :y="forecastBand.y + 12">Forecast</text>
        </g>

        <g class="r-chart__grid">
          <line
            v-for="t in yTicks"
            :key="t.v"
            :x1="geometry.left"
            :x2="geometry.right"
            :y1="crisp(t.y)"
            :y2="crisp(t.y)"
          />
        </g>

        <g class="r-chart__axis">
          <template v-if="!hideYAxis">
            <text v-if="yUnit" class="r-chart__unit" :x="0" :y="geometry.top - 14">{{ yUnit }}</text>
            <text v-for="t in yTicks" :key="`y${t.v}`" :x="geometry.left - 8" :y="t.y" dy="0.32em" text-anchor="end">
              {{ axisFmt(t.v) }}
            </text>
          </template>
          <line class="r-chart__baseline" :x1="geometry.left" :x2="geometry.right" :y1="crisp(geometry.bottom)" :y2="crisp(geometry.bottom)" />
          <template v-for="t in xTicks" :key="`x${t.i}`">
            <line class="r-chart__tick" :x1="crisp(t.x)" :x2="crisp(t.x)" :y1="geometry.bottom" :y2="geometry.bottom + 4" />
            <text :x="t.x" :y="height - 6" :text-anchor="t.anchor">{{ t.text }}</text>
          </template>
        </g>

        <g v-for="r in refs" :key="`r${r.value}${r.kind}`" class="r-chart__ref" :class="`r-chart__ref--${r.kind ?? 'target'}`">
          <line :x1="geometry.left" :x2="geometry.right" :y1="crisp(r.y)" :y2="crisp(r.y)" />
          <rect :x="geometry.right - r.w" :y="r.y - 15" :width="r.w" height="12" />
          <text :x="geometry.right - 4" :y="r.y - 6" text-anchor="end">{{ r.text }}</text>
        </g>

        <template v-for="l in lines" :key="`a${l.name}`">
          <path v-if="l.areaActual" :d="l.areaActual" class="r-line-chart__area" :style="{ fill: l.color }" />
          <path v-if="l.areaForecast" :d="l.areaForecast" class="r-line-chart__area is-forecast" :style="{ fill: l.color }" />
        </template>
        <template v-for="l in lines" :key="`l${l.name}`">
          <path class="r-line-chart__line" :class="{ 'is-dashed': l.dashed }" :d="l.actual" :style="{ stroke: l.color }" />
          <path v-if="l.forecast" class="r-line-chart__line is-dashed" :d="l.forecast" :style="{ stroke: l.color }" />
        </template>



        <g v-if="marker" class="r-line-chart__marker">
          <line :x1="crisp(marker.x)" :x2="crisp(marker.x)" :y1="marker.y" :y2="marker.bottom" class="r-chart__tick" />
          <g class="r-chart__flag">
            <rect :x="marker.x - marker.w / 2" :y="marker.y - 22" :width="marker.w" height="15" />
            <text :x="marker.x" :y="marker.y - 14.5" dy="0.34em" text-anchor="middle">{{ marker.text }}</text>
          </g>
          <circle :cx="marker.x" :cy="marker.y" r="4" class="r-chart__point" :style="{ fill: marker.color }" />
        </g>

        <g v-if="ends.length" class="r-line-chart__ends">
          <template v-for="e in ends" :key="`e${e.name}`">
            <line v-if="Math.abs(e.ty - e.y) > 2" :x1="e.x + 3" :y1="e.y" :x2="e.x + 9" :y2="e.ty" class="r-chart__tick" />
            <circle :cx="e.x" :cy="e.y" r="3" class="r-chart__point" :style="{ fill: e.color }" />
            <text class="r-chart__value" :x="e.x + 12" :y="e.ty" dy="0.34em">{{ e.text }}</text>
          </template>
        </g>

        <g v-if="nowLine" class="r-chart__now">
          <line :x1="crisp(nowLine.x)" :x2="crisp(nowLine.x)" :y1="geometry.top - 12" :y2="geometry.bottom" />
          <rect :x="nowLine.x - 15" :y="geometry.top - 24" width="30" height="12" />
          <text :x="nowLine.x" :y="geometry.top - 15" text-anchor="middle">NOW</text>
        </g>

        <g v-if="cursor" class="r-line-chart__cursor">
          <line class="r-chart__crosshair" :x1="crisp(cursor.x)" :x2="crisp(cursor.x)" :y1="geometry.top" :y2="geometry.bottom" />
          <circle
            v-for="p in cursor.points"
            :key="p.name"
            :cx="cursor.x"
            :cy="p.cy"
            r="4"
            class="r-chart__point"
            :style="{ fill: p.color }"
          />
          <g class="r-chart__flag">
            <rect
              :x="Math.min(Math.max(cursor.x - cursor.flag.w / 2, 0), width - cursor.flag.w)"
              :y="geometry.bottom + 5"
              :width="cursor.flag.w"
              height="15"
            />
            <text
              :x="Math.min(Math.max(cursor.x, cursor.flag.w / 2), width - cursor.flag.w / 2)"
              :y="geometry.bottom + 12.5"
              dy="0.34em"
              text-anchor="middle"
            >
              {{ cursor.flag.text }}
            </text>
          </g>
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

    <div class="r-sr-only">
      <table>
        <caption>{{ label }}</caption>
        <thead>
          <tr>
            <th scope="col">Label</th>
            <th v-for="s in series" :key="s.name" scope="col">{{ s.name }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(l, i) in labels" :key="i">
            <th scope="row">{{ l }}{{ forecastFrom != null && i > forecastFrom ? ' (forecast)' : '' }}</th>
            <td v-for="s in series" :key="s.name">{{ s.values[i] == null ? '—' : fmt(s.values[i] as number) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <span :id="hintId" hidden>Use the arrow keys to read each point.</span>
    <span class="r-sr-only" aria-live="polite">{{ focus.announce.value }}</span>
  </figure>
</template>

<style>
.r-line-chart__line {
  fill: none;
  stroke-width: 2;
  stroke-linecap: butt;
  stroke-linejoin: round;
}

.r-line-chart__line.is-dashed {
  stroke-dasharray: 5 4;
}

.r-line-chart__area {
  opacity: 0.08;
  stroke: none;
}

.r-line-chart__area.is-forecast {
  opacity: 0.04;
}
</style>
