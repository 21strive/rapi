<script setup lang="ts">
import type { Tone } from '../types'

withDefaults(
  defineProps<{
    tone?: Tone
    variant?: 'soft' | 'outline' | 'solid'
    /** A status lamp before the label, in the tone's lamp colour. */
    dot?: boolean
    /** @deprecated Badges are always square in Rapi 0.2. Still accepted, ignored. */
    square?: boolean
    /** sm 18px · md 20px. */
    size?: 'sm' | 'md'
  }>(),
  { tone: 'neutral', variant: 'soft', size: 'md' },
)

defineSlots<{ default?(): unknown; leading?(): unknown }>()
</script>

<template>
  <span class="r-badge" :class="[`r-badge--${variant}`, `r-badge--${size}`, `r-tone-${tone}`]">
    <span v-if="dot" class="r-badge__dot" aria-hidden="true" />
    <slot name="leading" />
    <slot />
  </span>
</template>

<style>
/* A tag in the brand's label voice: Geist Mono capitals, square, 20px. */
.r-badge {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 6px;
  height: 20px;
  padding: 0 6px;
  border: 1px solid transparent;
  border-radius: var(--r-radius-mark);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-weight: var(--r-weight-medium);
  font-variant-numeric: tabular-nums;
  line-height: 1;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  white-space: nowrap;
}

.r-badge svg {
  width: 12px;
  height: 12px;
}

.r-badge--sm {
  gap: 5px;
  height: 18px;
  padding: 0 5px;
  font-size: var(--r-text-3xs);
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
  flex-shrink: 0;
  width: 6px;
  height: 6px;
  border-radius: var(--r-radius-round);
  background: var(--tone-lamp, currentColor);
}

/* On a solid badge the lamp sits on the tone colour, so it takes the label colour instead. */
.r-badge--solid .r-badge__dot {
  background: currentColor;
}
</style>
