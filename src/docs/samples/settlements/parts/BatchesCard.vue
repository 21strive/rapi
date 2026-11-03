<script setup lang="ts">
/** Settlement batches in the selected range: filter by status, sort, page, retry a failed one. */
import { computed, ref, watch } from 'vue'
import { RotateCw } from 'lucide-vue-next'
import { RBadge, RButton, RCard, RPagination, RTable, RTabs } from '@/design-system'
import type { TabItem, TableColumn, TableSort } from '@/design-system'
import { STATUS_TONE, count, rupiahDigits, type Batch } from '../data'

const props = defineProps<{ batches: Batch[]; rangeLabel: string }>()
const emit = defineEmits<{ retry: [id: string] }>()

type Filter = 'all' | 'settled' | 'flight' | 'partial' | 'failed'
const filter = ref<string | number>('all')
const sort = ref<TableSort | null>(null)
const page = ref(1)
const PER_PAGE = 7

const match: Record<Filter, (b: Batch) => boolean> = {
  all: () => true,
  settled: (b) => b.status === 'SETTLED',
  flight: (b) => b.status === 'PROCESSING' || b.status === 'QUEUED',
  partial: (b) => b.status === 'PARTIAL',
  failed: (b) => b.status === 'FAILED',
}

const tabs = computed<TabItem[]>(() => {
  const n = (f: Filter) => props.batches.filter(match[f]).length
  return [
    { label: 'All', value: 'all', count: n('all') },
    { label: 'Settled', value: 'settled', count: n('settled') },
    { label: 'In flight', value: 'flight', count: n('flight') },
    { label: 'Partial', value: 'partial', count: n('partial') },
    { label: 'Failed', value: 'failed', count: n('failed') },
  ]
})

const columns: TableColumn[] = [
  { key: 'id', label: 'Batch' },
  { key: 'bank', label: 'Bank · window' },
  { key: 'items', label: 'Items', numeric: true },
  { key: 'amount', label: 'Amount, Rp', numeric: true, sortable: true },
  { key: 'status', label: 'Status' },
  { key: 'settledAt', label: 'Settled', align: 'right' },
]

// Newest first: by day, then by batch number.
const filtered = computed(() => {
  const rows = props.batches.filter(match[filter.value as Filter])
  const s = sort.value
  if (!s) return [...rows].reverse()
  const dir = s.direction === 'asc' ? 1 : -1
  const key = s.key as 'items' | 'amount'
  return [...rows].sort((x, y) => (x[key] - y[key]) * dir)
})

const pageCount = computed(() => Math.max(1, Math.ceil(filtered.value.length / PER_PAGE)))
const paged = computed(() => filtered.value.slice((page.value - 1) * PER_PAGE, page.value * PER_PAGE))
const from = computed(() => (filtered.value.length ? (page.value - 1) * PER_PAGE + 1 : 0))
const to = computed(() => Math.min(filtered.value.length, page.value * PER_PAGE))

watch([filter, sort, () => props.rangeLabel], () => (page.value = 1))
watch(pageCount, (n) => {
  if (page.value > n) page.value = n
})
</script>

<template>
  <RCard
    id="s-settlements-batches"
    class="s-settlements-batches"
    index="03"
    :eyebrow="`Batches · ${rangeLabel}`"
    title="Settlement batches"
    meta="3 windows · WIB"
    padding="none"
  >
    <RTabs v-model="filter" :items="tabs" size="sm" label="Filter batches by status" class="s-settlements-batches__tabs" />
    <RTable
      v-model:sort="sort"
      :columns="columns"
      :rows="paged"
      row-key="id"
      density="compact"
      manual-sort
      caption="Settlement batches, newest first"
      empty-text="No batches with this status in the range."
    >
      <template #cell-id="{ value }">
        <span class="s-settlements-batches__id">{{ value }}</span>
      </template>
      <template #cell-bank="{ row }">
        <span class="s-settlements-batches__bank">{{ row.bank }}</span>
        <span class="s-settlements-batches__window">{{ row.window }}</span>
      </template>
      <template #cell-items="{ row }">
        <template v-if="row.status === 'PARTIAL'">
          <span class="s-settlements-batches__quiet">{{ row.settledItems }}/</span>{{ row.items }}
        </template>
        <template v-else>{{ count(row.items) }}</template>
      </template>
      <template #cell-amount="{ row }">{{ rupiahDigits(row.amount) }}</template>
      <template #cell-status="{ row }">
        <span :title="row.note">
          <RBadge :tone="STATUS_TONE[row.status as Batch['status']]" size="sm">{{ row.status }}</RBadge>
        </span>
      </template>
      <template #cell-settledAt="{ row }">
        <RButton
          v-if="row.status === 'FAILED'"
          size="xs"
          variant="outline"
          :aria-label="`Retry ${row.id}`"
          @click="emit('retry', row.id)"
        >
          <template #leading><RotateCw /></template>
          Retry
        </RButton>
        <span v-else-if="row.settledAt" class="s-settlements-batches__time">{{ row.settledAt.slice(-5) }}</span>
        <span v-else class="s-settlements-batches__quiet">—</span>
      </template>
    </RTable>
    <template #footer>
      <span class="s-settlements-batches__range">{{ from }}–{{ to }} of {{ filtered.length }}</span>
      <RPagination v-model="page" :page-count="pageCount" size="sm" :siblings="1" label="Batch pages" />
    </template>
  </RCard>
</template>

<style scoped>
.s-settlements-batches {
  scroll-margin-top: 48px;
}

/* The tab rule runs the full width of the card; the tabs line up with the title. */
.s-settlements-batches__tabs {
  margin-top: -4px;
}
.s-settlements-batches__tabs :deep(.r-tabs__list) {
  padding: 0 16px;
}

.s-settlements-batches__id,
.s-settlements-batches__time {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
  font-variant-numeric: tabular-nums;
}

.s-settlements-batches__bank {
  margin-right: 8px;
}

.s-settlements-batches__window {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
}

.s-settlements-batches__quiet {
  color: var(--r-text-tertiary);
}

.s-settlements-batches__range {
  margin-right: auto;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.04em;
}

@media (min-width: 640px) {
  .s-settlements-batches__tabs :deep(.r-tabs__list) {
    padding: 0 20px;
  }
}
</style>
