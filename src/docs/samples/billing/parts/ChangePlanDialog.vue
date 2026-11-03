<script setup lang="ts">
import { computed } from 'vue'
import { RAlert, RButton, RDialog, RSpecList } from '@/design-system'
import type { SpecItem } from '@/design-system'
import { type Plan, minutes, quotaMillions, storageText, usd } from '../data'

/** Confirms a plan change with what it changes and what it costs. */
const open = defineModel<boolean>('open', { default: false })

const props = defineProps<{
  from: Plan
  to: Plan
  /** Prorated platform fee for the days left, upgrades only. */
  proration: number
  daysLeft: number
  projectedNow: number
  projectedAfter: number
  /** A note when this cycle's pace would not fit the new plan. */
  warning: string | null
}>()

const emit = defineEmits<{ confirm: [] }>()

const upgrade = computed(() => props.to.fee > props.from.fee)

const items = computed<SpecItem[]>(() => {
  const f = props.from
  const t = props.to
  const list: SpecItem[] = [
    { label: 'Platform fee', value: `${usd(f.fee, 0)} → ${usd(t.fee, 0)}`, mono: true, hint: 'a month' },
    { label: 'Requests', value: `${quotaMillions(f.quota.requests)} → ${quotaMillions(t.quota.requests)}`, mono: true },
    { label: 'Storage', value: `${storageText(f.quota.storage)} → ${storageText(t.quota.storage)}`, mono: true },
    { label: 'Seats', value: `${f.quota.seats} → ${t.quota.seats}`, mono: true },
    { label: 'Build minutes', value: `${minutes(f.quota.build)} → ${minutes(t.quota.build)}`, mono: true },
  ]
  if (upgrade.value) {
    list.push(
      { label: 'Prorated fee', value: usd(props.proration), mono: true, hint: `${props.daysLeft} of 30 days, on the 1 Dec invoice` },
      { label: 'This cycle', value: `${usd(props.projectedNow, 0)} → ${usd(props.projectedAfter, 0)}`, mono: true, hint: 'Projected, before VAT' },
    )
  } else {
    list.push({ label: 'Starts', value: '1 Dec 2026', mono: true, hint: `${props.from.name} until the cycle ends on 30 Nov` })
  }
  return list
})

const title = computed(() => (upgrade.value ? `Upgrade to ${props.to.name}?` : `Move to ${props.to.name} on 1 Dec?`))
const description = computed(() =>
  upgrade.value
    ? `The new quotas apply now. Usage from 19 Nov is billed at ${props.to.name} rates.`
    : `You keep ${props.from.name} and its quotas until this cycle ends.`,
)

function confirm() {
  emit('confirm')
  open.value = false
}
</script>

<template>
  <RDialog v-model:open="open" eyebrow="Change plan" :title="title" :description="description" size="md">
    <div class="s-billing-change">
      <RSpecList :items="items" dense />
      <RAlert v-if="warning" tone="warning" title="This cycle's pace does not fit">{{ warning }}</RAlert>
    </div>
    <template #footer="{ close }">
      <RButton variant="ghost" @click="close">Cancel</RButton>
      <RButton tone="brand" @click="confirm">{{ upgrade ? `Upgrade to ${to.name}` : `Move to ${to.name}` }}</RButton>
    </template>
  </RDialog>
</template>

<style scoped>
.s-billing-change {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
