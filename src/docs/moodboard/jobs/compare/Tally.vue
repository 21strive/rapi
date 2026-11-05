<script setup lang="ts">
/**
 * Counted in dots: the library dot matrix, each lit dot the same amount, stacked by group like a
 * tally on an LED panel. Switch a group off to compare the other on its own; groups keep their
 * colour slots. The readout gives the total of what is lit.
 */
import { computed, ref } from 'vue'
import { RChip, RDotMatrixChart, useElementSize } from '@/design-system'
import { fmt, slot, type Fmt } from './shared'

interface Group {
  name: string
  values: number[]
}

const props = withDefaults(
  defineProps<{
    label: string
    unit?: string
    labels: string[]
    ticks?: string[]
    series: Group[]
    shape?: 'dot' | 'pixel'
    format?: Fmt
    /** What one period is called in the readout: "a week". */
    per?: string
  }>(),
  { shape: 'dot', format: () => ({}), per: '' },
)

const shown = ref(props.series.map(() => true))
const count = computed(() => shown.value.filter(Boolean).length)
const visible = computed(() => props.series.map((s, i) => ({ ...s, color: slot(i) })).filter((_, i) => shown.value[i]))
const total = computed(() => visible.value.reduce((n, s) => n + s.values.reduce((a, b) => a + b, 0), 0))
const avg = computed(() => total.value / Math.max(1, props.labels.length))

function toggle(i: number) {
  if (shown.value[i] && count.value === 1) return
  shown.value = shown.value.map((on, k) => (k === i ? !on : on))
}

const plot = ref<HTMLElement | null>(null)
const { height } = useElementSize(plot)
const valueText = (v: number) => fmt(v, props.format)
</script>

<template>
  <div class="mk cmp tally">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ label }}</span>
      <span class="tally__total">
        {{ fmt(total, format) }}{{ unit ? ` ${unit}` : '' }}
        <span v-if="per" class="tally__avg">{{ fmt(avg, format) }} {{ per }}</span>
      </span>
    </div>
    <div class="tally__keys" role="group" :aria-label="`Groups in ${label}`">
      <RChip v-for="(s, i) in series" :key="s.name" size="sm" :selected="shown[i]" @click="toggle(i)">
        <template #leading>
          <span class="tally__swatch" :class="[shape === 'dot' ? 'is-dot' : '', { 'is-off': !shown[i] }]" :style="{ '--swatch': slot(i) }" />
        </template>
        {{ s.name }}
      </RChip>
    </div>
    <div ref="plot" class="tally__plot">
      <RDotMatrixChart
        v-if="height > 80"
        :labels="labels"
        :ticks="ticks"
        :series="visible"
        :shape="shape"
        :height="Math.floor(height)"
        :format="valueText"
        :label="`${label}${unit ? `, ${unit}` : ''}`"
      />
    </div>
  </div>
</template>

<style scoped>
.tally {
  gap: 8px;
}

.tally__total {
  flex: none;
  color: var(--r-text);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-weight: var(--r-weight-semibold);
  font-variant-numeric: tabular-nums;
}

.tally__avg {
  margin-left: 6px;
  color: var(--r-text-tertiary);
  font-weight: var(--r-weight-medium);
}

.tally__keys {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.tally__swatch {
  width: 8px;
  height: 8px;
  background: var(--swatch);
}

.tally__swatch.is-dot {
  border-radius: var(--r-radius-round);
}

.tally__swatch.is-off {
  background: var(--r-border-strong);
}

.tally__plot {
  flex: 1 1 0;
  min-height: 0;
}
</style>
