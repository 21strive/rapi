<script setup lang="ts">
/**
 * Against the target, row by row: the library bullet chart, several measures each with its own
 * target and bands. Switch the period; the readout counts how many met their target.
 */
import { computed, ref } from 'vue'
import { RBulletChart, type BulletRow } from '@/design-system'
import { fmt, type Fmt } from './shared'
import Keys from './Keys.vue'

interface Period {
  key: string
  label: string
  rows: BulletRow[]
}

const props = withDefaults(
  defineProps<{
    label: string
    periods: Period[]
    format?: Fmt
  }>(),
  { format: () => ({}) },
)

const key = ref(props.periods[props.periods.length - 1].key)
const period = computed(() => props.periods.find((p) => p.key === key.value) ?? props.periods[0])
const options = computed(() => props.periods.map((p) => ({ value: p.key, label: p.label })))
const met = computed(
  () =>
    period.value.rows.filter((r) => r.target != null && (r.lowerIsBetter ? r.value <= r.target : r.value >= r.target)).length,
)
const valueText = (v: number) => fmt(v, props.format)
</script>

<template>
  <div class="mk cmp bullets">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ label }}</span>
      <Keys v-model="key" :options="options" label="Period" />
    </div>
    <p class="bullets__read">
      <span class="bullets__strong">{{ met }} of {{ period.rows.length }}</span> on target in {{ period.label }}
    </p>
    <div class="bullets__plot mk-grow">
      <RBulletChart :rows="period.rows" :format="valueText" :label="`${label}, ${period.label}`" />
    </div>
  </div>
</template>

<style scoped>
.bullets {
  gap: 8px;
}

.bullets__read {
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
}

.bullets__strong {
  color: var(--r-text);
  font-weight: var(--r-weight-semibold);
}

.bullets__plot {
  min-height: 0;
  overflow: hidden;
}
</style>
