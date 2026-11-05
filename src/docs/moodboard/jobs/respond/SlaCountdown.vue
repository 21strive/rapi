<script setup lang="ts">
/**
 * A promise with a clock on it: first response due, ship by, triage within. The time left is the
 * figure; under five minutes it turns amber, past zero it turns red and counts the overrun with a
 * plus sign. Taking it puts a name on it, which stops the blinking but not the clock.
 */
import { computed, ref } from 'vue'
import { RButton, RStatus } from '@/design-system'
import { useTick } from '../../kit'
import { mmss, stamp, useFocusKeeper } from './shared'

const props = withDefaults(
  defineProps<{
    /** Mono caps: "SUP-48213 · PT Sinar Armada". */
    eyebrow: string
    /** What is due: "First response due". */
    title: string
    /** Seconds left when the tile appears; negative means already late. */
    left: number
    /** The whole window, for the bar. */
    total: number
    action: string
    /** Who it is assigned to after taking it. */
    owner?: string
    pixel?: boolean
    /** `row` 2x1 · `square` 1x1. */
    layout?: 'row' | 'square'
  }>(),
  { owner: 'you', pixel: false, layout: 'row' },
)

const tick = useTick(1000)
const remaining = computed(() => props.left - tick.value)
const takenAt = ref<string | null>(null)
const { bind, keep } = useFocusKeeper()

const phase = computed(() => (remaining.value < 0 ? 'late' : remaining.value <= 300 ? 'soon' : 'ok'))
const status = computed(() => {
  if (phase.value === 'late') return { tone: 'danger' as const, label: 'Breached' }
  if (phase.value === 'soon') return { tone: 'warning' as const, label: 'Due soon' }
  return { tone: 'neutral' as const, label: 'On time' }
})
const figure = computed(() => (remaining.value < 0 ? `+${mmss(-remaining.value)}` : mmss(remaining.value)))
const SEGMENTS = 24
const lit = computed(() => Math.max(0, Math.ceil((remaining.value / props.total) * SEGMENTS)))

function take() {
  keep('[data-focus="release"]')
  takenAt.value = stamp()
}

function release() {
  keep('[data-focus="take"]')
  takenAt.value = null
}
</script>

<template>
  <div :ref="bind" class="mk sla" :class="[`sla--${layout}`, `is-${phase}`]">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <RStatus
        v-if="layout === 'row'"
        :tone="status.tone"
        :label="status.label"
        :pulse="!takenAt && phase !== 'ok'"
        size="sm"
        class="sla__status"
      />
    </div>

    <div class="sla__main">
      <p class="sla__title">{{ phase === 'late' ? `${title} · late` : phase === 'soon' && layout === 'square' ? `${title} · soon` : title }}</p>
      <p class="sla__figure" role="timer" :aria-label="`${remaining < 0 ? 'Late by' : 'Left'} ${mmss(remaining)}`">
        <span class="mk-fig" :class="{ 'r-pixel': pixel }">{{ figure }}</span>
        <span class="mk-unit">{{ remaining < 0 ? 'over' : 'left' }}</span>
      </p>
    </div>

    <div class="sla__bar" aria-hidden="true">
      <span v-for="i in SEGMENTS" :key="i" :class="{ 'is-on': i <= lit }" />
    </div>

    <div class="sla__foot mk-end">
      <RButton v-if="!takenAt" size="sm" data-focus="take" @click="take">{{ action }}</RButton>
      <template v-else>
        <span class="sla__owner mk-truncate">{{ layout === 'square' ? 'Yours' : `Taken by ${owner} at ${takenAt}` }}</span>
        <RButton size="sm" variant="ghost" data-focus="release" @click="release">Release</RButton>
      </template>
    </div>
  </div>
</template>

<style scoped>
.sla {
  --sla: var(--r-text);
  gap: 8px;
}

.sla.is-soon {
  --sla: var(--r-warning-text);
}

.sla.is-late {
  --sla: var(--r-danger-text);
}

.sla__status {
  flex: none;
}

.sla__main {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.sla--row .sla__main {
  flex-direction: row;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
}

.sla__title {
  overflow: hidden;
  color: var(--r-text-secondary);
  font-size: var(--r-text-sm);
  line-height: 1.35;
  text-overflow: ellipsis;
}

.sla--row .sla__title {
  padding-bottom: 4px;
}

.sla--square {
  gap: 6px;
}

.sla--square .sla__title {
  white-space: nowrap;
}

.sla--square .sla__figure .mk-fig {
  font-size: var(--r-text-2xl);
}

.sla__figure {
  display: flex;
  flex: none;
  align-items: baseline;
  gap: 4px;
  color: var(--sla);
}

.sla__figure .mk-fig {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xl);
  font-weight: var(--r-weight-medium);
  letter-spacing: -0.02em;
}

.sla__figure .mk-fig.r-pixel {
  font-family: var(--r-font-pixel);
  font-weight: 400;
  letter-spacing: 0.02em;
}

.sla__bar {
  display: grid;
  grid-template-columns: repeat(24, 1fr);
  gap: 2px;
  height: 6px;
}

.sla__bar span {
  background: var(--r-bg-track);
}

.sla__bar span.is-on {
  background: var(--sla);
}

.sla__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.sla--square .sla__foot > :only-child {
  flex: 1 1 auto;
}

.sla__owner {
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
}
</style>
