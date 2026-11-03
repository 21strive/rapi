<script setup lang="ts">
import { computed } from 'vue'
import { RBadge, RMeter, RReadout, RStat, formatNumber } from '@/design-system'
import { type CycleSummary, type Plan, org, usd } from '../data'

/** The current plan as a ruled band: identity, money so far, money at the end, seats, days left. */
const props = defineProps<{
  plan: Plan
  scheduled: Plan | null
  changed: boolean
  summary: CycleSummary
  /** Last cycle's total, for the trend on the projection. */
  previousTotal: number
  dayName: (day: number) => string
}>()

const trend = computed(() => ((props.summary.projected.total - props.previousTotal) / props.previousTotal) * 100)
</script>

<template>
  <section class="s-billing-band r-grid-ruled" aria-label="Current plan">
    <div class="s-billing-band__plan">
      <p class="r-eyebrow s-billing-band__eyebrow">Current plan</p>
      <div class="s-billing-band__name">
        <h2 class="r-h2">{{ plan.name }}</h2>
        <RBadge variant="outline">Monthly</RBadge>
        <RBadge v-if="changed" tone="brand">Changed today</RBadge>
      </div>
      <p class="r-body-sm s-billing-band__note">
        {{ usd(plan.fee) }} platform fee a month, usage metered on top, {{ plan.quota.seats }} seats.
        <template v-if="scheduled"> Moves to {{ scheduled.name }} on 1 Dec 2026.</template>
        <template v-else> Renews 1 Dec 2026.</template>
      </p>
    </div>

    <div class="s-billing-band__cell">
      <RStat label="Month to date" :value="summary.toDate.total" :decimals="2" unit="USD" size="md">
        <template #footer>
          <span class="s-billing-band__sub">{{ usd(summary.toDate.fee, 0) }} fee + {{ formatNumber(Math.round(summary.toDate.usage)) }} usage</span>
        </template>
      </RStat>
    </div>

    <div class="s-billing-band__cell">
      <RStat
        label="Projected at 30 Nov"
        :value="summary.projected.total"
        :decimals="2"
        unit="USD"
        size="md"
        :trend="Math.round(trend * 10) / 10"
        invert-trend
        trend-label="vs October"
      />
    </div>

    <div class="s-billing-band__cell">
      <RStat label="Spend limit" :value="org.spendLimit" unit="USD" size="md">
        <template #footer>
          <span class="s-billing-band__sub">
            <template v-if="summary.limitDay">Forecast passes it on {{ dayName(summary.limitDay) }}</template>
            <template v-else>Forecast stays under it</template>
          </span>
        </template>
      </RStat>
      <RMeter
        :segments="[{ value: summary.toDate.total, label: 'Spent so far', color: 'var(--r-chart-1)' }]"
        :max="org.spendLimit"
        :height="6"
        :label="`${usd(summary.toDate.total)} of the ${usd(org.spendLimit, 0)} spend limit used`"
      />
    </div>

    <div class="s-billing-band__cell">
      <RReadout
        label="Days left"
        :value="String(summary.daysLeft).padStart(2, '0')"
        unit="of 30"
        font="pixel"
        size="lg"
        ghost
        sub="Cycle 1–30 Nov 2026"
      />
    </div>
  </section>
</template>

<style scoped>
.s-billing-band {
  grid-template-columns: minmax(280px, 1.5fr) repeat(4, minmax(0, 1fr));
}

.s-billing-band > * {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
  padding: 16px 20px;
}

.s-billing-band__plan {
  gap: 6px;
}

.s-billing-band__eyebrow,
.s-billing-band__note {
  color: var(--r-text-secondary);
}

.s-billing-band__name {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 10px;
}

.s-billing-band__cell {
  justify-content: space-between;
}

.s-billing-band__sub {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

@media (max-width: 1279px) {
  .s-billing-band {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
  .s-billing-band__plan {
    grid-column: 1 / -1;
  }
}

@media (max-width: 760px) {
  .s-billing-band {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .s-billing-band > * {
    padding: 14px 16px;
  }
}
</style>
