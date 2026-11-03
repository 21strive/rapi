<script setup lang="ts">
import type { ButtonSize, ButtonTone } from '../types'

withDefaults(
  defineProps<{
    /** Accessible name. Icon buttons have no visible text, so this is required. */
    label: string
    variant?: 'outline' | 'ghost' | 'soft' | 'solid'
    tone?: ButtonTone
    /** xs 24px · sm 28px · md 32px · lg 40px, always square. */
    size?: ButtonSize
    /** @deprecated Icon buttons are always square in Rapi 0.2. Still accepted, ignored. */
    shape?: 'circle' | 'square'
    /** A signal lamp in the corner, for something new or unread. */
    dot?: boolean
    disabled?: boolean
    type?: 'button' | 'submit' | 'reset'
    href?: string
    /** For toggle buttons. Leave unset for plain buttons. */
    pressed?: boolean
  }>(),
  { variant: 'outline', tone: 'neutral', size: 'md', type: 'button', pressed: undefined },
)

defineSlots<{ default?(): unknown }>()
</script>

<template>
  <component
    :is="href ? 'a' : 'button'"
    class="r-icon-button"
    :class="[`r-icon-button--${variant}`, `r-icon-button--${size}`, `r-tone-${tone}`]"
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
  --r-icon-button-icon: 16px;
  position: relative;
  display: inline-grid;
  flex-shrink: 0;
  place-items: center;
  width: var(--r-icon-button-size);
  height: var(--r-icon-button-size);
  padding: 0;
  border: 1px solid transparent;
  border-radius: var(--r-radius-control);
  color: var(--r-text);
  text-decoration: none;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition:
    background-color var(--r-duration-fast) var(--r-ease-out),
    border-color var(--r-duration-fast) var(--r-ease-out),
    color var(--r-duration-fast) var(--r-ease-out);
}

.r-icon-button svg {
  width: var(--r-icon-button-icon);
  height: var(--r-icon-button-icon);
}

.r-icon-button--xs {
  --r-icon-button-size: var(--r-control-xs);
  --r-icon-button-icon: 14px;
}
.r-icon-button--sm {
  --r-icon-button-size: var(--r-control-sm);
}
.r-icon-button--lg {
  --r-icon-button-size: var(--r-control-lg);
  --r-icon-button-icon: 18px;
}

.r-icon-button--outline {
  border-color: var(--r-border-strong);
  background: transparent;
}
.r-icon-button--outline:hover:not(:disabled, [aria-disabled='true']) {
  border-color: var(--r-text-tertiary);
  background: var(--r-bg-hover);
}

.r-icon-button--ghost {
  background: transparent;
  color: var(--r-text-secondary);
}
.r-icon-button--ghost:not(.r-tone-neutral) {
  color: var(--tone-text);
}
.r-icon-button--ghost:hover:not(:disabled, [aria-disabled='true']) {
  background: var(--tone-soft);
  color: var(--r-text);
}

.r-icon-button--soft {
  background: var(--tone-soft);
  color: var(--tone-text);
}
.r-icon-button--soft.r-tone-neutral {
  color: var(--r-text-secondary);
}
.r-icon-button--soft:hover:not(:disabled, [aria-disabled='true']) {
  background: var(--tone-soft-hover);
  color: var(--r-text);
}
.r-icon-button--soft:not(.r-tone-neutral):hover:not(:disabled, [aria-disabled='true']) {
  color: var(--tone-text);
}

.r-icon-button--solid {
  background: var(--tone-solid);
  color: var(--tone-on-solid);
}
.r-icon-button--solid:hover:not(:disabled, [aria-disabled='true']) {
  background: var(--tone-solid-hover);
}

/* A toggle that is on reads as a key held down. */
.r-icon-button[aria-pressed='true'] {
  border-color: var(--r-border-strong);
  background: var(--r-bg-pressed);
  color: var(--r-text);
}

.r-icon-button:active:not(:disabled, [aria-disabled='true']) > svg {
  transform: translateY(1px);
}

.r-icon-button:disabled,
.r-icon-button[aria-disabled='true'] {
  color: var(--r-text-disabled);
  cursor: not-allowed;
}
.r-icon-button--outline:is(:disabled, [aria-disabled='true']) {
  border-color: var(--r-border);
}
.r-icon-button--solid:is(:disabled, [aria-disabled='true']) {
  background: var(--r-bg-pressed);
}

/* A lamp, not a badge: signal orange with a ring in the surface colour. */
.r-icon-button__dot {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 6px;
  height: 6px;
  border-radius: var(--r-radius-round);
  background: var(--r-signal);
  box-shadow: 0 0 0 2px var(--r-bg-surface);
}
.r-icon-button--xs .r-icon-button__dot {
  top: 3px;
  right: 3px;
}
.r-icon-button--lg .r-icon-button__dot {
  top: 6px;
  right: 6px;
}
</style>
