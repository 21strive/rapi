<script setup lang="ts">
/**
 * From one total to the next: the library waterfall, the steps between an opening and a closing
 * figure. Switch the period to see which step moved; the readout gives the net change.
 */
import { computed, ref } from 'vue'
import { RWaterfallChart, useElementSize, type WaterfallStep } from '@/design-system'
import { change, delta, fmt, type Fmt } from './shared'
import Keys from './Keys.vue'

interface Period {
  key: string
  label: string
  steps: WaterfallStep[]
}

const props = withDefaults(
  defineProps<{
    label: string
    unit?: string
    periods: Period[]
    format?: Fmt
    axis?: Fmt
  }>(),
  { format: () => ({}) },
)

const key = ref(props.periods[props.periods.length - 1].key)
const period = computed(() => props.periods.find((p) => p.key === key.value) ?? props.periods[0])
const options = computed(() => props.periods.map((p) => ({ value: p.key, label: p.label })))

const opening = computed(() => period.value.steps[0]?.value ?? 0)
const closing = computed(() =>
  period.value.steps.reduce((run, s, i) => (s.kind === 'total' ? (i === 0 ? s.value : run) : run + s.value), 0),
)
const biggest = computed(() =>
  period.value.steps
    .filter((s) => s.kind !== 'total')
    .reduce((a, b) => (Math.abs(b.value) > Math.abs(a.value) ? b : a), { label: '', value: 0 } as WaterfallStep),
)

const plot = ref<HTMLElement | null>(null)
const { height } = useElementSize(plot)
const valueText = (v: number) => fmt(v, props.format)
const axisText = (v: number) => fmt(v, props.axis ?? props.format)
const signedText = (v: number) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${fmt(Math.abs(v), props.format)}`
</script>

<template>
  <div class="mk cmp bridge">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ label }}</span>
      <Keys v-model="key" :options="options" label="Period" />
    </div>
    <p class="bridge__read">
      <span class="bridge__strong">{{ valueText(opening) }} → {{ valueText(closing) }}{{ unit ? ` ${unit}` : '' }}</span>
      <span>{{ delta(change(opening, closing)) }}</span>
      <span class="bridge__most">Largest step {{ biggest.label }} {{ signedText(biggest.value) }}</span>
    </p>
    <div ref="plot" class="bridge__plot">
      <RWaterfallChart
        v-if="height > 90"
        :steps="period.steps"
        :height="Math.floor(height) - 28"
        :format="valueText"
        :axis-format="axisText"
        :label="`${label}, ${period.label}${unit ? `, ${unit}` : ''}`"
      />
    </div>
  </div>
</template>

<style scoped>
.bridge {
  gap: 8px;
}

.bridge__read {
  display: flex;
  align-items: baseline;
  gap: 8px;
  min-width: 0;
  overflow: hidden;
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.bridge__strong {
  color: var(--r-text);
  font-size: var(--r-text-xs);
  font-weight: var(--r-weight-semibold);
}

.bridge__most {
  min-width: 0;
  overflow: hidden;
  color: var(--r-text-tertiary);
  text-overflow: ellipsis;
}

.bridge__plot {
  flex: 1 1 0;
  min-height: 0;
}
</style>
