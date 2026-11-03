<script setup lang="ts">
import { RSparkline } from '@/design-system'
import { pct, price } from '../data'

export interface WatchRow {
  ticker: string
  name: string
  last: number
  change: number
  spark: number[]
}

defineProps<{ rows: WatchRow[]; selected: string }>()
const emit = defineEmits<{ select: [ticker: string] }>()

function onKeydown(event: KeyboardEvent, index: number, rows: WatchRow[]) {
  const next = event.key === 'ArrowDown' ? index + 1 : event.key === 'ArrowUp' ? index - 1 : null
  if (next === null) return
  event.preventDefault()
  const target = rows[(next + rows.length) % rows.length]
  emit('select', target.ticker)
  const list = (event.currentTarget as HTMLElement).parentElement
  ;(list?.children[(next + rows.length) % rows.length] as HTMLElement | undefined)?.focus()
}
</script>

<template>
  <div class="s-tt-watch" role="listbox" aria-label="Watchlist">
    <button
      v-for="(row, i) in rows"
      :key="row.ticker"
      type="button"
      role="option"
      class="s-tt-watch__row"
      :class="{ 'is-selected': row.ticker === selected }"
      :aria-selected="row.ticker === selected"
      :tabindex="row.ticker === selected ? 0 : -1"
      @click="emit('select', row.ticker)"
      @keydown="onKeydown($event, i, rows)"
    >
      <span class="s-tt-watch__id">
        <span class="s-tt-watch__ticker">{{ row.ticker }}</span>
        <span class="s-tt-watch__name">{{ row.name.replace(/^PT /, '').replace(/ Tbk$/, '') }}</span>
      </span>
      <RSparkline
        :values="row.spark"
        :width="52"
        :height="22"
        :end-dot="false"
        :label="`${row.ticker} today, ${pct(row.change)}`"
      />
      <span class="s-tt-watch__quote">
        <span class="s-tt-watch__last">{{ price(row.last) }}</span>
        <span class="s-tt-watch__chg" :class="row.change < 0 ? 'is-down' : 'is-up'">{{ pct(row.change) }}</span>
      </span>
    </button>
  </div>
</template>

<style scoped>
.s-tt-watch {
  display: flex;
  flex-direction: column;
}

.s-tt-watch__row {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 52px 64px;
  align-items: center;
  gap: 10px;
  height: 40px;
  padding: 0 12px;
  border: 0;
  border-bottom: 1px solid var(--r-border-subtle);
  background: none;
  color: var(--r-text);
  text-align: left;
  cursor: pointer;
}
.s-tt-watch__row:hover {
  background: var(--r-bg-muted);
}
.s-tt-watch__row.is-selected {
  background: var(--r-bg-selected);
}
.s-tt-watch__row.is-selected::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 2px;
  background: var(--r-brand);
}
.s-tt-watch__row:focus-visible {
  outline-offset: -2px;
}

.s-tt-watch__id {
  display: flex;
  flex-direction: column;
  min-width: 0;
  line-height: 1.25;
}

.s-tt-watch__ticker {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: 0.04em;
}

.s-tt-watch__name {
  overflow: hidden;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-2xs);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.s-tt-watch__quote {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  font-family: var(--r-font-mono);
  font-variant-numeric: tabular-nums;
  line-height: 1.25;
}

.s-tt-watch__last {
  font-size: var(--r-text-xs);
}

.s-tt-watch__chg {
  font-size: var(--r-text-2xs);
}
.s-tt-watch__chg.is-up {
  color: var(--r-success-text);
}
.s-tt-watch__chg.is-down {
  color: var(--r-danger-text);
}
</style>
