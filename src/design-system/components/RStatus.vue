<script setup lang="ts">
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
// With no word on screen, an aria-label passed in names the lamp: the root becomes role="img".
</script>

<template>
  <span
    class="r-status"
    :class="[`r-tone-${tone}`, `r-status--${size}`, `r-status--${shape}`, { 'is-pulsing': pulse }]"
    :role="!label && !$slots.default && $attrs['aria-label'] ? 'img' : undefined"
  >
    <span class="r-status__lamp" aria-hidden="true" />
    <span v-if="$slots.default || label" class="r-status__label"><slot>{{ label }}</slot></span>
  </span>
</template>

<style>
.r-status {
  --r-status-lamp: 6px;
  --r-status-gap: 8px;
  display: inline-flex;
  align-items: center;
  gap: var(--r-status-gap);
  min-width: 0;
  color: var(--r-text);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-weight: var(--r-weight-medium);
  line-height: 16px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  white-space: nowrap;
  vertical-align: middle;
}

.r-status--sm {
  --r-status-lamp: 5px;
  --r-status-gap: 6px;
  font-size: var(--r-text-3xs);
  line-height: 14px;
}

/* Square by default: that is the `square` LED. `dot` rounds it, `bar` stretches it. */
.r-status__lamp {
  flex: none;
  width: var(--r-status-lamp);
  height: var(--r-status-lamp);
  background: var(--tone-lamp);
}

.r-status--dot .r-status__lamp {
  border-radius: var(--r-radius-round);
}

.r-status--bar .r-status__lamp {
  width: 2px;
  height: 12px;
}
.r-status--sm.r-status--bar .r-status__lamp {
  height: 10px;
}

.r-status__label {
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Two steps, on and dim: an instrument lamp, not a breathing glow. */
.r-status.is-pulsing .r-status__lamp {
  animation: r-blink 1.2s linear infinite;
}

@media (prefers-reduced-motion: reduce) {
  .r-status.is-pulsing .r-status__lamp {
    animation: none;
  }
}
</style>
