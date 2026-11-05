<script setup lang="ts">
/**
 * An amount on a keypad, as at a till or a pump: the figure grows from the right, 000 adds the
 * thousands rupiah always carries, and one action takes it. Digits typed on a keyboard press the
 * same keys, so the pad lights up either way.
 */
import { computed, ref, useId } from 'vue'
import { CircleAlert, CircleCheck, Delete } from 'lucide-vue-next'
import { RButton, RStatus } from '@/design-system'
import { num, rp, timeZ } from '../../kit'
import { keepFocus, useTimers } from './shared'

const props = withDefaults(
  defineProps<{
    eyebrow: string
    meta?: string
    label?: string
    value?: number
    max?: number
    maxText?: string
    quick?: number[]
    /** Verb on the action: "Charge", "Top up", "Set preset". */
    action: string
    done: string
    /** A line after it lands; {amount} is replaced. */
    doneText?: string
    /** Price per unit: the pad also shows how much that buys (fuel by the litre). */
    unit?: { price: number; name: string }
    /** Geist Pixel display, for the instrument tiles. */
    pixel?: boolean
    /** What is on the card or account now; the line under the display shows it after. */
    balance?: number
    /** The quiet line under the display before anything is taken. */
    hint?: string
  }>(),
  { label: 'Amount', value: 0, quick: () => [] },
)

const uid = useId()
const root = ref<HTMLElement | null>(null)
const digits = ref(props.value ? String(Math.round(props.value)) : '')
const amount = computed(() => Number(digits.value || 0))
const state = ref<'entry' | 'done'>('entry')
const at = ref<Date | null>(null)
const down = ref<string | null>(null)
const { later } = useTimers()

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '000', '0', 'back'] as const
type Key = (typeof KEYS)[number]

function press(key: Key) {
  if (state.value !== 'entry') return
  if (key === 'back') digits.value = digits.value.slice(0, -1)
  else {
    const next = (digits.value + key).replace(/^0+/, '')
    if (next.length <= 11) digits.value = next
  }
  flash(key)
}

function flash(key: string) {
  down.value = key
  later(() => {
    if (down.value === key) down.value = null
  }, 110)
}

/* The pad answers keys typed while any part of it has focus: digits, Backspace, Enter, Escape. */
function onKeydown(event: KeyboardEvent) {
  if (event.metaKey || event.ctrlKey || event.altKey) return
  const onButton = (event.target as HTMLElement).tagName === 'BUTTON'
  if (/^\d$/.test(event.key)) {
    event.preventDefault()
    press(event.key as Key)
  } else if (event.key === 'Backspace') {
    event.preventDefault()
    press('back')
  } else if (event.key === 'Escape' && digits.value) {
    event.preventDefault()
    digits.value = ''
  } else if (event.key === 'Enter' && !onButton) {
    event.preventDefault()
    commit()
  }
}

/* Text that arrives without key presses (dictation, an on-screen keyboard) goes through the
   same keys; the field's own value never changes behind the pad's back. */
function onBeforeInput(event: InputEvent) {
  event.preventDefault()
  if (event.inputType.startsWith('delete')) press('back')
  else for (const d of (event.data ?? '').replace(/\D/g, '')) press(d as Key)
}

function onPaste(event: ClipboardEvent) {
  event.preventDefault()
  const pasted = (event.clipboardData?.getData('text') ?? '').replace(/\D/g, '').replace(/^0+/, '').slice(0, 11)
  if (pasted && state.value === 'entry') digits.value = pasted
}

const problem = computed(() =>
  props.max != null && amount.value > props.max ? `${props.maxText ?? 'Over the limit of'} ${rp(props.max)}` : '',
)
const ready = computed(() => amount.value > 0 && !problem.value)

function commit() {
  if (!ready.value || state.value !== 'entry') return
  keepFocus(root)
  state.value = 'done'
  at.value = new Date()
}

function reset() {
  keepFocus(root)
  state.value = 'entry'
  digits.value = ''
  at.value = null
}

const shown = computed(() => (digits.value ? num(amount.value).replace(/,/g, '.') : '0'))
const ghost = computed(() => '8'.repeat(Math.max(shown.value.replace(/\./g, '').length, 6)))
const units = computed(() => (props.unit && amount.value ? amount.value / props.unit.price : 0))
const actionText = computed(() => (amount.value ? `${props.action} ${rp(amount.value)}` : props.action))
const doneLine = computed(() => (props.doneText ?? '{amount}').replace('{amount}', rp(amount.value)))
</script>

<template>
  <div ref="root" class="mk en-root pad" :class="{ 'pad--pixel': pixel }" @keydown="onKeydown">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <RStatus v-if="state === 'done'" size="sm" tone="success" :label="done" />
      <span v-else-if="meta" class="en-meta">{{ meta }}</span>
    </div>

    <div class="pad__display en-box" :class="{ 'is-invalid': !!problem }">
      <span class="pad__symbol" aria-hidden="true">Rp</span>
      <span v-if="pixel" class="pad__ghost r-pixel" aria-hidden="true">{{ ghost }}</span>
      <input
        :id="`${uid}-in`"
        class="en-control pad__figure"
        :class="{ 'r-pixel': pixel }"
        :value="shown"
        inputmode="none"
        autocomplete="off"
        :aria-label="`${label}, rupiah. Type digits or use the keypad`"
        :aria-describedby="`${uid}-msg`"
        @beforeinput="onBeforeInput($event as InputEvent)"
        @paste="onPaste"
      />
    </div>

    <div v-if="unit" class="pad__buys" aria-hidden="true">
      <span class="r-label">Litres</span>
      <span class="pad__litres" :class="{ 'r-pixel': pixel }">{{ num(units, 2) }}</span>
      <span class="mk-unit">{{ unit.name }}</span>
    </div>

    <p :id="`${uid}-msg`" class="en-msg pad__msg" :class="{ 'en-msg--error': problem, 'en-msg--ok': state === 'done' }" aria-live="polite">
      <CircleAlert v-if="problem" aria-hidden="true" />
      <CircleCheck v-else-if="state === 'done'" aria-hidden="true" />
      <span class="mk-truncate">
        <template v-if="problem">{{ problem }}</template>
        <template v-else-if="state === 'done' && at">{{ doneLine }} · {{ timeZ(at) }}</template>
        <template v-else-if="unit">{{ rp(unit.price) }} per {{ unit.name }}</template>
        <template v-else-if="balance != null">Balance {{ rp(balance) }}<template v-if="amount"> → {{ rp(balance + amount) }}</template></template>
        <template v-else>{{ hint ?? 'Type or tap the amount' }}</template>
      </span>
    </p>

    <div v-if="quick.length && state === 'entry'" class="pad__quick">
      <button
        v-for="q in quick"
        :key="q"
        type="button"
        class="en-key pad__preset"
        tabindex="-1"
        :aria-label="rp(q)"
        @click="digits = String(q)"
      >
        {{ num(q / 1000) }}rb
      </button>
    </div>

    <div class="pad__keys mk-grow" role="group" :aria-label="`${label} keypad`">
      <button
        v-for="k in KEYS"
        :key="k"
        type="button"
        class="en-key"
        :class="{ 'is-down': down === k, 'pad__back': k === 'back' }"
        tabindex="-1"
        :disabled="state !== 'entry'"
        :aria-label="k === 'back' ? 'Delete last digit' : k"
        @click="press(k)"
      >
        <Delete v-if="k === 'back'" aria-hidden="true" />
        <template v-else>{{ k }}</template>
      </button>
    </div>

    <RButton v-if="state === 'entry'" tone="brand" block :disabled="!ready" @click="commit">{{ actionText }}</RButton>
    <RButton v-else variant="outline" block @click="reset">New amount</RButton>
  </div>
</template>

<style scoped>
.pad {
  gap: 8px;
}

.pad__display {
  flex: none;
  height: var(--r-control-xl);
}

.pad__symbol {
  flex: none;
  padding-left: 12px;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-sm);
}

.pad__figure {
  padding: 0 12px 0 8px;
  font-size: var(--r-text-2xl);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-tight);
  text-align: right;
  cursor: default;
}

/* The pixel display: unlit 8s behind the figure, as on a pump's LCD. */
.pad--pixel .pad__figure {
  position: relative;
  z-index: 1;
  font-weight: 400;
  letter-spacing: 0.02em;
}

.pad__ghost {
  position: absolute;
  right: 12px;
  color: var(--r-text);
  font-size: var(--r-text-2xl);
  letter-spacing: 0.02em;
  opacity: 0.08;
  pointer-events: none;
}

.pad__msg {
  min-height: 17px;
}

/* What the money buys, read on the pump's second line. */
.pad__buys {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid var(--r-border);
  background: var(--r-bg-muted);
}

.pad__buys .r-label {
  margin-right: auto;
}

.pad__litres {
  font-size: var(--r-text-2xl);
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.pad__quick {
  display: grid;
  grid-auto-columns: 1fr;
  grid-auto-flow: column;
  gap: 4px;
  height: 28px;
}

.pad__preset {
  font-size: var(--r-text-xs);
}

.pad__keys {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  grid-template-rows: repeat(4, minmax(28px, 48px));
  align-content: end;
  gap: 4px;
  min-height: 0;
}

.pad__keys .en-key.is-down {
  background: var(--r-bg-pressed);
}

.pad__back {
  color: var(--r-text-secondary);
}
</style>
