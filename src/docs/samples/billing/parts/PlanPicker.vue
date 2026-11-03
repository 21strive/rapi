<script setup lang="ts">
import { computed } from 'vue'
import { ArrowRight, CircleAlert } from 'lucide-vue-next'
import { RButton, RCard, RRadioGroup, RSpecList, formatNumber } from '@/design-system'
import type { RadioOption, SpecItem } from '@/design-system'
import { type Plan, type PlanId, minutes, planById, plans, quotaMillions, storageText, usd } from '../data'

/** Plan comparison: one radio card per plan, its datasheet underneath, and the change action. */
const props = defineProps<{
  current: Plan
  scheduled: Plan | null
  /** Why the selected plan cannot be chosen now, if it cannot. */
  blocked: string | null
}>()

const selected = defineModel<PlanId>('selected', { required: true })
const emit = defineEmits<{ change: []; keep: [] }>()

const options = computed<RadioOption[]>(() =>
  plans.map((p) => ({
    label: p.name,
    value: p.id,
    description:
      p.id === props.current.id
        ? `${usd(p.fee, 0)} a month · current plan`
        : p.id === props.scheduled?.id
          ? `${usd(p.fee, 0)} a month · from 1 Dec`
          : `${usd(p.fee, 0)} a month`,
  })),
)

const specs = (p: Plan): SpecItem[] => [
  { label: 'Requests', value: `${quotaMillions(p.quota.requests)} / mo`, mono: true },
  { label: 'Storage', value: storageText(p.quota.storage), mono: true },
  { label: 'Seats', value: formatNumber(p.quota.seats), mono: true },
  { label: 'Build minutes', value: minutes(p.quota.build), mono: true },
  { label: 'Per million', value: usd(p.rate.requests), mono: true },
  { label: 'Parallel builds', value: p.concurrentBuilds, mono: true },
  { label: 'Logs kept', value: p.logRetention },
  { label: 'Sign-in', value: p.sso },
  { label: 'Support', value: p.support },
  { label: 'Uptime SLA', value: p.sla, mono: true },
]

const target = computed(() => planById(selected.value))
const isCurrent = computed(() => target.value.id === props.current.id)
const isUpgrade = computed(() => target.value.fee > props.current.fee)

const summary = computed(() => {
  if (isCurrent.value) {
    return props.scheduled
      ? `${props.current.name} is your plan until 1 Dec 2026, then ${props.scheduled.name}.`
      : `You are on ${props.current.name}. Pick another plan to compare.`
  }
  if (props.blocked) return props.blocked
  return isUpgrade.value
    ? `${target.value.name} starts today. The rest of this cycle is billed at its rates.`
    : `${target.value.name} starts at renewal on 1 Dec 2026. You keep ${props.current.name} until then.`
})

const action = computed(() => {
  if (isCurrent.value) return props.scheduled ? `Keep ${props.current.name}` : `Current plan`
  return isUpgrade.value ? `Upgrade to ${target.value.name}` : `Move to ${target.value.name}`
})

const disabled = computed(() => (isCurrent.value ? !props.scheduled : !!props.blocked))

function onAction() {
  if (isCurrent.value) emit('keep')
  else emit('change')
}

function onSelect(value: string | number | undefined) {
  if (typeof value === 'string') selected.value = value as PlanId
}
</script>

<template>
  <RCard index="04" eyebrow="Plans" title="Compare and change plan" meta="USD a month + usage" class="s-billing-plans">
    <div class="s-billing-plans__body">
      <RRadioGroup
        :model-value="selected"
        :options="options"
        label="Plan"
        hide-label
        variant="card"
        orientation="horizontal"
        @update:model-value="onSelect"
      />
      <div class="s-billing-plans__grid" aria-hidden="false">
        <div
          v-for="p in plans"
          :key="p.id"
          class="s-billing-plans__col"
          :class="{ 'is-selected': p.id === selected, 'is-current': p.id === current.id }"
        >
          <RSpecList :items="specs(p)" dense />
        </div>
      </div>
      <div class="s-billing-plans__single">
        <RSpecList :items="specs(target)" dense />
      </div>
    </div>

    <template #footer>
      <div class="s-billing-plans__footer">
        <p class="r-body-sm s-billing-plans__summary" :class="{ 'is-blocked': blocked && !isCurrent }" :role="blocked && !isCurrent ? 'alert' : undefined">
          <CircleAlert v-if="blocked && !isCurrent" class="s-billing-plans__icon" aria-hidden="true" />
          <span>{{ summary }}</span>
        </p>
        <RButton tone="brand" :disabled="disabled" @click="onAction">
          {{ action }}
          <template v-if="!disabled && !isCurrent" #trailing><ArrowRight /></template>
        </RButton>
      </div>
    </template>
  </RCard>
</template>

<style scoped>
.s-billing-plans__body {
  container-type: inline-size;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.s-billing-plans__grid {
  display: none;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.s-billing-plans__col {
  padding: 4px 14px 10px;
  border-right: 1px solid var(--r-border-subtle);
  transition: background-color var(--r-duration-fast) var(--r-ease-out);
}

.s-billing-plans__col:first-child {
  border-left: 1px solid var(--r-border-subtle);
}

.s-billing-plans__col.is-selected {
  background: var(--r-bg-selected);
}

.s-billing-plans__col :deep(.r-spec) {
  border-top: 0;
}

.s-billing-plans__col :deep(.r-spec__row:last-child) {
  border-bottom: 0;
}

.s-billing-plans__single {
  margin-top: 12px;
}

@container (min-width: 800px) {
  .s-billing-plans__grid {
    display: grid;
  }
  .s-billing-plans__single {
    display: none;
  }
}

.s-billing-plans__footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px 24px;
  width: 100%;
  padding-top: 16px;
  border-top: 1px solid var(--r-border);
}

.s-billing-plans__summary {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  color: var(--r-text-secondary);
}

.s-billing-plans__icon {
  width: 16px;
  height: 16px;
  margin-top: 2px;
}

.s-billing-plans__summary.is-blocked {
  color: var(--r-danger-text);
}
</style>
