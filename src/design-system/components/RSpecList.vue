<script setup lang="ts">
import { formatNumber, withMinus } from '../composables/format'
import type { SpecItem } from '../types'

/** A datasheet: label left in mono caps, value right, hairline between rows. */
withDefaults(
  defineProps<{
    items: SpecItem[]
    /** Columns of label/value pairs on wide screens; collapses to one below 640px. */
    columns?: 1 | 2 | 3
    dense?: boolean
    /** `split` = label left, value right-aligned. `stack` = label above value. */
    layout?: 'split' | 'stack'
  }>(),
  { columns: 1, layout: 'split' },
)
defineSlots<{ value?(props: { item: SpecItem; index: number }): unknown }>()

function display(item: SpecItem): string {
  if (item.value == null || item.value === '') return '—'
  return typeof item.value === 'number' ? withMinus(formatNumber(item.value)) : item.value
}
</script>

<template>
  <dl class="r-spec" :class="[`r-spec--${layout}`, `r-spec--cols-${columns}`, { 'r-spec--dense': dense }]">
    <div v-for="(item, index) in items" :key="`${index}-${item.label}`" class="r-spec__row">
      <dt class="r-spec__label">{{ item.label }}</dt>
      <dd class="r-spec__value" :class="{ 'is-mono': item.mono, 'is-empty': item.value == null || item.value === '' }">
        <span class="r-spec__main">
          <span v-if="item.tone" class="r-spec__lamp" :class="`r-tone-${item.tone}`" aria-hidden="true" />
          <span class="r-spec__text"><slot name="value" :item="item" :index="index">{{ display(item) }}</slot></span>
        </span>
        <span v-if="item.hint" class="r-spec__hint">{{ item.hint }}</span>
      </dd>
    </div>
  </dl>
</template>

<style>
.r-spec {
  --r-spec-py: 10px;
  --r-spec-px: 16px;
  min-width: 0;
  margin: 0;
  border-top: 1px solid var(--r-border);
}

.r-spec--dense {
  --r-spec-py: 6px;
}

.r-spec__row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  min-width: 0;
  padding: var(--r-spec-py) 0;
  border-bottom: 1px solid var(--r-border);
}

.r-spec__label {
  flex: none;
  max-width: 50%;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-weight: var(--r-weight-medium);
  line-height: 20px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.r-spec__value {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  min-width: 0;
  margin: 0;
  color: var(--r-text);
  font-size: var(--r-text-md);
  line-height: 20px;
  text-align: right;
  overflow-wrap: anywhere;
}

.r-spec__value.is-mono {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-sm);
  font-variant-numeric: tabular-nums;
}

.r-spec__value.is-empty {
  color: var(--r-text-tertiary);
}

.r-spec__main {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  max-width: 100%;
}

.r-spec__text {
  min-width: 0;
}

.r-spec__lamp {
  flex: none;
  width: 6px;
  height: 6px;
  border-radius: var(--r-radius-round);
  background: var(--tone-lamp);
}

.r-spec__hint {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-sans);
  font-size: var(--r-text-xs);
  line-height: 18px;
}

.r-spec--dense .r-spec__value {
  font-size: var(--r-text-sm);
}
.r-spec--dense .r-spec__value.is-mono {
  font-size: var(--r-text-xs);
}

/* Stack: label above value, for narrow panels and long values. */
.r-spec--stack .r-spec__row {
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
  gap: 2px;
}
.r-spec--stack .r-spec__label {
  max-width: none;
  line-height: 16px;
}
.r-spec--stack .r-spec__value {
  align-items: flex-start;
  text-align: left;
}

/* Columns: a ruled grid. Rows run left to right, a 1px rule between columns. */
@media (min-width: 641px) {
  .r-spec--cols-2,
  .r-spec--cols-3 {
    display: grid;
    align-items: stretch;
  }
  .r-spec--cols-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .r-spec--cols-3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .r-spec--cols-2 .r-spec__row:nth-child(2n + 2),
  .r-spec--cols-3 .r-spec__row:not(:nth-child(3n + 1)) {
    padding-left: var(--r-spec-px);
    border-left: 1px solid var(--r-border);
  }
  .r-spec--cols-2 .r-spec__row:nth-child(2n + 1),
  .r-spec--cols-3 .r-spec__row:not(:nth-child(3n)) {
    padding-right: var(--r-spec-px);
  }
}
</style>
