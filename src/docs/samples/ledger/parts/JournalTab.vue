<script setup lang="ts">
import { computed, ref } from 'vue'
import { Search } from 'lucide-vue-next'
import { RInput, RStatus, RTable, type TableColumn } from '@/design-system'
import { accounts, amount, entriesShown, entriesToday, journal, totalsByCurrency } from '../data'

const query = ref<string | number | null>('')

/** Search keeps whole entries, so the totals underneath always balance. */
const lines = computed(() => {
  const q = String(query.value ?? '').trim().toLowerCase()
  if (!q) return journal
  const hits = new Set(
    journal
      .filter((l) => `${l.entry} ${l.memo} ${l.account} ${accounts[l.account]}`.toLowerCase().includes(q))
      .map((l) => l.entry),
  )
  return journal.filter((l) => hits.has(l.entry))
})

const totals = computed(() => totalsByCurrency(lines.value))
const entryCount = computed(() => new Set(lines.value.map((l) => l.entry)).size)
const balanced = computed(() => Object.values(totals.value).every((t) => Math.abs(t.debit - t.credit) < 0.005))

/** Lines, then one totals row per currency. */
const rows = computed(() => [
  ...lines.value.map((l) => ({ ...l, kind: 'line' as const })),
  ...Object.entries(totals.value).map(([currency, t]) => ({
    id: `total-${currency}`,
    kind: 'total' as const,
    currency,
    debit: t.debit,
    credit: t.credit,
  })),
])

const columns: TableColumn[] = [
  { key: 'entry', label: 'Entry', width: '34%' },
  { key: 'account', label: 'Account' },
  { key: 'debit', label: 'Debit', numeric: true },
  { key: 'credit', label: 'Credit', numeric: true },
  { key: 'currency', label: 'Ccy' },
  { key: 'posted', label: 'Posted', align: 'right' },
]
</script>

<template>
  <div class="s-ledger-journal">
    <div class="s-ledger-toolbar">
      <RInput v-model="query" placeholder="Entry, account or memo" aria-label="Search the journal" size="sm" clearable class="s-ledger-toolbar__search">
        <template #leading><Search /></template>
      </RInput>
      <span class="r-label">
        {{ entryCount }} of {{ entriesShown }} entries on this page · {{ entriesToday.toLocaleString('en-US') }} today
      </span>
    </div>

    <RTable :columns="columns" :rows="rows" density="compact" caption="Journal lines for 3 Nov 2026 with totals per currency">
      <template #cell-entry="{ row }">
        <div v-if="row.kind === 'line' && row.lead" class="s-ledger-entry s-ledger-lead">
          <span class="s-ledger-entry__id">{{ row.entry }}</span>
          <span class="s-ledger-entry__memo">{{ row.memo }}</span>
        </div>
        <span v-else-if="row.kind === 'total'" class="s-ledger-total">Total · {{ row.currency }}</span>
        <span v-else class="s-ledger-cont" aria-hidden="true" />
      </template>
      <template #cell-account="{ row }">
        <span v-if="row.kind === 'line'" class="s-ledger-account">
          <span class="s-ledger-account__code">{{ row.account }}</span>
          <span class="s-ledger-account__name" :class="{ 'is-credit': row.credit != null }">{{ accounts[row.account] }}</span>
        </span>
        <RStatus v-else :tone="Math.abs(row.debit - row.credit) < 0.005 ? 'success' : 'danger'" :label="Math.abs(row.debit - row.credit) < 0.005 ? 'Balanced' : 'Out of balance'" size="sm" />
      </template>
      <template #cell-debit="{ row }">
        <span :class="{ 's-ledger-strong': row.kind === 'total' }">{{ row.debit == null ? '' : amount(row.debit, row.currency) }}</span>
      </template>
      <template #cell-credit="{ row }">
        <span :class="{ 's-ledger-strong': row.kind === 'total' }">{{ row.credit == null ? '' : amount(row.credit, row.currency) }}</span>
      </template>
      <template #cell-currency="{ row }"><span class="r-label s-ledger-ccy">{{ row.currency }}</span></template>
      <template #cell-posted="{ row }">
        <span v-if="row.kind === 'line'" class="s-ledger-mono">{{ row.posted }}</span>
        <span v-else aria-hidden="true" />
      </template>
    </RTable>

    <div class="s-ledger-footer">
      <RStatus :tone="balanced ? 'success' : 'danger'" :label="balanced ? 'Debits equal credits' : 'Out of balance'" size="sm" />
      <span class="r-label">Each currency balances on its own · USD legs post through 1990 and 1991</span>
    </div>
  </div>
</template>

<style scoped>
.s-ledger-journal {
  display: flex;
  flex-direction: column;
}

.s-ledger-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px 16px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--r-border);
}
.s-ledger-toolbar__search {
  width: min(320px, 100%);
}

.s-ledger-entry {
  display: flex;
  flex-direction: column;
  line-height: 1.25;
}
.s-ledger-entry__id {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
}
.s-ledger-entry__memo {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

.s-ledger-account {
  display: inline-flex;
  align-items: baseline;
  gap: 8px;
}
.s-ledger-account__code {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
}
/* Credit lines indent, the way a journal is written by hand. */
.s-ledger-account__name.is-credit {
  padding-left: 16px;
}

.s-ledger-mono {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
  font-variant-numeric: tabular-nums;
}
.s-ledger-ccy {
  color: var(--r-text-secondary);
}
.s-ledger-total {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.s-ledger-strong {
  font-weight: var(--r-weight-semibold);
}

/* Entries start on a full rule; totals sit on a muted band under a strong rule. */
.s-ledger-journal :deep(tbody tr:has(.s-ledger-lead):not(:first-child) td) {
  border-top: 1px solid var(--r-border);
}
.s-ledger-journal :deep(tbody tr:has(.s-ledger-total) td) {
  background: var(--r-bg-muted);
}
.s-ledger-journal :deep(tbody tr:not(:has(.s-ledger-total)) + tr:has(.s-ledger-total) td) {
  border-top: 1px solid var(--r-border-strong);
}
.s-ledger-journal :deep(tbody td) {
  height: 40px;
}
/* On narrow screens the journal scrolls sideways inside its card instead of wrapping. */
.s-ledger-journal :deep(.r-table__table) {
  min-width: 920px;
}

.s-ledger-footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px 16px;
  padding: 10px 16px;
  border-top: 1px solid var(--r-border);
}
</style>
