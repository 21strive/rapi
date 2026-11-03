<script setup lang="ts">
// STUB — API contract for Rapi 0.2. Keep these props, emits and slots; replace the template.
/** Multi-line text field, same anatomy as RInput. */
const model = defineModel<string>({ default: '' })
withDefaults(
  defineProps<{
    label?: string
    hint?: string
    error?: string
    placeholder?: string
    rows?: number
    /** Geist Mono: for code, JSON, keys. */
    mono?: boolean
    disabled?: boolean
    readonly?: boolean
    maxlength?: number
    resize?: 'none' | 'vertical'
  }>(),
  { rows: 4, resize: 'vertical' },
)
void model
</script>

<template>
  <div class="r-stub" data-stub="RTextarea">RTextarea</div>
</template>
