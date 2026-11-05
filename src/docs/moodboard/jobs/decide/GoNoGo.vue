<script setup lang="ts">
/**
 * A go/no-go poll. The stations report in turn, each a lamp and a word; the person's own station
 * is last, and their call settles the verdict. One look says whether everyone is go and who is
 * holding it up.
 */
import { computed, ref, watch } from 'vue'
import { RButton, RStatus, type StatusTone } from '@/design-system'
import { timeZ, useTick, type Zone } from '../../kit'
import { holdFocus } from './shared'

interface Station {
  label: string
  /** What the station will say when polled. */
  answer: 'go' | 'nogo'
  /** Why, for a no-go: "Fishing boat in sector 4". */
  note?: string
}

const props = withDefaults(
  defineProps<{
    eyebrow: string
    title?: string
    stations: Station[]
    /** The reader's own station: "Flight". */
    mine: string
    /** The verdict when everyone is go: "Go for launch". */
    go: string
    zone?: Zone
    /** `column` a list (1x2, 1x3, 2x2) · `row` cells in a strip (4x1) · `mine` only your call (1x1). */
    layout?: 'column' | 'row' | 'mine'
  }>(),
  { title: undefined, zone: 'WIB', layout: 'column' },
)

const root = ref<HTMLElement | null>(null)
/** How many stations have reported. */
const reported = ref(props.layout === 'mine' ? props.stations.length : 0)
const polling = ref(false)
const call = ref<'go' | 'nogo' | null>(null)
const at = ref<Date | null>(null)

const tick = useTick(450)
watch(tick, () => {
  if (!polling.value) return
  reported.value++
  if (reported.value >= props.stations.length) polling.value = false
})

function start() {
  const restore = holdFocus(root)
  reported.value = 0
  call.value = null
  polling.value = true
  restore('[data-focus="poll"]')
}

const yourTurn = computed(() => reported.value >= props.stations.length && !polling.value)

function answer(value: 'go' | 'nogo') {
  if (!yourTurn.value) return
  const restore = holdFocus(root)
  call.value = value
  at.value = new Date()
  restore('[data-focus="poll"]')
}

function repoll() {
  const restore = holdFocus(root)
  call.value = null
  at.value = null
  if (props.layout === 'mine') reported.value = props.stations.length
  else start()
  restore(props.layout === 'mine' ? '[data-focus="go"]' : '[data-focus="poll"]')
}

function lamp(i: number): { tone: StatusTone; label: string; pulse: boolean } {
  if (i < reported.value) {
    const s = props.stations[i]
    return s.answer === 'go' ? { tone: 'success', label: 'Go', pulse: false } : { tone: 'danger', label: 'No go', pulse: false }
  }
  if (polling.value && i === reported.value) return { tone: 'signal', label: 'Polling', pulse: true }
  return { tone: 'neutral', label: '—', pulse: false }
}

const goCount = computed(() => props.stations.slice(0, reported.value).filter((s) => s.answer === 'go').length)
const allGo = computed(() => goCount.value + (call.value === 'go' ? 1 : 0))
const holdBy = computed(() => props.stations.slice(0, reported.value).find((s) => s.answer === 'nogo'))
const verdict = computed<{ tone: StatusTone; label: string; why: string } | null>(() => {
  if (!call.value) return null
  if (call.value === 'nogo') return { tone: 'warning', label: 'Hold', why: `${props.mine} is no go` }
  if (holdBy.value) return { tone: 'warning', label: 'Hold', why: `${holdBy.value.label}: ${holdBy.value.note ?? 'no go'}` }
  return { tone: 'success', label: props.go, why: `All ${props.stations.length + 1} stations go` }
})
</script>

<template>
  <div ref="root" class="mk poll" :class="`poll--${layout}`">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <span v-if="layout !== 'mine'" class="r-label poll__count">{{ allGo }}/{{ stations.length + 1 }} go</span>
    </div>
    <p v-if="title" class="poll__title">{{ title }}</p>

    <p v-if="layout === 'mine'" class="poll__big">
      <span class="r-pixel poll__digits">{{ goCount }}/{{ stations.length }}</span>
      <span class="r-label">stations go</span>
    </p>

    <ol v-else class="poll__list" :aria-label="`${eyebrow} stations`">
      <li v-for="(s, i) in stations" :key="s.label" class="poll__row">
        <span class="poll__name">{{ s.label }}</span>
        <RStatus :tone="lamp(i).tone" :label="lamp(i).label" :pulse="lamp(i).pulse" shape="square" size="sm" />
      </li>
      <li class="poll__row poll__row--mine" :class="{ 'is-turn': yourTurn && !call }">
        <span class="poll__name">{{ mine }} <span class="poll__you">you</span></span>
        <RStatus
          v-if="call"
          :tone="call === 'go' ? 'success' : 'danger'"
          :label="call === 'go' ? 'Go' : 'No go'"
          shape="square"
          size="sm"
        />
        <span v-else class="r-label">{{ yourTurn ? 'Your call' : 'Waiting' }}</span>
      </li>
    </ol>

    <div class="poll__foot mk-end">
      <div v-if="verdict" class="poll__verdict">
        <RStatus :tone="verdict.tone" :label="verdict.label" size="sm" />
        <span class="poll__why mk-truncate">{{ verdict.why }}</span>
        <span class="poll__at r-mono">{{ at ? timeZ(at, zone) : '' }}</span>
      </div>
      <div v-if="yourTurn && !call" class="poll__keys" role="group" :aria-label="`${mine}: your call`">
        <button type="button" class="poll__key poll__key--go mk-reset" data-focus="go" @click="answer('go')">Go</button>
        <button type="button" class="poll__key poll__key--nogo mk-reset" @click="answer('nogo')">No go</button>
      </div>
      <RButton
        v-else-if="!call"
        variant="outline"
        size="sm"
        block
        :disabled="polling"
        data-focus="poll"
        @click="start"
      >
        {{ polling ? `Polling ${reported + 1} of ${stations.length}` : 'Start the poll' }}
      </RButton>
      <RButton v-else variant="ghost" size="xs" class="poll__again" data-focus="poll" @click="repoll">
        {{ layout === 'mine' ? 'Change my call' : 'Poll again' }}
      </RButton>
    </div>
  </div>
</template>

<style scoped>
.poll {
  container-type: inline-size;
  gap: 8px;
}

.poll__count {
  flex: none;
  font-variant-numeric: tabular-nums;
}

@container (max-width: 220px) {
  .poll__count {
    display: none;
  }
}

.poll__title {
  font-size: var(--r-text-md);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-snug);
  line-height: 1.3;
}

.poll__list {
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--r-border);
}

.poll__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
  height: 28px;
  border-bottom: 1px solid var(--r-border-subtle);
}

.poll__name {
  min-width: 0;
  overflow: hidden;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-weight: var(--r-weight-medium);
  letter-spacing: 0.06em;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
}

.poll__you {
  color: var(--r-text-tertiary);
}

/* Your row: a 2px cobalt rule on its leading edge, like a selected table row. */
.poll__row--mine {
  margin: 0 -12px;
  padding: 0 12px 0 10px;
  border-left: 2px solid transparent;
}
.poll__row--mine.is-turn {
  border-left-color: var(--r-brand);
  background: var(--r-bg-selected);
}

.poll__foot {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.poll__verdict {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  padding: 6px 8px;
  border: 1px solid var(--r-border);
  background: var(--r-bg-muted);
}

.poll__why {
  flex: 1 1 auto;
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
}

.poll__at {
  flex: none;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

.poll__keys {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

/* The two keys of the call: square, ruled, mono caps; the go key is the heavier one. */
.poll__key {
  display: flex;
  align-items: center;
  justify-content: center;
  height: var(--r-control-md);
  border: 1px solid var(--r-border-strong);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  transition: background-color var(--r-duration-fast) var(--r-ease-out);
}

.poll__key--go {
  border-color: var(--r-ink);
  background: var(--r-ink);
  color: var(--r-on-ink);
}
.poll__key--go:hover {
  background: var(--r-ink-hover);
}

.poll__key--nogo:hover {
  background: var(--r-bg-hover);
}

.poll__again {
  align-self: flex-end;
}

/* 1x1: the count of go stations, large, and your call. */
.poll__big {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.poll__digits {
  font-size: var(--r-text-3xl);
  line-height: 1;
}

.poll--mine .poll__verdict {
  padding: 4px 6px;
}

.poll--mine .poll__at {
  display: none;
}

/* 4x1: the stations become cells in one ruled row. Clamped to two columns on a phone, the cells
   shrink and their names end in an ellipsis instead of pushing out of the tile. */
.poll--row .poll__name {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@container (max-width: 520px) {
  .poll--row .poll__row,
  .poll--row .poll__row--mine {
    padding: 6px 4px;
  }
  .poll--row .poll__you {
    display: none;
  }
}

.poll--row .poll__list {
  flex-direction: row;
  border-top: 0;
  border-left: 1px solid var(--r-border-subtle);
}

.poll--row .poll__row {
  flex: 1 1 0;
  min-width: 0;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 4px;
  height: auto;
  padding: 6px 8px;
  border-right: 1px solid var(--r-border-subtle);
  border-bottom: 0;
}

.poll--row .poll__row--mine {
  position: relative;
  margin: 0;
  padding: 6px 8px;
  border-left: 0;
}
.poll--row .poll__row--mine.is-turn::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  height: 2px;
  background: var(--r-brand);
}

.poll--row .poll__foot {
  flex-direction: row;
  align-items: center;
}

.poll--row .poll__foot > * {
  flex: 1 1 0;
}

.poll--row .poll__again {
  flex: none;
}
</style>
