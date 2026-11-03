<script setup lang="ts">
import { computed, getCurrentInstance } from 'vue'
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-vue-next'
import RCheckbox from './RCheckbox.vue'
import type { TableColumn, TableSort } from '../types'

type Row = Record<string, any>
type Key = string | number

const props = withDefaults(
  defineProps<{
    columns: TableColumn[]
    rows: Row[]
    /** Property name or function that gives each row a stable key. */
    rowKey?: string | ((row: Row) => Key)
    selectable?: boolean
    /** Rows of 40px (comfortable) or 32px (compact). */
    density?: 'compact' | 'comfortable'
    /** Needs `maxHeight` so the table has its own scroll area. */
    stickyHeader?: boolean
    maxHeight?: string
    emptyText?: string
    /** Read by screen readers, not shown. */
    caption?: string
    /** Sort outside (e.g. on the server); the table then only reports `sort` changes. */
    manualSort?: boolean
    /** Names a row for its checkbox: "Select Travearth". */
    rowLabel?: (row: Row) => string
    /** Extra classes per row, e.g. to mark the row whose drawer is open. */
    rowClass?: (row: Row, index: number) => string | string[] | Record<string, boolean>
  }>(),
  { rowKey: 'id', density: 'comfortable', emptyText: 'Nothing to show yet.' },
)

const selected = defineModel<Key[]>('selected', { default: () => [] })
const sort = defineModel<TableSort | null>('sort', { default: null })
const emit = defineEmits<{ 'row-click': [row: Row, index: number] }>()

defineSlots<{
  empty?(): unknown
  [name: `cell-${string}`]: (props: { row: Row; value: any; index: number }) => unknown
  [name: `header-${string}`]: (props: { column: TableColumn }) => unknown
}>()

const instance = getCurrentInstance()
const clickable = computed(() => !!instance?.vnode.props?.onRowClick)

const keyOf = (row: Row): Key => (typeof props.rowKey === 'function' ? props.rowKey(row) : row[props.rowKey])

const view = computed(() => {
  const s = sort.value
  if (!s || props.manualSort) return props.rows
  const column = props.columns.find((c) => c.key === s.key)
  const read = column?.sortValue ?? ((row: Row) => row[s.key])
  const dir = s.direction === 'asc' ? 1 : -1
  return [...props.rows].sort((a, b) => {
    const x = read(a)
    const y = read(b)
    if (x == null && y == null) return 0
    if (x == null) return 1
    if (y == null) return -1
    if (typeof x === 'number' && typeof y === 'number') return (x - y) * dir
    return String(x).localeCompare(String(y), undefined, { numeric: true, sensitivity: 'base' }) * dir
  })
})

function toggleSort(column: TableColumn) {
  const s = sort.value
  if (!s || s.key !== column.key) sort.value = { key: column.key, direction: 'asc' }
  else if (s.direction === 'asc') sort.value = { key: column.key, direction: 'desc' }
  else sort.value = null
}

function ariaSort(column: TableColumn) {
  if (sort.value?.key === column.key) return sort.value.direction === 'asc' ? 'ascending' : 'descending'
  return column.sortable ? 'none' : undefined
}

const alignOf = (column: TableColumn) => column.align ?? (column.numeric ? 'right' : 'left')

const visibleKeys = computed(() => view.value.map(keyOf))
const selectedSet = computed(() => new Set(selected.value))
const allSelected = computed(() => visibleKeys.value.length > 0 && visibleKeys.value.every((k) => selectedSet.value.has(k)))
const someSelected = computed(() => !allSelected.value && visibleKeys.value.some((k) => selectedSet.value.has(k)))

function toggleAll() {
  if (allSelected.value) {
    const visible = new Set(visibleKeys.value)
    selected.value = selected.value.filter((k) => !visible.has(k))
  } else {
    selected.value = Array.from(new Set([...selected.value, ...visibleKeys.value]))
  }
}

function toggleRow(row: Row) {
  const key = keyOf(row)
  selected.value = selectedSet.value.has(key) ? selected.value.filter((k) => k !== key) : [...selected.value, key]
}
</script>

<template>
  <div
    class="r-table"
    :class="[`r-table--${density}`, { 'r-table--sticky': stickyHeader, 'r-table--clickable': clickable }]"
    :style="maxHeight ? { maxHeight } : undefined"
  >
    <table class="r-table__table">
      <caption v-if="caption" class="r-sr-only">{{ caption }}</caption>
      <thead>
        <tr>
          <th v-if="selectable" class="r-table__select" scope="col">
            <RCheckbox
              :model-value="allSelected"
              :indeterminate="someSelected"
              size="sm"
              aria-label="Select all rows"
              @update:model-value="toggleAll"
            />
          </th>
          <th
            v-for="column in columns"
            :key="column.key"
            scope="col"
            :class="`is-${alignOf(column)}`"
            :style="column.width ? { width: column.width } : undefined"
            :aria-sort="ariaSort(column)"
          >
            <slot :name="`header-${column.key}`" :column="column">
              <button v-if="column.sortable" type="button" class="r-table__sort" @click="toggleSort(column)">
                <span>{{ column.label }}</span>
                <ArrowUp v-if="sort?.key === column.key && sort.direction === 'asc'" />
                <ArrowDown v-else-if="sort?.key === column.key" />
                <ChevronsUpDown v-else class="is-idle" />
              </button>
              <template v-else>{{ column.label }}</template>
            </slot>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(row, index) in view"
          :key="keyOf(row)"
          :class="[{ 'is-selected': selectedSet.has(keyOf(row)) }, rowClass?.(row, index)]"
          :tabindex="clickable ? 0 : undefined"
          @click="emit('row-click', row, index)"
          @keydown.enter.self="emit('row-click', row, index)"
          @keydown.space.self.prevent="emit('row-click', row, index)"
        >
          <td v-if="selectable" class="r-table__select" @click.stop>
            <RCheckbox
              :model-value="selectedSet.has(keyOf(row))"
              size="sm"
              :aria-label="rowLabel ? `Select ${rowLabel(row)}` : 'Select row'"
              @update:model-value="toggleRow(row)"
            />
          </td>
          <td
            v-for="column in columns"
            :key="column.key"
            :class="[`is-${alignOf(column)}`, { 'is-numeric': column.numeric }]"
          >
            <slot :name="`cell-${column.key}`" :row="row" :value="row[column.key]" :index="index">
              {{ column.format ? column.format(row[column.key], row) : row[column.key] }}
            </slot>
          </td>
        </tr>
        <tr v-if="!view.length" class="r-table__empty-row">
          <td :colspan="columns.length + (selectable ? 1 : 0)">
            <slot name="empty">
              <div class="r-table__empty">{{ emptyText }}</div>
            </slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style>
.r-table {
  position: relative;
  width: 100%;
  overflow: auto;
  overscroll-behavior-x: contain;
}

.r-table__table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: var(--r-text-sm);
}

/* Heads: Geist Mono capitals on the muted band, a 1px rule beneath. */
.r-table th {
  height: 32px;
  padding: 0 12px;
  border-bottom: 1px solid var(--r-border);
  background: var(--r-bg-muted);
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-weight: var(--r-weight-medium);
  letter-spacing: 0.06em;
  text-align: left;
  text-transform: uppercase;
  white-space: nowrap;
}

.r-table td {
  height: 40px;
  padding: 0 12px;
  border-bottom: 1px solid var(--r-border-subtle);
  color: var(--r-text);
  white-space: nowrap;
}

.r-table--compact td {
  height: 32px;
}
.r-table--compact th {
  height: 28px;
}

.r-table th:first-child,
.r-table td:first-child {
  padding-left: 16px;
}
.r-table th:last-child,
.r-table td:last-child {
  padding-right: 16px;
}

.r-table tbody tr {
  transition: background-color var(--r-duration-fast) var(--r-ease-out);
}
.r-table tbody tr:hover {
  background: var(--r-bg-muted);
}
/* Selected: the selection tint with a 2px cobalt rule on the leading edge. */
.r-table tbody tr.is-selected {
  background: var(--r-bg-selected);
}
.r-table tbody tr.is-selected > td:first-child {
  box-shadow: inset 2px 0 0 var(--r-brand);
}
.r-table tbody tr:last-child td {
  border-bottom: 0;
}
.r-table--clickable tbody tr:not(.r-table__empty-row) {
  cursor: pointer;
}

.r-table .is-right {
  text-align: right;
}
.r-table .is-center {
  text-align: center;
}

/* Figures line up digit by digit: Geist Mono, tabular, right-aligned. */
.r-table td.is-numeric {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0;
}

.r-table .r-table__select {
  width: 40px;
  padding-right: 0;
}
.r-table td.r-table__select .r-checkbox,
.r-table th.r-table__select .r-checkbox {
  vertical-align: middle;
}

.r-table__sort {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin: 0 -4px;
  padding: 2px 4px;
  border: 0;
  border-radius: var(--r-radius-control);
  background: none;
  color: inherit;
  font: inherit;
  letter-spacing: inherit;
  text-transform: inherit;
  cursor: pointer;
}
.r-table__sort:hover {
  background: var(--r-bg-hover);
  color: var(--r-text);
}
th[aria-sort='ascending'] .r-table__sort,
th[aria-sort='descending'] .r-table__sort {
  color: var(--r-text);
}
.r-table__sort svg {
  width: 12px;
  height: 12px;
}
.r-table__sort .is-idle {
  opacity: 0.5;
}
th.is-right .r-table__sort {
  flex-direction: row-reverse;
}

.r-table--sticky thead th {
  position: sticky;
  z-index: 1;
  top: 0;
}

.r-table__empty-row:hover {
  background: none !important;
}
.r-table__empty {
  padding: 40px 16px;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-sm);
  text-align: center;
  white-space: normal;
}

/* Clickable rows are reachable with Tab and open with Enter or Space. */
.r-table tbody tr[tabindex]:focus-visible {
  outline: 2px solid var(--r-focus);
  outline-offset: -2px;
}
</style>
