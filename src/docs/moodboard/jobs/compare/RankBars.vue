<script setup lang="ts">
/**
 * Ranked, with a switch: a bar list in order of the chosen measure. Switch the measure and the
 * list re-ranks, the bars sliding to their new lengths, because the leader by one measure is
 * rarely the leader by the other.
 */
import { computed, ref } from 'vue'
import { RBarList } from '@/design-system'
import { fmt, type Fmt } from './shared'
import Keys from './Keys.vue'

interface Metric {
  key: string
  label: string
  values: number[]
  format?: Fmt
  unit?: string
}

const props = defineProps<{
  label: string
  names: string[]
  metrics: Metric[]
}>()

const key = ref(props.metrics[0].key)
const metric = computed(() => props.metrics.find((m) => m.key === key.value) ?? props.metrics[0])
const options = computed(() => props.metrics.map((m) => ({ value: m.key, label: m.label })))

const items = computed(() =>
  props.names
    .map((label, i) => ({ label, values: metric.value.values[i] }))
    .sort((a, b) => b.values - a.values),
)
const total = computed(() => metric.value.values.reduce((a, b) => a + b, 0))
const leader = computed(() => items.value[0])
const valueText = (v: number) => fmt(v, metric.value.format)
</script>

<template>
  <div class="mk cmp rank">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ label }}</span>
      <Keys v-model="key" :options="options" label="Rank by" />
    </div>
    <p class="rank__read">
      <span class="rank__lead">{{ leader.label }}</span>
      leads with {{ fmt((leader.values / Math.max(1, total)) * 100, { kind: 'pct', decimals: 0 }) }} of
      {{ valueText(total) }}{{ metric.unit ? ` ${metric.unit}` : '' }}
    </p>
    <div class="rank__plot mk-grow">
      <RBarList
        :items="items"
        :format="valueText"
        :bar-height="10"
        axis
        :label="`${label}, ranked by ${metric.label}`"
      />
    </div>
  </div>
</template>

<style scoped>
.rank {
  gap: 8px;
}

.rank__read {
  min-width: 0;
  overflow: hidden;
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rank__lead {
  color: var(--r-text);
  font-weight: var(--r-weight-semibold);
}

.rank__plot {
  min-height: 0;
  overflow: hidden;
}

.rank__plot :deep(.r-bar-list__label) {
  max-width: 120px;
  font-size: var(--r-text-xs);
}
</style>
