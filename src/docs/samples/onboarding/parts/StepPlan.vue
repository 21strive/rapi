<script setup lang="ts">
import { computed } from 'vue'
import { RAlert, RButton, RRadioGroup, RSegmented, RSpecList, RStat, formatNumber } from '@/design-system'
import type { RadioOption, SegmentedOption, SpecItem } from '@/design-system'
import { ANNUAL_DISCOUNT, FIRST_INVOICE, PRORATED_DAYS, feePerMonth, plans, type Cycle, type PlanKey } from '../data'
import { useSetup } from '../state'

const { form, plan, fee, today, samlConflict } = useSetup()

const cycles: SegmentedOption[] = [
  { label: 'Monthly', value: 'monthly' },
  { label: 'Annual −15%', value: 'annual' },
]

const usd = (value: number, decimals = 0) =>
  `USD ${formatNumber(value, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`

const planOptions = computed<RadioOption[]>(() =>
  plans.map((p) => {
    const perMonth = feePerMonth(p, form.cycle)
    const price = form.cycle === 'annual' ? `${usd(perMonth * 12)} a year` : `${usd(perMonth)} a month`
    return { label: p.name, value: p.key, description: `${price} · ${p.seats} seats` }
  }),
)

const includes = computed<SpecItem[]>(() => [
  { label: 'Requests', value: `${plan.value.requests} / month`, mono: true },
  { label: 'Storage', value: plan.value.storage, mono: true },
  { label: 'Seats', value: plan.value.seats, mono: true },
  { label: 'Build minutes', value: `${formatNumber(plan.value.buildMinutes)} / month`, mono: true },
  { label: 'Log retention', value: plan.value.logs },
  { label: 'Single sign-on', value: plan.value.sso },
  { label: 'Support', value: plan.value.support },
  { label: 'Over quota', value: 'Metered monthly' },
])

const billedToday = computed(() => (form.cycle === 'annual' ? usd(today.value) : usd(today.value, 2)))
const then = computed(() =>
  form.cycle === 'annual'
    ? `12 months up front, ${ANNUAL_DISCOUNT * 100}% off. Renews 18 Nov 2027.`
    : `18–30 Nov, ${PRORATED_DAYS} of 30 days. Then ${usd(fee.value)} on ${FIRST_INVOICE} and monthly after.`,
)
</script>

<template>
  <div class="s-onboarding-plan">
    <div class="s-onboarding-plan__cycle">
      <RSegmented
        :model-value="form.cycle"
        :options="cycles"
        size="sm"
        label="Billing cycle"
        @update:model-value="(value) => (form.cycle = value as Cycle)"
      />
      <span class="s-onboarding-plan__cycle-note">Prices exclude tax. Annual is paid up front.</span>
    </div>

    <RRadioGroup
      :model-value="form.plan"
      label="Plan"
      hide-label
      :options="planOptions"
      variant="card"
      orientation="horizontal"
      @update:model-value="(value) => (form.plan = value as PlanKey)"
    />

    <RAlert v-if="samlConflict" tone="warning" title="Identity provider (SAML) needs Business">
      You turned on single sign-on in step 03. Choose Business, or turn it off for now and add it later.
      <template #actions>
        <RButton size="sm" variant="outline" @click="form.plan = 'business'">Choose Business</RButton>
        <RButton size="sm" variant="ghost" @click="form.integrations.saml = false">Turn off SAML</RButton>
      </template>
    </RAlert>

    <div class="s-onboarding-plan__detail">
      <div class="s-onboarding-plan__includes">
        <p class="r-eyebrow s-onboarding-plan__eyebrow">{{ plan.name }} includes</p>
        <RSpecList :items="includes" :columns="2" dense />
      </div>
      <div class="s-onboarding-plan__fee">
        <RStat label="Platform fee" :value="fee" prefix="USD " unit="/ month" size="lg" />
        <p class="s-onboarding-plan__today">
          <span class="r-label">Billed today</span>
          <span class="s-onboarding-plan__amount">{{ billedToday }}</span>
        </p>
        <p class="s-onboarding-plan__then">{{ then }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.s-onboarding-plan {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.s-onboarding-plan__cycle {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 16px;
}

.s-onboarding-plan__cycle-note {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

.s-onboarding-plan__detail {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 216px;
  gap: 0;
  border: 1px solid var(--r-border);
}

.s-onboarding-plan__includes {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
  padding: 14px 16px 4px;
}

.s-onboarding-plan__eyebrow {
  color: var(--r-text-secondary);
}

/* The spec list's own top rule is the panel edge here; its last row has no rule below. */
.s-onboarding-plan__includes :deep(.r-spec) {
  border-top: 0;
}

.s-onboarding-plan__fee {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  padding: 14px 16px;
  border-left: 1px solid var(--r-border);
  background: var(--r-bg-muted);
}

.s-onboarding-plan__today {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  margin-top: 8px;
  padding-top: 10px;
  border-top: 1px solid var(--r-border);
}

.s-onboarding-plan__amount {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-semibold);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.s-onboarding-plan__then {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
  line-height: 1.4;
}

@container s-onboarding-step (max-width: 560px) {
  .s-onboarding-plan__detail {
    grid-template-columns: minmax(0, 1fr);
  }
  .s-onboarding-plan__fee {
    border-top: 1px solid var(--r-border);
    border-left: 0;
  }
}
</style>
