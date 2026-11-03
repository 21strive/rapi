<script setup lang="ts">
/**
 * 16 · Ground station. Waingapu (WGS) at 08:42 UTC: the day's antenna schedule, the selected
 * pass on a sky plot with its signal-to-noise, site weather and the downlink queue. Pick an
 * antenna to switch the pass; book a pass and it lands on the schedule.
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { CalendarPlus, RotateCw } from 'lucide-vue-next'
import {
  RBadge,
  RButton,
  RCard,
  RDialog,
  RGanttChart,
  RLineChart,
  RMeter,
  RRadarScope,
  RReadout,
  RSegmented,
  RSelect,
  RSpecList,
  RStatus,
  RTable,
  RTooltip,
  formatNumber,
  useToast,
  type GanttRow,
  type RadarContact,
  type TableColumn,
} from '@/design-system'
import SampleShell from '../_kit/SampleShell.vue'
import {
  DAY_FROM,
  DAY_TO,
  FILE_TONE,
  HOUR_TICKS,
  LOCK_THRESHOLD,
  NOW,
  antennas,
  bookings,
  files as initialFiles,
  hhmm,
  hhmmss,
  passDetails,
  siteSystems,
  weather,
  type Booking,
  type DownlinkFile,
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

/* ── Selected pass ───────────────────────────────────────────────────────────────── */
const antenna = ref('ANT-2')
const passOptions = passDetails.map((p) => ({ label: p.antenna, value: p.antenna }))
const pass = computed(() => passDetails.find((p) => p.antenna === antenna.value) ?? passDetails[1])
const inProgress = computed(() => pass.value.aos <= NOW && pass.value.los > NOW)

function pickAntenna(id: string) {
  if (passDetails.some((p) => p.antenna === id)) antenna.value = id
  else toast.show({ title: `${id} is in maintenance`, body: 'Feed alignment until 11:00 UTC. No passes are booked on it before then.', tone: 'warning' })
}

/* Sky plot · centre is zenith, so elevation maps to range as 90 − el. One contact a minute. */
function screenAngle(a: { az: number; el: number }, b: { az: number; el: number }) {
  const p = (s: { az: number; el: number }) => {
    const r = 90 - s.el
    const rad = ((s.az - 90) * Math.PI) / 180
    return { x: r * Math.cos(rad), y: r * Math.sin(rad) }
  }
  const p1 = p(a)
  const p2 = p(b)
  return ((Math.atan2(p2.x - p1.x, -(p2.y - p1.y)) * 180) / Math.PI + 360) % 360
}

const nowSample = computed(() => {
  const s = pass.value.samples
  if (!inProgress.value) return null
  return s.reduce((best, x) => (Math.abs(x.t - NOW) < Math.abs(best.t - NOW) ? x : best), s[0])
})

const contacts = computed<RadarContact[]>(() => {
  const s = pass.value.samples
  const peak = s.reduce((m, x) => (x.el > m.el ? x : m), s[0])
  return s.map((x, i, list) => {
    const isNow = x === nowSample.value
    let label = ''
    if (i === 0) label = `AOS ${hhmm(x.t)}`
    else if (i === list.length - 1) label = `LOS ${hhmm(x.t)}`
    else if (isNow) label = `${hhmm(x.t)} · ${Math.round(x.el)}°`
    else if (x === peak && !nowSample.value) label = `Max ${Math.round(x.el)}°`
    const next = list[i + 1]
    return {
      id: `${pass.value.spacecraft} ${hhmm(x.t)}`,
      label,
      bearing: x.az,
      range: Math.max(0, 90 - x.el),
      kind: x.t <= NOW ? ('friendly' as const) : ('neutral' as const),
      heading: isNow && next ? screenAngle(x, next) : undefined,
    }
  })
})
const selectedContact = computed(() => (nowSample.value ? `${pass.value.spacecraft} ${hhmm(nowSample.value.t)}` : undefined))

/* SNR · measured up to now, predicted after. */
const snrLabels = computed(() => pass.value.samples.map((x) => hhmm(x.t)))
const snrNow = computed(() => {
  if (!inProgress.value) return null
  return pass.value.samples.findIndex((x) => x === nowSample.value)
})
const snrSeries = computed(() => [{ name: 'Eb/N0', values: pass.value.samples.map((x) => x.snr) }])
const dB = (v: number) => `${formatNumber(v, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} dB`
const snrLabel = computed(
  () =>
    `Eb/N0 for ${pass.value.spacecraft} on ${pass.value.antenna}, ${hhmm(pass.value.aos)} to ${hhmm(pass.value.los)} UTC, against the ${LOCK_THRESHOLD} dB lock threshold. ${inProgress.value ? 'Measured up to now, predicted after.' : 'Predicted.'}`,
)

/* ── Schedule ────────────────────────────────────────────────────────────────────── */
const extra = ref<Booking[]>([])
const allBookings = computed(() => [...bookings, ...extra.value])

const ganttRows = computed<GanttRow[]>(() =>
  antennas.map((a) => ({
    id: a.id,
    label: a.id,
    meta: a.dish,
    items: allBookings.value
      .filter((b) => b.antenna === a.id)
      .map((b) => ({
        start: b.start,
        end: b.end,
        label: b.label,
        hatch: !!b.kind,
        tone: b.kind || b.end <= NOW ? ('context' as const) : ('brand' as const),
      })),
  })),
)

/* ── Book a pass ─────────────────────────────────────────────────────────────────── */
const bookOpen = ref(false)
const form = ref<{ spacecraft: string | number | null; antenna: string | number | null; start: string | number | null }>({
  spacecraft: 'NUSA-2',
  antenna: 'ANT-3',
  start: String(11 * 60),
})
const spacecraftOptions = ['RS-12', 'RS-17', 'NUSA-2', 'LINTAS-5', 'CAKRA-1A', 'AURA-3'].map((s) => ({ label: s, value: s }))
const antennaOptions = ['ANT-1', 'ANT-2', 'ANT-3'].map((a) => ({ label: a, value: a }))
const slotOptions = [10 * 60 + 40, 11 * 60, 11 * 60 + 15, 12 * 60 + 30, 13 * 60 + 30].map((m) => ({ label: `${hhmm(m)} to ${hhmm(m + 12)} UTC`, value: String(m) }))
const clash = computed(() => {
  const start = Number(form.value.start)
  return allBookings.value.find((b) => b.antenna === form.value.antenna && start < b.end && start + 12 > b.start) ?? null
})
function book() {
  if (clash.value || !form.value.spacecraft || !form.value.antenna) return
  const start = Number(form.value.start)
  extra.value = [...extra.value, { antenna: String(form.value.antenna), label: String(form.value.spacecraft), start, end: start + 12 }]
  toast.show({ title: 'Pass booked', body: `${form.value.spacecraft} on ${form.value.antenna}, ${hhmm(start)} to ${hhmm(start + 12)} UTC.`, tone: 'success' })
  bookOpen.value = false
}

/* ── Downlink queue ──────────────────────────────────────────────────────────────── */
const files = ref<DownlinkFile[]>(initialFiles.map((f) => ({ ...f })))
const fileFilter = ref<string>('all')
const ACTIVE = ['Downlinking', 'Queued']
const counts = computed(() => ({
  active: files.value.filter((f) => ACTIVE.includes(f.status)).length,
  done: files.value.filter((f) => f.status === 'Verified' || f.status === 'Delivered').length,
  failed: files.value.filter((f) => f.status === 'Failed').length,
}))
const fileOptions = computed(() => [
  { label: `All ${files.value.length}`, value: 'all' },
  { label: `Active ${counts.value.active}`, value: 'active' },
  { label: `Done ${counts.value.done}`, value: 'done' },
  { label: `Failed ${counts.value.failed}`, value: 'failed' },
])
const fileRows = computed(() =>
  files.value.filter((f) => {
    if (fileFilter.value === 'active') return ACTIVE.includes(f.status)
    if (fileFilter.value === 'done') return f.status === 'Verified' || f.status === 'Delivered'
    if (fileFilter.value === 'failed') return f.status === 'Failed'
    return true
  }),
)
const fileColumns: TableColumn<DownlinkFile>[] = [
  { key: 'file', label: 'File', sortable: true },
  { key: 'spacecraft', label: 'Spacecraft', sortable: true },
  { key: 'antenna', label: 'Antenna' },
  { key: 'sizeMb', label: 'Size', numeric: true, sortable: true },
  { key: 'priority', label: 'Priority', sortable: true },
  { key: 'eta', label: 'Due or done', numeric: true, sortable: true },
  { key: 'status', label: 'Status', width: '240px' },
]
const size = (mb: number) => (mb >= 1000 ? `${formatNumber(mb / 1000, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} GB` : `${formatNumber(mb, { maximumFractionDigits: 1 })} MB`)
const PRIORITY_TONE = { P1: 'brand', P2: 'neutral', P3: 'neutral' } as const

function retry(f: DownlinkFile) {
  files.value = files.value.map((x) => (x.id === f.id ? { ...x, status: 'Queued', eta: '09:24', note: undefined } : x))
  toast.show({ title: 'Retransmission queued', body: `${f.file} goes again on the RS-17 pass, ANT-2, from 09:24 UTC.`, tone: 'neutral' })
}

const queuedGb = computed(() => files.value.filter((f) => ACTIVE.includes(f.status)).reduce((s, f) => s + f.sizeMb, 0) / 1000)
</script>

<template>
  <SampleShell product="Ground network" padding="sm">
    <template #strip>
      <span class="s-gs-strip s-gs-hide-sm">Waingapu · WGS</span>
    </template>
    <template #meta>
      <span class="s-gs-hide-sm">12 Nov 2026 · 08:42 UTC · 16:42 WITA</span>
      <RStatus tone="success" size="sm" label="Site nominal" />
    </template>
    <template #header>
      <div class="s-gs-title">
        <p class="r-eyebrow">Sumba, Indonesia · 9.66° S 120.26° E · 4 antennas</p>
        <h1 class="sample-shell__title">Ground station</h1>
      </div>
    </template>
    <template #actions>
      <RButton tone="brand" size="sm" @click="bookOpen = true">
        <template #leading><CalendarPlus /></template>
        Book pass
      </RButton>
    </template>

    <div class="s-gs">
      <!-- Antenna and site lamps -->
      <div class="r-grid-ruled s-gs-lamps">
        <component
          :is="passDetails.some((p) => p.antenna === a.id) ? 'button' : 'div'"
          v-for="a in antennas"
          :key="a.id"
          class="s-gs-lamp"
          :class="{ 'is-selected': a.id === antenna, 'is-button': passDetails.some((p) => p.antenna === a.id) }"
          :type="passDetails.some((p) => p.antenna === a.id) ? 'button' : undefined"
          :aria-pressed="passDetails.some((p) => p.antenna === a.id) ? a.id === antenna : undefined"
          @click="pickAntenna(a.id)"
        >
          <span class="s-gs-lamp__head">
            <span class="s-gs-lamp__id">{{ a.id }}</span>
            <span class="s-gs-lamp__dish">{{ a.dish }}</span>
          </span>
          <span class="s-gs-lamp__line">
            <RStatus :tone="a.tone" :label="a.status" :pulse="a.live" size="sm" />
            <span class="s-gs-lamp__detail">{{ a.detail }}</span>
          </span>
        </component>
        <div v-for="s in siteSystems" :key="s.id" class="s-gs-lamp">
          <span class="s-gs-lamp__head">
            <span class="s-gs-lamp__id">{{ s.id }}</span>
            <span class="s-gs-lamp__dish">{{ s.dish }}</span>
          </span>
          <span class="s-gs-lamp__line">
            <RStatus :tone="s.tone" :label="s.status" size="sm" />
            <span class="s-gs-lamp__detail">{{ s.detail }}</span>
          </span>
        </div>
      </div>

      <!-- 01 · Schedule -->
      <RCard class="s-gs-schedule" index="01" eyebrow="Antenna schedule" title="06:00 to 14:00 UTC" :meta="narrow ? 'UTC' : 'Grey done · hatched out of service'" padding="sm">
        <div class="s-gs-scroll">
          <div class="s-gs-scroll__inner">
            <RGanttChart
              :rows="ganttRows"
              :domain="[DAY_FROM, DAY_TO]"
              :ticks="HOUR_TICKS"
              :format-tick="hhmm"
              :now="NOW"
              :row-height="34"
              :label-width="120"
              label="Antenna bookings from 06:00 to 14:00 UTC. Done passes grey, upcoming cobalt, maintenance and calibration hatched."
            />
          </div>
        </div>
      </RCard>

      <!-- 02 · Sky plot -->
      <RCard class="s-gs-sky" index="02" eyebrow="Sky plot" :title="`${pass.spacecraft} · ${pass.antenna}`" padding="sm">
        <template #actions>
          <RSegmented v-model="antenna" :options="passOptions" size="sm" label="Antenna" />
        </template>
        <div class="s-gs-sky__scope">
          <RRadarScope
            :contacts="contacts"
            :range="90"
            :rings="3"
            unit="ZENITH"
            :sweep="false"
            :size="356"
            :selected="selectedContact"
            :label="`Sky plot of the ${pass.spacecraft} pass over ${pass.antenna}: azimuth as bearing, centre at zenith, outer ring at the horizon`"
          />
        </div>
        <p class="s-gs-caption">Centre zenith, outer ring horizon, rings every 30°. Cobalt flown, grey predicted.</p>
      </RCard>

      <!-- 03 · Signal -->
      <RCard class="s-gs-snr" index="03" eyebrow="Signal" :title="`Eb/N0 · ${pass.band}`" :meta="inProgress ? 'Live · minute means' : `Predicted · AOS ${hhmm(pass.aos)}`" padding="sm">
        <div class="s-gs-snr__figures">
          <RReadout label="AOS" :value="hhmmss(pass.aos)" size="sm" />
          <RReadout label="LOS" :value="hhmmss(pass.los)" size="sm" />
          <RReadout label="Max elevation" :value="pass.maxEl" unit="°" size="sm" />
          <RReadout label="Rate" :value="pass.rate.split(' ')[0]" :unit="pass.rate.split(' ')[1]" size="sm" />
        </div>
        <RLineChart
          :labels="snrLabels"
          :series="snrSeries"
          curve="step"
          :height="282"
          :min="0"
          :max="20"
          :now="snrNow"
          :forecast-from="inProgress ? snrNow : 0"
          :references="[{ value: LOCK_THRESHOLD, label: `Lock threshold ${LOCK_THRESHOLD}.0 dB`, kind: 'threshold' }]"
          y-unit="dB"
          :format="dB"
          :label="snrLabel"
        />
        <p class="s-gs-caption">{{ pass.operator }} · {{ inProgress ? 'locked since AOS + 00:40' : 'lock expected 40 s after AOS' }}</p>
      </RCard>

      <!-- 04 · Weather -->
      <RCard class="s-gs-weather" index="04" eyebrow="Site weather" meta="WX-1 · 08:40" padding="sm">
        <RSpecList :items="weather" dense />
      </RCard>

      <!-- 05 · Downlink queue -->
      <RCard
        class="s-gs-queue"
        index="05"
        eyebrow="Downlink queue"
        :title="`${counts.active} files, ${formatNumber(queuedGb, { maximumFractionDigits: 2 })} GB to go`"
        padding="none"
      >
        <template #actions>
          <RSegmented v-model="fileFilter" :options="fileOptions" size="sm" label="Show" />
        </template>
        <RTable :columns="fileColumns" :rows="fileRows" row-key="id" density="compact" caption="Files waiting for, or done with, downlink" empty-text="No files in this view.">
          <template #cell-file="{ row }"><span class="s-gs-file">{{ row.file }}</span></template>
          <template #cell-spacecraft="{ value }"><span class="s-gs-mono">{{ value }}</span></template>
          <template #cell-antenna="{ value }"><span class="s-gs-mono s-gs-dim">{{ value }}</span></template>
          <template #cell-sizeMb="{ row }">{{ size(row.sizeMb) }}</template>
          <template #cell-priority="{ row }">
            <RBadge :tone="PRIORITY_TONE[row.priority as DownlinkFile['priority']]" :variant="row.priority === 'P1' ? 'soft' : 'outline'" size="sm">{{ row.priority }}</RBadge>
          </template>
          <template #cell-status="{ row }">
            <div class="s-gs-status">
              <RStatus :tone="FILE_TONE[row.status as DownlinkFile['status']]" :label="row.status" size="sm" />
              <template v-if="row.status === 'Downlinking'">
                <RMeter class="s-gs-status__meter" :segments="[{ value: row.progress, color: 'var(--r-brand)' }]" :max="100" :height="4" :label="`${row.progress}% received`" />
                <span class="s-gs-mono s-gs-dim">{{ row.progress }}%</span>
              </template>
              <RTooltip v-else-if="row.status === 'Failed'" :content="row.note">
                <RButton size="xs" variant="outline" @click="retry(row as DownlinkFile)">
                  <template #leading><RotateCw /></template>
                  Retry
                </RButton>
              </RTooltip>
            </div>
          </template>
        </RTable>
      </RCard>
    </div>

    <RDialog v-model:open="bookOpen" size="sm" eyebrow="Waingapu · WGS" title="Book a pass" description="Twelve minutes on one antenna. The pass shows on the schedule straight away.">
      <div class="s-gs-form">
        <RSelect v-model="form.spacecraft" :options="spacecraftOptions" label="Spacecraft" />
        <RSelect v-model="form.antenna" :options="antennaOptions" label="Antenna" />
        <RSelect
          v-model="form.start"
          :options="slotOptions"
          label="Window"
          :error="clash ? `${form.antenna} is booked for ${clash.label} from ${hhmm(clash.start)} to ${hhmm(clash.end)}.` : undefined"
        />
      </div>
      <template #footer="{ close }">
        <RButton variant="ghost" @click="close">Cancel</RButton>
        <RButton tone="brand" :disabled="!!clash" @click="book">Book pass</RButton>
      </template>
    </RDialog>
  </SampleShell>
</template>

<style scoped>
.s-gs {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 12px;
}

.s-gs-strip {
  color: var(--r-text-secondary);
}

.s-gs-title {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.s-gs-title .r-eyebrow {
  color: var(--r-text-tertiary);
}

/* ── Lamps ─────────────────────────────────────────────────────────────── */
.s-gs-lamps {
  grid-column: 1 / -1;
  grid-template-columns: repeat(6, minmax(0, 1fr));
}

.s-gs-lamp {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  min-width: 0;
  padding: 10px 14px;
  border-top: 0;
  border-left: 0;
  color: var(--r-text);
  font: inherit;
  text-align: left;
}

.s-gs-lamp.is-button {
  cursor: pointer;
  transition: background-color var(--r-duration-fast) var(--r-ease-out);
}

.s-gs-lamp.is-button:hover {
  background: var(--r-bg-muted);
}

.s-gs-lamp.is-selected {
  background: var(--r-bg-selected);
  box-shadow: inset 0 2px 0 var(--r-brand);
}

.s-gs-lamp:focus-visible {
  outline-offset: -2px;
}

.s-gs-lamp__head {
  display: flex;
  align-items: baseline;
  gap: 8px;
  min-width: 0;
}

.s-gs-lamp__id {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
  font-weight: var(--r-weight-semibold);
}

.s-gs-lamp__dish {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
}

.s-gs-lamp__line {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  max-width: 100%;
}

.s-gs-lamp__line .r-status {
  flex: none;
}

.s-gs-lamp__detail {
  min-width: 0;
  overflow: hidden;
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ── Panels ────────────────────────────────────────────────────────────── */
.s-gs-schedule {
  grid-column: 1 / -1;
}

.s-gs-scroll {
  overflow-x: auto;
  overscroll-behavior-x: contain;
}

.s-gs-scroll__inner {
  min-width: 880px;
}

.s-gs-sky {
  grid-column: span 4;
}

.s-gs-sky__scope {
  display: flex;
  justify-content: center;
}

.s-gs-snr {
  grid-column: span 5;
}

.s-gs-snr__figures {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--r-border-subtle);
}

.s-gs-weather {
  grid-column: span 3;
}

.s-gs-caption {
  margin-top: auto;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
  line-height: 1.45;
}

.s-gs-queue {
  grid-column: 1 / -1;
}

.s-gs-file,
.s-gs-mono {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
}

.s-gs-dim {
  color: var(--r-text-tertiary);
}

.s-gs-status {
  display: flex;
  align-items: center;
  gap: 10px;
}

.s-gs-status__meter {
  flex: 1;
  min-width: 56px;
}

.s-gs-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

@media (max-width: 1279px) {
  .s-gs-sky {
    grid-column: span 5;
  }
  .s-gs-snr {
    grid-column: span 7;
  }
  .s-gs-weather {
    grid-column: 1 / -1;
  }
  .s-gs-lamps {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 860px) {
  .s-gs-sky,
  .s-gs-snr {
    grid-column: 1 / -1;
  }
  .s-gs-lamps {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .s-gs-snr__figures {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .s-gs-hide-sm {
    display: none;
  }
}
</style>
