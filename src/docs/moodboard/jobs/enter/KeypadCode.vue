<script setup lang="ts">
/**
 * A code keyed in on a pad: a prepaid meter token from a receipt, a locker code from an SMS, an
 * alarm code. The display shows each key back (or a square for a hidden one), the pad works by
 * tap or keyboard, and Enter sends it.
 */
import { computed, ref, useId } from 'vue'
import { CircleAlert, CircleCheck, CornerDownLeft, Delete } from 'lucide-vue-next'
import { RStatus } from '@/design-system'
import { timeZ } from '../../kit'
import { useTimers } from './shared'

const props = withDefaults(
  defineProps<{
    eyebrow: string
    label: string
    length: number
    /** Display groups, as the code is printed. */
    groupSize?: number
    /** Hidden digits: squares instead of figures. */
    masked?: boolean
    test: string
    /** Typed already when the tile opens. */
    initial?: string
    /** Check as soon as the last digit is in (short codes); long tokens wait for Enter. */
    auto?: boolean
    done: string
    doneText: string
    errorText: string
    /** Two states the right code switches between, e.g. ["Disarmed", "Armed"]. */
    states?: [string, string]
    /** Where the code comes from; with `fill`, a button types it in. */
    note?: string
    fill?: boolean
    pixel?: boolean
    layout?: 'grid' | 'row'
    /** What the panel watches, read before arming: a lamp and a word each. */
    zones?: { name: string; state: string; tone: 'success' | 'warning' | 'danger' | 'neutral' }[]
  }>(),
  { groupSize: 0, layout: 'grid' },
)

const uid = useId()
const code = ref((props.initial ?? '').replace(/\D/g, '').slice(0, props.length))
const phase = ref<'entry' | 'checking' | 'done' | 'error'>('entry')
const at = ref<Date | null>(null)
const armed = ref(false)
const down = ref<string | null>(null)
const input = ref<HTMLInputElement | null>(null)
const { later } = useTimers()

const KEYS = computed(() =>
  props.layout === 'row'
    ? ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'back', 'enter']
    : ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'back', '0', 'enter'],
)

function flash(key: string) {
  down.value = key
  later(() => {
    if (down.value === key) down.value = null
  }, 110)
}

function type(d: string) {
  if (phase.value === 'checking') return
  if (phase.value !== 'entry') {
    phase.value = 'entry'
    code.value = ''
  }
  if (code.value.length >= props.length) return
  code.value += d
  flash(d)
  if (props.auto && code.value.length === props.length) submit()
}

function back() {
  if (phase.value === 'checking') return
  if (phase.value !== 'entry') phase.value = 'entry'
  code.value = code.value.slice(0, -1)
  flash('back')
}

function submit() {
  if (phase.value === 'checking') return
  flash('enter')
  if (code.value.length < props.length) {
    phase.value = 'error'
    return
  }
  phase.value = 'checking'
  later(() => {
    if (code.value === props.test) {
      phase.value = 'done'
      at.value = new Date()
      armed.value = !armed.value
      if (props.states) code.value = ''
    } else {
      phase.value = 'error'
      code.value = ''
    }
  }, 550)
}

function press(key: string) {
  if (key === 'back') back()
  else if (key === 'enter') submit()
  else type(key)
}

/* Keys typed into the display. It is a real field, so paste and screen readers work as usual. */
function onBeforeInput(event: InputEvent) {
  event.preventDefault()
  if (!event.inputType.startsWith('insert')) return
  for (const d of (event.data ?? '').replace(/\D/g, '')) type(d)
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Backspace') {
    event.preventDefault()
    back()
  } else if (event.key === 'Enter') {
    event.preventDefault()
    submit()
  } else if (event.key === 'Escape' && code.value) {
    event.preventDefault()
    code.value = ''
    phase.value = 'entry'
  }
}

function onPaste(event: ClipboardEvent) {
  event.preventDefault()
  const digits = (event.clipboardData?.getData('text') ?? '').replace(/\D/g, '').slice(0, props.length)
  if (!digits || phase.value === 'checking') return
  phase.value = 'entry'
  code.value = digits
}

function fillFromNote() {
  phase.value = 'entry'
  code.value = props.test
  input.value?.focus()
}

/* The note's trailing code in mono: "Receipt 5813 0274 …" → "Receipt" + the digits. */
const noteMatch = computed(() => /^(.*?)\s*([\d][\d\s-]*)$/.exec(props.note ?? ''))
const noteText = computed(() => (noteMatch.value ? noteMatch.value[1] : props.note ?? ''))
const noteCode = computed(() => (noteMatch.value ? noteMatch.value[2] : ''))

/* Display cells: the typed digit, or an unlit one. */
const cells = computed(() =>
  Array.from({ length: props.length }, (_, i) => ({
    on: i < code.value.length,
    char: code.value[i] ?? (props.pixel ? '8' : '·'),
    gap: !!props.groupSize && i > 0 && i % props.groupSize === 0,
  })),
)

const status = computed(() => {
  if (props.states) return { tone: armed.value ? ('brand' as const) : ('neutral' as const), label: props.states[armed.value ? 1 : 0] }
  if (phase.value === 'done') return { tone: 'success' as const, label: props.done }
  if (phase.value === 'error') return { tone: 'danger' as const, label: 'Rejected' }
  if (phase.value === 'checking') return { tone: 'brand' as const, label: 'Checking' }
  return { tone: 'neutral' as const, label: `${code.value.length}/${props.length}` }
})

const message = computed(() => {
  if (phase.value === 'error')
    return code.value.length && code.value.length < props.length
      ? { tone: 'error', text: `${props.length - code.value.length} more digits to go` }
      : { tone: 'error', text: props.errorText }
  if (phase.value === 'done' && at.value) {
    const text = props.states ? `${props.states[armed.value ? 1 : 0]} ${timeZ(at.value)}` : `${props.doneText} · ${timeZ(at.value)}`
    return { tone: 'ok', text }
  }
  return null
})
</script>

<template>
  <div class="mk en-root kc" :class="[`kc--${layout}`, { 'kc--pixel': pixel }]">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <RStatus size="sm" :tone="status.tone" :label="status.label" :pulse="phase === 'checking'" />
    </div>

    <div class="kc__display en-box" :class="{ 'is-invalid': phase === 'error' }">
      <span class="kc__cells" :class="{ 'r-pixel': pixel, 'kc__cells--masked': masked }" aria-hidden="true">
        <template v-for="(c, i) in cells" :key="i">
          <span v-if="c.gap" class="kc__gap" />
          <span v-if="masked" class="kc__dot" :class="{ 'is-on': c.on }" />
          <span v-else class="kc__char" :class="{ 'is-on': c.on }">{{ c.char }}</span>
        </template>
      </span>
      <input
        :id="`${uid}-in`"
        ref="input"
        class="kc__input"
        :value="code"
        inputmode="none"
        autocomplete="off"
        spellcheck="false"
        :aria-label="`${label}, ${length} digits${masked ? ', hidden' : ''}. Type digits or use the keypad, Enter to send`"
        :aria-describedby="`${uid}-msg`"
        @beforeinput="onBeforeInput($event as InputEvent)"
        @keydown="onKeydown"
        @paste="onPaste"
      />
    </div>

    <div :id="`${uid}-msg`" class="kc__msg" aria-live="polite">
      <p v-if="message" class="en-msg" :class="message.tone === 'ok' ? 'en-msg--ok' : 'en-msg--error'">
        <CircleCheck v-if="message.tone === 'ok'" aria-hidden="true" />
        <CircleAlert v-else aria-hidden="true" />
        <span class="mk-truncate">{{ message.text }}</span>
      </p>
      <p v-else-if="note" class="en-msg">
        <span class="mk-truncate">{{ noteText }} <span class="r-mono">{{ noteCode }}</span></span>
        <button v-if="fill" type="button" class="en-link kc__fill" @click="fillFromNote">Fill in</button>
      </p>
      <p v-else class="en-msg"><span class="mk-truncate">{{ label }}</span></p>
    </div>

    <ul v-if="zones?.length" class="kc__zones" aria-label="Zones">
      <li v-for="z in zones" :key="z.name">
        <span class="mk-truncate">{{ z.name }}</span>
        <RStatus size="sm" :tone="z.tone" :label="z.state" />
      </li>
    </ul>

    <div class="kc__keys mk-grow" role="group" :aria-label="`${label} keypad`">
      <button
        v-for="k in KEYS"
        :key="k"
        type="button"
        class="en-key"
        :class="{ 'is-down': down === k, 'kc__enter': k === 'enter' }"
        tabindex="-1"
        :aria-label="k === 'back' ? 'Delete last digit' : k === 'enter' ? 'Enter' : k"
        @click="press(k)"
      >
        <Delete v-if="k === 'back'" aria-hidden="true" />
        <CornerDownLeft v-else-if="k === 'enter'" aria-hidden="true" />
        <template v-else>{{ k }}</template>
      </button>
    </div>
  </div>
</template>

<style scoped>
.kc__display {
  flex: none;
  justify-content: center;
  height: var(--r-control-xl);
  overflow: hidden;
}

/* The real field lies over the display: clicks focus it, keys and paste go through it. */
.kc__input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  padding: 0;
  border: 0;
  outline: none;
  background: transparent;
  color: transparent;
  caret-color: transparent;
  font-size: 1px;
  cursor: text;
}
.kc__input::selection {
  background: transparent;
}

.kc__cells {
  display: flex;
  align-items: center;
  gap: 1px;
  min-width: 0;
  padding: 0 8px;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-lg);
  font-variant-numeric: tabular-nums;
  line-height: 1;
  white-space: nowrap;
}

.kc__cells.r-pixel {
  font-family: var(--r-font-pixel);
  font-size: var(--r-text-xl);
}

.kc__gap {
  width: 8px;
}

.kc__char {
  color: var(--r-text);
  opacity: 0.16;
}
.kc__char.is-on {
  opacity: 1;
}

.kc__cells--masked {
  gap: 8px;
}

.kc__dot {
  width: 12px;
  height: 12px;
  border: 1px solid var(--r-border-control);
}
.kc__dot.is-on {
  border-color: var(--r-text);
  background: var(--r-text);
}

.kc__msg {
  min-height: 17px;
}

.kc__fill {
  flex: none;
  margin-left: auto;
}

.kc__zones {
  display: grid;
  border-top: 1px solid var(--r-border-subtle);
}

.kc__zones li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
  padding: 5px 0;
  border-bottom: 1px solid var(--r-border-subtle);
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
}

.kc__zones li > .r-status {
  flex: none;
}

.kc__keys {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  grid-template-rows: repeat(4, minmax(26px, 52px));
  align-content: end;
  gap: 4px;
}

.kc--row .kc__keys {
  grid-template-columns: repeat(12, minmax(0, 1fr));
  grid-template-rows: minmax(28px, 40px);
}

.kc__keys .en-key.is-down {
  background: var(--r-bg-pressed);
}

.kc__enter {
  background: var(--r-ink);
  color: var(--r-on-ink);
  border-color: var(--r-ink);
}
.kc__enter:hover,
.kc__keys .kc__enter.is-down {
  background: var(--r-ink-hover);
}

.kc--row {
  gap: 6px;
}
</style>
