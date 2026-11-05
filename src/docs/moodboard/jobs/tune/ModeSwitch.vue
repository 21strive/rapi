<script setup lang="ts">
/**
 * Two to four modes side by side, each with what it costs: charge for cheap or charge fast,
 * settle instantly or tomorrow, a strict or an open sign-in. The library's RSegmented picks the
 * mode (click, or arrow keys inside it); the figure and the line under it answer for that mode.
 * With a table, the mode is a density and the table below shows how many rows it fits.
 */
import { computed, ref } from 'vue'
import { RSegmented, useElementSize } from '@/design-system'

interface Mode {
  value: string
  label: string
  /** The figure the mode is judged by: "06:40", "0.7%". */
  figure: string
  unit?: string
  /** Mono caps over the figure: "Full by". */
  caption: string
  detail: string
  /** A status word beside the figure, always with its tone. */
  word?: string
  tone?: 'success' | 'warning' | 'danger'
  /** Row height for the table preview. */
  row?: number
}

const props = defineProps<{
  label: string
  modes: Mode[]
  value: string
  table?: { columns: string[]; rows: string[][] }
}>()

const mode = ref(props.value)
const current = computed(() => props.modes.find((m) => m.value === mode.value) ?? props.modes[0])
const options = computed(() => props.modes.map((m) => ({ label: m.label, value: m.value })))

const box = ref<HTMLElement | null>(null)
const { height } = useElementSize(box)
const fits = computed(() => {
  const row = current.value.row ?? 40
  return Math.max(0, Math.floor((height.value - 28) / row))
})
</script>

<template>
  <div class="mk mode" :class="{ 'mode--table': table }">
    <p class="r-label mk-truncate">{{ label }}</p>
    <RSegmented v-model="mode" :options="options" size="sm" block :label="label" />

    <div class="mode__out" aria-live="polite">
      <p class="mode__caption">
        <span class="r-label">{{ current.caption }}</span>
        <span v-if="current.word" class="mode__word" :class="`is-${current.tone}`">{{ current.word }}</span>
      </p>
      <p class="mode__figure">
        <span class="mk-fig">{{ table ? fits : current.figure }}</span>
        <span v-if="table" class="mk-unit">rows in view</span>
        <span v-else-if="current.unit" class="mk-unit">{{ current.unit }}</span>
      </p>
      <p class="mode__detail">{{ current.detail }}</p>
    </div>

    <div v-if="table" ref="box" class="mode__table mk-grow" aria-hidden="true">
      <table :style="{ '--row': `${current.row ?? 40}px` }">
        <thead>
          <tr>
            <th v-for="c in table.columns" :key="c">{{ c }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(r, i) in table.rows" :key="i">
            <td v-for="(cell, k) in r" :key="k" :class="{ 'is-num': k === r.length - 1 }">{{ cell }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.mode {
  gap: 8px;
}

.mode__out {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  margin-top: auto;
}
.mode--table .mode__out {
  margin-top: 0;
}

.mode__caption {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}

.mode__word {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.mode__word.is-success {
  color: var(--r-success-text);
}
.mode__word.is-warning {
  color: var(--r-warning-text);
}
.mode__word.is-danger {
  color: var(--r-danger-text);
}

.mode__figure {
  display: flex;
  align-items: baseline;
  gap: 6px;
  white-space: nowrap;
}
.mode__figure .mk-fig {
  font-size: var(--r-text-2xl);
}

.mode__detail {
  overflow: hidden;
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* The table preview uses the real row heights of the language: 32 compact, 40 comfortable. */
.mode__table {
  flex: 1 1 0;
  min-height: 0;
  overflow: hidden;
  border-top: 1px solid var(--r-border);
}
.mode__table table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--r-text-xs);
}
.mode__table th {
  height: 28px;
  padding: 0 8px;
  border-bottom: 1px solid var(--r-border);
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-medium);
  letter-spacing: 0.06em;
  text-align: left;
  text-transform: uppercase;
}
.mode__table th:last-child {
  text-align: right;
}
.mode__table td {
  height: var(--row);
  padding: 0 8px;
  border-bottom: 1px solid var(--r-border-subtle);
  white-space: nowrap;
  transition: height var(--r-duration-base) var(--r-ease-out);
}
.mode__table td.is-num {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-variant-numeric: tabular-nums;
  text-align: right;
}
</style>
