<script setup lang="ts">
/**
 * Something left the area it should stay in. The sketch shows the fence and the track out of it,
 * the live position at its end; the figures say how far and how long. The person can reach
 * whoever is with it, or close the alert as planned.
 */
import { computed, ref, watch } from 'vue'
import { Phone } from 'lucide-vue-next'
import { RButton, RStatus } from '@/design-system'
import { num, seeded, useTick } from '../../kit'
import { mmss, stamp, useElapsed, useFocusKeeper } from './shared'

const props = withDefaults(
  defineProps<{
    eyebrow: string
    title: string
    /** Name of the fenced area, in mono caps on the sketch. */
    zone: string
    /** Distance outside at the start, and how much it grows per second on screen. */
    distance: number
    rate?: number
    unit?: string
    /** Seconds since it left. */
    since?: number
    speed?: string
    /** Reach whoever is with it: "Call driver". */
    primary: string
    /** Who answers: "Fikri Ramadhan". */
    who: string
    /** Close as expected: "Mark as planned". */
    secondary: string
    seed: string
    /** `panel` 2x2 · `wide` 3x2. */
    layout?: 'panel' | 'wide'
  }>(),
  { rate: 0.01, unit: 'km', since: 0, layout: 'panel' },
)

/* The track: a few points inside the fence, then out of it, heading away. */
const rnd = seeded(props.seed)
const inside = Array.from({ length: 5 }, (_, i) => [24 + i * 7 + rnd() * 4, 58 - i * 2 + (rnd() - 0.5) * 10])
const heading = -0.35 + rnd() * 0.5
const outside = Array.from({ length: 14 }, (_, i) => [62 + i * 4.2, 50 + Math.sin(heading) * i * 4 + (rnd() - 0.5) * 3])
const track = [...inside, ...outside]

const tick = useTick(1000)
const shown = computed(() => Math.min(track.length, 8 + Math.floor(tick.value / 3)))
const points = computed(() => track.slice(0, shown.value).map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' '))
const head = computed(() => track[shown.value - 1])
const out = computed(() => props.distance + tick.value * props.rate)
const away = useElapsed(props.since)
const awayFor = away.value

const state = ref<'open' | 'calling' | 'closed'>('open')
const note = ref('')
const call = useElapsed(0)
call.running.value = false
const callFor = call.value
const { bind, keep } = useFocusKeeper()
watch(state, (s) => (call.running.value = s === 'calling'))

function dial() {
  keep('[data-focus="hang"]')
  call.reset(0)
  state.value = 'calling'
}

function hang() {
  keep('[data-focus="primary"]')
  note.value = `Spoke to ${props.who} at ${stamp()} for ${mmss(callFor.value)}.`
  state.value = 'open'
}

function close() {
  keep('[data-focus="reopen"]')
  note.value = `Closed as planned at ${stamp()}.`
  state.value = 'closed'
}

function reopen() {
  keep('[data-focus="primary"]')
  note.value = ''
  state.value = 'open'
}
</script>

<template>
  <div :ref="bind" class="mk fence" :class="`fence--${layout}`">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <RStatus
        :tone="state === 'closed' ? 'neutral' : 'warning'"
        :label="state === 'closed' ? 'Planned' : 'Outside fence'"
        :pulse="state === 'open' && !note"
        size="sm"
        class="fence__status"
      />
    </div>

    <div class="fence__body">
      <div class="fence__map" role="img" :aria-label="`${title}: ${num(out, 1)} ${unit} outside ${zone}`">
        <svg viewBox="0 0 120 100" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
          <g class="fence__grid">
            <line v-for="g in 5" :key="`v${g}`" :x1="g * 20" :x2="g * 20" y1="0" y2="100" />
            <line v-for="g in 4" :key="`h${g}`" :y1="g * 20" :y2="g * 20" x1="0" x2="120" />
          </g>
          <rect class="fence__zone" x="14" y="30" width="44" height="44" />
          <text class="fence__label" x="14" y="26">{{ zone }}</text>
          <polyline class="fence__track" :points="points" />
          <circle v-if="head" class="fence__now" :cx="head[0]" :cy="head[1]" r="3" />
        </svg>
      </div>

      <dl class="fence__figs">
        <div>
          <dt class="r-label">Outside</dt>
          <dd><span class="mk-fig">{{ num(out, 1) }}</span> <span class="mk-unit">{{ unit }}</span></dd>
        </div>
        <div>
          <dt class="r-label">For</dt>
          <dd><span class="mk-fig">{{ Math.floor(awayFor / 60) }}</span> <span class="mk-unit">min</span></dd>
        </div>
        <div v-if="speed">
          <dt class="r-label">Speed</dt>
          <dd><span class="fence__speed">{{ speed }}</span></dd>
        </div>
      </dl>
    </div>

    <p class="fence__title" aria-live="polite">{{ note || title }}</p>

    <div class="fence__foot mk-end">
      <template v-if="state === 'open'">
        <RButton size="sm" tone="brand" data-focus="primary" @click="dial">
          <template #leading><Phone :size="14" aria-hidden="true" /></template>
          {{ primary }}
        </RButton>
        <RButton size="sm" variant="ghost" @click="close">{{ secondary }}</RButton>
      </template>
      <template v-else-if="state === 'calling'">
        <span class="fence__call">Calling {{ who }} · {{ mmss(callFor) }}</span>
        <RButton size="sm" tone="danger" data-focus="hang" @click="hang">End call</RButton>
      </template>
      <RButton v-else size="sm" variant="ghost" data-focus="reopen" @click="reopen">Reopen</RButton>
    </div>
  </div>
</template>

<style scoped>
.fence {
  gap: 8px;
}

.fence__status {
  flex: none;
}

.fence__body {
  display: grid;
  flex: 1 1 auto;
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-rows: minmax(0, 1fr);
  gap: 12px;
  min-height: 0;
}

/* The sketch fills whatever the row leaves it and never sizes the row itself. */
.fence__map {
  position: relative;
  min-width: 0;
  min-height: 0;
  border: 1px solid var(--r-border-subtle);
  background: var(--r-bg-muted);
}

.fence__map svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.fence__grid line {
  stroke: var(--r-chart-grid);
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
}

/* The fence is a boundary, so it is dashed, like any threshold. */
.fence__zone {
  fill: var(--r-brand-soft);
  stroke: var(--r-brand);
  stroke-width: 1;
  stroke-dasharray: 3 2;
  vector-effect: non-scaling-stroke;
}

.fence__label {
  fill: var(--r-brand-text);
  font-family: var(--r-font-mono);
  font-size: 6.5px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.fence__track {
  fill: none;
  stroke: var(--r-text);
  stroke-width: 1.5;
  stroke-linejoin: miter;
  vector-effect: non-scaling-stroke;
}

.fence__now {
  fill: var(--r-chart-now);
  stroke: var(--r-chart-surface);
  stroke-width: 1.5;
}

.fence__figs {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
}

.fence__figs dd {
  margin: 2px 0 0;
  white-space: nowrap;
}

.fence__figs .mk-fig {
  font-size: var(--r-text-xl);
}

.fence__speed {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
}

.fence__title {
  overflow: hidden;
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  line-height: 1.4;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fence__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.fence__call {
  overflow: hidden;
  color: var(--r-text);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.04em;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
}
</style>
