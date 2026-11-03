<script setup lang="ts">
// STUB — API contract for Rapi 0.2. Keep these props, emits and slots; replace the template.
import type { StepItem } from '../types'

/** Progress through a sequence: wizard steps, a pipeline, a launch sequence. Indexed 01, 02, 03. */
withDefaults(
  defineProps<{
    items: StepItem[]
    /** Index of the current step (0-based). Steps before it are complete. */
    current?: number
    orientation?: 'horizontal' | 'vertical'
    size?: 'sm' | 'md'
  }>(),
  { current: 0, orientation: 'horizontal', size: 'md' },
)
</script>

<template>
  <div class="r-stub" data-stub="RSteps">RSteps</div>
</template>
