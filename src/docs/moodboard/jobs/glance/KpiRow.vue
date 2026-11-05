<script setup lang="ts">
/**
 * The numbers a team checks every morning, butted together in a ruled row. Pressing one opens
 * its shape and what it is measured against; arrow keys walk the row.
 */
import { computed } from 'vue'
import { RSparkline, RTrend } from '@/design-system'
import { useRoving } from './shared'

interface Kpi {
  label: string
  /** Already formatted: "Rp 412 jt", "98.6". */
  value: string
  unit?: string
  /** Change over the period. */
  delta: number
  /** Unit of the change: "%" (default) or " pp". */
  suffix?: string
  /** Lower is better. */
  invert?: boolean
  series?: number[]
  /** What it is measured against: "Target 3.0% · ahead by 0.4 pp". */
  note?: string
}

const props = withDefaults(
  defineProps<{
    label?: string
    /** "Today", "This week". */
    period?: string
    items: Kpi[]
    /** Cells per row; defaults to all in one row. */
    cols?: number
    /** Where the selected KPI's shape goes. */
    detail?: 'below' | 'side' | 'none'
    sparkHeight?: number
  }>(),
  { detail: 'below', sparkHeight: 64 },
)

const columns = computed(() => props.cols ?? props.items.length)
const roving = useRoving({ count: () => props.items.length, cols: () => columns.value })
const kpi = computed(() => props.items[roving.active.value] ?? props.items[0])
</script>

<template>
  <div class="mk kpi" :class="`kpi--${detail}`">
    <div v-if="label" class="mk-row mk-between">
      <span class="r-label mk-truncate">{{ label }}</span>
      <span v-if="period" class="r-label kpi__period">{{ period }}</span>
    </div>
    <div class="kpi__body mk-grow">
      <div
        class="kpi__row"
        :class="{ 'is-wide': columns > 2 }"
        :style="{ '--cols': columns }"
        role="radiogroup"
        :aria-label="label ?? 'Key figures'"
        @keydown="roving.onKeydown"
      >
        <button
          v-for="(k, i) in items"
          :key="k.label"
          :ref="roving.bind(i)"
          type="button"
          role="radio"
          class="kpi__cell mk-reset"
          :class="{ 'is-on': i === roving.active.value }"
          :aria-checked="i === roving.active.value"
          :tabindex="i === roving.active.value ? 0 : -1"
          @click="roving.go(i)"
        >
          <span class="r-label kpi__label">{{ k.label }}</span>
          <span class="kpi__figure">
            <span class="mk-fig">{{ k.value }}</span>
            <span v-if="k.unit" class="mk-unit">{{ k.unit }}</span>
          </span>
          <RTrend :value="k.delta" :suffix="k.suffix ?? '%'" :invert="k.invert" size="sm" />
          <span v-if="detail === 'none' && k.note" class="kpi__note kpi__note--cell" :class="{ 'is-on': i === roving.active.value }">
            {{ k.note }}
          </span>
        </button>
      </div>
      <div v-if="detail !== 'none'" class="kpi__detail" aria-live="polite">
        <p class="kpi__detail-head">
          <span class="r-eyebrow mk-truncate">{{ kpi.label }}</span>
          <span v-if="period" class="r-label">{{ period }}</span>
        </p>
        <RSparkline
          v-if="kpi.series?.length"
          :key="kpi.label"
          :values="kpi.series"
          color="var(--r-chart-1)"
          :height="sparkHeight"
          area
          :label="`${kpi.label}, ${period ?? 'recent'} shape`"
        />
        <p v-if="kpi.note" class="kpi__note">{{ kpi.note }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.kpi {
  container-type: inline-size;
}

.kpi__period {
  flex: none;
}

.kpi__body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.kpi__row {
  display: grid;
  grid-template-columns: repeat(var(--cols), minmax(0, 1fr));
  border-top: 1px solid var(--r-border);
  border-left: 1px solid var(--r-border);
}

.kpi__cell {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  padding: 10px 10px 10px;
  border-right: 1px solid var(--r-border);
  border-bottom: 1px solid var(--r-border);
  cursor: pointer;
  transition: background-color var(--r-duration-fast) var(--r-ease-out);
}

.kpi__cell:hover {
  background: var(--r-bg-hover);
}

.kpi__cell.is-on {
  background: var(--r-bg-selected);
}

/* The selected cell carries a 2px cobalt rule along its top edge. */
.kpi__cell.is-on::before {
  content: '';
  position: absolute;
  top: -1px;
  right: -1px;
  left: -1px;
  height: 2px;
  background: var(--r-brand);
}

.kpi__cell:focus-visible {
  outline-offset: -2px;
}

.kpi__label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.kpi__figure {
  display: flex;
  align-items: baseline;
  gap: 4px;
  min-width: 0;
}

.kpi__figure .mk-fig {
  overflow: hidden;
  font-size: var(--r-text-2xl);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.kpi__detail {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  justify-content: flex-start;
  gap: 8px;
  min-height: 0;
}

.kpi__detail-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
}

.kpi__note {
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  line-height: 1.4;
}

.kpi__note--cell {
  overflow: hidden;
  color: var(--r-text-tertiary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.kpi__note--cell.is-on {
  color: var(--r-text);
}

/* Side: the shape of the selected figure sits at the end of the row. */
.kpi--side .kpi__body {
  display: grid;
  grid-template-columns: minmax(0, 3fr) minmax(0, 1fr);
  gap: 16px;
}

.kpi--side .kpi__detail {
  justify-content: space-between;
}

/* Narrow (a phone, or a small tile): smaller figures, and the side shape steps aside. */
@container (max-width: 480px) {
  .kpi__cell {
    gap: 4px;
    padding: 8px;
  }

  .kpi__figure .mk-fig {
    font-size: var(--r-text-xl);
  }

  .kpi--below .kpi__row.is-wide {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .kpi--side .kpi__body {
    display: flex;
  }

  .kpi--side .kpi__detail {
    display: none;
  }
}
</style>
