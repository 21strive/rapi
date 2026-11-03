<script setup lang="ts">
// STUB — API contract for Rapi 0.2. Keep these props, emits and slots; replace the template.
/** A section divider: "01 ── TELEMETRY ─────────── META". */
withDefaults(
  defineProps<{
    label?: string
    /** Running index shown before the label, e.g. "01". */
    index?: string
    /** Quiet text at the right end. */
    meta?: string
    /** `strong` = 2px ink rule for top-of-page headers. */
    weight?: 'hairline' | 'strong'
  }>(),
  { weight: 'hairline' },
)
defineSlots<{ default?(): unknown; meta?(): unknown }>()
</script>

<template>
  <div class="r-stub" data-stub="RRule">RRule</div>
</template>
