<script setup lang="ts">
import { RTable, type TableColumn } from '@/design-system'
import type { PropRow } from '../types'

defineProps<{
  rows: PropRow[]
  /** e.g. "RButton props" — read by screen readers. */
  caption?: string
}>()

const columns: TableColumn[] = [
  { key: 'name', label: 'Prop', width: '22%' },
  { key: 'type', label: 'Type', width: '26%' },
  { key: 'default', label: 'Default', width: '14%' },
  { key: 'description', label: 'Description' },
]
</script>

<template>
  <div class="doc-props">
    <RTable :columns="columns" :rows="rows" row-key="name" density="compact" :caption="caption">
      <template #cell-name="{ value }">
        <code class="doc-props__name">{{ value }}</code>
      </template>
      <template #cell-type="{ value }">
        <code class="doc-props__type">{{ value }}</code>
      </template>
      <template #cell-default="{ value }">
        <code v-if="value" class="doc-props__default">{{ value }}</code>
        <span v-else class="doc-props__none">—</span>
      </template>
      <template #cell-description="{ value }">
        <span class="doc-props__description">{{ value }}</span>
      </template>
    </RTable>
  </div>
</template>
