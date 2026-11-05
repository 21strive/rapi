<script setup lang="ts">
/**
 * A colleague asks to trade shifts. Their shift and yours sit side by side, each with its hours
 * drawn on a 24-hour strip, so night against late reads before the times do. Accept or decline;
 * the roster updates on the press and can be put back for ten seconds.
 */
import { computed, ref } from 'vue'
import { ArrowLeftRight } from 'lucide-vue-next'
import { RButton, RStatus, type StatusTone } from '@/design-system'
import { pad, type Zone } from '../../kit'
import DecisionStrip from './DecisionStrip.vue'
import { holdFocus, useDecision } from './shared'

interface Shift {
  /** "Sat 14 Nov". */
  day: string
  /** Hours, 0–23; a shift past midnight has `to` below `from`. */
  from: number
  to: number
  /** "Night". */
  label: string
}

const props = withDefaults(
  defineProps<{
    eyebrow: string
    /** Who asks, first name is enough: "Fikri". */
    who: string
    theirs: Shift
    yours: Shift
    /** What the model checked: "Both stay under 48 h this week". */
    note?: string
    zone?: Zone
    compact?: boolean
  }>(),
  { note: undefined, zone: 'WIB' },
)

const root = ref<HTMLElement | null>(null)
const { choice, at, left, decide, undo } = useDecision<'accepted' | 'declined'>(10)
const swapped = computed(() => choice.value === 'accepted')

function on(shift: Shift, hour: number) {
  return shift.from < shift.to ? hour >= shift.from && hour < shift.to : hour >= shift.from || hour < shift.to
}
const hours = (s: Shift) => `${pad(s.from)}:00–${pad(s.to)}:00`

function answer(value: 'accepted' | 'declined') {
  const restore = holdFocus(root)
  decide(value)
  restore('[data-focus="undo"]')
}

function revert() {
  const restore = holdFocus(root)
  undo()
  restore('[data-focus="accept"]')
}

const status = computed<{ tone: StatusTone; label: string }>(() => {
  if (choice.value === 'accepted') return { tone: 'success', label: 'Swapped' }
  if (choice.value === 'declined') return { tone: 'neutral', label: 'Declined' }
  return { tone: 'warning', label: 'Needs you' }
})
const blocks = computed(() => [
  { key: 'theirs', who: swapped.value ? 'Yours now' : props.who, shift: props.theirs },
  { key: 'yours', who: swapped.value ? `${props.who}’s now` : 'Yours', shift: props.yours },
])
</script>

<template>
  <div ref="root" class="mk swap" :class="{ 'swap--compact': compact }">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <RStatus v-if="!compact || choice" :tone="status.tone" :label="status.label" size="sm" />
    </div>

    <div class="swap__pair">
      <template v-for="(b, i) in blocks" :key="b.key">
        <ArrowLeftRight v-if="i === 1" class="swap__arrow" :size="14" aria-hidden="true" />
        <div class="swap__shift" :class="{ 'is-mine': b.key === 'yours' }">
          <span class="swap__head">
            <span class="r-label mk-truncate">{{ b.who }}</span>
            <span class="swap__day mk-truncate">{{ b.shift.day }}</span>
          </span>
          <span class="swap__hours">
            <span v-if="!compact" class="r-mono">{{ hours(b.shift) }}</span>
            <span class="swap__name">{{ b.shift.label }}</span>
          </span>
          <span v-if="!compact" class="swap__strip" :aria-label="`${b.shift.label}, ${hours(b.shift)} ${zone}`" role="img">
            <span v-for="h in 24" :key="h" :class="{ 'is-on': on(b.shift, h - 1) }" />
          </span>
        </div>
      </template>
    </div>

    <p v-if="note && !compact && !choice" class="swap__note mk-truncate">{{ note }}</p>

    <div class="swap__foot mk-end">
      <DecisionStrip v-if="choice" :at="at" :left="left" :zone="zone" @undo="revert" />
      <div v-else class="swap__keys">
        <RButton variant="outline" size="sm" @click="answer('declined')">Decline</RButton>
        <RButton tone="brand" size="sm" data-focus="accept" @click="answer('accepted')">Accept</RButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.swap {
  gap: 8px;
}

.swap__pair {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: 8px;
}

.swap__arrow {
  color: var(--r-text-tertiary);
}

.swap__shift {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
  padding: 6px 8px 8px;
  border: 1px solid var(--r-border);
}

.swap__shift.is-mine {
  border-color: var(--r-border-strong);
}

.swap__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 6px;
  min-width: 0;
}

.swap__day {
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-semibold);
}

.swap__hours {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 6px;
  min-width: 0;
  overflow: hidden;
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  white-space: nowrap;
}

.swap__name {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-medium);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.swap--compact .swap__name {
  color: var(--r-text-secondary);
  font-family: var(--r-font-sans);
  font-size: var(--r-text-xs);
  letter-spacing: 0;
  text-transform: none;
}

/* 24 hours, one cell each; the shift's hours lit in ink. */
.swap__strip {
  display: grid;
  grid-template-columns: repeat(24, 1fr);
  gap: 1px;
  margin-top: 4px;
}

.swap__strip span {
  height: 6px;
  background: var(--r-bg-track);
}

.swap__strip span.is-on {
  background: var(--r-text);
}

.swap__note {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

.swap__keys {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.swap--compact .swap__pair {
  gap: 4px;
}

.swap--compact .swap__shift {
  padding: 4px 6px 5px;
}

.swap--compact .swap__head {
  flex-direction: column;
  align-items: flex-start;
  gap: 1px;
}
/* The status word in the header never gives way to the eyebrow. */
.mk-row > .r-status {
  flex: none;
}
</style>
