<script setup lang="ts">
import { computed } from 'vue'
import { RCard, RMeter, RReadout, RSteps, formatNumber } from '@/design-system'
import { campaign, steps } from '../data'

const props = defineProps<{ approved: number; revoked: number }>()

const reviewed = computed(() => props.approved + props.revoked)
const remaining = computed(() => campaign.total - reviewed.value)
const percent = computed(() => (reviewed.value / campaign.total) * 100)
const revokedShare = computed(() => (props.revoked / Math.max(1, reviewed.value)) * 100)

const segments = computed(() => [
  { label: `Approved ${formatNumber(props.approved)}`, value: props.approved, color: 'var(--r-chart-1)' },
  { label: `Revoked ${formatNumber(props.revoked)}`, value: props.revoked, color: 'var(--r-brand-secondary)' },
])

const meterLabel = computed(
  () =>
    `${formatNumber(reviewed.value)} of ${formatNumber(campaign.total)} entitlements reviewed: ${formatNumber(props.approved)} approved, ${formatNumber(props.revoked)} revoked`,
)
</script>

<template>
  <RCard
    index="01"
    :eyebrow="`${campaign.name} · ${campaign.id}`"
    :meta="`${campaign.systems} systems · started ${campaign.started}`"
    class="s-access-review-cert"
  >
    <div class="s-access-review-cert__body">
      <div class="s-access-review-cert__flow">
        <RSteps :items="steps" :current="1" class="s-access-review-cert__steps" />
        <div class="s-access-review-cert__progress">
          <RMeter variant="ticks" :segments="segments" :max="campaign.total" :ticks="72" :height="18" :label="meterLabel" />
          <div class="s-access-review-cert__legend">
            <span v-for="s in segments" :key="s.label" class="s-access-review-cert__key">
              <span class="s-access-review-cert__swatch" :style="{ background: s.color }" aria-hidden="true" />
              {{ s.label }}
            </span>
            <span class="s-access-review-cert__percent">
              {{ formatNumber(percent, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) }}% reviewed
            </span>
          </div>
        </div>
      </div>

      <div class="s-access-review-cert__figures r-grid-ruled">
        <RReadout
          label="Reviewed"
          :value="formatNumber(reviewed)"
          font="sans"
          :sub="`of ${formatNumber(campaign.total)}`"
          class="s-access-review-cert__cell"
        />
        <RReadout
          label="Approved"
          :value="formatNumber(approved)"
          font="sans"
          :sub="`${formatNumber(100 - revokedShare, { maximumFractionDigits: 1 })}% kept`"
          class="s-access-review-cert__cell"
        />
        <RReadout
          label="Revoked"
          :value="formatNumber(revoked)"
          font="sans"
          :sub="`${formatNumber(revokedShare, { maximumFractionDigits: 1 })}% removed`"
          class="s-access-review-cert__cell"
        />
        <RReadout
          label="Remaining"
          :value="formatNumber(remaining)"
          font="sans"
          :sub="`${campaign.reviewers} reviewers`"
          class="s-access-review-cert__cell"
        />
        <RReadout
          label="Days left"
          :value="campaign.daysLeft"
          font="pixel"
          ghost
          :sub="`due ${campaign.due}`"
          class="s-access-review-cert__cell"
        />
      </div>
    </div>
  </RCard>
</template>

<style scoped>
/* A status band more than a panel: tighter than the cards below it. */
.s-access-review-cert {
  gap: 12px;
}
@media (min-width: 640px) {
  .s-access-review-cert {
    padding: 16px 20px;
  }
}

.s-access-review-cert__body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr);
  gap: 24px 32px;
  align-items: stretch;
}

.s-access-review-cert__flow {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 20px;
  min-width: 0;
}

.s-access-review-cert__steps {
  overflow-x: auto;
}

.s-access-review-cert__progress {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.s-access-review-cert__legend {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 16px;
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.s-access-review-cert__key {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.s-access-review-cert__swatch {
  width: 8px;
  height: 8px;
}

.s-access-review-cert__percent {
  margin-left: auto;
  color: var(--r-text);
  font-variant-numeric: tabular-nums;
}

.s-access-review-cert__figures {
  grid-template-columns: repeat(5, minmax(0, 1fr));
  align-self: start;
}

.s-access-review-cert__cell {
  padding: 10px 14px;
}

@media (max-width: 1100px) {
  .s-access-review-cert__body {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 720px) {
  .s-access-review-cert__figures {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

/* On a phone the eyebrow needs the line; the meta repeats what the figures say. */
@media (max-width: 480px) {
  .s-access-review-cert :deep(.r-card__meta) {
    display: none;
  }
}
</style>
