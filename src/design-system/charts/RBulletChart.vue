<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import ChartTooltip from './ChartTooltip.vue'
import { useChartFocus } from './utils'
import { useElementSize } from '../composables/dom'
import { formatNumber } from '../composables/format'
import type { BulletRow } from '../types'

/** Bullet graphs: a measure bar against a target tick over grey qualitative bands, one per row. */
const props = withDefaults(
  defineProps<{
    rows: BulletRow[]
    label: string
    /** Shared maximum; defaults to each row's last range or 110% of its largest value. */
    max?: number
    format?: (value: number) => string
    /** `brand` measure bar (default) or `ink`. */
    tone?: 'brand' | 'ink'
  }>(),
  { tone: 'brand' },
)

const uid = useId()
const plot = ref<HTMLElement | null>(null)
const { width: plotWidth } = useElementSize(plot)

const fmt = (v: number) => (props.format ? props.format(v) : formatNumber(v))

// Poor → good bands as three steps of ink over the surface, so they read in both themes.
const BAND_TONES = [
  'color-mix(in srgb, var(--r-chart-ink) 22%, var(--r-chart-surface))',
  'color-mix(in srgb, var(--r-chart-ink) 13%, var(--r-chart-surface))',
  'color-mix(in srgb, var(--r-chart-ink) 7%, var(--r-chart-surface))',
]

const items = computed(() =>
  props.rows.map((row) => {
    const top =
      props.max ??
      (row.ranges?.length ? row.ranges[row.ranges.length - 1] : Math.max(row.value, row.target ?? 0, row.previous ?? 0) * 1.1)
    const max = Math.max(1e-9, top, row.value, row.target ?? 0)
    const pct = (v: number) => Math.min(100, Math.max(0, (v / max) * 100))
    const edges = row.ranges?.length ? row.ranges : [max]
    let start = 0
    const bands = edges.map((edge, i) => {
      const band = { left: pct(start), width: pct(edge) - pct(start), color: BAND_TONES[Math.min(i, BAND_TONES.length - 1)] }
      start = edge
      return band
    })
    return {
      ...row,
      max,
      bands,
      measure: pct(row.value),
      target: row.target == null ? null : pct(row.target),
      previous: row.previous == null ? null : pct(row.previous),
      ticks: [0, max / 2, max],
      met: row.target == null ? null : row.value >= row.target,
    }
  }),
)

const focus = useChartFocus(
  () => props.rows.length,
  (i) => {
    const r = props.rows[i]
    return `${r.label}: ${fmt(r.value)}${r.target != null ? `, target ${fmt(r.target)}` : ''}`
  },
)

const tooltip = computed(() => {
  const i = focus.active.value
  if (i === null || !plot.value) return null
  const el = plot.value.querySelectorAll<HTMLElement>('.r-bullet__track')[i]
  if (!el) return null
  const it = items.value[i]
  const rows = [{ label: 'Actual', value: fmt(it.value), color: props.tone === 'ink' ? 'var(--r-chart-ink)' : 'var(--r-chart-1)', kind: 'rect' as const }]
  if (it.target != null && it.met != null) rows.push({ label: it.met ? 'Target · met' : 'Target · below', value: fmt(props.rows[i].target as number), color: 'var(--r-chart-ink)', kind: 'rect' as const })
  if (it.previous != null) rows.push({ label: 'Previous', value: fmt(props.rows[i].previous as number), color: 'var(--r-chart-context)', kind: 'rect' as const })
  return { x: el.offsetLeft + (el.offsetWidth * it.measure) / 100, y: el.offsetTop, title: it.label, rows }
})
</script>

<template>
  <figure
    class="r-chart r-bullet"
    :class="[`r-bullet--${tone}`, { 'is-focused': focus.active.value !== null }]"
    tabindex="0"
    :aria-describedby="`${uid}-hint`"
    @keydown="focus.onKeydown"
    @blur="focus.onBlur"
  >
    <div ref="plot" class="r-bullet__plot" role="img" :aria-label="label" @pointerleave="focus.onPointer(null)">
      <div
        v-for="(it, i) in items"
        :key="it.label"
        class="r-bullet__row"
        :class="{ 'is-active': focus.active.value === i }"
        @pointerenter="focus.onPointer(i)"
      >
        <div class="r-bullet__head">
          <span class="r-bullet__label">{{ it.label }}</span>
          <span v-if="it.sublabel" class="r-bullet__sublabel">{{ it.sublabel }}</span>
        </div>
        <div class="r-bullet__body">
          <div class="r-bullet__track">
            <span v-for="(b, k) in it.bands" :key="k" class="r-bullet__band" :style="{ left: `${b.left}%`, width: `${b.width}%`, background: b.color }" />
            <span v-if="it.previous != null" class="r-bullet__previous" :style="{ width: `${it.previous}%` }" />
            <span class="r-bullet__measure" :style="{ width: `${it.measure}%` }" />
            <span v-if="it.target != null" class="r-bullet__target" :style="{ left: `${it.target}%` }" />
          </div>
          <div class="r-bullet__ticks" aria-hidden="true">
            <span v-for="(t, k) in it.ticks" :key="k" :style="{ left: `${(t / it.max) * 100}%` }">{{ fmt(t) }}</span>
          </div>
        </div>
        <span class="r-bullet__value">{{ fmt(it.value) }}</span>
      </div>
      <ChartTooltip
        v-if="tooltip"
        :x="tooltip.x"
        :y="tooltip.y"
        :bounds="{ width: plotWidth, height: 9999 }"
        :title="tooltip.title"
        :rows="tooltip.rows"
        placement="top"
      />
    </div>
    <div class="r-sr-only">
      <table>
        <caption>{{ label }}</caption>
        <thead>
          <tr>
            <th scope="col">Measure</th>
            <th scope="col">Actual</th>
            <th scope="col">Target</th>
            <th scope="col">Bands</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in rows" :key="r.label">
            <th scope="row">{{ r.label }}</th>
            <td>{{ fmt(r.value) }}</td>
            <td>{{ r.target == null ? '—' : fmt(r.target) }}</td>
            <td>{{ r.ranges?.map(fmt).join(' / ') ?? '—' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <span :id="`${uid}-hint`" hidden>Use the arrow keys to read each measure.</span>
    <span class="r-sr-only" aria-live="polite">{{ focus.announce.value }}</span>
  </figure>
</template>

<style>
.r-bullet__plot {
  position: relative;
  display: grid;
  grid-template-columns: minmax(96px, max-content) 1fr auto;
  align-items: start;
  gap: 14px 16px;
}

.r-bullet__row {
  display: contents;
}

.r-bullet__head {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-top: 1px;
}

.r-bullet__label {
  color: var(--r-text);
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-medium);
  line-height: 1.2;
}

.r-bullet__sublabel {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: 10px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.r-bullet__body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.r-bullet__track {
  position: relative;
  height: 18px;
}

.r-bullet__band {
  position: absolute;
  top: 0;
  bottom: 0;
}

.r-bullet__previous {
  position: absolute;
  top: 7px;
  left: 0;
  height: 4px;
  background: var(--r-chart-context);
}

.r-bullet__measure {
  position: absolute;
  top: 5px;
  left: 0;
  height: 8px;
  background: var(--r-chart-1);
  transition: opacity var(--r-duration-fast) var(--r-ease-out);
}

.r-bullet--ink .r-bullet__measure {
  background: var(--r-chart-ink);
}

.r-bullet__target {
  position: absolute;
  top: 1px;
  bottom: 1px;
  width: 2px;
  margin-left: -1px;
  background: var(--r-chart-ink);
}

.r-bullet.is-focused .r-bullet__row:not(.is-active) .r-bullet__measure {
  opacity: 0.45;
}

.r-bullet__ticks {
  position: relative;
  height: 12px;
  color: var(--r-chart-label);
  font-family: var(--r-font-mono);
  font-size: 9.5px;
  font-variant-numeric: tabular-nums;
}

.r-bullet__ticks span {
  position: absolute;
  top: 0;
  transform: translateX(-50%);
  white-space: nowrap;
}

.r-bullet__ticks span:first-child {
  transform: none;
}

.r-bullet__ticks span:last-child {
  transform: translateX(-100%);
}

.r-bullet__value {
  min-width: 6ch;
  padding-top: 2px;
  color: var(--r-text);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
  font-weight: var(--r-weight-semibold);
  font-variant-numeric: tabular-nums;
  text-align: right;
}

@media (max-width: 520px) {
  .r-bullet__plot {
    grid-template-columns: 1fr auto;
  }
  .r-bullet__head {
    grid-column: 1 / -1;
    margin-bottom: -8px;
  }
}
</style>
