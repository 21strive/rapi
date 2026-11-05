<script setup lang="ts">
/**
 * An experiment has run; the evidence is a ruled table of before against after, each change
 * signed and judged in a word. The person reads it and gives the verdict: ship it or take it
 * back. On a wide tile the daily line sits beside the table.
 */
import { computed, ref } from 'vue'
import { RButton, RLineChart, RStatus, type StatusTone } from '@/design-system'
import type { Zone } from '../../kit'
import DecisionStrip from './DecisionStrip.vue'
import { holdFocus, useDecision } from './shared'

interface Metric {
  label: string
  a: string
  b: string
  /** Signed, with the true minus: "−0.03 pp". */
  delta: string
  verdict: 'better' | 'within' | 'worse'
}

interface Trend {
  label: string
  labels: string[]
  a: number[]
  b: number[]
  unit?: string
}

const props = withDefaults(
  defineProps<{
    eyebrow: string
    title?: string
    /** Column heads: "Baseline", "Canary". */
    aLabel?: string
    bLabel?: string
    metrics: Metric[]
    /** The model's read, one line. */
    note?: string
    back: string
    ship: string
    backDone?: string
    shipDone?: string
    trend?: Trend
    zone?: Zone
  }>(),
  { title: undefined, aLabel: 'Before', bLabel: 'After', note: undefined, backDone: 'Rolled back', shipDone: 'Shipped', trend: undefined, zone: 'WIB' },
)

const root = ref<HTMLElement | null>(null)
const { choice, at, left, decide, undo } = useDecision<'ship' | 'back'>(10)

const verdicts: Record<Metric['verdict'], { tone: StatusTone; label: string }> = {
  better: { tone: 'success', label: 'Better' },
  within: { tone: 'neutral', label: 'Within' },
  worse: { tone: 'danger', label: 'Worse' },
}

function answer(value: 'ship' | 'back') {
  const restore = holdFocus(root)
  decide(value)
  restore('[data-focus="undo"]')
}

function revert() {
  const restore = holdFocus(root)
  undo()
  restore('[data-focus="ship"]')
}

const status = computed<{ tone: StatusTone; label: string }>(() => {
  if (choice.value === 'ship') return { tone: 'success', label: props.shipDone }
  if (choice.value === 'back') return { tone: 'neutral', label: props.backDone }
  return { tone: 'warning', label: 'Needs you' }
})

const series = computed(() =>
  props.trend
    ? [
        { name: props.aLabel, values: props.trend.a, color: 'var(--r-chart-context)' },
        { name: props.bLabel, values: props.trend.b, color: 'var(--r-brand)' },
      ]
    : [],
)
</script>

<template>
  <div ref="root" class="mk promote" :class="{ 'promote--trend': trend }">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <RStatus :tone="status.tone" :label="status.label" size="sm" />
    </div>
    <p v-if="title" class="promote__title">{{ title }}</p>

    <div class="promote__body">
      <table class="promote__table">
        <thead>
          <tr>
            <th scope="col"><span class="r-sr-only">Metric</span></th>
            <th scope="col">{{ aLabel }}</th>
            <th scope="col">{{ bLabel }}</th>
            <th scope="col">Change</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="m in metrics" :key="m.label">
            <th scope="row">{{ m.label }}</th>
            <td>{{ m.a }}</td>
            <td class="promote__b">{{ m.b }}</td>
            <td>
              <span class="promote__change">
                <span class="promote__delta">{{ m.delta }}</span>
                <RStatus :tone="verdicts[m.verdict].tone" :label="verdicts[m.verdict].label" size="sm" />
              </span>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="trend" class="promote__chart">
        <RLineChart :labels="trend.labels" :series="series" :height="150" :y-unit="trend.unit" :label="trend.label" />
      </div>
    </div>

    <p v-if="note && !choice" class="promote__note">{{ note }}</p>

    <div class="promote__foot mk-end">
      <DecisionStrip v-if="choice" :at="at" :left="left" :zone="zone" size="lg" @undo="revert" />
      <div v-else class="promote__keys">
        <RButton variant="outline" size="lg" @click="answer('back')">{{ back }}</RButton>
        <RButton tone="brand" size="lg" data-focus="ship" @click="answer('ship')">{{ ship }}</RButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.promote {
  container-type: inline-size;
  gap: 8px;
}

.promote__title {
  font-size: var(--r-text-md);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-snug);
  line-height: 1.3;
}

.promote__body {
  display: flex;
  gap: 20px;
  min-width: 0;
}

/* The evidence: mono caps heads, hairline rows, figures right-aligned and tabular. */
.promote__table {
  flex: 1 1 auto;
  min-width: 0;
  border-collapse: collapse;
  font-size: var(--r-text-xs);
  font-variant-numeric: tabular-nums;
}

.promote__table thead th {
  padding: 0 0 4px 8px;
  border-bottom: 1px solid var(--r-border);
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-medium);
  letter-spacing: 0.06em;
  text-align: right;
  text-transform: uppercase;
  white-space: nowrap;
}

.promote__table tbody th {
  padding: 5px 0;
  overflow: hidden;
  font-weight: var(--r-weight-regular);
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.promote__table td {
  padding: 5px 0 5px 8px;
  color: var(--r-text-secondary);
  text-align: right;
  white-space: nowrap;
}

.promote__table tbody tr {
  border-bottom: 1px solid var(--r-border-subtle);
}

.promote__table td.promote__b {
  color: var(--r-text);
}

.promote__change {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.promote__delta {
  color: var(--r-text);
}

.promote__chart {
  display: none;
  flex: 0 0 46%;
  min-width: 0;
}

.promote__note {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
  line-height: 1.4;
}

.promote__keys {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

/* Wide tiles draw the daily line next to the table. */
@container (min-width: 560px) {
  .promote__chart {
    display: block;
  }
}

/* Narrow tiles stack the verdict under the signed change, so both keep their words. */
@container (max-width: 420px) {
  .promote__change {
    flex-direction: column;
    align-items: flex-end;
    gap: 1px;
  }
}
/* The status word in the header never gives way to the eyebrow. */
.mk-row > .r-status {
  flex: none;
}
</style>
