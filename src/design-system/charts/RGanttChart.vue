<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import ChartTooltip from './ChartTooltip.vue'
import ChartHatch from './ChartHatch.vue'
import { chartWidth, crisp, linearScale, useChartFocus } from './utils'
import { useElementSize } from '../composables/dom'
import type { GanttItem, GanttRow } from '../types'

/** Rows of bars on a time axis: schedules, passes, mission phases. A signal-orange "now" line. */
const props = withDefaults(
  defineProps<{
    rows: GanttRow[]
    label: string
    /** [start, end] of the axis in the same units as the items (minutes, hours, epoch ms…). */
    domain: [number, number]
    /** Tick positions; defaults to 6 even ticks. */
    ticks?: number[]
    formatTick?: (value: number) => string
    now?: number
    rowHeight?: number
    labelWidth?: number
  }>(),
  { rowHeight: 32, labelWidth: 160 },
)

const root = ref<HTMLElement | null>(null)
const { width: measured } = useElementSize(root)
const width = chartWidth(measured)
const uid = useId()
const hatchId = `${uid}-hatch`

const ft = (v: number) => (props.formatTick ? props.formatTick(v) : String(Math.round(v)))

const AXIS_H = 26

const TONES: Record<NonNullable<GanttItem['tone']>, { fill: string; text: string }> = {
  brand: { fill: 'var(--r-brand-fill)', text: 'var(--r-on-brand)' },
  context: { fill: 'var(--r-chart-context)', text: 'var(--r-text)' },
  signal: { fill: 'var(--r-signal)', text: 'var(--r-on-signal)' },
  success: { fill: 'var(--r-success)', text: 'var(--r-on-success)' },
  warning: { fill: 'var(--r-warning)', text: 'var(--r-on-warning)' },
  danger: { fill: 'var(--r-danger)', text: 'var(--r-on-danger)' },
}

const labelW = computed(() => (width.value < 520 ? Math.min(props.labelWidth, 110) : props.labelWidth))

const geometry = computed(() => {
  const left = labelW.value
  const right = width.value - 8
  const x = linearScale(props.domain[0], props.domain[1], left, right)
  const height = AXIS_H + props.rows.length * props.rowHeight + 1
  return { left, right, x, height }
})

const tickValues = computed(() => {
  if (props.ticks) return props.ticks
  const [a, b] = props.domain
  return Array.from({ length: 7 }, (_, i) => a + ((b - a) * i) / 6)
})

const flat = computed(() =>
  props.rows.flatMap((row, r) =>
    row.items.map((item) => {
      const g = geometry.value
      const y = AXIS_H + r * props.rowHeight
      const x0 = g.x(Math.max(props.domain[0], item.start))
      const x1 = g.x(Math.min(props.domain[1], item.milestone ? item.start : item.end))
      const tone = TONES[item.tone ?? 'brand']
      const w = Math.max(2, x1 - x0)
      const text = item.label ?? ''
      const textW = text.length * 6.3 + 12
      const fits = textW < w
      // An outside label is dropped when it would run into the next item in the row;
      // the tooltip and the table still carry it.
      const end = item.milestone ? x0 + 10 : x0 + w + 6
      const next = row.items
        .filter((o) => o !== item && o.start > item.start)
        .reduce((m, o) => Math.min(m, g.x(o.start) - (o.milestone ? 6 : 0)), Infinity)
      const room = end + textW - 6 < next
      return { row, item, r, x: x0, y: y + 7, w, h: props.rowHeight - 14, tone, text, fits, room, cy: y + props.rowHeight / 2 }
    }),
  ),
)

const nowX = computed(() => (props.now == null ? null : geometry.value.x(props.now)))

const focus = useChartFocus(
  () => flat.value.length,
  (i) => {
    const f = flat.value[i]
    return f.item.milestone
      ? `${f.row.label}: ${f.text || 'milestone'} at ${ft(f.item.start)}`
      : `${f.row.label}: ${f.text || 'item'} from ${ft(f.item.start)} to ${ft(f.item.end)}`
  },
)

const tip = computed(() => {
  const i = focus.active.value
  if (i === null) return null
  const f = flat.value[i]
  const rows = f.item.milestone
    ? [{ label: 'At', value: ft(f.item.start), color: 'var(--r-chart-ink)', kind: 'rect' as const }]
    : [
        { label: 'Start', value: ft(f.item.start), color: f.tone.fill, kind: 'rect' as const },
        { label: 'End', value: ft(f.item.end) },
      ]
  return { x: f.x + (f.item.milestone ? 0 : f.w / 2), y: f.y, title: `${f.row.label}${f.text ? ` · ${f.text}` : ''}`, rows }
})
</script>

<template>
  <figure
    ref="root"
    class="r-chart r-gantt"
    tabindex="0"
    :aria-describedby="`${uid}-hint`"
    @keydown="focus.onKeydown"
    @blur="focus.onBlur"
  >
    <div class="r-chart__plot">
      <svg :width="width" :height="geometry.height" :viewBox="`0 0 ${width} ${geometry.height}`" role="img" :aria-label="label">
        <defs>
          <ChartHatch :id="hatchId" />
        </defs>
        <g class="r-chart__grid">
          <line v-for="t in tickValues" :key="`g${t}`" :x1="crisp(geometry.x(t))" :x2="crisp(geometry.x(t))" :y1="AXIS_H" :y2="geometry.height" />
        </g>
        <g class="r-chart__axis">
          <text v-for="t in tickValues" :key="`t${t}`" :x="geometry.x(t)" :y="AXIS_H - 10" text-anchor="middle">{{ ft(t) }}</text>
        </g>
        <line class="r-chart__baseline" :x1="0" :x2="geometry.right" :y1="crisp(AXIS_H)" :y2="crisp(AXIS_H)" />

        <g v-for="(row, r) in rows" :key="row.id" class="r-gantt__row">
          <line class="r-gantt__rule" :x1="0" :x2="geometry.right" :y1="crisp(AXIS_H + (r + 1) * rowHeight)" :y2="crisp(AXIS_H + (r + 1) * rowHeight)" />
          <text class="r-gantt__label" :x="0" :y="AXIS_H + r * rowHeight + rowHeight / 2 - (row.meta ? 5 : 0)" dy="0.34em">{{ row.label }}</text>
          <text v-if="row.meta" class="r-chart__text" :x="0" :y="AXIS_H + r * rowHeight + rowHeight / 2 + 8" dy="0.34em">{{ row.meta }}</text>
        </g>

        <g
          v-for="(f, i) in flat"
          :key="`i${i}`"
          class="r-gantt__item"
          :class="{ 'is-active': focus.active.value === i, 'is-dim': focus.active.value !== null && focus.active.value !== i }"
          @pointerenter="focus.onPointer(i)"
          @pointerleave="focus.onPointer(null)"
        >
          <template v-if="f.item.milestone">
            <rect class="r-gantt__milestone" :x="f.x - 5" :y="f.cy - 5" width="10" height="10" :transform="`rotate(45 ${f.x} ${f.cy})`" />
            <text v-if="f.text && f.room" class="r-gantt__outside" :x="f.x + 10" :y="f.cy" dy="0.34em">{{ f.text }}</text>
          </template>
          <template v-else>
            <rect
              :x="f.x"
              :y="f.y"
              :width="f.w"
              :height="f.h"
              :style="f.item.hatch ? { fill: `url(#${hatchId})`, stroke: f.tone.fill } : { fill: f.tone.fill }"
              :class="{ 'is-hatch': f.item.hatch }"
            />
            <text
              v-if="f.text && f.fits"
              class="r-gantt__inside"
              :x="f.x + 6"
              :y="f.cy"
              dy="0.34em"
              :style="{ fill: f.item.hatch ? 'var(--r-text)' : f.tone.text }"
            >
              {{ f.text }}
            </text>
            <text v-else-if="f.text && f.room" class="r-gantt__outside" :x="f.x + f.w + 6" :y="f.cy" dy="0.34em">{{ f.text }}</text>
          </template>
        </g>

        <g v-if="nowX != null" class="r-chart__now">
          <line :x1="crisp(nowX)" :x2="crisp(nowX)" :y1="AXIS_H - 6" :y2="geometry.height" />
          <rect :x="nowX - 15" :y="1" width="30" height="12" />
          <text :x="nowX" :y="10" text-anchor="middle">NOW</text>
        </g>
      </svg>
      <ChartTooltip v-if="tip" :x="tip.x" :y="tip.y" :bounds="{ width, height: geometry.height }" :title="tip.title" :rows="tip.rows" placement="top" />
    </div>
    <div class="r-sr-only">
      <table>
        <caption>{{ label }}</caption>
        <thead>
          <tr>
            <th scope="col">Row</th>
            <th scope="col">Item</th>
            <th scope="col">Start</th>
            <th scope="col">End</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(f, i) in flat" :key="i">
            <th scope="row">{{ f.row.label }}</th>
            <td>{{ f.text || (f.item.milestone ? 'Milestone' : 'Item') }}{{ f.item.hatch ? ' (planned)' : '' }}</td>
            <td>{{ ft(f.item.start) }}</td>
            <td>{{ f.item.milestone ? '—' : ft(f.item.end) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <span :id="`${uid}-hint`" hidden>Use the arrow keys to step through the items.</span>
    <span class="r-sr-only" aria-live="polite">{{ focus.announce.value }}</span>
  </figure>
</template>

<style>
.r-gantt__rule {
  stroke: var(--r-border-subtle);
  stroke-width: 1;
  shape-rendering: crispEdges;
}

.r-gantt__label {
  fill: var(--r-text);
  font-family: var(--r-font-sans);
  font-size: 12.5px;
  font-weight: var(--r-weight-medium);
}

.r-gantt__item {
  cursor: default;
  transition: opacity var(--r-duration-fast) var(--r-ease-out);
}

.r-gantt__item rect {
  shape-rendering: crispEdges;
}

.r-gantt__item rect.is-hatch {
  stroke-width: 1;
}

.r-gantt__item.is-dim {
  opacity: 0.5;
}

.r-gantt__item.is-active rect {
  stroke: var(--r-chart-ink);
  stroke-width: 1.5;
}

.r-gantt__milestone {
  fill: var(--r-chart-ink);
  stroke: var(--r-chart-surface);
  stroke-width: 2;
}

.r-gantt__inside,
.r-gantt__outside {
  font-family: var(--r-font-mono);
  font-size: 10px;
  font-weight: var(--r-weight-semibold);
  letter-spacing: 0.02em;
  pointer-events: none;
}

.r-gantt__outside {
  fill: var(--r-text-secondary);
}
</style>
