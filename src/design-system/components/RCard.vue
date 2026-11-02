<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    title?: string
    subtitle?: string
    padding?: 'none' | 'sm' | 'md' | 'lg'
    /**
     * `brand` and `flame` are the loud cards (one per screen is plenty). `ink` is a dark island.
     * Coloured cards re-point the text and border tokens, so components inside adapt.
     */
    variant?: 'surface' | 'muted' | 'outline' | 'brand' | 'flame' | 'ink'
    /** Hover lift. Pair with `as="a"` or `as="button"` so it is reachable by keyboard. */
    interactive?: boolean
    as?: string
    /** Heading element for the title. */
    titleAs?: 'h2' | 'h3' | 'h4' | 'p'
  }>(),
  { padding: 'md', variant: 'surface', as: 'div', titleAs: 'h3' },
)

defineSlots<{
  default?(): unknown
  header?(): unknown
  actions?(): unknown
  footer?(): unknown
}>()

const colored = computed(() => props.variant === 'brand' || props.variant === 'flame')
</script>

<template>
  <component
    :is="as"
    class="r-card"
    :class="[`r-card--${variant}`, `r-card--pad-${padding}`, { 'r-card--interactive': interactive }]"
    :data-theme="variant === 'ink' ? 'dark' : undefined"
  >
    <span v-if="colored" class="r-card__sheen" aria-hidden="true" />
    <div v-if="title || subtitle || $slots.header || $slots.actions" class="r-card__header">
      <div class="r-card__heading">
        <slot name="header">
          <component :is="titleAs" v-if="title" class="r-card__title">{{ title }}</component>
          <p v-if="subtitle" class="r-card__subtitle">{{ subtitle }}</p>
        </slot>
      </div>
      <div v-if="$slots.actions" class="r-card__actions"><slot name="actions" /></div>
    </div>
    <slot />
    <div v-if="$slots.footer" class="r-card__footer"><slot name="footer" /></div>
  </component>
</template>

<style>
.r-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
  border: 1px solid var(--r-border-subtle);
  border-radius: var(--r-radius-xl);
  background: var(--r-bg-surface);
  box-shadow: var(--r-shadow-xs);
  color: var(--r-text);
  text-decoration: none;
  isolation: isolate;
}

.r-card--pad-none {
  padding: 0;
}
.r-card--pad-sm {
  padding: 16px;
}
.r-card--pad-md {
  padding: 20px;
}
.r-card--pad-lg {
  padding: 24px;
}

@media (min-width: 640px) {
  .r-card--pad-md {
    padding: 24px;
  }
  .r-card--pad-lg {
    padding: 32px;
  }
}

/* When the actions are wide (a segmented control, two selects) they drop below the title
   instead of squeezing it. */
.r-card__header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.r-card--pad-none > .r-card__header {
  padding: 20px 20px 0;
}

.r-card__heading {
  flex: 1 1 160px;
  min-width: 0;
}

.r-card__title {
  font-size: var(--r-text-lg);
  font-weight: var(--r-weight-semibold);
  line-height: 1.35;
  letter-spacing: var(--r-tracking-snug);
}

.r-card__subtitle {
  margin-top: 2px;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-sm);
}

.r-card__actions {
  display: flex;
  flex-shrink: 0;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  max-width: 100%;
  margin: -4px -4px -4px auto;
}

.r-card__footer {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: auto;
}

.r-card--muted {
  border-color: transparent;
  background: var(--r-bg-muted);
  box-shadow: none;
}

.r-card--outline {
  border-color: var(--r-border);
  background: transparent;
  box-shadow: none;
}

.r-card--interactive {
  cursor: pointer;
  transition:
    box-shadow var(--r-duration-base) var(--r-ease-out),
    transform var(--r-duration-base) var(--r-ease-out),
    border-color var(--r-duration-base) var(--r-ease-out);
}
.r-card--interactive:hover {
  border-color: var(--r-border);
  box-shadow: var(--r-shadow-md);
  transform: translateY(-1px);
}
.r-card--interactive:active {
  transform: none;
}

/* Loud cards. Text and borders are re-pointed so nested components read on colour. */
.r-card--brand,
.r-card--flame {
  border-color: transparent;
  color-scheme: dark;
  --r-text: #fff;
  --r-text-secondary: rgb(255 255 255 / 0.86);
  --r-text-tertiary: rgb(255 255 255 / 0.74);
  --r-border-subtle: rgb(255 255 255 / 0.16);
  --r-border: rgb(255 255 255 / 0.26);
  --r-border-strong: rgb(255 255 255 / 0.4);
  --r-bg-surface: rgb(255 255 255 / 0.14);
  --r-bg-muted: rgb(255 255 255 / 0.1);
  --r-bg-hover: rgb(255 255 255 / 0.2);
  --r-bg-pressed: rgb(255 255 255 / 0.28);
  --r-bg-track: rgb(255 255 255 / 0.16);
  --r-bg-thumb: #fff;
  --r-ink: #fff;
  --r-ink-hover: rgb(255 255 255 / 0.9);
  --r-on-ink: #15181e;
  --r-success-soft: rgb(255 255 255 / 0.2);
  --r-success-text: #fff;
  --r-danger-soft: rgb(255 255 255 / 0.2);
  --r-danger-text: #fff;
  --r-chart-1: #fff;
  --r-chart-1-soft: rgb(255 255 255 / 0.45);
  --r-chart-track: rgb(255 255 255 / 0.16);
  --r-chart-grid: rgb(255 255 255 / 0.2);
  --r-chart-axis: rgb(255 255 255 / 0.74);
  --r-shadow-xs: none;
  --r-focus-ring: 0 0 0 3px rgb(255 255 255 / 0.4);
}

.r-card--brand {
  background: linear-gradient(140deg, var(--r-feature-brand-from) 0%, var(--r-feature-brand-to) 100%);
  box-shadow: 0 12px 32px -12px color-mix(in srgb, var(--r-feature-brand-to) 55%, transparent);
}

.r-card--flame {
  background: linear-gradient(150deg, var(--r-feature-flame-from) 0%, var(--r-feature-flame-to) 100%);
  box-shadow: 0 12px 32px -12px color-mix(in srgb, var(--r-feature-flame-to) 55%, transparent);
}

.r-card--brand :focus-visible,
.r-card--flame :focus-visible {
  outline-color: #fff;
}

.r-card__sheen {
  position: absolute;
  z-index: -1;
  inset: 0;
  overflow: hidden;
  border-radius: inherit;
  background:
    radial-gradient(90% 75% at 100% 100%, rgb(255 255 255 / 0.22), transparent 62%),
    radial-gradient(55% 60% at 0% 0%, rgb(255 255 255 / 0.1), transparent 70%);
  pointer-events: none;
}

.r-card__sheen::after {
  position: absolute;
  right: -18%;
  bottom: -55%;
  width: 90%;
  aspect-ratio: 1;
  border-radius: 50%;
  background: radial-gradient(closest-side, rgb(255 255 255 / 0.16), transparent);
  content: '';
}

/* Ink: a dark island (data-theme="dark"), so everything inside picks up dark tokens. */
.r-card--ink {
  border-color: rgb(255 255 255 / 0.06);
  background: linear-gradient(180deg, #1b1f26, #121418);
  box-shadow: var(--r-shadow-md);
}
</style>
