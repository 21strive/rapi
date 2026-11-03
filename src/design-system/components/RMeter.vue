<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { formatNumber } from '../composables/format'
import type { MeterSegment } from '../types'

const props = withDefaults(
  defineProps<{
    /**
     * `bar`: one bar of stacked square segments. `ticks`: a row of thin square ticks.
     * `segments`: an LED bar of `count` equal blocks, lit up to `value / max`.
     */
    variant?: 'bar' | 'ticks' | 'segments'
    segments?: MeterSegment[]
    /** Full scale. Defaults to the sum of the segments, or 100 for the `segments` variant. */
    max?: number
    /** The reading of the `segments` variant. Defaults to the sum of the segments. */
    value?: number
    /** Number of blocks in the `segments` variant. */
    count?: number
    /** Colour of the lit blocks in the `segments` variant. */
    tone?: 'brand' | 'signal' | 'success' | 'warning' | 'danger'
    /** @deprecated Rapi 0.2 has no gradients. Still accepted, ignored. */
    gradient?: boolean
    /** Thickness in px. Defaults: bar 8, ticks 32, segments 12. */
    height?: number
    /** Number of thin bars in the `ticks` variant. */
    ticks?: number
    legend?: boolean | 'inline' | 'list'
    format?: (value: number) => string
    /** Accessible summary. Defaults to "Label 62%, Label 20%, …". */
    label?: string
  }>(),
  { variant: 'bar', segments: () => [], count: 20, tone: 'brand', legend: false, ticks: 56 },
)

// Identity colours in order, never cycled: past eight, segments fall back to the context grey.
const paletteColor = (i: number) => (i < 8 ? `var(--r-chart-${i + 1})` : 'var(--r-chart-context)')

const items = computed(() => props.segments.map((s, i) => ({ ...s, color: s.color ?? paletteColor(i) })))
const sum = computed(() => props.segments.reduce((total, s) => total + Math.max(0, s.value), 0))
const scale = computed(() => Math.max(props.max ?? (props.variant === 'segments' ? 100 : sum.value), 1e-9))
const percent = (value: number) => (Math.max(0, value) / scale.value) * 100
const show = (value: number) => (props.format ? props.format(value) : formatNumber(value))
const rest = computed(() => Math.max(0, scale.value - sum.value))
// Flex factors are percentages, so they always add up to at least 1 and fill the bar.

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

// Segments: a reading lights whole blocks; anything above zero lights at least one.
const reading = computed(() => Math.max(0, props.value ?? sum.value))
const blocks = computed(() => Math.max(1, Math.round(props.count)))
const lit = computed(() => {
  if (reading.value <= 0) return 0
  return Math.min(blocks.value, Math.max(1, Math.round((reading.value / scale.value) * blocks.value)))
})
const readingLabel = computed(
  () => props.label ?? `${formatNumber(Math.min(100, percent(reading.value)), { maximumFractionDigits: 0 })}%`,
)

const grown = ref(false)
onMounted(() => requestAnimationFrame(() => (grown.value = true)))

const thickness = computed(() => props.height ?? (props.variant === 'ticks' ? 32 : props.variant === 'segments' ? 12 : 8))
</script>

<template>
  <div class="r-meter" :class="[`r-meter--${variant}`, { 'is-grown': grown }]">
    <div v-if="variant === 'bar'" class="r-meter__bar" role="img" :aria-label="ariaLabel" :style="{ height: `${thickness}px` }">
      <template v-for="(s, i) in items" :key="i">
        <span
          v-if="s.value > 0"
          class="r-meter__segment"
          :style="{ flexGrow: grown ? percent(s.value) : 0, background: s.color }"
        />
      </template>
      <span v-if="rest > 0" class="r-meter__rest" :style="{ flexGrow: percent(rest) }" />
    </div>

    <div v-else-if="variant === 'ticks'" class="r-meter__ticks" role="img" :aria-label="ariaLabel" :style="{ height: `${thickness}px` }">
      <span
        v-for="(color, i) in tickColors"
        :key="i"
        class="r-meter__tick"
        :style="{ background: color, transitionDelay: `${i * 4}ms` }"
      />
    </div>

    <div
      v-else
      class="r-meter__blocks"
      :class="`r-tone-${tone}`"
      role="img"
      :aria-label="readingLabel"
      :style="{ height: `${thickness}px` }"
    >
      <span v-for="n in blocks" :key="n" class="r-meter__block" :class="{ 'is-lit': n <= lit }" />
    </div>

    <ul v-if="legendMode === 'inline' && items.length" class="r-meter__legend">
      <li v-for="(s, i) in items" :key="i">
        <span class="r-meter__swatch" :style="{ background: s.color }" />
        {{ s.label }}
      </li>
    </ul>
    <ul v-else-if="legendMode === 'list' && items.length" class="r-meter__list">
      <li v-for="(s, i) in items" :key="i">
        <span class="r-meter__swatch" :style="{ background: s.color }" />
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
  gap: 12px;
  min-width: 0;
}

/* Bar: square segments butt against each other with a 2px gap that shows the surface. The
   rest of the scale is the track, one step off the surface. */
.r-meter__bar,
.r-meter__ticks,
.r-meter__blocks {
  display: flex;
  align-items: stretch;
  gap: 2px;
}

.r-meter__segment,
.r-meter__rest {
  flex-shrink: 1;
  flex-basis: 0;
  min-width: 0;
}

.r-meter__segment {
  border-radius: var(--r-radius-mark);
  transition: flex-grow var(--r-duration-slower) var(--r-ease-out);
}

.r-meter__rest {
  background: var(--r-chart-track);
}

/* Ticks: thin square bars, like the scale of an instrument. */
.r-meter__tick {
  flex: 1;
  min-width: 2px;
  border-radius: var(--r-radius-mark);
  opacity: 0;
  transition: opacity var(--r-duration-base) var(--r-ease-out);
}
.r-meter.is-grown .r-meter__tick {
  opacity: 1;
}

@media (prefers-reduced-motion: reduce) {
  .r-meter__tick {
    transition-delay: 0ms !important;
  }
}

/* Segments: an LED bar. Equal blocks; the lit ones take the tone colour. */
.r-meter__block {
  flex: 1;
  min-width: 2px;
  border-radius: var(--r-radius-mark);
  background: var(--r-chart-track);
  transition: background-color var(--r-duration-fast) var(--r-ease-out);
}
/* Lit blocks are marks, so they take the lamp colour (3:1 on every surface), not the fill. */
.r-meter__block.is-lit {
  background: var(--tone-lamp, var(--tone-solid));
}

.r-meter__legend {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 16px;
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.r-meter__legend li {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.r-meter__swatch {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  border-radius: var(--r-radius-mark);
}

.r-meter__list {
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--r-border-subtle);
}
.r-meter__list li {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 32px;
  padding: 6px 0;
  border-bottom: 1px solid var(--r-border-subtle);
  font-size: var(--r-text-sm);
}
.r-meter__list-label {
  flex: 1;
  min-width: 0;
  color: var(--r-text);
  line-height: 1.3;
}
.r-meter__list-value,
.r-meter__list-percent {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.r-meter__list-value {
  color: var(--r-text-tertiary);
}
.r-meter__list-percent {
  min-width: 40px;
  color: var(--r-text);
  text-align: right;
}
</style>
