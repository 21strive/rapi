<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { colorAt, useChartFocus } from './utils'
import { formatNumber } from '../composables/format'

interface GaugeSegment {
  label: string
  value: number
  color?: string
}

const props = withDefaults(
  defineProps<{
    segments: GaugeSegment[]
    /** Full scale. Defaults to the sum of the segments (a full arc). */
    max?: number
    /** Big number in the middle. Defaults to the sum. */
    value?: number | string
    caption?: string
    /** Number of radial bars in the arc. */
    bars?: number
    legend?: boolean
    format?: (value: number) => string
    label: string
  }>(),
  { bars: 48, legend: true },
)

const uid = useId()
const W = 320
const H = 176
const CX = W / 2
const CY = H - 10
const R_OUTER = 150
const R_INNER = 94

const fmt = (v: number) => (props.format ? props.format(v) : formatNumber(v))
const DEFAULTS = ['var(--r-chart-1)', 'var(--r-chart-2)', 'var(--r-chart-3)']
const items = computed(() =>
  props.segments.map((s, i) => ({ ...s, color: s.color ?? DEFAULTS[i] ?? colorAt(i) })),
)
const sum = computed(() => props.segments.reduce((total, s) => total + Math.max(0, s.value), 0))
const scale = computed(() => Math.max(props.max ?? sum.value, 1e-9))

// Thin square ticks, like the scale of an instrument; at most 6px wide.
const thickness = computed(() => Math.min(6, ((((R_OUTER + R_INNER) / 2) * Math.PI) / props.bars) * 0.5))

const ticks = computed(() => {
  const n = props.bars
  const bounds: number[] = []
  let running = 0
  for (const s of items.value) {
    running += Math.max(0, s.value)
    bounds.push(running)
  }
  return Array.from({ length: n }, (_, i) => {
    const angle = Math.PI - ((i + 0.5) * Math.PI) / n
    const at = ((i + 0.5) / n) * scale.value
    const segment = bounds.findIndex((end) => at <= end)
    const s = segment >= 0 ? items.value[segment] : null
    const color = s ? s.color : 'var(--r-chart-track)'
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    return {
      x1: CX + R_INNER * cos,
      y1: CY - R_INNER * sin,
      x2: CX + R_OUTER * cos,
      y2: CY - R_OUTER * sin,
      color,
      segment,
    }
  })
})

const focus = useChartFocus(
  () => items.value.length,
  (i) => `${items.value[i].label}: ${fmt(items.value[i].value)}`,
)
const hovered = ref<number | null>(null)
const activeSegment = computed(() => hovered.value ?? focus.active.value)

const center = computed(() => {
  const i = activeSegment.value
  if (i !== null && items.value[i]) {
    return { value: fmt(items.value[i].value), caption: items.value[i].label }
  }
  const value = props.value ?? sum.value
  return { value: typeof value === 'number' ? fmt(value) : value, caption: props.caption }
})
</script>

<template>
  <figure
    class="r-chart r-gauge"
    :class="{ 'is-focused': activeSegment !== null }"
    tabindex="0"
    :aria-describedby="`${uid}-hint`"
    @keydown="focus.onKeydown"
    @blur="focus.onBlur"
  >
    <div class="r-gauge__arc">
      <svg :viewBox="`0 0 ${W} ${H}`" role="img" :aria-label="label" @pointerleave="hovered = null">
        <path class="r-gauge__scale" :d="`M${CX - R_INNER + 10},${CY} A${R_INNER - 10},${R_INNER - 10} 0 0 1 ${CX + R_INNER - 10},${CY}`" />
        <text class="r-chart__text" :x="CX - R_OUTER" :y="CY + 14">0</text>
        <text class="r-chart__text" :x="CX + R_OUTER" :y="CY + 14" text-anchor="end">{{ fmt(scale) }}</text>
        <line
          v-for="(t, i) in ticks"
          :key="i"
          class="r-gauge__bar"
          :class="{ 'is-dim': activeSegment !== null && t.segment !== activeSegment }"
          :x1="t.x1"
          :y1="t.y1"
          :x2="t.x2"
          :y2="t.y2"
          :stroke-width="thickness"
          :style="{ stroke: t.color, animationDelay: `${i * 16}ms` }"
          @pointerenter="hovered = t.segment >= 0 ? t.segment : null"
        />
      </svg>
      <div class="r-gauge__center" aria-hidden="true">
        <span class="r-gauge__value">{{ center.value }}</span>
        <span v-if="center.caption" class="r-gauge__caption">{{ center.caption }}</span>
      </div>
    </div>
    <ul v-if="legend" class="r-gauge__legend">
      <li
        v-for="(s, i) in items"
        :key="s.label"
        :class="{ 'is-active': activeSegment === i }"
        @pointerenter="hovered = i"
        @pointerleave="hovered = null"
      >
        <span class="r-gauge__dot" :style="{ background: s.color }" />
        {{ s.label }}
        <span class="r-gauge__legend-value">{{ fmt(s.value) }}</span>
      </li>
    </ul>
    <div class="r-sr-only">
      <table>
        <caption>{{ label }}</caption>
        <tbody>
          <tr v-for="s in items" :key="s.label">
            <th scope="row">{{ s.label }}</th>
            <td>{{ fmt(s.value) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <span :id="`${uid}-hint`" hidden>Use the arrow keys to read each segment.</span>
    <span class="r-sr-only" aria-live="polite">{{ focus.announce.value }}</span>
  </figure>
</template>

<style>
.r-gauge {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}

.r-gauge__arc {
  position: relative;
  width: 100%;
  max-width: 340px;
}

.r-gauge__arc svg {
  display: block;
  width: 100%;
  height: auto;
  overflow: visible;
}

.r-gauge__scale {
  fill: none;
  stroke: var(--r-chart-axis);
  stroke-width: 1;
}

.r-gauge__bar {
  stroke-linecap: butt;
  animation: r-gauge-in var(--r-duration-slow) var(--r-ease-out) both;
  transition: stroke var(--r-duration-fast) var(--r-ease-out);
}
/* The other segments fall back to the track colour, so even a pale segment stands out. */
.r-gauge__bar.is-dim {
  stroke: var(--r-chart-track) !important;
}

@keyframes r-gauge-in {
  from {
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .r-gauge__bar {
    animation: none;
  }
}

.r-gauge__center {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  pointer-events: none;
}

.r-gauge__value {
  color: var(--r-text);
  font-size: clamp(22px, 8.6cqw, 38px);
  font-weight: var(--r-weight-semibold);
  line-height: 1.1;
  letter-spacing: var(--r-tracking-display);
}
.r-gauge__arc {
  container-type: inline-size;
}

.r-gauge__caption {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-caps);
  text-transform: uppercase;
}

.r-gauge__legend {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px 16px;
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
}

.r-gauge__legend-value {
  color: var(--r-text);
  font-family: var(--r-font-mono);
  font-weight: var(--r-weight-semibold);
  font-variant-numeric: tabular-nums;
}
.r-gauge__legend li {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: default;
  transition: color var(--r-duration-fast) var(--r-ease-out);
}
.r-gauge__legend li.is-active {
  color: var(--r-text);
}

.r-gauge__dot {
  width: 9px;
  height: 9px;
}
</style>
