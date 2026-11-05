<script setup lang="ts">
/**
 * Hour by day: the library heatmap, a week of hours in the stepped cobalt scale. Switch the
 * measure to see whether the busy hours and the troubled hours are the same ones; the readout
 * names the peak.
 */
import { computed, ref } from 'vue'
import { RHeatmap, useElementSize } from '@/design-system'
import { fmt, type Fmt } from './shared'
import Keys from './Keys.vue'

interface Metric {
  key: string
  label: string
  values: number[][]
  format?: Fmt
  unit?: string
}

const props = defineProps<{
  label: string
  rows: string[]
  cols: string[]
  /** Full column names for the readout: "10:00". */
  colNames?: string[]
  metrics: Metric[]
  /** Quiet text after the peak: the zone. */
  note?: string
}>()

const key = ref(props.metrics[0].key)
const metric = computed(() => props.metrics.find((m) => m.key === key.value) ?? props.metrics[0])
const options = computed(() => props.metrics.map((m) => ({ value: m.key, label: m.label })))

const peak = computed(() => {
  let best = { r: 0, c: 0, v: -Infinity }
  metric.value.values.forEach((row, r) =>
    row.forEach((v, c) => {
      if (v > best.v) best = { r, c, v }
    }),
  )
  return best
})

const box = ref<HTMLElement | null>(null)
const { height } = useElementSize(box)
/* The heatmap sizes itself from its cell height: rows of cells, a 22px axis and a legend row. */
const cell = computed(() => Math.max(8, Math.min(30, Math.floor((height.value - 24 - 30 - (props.rows.length - 1) * 2) / props.rows.length))))
const valueText = (v: number) => fmt(v, metric.value.format)
</script>

<template>
  <div class="mk cmp heat">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ label }}</span>
      <Keys v-model="key" :options="options" label="Measure" />
    </div>
    <p class="heat__read">
      Peak <span class="heat__strong">{{ rows[peak.r] }} {{ (colNames ?? cols)[peak.c] }}</span>
      {{ valueText(peak.v) }}{{ metric.unit ? ` ${metric.unit}` : '' }}
      <span v-if="note" class="heat__note">{{ note }}</span>
    </p>
    <div ref="box" class="heat__plot">
      <RHeatmap
        v-if="height > 80"
        :rows="rows"
        :cols="cols"
        :values="metric.values"
        :cell-height="cell"
        :format="valueText"
        :label="`${label}, ${metric.label}`"
      />
    </div>
  </div>
</template>

<style scoped>
.heat {
  gap: 8px;
}

.heat__read {
  min-width: 0;
  overflow: hidden;
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-variant-numeric: tabular-nums;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.heat__strong {
  color: var(--r-text);
  font-family: var(--r-font-sans);
  font-size: var(--r-text-xs);
  font-weight: var(--r-weight-semibold);
}

.heat__note {
  margin-left: 6px;
  color: var(--r-text-tertiary);
}

.heat__plot {
  flex: 1 1 0;
  min-height: 0;
}
</style>
