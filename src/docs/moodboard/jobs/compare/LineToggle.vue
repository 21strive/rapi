<script setup lang="ts">
/**
 * Lines you can switch: a few series on one plot, each with a toggle chip that doubles as its
 * legend. A series keeps its colour slot when the others are hidden, and the last one can't be
 * switched off, so the plot is never empty.
 */
import { computed, ref } from 'vue'
import { RChip, RLineChart, useElementSize, type ChartReference } from '@/design-system'
import { fmt, slot, type Fmt } from './shared'

interface Series {
  name: string
  values: (number | null)[]
}

const props = withDefaults(
  defineProps<{
    label: string
    /** Quiet text at the right of the head: the window, the zone. */
    note?: string
    yUnit?: string
    labels: string[]
    series: Series[]
    curve?: 'linear' | 'step' | 'monotone'
    references?: ChartReference[]
    format?: Fmt
    axis?: Fmt
    endLabels?: boolean
    now?: number | null
    min?: number
    max?: number
    /** Indexes of the series shown at first. Defaults to all. */
    initial?: number[]
  }>(),
  { curve: 'linear', format: () => ({}), now: null },
)

const shown = ref(props.series.map((_, i) => (props.initial ? props.initial.includes(i) : true)))
const count = computed(() => shown.value.filter(Boolean).length)
const visible = computed(() =>
  props.series.map((s, i) => ({ ...s, color: slot(i) })).filter((_, i) => shown.value[i]),
)

function toggle(i: number) {
  if (shown.value[i] && count.value === 1) return
  shown.value = shown.value.map((on, k) => (k === i ? !on : on))
}

const plot = ref<HTMLElement | null>(null)
const { height } = useElementSize(plot)
const valueText = (v: number) => fmt(v, props.format)
const axisText = (v: number) => fmt(v, props.axis ?? props.format)
</script>

<template>
  <div class="mk cmp line-toggle">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ label }}</span>
      <span v-if="note" class="r-label line-toggle__note">{{ note }}</span>
    </div>
    <div class="line-toggle__keys" role="group" :aria-label="`Series on ${label}`">
      <RChip
        v-for="(s, i) in series"
        :key="s.name"
        size="sm"
        :selected="shown[i]"
        @click="toggle(i)"
      >
        <template #leading>
          <span class="line-toggle__swatch" :class="{ 'is-off': !shown[i] }" :style="{ '--swatch': slot(i) }" />
        </template>
        {{ s.name }}
      </RChip>
    </div>
    <div ref="plot" class="line-toggle__plot">
      <RLineChart
        v-if="height > 60"
        :labels="labels"
        :series="visible"
        :height="Math.floor(height)"
        :curve="curve"
        :references="references"
        :y-unit="yUnit"
        :end-labels="endLabels"
        :now="now"
        :min="min"
        :max="max"
        :legend="false"
        :area="false"
        :format="valueText"
        :axis-format="axisText"
        :label="`${label}${yUnit ? `, ${yUnit}` : ''}`"
      />
    </div>
  </div>
</template>

<style scoped>
.line-toggle {
  gap: 8px;
}

.line-toggle__note {
  flex: none;
}

.line-toggle__keys {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.line-toggle__swatch {
  width: 12px;
  height: 2px;
  background: var(--swatch);
}

.line-toggle__swatch.is-off {
  background: var(--r-border-strong);
}

.line-toggle__plot {
  flex: 1 1 0;
  min-height: 0;
}
</style>
