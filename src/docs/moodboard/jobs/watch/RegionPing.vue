<script setup lang="ts">
/**
 * Round-trip time to a set of places, refreshed every few seconds: the last reading, a word for it
 * (OK, Slow, Loss) and the recent pings as columns. Pick a row to read its median, 95th percentile
 * and losses; Ping now sends a round at once instead of waiting.
 */
import { computed, onBeforeUnmount, ref, shallowRef, watch } from 'vue'
import { RefreshCw } from 'lucide-vue-next'
import { RButton, RIconButton, RStatus } from '@/design-system'
import { num, seeded, time, useTick, type Zone } from '../../kit'
import { columnsPath, stepKey } from './shared'

interface Target {
  /** Short code in mono: "CGK", "SIN-2". */
  code: string
  name: string
  /** Typical round trip, ms. */
  base: number
  /** How much it wanders, as a share of base. */
  vol?: number
  /** Chance a ping is lost, 0–1. */
  loss?: number
}

const props = withDefaults(
  defineProps<{
    eyebrow: string
    targets: Target[]
    /** Slow from here, ms. */
    slow: number
    /** Seconds between rounds. */
    every?: number
    seed: string
    zone?: Zone
    layout?: 'list' | 'single'
  }>(),
  { every: 2, zone: 'WIB', layout: 'list' },
)

const N = 16
const rnd = seeded(props.seed)
const sample = (t: Target): number | null => {
  if (rnd() < (t.loss ?? 0)) return null
  const spike = rnd() < 0.05 ? 1.8 : 1
  return Math.max(1, Math.round(t.base * (1 + (rnd() - 0.5) * 2 * (t.vol ?? 0.12)) * spike))
}
const history = shallowRef(props.targets.map((t) => Array.from({ length: N }, () => sample(t))))
const last = ref(new Date())
const pinging = ref(false)

function round() {
  history.value = history.value.map((list, i) => [...list.slice(1), sample(props.targets[i])])
  last.value = new Date()
}
const tick = useTick(props.every * 1000)
watch(tick, round)

let flash: number | undefined
onBeforeUnmount(() => window.clearTimeout(flash))
function pingNow() {
  round()
  pinging.value = true
  window.clearTimeout(flash)
  flash = window.setTimeout(() => (pinging.value = false), 600)
}

const latest = (i: number) => history.value[i][N - 1]
const stateOf = (i: number) => {
  const v = latest(i)
  const lost = history.value[i].filter((x) => x == null).length
  if (v == null || lost >= 3) return { tone: 'danger' as const, label: 'Loss' }
  if (v >= props.slow) return { tone: 'warning' as const, label: 'Slow' }
  return { tone: 'success' as const, label: 'OK' }
}

const picked = ref(0)
const stats = computed(() => {
  const list = history.value[picked.value]
  const got = list.filter((x): x is number => x != null).sort((a, b) => a - b)
  const q = (p: number) => (got.length ? got[Math.min(got.length - 1, Math.floor(p * got.length))] : 0)
  return { p50: q(0.5), p95: q(0.95), lost: N - got.length }
})

/** The recent pings as columns, drawn on a 100-wide box that stretches to its cell. */
const cols = (i: number, h: number) => {
  const list = history.value[i]
  const max = Math.max(props.slow * 1.4, ...list.map((x) => x ?? 0))
  return columnsPath(list.map((x) => x ?? 0), 100, h, max, 2)
}

function onKeydown(event: KeyboardEvent) {
  const next = stepKey(event, picked.value, props.targets.length)
  if (next == null) return
  picked.value = next
  ;(event.currentTarget as HTMLElement).querySelectorAll<HTMLElement>('[role="radio"]')[next]?.focus()
}
</script>

<template>
  <div class="mk ping" :class="`ping--${layout}`">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <span class="mk-row ping__meta">
        <span v-if="layout !== 'single'" class="r-label">{{ time(last, zone, true) }}</span>
        <RIconButton v-if="layout === 'single'" label="Ping now" size="xs" variant="ghost" @click="pingNow">
          <RefreshCw :size="14" />
        </RIconButton>
        <RButton v-else size="xs" variant="outline" :loading="pinging" @click="pingNow">
          <template #leading><RefreshCw :size="14" /></template>
          Ping now
        </RButton>
      </span>
    </div>

    <template v-if="layout === 'single'">
      <p class="ping__big">
        <span class="mk-fig">{{ latest(0) == null ? 'Lost' : num(latest(0)!) }}</span>
        <span v-if="latest(0) != null" class="mk-unit">ms</span>
        <RStatus :tone="stateOf(0).tone" shape="square" size="sm" :label="stateOf(0).label" class="ping__word" />
      </p>
      <div class="ping__strip mk-grow">
        <svg viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true">
          <path :d="cols(0, 40)" />
        </svg>
      </div>
      <p class="ping__quiet mk-truncate">{{ targets[0].name }} · p95 {{ num(stats.p95) }} ms · {{ stats.lost }} lost</p>
    </template>

    <template v-else>
      <div class="ping__rows mk-grow" role="radiogroup" :aria-label="`${eyebrow} targets`" @keydown="onKeydown">
        <button
          v-for="(t, i) in targets"
          :key="t.code"
          type="button"
          role="radio"
          class="ping__row mk-reset"
          :class="{ 'is-picked': i === picked }"
          :aria-checked="i === picked"
          :tabindex="i === picked ? 0 : -1"
          @click="picked = i"
        >
          <span class="ping__code">{{ t.code }}</span>
          <span class="ping__name mk-truncate">{{ t.name }}</span>
          <RStatus :tone="stateOf(i).tone" shape="square" size="sm" :label="stateOf(i).label" class="ping__state" />
          <span class="ping__ms">{{ latest(i) == null ? '—' : `${num(latest(i)!)} ms` }}</span>
          <span class="ping__cols">
            <svg viewBox="0 0 100 14" preserveAspectRatio="none" aria-hidden="true"><path :d="cols(i, 14)" /></svg>
          </span>
        </button>
      </div>
      <p class="ping__detail mk-truncate" aria-live="polite">
        <span class="ping__pick">{{ targets[picked].code }}</span>
        <span class="ping__pick-name">{{ targets[picked].name }} ·</span>
        p50 {{ num(stats.p50) }} ms · p95 {{ num(stats.p95) }} ms · {{ stats.lost }} of {{ N }} lost
      </p>
    </template>
  </div>
</template>

<style scoped>
.ping {
  container-type: inline-size;
  gap: 8px;
}

.ping__pick-name {
  display: none;
  margin-right: 4px;
}


.ping__meta {
  flex: none;
  gap: 8px;
}

.ping__rows {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.ping__row {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) 54px 58px minmax(40px, 30%);
  align-items: center;
  gap: 8px;
  padding: 4px 6px 4px 4px;
  border-top: 1px solid var(--r-border-subtle);
  border-left: 2px solid transparent;
  cursor: pointer;
  font-size: var(--r-text-xs);
}

.ping__row:last-child {
  border-bottom: 1px solid var(--r-border-subtle);
}

.ping__row:hover {
  background: var(--r-bg-hover);
}

.ping__row.is-picked {
  border-left-color: var(--r-brand);
  background: var(--r-bg-selected);
}

.ping__row:focus-visible {
  outline: 2px solid var(--r-focus);
  outline-offset: -2px;
}

.ping__code {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: 0.04em;
}

.ping__name {
  color: var(--r-text-secondary);
}

.ping__ms {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.ping__cols {
  display: block;
  min-width: 0;
  height: 14px;
}

.ping__cols svg,
.ping__strip svg {
  display: block;
  width: 100%;
  height: 100%;
}

.ping__cols path,
.ping__strip path {
  fill: var(--r-chart-context);
}

.ping__row.is-picked .ping__cols path {
  fill: var(--r-chart-1);
}

.ping__detail {
  flex: none;
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-variant-numeric: tabular-nums;
}

.ping__pick {
  margin-right: 6px;
  color: var(--r-text);
  font-weight: var(--r-weight-semibold);
}

.ping__big {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.ping__big .mk-fig {
  font-size: var(--r-text-2xl);
}

.ping--single {
  gap: 6px;
}

.ping__word {
  margin-left: auto;
  align-self: center;
}

.ping__quiet {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-variant-numeric: tabular-nums;
}

.ping__strip {
  min-height: 16px;
}

.ping__strip svg {
  width: 100%;
  height: 100%;
}

.ping__strip path {
  fill: var(--r-chart-1);
}
/* Narrow: the codes stay, the names move to the line under the rows. */
@container (max-width: 400px) {
  .ping__row {
    grid-template-columns: 40px 54px 56px minmax(40px, 1fr);
  }
  .ping__name {
    display: none;
  }
  .ping__pick-name {
    display: inline;
  }
}
</style>
