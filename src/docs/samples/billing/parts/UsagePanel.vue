<script setup lang="ts">
import { computed } from 'vue'
import { RBadge, RBulletChart, RCard, RMeter, RRule, formatNumber } from '@/design-system'
import type { BulletRow, MeterSegment } from '@/design-system'
import {
  type CycleSummary,
  type MetricId,
  type Plan,
  millions,
  minutes,
  percent,
  projects,
  quotaMillions,
  storageText,
} from '../data'

/** Usage so far against the quotas, split by project, and what it has cost. */
const props = defineProps<{
  summary: CycleSummary
  /** Plan whose quotas apply now. */
  quotaPlan: Plan
  /** Plan whose rates priced the usage so far. */
  ratePlan: Plan
  closed: boolean
  dayName: (day: number) => string
  /** The cycle before, for the comparison bar in the bullet chart. */
  previous: CycleSummary | null
}>()

interface Meter {
  id: MetricId
  name: string
  figure: string
  of: string
  pct: number
  segments: MeterSegment[]
  quota: number
  used: number
  note: string
}

const split = (metric: 'requests' | 'storage' | 'build', used: number): MeterSegment[] =>
  projects.map((p) => ({ value: used * p.share[metric], label: p.name }))

const meters = computed<Meter[]>(() => {
  const s = props.summary
  const q = props.quotaPlan.quota
  const days = s.nowIndex + 1
  const weekdays = s.rows.slice(0, days).filter((r) => !r.weekend)
  const quotaDay = s.requestsQuotaDay
  const requestsNote = props.closed
    ? `${millions(s.used.requests / days)} a day on average`
    : quotaDay && quotaDay > days
      ? `Passes the quota on ${props.dayName(quotaDay)} at this rate`
      : quotaDay
        ? `Passed the quota on ${props.dayName(quotaDay)}`
        : `${millions(s.projected.requests)} projected by 30 ${s.spec.month}`
  const list: Omit<Meter, 'pct'>[] = [
    {
      id: 'requests',
      name: 'Requests',
      figure: millions(s.used.requests),
      of: `of ${quotaMillions(q.requests)}`,
      segments: split('requests', s.used.requests),
      quota: q.requests,
      used: s.used.requests,
      note: requestsNote,
    },
    {
      id: 'storage',
      name: 'Storage',
      figure: storageText(s.used.storage),
      of: `of ${storageText(q.storage)}`,
      segments: split('storage', s.used.storage),
      quota: q.storage,
      used: s.used.storage,
      note: `+${formatNumber(Math.round(s.used.storage - s.rows[0].storage))} GB since 1 ${s.spec.month}`,
    },
    {
      id: 'build',
      name: 'Build minutes',
      figure: minutes(s.used.build),
      of: `of ${minutes(q.build)}`,
      segments: split('build', s.used.build),
      quota: q.build,
      used: s.used.build,
      note: `${minutes(weekdays.reduce((t, r) => t + r.build, 0) / Math.max(1, weekdays.length))} a weekday on average`,
    },
    {
      id: 'seats',
      name: 'Seats',
      figure: String(s.used.seats),
      of: `of ${q.seats}`,
      segments: [],
      quota: q.seats,
      used: s.used.seats,
      note: q.seats <= 30 ? `${q.seats - s.used.seats} free · one block per seat` : `${q.seats - s.used.seats} free`,
    },
  ]
  return list.map((m) => ({ ...m, pct: (m.used / m.quota) * 100 }))
})

const level = (pct: number) => (pct >= 100 ? 'over' : pct >= 80 ? 'near' : null)

const pct = (used: number, quota: number) => Math.round((used / quota) * 100)

/** Each quota at the end of the cycle (projected, or final once closed); the thin bar is last cycle. */
const bullets = computed<BulletRow[]>(() => {
  const s = props.summary
  const q = props.quotaPlan.quota
  const p = props.previous
  const at = props.closed ? s.used : s.projected
  const row = (label: string, used: number, quota: number, sublabel: string, before?: number): BulletRow => ({
    label,
    value: pct(used, quota),
    ranges: [100, 200],
    sublabel,
    previous: before,
  })
  return [
    row('Requests', at.requests, q.requests, `${millions(at.requests)} of ${quotaMillions(q.requests)}`, p ? pct(p.used.requests, q.requests) : undefined),
    row('Storage', at.storage, q.storage, `${storageText(at.storage)} of ${storageText(q.storage)}`, p ? pct(p.used.storage, q.storage) : undefined),
    row('Build minutes', at.build, q.build, `${minutes(at.build)} of ${minutes(q.build)}`, p ? pct(p.used.build, q.build) : undefined),
    row('Seats', at.seats, q.seats, `${at.seats} of ${q.seats}`, p ? pct(p.used.seats, q.seats) : undefined),
  ]
})

const bulletTitle = computed(() => (props.closed ? 'Quota use at close' : `Projected at 30 ${props.summary.spec.month}`))
const bulletNote = computed(() =>
  props.previous
    ? `Thin bar: ${props.previous.spec.monthLong} at close. Past 100%, usage is billed at 1.5× the plan rate.`
    : 'Past 100%, usage is billed at 1.5× the plan rate.',
)

const title = computed(() => (props.closed ? `Usage in ${props.summary.spec.monthLong}` : 'Usage against quota'))
const eyebrow = computed(() =>
  props.closed ? `Closed 31 ${props.summary.spec.month}` : `To date · day ${props.summary.nowIndex + 1} of ${props.summary.spec.days}`,
)
</script>

<template>
  <RCard index="02" :eyebrow="eyebrow" :title="title" class="s-billing-usage">
    <template #actions>
      <ul class="s-billing-usage__legend" aria-label="Projects">
        <li v-for="(p, i) in projects" :key="p.id">
          <span class="s-billing-usage__swatch" :style="{ background: `var(--r-chart-${i + 1})` }" aria-hidden="true" />
          {{ p.name }}
        </li>
      </ul>
    </template>

    <div class="s-billing-usage__meters r-grid-ruled">
      <div v-for="m in meters" :key="m.id" class="s-billing-usage__meter">
        <div class="s-billing-usage__head">
          <span class="r-label">{{ m.name }}</span>
          <span class="s-billing-usage__flags">
            <RBadge v-if="level(m.pct) === 'over'" tone="danger" size="sm">Over quota</RBadge>
            <RBadge v-else-if="level(m.pct) === 'near'" tone="warning" size="sm">Near limit</RBadge>
            <span class="s-billing-usage__pct">{{ percent(m.pct) }}</span>
          </span>
        </div>
        <p class="s-billing-usage__figure">
          <span class="s-billing-usage__value">{{ m.figure }}</span>
          <span class="s-billing-usage__of">{{ m.of }}</span>
        </p>
        <RMeter
          v-if="m.id === 'seats'"
          variant="segments"
          :count="Math.min(m.quota, 30)"
          :value="m.used"
          :max="m.quota"
          :height="8"
          :label="`${m.name}: ${m.figure} ${m.of}, ${percent(m.pct)}`"
        />
        <RMeter
          v-else
          :segments="m.segments"
          :max="m.quota"
          :height="8"
          :label="`${m.name}: ${m.figure} ${m.of}, ${percent(m.pct)}`"
        />
        <p class="s-billing-usage__note">{{ m.note }}</p>
      </div>
    </div>

    <RRule :label="bulletTitle" meta="% of quota" />
    <RBulletChart :rows="bullets" :max="200" :format="(v: number) => `${v}%`" :label="`${bulletTitle}, percent of each quota`" />
    <p class="s-billing-usage__caption r-caption">{{ bulletNote }}</p>
  </RCard>
</template>

<style scoped>
.s-billing-usage__legend {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 16px;
  min-height: 24px;
  align-items: center;
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  letter-spacing: 0.02em;
}

.s-billing-usage__legend li {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.s-billing-usage__swatch {
  width: 8px;
  height: 8px;
}

.s-billing-usage__meters {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.s-billing-usage__meter {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 16px 14px;
}

.s-billing-usage__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 20px;
}

.s-billing-usage__flags {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.s-billing-usage__pct {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
  font-variant-numeric: tabular-nums;
}

.s-billing-usage__figure {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.s-billing-usage__value {
  font-size: var(--r-text-2xl);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-tight);
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
}

.s-billing-usage__of {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.s-billing-usage__note {
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
}

.s-billing-usage__caption {
  margin-top: -6px;
  color: var(--r-text-tertiary);
}

@media (max-width: 560px) {
  .s-billing-usage__meters {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
