<script setup lang="ts">
import { computed } from 'vue'
import { RBadge, RCard, RMeter, formatNumber } from '@/design-system'
import { MFA_SCALE_FROM, MFA_TARGET, mfa } from '../data'

const pct = (enrolled: number, people: number) => (enrolled / people) * 100
const show = (value: number) =>
  `${formatNumber(value, { minimumFractionDigits: value >= 100 ? 0 : 1, maximumFractionDigits: 1 })}%`

const span = 100 - MFA_SCALE_FROM
/** Where the target sits on the 80–100% scale, as a CSS percentage. */
const targetAt = `${((MFA_TARGET - MFA_SCALE_FROM) / span) * 100}%`

const rows = computed(() =>
  mfa.map((d) => {
    const value = pct(d.enrolled, d.people)
    return {
      ...d,
      value,
      text: show(value),
      met: value >= MFA_TARGET,
      lit: Math.min(span, Math.max(0, value - MFA_SCALE_FROM)),
      missing: d.people - d.enrolled,
    }
  }),
)

const people = mfa.reduce((sum, d) => sum + d.people, 0)
const enrolled = mfa.reduce((sum, d) => sum + d.enrolled, 0)
const overall = pct(enrolled, people)
</script>

<template>
  <RCard
    index="05"
    :eyebrow="`Identity provider · ${formatNumber(people)} people`"
    title="MFA coverage by department"
    :meta="`Target ${MFA_TARGET}%`"
    class="s-access-review-mfa"
  >
    <div class="s-access-review-mfa__summary">
      <p class="s-access-review-mfa__overall">
        <span class="s-access-review-mfa__figure">{{ show(overall) }}</span>
        <span class="s-access-review-mfa__caption">enrolled · {{ people - enrolled }} people without MFA · deadline 30 Nov</span>
      </p>
      <RBadge tone="warning" size="sm" dot>Below target</RBadge>
    </div>

    <div class="s-access-review-mfa__grid" role="list" aria-label="MFA coverage by department">
      <div class="s-access-review-mfa__scale" aria-hidden="true">
        <span />
        <span class="s-access-review-mfa__ticks">
          <span>{{ MFA_SCALE_FROM }}%</span>
          <span class="s-access-review-mfa__target-label" :style="{ left: targetAt }">Target {{ MFA_TARGET }}</span>
          <span>100%</span>
        </span>
        <span />
      </div>
      <div v-for="row in rows" :key="row.name" class="s-access-review-mfa__row" role="listitem">
        <span class="s-access-review-mfa__dept">
          <span class="s-access-review-mfa__name">{{ row.name }}</span>
          <span class="s-access-review-mfa__people">{{ row.enrolled }}/{{ row.people }}</span>
        </span>
        <span class="s-access-review-mfa__meter" :style="{ '--target-at': targetAt }">
          <RMeter
            variant="segments"
            :value="row.lit"
            :max="span"
            :count="20"
            :height="12"
            :tone="row.met ? 'brand' : 'warning'"
            :label="`${row.name}: ${row.text} enrolled, ${row.missing} without MFA`"
          />
        </span>
        <span class="s-access-review-mfa__value">
          <span class="s-access-review-mfa__pct">{{ row.text }}</span>
          <RBadge v-if="!row.met" tone="warning" size="sm">Below</RBadge>
        </span>
      </div>
    </div>
  </RCard>
</template>

<style scoped>
.s-access-review-mfa__summary {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px 16px;
}

.s-access-review-mfa__overall {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px 10px;
  min-width: 0;
}

.s-access-review-mfa__figure {
  font-size: var(--r-text-2xl);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-tight);
  line-height: 1;
}

.s-access-review-mfa__caption {
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
}

.s-access-review-mfa__grid {
  display: grid;
  grid-template-columns: minmax(0, 168px) minmax(0, 1fr) 96px;
  column-gap: 16px;
}

.s-access-review-mfa__scale,
.s-access-review-mfa__row {
  display: contents;
}

.s-access-review-mfa__ticks {
  position: relative;
  display: flex;
  justify-content: space-between;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--r-border-subtle);
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.s-access-review-mfa__scale > span:not(.s-access-review-mfa__ticks) {
  border-bottom: 1px solid var(--r-border-subtle);
}

/* Sits just left of the target tick, so it never meets the 100% label. */
.s-access-review-mfa__target-label {
  position: absolute;
  top: 0;
  padding-right: 4px;
  transform: translateX(-100%);
  color: var(--r-text);
  white-space: nowrap;
}

.s-access-review-mfa__dept,
.s-access-review-mfa__meter,
.s-access-review-mfa__value {
  display: flex;
  align-items: center;
  min-height: 33px;
  border-bottom: 1px solid var(--r-border-subtle);
}

.s-access-review-mfa__dept {
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
}

.s-access-review-mfa__name {
  overflow: hidden;
  font-size: var(--r-text-sm);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.s-access-review-mfa__people {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-variant-numeric: tabular-nums;
}

/* The target: a 1px ink tick across each meter at 95%. */
.s-access-review-mfa__meter {
  position: relative;
}
.s-access-review-mfa__meter > :deep(.r-meter) {
  flex: 1;
}
.s-access-review-mfa__meter::after {
  content: '';
  position: absolute;
  top: 7px;
  bottom: 7px;
  left: calc(var(--target-at) - 1px);
  width: 1px;
  background: var(--r-chart-ink);
  pointer-events: none;
}

.s-access-review-mfa__value {
  justify-content: flex-end;
  gap: 8px;
}

.s-access-review-mfa__pct {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
  font-variant-numeric: tabular-nums;
}

@media (max-width: 480px) {
  .s-access-review-mfa__grid {
    grid-template-columns: minmax(0, 1fr) 84px;
  }
  .s-access-review-mfa__scale > span:first-child {
    display: none;
  }
  .s-access-review-mfa__dept {
    grid-column: 1 / -1;
    min-height: 0;
    padding-top: 8px;
    border-bottom: 0;
  }
}
</style>
