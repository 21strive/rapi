<script setup lang="ts">
/**
 * Time to a moment that will not wait: ignition, the next clearing batch, a sale. The count is the
 * figure; under it, when zero lands on the clock and a bar of the time left, its leading block the
 * orange "now". A launch count can hold and resume; the others offer to remind a person first.
 */
import { computed, ref, watch } from 'vue'
import { Bell, BellRing, Pause, Play, RotateCcw } from 'lucide-vue-next'
import { RButton, RStatus } from '@/design-system'
import { clock, pad, timeZ, useNow, type Zone } from '../../kit'
import PixelDigits from './PixelDigits.vue'

const props = withDefaults(
  defineProps<{
    eyebrow: string
    /** What zero is: "Ignition", "Next batch", "Sale opens". */
    zero: string
    /** The word once zero has passed: "Ignition", "Water back". */
    after?: string
    /** Seconds to zero when the tile opens. */
    seconds?: number
    /** Or count to the next boundary of this many minutes, again and again: batches, hourly drops. */
    every?: number
    zone?: Zone
    format?: 'tminus' | 'clock'
    action?: 'hold' | 'remind'
    /** Minutes before zero a reminder goes off. */
    lead?: number
    font?: 'sans' | 'pixel'
  }>(),
  { seconds: 600, zone: 'WIB', format: 'clock', action: 'remind', lead: 5, font: 'sans' },
)

const now = useNow(1000)
const period = (props.every ?? 0) * 60_000
const nextBoundary = (t: number) => Math.ceil((t + 1000) / period) * period
const target = ref(props.every ? nextBoundary(Date.now()) : Date.now() + props.seconds * 1000)
const span = props.every ? props.every * 60 : props.seconds

const held = ref<number | null>(null)
const remind = ref(false)
const lastZero = ref<number | null>(null)

const left = computed(() => held.value ?? (target.value - now.value.getTime()) / 1000)

// Batches and drops come round again: past zero, count to the next one.
watch(left, (s) => {
  if (props.every && s <= 0 && held.value == null) {
    lastZero.value = target.value
    target.value = nextBoundary(now.value.getTime())
  }
})

const past = computed(() => left.value <= 0)
const whole = computed(() => Math.abs(Math.round(left.value)))
const clockText = computed(() =>
  props.format === 'tminus'
    ? `${pad(Math.floor(whole.value / 3600))}:${pad(Math.floor((whole.value % 3600) / 60))}:${pad(whole.value % 60)}`
    : clock(Math.max(0, Math.ceil(left.value))),
)
const prefix = computed(() => (props.format === 'tminus' ? (past.value ? 'T+' : 'T−') : past.value ? '' : 'in'))

const status = computed(() => {
  if (held.value != null) return { tone: 'warning' as const, label: 'Hold', pulse: false }
  if (past.value) return { tone: 'success' as const, label: props.after ?? props.zero, pulse: false }
  return { tone: 'signal' as const, label: 'Live', pulse: true }
})

const remindAt = computed(() => target.value - props.lead * 60_000)
const sub = computed(() => {
  const at = timeZ(new Date(target.value), props.zone, props.format === 'tminus')
  if (held.value != null) return `Holding · ${props.zero} moves on resume`
  if (past.value) return `${props.after ?? props.zero} ${at}`
  if (remind.value)
    return left.value <= props.lead * 60
      ? `Reminded at ${timeZ(new Date(remindAt.value), props.zone)}`
      : `Reminder at ${timeZ(new Date(remindAt.value), props.zone)}`
  if (lastZero.value) return `${props.zero} ${at} · last ${timeZ(new Date(lastZero.value), props.zone)}`
  return `${props.zero} ${at}`
})

const BLOCKS = 24
const lit = computed(() => (past.value ? 0 : Math.max(1, Math.ceil((left.value / span) * BLOCKS))))

function toggleHold() {
  if (held.value == null) held.value = Math.max(0, left.value)
  else {
    target.value = Date.now() + held.value * 1000
    held.value = null
  }
}
function recycle() {
  held.value = null
  target.value = Date.now() + props.seconds * 1000
}
</script>

<template>
  <div class="mk count">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <RStatus :tone="status.tone" :pulse="status.pulse" size="sm" :label="status.label" />
    </div>

    <div class="count__main">
      <p class="count__fig" :class="{ 'is-held': held != null }" :aria-label="`${prefix} ${clockText}`">
        <span v-if="prefix" class="count__prefix">{{ prefix }}</span>
        <PixelDigits v-if="font === 'pixel'" class="count__digits count__digits--pixel" :value="clockText" ghost />
        <span v-else class="count__digits mk-fig">{{ clockText }}</span>
      </p>
      <div class="count__action">
        <template v-if="action === 'hold'">
          <RButton v-if="past && format === 'tminus'" size="xs" variant="outline" @click="recycle">
            <template #leading><RotateCcw :size="14" /></template>
            Recycle
          </RButton>
          <RButton v-else size="xs" :variant="held != null ? 'solid' : 'outline'" :aria-pressed="held != null" @click="toggleHold">
            <template #leading><Play v-if="held != null" :size="14" /><Pause v-else :size="14" /></template>
            {{ held != null ? 'Resume' : 'Hold' }}
          </RButton>
        </template>
        <RButton v-else size="xs" :variant="remind ? 'soft' : 'outline'" :tone="remind ? 'brand' : 'neutral'" :aria-pressed="remind" @click="remind = !remind">
          <template #leading><BellRing v-if="remind" :size="14" /><Bell v-else :size="14" /></template>
          {{ remind ? `${lead} min before` : 'Remind me' }}
        </RButton>
      </div>
    </div>

    <p class="count__sub mk-truncate">{{ sub }}</p>
    <div class="count__blocks mk-end" aria-hidden="true">
      <span v-for="n in BLOCKS" :key="n" :class="{ 'is-lit': n <= lit, 'is-now': n === lit && held == null }" />
    </div>
  </div>
</template>

<style scoped>
.count {
  container-type: inline-size;
  gap: 8px;
}

.count__main {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.count__fig {
  display: flex;
  align-items: baseline;
  gap: 4px;
  min-width: 0;
  white-space: nowrap;
}

.count__fig.is-held .count__digits {
  color: var(--r-text-secondary);
}

.count__prefix {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
  font-weight: var(--r-weight-medium);
}

.count__digits {
  font-size: var(--r-text-2xl);
}

.count__digits--pixel {
  font-size: 26px;
}

.count__action {
  display: flex;
}

.count__sub {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
}

.count__blocks {
  display: flex;
  flex: none;
  gap: 2px;
  height: 8px;
}

.count__blocks span {
  flex: 1;
  background: var(--r-bg-track);
}

.count__blocks span.is-lit {
  background: var(--r-ink);
}

.count__blocks span.is-now {
  background: var(--r-chart-now);
}

/* Wider than a cell: the action sits beside the figure. */
@container (min-width: 300px) {
  .count__main {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
  .count__digits {
    font-size: var(--r-text-4xl);
  }
  .count__digits--pixel {
    font-size: 40px;
  }
  .count__prefix {
    font-size: var(--r-text-md);
  }
  .count__sub {
    font-size: var(--r-text-2xs);
  }
}

/* On a cobalt tile cobalt is the panel itself: selection inside turns white. */
.r-card--brand .count {
  --r-brand: var(--r-on-brand);
}
</style>
