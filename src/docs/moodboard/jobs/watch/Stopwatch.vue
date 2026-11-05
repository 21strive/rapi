<script setup lang="ts">
/**
 * A stopwatch for work done against the clock: resuscitation rounds, a standup, loading a truck, a
 * studio take. Start, lap and stop are the whole instrument. Laps list newest first with the
 * fastest named; a cycle, if set, counts down to the next check.
 */
import { computed, ref, watch } from 'vue'
import { Flag, Play, RotateCcw, Square } from 'lucide-vue-next'
import { RButton, RIconButton, RStatus } from '@/design-system'
import { clock, signed, useTick } from '../../kit'
import PixelDigits from './PixelDigits.vue'

const props = withDefaults(
  defineProps<{
    label: string
    sub?: string
    lapNoun?: string
    /** Accessible name of the lap key: "Next speaker", "Pallet loaded". */
    lapAction?: string
    /** Running when the tile opens, started this many seconds ago. Leave out for a stopwatch at zero. */
    startedAgo?: number
    /** Earlier laps in seconds, oldest first. Their sum must not pass `startedAgo`. */
    laps?: number[]
    /** Seconds per cycle: counts down to the next check, as in CPR rounds. */
    cycle?: number
    cycleLabel?: string
    /** A lap longer than this is over time. */
    target?: number
    tenths?: boolean
    font?: 'sans' | 'pixel'
    layout?: 'card' | 'tall' | 'strip' | 'mini'
  }>(),
  { lapNoun: 'Lap', lapAction: 'Lap', laps: () => [], cycleLabel: 'Next check', tenths: false, font: 'sans', layout: 'card' },
)

const tick = useTick(props.tenths ? 100 : 500)
const now = ref(Date.now())
const running = ref(props.startedAgo != null)
const base = ref(0)
const runFrom = ref(Date.now() - (props.startedAgo ?? 0) * 1000)
const laps = ref<number[]>(props.laps.map((s) => s * 1000))
const lastLapAt = ref(laps.value.reduce((a, b) => a + b, 0))

watch(tick, () => {
  if (running.value) now.value = Date.now()
})

const elapsed = computed(() => base.value + (running.value ? Math.max(0, now.value - runFrom.value) : 0))
const lapNow = computed(() => elapsed.value - lastLapAt.value)

function fmt(ms: number, tenths = props.tenths) {
  const text = clock(Math.floor(ms / 1000))
  return tenths ? `${text}.${Math.floor((ms % 1000) / 100)}` : text
}

function start() {
  runFrom.value = Date.now()
  now.value = runFrom.value
  running.value = true
}
function stop() {
  base.value += Date.now() - runFrom.value
  now.value = Date.now()
  running.value = false
}
function lap() {
  laps.value = [...laps.value, lapNow.value]
  lastLapAt.value = elapsed.value
}
function reset() {
  base.value = 0
  laps.value = []
  lastLapAt.value = 0
}

const best = computed(() => (laps.value.length > 1 ? Math.min(...laps.value) : null))
const lapRows = computed(() =>
  laps.value
    .map((ms, i) => ({
      n: i + 1,
      ms,
      delta: i ? (ms - laps.value[i - 1]) / 1000 : null,
      best: ms === best.value,
      over: props.target != null && ms > props.target * 1000,
    }))
    .reverse(),
)

const nextCheck = computed(() => (props.cycle ? props.cycle - ((elapsed.value / 1000) % props.cycle) : null))
const status = computed(() => {
  if (running.value && nextCheck.value != null && nextCheck.value <= 15)
    return { tone: 'warning' as const, label: `${props.cycleLabel} in ${Math.ceil(nextCheck.value)} s`, pulse: false }
  if (running.value) return { tone: 'signal' as const, label: 'Running', pulse: true }
  return { tone: 'neutral' as const, label: elapsed.value ? 'Stopped' : 'Ready', pulse: false }
})
const lapOver = computed(() => props.target != null && lapNow.value > props.target * 1000)
</script>

<template>
  <div class="mk sw" :class="`sw--${layout}`">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ label }}</span>
      <RStatus v-if="layout !== 'mini'" :tone="status.tone" :pulse="status.pulse" size="sm" :label="status.label" />
    </div>
    <p v-if="sub && layout !== 'mini'" class="sw__sub mk-truncate">{{ sub }}</p>

    <div class="sw__main">
      <p class="sw__time" :aria-label="`Elapsed ${fmt(elapsed)}`">
        <PixelDigits v-if="font === 'pixel'" class="sw__digits sw__digits--pixel" :value="fmt(elapsed)" ghost />
        <span v-else class="sw__digits mk-fig">{{ fmt(elapsed) }}</span>
      </p>
      <div class="sw__keys">
        <RIconButton
          v-if="layout === 'mini'"
          :label="running ? 'Stop' : elapsed ? 'Continue' : 'Start'"
          size="xs"
          variant="solid"
          :tone="running ? 'neutral' : 'brand'"
          @click="running ? stop() : start()"
        >
          <Square v-if="running" :size="14" />
          <Play v-else :size="14" />
        </RIconButton>
        <RButton v-else-if="!running" size="xs" tone="brand" @click="start">
          <template #leading><Play :size="14" /></template>
          {{ elapsed ? 'Continue' : 'Start' }}
        </RButton>
        <RButton v-else size="xs" @click="stop">
          <template #leading><Square :size="14" /></template>
          Stop
        </RButton>
        <RIconButton v-if="running" :label="lapAction" size="xs" @click="lap">
          <Flag :size="14" />
        </RIconButton>
        <RIconButton v-else label="Reset" size="xs" variant="ghost" :disabled="!elapsed" @click="reset">
          <RotateCcw :size="14" />
        </RIconButton>
      </div>
    </div>

    <p class="sw__lap mk-truncate">
      <span>{{ lapNoun }} {{ laps.length + 1 }}</span>
      <span class="sw__lap-time" :class="{ 'is-over': lapOver }">{{ fmt(lapNow, false) }}{{ lapOver ? ' · over' : '' }}</span>
      <span v-if="nextCheck != null && layout !== 'mini'" class="sw__check">{{ cycleLabel }} in {{ clock(Math.ceil(nextCheck)) }}</span>
    </p>

    <ol v-if="layout === 'card' || layout === 'tall'" class="sw__laps mk-grow" :aria-label="`${lapNoun}s, newest first`">
      <li v-for="row in lapRows" :key="row.n" class="sw__row">
        <span class="sw__n">{{ lapNoun }} {{ row.n }}</span>
        <span class="sw__ms">{{ fmt(row.ms, false) }}</span>
        <span class="sw__delta">{{ row.delta == null ? '' : signed(row.delta, 0, ' s') }}</span>
        <span class="sw__tag">
          <template v-if="row.over">Over</template>
          <template v-else-if="row.best">Best</template>
        </span>
      </li>
      <li v-if="!lapRows.length" class="sw__empty">No {{ lapNoun.toLowerCase() }}s yet</li>
    </ol>
  </div>
</template>

<style scoped>
.sw {
  container-type: inline-size;
  gap: 6px;
}

.sw__sub {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

.sw__main {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sw__time {
  min-width: 0;
  white-space: nowrap;
}

.sw__digits {
  font-size: var(--r-text-3xl);
}

.sw__digits--pixel {
  font-size: 30px;
}

.sw__keys {
  display: flex;
  gap: 6px;
}

.sw__lap {
  display: flex;
  align-items: baseline;
  gap: 8px;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-variant-numeric: tabular-nums;
}

.sw__lap-time {
  color: var(--r-text);
}

.sw__lap-time.is-over {
  color: var(--r-warning-text);
}

.sw__check {
  margin-left: auto;
}

.sw__laps {
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  overflow: hidden;
  border-top: 1px solid var(--r-border-subtle);
  list-style: none;
}

.sw__row {
  display: grid;
  flex: none;
  grid-template-columns: minmax(0, 1fr) auto 44px 34px;
  align-items: baseline;
  gap: 8px;
  padding: 4px 0;
  border-bottom: 1px solid var(--r-border-subtle);
  font-size: var(--r-text-xs);
}

.sw__n {
  overflow: hidden;
  color: var(--r-text-secondary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sw__ms,
.sw__delta {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.sw__delta {
  color: var(--r-text-tertiary);
}

.sw__tag {
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.06em;
  text-align: right;
  text-transform: uppercase;
}

.sw__empty {
  padding: 6px 0;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

.sw--tall .sw__row {
  grid-template-columns: minmax(0, 1fr) auto 30px;
}
.sw--tall .sw__delta {
  display: none;
}

.sw--mini .sw__digits {
  font-size: var(--r-text-2xl);
}
.sw--mini .sw__digits--pixel {
  font-size: 28px;
}

@container (min-width: 300px) {
  .sw__main {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
  .sw__digits {
    font-size: var(--r-text-4xl);
  }
  .sw__digits--pixel {
    font-size: 40px;
  }
}
</style>
