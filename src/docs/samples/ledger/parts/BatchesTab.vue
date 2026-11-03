<script setup lang="ts">
import { computed, ref } from 'vue'
import { Download, RotateCcw } from 'lucide-vue-next'
import { RButton, RSpecList, RStatus, RSteps, RTable, type SpecItem, type TableColumn } from '@/design-system'
import { type Batch, amount, batchStatus, stepsFor } from '../data'

const props = defineProps<{ batches: Batch[] }>()
const emit = defineEmits<{ resubmit: [batch: Batch]; download: [batch: Batch] }>()

const selectedId = ref('STL-1102-14')
const selected = computed(() => props.batches.find((b) => b.id === selectedId.value) ?? props.batches[0])
const steps = computed(() => stepsFor(selected.value))

const columns: TableColumn[] = [
  { key: 'id', label: 'Batch' },
  { key: 'rail', label: 'Rail' },
  { key: 'window', label: 'Window' },
  { key: 'items', label: 'Items', numeric: true },
  { key: 'amount', label: 'Amount', numeric: true },
  { key: 'status', label: 'Status' },
]

const specs = computed<SpecItem[]>(() => {
  const b = selected.value
  return [
    { label: 'File', value: b.file, mono: true },
    { label: 'Counterparty', value: b.counterparty },
    { label: 'Window', value: b.window.includes('Nov') ? `${b.window} WIB` : `3 Nov 2026, ${b.window} WIB` },
    { label: 'Items', value: b.items == null ? '—' : b.items.toLocaleString('en-US'), mono: true },
    { label: 'Amount', value: b.amount == null ? '—' : `${b.currency} ${amount(b.amount, b.currency)}`, mono: true },
    { label: 'Status', value: batchStatus[b.status].label, tone: batchStatus[b.status].tone },
  ]
})
</script>

<template>
  <div class="s-ledger-batches">
    <RTable
      :columns="columns"
      :rows="batches"
      :selected="[selectedId]"
      density="compact"
      caption="Settlement batches for 3 Nov 2026"
      @row-click="(row) => (selectedId = row.id)"
    >
      <template #cell-id="{ row }"><span class="s-ledger-mono">{{ row.id }}</span></template>
      <template #cell-window="{ row }"><span class="s-ledger-mono">{{ row.window }}</span></template>
      <template #cell-items="{ row }">{{ row.items == null ? '—' : row.items.toLocaleString('en-US') }}</template>
      <template #cell-amount="{ row }">
        <template v-if="row.amount != null">
          <span class="s-ledger-ccy">{{ row.currency }}</span> {{ amount(row.amount, row.currency) }}
        </template>
        <span v-else class="s-ledger-quiet">—</span>
      </template>
      <template #cell-status="{ row }">
        <RStatus :tone="batchStatus[row.status as Batch['status']].tone" :label="batchStatus[row.status as Batch['status']].label" size="sm" />
      </template>
    </RTable>

    <aside class="s-ledger-batch" :aria-label="`Batch ${selected.id}`">
      <div class="s-ledger-batch__head">
        <p class="r-eyebrow s-ledger-batch__eyebrow">Lifecycle · {{ selected.id }}</p>
        <h3 class="s-ledger-batch__title">{{ selected.rail }}</h3>
      </div>
      <RSteps :items="steps.items" :current="steps.current" orientation="vertical" size="sm" />
      <RSpecList :items="specs" dense />
      <div class="s-ledger-batch__actions">
        <RButton variant="outline" size="sm" :disabled="selected.status === 'scheduled'" @click="emit('download', selected)">
          <template #leading><Download /></template>
          File
        </RButton>
        <RButton v-if="selected.status === 'failed'" tone="brand" size="sm" @click="emit('resubmit', selected)">
          <template #leading><RotateCcw /></template>
          Resubmit with new id
        </RButton>
      </div>
    </aside>
  </div>
</template>

<style scoped>
.s-ledger-batches {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  align-items: start;
}
.s-ledger-batches > :deep(.r-table) {
  border-right: 1px solid var(--r-border);
}

.s-ledger-batch {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px 20px 20px;
}
.s-ledger-batch__eyebrow {
  color: var(--r-text-tertiary);
}
.s-ledger-batch__title {
  margin-top: 4px;
  font-size: var(--r-text-lg);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-snug);
}
.s-ledger-batch__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.s-ledger-mono {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
  font-variant-numeric: tabular-nums;
}
.s-ledger-ccy {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-2xs);
}
.s-ledger-quiet {
  color: var(--r-text-tertiary);
}

@media (max-width: 1100px) {
  .s-ledger-batches {
    grid-template-columns: minmax(0, 1fr);
  }
  .s-ledger-batches > :deep(.r-table) {
    border-right: 0;
    border-bottom: 1px solid var(--r-border);
  }
}
</style>
