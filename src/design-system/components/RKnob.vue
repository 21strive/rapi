<script setup lang="ts">
// STUB — API contract for Rapi 0.2. Keep these props, emits and slots; replace the template.
/**
 * A rotary control, the Teenage Engineering twist: a square cap on a 270° tick ring, value in
 * mono underneath. Drag up/down, scroll, or use the arrow keys. role="slider".
 */
const model = defineModel<number>({ default: 0 })
withDefaults(
  defineProps<{
    label: string
    min?: number
    max?: number
    step?: number
    size?: 'sm' | 'md' | 'lg'
    /** Colour of the lit ticks and the indicator. */
    tone?: 'neutral' | 'brand' | 'signal'
    /** Number of ticks around the ring. */
    detents?: number
    unit?: string
    format?: (value: number) => string
    disabled?: boolean
  }>(),
  { min: 0, max: 100, step: 1, size: 'md', tone: 'signal', detents: 21 },
)
void model
</script>

<template>
  <div class="r-stub" data-stub="RKnob">RKnob</div>
</template>
