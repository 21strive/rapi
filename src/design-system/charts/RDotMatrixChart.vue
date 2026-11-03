<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import ChartTooltip from './ChartTooltip.vue'
import { chartWidth, colorAt, niceDomain, useChartFocus } from './utils'
import { useElementSize } from '../composables/dom'
import { formatCompact, formatNumber } from '../composables/format'
import type { ChartSeries } from '../types'

const props = withDefaults(
  defineProps<{
    /** One per column; used in tooltips and the data table. */
    labels: string[]
    /** Axis text per column. Empty strings are skipped. Defaults to `labels`, thinned to fit. */
    ticks?: string[]
    /** Stacked from the bottom up. */
    series: ChartSeries[]
    height?: number
    max?: number
    yTicks?: number
    /** Faint dots above each stack, so the grid reads as a whole. */
    showEmpty?: boolean
    /** `dot` = round LEDs (default) · `pixel` = square pixels, like a TE display. */
    shape?: 'dot' | 'pixel'
    format?: (value: number) => string
    axisFormat?: (value: number) => string
    /** Accessible name. */
    label: string
  }>(),
  { height: 280, yTicks: 4, showEmpty: true, shape: 'dot' },
)

const root = ref<HTMLElement | null>(null)
const { width: measured } = useElementSize(root)
const width = chartWidth(measured)
const hintId = useId()

const fmt = (v: number) => (props.format ? props.format(v) : formatNumber(v))
const axisFmt = (v: number) => (props.axisFormat ? props.axisFormat(v) : formatCompact(v))

const M = { top: 10, right: 4, bottom: 26, left: 48 }

const totals = computed(() => props.labels.map((_, c) => props.series.reduce((sum, s) => sum + (s.values[c] ?? 0), 0)))
const domain = computed(() => niceDomain(0, props.max ?? Math.max(1, ...totals.value) * 1.04, props.yTicks))

const layout = computed(() => {
  const plotW = Math.max(1, width.value - M.left - M.right)
  const plotH = Math.max(1, props.height - M.top - M.bottom)
  const n = Math.max(1, props.labels.length)
  const colW = plotW / n
  const pitch = Math.max(6, Math.min(colW, plotH / 7, 26))
  const rows = Math.max(1, Math.floor(plotH / pitch))
  const unit = domain.value.max / rows
  const radius = Math.max(2, pitch * 0.4)
  return { plotW, plotH, n, colW, pitch, rows, unit, radius }
})

interface Dot {
  cx: number
  cy: number
  fill: string
  row: number
  empty: boolean
}

const columns = computed(() =>
  props.labels.map((_, c) => {
    const { colW, pitch, rows, unit, radius } = layout.value
    const cx = M.left + colW * (c + 0.5)
    const bottom = M.top + layout.value.plotH
    const dots: Dot[] = []
    let filled = 0
    let running = 0
    props.series.forEach((s, i) => {
      running += s.values[c] ?? 0
      const upTo = Math.min(rows, Math.round(running / unit))
      for (let k = filled; k < upTo; k++) {
        dots.push({ cx, cy: bottom - pitch * (k + 0.5), fill: colorAt(i, s.color), row: k, empty: false })
      }
      filled = Math.max(filled, upTo)
    })
    if (props.showEmpty) {
      for (let k = filled; k < rows; k++) {
        dots.push({ cx, cy: bottom - pitch * (k + 0.5), fill: 'var(--r-chart-track)', row: k, empty: true })
      }
    }
    const top = bottom - pitch * Math.max(filled, 1)
    return { cx, dots, top, radius }
  }),
)

const yTicks = computed(() => {
  const { plotH } = layout.value
  return domain.value.ticks.map((v) => ({ v, y: M.top + plotH - (v / domain.value.max) * plotH }))
})

/* Axis labels are thinned evenly (every 2nd, 3rd…) until the widest one fits, explicit ticks included. */
const labelWidth = (text: string) => text.length * 6.6 + 10

const xTicks = computed(() => {
  const { colW } = layout.value
  const all = (props.ticks ?? props.labels).map((text, c) => ({ text, x: M.left + colW * (c + 0.5) }))
  const visible = all.filter((t) => t.text)
  if (visible.length < 2) return visible
  const spacing = (visible[visible.length - 1].x - visible[0].x) / (visible.length - 1)
  const widest = Math.max(...visible.map((t) => labelWidth(t.text)))
  const step = Math.max(1, Math.ceil(widest / Math.max(1, spacing)))
  return visible.filter((_, i) => i % step === 0)
})

const focus = useChartFocus(
  () => props.labels.length,
  (c) => `${props.labels[c]}: ${props.series.map((s) => `${s.name} ${fmt(s.values[c] ?? 0)}`).join(', ')}`,
)

function onPointerMove(event: PointerEvent) {
  const box = (event.currentTarget as SVGElement).getBoundingClientRect()
  const x = event.clientX - box.left - M.left
  const c = Math.floor(x / layout.value.colW)
  focus.onPointer(c >= 0 && c < props.labels.length ? c : null)
}

const tooltip = computed(() => {
  const c = focus.active.value
  if (c === null) return null
  const column = columns.value[c]
  return {
    x: column.cx,
    y: column.top,
    title: props.labels[c],
    rows: props.series.map((s, i) => ({ label: s.name, value: fmt(s.values[c] ?? 0), color: colorAt(i, s.color) })),
  }
})
</script>

<template>
  <figure
    ref="root"
    class="r-chart r-dot-matrix"
    :class="{ 'is-focused': focus.active.value !== null }"
    tabindex="0"
    :aria-describedby="hintId"
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
      <g class="r-chart__grid">
        <line
          v-for="t in yTicks"
          :key="t.v"
          :x1="M.left"
          :x2="width - M.right"
          :y1="Math.round(t.y) + 0.5"
          :y2="Math.round(t.y) + 0.5"
        />
      </g>
      <g class="r-chart__axis">
        <text v-for="t in yTicks" :key="`y${t.v}`" :x="M.left - 8" :y="t.y" dy="0.32em" text-anchor="end">{{ axisFmt(t.v) }}</text>
        <text v-for="t in xTicks" :key="`x${t.x}`" :x="t.x" :y="height - 6" text-anchor="middle">{{ t.text }}</text>
      </g>
      <line
        v-if="tooltip"
        class="r-chart__crosshair"
        :x1="tooltip.x"
        :x2="tooltip.x"
        :y1="M.top"
        :y2="height - M.bottom"
      />
      <g
        v-for="(column, c) in columns"
        :key="c"
        class="r-dot-matrix__column"
        :class="{ 'is-active': focus.active.value === c }"
      >
        <template v-if="shape === 'pixel'">
          <rect
            v-for="dot in column.dots"
            :key="dot.row"
            class="r-dot-matrix__dot"
            :class="{ 'is-empty': dot.empty }"
            :x="dot.cx - column.radius"
            :y="dot.cy - column.radius"
            :width="column.radius * 2"
            :height="column.radius * 2"
            :style="{ fill: dot.fill, animationDelay: `${dot.row * 14 + c * 4}ms` }"
          />
        </template>
        <template v-else>
          <circle
            v-for="dot in column.dots"
            :key="dot.row"
            class="r-dot-matrix__dot"
            :class="{ 'is-empty': dot.empty }"
            :cx="dot.cx"
            :cy="dot.cy"
            :r="column.radius"
            :style="{ fill: dot.fill, animationDelay: `${dot.row * 14 + c * 4}ms` }"
          />
        </template>
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
            <th scope="col">Period</th>
            <th v-for="s in series" :key="s.name" scope="col">{{ s.name }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(l, c) in labels" :key="c">
            <th scope="row">{{ l }}</th>
            <td v-for="s in series" :key="s.name">{{ fmt(s.values[c] ?? 0) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <span :id="hintId" hidden>Use the arrow keys to read each column.</span>
    <span class="r-sr-only" aria-live="polite">{{ focus.announce.value }}</span>
  </figure>
</template>

<style>
.r-dot-matrix__dot {
  animation: r-dot-in var(--r-duration-slow) var(--r-ease-out) both;
  transition: opacity var(--r-duration-fast) var(--r-ease-out);
}

.r-dot-matrix.is-focused .r-dot-matrix__column:not(.is-active) .r-dot-matrix__dot:not(.is-empty) {
  opacity: 0.45;
}

/* LEDs switch on; they do not grow. */
@keyframes r-dot-in {
  from {
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .r-dot-matrix__dot {
    animation: none;
  }
}
</style>
