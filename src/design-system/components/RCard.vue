<script setup lang="ts">
import { computed, useSlots } from 'vue'
import RSupergraphic from './RSupergraphic.vue'

const props = withDefaults(
  defineProps<{
    title?: string
    subtitle?: string
    /** Mono caps above the title, the brand's Small Header: "TREASURY", "SECTOR 7". */
    eyebrow?: string
    /** A running number in the top-left corner, e.g. "01". */
    index?: string
    /** Mono caps at the right of the header: a status, a timestamp, an id. */
    meta?: string
    /** Registration marks on the four corners, for instrument panels and hero frames. */
    marks?: boolean
    /** The faint logogram behind `brand` and `ink` cards. Turn it off behind a chart or a table. */
    supergraphic?: boolean
    padding?: 'none' | 'sm' | 'md' | 'lg'
    /**
     * `brand` (flat cobalt) and `signal` (International Orange, black text) are the loud panels:
     * one per screen at most. `ink` is a dark island in both themes. `flame` is the 0.1 name of
     * `signal`. Coloured cards re-point the text and border tokens, so components inside adapt.
     */
    variant?: 'surface' | 'muted' | 'outline' | 'brand' | 'ink' | 'signal' | 'flame'
    /** Hover state. Pair with `as="a"` or `as="button"` so it is reachable by keyboard. */
    interactive?: boolean
    as?: string
    /** Heading element for the title. */
    titleAs?: 'h2' | 'h3' | 'h4' | 'p'
  }>(),
  { padding: 'md', variant: 'surface', as: 'div', titleAs: 'h3', supergraphic: true },
)

const slots = useSlots()

defineSlots<{
  default?(): unknown
  header?(): unknown
  actions?(): unknown
  footer?(): unknown
}>()

const tone = computed(() => (props.variant === 'flame' ? 'signal' : props.variant))
const showSupergraphic = computed(() => props.supergraphic && (tone.value === 'brand' || tone.value === 'ink'))
const hasHeader = computed(
  () => !!(props.title || props.subtitle || props.eyebrow || props.index || props.meta || slots.header || slots.actions),
)
// Meta rides on the kicker line when there is one, so it stays top-right in a narrow card.
const hasKicker = computed(() => !!(props.index || props.eyebrow))
</script>

<template>
  <component
    :is="as"
    class="r-card"
    :class="[`r-card--${tone}`, `r-card--pad-${padding}`, { 'r-card--interactive': interactive, 'r-marks': marks }]"
    :data-theme="tone === 'ink' ? 'dark' : undefined"
  >
    <RSupergraphic
      v-if="showSupergraphic"
      class="r-card__supergraphic"
      variant="one"
      :tone="tone === 'brand' ? 'brand' : 'inverse'"
      anchor="bottom-right"
    />
    <div v-if="hasHeader" class="r-card__header">
      <div class="r-card__heading">
        <p v-if="hasKicker" class="r-card__kicker">
          <span v-if="index" class="r-card__index">{{ index }}</span>
          <span v-if="eyebrow" class="r-card__eyebrow">{{ eyebrow }}</span>
          <span v-if="meta" class="r-card__meta">{{ meta }}</span>
        </p>
        <slot name="header">
          <component :is="titleAs" v-if="title" class="r-card__title">{{ title }}</component>
          <p v-if="subtitle" class="r-card__subtitle">{{ subtitle }}</p>
        </slot>
      </div>
      <div v-if="(meta && !hasKicker) || $slots.actions" class="r-card__aside">
        <span v-if="meta && !hasKicker" class="r-card__meta">{{ meta }}</span>
        <div v-if="$slots.actions" class="r-card__actions"><slot name="actions" /></div>
      </div>
    </div>
    <slot />
    <div v-if="$slots.footer" class="r-card__footer"><slot name="footer" /></div>
  </component>
</template>

<style>
/* A square panel: a 1px rule, no shadow. Structure comes from rules, not elevation. */
.r-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
  border: 1px solid var(--r-border);
  border-radius: var(--r-radius-surface);
  background: var(--r-bg-surface);
  color: var(--r-text);
  text-decoration: none;
  isolation: isolate;
}

.r-card--pad-none {
  padding: 0;
}
.r-card--pad-sm {
  gap: 12px;
  padding: 12px;
}
.r-card--pad-md {
  padding: 16px;
}
.r-card--pad-lg {
  gap: 20px;
  padding: 24px;
}

@media (min-width: 640px) {
  .r-card--pad-md {
    padding: 20px;
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
  gap: 8px 16px;
}

.r-card--pad-none > .r-card__header {
  padding: 16px 16px 0;
}
.r-card--pad-none > .r-card__footer {
  padding: 0 16px 16px;
}

@media (min-width: 640px) {
  .r-card--pad-none > .r-card__header {
    padding: 20px 20px 0;
  }
  .r-card--pad-none > .r-card__footer {
    padding: 0 20px 20px;
  }
}

.r-card__heading {
  flex: 1 1 160px;
  min-width: 0;
}

/* Index and eyebrow share the top line, as on the 21 Strive spec pages. */
.r-card__kicker {
  display: flex;
  align-items: baseline;
  gap: 10px;
  min-width: 0;
  font-family: var(--r-font-mono);
  line-height: 1.4;
  text-transform: uppercase;
}
.r-card__kicker + * {
  margin-top: 6px;
}

.r-card__index {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-3xs);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.04em;
}

.r-card__eyebrow {
  flex: 0 1 auto;
  min-width: 0;
  overflow: hidden;
  color: var(--r-text-secondary);
  font-size: var(--r-text-2xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-caps);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.r-card__title {
  font-size: var(--r-text-lg);
  font-weight: var(--r-weight-semibold);
  line-height: 1.3;
  letter-spacing: var(--r-tracking-snug);
}

.r-card__subtitle {
  margin-top: 2px;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-sm);
}

.r-card__aside {
  display: flex;
  flex-shrink: 0;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
  max-width: 100%;
  margin-left: auto;
}

.r-card__meta {
  flex-shrink: 0;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-weight: var(--r-weight-medium);
  line-height: 1.4;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  white-space: nowrap;
}

/* On the kicker line the meta gives way before it pushes the card wider: both it and the eyebrow
   shrink and end in an ellipsis. */
.r-card__kicker > .r-card__meta {
  flex: 0 1 auto;
  min-width: 0;
  margin-left: auto;
  padding-left: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.r-card__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  max-width: 100%;
  margin: -4px 0;
}

.r-card__footer {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: auto;
}

/* The logogram sits behind the content, above the panel colour. */
.r-card > .r-card__supergraphic {
  z-index: -1;
}

/* Registration marks draw above the logogram. */
.r-card.r-marks::before {
  z-index: 1;
}

.r-card--muted {
  border-color: var(--r-border-subtle);
  background: var(--r-bg-muted);
}

.r-card--outline {
  background: transparent;
}

.r-card--interactive {
  cursor: pointer;
  transition:
    background-color var(--r-duration-fast) var(--r-ease-out),
    border-color var(--r-duration-fast) var(--r-ease-out);
}
.r-card--interactive:hover {
  border-color: var(--r-border-strong);
  background: var(--r-bg-muted);
}
.r-card--interactive:active {
  background: var(--r-bg-hover);
}

/* Brand: flat 21 Strive cobalt, white text. Tokens are re-pointed so nested components read. */
.r-card--brand {
  border-color: var(--r-feature-brand);
  background: var(--r-feature-brand);
  color-scheme: dark;
  --r-text: var(--r-on-brand);
  --r-text-secondary: color-mix(in srgb, var(--r-on-brand) 82%, transparent);
  --r-text-tertiary: color-mix(in srgb, var(--r-on-brand) 68%, transparent);
  --r-text-disabled: color-mix(in srgb, var(--r-on-brand) 42%, transparent);
  --r-border-subtle: color-mix(in srgb, var(--r-on-brand) 14%, transparent);
  --r-border: color-mix(in srgb, var(--r-on-brand) 24%, transparent);
  --r-border-strong: color-mix(in srgb, var(--r-on-brand) 46%, transparent);
  --r-bg-surface: var(--r-feature-brand);
  --r-bg-raised: var(--r-feature-brand);
  --r-bg-muted: color-mix(in srgb, var(--r-on-brand) 8%, transparent);
  --r-bg-hover: color-mix(in srgb, var(--r-on-brand) 14%, transparent);
  --r-bg-pressed: color-mix(in srgb, var(--r-on-brand) 22%, transparent);
  --r-bg-selected: color-mix(in srgb, var(--r-on-brand) 16%, transparent);
  --r-bg-track: color-mix(in srgb, var(--r-on-brand) 16%, transparent);
  --r-ink: var(--r-on-brand);
  --r-ink-hover: color-mix(in srgb, var(--r-on-brand) 86%, var(--r-feature-brand));
  --r-on-ink: var(--r-feature-brand);
  --r-brand-text: var(--r-on-brand);
  --r-brand-soft: color-mix(in srgb, var(--r-on-brand) 14%, transparent);
  --r-brand-border: color-mix(in srgb, var(--r-on-brand) 40%, transparent);
  --r-success-soft: color-mix(in srgb, var(--r-on-brand) 16%, transparent);
  --r-success-text: var(--r-on-brand);
  --r-danger-soft: color-mix(in srgb, var(--r-on-brand) 16%, transparent);
  --r-danger-text: var(--r-on-brand);
  --r-focus: var(--r-on-brand);
  --r-focus-ring: 0 0 0 1px var(--r-feature-brand), 0 0 0 3px var(--r-on-brand);
  --r-chart-1: var(--r-on-brand);
  --r-chart-context: color-mix(in srgb, var(--r-on-brand) 34%, transparent);
  --r-chart-track: color-mix(in srgb, var(--r-on-brand) 16%, transparent);
  --r-chart-grid: color-mix(in srgb, var(--r-on-brand) 18%, transparent);
  --r-chart-axis: color-mix(in srgb, var(--r-on-brand) 46%, transparent);
  --r-chart-label: color-mix(in srgb, var(--r-on-brand) 72%, transparent);
  --r-chart-surface: var(--r-feature-brand);
}

/* Signal: International Orange with black text. Live, now, the one thing that needs eyes. */
.r-card--signal {
  border-color: var(--r-signal);
  background: var(--r-signal);
  color-scheme: light;
  /* Black on International Orange is 5.5:1 at full strength and fails once it is tinted, so every
     level of text stays solid black here and the hierarchy comes from size and weight. */
  --r-text: var(--r-on-signal);
  --r-text-secondary: var(--r-on-signal);
  --r-text-tertiary: var(--r-on-signal);
  --r-text-disabled: color-mix(in srgb, var(--r-on-signal) 40%, transparent);
  --r-border-subtle: color-mix(in srgb, var(--r-on-signal) 14%, transparent);
  --r-border: color-mix(in srgb, var(--r-on-signal) 24%, transparent);
  --r-border-strong: color-mix(in srgb, var(--r-on-signal) 44%, transparent);
  --r-bg-surface: var(--r-signal);
  --r-bg-raised: var(--r-signal);
  --r-bg-muted: color-mix(in srgb, var(--r-on-signal) 6%, transparent);
  --r-bg-hover: color-mix(in srgb, var(--r-on-signal) 10%, transparent);
  --r-bg-pressed: color-mix(in srgb, var(--r-on-signal) 16%, transparent);
  --r-bg-selected: color-mix(in srgb, var(--r-on-signal) 12%, transparent);
  --r-bg-track: color-mix(in srgb, var(--r-on-signal) 14%, transparent);
  --r-ink: var(--r-on-signal);
  --r-ink-hover: color-mix(in srgb, var(--r-on-signal) 84%, var(--r-signal));
  --r-on-ink: var(--r-signal);
  --r-brand-text: var(--r-on-signal);
  --r-success-soft: color-mix(in srgb, var(--r-on-signal) 10%, transparent);
  --r-success-text: var(--r-on-signal);
  --r-danger-soft: color-mix(in srgb, var(--r-on-signal) 10%, transparent);
  --r-danger-text: var(--r-on-signal);
  --r-focus: var(--r-on-signal);
  --r-focus-ring: 0 0 0 1px var(--r-signal), 0 0 0 3px var(--r-on-signal);
  --r-chart-1: var(--r-on-signal);
  --r-chart-now: var(--r-on-signal);
  --r-chart-context: color-mix(in srgb, var(--r-on-signal) 30%, transparent);
  --r-chart-track: color-mix(in srgb, var(--r-on-signal) 14%, transparent);
  --r-chart-grid: color-mix(in srgb, var(--r-on-signal) 16%, transparent);
  --r-chart-axis: color-mix(in srgb, var(--r-on-signal) 44%, transparent);
  --r-chart-label: color-mix(in srgb, var(--r-on-signal) 72%, transparent);
  --r-chart-surface: var(--r-signal);
}

/* Ink: a dark island (data-theme="dark"), so everything inside picks up the dark tokens. */
.r-card--ink {
  border-color: var(--r-border-subtle);
  background: var(--r-feature-ink);
  --r-bg-surface: var(--r-feature-ink);
  --r-chart-surface: var(--r-feature-ink);
  /* The ring token is computed on :root, so an island re-declares it with its own colours. */
  --r-focus-ring: 0 0 0 1px var(--r-feature-ink), 0 0 0 3px var(--r-focus);
}
</style>
