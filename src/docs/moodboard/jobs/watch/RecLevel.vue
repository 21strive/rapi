<script setup lang="ts">
/**
 * A recorder: the REC lamp, the running time and the input level, the three things a person checks
 * while recording. Mark drops a marker at the current time; Stop saves the take and says how long
 * and how big it is; Record starts a new one. Levels keep moving while stopped: the input is live.
 */
import { computed, ref, shallowRef, watch } from 'vue'
import { Bookmark, Circle, Square } from 'lucide-vue-next'
import { RButton, RIconButton, RStatus } from '@/design-system'
import { clock, num, reducedMotion, seeded, useNow, useTick } from '../../kit'

const props = withDefaults(
  defineProps<{
    label: string
    sub?: string
    /** Input channels: ["L", "R"] or ["Mic"]. */
    channels?: string[]
    /** Recording when the tile opens, started this many seconds ago. */
    startedAgo?: number
    /** Typical level, 0–1 of the meter. */
    level?: number
    /** Markers already dropped, in seconds from the start. */
    marks?: number[]
    /** File growth, MB a minute. */
    mbPerMin?: number
    seed: string
    layout?: 'strip' | 'tall' | 'mini' | 'card'
  }>(),
  { channels: () => ['L', 'R'], startedAgo: 0, level: 0.62, marks: () => [], mbPerMin: 10.1, layout: 'strip' },
)

const SEG = 20
const SCALE = [
  { at: 0, text: '−48' },
  { at: 0.5, text: '−24' },
  { at: 0.75, text: '−12' },
  { at: 0.875, text: '−6' },
  { at: 1, text: '0' },
]

const now = useNow(1000)
const recording = ref(true)
const startedAt = ref(Date.now() - props.startedAgo * 1000)
const stoppedAt = ref<number | null>(null)
const marks = ref<number[]>([...props.marks])
const elapsed = computed(() => Math.max(0, ((stoppedAt.value ?? now.value.getTime()) - startedAt.value) / 1000))

const rnd = seeded(props.seed)
const levels = shallowRef(props.channels.map(() => props.level))
const peaks = shallowRef(props.channels.map(() => props.level))
const clipAt = ref(0)
const ms = reducedMotion() ? 500 : 100
const tick = useTick(ms)
watch(tick, (n) => {
  const swell = Math.sin(n / 7) * 0.08
  levels.value = levels.value.map(() => Math.min(1, Math.max(0.05, props.level + swell + (rnd() - 0.5) * 0.3 + (rnd() < 0.015 ? 0.4 : 0))))
  peaks.value = peaks.value.map((p, i) => Math.max(levels.value[i], p - 0.02))
  if (levels.value.some((v) => v >= 0.99)) clipAt.value = n
})
const clipping = computed(() => tick.value - clipAt.value < 2000 / ms && clipAt.value > 0)

function stop() {
  recording.value = false
  stoppedAt.value = Date.now()
}
function record() {
  recording.value = true
  startedAt.value = Date.now()
  stoppedAt.value = null
  marks.value = []
}
function mark() {
  marks.value = [...marks.value, elapsed.value]
}

const size = computed(() => `${num((elapsed.value / 60) * props.mbPerMin, 0)} MB`)
const lastMarks = computed(() => [...marks.value].reverse().slice(0, 3))
const lit = (v: number) => Math.round(v * SEG)
const peakSeg = (v: number) => Math.min(SEG, Math.max(1, Math.round(v * SEG)))
</script>

<template>
  <div class="mk rec" :class="`rec--${layout}`">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ label }}</span>
      <RStatus v-if="recording" tone="signal" pulse size="sm" label="Rec" />
      <RStatus v-else tone="neutral" size="sm" label="Saved" />
    </div>
    <p v-if="sub && layout !== 'mini'" class="rec__sub mk-truncate">{{ sub }}</p>

    <div class="rec__main">
      <p class="rec__time">
        <span class="mk-fig">{{ clock(elapsed) }}</span>
        <span v-if="layout !== 'mini'" class="mk-unit">{{ recording ? size : `${size} saved` }}</span>
      </p>
      <div class="rec__keys">
        <RButton v-if="recording" size="xs" aria-label="Stop and save" @click="stop">
          <template #leading><Square :size="14" /></template>
          Stop
        </RButton>
        <RButton v-else size="xs" tone="brand" @click="record">
          <template #leading><Circle :size="14" /></template>
          Record
        </RButton>
        <RIconButton v-if="layout !== 'mini'" :label="`Drop marker ${marks.length + 1}`" size="xs" :disabled="!recording" @click="mark">
          <Bookmark :size="14" />
        </RIconButton>
      </div>
    </div>

    <div class="rec__meters mk-grow" role="img" :aria-label="`Input level ${channels.map((c, i) => `${c} ${Math.round(levels[i] * 100)}%`).join(', ')}`">
      <div v-for="(c, i) in channels" :key="c" class="rec__meter">
        <span class="rec__ch">{{ c }}</span>
        <span class="rec__segs">
          <span
            v-for="s in SEG"
            :key="s"
            :class="{ 'is-on': s <= lit(levels[i]), 'is-peak': s === peakSeg(peaks[i]), 'is-hot': s > SEG - 3, 'is-top': s === SEG }"
          />
        </span>
      </div>
      <div v-if="layout !== 'mini'" class="rec__scale" aria-hidden="true">
        <span v-for="m in SCALE" :key="m.text" :style="{ '--at': m.at }">{{ m.text }}</span>
      </div>
    </div>

    <p class="rec__foot mk-truncate">
      <span v-if="clipping" class="rec__clip">Clip</span>
      <template v-if="layout === 'card' && lastMarks.length">
        <span v-for="(m, i) in lastMarks" :key="m" class="rec__mark">M{{ marks.length - i }} {{ clock(m) }}</span>
      </template>
      <span v-else-if="!clipping && layout === 'mini'" class="rec__quiet">{{ size }} · {{ recording ? 'recording' : 'saved' }}</span>
      <span v-else-if="!clipping" class="rec__quiet">{{ marks.length ? `${marks.length} markers · last ${clock(marks[marks.length - 1])}` : 'No markers yet' }}</span>
    </p>
  </div>
</template>

<style scoped>
.rec {
  container-type: inline-size;
  gap: 8px;
}

.rec__sub {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

.rec__main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.rec__time {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.rec__time .mk-fig {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xl);
  font-weight: var(--r-weight-medium);
  letter-spacing: -0.02em;
}

.rec__keys {
  display: flex;
  flex: none;
  gap: 6px;
}

.rec__meters {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
}

.rec__meter {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rec__ch {
  flex: none;
  width: 34px;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.rec__segs {
  display: flex;
  flex: 1;
  gap: 2px;
  height: 10px;
}

.rec__segs span {
  flex: 1;
  background: var(--r-bg-track);
}

.rec__segs span.is-on {
  background: var(--r-text-secondary);
}

.rec__segs span.is-on.is-hot {
  background: var(--r-status-warning);
}

.rec__segs span.is-on.is-top {
  background: var(--r-status-critical);
}

.rec__segs span.is-peak {
  background: var(--r-text);
}

.rec__scale {
  position: relative;
  height: 12px;
  margin-left: 42px;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: 9px;
  font-variant-numeric: tabular-nums;
}

.rec__scale span {
  position: absolute;
  left: calc(var(--at) * 100%);
  transform: translateX(-50%);
}

.rec__scale span:last-child {
  transform: translateX(-100%);
}

.rec__scale span:first-child {
  transform: none;
}

.rec__foot {
  display: flex;
  flex: none;
  gap: 10px;
  min-height: 14px;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-variant-numeric: tabular-nums;
}

.rec__quiet {
  color: var(--r-text-tertiary);
}

.rec__mark {
  color: var(--r-text-secondary);
}

.rec__clip {
  color: var(--r-danger-text);
  font-weight: var(--r-weight-semibold);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

/* Tall: the meters stand up side by side and fill the tile. */
.rec--strip {
  gap: 6px;
}

.rec--strip .rec__meters {
  gap: 4px;
}

.rec--strip .rec__segs {
  height: 8px;
}

.rec--tall .rec__main {
  flex-direction: column;
  align-items: flex-start;
}

.rec--tall .rec__meters {
  flex-direction: row;
  justify-content: center;
  gap: 10px;
}

.rec--tall .rec__meter {
  flex-direction: column-reverse;
  height: 100%;
}

.rec--tall .rec__ch {
  width: auto;
  text-align: center;
}

.rec--tall .rec__segs {
  flex-direction: column-reverse;
  width: 18px;
  height: auto;
}

.rec--tall .rec__scale {
  width: 22px;
  height: auto;
  margin: 0 0 18px;
}

.rec--tall .rec__scale span {
  bottom: calc(var(--at) * 100%);
  left: 0;
  transform: translateY(50%);
}

.rec--tall .rec__scale span:first-child {
  transform: none;
}

.rec--tall .rec__scale span:last-child {
  transform: translateY(100%);
}

@container (min-width: 300px) {
  .rec__time {
    flex-direction: row;
    align-items: baseline;
    gap: 10px;
  }
  .rec__time .mk-fig {
    font-size: var(--r-text-3xl);
  }
}
</style>
