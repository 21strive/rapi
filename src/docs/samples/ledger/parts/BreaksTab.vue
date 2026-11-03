<script setup lang="ts">
import { computed, ref } from 'vue'
import { RAlert, RButton, RChip, RTable, type TableColumn } from '@/design-system'
import { type Break, type BreakType, breakAmount, breakDifference, breakTypes, idr, millions, signedRp, typeLabel } from '../data'

const props = defineProps<{ breaks: Break[] }>()
const emit = defineEmits<{ open: [item: Break]; autoMatch: [] }>()

const filter = ref<BreakType | 'all'>('all')
const countOf = (type: BreakType | 'all') => (type === 'all' ? props.breaks.length : props.breaks.filter((b) => b.type === type).length)
const rows = computed(() => (filter.value === 'all' ? props.breaks : props.breaks.filter((b) => b.type === filter.value)))

const total = computed(() => props.breaks.reduce((s, b) => s + breakAmount(b), 0))
const aged = computed(() => props.breaks.filter((b) => b.ageDays > 2))
const oldest = computed(() => [...props.breaks].sort((a, b) => b.ageDays - a.ageDays)[0])
const suggested = computed(() => props.breaks.filter((b) => b.suggestion))

const columns: TableColumn[] = [
  { key: 'id', label: 'Break' },
  { key: 'type', label: 'Type' },
  { key: 'counterparty', label: 'Counterparty' },
  { key: 'ledger', label: 'Ledger', numeric: true },
  { key: 'bank', label: 'Bank', numeric: true },
  { key: 'difference', label: 'Difference', numeric: true },
  { key: 'age', label: 'Age', numeric: true, sortable: true, sortValue: (r) => r.ageDays },
  { key: 'action', label: '', align: 'right' },
]
</script>

<template>
  <div class="s-ledger-breaks">
    <div class="s-ledger-breaks__alert">
      <RAlert v-if="breaks.length" :tone="aged.length ? 'warning' : 'neutral'" :title="`${breaks.length} open breaks, Rp ${millions(total)} out of reconciliation`">
        {{ aged.length ? `${aged.length} are older than two days; the oldest, ${oldest?.id}, dates from 30 Oct.` : 'None is older than two days.' }}
        {{ suggested.length ? `${suggested.length} have a suggested match.` : '' }}
        <template #actions>
          <RButton size="sm" variant="outline" :disabled="!suggested.length" @click="emit('autoMatch')">
            Apply {{ suggested.length }} suggested
          </RButton>
        </template>
      </RAlert>
      <RAlert v-else tone="success" title="All breaks cleared">Ledger and statements agree for 3 Nov 2026. The day can close.</RAlert>
    </div>

    <div class="s-ledger-breaks__chips" role="group" aria-label="Filter by type">
      <RChip
        v-for="t in breakTypes"
        :key="t.value"
        size="sm"
        :selected="filter === t.value"
        :variant="filter === t.value ? 'solid' : 'outline'"
        @click="filter = t.value"
      >
        {{ t.label }} <span class="s-ledger-breaks__count">{{ countOf(t.value) }}</span>
      </RChip>
    </div>

    <RTable
      :columns="columns"
      :rows="rows"
      density="compact"
      caption="Unmatched items between the ledger and bank statements"
      empty-text="No breaks of this type."
      @row-click="(row) => emit('open', row as Break)"
    >
      <template #cell-id="{ row }"><span class="s-ledger-mono">{{ row.id }}</span></template>
      <template #cell-type="{ row }"><span class="s-ledger-type">{{ typeLabel[row.type as BreakType] }}</span></template>
      <template #cell-counterparty="{ row }">{{ (row.ledger ?? row.bank)?.counterparty }}</template>
      <template #cell-ledger="{ row }">
        <span v-if="row.ledger">{{ idr(row.ledger.amount) }}</span><span v-else class="s-ledger-quiet">—</span>
      </template>
      <template #cell-bank="{ row }">
        <span v-if="row.bank">{{ idr(row.bank.amount) }}</span><span v-else class="s-ledger-quiet">—</span>
      </template>
      <template #cell-difference="{ row }">{{ signedRp(breakDifference(row as Break)).replace('Rp ', '') }}</template>
      <template #cell-age="{ row }">
        <span :class="{ 's-ledger-aged': row.ageDays > 2 }">{{ row.ageDays === 0 ? 'Today' : `${row.ageDays}d` }}</span>
      </template>
      <template #cell-action="{ row }">
        <RButton size="xs" variant="soft" @click.stop="emit('open', row as Break)">Match</RButton>
      </template>
    </RTable>
  </div>
</template>

<style scoped>
.s-ledger-breaks {
  display: flex;
  flex-direction: column;
}
.s-ledger-breaks__alert {
  padding: 16px 16px 0;
}
.s-ledger-breaks__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--r-border);
}
.s-ledger-breaks__count {
  margin-left: 4px;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  opacity: 0.72;
}
.s-ledger-mono {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
}
.s-ledger-type {
  color: var(--r-text-secondary);
}
.s-ledger-quiet {
  color: var(--r-text-tertiary);
}
.s-ledger-aged {
  font-weight: var(--r-weight-semibold);
}
.s-ledger-aged::after {
  content: ' · aged';
  color: var(--r-text-tertiary);
  font-weight: var(--r-weight-regular);
}
</style>
