<script setup lang="ts">
/**
 * This year over last: the current year in cobalt, an earlier year in context grey on the same
 * axis, the present as the orange NOW line and what is left of the year as a hatched forecast.
 * Switch which year sits behind, or none, and the readout compares the two at NOW.
 */
import { computed, ref } from 'vue'
import { RLineChart, useElementSize, type ChartReference } from '@/design-system'
import { change, delta, fmt, type Fmt } from './shared'
import Keys from './Keys.vue'

interface Year {
  name: string
  values: (number | null)[]
}

const props = withDefaults(
  defineProps<{
    label: string
    yUnit?: string
    labels: string[]
    current: Year
    previous: Year[]
    now?: number | null
    forecastFrom?: number | null
    references?: ChartReference[]
    format?: Fmt
    axis?: Fmt
    min?: number
  }>(),
  { format: () => ({}), now: null, forecastFrom: null },
)

const against = ref(props.previous[0]?.name ?? 'none')
const options = computed(() => [
  ...props.previous.map((p) => ({ value: p.name, label: p.name })),
  { value: 'none', label: 'None' },
])
const behind = computed(() => props.previous.find((p) => p.name === against.value) ?? null)

const series = computed(() => [
  ...(behind.value ? [{ ...behind.value, color: 'var(--r-chart-context)', solid: true }] : []),
  { ...props.current, color: 'var(--r-chart-1)' },
])

const at = computed(() => {
  if (props.now != null) return props.now
  let i = props.current.values.length - 1
  while (i > 0 && props.current.values[i] == null) i--
  return i
})
const nowValue = computed(() => props.current.values[at.value] ?? 0)
const thenValue = computed(() => behind.value?.values[at.value] ?? null)

const plot = ref<HTMLElement | null>(null)
const { height } = useElementSize(plot)
const valueText = (v: number) => fmt(v, props.format)
const axisText = (v: number) => fmt(v, props.axis ?? props.format)
</script>

<template>
  <div class="mk cmp last-year">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ label }}</span>
      <Keys v-model="against" :options="options" label="Compare with" />
    </div>
    <p class="last-year__read">
      <span class="last-year__key"><i class="is-now" />{{ current.name }}</span>
      <span class="last-year__strong">{{ fmt(nowValue, format) }}{{ yUnit ? ` ${yUnit}` : '' }}</span>
      <template v-if="behind && thenValue != null">
        <span class="last-year__key"><i class="is-then" />{{ behind.name }}</span>
        <span>{{ fmt(thenValue, format) }}</span>
        <span class="last-year__delta">{{ delta(change(thenValue, nowValue)) }}</span>
      </template>
      <span class="last-year__at">at {{ labels[at] }}</span>
    </p>
    <div ref="plot" class="last-year__plot">
      <RLineChart
        v-if="height > 60"
        :labels="labels"
        :series="series"
        :height="Math.floor(height)"
        :now="now"
        :forecast-from="forecastFrom"
        :references="references"
        :y-unit="yUnit"
        :min="min"
        :legend="false"
        :area="false"
        :format="valueText"
        :axis-format="axisText"
        :label="`${label}: ${current.name}${behind ? ` against ${behind.name}` : ''}`"
      />
    </div>
  </div>
</template>

<style scoped>
.last-year {
  gap: 8px;
}

.last-year__read {
  display: flex;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
  overflow: hidden;
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.last-year__key {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--r-text-tertiary);
  letter-spacing: 0.04em;
}

.last-year__key i {
  width: 12px;
  height: 2px;
  transform: translateY(-3px);
}

.last-year__key i.is-now {
  background: var(--r-chart-1);
}

.last-year__key i.is-then {
  background: var(--r-chart-context);
}

.last-year__strong {
  color: var(--r-text);
  font-size: var(--r-text-xs);
  font-weight: var(--r-weight-semibold);
}

.last-year__delta {
  color: var(--r-text);
  font-weight: var(--r-weight-semibold);
}

.last-year__at {
  margin-left: auto;
  color: var(--r-text-tertiary);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.last-year__plot {
  flex: 1 1 0;
  min-height: 0;
}
</style>
