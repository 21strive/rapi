<script setup lang="ts">
import { computed } from 'vue'
import { FileDown } from 'lucide-vue-next'
import { RBadge, RButton, RDialog, RRule, RSpecList } from '@/design-system'
import type { SpecItem, StatusTone } from '@/design-system'
import { type Invoice, type InvoiceDetail, org, paymentMethod, usd } from '../data'

/** One invoice in a drawer: what it is, its line items, and the totals. */
const open = defineModel<boolean>('open', { default: false })
const props = defineProps<{ invoice: Invoice | null; detail: InvoiceDetail | null }>()
const emit = defineEmits<{ download: [invoice: Invoice] }>()

const STATUS: Record<Invoice['status'], { tone: StatusTone; text: string }> = {
  upcoming: { tone: 'neutral', text: 'Upcoming' },
  paid: { tone: 'success', text: 'Paid' },
  applied: { tone: 'brand', text: 'Applied' },
}

const facts = computed<SpecItem[]>(() => {
  const i = props.invoice
  if (!i) return []
  return [
    { label: 'Period', value: i.period },
    { label: i.status === 'upcoming' ? 'Due' : 'Issued', value: i.issued.replace('Due ', '') },
    { label: 'Billed to', value: org.legal, hint: org.address },
    { label: 'Paid with', value: i.kind === 'credit' ? 'Credit balance' : `Card ending ${paymentMethod.last4}`, mono: i.kind !== 'credit' },
  ]
})

const lines = computed<SpecItem[]>(() => (props.detail?.lines ?? []).map((l) => ({ label: l.label, value: usd(l.amount), mono: true, hint: l.detail })))

const totals = computed<SpecItem[]>(() => {
  const d = props.detail
  if (!d) return []
  if (props.invoice?.kind === 'credit') return [{ label: 'Credit', value: usd(d.total), mono: true }]
  return [
    { label: 'Subtotal', value: usd(d.subtotal), mono: true },
    { label: `VAT ${org.vat * 100}%`, value: usd(d.vat), mono: true },
    { label: props.invoice?.status === 'upcoming' ? 'Estimated total' : 'Total', value: usd(d.total), mono: true },
  ]
})
</script>

<template>
  <RDialog
    v-model:open="open"
    side="right"
    size="md"
    :eyebrow="invoice?.kind === 'credit' ? 'Credit note' : 'Invoice'"
    :title="invoice ? (invoice.status === 'upcoming' ? 'November, so far' : invoice.number) : ''"
  >
    <div v-if="invoice && detail" class="s-billing-drawer">
      <div class="s-billing-drawer__head">
        <RBadge :tone="STATUS[invoice.status].tone">{{ STATUS[invoice.status].text }}</RBadge>
        <span class="s-billing-drawer__amount">{{ usd(invoice.amount) }}</span>
      </div>
      <RSpecList :items="facts" dense />
      <RRule label="Line items" :meta="invoice.status === 'upcoming' ? 'Estimate' : undefined" />
      <RSpecList :items="lines" />
      <RSpecList :items="totals" class="s-billing-drawer__totals" />
      <p class="r-caption s-billing-drawer__note">{{ detail.note }}</p>
    </div>
    <template #footer="{ close }">
      <RButton variant="ghost" @click="close">Close</RButton>
      <RButton v-if="invoice" variant="outline" :disabled="invoice.status === 'upcoming'" @click="emit('download', invoice)">
        <template #leading><FileDown /></template>
        Download PDF
      </RButton>
    </template>
  </RDialog>
</template>

<style scoped>
.s-billing-drawer {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.s-billing-drawer__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.s-billing-drawer__amount {
  font-size: var(--r-text-2xl);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-tight);
  font-variant-numeric: tabular-nums;
}

.s-billing-drawer__totals {
  margin-top: -16px;
  border-top: 0;
}

.s-billing-drawer__totals :deep(.r-spec__row:last-child .r-spec__value) {
  font-weight: var(--r-weight-semibold);
}

.s-billing-drawer__note {
  color: var(--r-text-tertiary);
}
</style>
