<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import {
  ChartColumn,
  Copy,
  EllipsisVertical,
  FileUp,
  LayoutGrid,
  ListFilter,
  Lock,
  Mail,
  Network,
  Pencil,
  Plus,
  Radar,
  Search,
  ShieldCheck,
  SquarePen,
  Trash2,
  Zap,
} from 'lucide-vue-next'
import {
  RBadge,
  RButton,
  RCard,
  RCodeBlock,
  REmpty,
  RIconButton,
  RInput,
  RMenu,
  RNavItem,
  RPopover,
  RSegmented,
  RSelect,
  RSparkline,
  RSpecList,
  RStat,
  RStatus,
  RSwitch,
  RTable,
  RTimeline,
  useToast,
  type MenuItem,
  type TableColumn,
  type TableSort,
} from '@/design-system'
import SampleShell from '../_kit/SampleShell.vue'
import PropagationPanel from './parts/PropagationPanel.vue'
import ZoneFileDialog from './parts/ZoneFileDialog.vue'
import {
  NAMESERVERS,
  ZONE,
  initialChanges,
  initialRecords,
  proxiable,
  recordTypes,
  ttlLabel,
  ttlOptions,
  validate,
  type ChangeEntry,
  type DnsRecord,
  type RecordType,
} from './data'

const { show } = useToast()

/* ── Change log: the seeded history, then whatever happens on this screen ── */
const changes = ref<ChangeEntry[]>(initialChanges.map((c) => ({ ...c })))
let logSeq = 0
function log(title: string, body: string, tone: ChangeEntry['tone'] = 'neutral') {
  changes.value = [{ id: `l${++logSeq}`, time: 'Just now', title, body, meta: 'You', tone }, ...changes.value]
}

const records = ref<DnsRecord[]>(initialRecords.map((r) => ({ ...r })))
const fqdn = (name: string) => (name === ZONE.name || name === '@' ? ZONE.name : `${name}.${ZONE.name}`)
const proxiedCount = computed(() => records.value.filter((r) => r.proxied).length)

/* ── Sidebar ─────────────────────────────────────────────────────────────── */
const nav = [
  { label: 'Overview', icon: LayoutGrid },
  { label: 'Analytics', icon: ChartColumn },
  { label: 'DNS', icon: Network, active: true },
  { label: 'SSL/TLS', icon: Lock },
  { label: 'Security', icon: ShieldCheck },
  { label: 'Caching', icon: Zap },
  { label: 'Rules', icon: ListFilter },
  { label: 'Email routing', icon: Mail },
]

/* ── Search and type filter ──────────────────────────────────────────────── */
const search = ref('')
const typeFilter = ref<'all' | RecordType>('all')
const typeOptions = [{ label: 'All', value: 'all' }, ...recordTypes.map((t) => ({ label: t, value: t }))]
const sort = ref<TableSort | null>(null)

const visible = computed(() => {
  const q = search.value.trim().toLowerCase()
  return records.value.filter((r) => {
    if (typeFilter.value !== 'all' && r.type !== typeFilter.value) return false
    if (!q) return true
    return [r.type, r.name, fqdn(r.name), r.content].some((v) => v.toLowerCase().includes(q))
  })
})

const columns: TableColumn[] = [
  { key: 'type', label: 'Type', width: '76px', sortable: true },
  { key: 'name', label: 'Name', width: '176px', sortable: true },
  { key: 'content', label: 'Content' },
  { key: 'ttl', label: 'TTL', width: '68px', sortValue: (r) => r.ttl },
  { key: 'proxied', label: 'Proxy status', width: '136px' },
  { key: 'actions', label: 'Actions', width: '48px', align: 'right' },
]

/* ── Add / edit row ──────────────────────────────────────────────────────── */
const blank = () => ({ type: 'A' as RecordType, name: '', content: '', ttl: 1, proxied: true })
const form = ref(blank())
const errors = ref({ name: '', content: '' })
const editingId = ref<string | null>(null)
const highlight = ref<string[]>([])
const nameField = ref<{ focus: () => void } | null>(null)
const formTypeOptions = recordTypes.map((t) => ({ label: t, value: t }))

const placeholders: Record<RecordType, string> = {
  A: '203.0.113.40',
  AAAA: '2001:db8:4f1a::40',
  CNAME: 'app.lintangpay.example',
  MX: '10 mx1.mailroute.example',
  TXT: '"v=spf1 -all"',
  CAA: '0 issue "ca.trustline.example"',
}

watch(
  () => form.value.type,
  (type) => {
    if (!proxiable(type)) form.value.proxied = false
    errors.value.content = ''
  },
)

function focusForm() {
  nextTick(() => nameField.value?.focus())
}

function resetForm() {
  form.value = { ...blank(), type: form.value.type, proxied: proxiable(form.value.type) }
  errors.value = { name: '', content: '' }
  editingId.value = null
  highlight.value = []
}

function flash(id: string) {
  highlight.value = [id]
  window.setTimeout(() => {
    if (highlight.value[0] === id && editingId.value !== id) highlight.value = []
  }, 3200)
}

function save() {
  const f = form.value
  errors.value = validate(f.type, f.name, f.content)
  if (errors.value.name || errors.value.content) return
  const name = f.name.trim() === '@' ? ZONE.name : f.name.trim().replace(new RegExp(`\\.${ZONE.name.replace('.', '\\.')}$`), '')
  const proxied = proxiable(f.type) && f.proxied
  const content = f.content.trim()
  const ttl = proxied ? 1 : f.ttl
  const word = proxied ? 'proxied' : `TTL ${ttlLabel(ttl)}`

  if (editingId.value) {
    const id = editingId.value
    const old = records.value.find((r) => r.id === id)!
    const changed = old.content !== content
    records.value = records.value.map((r) =>
      r.id === id
        ? {
            ...r,
            type: f.type,
            name,
            content,
            ttl,
            proxied,
            previous: changed ? old.content : r.previous,
            changedAgo: changed ? 0 : r.changedAgo,
            note: changed ? 'Edited just now' : r.note,
          }
        : r,
    )
    show({ title: 'Record updated', body: `${f.type} ${fqdn(name)} → ${content} · ${word}`, tone: 'success' })
    log(`${name} · ${f.type} record changed`, changed ? `${old.content} → ${content}` : `Settings updated, ${word}`, 'warning')
    resetForm()
    flash(id)
    if (changed) checkPropagation(id)
    return
  }

  const id = `n${Date.now().toString(36)}`
  records.value = [{ id, type: f.type, name, content, ttl, proxied, previous: 'NXDOMAIN', changedAgo: 0, note: 'Added just now' }, ...records.value]
  show({ title: 'Record added', body: `${f.type} ${fqdn(name)} → ${content} · ${word}`, tone: 'success' })
  log(`${name} · ${f.type} added`, `${content} · ${word}`, 'success')
  search.value = ''
  typeFilter.value = 'all'
  resetForm()
  flash(id)
  if (f.type !== 'CAA') checkPropagation(id)
}

function edit(record: DnsRecord) {
  editingId.value = record.id
  highlight.value = [record.id]
  form.value = {
    type: record.type,
    name: record.name === ZONE.name ? '@' : record.name,
    content: record.content,
    ttl: record.ttl,
    proxied: record.proxied,
  }
  errors.value = { name: '', content: '' }
  focusForm()
}

function duplicate(record: DnsRecord) {
  editingId.value = null
  form.value = { type: record.type, name: '', content: record.content, ttl: record.ttl, proxied: record.proxied }
  errors.value = { name: '', content: '' }
  focusForm()
}

function remove(record: DnsRecord) {
  const at = records.value.findIndex((r) => r.id === record.id)
  records.value = records.value.filter((r) => r.id !== record.id)
  if (editingId.value === record.id) resetForm()
  log(`${record.name} · ${record.type} deleted`, record.content, 'danger')
  show({
    title: 'Record deleted',
    body: `${record.type} ${fqdn(record.name)} → ${record.content}`,
    tone: 'neutral',
    action: {
      label: 'Undo',
      onClick: () => {
        const next = [...records.value]
        next.splice(at, 0, record)
        records.value = next
        log(`${record.name} · ${record.type} restored`, record.content, 'success')
      },
    },
  })
}

async function copyContent(record: DnsRecord) {
  try {
    await navigator.clipboard?.writeText(record.content)
  } catch {
    /* blocked clipboard: the value is still on screen */
  }
  show({ title: 'Content copied', body: record.content, tone: 'success', duration: 2600 })
}

function toggleProxy(record: DnsRecord, on: boolean) {
  records.value = records.value.map((r) => (r.id === record.id ? { ...r, proxied: on } : r))
  log(`${record.name} · proxy turned ${on ? 'on' : 'off'}`, on ? 'Answers with edge addresses' : `Answers with ${record.content}`, on ? 'neutral' : 'warning')
  show(
    on
      ? { title: 'Proxied', body: `${fqdn(record.name)} now answers with edge addresses.`, tone: 'success' }
      : {
          title: 'DNS only',
          body: `${fqdn(record.name)} now answers with ${record.content}. The origin is visible to anyone who looks it up.`,
          tone: 'warning',
        },
  )
}

/* ── Row menu ────────────────────────────────────────────────────────────── */
const menuFor = ref<string | null>(null)
function rowMenu(record: DnsRecord): MenuItem[] {
  return [
    { id: 'edit', label: 'Edit', icon: Pencil, onSelect: () => edit(record) },
    { id: 'duplicate', label: 'Duplicate', icon: SquarePen, onSelect: () => duplicate(record) },
    { id: 'copy', label: 'Copy content', icon: Copy, onSelect: () => copyContent(record) },
    { id: 'check', label: 'Check propagation', icon: Radar, disabled: record.type === 'CAA', onSelect: () => checkPropagation(record.id) },
    { divider: true },
    { id: 'delete', label: 'Delete record', icon: Trash2, danger: true, onSelect: () => remove(record) },
  ]
}

/* ── Propagation ─────────────────────────────────────────────────────────── */
const propRecord = ref('r13')
const panel = ref<{ run: (quiet?: boolean) => void } | null>(null)
function checkPropagation(id: string) {
  if (propRecord.value === id) panel.value?.run()
  else propRecord.value = id
}

/** Every resolver answers the new value: the record is no longer propagating. */
function settle(id: string) {
  records.value = records.value.map((r) => (r.id === id && r.previous ? { ...r, previous: undefined, changedAgo: undefined } : r))
}

/* ── Import / export ─────────────────────────────────────────────────────── */
const fileOpen = ref(false)
const fileTab = ref<'export' | 'import'>('export')
function openFile(tab: 'export' | 'import') {
  fileTab.value = tab
  fileOpen.value = true
}
function importRecords(list: Omit<DnsRecord, 'id'>[]) {
  const stamp = Date.now().toString(36)
  const added = list.map((r, i) => ({ ...r, id: `i${stamp}${i}`, previous: 'NXDOMAIN', changedAgo: 0, note: 'Imported just now' }))
  records.value = [...added, ...records.value]
  highlight.value = added.map((r) => r.id)
  window.setTimeout(() => (highlight.value = []), 3200)
  log(`${added.length} records imported`, added.map((r) => `${r.type} ${r.name}`).join(', '), 'success')
  show({ title: `${added.length} records imported`, body: added.map((r) => `${r.type} ${fqdn(r.name)}`).join(', '), tone: 'success' })
}
</script>

<template>
  <SampleShell product="Edge" :sidebar-width="224">
    <template #strip>
      <span class="s-dns__path">/ Lintang / {{ ZONE.name }} / DNS</span>
    </template>
    <template #meta>
      <span class="s-dns__wide">Nameservers verified · 11:47 WIB</span>
      <span class="s-dns__narrow">11:47 WIB</span>
    </template>

    <template #sidebar>
      <div class="s-dns__zone-pick">
        <span class="r-label">Zone</span>
        <span class="s-dns__zone-name">{{ ZONE.name }}</span>
        <RStatus tone="success" label="Active" size="sm" />
      </div>
      <nav class="s-dns__nav" aria-label="Zone">
        <RNavItem v-for="item in nav" :key="item.label" as="button" type="button" :label="item.label" :icon="item.icon" :active="item.active" :badge="item.active ? records.length : undefined" />
      </nav>
      <div class="s-dns__side-foot">
        <span class="r-label">Plan</span>
        <span class="s-dns__side-plan">{{ ZONE.plan }} · 21 Strive Edge</span>
      </div>
    </template>

    <template #header>
      <div class="s-dns__title">
        <p class="r-eyebrow">Zone · {{ ZONE.name }}</p>
        <h1 class="r-h3">DNS records</h1>
      </div>
    </template>
    <template #actions>
      <RButton variant="outline" size="sm" @click="openFile('export')">
        <template #leading><FileUp /></template>
        Import / export
      </RButton>
      <RButton size="sm" @click="focusForm">
        <template #leading><Plus /></template>
        Add record
      </RButton>
    </template>

    <div class="s-dns">
      <section class="s-dns__zone r-grid-ruled" aria-label="Zone summary">
        <div class="s-dns__cell">
          <p class="s-dns__kicker"><span class="r-index">01</span><span class="r-eyebrow">Zone</span></p>
          <div class="s-dns__zone-head">
            <h2 class="r-h2">{{ ZONE.name }}</h2>
            <RStatus tone="success" label="Active" />
          </div>
          <RSpecList
            dense
            :items="[
              { label: 'Plan', value: ZONE.plan },
              { label: 'DNSSEC', value: ZONE.dnssec, tone: 'success' },
              { label: 'Zone ID', value: `${ZONE.id.slice(0, 8)}…${ZONE.id.slice(-4)}`, mono: true },
            ]"
          />
        </div>
        <div class="s-dns__cell">
          <p class="s-dns__kicker"><span class="r-index">02</span><span class="r-eyebrow">Nameservers</span></p>
          <RCodeBlock :code="NAMESERVERS" title="Assigned to this zone" language="NS" />
          <p class="r-caption r-text-tertiary">Set at {{ ZONE.registrar }} · first verified {{ ZONE.activated }}</p>
        </div>
        <div class="s-dns__cell s-dns__cell--stat">
          <p class="s-dns__kicker"><span class="r-index">03</span><span class="r-eyebrow">Queries</span></p>
          <RStat label="Answered · last 24 hours" :value="ZONE.queries24h / 1e6" :decimals="2" suffix="M" :trend="ZONE.queriesTrend" size="md" />
          <RSparkline :values="ZONE.queriesSpark" color="var(--r-chart-1)" :height="36" area label="DNS queries per hour, last 24 hours" />
        </div>
      </section>

      <div class="s-dns__grid">
        <RCard index="04" eyebrow="Records" title="Zone records" :meta="`${records.length} records · ${proxiedCount} proxied`" padding="none" class="s-dns__records">
          <div class="s-dns__toolbar">
            <RInput v-model="search" size="sm" placeholder="Search name, content or type" clearable aria-label="Search records" class="s-dns__search">
              <template #leading><Search /></template>
            </RInput>
            <div class="s-dns__types">
              <RSegmented v-model="typeFilter" :options="typeOptions" size="sm" label="Record type" />
            </div>
          </div>

          <form class="s-dns__add" :class="{ 'is-editing': editingId }" novalidate @submit.prevent="save">
            <p class="s-dns__add-title r-label">{{ editingId ? `Editing ${fqdn(form.name === '@' ? ZONE.name : form.name)}` : 'New record' }}</p>
            <RSelect v-model="form.type" :options="formTypeOptions" size="sm" label="Type" class="s-dns__f-type" />
            <RInput ref="nameField" v-model="form.name" size="sm" label="Name" placeholder="api-v2, or @ for apex" :error="errors.name" class="s-dns__f-name" />
            <RInput v-model="form.content" size="sm" :label="form.type === 'CNAME' ? 'Target' : 'Content'" :placeholder="placeholders[form.type]" :error="errors.content" class="s-dns__f-content" />
            <RSelect v-model="form.ttl" :options="ttlOptions" size="sm" label="TTL" :disabled="form.proxied && proxiable(form.type)" class="s-dns__f-ttl" />
            <div class="s-dns__f-proxy">
              <span class="s-dns__f-label">Proxy</span>
              <RSwitch v-model="form.proxied" size="sm" :disabled="!proxiable(form.type)">{{ form.proxied ? 'Proxied' : 'DNS only' }}</RSwitch>
            </div>
            <div class="s-dns__f-actions">
              <RButton v-if="editingId" variant="ghost" size="sm" @click="resetForm">Cancel</RButton>
              <RButton type="submit" tone="brand" size="sm">{{ editingId ? 'Update' : 'Save' }}</RButton>
            </div>
          </form>

          <RTable
            v-model:sort="sort"
            :columns="columns"
            :rows="visible"
            :selected="highlight"
            density="compact"
            caption="DNS records for lintang.example"
          >
            <template #header-actions><span class="r-sr-only">Actions</span></template>
            <template #cell-type="{ row }">
              <RBadge size="sm" class="s-dns__type">{{ row.type }}</RBadge>
            </template>
            <template #cell-name="{ row }">
              <span class="r-mono">{{ row.name }}</span>
            </template>
            <template #cell-content="{ row }">
              <span class="s-dns__content-cell">
                <span class="s-dns__content r-mono" :title="row.content">{{ row.content }}</span>
                <RBadge v-if="row.changedAgo != null && row.previous" tone="warning" size="sm" dot>Propagating</RBadge>
              </span>
            </template>
            <template #cell-ttl="{ row }">
              <span class="r-mono r-text-tertiary">{{ ttlLabel(row.proxied ? 1 : row.ttl) }}</span>
            </template>
            <template #cell-proxied="{ row }">
              <RSwitch
                v-if="proxiable(row.type)"
                :model-value="row.proxied"
                size="sm"
                :aria-label="`Proxy ${fqdn(row.name)}`"
                @update:model-value="(on: boolean) => toggleProxy(row as DnsRecord, on)"
              >
                <span class="s-dns__proxy-word">{{ row.proxied ? 'Proxied' : 'DNS only' }}</span>
              </RSwitch>
              <span v-else class="s-dns__proxy-word r-text-tertiary">DNS only</span>
            </template>
            <template #cell-actions="{ row }">
              <RPopover :open="menuFor === row.id" kind="menu" placement="bottom-end" @update:open="(o: boolean) => (menuFor = o ? row.id : null)">
                <template #trigger>
                  <RIconButton :label="`Actions for ${row.type} ${fqdn(row.name)}`" variant="ghost" size="xs">
                    <EllipsisVertical />
                  </RIconButton>
                </template>
                <RMenu :items="rowMenu(row as DnsRecord)" :label="`Actions for ${row.type} ${fqdn(row.name)}`" @close="menuFor = null" />
              </RPopover>
            </template>
            <template #empty>
              <REmpty size="sm" title="No records match" :body="`Nothing in ${ZONE.name} matches “${search}”.`">
                <template #actions>
                  <RButton variant="outline" size="sm" @click="(search = ''), (typeFilter = 'all')">Clear search</RButton>
                </template>
              </REmpty>
            </template>
          </RTable>
        </RCard>

        <div class="s-dns__side">
          <PropagationPanel ref="panel" v-model="propRecord" :records="records" @settled="settle" />
          <RCard index="06" eyebrow="Change log" title="Recent changes" :meta="`${changes.length} entries`">
            <RTimeline :items="changes.slice(0, 5)" dense time-position="top" />
          </RCard>
        </div>
      </div>
    </div>

    <ZoneFileDialog v-model:open="fileOpen" v-model:tab="fileTab" :records="records" @import="importRecords" />
  </SampleShell>
</template>

<style scoped>
.s-dns__path {
  color: var(--r-text-tertiary);
}
.s-dns__narrow {
  display: none;
}

/* Sidebar */
.s-dns__zone-pick {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 4px 8px 14px;
  border-bottom: 1px solid var(--r-border);
}
.s-dns__zone-name {
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-snug);
}
.s-dns__nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.s-dns__side-foot {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: auto;
  padding: 12px 8px 0;
  border-top: 1px solid var(--r-border);
}
.s-dns__side-plan {
  color: var(--r-text-secondary);
  font-size: var(--r-text-sm);
}

.s-dns__title {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.s-dns__title .r-eyebrow {
  color: var(--r-text-tertiary);
}

.s-dns {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Zone summary */
.s-dns__zone {
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr) minmax(0, 0.9fr);
}
.s-dns__cell {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 20px;
}
.s-dns__cell--stat {
  justify-content: space-between;
}
.s-dns__kicker {
  display: flex;
  align-items: baseline;
  gap: 10px;
}
.s-dns__zone-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 16px;
}

/* Records + propagation */
.s-dns__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 400px;
  align-items: start;
  gap: 16px;
}
.s-dns__records {
  gap: 0;
}
.s-dns__side {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}
.s-dns__records :deep(.r-card__header) {
  padding-bottom: 14px;
}

.s-dns__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
  padding: 0 20px 14px;
}
.s-dns__search {
  flex: 1 1 220px;
  max-width: 320px;
}
.s-dns__types {
  max-width: 100%;
  overflow-x: auto;
}

.s-dns__add {
  display: grid;
  grid-template-columns: 92px minmax(150px, 1.1fr) minmax(170px, 1.6fr) 96px auto auto;
  align-items: start;
  gap: 10px 12px;
  padding: 12px 20px 14px;
  border-top: 1px solid var(--r-border);
  border-bottom: 1px solid var(--r-border);
  background: var(--r-bg-muted);
}
.s-dns__add.is-editing {
  background: var(--r-bg-selected);
}
.s-dns__add-title {
  grid-column: 1 / -1;
}
.s-dns__f-proxy {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.s-dns__f-label {
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  font-weight: var(--r-weight-medium);
  line-height: 1.3;
}
.s-dns__f-proxy :deep(.r-switch) {
  align-items: center;
  min-height: 28px;
  font-size: var(--r-text-sm);
}
.s-dns__f-actions {
  display: flex;
  gap: 8px;
  align-self: start;
  padding-top: 19px;
}

.s-dns__type {
  min-width: 48px;
  justify-content: center;
}
/* The content column takes what is left: a zero minimum lets long values end in an ellipsis
   instead of pushing the table wider than its card. */
.s-dns__content-cell {
  display: grid;
  grid-template-columns: minmax(0, max-content) max-content;
  align-items: center;
  gap: 8px;
  min-width: 210px;
}
.s-dns__content {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.s-dns__proxy-word {
  font-size: var(--r-text-sm);
}
.s-dns__records :deep(.r-switch) {
  align-items: center;
}

@media (max-width: 1360px) {
  .s-dns__grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 1100px) {
  .s-dns__zone {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  }
  .s-dns__cell--stat {
    grid-column: 1 / -1;
  }
  .s-dns__add {
    grid-template-columns: 92px minmax(0, 1fr) minmax(0, 1.4fr);
  }
}

@media (max-width: 640px) {
  .s-dns__path,
  .s-dns__wide {
    display: none;
  }
  .s-dns__narrow {
    display: inline;
  }
  .s-dns__zone {
    grid-template-columns: minmax(0, 1fr);
  }
  .s-dns__cell--stat {
    grid-column: auto;
  }
  .s-dns__toolbar {
    padding: 0 16px 12px;
  }
  .s-dns__search {
    max-width: none;
  }
  .s-dns__add {
    grid-template-columns: 92px minmax(0, 1fr);
    padding: 12px 16px 14px;
  }
  .s-dns__f-content {
    grid-column: 1 / -1;
  }
  .s-dns__f-actions {
    grid-column: 1 / -1;
    justify-content: flex-end;
    padding-top: 0;
  }
}
</style>
