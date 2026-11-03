<script setup lang="ts">
import { computed } from 'vue'
import { ArrowDownRight, ArrowRight, ArrowUpRight } from 'lucide-vue-next'
import { formatNumber } from '../composables/format'

const props = withDefaults(
  defineProps<{
    /** The change itself, e.g. 1.9 for +1.9%. */
    value: number
    suffix?: string
    precision?: number
    /** Lower is better (costs, churn, response time): a drop turns green. */
    invert?: boolean
    /** `soft`: a tinted square tag. `plain`: coloured figures only. */
    variant?: 'soft' | 'plain'
    icon?: boolean
    /** sm 18px · md 20px. */
    size?: 'sm' | 'md'
  }>(),
  { suffix: '%', precision: 1, variant: 'soft', size: 'md' },
)

const direction = computed(() => (props.value > 0 ? 'up' : props.value < 0 ? 'down' : 'flat'))

const tone = computed(() => {
  if (direction.value === 'flat') return 'neutral'
  const good = props.invert ? props.value < 0 : props.value > 0
  return good ? 'success' : 'danger'
})

const amount = computed(() =>
  formatNumber(Math.abs(props.value), { minimumFractionDigits: props.precision, maximumFractionDigits: props.precision }),
)

// The true minus sign (U+2212), so the sign is as wide as the plus and reads as maths.
const shown = computed(() => {
  const sign = direction.value === 'up' ? '+' : direction.value === 'down' ? '−' : ''
  return `${sign}${amount.value}${props.suffix}`
})

const spoken = computed(() => {
  const word = direction.value === 'up' ? 'Up' : direction.value === 'down' ? 'Down' : 'No change,'
  return `${word} ${amount.value}${props.suffix}`
})

const Icon = computed(() =>
  direction.value === 'up' ? ArrowUpRight : direction.value === 'down' ? ArrowDownRight : ArrowRight,
)
</script>

<template>
  <span class="r-trend" :class="[`r-trend--${variant}`, `r-trend--${size}`, `r-tone-${tone}`]">
    <component :is="Icon" v-if="icon" />
    <span aria-hidden="true">{{ shown }}</span>
    <span class="r-sr-only">{{ spoken }}</span>
  </span>
</template>

<style>
.r-trend {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 2px;
  color: var(--tone-text);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-weight: var(--r-weight-medium);
  font-variant-numeric: tabular-nums;
  line-height: 1;
  letter-spacing: 0;
  white-space: nowrap;
}

/* Flat changes read in the secondary text colour, not the muted badge grey. */
.r-trend.r-tone-neutral {
  color: var(--r-text-secondary);
}

.r-trend svg {
  width: 12px;
  height: 12px;
  stroke-width: 2;
}

.r-trend--soft {
  height: 20px;
  padding: 0 6px;
  border-radius: var(--r-radius-mark);
  background: var(--tone-soft);
}

.r-trend--soft:has(svg) {
  padding-left: 4px;
}

.r-trend--sm {
  font-size: var(--r-text-3xs);
}
.r-trend--sm.r-trend--soft {
  height: 18px;
  padding: 0 5px;
}
.r-trend--sm.r-trend--soft:has(svg) {
  padding-left: 3px;
}
.r-trend--sm svg {
  width: 11px;
  height: 11px;
}
</style>
