<script setup lang="ts">
/**
 * A place in a line that moves on its own: where you are, about how long, who is at the counter
 * now. The squares are the people ahead, the orange one is being served. Leaving asks once; your
 * turn says where to go and takes an "on my way".
 */
import { computed, ref } from 'vue'
import { RButton, RStatus } from '@/design-system'
import { pad, timeZ, useNow, type Zone } from '../../kit'
import { minutes, ordinal } from './shared'

const props = withDefaults(
  defineProps<{
    /** Where the line is: "Klinik Sehat Sentosa · Poli Anak". */
    place: string
    /** Your ticket: "A-042". */
    ticket: string
    /** People ahead of you when the tile opens. */
    ahead: number
    /** Seconds a person takes at the counter, on average. */
    every: number
    /** Seconds until the line first moves. */
    firstIn?: number
    /** Where to go when it is your turn: "Counter 3". */
    counter: string
    /** Counters on the board layout, each calling the next number. */
    counters?: string[]
    /** The line under the big name at your turn ("{ticket}" is filled in), the key that answers
     *  it, and the line once answered. */
    go?: string
    ack?: string
    acked?: string
    layout?: 'mini' | 'strip' | 'board' | 'tall'
    zone?: Zone
  }>(),
  {
    firstIn: 8,
    counters: () => [],
    go: '{ticket} is called. Go now.',
    ack: 'On my way',
    acked: '{counter} knows you are coming.',
    layout: 'strip',
    zone: 'WIB',
  },
)

const match = /^(\D*)(\d+)$/.exec(props.ticket)
const prefix = match?.[1] ?? ''
const width = match?.[2].length ?? 3
const number = ref(Number(match?.[2] ?? 1))
const label = (n: number) => `${prefix}${pad(n, width)}`

const now = useNow(1000)
const opened = ref(Date.now())
const base = ref(props.ahead)
const firstIn = ref(props.firstIn)

const since = computed(() => Math.max(0, (now.value.getTime() - opened.value) / 1000))
const moves = computed(() => (since.value < firstIn.value ? 0 : 1 + Math.floor((since.value - firstIn.value) / props.every)))
const aheadNow = computed(() => base.value - moves.value)
const nextIn = computed(() =>
  since.value < firstIn.value ? firstIn.value - since.value : props.every - ((since.value - firstIn.value) % props.every),
)
const eta = computed(() => nextIn.value + Math.max(0, aheadNow.value) * props.every)
const etaText = computed(() => (eta.value < 60 ? 'under a minute' : `about ${minutes(Math.ceil(eta.value / 60))}`))
const serving = computed(() => number.value - Math.max(0, aheadNow.value) - 1)

const state = ref<'waiting' | 'confirm' | 'left' | 'coming'>('waiting')
const leftAt = ref<Date | null>(null)
const turn = computed(() => state.value !== 'left' && aheadNow.value < 0)

const squares = computed(() => Math.min(9, Math.max(0, aheadNow.value)))
const board = computed(() =>
  props.counters.map((name, i) => ({ name, at: label(Math.max(1, (turn.value ? number.value : serving.value) - i)) })),
)

function leave() {
  state.value = 'left'
  leftAt.value = new Date()
}
function rejoin() {
  number.value += base.value + 7
  base.value = Math.max(0, aheadNow.value) + 7
  opened.value = Date.now()
  firstIn.value = props.every
  state.value = 'waiting'
}
</script>

<template>
  <div class="mk queue" :class="`queue--${layout}`">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ place }}</span>
      <RStatus v-if="turn" tone="signal" :pulse="state !== 'coming'" size="sm" label="Your turn" />
      <span v-else-if="layout !== 'mini'" class="r-label">{{ label(number) }}</span>
    </div>

    <template v-if="state === 'left'">
      <p class="queue__big">Left</p>
      <p class="queue__quiet">You gave up {{ label(number) }} at {{ leftAt ? timeZ(leftAt, zone) : '' }}.</p>
      <div class="mk-end">
        <RButton size="xs" variant="outline" @click="rejoin">Join again</RButton>
      </div>
    </template>

    <template v-else-if="turn">
      <p class="queue__big">{{ counter }}</p>
      <p class="queue__quiet">{{ (state === 'coming' ? acked : go).replace('{ticket}', label(number)).replace('{counter}', counter) }}</p>
      <div class="mk-end">
        <RButton v-if="state !== 'coming'" size="xs" tone="brand" @click="state = 'coming'">{{ ack }}</RButton>
        <RStatus v-else tone="success" size="sm" label="Expected" />
      </div>
    </template>

    <template v-else>
      <div class="queue__main">
        <p class="queue__pos">
          <span class="mk-fig">{{ aheadNow === 0 ? 'Next' : ordinal(aheadNow + 1) }}</span>
          <span class="queue__of">in line</span>
        </p>
        <div v-if="layout !== 'tall'" class="queue__people" role="img" :aria-label="`${aheadNow} ahead of you, one being served`">
          <span class="is-served" />
          <span v-for="i in squares" :key="i" />
          <span class="is-you" />
        </div>
      </div>
      <p class="queue__quiet" :class="{ 'mk-truncate': layout !== 'tall' }">
        <template v-if="layout === 'mini'">{{ etaText }}</template>
        <template v-else>Your turn in {{ etaText }} · serving {{ label(serving) }}</template>
      </p>

      <ol v-if="layout === 'tall'" class="queue__line mk-grow" :aria-label="`The line, ${aheadNow} ahead of you`">
        <li class="is-served">
          <span class="queue__sq" />
          <span class="queue__ticket">{{ label(serving) }}</span>
          <span class="queue__word">Being helped</span>
        </li>
        <li v-for="k in Math.max(0, aheadNow)" :key="serving + k">
          <span class="queue__sq" />
          <span class="queue__ticket">{{ label(serving + k) }}</span>
          <span class="queue__word">Waiting</span>
        </li>
        <li class="is-you">
          <span class="queue__sq" />
          <span class="queue__ticket">{{ label(number) }}</span>
          <span class="queue__word">You</span>
        </li>
      </ol>

      <ol v-if="board.length" class="queue__board">
        <li v-for="(c, i) in board" :key="c.name" :class="{ 'is-latest': i === 0 }">
          <span class="mk-truncate">{{ c.name }}</span>
          <span class="queue__ticket">{{ c.at }}</span>
        </li>
      </ol>

      <div class="mk-row queue__foot mk-end">
        <template v-if="state === 'confirm'">
          <RButton size="xs" tone="danger" @click="leave">Leave</RButton>
          <RButton size="xs" variant="ghost" @click="state = 'waiting'">Stay</RButton>
          <span v-if="layout !== 'mini'" class="queue__quiet mk-truncate">Give up {{ label(number) }}?</span>
        </template>
        <RButton v-else size="xs" variant="outline" @click="state = 'confirm'">Leave the line</RButton>
      </div>
    </template>
  </div>
</template>

<style scoped>
.queue {
  container-type: inline-size;
  gap: 8px;
}

.queue__main {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.queue__pos {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.queue__pos .mk-fig {
  font-size: var(--r-text-3xl);
}

.queue__of {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-sm);
}

.queue__big {
  overflow: hidden;
  font-size: var(--r-text-2xl);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-tight);
  line-height: 1.1;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.queue__quiet {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

.queue__people {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
}

.queue__people span {
  width: 10px;
  height: 10px;
  background: var(--r-text-secondary);
}

.queue__people span.is-served {
  background: var(--r-chart-now);
}

.queue__people span.is-you {
  box-shadow: inset 0 0 0 2px var(--r-brand);
  background: transparent;
}

.queue__board {
  display: grid;
  margin: 0;
  padding: 0;
  border-top: 1px solid var(--r-border-subtle);
  list-style: none;
}

.queue__board li {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  padding: 5px 0;
  border-bottom: 1px solid var(--r-border-subtle);
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
}

.queue__board li.is-latest {
  color: var(--r-text);
}

.queue__ticket {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-variant-numeric: tabular-nums;
}

.queue__board li.is-latest .queue__ticket::before {
  content: 'Now ';
  color: var(--r-signal-text);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.queue__foot {
  gap: 6px;
}

.queue__line {
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  overflow: hidden;
  border-top: 1px solid var(--r-border-subtle);
  list-style: none;
}

.queue__line li {
  display: grid;
  flex: none;
  grid-template-columns: 10px auto minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  border-bottom: 1px solid var(--r-border-subtle);
  font-size: var(--r-text-xs);
}

.queue__sq {
  width: 10px;
  height: 10px;
  background: var(--r-text-secondary);
}

.queue__line li.is-served .queue__sq {
  background: var(--r-chart-now);
}

.queue__line li.is-you .queue__sq {
  box-shadow: inset 0 0 0 2px var(--r-brand);
  background: transparent;
}

.queue__line li.is-you {
  font-weight: var(--r-weight-medium);
}

.queue__word {
  color: var(--r-text-tertiary);
  text-align: right;
}

@container (min-width: 300px) {
  .queue__main {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
  .queue__people {
    justify-content: flex-end;
    max-width: 55%;
  }
}
</style>
