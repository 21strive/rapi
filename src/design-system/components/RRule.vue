<script setup lang="ts">
/** A section divider: "01 ── TELEMETRY ─────────── META". */
withDefaults(
  defineProps<{
    label?: string
    /** Running index shown before the label, e.g. "01". */
    index?: string
    /** Quiet text at the right end. */
    meta?: string
    /** `strong` = 2px ink rule for top-of-page headers. */
    weight?: 'hairline' | 'strong'
    /** Element to render, e.g. "h2" when the rule names a section. Its content is phrasing only. */
    as?: string
  }>(),
  { weight: 'hairline', as: 'div' },
)
defineSlots<{ default?(): unknown; meta?(): unknown }>()
</script>

<template>
  <component
    :is="as"
    class="r-rule"
    :class="`r-rule--${weight}`"
    :role="!label && !index && !meta && !$slots.default && !$slots.meta ? 'separator' : undefined"
  >
    <span v-if="index" class="r-rule__index">{{ index }}</span>
    <span v-if="label || $slots.default" class="r-rule__label"><slot>{{ label }}</slot></span>
    <span class="r-rule__line" aria-hidden="true" />
    <span v-if="meta || $slots.meta" class="r-rule__meta"><slot name="meta">{{ meta }}</slot></span>
  </component>
</template>

<style>
.r-rule {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  min-height: 16px;
  margin: 0;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-weight: var(--r-weight-regular);
  line-height: 16px;
}

.r-rule__index {
  flex: none;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-3xs);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.04em;
}

.r-rule__label {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 8px;
  max-width: 60%;
  overflow: hidden;
  color: var(--r-text);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-caps);
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
}

.r-rule__line {
  flex: 1 1 auto;
  min-width: 24px;
  height: 1px;
  background: var(--r-border);
}

.r-rule--strong .r-rule__line {
  height: 2px;
  background: var(--r-ink);
}

.r-rule__meta {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 8px;
  color: var(--r-text-tertiary);
  font-weight: var(--r-weight-medium);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  white-space: nowrap;
}
</style>
