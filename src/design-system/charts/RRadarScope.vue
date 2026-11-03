<script setup lang="ts">
// STUB — API contract for Rapi 0.2. Keep these props, emits and slots; replace the template.
import type { RadarContact } from '../types'

/** A plan-position scope: range rings, bearing ticks, a sweep, labelled contacts. */
withDefaults(
  defineProps<{
    contacts: RadarContact[]
    label: string
    /** Outer ring range in scope units. */
    range?: number
    rings?: number
    unit?: string
    /** Rotating sweep line. Off under reduced motion. */
    sweep?: boolean
    size?: number
    selected?: string
  }>(),
  { range: 100, rings: 4, unit: 'NM', sweep: true, size: 360 },
)
defineEmits<{ select: [id: string] }>()
</script>

<template>
  <div class="r-stub" data-stub="RRadarScope">RRadarScope</div>
</template>
