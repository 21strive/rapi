<script setup lang="ts">
// STUB — API contract for Rapi 0.2. Keep these props, emits and slots; replace the template.
import type { SpecItem } from '../types'

/** A datasheet: label left in mono caps, value right, hairline between rows. */
withDefaults(
  defineProps<{
    items: SpecItem[]
    /** Columns of label/value pairs on wide screens; collapses to one below 640px. */
    columns?: 1 | 2 | 3
    dense?: boolean
    /** `split` = label left, value right-aligned. `stack` = label above value. */
    layout?: 'split' | 'stack'
  }>(),
  { columns: 1, layout: 'split' },
)
defineSlots<{ value?(props: { item: SpecItem; index: number }): unknown }>()
</script>

<template>
  <div class="r-stub" data-stub="RSpecList">RSpecList</div>
</template>
