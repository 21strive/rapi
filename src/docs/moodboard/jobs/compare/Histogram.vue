<script setup lang="ts">
/**
 * How it spreads: counts per bin as square columns with 2px gaps, the median and the 95th
 * percentile as dashed lines, and the other period as an ink outline over the same bins, so a
 * shift of the whole shape reads at once. Switch which period is filled; point at a bin or walk
 * the bins with the arrow keys to read it.
 */
import { computed, ref } from 'vue'
import { useElementSize } from '@/design-system'
import { crisp, fmt, linear, type Fmt } from './shared'
import Keys from './Keys.vue'

interface Series {
  key: string
  label: string
  counts: number[]
  p50?: number
  p95?: number
}

const props = withDefaults(
  defineProps<{
    label: string
    unit?: string
    /** What is counted: "requests", "trips". */
    noun: string
    /** Bin edges, evenly spaced, one more than the counts. */
    edges: number[]
    series: Series[]
    format?: Fmt
    /** `rows` lays the bins out top to bottom with names, for tall tiles. */
    orientation?: 'columns' | 'rows'
    /** Names of the bins in the rows layout: "0–9", "10–19". */
    binNames?: string[]
  }>(),
  { format: () => ({}), orientation: 'columns' },
)

const key = ref(props.series[props.series.length - 1].key)
const current = computed(() => props.series.find((s) => s.key === key.value) ?? props.series[0])
const other = computed(() => props.series.find((s) => s.key !== key.value) ?? null)
const options = computed(() => props.series.map((s) => ({ value: s.key, label: s.label })))

const n = computed(() => props.edges.length - 1)
const top = computed(() => Math.max(1, ...props.series.flatMap((s) => s.counts)))
const totalOf = (s: Series) => s.counts.reduce((a, b) => a + b, 0)

const cursor = ref<number | null>(null)
const hover = ref<number | null>(null)
const shown = computed(() => hover.value ?? cursor.value)

const binName = (i: number) =>
  props.binNames?.[i] ?? `${fmt(props.edges[i], props.format)}–${fmt(props.edges[i + 1], props.format)}`
const binText = (i: number) => {
  const c = current.value.counts[i]
  const share = (c / Math.max(1, totalOf(current.value))) * 100
  return `${binName(i)}${props.unit ? ` ${props.unit}` : ''}: ${fmt(c)} ${props.noun}, ${fmt(share, { kind: 'pct', decimals: 1 })}`
}

const plot = ref<HTMLElement | null>(null)
const { width, height } = useElementSize(plot)
const PAD = 2
const TOP = 16
const BOTTOM = 16

const geo = computed(() => {
  const W = Math.max(60, width.value)
  const H = Math.max(40, height.value)
  const band = (W - PAD * 2) / n.value
  const x = linear(props.edges[0], props.edges[n.value], PAD, W - PAD)
  const y = linear(0, top.value, H - BOTTOM, TOP)
  const bars = current.value.counts.map((c, i) => ({ x: PAD + i * band + 1, w: Math.max(1, band - 2), y: y(c), h: H - BOTTOM - y(c) }))
  let outline = ''
  if (other.value) {
    const o = other.value.counts
    outline = `M${PAD},${H - BOTTOM}`
    o.forEach((c, i) => {
      outline += `V${crisp(y(c))}H${PAD + (i + 1) * band}`
    })
    outline += `V${H - BOTTOM}`
  }
  const every = Math.max(1, Math.ceil(44 / band))
  const ticks = props.edges.map((e, i) => ({ e, i, x: x(e) })).filter((t) => t.i % every === 0)
  return { W, H, band, x, y, bars, outline, ticks, base: H - BOTTOM }
})

const marks = computed(() =>
  [
    { id: 'P50', v: current.value.p50 },
    { id: 'P95', v: current.value.p95 },
  ].filter((m): m is { id: string; v: number } => m.v != null),
)

function onKey(event: KeyboardEvent) {
  const back = props.orientation === 'rows' ? 'ArrowUp' : 'ArrowLeft'
  const fwd = props.orientation === 'rows' ? 'ArrowDown' : 'ArrowRight'
  let next: number | null = null
  const at = cursor.value ?? -1
  if (event.key === fwd || event.key === (props.orientation === 'rows' ? 'ArrowRight' : 'ArrowUp')) next = at + 1
  else if (event.key === back || event.key === (props.orientation === 'rows' ? 'ArrowLeft' : 'ArrowDown')) next = at < 0 ? n.value - 1 : at - 1
  else if (event.key === 'Home') next = 0
  else if (event.key === 'End') next = n.value - 1
  else if (event.key === 'Escape') {
    cursor.value = null
    return
  }
  if (next === null) return
  event.preventDefault()
  hover.value = null
  cursor.value = Math.min(n.value - 1, Math.max(0, next))
}

function onMove(event: PointerEvent) {
  const box = (event.currentTarget as HTMLElement).getBoundingClientRect()
  if (props.orientation === 'rows') {
    const i = Math.floor(((event.clientY - box.top) / box.height) * n.value)
    hover.value = i >= 0 && i < n.value ? i : null
  } else {
    const i = Math.floor((event.clientX - box.left - PAD) / geo.value.band)
    hover.value = i >= 0 && i < n.value ? i : null
  }
}

const rowsMax = computed(() => top.value)
</script>

<template>
  <div class="mk cmp r-chart hist" :class="`hist--${orientation}`">
    <div class="mk-row mk-between">
      <span class="r-label mk-truncate">{{ label }}</span>
      <Keys v-if="series.length > 1" v-model="key" :options="options" :label="`${label}: period`" />
    </div>
    <p class="hist__read">
      <template v-if="shown != null">
        <span class="hist__strong">{{ binName(shown) }}{{ unit ? ` ${unit}` : '' }}</span>
        <span>{{ fmt(current.counts[shown]) }} {{ noun }}</span>
      </template>
      <template v-else>
        <span v-for="m in marks" :key="m.id">
          <span class="hist__tag">{{ m.id }}</span> {{ fmt(m.v, format) }}{{ unit ? ` ${unit}` : '' }}
        </span>
        <span v-if="!marks.length">{{ fmt(totalOf(current)) }} {{ noun }}</span>
      </template>
      <span v-if="other" class="hist__legend"><i />{{ other.label }}</span>
    </p>

    <div
      ref="plot"
      class="hist__plot mk-grow"
      role="slider"
      tabindex="0"
      :aria-label="`${label}, ${current.label}: one bin at a time`"
      :aria-orientation="orientation === 'rows' ? 'vertical' : 'horizontal'"
      :aria-valuemin="1"
      :aria-valuemax="n"
      :aria-valuenow="(cursor ?? 0) + 1"
      :aria-valuetext="cursor == null ? `${n} bins` : binText(cursor)"
      @keydown="onKey"
      @pointermove="onMove"
      @pointerleave="hover = null"
      @click="cursor = hover"
    >
      <svg v-if="orientation === 'columns' && width > 0" :width="geo.W" :height="geo.H" aria-hidden="true">
        <rect
          v-for="(b, i) in geo.bars"
          :key="i"
          class="hist__bar"
          :class="{ 'is-dim': shown != null && shown !== i }"
          :x="b.x"
          :y="b.y"
          :width="b.w"
          :height="Math.max(0, b.h)"
        />
        <path v-if="geo.outline" class="hist__other" :d="geo.outline" />
        <line class="r-chart__baseline" :x1="0" :x2="geo.W" :y1="crisp(geo.base)" :y2="crisp(geo.base)" />
        <g class="r-chart__axis">
          <template v-for="(t, k) in geo.ticks" :key="t.i">
            <line class="r-chart__tick" :x1="crisp(t.x)" :x2="crisp(t.x)" :y1="geo.base" :y2="geo.base + 4" />
            <text :x="t.x" :y="geo.H - 3" :text-anchor="k === 0 ? 'start' : t.i === edges.length - 1 ? 'end' : 'middle'">
              {{ fmt(t.e, format) }}
            </text>
          </template>
        </g>
        <g v-for="m in marks" :key="m.id" class="r-chart__ref r-chart__ref--target">
          <line :x1="crisp(geo.x(m.v))" :x2="crisp(geo.x(m.v))" :y1="TOP - 2" :y2="geo.base" />
          <text :x="geo.x(m.v) + 3" :y="TOP - 5">{{ m.id }}</text>
        </g>
      </svg>

      <ol v-else-if="orientation === 'rows'" class="hist__rows" aria-hidden="true">
        <li v-for="(c, i) in current.counts" :key="i" :class="{ 'is-dim': shown != null && shown !== i }">
          <span class="hist__bin">{{ binName(i) }}</span>
          <span class="hist__track">
            <span class="hist__fill" :style="{ width: `${(c / rowsMax) * 100}%` }" />
            <span
              v-if="other"
              class="hist__tick"
              :style="{ left: `calc(${(other.counts[i] / rowsMax) * 100}% - 1px)` }"
            />
          </span>
          <span class="hist__count">{{ fmt(c) }}</span>
        </li>
      </ol>
    </div>
  </div>
</template>

<style scoped>
.hist {
  gap: 4px;
}

.hist__read {
  display: flex;
  align-items: baseline;
  gap: 10px;
  min-width: 0;
  height: 14px;
  overflow: hidden;
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.hist__strong {
  color: var(--r-text);
  font-weight: var(--r-weight-semibold);
}

.hist__tag {
  color: var(--r-text-tertiary);
  font-weight: var(--r-weight-semibold);
  letter-spacing: 0.06em;
}

.hist__legend {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-left: auto;
  color: var(--r-text-tertiary);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.hist__legend i {
  width: 10px;
  height: 8px;
  border: 1px solid var(--r-chart-ink);
  border-bottom: 0;
}

.hist--rows .hist__legend i {
  width: 2px;
  height: 10px;
  border: 0;
  background: var(--r-chart-ink);
}

.hist__plot {
  position: relative;
  min-height: 48px;
  cursor: crosshair;
}

.hist__plot:focus-visible {
  outline: 2px solid var(--r-focus);
  outline-offset: 2px;
}

.hist__plot svg {
  position: absolute;
  inset: 0;
}

.hist__bar {
  fill: var(--r-chart-1);
  shape-rendering: crispEdges;
  transition:
    opacity var(--r-duration-fast) var(--r-ease-out),
    y var(--r-duration-base) var(--r-ease-out),
    height var(--r-duration-base) var(--r-ease-out);
}

.hist__bar.is-dim {
  opacity: 0.45;
}

.hist__other {
  fill: none;
  stroke: var(--r-chart-ink);
  stroke-width: 1;
  shape-rendering: crispEdges;
}

.hist__rows {
  display: flex;
  flex-direction: column;
  height: 100%;
  margin: 0;
  padding: 0;
  list-style: none;
}

.hist__rows li {
  display: grid;
  flex: 1 1 0;
  grid-template-columns: 38px 1fr 34px;
  align-items: center;
  gap: 6px;
  min-height: 0;
  transition: opacity var(--r-duration-fast) var(--r-ease-out);
}

.hist__rows li.is-dim {
  opacity: 0.45;
}

.hist__bin,
.hist__count {
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.hist__count {
  color: var(--r-text);
  text-align: right;
}

.hist__track {
  position: relative;
  height: min(14px, 70%);
  border-left: 1px solid var(--r-chart-axis);
}

.hist__fill {
  position: absolute;
  inset: 0 auto 0 0;
  background: var(--r-chart-1);
  transition: width var(--r-duration-base) var(--r-ease-out);
}

.hist__tick {
  position: absolute;
  top: -2px;
  bottom: -2px;
  width: 2px;
  background: var(--r-chart-ink);
  transition: left var(--r-duration-base) var(--r-ease-out);
}
</style>
