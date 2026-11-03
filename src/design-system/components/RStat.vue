<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import RTrend from './RTrend.vue'
import { prefersReducedMotion, useElementSize } from '../composables/dom'
import { formatNumber, formatNumberParts } from '../composables/format'

const props = withDefaults(
  defineProps<{
    /** Mono caps above the number. */
    label?: string
    value: number | string
    /** Before the number, smaller, e.g. "$". */
    prefix?: string
    /** After the number, smaller, e.g. "%". */
    suffix?: string
    /** Mono caps after the number, e.g. "RPS", "kcal" or "IDR". */
    unit?: string
    decimals?: number
    /** Mutes the fraction: $25,912.43 with ".43" quieter. */
    mutedDecimals?: boolean
    trend?: number
    /** Unit after the trend figure. Default "%"; "pp" for percentage points. */
    trendSuffix?: string
    trendLabel?: string
    invertTrend?: boolean
    /** Number at 24, 40 or 56px. */
    size?: 'md' | 'lg' | 'xl'
    /** Count up from the previous value. Skipped under reduced motion. */
    animate?: boolean
    /** Shrink the number (down to half size) when it would not fit its container. */
    fit?: boolean
    locale?: string
  }>(),
  { decimals: 0, size: 'lg', fit: true },
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

/* Big numbers in narrow cards: measure the value row and scale the type down until it fits. */
const root = ref<HTMLElement | null>(null)
const valueRow = ref<HTMLElement | null>(null)
const scale = ref(1)
const { width: rootWidth } = useElementSize(root)

function fitValue() {
  const row = valueRow.value
  const box = root.value
  if (!row || !box || !props.fit) {
    scale.value = 1
    return
  }
  const natural = row.scrollWidth / scale.value
  const available = box.clientWidth
  scale.value = natural > available + 0.5 ? Math.max(0.5, available / natural) : 1
}

watch([rootWidth, () => props.value, () => props.prefix, () => props.suffix, () => props.unit, () => props.size], () =>
  nextTick(fitValue),
)
const final = computed(() => partsOf(props.value))

const spoken = computed(() => {
  const number = typeof props.value === 'number' ? formatNumber(props.value, numberOptions.value) : props.value
  return [props.prefix, number, props.suffix, props.unit ? ` ${props.unit}` : ''].filter(Boolean).join('')
})
</script>

<template>
  <div ref="root" class="r-stat" :class="`r-stat--${size}`" :style="scale < 1 ? { '--r-stat-scale': scale } : undefined">
    <div v-if="label || $slots.label" class="r-stat__label"><slot name="label">{{ label }}</slot></div>
    <div ref="valueRow" class="r-stat__value">
      <span class="r-sr-only">{{ spoken }}</span>
      <span class="r-stat__number" aria-hidden="true">
        <!-- The final value, invisible, reserves the width so the count-up doesn't push things around. -->
        <span class="r-stat__ghost"><span v-if="prefix" class="r-stat__affix r-stat__affix--prefix">{{ prefix }}</span>{{ final.integer }}{{ final.fraction }}<span v-if="suffix" class="r-stat__affix r-stat__affix--suffix">{{ suffix }}</span></span>
        <span class="r-stat__live"><span v-if="prefix" class="r-stat__affix r-stat__affix--prefix">{{ prefix }}</span>{{ live.integer }}<span v-if="live.fraction" :class="{ 'r-stat__muted': mutedDecimals }">{{ live.fraction }}</span><span v-if="suffix" class="r-stat__affix r-stat__affix--suffix">{{ suffix }}</span></span>
      </span>
      <span v-if="unit" class="r-stat__unit" aria-hidden="true">{{ unit }}</span>
    </div>
    <div v-if="trend !== undefined || trendLabel || $slots.footer" class="r-stat__footer">
      <RTrend v-if="trend !== undefined" :value="trend" :invert="invertTrend" :suffix="trendSuffix ?? '%'" />
      <span v-if="trendLabel" class="r-stat__trend-label">{{ trendLabel }}</span>
      <slot name="footer" />
    </div>
  </div>
</template>

<style>
.r-stat {
  --r-stat-size: var(--r-text-4xl);
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}
.r-stat--md {
  --r-stat-size: var(--r-text-2xl);
  gap: 6px;
}
.r-stat--xl {
  --r-stat-size: var(--r-text-5xl);
  gap: 10px;
}

/* The label is an eyebrow: Geist Mono capitals. */
.r-stat__label {
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-weight: var(--r-weight-semibold);
  line-height: 1.4;
  letter-spacing: var(--r-tracking-caps);
  text-transform: uppercase;
}

/* A hero figure: Geist SemiBold, display tracking, proportional digits. */
.r-stat__value {
  display: flex;
  align-items: baseline;
  column-gap: 6px;
  width: max-content;
  max-width: none;
  color: var(--r-text);
  font-size: calc(var(--r-stat-size) * var(--r-stat-scale, 1));
  font-weight: var(--r-weight-semibold);
  font-variant-numeric: proportional-nums;
  line-height: 1;
  letter-spacing: var(--r-tracking-display);
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

.r-stat__affix {
  color: var(--r-text-secondary);
  font-size: 0.6em;
  font-weight: var(--r-weight-medium);
  letter-spacing: 0;
}
.r-stat__affix--prefix {
  margin-right: 0.08em;
}
.r-stat__affix--suffix {
  margin-left: 0.06em;
}

.r-stat__muted {
  color: var(--r-text-tertiary);
}

/* Units in mono caps, small: 1,284 RPS. */
.r-stat__unit {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: max(var(--r-text-2xs), 0.28em);
  font-weight: var(--r-weight-medium);
  letter-spacing: 0.06em;
  /* Units keep their own case: ms is not Ms, µg is not MG. */
  text-transform: none;
}

.r-stat__footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.r-stat__trend-label {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}
</style>
