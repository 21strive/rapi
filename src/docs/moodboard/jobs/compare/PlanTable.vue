<script setup lang="ts">
/**
 * Side by side: three options in columns and the few things that tell them apart in rows, the
 * best of each row marked with a check. Pick a column to hold it in view; switch on "Only
 * differences" to drop the rows where every option says the same.
 */
import { computed, ref } from 'vue'
import { Check } from 'lucide-vue-next'
import { RSwitch } from '@/design-system'

interface Option {
  name: string
  /** Under the name: the price, the size. */
  sub?: string
  /** One sentence shown when the option is picked. */
  summary?: string
}

interface Row {
  label: string
  values: string[]
  /** Index of the option that does best on this row. */
  best?: number
}

const props = withDefaults(
  defineProps<{
    label: string
    options: Option[]
    rows: Row[]
    initial?: number
  }>(),
  { initial: 0 },
)

const sel = ref(props.initial)
const diffOnly = ref(false)
const same = (r: Row) => r.values.every((v) => v === r.values[0])
const shown = computed(() => (diffOnly.value ? props.rows.filter((r) => !same(r)) : props.rows))
const hidden = computed(() => props.rows.length - props.rows.filter((r) => !same(r)).length)
</script>

<template>
  <div class="mk cmp plan">
    <span class="r-label mk-truncate">{{ label }}</span>
    <div class="plan__wrap mk-grow">
      <table class="plan__table">
        <caption class="r-sr-only">{{ label }}</caption>
        <thead>
          <tr>
            <th scope="col"><span class="r-sr-only">Option</span></th>
            <th v-for="(o, i) in options" :key="o.name" scope="col" :class="{ 'is-sel': i === sel }">
              <button type="button" class="plan__pick mk-reset" :aria-pressed="i === sel" @click="sel = i">
                <span class="plan__name">{{ o.name }}</span>
                <span v-if="o.sub" class="plan__sub">{{ o.sub }}</span>
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in shown" :key="r.label" :class="{ 'is-same': same(r) }">
            <th scope="row">{{ r.label }}</th>
            <td v-for="(v, i) in r.values" :key="i" :class="{ 'is-sel': i === sel, 'is-best': r.best === i }">
              <span class="plan__cell">
                <Check v-if="r.best === i" :size="12" aria-hidden="true" />
                <span class="plan__value">{{ v }}</span>
                <span v-if="r.best === i" class="r-sr-only">, best</span>
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-if="options[sel].summary" class="plan__summary">
      <span class="plan__summary-name">{{ options[sel].name }}</span>
      {{ options[sel].summary }}
    </p>
    <div class="plan__foot">
      <RSwitch v-model="diffOnly" size="sm" label="Only differences" />
      <span class="r-label">{{ diffOnly ? `${hidden} same hidden` : `${rows.length} rows` }}</span>
    </div>
  </div>
</template>

<style scoped>
.plan {
  gap: 6px;
}

.plan__wrap {
  min-height: 0;
  overflow: hidden;
}

.plan__table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  font-size: var(--r-text-xs);
}

.plan__table th,
.plan__table td {
  height: 28px;
  padding: 0 4px;
  border-bottom: 1px solid var(--r-border-subtle);
  text-align: left;
  vertical-align: middle;
}

.plan__table thead th {
  height: auto;
  padding: 0;
  border-top: 2px solid transparent;
  border-bottom-color: var(--r-border);
  vertical-align: bottom;
}

.plan__table thead th:first-child {
  width: 24%;
}

.plan__table thead th.is-sel {
  border-top-color: var(--cmp-select);
}

.plan__table .is-sel {
  background: var(--r-bg-selected);
}

.plan__pick {
  display: flex;
  flex-direction: column;
  gap: 1px;
  width: 100%;
  padding: 6px 4px 5px;
  cursor: pointer;
}

.plan__pick:hover .plan__name {
  color: var(--r-text);
}

.plan__pick:focus-visible {
  outline-offset: -2px;
}

.plan__name {
  overflow: hidden;
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  font-weight: var(--r-weight-semibold);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.plan__table th.is-sel .plan__name {
  color: var(--r-text);
}

.plan__sub {
  overflow: hidden;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-variant-numeric: tabular-nums;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.plan__table tbody th {
  overflow: hidden;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-medium);
  letter-spacing: 0.04em;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
}

.plan__cell {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  max-width: 100%;
  overflow: hidden;
  color: var(--r-text-secondary);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.plan__value {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.plan__table td.is-sel .plan__cell {
  color: var(--r-text);
}

.plan__table td.is-best .plan__cell {
  color: var(--r-text);
  font-weight: var(--r-weight-semibold);
}

.plan__table tr.is-same td .plan__cell {
  color: var(--r-text-tertiary);
}

.plan__summary {
  min-width: 0;
  overflow: hidden;
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.plan__summary-name {
  color: var(--r-text);
  font-weight: var(--r-weight-semibold);
}

.plan__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
</style>
