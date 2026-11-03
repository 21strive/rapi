<script setup lang="ts">
import { computed, type Component } from 'vue'
import { CircleCheck, Info, OctagonAlert, Siren, TriangleAlert, X } from 'lucide-vue-next'
import type { StatusTone } from '../types'

/** An inline notice. Square, with a 2px rule on the leading edge in the tone colour. */
const props = withDefaults(
  defineProps<{
    tone?: StatusTone
    title?: string
    /** `soft` tinted (default) · `outline` surface with border · `solid` filled, for one urgent banner */
    variant?: 'soft' | 'outline' | 'solid'
    dismissible?: boolean
    /** Replace the default icon for the tone, or pass false for none. */
    icon?: Component | false
  }>(),
  { tone: 'neutral', variant: 'soft', icon: undefined },
)
defineEmits<{ dismiss: [] }>()
defineSlots<{ default?(): unknown; actions?(): unknown }>()

const TONE_ICONS: Record<StatusTone, Component> = {
  neutral: Info,
  brand: Info,
  signal: Siren,
  success: CircleCheck,
  warning: TriangleAlert,
  danger: OctagonAlert,
}

const iconComponent = computed<Component | null>(() => {
  if (props.icon === false) return null
  return props.icon ?? TONE_ICONS[props.tone]
})
</script>

<template>
  <div
    class="r-alert"
    :class="[`r-alert--${variant}`, `r-tone-${tone}`, { 'has-title': !!title }]"
    :role="tone === 'danger' ? 'alert' : 'status'"
  >
    <component :is="iconComponent" v-if="iconComponent" class="r-alert__icon" aria-hidden="true" />
    <div class="r-alert__content">
      <div v-if="title || $slots.default" class="r-alert__body">
        <p v-if="title" class="r-alert__title">{{ title }}</p>
        <div v-if="$slots.default" class="r-alert__text"><slot /></div>
      </div>
      <div v-if="$slots.actions" class="r-alert__actions"><slot name="actions" /></div>
    </div>
    <button v-if="dismissible" type="button" class="r-alert__dismiss" aria-label="Dismiss" @click="$emit('dismiss')">
      <X />
    </button>
  </div>
</template>

<style>
.r-alert {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  min-width: 0;
  padding: 11px 12px 11px 16px;
  border: 1px solid transparent;
  border-radius: var(--r-radius-surface);
  /* The tint sits on the surface, so dark-mode tints (which are translucent) stay one solid block. */
  background: linear-gradient(var(--tone-soft), var(--tone-soft)), var(--r-bg-surface);
  color: var(--r-text);
}

/* The leading rule: 2px in the tone colour, over the border so the corner stays square. */
.r-alert::before {
  position: absolute;
  top: -1px;
  bottom: -1px;
  left: -1px;
  width: 2px;
  background: var(--tone-solid);
  content: '';
}

.r-alert--outline {
  border-color: var(--tone-border);
  background: var(--r-bg-surface);
}

.r-alert--solid {
  background: var(--tone-solid);
  color: var(--tone-on-solid);
}
.r-alert--solid::before {
  display: none;
}

/* Inside a solid alert the text, border and ink tokens follow the label colour, so buttons
   and links placed in it invert instead of disappearing. Set on the children, because the
   tone class on the root reads --r-ink itself. */
.r-alert--solid > * {
  --r-text: var(--tone-on-solid);
  --r-text-secondary: color-mix(in srgb, var(--tone-on-solid) 88%, transparent);
  --r-text-tertiary: color-mix(in srgb, var(--tone-on-solid) 76%, transparent);
  --r-border-subtle: color-mix(in srgb, var(--tone-on-solid) 18%, transparent);
  --r-border: color-mix(in srgb, var(--tone-on-solid) 30%, transparent);
  --r-border-strong: color-mix(in srgb, var(--tone-on-solid) 50%, transparent);
  --r-bg-surface: transparent;
  --r-bg-hover: color-mix(in srgb, var(--tone-on-solid) 14%, transparent);
  --r-bg-pressed: color-mix(in srgb, var(--tone-on-solid) 22%, transparent);
  --r-ink: var(--tone-on-solid);
  --r-ink-hover: color-mix(in srgb, var(--tone-on-solid) 86%, var(--tone-solid));
  --r-on-ink: var(--tone-solid);
  --r-focus: var(--tone-on-solid);
}

.r-alert__icon {
  flex: none;
  width: 16px;
  height: 16px;
  margin-top: 2px;
  color: var(--tone-text);
}
.r-alert--solid .r-alert__icon {
  color: inherit;
}

.r-alert__content {
  display: flex;
  flex: 1;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 16px;
  min-width: 0;
}

.r-alert__body {
  display: flex;
  flex: 1 1 260px;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.r-alert__title {
  color: var(--r-text);
  font-size: var(--r-text-md);
  font-weight: var(--r-weight-semibold);
  line-height: 20px;
  letter-spacing: var(--r-tracking-snug);
}

.r-alert__text {
  color: var(--r-text);
  font-size: var(--r-text-sm);
  line-height: 20px;
}
.r-alert.has-title .r-alert__text {
  color: var(--r-text-secondary);
}

.r-alert__text a {
  color: inherit;
  font-weight: var(--r-weight-medium);
  text-decoration: underline;
  text-decoration-color: color-mix(in srgb, currentColor 45%, transparent);
  text-underline-offset: 3px;
}
.r-alert__text a:hover {
  text-decoration-color: currentColor;
}

.r-alert__actions {
  display: flex;
  flex: none;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.r-alert__dismiss {
  display: inline-grid;
  flex: none;
  place-items: center;
  width: 24px;
  height: 24px;
  margin: -2px -4px -2px 0;
  padding: 0;
  border: 0;
  border-radius: var(--r-radius-control);
  background: none;
  color: var(--r-text-tertiary);
  cursor: pointer;
  transition:
    background-color var(--r-duration-fast) var(--r-ease-out),
    color var(--r-duration-fast) var(--r-ease-out);
}
.r-alert__dismiss:hover {
  background: color-mix(in srgb, currentColor 12%, transparent);
  color: var(--r-text);
}
.r-alert__dismiss svg {
  width: 14px;
  height: 14px;
}
</style>
