<script setup lang="ts">
/**
 * The check: what the conversation produced, laid out so a person can read it in one pass before
 * committing. Rows the conversation filled or changed carry a cobalt rule on their leading edge
 * and the selection tint, so the person sees what was inferred and what they gave themselves.
 * Put the commit in the `actions` slot (one brand button, a quiet "Change"), or show `state` once
 * it is decided.
 */
import { RStatus } from '@/design-system'
import type { CheckRow } from './script'

withDefaults(
  defineProps<{
    eyebrow?: string
    title: string
    rows?: CheckRow[]
    /** Once decided: the outcome as a lamp and a word, instead of the actions. */
    state?: { tone: 'success' | 'danger' | 'neutral' | 'warning'; label: string; at?: string }
  }>(),
  { rows: () => [] },
)

defineSlots<{ default?(): unknown; actions?(): unknown }>()
</script>

<template>
  <div class="desk-check">
    <div class="desk-check__head">
      <p v-if="eyebrow" class="r-eyebrow">{{ eyebrow }}</p>
      <p class="desk-check__title">{{ title }}</p>
    </div>
    <dl v-if="rows.length" class="desk-check__rows">
      <div v-for="(row, i) in rows" :key="`${i}-${row.label}`" class="desk-check__row" :class="{ 'is-inferred': row.inferred }">
        <dt>{{ row.label }}</dt>
        <dd>
          <span :class="{ 'r-mono': row.mono }">{{ row.value }}</span>
          <span v-if="row.hint" class="desk-check__hint">{{ row.hint }}</span>
        </dd>
      </div>
    </dl>
    <slot />
    <div v-if="state" class="desk-check__state">
      <RStatus :tone="state.tone" :label="state.label" size="sm" />
      <span v-if="state.at" class="desk-check__at">{{ state.at }}</span>
    </div>
    <div v-else-if="$slots.actions" class="desk-check__actions"><slot name="actions" /></div>
  </div>
</template>

<style>
.desk-check {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  border: 1px solid var(--r-border-strong);
  background: var(--r-bg-surface);
}

.desk-check__title {
  margin-top: 2px;
  font-size: var(--r-text-md);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-snug);
  line-height: 1.3;
}

.desk-check__rows {
  display: flex;
  flex-direction: column;
  margin: 0;
  border-top: 1px solid var(--r-border-subtle);
}

.desk-check__row {
  display: grid;
  grid-template-columns: minmax(84px, 38%) minmax(0, 1fr);
  gap: 12px;
  padding: 6px 8px;
  border-bottom: 1px solid var(--r-border-subtle);
  font-size: var(--r-text-sm);
}

.desk-check__row dt {
  color: var(--r-text-tertiary);
}

.desk-check__row dd {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  margin: 0;
  overflow-wrap: anywhere;
}

/* Inferred from the conversation: the selection rule on its leading edge. */
.desk-check__row.is-inferred {
  box-shadow: inset 2px 0 0 var(--r-brand);
  background: var(--r-bg-selected);
}

.desk-check__hint {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

.desk-check__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.desk-check__state {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-top: 2px;
}

.desk-check__at {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
}
</style>
