<script setup lang="ts">
/**
 * Sample 10 · Air picture. A live recognised air picture for an invented sector: the scope and
 * the track table share one selection, the selected track reads out as instruments, a hostile
 * inside the 50 NM ring raises the one orange banner, and assigning a fighter flies the intercept.
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import {
  RAlert,
  RBadge,
  RButton,
  RCard,
  RIconButton,
  RKbd,
  RRadarScope,
  RSegmented,
  RStatus,
  RSwitch,
  RTable,
  RTimeline,
  useToast,
  type RadarContact,
  type TableColumn,
  type TableSort,
  type TimelineItem,
} from '@/design-system'
import SampleShell from '../_kit/SampleShell.vue'
import KindGlyph from './parts/KindGlyph.vue'
import ScopeKey from './parts/ScopeKey.vue'
import SensorHealth from './parts/SensorHealth.vue'
import TrackReadouts from './parts/TrackReadouts.vue'
import { useAirPicture, type TrackView } from './sim'
import {
  ALERT_RING_NM,
  KIND_LABEL,
  KIND_RANK,
  KIND_TONE,
  bearingText,
  clockText,
  flightLevel,
  sensorSites,
  zulu,
  zuluDate,
} from './data'

const { now, elapsed, opened, tracks, log, assignment, assign } = useAirPicture()
const toast = useToast()

/* ── Scope ───────────────────────────────────────────────────────────────────────── */
const scopeRange = ref<number>(100)
const rangeOptions = [
  { label: '50 NM', value: 50 },
  { label: '100 NM', value: 100 },
  { label: '200 NM', value: 200 },
]
const RINGS: Record<number, number> = { 50: 5, 100: 4, 200: 4 }
const rings = computed(() => RINGS[scopeRange.value] ?? 4)
const ringStep = computed(() => scopeRange.value / rings.value)
const showCivil = ref(true)

const visible = computed(() => tracks.value.filter((t) => showCivil.value || t.kind !== 'neutral'))
const inScope = computed(() => visible.value.filter((t) => t.range <= scopeRange.value))
const contacts = computed<RadarContact[]>(() =>
  inScope.value.map((t) => ({
    id: t.id,
    label: t.id,
    kind: t.kind,
    bearing: t.bearing,
    range: Math.round(t.range * 10) / 10,
    heading: t.heading,
  })),
)
const scopeLabel = computed(
  () => `Air picture, ${scopeRange.value} nautical mile scope centred on the CRC, ${inScope.value.length} tracks`,
)

/* ── Selection, shared by the scope, the key, the table and the readouts ─────────── */
const selectedId = ref('T-131')
const select = (id: string) => (selectedId.value = id)

/* ── Track table ─────────────────────────────────────────────────────────────────── */
const columns: TableColumn[] = [
  { key: 'id', label: 'Track', sortable: true },
  { key: 'callsign', label: 'Call sign' },
  { key: 'kind', label: 'Kind', sortable: true },
  { key: 'bearing', label: 'Brg', numeric: true },
  { key: 'range', label: 'Rng NM', numeric: true, sortable: true },
  { key: 'speed', label: 'Spd kn', numeric: true },
  { key: 'altitude', label: 'Alt', numeric: true, sortable: true },
  { key: 'age', label: 'Plot', numeric: true },
]
const sort = ref<TableSort | null>({ key: 'range', direction: 'asc' })
const SORT_WORD: Record<string, string> = { id: 'track', kind: 'threat', range: 'range', altitude: 'altitude' }

// The table sorts outside (manual-sort) so J / K and the arrows step in the order on screen.
const ordered = computed<TrackView[]>(() => {
  const list = visible.value.slice()
  const s = sort.value
  if (!s) return list
  const dir = s.direction === 'asc' ? 1 : -1
  const read = (t: TrackView): number | string =>
    s.key === 'kind' ? KIND_RANK[t.kind] : (t[s.key as keyof TrackView] as number | string)
  return list.sort((a, b) => {
    const x = read(a)
    const y = read(b)
    if (typeof x === 'number' && typeof y === 'number') return (x - y) * dir
    return String(x).localeCompare(String(y), undefined, { numeric: true }) * dir
  })
})
const rows = computed(() => ordered.value.map((t) => ({ ...t })))
const sortWord = (value: TableSort | null) => (value ? (SORT_WORD[value.key] ?? value.key) : 'feed order')
const tableMeta = computed(() => `${visible.value.length} tracks · by ${sortWord(sort.value)}`)

const selected = computed(() => tracks.value.find((t) => t.id === selectedId.value) ?? ordered.value[0])

// Hiding civil traffic must not leave a hidden track selected.
watch(visible, (list) => {
  if (!list.some((t) => t.id === selectedId.value) && list[0]) selectedId.value = list[0].id
})

function step(direction: 1 | -1) {
  const list = ordered.value
  if (!list.length) return
  const at = list.findIndex((t) => t.id === selectedId.value)
  selectedId.value = list[(at + direction + list.length) % list.length].id
}

function onKeydown(event: KeyboardEvent) {
  if (event.metaKey || event.ctrlKey || event.altKey) return
  const target = event.target as HTMLElement | null
  if (target?.closest('input, textarea, select, [contenteditable="true"], [role="dialog"]')) return
  if (event.key === 'j' || event.key === 'J') {
    event.preventDefault()
    step(1)
  } else if (event.key === 'k' || event.key === 'K') {
    event.preventDefault()
    step(-1)
  }
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))

/* ── The alert: a hostile inside the ring, then the fighter on it ─────────────────── */
const byId = (id: string) => tracks.value.find((t) => t.id === id)
const threat = computed(
  () => tracks.value.filter((t) => t.kind === 'hostile' && t.inside).sort((a, b) => a.range - b.range)[0] ?? null,
)
const nearestHostile = computed(
  () => tracks.value.filter((t) => t.kind === 'hostile').sort((a, b) => a.range - b.range)[0] ?? null,
)

const RAD = Math.PI / 180
const intercept = computed(() => {
  const a = assignment.value
  if (!a) return null
  const fighter = byId(a.fighter)
  const target = byId(a.target)
  if (!fighter || !target) return null
  const fx = fighter.range * Math.sin(fighter.bearing * RAD)
  const fy = fighter.range * Math.cos(fighter.bearing * RAD)
  const tx = target.range * Math.sin(target.bearing * RAD)
  const ty = target.range * Math.cos(target.bearing * RAD)
  const dist = Math.hypot(tx - fx, ty - fy)
  const ux = (tx - fx) / (dist || 1)
  const uy = (ty - fy) / (dist || 1)
  // Same sum as the assignment: the fighter at its 540 kn intercept speed, less the target's
  // own motion away from it along the line of sight.
  const away = target.speed * (Math.sin(target.heading * RAD) * ux + Math.cos(target.heading * RAD) * uy)
  return {
    inSight: a.inSight,
    fighter,
    target,
    dist,
    eta: clockText((dist / Math.max(120, 540 - away)) * 3600),
  }
})

function onAssign() {
  const t = threat.value
  if (!t) return
  const result = assign(t.id)
  if (!result) {
    toast.show({ title: 'No fighter free on CAP', body: 'TALON 21 and 22 are both committed.', tone: 'danger' })
    return
  }
  select(t.id)
  toast.show({
    title: `${result.fighter} assigned to ${result.target}`,
    body: `Vector ${result.vector}, ${result.distance} NM, intercept in about ${result.time}.`,
    tone: 'brand',
  })
}

/* ── Log ─────────────────────────────────────────────────────────────────────────── */
const logItems = computed<TimelineItem[]>(() =>
  log.value.map((e) => ({ id: e.id, time: zulu(e.at), title: e.title, body: e.body, meta: e.meta, tone: e.tone })),
)

const clock = computed(() => zulu(now.value))
const today = computed(() => zuluDate(now.value))
</script>

<template>
  <SampleShell product="Air picture" padding="sm">
    <template #strip>
      <span class="s-radar-ops-strip">Sector 3 · Control and reporting centre</span>
    </template>
    <template #meta>
      <RStatus tone="signal" pulse size="sm" label="Live" />
      <span class="s-radar-ops-clock" aria-label="Time, UTC">{{ clock }}</span>
      <span class="s-radar-ops-date">{{ today }}</span>
    </template>
    <template #header>
      <div class="s-radar-ops-heading">
        <p class="r-eyebrow s-radar-ops-eyebrow">Recognised air picture · radar net 3</p>
        <h1 class="r-h3">Air picture</h1>
      </div>
    </template>
    <template #actions>
      <RSwitch v-model="showCivil" size="sm" label="Civil traffic" />
      <RSegmented v-model="scopeRange" :options="rangeOptions" size="sm" label="Scope range" />
    </template>

    <div class="s-radar-ops">
      <!-- The one loud thing on the screen, only while a hostile is inside the ring and nobody is on it. -->
      <RAlert v-if="intercept" tone="brand" class="s-radar-ops-alert">
        <span class="s-radar-ops-alert-line">
          <template v-if="intercept.inSight">
            <strong>{{ intercept.fighter.callsign }} has {{ intercept.target.id }} in sight</strong>
            <span>
              Shadowing from 3 NM astern · {{ intercept.target.id }} at {{ intercept.target.range.toFixed(1) }} NM ·
              {{ intercept.target.closure > 0 ? 'closing' : 'outbound' }} · {{ flightLevel(intercept.target.altitude) }}
            </span>
          </template>
          <template v-else>
            <strong>{{ intercept.fighter.callsign }} assigned to {{ intercept.target.id }}</strong>
            <span>
              {{ intercept.dist.toFixed(1) }} NM to the target · intercept in about {{ intercept.eta }}
              · {{ intercept.target.id }} at {{ intercept.target.range.toFixed(1) }} NM from the CRC,
              {{ intercept.target.closure > 0 ? `closing at ${Math.round(intercept.target.closure)} kn` : 'outbound' }}
            </span>
          </template>
        </span>
        <template #actions>
          <RButton variant="outline" size="sm" @click="select(intercept.fighter.id)">
            Show {{ intercept.fighter.callsign }}
          </RButton>
        </template>
      </RAlert>
      <RAlert v-else-if="threat" tone="signal" variant="solid" class="s-radar-ops-alert">
        <span class="s-radar-ops-alert-line">
          <strong>Hostile {{ threat.id }} inside the {{ ALERT_RING_NM }} NM ring</strong>
          <span>
            Bearing {{ bearingText(threat.bearing) }} · {{ threat.range.toFixed(1) }} NM · {{ flightLevel(threat.altitude) }} ·
            {{ threat.closure > 0 ? `closing at ${Math.round(threat.closure)} kn` : 'turning away' }} · no reply to IFF
          </span>
        </span>
        <template #actions>
          <RButton variant="outline" size="sm" @click="select(threat.id)">Show track</RButton>
          <RButton class="s-radar-ops-assign" size="sm" @click="onAssign">Assign interceptor</RButton>
        </template>
      </RAlert>
      <RAlert v-else tone="success" variant="outline" class="s-radar-ops-alert">
        <span class="s-radar-ops-alert-line">
          <strong>No hostile tracks inside the {{ ALERT_RING_NM }} NM ring</strong>
          <span v-if="nearestHostile">
            Nearest hostile {{ nearestHostile.id }} at {{ nearestHostile.range.toFixed(1) }} NM · bearing
            {{ bearingText(nearestHostile.bearing) }} · {{ nearestHostile.closure > 0 ? 'closing' : 'outbound' }}
          </span>
          <span v-else>The picture is clear.</span>
        </span>
      </RAlert>

      <div class="s-radar-ops-grid">
        <RCard
          class="s-radar-ops-scope"
          marks
          index="01"
          eyebrow="Scope · radar net 3"
          title="Plan position"
          title-as="h2"
          :meta="`Rings ${ringStep} NM · north up`"
        >
          <div class="s-radar-ops-scope-body">
            <div class="s-radar-ops-scope-face">
              <RRadarScope
                :contacts="contacts"
                :range="scopeRange"
                :rings="rings"
                unit="NM"
                :size="560"
                :selected="selectedId"
                :label="scopeLabel"
                @select="select"
              />
            </div>
            <ScopeKey
              class="s-radar-ops-scope-key"
              :shown="inScope"
              :all="visible"
              :ring-step="ringStep"
              :selected-id="selectedId"
              @select="select"
            />
          </div>
        </RCard>

        <div class="s-radar-ops-side">
          <RCard v-if="selected" index="02" eyebrow="Selected track">
            <template #header>
              <h2 class="s-radar-ops-ident">
                <KindGlyph :kind="selected.kind" :size="14" />
                <span class="s-radar-ops-ident-id">{{ selected.id }}</span>
                <span v-if="selected.callsign" class="s-radar-ops-ident-call">{{ selected.callsign }}</span>
                <RBadge :tone="KIND_TONE[selected.kind]" size="sm">{{ KIND_LABEL[selected.kind] }}</RBadge>
                <span class="s-radar-ops-ident-type">{{ selected.type }}</span>
              </h2>
            </template>
            <template #actions>
              <span class="s-radar-ops-keys" aria-hidden="true"><RKbd :keys="['K']" size="sm" /><RKbd :keys="['J']" size="sm" /></span>
              <RIconButton label="Previous track" size="sm" variant="outline" @click="step(-1)"><ChevronLeft /></RIconButton>
              <RIconButton label="Next track" size="sm" variant="outline" @click="step(1)"><ChevronRight /></RIconButton>
            </template>
            <TrackReadouts :track="selected" />
          </RCard>

          <RCard index="03" eyebrow="Tracks" title="Track table" title-as="h2" :meta="tableMeta" padding="none">
            <RTable
              v-model:sort="sort"
              :columns="columns"
              :rows="rows"
              manual-sort
              density="compact"
              :selected="[selectedId]"
              caption="Tracks in the air picture. Select a track to show it on the scope and in the readouts."
              @row-click="(row) => select(row.id)"
            >
              <template #cell-id="{ row }">
                <button
                  type="button"
                  class="s-radar-ops-track"
                  :data-track="row.id"
                  :aria-pressed="row.id === selectedId"
                  @click.stop="select(row.id)"
                >
                  {{ row.id }}
                </button>
              </template>
              <template #cell-callsign="{ row }">
                <span v-if="row.callsign" class="s-radar-ops-callsign">{{ row.callsign }}</span>
                <span v-else class="s-radar-ops-none">—</span>
              </template>
              <template #cell-kind="{ row }">
                <RBadge :tone="KIND_TONE[row.kind as TrackView['kind']]" size="sm">{{ KIND_LABEL[row.kind as TrackView['kind']] }}</RBadge>
              </template>
              <template #cell-bearing="{ row }">{{ bearingText(row.bearing) }}°</template>
              <template #cell-range="{ row }">{{ row.range.toFixed(1) }}</template>
              <template #cell-speed="{ row }">{{ Math.round(row.speed) }}</template>
              <template #cell-altitude="{ row }">{{ flightLevel(row.altitude) }}</template>
              <template #cell-age="{ row }">{{ row.age }} s</template>
            </RTable>
          </RCard>
        </div>

        <RCard
          class="s-radar-ops-sensors"
          index="04"
          eyebrow="Sensors"
          title="Sensor health"
          title-as="h2"
          meta="Radar net 3 · 5 sources"
          padding="none"
        >
          <SensorHealth :sites="sensorSites" :elapsed="elapsed" :opened="opened" />
        </RCard>

        <RCard
          class="s-radar-ops-log"
          index="05"
          eyebrow="Log"
          title="Engagement log"
          title-as="h2"
          meta="Zulu · newest first"
        >
          <div class="s-radar-ops-log-list">
            <RTimeline :items="logItems" dense />
          </div>
        </RCard>
      </div>
    </div>
  </SampleShell>
</template>

<style scoped>
.s-radar-ops {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.s-radar-ops-alert-line {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 2px 16px;
}

.s-radar-ops-alert-line strong {
  font-size: var(--r-text-md);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-snug);
}

.s-radar-ops-alert-line span {
  color: var(--r-text-secondary);
}

.s-radar-ops-strip {
  color: var(--r-text-secondary);
}

.s-radar-ops-clock {
  color: var(--r-text);
  font-variant-numeric: tabular-nums;
}

.s-radar-ops-heading {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.s-radar-ops-eyebrow {
  color: var(--r-text-tertiary);
}

.s-radar-ops-grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 16px;
}

.s-radar-ops-grid > * {
  min-width: 0;
}

.s-radar-ops-scope {
  grid-column: span 7;
}

.s-radar-ops-side {
  display: flex;
  grid-column: span 5;
  flex-direction: column;
  gap: 16px;
}

.s-radar-ops-sensors {
  grid-column: span 7;
}

.s-radar-ops-log {
  grid-column: span 5;
}

.s-radar-ops-scope-body {
  display: flex;
  flex: 1;
  flex-wrap: wrap;
  align-items: center;
  gap: 20px;
}

.s-radar-ops-scope-face {
  display: flex;
  flex: 1 1 360px;
  justify-content: center;
  min-width: 0;
}

.s-radar-ops-scope-key {
  flex: 0 1 184px;
  align-self: stretch;
  justify-content: center;
}

.s-radar-ops-ident {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 10px;
  margin-top: 6px;
  font-size: var(--r-text-lg);
  font-weight: var(--r-weight-semibold);
  line-height: 1.3;
}

.s-radar-ops-ident-id {
  font-family: var(--r-font-mono);
  letter-spacing: 0;
}

.s-radar-ops-ident-call {
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-md);
  font-weight: var(--r-weight-medium);
}

.s-radar-ops-ident-type {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-regular);
}

.s-radar-ops-keys {
  display: inline-flex;
  gap: 4px;
  margin-right: 4px;
}

.s-radar-ops-track {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 24px;
  margin: 0 -4px;
  padding: 0 4px;
  border: 0;
  background: none;
  color: var(--r-text);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
  font-weight: var(--r-weight-semibold);
  cursor: pointer;
}
.s-radar-ops-track:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}

.s-radar-ops-callsign {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
}

.s-radar-ops-none {
  color: var(--r-text-tertiary);
}

.s-radar-ops-log-list {
  max-height: 392px;
  margin-right: -8px;
  padding-right: 8px;
  overflow-y: auto;
}

@media (max-width: 1100px) {
  .s-radar-ops-scope,
  .s-radar-ops-side,
  .s-radar-ops-sensors,
  .s-radar-ops-log {
    grid-column: 1 / -1;
  }
}

@media (max-width: 760px) {
  .s-radar-ops-strip {
    display: none;
  }
}

@media (max-width: 480px) {
  .s-radar-ops-date {
    display: none;
  }
}

@media (max-width: 640px) {
  .s-radar-ops-scope-key {
    flex-basis: 100%;
  }
  .s-radar-ops-ident {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 10px;
  margin-top: 6px;
  font-size: var(--r-text-lg);
  font-weight: var(--r-weight-semibold);
  line-height: 1.3;
}

.s-radar-ops-ident-id {
  font-family: var(--r-font-mono);
  letter-spacing: 0;
}

.s-radar-ops-ident-call {
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-md);
  font-weight: var(--r-weight-medium);
}

.s-radar-ops-ident-type {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-regular);
}

.s-radar-ops-keys {
    display: none;
  }
}
</style>
