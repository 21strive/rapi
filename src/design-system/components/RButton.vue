<script setup lang="ts">
import { computed } from 'vue'
import { LoaderCircle } from 'lucide-vue-next'
import type { ButtonTone, ButtonVariant, Size } from '../types'

const props = withDefaults(
  defineProps<{
    variant?: ButtonVariant
    tone?: ButtonTone
    size?: Size
    shape?: 'rounded' | 'pill'
    block?: boolean
    loading?: boolean
    disabled?: boolean
    type?: 'button' | 'submit' | 'reset'
    /** Renders an `<a>` instead of a `<button>`. */
    href?: string
  }>(),
  { variant: 'solid', tone: 'neutral', size: 'md', shape: 'rounded', type: 'button' },
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
      { 'r-button--pill': shape === 'pill', 'r-button--block': block, 'is-loading': loading },
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
  --r-button-px: 16px;
  --r-button-icon: 16px;
  position: relative;
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  height: var(--r-button-h);
  padding: 0 var(--r-button-px);
  border: 1px solid transparent;
  border-radius: var(--r-radius-md);
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
    color var(--r-duration-fast) var(--r-ease-out),
    box-shadow var(--r-duration-fast) var(--r-ease-out),
    transform var(--r-duration-instant) var(--r-ease-out);
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
  padding-left: calc(var(--r-button-px) - 3px);
}
.r-button:has(> .r-button__content > svg:last-child) {
  padding-right: calc(var(--r-button-px) - 3px);
}

.r-button--sm {
  --r-button-h: var(--r-control-sm);
  --r-button-px: 12px;
  --r-button-icon: 15px;
  border-radius: var(--r-radius-sm);
  font-size: var(--r-text-sm);
}
.r-button--sm .r-button__content {
  gap: 6px;
}

.r-button--lg {
  --r-button-h: var(--r-control-lg);
  --r-button-px: 20px;
  --r-button-icon: 18px;
  border-radius: 12px;
  font-size: var(--r-text-lg);
}

.r-button--pill {
  border-radius: var(--r-radius-full);
}

.r-button--block {
  display: flex;
  width: 100%;
}

/* Variants read the tone variables, so one class re-colours them. */
.r-button--solid {
  background: var(--tone-solid);
  color: var(--tone-on-solid);
  box-shadow: var(--r-shadow-highlight), var(--r-shadow-xs);
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

.r-button--outline {
  background: var(--r-bg-surface);
  border-color: var(--tone-border);
  color: var(--tone-text);
  box-shadow: var(--r-shadow-xs);
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
.r-button--ghost.r-tone-neutral {
  color: var(--r-text-secondary);
}
.r-button--ghost.r-tone-neutral:hover:not(:disabled, [aria-disabled='true']) {
  color: var(--r-text);
}

.r-button:active:not(:disabled, [aria-disabled='true']) {
  transform: scale(0.98);
}

.r-button:disabled,
.r-button[aria-disabled='true'] {
  cursor: not-allowed;
  opacity: 0.48;
  box-shadow: none;
}

.r-button.is-loading {
  cursor: progress;
  opacity: 1;
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
