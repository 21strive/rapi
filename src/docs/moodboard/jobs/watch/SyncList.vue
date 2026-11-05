<script setup lang="ts">
/**
 * Things moving between here and there: map regions, scans, survey forms, photos. Each row has a
 * word for its state, a thin bar and its speed; two move at once and the rest wait. A failed row
 * offers Retry; Pause holds everything and says so.
 */
import { computed, ref, shallowRef, watch } from 'vue'
import { Pause, Play, RotateCcw } from 'lucide-vue-next'
import { RButton, RIconButton, RStatus } from '@/design-system'
import { num, seeded, useTick } from '../../kit'
import { bytes, minutes } from './shared'

interface Item {
  name: string
  sizeMb: number
  /** Share done when the tile opens. */
  done?: number
  /** MB a second while it moves. */
  rate: number
  /** It fails once at this share and waits for Retry. */
  failAt?: number
}

const props = withDefaults(
  defineProps<{
    eyebrow: string
    /** Up or down: the words and the arrow of the speed. */
    direction?: 'up' | 'down'
    items?: Item[]
    /** For a single counter of many small files instead of a list. */
    count?: { done: number; total: number; noun: string; perTick: number; current: string[] }
    /** Rows that move at once. */
    parallel?: number
    seed: string
    layout?: 'list' | 'single'
  }>(),
  { direction: 'down', items: () => [], parallel: 2, layout: 'list' },
)

const rnd = seeded(props.seed)
const got = shallowRef(props.items.map((i) => i.sizeMb * (i.done ?? 0)))
const failed = ref(new Set<number>(props.items.flatMap((i, k) => (i.failAt != null && (i.done ?? 0) >= i.failAt ? [k] : []))))
const retried = ref(new Set<number>())
const paused = ref(false)
const speeds = shallowRef(props.items.map(() => 0))

const filesDone = ref(props.count?.done ?? 0)
const fileName = ref(props.count?.current[0] ?? '')

const isDone = (k: number) => got.value[k] >= props.items[k].sizeMb
const moving = computed(() => {
  const out: number[] = []
  props.items.forEach((_, k) => {
    if (out.length < props.parallel && !isDone(k) && !failed.value.has(k)) out.push(k)
  })
  return out
})

const tick = useTick(1000)
watch(tick, () => {
  if (paused.value) {
    speeds.value = speeds.value.map(() => 0)
    return
  }
  if (props.count) {
    filesDone.value = Math.min(props.count.total, filesDone.value + Math.round(props.count.perTick * (0.6 + rnd() * 0.8)))
    fileName.value = props.count.current[Math.floor(rnd() * props.count.current.length)]
    return
  }
  const next = [...got.value]
  const sp = props.items.map(() => 0)
  for (const k of moving.value) {
    const item = props.items[k]
    sp[k] = item.rate * (0.7 + rnd() * 0.6)
    next[k] = Math.min(item.sizeMb, next[k] + sp[k])
    if (item.failAt != null && !retried.value.has(k) && next[k] >= item.sizeMb * item.failAt) {
      next[k] = item.sizeMb * item.failAt
      failed.value = new Set([...failed.value, k])
      sp[k] = 0
    }
  }
  got.value = next
  speeds.value = sp
})

function retry(k: number) {
  retried.value = new Set([...retried.value, k])
  const f = new Set(failed.value)
  f.delete(k)
  failed.value = f
}

type State = 'done' | 'moving' | 'failed' | 'queued' | 'paused'
const stateOf = (k: number): State => {
  if (isDone(k)) return 'done'
  if (failed.value.has(k)) return 'failed'
  if (!moving.value.includes(k)) return 'queued'
  return paused.value ? 'paused' : 'moving'
}
const WORD = computed(() => ({
  done: props.direction === 'up' ? 'Sent' : 'Saved',
  moving: props.direction === 'up' ? 'Sending' : 'Saving',
  failed: 'Failed',
  queued: 'Queued',
  paused: 'Paused',
}))
const TONE = { done: 'success', moving: 'signal', failed: 'danger', queued: 'neutral', paused: 'neutral' } as const

const totalMb = props.items.reduce((a, i) => a + i.sizeMb, 0)
const gotMb = computed(() => got.value.reduce((a, b) => a + b, 0))
const rate = computed(() => speeds.value.reduce((a, b) => a + b, 0))
const left = computed(() => (rate.value > 0 ? (totalMb - gotMb.value) / rate.value / 60 : null))
const summary = computed(() => {
  if (props.count) return `${num(filesDone.value)} of ${num(props.count.total)} ${props.count.noun}`
  return `${bytes(gotMb.value)} of ${bytes(totalMb)}`
})
const share = computed(() => (props.count ? filesDone.value / props.count.total : gotMb.value / totalMb))
const finished = computed(() => share.value >= 1)
</script>

<template>
  <div class="mk sync" :class="`sync--${layout}`">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <RStatus v-if="finished" tone="success" size="sm" label="All done" />
      <RStatus v-else-if="paused" size="sm" label="Paused" />
      <RStatus v-else tone="signal" pulse size="sm" :label="direction === 'up' ? 'Sending' : 'Saving'" />
    </div>

    <div class="sync__total">
      <p class="sync__fig">
        <span class="mk-fig">{{ num(share * 100) }}</span><span class="mk-unit">%</span>
        <span class="sync__summary mk-truncate">{{ summary }}</span>
        <RIconButton v-if="!finished" class="sync__pause" :label="paused ? 'Resume' : 'Pause all'" size="xs" variant="ghost" :pressed="paused" @click="paused = !paused">
          <Play v-if="paused" :size="14" />
          <Pause v-else :size="14" />
        </RIconButton>
      </p>
      <span class="sync__bar"><span :style="{ width: `${share * 100}%` }" /></span>
      <p class="sync__quiet mk-truncate">
        <template v-if="count">{{ paused ? 'Paused' : finished ? 'Backed up' : fileName }}</template>
        <template v-else>{{ paused ? 'Paused by you' : left != null ? `${num(rate, 1)} MB/s · about ${minutes(Math.max(1, left))} left` : finished ? 'Everything is here' : 'Waiting' }}</template>
      </p>
    </div>

    <ol v-if="!count" class="sync__rows mk-grow">
      <li v-for="(item, k) in items" :key="item.name" class="sync__row" :class="`is-${stateOf(k)}`">
        <span class="sync__name mk-truncate">{{ item.name }}</span>
        <RStatus :tone="TONE[stateOf(k)]" :pulse="stateOf(k) === 'moving'" shape="square" size="sm" :label="WORD[stateOf(k)]" />
        <span class="sync__mini"><span :style="{ width: `${(got[k] / item.sizeMb) * 100}%` }" /></span>
        <span class="sync__num">
          <RButton v-if="stateOf(k) === 'failed'" size="xs" variant="outline" @click="retry(k)">
            <template #leading><RotateCcw :size="12" /></template>
            Retry
          </RButton>
          <template v-else>{{ stateOf(k) === 'moving' ? `${num(speeds[k], 1)} MB/s` : bytes(item.sizeMb) }}</template>
        </span>
      </li>
    </ol>
  </div>
</template>

<style scoped>
.sync {
  gap: 8px;
}

.sync__pause {
  flex: none;
  align-self: center;
  margin-left: auto;
}

.sync__total {
  display: flex;
  flex: none;
  flex-direction: column;
  gap: 6px;
}

.sync__fig {
  display: flex;
  align-items: baseline;
  gap: 2px;
  min-width: 0;
}

.sync__fig .mk-fig {
  font-size: var(--r-text-2xl);
}

.sync__summary {
  margin-left: 10px;
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-variant-numeric: tabular-nums;
}

.sync__bar,
.sync__mini {
  display: block;
  background: var(--r-bg-track);
}

.sync__bar {
  height: 6px;
}

.sync__mini {
  height: 4px;
}

.sync__bar span,
.sync__mini span {
  display: block;
  height: 100%;
  background: var(--r-ink);
  transition: width var(--r-duration-slow) var(--r-ease-out);
}

.sync__quiet {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-variant-numeric: tabular-nums;
}

.sync__rows {
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  overflow: hidden;
  border-top: 1px solid var(--r-border-subtle);
  list-style: none;
}

.sync__row {
  display: grid;
  flex: none;
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-areas:
    'name num'
    'state mini';
  align-items: center;
  gap: 4px 10px;
  padding: 6px 0;
  border-bottom: 1px solid var(--r-border-subtle);
  font-size: var(--r-text-xs);
}

.sync__name {
  grid-area: name;
}

.sync__row .r-status {
  grid-area: state;
}

.sync__mini {
  grid-area: mini;
  width: 72px;
}

.sync__num {
  grid-area: num;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.sync__row.is-failed .sync__mini span {
  background: var(--r-danger);
}

@media (prefers-reduced-motion: reduce) {
  .sync__bar span,
  .sync__mini span {
    transition: none;
  }
}
</style>
