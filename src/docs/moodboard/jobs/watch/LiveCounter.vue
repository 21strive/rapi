<script setup lang="ts">
/**
 * A number that moves while you look: requests a second, payments today, people through a gate.
 * The columns beside it are the last ticks, newest on the right; run the pointer along them to read
 * one. Freeze holds the figure still so it can be read out, while counting carries on underneath.
 */
import { computed, ref } from 'vue'
import { Pause, Play } from 'lucide-vue-next'
import { RIconButton, RStatus } from '@/design-system'
import { num, time, type Zone } from '../../kit'
import PixelDigits from './PixelDigits.vue'
import { columnAt, columnsPath, useElementSize, useLive } from './shared'

const props = withDefaults(
  defineProps<{
    label: string
    unit?: string
    /** `rate` wanders around `base`; `total` only climbs, by about `base` a tick. */
    mode?: 'rate' | 'total'
    base: number
    /** Where a running total starts. */
    start?: number
    /** How far a rate wanders in a tick, as a share of `base`. */
    vol?: number
    decimals?: number
    /** `pixel` is the dot-matrix instrument face, with unlit 8s behind the digits. */
    font?: 'sans' | 'pixel'
    /** A capacity the total fills: seats, a daily limit. */
    cap?: number
    seed: string
    ms?: number
    /** Columns in the history strip. */
    bars?: number
    zone?: Zone
  }>(),
  { mode: 'rate', vol: 0.05, decimals: 0, font: 'sans', ms: 1000, bars: 24, zone: 'WIB' },
)

const total = props.mode === 'total'
const { shown, frozen, freeze, missed } = useLive({
  seed: props.seed,
  size: props.bars + (total ? 1 : 0),
  ms: props.ms,
  start: total ? (props.start ?? 0) : props.base,
  next: (last, rnd) =>
    total
      ? last + Math.round(props.base * (0.55 + rnd() * 0.9))
      : Math.max(0, last + (rnd() - 0.5) * 2 * props.vol * props.base + (props.base - last) * 0.2),
})

/** What each column shows: the rate itself, or for a total what it grew by in that tick. */
const columns = computed(() => {
  const s = shown.value
  return total ? s.slice(1).map((x, i) => x.v - s[i].v) : s.map((x) => x.v)
})
const peak = computed(() => Math.max(...columns.value))

const hovered = ref<number | null>(null)
const reading = computed(() => {
  const s = shown.value
  return s[hovered.value == null ? s.length - 1 : hovered.value + (total ? 1 : 0)]
})
const text = computed(() => num(reading.value.v, props.decimals))

const sub = computed(() => {
  const c = columns.value
  if (total && props.cap) return `of ${num(props.cap)} · ${num((reading.value.v / props.cap) * 100, 1)}%`
  if (total) return `+${num(c.reduce((a, b) => a + b, 0))} in the last ${(c.length * props.ms) / 1000} s`
  const avg = c.reduce((a, b) => a + b, 0) / c.length
  return `avg ${num(avg, props.decimals)} · peak ${num(peak.value, props.decimals)}`
})

const strip = ref<HTMLElement | null>(null)
const { width, height } = useElementSize(strip)
const paths = computed(() => {
  const c = columns.value
  const pick = hovered.value ?? c.length - 1
  const top = peak.value * 1.08
  return {
    rest: columnsPath(c.map((v, i) => (i === pick ? 0 : v)), width.value, height.value, top),
    one: columnsPath(c.map((v, i) => (i === pick ? v : 0)), width.value, height.value, top),
  }
})

function onMove(event: PointerEvent) {
  hovered.value = columnAt(event, columns.value.length)
}
</script>

<template>
  <div class="mk counter">
    <div class="mk-row mk-between">
      <span class="r-label mk-truncate">{{ label }}</span>
      <span class="mk-row counter__meta">
        <RStatus v-if="hovered != null" size="sm" :label="time(new Date(reading.t), zone, true)" />
        <RStatus v-else-if="frozen" size="sm" :label="`Held · ${missed} new`" />
        <RStatus v-else tone="signal" pulse size="sm" label="Live" />
        <RIconButton
          :label="frozen ? 'Resume the live count' : 'Freeze the count'"
          size="xs"
          variant="ghost"
          :pressed="frozen"
          @click="freeze()"
        >
          <Play v-if="frozen" :size="14" />
          <Pause v-else :size="14" />
        </RIconButton>
      </span>
    </div>
    <div class="counter__body">
      <div class="counter__read">
        <p class="counter__fig" :class="{ 'is-pixel': font === 'pixel' }">
          <PixelDigits v-if="font === 'pixel'" class="counter__value counter__value--pixel" :value="text" ghost />
          <span v-else class="counter__value mk-fig" :class="{ 'is-long': text.length > 7 }">{{ text }}</span>
          <span v-if="unit" class="mk-unit">{{ unit }}</span>
        </p>
        <p class="counter__sub mk-truncate">{{ sub }}</p>
      </div>
      <div ref="strip" class="counter__strip" @pointermove="onMove" @pointerleave="hovered = null">
        <svg :width="width" :height="height" aria-hidden="true">
          <path class="counter__rest" :d="paths.rest" />
          <path class="counter__one" :d="paths.one" />
        </svg>
      </div>
    </div>
  </div>
</template>

<style scoped>
.counter {
  container-type: inline-size;
}

.counter__meta {
  flex: none;
  gap: 4px;
}

.counter__body {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 8px;
  min-height: 0;
}

.counter__read {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.counter__fig {
  display: flex;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
  white-space: nowrap;
}

.counter__value {
  font-size: var(--r-text-2xl);
}

.counter__value--pixel {
  font-size: 28px;
}

.counter__sub {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
}

.counter__strip {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 24px;
  cursor: crosshair;
}

.counter__strip svg {
  display: block;
}

.counter__rest {
  fill: var(--r-chart-context);
}

.counter__one {
  fill: var(--r-chart-1);
}

/* Wider than a cell: the figure on the left, the strip beside it at full height. */
@container (min-width: 300px) {
  .counter__body {
    flex-direction: row;
    gap: 16px;
  }
  .counter__read {
    flex: none;
    justify-content: flex-end;
    max-width: 68%;
    overflow: hidden;
  }
  .counter__value {
    font-size: var(--r-text-4xl);
  }
  .counter__value.is-long {
    font-size: var(--r-text-3xl);
  }
  .counter__value--pixel {
    font-size: 44px;
  }
  .counter__sub {
    font-size: var(--r-text-2xs);
  }
}

/* On a cobalt tile cobalt is the panel itself: selection inside turns white. */
.r-card--brand .counter {
  --r-brand: var(--r-on-brand);
}
</style>
