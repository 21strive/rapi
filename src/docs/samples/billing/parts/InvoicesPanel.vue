<script setup lang="ts">
import { computed, ref } from 'vue'
import { FileDown } from 'lucide-vue-next'
import { RBadge, RCard, RIconButton, RPagination, RTable } from '@/design-system'
import type { StatusTone, TableColumn } from '@/design-system'
import { type Invoice, type InvoiceStatus, org, usd } from '../data'

const props = defineProps<{ invoices: Invoice[] }>()

const PER_PAGE = 12
const page = ref(1)
const pageCount = computed(() => Math.max(1, Math.ceil(props.invoices.length / PER_PAGE)))
const rows = computed(() => props.invoices.slice((page.value - 1) * PER_PAGE, page.value * PER_PAGE))
const emit = defineEmits<{ download: [invoice: Invoice]; open: [invoice: Invoice] }>()

const columns: TableColumn[] = [
  { key: 'number', label: 'Number' },
  { key: 'period', label: 'Period' },
  { key: 'issued', label: 'Issued' },
  { key: 'amount', label: 'Amount', numeric: true },
  { key: 'status', label: 'Status' },
  { key: 'pdf', label: 'PDF', align: 'right', width: '64px' },
]

const STATUS: Record<InvoiceStatus, { tone: StatusTone; text: string }> = {
  upcoming: { tone: 'neutral', text: 'Upcoming' },
  paid: { tone: 'success', text: 'Paid' },
  applied: { tone: 'brand', text: 'Applied' },
}
</script>

<template>
  <RCard index="05" eyebrow="History" title="Invoices" :meta="`VAT ${org.vat * 100}% included`" padding="none" class="s-billing-invoices">
    <RTable
      :columns="columns"
      :rows="rows"
      caption="Invoices and credit notes, newest first"
      density="compact"
      @row-click="(row) => emit('open', row as Invoice)"
    >
      <template #cell-number="{ row }">
        <button
          type="button"
          class="s-billing-invoices__number"
          :class="{ 'is-draft': row.status === 'upcoming' }"
          :aria-label="`Open ${row.status === 'upcoming' ? 'the November estimate' : row.number}`"
          @click.stop="emit('open', row as Invoice)"
        >
          {{ row.number }}
        </button>
      </template>
      <template #cell-issued="{ row }">
        <span class="s-billing-invoices__quiet">{{ row.issued }}</span>
      </template>
      <template #cell-amount="{ row }">
        <span :class="{ 's-billing-invoices__projected': row.status === 'upcoming' }">{{ usd(row.amount) }}</span>
      </template>
      <template #cell-status="{ row }">
        <RBadge :tone="STATUS[row.status as InvoiceStatus].tone" size="sm">{{ STATUS[row.status as InvoiceStatus].text }}</RBadge>
      </template>
      <template #cell-pdf="{ row }">
        <RIconButton
          :label="row.status === 'upcoming' ? 'No PDF until the invoice is issued' : `Download ${row.number} as PDF`"
          variant="ghost"
          size="sm"
          :disabled="row.status === 'upcoming'"
          @click.stop="emit('download', row as Invoice)"
        >
          <FileDown />
        </RIconButton>
      </template>
    </RTable>
    <template #footer>
      <div class="s-billing-invoices__foot">
        <p class="r-caption">
          Issued on the 1st to {{ org.billingEmail }} and charged the same day. Open a row for its line items.
        </p>
        <RPagination v-model="page" :page-count="pageCount" size="sm" label="Invoice pages" />
      </div>
    </template>
  </RCard>
</template>

<style scoped>
.s-billing-invoices {
  gap: 12px;
}

.s-billing-invoices__number {
  padding: 2px 0;
  border: 0;
  background: none;
  color: var(--r-text);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
  text-decoration: underline;
  text-decoration-color: var(--r-border-strong);
  text-underline-offset: 3px;
  cursor: pointer;
}

.s-billing-invoices__number:hover {
  text-decoration-color: currentColor;
}

.s-billing-invoices__number.is-draft,
.s-billing-invoices__quiet {
  color: var(--r-text-tertiary);
}

.s-billing-invoices__projected {
  color: var(--r-text-secondary);
}

.s-billing-invoices__foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px 16px;
  width: 100%;
  padding-top: 4px;
  color: var(--r-text-tertiary);
}
</style>
