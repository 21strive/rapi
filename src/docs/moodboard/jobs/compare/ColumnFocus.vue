<script setup lang="ts">
/**
 * Columns, one in focus: the library column chart with one column held in cobalt and the rest in
 * context grey, read against its target tick. Click a column or step with the buttons; the
 * readout says how far it sits from its target and from the average.
 */
import { computed, ref } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { RColumnChart, RIconButton, useElementSize, type ChartReference } from '@/design-system'
import { change, delta, fmt, type Fmt } from './shared'

const props = withDefaults(
  defineProps<{
    label: string
    yUnit?: string
    labels: string[]
    /** Full names for the readout: "Thu 12 Nov". */
    names: string[]
    values: number[]
    targets?: number[] | number
    references?: ChartReference[]
    format?: Fmt
    axis?: Fmt
    /** Drop the y axis when the caps carry the values, so every column keeps its label. */
    hideYAxis?: boolean
    /** Values on the column caps; off when a reference line would run through them. */
    showValues?: boolean
    initial?: number
  }>(),
  /* Absent booleans are cast to false; undefined lets the chart choose (values on up to 12 columns). */
  { format: () => ({}), showValues: undefined },
)

const hl = ref(props.initial ?? props.values.length - 1)
const n = computed(() => props.values.length)
const avg = computed(() => props.values.reduce((a, b) => a + b, 0) / Math.max(1, n.value))
const target = computed(() => (Array.isArray(props.targets) ? props.targets[hl.value] : props.targets))

const plot = ref<HTMLElement | null>(null)
const { height } = useElementSize(plot)

/* The chart's plot starts 48px in (4px without its y axis) and ends 4px from the right; a click
   maps to the column band under it. */
function onClick(event: MouseEvent) {
  const svg = plot.value?.querySelector('svg')
  if (!svg) return
  const box = svg.getBoundingClientRect()
  const left = props.hideYAxis ? 4 : 48
  const band = (box.width - left - 4) / n.value
  const i = Math.floor((event.clientX - box.left - left) / band)
  if (i >= 0 && i < n.value) hl.value = i
}

const step = (d: number) => (hl.value = (hl.value + d + n.value) % n.value)
const valueText = (v: number) => fmt(v, props.format)
const axisText = (v: number) => fmt(v, props.axis ?? props.format)
</script>

<template>
  <div class="mk cmp col-focus">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ label }}</span>
      <span class="col-focus__steps">
        <RIconButton label="Previous column" size="xs" variant="ghost" @click="step(-1)"><ChevronLeft /></RIconButton>
        <RIconButton label="Next column" size="xs" variant="ghost" @click="step(1)"><ChevronRight /></RIconButton>
      </span>
    </div>
    <p class="col-focus__read" aria-live="polite">
      <span class="col-focus__name">{{ names[hl] }}</span>
      <span class="col-focus__value">{{ fmt(values[hl], format) }}{{ yUnit ? ` ${yUnit}` : '' }}</span>
      <span v-if="target != null">{{ delta(change(target, values[hl]), 0) }} vs target</span>
      <span>{{ delta(change(avg, values[hl]), 0) }} vs avg</span>
    </p>
    <div ref="plot" class="col-focus__plot" @click="onClick">
      <RColumnChart
        v-if="height > 60"
        :labels="labels"
        :values="values"
        :targets="targets"
        :references="references"
        :highlight="hl"
        :hide-y-axis="hideYAxis"
        :show-values="showValues"
        :height="Math.floor(height)"
        :y-unit="yUnit"
        :format="valueText"
        :axis-format="axisText"
        :label="label"
      />
    </div>
  </div>
</template>

<style scoped>
.col-focus {
  gap: 6px;
}

.col-focus__steps {
  display: inline-flex;
  flex: none;
  gap: 2px;
  margin: -4px -4px -4px 0;
}

.col-focus__read {
  display: flex;
  align-items: baseline;
  gap: 8px;
  min-width: 0;
  overflow: hidden;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.col-focus__name {
  color: var(--r-text);
  font-family: var(--r-font-sans);
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-semibold);
}

.col-focus__value {
  color: var(--r-text);
  font-size: var(--r-text-xs);
  font-weight: var(--r-weight-semibold);
}

.col-focus__plot {
  flex: 1 1 0;
  min-height: 0;
  cursor: pointer;
}
</style>
