<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ArrowUpFromLine, Copy, EllipsisVertical, GitBranch, Globe, RefreshCw, RotateCcw, Square } from 'lucide-vue-next'
import {
  RAlert,
  RAvatar,
  RBadge,
  RButton,
  RCard,
  RCodeBlock,
  RDialog,
  RIconButton,
  RMenu,
  RPopover,
  RReadout,
  RSpecList,
  RStatus,
  RSteps,
  RTable,
  RTabs,
  useToast,
  type MenuItem,
  type StatusTone,
  type StepItem,
  type TableColumn,
} from '@/design-system'
import SampleShell from '../_kit/SampleShell.vue'
import LogsPane from './parts/LogsPane.vue'
import SettingsPane from './parts/SettingsPane.vue'
import {
  BUILDING_START,
  BUILDING_STEP_AT,
  INITIAL_PRODUCTION,
  PROJECT,
  STEP_LABELS,
  STEP_ORDER,
  buildingScript,
  deployments,
  environment,
  fmtDuration,
  type DeployStatus,
  type Deployment,
  type StepId,
} from './data'

const { show } = useToast()

const list = ref<Deployment[]>(deployments.map((d) => ({ ...d, steps: { ...d.steps } })))
const selectedId = ref('dpl_7Zx9wRt')
const productionId = ref(INITIAL_PRODUCTION)
const tab = ref<'overview' | 'logs' | 'settings'>('overview')

const tabs = computed(() => [
  { label: 'Overview', value: 'overview' },
  { label: 'Logs', value: 'logs' },
  { label: 'Settings', value: 'settings' },
])

/* ── The live build: dpl_8Fq2kLm streams its log while the screen is open ── */
const liveLines = ref(BUILDING_START)
const elapsed = ref(52)
let clock: number | undefined
let streamer: number | undefined

function liveSteps(lines: number): Deployment['steps'] {
  const done = lines >= buildingScript.length
  const at = done ? STEP_ORDER.length : BUILDING_STEP_AT[lines - 1] ?? 0
  const seconds = [17, 26, 6, 4, 8]
  return Object.fromEntries(
    STEP_ORDER.map((id, i) => [
      id,
      i < at || done ? { state: 'complete', seconds: seconds[i] } : i === at ? { state: 'current', note: i === 1 ? 'Bundling' : 'Running' } : { state: 'upcoming' },
    ]),
  ) as Deployment['steps']
}

function stream() {
  if (liveLines.value >= buildingScript.length) return
  liveLines.value += 1
  list.value = list.value.map((d) =>
    d.id === 'dpl_8Fq2kLm'
      ? { ...d, log: buildingScript.slice(0, liveLines.value), steps: liveSteps(liveLines.value), duration: elapsed.value }
      : d,
  )
  if (liveLines.value >= buildingScript.length) {
    clearInterval(clock)
    list.value = list.value.map((d) => (d.id === 'dpl_8Fq2kLm' ? { ...d, status: 'ready', duration: 61, age: 'Just now' } : d))
    show({ title: 'Preview ready', body: 'c2d8f10 on fix/webhook-retry · lintang-app-8fq2klm.deploy.21strive.example', tone: 'success' })
  }
}

onMounted(() => {
  clock = window.setInterval(() => (elapsed.value += 1), 1000)
  streamer = window.setInterval(stream, 2600)
})
onBeforeUnmount(() => {
  clearInterval(clock)
  clearInterval(streamer)
})

/* ── Selection ───────────────────────────────────────────────────────────── */
const selected = computed(() => list.value.find((d) => d.id === selectedId.value) ?? list.value[0])
const production = computed(() => list.value.find((d) => d.id === productionId.value)!)

const STATUS: Record<DeployStatus, { tone: StatusTone; label: string }> = {
  ready: { tone: 'success', label: 'Ready' },
  failed: { tone: 'danger', label: 'Failed' },
  building: { tone: 'signal', label: 'Building' },
  canceled: { tone: 'neutral', label: 'Canceled' },
}

function describe(id: StepId, d: Deployment): string {
  const s = d.steps[id]
  if (s.state === 'complete') return [s.seconds != null ? `${s.seconds} s` : '', s.note].filter(Boolean).join(' · ')
  if (s.state === 'current') return s.note ?? 'Running'
  if (s.state === 'error') return [s.note, s.seconds != null ? `after ${s.seconds} s` : ''].filter(Boolean).join(' · ')
  return s.note ?? 'Waiting'
}

const steps = computed<StepItem[]>(() =>
  STEP_ORDER.map((id) => ({ label: STEP_LABELS[id], description: describe(id, selected.value), status: selected.value.steps[id].state })),
)
const currentStep = computed(() => {
  const i = STEP_ORDER.findIndex((id) => selected.value.steps[id].state === 'current' || selected.value.steps[id].state === 'error')
  return i < 0 ? STEP_ORDER.length : i
})

const clockText = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
const buildTime = computed(() => clockText(selected.value.status === 'building' ? elapsed.value : selected.value.duration))

const logText = computed(() => selected.value.log.join('\n'))
const logBox = ref<HTMLElement | null>(null)

/** A live build follows its tail; a failed one opens on its first error line. */
function placeLog() {
  nextTick(() => {
    const scroller = logBox.value?.querySelector<HTMLElement>('.r-code__scroll')
    if (!scroller) return
    if (selected.value.status === 'building') {
      scroller.scrollTop = scroller.scrollHeight
      return
    }
    const first = scroller.querySelector<HTMLElement>('.is-highlighted')
    scroller.scrollTop = first ? Math.max(0, first.offsetTop - scroller.clientHeight / 2) : 0
  })
}
watch(() => [selected.value.id, selected.value.log.length, tab.value], placeLog)
onMounted(placeLog)

function select(id: string) {
  selectedId.value = id
}

/* ── History table ───────────────────────────────────────────────────────── */
const columns: TableColumn[] = [
  { key: 'id', label: 'Deployment', width: '200px' },
  { key: 'message', label: 'Commit' },
  { key: 'branch', label: 'Branch', width: '190px' },
  { key: 'author', label: 'Author', width: '170px' },
  { key: 'status', label: 'Status', width: '120px' },
  { key: 'duration', label: 'Duration', width: '92px', numeric: true },
  { key: 'age', label: 'Age', width: '96px', align: 'right' },
  { key: 'actions', label: 'Actions', width: '52px', align: 'right' },
]

const menuFor = ref<string | null>(null)
function rowMenu(d: Deployment): MenuItem[] {
  const isProd = d.id === productionId.value
  return [
    { id: 'logs', label: 'Inspect build log', onSelect: () => select(d.id) },
    {
      id: 'promote',
      label: d.target === 'production' && !isProd ? 'Roll back to this' : 'Promote to production',
      icon: d.target === 'production' && !isProd ? RotateCcw : ArrowUpFromLine,
      disabled: d.status !== 'ready' || isProd,
      onSelect: () => ask(d.target === 'production' ? 'rollback' : 'promote', d),
    },
    { id: 'copy', label: 'Copy deployment URL', icon: Copy, onSelect: () => copyUrl(d) },
    { id: 'redeploy', label: 'Redeploy', icon: RefreshCw, disabled: d.status === 'building', onSelect: () => redeploy(d) },
    { divider: true },
    { id: 'cancel', label: 'Cancel build', icon: Square, danger: true, disabled: d.status !== 'building', onSelect: () => cancelBuild(d) },
  ]
}

async function copyUrl(d: Deployment) {
  try {
    await navigator.clipboard?.writeText(`https://${d.url}`)
  } catch {
    /* clipboard blocked */
  }
  show({ title: 'URL copied', body: d.url, tone: 'success', duration: 2600 })
}

function redeploy(d: Deployment) {
  show({ title: 'Redeploy queued', body: `${d.sha} on ${d.branch} starts after the current build.`, tone: 'neutral' })
}

function cancelBuild(d: Deployment) {
  clearInterval(streamer)
  clearInterval(clock)
  list.value = list.value.map((x) =>
    x.id === d.id
      ? {
          ...x,
          status: 'canceled',
          duration: elapsed.value,
          steps: Object.fromEntries(
            STEP_ORDER.map((id) => [id, x.steps[id].state === 'current' ? { state: 'error', note: 'Canceled by you' } : x.steps[id]]),
          ) as Deployment['steps'],
          log: [...x.log, `04:47:${String(elapsed.value % 60).padStart(2, '0')}.000  Canceled by Nadia Rahman`],
        }
      : x,
  )
  show({ title: 'Build canceled', body: `${d.sha} on ${d.branch}`, tone: 'neutral' })
}

/* ── Promote and roll back, behind a confirmation ────────────────────────── */
const confirmOpen = ref(false)
const confirmKind = ref<'promote' | 'rollback'>('rollback')
const confirmTarget = ref<Deployment | null>(null)

const rollbackTarget = computed(() =>
  list.value.find((d) => d.target === 'production' && d.status === 'ready' && d.id !== productionId.value && list.value.indexOf(d) > list.value.indexOf(production.value)),
)
const canPromote = computed(() => selected.value.status === 'ready' && selected.value.id !== productionId.value)

function ask(kind: 'promote' | 'rollback', target?: Deployment) {
  const t = target ?? (kind === 'rollback' ? rollbackTarget.value : selected.value)
  if (!t) return
  confirmKind.value = kind
  confirmTarget.value = t
  confirmOpen.value = true
}

function confirm(close: () => void) {
  const t = confirmTarget.value
  if (!t) return
  const before = productionId.value
  list.value = list.value.map((d) => (d.id === t.id ? { ...d, target: 'production' } : d))
  productionId.value = t.id
  close()
  show({
    title: confirmKind.value === 'rollback' ? 'Rolled back' : 'Promoted to production',
    body: `${PROJECT.domain} now serves ${t.sha} · ${t.message}`,
    tone: 'success',
    action: { label: 'Undo', onClick: () => (productionId.value = before) },
  })
}
</script>

<template>
  <SampleShell product="Deploy" padding="none">
    <template #strip>
      <span class="s-dep__path">/ {{ PROJECT.team }} / {{ PROJECT.name }}</span>
    </template>
    <template #meta>
      <span class="s-dep__wide">03 Nov 2026 · 04:47 UTC</span>
      <span class="s-dep__narrow">04:47 UTC</span>
    </template>
    <template #header>
      <div class="s-dep__title">
        <p class="r-eyebrow">Project · {{ PROJECT.team }}</p>
        <div class="s-dep__title-row">
          <h1 class="r-h3">{{ PROJECT.name }}</h1>
          <RStatus tone="success" label="Production ready" size="sm" />
        </div>
      </div>
    </template>
    <template #actions>
      <RButton variant="outline" size="sm" :disabled="!rollbackTarget" @click="ask('rollback')">
        <template #leading><RotateCcw /></template>
        Roll back
      </RButton>
      <RButton tone="brand" size="sm" :disabled="!canPromote" @click="ask('promote')">
        <template #leading><ArrowUpFromLine /></template>
        Promote {{ canPromote ? selected.sha : '' }}
      </RButton>
    </template>

    <section class="s-dep__facts r-grid-ruled" aria-label="Project">
      <div class="s-dep__fact">
        <span class="r-label">Production</span>
        <span class="s-dep__fact-value"><Globe class="s-dep__icon" />{{ PROJECT.domain }}</span>
      </div>
      <div class="s-dep__fact">
        <span class="r-label">Serving</span>
        <span class="s-dep__fact-value r-mono">{{ production.sha }} · {{ production.id }}</span>
      </div>
      <div class="s-dep__fact">
        <span class="r-label">Production branch</span>
        <span class="s-dep__fact-value r-mono"><GitBranch class="s-dep__icon" />{{ PROJECT.productionBranch }}</span>
      </div>
      <div class="s-dep__fact">
        <span class="r-label">Repository</span>
        <span class="s-dep__fact-value r-mono">{{ PROJECT.repo }}</span>
      </div>
    </section>

    <div class="s-dep__tabs">
      <RTabs v-model="tab" :items="tabs" label="Project sections" />
    </div>

    <div v-if="tab === 'overview'" class="s-dep__body">
      <div class="s-dep__row">
        <RCard index="01" :eyebrow="`${selected.target === 'production' ? 'Production' : 'Preview'} · ${selected.id}`" padding="none" class="s-dep__detail">
          <template #header>
            <h2 class="s-dep__commit">{{ selected.message }}</h2>
            <p class="s-dep__byline">
              <RAvatar :name="selected.author" size="xs" decorative />
              <span>{{ selected.author }}</span>
              <span class="r-mono s-dep__sha">{{ selected.sha }}</span>
              <span class="r-mono s-dep__branch"><GitBranch class="s-dep__icon" />{{ selected.branch }}</span>
              <span class="r-text-tertiary">{{ selected.started }}</span>
            </p>
          </template>
          <template #actions>
            <div class="s-dep__detail-aside">
              <RStatus :tone="STATUS[selected.status].tone" :label="STATUS[selected.status].label" :pulse="selected.status === 'building'" />
              <RReadout label="Build time" :value="buildTime" font="pixel" size="sm" ghost="88:88" align="right" />
            </div>
          </template>

          <div class="s-dep__run">
            <div class="s-dep__steps">
              <p class="r-label">Pipeline</p>
              <RSteps :items="steps" :current="currentStep" orientation="vertical" size="sm" />
            </div>
            <div ref="logBox" class="s-dep__log" :class="{ 'is-error': selected.status === 'failed' || selected.status === 'canceled' }">
              <RCodeBlock
                :code="logText"
                line-numbers
                :highlight="selected.errorLines"
                max-height="332px"
                :title="`Build log · ${selected.log.length} lines`"
                language="UTC"
              />
            </div>
          </div>
        </RCard>

        <RCard
          index="02"
          eyebrow="Environment"
          :title="selected.id === productionId ? 'Production' : 'Preview'"
          :subtitle="selected.id === productionId ? PROJECT.domain : selected.url"
          class="s-dep__env"
        >
          <RSpecList
            dense
            :items="[
              { label: 'Status', value: STATUS[selected.status].label, tone: STATUS[selected.status].tone },
              { label: 'Deployment', value: selected.id, mono: true },
              ...environment,
            ]"
          />
        </RCard>
      </div>

      <RCard index="03" eyebrow="History" title="Deployments" :meta="`${list.length} in the last 7 days`" padding="none" class="s-dep__history">
        <RTable :columns="columns" :rows="list" :selected="[selectedId]" density="compact" caption="Deployments of lintang-app" @row-click="(row) => select(row.id)">
          <template #header-actions><span class="r-sr-only">Actions</span></template>
          <template #cell-id="{ row }">
            <span class="s-dep__id-cell">
              <button type="button" class="s-dep__id r-mono" :aria-pressed="row.id === selectedId" @click.stop="select(row.id)">{{ row.id }}</button>
              <RBadge v-if="row.id === productionId" tone="brand" size="sm">Current</RBadge>
              <span v-else class="r-label">{{ row.target === 'production' ? 'Prod' : 'Preview' }}</span>
            </span>
          </template>
          <template #cell-message="{ row }">
            <span class="s-dep__msg-cell">
              <span class="r-mono s-dep__sha">{{ row.sha }}</span>
              <span class="s-dep__msg" :title="row.message">{{ row.message }}</span>
            </span>
          </template>
          <template #cell-branch="{ row }">
            <span class="r-mono s-dep__branch"><GitBranch class="s-dep__icon" />{{ row.branch }}</span>
          </template>
          <template #cell-author="{ row }">
            <span class="s-dep__author"><RAvatar :name="row.author" size="xs" decorative />{{ row.author }}</span>
          </template>
          <template #cell-status="{ row }">
            <RStatus :tone="STATUS[row.status as DeployStatus].tone" :label="STATUS[row.status as DeployStatus].label" :pulse="row.status === 'building'" size="sm" />
          </template>
          <template #cell-duration="{ row }">
            <span class="r-mono">{{ row.status === 'building' ? fmtDuration(elapsed) : fmtDuration(row.duration) }}</span>
          </template>
          <template #cell-age="{ row }">
            <span class="r-text-tertiary">{{ row.age }}</span>
          </template>
          <template #cell-actions="{ row }">
            <span @click.stop>
              <RPopover :open="menuFor === row.id" kind="menu" placement="bottom-end" @update:open="(o: boolean) => (menuFor = o ? row.id : null)">
                <template #trigger>
                  <RIconButton :label="`Actions for ${row.id}`" variant="ghost" size="xs"><EllipsisVertical /></RIconButton>
                </template>
                <RMenu :items="rowMenu(row as Deployment)" :label="`Actions for ${row.id}`" @close="menuFor = null" />
              </RPopover>
            </span>
          </template>
        </RTable>
      </RCard>
    </div>

    <div v-else-if="tab === 'logs'" class="s-dep__body">
      <LogsPane />
    </div>

    <div v-else class="s-dep__body">
      <SettingsPane />
    </div>

    <RDialog
      v-model:open="confirmOpen"
      :eyebrow="confirmKind === 'rollback' ? 'Roll back production' : 'Promote to production'"
      :title="confirmKind === 'rollback' ? `Serve ${confirmTarget?.sha} again?` : `Promote ${confirmTarget?.sha}?`"
      size="md"
    >
      <div class="s-dep__confirm">
        <p class="r-body-sm r-text-secondary">
          Traffic on {{ PROJECT.domain }} switches at once. Nothing is rebuilt: the edge serves the files that
          {{ confirmTarget?.id }} uploaded.
        </p>
        <RSpecList
          dense
          :items="[
            { label: 'Now serving', value: `${production.sha} · ${production.message}` },
            { label: 'Will serve', value: `${confirmTarget?.sha} · ${confirmTarget?.message}` },
            { label: 'Built', value: confirmTarget?.started ?? '' },
            { label: 'Domain', value: PROJECT.domain, mono: true },
          ]"
        />
        <RAlert tone="warning" title="The edge cache is purged">
          Expect the cache hit ratio on lintang.example to dip for about an hour while assets are fetched again.
        </RAlert>
      </div>
      <template #footer="{ close }">
        <RButton variant="outline" @click="close">Cancel</RButton>
        <RButton :tone="confirmKind === 'rollback' ? 'neutral' : 'brand'" @click="confirm(close)">
          <template #leading><RotateCcw v-if="confirmKind === 'rollback'" /><ArrowUpFromLine v-else /></template>
          {{ confirmKind === 'rollback' ? 'Roll back' : 'Promote' }}
        </RButton>
      </template>
    </RDialog>
  </SampleShell>
</template>

<style scoped>
.s-dep__path {
  color: var(--r-text-tertiary);
}
.s-dep__narrow {
  display: none;
}

.s-dep__title {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.s-dep__title .r-eyebrow {
  color: var(--r-text-tertiary);
}
.s-dep__title-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 14px;
}

.s-dep__facts {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  border-top: 0;
  border-left: 0;
}
.s-dep__fact {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  padding: 10px 24px 12px;
}
.s-dep__fact:last-child {
  border-right: 0;
}
.s-dep__fact-value {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  overflow: hidden;
  font-size: var(--r-text-sm);
  text-overflow: ellipsis;
  white-space: nowrap;
}
.s-dep__icon {
  width: 14px;
  height: 14px;
  color: var(--r-text-tertiary);
}

.s-dep__tabs {
  padding: 0 24px;
  border-bottom: 1px solid var(--r-border);
  background: var(--r-bg-surface);
}
.s-dep__tabs :deep(.r-tabs__list) {
  border-bottom: 0;
}

.s-dep__body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px 24px 32px;
}

.s-dep__row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  align-items: stretch;
  gap: 16px;
}

/* Deployment detail */
.s-dep__detail {
  gap: 0;
}
.s-dep__commit {
  font-size: var(--r-text-lg);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-snug);
  line-height: 1.3;
}
.s-dep__byline {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 12px;
  margin-top: 6px;
  color: var(--r-text-secondary);
  font-size: var(--r-text-sm);
}
.s-dep__byline > :first-child {
  margin-right: -4px;
}
.s-dep__sha {
  color: var(--r-text);
}
.s-dep__branch {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--r-text-secondary);
}
.s-dep__detail-aside {
  display: flex;
  align-items: flex-end;
  gap: 20px;
}

.s-dep__run {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  margin-top: 16px;
  border-top: 1px solid var(--r-border);
}
.s-dep__steps {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 20px;
  border-right: 1px solid var(--r-border);
}
.s-dep__log {
  min-width: 0;
}
.s-dep__log :deep(.r-code) {
  border: 0;
}
/* A failed run marks its error lines in danger: the block's highlight reads the brand tokens. */
.s-dep__log.is-error {
  --r-brand: var(--r-danger);
  --r-brand-soft: var(--r-danger-soft);
  --r-brand-text: var(--r-danger-text);
}

.s-dep__env {
  min-width: 0;
}
.s-dep__env :deep(.r-card__subtitle) {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
  overflow-wrap: anywhere;
}

/* History */
.s-dep__id-cell,
.s-dep__msg-cell,
.s-dep__author {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  max-width: 100%;
}
.s-dep__msg-cell {
  display: grid;
  grid-template-columns: max-content minmax(0, max-content);
  min-width: 220px;
}
.s-dep__msg {
  overflow: hidden;
  text-overflow: ellipsis;
}
.s-dep__id {
  padding: 0;
  border: 0;
  background: none;
  color: var(--r-text);
  font-size: var(--r-text-sm);
  text-decoration: underline;
  text-decoration-color: var(--r-border-strong);
  text-underline-offset: 3px;
  cursor: pointer;
}
.s-dep__id:hover {
  text-decoration-color: currentColor;
}

.s-dep__confirm {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

@media (max-width: 1199px) {
  .s-dep__row {
    grid-template-columns: minmax(0, 1fr);
  }
  .s-dep__facts {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .s-dep__fact:nth-child(2) {
    border-right: 0;
  }
}

@media (max-width: 760px) {
  .s-dep__run {
    grid-template-columns: minmax(0, 1fr);
  }
  .s-dep__steps {
    border-right: 0;
    border-bottom: 1px solid var(--r-border);
  }
}

@media (max-width: 640px) {
  .s-dep__path,
  .s-dep__wide {
    display: none;
  }
  .s-dep__narrow {
    display: inline;
  }
  .s-dep__facts {
    grid-template-columns: minmax(0, 1fr);
  }
  .s-dep__fact {
    border-right: 0;
    padding: 10px 16px;
  }
  .s-dep__tabs {
    padding: 0 16px;
  }
  .s-dep__body {
    padding: 16px 16px 96px;
  }
}
</style>
