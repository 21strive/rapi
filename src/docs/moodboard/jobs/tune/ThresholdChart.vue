<script setup lang="ts">
/**
 * A threshold dragged over real history: an alarm limit over last night's readings, a fraud
 * cut-off over a month of scores, a flood alert over a week of river levels, a reorder point
 * over a month of stock, a rate limit over live traffic. The count of what it would have done
 * updates as the line moves. Drag the line or its tag, or focus the tag and use the arrow keys
 * (Shift for ten steps, Home and End for the ends).
 */
import { computed, ref, useId, watch } from 'vue'
import { useElementSize } from '@/design-system'
import { seeded, useTick } from '../../kit'
import { capture, clamp, points, sliderKey, snapTo } from './shared'

type Kind = 'line' | 'histogram' | 'stock' | 'live'

interface Say {
  text: string
  word?: string
  tone?: 'success' | 'warning' | 'danger'
}

const props = withDefaults(
  defineProps<{
    kind: Kind
    label: string
    meta?: string
    /** Line values, histogram counts, daily demand (stock) or the opening window (live). */
    data: number[]
    /** A second, stacked series for the histogram (the cases the cut-off should catch). */
    data2?: number[]
    names?: [string, string]
    y: { min: number; max: number; ticks: number[]; format?: (v: number) => string }
    x: { ticks: { at: number; label: string }[] }
    limit: { value: number; min: number; max: number; step: number; label: string; format: (v: number) => string }
    /** The line fires when values go above it, or below it. */
    direction?: 'above' | 'below'
    /** Stock model: opening stock, order size, days from order to delivery. */
    stock?: { start: number; order: number; lead: number }
    /** Histogram: all cases of each series, including those left of the plotted range. */
    totals?: [number, number]
    say: (s: Record<string, number>) => Say
  }>(),
  { direction: 'above' },
)

const uid = useId()
const t = ref(props.limit.value)
const plot = ref<HTMLElement | null>(null)
const { width, height } = useElementSize(plot)
/** Room for the longest y label: about 6.2 px a character of 10 px mono, plus the gap. */
const PAD = computed(() => ({ l: Math.max(26, Math.max(...props.y.ticks.map((v) => fmtY(v).length)) * 6.2 + 10), r: 8, t: 10, b: 18 }))
const W = computed(() => Math.max(120, width.value))
const H = computed(() => Math.max(60, height.value))
const iw = computed(() => W.value - PAD.value.l - PAD.value.r)
const ih = computed(() => H.value - PAD.value.t - PAD.value.b)
const vertical = computed(() => props.kind === 'histogram')

/* ── Live data: a window that scrolls one sample per tick while on screen ──── */
const series = ref([...props.data])
const tick = props.kind === 'live' ? useTick(600) : ref(0)
const rnd = seeded(`${props.label}-live`)
let burst = 0
watch(tick, () => {
  if (props.kind !== 'live') return
  const base = props.data[props.data.length - 1] ?? 1000
  if (burst <= 0 && rnd() > 0.86) burst = 3 + Math.floor(rnd() * 4)
  const lift = burst > 0 ? 1.35 + rnd() * 0.3 : 1
  burst--
  const next = Math.round(base * lift * (0.9 + rnd() * 0.2))
  series.value = [...series.value.slice(1), next]
})

/* ── Scales ──────────────────────────────────────────────────────────────── */
const n = computed(() => (props.kind === 'stock' ? props.data.length : series.value.length))
const sx = (i: number) => PAD.value.l + (i / Math.max(1, n.value - 1)) * iw.value
const band = computed(() => iw.value / n.value)
const bx = (i: number) => PAD.value.l + i * band.value
const sy = (v: number) => PAD.value.t + (1 - (clamp(v, props.y.min, props.y.max) - props.y.min) / (props.y.max - props.y.min)) * ih.value
function fmtY(v: number) {
  return props.y.format ? props.y.format(v) : String(v)
}
/** x ticks keep inside the plot: the first anchors at its start, the last at its end. */
const xTicks = computed(() =>
  props.x.ticks.map((tk) => {
    const x = props.kind === 'live' ? bx(tk.at) + band.value / 2 : props.kind === 'histogram' ? bx(tk.at) : sx(tk.at)
    const anchor = x < PAD.value.l + 14 ? 'start' : x > W.value - PAD.value.r - 14 ? 'end' : 'middle'
    return { ...tk, x, anchor }
  }),
)

/* ── Stock model: order when stock falls to the reorder point ─────────────── */
const stockRun = computed(() => {
  if (props.kind !== 'stock' || !props.stock) return null
  let stock = props.stock.start
  let due = -1
  const path: number[] = []
  const orders: number[] = []
  const outs: number[] = []
  props.data.forEach((demand, day) => {
    if (day === due) {
      stock += props.stock!.order
      due = -1
    }
    stock -= demand
    if (stock <= 0) {
      outs.push(day)
      stock = 0
    }
    if (stock <= t.value && due < 0) {
      orders.push(day)
      due = day + props.stock!.lead
    }
    path.push(stock)
  })
  const avg = path.reduce((s, v) => s + v, 0) / path.length
  return { path, orders, outs, avg }
})

/* ── What the line would have done ───────────────────────────────────────── */
const beyond = (v: number) => (props.direction === 'above' ? v > t.value : v < t.value)
/** Histogram bins span the cut-off's own range, min to max. */
const binStart = (i: number) => props.limit.min + (i / series.value.length) * (props.limit.max - props.limit.min)
const stats = computed((): Record<string, number> => {
  if (props.kind === 'histogram') {
    let blocked = 0
    let caught = 0
    const good = props.totals?.[0] ?? series.value.reduce((s, v) => s + v, 0)
    const bad = props.totals?.[1] ?? (props.data2 ?? []).reduce((s, v) => s + v, 0)
    series.value.forEach((v, i) => {
      if (binStart(i) < t.value) return
      blocked += v + (props.data2?.[i] ?? 0)
      caught += props.data2?.[i] ?? 0
    })
    return {
      blocked: (blocked / Math.max(1, good + bad)) * 100,
      caught: (caught / Math.max(1, bad)) * 100,
      threshold: t.value,
    }
  }
  if (props.kind === 'stock' && stockRun.value) {
    return { orders: stockRun.value.orders.length, outs: stockRun.value.outs.length, avg: stockRun.value.avg, threshold: t.value }
  }
  const values = series.value
  let episodes = 0
  let count = 0
  let over = 0
  values.forEach((v, i) => {
    if (beyond(v)) {
      count++
      over += props.direction === 'above' ? v - t.value : 0
      if (i === 0 || !beyond(values[i - 1])) episodes++
    }
  })
  const total = values.reduce((s, v) => s + v, 0)
  return { episodes, share: (count / values.length) * 100, rejected: (over / Math.max(1, total)) * 100, overCount: over, threshold: t.value }
})
const said = computed(() => props.say(stats.value))

/* ── Paths ───────────────────────────────────────────────────────────────── */
const linePts = computed(() => {
  if (props.kind === 'stock' && stockRun.value) {
    // A step line: stock holds through each day.
    const out: [number, number][] = []
    stockRun.value.path.forEach((v, i) => {
      out.push([sx(i), sy(v)])
      if (i < stockRun.value!.path.length - 1) out.push([sx(i + 1), sy(v)])
    })
    return points(out)
  }
  return points(series.value.map((v, i) => [sx(i), sy(v)]))
})
const tY = computed(() => sy(t.value))
const tX = computed(() => PAD.value.l + ((t.value - props.limit.min) / (props.limit.max - props.limit.min)) * iw.value)
/** The part of the plot past the line, where the second drawing shows through. */
const clip = computed(() =>
  props.direction === 'above'
    ? { x: PAD.value.l, y: PAD.value.t, w: iw.value, h: Math.max(0, tY.value - PAD.value.t) }
    : { x: PAD.value.l, y: tY.value, w: iw.value, h: Math.max(0, H.value - PAD.value.b - tY.value) },
)

const columns = computed(() => {
  if (props.kind !== 'live' && props.kind !== 'histogram') return []
  const gap = 2
  const w = Math.max(1, band.value - gap)
  return series.value.map((v, i) => {
    const x = bx(i) + gap / 2
    if (props.kind === 'histogram') {
      const a = v
      const b = props.data2?.[i] ?? 0
      return { x, w, y1: sy(a), h1: sy(0) - sy(a), y2: sy(a + b), h2: Math.max(0, sy(a) - sy(a + b) - (b ? 1 : 0)), past: binStart(i) >= t.value }
    }
    const kept = Math.min(v, t.value)
    return { x, w, y1: sy(kept), h1: sy(0) - sy(kept), y2: sy(v), h2: Math.max(0, sy(kept) - sy(v)), past: v > t.value }
  })
})

/* ── Dragging and keys on the tag ───────────────────────────────────────── */
const tag = ref<HTMLElement | null>(null)
let dragging = false
function fromPointer(event: PointerEvent) {
  if (!plot.value) return
  const box = plot.value.getBoundingClientRect()
  if (vertical.value) {
    const f = (event.clientX - box.left - PAD.value.l) / iw.value
    set(props.limit.min + f * (props.limit.max - props.limit.min))
  } else {
    const f = 1 - (event.clientY - box.top - PAD.value.t) / ih.value
    set(props.y.min + f * (props.y.max - props.y.min))
  }
}
function set(v: number) {
  t.value = snapTo(v, props.limit.min, props.limit.max, props.limit.step)
}
function onPointerdown(event: PointerEvent) {
  if (event.button !== 0) return
  event.preventDefault()
  tag.value?.focus({ preventScroll: true })
  capture(event.currentTarget as HTMLElement, event)
  dragging = true
  fromPointer(event)
}
function onPointermove(event: PointerEvent) {
  if (dragging) fromPointer(event)
}
function onPointerup() {
  dragging = false
}
function onKeydown(event: KeyboardEvent) {
  const next = sliderKey(event, t.value, { min: props.limit.min, max: props.limit.max, step: props.limit.step })
  if (next === null) return
  event.preventDefault()
  set(next)
}

const tagStyle = computed(() =>
  vertical.value
    ? { left: `${tX.value}px`, top: `${PAD.value.t}px`, height: `${ih.value}px` }
    : { top: `${tY.value}px`, left: `${PAD.value.l}px`, width: `${iw.value}px` },
)
const chartLabel = computed(() => `${props.label}. ${said.value.text}`)
</script>

<template>
  <div class="mk thr">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ label }}</span>
      <span v-if="meta" class="r-label thr__meta">{{ meta }}</span>
    </div>

    <div class="thr__say" aria-live="polite">
      <span class="thr__text">{{ said.text }}</span>
      <span v-if="said.word" class="thr__word" :class="`is-${said.tone}`">{{ said.word }}</span>
    </div>

    <div ref="plot" class="thr__plot mk-grow" @pointerdown="onPointerdown" @pointermove="onPointermove" @pointerup="onPointerup" @pointercancel="onPointerup" @lostpointercapture="onPointerup">
      <svg :width="W" :height="H" role="img" :aria-label="chartLabel">
        <defs>
          <clipPath :id="`${uid}-past`">
            <rect :x="clip.x" :y="clip.y" :width="clip.w" :height="clip.h" />
          </clipPath>
        </defs>
        <g class="thr__grid">
          <line v-for="v in y.ticks" :key="v" :x1="PAD.l" :x2="W - PAD.r" :y1="Math.round(sy(v)) + 0.5" :y2="Math.round(sy(v)) + 0.5" />
        </g>
        <line class="thr__axis" :x1="PAD.l" :x2="W - PAD.r" :y1="H - PAD.b + 0.5" :y2="H - PAD.b + 0.5" />
        <text v-for="v in y.ticks" :key="`l${v}`" class="thr__tick" :x="PAD.l - 6" :y="sy(v) + 3" text-anchor="end">{{ fmtY(v) }}</text>
        <text v-for="tk in xTicks" :key="`x${tk.at}`" class="thr__tick" :x="tk.x" :y="H - 4" :text-anchor="tk.anchor">
          {{ tk.label }}
        </text>

        <!-- Past the cut-off: a flat wash, then the columns over it. -->
        <rect v-if="vertical" class="thr__wash" :x="tX" :y="PAD.t" :width="Math.max(0, W - PAD.r - tX)" :height="ih" />

        <template v-if="kind === 'live' || kind === 'histogram'">
          <g v-for="(c, i) in columns" :key="i">
            <rect class="thr__col" :class="{ 'is-context': kind === 'histogram' }" :x="c.x" :y="c.y1" :width="c.w" :height="Math.max(0, c.h1)" />
            <rect v-if="c.h2 > 0" class="thr__col" :class="kind === 'live' ? 'is-rejected' : 'is-second'" :x="c.x" :y="c.y2" :width="c.w" :height="c.h2" />
          </g>
        </template>
        <template v-else>
          <polyline class="thr__line" :points="linePts" />
          <polyline v-if="kind !== 'stock'" class="thr__line is-past" :points="linePts" :clip-path="`url(#${uid}-past)`" />
          <template v-if="stockRun">
            <rect v-for="d in stockRun.orders" :key="`o${d}`" class="thr__order" :x="sx(d) - 3" :y="H - PAD.b - 7" width="6" height="6" />
            <rect v-for="d in stockRun.outs" :key="`s${d}`" class="thr__out" :x="sx(d) - 3" :y="H - PAD.b - 7" width="6" height="6" />
          </template>
        </template>

        <line
          v-if="vertical"
          class="thr__limit"
          :x1="Math.round(tX) + 0.5"
          :x2="Math.round(tX) + 0.5"
          :y1="PAD.t"
          :y2="H - PAD.b"
        />
        <line v-else class="thr__limit" :x1="PAD.l" :x2="W - PAD.r" :y1="Math.round(tY) + 0.5" :y2="Math.round(tY) + 0.5" />
      </svg>

      <div
        ref="tag"
        class="thr__handle"
        :class="vertical ? 'is-vertical' : 'is-horizontal'"
        :style="tagStyle"
        role="slider"
        tabindex="0"
        :aria-label="limit.label"
        :aria-orientation="vertical ? 'horizontal' : 'vertical'"
        :aria-valuemin="limit.min"
        :aria-valuemax="limit.max"
        :aria-valuenow="t"
        :aria-valuetext="limit.format(t)"
        @keydown="onKeydown"
      >
        <span class="thr__tag">{{ limit.format(t) }}</span>
      </div>
    </div>

    <ul v-if="kind !== 'line'" class="thr__legend" aria-hidden="true">
      <template v-if="kind === 'live'">
        <li><span class="thr__sw is-kept" />Served</li>
        <li><span class="thr__sw is-rejected" />Rejected</li>
      </template>
      <template v-else-if="kind === 'histogram' && names">
        <li><span class="thr__sw is-context" />{{ names[0] }}</li>
        <li><span class="thr__sw is-kept" />{{ names[1] }}</li>
      </template>
      <template v-else-if="kind === 'stock'">
        <li><span class="thr__sw is-order" />Order placed</li>
        <li><span class="thr__sw is-rejected" />Out of stock</li>
      </template>
    </ul>
  </div>
</template>

<style scoped>
.thr {
  gap: 6px;
}

.thr__meta {
  flex: none;
}

.thr__say {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
  font-size: var(--r-text-sm);
  line-height: 1.35;
}
.thr__text {
  min-width: 0;
}
.thr__word {
  flex: none;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.thr__word.is-success {
  color: var(--r-success-text);
}
.thr__word.is-warning {
  color: var(--r-warning-text);
}
.thr__word.is-danger {
  color: var(--r-danger-text);
}

.thr__plot {
  position: relative;
  min-height: 80px;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}
.thr__plot svg {
  position: absolute;
  inset: 0;
  display: block;
}

.thr__grid line {
  stroke: var(--r-chart-grid);
}
.thr__axis {
  stroke: var(--r-chart-axis);
}
.thr__tick {
  fill: var(--r-chart-label);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-variant-numeric: tabular-nums;
}

.thr__line {
  fill: none;
  stroke: var(--r-chart-1);
  stroke-width: 2;
  stroke-linejoin: miter;
}
.thr__line.is-past {
  stroke: var(--r-danger);
}

.thr__col {
  fill: var(--r-chart-1);
}
.thr__col.is-context {
  fill: var(--r-chart-context);
}
.thr__col.is-second {
  fill: var(--r-chart-1);
}
.thr__col.is-rejected {
  fill: var(--r-danger);
}

.thr__wash {
  fill: var(--r-danger-soft);
}

.thr__order {
  fill: var(--r-ink);
}
.thr__out {
  fill: var(--r-danger);
}

.thr__limit {
  stroke: var(--r-chart-ink);
  stroke-width: 1.5;
  stroke-dasharray: 5 3;
}

/* The handle: a band you can grab along the line, with its value tag at the end. */
.thr__handle {
  position: absolute;
  cursor: ns-resize;
}
.thr__handle.is-horizontal {
  height: 14px;
  margin-top: -7px;
}
.thr__handle.is-vertical {
  width: 14px;
  margin-left: -7px;
  cursor: ew-resize;
}
.thr__handle:focus-visible {
  outline: none;
}
.thr__tag {
  position: absolute;
  padding: 0 5px;
  background: var(--r-ink);
  color: var(--r-on-ink);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-medium);
  font-variant-numeric: tabular-nums;
  line-height: 14px;
  white-space: nowrap;
}
.thr__handle.is-horizontal .thr__tag {
  top: 0;
  right: 0;
}
.thr__handle.is-vertical .thr__tag {
  top: -2px;
  left: 9px;
}
.thr__handle:focus-visible .thr__tag {
  box-shadow: var(--r-focus-ring);
}

.thr__legend {
  display: flex;
  gap: 14px;
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.thr__legend li {
  display: flex;
  align-items: center;
  gap: 6px;
}
.thr__sw {
  width: 8px;
  height: 8px;
}
.thr__sw.is-kept {
  background: var(--r-chart-1);
}
.thr__sw.is-context {
  background: var(--r-chart-context);
}
.thr__sw.is-rejected {
  background: var(--r-danger);
}
.thr__sw.is-order {
  background: var(--r-ink);
}
</style>
