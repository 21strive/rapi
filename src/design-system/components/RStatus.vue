<script setup lang="ts">
// STUB — API contract for Rapi 0.2. Keep these props, emits and slots; replace the template.
import type { StatusTone } from '../types'

/** A status lamp with a mono caps label: NOMINAL, DEGRADED, OFFLINE, LIVE. */
withDefaults(
  defineProps<{
    tone?: StatusTone
    /** Text after the lamp. Rendered in Geist Mono caps. Use the default slot for richer content. */
    label?: string
    /** Blinks in two steps (instrument style, not a soft pulse). Off under reduced motion. */
    pulse?: boolean
    size?: 'sm' | 'md'
    /** `dot` = round lamp (default). `square` = LED segment. `bar` = 2px × 12px vertical tick. */
    shape?: 'dot' | 'square' | 'bar'
  }>(),
  { tone: 'neutral', size: 'md', shape: 'dot' },
)
defineSlots<{ default?(): unknown }>()
</script>

<template>
  <div class="r-stub" data-stub="RStatus">RStatus</div>
</template>
