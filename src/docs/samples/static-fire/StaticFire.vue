<script setup lang="ts">
/**
 * 15 · Engine test stand. A live static fire of SE-1 serial 0412 on stand TS-3. The sequencer
 * runs in real time: abort it and the traces, dials, valves, limits and log all follow; once
 * safed, recycle to the terminal-count hold and arm the next test.
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { OctagonX, RotateCcw, Zap } from 'lucide-vue-next'
import {
  RBadge,
  RButton,
  RCard,
  RDial,
  RDialog,
  RLineChart,
  RMeter,
  RReadout,
  RSpecList,
  RStatus,
  RSteps,
  RTable,
  formatCompact,
  formatNumber,
  useToast,
  type SpecItem,
  type StatusTone,
  type StepItem,
  type TableColumn,
} from '@/design-system'
import SampleShell from '../_kit/SampleShell.vue'
import {
  CUTOFF,
  PLOT_FROM,
  PLOT_STEP,
  SHUTDOWN_END,
  START_T,
  VALVE_TONE,
  bootLog,
  limits,
  mmss,
  plannedPc,
  plotLabels,
  plotTimes,
  previousThrust,
  reading,
  stamp,
  steps,
  testClock,
  valves,
  type LogLine,
  type Stage,
} from './data'

const toast = useToast()

/* ── Sequencer ───────────────────────────────────────────────────────────────────── */
const stage = ref<Stage>('run')
const t = ref(START_T)
const abortAt = ref<number | null>(null)
/** How the previous run ended: null for a full duration. Test 0412-02 ran 150 s by plan. */
const previousAbortAt = ref<number | null>(null)
const testNo = ref(3)
const testId = computed(() => `0412-${String(testNo.value).padStart(2, '0')}`)

let seq = 0
const snapshot = (at: number): LogLine => {
  const r = reading(at, abortAt.value)
  return {
    id: `s${++seq}`,
    t: at,
    source: 'DAQ',
    message: 'Snapshot PC-A, thrust, pump speed',
    value: `${r.pcA.toFixed(1)} bar · ${Math.round(r.thrust)} kN · ${formatNumber(Math.round(r.rpm))} rpm`,
  }
}
const log = ref<LogLine[]>([...bootLog, snapshot(20), snapshot(40)])
const addLog = (line: Omit<LogLine, 'id'>) => log.value.push({ ...line, id: `e${++seq}` })

function tick() {
  if (stage.value === 'hold' || stage.value === 'safed') return
  const next = t.value + 1
  if (stage.value === 'count' && next >= 0) {
    stage.value = 'run'
    addLog({ t: 0, source: 'VLV', message: 'MOV-101 and MFV-201 open', value: '100 %' })
    addLog({ t: 2, source: 'SEQ', message: 'Mainstage', tone: 'brand' })
  }
  if (stage.value === 'run') {
    if (next % 10 === 0 && next > 2 && next < CUTOFF) log.value.push(snapshot(next))
    if (next === 100) addLog({ t: 100, source: 'SEQ', message: 'Throttle to 90 %', value: '87.5 bar' })
    if (next === 130) addLog({ t: 130, source: 'SEQ', message: 'Throttle to 100 %', value: '97.2 bar' })
    if (next >= CUTOFF) {
      stage.value = 'shutdown'
      addLog({ t: CUTOFF, source: 'SEQ', message: 'Cutoff command, main valves closing' })
    }
  }
  if (stage.value === 'shutdown' && next >= (abortAt.value ?? CUTOFF) + (SHUTDOWN_END - CUTOFF)) {
    stage.value = 'safed'
    addLog({ t: next, source: 'SEQ', message: 'Safing complete, stand locked out', tone: 'success' })
    if (abortAt.value == null) toast.show({ title: `Test ${testId.value} complete`, body: '180.0 s of mainstage, no limit exceeded.', tone: 'success' })
  }
  t.value = next
}

let timer: number | undefined
onMounted(() => (timer = window.setInterval(tick, 1000)))
onBeforeUnmount(() => window.clearInterval(timer))

/* ── Arm and abort ───────────────────────────────────────────────────────────────── */
const confirm = ref<'arm' | 'abort' | null>(null)
const confirmOpen = computed({
  get: () => confirm.value != null,
  set: (v: boolean) => {
    if (!v) confirm.value = null
  },
})
const canAbort = computed(() => stage.value === 'count' || stage.value === 'run')

function doAbort() {
  const at = t.value + 0.2
  abortAt.value = at
  stage.value = 'shutdown'
  addLog({ t: at, source: 'OPS', message: 'Abort commanded by test conductor', tone: 'danger' })
  addLog({ t: at + 0.04, source: 'VLV', message: 'MOV-101 and MFV-201 closed', value: '0 %' })
  addLog({ t: at + 0.1, source: 'VLV', message: 'PGV-601 open, GN2 purge', value: '' })
  toast.show({ title: `Test ${testId.value} aborted`, body: `Main valves closed at ${stamp(at)}. Purge running.`, tone: 'danger' })
  confirm.value = null
}

function doArm() {
  stage.value = 'count'
  addLog({ t: -10, source: 'OPS', message: 'Ignition armed by D. Hutapea', value: '' })
  toast.show({ title: `Test ${testId.value} armed`, body: 'The count resumes at T−00:10. Ignition is automatic at T-0.', tone: 'signal' })
  confirm.value = null
}

function recycle() {
  testNo.value += 1
  previousAbortAt.value = abortAt.value
  abortAt.value = null
  t.value = -10
  stage.value = 'hold'
  log.value = [
    { id: `r${++seq}`, t: -300, source: 'SEQ', message: `Test ${testId.value}: chill-down start` },
    { id: `r${++seq}`, t: -184.1, source: 'DAQ', message: 'LOX pump inlet below 95 K, pump chilled', value: '94.8 K' },
    { id: `r${++seq}`, t: -10, source: 'SEQ', message: 'Hold at T−00:10, waiting for arm', tone: 'warning' },
  ]
}

/* ── Live figures ────────────────────────────────────────────────────────────────── */
const now = computed(() => reading(t.value, abortAt.value))

/** Seconds of mainstage so far, stopped by cutoff or an abort. */
const burn = computed(() => Math.max(0, Math.min(t.value, abortAt.value ?? CUTOFF, CUTOFF)))
/** Tanks drain with the throttle: 177 rated-equivalent seconds use 92% of the LOX. */
const propellant = computed(() => {
  const b = burn.value
  const used = Math.min(b, 100) + Math.max(0, Math.min(b, 130) - 100) * 0.9 + Math.max(0, b - 130)
  return { lox: 100 - (used / 177) * 92, fuel: 100 - (used / 177) * 90.5 }
})
const live = computed(() => stage.value === 'count' || stage.value === 'run')

const clockSub = computed(() => {
  if (stage.value === 'hold') return 'Hold · waiting for arm'
  if (stage.value === 'count') return `Ignition in ${mmss(-t.value)}`
  if (stage.value === 'run') return `Cutoff in ${mmss(CUTOFF - t.value)} · at T+03:00`
  if (stage.value === 'shutdown') return abortAt.value != null ? 'Abort shutdown · purge on' : 'Shutdown · purge on'
  return abortAt.value != null ? `Aborted at ${stamp(abortAt.value)}` : 'Complete · cutoff at T+03:00'
})

const clockMeta = computed(() => ({ hold: 'Hold', count: 'Live', run: 'Live', shutdown: 'Shutdown', safed: 'Stopped' })[stage.value])

const stageStatus = computed<{ label: string; tone: StatusTone }>(() => {
  if (stage.value === 'hold') return { label: 'Hold', tone: 'warning' }
  if (stage.value === 'count') return { label: 'Terminal count', tone: 'signal' }
  if (stage.value === 'run') return { label: t.value < 2 ? 'Ignition' : 'Mainstage', tone: 'signal' }
  if (stage.value === 'shutdown') return { label: abortAt.value != null ? 'Aborting' : 'Shutdown', tone: abortAt.value != null ? 'danger' : 'brand' }
  return { label: 'Safed', tone: 'success' }
})

/* ── Sequence steps ──────────────────────────────────────────────────────────────── */
const stepItems = computed<StepItem[]>(() => {
  const s = stage.value
  const current = s === 'hold' || s === 'count' ? 1 : s === 'run' ? (t.value < 2 ? 1 : 2) : s === 'shutdown' ? 3 : 4
  return steps.map((step, i) => {
    let status: StepItem['status'] = i < current ? 'complete' : i === current ? 'current' : 'upcoming'
    if (s === 'safed' && i === 4) status = 'complete'
    let description = step.description
    if (abortAt.value != null && i === 2) {
      status = 'error'
      description = `Aborted at ${stamp(abortAt.value)}`
    }
    return { label: step.label, description, status }
  })
})

/* ── Traces ──────────────────────────────────────────────────────────────────────── */
const nowIdx = computed(() => Math.min(plotTimes.length - 1, Math.max(0, Math.round((t.value - PLOT_FROM) / PLOT_STEP))))
/** Once the stand is safed the record is closed: no now line, no forecast. */
const plotNow = computed(() => (stage.value === 'safed' ? null : nowIdx.value))
const planned = computed(() => abortAt.value == null && stage.value !== 'safed')

const pcSeries = computed(() => [
  {
    name: 'PC-A',
    values: plotTimes.map((s, i) => (i <= nowIdx.value ? reading(s, abortAt.value).pcA : planned.value ? plannedPc(s) : null)),
    color: 'var(--r-chart-1)',
  },
  {
    name: 'PC-B',
    values: plotTimes.map((s, i) => (i <= nowIdx.value ? reading(s, abortAt.value).pcB : null)),
    color: 'var(--r-chart-context)',
  },
])

const thrustSeries = computed(() => [
  {
    name: `Thrust · ${testId.value}`,
    values: plotTimes.map((s, i) => (i <= nowIdx.value ? reading(s, abortAt.value).thrust : planned.value ? plannedPc(s) * 8.71 : null)),
    color: 'var(--r-chart-1)',
  },
  {
    name: `Test 0412-${String(testNo.value - 1).padStart(2, '0')}`,
    values: plotTimes.map((s) => (testNo.value === 3 ? previousThrust(s) : reading(s, previousAbortAt.value).thrust)),
    color: 'var(--r-chart-context)',
  },
])

const bar = (v: number) => `${formatNumber(v, { maximumFractionDigits: 1, minimumFractionDigits: 1 })} bar`
const kN = (v: number) => `${formatNumber(Math.round(v))} kN`

/* ── Limits ──────────────────────────────────────────────────────────────────────── */
const fmtLimit = (v: number, d: number) => formatNumber(v, { minimumFractionDigits: d, maximumFractionDigits: d })

const limitItems = computed<SpecItem[]>(() =>
  limits.map((l) => {
    const v = now.value[l.id]
    const armed = !l.mainstageOnly || (stage.value === 'run' && t.value >= 3)
    let tone: StatusTone = 'neutral'
    if (armed) {
      // "Near" is the last 15% of a band, or 5% of a one-sided limit.
      const margin = l.min != null && l.max != null ? (l.max - l.min) * 0.15 : Math.abs(l.max ?? l.min ?? 0) * 0.05
      const over = (l.max != null && v > l.max) || (l.min != null && v < l.min)
      const near = (l.max != null && v > l.max - margin) || (l.min != null && v < l.min + margin)
      tone = over ? 'danger' : near ? 'warning' : 'success'
    }
    const range =
      l.min != null && l.max != null
        ? `${fmtLimit(l.min, l.decimals)} to ${fmtLimit(l.max, l.decimals)}`
        : l.min != null
          ? `min ${fmtLimit(l.min, l.decimals)}`
          : `max ${fmtLimit(l.max as number, l.decimals)}`
    return {
      label: l.label,
      value: `${range} ${l.unit}`,
      mono: true,
      tone,
      hint: armed ? `Now ${fmtLimit(v, l.decimals)}` : `Now ${fmtLimit(v, l.decimals)} · mainstage only`,
    }
  }),
)

/* ── Valves ──────────────────────────────────────────────────────────────────────── */
const valveView = computed(() =>
  valves.map((v) => {
    const state = v.fault ? ('Fault' as const) : v.states[stage.value]
    return { ...v, state, tone: VALVE_TONE[state] }
  }),
)
const openCount = computed(() => valveView.value.filter((v) => v.state === 'Open').length)

/* ── Log ─────────────────────────────────────────────────────────────────────────── */
const logRows = computed(() => [...log.value].sort((a, b) => b.t - a.t))
const logColumns: TableColumn[] = [
  { key: 't', label: 'Time', width: '112px' },
  { key: 'source', label: 'Src', width: '56px' },
  { key: 'message', label: 'Message' },
  { key: 'value', label: 'Value', align: 'right' },
]
</script>

<template>
  <SampleShell product="Test operations" padding="sm">
    <template #strip>
      <span class="s-sf-strip s-sf-hide-sm">Stand TS-3 · Waingapu</span>
    </template>
    <template #meta>
      <span class="s-sf-hide-sm">12 Nov 2026 · 10:14 WITA</span>
      <RStatus tone="success" size="sm" label="Area clear" />
    </template>
    <template #header>
      <div class="s-sf-title">
        <p class="r-eyebrow">SE-1 serial 0412 · Test {{ testId }} · Full-duration mainstage</p>
        <h1 class="sample-shell__title">Engine test stand</h1>
      </div>
    </template>
    <template #actions>
      <RStatus :tone="stageStatus.tone" :label="stageStatus.label" :pulse="live" />
      <RButton v-if="stage === 'safed'" variant="ghost" size="sm" @click="recycle">
        <template #leading><RotateCcw /></template>
        Recycle to hold
      </RButton>
      <RButton tone="signal" size="sm" :disabled="stage !== 'hold'" @click="confirm = 'arm'">
        <template #leading><Zap /></template>
        {{ stage === 'hold' ? 'Arm ignition' : stage === 'safed' ? 'Arm' : 'Armed' }}
      </RButton>
      <RButton tone="danger" size="sm" :disabled="!canAbort" @click="confirm = 'abort'">
        <template #leading><OctagonX /></template>
        Abort
      </RButton>
    </template>

    <div class="s-sf">
      <!-- 01 · Sequence -->
      <RCard class="s-sf-seq" index="01" eyebrow="Test sequence" :meta="`Test ${testId}`" padding="sm">
        <RSteps :items="stepItems" size="sm" />
        <div class="s-sf-seq__progress">
          <div class="s-sf-seq__meter">
            <div class="s-sf-seq__meter-head">
              <span class="r-label">Mainstage</span>
              <span class="s-sf-mono s-sf-seq__meter-value">{{ formatNumber(burn, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) }} of {{ CUTOFF }}.0 s</span>
            </div>
            <RMeter variant="segments" :value="(burn / CUTOFF) * 100" :count="36" tone="brand" :height="14" :label="`Mainstage ${Math.round(burn)} of ${CUTOFF} seconds`" />
            <div class="s-sf-seq__scale r-index" aria-hidden="true">
              <span>T+0</span><span>T+60</span><span>T+120</span><span>T+180</span>
            </div>
          </div>
          <RReadout label="LOX tank" :value="propellant.lox" :decimals="0" unit="%" size="sm" />
          <RReadout label="RP-1 tank" :value="propellant.fuel" :decimals="0" unit="%" size="sm" />
        </div>
      </RCard>

      <!-- 02 · Clock -->
      <RCard class="s-sf-clock" padding="sm" marks>
        <RReadout label="02 · Test clock" :value="testClock(t)" font="pixel" size="lg" ghost :tone="live ? 'signal' : undefined" :sub="clockSub">
          <template #meta>{{ clockMeta }}</template>
        </RReadout>
        <div class="s-sf-clock__figures">
          <RReadout label="PC-A" :value="now.pcA" :decimals="1" unit="bar" size="sm" align="right" />
          <RReadout label="Thrust" :value="Math.round(now.thrust)" unit="kN" size="sm" align="right" />
        </div>
      </RCard>

      <!-- 03 · Traces -->
      <RCard class="s-sf-traces" index="03" eyebrow="Traces" title="Chamber pressure and thrust" :meta="testClock(t)" padding="sm">
        <RLineChart
          :labels="plotLabels"
          :series="pcSeries"
          :height="168"
          :now="plotNow"
          :forecast-from="plotNow"
          :references="[
            { value: 108, label: 'Redline 108 bar', kind: 'threshold' },
            { value: 80, label: 'Low limit 80 bar', kind: 'threshold' },
          ]"
          :min="0"
          :max="125"
          :y-ticks="5"
          y-unit="bar"
          :format="bar"
          label="Chamber pressure, sensors PC-A and PC-B, against the redline and the low limit. Measured up to now, planned after."
        />
        <RLineChart
          :labels="plotLabels"
          :series="thrustSeries"
          :height="168"
          :now="plotNow"
          :forecast-from="plotNow"
          :references="[
            { value: 845, label: 'Rated 845 kN', kind: 'target' },
            { value: 700, label: 'Abort 700 kN', kind: 'threshold' },
          ]"
          :min="0"
          :max="1000"
          y-unit="kN"
          :format="kN"
          label="Thrust from the load cells against rated thrust and the abort limit, with the previous test for comparison. Measured up to now, planned after."
        />
      </RCard>

      <!-- 04 · Turbopump -->
      <RCard class="s-sf-pump" index="04" eyebrow="Turbopump" meta="TP-0412" padding="sm">
        <div class="s-sf-pump__dials">
          <RDial
            :value="now.rpm"
            :min="0"
            :max="40000"
            :major-step="10000"
            unit="rpm"
            :size="150"
            :format="(v) => formatCompact(v)"
            :zones="[
              { from: 34000, to: 36000, level: 'warning' },
              { from: 36000, to: 40000, level: 'critical' },
            ]"
            label="Shaft speed"
          />
          <RDial
            :value="now.turbineTemp"
            :min="200"
            :max="1200"
            :major-step="200"
            unit="K"
            :size="150"
            :format="(v) => formatNumber(Math.round(v))"
            :zones="[
              { from: 980, to: 1060, level: 'warning' },
              { from: 1060, to: 1200, level: 'critical' },
            ]"
            label="Turbine inlet"
          />
        </div>
      </RCard>

      <!-- 05 · Valves -->
      <RCard class="s-sf-valves" index="05" eyebrow="Valves" :meta="`${openCount} open · 1 fault`" padding="sm">
        <ul class="s-sf-valves__grid">
          <li v-for="v in valveView" :key="v.tag" class="s-sf-valve" :class="{ 'is-fault': v.state === 'Fault' }" :title="v.fault">
            <span class="s-sf-valve__tag">{{ v.tag }}</span>
            <span class="s-sf-valve__name">{{ v.name }}</span>
            <RBadge :tone="v.tone" :variant="v.state === 'Closed' ? 'outline' : v.state === 'Fault' ? 'solid' : 'soft'" size="sm" dot>
              {{ v.state }}
            </RBadge>
          </li>
        </ul>
      </RCard>

      <!-- 06 · Abort limits -->
      <RCard class="s-sf-limits" index="06" eyebrow="Abort limits" meta="Redlines armed at T+00:03" padding="sm">
        <RSpecList :items="limitItems" dense />
      </RCard>

      <!-- 07 · Data log -->
      <RCard class="s-sf-log" index="07" eyebrow="Data log" :meta="`${log.length} lines · newest first`" padding="none">
        <RTable :columns="logColumns" :rows="logRows" row-key="id" density="compact" sticky-header max-height="404px" caption="Sequencer, valve and sensor log, newest first">
          <template #cell-t="{ row }"><span class="s-sf-mono s-sf-dim">{{ stamp(row.t) }}</span></template>
          <template #cell-source="{ row }"><span class="s-sf-mono s-sf-src">{{ row.source }}</span></template>
          <template #cell-message="{ row }">
            <span class="s-sf-msg">
              <RStatus v-if="row.tone" :tone="row.tone" size="sm" />
              <span class="s-sf-mono">{{ row.message }}</span>
            </span>
          </template>
          <template #cell-value="{ row }"><span class="s-sf-mono s-sf-dim">{{ row.value }}</span></template>
        </RTable>
      </RCard>
    </div>

    <RDialog
      v-model:open="confirmOpen"
      size="sm"
      :eyebrow="confirm === 'abort' ? `Test ${testId} · ${testClock(t)}` : `Test ${testId} · hold at T−00:10`"
      :title="confirm === 'abort' ? `Abort test ${testId}?` : `Arm ignition for test ${testId}?`"
    >
      <p v-if="confirm === 'abort'" class="s-sf-confirm">
        Closes MOV-101 and MFV-201 and opens the GN2 purge. Chamber pressure falls to zero in about 0.6 s. The test cannot be resumed;
        the next attempt starts from chill-down.
      </p>
      <p v-else class="s-sf-confirm">
        Arms the igniter and the main-valve sequencer. The count resumes at T−00:10 and ignition is automatic at T-0. Abort stays
        available until cutoff.
      </p>
      <template #footer="{ close }">
        <RButton variant="ghost" @click="close">{{ confirm === 'abort' ? 'Keep running' : 'Cancel' }}</RButton>
        <RButton v-if="confirm === 'abort'" tone="danger" @click="doAbort">
          <template #leading><OctagonX /></template>
          Abort test
        </RButton>
        <RButton v-else tone="signal" @click="doArm">
          <template #leading><Zap /></template>
          Arm ignition
        </RButton>
      </template>
    </RDialog>
  </SampleShell>
</template>

<style scoped>
.s-sf {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 12px;
}

.s-sf-strip {
  color: var(--r-text-secondary);
}

.s-sf-title {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.s-sf-title .r-eyebrow {
  color: var(--r-text-tertiary);
}

.s-sf-seq {
  grid-column: span 8;
}

.s-sf-seq__progress {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 112px 112px;
  align-items: end;
  gap: 24px;
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid var(--r-border-subtle);
}

.s-sf-seq__meter {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.s-sf-seq__meter-head,
.s-sf-seq__scale {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.s-sf-seq__meter-value {
  color: var(--r-text-secondary);
}

.s-sf-clock {
  grid-column: span 4;
  grid-row: span 1;
}

.s-sf-clock__figures {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  padding-top: 10px;
  border-top: 1px solid var(--r-border-subtle);
}

.s-sf-traces {
  grid-column: span 8;
  grid-row: span 2;
}

.s-sf-pump {
  grid-column: span 4;
}

.s-sf-pump__dials {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-around;
  gap: 8px;
}

.s-sf-valves {
  grid-column: span 4;
}

.s-sf-valves__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  border-top: 1px solid var(--r-border-subtle);
  border-left: 1px solid var(--r-border-subtle);
}

.s-sf-valve {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  min-width: 0;
  padding: 8px 10px;
  border-right: 1px solid var(--r-border-subtle);
  border-bottom: 1px solid var(--r-border-subtle);
}

.s-sf-valve.is-fault {
  background: var(--r-danger-soft);
}

.s-sf-valve__tag {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: 0.02em;
}

.s-sf-valve__name {
  max-width: 100%;
  overflow: hidden;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.s-sf-limits {
  grid-column: span 4;
}

.s-sf-log {
  grid-column: span 8;
}

.s-sf-mono {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
  letter-spacing: 0;
}

.s-sf-dim {
  color: var(--r-text-tertiary);
}

.s-sf-src {
  color: var(--r-text-secondary);
  font-weight: var(--r-weight-semibold);
}

.s-sf-msg {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.s-sf-confirm {
  color: var(--r-text-secondary);
  font-size: var(--r-text-sm);
  line-height: 1.55;
}

@media (max-width: 1199px) {
  .s-sf-seq,
  .s-sf-clock,
  .s-sf-traces,
  .s-sf-log {
    grid-column: 1 / -1;
    grid-row: auto;
  }
  .s-sf-pump,
  .s-sf-valves,
  .s-sf-limits {
    grid-column: span 6;
  }
  .s-sf-limits {
    grid-column: 1 / -1;
  }
}

@media (max-width: 760px) {
  .s-sf-seq__progress {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .s-sf-seq__meter {
    grid-column: 1 / -1;
  }
  .s-sf-pump,
  .s-sf-valves {
    grid-column: 1 / -1;
  }
  .s-sf-valves__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .s-sf-hide-sm {
    display: none;
  }
}
</style>
