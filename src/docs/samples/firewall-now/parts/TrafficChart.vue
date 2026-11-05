<script setup lang="ts">
/**
 * Blocked requests over the last 24 hours, as on the Then screen, with one addition: while a rule
 * is waiting or logging, a dashed line shows what blocking would have looked like with it. The
 * legend carries the figures, so the panel reads in one look.
 */
import { computed } from 'vue'
import { RLineChart, formatNumber } from '@/design-system'
import { BLOCK_ALERT_PER_HOUR, HOURLY, HOURS } from '../../firewall/data'
import { PAST_TOTALS } from '../whatif'

const props = defineProps<{
  /** The rule being checked: its number and the blocked series with it in place. */
  overlay?: { no: string; blocked: number[]; added: number; verb: string } | null
}>()

const peak = HOURLY.blocked.indexOf(Math.max(...HOURLY.blocked))

const series = computed(() => [
  { name: 'Blocked', values: HOURLY.blocked, color: 'var(--r-chart-1)' },
  { name: 'Challenged', values: HOURLY.challenged, color: 'var(--r-chart-context)' },
  ...(props.overlay ? [{ name: `Blocked with rule ${props.overlay.no}`, values: props.overlay.blocked, color: 'var(--r-chart-1)', dashed: true }] : []),
])

const label = computed(
  () =>
    `Blocked and challenged requests per hour over the last 24 hours, against the alert line of ${formatNumber(BLOCK_ALERT_PER_HOUR)} an hour` +
    (props.overlay ? `, and blocked requests with rule ${props.overlay.no} in place, dashed` : ''),
)
</script>

<template>
  <div class="fw-traffic">
    <div class="fw-traffic__head">
      <h3 class="fw-traffic__title">Blocked requests</h3>
      <span class="fw-traffic__meta">Per hour · peak {{ formatNumber(HOURLY.blocked[peak]) }} at {{ HOURS[peak] }}</span>
    </div>
    <dl class="fw-traffic__figures">
      <div class="fw-traffic__figure">
        <dt><span class="fw-traffic__key" aria-hidden="true" />Blocked</dt>
        <dd>{{ formatNumber(PAST_TOTALS.blocked) }}</dd>
      </div>
      <div class="fw-traffic__figure">
        <dt><span class="fw-traffic__key fw-traffic__key--context" aria-hidden="true" />Challenged</dt>
        <dd>{{ formatNumber(PAST_TOTALS.challenged) }}</dd>
      </div>
      <div v-if="overlay" class="fw-traffic__figure fw-traffic__figure--what-if">
        <dt><span class="fw-traffic__key fw-traffic__key--dashed" aria-hidden="true" />With rule {{ overlay.no }}</dt>
        <dd>+{{ formatNumber(overlay.added) }}</dd>
      </div>
    </dl>
    <RLineChart
      class="fw-traffic__chart"
      :labels="HOURS"
      :series="series"
      area
      :legend="false"
      :now="HOURS.length - 1"
      :highlight="peak"
      :references="[{ value: BLOCK_ALERT_PER_HOUR, label: `Alert ${formatNumber(BLOCK_ALERT_PER_HOUR)} / h`, kind: 'threshold', align: 'start' }]"
      y-unit="req/h"
      :height="196"
      :format="(v: number) => formatNumber(v)"
      :label="label"
    />
  </div>
</template>

<style scoped>
.fw-traffic {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
  padding: 12px 16px 8px;
}

.fw-traffic__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.fw-traffic__title {
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-semibold);
}

.fw-traffic__meta {
  overflow: hidden;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  letter-spacing: 0.04em;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
}

/* The legend with its figures: swatch, name, value. */
.fw-traffic__figures {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 28px;
  margin: 0;
}

.fw-traffic__figure {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.fw-traffic__figure dt {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-medium);
  letter-spacing: var(--r-tracking-caps);
  text-transform: uppercase;
}

.fw-traffic__figure dd {
  margin: 0;
  font-size: var(--r-text-lg);
  font-variant-numeric: tabular-nums;
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-tight);
  line-height: 1.2;
}

.fw-traffic__figure--what-if dd {
  color: var(--r-brand-text);
}

.fw-traffic__key {
  width: 12px;
  height: 2px;
  background: var(--r-chart-1);
}

.fw-traffic__key--context {
  background: var(--r-chart-context);
}

/* Dashed, as the line is: a what-if. */
.fw-traffic__key--dashed {
  height: 0;
  border-top: 2px dashed var(--r-chart-1);
  background: none;
}

.fw-traffic__chart {
  min-width: 0;
}
</style>
