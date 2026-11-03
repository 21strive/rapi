<script setup lang="ts">
// STUB — API contract for Rapi 0.2. Keep these props, emits and slots; replace the template.
/** A code block: optional title strip, line numbers, copy button. No syntax colours, by design. */
withDefaults(
  defineProps<{
    code: string
    /** Shown in the title strip, e.g. "bash" or "json". */
    language?: string
    /** File name or caption in the title strip. */
    title?: string
    lineNumbers?: boolean
    copyable?: boolean
    /** Scroll vertically past this height, e.g. "320px". */
    maxHeight?: string
    wrap?: boolean
    /** Lines (1-based) to highlight with a brand rule. */
    highlight?: number[]
  }>(),
  { copyable: true },
)
</script>

<template>
  <div class="r-stub" data-stub="RCodeBlock">RCodeBlock</div>
</template>
