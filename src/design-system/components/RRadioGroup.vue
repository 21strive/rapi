<script setup lang="ts">
// STUB — API contract for Rapi 0.2. Keep these props, emits and slots; replace the template.
import type { RadioOption } from '../types'

/** One choice from a few. Radios are the one round control: a circle means "one of these". */
const model = defineModel<string | number>()
withDefaults(
  defineProps<{
    options: RadioOption[]
    /** Group label, also the accessible name. */
    label: string
    hideLabel?: boolean
    orientation?: 'vertical' | 'horizontal'
    /** `card` = each option a bordered tile with its description, for plan or mode pickers. */
    variant?: 'default' | 'card'
  }>(),
  { orientation: 'vertical', variant: 'default' },
)
void model
</script>

<template>
  <div class="r-stub" data-stub="RRadioGroup">RRadioGroup</div>
</template>
