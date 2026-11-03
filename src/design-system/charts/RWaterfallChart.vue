<script setup lang="ts">
// STUB — API contract for Rapi 0.2. Keep these props, emits and slots; replace the template.
import type { WaterfallStep } from '../types'

/** A bridge from a start value to an end value through signed steps. */
withDefaults(
  defineProps<{
    steps: WaterfallStep[]
    label: string
    height?: number
    format?: (value: number) => string
  }>(),
  { height: 280 },
)
</script>

<template>
  <div class="r-stub" data-stub="RWaterfallChart">RWaterfallChart</div>
</template>
