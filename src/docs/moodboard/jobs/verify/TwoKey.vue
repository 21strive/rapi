<script setup lang="ts">
/**
 * The two-person rule. The first approval is already on the record with a name, a time and a
 * method; the second slot is the control itself, held down by the second person. For a few
 * seconds after, the second approval can be withdrawn; then the action runs and the record closes.
 */
import { computed, ref } from 'vue'
import { Check } from 'lucide-vue-next'
import { RButton, RStatus } from '@/design-system'
import { usePressHold } from '../../kit'
import { focusAfter, stamp, useCountdown } from './shared'

interface Approver {
  name: string
  role?: string
  at: string
  method?: string
}

const props = withDefaults(
  defineProps<{
    eyebrow: string
    title: string
    figure?: string
    first: Approver
    /** The second person, the one holding the control. */
    you: string
    action?: string
    /** Word for the record once it has run: "Released", "Loaded". */
    done?: string
    note?: string
    holdMs?: number
    undoFor?: number
    /** slots: two ruled cells · keys: two key switches, for instrument panels. */
    look?: 'slots' | 'keys'
    /** card 2x2 · row 2x1 · stack 1x2. */
    layout?: 'card' | 'row' | 'stack'
  }>(),
  { action: 'Hold to approve', done: 'Released', holdMs: 1200, undoFor: 10, look: 'slots', layout: 'card' },
)

type State = 'waiting' | 'approved' | 'final'
const state = ref<State>('waiting')
const root = ref<HTMLElement | null>(null)
const at = ref('')

const {
  left: undoLeft,
  start: startUndo,
  stop: stopUndo,
} = useCountdown(props.undoFor, () => {
  if (state.value === 'approved') state.value = 'final'
})

const { progress, holding, handlers, reset } = usePressHold(props.holdMs, () => {
  state.value = 'approved'
  at.value = stamp()
  startUndo()
  focusAfter(root.value, '.two__foot button')
})

function withdraw() {
  stopUndo()
  state.value = 'waiting'
  at.value = ''
  reset()
  focusAfter(root.value, '.two__hold, .two__plate--live')
}

const count = computed(() => (state.value === 'waiting' ? 1 : 2))
const status = computed(() =>
  state.value === 'final'
    ? { tone: 'success' as const, label: props.done }
    : state.value === 'approved'
      ? { tone: 'success' as const, label: '2 of 2' }
      : { tone: 'warning' as const, label: '1 of 2' },
)
const holdText = computed(() => (holding.value ? 'Keep holding' : props.action))
</script>

<template>
  <div ref="root" class="mk two" :class="[`two--${layout}`, `two--${look}`]">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <RStatus :tone="status.tone" :label="status.label" size="sm" />
    </div>

    <p class="two__title">{{ title }}</p>
    <p v-if="figure" class="two__figure mk-fig">{{ figure }}</p>

    <!-- Slots: the second cell is the hold control. -->
    <div v-if="look === 'slots'" class="two__slots mk-grow">
      <div class="two__slot is-filled">
        <span class="two__n">1</span>
        <span class="two__name mk-truncate"><Check :size="14" aria-hidden="true" class="two__check" />{{ first.name }}</span>
        <span v-if="first.role && layout !== 'row'" class="two__sub mk-truncate">{{ first.role }}</span>
        <span class="two__at">{{ first.at }}<template v-if="first.method && layout !== 'row'"> · {{ first.method }}</template></span>
      </div>

      <button
        v-if="state === 'waiting'"
        type="button"
        class="two__slot two__hold"
        :class="{ 'is-holding': holding }"
        :style="{ '--progress': progress }"
        :aria-label="`${action} as the second person, ${you}: press and hold`"
        v-bind="handlers"
      >
        <span class="two__n">2</span>
        <span class="two__name">{{ holdText }}</span>
        <span class="two__sub mk-truncate">as {{ you }}</span>
      </button>
      <div v-else class="two__slot is-filled is-you">
        <span class="two__n">2</span>
        <span class="two__name mk-truncate"><Check :size="14" aria-hidden="true" class="two__check" />{{ you }}</span>
        <span v-if="layout !== 'row'" class="two__sub">You, just now</span>
        <span class="two__at">{{ at }}</span>
      </div>
    </div>

    <!-- Keys: key A is turned; key B turns while it is held. -->
    <div v-else class="two__keys mk-grow">
      <div class="two__key">
        <span class="two__lamp is-on"><span class="two__led" aria-hidden="true" />Turned</span>
        <span class="two__plate" aria-hidden="true"><span class="two__bar" :style="{ '--turn': 1 }" /></span>
        <span class="two__keyname">Key A</span>
        <span class="two__keywho mk-truncate">{{ first.name }}</span>
        <span class="two__at">{{ first.at }}</span>
      </div>
      <div class="two__key">
        <span class="two__lamp" :class="{ 'is-on': state !== 'waiting' }">
          <span class="two__led" aria-hidden="true" />{{ state === 'waiting' ? 'Off' : 'Turned' }}
        </span>
        <button
          v-if="state === 'waiting'"
          type="button"
          class="two__plate two__plate--live"
          :aria-label="`Turn key B as ${you}: press and hold`"
          v-bind="handlers"
        >
          <span class="two__bar" :style="{ '--turn': progress }" />
        </button>
        <span v-else class="two__plate" aria-hidden="true"><span class="two__bar" :style="{ '--turn': 1 }" /></span>
        <span class="two__keyname">Key B</span>
        <span class="two__keywho mk-truncate">{{ state === 'waiting' ? `Hold · ${you}` : you }}</span>
        <span class="two__at">{{ state === 'waiting' ? '—' : at }}</span>
      </div>
    </div>

    <div class="two__foot">
      <template v-if="state === 'approved'">
        <span class="two__note">{{ count }} of 2 · runs in {{ undoLeft }} s</span>
        <RButton size="xs" variant="ghost" @click="withdraw">Withdraw</RButton>
      </template>
      <template v-else-if="state === 'final'">
        <span class="two__note">{{ done }} at {{ at }}</span>
        <RButton size="xs" variant="ghost" @click="withdraw">Reset</RButton>
      </template>
      <span v-else class="two__note">{{ note ?? 'Needs a second person before it runs.' }}</span>
    </div>
  </div>
</template>

<style scoped>
.two {
  gap: 8px;
}

.two__title {
  font-size: var(--r-text-md);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-snug);
  line-height: var(--r-leading-snug);
}

.two__figure {
  overflow: hidden;
  font-size: var(--r-text-2xl);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.two__slots {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0;
  border: 1px solid var(--r-border);
}

.two__slot {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 2px;
  min-width: 0;
  padding: 8px 10px;
  overflow: hidden;
  text-align: left;
}

.two__slot + .two__slot {
  border-left: 1px solid var(--r-border);
}

.two__n {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-variant-numeric: tabular-nums;
}

.two__name {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-semibold);
}

.two__check {
  color: var(--r-success-text);
}

.two__sub {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

.two__at {
  margin-top: auto;
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-variant-numeric: tabular-nums;
}

/* The second slot is the control: an ink key that fills while it is held. */
.two__hold {
  margin: 0;
  border: 0;
  background: var(--r-ink);
  color: var(--r-on-ink);
  font: inherit;
  cursor: pointer;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}

.two__hold .two__n,
.two__hold .two__sub {
  color: color-mix(in srgb, var(--r-on-ink) 70%, transparent);
}

.two__hold::before {
  content: '';
  position: absolute;
  inset: 0;
  background: color-mix(in srgb, var(--r-on-ink) 22%, transparent);
  transform: scaleX(var(--progress));
  transform-origin: left center;
}

.two__hold > * {
  position: relative;
}

.two__hold:hover {
  background: var(--r-ink-hover);
}

.two__hold:focus-visible {
  outline: 2px solid var(--r-focus);
  outline-offset: -4px;
}

.two__foot {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 24px;
}

.two__note {
  min-width: 0;
  overflow: hidden;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Row 2x1: no figure line, slots stay side by side, no index line. */
.two--row .two__title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.two--row .two__slot {
  justify-content: center;
  padding: 5px 8px;
}
.two--row .two__n {
  display: none;
}
.two--row .two__at {
  margin-top: 0;
}

/* Stack 1x2: one slot above the other. */
.two--stack .two__slots {
  grid-template-columns: minmax(0, 1fr);
}
.two--stack .two__slot + .two__slot {
  border-top: 1px solid var(--r-border);
  border-left: 0;
}
.two--stack .two__note {
  white-space: normal;
  line-height: var(--r-leading-snug);
}

/* Keys: two switches on a plate, as in a crypto room. */
.two__keys {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: start;
  gap: 8px;
}

.two__key {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 0;
  text-align: center;
}

.two__lamp {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.two__led {
  width: 8px;
  height: 8px;
  background: var(--r-status-off);
}

.two__lamp.is-on {
  color: var(--r-text);
}

.two__lamp.is-on .two__led {
  background: var(--r-status-good);
}

.two__plate {
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  margin: 2px 0;
  padding: 0;
  border: 1px solid var(--r-border-strong);
  background: var(--r-bg-muted);
}

.two__plate--live {
  cursor: pointer;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}

.two__plate--live:hover {
  border-color: var(--r-text-secondary);
  background: var(--r-bg-hover);
}

.two__bar {
  width: 8px;
  height: 40px;
  background: var(--r-ink);
  transform: rotate(calc(var(--turn) * 90deg));
}

.two__keyname {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-caps);
  text-transform: uppercase;
}

.two__keywho {
  max-width: 100%;
  font-size: var(--r-text-xs);
}

.two__keys .two__at {
  margin-top: 0;
}
</style>
