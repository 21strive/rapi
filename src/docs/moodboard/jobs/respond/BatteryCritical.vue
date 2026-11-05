<script setup lang="ts">
/**
 * A battery about to run out on something that matters: a drone in the air, a rack on UPS, a bus
 * on its route. The cells and the minutes left are the message; the one action is the safe thing
 * to do now. The level keeps draining while you look.
 */
import { computed, ref, watch } from 'vue'
import { RButton, RStatus } from '@/design-system'
import { useTick } from '../../kit'
import { stamp, useFocusKeeper } from './shared'

const props = withDefaults(
  defineProps<{
    eyebrow: string
    /** Percent at the start. */
    level: number
    /** Minutes left at the start, at the current draw. */
    minutes: number
    /** Seconds on screen per percent drained. */
    drain?: number
    detail?: string
    action: string
    /** Said after the action, and the lamp's word for it. */
    done: string
    doneWord?: string
    /** The way back: "Resume mission". */
    undo?: string
    /** `tall` 1x2 · `row` 2x1 · `square` 1x1. */
    layout?: 'tall' | 'row' | 'square'
  }>(),
  { drain: 12, doneWord: 'Done', undo: 'Undo', layout: 'square' },
)

const pct = ref(props.level)
const actedAt = ref<string | null>(null)
const tick = useTick(1000)
const { bind, keep } = useFocusKeeper()

watch(tick, (t) => {
  if (actedAt.value) return
  if (t % props.drain === 0) pct.value = Math.max(1, pct.value - 1)
})

const minutesLeft = computed(() => Math.max(1, Math.round((props.minutes * pct.value) / props.level)))
const CELLS = 10
const lit = computed(() => Math.max(1, Math.ceil(pct.value / 10)))
const tone = computed(() => (pct.value <= 10 ? 'danger' : 'warning'))
const word = computed(() => (pct.value <= 10 ? 'Critical' : 'Low'))

function act() {
  keep('[data-focus="undo"]')
  actedAt.value = stamp()
}

function back() {
  keep('[data-focus="act"]')
  actedAt.value = null
}
</script>

<template>
  <div :ref="bind" class="mk batt" :class="[`batt--${layout}`, `r-tone-${tone}`]">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <RStatus v-if="layout === 'row'" :tone="actedAt ? 'neutral' : tone" :label="actedAt ? doneWord : word" :pulse="!actedAt" size="sm" class="batt__status" />
    </div>

    <div class="batt__main">
      <div class="batt__cell" role="img" :aria-label="`Battery ${pct}%, ${word.toLowerCase()}`">
        <span v-for="i in CELLS" :key="i" :class="{ 'is-on': i <= lit }" />
      </div>
      <div class="batt__read">
        <p class="batt__figure">
          <span class="mk-fig">{{ pct }}</span>
          <span class="mk-unit">%</span>
          <span v-if="layout !== 'row'" class="batt__word">{{ actedAt ? doneWord : word }}</span>
        </p>
        <p class="batt__left">{{ actedAt && layout === 'square' ? done : `About ${minutesLeft} min left` }}</p>
        <p v-if="detail && layout !== 'square'" class="batt__detail">{{ detail }}</p>
      </div>
    </div>

    <div class="batt__foot mk-end">
      <RButton v-if="!actedAt" size="sm" data-focus="act" @click="act">{{ action }}</RButton>
      <template v-else>
        <p v-if="layout !== 'square'" class="batt__done" aria-live="polite">{{ done }} · {{ actedAt }}</p>
        <RButton size="sm" variant="ghost" data-focus="undo" @click="back">{{ undo }}</RButton>
      </template>
    </div>
  </div>
</template>

<style scoped>
.batt {
  gap: 8px;
}

.batt__status {
  flex: none;
}

.batt__main {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.batt--tall .batt__main {
  flex: 1 1 auto;
  flex-direction: column;
  align-items: stretch;
  min-height: 0;
}

/* The battery: ten square cells in a frame with a terminal, filled from the bottom (or left). */
.batt__cell {
  position: relative;
  display: grid;
  flex: none;
  grid-template-columns: repeat(10, 1fr);
  gap: 2px;
  width: 64px;
  height: 26px;
  padding: 3px;
  border: 1px solid var(--r-border-strong);
}

.batt__cell::after {
  position: absolute;
  top: 7px;
  right: -5px;
  width: 4px;
  height: 10px;
  background: var(--r-border-strong);
  content: '';
}

.batt__cell span {
  background: var(--r-bg-track);
}

.batt__cell span.is-on {
  background: var(--tone-lamp);
}

.batt--tall .batt__cell {
  flex: 1 1 auto;
  grid-template-columns: 1fr;
  grid-template-rows: repeat(10, 1fr);
  width: 56px;
  height: auto;
  min-height: 80px;
  margin: 4px auto 0;
}

.batt--tall .batt__cell span:nth-child(1) { grid-row: 10; }
.batt--tall .batt__cell span:nth-child(2) { grid-row: 9; }
.batt--tall .batt__cell span:nth-child(3) { grid-row: 8; }
.batt--tall .batt__cell span:nth-child(4) { grid-row: 7; }
.batt--tall .batt__cell span:nth-child(5) { grid-row: 6; }
.batt--tall .batt__cell span:nth-child(6) { grid-row: 5; }
.batt--tall .batt__cell span:nth-child(7) { grid-row: 4; }
.batt--tall .batt__cell span:nth-child(8) { grid-row: 3; }
.batt--tall .batt__cell span:nth-child(9) { grid-row: 2; }
.batt--tall .batt__cell span:nth-child(10) { grid-row: 1; }

.batt--tall .batt__cell::after {
  top: -5px;
  right: auto;
  left: 50%;
  width: 16px;
  height: 4px;
  transform: translateX(-50%);
}

.batt__read {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.batt--tall .batt__read {
  align-items: center;
  text-align: center;
}

.batt__figure {
  display: flex;
  align-items: baseline;
  gap: 2px;
  color: var(--tone-text);
}

.batt__figure .mk-fig {
  font-size: var(--r-text-3xl);
}

.batt__word {
  margin-left: 6px;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.batt__left {
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
}

.batt__detail {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
  line-height: 1.4;
}

.batt--row .batt__detail {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.batt__foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.batt--square .batt__foot > *,
.batt--tall .batt__foot > * {
  flex: 1 1 100%;
}

.batt__done {
  min-width: 0;
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  line-height: 1.4;
}
</style>
