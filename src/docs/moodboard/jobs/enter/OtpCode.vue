<script setup lang="ts">
/**
 * A one-time code, one square box per character. Typing moves on, Backspace moves back, a paste
 * fills every box at once; the last character sends it for a check. A wrong code counts down the
 * tries, and the resend countdown rides the board's shared tick.
 */
import { computed, onMounted, ref, useId, watch } from 'vue'
import { CircleAlert, CircleCheck } from 'lucide-vue-next'
import { RButton, RStatus } from '@/design-system'
import { clock, timeZ, useTick } from '../../kit'
import { group as groupText, useTimers } from './shared'

const props = withDefaults(
  defineProps<{
    eyebrow: string
    /** A sentence over the boxes, for the larger tiles. */
    title?: string
    /** Says where the code came from: "Sent to +62 812 •••• 4471". */
    label: string
    length?: number
    /** A gap after every N boxes, as the code is printed. */
    group?: number
    /** Letters and digits (a pairing code) instead of digits only. */
    alnum?: boolean
    /** The code that passes; shown as the test code. */
    test: string
    /** Already typed when the tile opens (a wrong one shows the retry state). */
    initial?: string
    tries?: number
    /** Seconds before a new code can be sent; 0 for a printed code. */
    resend?: number
    /** Where the code is, instead of the test-code line: "Printed on the back of the lock". */
    note?: string
    /** Word on the lamp before anything is typed: "Sent", "Unpaired". */
    idle?: string
    done?: string
    /** Context for the larger tiles: what is being confirmed. */
    lines?: { label: string; value: string }[]
  }>(),
  { length: 6, tries: 3, resend: 0, idle: 'Sent', done: 'Verified', lines: () => [] },
)

const uid = useId()
const chars = ref<string[]>(Array.from({ length: props.length }, () => ''))
const phase = ref<'entry' | 'checking' | 'done' | 'locked'>('entry')
const left = ref(props.tries)
const wrong = ref(false)
const at = ref<Date | null>(null)
const boxes: (HTMLInputElement | null)[] = []
const { later } = useTimers()

const clean = (text: string) =>
  props.alnum ? text.toUpperCase().replace(/[^A-Z0-9]/g, '') : text.replace(/\D/g, '')

/* Resend countdown on the shared one-second tick: it only runs while the tile is on screen. */
const wait = ref(props.resend)
const tick = useTick(1000)
watch(tick, () => {
  if (wait.value > 0) wait.value--
})

const locked = computed(() => phase.value === 'locked')
const readonly = computed(() => phase.value !== 'entry')

function focusAt(i: number) {
  boxes[Math.max(0, Math.min(props.length - 1, i))]?.focus()
}

function fill(from: number, text: string) {
  if (readonly.value) return
  const add = clean(text).slice(0, props.length - from)
  if (!add) return
  const next = [...chars.value]
  for (let k = 0; k < add.length; k++) next[from + k] = add[k]
  chars.value = next
  wrong.value = false
  const last = from + add.length - 1
  if (next.every(Boolean)) check()
  else focusAt(last + 1)
}

function check() {
  phase.value = 'checking'
  const code = chars.value.join('')
  later(() => {
    if (code === clean(props.test)) {
      phase.value = 'done'
      at.value = new Date()
      return
    }
    fail()
    focusAt(0)
  }, 650)
}

function fail() {
  left.value = Math.max(0, left.value - 1)
  wrong.value = true
  chars.value = chars.value.map(() => '')
  phase.value = left.value > 0 ? 'entry' : 'locked'
}

function onBeforeInput(i: number, event: InputEvent) {
  if (!event.inputType.startsWith('insert')) return
  event.preventDefault()
  if (event.data) fill(i, event.data)
}

/* Anything that slips past beforeinput (an IME, autofill) is cleaned up here. */
function onInput(i: number, event: Event) {
  const el = event.target as HTMLInputElement
  const text = clean(el.value)
  el.value = chars.value[i]
  if (text.length > 1) fill(0, text)
  else if (text) fill(i, text)
}

function onPaste(i: number, event: ClipboardEvent) {
  event.preventDefault()
  const text = clean(event.clipboardData?.getData('text') ?? '')
  if (text) fill(text.length >= props.length ? 0 : i, text)
}

function set(i: number, value: string) {
  const next = [...chars.value]
  next[i] = value
  chars.value = next
}

function onKeydown(i: number, event: KeyboardEvent) {
  if (readonly.value) return
  const keys: Record<string, () => void> = {
    Backspace: () => {
      if (chars.value[i]) set(i, '')
      else if (i > 0) {
        set(i - 1, '')
        focusAt(i - 1)
      }
    },
    Delete: () => set(i, ''),
    ArrowLeft: () => focusAt(i - 1),
    ArrowRight: () => focusAt(i + 1),
    Home: () => focusAt(0),
    End: () => focusAt(props.length - 1),
  }
  const run = keys[event.key]
  if (!run) return
  event.preventDefault()
  run()
}

/* Select the character so typing replaces it; only if the box still has focus a moment later. */
function onFocus(event: FocusEvent) {
  const el = event.target as HTMLInputElement
  later(() => {
    if (document.activeElement === el) el.select()
  }, 0)
}

function restart() {
  chars.value = chars.value.map(() => '')
  left.value = props.tries
  wrong.value = false
  phase.value = 'entry'
  at.value = null
  wait.value = props.resend
}

onMounted(() => {
  if (!props.initial) return
  const text = clean(props.initial).slice(0, props.length)
  chars.value = chars.value.map((_, i) => text[i] ?? '')
  // A complete wrong code opens the tile in its retry state, without moving focus.
  if (text.length === props.length && text !== clean(props.test)) fail()
})

const gaps = computed(() => {
  const dashes = props.group ? Math.ceil(props.length / props.group) - 1 : 0
  return `${(props.length - 1) * 6 + dashes * 14}px`
})

const status = computed(() => {
  if (phase.value === 'done') return { tone: 'success' as const, label: props.done }
  if (phase.value === 'checking') return { tone: 'brand' as const, label: 'Checking' }
  if (locked.value) return { tone: 'danger' as const, label: 'Locked' }
  if (wrong.value) return { tone: 'danger' as const, label: 'Retry' }
  return { tone: 'neutral' as const, label: props.idle }
})

const message = computed(() => {
  if (locked.value) return 'No tries left. Send a new code.'
  if (wrong.value) return `That code does not match. ${left.value} ${left.value === 1 ? 'try' : 'tries'} left.`
  return ''
})

const testText = computed(() => groupText(clean(props.test), props.group ?? props.length))
const kind = computed(() => (props.alnum ? 'Character' : 'Digit'))
</script>

<template>
  <div class="mk en-root otp">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <RStatus size="sm" :tone="status.tone" :label="status.label" :pulse="phase === 'checking'" />
    </div>
    <p v-if="title" class="en-title otp__title">{{ title }}</p>
    <dl v-if="lines.length" class="otp__lines">
      <div v-for="line in lines" :key="line.label" class="otp__line">
        <dt>{{ line.label }}</dt>
        <dd class="mk-truncate">{{ line.value }}</dd>
      </div>
    </dl>

    <div class="otp__field" role="group" :aria-labelledby="`${uid}-label`">
      <span :id="`${uid}-label`" class="otp__label mk-truncate">{{ label }}</span>
      <div class="otp__boxes" :style="{ '--n': length, '--gaps': gaps }">
        <template v-for="(c, i) in chars" :key="i">
          <span v-if="group && i > 0 && i % group === 0" class="otp__dash" aria-hidden="true" />
          <span class="otp__cell en-box" :class="{ 'is-invalid': wrong, 'is-readonly': readonly }">
            <input
              :ref="(el) => (boxes[i] = el as HTMLInputElement | null)"
              class="en-control otp__input"
              :value="c"
              :inputmode="alnum ? 'text' : 'numeric'"
              :autocomplete="i === 0 ? 'one-time-code' : 'off'"
              :autocapitalize="alnum ? 'characters' : 'off'"
              spellcheck="false"
              :readonly="readonly"
              :aria-label="`${kind} ${i + 1} of ${length}`"
              :aria-invalid="wrong ? 'true' : undefined"
              :aria-describedby="message ? `${uid}-msg` : undefined"
              @beforeinput="onBeforeInput(i, $event as InputEvent)"
              @input="onInput(i, $event)"
              @keydown="onKeydown(i, $event)"
              @paste="onPaste(i, $event)"
              @focus="onFocus"
            />
          </span>
        </template>
      </div>
    </div>

    <div class="otp__foot mk-end">
      <div class="otp__status" aria-live="polite">
        <p v-if="message" :id="`${uid}-msg`" class="en-msg en-msg--error">
          <CircleAlert aria-hidden="true" />
          <span>{{ message }}</span>
        </p>
        <p v-else-if="phase === 'done' && at" class="en-msg en-msg--ok">
          <CircleCheck aria-hidden="true" />
          <span class="mk-truncate">{{ done }} {{ timeZ(at, 'WIB', true) }}</span>
        </p>
        <p v-else-if="note" class="en-msg mk-truncate">{{ note }}</p>
        <p v-else class="en-msg">
          <span class="mk-truncate">Test code <span class="r-mono">{{ testText }}</span></span>
        </p>
      </div>
      <RButton v-if="phase === 'done'" size="xs" variant="ghost" @click="restart">Again</RButton>
      <template v-else-if="resend">
        <span v-if="wait > 0 && !locked" class="r-label otp__wait">Resend {{ clock(wait) }}</span>
        <RButton v-else size="xs" variant="outline" @click="restart">Send new code</RButton>
      </template>
      <RButton v-else-if="locked" size="xs" variant="outline" @click="restart">Start over</RButton>
    </div>
  </div>
</template>

<style scoped>
.otp__lines {
  display: grid;
  margin: 0 0 4px;
  border-top: 1px solid var(--r-border-subtle);
}

.otp__line {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 5px 0;
  border-bottom: 1px solid var(--r-border-subtle);
  font-size: var(--r-text-xs);
}

.otp__line dt {
  flex: none;
  color: var(--r-text-tertiary);
}

.otp__line dd {
  margin: 0;
  text-align: right;
}

.otp__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.otp__label {
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  font-weight: var(--r-weight-medium);
  line-height: 1.3;
}

/* Box side follows the row: as wide as fits, 26–44px, always square. */
.otp__boxes {
  display: flex;
  align-items: center;
  gap: 6px;
  container-type: inline-size;
}

.otp__cell {
  --box: clamp(26px, calc((100cqi - var(--gaps)) / var(--n)), 44px);
  flex: none;
  width: var(--box);
  height: var(--box);
}

.otp__input {
  padding: 0;
  font-family: var(--r-font-mono);
  font-size: calc(var(--box) * 0.48);
  font-weight: var(--r-weight-medium);
  text-align: center;
  caret-color: var(--r-brand);
}

.otp__dash {
  flex: none;
  width: 8px;
  height: 1px;
  background: var(--r-border-strong);
}

.otp__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
  min-height: 24px;
}

.otp__status {
  min-width: 0;
}

.otp__wait {
  flex: none;
  font-variant-numeric: tabular-nums;
}
</style>
