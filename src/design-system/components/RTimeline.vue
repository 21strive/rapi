<script setup lang="ts">
// STUB — API contract for Rapi 0.2. Keep these props, emits and slots; replace the template.
import type { TimelineItem } from '../types'

/** A vertical log: mono timestamp, square marker on a 1px rail, title, body. */
withDefaults(
  defineProps<{
    items: TimelineItem[]
    dense?: boolean
    /** Put the timestamp in a left column (default) or above the title. */
    timePosition?: 'left' | 'top'
  }>(),
  { timePosition: 'left' },
)
defineSlots<{ item?(props: { item: TimelineItem; index: number }): unknown }>()
</script>

<template>
  <div class="r-stub" data-stub="RTimeline">RTimeline</div>
</template>
