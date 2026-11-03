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
    /** Leave unset for the stepped cobalt scale (recommended). A colour switches to a continuous
     *  mix from the track to that colour. */
    color?: string
    min?: number
    max?: number
    /** Classes on the stepped scale, 3–8. Past 7, neighbouring classes blur. */
    steps?: number
    cellHeight?: number
    gap?: number
    /** Kept for 0.1 compatibility; cells are square-cornered. */
    radius?: number
    legend?: boolean
    /** Print each value inside its cell (matrices, migration tables). Needs cells wide enough. */
    showValues?: boolean
    format?: (value: number) => string
    label: string
  }>(),
  { steps: 6, cellHeight: 24, gap: 2, radius: 0, legend: true },
)

const root = ref<HTMLElement | null>(null)
const { width: measured } = useElementSize(root)
const width = chartWidth(measured)
const uid = useId()

const fmt = (v: number) => (props.format ? props.format(v) : formatNumber(v))
const flat = computed(() => props.values.flat())
const lo = computed(() => props.min ?? Math.min(...flat.value))
const hi = computed(() => props.max ?? Math.max(...flat.value))

// The label gutter fits the longest row label (Geist Mono 10px ≈ 6.2px a character).
const M = computed(() => ({
  top: 2,
  right: 0,
  bottom: 22,
  left: Math.min(180, Math.max(36, Math.max(0, ...props.rows.map((r) => r.length)) * 6.2 + 14)),
}))

const geometry = computed(() => {
  const plotW = Math.max(1, width.value - M.value.left - M.value.right)
  const nCols = Math.max(1, props.cols.length)
  const cellW = (plotW - props.gap * (nCols - 1)) / nCols
  const height = M.value.top + props.rows.length * (props.cellHeight + props.gap) - props.gap + M.value.bottom
  const colEvery = Math.max(1, Math.ceil(26 / Math.max(1, cellW + props.gap)))
  return { cellW, height, colEvery }
})

// Stepped scale: n classes spread over the cobalt steps; --r-seq-0 is reserved for zero.
// Step 5 (cobalt-500) is skipped: neither black nor white text reaches 4.5:1 on it, and cells
// can carry values. Light steps take ink text, dark steps take inverse text, in both themes.
const SEQ_STEPS = [1, 2, 3, 4, 6, 7, 8]
const stepCount = computed(() => Math.min(7, Math.max(3, props.steps)))
const stepIndexes = computed(() =>
  Array.from({ length: stepCount.value }, (_, i) => SEQ_STEPS[Math.round((i * (SEQ_STEPS.length - 1)) / (stepCount.value - 1))]),
)
const stepTokens = computed(() => stepIndexes.value.map((k) => `var(--r-seq-${k})`))
function bucket(value: number) {
  const t = hi.value === lo.value ? 1 : (value - lo.value) / (hi.value - lo.value)
  return Math.min(stepCount.value - 1, Math.max(0, Math.floor(t * stepCount.value)))
}
function mix(value: number) {
  if (props.color) {
    const t = hi.value === lo.value ? 1 : (value - lo.value) / (hi.value - lo.value)
    return `color-mix(in srgb, ${props.color} ${Math.round(10 + t * 90)}%, var(--r-chart-track))`
  }
  if (value === 0 && lo.value >= 0) return 'var(--r-seq-0)'
  return stepTokens.value[bucket(value)]
}
function textOn(value: number) {
  if (props.color) {
    const t = hi.value === lo.value ? 1 : (value - lo.value) / (hi.value - lo.value)
    return t >= 0.55 ? 'var(--r-text-inverse)' : 'var(--r-text)'
  }
  if (value === 0 && lo.value >= 0) return 'var(--r-text-tertiary)'
  return stepIndexes.value[bucket(value)] >= 6 ? 'var(--r-text-inverse)' : 'var(--r-text)'
}

const legendBins = computed(() =>
  props.color
    ? [0, 0.25, 0.5, 0.75, 1].map((t) => mix(lo.value + t * (hi.value - lo.value)))
    : stepTokens.value,
)

const cells = computed(() =>
  props.rows.flatMap((_, r) =>
    props.cols.map((_, c) => {
      const value = props.values[r]?.[c] ?? 0
      return {
        r,
        c,
        value,
        x: M.value.left + c * (geometry.value.cellW + props.gap),
        y: M.value.top + r * (props.cellHeight + props.gap),
        fill: mix(value),
        ink: textOn(value),
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
    rows: [{ label: 'Value', value: fmt(cell.value), color: cell.fill, kind: 'rect' as const }],
  }
})

const announce = computed(() => (keyboard.value && tooltip.value ? `${tooltip.value.title}: ${tooltip.value.rows[0].value}` : ''))

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
          :x="M.left - 8"
          :y="M.top + r * (cellHeight + gap) + cellHeight / 2"
          dy="0.32em"
          text-anchor="end"
        >
          {{ row }}
        </text>
        <text
          v-for="(col, c) in cols"
          v-show="c % geometry.colEvery === 0"
          :key="`c${c}`"
          :x="M.left + c * (geometry.cellW + gap) + geometry.cellW / 2"
          :y="geometry.height - 6"
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
        :style="{ fill: cell.fill }"
        @pointerenter="((keyboard = false), (active = { r: cell.r, c: cell.c }))"
      />
      <g v-if="showValues" class="r-heatmap__values" aria-hidden="true">
        <text
          v-for="cell in cells"
          :key="`v${cell.r}-${cell.c}`"
          :x="cell.x + geometry.cellW / 2"
          :y="cell.y + cellHeight / 2"
          dy="0.34em"
          text-anchor="middle"
          :style="{ fill: cell.ink }"
        >
          {{ fmt(cell.value) }}
        </text>
      </g>
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
      <span>{{ fmt(lo) }}</span>
      <span class="r-heatmap__scale">
        <span v-for="(bin, i) in legendBins" :key="i" class="r-heatmap__swatch" :style="{ background: bin }" />
      </span>
      <span>{{ fmt(hi) }}</span>
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
  stroke: var(--r-chart-ink);
  stroke-width: 0;
  shape-rendering: crispEdges;
}

.r-heatmap__cell.is-active {
  stroke-width: 2;
}

.r-heatmap__legend {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 10px;
  color: var(--r-chart-label);
  font-family: var(--r-font-mono);
  font-size: 10px;
  font-variant-numeric: tabular-nums;
}

.r-heatmap__scale {
  display: flex;
  gap: 2px;
}

.r-heatmap__swatch {
  width: 18px;
  height: 8px;
}

.r-heatmap__values text {
  font-family: var(--r-font-mono);
  font-size: 10px;
  font-weight: var(--r-weight-semibold);
  font-variant-numeric: tabular-nums;
  pointer-events: none;
}
</style>
