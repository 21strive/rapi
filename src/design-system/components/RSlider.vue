<script setup lang="ts">
// STUB — API contract for Rapi 0.2. Keep these props, emits and slots; replace the template.
import type { SliderMark } from '../types'

/** A range slider with tick marks and a mono value readout. Square thumb. */
const model = defineModel<number>({ default: 0 })
withDefaults(
  defineProps<{
    label: string
    min?: number
    max?: number
    step?: number
    /** `true` draws a tick per step (up to 40); an array draws labelled marks. */
    marks?: boolean | SliderMark[]
    unit?: string
    showValue?: boolean
    disabled?: boolean
    format?: (value: number) => string
  }>(),
  { min: 0, max: 100, step: 1, showValue: true },
)
void model
</script>

<template>
  <div class="r-stub" data-stub="RSlider">RSlider</div>
</template>
