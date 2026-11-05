<script setup lang="ts">
/**
 * Something is ringing for one person: a page, a call button, a job offer, a radio call. The
 * clock beside it says when it goes to someone else. Accept takes it; decline hands it on now;
 * if the clock runs out it is missed and moves on by itself.
 */
import { computed, ref, type Component } from 'vue'
import { BellRing, Car, Radio, Siren } from 'lucide-vue-next'
import { RButton, RStatus } from '@/design-system'
import { hms, mmss, useCountdown, useElapsed, useFocusKeeper } from './shared'

interface Line {
  label: string
  value: string
}

const props = withDefaults(
  defineProps<{
    /** Mono caps: "Page · payments on-call". */
    kind: string
    title: string
    detail?: string
    lines?: Line[]
    /** Seconds before it moves on. */
    timeout?: number
    accept?: string
    decline?: string
    /** What happens after each outcome, in one sentence. */
    accepted: string
    declined: string
    missed: string
    icon?: 'page' | 'bell' | 'car' | 'radio'
    /** `card` 2x2 · `row` 2x1 · `tall` 1x2. */
    layout?: 'card' | 'row' | 'tall'
    /** `brand` for the accept key; `neutral` on a signal tile, where cobalt would fight the orange. */
    acceptTone?: 'brand' | 'neutral'
  }>(),
  { lines: () => [], timeout: 60, accept: 'Accept', decline: 'Decline', icon: 'page', layout: 'card', acceptTone: 'brand' },
)

const ICONS: Record<string, Component> = { page: Siren, bell: BellRing, car: Car, radio: Radio }
const SEGMENTS = 20

const state = ref<'ringing' | 'accepted' | 'declined' | 'missed'>('ringing')
const ring = useCountdown(props.timeout, { auto: true, onDone: () => (state.value = 'missed') })
const left = ring.left
const onIt = useElapsed(0)
const onItFor = onIt.value
const { bind, keep } = useFocusKeeper()

const lit = computed(() => Math.ceil((left.value / props.timeout) * SEGMENTS))
const status = computed(() => {
  switch (state.value) {
    case 'accepted':
      return { tone: 'success' as const, label: 'Accepted', pulse: false }
    case 'declined':
      return { tone: 'neutral' as const, label: 'Declined', pulse: false }
    case 'missed':
      return { tone: 'warning' as const, label: 'Missed', pulse: false }
    default:
      return { tone: 'signal' as const, label: 'Ringing', pulse: true }
  }
})
const outcome = computed(() =>
  state.value === 'accepted' ? props.accepted : state.value === 'declined' ? props.declined : props.missed,
)

function take() {
  keep('[data-focus="back"]')
  ring.stop()
  onIt.reset(0)
  state.value = 'accepted'
}

function pass() {
  keep('[data-focus="back"]')
  ring.stop()
  state.value = 'declined'
}

function back() {
  keep('[data-focus="accept"]')
  if (state.value === 'missed') return take()
  state.value = 'ringing'
  onIt.running.value = false
  ring.start()
}
</script>

<template>
  <div :ref="bind" class="mk page" :class="`page--${layout}`">
    <div class="page__head">
      <component :is="ICONS[icon]" :size="14" class="page__icon" aria-hidden="true" />
      <span class="r-eyebrow mk-truncate">{{ kind }}</span>
      <RStatus class="page__status" :tone="status.tone" :label="status.label" :pulse="status.pulse" size="sm" />
    </div>

    <p v-if="layout === 'tall'" class="page__big" aria-hidden="true">
      <span class="mk-fig">{{ state === 'accepted' ? hms(onItFor) : mmss(left) }}</span>
    </p>

    <div class="page__main">
      <p class="page__title">{{ title }}</p>
      <p v-if="detail" class="page__detail">{{ detail }}</p>
      <dl v-if="lines.length && layout !== 'row'" class="page__lines">
        <div v-for="line in lines" :key="line.label">
          <dt>{{ line.label }}</dt>
          <dd>{{ line.value }}</dd>
        </div>
      </dl>
    </div>

    <p class="r-sr-only" aria-live="polite">{{ state === 'ringing' ? '' : `${status.label}. ${outcome}` }}</p>
    <div class="page__foot">
      <template v-if="state === 'ringing'">
        <div class="page__timer">
          <span class="page__segments" aria-hidden="true">
            <span v-for="i in SEGMENTS" :key="i" :class="{ 'is-on': i <= lit }" />
          </span>
          <span class="page__left">Moves on in {{ mmss(left) }}</span>
        </div>
        <div class="page__actions">
          <RButton size="sm" :tone="acceptTone" data-focus="accept" @click="take">{{ accept }}</RButton>
          <RButton size="sm" variant="outline" @click="pass">{{ decline }}</RButton>
        </div>
      </template>
      <template v-else>
        <p class="page__outcome">
          <span v-if="state === 'accepted' && layout !== 'tall'" class="page__clock">{{ hms(onItFor) }}</span>
          {{ outcome }}
        </p>
        <div class="page__actions">
          <RButton size="sm" variant="ghost" data-focus="back" @click="back">
            {{ state === 'accepted' ? 'Hand back' : state === 'missed' ? 'Take it now' : 'Undo' }}
          </RButton>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.page {
  --live: var(--r-text);
  gap: 10px;
}

.page__head {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.page__icon {
  flex: none;
  color: var(--r-text-secondary);
}

.page__status {
  flex: none;
  margin-left: auto;
}

.page--tall .page__head {
  flex-wrap: wrap;
  row-gap: 6px;
}

.page--tall .page__status {
  width: 100%;
  margin-left: 0;
}

/* On a signal tile the lamp would vanish into the orange, so it burns in ink there. */
:global(.r-card--signal) .page__status {
  --tone-lamp: var(--r-text);
}

.page__main {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.page__title {
  display: -webkit-box;
  overflow: hidden;
  font-size: var(--r-text-lg);
  font-weight: var(--r-weight-semibold);
  line-height: 1.3;
  letter-spacing: var(--r-tracking-snug);
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.page__detail {
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  line-height: 1.4;
}

.page__lines {
  display: grid;
  margin: 4px 0 0;
  border-top: 1px solid var(--r-border-subtle);
}

.page__lines > div {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 4px 0;
  border-bottom: 1px solid var(--r-border-subtle);
  font-size: var(--r-text-xs);
}

.page__lines dt {
  color: var(--r-text-tertiary);
}

.page__lines dd {
  overflow: hidden;
  margin: 0;
  font-variant-numeric: tabular-nums;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.page__foot {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: auto;
}

.page__timer {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.page__segments {
  display: grid;
  grid-template-columns: repeat(20, 1fr);
  gap: 2px;
  height: 4px;
}

.page__segments span {
  background: var(--r-bg-track);
}

.page__segments span.is-on {
  background: var(--live);
}

.page__left,
.page__clock {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  font-variant-numeric: tabular-nums;
}

.page__clock {
  margin-right: 4px;
  color: var(--r-text);
}

.page__actions {
  display: flex;
  gap: 8px;
}

.page__actions > * {
  flex: 1 1 0;
}

.page__outcome {
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  line-height: 1.45;
}

/* Row: text on the left, the two keys stacked on the right, the clock along the bottom. */
.page--row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 108px;
  grid-template-rows: auto minmax(0, 1fr) auto;
  gap: 6px 16px;
}

.page--row .page__head {
  grid-column: 1 / -1;
}

.page--row .page__main {
  grid-column: 1;
  grid-row: 2;
}

.page--row .page__title {
  font-size: var(--r-text-md);
  -webkit-line-clamp: 1;
}

.page--row .page__foot {
  display: contents;
}

.page--row .page__timer,
.page--row .page__outcome {
  grid-column: 1;
  grid-row: 3;
  align-self: end;
}

.page--row .page__actions {
  flex-direction: column;
  grid-column: 2;
  grid-row: 2 / 4;
  justify-content: flex-end;
  gap: 6px;
}

.page--row .page__actions > * {
  flex: none;
}

/* Tall: the clock is the figure. */
.page--tall .page__big {
  display: flex;
  justify-content: center;
  padding: 10px 0 6px;
  border-top: 1px solid var(--r-border-subtle);
  border-bottom: 1px solid var(--r-border-subtle);
}

.page--tall .page__big .mk-fig {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xl);
  font-weight: var(--r-weight-medium);
  letter-spacing: -0.02em;
}

.page--tall .page__title {
  font-size: var(--r-text-md);
  -webkit-line-clamp: 3;
}

.page--tall .page__actions {
  flex-direction: column;
}

.page--tall .page__actions > * {
  flex: none;
}
</style>
