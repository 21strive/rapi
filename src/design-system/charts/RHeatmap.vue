<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import ChartTooltip from './ChartTooltip.vue'
import { chartWidth } from './utils'
import { useElementSize } from '../composables/dom'
import { formatNumber } from '../composables/format'

const props = withDefaults(
  defineProps<{
    rows: string[]
    cols: string[]
    /** values[row][col] */
    values: number[][]
    /** Colour at full intensity; empty cells use the chart track colour. */
    color?: string
    min?: number
    max?: number
    cellHeight?: number
    gap?: number
    radius?: number
    legend?: boolean
    format?: (value: number) => string
    label: string
  }>(),
  { color: 'var(--r-chart-1)', cellHeight: 30, gap: 4, radius: 6, legend: true },
)

const root = ref<HTMLElement | null>(null)
const { width: measured } = useElementSize(root)
const width = chartWidth(measured)
const uid = useId()

const fmt = (v: number) => (props.format ? props.format(v) : formatNumber(v))
const flat = computed(() => props.values.flat())
const lo = computed(() => props.min ?? Math.min(...flat.value))
const hi = computed(() => props.max ?? Math.max(...flat.value))

const M = { top: 2, right: 0, bottom: 26, left: 48 }

const geometry = computed(() => {
  const plotW = Math.max(1, width.value - M.left - M.right)
  const nCols = Math.max(1, props.cols.length)
  const cellW = (plotW - props.gap * (nCols - 1)) / nCols
  const height = M.top + props.rows.length * (props.cellHeight + props.gap) - props.gap + M.bottom
  return { cellW, height }
})

function mix(value: number) {
  const t = hi.value === lo.value ? 1 : (value - lo.value) / (hi.value - lo.value)
  return `color-mix(in srgb, ${props.color} ${Math.round(10 + t * 90)}%, var(--r-chart-track))`
}

const cells = computed(() =>
  props.rows.flatMap((_, r) =>
    props.cols.map((_, c) => {
      const value = props.values[r]?.[c] ?? 0
      return {
        r,
        c,
        value,
        x: M.left + c * (geometry.value.cellW + props.gap),
        y: M.top + r * (props.cellHeight + props.gap),
        fill: mix(value),
      }
    }),
  ),
)

const active = ref<{ r: number; c: number } | null>(null)
const keyboard = ref(false)

function onKeydown(event: KeyboardEvent) {
  const moves: Record<string, [number, number]> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }
  if (event.key === 'Escape') {
    active.value = null
    return
  }
  const move = moves[event.key]
  if (!move) return
  event.preventDefault()
  keyboard.value = true
  const from = active.value ?? { r: 0, c: -1 }
  active.value = {
    r: Math.min(props.rows.length - 1, Math.max(0, from.r + move[0])),
    c: Math.min(props.cols.length - 1, Math.max(0, from.c + (active.value ? move[1] : 1))),
  }
}

function onBlur() {
  if (keyboard.value) active.value = null
  keyboard.value = false
}

const tooltip = computed(() => {
  if (!active.value) return null
  const cell = cells.value.find((x) => x.r === active.value!.r && x.c === active.value!.c)
  if (!cell) return null
  return {
    x: cell.x + geometry.value.cellW / 2,
    y: cell.y,
    title: `${props.cols[cell.c]} · ${props.rows[cell.r]}`,
    rows: [{ label: 'Value', value: fmt(cell.value) }],
  }
})

const announce = computed(() => (keyboard.value && tooltip.value ? `${tooltip.value.title}: ${tooltip.value.rows[0].value}` : ''))

const legendSteps = [0, 0.25, 0.5, 0.75, 1]
</script>

<template>
  <figure
    ref="root"
    class="r-chart r-heatmap"
    tabindex="0"
    :aria-describedby="`${uid}-hint`"
    @keydown="onKeydown"
    @blur="onBlur"
  >
    <svg
      :width="width"
      :height="geometry.height"
      :viewBox="`0 0 ${width} ${geometry.height}`"
      role="img"
      :aria-label="label"
      @pointerleave="active = null"
    >
      <g class="r-chart__axis">
        <text
          v-for="(row, r) in rows"
          :key="`r${r}`"
          :x="0"
          :y="M.top + r * (cellHeight + gap) + cellHeight / 2"
          dy="0.32em"
        >
          {{ row }}
        </text>
        <text
          v-for="(col, c) in cols"
          :key="`c${c}`"
          :x="M.left + c * (geometry.cellW + gap) + geometry.cellW / 2"
          :y="geometry.height - 8"
          text-anchor="middle"
        >
          {{ col }}
        </text>
      </g>
      <rect
        v-for="cell in cells"
        :key="`${cell.r}-${cell.c}`"
        class="r-heatmap__cell"
        :class="{ 'is-active': active?.r === cell.r && active?.c === cell.c }"
        :x="cell.x"
        :y="cell.y"
        :width="Math.max(0, geometry.cellW)"
        :height="cellHeight"
        :rx="radius"
        :style="{ fill: cell.fill }"
        @pointerenter="((keyboard = false), (active = { r: cell.r, c: cell.c }))"
      />
    </svg>

    <ChartTooltip
      v-if="tooltip"
      :x="tooltip.x"
      :y="tooltip.y"
      :bounds="{ width, height: geometry.height }"
      :title="tooltip.title"
      :rows="tooltip.rows"
      placement="top"
    />

    <div v-if="legend" class="r-heatmap__legend" aria-hidden="true">
      <span>Less</span>
      <span v-for="t in legendSteps" :key="t" class="r-heatmap__swatch" :style="{ background: mix(lo + t * (hi - lo)) }" />
      <span>More</span>
    </div>

    <div class="r-sr-only">
      <table>
        <caption>{{ label }}</caption>
        <thead>
          <tr>
            <td></td>
            <th v-for="col in cols" :key="col" scope="col">{{ col }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, r) in rows" :key="row">
            <th scope="row">{{ row }}</th>
            <td v-for="(_, c) in cols" :key="c">{{ fmt(values[r]?.[c] ?? 0) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <span :id="`${uid}-hint`" hidden>Use the arrow keys to move between cells.</span>
    <span class="r-sr-only" aria-live="polite">{{ announce }}</span>
  </figure>
</template>

<style>
.r-heatmap__cell {
  transition:
    stroke-width var(--r-duration-fast) var(--r-ease-out),
    opacity var(--r-duration-fast) var(--r-ease-out);
  stroke: var(--r-text);
  stroke-width: 0;
}
.r-heatmap__cell.is-active {
  stroke-width: 1.5;
}

.r-heatmap__legend {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  margin-top: 10px;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-2xs);
}
.r-heatmap__legend span:first-child {
  margin-right: 4px;
}
.r-heatmap__legend span:last-child {
  margin-left: 4px;
}
.r-heatmap__swatch {
  width: 14px;
  height: 14px;
  border-radius: 4px;
}
</style>
