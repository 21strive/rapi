<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import ChartTooltip from './ChartTooltip.vue'
import ChartLegend from './ChartLegend.vue'
import { chartWidth, colorAt, crisp, linearScale, niceDomain, useChartFocus } from './utils'
import { useElementSize } from '../composables/dom'
import { formatCompact, formatNumber } from '../composables/format'
import type { ChartReference, ChartSeries } from '../types'

const props = withDefaults(
  defineProps<{
    labels: string[]
    /** One series. Ignored when `series` is given. */
    values?: number[]
    /** Several series, stacked in each column with a 2px surface gap between segments. */
    series?: ChartSeries[]
    /** Top of the scale. Defaults to a tidy maximum, or 100 with `percent`. */
    max?: number
    /** Values are percentages: the scale tops out at 100 and labels get a % sign. */
    percent?: boolean
    /** A short tick per column (or one for all) marking the goal. */
    targets?: number[] | number
    /** The column drawn in full colour; the others turn context grey (emphasis). */
    highlight?: number | null
    /** Colour of a single series. */
    color?: string
    /** Kept for 0.1 compatibility; labels now sit above the columns in ink. */
    labelColor?: string
    height?: number
    /** Values printed on the column caps. Defaults to on when there are 12 columns or fewer. */
    showValues?: boolean
    references?: ChartReference[]
    yUnit?: string
    hideYAxis?: boolean
    format?: (value: number) => string
    axisFormat?: (value: number) => string
    label: string
  }>(),
  { color: 'var(--r-chart-1)', height: 220, highlight: null, showValues: undefined },
)

const root = ref<HTMLElement | null>(null)
const { width: measured } = useElementSize(root)
const width = chartWidth(measured)
const uid = useId()

const stacks = computed<ChartSeries[]>(() =>
  props.series?.length ? props.series : [{ name: 'Value', values: props.values ?? [], color: props.color }],
)
const multi = computed(() => (props.series?.length ?? 0) > 1)
const totals = computed(() =>
  props.labels.map((_, i) => stacks.value.reduce((sum, s) => sum + Math.max(0, s.values[i] ?? 0), 0)),
)
const fmt = (v: number) =>
  props.format ? props.format(v) : props.percent ? `${formatNumber(v, { maximumFractionDigits: 1 })}%` : formatNumber(v)
const axisFmt = (v: number) => (props.axisFormat ? props.axisFormat(v) : props.percent ? `${v}%` : formatCompact(v))

const targetAt = (i: number) => (Array.isArray(props.targets) ? props.targets[i] : props.targets)

const domain = computed(() => {
  const refs = (props.references ?? []).map((r) => r.value)
  const targets = props.labels.map((_, i) => targetAt(i) ?? 0)
  const hi = props.max ?? (props.percent ? 100 : Math.max(1, ...totals.value, ...targets, ...refs))
  return props.max != null || props.percent
    ? { min: 0, max: hi, ticks: niceDomain(0, hi, 4).ticks.filter((t) => t <= hi) }
    : niceDomain(0, hi, 4)
})

const values = computed(() => props.showValues ?? props.labels.length <= 12)

const margin = computed(() => ({
  top: values.value || props.yUnit ? 22 : 8,
  right: 4,
  bottom: 26,
  left: props.hideYAxis ? 4 : 48,
}))

const geometry = computed(() => {
  const m = margin.value
  const plotW = Math.max(1, width.value - m.left - m.right)
  const plotH = Math.max(1, props.height - m.top - m.bottom)
  const n = Math.max(1, props.labels.length)
  const band = plotW / n
  const barW = Math.max(4, Math.min(24, band * 0.56))
  const y = linearScale(domain.value.min, domain.value.max, m.top + plotH, m.top)
  return { plotW, plotH, band, barW, y, top: m.top, bottom: m.top + plotH, left: m.left, right: m.left + plotW }
})

const columns = computed(() =>
  props.labels.map((label, i) => {
    const { band, barW, y, left, bottom } = geometry.value
    const cx = left + band * i + band / 2
    const dim = props.highlight != null && props.highlight !== i
    let base = 0
    const segments = stacks.value.map((s, k) => {
      const v = Math.max(0, s.values[i] ?? 0)
      const y0 = y(base)
      const y1 = y(base + v)
      base += v
      // 2px surface gap between stacked segments: trim each segment's top edge.
      const gap = k < stacks.value.length - 1 && v > 0 ? 0 : 0
      return {
        key: `${s.name}`,
        x: cx - barW / 2,
        y: y1 + (k > 0 ? 0 : 0),
        w: barW,
        h: Math.max(0, y0 - y1 - (k > 0 && v > 0 ? 2 : 0) - gap),
        color: dim ? 'var(--r-chart-context)' : colorAt(k, s.color ?? (multi.value ? undefined : props.color)),
      }
    })
    const target = targetAt(i)
    return {
      label,
      cx,
      total: totals.value[i],
      top: y(totals.value[i]),
      bottom,
      segments,
      target: target == null ? null : { y: y(target), w: Math.min(band - 4, barW + 12), value: target },
    }
  }),
)

const yTicks = computed(() => domain.value.ticks.map((v) => ({ v, y: geometry.value.y(v) })))

const xEvery = computed(() => Math.max(1, Math.ceil(44 / geometry.value.band)))

const refs = computed(() =>
  (props.references ?? []).map((r) => {
    const text = r.label ?? `${r.kind ?? 'target'} ${fmt(r.value)}`
    return { ...r, y: geometry.value.y(r.value), text, w: text.length * 6.2 + 8 }
  }),
)

const focus = useChartFocus(
  () => props.labels.length,
  (i) => {
    const t = targetAt(i)
    const parts = multi.value
      ? stacks.value.map((s) => `${s.name} ${fmt(s.values[i] ?? 0)}`).join(', ')
      : fmt(totals.value[i])
    return `${props.labels[i]}: ${parts}${t == null ? '' : `, target ${fmt(t)}`}`
  },
)

function onPointerMove(event: PointerEvent) {
  const box = (event.currentTarget as SVGElement).getBoundingClientRect()
  const px = event.clientX - box.left - geometry.value.left
  const i = Math.floor(px / geometry.value.band)
  focus.onPointer(i >= 0 && i < props.labels.length ? i : null)
}

const tip = computed(() => {
  const i = focus.active.value
  if (i === null) return null
  const c = columns.value[i]
  const rows = multi.value
    ? stacks.value.map((s, k) => ({ label: s.name, value: fmt(s.values[i] ?? 0), color: colorAt(k, s.color), kind: 'rect' as const }))
    : [{ label: 'Value', value: fmt(c.total), color: c.segments[0]?.color, kind: 'rect' as const }]
  if (c.target) rows.push({ label: 'Target', value: fmt(c.target.value), color: 'var(--r-chart-ink)', kind: 'rect' as const })
  return { x: c.cx, y: Math.min(c.top, c.target?.y ?? c.top), title: c.label, rows }
})

const legendItems = computed(() =>
  multi.value ? stacks.value.map((s, k) => ({ name: s.name, color: colorAt(k, s.color), kind: 'rect' as const })) : [],
)
</script>

<template>
  <figure
    ref="root"
    class="r-chart r-columns"
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
          <line v-for="t in yTicks" :key="t.v" :x1="geometry.left" :x2="geometry.right" :y1="crisp(t.y)" :y2="crisp(t.y)" />
        </g>
        <g class="r-chart__axis">
          <template v-if="!hideYAxis">
            <text v-if="yUnit" class="r-chart__unit" :x="geometry.left - 8" :y="geometry.top - 12" text-anchor="end">{{ yUnit }}</text>
            <text v-for="t in yTicks" :key="`y${t.v}`" :x="geometry.left - 8" :y="t.y" dy="0.32em" text-anchor="end">
              {{ axisFmt(t.v) }}
            </text>
          </template>
          <template v-for="(c, i) in columns" :key="`x${i}`">
            <text v-if="i % xEvery === 0" :x="c.cx" :y="height - 6" text-anchor="middle" :class="{ 'is-active': focus.active.value === i }">
              {{ c.label }}
            </text>
          </template>
        </g>

        <g
          v-for="(c, i) in columns"
          :key="`c${i}`"
          class="r-columns__column"
          :class="{ 'is-active': focus.active.value === i, 'is-dim': focus.active.value !== null && focus.active.value !== i }"
        >
          <rect v-for="s in c.segments" :key="s.key" :x="s.x" :y="s.y" :width="s.w" :height="s.h" :style="{ fill: s.color }" />
          <g v-if="c.target" class="r-columns__target">
            <line :x1="c.cx - c.target.w / 2" :x2="c.cx + c.target.w / 2" :y1="c.target.y" :y2="c.target.y" />
          </g>
          <text
            v-if="values"
            class="r-chart__value"
            :class="{ 'r-chart__value--quiet': highlight != null && highlight !== i }"
            :x="c.cx"
            :y="Math.min(c.top, c.target ? c.target.y : c.top) - 6"
            text-anchor="middle"
          >
            {{ fmt(c.total) }}
          </text>
        </g>

        <line class="r-chart__baseline" :x1="geometry.left" :x2="geometry.right" :y1="crisp(geometry.bottom)" :y2="crisp(geometry.bottom)" />

        <g v-for="r in refs" :key="`r${r.value}`" class="r-chart__ref" :class="`r-chart__ref--${r.kind ?? 'target'}`">
          <line :x1="geometry.left" :x2="geometry.right" :y1="crisp(r.y)" :y2="crisp(r.y)" />
          <rect :x="geometry.right - r.w" :y="r.y - 15" :width="r.w" height="12" />
          <text :x="geometry.right - 4" :y="r.y - 6" text-anchor="end">{{ r.text }}</text>
        </g>
      </svg>
      <ChartTooltip v-if="tip" :x="tip.x" :y="tip.y" :bounds="{ width, height }" :title="tip.title" :rows="tip.rows" placement="top" />
    </div>
    <div class="r-sr-only">
      <table>
        <caption>{{ label }}</caption>
        <thead>
          <tr>
            <th scope="col">Label</th>
            <th v-for="s in stacks" :key="s.name" scope="col">{{ s.name }}</th>
            <th v-if="targets != null" scope="col">Target</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(l, i) in labels" :key="i">
            <th scope="row">{{ l }}</th>
            <td v-for="s in stacks" :key="s.name">{{ fmt(s.values[i] ?? 0) }}</td>
            <td v-if="targets != null">{{ targetAt(i) == null ? '—' : fmt(targetAt(i) as number) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <span :id="`${uid}-hint`" hidden>Use the arrow keys to read each column.</span>
    <span class="r-sr-only" aria-live="polite">{{ focus.announce.value }}</span>
  </figure>
</template>

<style>
.r-columns__column rect {
  transition: opacity var(--r-duration-fast) var(--r-ease-out);
}

.r-columns__column.is-dim rect {
  opacity: 0.55;
}

.r-columns__target line {
  stroke: var(--r-chart-ink);
  stroke-width: 2;
}

.r-columns .r-chart__axis text.is-active {
  fill: var(--r-text);
}
</style>
