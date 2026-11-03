<script setup lang="ts">
// STUB — API contract for Rapi 0.2. Keep these props, emits and slots; replace the template.
import type { ChartReference, ScatterSeries } from '../types'

/** Points on two numeric axes, up to three series. Nearest-point hover, labelled outliers. */
withDefaults(
  defineProps<{
    series: ScatterSeries[]
    label: string
    xLabel: string
    yLabel: string
    height?: number
    /** Dashed reference lines across x or y, e.g. a risk threshold. */
    xReferences?: ChartReference[]
    yReferences?: ChartReference[]
    /** Label the points that have a `label` directly on the plot. */
    labelPoints?: boolean
    formatX?: (value: number) => string
    formatY?: (value: number) => string
  }>(),
  { height: 300 },
)
</script>

<template>
  <div class="r-stub" data-stub="RScatterChart">RScatterChart</div>
</template>
