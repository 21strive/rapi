<script setup lang="ts">
import type { ButtonTone, Size } from '../types'

withDefaults(
  defineProps<{
    /** Accessible name. Icon buttons have no visible text, so this is required. */
    label: string
    variant?: 'outline' | 'ghost' | 'soft' | 'solid'
    tone?: ButtonTone
    size?: Size
    shape?: 'circle' | 'square'
    /** Small notification dot in the corner. */
    dot?: boolean
    disabled?: boolean
    type?: 'button' | 'submit' | 'reset'
    href?: string
    /** For toggle buttons. Leave unset for plain buttons. */
    pressed?: boolean
  }>(),
  { variant: 'outline', tone: 'neutral', size: 'md', shape: 'circle', type: 'button', pressed: undefined },
)

defineSlots<{ default?(): unknown }>()
</script>

<template>
  <component
    :is="href ? 'a' : 'button'"
    class="r-icon-button"
    :class="[`r-icon-button--${variant}`, `r-icon-button--${size}`, `r-icon-button--${shape}`, `r-tone-${tone}`]"
    :type="href ? undefined : type"
    :href="href && !disabled ? href : undefined"
    :disabled="!href && disabled ? true : undefined"
    :aria-disabled="href && disabled ? 'true' : undefined"
    :aria-label="label"
    :aria-pressed="pressed"
  >
    <slot />
    <span v-if="dot" class="r-icon-button__dot" aria-hidden="true" />
  </component>
</template>

<style>
.r-icon-button {
  --r-icon-button-size: var(--r-control-md);
  --r-icon-button-icon: 18px;
  position: relative;
  display: inline-grid;
  flex-shrink: 0;
  place-items: center;
  width: var(--r-icon-button-size);
  height: var(--r-icon-button-size);
  padding: 0;
  border: 1px solid transparent;
  color: var(--r-text);
  text-decoration: none;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition:
    background-color var(--r-duration-fast) var(--r-ease-out),
    border-color var(--r-duration-fast) var(--r-ease-out),
    color var(--r-duration-fast) var(--r-ease-out),
    transform var(--r-duration-instant) var(--r-ease-out);
}

.r-icon-button svg {
  width: var(--r-icon-button-icon);
  height: var(--r-icon-button-icon);
}

.r-icon-button--sm {
  --r-icon-button-size: var(--r-control-sm);
  --r-icon-button-icon: 16px;
}
.r-icon-button--lg {
  --r-icon-button-size: var(--r-control-lg);
  --r-icon-button-icon: 20px;
}

.r-icon-button--circle {
  border-radius: var(--r-radius-full);
}
.r-icon-button--square {
  border-radius: var(--r-radius-md);
}
.r-icon-button--square.r-icon-button--sm {
  border-radius: var(--r-radius-sm);
}

.r-icon-button--outline {
  background: var(--r-bg-surface);
  border-color: var(--r-border);
  box-shadow: var(--r-shadow-xs);
}
.r-icon-button--outline:hover:not(:disabled) {
  background: var(--r-bg-hover);
}

.r-icon-button--ghost {
  background: transparent;
  color: var(--r-text-secondary);
}
.r-icon-button--ghost:hover:not(:disabled) {
  background: var(--r-bg-hover);
  color: var(--r-text);
}

.r-icon-button--soft {
  background: var(--tone-soft);
  color: var(--tone-text);
}
.r-icon-button--soft.r-tone-neutral {
  color: var(--r-text-secondary);
}
.r-icon-button--soft:hover:not(:disabled) {
  background: var(--tone-soft-hover);
  color: var(--r-text);
}

.r-icon-button--solid {
  background: var(--tone-solid);
  color: var(--tone-on-solid);
  box-shadow: var(--r-shadow-highlight), var(--r-shadow-xs);
}
.r-icon-button--solid:hover:not(:disabled) {
  background: var(--tone-solid-hover);
}

.r-icon-button[aria-pressed='true'] {
  background: var(--r-bg-pressed);
  color: var(--r-text);
}

.r-icon-button:active:not(:disabled) {
  transform: scale(0.96);
}

.r-icon-button:disabled,
.r-icon-button[aria-disabled='true'] {
  cursor: not-allowed;
  opacity: 0.45;
}

.r-icon-button__dot {
  position: absolute;
  top: 22%;
  right: 22%;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--r-danger);
  box-shadow: 0 0 0 2px var(--r-bg-surface);
}
</style>
