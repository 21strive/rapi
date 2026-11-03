<script setup lang="ts">
// STUB — API contract for Rapi 0.2. Keep these props, emits and slots; replace the template.
import type { StatusTone } from '../types'

/**
 * An instrument readout: a mono caps label over a big figure with its unit, like flight
 * telemetry. Figures use tabular digits so live values do not jitter.
 */
withDefaults(
  defineProps<{
    label: string
    value: string | number
    unit?: string
    /** `mono` Geist Mono (default) · `pixel` Geist Pixel, the TE-style dot matrix · `sans` Geist */
    font?: 'mono' | 'pixel' | 'sans'
    size?: 'sm' | 'md' | 'lg' | 'xl'
    /** LCD ghost: unlit "8"s behind the digits. `true` derives the mask from the value's length. */
    ghost?: boolean | string
    /** Colours the lamp next to the label and, for danger/warning/signal, the figure. */
    tone?: StatusTone
    /** Quiet line under the figure, e.g. "MAX 7,500 · NOMINAL". */
    sub?: string
    align?: 'left' | 'right'
    /** Fixed decimals when value is a number. */
    decimals?: number
  }>(),
  { font: 'mono', size: 'md', align: 'left' },
)
defineSlots<{ meta?(): unknown; footer?(): unknown }>()
</script>

<template>
  <div class="r-stub" data-stub="RReadout">RReadout</div>
</template>
