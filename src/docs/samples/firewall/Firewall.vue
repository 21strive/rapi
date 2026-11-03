<script setup lang="ts">
/**
 * Sample 12 · Edge firewall. The custom rules of Selaras Bank's zone with their matches over the
 * last 24 hours, blocked requests over time, the top sources of blocked traffic and a rule
 * editor that previews an expression against the same traffic as you type.
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { Download, Plus, Search } from 'lucide-vue-next'
import {
  RBadge,
  RBarList,
  RButton,
  RCard,
  RInput,
  RLineChart,
  RMeter,
  RReadout,
  RSegmented,
  RSparkline,
  RStat,
  RStatus,
  RSwitch,
  RTable,
  RTabs,
  formatCompact,
  formatNumber,
  useToast,
  type TableColumn,
  type TableSort,
} from '@/design-system'
import SampleShell from '../_kit/SampleShell.vue'
import RuleDialog, { type RuleDraft } from './parts/RuleDialog.vue'
import type { RuleAction } from './engine'
import {
  ACTIONS,
  BLOCKED_BY_RULE,
  BLOCK_ALERT_PER_HOUR,
  CURRENT_USER,
  HOURLY,
  HOURS,
  NEW_RULE_EXAMPLE,
  NOW_LABEL,
  NOW_RATE,
  PEAK,
  RULES,
  SIX_HOURS,
  TOP_SOURCES,
  TOTALS,
  type FirewallRule,
  type RulePreview,
} from './data'

const toast = useToast()

/* ── Rules ──────────────────────────────────────────────────────────────────────── */

const rules = ref<FirewallRule[]>(RULES.map((rule) => ({ ...rule, hourly: [...rule.hourly] })))
const query = ref('')
const sort = ref<TableSort | null>(null)

const pad = (n: number) => String(n).padStart(2, '0')

const rows = computed(() => {
  const q = query.value.trim().toLowerCase()
  return rules.value
    .map((rule, i) => ({ ...rule, priority: i + 1 }))
    .filter((rule) =>
      !q ? true : [rule.name, rule.expression, rule.scope, rule.author, ACTIONS[rule.action].label].some((t) => t.toLowerCase().includes(q)),
    )
})

const columns: TableColumn[] = [
  { key: 'priority', label: 'No.', width: '64px', sortable: true },
  { key: 'name', label: 'Rule' },
  { key: 'scope', label: 'Scope' },
  { key: 'expression', label: 'Expression' },
  { key: 'action', label: 'Action' },
  { key: 'matches', label: 'Matches · 24 h', align: 'right', sortable: true },
  { key: 'enabled', label: 'On', align: 'center', width: '64px' },
]

const active = computed(() => rules.value.filter((r) => r.enabled))
const countOf = (action: RuleAction) => active.value.filter((r) => r.action === action).length

function setEnabled(rule: FirewallRule, on: boolean) {
  const target = rules.value.find((r) => r.id === rule.id)
  if (!target) return
  target.enabled = on
  toast.show({
    title: on ? 'Rule switched on' : 'Rule switched off',
    body: `${target.name} ${on ? 'runs again' : 'stops matching'} at every edge location within 30 seconds.`,
    tone: on ? 'success' : 'neutral',
  })
}

/* ── Editor ─────────────────────────────────────────────────────────────────────── */

const editorOpen = ref(false)
const editing = ref<string | null>(null)
let added = 0

const editorInitial = computed<RuleDraft>(() => {
  const rule = rules.value.find((r) => r.id === editing.value)
  return rule ? { name: rule.name, expression: rule.expression, action: rule.action, scope: rule.scope } : { ...NEW_RULE_EXAMPLE }
})

const editorContext = computed(() => {
  const i = rules.value.findIndex((r) => r.id === editing.value)
  if (i < 0) return undefined
  const rule = rules.value[i]
  return `Rule ${pad(i + 1)} · ${rule.author} · ${rule.updated}`
})

function openNew() {
  editing.value = null
  editorOpen.value = true
}

function openEdit(rule: FirewallRule) {
  editing.value = rule.id
  editorOpen.value = true
}

function onSave(draft: RuleDraft, preview: RulePreview) {
  const existing = rules.value.find((r) => r.id === editing.value)
  if (existing) {
    Object.assign(existing, draft, { author: CURRENT_USER, updated: `Edited today, ${NOW_LABEL}` })
    toast.show({ title: 'Rule updated', body: `${draft.name} is live at the edge.`, tone: 'success' })
    return
  }
  added += 1
  rules.value.unshift({
    id: `r-new-${added}`,
    ...draft,
    enabled: true,
    author: CURRENT_USER,
    updated: `Added today, ${NOW_LABEL}`,
    matches: preview.total,
    hourly: preview.hourly,
    preview: true,
  })
  query.value = ''
  sort.value = null
  toast.show({
    title: 'Rule added',
    body: `${draft.name} runs first. Over the last 24 hours it would have matched ${formatNumber(preview.total)} requests.`,
    tone: 'success',
  })
}

/* ── Traffic chart ──────────────────────────────────────────────────────────────── */

type ChartSpan = '6h' | '24h'
const spanOptions = [
  { label: '6H', value: '6h' },
  { label: '24H', value: '24h' },
]
const span = ref<ChartSpan>('24h')

const chart = computed(() => {
  if (span.value === '6h') {
    // Five-minute buckets shown as an hourly rate, so the unit and the alert line stay the same.
    return {
      labels: SIX_HOURS.labels,
      blocked: SIX_HOURS.blocked.map((v) => v * 12),
      challenged: SIX_HOURS.challenged.map((v) => v * 12),
      unit: 'req/h',
      limit: BLOCK_ALERT_PER_HOUR,
      limitLabel: `Alert ${formatNumber(BLOCK_ALERT_PER_HOUR)} / h`,
      highlight: null,
      describe: 'every five minutes over the last six hours as an hourly rate',
    }
  }
  const peak = HOURLY.blocked.indexOf(Math.max(...HOURLY.blocked))
  return {
    labels: HOURS,
    blocked: HOURLY.blocked,
    challenged: HOURLY.challenged,
    unit: 'req/h',
    limit: BLOCK_ALERT_PER_HOUR,
    limitLabel: `Alert ${formatNumber(BLOCK_ALERT_PER_HOUR)} / h`,
    highlight: peak,
    describe: 'per hour over the last 24 hours',
  }
})

const chartNote = computed(() => {
  if (span.value === '6h') {
    const total = SIX_HOURS.blocked.reduce((a, b) => a + b, 0)
    return `${formatNumber(total)} blocked since 23:30 UTC. The sign-in wave tailed off after midnight; scanners and scrapers make up the rest.`
  }
  const peak = HOURLY.blocked.indexOf(Math.max(...HOURLY.blocked))
  const over = HOURLY.blocked.filter((v) => v > BLOCK_ALERT_PER_HOUR).length
  const stopper = pad(rules.value.findIndex((r) => r.id === 'r-02') + 1)
  return `${HOURS[peak]} UTC peak: ${formatNumber(HOURLY.blocked[peak])} blocked in one hour, credential stuffing on login.selaras.id stopped by rule ${stopper}. ${over} hours above the alert line.`
})

/* ── Top sources ────────────────────────────────────────────────────────────────── */

type SourceTab = 'countries' | 'asns' | 'ips'
const sourceTab = ref<SourceTab>('countries')
const sourceTabs = [
  { label: 'Countries', value: 'countries' },
  { label: 'ASNs', value: 'asns' },
  { label: 'IPs', value: 'ips' },
]
const sourceNoun: Record<SourceTab, string> = { countries: 'country', asns: 'network', ips: 'address' }
const sources = computed(() => TOP_SOURCES[sourceTab.value])

/* Emphasis: the rule that did most of the blocking in cobalt, the others in context grey. */
const byRule = computed(() => {
  const lead = BLOCKED_BY_RULE.reduce((a, b) => (b.value > a.value ? b : a))
  return BLOCKED_BY_RULE.map((r) => {
    const index = rules.value.findIndex((rule) => rule.id === r.id)
    return {
      ...r,
      no: index >= 0 ? pad(index + 1) : '—',
      color: r.id === lead.id ? 'var(--r-chart-1)' : 'var(--r-chart-context)',
      percent: `${formatNumber((r.value / TOTALS.blocked) * 100, { maximumFractionDigits: 1 })}%`,
    }
  })
})

/* ── KPIs ───────────────────────────────────────────────────────────────────────── */

const share = (n: number) => `${formatNumber((n / TOTALS.requests) * 100, { maximumFractionDigits: 2 })}%`
const requestsM = formatNumber(TOTALS.requests / 1e6, { minimumFractionDigits: 1, maximumFractionDigits: 1 })

/* Live: the current hour's rate, wandering a little each second like a real counter. */
const rps = ref(Math.round(NOW_RATE.requests))
const blockedPerSecond = ref(NOW_RATE.blocked)
let ticker: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  ticker = setInterval(() => {
    rps.value = Math.round(NOW_RATE.requests * (0.96 + Math.random() * 0.08))
    blockedPerSecond.value = NOW_RATE.blocked * (0.85 + Math.random() * 0.3)
  }, 1000)
})
onBeforeUnmount(() => clearInterval(ticker))

/* ── Export ─────────────────────────────────────────────────────────────────────── */

function exportRules() {
  const body = JSON.stringify(
    rules.value.map((r, i) => ({ priority: i + 1, name: r.name, scope: r.scope, action: r.action, enabled: r.enabled, expression: r.expression })),
    null,
    2,
  )
  const file = 'selaras.id-firewall-rules-2026-11-03.json'
  const link = document.createElement('a')
  link.href = URL.createObjectURL(new Blob([body], { type: 'application/json' }))
  link.download = file
  link.click()
  setTimeout(() => URL.revokeObjectURL(link.href), 1000)
  toast.show({ title: 'Rules exported', body: `${rules.value.length} rules saved as ${file}.` })
}
</script>

<template>
  <SampleShell product="Edge">
    <template #strip>
      <span class="s-firewall-strip"><span class="s-firewall-strip__org">Selaras Bank · </span>Zone selaras.id</span>
    </template>
    <template #meta>
      <RStatus tone="success" size="sm" label="Enforcing" />
      <span class="s-firewall-strip__time">WAF · 03 Nov 2026 · {{ NOW_LABEL }}</span>
    </template>
    <template #header>
      <div class="s-firewall-heading">
        <p class="r-eyebrow">Security · Web application firewall</p>
        <h1 class="s-firewall-title">Firewall rules</h1>
      </div>
    </template>
    <template #actions>
      <RButton variant="outline" @click="exportRules">
        <template #leading><Download /></template>
        Export rules
      </RButton>
      <RButton tone="brand" @click="openNew">
        <template #leading><Plus /></template>
        New rule
      </RButton>
    </template>

    <div class="s-firewall">
      <section class="s-firewall-kpis r-grid-ruled" aria-label="Last 24 hours">
        <div class="s-firewall-kpi">
          <RStat label="Requests · 24 h" :value="requestsM" suffix="M" size="md">
            <template #footer>
              <span class="s-firewall-kpi__note">Peak {{ formatCompact(PEAK.value) }}/h at {{ PEAK.label }}</span>
            </template>
          </RStat>
        </div>
        <div class="s-firewall-kpi">
          <RStat label="Blocked" :value="TOTALS.blocked" size="md">
            <template #footer>
              <span class="s-firewall-kpi__note">{{ share(TOTALS.blocked) }} of requests · {{ countOf('block') }} rules</span>
            </template>
          </RStat>
        </div>
        <div class="s-firewall-kpi">
          <RStat label="Challenged" :value="TOTALS.challenged" size="md">
            <template #footer>
              <span class="s-firewall-kpi__note">{{ share(TOTALS.challenged) }} of requests · {{ countOf('challenge') }} rules</span>
            </template>
          </RStat>
        </div>
        <div class="s-firewall-kpi">
          <RStat label="Logged" :value="TOTALS.logged" size="md">
            <template #footer>
              <span class="s-firewall-kpi__note">Passed on · {{ countOf('log') }} rules</span>
            </template>
          </RStat>
        </div>
        <div class="s-firewall-kpi">
          <RReadout
            label="Requests now"
            :value="rps"
            unit="RPS"
            font="pixel"
            ghost="8,888"
            :sub="`Blocked ${formatNumber(blockedPerSecond, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} / s`"
          >
            <template #meta><RStatus tone="signal" size="sm" pulse label="Live" /></template>
          </RReadout>
        </div>
        <div class="s-firewall-kpi">
          <RStat label="Rules on" :value="active.length" :suffix="` / ${rules.length}`" size="md">
            <template #footer>
              <RStatus
                :tone="active.length === rules.length ? 'success' : 'warning'"
                size="sm"
                :label="active.length === rules.length ? 'All enforcing' : `${rules.length - active.length} switched off`"
              />
            </template>
          </RStat>
        </div>
      </section>

      <div class="s-firewall-grid">
        <RCard
          class="s-firewall-traffic"
          index="01"
          eyebrow="Traffic · Blocked and challenged"
          title="Blocked requests"
          title-as="h2"
        >
          <template #actions>
            <RSegmented v-model="span" :options="spanOptions" size="sm" label="Time window" />
          </template>
          <RLineChart
            :labels="chart.labels"
            :series="[
              { name: 'Blocked', values: chart.blocked, color: 'var(--r-chart-1)' },
              { name: 'Challenged', values: chart.challenged, color: 'var(--r-chart-context)' },
            ]"
            area
            :now="chart.labels.length - 1"
            :highlight="chart.highlight"
            :references="[{ value: chart.limit, label: chart.limitLabel, kind: 'threshold' }]"
            :y-unit="chart.unit"
            :height="256"
            :format="(v: number) => formatNumber(v)"
            :label="`Blocked and challenged requests ${chart.describe}, against the alert threshold`"
          />
          <p class="s-firewall-note">{{ chartNote }}</p>
        </RCard>

        <RCard
          class="s-firewall-sources"
          index="02"
          eyebrow="Blocked · Last 24 h"
          title="Top sources"
          :meta="`${formatCompact(TOTALS.blocked)} blocked`"
          title-as="h2"
        >
          <RTabs v-model="sourceTab" :items="sourceTabs" size="sm" label="Group sources by" />
          <RBarList
            :items="sources"
            :format="(v: number) => formatNumber(v)"
            :bar-height="10"
            :label="`Blocked requests in the last 24 hours by source ${sourceNoun[sourceTab]}`"
          />
          <div class="s-firewall-byrule">
            <p class="r-label">Blocked by rule</p>
            <RMeter
              :segments="byRule.map((r) => ({ value: r.value, label: `Rule ${r.no} ${r.short}`, color: r.color }))"
              :height="8"
              :label="`Blocked requests by rule: ${byRule.map((r) => `rule ${r.no} ${r.short} ${r.percent}`).join(', ')}`"
            />
            <ul class="s-firewall-byrule__legend">
              <li v-for="r in byRule" :key="r.id">
                <span class="s-firewall-byrule__swatch" :style="{ background: r.color }" aria-hidden="true" />
                <span class="s-firewall-byrule__no">{{ r.no }}</span>
                <span class="s-firewall-byrule__name">{{ r.short }}</span>
                <span class="s-firewall-byrule__pct">{{ r.percent }}</span>
              </li>
            </ul>
          </div>
        </RCard>

        <RCard
          class="s-firewall-rules"
          index="03"
          eyebrow="Custom rules · Evaluated top to bottom"
          title="Rules"
          :meta="`${active.length} on · ${rules.length} total`"
          padding="none"
          title-as="h2"
        >
          <template #actions>
            <RInput v-model="query" size="sm" placeholder="Filter rules" aria-label="Filter rules" clearable class="s-firewall-search">
              <template #leading><Search /></template>
            </RInput>
          </template>
          <RTable
            v-model:sort="sort"
            :columns="columns"
            :rows="rows"
            row-key="id"
            caption="Custom firewall rules in evaluation order, with matches in the last 24 hours"
            :empty-text="`No rule matches “${query}”.`"
            class="s-firewall-table"
          >
            <template #cell-priority="{ row }">
              <span class="s-firewall-priority" :class="{ 'is-off': !row.enabled }">{{ pad(row.priority) }}</span>
            </template>
            <template #cell-name="{ row }">
              <div class="s-firewall-rule" :class="{ 'is-off': !row.enabled }">
                <button type="button" class="s-firewall-rule__name" @click="openEdit(row as FirewallRule)">
                  {{ row.name }}
                </button>
                <span class="s-firewall-rule__meta">
                  <RBadge v-if="row.preview" tone="brand" size="sm">New</RBadge>
                  {{ row.author }} · {{ row.updated }}
                </span>
              </div>
            </template>
            <template #cell-scope="{ row }">
              <span class="s-firewall-scope" :class="{ 'is-off': !row.enabled }">{{ row.scope === 'all' ? 'All hostnames' : row.scope }}</span>
            </template>
            <template #cell-expression="{ row }">
              <code class="s-firewall-expr" :class="{ 'is-off': !row.enabled }" :title="row.expression">{{ row.expression }}</code>
            </template>
            <template #cell-action="{ row }">
              <RBadge :tone="ACTIONS[row.action as RuleAction].tone" :variant="row.enabled ? 'soft' : 'outline'" dot>
                {{ ACTIONS[row.action as RuleAction].label }}
              </RBadge>
            </template>
            <template #cell-matches="{ row }">
              <span class="s-firewall-matches" :class="{ 'is-off': !row.enabled }">
                <span class="s-firewall-matches__value">{{ formatNumber(row.matches) }}</span>
                <RSparkline
                  :values="row.hourly"
                  :width="88"
                  :height="20"
                  :end-dot="false"
                  :color="row.enabled ? 'var(--r-chart-1)' : 'var(--r-chart-context)'"
                  :label="`${row.name}: matches per hour over the last 24 hours`"
                />
              </span>
            </template>
            <template #cell-enabled="{ row }">
              <RSwitch
                :model-value="row.enabled"
                size="sm"
                :aria-label="`Enable ${row.name}`"
                class="s-firewall-switch"
                @update:model-value="(on: boolean) => setEnabled(row as FirewallRule, on)"
              />
            </template>
          </RTable>
          <template #footer>
            <p class="s-firewall-note">
              The first Block, Challenge or Allow that matches ends the evaluation. Log rules record the request and let it
              carry on. Select a rule to edit it.
            </p>
          </template>
        </RCard>
      </div>
    </div>

    <RuleDialog
      v-model:open="editorOpen"
      :mode="editing ? 'edit' : 'new'"
      :initial="editorInitial"
      :context="editorContext"
      @save="onSave"
    />
  </SampleShell>
</template>

<style scoped>
.s-firewall {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.s-firewall-strip__time {
  font-variant-numeric: tabular-nums;
}

.s-firewall-heading {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.s-firewall-heading .r-eyebrow {
  color: var(--r-text-tertiary);
}

.s-firewall-title {
  font-size: var(--r-text-xl);
  font-weight: var(--r-weight-semibold);
  line-height: 1.2;
  letter-spacing: var(--r-tracking-tight);
}

/* KPI strip: five ruled cells. */
.s-firewall-kpis {
  grid-template-columns: repeat(6, minmax(0, 1fr));
}

.s-firewall-kpi {
  padding: 14px 16px 16px;
}

.s-firewall-kpi__note {
  overflow: hidden;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.s-firewall-grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 16px;
}
.s-firewall-grid > * {
  min-width: 0;
}

.s-firewall-traffic {
  grid-column: span 8;
}
.s-firewall-sources {
  grid-column: span 4;
}
.s-firewall-rules {
  grid-column: 1 / -1;
}

.s-firewall-note {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
  line-height: 1.5;
}
.s-firewall-traffic .s-firewall-note {
  margin-top: auto;
}
.s-firewall-byrule {
  margin-top: auto;
}

.s-firewall-search {
  width: 220px;
}

/* Blocked by rule: a share bar with a two-column key. */
.s-firewall-byrule {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid var(--r-border-subtle);
}

.s-firewall-byrule__legend {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 4px 16px;
}

.s-firewall-byrule__legend li {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  font-size: var(--r-text-xs);
}

.s-firewall-byrule__swatch {
  flex: none;
  width: 8px;
  height: 8px;
}

.s-firewall-byrule__no {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-variant-numeric: tabular-nums;
}

.s-firewall-byrule__name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  color: var(--r-text-secondary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.s-firewall-byrule__pct {
  font-family: var(--r-font-mono);
  font-variant-numeric: tabular-nums;
}

/* Rules table */
.s-firewall-table {
  border-top: 1px solid var(--r-border);
}

.s-firewall-priority {
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
  font-variant-numeric: tabular-nums;
}

.s-firewall-rule {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1px;
  padding: 6px 0;
}

.s-firewall-rule__name {
  padding: 0;
  border: 0;
  background: none;
  color: var(--r-text);
  font: inherit;
  font-weight: var(--r-weight-medium);
  text-align: left;
  cursor: pointer;
}
.s-firewall-rule__name:hover {
  color: var(--r-brand-text);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.s-firewall-rule__meta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

.s-firewall-scope {
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
}

.s-firewall-expr {
  display: block;
  max-width: 360px;
  overflow: hidden;
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.s-firewall-matches {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
}

.s-firewall-matches__value {
  min-width: 7ch;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.s-firewall-switch {
  justify-content: center;
}

/* A switched-off rule keeps its row but recedes. */
.is-off,
.is-off .s-firewall-rule__name {
  color: var(--r-text-tertiary);
}

@media (max-width: 1180px) {
  .s-firewall-kpis {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .s-firewall-traffic,
  .s-firewall-sources {
    grid-column: 1 / -1;
  }
}

@media (max-width: 720px) {
  .s-firewall-strip__time {
    display: none;
  }
  .s-firewall-kpis {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .s-firewall-search {
    width: 100%;
  }
  .s-firewall-expr {
    max-width: 240px;
  }
}

@media (max-width: 480px) {
  .s-firewall-strip__org {
    display: none;
  }
  .s-firewall-byrule__legend {
    grid-template-columns: minmax(0, 1fr);
  }
  .s-firewall-kpi {
    padding: 12px;
  }
}
</style>
