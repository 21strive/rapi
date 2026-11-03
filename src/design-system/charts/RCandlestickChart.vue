<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import ChartTooltip from './ChartTooltip.vue'
import { chartWidth, crisp, linearScale, niceDomain, useChartFocus } from './utils'
import { useElementSize } from '../composables/dom'
import { formatCompact, formatNumber } from '../composables/format'
import type { CandlePoint, ChartReference } from '../types'

/** OHLC candles with an optional volume strip. Up = cobalt, down = orange (the diverging pair). */
const props = withDefaults(
  defineProps<{
    data: CandlePoint[]
    label: string
    height?: number
    /** Volume strip under the candles, on its own band (never a second y-scale on the plot). */
    volume?: boolean
    references?: ChartReference[]
    format?: (value: number) => string
  }>(),
  { height: 320, volume: true },
)

const root = ref<HTMLElement | null>(null)
const { width: measured } = useElementSize(root)
const width = chartWidth(measured)
const uid = useId()

const fmt = (v: number) => (props.format ? props.format(v) : formatNumber(v, { minimumFractionDigits: 2, maximumFractionDigits: 2 }))

const M = { top: 10, right: 64, bottom: 24, left: 4 }
const VOL_H = 52
const VOL_GAP = 10

const geometry = computed(() => {
  const plotW = Math.max(1, width.value - M.left - M.right)
  const volH = props.volume ? VOL_H : 0
  const priceH = Math.max(1, props.height - M.top - M.bottom - (props.volume ? VOL_H + VOL_GAP : 0))
  const n = Math.max(1, props.data.length)
  const band = plotW / n
  const bodyW = Math.max(1, Math.min(9, band * 0.62))
  const lows = props.data.map((d) => d.low)
  const highs = props.data.map((d) => d.high)
  const refs = (props.references ?? []).map((r) => r.value)
  const lo = Math.min(...lows, ...refs)
  const hi = Math.max(...highs, ...refs)
  const pad = (hi - lo) * 0.06 || 1
  const domain = niceDomain(lo - pad, hi + pad, 5)
  const y = linearScale(domain.min, domain.max, M.top + priceH, M.top)
  const maxVol = Math.max(1, ...props.data.map((d) => d.volume ?? 0))
  const volTop = M.top + priceH + VOL_GAP
  const vy = linearScale(0, maxVol, volTop + volH, volTop)
  return { plotW, priceH, band, bodyW, y, vy, domain, volTop, volH, left: M.left, right: M.left + plotW, top: M.top, priceBottom: M.top + priceH, maxVol }
})

const candles = computed(() =>
  props.data.map((d, i) => {
    const g = geometry.value
    const cx = g.left + g.band * i + g.band / 2
    const up = d.close >= d.open
    const y0 = g.y(Math.max(d.open, d.close))
    const y1 = g.y(Math.min(d.open, d.close))
    return {
      d,
      cx,
      up,
      wick: { y1: g.y(d.high), y2: g.y(d.low) },
      body: { x: cx - g.bodyW / 2, y: y0, w: g.bodyW, h: Math.max(1, y1 - y0) },
      vol: d.volume != null ? { y: g.vy(d.volume), h: g.volTop + g.volH - g.vy(d.volume) } : null,
    }
  }),
)

const yTicks = computed(() => geometry.value.domain.ticks.map((v) => ({ v, y: geometry.value.y(v) })))
const xEvery = computed(() => Math.max(1, Math.ceil(56 / geometry.value.band)))

const last = computed(() => {
  const d = props.data[props.data.length - 1]
  if (!d) return null
  return { y: geometry.value.y(d.close), text: fmt(d.close), up: d.close >= d.open }
})

const refs = computed(() =>
  (props.references ?? []).map((r) => ({ ...r, y: geometry.value.y(r.value), text: (r.label ?? r.kind ?? 'ref').toUpperCase() })),
)

const focus = useChartFocus(
  () => props.data.length,
  (i) => {
    const d = props.data[i]
    return `${d.t}: open ${fmt(d.open)}, high ${fmt(d.high)}, low ${fmt(d.low)}, close ${fmt(d.close)}${d.volume != null ? `, volume ${formatCompact(d.volume)}` : ''}`
  },
)

const pointerY = ref<number | null>(null)

function onPointerMove(event: PointerEvent) {
  const box = (event.currentTarget as SVGElement).getBoundingClientRect()
  const px = event.clientX - box.left - geometry.value.left
  const py = event.clientY - box.top
  pointerY.value = py >= geometry.value.top && py <= geometry.value.priceBottom ? py : null
  const i = Math.floor(px / geometry.value.band)
  focus.onPointer(i >= 0 && i < props.data.length ? i : null)
}

function onLeave() {
  pointerY.value = null
  focus.onPointer(null)
}

const cursor = computed(() => {
  const i = focus.active.value
  if (i === null) return null
  const c = candles.value[i]
  const d = c.d
  const color = c.up ? 'var(--r-div-pos)' : 'var(--r-div-neg)'
  const rows = [
    { label: 'Open', value: fmt(d.open) },
    { label: 'High', value: fmt(d.high) },
    { label: 'Low', value: fmt(d.low) },
    { label: 'Close', value: fmt(d.close), color, kind: 'rect' as const },
  ]
  if (d.volume != null) rows.push({ label: 'Volume', value: formatCompact(d.volume) })
  const g = geometry.value
  const price = pointerY.value != null ? (g.domain.max - g.domain.min) * (1 - (pointerY.value - g.top) / g.priceH) + g.domain.min : null
  return { x: c.cx, y: c.wick.y1, title: d.t, rows, flagW: d.t.length * 6.4 + 12, price }
})
</script>

<template>
  <figure
    ref="root"
    class="r-chart r-candles"
    tabindex="0"
    :aria-describedby="`${uid}-hint`"
    @keydown="focus.onKeydown"
    @blur="focus.onBlur"
  >
    <div class="r-chart__plot">
      <svg
        :width="width"
        :height="height"
        :viewBox="`0 0 ${width} ${height}`"
        role="img"
        :aria-label="label"
        @pointermove="onPointerMove"
        @pointerleave="onLeave"
      >
        <g class="r-chart__grid">
          <line v-for="t in yTicks" :key="t.v" :x1="geometry.left" :x2="geometry.right" :y1="crisp(t.y)" :y2="crisp(t.y)" />
        </g>
        <g class="r-chart__axis">
          <line class="r-chart__axis-line" :x1="crisp(geometry.right)" :x2="crisp(geometry.right)" :y1="geometry.top" :y2="geometry.priceBottom" />
          <text v-for="t in yTicks" :key="`y${t.v}`" :x="geometry.right + 8" :y="t.y" dy="0.32em">{{ fmt(t.v) }}</text>
          <template v-for="(c, i) in candles" :key="`x${i}`">
            <text v-if="i % xEvery === 0" :x="c.cx" :y="height - 6" text-anchor="middle">{{ c.d.t }}</text>
          </template>
          <text v-if="volume" class="r-chart__unit" :x="geometry.right + 8" :y="geometry.volTop + 8">Vol</text>
          <text v-if="volume" :x="geometry.right + 8" :y="geometry.volTop + 22">{{ formatCompact(geometry.maxVol) }}</text>
        </g>
        <line class="r-chart__baseline" :x1="geometry.left" :x2="geometry.right" :y1="crisp(geometry.priceBottom)" :y2="crisp(geometry.priceBottom)" />
        <line
          v-if="volume"
          class="r-chart__baseline"
          :x1="geometry.left"
          :x2="geometry.right"
          :y1="crisp(geometry.volTop + geometry.volH)"
          :y2="crisp(geometry.volTop + geometry.volH)"
        />

        <g v-for="r in refs" :key="`r${r.value}`" class="r-chart__ref" :class="`r-chart__ref--${r.kind ?? 'target'}`">
          <line :x1="geometry.left" :x2="geometry.right" :y1="crisp(r.y)" :y2="crisp(r.y)" />
          <text :x="geometry.left + 4" :y="r.y - 4">{{ r.text }} {{ fmt(r.value) }}</text>
        </g>

        <g
          v-for="(c, i) in candles"
          :key="`c${i}`"
          class="r-candles__candle"
          :class="[c.up ? 'is-up' : 'is-down', { 'is-dim': focus.active.value !== null && focus.active.value !== i }]"
        >
          <rect v-if="c.vol && volume" class="r-candles__vol" :x="c.body.x" :y="c.vol.y" :width="c.body.w" :height="Math.max(0, c.vol.h)" />
          <line class="r-candles__wick" :x1="crisp(c.cx)" :x2="crisp(c.cx)" :y1="c.wick.y1" :y2="c.wick.y2" />
          <rect class="r-candles__body" :x="c.body.x" :y="c.body.y" :width="c.body.w" :height="c.body.h" />
        </g>

        <g v-if="last" class="r-candles__last" :class="last.up ? 'is-up' : 'is-down'">
          <line :x1="geometry.left" :x2="geometry.right" :y1="crisp(last.y)" :y2="crisp(last.y)" />
          <rect :x="geometry.right + 1" :y="last.y - 8" :width="M.right - 2" height="16" />
          <text :x="geometry.right + 8" :y="last.y" dy="0.34em">{{ last.text }}</text>
        </g>

        <g v-if="cursor">
          <line class="r-chart__crosshair" :x1="crisp(cursor.x)" :x2="crisp(cursor.x)" :y1="geometry.top" :y2="volume ? geometry.volTop + geometry.volH : geometry.priceBottom" />
          <template v-if="cursor.price != null && pointerY != null">
            <line class="r-chart__crosshair" :x1="geometry.left" :x2="geometry.right" :y1="crisp(pointerY)" :y2="crisp(pointerY)" />
            <g class="r-chart__flag">
              <rect :x="geometry.right + 1" :y="pointerY - 8" :width="M.right - 2" height="16" />
              <text :x="geometry.right + 8" :y="pointerY" dy="0.34em">{{ fmt(cursor.price) }}</text>
            </g>
          </template>
          <g class="r-chart__flag">
            <rect :x="Math.min(Math.max(cursor.x - cursor.flagW / 2, 0), geometry.right - cursor.flagW)" :y="height - 18" :width="cursor.flagW" height="15" />
            <text :x="Math.min(Math.max(cursor.x, cursor.flagW / 2), geometry.right - cursor.flagW / 2)" :y="height - 10.5" dy="0.34em" text-anchor="middle">{{ cursor.title }}</text>
          </g>
        </g>
      </svg>
      <ChartTooltip v-if="cursor" :x="cursor.x" :y="cursor.y" :bounds="{ width: geometry.right, height }" :title="cursor.title" :rows="cursor.rows" />
    </div>
    <div class="r-sr-only">
      <table>
        <caption>{{ label }}</caption>
        <thead>
          <tr>
            <th scope="col">Time</th>
            <th scope="col">Open</th>
            <th scope="col">High</th>
            <th scope="col">Low</th>
            <th scope="col">Close</th>
            <th scope="col">Volume</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="d in data" :key="d.t">
            <th scope="row">{{ d.t }}</th>
            <td>{{ fmt(d.open) }}</td>
            <td>{{ fmt(d.high) }}</td>
            <td>{{ fmt(d.low) }}</td>
            <td>{{ fmt(d.close) }}</td>
            <td>{{ d.volume == null ? '—' : formatCompact(d.volume) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <span :id="`${uid}-hint`" hidden>Use the arrow keys to read each candle.</span>
    <span class="r-sr-only" aria-live="polite">{{ focus.announce.value }}</span>
  </figure>
</template>

<style>
.r-candles__candle {
  transition: opacity var(--r-duration-fast) var(--r-ease-out);
}

.r-candles__candle.is-dim {
  opacity: 0.5;
}

.r-candles__candle.is-up {
  --candle: var(--r-div-pos);
}

.r-candles__candle.is-down {
  --candle: var(--r-div-neg);
}

.r-candles__wick {
  stroke: var(--candle);
  stroke-width: 1;
}

.r-candles__body {
  fill: var(--candle);
  shape-rendering: crispEdges;
}

.r-candles__vol {
  fill: var(--candle);
  opacity: 0.32;
  shape-rendering: crispEdges;
}

.r-candles__last line {
  stroke-width: 1;
  stroke-dasharray: 2 3;
  shape-rendering: crispEdges;
}

.r-candles__last.is-up line,
.r-candles__last.is-up rect {
  stroke: var(--r-div-pos);
  fill: var(--r-div-pos);
}

.r-candles__last.is-down line,
.r-candles__last.is-down rect {
  stroke: var(--r-div-neg);
  fill: var(--r-div-neg);
}

.r-candles__last text {
  fill: #ffffff;
  font-family: var(--r-font-mono);
  font-size: 10px;
  font-weight: var(--r-weight-semibold);
  font-variant-numeric: tabular-nums;
}

.r-candles__last.is-down text {
  fill: var(--r-on-signal);
}
</style>
