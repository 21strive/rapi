<script setup lang="ts">
/**
 * The hold gesture as an instrument key: one square key filling the tile, ten LED segments along
 * its foot that light while it is held. Let go early and they go dark. Space or Enter hold too.
 */
import { computed, ref } from 'vue'
import { RStatus, type StatusTone } from '@/design-system'
import { usePressHold, type Zone } from '../../kit'
import DecisionStrip from './DecisionStrip.vue'
import { holdFocus, useDecision } from './shared'

const props = withDefaults(
  defineProps<{
    eyebrow: string
    /** The state before, as a lamp word: "Closed". */
    before: string
    /** On the key: "Hold to open". */
    action: string
    /** The state after: "Open". */
    done: string
    /** What it acts on, under the action: "Gate 2 barrier". */
    detail?: string
    tone?: 'neutral' | 'brand' | 'danger' | 'signal'
    doneTone?: StatusTone
    holdMs?: number
    zone?: Zone
  }>(),
  { detail: undefined, tone: 'neutral', doneTone: 'success', holdMs: 1000, zone: 'WIB' },
)

const SEGMENTS = 10
const root = ref<HTMLElement | null>(null)
const { at, left, decided, decide, undo } = useDecision<true>(10)

const { progress, holding, handlers, reset } = usePressHold(props.holdMs, () => {
  const restore = holdFocus(root)
  decide(true)
  restore('[data-focus="undo"]')
})
const lit = computed(() => Math.floor(progress.value * SEGMENTS))

function revert() {
  const restore = holdFocus(root)
  undo()
  reset()
  restore('[data-focus="key"]')
}
</script>

<template>
  <div ref="root" class="mk key">
    <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>

    <button
      v-if="!decided"
      type="button"
      class="key__cap"
      :class="[`r-tone-${tone}`, { 'is-holding': holding }]"
      data-focus="key"
      :aria-label="`${action}${detail ? `, ${detail}` : ''}: press and hold`"
      v-bind="handlers"
    >
      <span class="key__action">{{ holding ? 'Keep holding' : action }}</span>
      <span v-if="detail" class="key__detail mk-truncate">{{ detail }}</span>
      <span class="key__leds" aria-hidden="true">
        <span v-for="i in SEGMENTS" :key="i" :class="{ 'is-on': i <= lit }" />
      </span>
    </button>
    <div v-else class="key__done" :class="`r-tone-${doneTone}`">
      <RStatus :tone="doneTone" :label="done" :pulse="doneTone === 'signal'" shape="square" />
    </div>
    <DecisionStrip v-if="decided" :at="at" :left="left" :zone="zone" @undo="revert" />
    <RStatus v-else class="key__state" tone="neutral" :label="before" shape="square" size="sm" />
  </div>
</template>

<style scoped>
.key {
  gap: 8px;
}

/* The key: a ruled square face; the action top-left, the LED row along its foot. */
.key__cap {
  position: relative;
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  min-height: 0;
  padding: 8px 10px 10px;
  border: 1px solid var(--r-border-strong);
  background: var(--r-bg-surface);
  color: var(--r-text);
  text-align: left;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  transition: background-color var(--r-duration-fast) var(--r-ease-out);
}

.key__cap:hover {
  background: var(--r-bg-hover);
}

.key__cap.is-holding {
  background: var(--r-bg-pressed);
}

.key__cap:focus-visible {
  outline: 2px solid var(--r-focus);
  outline-offset: 2px;
}

.key__action {
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-snug);
  line-height: 1.3;
}

.key__detail {
  max-width: 100%;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

.key__leds {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 2px;
  width: 100%;
  margin-top: auto;
}

.key__leds span {
  height: 6px;
  background: var(--r-bg-track);
}

.key__leds span.is-on {
  background: var(--tone-solid);
}

/* After: the key face is the outcome, solid in its tone. */
.key__done {
  display: flex;
  flex: 1 1 auto;
  align-items: flex-end;
  min-height: 0;
  padding: 8px 10px;
  border: 1px solid var(--tone-solid);
  background: var(--tone-soft);
  color: var(--tone-text);
}

.key__done :deep(.r-status) {
  color: var(--tone-text);
  font-size: var(--r-text-xs);
  font-weight: var(--r-weight-semibold);
}

.key__state {
  flex: none;
}
</style>
