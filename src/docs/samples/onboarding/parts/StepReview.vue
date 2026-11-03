<script setup lang="ts">
import { computed, useId } from 'vue'
import { CircleAlert, PenLine } from 'lucide-vue-next'
import { RButton, RCheckbox, RSpecList, formatNumber } from '@/design-system'
import type { SpecItem } from '@/design-system'
import { URL_HOST } from '../data'
import { nameFromEmail, useSetup } from '../state'

const emit = defineEmits<{ edit: [step: number] }>()

const { form, labels, plan, fee, today, validInvites, enabledIntegrations, roleLabel, visible } = useSetup()
const id = useId()

const usd = (value: number, decimals = 0) =>
  `USD ${formatNumber(value, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`

const blocks = computed<{ step: number; title: string; items: SpecItem[] }[]>(() => [
  {
    step: 0,
    title: 'Company',
    items: [
      { label: 'Name', value: form.name.trim() },
      { label: 'URL', value: `${URL_HOST}${form.slug}`, mono: true },
      { label: 'Industry', value: labels.value.industry },
      { label: 'Country', value: labels.value.country },
      { label: 'Data region', value: labels.value.region, hint: 'Fixed after creation' },
    ],
  },
  {
    step: 1,
    title: 'Team',
    items: [
      { label: 'Team size', value: `${labels.value.teamSize} people` },
      { label: 'Your role', value: labels.value.role },
      ...validInvites.value.map((row, i) => ({
        label: `Invite ${String(i + 1).padStart(2, '0')}`,
        value: nameFromEmail(row.email),
        hint: `${roleLabel(row.role)} · ${row.email.trim()}`,
      })),
    ],
  },
  {
    step: 2,
    title: 'Integrations',
    items: enabledIntegrations.value.length
      ? enabledIntegrations.value.map((item) => ({ label: item.name, value: 'On', tone: 'brand' as const, hint: item.detail }))
      : [{ label: 'Integrations', value: 'None yet' }],
  },
  {
    step: 3,
    title: 'Plan',
    items: [
      { label: 'Plan', value: `${plan.value.name} · ${form.cycle === 'annual' ? 'annual' : 'monthly'}` },
      { label: 'Platform fee', value: `${usd(fee.value)} / month`, mono: true },
      {
        label: 'Billed today',
        value: form.cycle === 'annual' ? usd(today.value) : usd(today.value, 2),
        mono: true,
        hint: form.cycle === 'annual' ? '12 months up front' : '18–30 Nov, prorated',
      },
      { label: 'Seats', value: `${validInvites.value.length + 1} of ${plan.value.seats}`, mono: true },
    ],
  },
])
</script>

<template>
  <div class="s-onboarding-review">
    <section v-for="block in blocks" :key="block.step" class="s-onboarding-review__block" :aria-labelledby="`${id}-${block.step}`">
      <header class="s-onboarding-review__head">
        <span class="r-index">{{ String(block.step + 1).padStart(2, '0') }}</span>
        <h3 :id="`${id}-${block.step}`" class="r-eyebrow s-onboarding-review__title">{{ block.title }}</h3>
        <RButton
          class="s-onboarding-review__edit"
          variant="ghost"
          size="xs"
          :aria-label="`Edit ${block.title.toLowerCase()}`"
          @click="emit('edit', block.step)"
        >
          <template #leading><PenLine /></template>
          Edit
        </RButton>
      </header>
      <RSpecList :items="block.items" :columns="2" dense />
    </section>

    <div class="s-onboarding-review__terms">
      <RCheckbox
        v-model="form.agree"
        :aria-invalid="visible.review.agree ? 'true' : undefined"
        :aria-describedby="visible.review.agree ? `${id}-agree` : undefined"
      >
        I agree to the Simpul terms of service and the data processing addendum for {{ labels.region }}.
      </RCheckbox>
      <p v-if="visible.review.agree" :id="`${id}-agree`" class="s-onboarding-review__error">
        <CircleAlert aria-hidden="true" />
        <span>{{ visible.review.agree }}</span>
      </p>
    </div>
  </div>
</template>

<style scoped>
.s-onboarding-review {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.s-onboarding-review__block {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.s-onboarding-review__head {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 24px;
}

.s-onboarding-review__title {
  color: var(--r-text-secondary);
}

.s-onboarding-review__edit {
  margin-left: auto;
}

.s-onboarding-review__terms {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 14px;
  border: 1px solid var(--r-border);
  background: var(--r-bg-muted);
}

.s-onboarding-review__error {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding-left: 26px;
  color: var(--r-danger-text);
  font-size: var(--r-text-xs);
  line-height: 1.4;
}

.s-onboarding-review__error svg {
  flex-shrink: 0;
  width: 14px;
  height: 14px;
  margin-top: 1px;
}
</style>
