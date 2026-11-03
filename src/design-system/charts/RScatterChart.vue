<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import ChartTooltip from './ChartTooltip.vue'
import ChartLegend from './ChartLegend.vue'
import { chartWidth, colorAt, crisp, linearScale, niceDomain, useChartFocus } from './utils'
import { useElementSize } from '../composables/dom'
import { formatCompact, formatNumber } from '../composables/format'
import type { ChartReference, ScatterSeries } from '../types'

/** Points on two numeric axes, up to three series. Nearest-point hover, labelled outliers. */
const props = withDefaults(
  defineProps<{
    series: ScatterSeries[]
    label: string
    xLabel: string
    yLabel: string
    height?: number
    /** Dashed reference lines across x or y, e.g. a risk threshold. */
    xReferences?: ChartReference[]
    yReferences?: ChartReference[]
    /** Label the points that have a `label` directly on the plot. */
    labelPoints?: boolean
    formatX?: (value: number) => string
    formatY?: (value: number) => string
  }>(),
  { height: 300 },
)

const root = ref<HTMLElement | null>(null)
const { width: measured } = useElementSize(root)
const width = chartWidth(measured)
const uid = useId()

const fx = (v: number) => (props.formatX ? props.formatX(v) : formatNumber(v))
const fy = (v: number) => (props.formatY ? props.formatY(v) : formatNumber(v))

// All-pairs forms carry three series at most: past that, colours stop being distinguishable.
const shown = computed(() => props.series.slice(0, 3))

const M = { top: 22, right: 12, bottom: 34, left: 52 }

const domains = computed(() => {
  const pts = shown.value.flatMap((s) => s.points)
  const xs = [...pts.map((p) => p.x), ...(props.xReferences ?? []).map((r) => r.value)]
  const ys = [...pts.map((p) => p.y), ...(props.yReferences ?? []).map((r) => r.value)]
  const pad = (a: number[]) => (Math.max(...a) - Math.min(...a)) * 0.05 || 1
  // Padding never pushes an all-positive axis below zero.
  const lo = (a: number[]) => (Math.min(...a) >= 0 ? Math.max(0, Math.min(...a) - pad(a)) : Math.min(...a) - pad(a))
  return {
    x: niceDomain(lo(xs), Math.max(...xs) + pad(xs), 5),
    y: niceDomain(lo(ys), Math.max(...ys) + pad(ys), 4),
  }
})

const geometry = computed(() => {
  const plotW = Math.max(1, width.value - M.left - M.right)
  const plotH = Math.max(1, props.height - M.top - M.bottom)
  const x = linearScale(domains.value.x.min, domains.value.x.max, M.left, M.left + plotW)
  const y = linearScale(domains.value.y.min, domains.value.y.max, M.top + plotH, M.top)
  return { x, y, left: M.left, right: M.left + plotW, top: M.top, bottom: M.top + plotH }
})

const points = computed(() =>
  shown.value.flatMap((s, si) =>
    s.points.map((p) => ({
      ...p,
      series: s.name,
      color: colorAt(si, s.color),
      cx: geometry.value.x(p.x),
      cy: geometry.value.y(p.y),
    })),
  ),
)

const xTicks = computed(() => domains.value.x.ticks.map((v) => ({ v, x: geometry.value.x(v) })))
const yTicks = computed(() => domains.value.y.ticks.map((v) => ({ v, y: geometry.value.y(v) })))

const xRefs = computed(() => (props.xReferences ?? []).map((r) => ({ ...r, x: geometry.value.x(r.value) })))
const yRefs = computed(() => (props.yReferences ?? []).map((r) => ({ ...r, y: geometry.value.y(r.value) })))

const focus = useChartFocus(
  () => points.value.length,
  (i) => {
    const p = points.value[i]
    return `${p.label ?? p.id ?? p.series}: ${props.xLabel} ${fx(p.x)}, ${props.yLabel} ${fy(p.y)}`
  },
)

// Nearest point within 24px, so nobody has to land on an 8px dot.
function onPointerMove(event: PointerEvent) {
  const box = (event.currentTarget as SVGElement).getBoundingClientRect()
  const px = event.clientX - box.left
  const py = event.clientY - box.top
  let best = -1
  let bestD = 24 * 24
  points.value.forEach((p, i) => {
    const d = (p.cx - px) ** 2 + (p.cy - py) ** 2
    if (d < bestD) {
      bestD = d
      best = i
    }
  })
  focus.onPointer(best >= 0 ? best : null)
}

const tip = computed(() => {
  const i = focus.active.value
  if (i === null) return null
  const p = points.value[i]
  return {
    x: p.cx,
    y: p.cy,
    title: p.label ?? p.id ?? p.series,
    rows: [
      { label: props.xLabel, value: fx(p.x), color: p.color, kind: 'dot' as const },
      { label: props.yLabel, value: fy(p.y) },
      ...(shown.value.length > 1 ? [{ label: 'Series', value: p.series }] : []),
    ],
  }
})

const legendItems = computed(() =>
  shown.value.length > 1 ? shown.value.map((s, i) => ({ name: s.name, color: colorAt(i, s.color), kind: 'dot' as const })) : [],
)
</script>

<template>
  <figure
    ref="root"
    class="r-chart r-scatter"
    tabindex="0"
    :aria-describedby="`${uid}-hint`"
    @keydown="focus.onKeydown"
    @blur="focus.onBlur"
  >
    <ChartLegend v-if="legendItems.length" :items="legendItems" />
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
          <line v-for="t in yTicks" :key="`gy${t.v}`" :x1="geometry.left" :x2="geometry.right" :y1="crisp(t.y)" :y2="crisp(t.y)" />
          <line v-for="t in xTicks" :key="`gx${t.v}`" :x1="crisp(t.x)" :x2="crisp(t.x)" :y1="geometry.top" :y2="geometry.bottom" />
        </g>
        <g class="r-chart__axis">
          <text class="r-chart__unit" :x="geometry.left" :y="geometry.top - 10">{{ yLabel }}</text>
          <text v-for="t in yTicks" :key="`y${t.v}`" :x="geometry.left - 8" :y="t.y" dy="0.32em" text-anchor="end">{{ formatY ? formatY(t.v) : formatCompact(t.v) }}</text>
          <text v-for="t in xTicks" :key="`x${t.v}`" :x="t.x" :y="geometry.bottom + 16" text-anchor="middle">{{ formatX ? formatX(t.v) : formatCompact(t.v) }}</text>
          <text class="r-chart__unit" :x="geometry.right" :y="height - 2" text-anchor="end">{{ xLabel }}</text>
        </g>
        <line class="r-chart__baseline" :x1="geometry.left" :x2="geometry.right" :y1="crisp(geometry.bottom)" :y2="crisp(geometry.bottom)" />
        <line class="r-chart__axis-line" :x1="crisp(geometry.left)" :x2="crisp(geometry.left)" :y1="geometry.top" :y2="geometry.bottom" />

        <g v-for="r in xRefs" :key="`rx${r.value}`" class="r-chart__ref" :class="`r-chart__ref--${r.kind ?? 'threshold'}`">
          <line :x1="crisp(r.x)" :x2="crisp(r.x)" :y1="geometry.top" :y2="geometry.bottom" />
          <rect :x="r.x + 2" :y="geometry.top - 15" :width="(r.label ?? fx(r.value)).length * 6.2 + 6" height="12" />
          <text :x="r.x + 5" :y="geometry.top - 6">{{ r.label ?? fx(r.value) }}</text>
        </g>
        <g v-for="r in yRefs" :key="`ry${r.value}`" class="r-chart__ref" :class="`r-chart__ref--${r.kind ?? 'threshold'}`">
          <line :x1="geometry.left" :x2="geometry.right" :y1="crisp(r.y)" :y2="crisp(r.y)" />
          <text :x="geometry.right - 4" :y="r.y - 4" text-anchor="end">{{ r.label ?? fy(r.value) }}</text>
        </g>

        <g class="r-scatter__points" :class="{ 'is-focused': focus.active.value !== null }">
          <circle
            v-for="(p, i) in points"
            :key="i"
            class="r-chart__point"
            :class="{ 'is-active': focus.active.value === i }"
            :cx="p.cx"
            :cy="p.cy"
            :r="focus.active.value === i ? 5.5 : 4"
            :style="{ fill: p.color }"
          />
        </g>
        <g v-if="labelPoints">
          <template v-for="(p, i) in points" :key="`t${i}`">
            <!-- Labels sit right of the point, or left of it near the right edge so they never clip. -->
            <text
              v-if="p.label"
              class="r-chart__value r-chart__value--quiet"
              :x="p.cx + (p.cx + p.label.length * 6.4 + 8 > geometry.right ? -8 : 8)"
              :y="p.cy"
              dy="0.34em"
              :text-anchor="p.cx + p.label.length * 6.4 + 8 > geometry.right ? 'end' : 'start'"
            >
              {{ p.label }}
            </text>
          </template>
        </g>
      </svg>
      <ChartTooltip v-if="tip" :x="tip.x" :y="tip.y" :bounds="{ width, height }" :title="tip.title" :rows="tip.rows" />
    </div>
    <div class="r-sr-only">
      <table>
        <caption>{{ label }}</caption>
        <thead>
          <tr>
            <th scope="col">Point</th>
            <th scope="col">Series</th>
            <th scope="col">{{ xLabel }}</th>
            <th scope="col">{{ yLabel }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(p, i) in points" :key="i">
            <th scope="row">{{ p.label ?? p.id ?? i + 1 }}</th>
            <td>{{ p.series }}</td>
            <td>{{ fx(p.x) }}</td>
            <td>{{ fy(p.y) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <span :id="`${uid}-hint`" hidden>Use the arrow keys to step through the points.</span>
    <span class="r-sr-only" aria-live="polite">{{ focus.announce.value }}</span>
  </figure>
</template>

<style>
.r-scatter__points circle {
  transition:
    opacity var(--r-duration-fast) var(--r-ease-out),
    r var(--r-duration-fast) var(--r-ease-out);
}

.r-scatter__points.is-focused circle:not(.is-active) {
  opacity: 0.4;
}
</style>
