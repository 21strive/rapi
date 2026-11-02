<script setup lang="ts">
import type { Tone } from '../types'

withDefaults(
  defineProps<{
    tone?: Tone
    variant?: 'soft' | 'outline' | 'solid'
    /** A small status dot before the label. */
    dot?: boolean
    /** 6px corners instead of a pill. */
    square?: boolean
    size?: 'sm' | 'md'
  }>(),
  { tone: 'neutral', variant: 'soft', size: 'md' },
)

defineSlots<{ default?(): unknown; leading?(): unknown }>()
</script>

<template>
  <span class="r-badge" :class="[`r-badge--${variant}`, `r-badge--${size}`, `r-tone-${tone}`, { 'r-badge--square': square }]">
    <span v-if="dot" class="r-badge__dot" aria-hidden="true" />
    <slot name="leading" />
    <slot />
  </span>
</template>

<style>
.r-badge {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 6px;
  height: 24px;
  padding: 0 9px;
  border: 1px solid transparent;
  border-radius: var(--r-radius-full);
  font-size: var(--r-text-xs);
  font-weight: var(--r-weight-medium);
  font-variant-numeric: tabular-nums;
  line-height: 1;
  white-space: nowrap;
}

.r-badge svg {
  width: 12px;
  height: 12px;
}

.r-badge--sm {
  gap: 5px;
  height: 20px;
  padding: 0 7px;
  font-size: var(--r-text-2xs);
}

.r-badge--square {
  border-radius: var(--r-radius-xs);
}

.r-badge--soft {
  background: var(--tone-soft);
  color: var(--tone-text);
}

.r-badge--outline {
  border-color: var(--tone-border);
  background: transparent;
  color: var(--tone-text);
}

.r-badge--solid {
  background: var(--tone-solid);
  color: var(--tone-on-solid);
}

.r-badge__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.r-badge--sm .r-badge__dot {
  width: 5px;
  height: 5px;
}
</style>
