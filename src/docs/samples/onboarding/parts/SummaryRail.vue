<script setup lang="ts">
import { computed } from 'vue'
import { RCard, RSpecList, RStatus, RTimeline, formatNumber } from '@/design-system'
import type { SpecItem, StatusTone, TimelineItem } from '@/design-system'
import { FIRST_INVOICE, NOW, URL_HOST, steps } from '../data'
import { nameFromEmail, useSetup } from '../state'

const { form, step, visited, completed, created, labels, plan, fee, today, validInvites, enabledIntegrations } =
  useSetup()

const usd = (value: number, decimals = 0) =>
  `USD ${formatNumber(value, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`

/** A step's values show once someone has reached it; until then the rows read "—". */
const reached = (index: number) => index <= visited.value || created.value

function statusOf(index: number): { tone: StatusTone; label: string } {
  if (created.value || (completed.has(index) && index !== step.value)) return { tone: 'success', label: 'Done' }
  if (index === step.value) return { tone: 'brand', label: 'Editing' }
  return { tone: 'neutral', label: 'To do' }
}

const sections = computed<{ index: number; title: string; items: SpecItem[] }[]>(() => {
  const show = (index: number, value: string | number) => (reached(index) ? value : '')
  const names = validInvites.value.map((row) => nameFromEmail(row.email).split(' ')[0])
  const on = enabledIntegrations.value
  return [
    {
      index: 0,
      title: steps[0].label,
      items: [
        { label: 'Name', value: show(0, form.name.trim()) },
        { label: 'URL', value: show(0, form.slug ? `${URL_HOST}${form.slug}` : ''), mono: true },
        { label: 'Industry', value: show(0, labels.value.industry) },
        { label: 'Region', value: show(0, labels.value.region) },
      ],
    },
    {
      index: 1,
      title: steps[1].label,
      items: [
        { label: 'Size', value: show(1, labels.value.teamSize ? `${labels.value.teamSize} people` : '') },
        { label: 'Your role', value: show(1, labels.value.role) },
        {
          label: 'Invites',
          value: show(1, validInvites.value.length ? `${validInvites.value.length} people` : 'None'),
          hint: reached(1) && names.length ? names.join(', ') : undefined,
        },
      ],
    },
    {
      index: 2,
      title: steps[2].label,
      items: [
        {
          label: 'On',
          value: show(2, `${on.length} of 9`),
          hint: reached(2) && on.length ? on.map((item) => item.name).join(', ') : undefined,
        },
      ],
    },
    {
      index: 3,
      title: steps[3].label,
      items: [
        { label: 'Plan', value: show(3, `${plan.value.name} · ${form.cycle === 'annual' ? 'annual' : 'monthly'}`) },
        { label: 'Seats', value: show(3, `${validInvites.value.length + 1} of ${plan.value.seats}`), mono: true },
      ],
    },
  ]
})

const showPlan = computed(() => reached(3))

const timeline = computed<TimelineItem[]>(() => {
  const done = created.value
  const people = validInvites.value.length
  const on = enabledIntegrations.value
  return [
    {
      id: 'create',
      time: done ? NOW : 'On create',
      title: done ? 'Workspace created' : 'Workspace goes live',
      body: `${URL_HOST}${form.slug} in ${labels.value.region}`,
      tone: done ? 'success' : 'neutral',
    },
    {
      id: 'invites',
      time: done ? '14:21 WIB' : '+1 min',
      title: people ? `Invites sent to ${people} ${people === 1 ? 'person' : 'people'}` : 'No invites to send',
      body: people ? 'Links stay valid for 7 days.' : 'Invite people from Settings at any time.',
      tone: done ? 'success' : 'neutral',
    },
    {
      id: 'integrations',
      time: done ? 'Waiting' : '+5 min',
      title: on.length ? `${on.length} integrations ask for credentials` : 'No integrations yet',
      body: on.length ? on.map((item) => item.name).join(', ') : 'Turn them on from Settings later.',
      tone: done && on.length ? 'warning' : 'neutral',
    },
    {
      id: 'invoice',
      time: form.cycle === 'annual' ? 'Today' : FIRST_INVOICE,
      title: form.cycle === 'annual' ? `Invoice for ${usd(today.value)}` : `First invoice, ${usd(today.value, 2)}`,
      body:
        form.cycle === 'annual'
          ? `${plan.value.name}, 12 months. Renews 18 Nov 2027.`
          : `${plan.value.name}, 18–30 Nov prorated. Then ${usd(fee.value)} a month.`,
      tone: 'neutral',
    },
  ]
})
</script>

<template>
  <RCard
    v-if="step < 4 && !created"
    class="s-onboarding-summary"
    padding="none"
    eyebrow="Workspace summary"
    :title="form.name.trim() || 'Untitled workspace'"
    meta="Draft"
  >
    <section v-for="section in sections" :key="section.index" class="s-onboarding-summary__section">
      <header class="s-onboarding-summary__head">
        <span class="r-index">{{ String(section.index + 1).padStart(2, '0') }}</span>
        <h4 class="r-eyebrow s-onboarding-summary__title">{{ section.title }}</h4>
        <RStatus size="sm" :tone="statusOf(section.index).tone" :label="statusOf(section.index).label" />
      </header>
      <RSpecList :items="section.items" dense />
    </section>
    <footer class="s-onboarding-summary__fee">
      <span class="r-label">Platform fee</span>
      <span v-if="showPlan" class="s-onboarding-summary__amount">{{ usd(fee) }}<span class="r-label"> / month</span></span>
      <span v-else class="s-onboarding-summary__later">Chosen in step 04</span>
    </footer>
  </RCard>

  <RCard
    v-else
    class="s-onboarding-summary"
    padding="none"
    :eyebrow="created ? 'Setup log' : 'What happens next'"
    :title="created ? 'Running now' : 'After you create it'"
    :meta="created ? NOW : ''"
  >
    <div class="s-onboarding-summary__timeline">
      <RTimeline :items="timeline" time-position="top" dense />
    </div>
  </RCard>
</template>

<style scoped>
.s-onboarding-summary {
  gap: 12px;
}

.s-onboarding-summary__section {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 0 20px;
}

.s-onboarding-summary__head {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 24px;
}

.s-onboarding-summary__title {
  flex: 1;
  color: var(--r-text-secondary);
}

.s-onboarding-summary__fee {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-top: 4px;
  padding: 14px 20px;
  border-top: 1px solid var(--r-border);
  background: var(--r-bg-muted);
}

.s-onboarding-summary__amount {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-lg);
  font-weight: var(--r-weight-semibold);
  font-variant-numeric: tabular-nums;
}

.s-onboarding-summary__later {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-sm);
}

.s-onboarding-summary__timeline {
  padding: 0 20px 20px;
}

@media (max-width: 639px) {
  .s-onboarding-summary__section {
    padding: 0 16px;
  }
  .s-onboarding-summary__fee {
    padding: 12px 16px;
  }
  .s-onboarding-summary__timeline {
    padding: 0 16px 16px;
  }
}
</style>
