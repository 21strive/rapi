<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Copy, Download, FileUp } from 'lucide-vue-next'
import { RBadge, RButton, RDialog, RTabs, RTextarea, useToast } from '@/design-system'
import { IMPORT_EXAMPLE, ZONE, parseZone, zoneFile, type DnsRecord } from '../data'

const props = defineProps<{ records: DnsRecord[] }>()
const open = defineModel<boolean>('open', { default: false })
const tab = defineModel<'export' | 'import'>('tab', { default: 'export' })
const emit = defineEmits<{ import: [records: Omit<DnsRecord, 'id'>[]] }>()

const { show } = useToast()

const tabs = [
  { label: 'Export', value: 'export' },
  { label: 'Import', value: 'import' },
]

const exported = computed(() => zoneFile(props.records))
const pasted = ref(IMPORT_EXAMPLE)
const parsed = computed(() => parseZone(pasted.value))
const typeCounts = computed(() => {
  const counts = new Map<string, number>()
  for (const r of parsed.value.records) counts.set(r.type, (counts.get(r.type) ?? 0) + 1)
  return [...counts.entries()]
})

watch(open, (isOpen) => {
  if (isOpen) pasted.value = IMPORT_EXAMPLE
})

async function copy() {
  try {
    await navigator.clipboard?.writeText(exported.value)
  } catch {
    /* The clipboard can be blocked; the text stays selectable. */
  }
  show({ title: 'Zone file copied', body: `${props.records.length} records from ${ZONE.name}.`, tone: 'success' })
}

function download(close: () => void) {
  show({ title: 'Download started', body: `${ZONE.name}.zone · ${exported.value.split('\n').length} lines`, tone: 'success' })
  close()
}

function importRecords(close: () => void) {
  if (!parsed.value.records.length) return
  emit('import', parsed.value.records)
  close()
}
</script>

<template>
  <RDialog v-model:open="open" eyebrow="Zone file · BIND format" title="Import and export records" size="lg">
    <RTabs v-model="tab" :items="tabs" size="sm" label="Direction">
      <div v-if="tab === 'export'" class="s-dns-zf__pane">
        <RTextarea
          :model-value="exported"
          mono
          readonly
          :rows="13"
          resize="none"
          :label="`${ZONE.name}.zone`"
          hint="Proxied records publish edge addresses. The origin values in this file stay private to your account."
          class="s-dns-zf__text"
        />
      </div>
      <div v-else class="s-dns-zf__pane">
        <RTextarea
          v-model="pasted"
          mono
          :rows="9"
          label="Records to add"
          hint="One record a line: name, TTL, class, type, content. Comments start with a semicolon."
          :error="pasted.trim() && !parsed.records.length ? 'No records found. Check that each line has IN and a record type.' : ''"
          class="s-dns-zf__text"
        />
        <div class="s-dns-zf__parsed" aria-live="polite">
          <span class="r-label">Found</span>
          <strong class="r-numeric">{{ parsed.records.length }} {{ parsed.records.length === 1 ? 'record' : 'records' }}</strong>
          <RBadge v-for="[type, n] in typeCounts" :key="type" size="sm">{{ type }} × {{ n }}</RBadge>
          <span v-if="parsed.skipped" class="r-caption r-text-tertiary">{{ parsed.skipped }} lines skipped</span>
        </div>
      </div>
    </RTabs>

    <template #footer="{ close }">
      <template v-if="tab === 'export'">
        <RButton variant="outline" @click="copy">
          <template #leading><Copy /></template>
          Copy
        </RButton>
        <RButton tone="brand" @click="download(close)">
          <template #leading><Download /></template>
          Download zone file
        </RButton>
      </template>
      <template v-else>
        <RButton variant="outline" @click="close">Cancel</RButton>
        <RButton tone="brand" :disabled="!parsed.records.length" @click="importRecords(close)">
          <template #leading><FileUp /></template>
          Import {{ parsed.records.length }} {{ parsed.records.length === 1 ? 'record' : 'records' }}
        </RButton>
      </template>
    </template>
  </RDialog>
</template>

<style scoped>
.s-dns-zf__pane {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 16px;
}
.s-dns-zf__text {
  width: 100%;
}
.s-dns-zf__parsed {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  font-size: var(--r-text-sm);
}
</style>
