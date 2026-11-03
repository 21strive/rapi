<script setup lang="ts">
import { computed } from 'vue'
import { Check } from 'lucide-vue-next'
import { RButton, RCard, RStatus, type StatusTone } from '@/design-system'
import { type Payment, bn, money, toIdrBn } from '../data'

const props = defineProps<{ payments: Payment[] }>()
const emit = defineEmits<{ approve: [payment: Payment]; approveAll: [] }>()

const STATUS: Record<Payment['status'], { label: string; tone: StatusTone }> = {
  awaiting: { label: 'Needs approval', tone: 'warning' },
  approved: { label: 'Approved', tone: 'success' },
  scheduled: { label: 'Scheduled', tone: 'neutral' },
}

const totalBn = computed(() => props.payments.reduce((sum, p) => sum + toIdrBn(p.amount, p.currency), 0))
const awaiting = computed(() => props.payments.filter((p) => p.status === 'awaiting'))
</script>

<template>
  <RCard
    eyebrow="Payments · 3–9 Nov"
    title="Due this week"
    :subtitle="`${payments.length} payments · ${bn(totalBn, 2)} bn IDR eq.`"
    padding="none"
  >
    <template #actions>
      <RButton size="sm" variant="outline" :disabled="!awaiting.length" @click="emit('approveAll')">
        {{ awaiting.length ? `Approve all ${awaiting.length}` : 'All approved' }}
      </RButton>
    </template>
    <ul class="s-treasury-pay">
      <li v-for="p in payments" :key="p.id" class="s-treasury-pay__row">
        <div class="s-treasury-pay__due">
          <span class="s-treasury-pay__day">{{ p.due.split(' ')[0] }}</span>
          <span class="r-label">{{ p.due.split(' ')[1] }}</span>
        </div>
        <div class="s-treasury-pay__main">
          <div class="s-treasury-pay__line">
            <span class="s-treasury-pay__payee">{{ p.payee }}</span>
            <span class="s-treasury-pay__money">{{ money(p.amount, p.currency) }}</span>
          </div>
          <div class="s-treasury-pay__line">
            <span class="s-treasury-pay__meta"><span class="r-mono">{{ p.id }}</span> · {{ p.purpose }}</span>
            <RStatus
              :tone="STATUS[p.status].tone"
              :label="p.status === 'awaiting' ? `${p.approvals[0]}/${p.approvals[1]} approved` : STATUS[p.status].label"
              size="sm"
            />
          </div>
        </div>
        <div class="s-treasury-pay__action">
          <RButton
            v-if="p.status === 'awaiting'"
            size="xs"
            variant="soft"
            :aria-label="`Approve ${p.id} to ${p.payee}`"
            @click="emit('approve', p)"
          >
            Approve
          </RButton>
          <Check v-else class="s-treasury-pay__done" aria-label="Approved" />
        </div>
      </li>
    </ul>
  </RCard>
</template>

<style scoped>
.s-treasury-pay {
  border-top: 1px solid var(--r-border);
}

.s-treasury-pay__row {
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr) 68px;
  align-items: center;
  gap: 12px;
  min-height: 56px;
  padding: 8px 16px;
  border-bottom: 1px solid var(--r-border-subtle);
}
.s-treasury-pay__row:last-child {
  border-bottom: 0;
}

.s-treasury-pay__due {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  line-height: 1.1;
}

.s-treasury-pay__day {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-lg);
  font-weight: var(--r-weight-medium);
  font-variant-numeric: tabular-nums;
}

.s-treasury-pay__main {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.s-treasury-pay__line {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
}

.s-treasury-pay__payee {
  overflow: hidden;
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-medium);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.s-treasury-pay__meta {
  overflow: hidden;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.s-treasury-pay__money {
  flex: none;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.s-treasury-pay__line :deep(.r-status) {
  flex: none;
}

.s-treasury-pay__action {
  display: flex;
  justify-content: flex-end;
}

.s-treasury-pay__done {
  width: 16px;
  height: 16px;
  margin-right: 8px;
  color: var(--r-success);
}

@media (min-width: 640px) {
  .s-treasury-pay__row {
    padding: 8px 20px;
  }
}

@media (max-width: 480px) {
  .s-treasury-pay__line {
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
  }
  .s-treasury-pay__payee,
  .s-treasury-pay__meta {
    max-width: 100%;
  }
}
</style>
