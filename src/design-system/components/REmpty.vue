<script setup lang="ts">
// STUB — API contract for Rapi 0.2. Keep these props, emits and slots; replace the template.
import type { Component } from 'vue'

/** An empty state over the construction lines of the 21 Strive mark. */
withDefaults(
  defineProps<{
    title: string
    body?: string
    icon?: Component
    /** `sm` for inside a table or card, `md` for a whole panel. */
    size?: 'sm' | 'md'
  }>(),
  { size: 'md' },
)
defineSlots<{ actions?(): unknown }>()
</script>

<template>
  <div class="r-stub" data-stub="REmpty">REmpty</div>
</template>
