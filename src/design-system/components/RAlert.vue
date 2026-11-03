<script setup lang="ts">
// STUB — API contract for Rapi 0.2. Keep these props, emits and slots; replace the template.
import type { Component } from 'vue'
import type { StatusTone } from '../types'

/** An inline notice. Square, with a 2px rule on the leading edge in the tone colour. */
withDefaults(
  defineProps<{
    tone?: StatusTone
    title?: string
    /** `soft` tinted (default) · `outline` surface with border · `solid` filled, for one urgent banner */
    variant?: 'soft' | 'outline' | 'solid'
    dismissible?: boolean
    /** Replace the default icon for the tone, or pass false for none. */
    icon?: Component | false
  }>(),
  { tone: 'neutral', variant: 'soft' },
)
defineEmits<{ dismiss: [] }>()
defineSlots<{ default?(): unknown; actions?(): unknown }>()
</script>

<template>
  <div class="r-stub" data-stub="RAlert">RAlert</div>
</template>
