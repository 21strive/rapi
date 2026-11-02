<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { formatNumber } from '../composables/format'
import type { MeterSegment } from '../types'

const props = withDefaults(
  defineProps<{
    /** `bar`: one rounded bar, stacked segments. `ticks`: a row of thin bars. */
    variant?: 'bar' | 'ticks'
    segments: MeterSegment[]
    /** Full scale. Defaults to the sum of the segments. */
    max?: number
    /** Soft left-to-right gradient on each segment. */
    gradient?: boolean
    /** Bar thickness in px. */
    height?: number
    /** Number of thin bars in the `ticks` variant. */
    ticks?: number
    legend?: boolean | 'inline' | 'list'
    format?: (value: number) => string
    /** Accessible summary. Defaults to "Label 62%, Label 20%, …". */
    label?: string
  }>(),
  { variant: 'bar', legend: false, ticks: 56 },
)

const PALETTE = ['var(--r-chart-1)', 'var(--r-chart-1-soft)', 'var(--r-chart-5)', 'var(--r-chart-2)', 'var(--r-chart-3)', 'var(--r-chart-6)']

const items = computed(() => props.segments.map((s, i) => ({ ...s, color: s.color ?? PALETTE[i % PALETTE.length] })))
const sum = computed(() => props.segments.reduce((total, s) => total + Math.max(0, s.value), 0))
const scale = computed(() => Math.max(props.max ?? sum.value, 1e-9))
const percent = (value: number) => (Math.max(0, value) / scale.value) * 100
const show = (value: number) => (props.format ? props.format(value) : formatNumber(value))

const ariaLabel = computed(
  () =>
    props.label ??
    items.value.map((s) => `${s.label ?? 'Segment'} ${formatNumber(percent(s.value), { maximumFractionDigits: 0 })}%`).join(', '),
)

const legendMode = computed(() => (props.legend === true ? 'inline' : props.legend || null))

// Ticks: each thin bar takes the colour of the segment its midpoint falls in.
const tickColors = computed(() => {
  const n = Math.max(1, props.ticks)
  const bounds: { end: number; color: string }[] = []
  let running = 0
  for (const s of items.value) {
    running += Math.max(0, s.value)
    bounds.push({ end: running, color: s.color })
  }
  return Array.from({ length: n }, (_, i) => {
    const at = ((i + 0.5) / n) * scale.value
    return bounds.find((b) => at <= b.end)?.color ?? 'var(--r-chart-track)'
  })
})

const grown = ref(false)
onMounted(() => requestAnimationFrame(() => (grown.value = true)))

const thickness = computed(() => props.height ?? (props.variant === 'ticks' ? 40 : 12))
</script>

<template>
  <div class="r-meter" :class="[`r-meter--${variant}`, { 'is-grown': grown, 'r-meter--gradient': gradient }]">
    <div
      v-if="variant === 'bar'"
      class="r-meter__bar"
      role="img"
      :aria-label="ariaLabel"
      :style="{ height: `${thickness}px`, '--r-meter-radius': thickness <= 14 ? '999px' : '10px' }"
    >
      <span
        v-for="(s, i) in items"
        :key="i"
        class="r-meter__segment"
        :style="{ width: grown ? `${percent(s.value)}%` : '0%', '--r-seg': s.color }"
      />
    </div>
    <div v-else class="r-meter__ticks" role="img" :aria-label="ariaLabel" :style="{ height: `${thickness}px` }">
      <span
        v-for="(color, i) in tickColors"
        :key="i"
        class="r-meter__tick"
        :style="{ background: color, transitionDelay: `${i * 6}ms` }"
      />
    </div>

    <ul v-if="legendMode === 'inline'" class="r-meter__legend">
      <li v-for="(s, i) in items" :key="i">
        <span class="r-meter__dot" :style="{ background: s.color }" />
        {{ s.label }}
      </li>
    </ul>
    <ul v-else-if="legendMode === 'list'" class="r-meter__list">
      <li v-for="(s, i) in items" :key="i">
        <span class="r-meter__dot" :style="{ background: s.color }" />
        <span class="r-meter__list-label">{{ s.label }}</span>
        <span class="r-meter__list-value">{{ show(s.value) }}</span>
        <span class="r-meter__list-percent">{{ formatNumber(percent(s.value), { maximumFractionDigits: 0 }) }}%</span>
      </li>
    </ul>
  </div>
</template>

<style>
.r-meter {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}

.r-meter__bar {
  display: flex;
  gap: 3px;
  overflow: hidden;
  border-radius: var(--r-meter-radius);
  background: var(--r-chart-track);
}

.r-meter__segment {
  flex-shrink: 0;
  height: 100%;
  border-radius: 3px;
  background: var(--r-seg);
  transition: width var(--r-duration-slower) var(--r-ease-out);
}
.r-meter__segment:first-child {
  border-radius: var(--r-meter-radius) 3px 3px var(--r-meter-radius);
}

.r-meter--gradient .r-meter__segment {
  background: linear-gradient(90deg, color-mix(in srgb, var(--r-seg) 55%, var(--r-bg-surface)), var(--r-seg));
}

/* Hairline ticks over a tall bar, like a ruler. */
.r-meter--gradient .r-meter__bar {
  position: relative;
}
.r-meter--gradient .r-meter__bar::after {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(90deg, transparent 0 47px, rgb(255 255 255 / 0.22) 47px 48px);
  content: '';
  pointer-events: none;
}

.r-meter__ticks {
  display: flex;
  align-items: stretch;
  gap: 3px;
}

.r-meter__tick {
  flex: 1;
  min-width: 2px;
  border-radius: 2px;
  opacity: 0;
  transform: scaleY(0.4);
  transform-origin: bottom;
  transition:
    opacity var(--r-duration-slow) var(--r-ease-out),
    transform var(--r-duration-slow) var(--r-ease-out);
}
.r-meter.is-grown .r-meter__tick {
  opacity: 1;
  transform: none;
}

@media (prefers-reduced-motion: reduce) {
  .r-meter__tick {
    transition-delay: 0ms !important;
  }
}

.r-meter__legend {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 16px;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}
.r-meter__legend li {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.r-meter__dot {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.r-meter__list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.r-meter__list li {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 40px;
  padding: 0 12px;
  border-radius: var(--r-radius-md);
  background: var(--r-bg-muted);
  font-size: var(--r-text-sm);
}
.r-meter__list-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  color: var(--r-text);
  text-overflow: ellipsis;
  white-space: nowrap;
}
.r-meter__list-value {
  color: var(--r-text-tertiary);
  font-variant-numeric: tabular-nums;
}
.r-meter__list-percent {
  min-width: 42px;
  padding: 3px 6px;
  border-radius: var(--r-radius-xs);
  background: var(--r-bg-surface);
  box-shadow: inset 0 0 0 1px var(--r-border);
  color: var(--r-text-secondary);
  font-size: var(--r-text-2xs);
  font-weight: var(--r-weight-semibold);
  font-variant-numeric: tabular-nums;
  text-align: center;
}
</style>
