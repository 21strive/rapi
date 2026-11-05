<script setup lang="ts">
/**
 * The zone's records, read only: the state the conversation changes. No edit row, no row menus,
 * no filter bar; asking does that. Rows the conversation is about carry the selection rule, rows a
 * waiting change would touch say so, and rows changed today say when.
 */
import { RBadge, RCard, RTable, type TableColumn } from '@/design-system'
import { proxiable, short, ttlOf, type Rec } from '../data'

defineProps<{
  records: Rec[]
  highlight: string[]
  /** Records a change under Needs you would touch. */
  pending: Set<string>
}>()

const columns: TableColumn[] = [
  { key: 'type', label: 'Type', width: '76px' },
  { key: 'name', label: 'Name', width: '30%' },
  { key: 'content', label: 'Content' },
  { key: 'ttl', label: 'TTL', width: '76px' },
  { key: 'proxied', label: 'Proxy', width: '96px' },
]
</script>

<template>
  <RCard padding="none" class="dn-recs">
    <RTable
      :columns="columns"
      :rows="records"
      :selected="highlight"
      density="compact"
      caption="Records in lintang.example, read only"
      :row-class="(row) => ({ 'is-pending': pending.has(String(row.id)) })"
    >
      <template #cell-type="{ row }">
        <RBadge size="sm" class="dn-recs__type">{{ row.type }}</RBadge>
      </template>
      <template #cell-name="{ row }">
        <span class="dn-recs__name">
          <span class="r-mono">{{ short(row.name) }}</span>
          <span v-if="pending.has(String(row.id))" class="dn-recs__tag is-pending">Pending</span>
          <span v-else-if="row.touched" class="dn-recs__tag">{{ row.touched.kind === 'new' ? 'New' : 'Edited' }} {{ row.touched.at }}</span>
        </span>
      </template>
      <template #cell-content="{ row }">
        <span class="dn-recs__content r-mono" :title="row.content">{{ row.content }}</span>
      </template>
      <template #cell-ttl="{ row }">
        <span class="r-mono dn-recs__muted">{{ ttlOf(row as Rec) }}</span>
      </template>
      <template #cell-proxied="{ row }">
        <span :class="{ 'dn-recs__muted': !row.proxied }">{{ proxiable(row.type) ? (row.proxied ? 'Proxied' : 'DNS only') : '—' }}</span>
      </template>
    </RTable>
  </RCard>
</template>

<style scoped>
.dn-recs {
  gap: 0;
  overflow: hidden;
}

.dn-recs__type {
  min-width: 46px;
  justify-content: center;
}

.dn-recs__name {
  display: flex;
  align-items: baseline;
  gap: 8px;
  min-width: 0;
}

.dn-recs__tag {
  flex: none;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.dn-recs__tag.is-pending {
  color: var(--r-warning-text);
}

.dn-recs__content {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dn-recs__muted {
  color: var(--r-text-tertiary);
}

.dn-recs :deep(.r-table__table) {
  table-layout: fixed;
}
</style>
