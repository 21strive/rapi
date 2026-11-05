<script setup lang="ts">
/**
 * Low to high, per day: the library range bars, each day's spread from its low to its high with
 * the average dashed across. Switch the place or the series to compare spreads; the readout
 * names the widest day.
 */
import { computed, ref } from 'vue'
import { RRangeBars, useElementSize } from '@/design-system'
import { fmt, type Fmt } from './shared'
import Keys from './Keys.vue'

interface RangeSet {
  key: string
  label: string
  ranges: [number, number][]
  average?: number
}

const props = withDefaults(
  defineProps<{
    label: string
    unit?: string
    labels: string[]
    sets: RangeSet[]
    format?: Fmt
    min?: number
    max?: number
  }>(),
  { format: () => ({}) },
)

const key = ref(props.sets[0].key)
const set = computed(() => props.sets.find((s) => s.key === key.value) ?? props.sets[0])
const options = computed(() => props.sets.map((s) => ({ value: s.key, label: s.label })))
const widest = computed(() => {
  let best = 0
  set.value.ranges.forEach(([a, b], i) => {
    const [x, y] = set.value.ranges[best]
    if (b - a > y - x) best = i
  })
  return best
})
const plot = ref<HTMLElement | null>(null)
const { height } = useElementSize(plot)
const valueText = (v: number) => fmt(v, props.format)
</script>

<template>
  <div class="mk cmp ranges">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ label }}</span>
      <Keys v-model="key" :options="options" :label="`${label}: series`" />
    </div>
    <p class="ranges__read">
      Widest <span class="ranges__strong">{{ labels[widest] }}</span>
      {{ valueText(set.ranges[widest][0]) }}–{{ valueText(set.ranges[widest][1]) }}{{ unit ? ` ${unit}` : '' }}
      <span class="ranges__note">{{ fmt(set.ranges[widest][1] - set.ranges[widest][0], format) }}{{ unit ? ` ${unit}` : '' }} apart</span>
    </p>
    <div ref="plot" class="ranges__plot">
      <RRangeBars
        v-if="height > 80"
        :labels="labels"
        :ranges="set.ranges"
        :average="set.average"
        :unit="unit"
        :min="min"
        :max="max"
        :height="Math.floor(height)"
        :format="valueText"
        :label="`${label}, ${set.label}`"
      />
    </div>
  </div>
</template>

<style scoped>
.ranges {
  gap: 8px;
}

.ranges__read {
  min-width: 0;
  overflow: hidden;
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-variant-numeric: tabular-nums;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ranges__strong {
  color: var(--r-text);
  font-family: var(--r-font-sans);
  font-size: var(--r-text-xs);
  font-weight: var(--r-weight-semibold);
}

.ranges__note {
  margin-left: 6px;
  color: var(--r-text-tertiary);
}

.ranges__plot {
  flex: 1 1 0;
  min-height: 0;
}
</style>
