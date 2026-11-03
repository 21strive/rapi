<script setup lang="ts">
import { computed, ref } from 'vue'
import { Download } from 'lucide-vue-next'
import {
  RAlert,
  RBadge,
  RBarList,
  RBulletChart,
  RButton,
  RCard,
  RHeatmap,
  RScatterChart,
  RSegmented,
  RStat,
  RStatus,
  RTable,
  useToast,
  type TableColumn,
  type TableSort,
} from '@/design-system'
import SampleShell from '../_kit/SampleShell.vue'
import ObligorDrawer from './parts/ObligorDrawer.vue'
import {
  type Obligor,
  type SegmentFilter,
  bookOf,
  capital,
  el,
  isWatch,
  migration,
  migrationCap,
  nameLimit,
  num,
  obligors,
  ratingOf,
  ratingsFrom,
  ratingsTo,
  sectorNearest,
  sectorRows,
  segmentOptions,
  topNames,
  watchTrigger,
} from './data'

const { show } = useToast()

const segment = ref<SegmentFilter>('All')
const visible = computed(() => (segment.value === 'All' ? obligors : obligors.filter((o) => o.segment === segment.value)))
const book = computed(() => bookOf(segment.value))
const limit = computed(() => nameLimit[segment.value])

/* ── Scatter: emphasis on the watchlist, outliers named ─────────────────────────────────── */
const short = (name: string) => name.replace(/^PT /, '').replace(/ Tbk$/, '').replace(/ · RTL-\d+$/, '')
/** Name the breach and the three watchlist names with the largest expected loss. */
const labelled = computed(() => {
  const ranked = visible.value
    .filter((o) => isWatch(o) && o.id !== breach.id)
    .sort((a, b) => el(b) - el(a))
    .slice(0, 3)
    .map((o) => o.id)
  return new Set([...ranked, breach.id])
})
const toPoint = (o: Obligor) => ({
  x: o.pd,
  y: o.ead,
  id: o.id,
  label: labelled.value.has(o.id) ? (o.segment === 'Retail' ? o.id : short(o.name)) : undefined,
})
const series = computed(() => [
  { name: 'Performing', color: 'var(--r-chart-context)', points: visible.value.filter((o) => !isWatch(o)).map(toPoint) },
  { name: 'Watchlist', color: 'var(--r-chart-1)', points: visible.value.filter(isWatch).map(toPoint) },
])

/* ── Watchlist table ────────────────────────────────────────────────────────────────────── */
const watch = computed(() => visible.value.filter(isWatch).map((o) => ({ ...o, rating: ratingOf(o.pd), el: el(o) })))
const sort = ref<TableSort | null>({ key: 'el', direction: 'desc' })
const columns: TableColumn[] = [
  { key: 'name', label: 'Obligor' },
  { key: 'segment', label: 'Segment' },
  { key: 'rating', label: 'Rating' },
  { key: 'pd', label: 'PD %', numeric: true, sortable: true },
  { key: 'ead', label: 'EAD bn', numeric: true, sortable: true },
  { key: 'el', label: 'EL bn', numeric: true, sortable: true },
  { key: 'dpd', label: 'DPD', numeric: true, sortable: true },
  { key: 'reason', label: 'Reason' },
]

/* ── Breach ─────────────────────────────────────────────────────────────────────────────── */
const breach = obligors.find((o) => o.ead > nameLimit[o.segment].value) as Obligor
const remediation = ref<string | null>(null)

function startRemediation() {
  remediation.value = 'RMD-2611-004'
  show({
    title: 'Remediation opened',
    body: `RMD-2611-004 for ${breach.name}: reduce exposure by IDR ${num(breach.ead - nameLimit.Corporate.value, 0)} bn by 10 Nov 2026. Owner ${breach.owner}.`,
    tone: 'success',
  })
}

/* ── Drawer ─────────────────────────────────────────────────────────────────────────────── */
const drawerOpen = ref(false)
const current = ref<Obligor | null>(null)
function openObligor(o: Obligor) {
  current.value = obligors.find((x) => x.id === o.id) ?? null
  drawerOpen.value = true
}
function review(o: Obligor) {
  drawerOpen.value = false
  show({ title: 'Review scheduled', body: `${o.name} · 10 Nov 2026 09:00 WIB with ${o.owner} and the credit committee.` })
}

function exportRun() {
  show({ title: 'Export ready', body: `credit-risk-2026-10-31-${segment.value.toLowerCase()}.xlsx · ${visible.value.length} obligors` })
}

const heatFormat = (v: number) => (v === migrationCap ? `≥${migrationCap}%` : `${num(v)}%`)
</script>

<template>
  <SampleShell product="Credit risk">
    <template #strip>
      <span class="s-risk-strip-ctx">/ Portfolio · month-end run</span>
    </template>
    <template #meta>
      <span class="s-risk-hide-sm">As of 31 Oct 2026 · run 2 Nov 06:40 WIB</span>
      <RStatus tone="danger" label="1 limit breach" size="sm" />
    </template>

    <template #header>
      <div class="s-risk-heading">
        <p class="r-eyebrow s-risk-heading__eyebrow">Bank Samudra Niaga · Enterprise risk</p>
        <h1 class="s-risk-heading__title">Credit risk</h1>
      </div>
    </template>
    <template #actions>
      <RSegmented v-model="segment" :options="segmentOptions" size="sm" label="Segment" />
      <RButton variant="outline" size="sm" @click="exportRun">
        <template #leading><Download /></template>
        Export
      </RButton>
    </template>

    <div class="s-risk">
      <RAlert
        :tone="remediation ? 'warning' : 'danger'"
        :title="remediation ? `Remediation ${remediation} open for ${breach.name}` : `${breach.name} is over the legal lending limit`"
      >
        <template v-if="remediation">Exposure must come down by IDR {{ num(breach.ead - nameLimit.Corporate.value, 0) }} bn by 10 Nov 2026. Owner {{ breach.owner }}.</template>
        <template v-else>
          Exposure IDR {{ num(breach.ead, 0) }} bn against a limit of IDR {{ num(nameLimit.Corporate.value, 0) }} bn,
          {{ Math.round((breach.ead / nameLimit.Corporate.value) * 100) }}% since 29 Oct after a IDR 140 bn drawdown on its working-capital line.
        </template>
        <template #actions>
          <RButton size="sm" variant="outline" @click="openObligor(breach)">Open obligor</RButton>
          <RButton v-if="!remediation" size="sm" @click="startRemediation">Start remediation</RButton>
        </template>
      </RAlert>

      <section class="s-risk-kpis r-grid-ruled" :aria-label="`Portfolio figures, ${segment}`">
        <div class="s-risk-kpi">
          <RStat :label="`Exposure at default · ${segment}`" :value="book.ead" :decimals="1" unit="IDR tn" size="md" />
        </div>
        <div class="s-risk-kpi">
          <RStat label="Expected loss" :value="Math.round(book.elBps)" unit="bps" size="md">
            <template #footer>
              <span class="s-risk-note">IDR {{ num((book.ead * 1000 * book.elBps) / 10000, 0) }} bn a year</span>
            </template>
          </RStat>
        </div>
        <div class="s-risk-kpi">
          <RStat label="Gross NPL" :value="Math.round(book.npl * 10) / 10" :decimals="1" suffix="%" size="md">
            <template #footer>
              <span class="s-risk-note">{{ book.nplChange >= 0 ? '+' : '−' }}{{ num(Math.abs(book.nplChange)) }} pp on Q2</span>
            </template>
          </RStat>
        </div>
        <div class="s-risk-kpi">
          <RStat label="Reserve coverage" :value="Math.round(book.coverage)" suffix="%" size="md">
            <template #footer><span class="s-risk-note">Loan-loss reserves over NPL</span></template>
          </RStat>
        </div>
        <div class="s-risk-kpi">
          <RStat label="Watchlist" :value="watch.length" size="md">
            <template #footer>
              <span class="s-risk-note">PD ≥ {{ watchTrigger }}% or over limit · IDR {{ num(watch.reduce((s, o) => s + o.ead, 0), 0) }} bn</span>
            </template>
          </RStat>
        </div>
      </section>

      <div class="s-risk-grid">
        <RCard
          :eyebrow="`Exposure against PD · ${segment}`"
          title="Where the risk sits"
          :subtitle="`${visible.length} largest names. Watchlist in cobalt; dashed lines mark the watch trigger and the single-name limit.`"
          marks
          class="s-risk-scatter"
        >
          <template #actions><span class="s-risk-unit">IDR bn · PD %</span></template>
          <RScatterChart
            :series="series"
            x-label="PD %"
            y-label="EAD IDR bn"
            :x-references="[{ value: watchTrigger, label: 'Watch 5%', kind: 'threshold' }]"
            :y-references="[{ value: limit.value, label: limit.label, kind: 'threshold' }]"
            label-points
            :height="320"
            :format-x="(v) => `${num(v)}%`"
            :format-y="(v) => num(v, v < 100 ? 1 : 0)"
            :label="`Exposure at default in IDR billions against one-year probability of default for the ${segment === 'All' ? '' : segment + ' '}obligors, with the watchlist highlighted`"
          />
        </RCard>

        <RCard eyebrow="Rating migration · 12 months" title="Where ratings went" subtitle="Rows: rating a year ago. Columns: rating now. All segments.">
          <template #actions><span class="s-risk-unit">% of names</span></template>
          <RHeatmap
            :rows="ratingsFrom"
            :cols="ratingsTo"
            :values="migration"
            :min="0"
            :max="migrationCap"
            :steps="6"
            :cell-height="30"
            :format="heatFormat"
            label="Rating migration over twelve months, percent of obligors moving from each rating to each rating or default"
          />
          <p class="s-risk-foot">
            <span class="r-label">Scale</span>
            Capped at {{ migrationCap }}% so moves off the diagonal show. Stayed put: {{ migration.map((r, i) => r[i]).map((v) => num(v)).join(' · ') }}.
          </p>
        </RCard>


        <RCard
          :eyebrow="`Watchlist · ${segment}`"
          :title="`${watch.length} names to watch`"
          subtitle="Sorted by expected loss. Select a row for the obligor."
          padding="none"
          class="s-risk-watch"
        >
          <RTable
            v-model:sort="sort"
            :columns="columns"
            :rows="watch"
            density="compact"
            :caption="`Watchlist for ${segment}`"
            @row-click="(row) => openObligor(row as Obligor)"
          >
            <template #cell-name="{ row }">
              <span class="s-risk-name">
                <span class="s-risk-name__main">{{ row.segment === 'Retail' ? row.name.split(' · ')[0] : row.name }}</span>
                <span class="s-risk-name__id">{{ row.id }}</span>
              </span>
            </template>
            <template #cell-segment="{ row }"><span class="s-risk-quiet">{{ row.segment }}</span></template>
            <template #cell-rating="{ row }"><RBadge size="sm" variant="outline">{{ row.rating }}</RBadge></template>
            <template #cell-pd="{ row }">{{ num(row.pd) }}</template>
            <template #cell-ead="{ row }">{{ num(row.ead, row.ead < 100 ? 1 : 0) }}</template>
            <template #cell-el="{ row }">{{ num(row.el, 2) }}</template>
            <template #cell-dpd="{ row }">{{ row.dpd || '—' }}</template>
            <template #cell-reason="{ row }"><span class="s-risk-reason">{{ row.reason }}</span></template>
          </RTable>
        </RCard>

        <RCard
          eyebrow="Concentration · all segments"
          title="Sector limits"
          :subtitle="`${sectorNearest.sector} at ${Math.round((sectorNearest.share / sectorNearest.limit) * 100)}% of its limit`"
        >
          <template #actions><span class="s-risk-unit">% of book</span></template>
          <RBulletChart
            :rows="sectorRows"
            :format="(v) => (Number.isInteger(v) ? String(v) : v.toFixed(1))"
            label="Share of the loan book by sector against each sector limit, in percent"
          />
          <div class="s-risk-names">
            <p class="r-eyebrow s-risk-names__title">Largest names · % of tier 1 capital</p>
            <RBarList
              :items="topNames.map((n) => ({ label: n.label, values: n.value }))"
              :max="30"
              :format="(v) => `${num(v)}%`"
              :bar-height="8"
              label="The six largest single-name exposures as a percent of tier 1 capital; the legal lending limit is 25 percent"
            />
            <p class="s-risk-foot">
              <span class="r-label">Limit</span>
              25% of IDR {{ num(capital, 0) }} bn tier 1 capital. Selat Baja Utama stands at {{ num(topNames[0].value) }}%.
            </p>
          </div>
        </RCard>
      </div>
    </div>

    <ObligorDrawer v-model:open="drawerOpen" :obligor="current" @review="review" />
  </SampleShell>
</template>

<style scoped>
.s-risk {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.s-risk-strip-ctx {
  color: var(--r-text-tertiary);
}

.s-risk-heading {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.s-risk-heading__eyebrow {
  color: var(--r-text-tertiary);
}
.s-risk-heading__title {
  font-size: var(--r-text-xl);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-tight);
  line-height: 1.2;
}

.s-risk-kpis {
  grid-template-columns: repeat(5, minmax(0, 1fr));
}
.s-risk-kpi {
  padding: 14px 20px;
}
.s-risk-note {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

.s-risk-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}
.s-risk-grid > :nth-child(-n + 2) {
  align-self: stretch;
}

.s-risk-names {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 14px;
  border-top: 1px solid var(--r-border-subtle);
}
.s-risk-names__title {
  color: var(--r-text-tertiary);
}

.s-risk-foot {
  margin-top: auto;
  padding-top: 10px;
  border-top: 1px solid var(--r-border-subtle);
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  line-height: 1.5;
}
.s-risk-foot .r-label {
  margin-right: 6px;
}


.s-risk-name {
  display: flex;
  flex-direction: column;
  line-height: 1.25;
}
.s-risk-name__main {
  font-weight: var(--r-weight-medium);
}
.s-risk-name__id {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
}
.s-risk-quiet {
  color: var(--r-text-tertiary);
}
.s-risk-reason {
  display: block;
  min-width: 140px;
  max-width: 168px;
  color: var(--r-text-secondary);
  line-height: 1.3;
  white-space: normal;
}
.s-risk-watch :deep(.r-table td) {
  height: 44px;
}

@media (max-width: 1240px) {
  .s-risk-kpis {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 1100px) {
  .s-risk-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 640px) {
  .s-risk-hide-sm,
  .s-risk-strip-ctx {
    display: none;
  }
  .s-risk-kpis {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

/* Units keep their own case (IDR bn, not IDR BN), so they sit beside the card head, not in its meta. */
.s-risk-unit {
  display: inline-block;
  padding-top: 4px;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-weight: var(--r-weight-medium);
  letter-spacing: 0.02em;
  white-space: nowrap;
}
</style>
