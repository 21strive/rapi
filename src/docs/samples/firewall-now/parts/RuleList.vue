<script setup lang="ts">
/**
 * The rules in the order they run, with what each matched in the last 24 hours. A rule being
 * checked sits in its place, marked like a selection, its figure a preview (hatched): where it
 * goes in the order is something to see, not a field to set.
 */
import { computed } from 'vue'
import { RStatus, formatNumber } from '@/design-system'
import type { ListRow } from '../script'

const props = defineProps<{ rows: ListRow[] }>()

const max = computed(() => Math.max(1, ...props.rows.map((r) => r.matches)))
const on = computed(() => props.rows.filter((r) => r.state !== 'off' && r.state !== 'draft').length)
const total = computed(() => props.rows.filter((r) => r.state !== 'draft').length)

/** The draft needs no tag: it is the row marked as the selection, and Needs you says what it is. */
const TAG: Record<ListRow['state'], string> = { on: '', off: 'Off', draft: '', log: 'Log only', new: 'New' }
</script>

<template>
  <div class="fw-rules">
    <div class="fw-rules__head">
      <h3 class="fw-rules__title">Rules</h3>
      <span class="fw-rules__meta">Top to bottom · {{ on }} of {{ total }} on</span>
    </div>
    <ol class="fw-rules__list" aria-label="Rules in the order they run, with matches in the last 24 hours">
      <li v-for="row in rows" :key="row.id" class="fw-rule" :class="`is-${row.state}`">
        <span class="fw-rule__no">{{ row.no }}</span>
        <span class="fw-rule__name" :title="row.name">
          {{ row.name }}<span v-if="row.state === 'draft'" class="r-sr-only">, draft, not live</span>
        </span>
        <span class="fw-rule__tag">
          <RStatus v-if="row.state === 'log'" tone="signal" size="sm" pulse label="Log only" />
          <template v-else-if="TAG[row.state]">{{ TAG[row.state] }}</template>
        </span>
        <span class="fw-rule__bar" aria-hidden="true">
          <i :class="{ 'r-hatch': row.preview }" :style="{ width: `${Math.max(row.matches ? 4 : 0, (row.matches / max) * 100)}%` }" />
        </span>
        <span class="fw-rule__n">
          {{ formatNumber(row.matches) }}<span class="r-sr-only">{{ row.preview ? ' in the 24-hour preview' : ' matches in 24 hours' }}</span>
        </span>
      </li>
    </ol>
  </div>
</template>

<style scoped>
.fw-rules {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
  padding: 12px 0 8px;
}

.fw-rules__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding: 0 16px;
}

.fw-rules__title {
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-semibold);
}

.fw-rules__meta {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  white-space: nowrap;
}

.fw-rules__list {
  margin: 0;
  padding: 0;
  list-style: none;
  border-top: 1px solid var(--r-border-subtle);
}

.fw-rule {
  position: relative;
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr) auto 32px 52px;
  align-items: center;
  gap: 8px;
  height: 24px;
  padding: 0 16px;
  border-bottom: 1px solid var(--r-border-subtle);
  font-size: var(--r-text-xs);
}

.fw-rule__no,
.fw-rule__n {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-variant-numeric: tabular-nums;
}

.fw-rule__no {
  color: var(--r-text-tertiary);
}

.fw-rule__n {
  text-align: right;
}

.fw-rule__name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fw-rule__tag {
  display: inline-flex;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-caps);
  text-transform: uppercase;
  white-space: nowrap;
}

/* Matches as a share of the busiest rule; a preview is hatched, like a forecast. */
.fw-rule__bar {
  height: 6px;
  background: var(--r-chart-track);
}

.fw-rule__bar i {
  display: block;
  height: 100%;
  background-color: var(--r-chart-1);
}

.fw-rule__bar i.r-hatch {
  border: 1px solid var(--r-chart-1);
  background-color: transparent;
}

/* The rule being checked: in its place, marked like a selection. */
.fw-rule.is-draft {
  padding-left: 14px;
  border-left: 2px solid var(--r-brand);
  background: var(--r-bg-selected);
}
.fw-rule.is-draft .fw-rule__no,
.fw-rule.is-draft .fw-rule__tag {
  color: var(--r-brand-text);
}
.fw-rule.is-draft .fw-rule__name {
  font-weight: var(--r-weight-medium);
}

.fw-rule.is-new .fw-rule__tag {
  color: var(--r-brand-text);
}

.fw-rule.is-off .fw-rule__name,
.fw-rule.is-off .fw-rule__n {
  color: var(--r-text-tertiary);
}
.fw-rule.is-off .fw-rule__bar i {
  background-color: var(--r-chart-context);
}
</style>
