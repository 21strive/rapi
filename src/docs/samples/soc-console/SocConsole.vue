<script setup lang="ts">
/**
 * Sample 07 · Security operations. The watch floor of an invented neo-bank: open alerts by
 * severity, the event rate against its threshold, the triage queue with an alert drawer, the
 * log sources as live lamps, detections by tactic and the load on each analyst.
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { Search } from 'lucide-vue-next'
import {
  RAlert,
  RAvatar,
  RAvatarGroup,
  RBadge,
  RBarList,
  RButton,
  RCard,
  RCodeBlock,
  RDialog,
  REmpty,
  RHeatmap,
  RInput,
  RKbd,
  RLineChart,
  RReadout,
  RRule,
  RSegmented,
  RSelect,
  RSpecList,
  RStatus,
  RTable,
  RTabs,
  RTimeline,
  formatNumber,
  useToast,
} from '@/design-system'
import type { SpecItem, StatusTone, TableColumn, TimelineItem } from '@/design-system'
import SampleShell from '../_kit/SampleShell.vue'
import {
  EPS_THRESHOLD,
  analysts,
  clockUtc,
  dateUtc,
  duration,
  eventRate,
  initialAlerts,
  me,
  ranges,
  rawEventOf,
  severities,
  severityMeta,
  shiftOf,
  sourceName,
  sourceStateMeta,
  sources,
  statusMeta,
  tacticName,
  tacticWeeks,
  tactics,
  timelineOf,
  type Alert,
  type RangeKey,
  type Severity,
} from './data'

/* ── Clock and live ingest ─────────────────────────────────────────────────────────── */
const opened = Date.now()
const now = ref(opened)
const liveEps = ref(sources.map((s) => s.eps))
let timer: number | undefined
let tick = 0

onMounted(() => {
  timer = window.setInterval(() => {
    now.value = Date.now()
    // The sensors report every two seconds; the total moves a little, the silent one stays at 0.
    if (++tick % 2 === 0) {
      liveEps.value = sources.map((s) =>
        s.state === 'silent' ? 0 : Math.max(1, Math.round(s.eps * (1 + (Math.random() - 0.5) * 0.05))),
      )
    }
  }, 1000)
  window.addEventListener('keydown', onSlash)
})
onBeforeUnmount(() => {
  window.clearInterval(timer)
  window.removeEventListener('keydown', onSlash)
})

const ingest = computed(() => liveEps.value.reduce((sum, v) => sum + v, 0))

/* Phones get week numbers without the W so the heatmap columns stay readable. */
const narrowQuery = window.matchMedia('(max-width: 560px)')
const narrow = ref(narrowQuery.matches)
const onNarrow = (event: MediaQueryListEvent) => (narrow.value = event.matches)
narrowQuery.addEventListener('change', onNarrow)
onBeforeUnmount(() => narrowQuery.removeEventListener('change', onNarrow))
const shift = computed(() => shiftOf(now.value))

/* ── Alerts ────────────────────────────────────────────────────────────────────────── */
const alerts = ref<Alert[]>(initialAlerts.map((a) => ({ ...a })))
const firedAt = (a: Alert) => opened - a.age * 1000
const ageOf = (a: Alert) => duration(now.value - firedAt(a))

const counts = computed(
  () => Object.fromEntries(severities.map((s) => [s, alerts.value.filter((a) => a.rule.severity === s).length])) as Record<Severity, number>,
)
const oldest = computed(() =>
  Object.fromEntries(
    severities.map((s) => {
      const ages = alerts.value.filter((a) => a.rule.severity === s).map((a) => a.age)
      return [s, ages.length ? duration(now.value - (opened - Math.max(...ages) * 1000)) : '—']
    }),
  ) as Record<Severity, string>,
)
const unassigned = computed(() => alerts.value.filter((a) => !a.assignee).length)

const severity = ref<'all' | Severity>('all')
const query = ref('')

const queue = computed(() => {
  const q = query.value.trim().toLowerCase()
  return alerts.value
    .filter((a) => severity.value === 'all' || a.rule.severity === severity.value)
    .filter(
      (a) => !q || [a.id, a.rule.name, a.rule.id, a.entity, a.assignee ?? 'unassigned'].some((v) => v.toLowerCase().includes(q)),
    )
    .sort((a, b) => severityMeta[b.rule.severity].rank - severityMeta[a.rule.severity].rank || b.age - a.age)
})

const tabItems = computed(() => [
  { label: 'All', value: 'all', count: alerts.value.length },
  ...severities.map((s) => ({ label: severityMeta[s].label, value: s, count: counts.value[s] })),
])

const columns: TableColumn[] = [
  { key: 'severity', label: 'Sev', width: '72px' },
  { key: 'alert', label: 'Alert' },
  { key: 'entity', label: 'Entity' },
  { key: 'age', label: 'Age', numeric: true, width: '92px' },
  { key: 'status', label: 'Status', width: '116px' },
  { key: 'assignee', label: 'Assignee', width: '132px' },
]

const firstName = (name: string) => name.split(' ')[0]

/* ── Search: "/" focuses it from anywhere ──────────────────────────────────────────── */
const search = ref<InstanceType<typeof RInput> | null>(null)
function onSlash(event: KeyboardEvent) {
  if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return
  const target = event.target as HTMLElement | null
  if (target?.closest('input, textarea, select, [contenteditable="true"]')) return
  event.preventDefault()
  search.value?.focus()
}

/* ── Alert drawer ──────────────────────────────────────────────────────────────────── */
const shown = ref<Alert | null>(null)
const drawer = ref(false)
const resolutions = [
  { label: 'False positive', value: 'false positive' },
  { label: 'Benign, expected activity', value: 'benign, expected activity' },
  { label: 'True positive, contained', value: 'true positive, contained' },
  { label: 'Duplicate', value: 'duplicate' },
]
const resolution = ref<string | number | null>('false positive')

function openAlert(alert: Alert) {
  shown.value = alert
  resolution.value = 'false positive'
  drawer.value = true
}

const selectedRows = computed(() => (drawer.value && shown.value ? [shown.value.id] : []))

const specs = computed<SpecItem[]>(() => {
  const a = shown.value
  if (!a) return []
  const sev = severityMeta[a.rule.severity]
  return [
    { label: 'Severity', value: sev.label, tone: sev.tone },
    { label: 'Status', value: statusMeta[a.status].label, tone: statusMeta[a.status].tone },
    { label: 'Entity', value: a.entity, mono: true, hint: a.rule.kind },
    { label: 'Source', value: sourceName(a.rule.source) },
    { label: 'Rule', value: a.rule.id, mono: true },
    { label: 'Tactic', value: tacticName(a.rule.tactic), hint: a.rule.tactic },
    { label: 'Fired', value: `${clockUtc(firedAt(a))} UTC`, mono: true, hint: `${ageOf(a)} ago` },
    { label: 'Assignee', value: a.assignee ?? 'Unassigned' },
  ]
})
/* What analysts did on this screen, appended to the alert's timeline as it happens. */
const history = ref<Record<string, TimelineItem[]>>({})
function record(a: Alert, title: string, body: string, tone: StatusTone) {
  const list = history.value[a.id] ?? (history.value[a.id] = [])
  list.push({ id: `live-${list.length}`, time: clockUtc(Date.now()), title, body, tone })
}
const timeline = computed(() =>
  shown.value ? [...timelineOf(shown.value, firedAt(shown.value)), ...(history.value[shown.value.id] ?? [])] : [],
)
const rawEvent = computed(() => (shown.value ? rawEventOf(shown.value, firedAt(shown.value)) : ''))

const toast = useToast()
let incidents = 147

function acknowledge(a: Alert) {
  a.status = 'ack'
  a.assignee = me
  record(a, 'Acknowledged', `${me} took the alert.`, 'brand')
  toast.show({ title: `Acknowledged ${a.id}`, body: `Assigned to you after ${ageOf(a)}.`, tone: 'brand' })
}

function escalate(a: Alert) {
  a.status = 'escalated'
  a.assignee = a.assignee ?? me
  const incident = `IR-2026-0${incidents++}`
  record(a, `Escalated to ${incident}`, `${me} paged the incident lead.`, 'danger')
  toast.show({ title: `Escalated to ${incident}`, body: 'Dewi Anggraini and the on-call incident lead were paged.', tone: 'warning' })
}

function closeAlert(a: Alert) {
  const index = alerts.value.findIndex((x) => x.id === a.id)
  if (index < 0) return
  alerts.value.splice(index, 1)
  drawer.value = false
  toast.show({
    title: `Closed ${a.id}`,
    body: `Resolved as ${resolution.value}.`,
    tone: 'success',
    action: { label: 'Undo', onClick: () => alerts.value.splice(index, 0, a) },
  })
}

/* ── Event rate ────────────────────────────────────────────────────────────────────── */
const range = ref<RangeKey>('1h')
const rangeOptions = ranges.map((r) => ({ label: r.label, value: r.value }))
const rate = computed(() => eventRate(range.value, opened, ingest.value))
const peak = computed(() => Math.max(...rate.value.values))
const rangeLabel = computed(() => ranges.find((r) => r.value === range.value)?.label ?? '')
const bucketLabel = computed(() => ({ '1h': '1-min buckets', '24h': '30-min buckets', '7d': '4-hour buckets' })[range.value])
const eps = (v: number) => `${formatNumber(v)} EPS`

/* ── Detections by tactic and analyst load ─────────────────────────────────────────── */
const heat = tacticWeeks(opened)

const workload = computed(() =>
  analysts.map((name) => {
    const mine = alerts.value.filter((a) => a.assignee === name)
    const top = mine.filter((a) => a.rule.severity === 'critical' || a.rule.severity === 'high').length
    return { label: name === me ? `${name} (you)` : name, values: [top, mine.length - top] }
  }),
)
const loadSeries = [
  { name: 'Critical and high', color: 'var(--r-chart-1)' },
  { name: 'Medium and low', color: 'var(--r-chart-context)' },
]

/* The silent core-audit source has its own alert in the queue; the health panel links to it. */
const silentAlert = computed(() => alerts.value.find((a) => a.rule.id === 'R-1013') ?? null)
const silentFor = computed(() => {
  const core = sources.find((s) => s.state === 'silent')!
  return `${Math.floor((now.value - (opened - core.lastEvent * 1000)) / 60000)} min`
})

const sourceRows = computed(() =>
  sources.map((s, i) => ({
    ...s,
    live: liveEps.value[i],
    last: s.state === 'nominal' ? `${s.lastEvent} s` : duration(now.value - (opened - s.lastEvent * 1000)),
  })),
)
</script>

<template>
  <SampleShell product="Watchfloor" padding="sm">
    <template #strip>
      <span class="s-soc-console-strip-org">Selaras Bank · SOC Jakarta</span>
    </template>
    <template #meta>
      <RStatus tone="signal" pulse size="sm" label="Live" />
      <span class="s-soc-console-strip-extra">Ingest {{ formatNumber(ingest) }} EPS</span>
      <span class="s-soc-console-clock">{{ clockUtc(now) }} UTC</span>
      <span class="s-soc-console-strip-extra">{{ dateUtc(now) }}</span>
    </template>

    <template #header>
      <div class="s-soc-console-title">
        <p class="r-eyebrow">SOC Jakarta · {{ shift.name }} · {{ shift.hours }}</p>
        <h1 class="r-h3">Security operations</h1>
      </div>
    </template>
    <template #actions>
      <RInput
        ref="search"
        v-model="query"
        class="s-soc-console-search"
        size="sm"
        placeholder="Search alerts, hosts, users"
        aria-label="Search the alert queue"
        clearable
      >
        <template #leading><Search aria-hidden="true" /></template>
        <template #trailing><RKbd :keys="['/']" size="sm" /></template>
      </RInput>
      <RAvatarGroup :names="analysts" :max="4" size="sm" :label="`${analysts.length} analysts on shift`" />
    </template>

    <div class="s-soc-console">
      <!-- KPIs: open alerts by severity (they filter the queue), then response times. -->
      <section class="s-soc-console-kpis r-grid-ruled" aria-label="Open alerts and response times">
        <button
          v-for="s in severities"
          :key="s"
          type="button"
          class="s-soc-console-kpi s-soc-console-kpi--button"
          :class="{ 'is-active': severity === s }"
          :aria-pressed="severity === s"
          @click="severity = severity === s ? 'all' : s"
        >
          <RReadout
            :label="`Open · ${severityMeta[s].label}`"
            :value="counts[s]"
            :tone="severityMeta[s].tone"
            :sub="`Oldest ${oldest[s]}`"
          />
        </button>
        <div class="s-soc-console-kpi">
          <RReadout label="MTTA · 7 days" value="04:12" unit="mm:ss" sub="Target 05:00 · prev 04:50" />
        </div>
        <div class="s-soc-console-kpi">
          <RReadout label="MTTR · 7 days" value="01:46" unit="h:mm" sub="Target 04:00 · prev 01:37" />
        </div>
      </section>

      <div class="s-soc-console-grid">
        <!-- 01 · Alert queue -->
        <RCard title-as="h2"
          class="s-soc-console-queue"
          padding="none"
          index="01"
          eyebrow="Triage queue"
          title="Open alerts"
          :meta="`${unassigned} unassigned`"
        >
          <div class="s-soc-console-tabs">
            <RTabs
              :model-value="severity"
              :items="tabItems"
              size="sm"
              label="Filter by severity"
              @update:model-value="(v) => (severity = v as 'all' | Severity)"
            />
          </div>
          <RTable
            :columns="columns"
            :rows="queue"
            :selected="selectedRows"
            density="compact"
            sticky-header
            caption="Open alerts, by severity and then age"
            @row-click="(row) => openAlert(row as Alert)"
          >
            <template #cell-severity="{ row }">
              <RBadge :tone="severityMeta[(row as Alert).rule.severity].tone" :variant="severityMeta[(row as Alert).rule.severity].badge" size="sm">
                {{ severityMeta[(row as Alert).rule.severity].short }}
              </RBadge>
            </template>
            <template #cell-alert="{ row }">
              <button type="button" class="s-soc-console-link" @click.stop="openAlert(row as Alert)">
                <span class="s-soc-console-link-id">{{ (row as Alert).id }}</span>
                <span class="s-soc-console-link-name">{{ (row as Alert).rule.name }}</span>
              </button>
            </template>
            <template #cell-entity="{ row }">
              <span class="s-soc-console-mono">{{ (row as Alert).entity }}</span>
            </template>
            <template #cell-age="{ row }">{{ ageOf(row as Alert) }}</template>
            <template #cell-status="{ row }">
              <RStatus :tone="statusMeta[(row as Alert).status].tone" :label="statusMeta[(row as Alert).status].label" size="sm" />
            </template>
            <template #cell-assignee="{ row }">
              <span v-if="(row as Alert).assignee" class="s-soc-console-assignee">
                <RAvatar :name="(row as Alert).assignee!" size="xs" decorative />
                <span>{{ firstName((row as Alert).assignee!) }}</span>
              </span>
              <span v-else class="s-soc-console-muted">Unassigned</span>
            </template>
            <template #empty>
              <REmpty size="sm" title="No alerts match" body="Clear the search or pick another severity." />
            </template>
          </RTable>
          <template #footer>
            <p class="s-soc-console-footnote">
              {{ formatNumber(queue.length) }} of {{ formatNumber(alerts.length) }} shown, by severity and then oldest first. Ages tick from when each rule fired.
            </p>
          </template>
        </RCard>

        <div class="s-soc-console-side">
          <!-- 02 · Event rate -->
          <RCard title-as="h2" index="02" eyebrow="Ingest" title="Event rate" class="s-soc-console-rate">
            <template #actions>
              <RSegmented
                :model-value="range"
                :options="rangeOptions"
                size="sm"
                label="Time range"
                @update:model-value="(v) => (range = v as RangeKey)"
              />
            </template>
            <div class="s-soc-console-rate-figures">
              <RReadout font="pixel" label="Ingest now" :value="ingest" unit="EPS" ghost size="lg" />
              <div class="s-soc-console-rate-side">
                <RReadout :label="`Peak · ${rangeLabel}`" :value="peak" unit="EPS" size="sm" :tone="peak > EPS_THRESHOLD ? 'warning' : undefined" />
                <RReadout label="Threshold" :value="EPS_THRESHOLD" unit="EPS" size="sm" />
              </div>
            </div>
            <RLineChart
              :labels="rate.labels"
              :series="[{ name: 'Peak EPS', values: rate.values }]"
              curve="step"
              :now="rate.labels.length - 1"
              :references="[{ value: EPS_THRESHOLD, label: 'Threshold 1,800', kind: 'threshold' }]"
              :format="eps"
              y-unit="EPS"
              end-labels
              :height="168"
              :label="`Peak events per second across all log sources, last ${rangeLabel}, ${bucketLabel}, against the 1,800 EPS threshold`"
            />
          </RCard>

          <!-- 03 · Analyst load -->
          <RCard title-as="h2" index="03" eyebrow="Analyst load" title="Open alerts per analyst" :meta="`${unassigned} unassigned`">
            <RBarList
              :items="workload"
              :series="loadSeries"
              legend
              :bar-height="10"
              label="Open alerts assigned to each analyst on shift, critical and high against medium and low"
            />
          </RCard>
        </div>

        <!-- 04 · Detections by tactic -->
        <RCard title-as="h2" class="s-soc-console-heat" index="04" eyebrow="Detections" title="Technique heatmap" :meta="`12 weeks · ${heat.cols[11]} to date`">
          <RHeatmap
            :rows="heat.rows"
            :cols="narrow ? heat.cols.map((c) => c.slice(1)) : heat.cols"
            :values="heat.values"
            :cell-height="18"
            label="Detections per tactic per ISO week over the last 12 weeks; the current week is partial"
          />
          <dl class="s-soc-console-key">
            <div v-for="t in tactics" :key="t.code">
              <dt>{{ t.code }}</dt>
              <dd>{{ t.name }}</dd>
            </div>
          </dl>
        </RCard>

        <!-- 05 · Log sources -->
        <RCard title-as="h2" class="s-soc-console-health" index="05" eyebrow="Log sources" title="Sensor health" meta="Last event">
          <ul class="s-soc-console-sources" role="list">
            <li v-for="s in sourceRows" :key="s.id" class="s-soc-console-source">
              <span class="s-soc-console-source-name">
                <span>{{ s.name }}</span>
                <span class="s-soc-console-muted">{{ s.detail }}</span>
              </span>
              <span class="s-soc-console-mono s-soc-console-source-eps">{{ formatNumber(s.live) }} EPS</span>
              <span class="s-soc-console-mono s-soc-console-source-last" :class="{ 'is-late': s.state !== 'nominal' }">{{ s.last }}</span>
              <RStatus
                class="s-soc-console-source-state"
                :tone="sourceStateMeta[s.state].tone"
                :label="sourceStateMeta[s.state].label"
                shape="square"
                size="sm"
              />
            </li>
          </ul>
          <RAlert v-if="silentAlert" tone="danger" title="Core banking audit is silent">
            No events from core-audit-01 for {{ silentFor }}. Payment approvals are not reaching the SIEM.
            <template #actions>
              <RButton size="sm" variant="outline" @click="openAlert(silentAlert)">Open {{ silentAlert.id }}</RButton>
            </template>
          </RAlert>
        </RCard>
      </div>
    </div>

    <!-- The alert drawer -->
    <RDialog
      v-model:open="drawer"
      side="right"
      size="lg"
      :eyebrow="shown ? `${shown.id} · ${severityMeta[shown.rule.severity].label}` : ''"
      :title="shown?.rule.name"
      :description="shown ? `Fired ${ageOf(shown)} ago by ${sourceName(shown.rule.source)}, rule ${shown.rule.id}.` : ''"
    >
      <div v-if="shown" class="s-soc-console-drawer">
        <RSpecList :items="specs" :columns="2" dense />
        <section class="s-soc-console-drawer-section">
          <RRule index="01" label="Related events" :meta="`${timeline.length} events · UTC`" />
          <RTimeline :items="timeline" dense />
        </section>
        <section class="s-soc-console-drawer-section">
          <RRule index="02" label="Raw event" meta="As stored by the SIEM" />
          <RCodeBlock :code="rawEvent" language="json" :title="`${shown.id}.json`" line-numbers max-height="300px" />
        </section>
      </div>
      <template #footer>
        <template v-if="shown">
          <RButton tone="signal" :disabled="shown.status !== 'new'" @click="acknowledge(shown)">Acknowledge</RButton>
          <RButton variant="outline" :disabled="shown.status === 'escalated'" @click="escalate(shown)">Escalate</RButton>
          <span class="s-soc-console-spacer" aria-hidden="true" />
          <RSelect v-model="resolution" :options="resolutions" size="sm" aria-label="Resolution" class="s-soc-console-resolution" />
          <RButton variant="outline" @click="closeAlert(shown)">Close alert</RButton>
        </template>
      </template>
    </RDialog>
  </SampleShell>
</template>

<style scoped>
.s-soc-console {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Strip */
.s-soc-console-strip-org {
  overflow: hidden;
  min-width: 0;
  color: var(--r-text-secondary);
  text-overflow: ellipsis;
}
.s-soc-console-clock {
  color: var(--r-text);
  font-variant-numeric: tabular-nums;
}

/* Header */
.s-soc-console-title {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.s-soc-console-title .r-eyebrow {
  color: var(--r-text-tertiary);
}
.s-soc-console-search {
  width: 280px;
}

/* KPI row */
.s-soc-console-kpis {
  grid-template-columns: repeat(6, minmax(0, 1fr));
}
.s-soc-console-kpi {
  position: relative;
  padding: 14px 16px 16px;
}
.s-soc-console-kpi--button {
  /* The ruled grid draws the right and bottom rules; only the browser's own edges go. */
  border-top: 0;
  border-left: 0;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: background-color var(--r-duration-fast) var(--r-ease-out);
}
.s-soc-console-kpi--button:hover {
  background: var(--r-bg-hover);
}
.s-soc-console-kpi--button:focus-visible {
  outline-offset: -2px;
}
.s-soc-console-kpi--button.is-active {
  background: var(--r-bg-selected);
}
.s-soc-console-kpi--button.is-active::before {
  content: '';
  position: absolute;
  inset: 0 0 auto;
  height: 2px;
  background: var(--r-brand);
}

/* Main grid */
.s-soc-console-grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 16px;
  align-items: start;
}
.s-soc-console-grid > * {
  min-width: 0;
}
.s-soc-console-queue {
  grid-column: span 8;
  align-self: stretch;
}
.s-soc-console-side {
  display: flex;
  grid-column: span 4;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}
.s-soc-console-heat {
  grid-column: span 8;
  align-self: stretch;
}
.s-soc-console-health {
  grid-column: span 4;
  align-self: stretch;
}

/* Queue */
.s-soc-console-tabs {
  padding: 0 20px;
  margin-bottom: -16px;
}
/* The queue fills whatever height the side column gives the row: size containment keeps the
   81 rows from making the row taller, and the table scrolls inside. */
.s-soc-console-queue :deep(.r-table) {
  flex: 1 1 0;
  min-height: 240px;
  border-top: 1px solid var(--r-border);
  contain: size;
}
.s-soc-console-link {
  display: inline-flex;
  align-items: baseline;
  gap: 10px;
  max-width: 360px;
  padding: 0;
  border: 0;
  background: none;
  color: var(--r-text);
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.s-soc-console-link:hover .s-soc-console-link-name {
  text-decoration: underline;
  text-underline-offset: 3px;
}
.s-soc-console-link-id {
  flex: none;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-variant-numeric: tabular-nums;
}
.s-soc-console-link-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.s-soc-console-mono {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
  font-variant-numeric: tabular-nums;
}
.s-soc-console-muted {
  color: var(--r-text-tertiary);
}
.s-soc-console-assignee {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.s-soc-console-footnote {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

/* Event rate */
.s-soc-console-rate-figures {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px 24px;
}
.s-soc-console-rate-side {
  display: flex;
  gap: 24px;
}

/* Sensor health */
.s-soc-console-sources {
  display: flex;
  flex-direction: column;
  margin: -4px 0 -6px;
}
.s-soc-console-source {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto 64px 92px;
  align-items: center;
  gap: 12px;
  min-height: 40px;
  padding: 6px 0;
  border-bottom: 1px solid var(--r-border-subtle);
}
.s-soc-console-source:last-child {
  border-bottom: 0;
}
.s-soc-console-source-name {
  display: flex;
  flex-direction: column;
  min-width: 0;
  font-size: var(--r-text-sm);
  line-height: 1.3;
}
.s-soc-console-source-name > span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.s-soc-console-source-name .s-soc-console-muted {
  font-size: var(--r-text-xs);
}
.s-soc-console-source-eps,
.s-soc-console-source-last {
  text-align: right;
}
.s-soc-console-source-last {
  color: var(--r-text-tertiary);
}
.s-soc-console-source-last.is-late {
  color: var(--r-text);
}

/* Heatmap key */
.s-soc-console-key {
  display: grid;
  margin-top: auto;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 6px 16px;
  padding-top: 12px;
  border-top: 1px solid var(--r-border-subtle);
}
.s-soc-console-key > div {
  display: flex;
  gap: 8px;
  min-width: 0;
  font-size: var(--r-text-xs);
}
.s-soc-console-key dt {
  flex: none;
  width: 48px;
  color: var(--r-text);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: 0.04em;
}
.s-soc-console-key dd {
  overflow: hidden;
  color: var(--r-text-tertiary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Drawer */
.s-soc-console-drawer {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.s-soc-console-drawer-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.s-soc-console-spacer {
  flex: 1;
}
.s-soc-console-resolution {
  width: 220px;
}

/* Narrower screens: the queue takes the full width, the side panels sit two up. */
@media (max-width: 1279px) {
  .s-soc-console-kpis {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .s-soc-console-queue,
  .s-soc-console-heat,
  .s-soc-console-health {
    grid-column: span 12;
  }
  .s-soc-console-queue :deep(.r-table) {
    flex: none;
    max-height: 420px;
    contain: none;
  }
  .s-soc-console-side {
    display: grid;
    grid-column: span 12;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-items: start;
  }
}

@media (max-width: 760px) {
  .s-soc-console-strip-extra {
    display: none;
  }
  .s-soc-console-search {
    width: 100%;
  }
  .s-soc-console-kpis {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .s-soc-console-side {
    grid-template-columns: minmax(0, 1fr);
  }
  .s-soc-console-key {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .s-soc-console-key dd {
    white-space: normal;
  }
  .s-soc-console-resolution {
    width: 100%;
  }
}

@media (max-width: 560px) {
  .s-soc-console-strip-org {
    display: none;
  }
  /* Sensor rows: the name on its own line, the figures and the state under it. */
  .s-soc-console-source {
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: 4px 12px;
  }
  .s-soc-console-source-name {
    grid-column: 1 / -1;
  }
  .s-soc-console-source-eps {
    text-align: left;
  }
}
</style>
