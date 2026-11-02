<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import RTrend from './RTrend.vue'
import { prefersReducedMotion } from '../composables/dom'
import { formatNumber, formatNumberParts } from '../composables/format'

const props = withDefaults(
  defineProps<{
    label?: string
    value: number | string
    prefix?: string
    /** Same size as the number, e.g. "%". */
    suffix?: string
    /** Smaller and muted after the number, e.g. "bpm" or "kcal". */
    unit?: string
    decimals?: number
    /** Mutes the fraction: $25,912.43 with ".43" quieter. */
    mutedDecimals?: boolean
    trend?: number
    trendLabel?: string
    invertTrend?: boolean
    size?: 'md' | 'lg' | 'xl'
    /** Count up from the previous value. Skipped under reduced motion. */
    animate?: boolean
    locale?: string
  }>(),
  { decimals: 0, size: 'lg' },
)

defineSlots<{ label?(): unknown; footer?(): unknown }>()

const shown = ref(typeof props.value === 'number' && !props.animate ? props.value : 0)
let frame = 0

function run(from: number, to: number) {
  cancelAnimationFrame(frame)
  if (!props.animate || prefersReducedMotion()) {
    shown.value = to
    return
  }
  const start = performance.now()
  const duration = 900
  const tick = (now: number) => {
    const t = Math.min(1, (now - start) / duration)
    const eased = 1 - Math.pow(1 - t, 3)
    shown.value = from + (to - from) * eased
    if (t < 1) frame = requestAnimationFrame(tick)
  }
  frame = requestAnimationFrame(tick)
}

watch(
  () => props.value,
  (value, previous) => {
    if (typeof value === 'number') run(typeof previous === 'number' ? previous : 0, value)
  },
  { immediate: true },
)

onBeforeUnmount(() => cancelAnimationFrame(frame))

const numberOptions = computed(() => ({
  locale: props.locale,
  minimumFractionDigits: props.decimals,
  maximumFractionDigits: props.decimals,
}))

function partsOf(value: number | string) {
  return typeof value === 'number' ? formatNumberParts(value, numberOptions.value) : { integer: value, fraction: '' }
}

const live = computed(() => partsOf(typeof props.value === 'number' ? shown.value : props.value))
const final = computed(() => partsOf(props.value))

const spoken = computed(() => {
  const number = typeof props.value === 'number' ? formatNumber(props.value, numberOptions.value) : props.value
  return [props.prefix, number, props.suffix, props.unit ? ` ${props.unit}` : ''].filter(Boolean).join('')
})
</script>

<template>
  <div class="r-stat" :class="`r-stat--${size}`">
    <div v-if="label || $slots.label" class="r-stat__label"><slot name="label">{{ label }}</slot></div>
    <div class="r-stat__value">
      <span class="r-sr-only">{{ spoken }}</span>
      <span class="r-stat__number" aria-hidden="true">
        <!-- The final value, invisible, reserves the width so the count-up doesn't push things around. -->
        <span class="r-stat__ghost">{{ prefix }}{{ final.integer }}{{ final.fraction }}{{ suffix }}</span>
        <span class="r-stat__live">
          {{ prefix }}{{ live.integer }}<span v-if="live.fraction" :class="{ 'r-stat__muted': mutedDecimals }">{{ live.fraction }}</span>{{ suffix }}
        </span>
      </span>
      <span v-if="unit" class="r-stat__unit" aria-hidden="true">{{ unit }}</span>
    </div>
    <div v-if="trend !== undefined || trendLabel || $slots.footer" class="r-stat__footer">
      <RTrend v-if="trend !== undefined" :value="trend" :invert="invertTrend" />
      <span v-if="trendLabel" class="r-stat__trend-label">{{ trendLabel }}</span>
      <slot name="footer" />
    </div>
  </div>
</template>

<style>
.r-stat {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.r-stat__label {
  color: var(--r-text-secondary);
  font-size: var(--r-text-md);
  font-weight: var(--r-weight-medium);
}

.r-stat__value {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  column-gap: 6px;
  color: var(--r-text);
  font-size: var(--r-text-4xl);
  font-weight: var(--r-weight-semibold);
  font-variant-numeric: tabular-nums;
  line-height: 1.05;
  letter-spacing: var(--r-tracking-tighter);
}

.r-stat--md .r-stat__value {
  font-size: var(--r-text-2xl);
  letter-spacing: var(--r-tracking-tight);
}
.r-stat--md .r-stat__label {
  font-size: var(--r-text-sm);
}
.r-stat--xl .r-stat__value {
  font-size: clamp(var(--r-text-4xl), 6vw, var(--r-text-5xl));
}

.r-stat__number {
  display: inline-grid;
}
.r-stat__number > * {
  grid-area: 1 / 1;
  white-space: nowrap;
}
.r-stat__ghost {
  visibility: hidden;
}

.r-stat__muted {
  color: var(--r-text-tertiary);
}

.r-stat__unit {
  color: var(--r-text-tertiary);
  font-size: 0.5em;
  font-weight: var(--r-weight-medium);
  letter-spacing: var(--r-tracking-snug);
}

.r-stat__footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.r-stat__trend-label {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-sm);
}
</style>
