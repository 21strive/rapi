<script setup lang="ts">
/**
 * Two points, one slope: every item from the first period to the second, one straight line each.
 * Pick an item by its label or its line; it turns cobalt and shows both values, the rest stay
 * context grey. Steep reads as fast, crossing lines read as a change of order.
 */
import { computed, ref } from 'vue'
import { RTrend, useElementSize } from '@/design-system'
import { change, crisp, fmt, focusItem, linear, spread, stepKeys, type Fmt } from './shared'

interface Item {
  name: string
  /** Short label at the end of the line: "NTT", "CGK". */
  code: string
  a: number
  b: number
}

const props = withDefaults(
  defineProps<{
    label: string
    /** The two periods: "2022", "2026". */
    from: string
    to: string
    items: Item[]
    format?: Fmt
    /** How the change is told: percentage points, percent, or the plain difference. */
    change?: 'pp' | 'pct' | 'abs'
    /** Lower is better: a drop reads as good. */
    invert?: boolean
    initial?: number
  }>(),
  { format: () => ({}), change: 'pct', initial: 0 },
)

const sel = ref(props.initial)
const plot = ref<HTMLElement | null>(null)
const { width, height } = useElementSize(plot)

const item = computed(() => props.items[sel.value])
const trend = computed(() => {
  const it = item.value
  if (props.change === 'pp' || props.change === 'abs') return it.b - it.a
  return change(it.a, it.b)
})
const suffix = computed(() => (props.change === 'pp' ? ' pp' : props.change === 'abs' ? '' : '%'))

const TOP = 8
const BOTTOM = 18
const geo = computed(() => {
  const W = Math.max(60, width.value)
  const H = Math.max(40, height.value)
  const labelW = Math.max(...props.items.map((it) => (it.code.length + fmt(it.b, props.format).length + 1) * 6.3)) + 10
  const leftW = Math.max(...props.items.map((it) => fmt(it.a, props.format).length * 6.3)) + 10
  const x0 = leftW
  const x1 = Math.max(x0 + 24, W - labelW)
  const all = props.items.flatMap((it) => [it.a, it.b])
  const lo = Math.min(...all)
  const hi = Math.max(...all)
  const pad = (hi - lo) * 0.08 || 1
  const y = linear(lo - pad, hi + pad, H - BOTTOM, TOP)
  const ends = spread(
    props.items.map((it) => y(it.b)),
    13,
    TOP + 4,
    H - BOTTOM - 2,
  )
  return { W, H, x0, x1, y, ends }
})

const order = computed(() => props.items.map((_, i) => i).sort((a, b) => (a === sel.value ? 1 : b === sel.value ? -1 : 0)))

function onKey(event: KeyboardEvent) {
  const next = stepKeys(event, sel.value, props.items.length)
  if (next === null) return
  sel.value = next
  focusItem(plot.value, next)
}
</script>

<template>
  <div class="mk cmp r-chart slope">
    <span class="r-label mk-truncate">{{ label }}</span>
    <div class="slope__readout">
      <span class="slope__name mk-truncate">{{ item.name }}</span>
      <RTrend :value="trend" :invert="invert" :suffix="suffix" size="sm" icon />
    </div>
    <div
      ref="plot"
      class="slope__plot mk-grow"
      role="radiogroup"
      :aria-label="`${label}, ${from} to ${to}`"
      @keydown="onKey"
    >
      <svg v-if="width > 0" :width="geo.W" :height="geo.H" aria-hidden="true">
        <line class="r-chart__axis-line" :x1="crisp(geo.x0)" :x2="crisp(geo.x0)" :y1="TOP" :y2="geo.H - BOTTOM" />
        <line class="r-chart__axis-line" :x1="crisp(geo.x1)" :x2="crisp(geo.x1)" :y1="TOP" :y2="geo.H - BOTTOM" />
        <g class="r-chart__axis">
          <text :x="geo.x0" :y="geo.H - 4" text-anchor="middle">{{ from }}</text>
          <text :x="geo.x1" :y="geo.H - 4" text-anchor="middle">{{ to }}</text>
        </g>
        <g v-for="i in order" :key="items[i].code" class="slope__item" :class="{ 'is-on': i === sel }">
          <line class="slope__hit" :x1="geo.x0" :y1="geo.y(items[i].a)" :x2="geo.x1" :y2="geo.y(items[i].b)" @click="sel = i" />
          <line class="slope__line" :x1="geo.x0" :y1="geo.y(items[i].a)" :x2="geo.x1" :y2="geo.y(items[i].b)" />
          <template v-if="i === sel">
            <circle class="r-chart__point slope__point" :cx="geo.x0" :cy="geo.y(items[i].a)" r="4" />
            <circle class="r-chart__point slope__point" :cx="geo.x1" :cy="geo.y(items[i].b)" r="4" />
            <text class="r-chart__value" :x="geo.x0 - 7" :y="geo.y(items[i].a)" dy="0.34em" text-anchor="end">
              {{ fmt(items[i].a, format) }}
            </text>
          </template>
        </g>
      </svg>
      <button
        v-for="(it, i) in items"
        :key="it.code"
        type="button"
        role="radio"
        class="slope__key mk-reset"
        :class="{ 'is-on': i === sel }"
        :style="{ left: `${geo.x1 + 7}px`, top: `${geo.ends[i] - 7}px` }"
        :aria-checked="i === sel"
        :tabindex="i === sel ? 0 : -1"
        :aria-label="`${it.name}: ${fmt(it.a, format)} in ${from}, ${fmt(it.b, format)} in ${to}`"
        @click="sel = i"
      >
        <span class="slope__code">{{ it.code }}</span>
        <span class="slope__value">{{ fmt(it.b, format) }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.slope {
  gap: 4px;
}

.slope__readout {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  min-width: 0;
}

.slope__name {
  color: var(--r-text);
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-snug);
}

.slope__plot {
  position: relative;
  min-height: 60px;
}

.slope__plot svg {
  position: absolute;
  inset: 0;
}

.slope__line {
  stroke: var(--r-chart-context);
  stroke-width: 2;
  transition: stroke var(--r-duration-fast) var(--r-ease-out);
}

.slope__item:hover .slope__line {
  stroke: color-mix(in srgb, var(--r-chart-1) 45%, var(--r-chart-context));
}

.slope__item.is-on .slope__line {
  stroke: var(--r-chart-1);
}

.slope__hit {
  stroke: transparent;
  stroke-width: 12;
  cursor: pointer;
}

.slope__point {
  fill: var(--r-chart-1);
}

.slope__key {
  position: absolute;
  display: flex;
  gap: 5px;
  height: 14px;
  padding: 0 2px;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-variant-numeric: tabular-nums;
  line-height: 14px;
  white-space: nowrap;
  cursor: pointer;
}

.slope__code {
  color: var(--r-text-secondary);
  font-weight: var(--r-weight-semibold);
  letter-spacing: 0.04em;
}

.slope__value {
  color: var(--r-text-tertiary);
}

.slope__key:hover .slope__code,
.slope__key.is-on .slope__code,
.slope__key.is-on .slope__value {
  color: var(--r-text);
}

.slope__key:focus-visible {
  outline-offset: 0;
}
</style>
