<script setup lang="ts">
/* One facet of the audit log: a checkbox per value with the number of events that would match. */
import { RCheckbox, RStatus, formatNumber } from '@/design-system'
import type { FacetOption } from '../data'

defineProps<{ title: string; options: FacetOption[] }>()
const model = defineModel<string[]>({ default: () => [] })

function update(value: boolean | (string | number)[]) {
  if (Array.isArray(value)) model.value = value.map(String)
}
</script>

<template>
  <fieldset class="s-audit-log-facet">
    <legend class="s-audit-log-facet__title">{{ title }}</legend>
    <ul class="s-audit-log-facet__list">
      <li v-for="option in options" :key="option.value" class="s-audit-log-facet__row" :class="{ 'is-empty': !option.count }">
        <RCheckbox :model-value="model" :value="option.value" size="sm" class="s-audit-log-facet__check" @update:model-value="update">
          <span class="s-audit-log-facet__label">
            <RStatus v-if="option.tone" :tone="option.tone" size="sm" />
            {{ option.label }}
          </span>
        </RCheckbox>
        <span class="s-audit-log-facet__count">{{ formatNumber(option.count) }}</span>
      </li>
    </ul>
  </fieldset>
</template>

<style scoped>
.s-audit-log-facet {
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
}

.s-audit-log-facet__title {
  margin-bottom: 6px;
  padding: 0;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-weight: var(--r-weight-medium);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.s-audit-log-facet__list {
  display: grid;
}

.s-audit-log-facet__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 28px;
}

.s-audit-log-facet__check {
  min-width: 0;
}

.s-audit-log-facet__label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: var(--r-text-sm);
}

.s-audit-log-facet__count {
  flex: none;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
  font-variant-numeric: tabular-nums;
}

.s-audit-log-facet__row.is-empty .s-audit-log-facet__label,
.s-audit-log-facet__row.is-empty .s-audit-log-facet__count {
  color: var(--r-text-disabled);
}
</style>
