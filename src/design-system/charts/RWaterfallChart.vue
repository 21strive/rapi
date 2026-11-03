<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import ChartTooltip from './ChartTooltip.vue'
import ChartLegend from './ChartLegend.vue'
import { chartWidth, crisp, linearScale, niceDomain, signed, useChartFocus } from './utils'
import { useElementSize } from '../composables/dom'
import { formatCompact, formatNumber } from '../composables/format'
import type { WaterfallStep } from '../types'

/** A bridge from a start value to an end value through signed steps. */
const props = withDefaults(
  defineProps<{
    steps: WaterfallStep[]
    label: string
    height?: number
    format?: (value: number) => string
    /** Y-axis ticks; defaults to compact numbers. */
    axisFormat?: (value: number) => string
  }>(),
  { height: 280 },
)

const root = ref<HTMLElement | null>(null)
const { width: measured } = useElementSize(root)
const width = chartWidth(measured)
const uid = useId()

const fmt = (v: number) => (props.format ? props.format(v) : formatNumber(v))

// Totals show the running total at that point; the first total sets the start.
const bars = computed(() => {
  let running = 0
  return props.steps.map((s, i) => {
    if (s.kind === 'total') {
      if (i === 0) running = s.value
      return { ...s, from: 0, to: running, total: running, kind: 'total' as const }
    }
    const from = running
    running += s.value
    return { ...s, from, to: running, total: running, kind: 'delta' as const }
  })
})

const domain = computed(() => {
  const all = bars.value.flatMap((b) => [b.from, b.to])
  return niceDomain(Math.min(0, ...all), Math.max(1, ...all), 4)
})

const M = { top: 22, right: 4, bottom: 26, left: 52 }

const geometry = computed(() => {
  const plotW = Math.max(1, width.value - M.left - M.right)
  const plotH = Math.max(1, props.height - M.top - M.bottom)
  const n = Math.max(1, props.steps.length)
  const band = plotW / n
  const barW = Math.max(6, Math.min(24, band * 0.6))
  const y = linearScale(domain.value.min, domain.value.max, M.top + plotH, M.top)
  return { band, barW, y, top: M.top, bottom: M.top + plotH, left: M.left, right: M.left + plotW }
})

const rects = computed(() =>
  bars.value.map((b, i) => {
    const g = geometry.value
    const cx = g.left + g.band * i + g.band / 2
    const y0 = g.y(Math.max(b.from, b.to))
    const y1 = g.y(Math.min(b.from, b.to))
    const up = b.to >= b.from
    const color = b.kind === 'total' ? 'var(--r-chart-ink)' : up ? 'var(--r-div-pos)' : 'var(--r-div-neg)'
    const text = b.kind === 'total' ? fmt(b.total) : signed(fmt(Math.abs(b.value)), b.value < 0)
    // Label above an increase or a total, below a decrease.
    const labelY = b.kind === 'delta' && !up ? y1 + 12 : y0 - 6
    return { ...b, cx, x: cx - g.barW / 2, y: y0, w: g.barW, h: Math.max(1, y1 - y0), color, text, labelY, up }
  }),
)

const connectors = computed(() =>
  rects.value.slice(0, -1).map((r, i) => {
    const next = rects.value[i + 1]
    return { x1: r.x + r.w, x2: next.x, y: geometry.value.y(r.total) }
  }),
)

const yTicks = computed(() => domain.value.ticks.map((v) => ({ v, y: geometry.value.y(v) })))
const xEvery = computed(() => Math.max(1, Math.ceil(64 / geometry.value.band)))

const focus = useChartFocus(
  () => props.steps.length,
  (i) => {
    const r = rects.value[i]
    return r.kind === 'total' ? `${r.label}: ${fmt(r.total)}` : `${r.label}: ${r.text}, running total ${fmt(r.total)}`
  },
)

function onPointerMove(event: PointerEvent) {
  const box = (event.currentTarget as SVGElement).getBoundingClientRect()
  const i = Math.floor((event.clientX - box.left - geometry.value.left) / geometry.value.band)
  focus.onPointer(i >= 0 && i < props.steps.length ? i : null)
}

const tip = computed(() => {
  const i = focus.active.value
  if (i === null) return null
  const r = rects.value[i]
  const rows =
    r.kind === 'total'
      ? [{ label: 'Total', value: fmt(r.total), color: r.color, kind: 'rect' as const }]
      : [
          { label: r.up ? 'Increase' : 'Decrease', value: r.text, color: r.color, kind: 'rect' as const },
          { label: 'Running total', value: fmt(r.total) },
        ]
  return { x: r.cx, y: r.y, title: r.label, rows }
})

const legend = [
  { name: 'Increase', color: 'var(--r-div-pos)', kind: 'rect' as const },
  { name: 'Decrease', color: 'var(--r-div-neg)', kind: 'rect' as const },
  { name: 'Total', color: 'var(--r-chart-ink)', kind: 'rect' as const },
]
</script>

<template>
  <figure
    ref="root"
    class="r-chart r-waterfall"
    tabindex="0"
    :aria-describedby="`${uid}-hint`"
    @keydown="focus.onKeydown"
    @blur="focus.onBlur"
  >
    <ChartLegend :items="legend" />
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
          <text v-for="t in yTicks" :key="`y${t.v}`" :x="geometry.left - 8" :y="t.y" dy="0.32em" text-anchor="end">{{ axisFormat ? axisFormat(t.v) : formatCompact(t.v) }}</text>
          <template v-for="(r, i) in rects" :key="`x${i}`">
            <text v-if="i % xEvery === 0" :x="r.cx" :y="height - 6" text-anchor="middle">{{ r.label }}</text>
          </template>
        </g>
        <line class="r-chart__baseline" :x1="geometry.left" :x2="geometry.right" :y1="crisp(geometry.y(0))" :y2="crisp(geometry.y(0))" />
        <line v-for="(c, i) in connectors" :key="`k${i}`" class="r-waterfall__connector" :x1="c.x1" :x2="c.x2" :y1="crisp(c.y)" :y2="crisp(c.y)" />
        <g
          v-for="(r, i) in rects"
          :key="`b${i}`"
          class="r-waterfall__bar"
          :class="{ 'is-dim': focus.active.value !== null && focus.active.value !== i }"
        >
          <rect :x="r.x" :y="r.y" :width="r.w" :height="r.h" :style="{ fill: r.color }" />
          <text class="r-chart__value" :class="{ 'r-chart__value--quiet': r.kind === 'delta' }" :x="r.cx" :y="r.labelY" text-anchor="middle">
            {{ r.text }}
          </text>
        </g>
      </svg>
      <ChartTooltip v-if="tip" :x="tip.x" :y="tip.y" :bounds="{ width, height }" :title="tip.title" :rows="tip.rows" placement="top" />
    </div>
    <div class="r-sr-only">
      <table>
        <caption>{{ label }}</caption>
        <thead>
          <tr>
            <th scope="col">Step</th>
            <th scope="col">Change</th>
            <th scope="col">Running total</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in rects" :key="r.label">
            <th scope="row">{{ r.label }}</th>
            <td>{{ r.kind === 'total' ? '—' : r.text }}</td>
            <td>{{ fmt(r.total) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <span :id="`${uid}-hint`" hidden>Use the arrow keys to read each step.</span>
    <span class="r-sr-only" aria-live="polite">{{ focus.announce.value }}</span>
  </figure>
</template>

<style>
.r-waterfall__bar {
  transition: opacity var(--r-duration-fast) var(--r-ease-out);
}

.r-waterfall__bar.is-dim {
  opacity: 0.45;
}

.r-waterfall__bar rect {
  shape-rendering: crispEdges;
}

.r-waterfall__connector {
  stroke: var(--r-chart-axis);
  stroke-width: 1;
  shape-rendering: crispEdges;
}
</style>
