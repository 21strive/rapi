<script setup lang="ts">
/**
 * A month in squares: one square a day on a Monday-first calendar, darker for more, in the cobalt
 * steps. Zero has its own grey, days not yet measured are hatched, today has an orange edge. Two
 * or three months side by side compare a month with the ones before it. Point at a day or walk
 * the days with the arrow keys (up and down move a week).
 */
import { computed, ref } from 'vue'
import { useElementSize } from '@/design-system'
import { weekday } from '../../kit'
import { fmt, type Fmt } from './shared'

interface Month {
  /** "Nov 2026". */
  name: string
  /** First day, "2026-11-01". */
  start: string
  /** One per day; null = no data yet. */
  values: (number | null)[]
}

const props = withDefaults(
  defineProps<{
    label: string
    unit?: string
    months: Month[]
    format?: Fmt
    /** Top of the scale; defaults to the largest day. */
    max?: number
    /** "2026-11-12": outlined in orange. */
    today?: string
    /** The step legend under the months. */
    legend?: boolean
    /** Months one above the other, for tall tiles. */
    stack?: boolean
  }>(),
  { format: () => ({}) },
)

const STEPS = ['var(--r-seq-1)', 'var(--r-seq-3)', 'var(--r-seq-4)', 'var(--r-seq-6)', 'var(--r-seq-8)']
const DOW = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

const parse = (iso: string) => new Date(`${iso}T12:00:00+07:00`)
const dayMonth = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'Asia/Jakarta' })

const grids = computed(() => {
  let idx = 0
  return props.months.map((m) => {
    const first = parse(m.start)
    const offset = (first.getUTCDay() + 6) % 7
    const rows = Math.ceil((offset + m.values.length) / 7)
    const days = m.values.map((value, d) => {
      const date = new Date(first.getTime() + d * 86400000)
      return { idx: idx++, d: d + 1, date, value, iso: date.toISOString().slice(0, 10) }
    })
    return { name: m.name, offset, rows, days }
  })
})

const days = computed(() => grids.value.flatMap((g) => g.days))
const top = computed(() => props.max ?? Math.max(1e-9, ...days.value.map((d) => d.value ?? 0)))

function fill(v: number | null) {
  if (v == null) return ''
  if (v <= 0) return 'var(--r-chart-track)'
  return STEPS[Math.min(STEPS.length - 1, Math.floor((v / top.value) * STEPS.length))]
}

const todayIdx = computed(() => days.value.findIndex((d) => d.iso === props.today))
const lastIdx = computed(() => {
  for (let i = days.value.length - 1; i >= 0; i--) if (days.value[i].value != null) return i
  return 0
})
const active = ref(todayIdx.value >= 0 && days.value[todayIdx.value]?.value != null ? todayIdx.value : lastIdx.value)
const hover = ref<number | null>(null)
const shown = computed(() => days.value[hover.value ?? active.value])

const read = (d: { date: Date; value: number | null }) =>
  `${weekday(d.date)}, ${d.value == null ? 'no data yet' : `${fmt(d.value, props.format)}${props.unit ? ` ${props.unit}` : ''}`}`

const box = ref<HTMLElement | null>(null)
const { width, height } = useElementSize(box)
const captions = computed(() => props.months.length > 1)
const cell = computed(() => {
  const n = props.months.length
  const fixed = (captions.value ? 16 : 0) + 14
  if (props.stack) {
    const rows = grids.value.reduce((sum, g) => sum + g.rows, 0)
    const gaps = grids.value.reduce((sum, g) => sum + (g.rows - 1) * 2, 0)
    const byW = (width.value - 6 * 2) / 7
    const byH = (height.value - n * fixed - 14 * (n - 1) - gaps) / rows
    return Math.max(6, Math.floor(Math.min(byW, byH, 26)))
  }
  const mw = (width.value - 14 * (n - 1)) / n
  const rows = Math.max(...grids.value.map((g) => g.rows))
  const byW = (mw - 6 * 2) / 7
  const byH = (height.value - fixed - (rows - 1) * 2) / rows
  return Math.max(6, Math.floor(Math.min(byW, byH, 26)))
})

function onKey(event: KeyboardEvent) {
  const moves: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 7, ArrowUp: -7 }
  let next: number | null = null
  if (event.key in moves) next = active.value + moves[event.key]
  else if (event.key === 'Home') next = 0
  else if (event.key === 'End') next = days.value.length - 1
  if (next === null) return
  event.preventDefault()
  hover.value = null
  active.value = Math.min(days.value.length - 1, Math.max(0, next))
}
</script>

<template>
  <div class="mk cmp r-chart squares">
    <div class="mk-row mk-between">
      <span class="r-label mk-truncate">{{ label }}</span>
      <span class="squares__read">
        <span class="squares__day">{{ dayMonth.format(shown.date) }}</span>
        <span class="squares__value">{{ shown.value == null ? '—' : fmt(shown.value, format) }}</span>
        <span v-if="unit && shown.value != null" class="mk-unit">{{ unit }}</span>
      </span>
    </div>
    <div
      ref="box"
      class="squares__months mk-grow"
      :class="{ 'is-stacked': stack }"
      role="slider"
      tabindex="0"
      :aria-label="`${label}, one day at a time`"
      aria-orientation="horizontal"
      :aria-valuemin="1"
      :aria-valuemax="days.length"
      :aria-valuenow="active + 1"
      :aria-valuetext="read(days[active])"
      :style="{ '--cell': `${cell}px` }"
      @keydown="onKey"
      @pointerleave="hover = null"
    >
      <div v-for="g in grids" :key="g.name" class="squares__month">
        <span v-if="captions" class="squares__caption">{{ g.name }}</span>
        <div class="squares__grid">
          <span v-for="(w, k) in DOW" :key="`h${k}`" class="squares__dow" aria-hidden="true">{{ w }}</span>
          <span
            v-for="d in g.days"
            :key="d.idx"
            class="squares__cell"
            :class="{
              'r-hatch': d.value == null,
              'is-today': d.iso === today,
              'is-active': d.idx === (hover ?? active),
            }"
            :style="{ background: fill(d.value) || undefined, gridColumnStart: d.d === 1 ? g.offset + 1 : undefined }"
            @pointerenter="hover = d.idx"
            @click="active = d.idx"
          />
        </div>
      </div>
    </div>
    <div v-if="legend" class="squares__legend" aria-hidden="true">
      <span>0</span>
      <i style="background: var(--r-chart-track)" />
      <i v-for="s in STEPS" :key="s" :style="{ background: s }" />
      <span>{{ fmt(top, format) }}{{ unit ? ` ${unit}` : '' }}</span>
      <template v-if="days.some((d) => d.value == null)">
        <i class="r-hatch squares__nodata" />
        <span>No data</span>
      </template>
    </div>
  </div>
</template>

<style scoped>
.squares {
  gap: 6px;
}

.squares__read {
  display: inline-flex;
  flex: none;
  align-items: baseline;
  gap: 4px;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.squares__day {
  color: var(--r-text-tertiary);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.squares__value {
  color: var(--r-text);
  font-size: var(--r-text-xs);
  font-weight: var(--r-weight-semibold);
}

.squares__months {
  display: flex;
  gap: 14px;
  min-height: 0;
  outline: none;
}

.squares__months:focus-visible .squares__cell.is-active {
  outline-color: var(--r-focus);
}

.squares__months.is-stacked {
  flex-direction: column;
}

.squares__month {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.squares__caption {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: 0.06em;
  line-height: 12px;
  text-transform: uppercase;
}

.squares__grid {
  display: grid;
  grid-template-columns: repeat(7, var(--cell));
  grid-template-rows: 12px;
  grid-auto-rows: var(--cell);
  gap: 2px;
}

.squares__dow {
  color: var(--r-chart-label);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  line-height: 12px;
  text-align: center;
}

.squares__cell {
  background: transparent;
  cursor: pointer;
  outline: 2px solid transparent;
  outline-offset: 1px;
}

.squares__cell.r-hatch {
  box-shadow: inset 0 0 0 1px var(--r-border);
  cursor: default;
}

.squares__cell.is-today {
  box-shadow: inset 0 0 0 2px var(--r-chart-now);
}

.squares__cell.is-active {
  outline-color: var(--r-chart-ink);
}

.squares__legend {
  display: flex;
  align-items: center;
  gap: 2px;
  height: 12px;
  color: var(--r-chart-label);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-variant-numeric: tabular-nums;
}

.squares__legend span {
  margin: 0 4px;
}

.squares__legend span:first-child {
  margin-left: 0;
}

.squares__legend i {
  width: 10px;
  height: 10px;
}

.squares__legend .squares__nodata {
  margin-left: 8px;
  box-shadow: inset 0 0 0 1px var(--r-border);
}
</style>
