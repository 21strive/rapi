<script setup lang="ts">
/**
 * Two measures at once: the library scatter, each point one item, the outliers named on the
 * plot and a dashed limit across it. Show all groups or one; a group keeps its colour slot when
 * it stands alone. The readout counts what is past the limit.
 */
import { computed, ref } from 'vue'
import { RScatterChart, useElementSize, type ChartReference, type ScatterSeries } from '@/design-system'
import { fmt, slot, type Fmt } from './shared'
import Keys from './Keys.vue'

const props = withDefaults(
  defineProps<{
    label: string
    xLabel: string
    yLabel: string
    series: ScatterSeries[]
    xReferences?: ChartReference[]
    yReferences?: ChartReference[]
    formatX?: Fmt
    formatY?: Fmt
    /** Words for the readout: "names over the limit". */
    over?: string
  }>(),
  { formatX: () => ({}), formatY: () => ({}), over: 'over the limit' },
)

const focus = ref('all')
const options = computed(() => [{ value: 'all', label: 'All' }, ...props.series.map((s) => ({ value: s.name, label: s.name }))])
const shown = computed(() =>
  props.series.map((s, i) => ({ ...s, color: slot(i) })).filter((s) => focus.value === 'all' || s.name === focus.value),
)
const limit = computed(() => props.yReferences?.[0]?.value ?? null)
const past = computed(() =>
  limit.value == null ? 0 : shown.value.reduce((n, s) => n + s.points.filter((p) => p.y > (limit.value as number)).length, 0),
)
const count = computed(() => shown.value.reduce((n, s) => n + s.points.length, 0))

const plot = ref<HTMLElement | null>(null)
const { height } = useElementSize(plot)
const legendH = computed(() => (shown.value.length > 1 ? 28 : 0))
const fx = (v: number) => fmt(v, props.formatX)
const fy = (v: number) => fmt(v, props.formatY)
</script>

<template>
  <div class="mk cmp scatter">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ label }}</span>
      <Keys v-model="focus" :options="options" label="Show" />
    </div>
    <p class="scatter__read">
      <span class="scatter__strong">{{ count }}</span> shown
      <template v-if="limit != null">
        <span class="scatter__strong">{{ past }}</span> {{ over }}
      </template>
    </p>
    <div ref="plot" class="scatter__plot">
      <RScatterChart
        v-if="height > 90"
        :series="shown"
        :x-label="xLabel"
        :y-label="yLabel"
        :x-references="xReferences"
        :y-references="yReferences"
        :height="Math.floor(height) - legendH"
        :format-x="fx"
        :format-y="fy"
        label-points
        :label="`${label}: ${yLabel} against ${xLabel}`"
      />
    </div>
  </div>
</template>

<style scoped>
.scatter {
  gap: 8px;
}

.scatter__read {
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
}

.scatter__strong {
  margin-left: 6px;
  color: var(--r-text);
  font-family: var(--r-font-mono);
  font-weight: var(--r-weight-semibold);
  font-variant-numeric: tabular-nums;
}

.scatter__strong:first-child {
  margin-left: 0;
}

.scatter__plot {
  flex: 1 1 0;
  min-height: 0;
}
</style>
