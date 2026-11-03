<script setup lang="ts">
import { computed } from 'vue'
import { LoaderCircle } from 'lucide-vue-next'
import type { ButtonSize, ButtonTone, ButtonVariant } from '../types'

const props = withDefaults(
  defineProps<{
    variant?: ButtonVariant
    /** `neutral` is ink. `brand` is the one primary action of a flow. `signal` is for live or urgent actions only. */
    tone?: ButtonTone
    /** xs 24px · sm 28px · md 32px · lg 40px. */
    size?: ButtonSize
    /** @deprecated Buttons are square in Rapi 0.2. Still accepted, ignored. */
    shape?: 'rounded' | 'pill'
    block?: boolean
    loading?: boolean
    disabled?: boolean
    type?: 'button' | 'submit' | 'reset'
    /** Renders an `<a>` instead of a `<button>`. */
    href?: string
  }>(),
  { variant: 'solid', tone: 'neutral', size: 'md', type: 'button' },
)

defineSlots<{ default?(): unknown; leading?(): unknown; trailing?(): unknown }>()

const inactive = computed(() => props.disabled || props.loading)
</script>

<template>
  <component
    :is="href ? 'a' : 'button'"
    class="r-button"
    :class="[
      `r-button--${variant}`,
      `r-button--${size}`,
      `r-tone-${tone}`,
      { 'r-button--block': block, 'is-loading': loading },
    ]"
    :type="href ? undefined : type"
    :href="href && !inactive ? href : undefined"
    :disabled="!href && inactive ? true : undefined"
    :aria-disabled="href && inactive ? 'true' : undefined"
    :aria-busy="loading ? 'true' : undefined"
    :tabindex="href && inactive ? -1 : undefined"
  >
    <span class="r-button__content">
      <slot name="leading" />
      <span v-if="$slots.default" class="r-button__label"><slot /></span>
      <slot name="trailing" />
    </span>
    <LoaderCircle v-if="loading" class="r-button__spinner" />
  </component>
</template>

<style>
.r-button {
  --r-button-h: var(--r-control-md);
  --r-button-px: 12px;
  --r-button-icon: 16px;
  position: relative;
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  height: var(--r-button-h);
  padding: 0 var(--r-button-px);
  border: 1px solid transparent;
  border-radius: var(--r-radius-control);
  font-size: var(--r-text-md);
  font-weight: var(--r-weight-medium);
  line-height: 1;
  letter-spacing: var(--r-tracking-snug);
  white-space: nowrap;
  text-decoration: none;
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  transition:
    background-color var(--r-duration-fast) var(--r-ease-out),
    border-color var(--r-duration-fast) var(--r-ease-out),
    color var(--r-duration-fast) var(--r-ease-out);
}

.r-button__content {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.r-button svg {
  width: var(--r-button-icon);
  height: var(--r-button-icon);
}

/* Optical balance: an icon at the edge needs a little less padding than text. */
.r-button:has(> .r-button__content > svg:first-child) {
  padding-left: calc(var(--r-button-px) - 2px);
}
.r-button:has(> .r-button__content > svg:last-child) {
  padding-right: calc(var(--r-button-px) - 2px);
}

.r-button--xs {
  --r-button-h: var(--r-control-xs);
  --r-button-px: 8px;
  --r-button-icon: 14px;
  font-size: var(--r-text-xs);
  letter-spacing: 0;
}
.r-button--xs .r-button__content {
  gap: 4px;
}

.r-button--sm {
  --r-button-h: var(--r-control-sm);
  --r-button-px: 10px;
  font-size: var(--r-text-sm);
}
.r-button--sm .r-button__content {
  gap: 6px;
}

.r-button--lg {
  --r-button-h: var(--r-control-lg);
  --r-button-px: 16px;
}

.r-button--block {
  display: flex;
  width: 100%;
}

/* Variants read the tone variables, so one class re-colours them. */
.r-button--solid {
  background: var(--tone-solid);
  color: var(--tone-on-solid);
}
.r-button--solid:hover:not(:disabled, [aria-disabled='true']) {
  background: var(--tone-solid-hover);
}

.r-button--soft {
  background: var(--tone-soft);
  color: var(--tone-text);
}
.r-button--soft:hover:not(:disabled, [aria-disabled='true']) {
  background: var(--tone-soft-hover);
}

/* A coloured outline takes the full tone colour; the pale tone border is for badges. */
.r-button--outline {
  border-color: var(--tone-solid);
  background: transparent;
  color: var(--tone-text);
}
.r-button--outline.r-tone-neutral {
  border-color: var(--tone-border);
}
.r-button--outline:hover:not(:disabled, [aria-disabled='true']) {
  background: var(--tone-soft);
}

.r-button--ghost {
  background: transparent;
  color: var(--tone-text);
}
.r-button--ghost:hover:not(:disabled, [aria-disabled='true']) {
  background: var(--tone-soft);
}

/* Neutral text reads in full ink; the muted tone text is for badges. */
.r-button.r-tone-neutral:is(.r-button--soft, .r-button--outline) {
  color: var(--r-text);
}
.r-button.r-tone-neutral.r-button--outline:hover:not(:disabled, [aria-disabled='true']) {
  border-color: var(--r-text-tertiary);
  background: var(--r-bg-hover);
}
.r-button--ghost.r-tone-neutral {
  color: var(--r-text-secondary);
}
.r-button--ghost.r-tone-neutral:hover:not(:disabled, [aria-disabled='true']) {
  background: var(--r-bg-hover);
  color: var(--r-text);
}

/* A key press: one pixel down, nothing springs back. */
.r-button:active:not(:disabled, [aria-disabled='true']) .r-button__content {
  transform: translateY(1px);
}

/* Disabled reads as switched off, not as a faded colour. */
.r-button:is(:disabled, [aria-disabled='true']):not(.is-loading) {
  border-color: transparent;
  background: var(--r-bg-pressed);
  color: var(--r-text-disabled);
  cursor: not-allowed;
}
.r-button--outline:is(:disabled, [aria-disabled='true']):not(.is-loading) {
  border-color: var(--r-border);
  background: transparent;
}
.r-button--ghost:is(:disabled, [aria-disabled='true']):not(.is-loading) {
  background: transparent;
}

.r-button.is-loading {
  cursor: progress;
}
.r-button.is-loading .r-button__content {
  visibility: hidden;
}

.r-button__spinner {
  position: absolute;
  inset: 0;
  margin: auto;
  animation: r-spin 0.8s linear infinite;
}
</style>
