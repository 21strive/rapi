<script setup lang="ts">
// STUB — API contract for Rapi 0.2. Keep these props, emits and slots; replace the template.
import type { DialZone } from '../types'

/** An instrument dial: 270° tick ring, status zones, needle, mono readout in the middle. */
withDefaults(
  defineProps<{
    value: number
    label: string
    min?: number
    max?: number
    unit?: string
    zones?: DialZone[]
    /** Major tick every N units; minor ticks split each major into 5. */
    majorStep?: number
    size?: number
    /** `needle` (default) or `arc` (fills the ring up to the value). */
    variant?: 'needle' | 'arc'
    format?: (value: number) => string
  }>(),
  { min: 0, max: 100, size: 200, variant: 'needle' },
)
</script>

<template>
  <div class="r-stub" data-stub="RDial">RDial</div>
</template>
