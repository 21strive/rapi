<script setup lang="ts">
/**
 * 14 · Satellite constellation. The Rasi fleet at 08:42 UTC: passes across five ground
 * stations, the link margin of the pass in progress, and every satellite with its battery and
 * panel temperature over the last six orbits. A row opens the satellite's orbital elements.
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { Download, Search } from 'lucide-vue-next'
import {
  RAlert,
  RButton,
  RCard,
  RCodeBlock,
  RDial,
  RDialog,
  RGanttChart,
  RInput,
  RReadout,
  RSegmented,
  RSparkline,
  RSpecList,
  RStat,
  RStatus,
  RTable,
  formatNumber,
  useToast,
  type GanttRow,
  type TableColumn,
  type TableSort,
} from '@/design-system'
import SampleShell from '../_kit/SampleShell.vue'
import {
  HEALTH_TONE,
  NOW_MIN,
  TICKS,
  WINDOW,
  currentPass,
  hhmm,
  kpis,
  passes,
  planeOptions,
  recoveryPass,
  satellites,
  stations,
  type Pass,
  type Satellite,
} from './data'

const toast = useToast()

/* Phones get a shorter legend line in the Gantt header. */
const narrow = ref(false)
let mq: MediaQueryList | undefined
const onMedia = () => (narrow.value = !!mq?.matches)
onMounted(() => {
  mq = window.matchMedia('(max-width: 640px)')
  onMedia()
  mq.addEventListener('change', onMedia)
})
onBeforeUnmount(() => mq?.removeEventListener('change', onMedia))

/* ── Anomaly · RS-14 ─────────────────────────────────────────────────────────────── */
const recoveryBooked = ref(false)
function bookRecovery() {
  recoveryBooked.value = true
  toast.show({
    title: 'Recovery pass booked',
    body: 'RS-14 over Kupang KPG-1, 09:19 to 09:28 UTC on S-band. Safe-mode exit commands are queued.',
    tone: 'success',
  })
}

/* ── Passes ──────────────────────────────────────────────────────────────────────── */
const allPasses = computed<Pass[]>(() => (recoveryBooked.value ? [...passes, recoveryPass] : passes))

function passLabel(p: Pass) {
  if (p.kind === 'failed') return `${p.sat} no lock`
  if (p.kind === 'beacon') return `${p.sat} beacon`
  if (p.kind === 'recovery') return `${p.sat} recovery`
  return p.sat
}

const ganttRows = computed<GanttRow[]>(() =>
  stations.map((st) => ({
    id: st.id,
    label: st.name,
    meta: `${st.id} · ${st.dish}`,
    items: allPasses.value
      .filter((p) => p.station === st.id)
      .sort((a, b) => a.start - b.start)
      .map((p) => ({
        start: p.start,
        end: p.end,
        label: passLabel(p),
        hatch: p.kind === 'maintenance',
        tone:
          p.kind === 'failed'
            ? ('danger' as const)
            : p.kind === 'maintenance' || p.end <= NOW_MIN
              ? ('context' as const)
              : p.kind === 'recovery'
                ? ('warning' as const)
                : ('brand' as const),
      })),
  })),
)

const passesToday = computed(() => kpis.passesTotal + (recoveryBooked.value ? 1 : 0))

/* ── Link margin ─────────────────────────────────────────────────────────────────── */
const band = ref<'x' | 's'>('x')
const bandOptions = [
  { label: 'X-band', value: 'x' },
  { label: 'S-band', value: 's' },
]
const link = computed(() => currentPass.bands[band.value])
const dB = (v: number) => formatNumber(v, { maximumFractionDigits: 1 }).replace('-', '−')
const linkSpecs = computed(() => [
  { label: 'AOS · LOS', value: `${currentPass.aos} · ${currentPass.los} UTC`, mono: true },
  { label: 'Elev · range', value: `${currentPass.elevation} · ${currentPass.range}`, mono: true },
  { label: 'Rate · SNR', value: `${link.value.rate} · ${link.value.ebn0}`, mono: true },
])

/* ── Fleet ───────────────────────────────────────────────────────────────────────── */
const plane = ref<string>('all')
const query = ref<string | number | null>('')
const sort = ref<TableSort | null>(null)

const SEVERITY: Record<Satellite['health'], number> = { 'Safe mode': 0, Degraded: 1, Watch: 2, Commissioning: 3, Nominal: 4 }

const rows = computed(() => {
  const q = String(query.value ?? '')
    .trim()
    .toLowerCase()
  return satellites
    .map((s) => (s.id === 'RS-14' && recoveryBooked.value ? { ...s, nextPass: '09:19 · KPG-1' } : s))
    .filter((s) => plane.value === 'all' || s.plane === plane.value)
    .filter((s) => !q || s.id.toLowerCase().includes(q) || s.health.toLowerCase().includes(q))
})

const columns: TableColumn<Satellite>[] = [
  { key: 'id', label: 'Satellite', sortable: true },
  { key: 'plane', label: 'Plane', sortable: true, sortValue: (r) => `${r.plane}${r.slot}` },
  { key: 'altitude', label: 'Altitude', numeric: true, sortable: true, format: (v: number) => `${v.toFixed(1)} km` },
  { key: 'battery', label: 'Battery', numeric: true, sortable: true },
  { key: 'batterySeries', label: 'Battery · 6 orbits', width: '132px' },
  { key: 'panelTemp', label: 'Panel', numeric: true, sortable: true },
  { key: 'thermalSeries', label: 'Panel · 6 orbits', width: '132px' },
  { key: 'lastContact', label: 'Last contact' },
  { key: 'nextPass', label: 'Next pass' },
  { key: 'health', label: 'Health', sortable: true, sortValue: (r) => SEVERITY[r.health] },
]

const nominal = satellites.filter((s) => s.health === 'Nominal').length
const commissioning = satellites.filter((s) => s.health === 'Commissioning').length
const meanBattery = satellites.reduce((sum, s) => sum + s.battery, 0) / satellites.length
const lowest = satellites.reduce((low, s) => (s.battery < low.battery ? s : low), satellites[0])

const temp = (v: number) => `${formatNumber(v, { maximumFractionDigits: 1, minimumFractionDigits: 1 }).replace('-', '−')} °C`

/* ── Drawer ──────────────────────────────────────────────────────────────────────── */
const openId = ref<string | null>(null)
const drawerOpen = computed({
  get: () => openId.value != null,
  set: (v: boolean) => {
    if (!v) openId.value = null
  },
})
const sat = computed(() => rows.value.find((s) => s.id === openId.value) ?? satellites.find((s) => s.id === openId.value) ?? null)

function requestPass(s: Satellite) {
  toast.show({ title: `Pass requested for ${s.id}`, body: 'The scheduler will offer the next free slot on any X-band antenna.', tone: 'neutral' })
}

function exportTle() {
  toast.show({ title: 'TLE set exported', body: `rasi-26316.tle · ${satellites.length} satellites, epoch 12 Nov 2026 07:00 UTC.`, tone: 'neutral' })
}
</script>

<template>
  <SampleShell product="Ground segment" padding="sm">
    <template #strip>
      <span class="s-cn-strip s-cn-hide-sm">Rasi constellation</span>
    </template>
    <template #meta>
      <span class="s-cn-hide-sm">12 Nov 2026 · {{ hhmm(NOW_MIN) }} UTC</span>
      <RStatus tone="success" size="sm" :label="`${stations.length} of ${stations.length} stations`" />
    </template>
    <template #header>
      <div class="s-cn-title">
        <p class="r-eyebrow">Rasi · 24 satellites · 4 sun-synchronous planes</p>
        <h1 class="sample-shell__title">Satellite constellation</h1>
      </div>
    </template>
    <template #actions>
      <RButton variant="outline" size="sm" @click="exportTle">
        <template #leading><Download /></template>
        Export TLE set
      </RButton>
    </template>

    <div class="s-cn">
      <RAlert v-if="!recoveryBooked" class="s-cn-alert" tone="danger" title="RS-14 is in safe mode">
        Reaction wheel 3 passed its speed limit at 08:12 UTC (6,214 RPM, limit 6,000). The satellite is sun-pointing with the
        payload off, and the 08:22 Kiruna pass did not lock.
        <template #actions>
          <RButton size="sm" variant="outline" @click="openId = 'RS-14'">Open RS-14</RButton>
          <RButton size="sm" @click="bookRecovery">Book recovery pass</RButton>
        </template>
      </RAlert>
      <RAlert v-else class="s-cn-alert" tone="warning" title="RS-14 recovery pass booked">
        Kupang KPG-1, 09:19 to 09:28 UTC on S-band. Queued: wheel 3 off, wheel 4 on, exit safe mode.
        <template #actions>
          <RButton size="sm" variant="outline" @click="openId = 'RS-14'">Open RS-14</RButton>
        </template>
      </RAlert>

      <div class="r-grid-ruled s-cn-kpis">
        <div class="s-cn-kpi">
          <RStat label="Satellites" :value="satellites.length" size="md">
            <template #footer><span class="s-cn-kpi__note">{{ nominal }} nominal · {{ commissioning }} commissioning</span></template>
          </RStat>
        </div>
        <div class="s-cn-kpi">
          <RStat label="Passes today" :value="kpis.passesDone" :unit="`of ${passesToday}`" size="md">
            <template #footer><span class="s-cn-kpi__note">1 failed · Kiruna down 09:30–10:30</span></template>
          </RStat>
        </div>
        <div class="s-cn-kpi">
          <RStat label="Downlinked today" :value="kpis.downlinkedTb" :decimals="2" unit="TB" :trend="kpis.downlinkTrend" trend-label="vs yesterday" size="md" />
        </div>
        <div class="s-cn-kpi">
          <RStat label="Mean battery" :value="meanBattery" :decimals="0" suffix="%" size="md">
            <template #footer><span class="s-cn-kpi__note">Lowest {{ Math.round(lowest.battery) }}% · {{ lowest.id }}</span></template>
          </RStat>
        </div>
        <div class="s-cn-kpi">
          <RStat label="Open anomalies" :value="1" size="md">
            <template #footer><RStatus tone="danger" size="sm" label="RS-14 safe mode" /></template>
          </RStat>
        </div>
      </div>

      <RCard class="s-cn-passes" index="01" eyebrow="Ground-station passes" title="07:00 to 11:00 UTC, north to south" :meta="narrow ? 'UTC' : 'Grey done · hatched maintenance'" padding="sm">
        <div class="s-cn-scroll">
          <div class="s-cn-scroll__inner">
            <RGanttChart
              :rows="ganttRows"
              :domain="WINDOW"
              :ticks="TICKS"
              :format-tick="hhmm"
              :now="NOW_MIN"
              :row-height="38"
              :label-width="150"
              label="Passes by ground station, north to south, from 07:00 to 11:00 UTC. Done passes grey, upcoming cobalt, a failed pass red, Kiruna maintenance hatched."
            />
          </div>
        </div>
      </RCard>

      <RCard class="s-cn-link" index="02" eyebrow="Link margin" :title="`${currentPass.sat} via ${currentPass.station}`" padding="sm">
        <template #actions>
          <RSegmented v-model="band" :options="bandOptions" size="sm" label="Band" />
        </template>
        <div class="s-cn-link__body">
          <RDial
            :value="link.margin"
            :min="-3"
            :max="15"
            :major-step="3"
            unit="dB"
            :size="164"
            :format="dB"
            :zones="[
              { from: -3, to: 0, level: 'critical' },
              { from: 0, to: 3, level: 'warning' },
              { from: 3, to: 15, level: 'good' },
            ]"
            :label="`${link.label} margin`"
          />
          <RSpecList :items="linkSpecs" dense />
        </div>
      </RCard>

      <RCard class="s-cn-fleet" index="03" eyebrow="Fleet" :title="`${rows.length} of ${satellites.length} satellites`" padding="none">
        <template #actions>
          <RSegmented v-model="plane" :options="planeOptions" size="sm" label="Plane" />
          <RInput v-model="query" size="sm" placeholder="Find satellite" class="s-cn-search" aria-label="Find satellite" clearable>
            <template #leading><Search /></template>
          </RInput>
        </template>
        <RTable
          v-model:sort="sort"
          :columns="columns"
          :rows="rows"
          row-key="id"
          density="compact"
          :selected="openId ? [openId] : []"
          caption="Rasi satellites with altitude, battery, panel temperature, contacts and health"
          empty-text="No satellite matches this filter."
          @row-click="(row) => (openId = row.id)"
        >
          <template #cell-id="{ row }">
            <button type="button" class="s-cn-sat" @click.stop="openId = row.id">{{ row.id }}</button>
          </template>
          <template #cell-plane="{ row }">
            <span class="r-mono">{{ row.plane }}·{{ row.slot }}</span>
          </template>
          <template #cell-battery="{ row }">
            <span :class="{ 's-cn-low': row.battery < 50 }">{{ Math.round(row.battery) }} %</span>
          </template>
          <template #cell-batterySeries="{ row }">
            <RSparkline
              :values="row.batterySeries"
              :width="108"
              :height="22"
              color="var(--r-chart-1)"
              :label="`${row.id} battery over six orbits, ${Math.round(Math.min(...row.batterySeries))} to ${Math.round(Math.max(...row.batterySeries))} percent`"
            />
          </template>
          <template #cell-panelTemp="{ row }">{{ temp(row.panelTemp) }}</template>
          <template #cell-thermalSeries="{ row }">
            <RSparkline
              :values="row.thermalSeries"
              :width="108"
              :height="22"
              color="var(--r-chart-context)"
              :end-dot="false"
              :label="`${row.id} panel temperature over six orbits, ${Math.round(Math.min(...row.thermalSeries))} to ${Math.round(Math.max(...row.thermalSeries))} °C`"
            />
          </template>
          <template #cell-lastContact="{ value }"><span class="r-mono s-cn-dim">{{ value }}</span></template>
          <template #cell-nextPass="{ value }"><span class="r-mono s-cn-dim">{{ value }}</span></template>
          <template #cell-health="{ row }">
            <RStatus :tone="HEALTH_TONE[row.health as Satellite['health']]" :label="row.health" size="sm" />
          </template>
        </RTable>
      </RCard>
    </div>

    <RDialog
      v-model:open="drawerOpen"
      side="right"
      size="lg"
      :eyebrow="sat ? `Plane ${sat.plane} · slot ${sat.slot} · ${sat.catalog}U · ${sat.intl}` : ''"
      :title="sat?.id"
    >
      <div v-if="sat" class="s-cn-drawer">
        <div class="s-cn-drawer__status">
          <RStatus :tone="HEALTH_TONE[sat.health]" :label="sat.health" />
          <span class="s-cn-drawer__note">{{ sat.note }}</span>
        </div>

        <div class="s-cn-drawer__readouts">
          <RReadout label="Battery" :value="Math.round(sat.battery)" unit="%" size="sm" :tone="sat.battery < 50 ? 'warning' : undefined">
            <template #footer>
              <RSparkline :values="sat.batterySeries" :height="36" color="var(--r-chart-1)" area :label="`${sat.id} battery over six orbits`" />
            </template>
          </RReadout>
          <RReadout label="Panel temperature" :value="sat.panelTemp" :decimals="1" unit="°C" size="sm">
            <template #footer>
              <RSparkline :values="sat.thermalSeries" :height="36" color="var(--r-chart-context)" :end-dot="false" :label="`${sat.id} panel temperature over six orbits`" />
            </template>
          </RReadout>
        </div>

        <section>
          <h3 class="r-eyebrow s-cn-drawer__h">Orbital elements</h3>
          <RSpecList :items="sat.elements" :columns="2" dense />
        </section>

        <RCodeBlock :code="sat.tle.join('\n')" language="TLE" :title="`${sat.id.toLowerCase()}.tle`" />

        <section>
          <h3 class="r-eyebrow s-cn-drawer__h">Contacts</h3>
          <RSpecList
            :items="[
              { label: 'Last contact', value: sat.lastContact, mono: true },
              { label: 'Next pass', value: sat.nextPass, mono: true },
            ]"
            :columns="2"
            dense
          />
        </section>
      </div>
      <template #footer="{ close }">
        <RButton variant="ghost" @click="close">Close</RButton>
        <RButton v-if="sat" tone="brand" @click="requestPass(sat)">Request pass</RButton>
      </template>
    </RDialog>
  </SampleShell>
</template>

<style scoped>
.s-cn {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 12px;
}

.s-cn-strip {
  color: var(--r-text-secondary);
}

.s-cn-title {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.s-cn-title .r-eyebrow {
  color: var(--r-text-tertiary);
}

.s-cn-alert {
  grid-column: 1 / -1;
}

/* ── KPIs ──────────────────────────────────────────────────────────────── */
.s-cn-kpis {
  grid-column: 1 / -1;
  grid-template-columns: repeat(5, minmax(0, 1fr));
}

.s-cn-kpi {
  padding: 12px 16px;
}

.s-cn-kpi__note {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

/* ── Passes and link ───────────────────────────────────────────────────── */
.s-cn-passes {
  grid-column: span 9;
}

.s-cn-link {
  grid-column: span 3;
}

/* Below 900px the pass chart keeps its width and scrolls inside the panel. */
.s-cn-scroll {
  overflow-x: auto;
  overscroll-behavior-x: contain;
}

.s-cn-scroll__inner {
  min-width: 860px;
}

.s-cn-link__body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.s-cn-link__body .r-spec {
  align-self: stretch;
}

/* ── Fleet ─────────────────────────────────────────────────────────────── */
.s-cn-fleet {
  grid-column: 1 / -1;
}

.s-cn-search {
  width: 180px;
}

.s-cn-sat {
  padding: 0;
  border: 0;
  background: none;
  color: var(--r-text);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: 0.02em;
  cursor: pointer;
}

.s-cn-sat:hover {
  color: var(--r-brand-text);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.s-cn-dim {
  color: var(--r-text-secondary);
}

.s-cn-low {
  color: var(--r-warning-text);
}

/* ── Drawer ────────────────────────────────────────────────────────────── */
.s-cn-drawer {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.s-cn-drawer__status {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
}

.s-cn-drawer__note {
  color: var(--r-text-secondary);
  font-size: var(--r-text-sm);
}

.s-cn-drawer__readouts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  padding: 12px 0;
  border-top: 1px solid var(--r-border);
  border-bottom: 1px solid var(--r-border);
}

.s-cn-drawer__h {
  margin-bottom: 8px;
  color: var(--r-text-secondary);
}

/* ── Responsive ────────────────────────────────────────────────────────── */
@media (max-width: 1199px) {
  .s-cn-kpis {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .s-cn-kpi:last-child {
    grid-column: span 2;
  }
  .s-cn-passes,
  .s-cn-link {
    grid-column: 1 / -1;
  }
  .s-cn-link__body {
    flex-direction: row;
    align-items: center;
    gap: 24px;
  }
  .s-cn-link__body .r-spec {
    flex: 1;
    align-self: center;
  }
}

@media (max-width: 640px) {
  .s-cn-kpis {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .s-cn-link__body {
    flex-direction: column;
  }
  .s-cn-link__body .r-spec {
    align-self: stretch;
  }
  .s-cn-search {
    width: 100%;
  }
  .s-cn-hide-sm {
    display: none;
  }
  .s-cn-drawer__readouts {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
