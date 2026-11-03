<script setup lang="ts">
/*
 * Sample 09 · Audit trail. Selaras Bank's production audit log: a filter row whose every control
 * filters (search, actor, action, range, removable chips), facets with live counts, a histogram
 * of the current slice, a dense event table and a drawer with the change as before and after.
 */
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { Download, Search } from 'lucide-vue-next'
import {
  RAvatar,
  RBadge,
  RBarList,
  RButton,
  RCard,
  RChip,
  RColumnChart,
  REmpty,
  RInput,
  RKbd,
  RPagination,
  RSegmented,
  RSelect,
  RSpecList,
  RStatus,
  RTable,
  formatNumber,
  useToast,
} from '@/design-system'
import type { SpecItem, TableColumn, TableSort } from '@/design-system'
import SampleShell from '../_kit/SampleShell.vue'
import FacetGroup from './parts/FacetGroup.vue'
import EventDrawer from './parts/EventDrawer.vue'
import {
  NOW,
  RANGES,
  RESULTS,
  RESULT_LABEL,
  RESULT_TONE,
  SOURCES,
  SOURCE_LABEL,
  TYPES,
  TYPE_LABEL,
  actionOptions,
  actorById,
  actors,
  dayMonth,
  events,
  stamp,
  type AuditEvent,
  type FacetOption,
  type RangeKey,
  type ResourceType,
  type Result,
  type Source,
} from './data'

const PAGE_SIZE = 25

/* ── Filters ─────────────────────────────────────────────────────────────── */

const query = ref('')
const actor = ref<string>('all')
const action = ref<string>('all')
const range = ref<RangeKey>('24h')
const facets = reactive({ result: [] as string[], type: [] as string[], source: [] as string[] })
type FacetKey = keyof typeof facets

const actorOptions = [
  { label: 'All actors', value: 'all' },
  ...actors.filter((a) => a.kind === 'person').map((a) => ({ label: a.name, value: a.id })),
  ...actors.filter((a) => a.kind === 'service').map((a) => ({ label: a.name, value: a.id })),
]
const actionSelectOptions = [{ label: 'All actions', value: 'all' }, ...actionOptions.map((a) => ({ label: a, value: a }))]
const rangeOptions = [
  { label: '1H', value: '1h' },
  { label: '24H', value: '24h' },
  { label: '7D', value: '7d' },
  { label: '30D', value: '30d' },
]

const haystack = new Map(
  events.map((e) => [e.id, `${e.actor.name} ${e.actor.id} ${e.action} ${e.resource} ${e.ip} ${e.session} ${e.request} ${e.id}`.toLowerCase()]),
)
const needle = computed(() => query.value.trim().toLowerCase())

const inRange = computed(() => {
  const from = NOW - RANGES[range.value].span
  return events.filter((e) => e.ts > from)
})

function matches(e: AuditEvent, skip?: FacetKey) {
  if (actor.value !== 'all' && e.actor.id !== actor.value) return false
  if (action.value !== 'all' && e.action !== action.value) return false
  if (skip !== 'result' && facets.result.length && !facets.result.includes(e.result)) return false
  if (skip !== 'type' && facets.type.length && !facets.type.includes(e.type)) return false
  if (skip !== 'source' && facets.source.length && !facets.source.includes(e.source)) return false
  if (needle.value && !haystack.get(e.id)?.includes(needle.value)) return false
  return true
}

const filtered = computed(() => inRange.value.filter((e) => matches(e)))

/** Counts per facet value, under every other active filter, so a click never leads to nothing unseen. */
function countFacet(key: FacetKey, read: (e: AuditEvent) => string) {
  const counts = new Map<string, number>()
  for (const e of inRange.value) if (matches(e, key)) counts.set(read(e), (counts.get(read(e)) ?? 0) + 1)
  return counts
}

const resultFacet = computed<FacetOption[]>(() => {
  const counts = countFacet('result', (e) => e.result)
  return RESULTS.map((r: Result) => ({ value: r, label: RESULT_LABEL[r], count: counts.get(r) ?? 0, tone: RESULT_TONE[r] }))
})
const typeFacet = computed<FacetOption[]>(() => {
  const counts = countFacet('type', (e) => e.type)
  return TYPES.map((t: ResourceType) => ({ value: t, label: TYPE_LABEL[t], count: counts.get(t) ?? 0 }))
})
const sourceFacet = computed<FacetOption[]>(() => {
  const counts = countFacet('source', (e) => e.source)
  return SOURCES.map((s: Source) => ({ value: s, label: SOURCE_LABEL[s], count: counts.get(s) ?? 0 }))
})

interface ActiveChip {
  key: string
  text: string
  clear: () => void
}

const chips = computed<ActiveChip[]>(() => {
  const list: ActiveChip[] = []
  if (needle.value) list.push({ key: 'q', text: `Search “${query.value.trim()}”`, clear: () => (query.value = '') })
  if (actor.value !== 'all') list.push({ key: 'actor', text: `Actor is ${actorById(actor.value)?.name ?? actor.value}`, clear: () => (actor.value = 'all') })
  if (action.value !== 'all') list.push({ key: 'action', text: `Action is ${action.value}`, clear: () => (action.value = 'all') })
  const facetChips = (key: FacetKey, noun: string, label: (v: string) => string) => {
    for (const value of facets[key])
      list.push({ key: `${key}-${value}`, text: `${noun} is ${label(value)}`, clear: () => (facets[key] = facets[key].filter((v) => v !== value)) })
  }
  facetChips('result', 'Result', (v) => RESULT_LABEL[v as Result])
  facetChips('type', 'Type', (v) => TYPE_LABEL[v as ResourceType])
  facetChips('source', 'Source', (v) => SOURCE_LABEL[v as Source])
  return list
})

function clearAll() {
  query.value = ''
  actor.value = 'all'
  action.value = 'all'
  facets.result = []
  facets.type = []
  facets.source = []
}

/* Saved views: one click to a common slice. */
const views: { label: string; apply: () => void }[] = [
  { label: 'Denied and errors', apply: () => (facets.result = ['denied', 'error']) },
  { label: 'Privileged changes', apply: () => (facets.type = ['role', 'policy', 'api_key', 'secret']) },
  { label: 'Machine activity', apply: () => (facets.source = ['api', 'system']) },
]
function applyView(view: { apply: () => void }) {
  clearAll()
  view.apply()
}

/* ── Sorting and pages ───────────────────────────────────────────────────── */

const sort = ref<TableSort | null>(null)
const sorted = computed(() => (sort.value?.key === 'ts' && sort.value.direction === 'asc' ? [...filtered.value].reverse() : filtered.value))
const page = ref(1)
const pageCount = computed(() => Math.max(1, Math.ceil(sorted.value.length / PAGE_SIZE)))
const pageRows = computed(() => sorted.value.slice((page.value - 1) * PAGE_SIZE, page.value * PAGE_SIZE))
const shownFrom = computed(() => (sorted.value.length ? (page.value - 1) * PAGE_SIZE + 1 : 0))
const shownTo = computed(() => Math.min(sorted.value.length, page.value * PAGE_SIZE))

watch([needle, actor, action, range, () => [...facets.result, ...facets.type, ...facets.source].join(), sort], () => (page.value = 1))

const columns: TableColumn[] = [
  { key: 'ts', label: 'Time', sortable: true, width: '208px' },
  { key: 'actor', label: 'Actor', width: '184px' },
  { key: 'action', label: 'Action', width: '168px' },
  { key: 'resource', label: 'Resource' },
  { key: 'ip', label: 'IP address', width: '128px' },
  { key: 'result', label: 'Result', width: '104px' },
]

/* ── Histogram of the current slice ──────────────────────────────────────── */

const histogram = computed(() => {
  const cfg = RANGES[range.value]
  const n = Math.round(cfg.span / cfg.bucket)
  const start = NOW - cfg.span
  const counts: Record<Result, number[]> = { success: new Array(n).fill(0), denied: new Array(n).fill(0), error: new Array(n).fill(0) }
  for (const e of filtered.value) {
    const i = Math.min(n - 1, Math.max(0, Math.floor((e.ts - start) / cfg.bucket)))
    counts[e.result][i]++
  }
  return {
    labels: Array.from({ length: n }, (_, i) => cfg.tick(start + i * cfg.bucket)),
    series: [
      { name: 'Success', values: counts.success, color: 'var(--r-chart-context)' },
      { name: 'Denied', values: counts.denied, color: 'var(--r-status-critical)' },
      { name: 'Error', values: counts.error, color: 'var(--r-status-warning)' },
    ],
    label: `Audit events ${cfg.unit} over the ${cfg.label}, by result: success, denied and error`,
  }
})

const deniedCount = computed(() => filtered.value.filter((e) => e.result !== 'success').length)

/** Who did the most in the current slice. */
const topActors = computed(() => {
  const counts = new Map<string, number>()
  for (const e of filtered.value) counts.set(e.actor.name, (counts.get(e.actor.name) ?? 0) + 1)
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 6)
    .map(([label, values]) => ({ label, values }))
})

/* ── The drawer ──────────────────────────────────────────────────────────── */

const byId = new Map(events.map((e) => [e.id, e]))
const bySession = new Map<string, AuditEvent[]>()
for (const e of [...events].reverse()) {
  const list = bySession.get(e.session)
  if (list) list.push(e)
  else bySession.set(e.session, [e])
}

const openId = ref<string | null>(null)
const drawerOpen = ref(false)
const openEvent = computed(() => (openId.value ? (byId.get(openId.value) ?? null) : null))
const openSession = computed(() => (openEvent.value ? (bySession.get(openEvent.value.session) ?? []) : []))
const openIndex = computed(() => (openId.value ? sorted.value.findIndex((e) => e.id === openId.value) : -1))
const selectedKeys = computed(() => (drawerOpen.value && openId.value ? [openId.value] : []))

function openRow(id: string) {
  openId.value = id
  drawerOpen.value = true
}

function step(direction: -1 | 1) {
  const next = sorted.value[openIndex.value + direction]
  if (!next) return
  openId.value = next.id
  page.value = Math.floor((openIndex.value) / PAGE_SIZE) + 1
}

function filterActor(id: string) {
  clearAll()
  actor.value = id
  drawerOpen.value = false
}

function filterSession(id: string) {
  clearAll()
  query.value = id
  if (openEvent.value && openEvent.value.ts <= NOW - RANGES[range.value].span) range.value = '30d'
  drawerOpen.value = false
}

/* ── Keyboard: "/" focuses the search ────────────────────────────────────── */

const search = ref<InstanceType<typeof RInput> | null>(null)
function onKeydown(event: KeyboardEvent) {
  if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey || drawerOpen.value) return
  const target = event.target as HTMLElement | null
  if (target?.closest('input, textarea, select, [contenteditable="true"]')) return
  event.preventDefault()
  search.value?.focus()
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))

/* ── Export ──────────────────────────────────────────────────────────────── */

const toast = useToast()

function exportCsv() {
  const rows = sorted.value
  const header = ['timestamp_utc', 'event_id', 'actor', 'action', 'resource_type', 'resource', 'ip', 'source', 'result', 'reason', 'session_id', 'request_id']
  const cell = (value: string) => (/[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value)
  const lines = rows.map((e) =>
    [new Date(e.ts).toISOString(), e.id, e.actor.id, e.action, e.type, e.resource, e.ip, e.source, e.result, e.reason ?? '', e.session, e.request]
      .map(cell)
      .join(','),
  )
  const file = `selaras-audit-production-20261103-0530-${range.value}.csv`
  const url = URL.createObjectURL(new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv' }))
  const link = document.createElement('a')
  link.href = url
  link.download = file
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  const filters = chips.value.length
  toast.show({
    title: `Exported ${formatNumber(rows.length)} events`,
    body: `${file} · ${RANGES[range.value].label}, ${filters ? `${filters} ${filters === 1 ? 'filter' : 'filters'}` : 'no filters'}`,
    tone: 'success',
  })
}

/* ── Integrity of the log ────────────────────────────────────────────────── */

const integrity: SpecItem[] = [
  { label: 'Chain head', value: 'sha256:3f9a…c21e', mono: true },
  { label: 'Last anchor', value: '05:00:00 UTC', mono: true, hint: 'Every 15 minutes' },
  { label: 'Copies', value: 'JKT-1, SGP-1', hint: 'Write once, read many' },
  { label: 'Retention', value: '400 days' },
]
</script>

<template>
  <SampleShell product="Audit">
    <template #strip>
      <span class="s-audit-log__strip-context">Selaras Bank · Production</span>
    </template>
    <template #meta>
      <span class="s-audit-log__strip-hide">Retention 400 days</span>
      <span>03 Nov 2026 · 05:30 UTC</span>
    </template>
    <template #header>
      <div class="s-audit-log__heading">
        <p class="r-eyebrow s-audit-log__eyebrow">Production · all services</p>
        <h1 class="s-audit-log__title">Audit trail</h1>
      </div>
    </template>
    <template #actions>
      <RStatus tone="success" label="SIEM forwarding" size="sm" />
      <RButton variant="outline" @click="exportCsv">
        <template #leading><Download /></template>
        Export CSV
      </RButton>
    </template>

    <div class="s-audit-log">
      <section class="s-audit-log__filters" aria-label="Filters">
        <div class="s-audit-log__filter-row">
          <RInput
            ref="search"
            v-model="query"
            class="s-audit-log__search"
            placeholder="Search actor, action, resource or IP"
            aria-label="Search events"
            clearable
          >
            <template #leading><Search /></template>
            <template v-if="!query" #trailing><RKbd size="sm">/</RKbd></template>
          </RInput>
          <RSelect v-model="actor" :options="actorOptions" class="s-audit-log__select" aria-label="Actor" />
          <RSelect v-model="action" :options="actionSelectOptions" class="s-audit-log__select" aria-label="Action" />
          <RSegmented v-model="range" :options="rangeOptions" label="Time range" block class="s-audit-log__range" />
        </div>
        <div class="s-audit-log__chips">
          <div class="s-audit-log__chip-group">
            <span class="r-label s-audit-log__chip-label">Filters</span>
            <template v-if="chips.length">
              <RChip
                v-for="chip in chips"
                :key="chip.key"
                variant="solid"
                size="sm"
                removable
                :remove-label="`Remove filter: ${chip.text}`"
                @remove="chip.clear()"
              >
                {{ chip.text }}
              </RChip>
              <RButton variant="ghost" size="xs" @click="clearAll">Clear all</RButton>
            </template>
            <span v-else class="s-audit-log__none">None. Every event in the {{ RANGES[range].label }}.</span>
          </div>
          <div class="s-audit-log__chip-group s-audit-log__views">
            <span class="r-label s-audit-log__chip-label">Views</span>
            <RChip v-for="view in views" :key="view.label" variant="dashed" size="sm" @click="applyView(view)">{{ view.label }}</RChip>
          </div>
        </div>
      </section>

      <div class="s-audit-log__body">
        <RCard class="s-audit-log__facets" index="01" eyebrow="Facets" meta="In range" padding="sm">
          <div class="s-audit-log__facet-groups">
            <FacetGroup v-model="facets.result" class="s-audit-log__facet-result" title="Result" :options="resultFacet" />
            <FacetGroup v-model="facets.type" class="s-audit-log__facet-type" title="Resource type" :options="typeFacet" />
            <FacetGroup v-model="facets.source" class="s-audit-log__facet-source" title="Source" :options="sourceFacet" />
          </div>
        </RCard>

        <RCard
          class="s-audit-log__log"
          index="02"
          eyebrow="Events"
          :title="`${formatNumber(filtered.length)} events`"
          :subtitle="`${formatNumber(deniedCount)} denied or failed · ${RANGES[range].label}`"
          padding="none"
        >
          <template #actions>
            <span class="s-audit-log__unit">{{ RANGES[range].unit }} · UTC</span>
          </template>
          <div class="s-audit-log__histogram">
            <RColumnChart
              :labels="histogram.labels"
              :series="histogram.series"
              :height="132"
              :show-values="false"
              y-unit="Events"
              :label="histogram.label"
            />
          </div>
          <div class="s-audit-log__table">
            <RTable
              :columns="columns"
              :rows="pageRows"
              :selected="selectedKeys"
              v-model:sort="sort"
              manual-sort
              density="compact"
              caption="Audit events, newest first"
              @row-click="(row) => openRow(String(row.id))"
            >
              <template #cell-ts="{ row }">
                <button type="button" class="s-audit-log__stamp" :aria-label="`Open event ${row.action} at ${stamp(row.ts)} UTC`" @click.stop="openRow(String(row.id))">
                  <span class="s-audit-log__date">{{ dayMonth(row.ts) }}</span>
                  <span>{{ stamp(row.ts) }}</span>
                  <span class="s-audit-log__zone">UTC</span>
                </button>
              </template>
              <template #cell-actor="{ row }">
                <span class="s-audit-log__actor">
                  <RAvatar :name="row.actor.avatar" size="xs" decorative />
                  <span :class="row.actor.kind === 'service' ? 's-audit-log__service' : undefined">{{ row.actor.name }}</span>
                </span>
              </template>
              <template #cell-action="{ row }">
                <RBadge size="sm">{{ row.action }}</RBadge>
              </template>
              <template #cell-resource="{ row }">
                <span class="s-audit-log__path" :title="row.resource">{{ row.resource }}</span>
              </template>
              <template #cell-ip="{ row }">
                <span class="s-audit-log__ip">{{ row.ip }}</span>
              </template>
              <template #cell-result="{ row }">
                <RStatus :tone="RESULT_TONE[row.result as Result]" :label="RESULT_LABEL[row.result as Result]" size="sm" />
              </template>
              <template #empty>
                <REmpty size="sm" title="No events match these filters" body="Widen the time range or remove a filter.">
                  <template #actions>
                    <RButton variant="outline" size="sm" @click="clearAll">Clear filters</RButton>
                  </template>
                </REmpty>
              </template>
            </RTable>
            <div class="s-audit-log__footer">
              <span class="s-audit-log__count">
                {{ formatNumber(shownFrom) }}–{{ formatNumber(shownTo) }} of {{ formatNumber(sorted.length) }}
              </span>
              <RPagination v-model="page" :page-count="pageCount" size="sm" label="Event pages" />
            </div>
          </div>
        </RCard>

        <RCard class="s-audit-log__actors" index="03" eyebrow="Most active" meta="Top 6" padding="sm">
          <RBarList v-if="topActors.length" :items="topActors" :bar-height="8" label="Actors with the most events in the current slice" />
          <p v-else class="s-audit-log__none">No events in this slice.</p>
        </RCard>

        <RCard class="s-audit-log__integrity" index="04" eyebrow="Integrity" padding="sm">
          <RStatus tone="success" label="Hash chain verified" />
          <RSpecList :items="integrity" dense />
        </RCard>
      </div>
    </div>

    <EventDrawer
      v-model:open="drawerOpen"
      :event="openEvent"
      :session="openSession"
      :can-newer="openIndex > 0"
      :can-older="openIndex >= 0 && openIndex < sorted.length - 1"
      @select="(id) => (openId = id)"
      @step="step"
      @filter-actor="filterActor"
      @filter-session="filterSession"
    />
  </SampleShell>
</template>

<style scoped>
.s-audit-log {
  display: grid;
  gap: 16px;
  min-width: 0;
}

/* Strip and header */
.s-audit-log__strip-context {
  color: var(--r-text-tertiary);
}

.s-audit-log__heading {
  display: grid;
  gap: 2px;
}

.s-audit-log__eyebrow {
  color: var(--r-text-tertiary);
}

.s-audit-log__title {
  font-size: var(--r-text-xl);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-tight);
  line-height: 1.2;
}

/* Filter row */
.s-audit-log__filters {
  min-width: 0;
  border: 1px solid var(--r-border);
  background: var(--r-bg-surface);
}

.s-audit-log__filter-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 12px;
}

.s-audit-log__search {
  flex: 1 1 320px;
  min-width: 0;
}

.s-audit-log__select {
  flex: 0 1 200px;
  min-width: 168px;
}

.s-audit-log__range {
  flex: 0 0 216px;
}

.s-audit-log__chips {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px 24px;
  min-height: 44px;
  padding: 8px 12px;
  border-top: 1px solid var(--r-border-subtle);
}

.s-audit-log__chip-group {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 8px;
  min-width: 0;
}

.s-audit-log__chip-label {
  margin-right: 4px;
}

.s-audit-log__none {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-sm);
}

/* Body: facets left, the log right, integrity under the facets */
.s-audit-log__body {
  display: grid;
  grid-template-areas:
    'facets log'
    'actors log'
    'integrity log';
  grid-template-columns: 248px minmax(0, 1fr);
  grid-template-rows: auto auto 1fr;
  gap: 16px;
  align-items: start;
}

.s-audit-log__facets {
  grid-area: facets;
}

.s-audit-log__log {
  grid-area: log;
}

.s-audit-log__actors {
  grid-area: actors;
}

.s-audit-log__integrity {
  grid-area: integrity;
}

.s-audit-log__facet-groups {
  display: grid;
  gap: 16px;
}

.s-audit-log__unit {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.s-audit-log__histogram {
  padding: 0 16px;
}

.s-audit-log__table {
  min-width: 0;
  border-top: 1px solid var(--r-border);
}

/* Table cells */
.s-audit-log__stamp {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  padding: 0;
  border: 0;
  background: none;
  color: var(--r-text);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0;
  cursor: pointer;
}

.s-audit-log__stamp:hover {
  color: var(--r-brand-text);
}

.s-audit-log__date,
.s-audit-log__zone {
  color: var(--r-text-tertiary);
}

.s-audit-log__actor {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.s-audit-log__service {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
}

.s-audit-log__path {
  display: block;
  max-width: 380px;
  overflow: hidden;
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
  text-overflow: ellipsis;
}

.s-audit-log__ip {
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
  font-variant-numeric: tabular-nums;
}

.s-audit-log__footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px 16px;
  padding: 10px 16px;
  border-top: 1px solid var(--r-border);
}

.s-audit-log__count {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
  font-variant-numeric: tabular-nums;
}

@media (min-width: 640px) {
  .s-audit-log__histogram {
    padding: 0 20px;
  }
}

@media (max-width: 1100px) {
  .s-audit-log__body {
    grid-template-areas:
      'facets facets'
      'log log'
      'actors integrity';
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-template-rows: auto;
    align-items: stretch;
  }

  .s-audit-log__facets,
  .s-audit-log__log {
    align-self: start;
  }

  .s-audit-log__facet-groups {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    align-items: start;
  }
}

@media (max-width: 560px) {
  .s-audit-log__strip-context {
    display: none;
  }
}

@media (max-width: 720px) {
  .s-audit-log__body {
    grid-template-areas:
      'facets'
      'log'
      'actors'
      'integrity';
    grid-template-columns: minmax(0, 1fr);
  }

  /* Two columns on phones: results and sources on the left, resource types on the right. */
  .s-audit-log__facet-groups {
    grid-template-areas:
      'result type'
      'source type';
    grid-template-columns: repeat(2, minmax(0, 1fr));
    column-gap: 20px;
  }

  .s-audit-log__facet-result {
    grid-area: result;
  }

  .s-audit-log__facet-type {
    grid-area: type;
  }

  .s-audit-log__facet-source {
    grid-area: source;
  }

  .s-audit-log__select {
    flex: 1 1 100%;
  }

  .s-audit-log__range {
    flex: 1 1 100%;
  }

  .s-audit-log__strip-hide {
    display: none;
  }
}
</style>
