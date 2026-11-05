<script setup lang="ts">
/**
 * Where it falls: every item as a dot on one axis, stacked where they crowd, with the dashed
 * references a reader compares against (median, guideline, target). One item is "yours" in
 * cobalt; the cursor reads any other with its rank. Arrow keys walk the dots in order of value.
 */
import { computed, ref } from 'vue'
import { useElementSize } from '@/design-system'
import { crisp, fmt, linear, niceTicks, ordinal, type Fmt } from './shared'

interface Item {
  name: string
  value: number
}

interface Reference {
  value: number
  label: string
  kind?: 'target' | 'average' | 'threshold'
}

const props = withDefaults(
  defineProps<{
    label: string
    unit?: string
    items: Item[]
    /** The item this tile is about, drawn in cobalt. */
    mine: string
    references?: Reference[]
    format?: Fmt
    /** Format of the axis ticks; defaults to `format`. */
    axis?: Fmt
    /** Lower is better: the lowest value ranks first. */
    invert?: boolean
    /** Show the rank in the readout; off where order means nothing on its own (loudness). */
    ranked?: boolean
    /** Read the cursor against a reference instead: "+4.2 LU over target". */
    against?: { value: number; label: string; unit?: string }
  }>(),
  { references: () => [], format: () => ({}), ranked: true },
)

const sorted = computed(() => [...props.items].sort((a, b) => a.value - b.value))
const rankOf = (name: string) => {
  const order = [...props.items].sort((a, b) => (props.invert ? a.value - b.value : b.value - a.value))
  return order.findIndex((it) => it.name === name) + 1
}

const cursor = ref(Math.max(0, sorted.value.findIndex((it) => it.name === props.mine)))
const hover = ref<number | null>(null)
const shown = computed(() => sorted.value[hover.value ?? cursor.value])

const plot = ref<HTMLElement | null>(null)
const { width, height } = useElementSize(plot)

const TOP = 18
const BOTTOM = 18
const PAD = 8
const STEP = 10

const geo = computed(() => {
  const W = Math.max(80, width.value)
  const H = Math.max(40, height.value)
  const all = [...props.items.map((it) => it.value), ...props.references.map((r) => r.value)]
  const ticks = niceTicks(Math.min(...all), Math.max(...all), Math.max(3, Math.floor(W / 90)))
  const x = linear(ticks.min, ticks.max, PAD, W - PAD)
  const base = H - BOTTOM
  const lanesMax = Math.max(1, Math.floor((base - TOP) / STEP))
  const lanes: number[] = []
  const dots = sorted.value.map((it) => {
    const cx = x(it.value)
    let lane = lanes.findIndex((last) => cx - last >= STEP)
    if (lane < 0) lane = lanes.length < lanesMax ? lanes.length : lanes.indexOf(Math.min(...lanes))
    lanes[lane] = cx
    return { ...it, cx, cy: base - 7 - lane * STEP }
  })
  return { W, H, x, base, ticks: ticks.ticks, dots }
})

function onKey(event: KeyboardEvent) {
  const n = sorted.value.length
  let next: number | null = null
  if (event.key === 'ArrowRight' || event.key === 'ArrowUp') next = cursor.value + 1
  else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') next = cursor.value - 1
  else if (event.key === 'Home') next = 0
  else if (event.key === 'End') next = n - 1
  if (next === null) return
  event.preventDefault()
  hover.value = null
  cursor.value = Math.min(n - 1, Math.max(0, next))
}

function nearest(event: MouseEvent) {
  const box = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const px = event.clientX - box.left
  const py = event.clientY - box.top
  let best = -1
  let bestD = 18 * 18
  geo.value.dots.forEach((d, i) => {
    const dist = (d.cx - px) ** 2 + (d.cy - py) ** 2
    if (dist < bestD) {
      bestD = dist
      best = i
    }
  })
  return best
}

function onMove(event: PointerEvent) {
  const i = nearest(event)
  hover.value = i >= 0 ? i : null
}

function onClick(event: MouseEvent) {
  const i = nearest(event)
  if (i >= 0) cursor.value = i
}

const valueText = (it: Item) => `${fmt(it.value, props.format)}${props.unit ? ` ${props.unit}` : ''}`
function againstText(it: Item) {
  const a = props.against
  if (!a) return ''
  const diff = it.value - a.value
  const size = fmt(Math.abs(diff), props.format)
  if (Math.abs(diff) < 0.05) return `on ${a.label}`
  return `${diff > 0 ? '+' : '−'}${size}${a.unit ? ` ${a.unit}` : ''} ${diff > 0 ? 'over' : 'under'} ${a.label}`
}
</script>

<template>
  <div class="mk cmp r-chart strip">
    <span class="r-label mk-truncate">{{ label }}</span>
    <div class="mk-row">
      <span class="strip__read">
        <span class="strip__name" :class="{ 'is-mine': shown.name === mine }">{{ shown.name }}</span>
        <span class="strip__value">{{ valueText(shown) }}</span>
        <span v-if="ranked" class="strip__rank">{{ ordinal(rankOf(shown.name)) }} of {{ items.length }}</span>
        <span v-if="against" class="strip__rank">{{ againstText(shown) }}</span>
      </span>
    </div>
    <div
      ref="plot"
      class="strip__plot mk-grow"
      role="slider"
      tabindex="0"
      :aria-label="`${label}: ${items.length} items, read one at a time`"
      :aria-valuemin="1"
      :aria-valuemax="items.length"
      :aria-valuenow="cursor + 1"
      :aria-valuetext="`${sorted[cursor].name}, ${valueText(sorted[cursor])}, ${ranked ? `${ordinal(rankOf(sorted[cursor].name))} of ${items.length}` : againstText(sorted[cursor])}`"
      @keydown="onKey"
      @pointermove="onMove"
      @pointerleave="hover = null"
      @click="onClick"
    >
      <svg v-if="width > 0" :width="geo.W" :height="geo.H" aria-hidden="true">
        <g class="r-chart__grid">
          <line v-for="t in geo.ticks" :key="`g${t}`" :x1="crisp(geo.x(t))" :x2="crisp(geo.x(t))" :y1="TOP" :y2="geo.base" />
        </g>
        <line class="r-chart__baseline" :x1="PAD" :x2="geo.W - PAD" :y1="crisp(geo.base)" :y2="crisp(geo.base)" />
        <g class="r-chart__axis">
          <template v-for="(t, k) in geo.ticks" :key="`t${t}`">
            <line class="r-chart__tick" :x1="crisp(geo.x(t))" :x2="crisp(geo.x(t))" :y1="geo.base" :y2="geo.base + 4" />
            <text
              :x="geo.x(t)"
              :y="geo.H - 3"
              :text-anchor="k === 0 ? 'start' : k === geo.ticks.length - 1 ? 'end' : 'middle'"
            >
              {{ fmt(t, axis ?? format) }}
            </text>
          </template>
        </g>
        <g v-for="r in references" :key="r.label" class="r-chart__ref" :class="`r-chart__ref--${r.kind ?? 'average'}`">
          <line :x1="crisp(geo.x(r.value))" :x2="crisp(geo.x(r.value))" :y1="TOP - 4" :y2="geo.base" />
          <text :x="geo.x(r.value)" :y="TOP - 7" :text-anchor="geo.x(r.value) > geo.W - 60 ? 'end' : geo.x(r.value) < 60 ? 'start' : 'middle'">
            {{ r.label.toUpperCase() }} {{ fmt(r.value, format) }}
          </text>
        </g>
        <circle
          v-for="(d, i) in geo.dots"
          :key="d.name"
          class="r-chart__point strip__dot"
          :class="{ 'is-mine': d.name === mine, 'is-cursor': i === (hover ?? cursor) }"
          :cx="d.cx"
          :cy="d.cy"
          :r="d.name === mine || i === (hover ?? cursor) ? 5 : 4"
        />
      </svg>
    </div>
  </div>
</template>

<style scoped>
.strip {
  gap: 6px;
}

.strip__read {
  display: inline-flex;
  flex: 0 1 auto;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
}

.strip__name {
  overflow: hidden;
  color: var(--r-text);
  font-size: var(--r-text-xs);
  font-weight: var(--r-weight-semibold);
  text-overflow: ellipsis;
}

.strip__name.is-mine {
  color: var(--r-brand-text);
}

.strip__value,
.strip__rank {
  flex: none;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-variant-numeric: tabular-nums;
}

.strip__value {
  color: var(--r-text);
}

.strip__rank {
  color: var(--r-text-tertiary);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.strip__plot {
  position: relative;
  min-height: 48px;
  cursor: crosshair;
}

.strip__plot:focus-visible {
  outline: 2px solid var(--r-focus);
  outline-offset: 2px;
}

.strip__plot svg {
  position: absolute;
  inset: 0;
}

.strip__dot {
  fill: var(--r-chart-context);
  transition: fill var(--r-duration-fast) var(--r-ease-out);
}

.strip__dot.is-mine {
  fill: var(--r-chart-1);
}

.strip__dot.is-cursor:not(.is-mine) {
  fill: var(--r-chart-ink);
}
</style>
