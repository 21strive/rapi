<script setup lang="ts">
/**
 * An id that resolves: an account number, a meter, a plate, a container. It is copied, not
 * dictated; the field formats it as it is typed, checks what can be checked on the spot (the
 * ISO 6346 check digit of a container), and reads back the name it belongs to as the check before
 * anything moves.
 */
import { computed, ref, useId } from 'vue'
import { CircleAlert, CircleCheck } from 'lucide-vue-next'
import { RButton, RSelect } from '@/design-system'
import { keepFocus, reformat, useTimers } from './shared'

interface Record {
  /** Normalised id: digits, or letters and digits without spaces. */
  id: string
  name: string
  lines: string[]
  /** For accounts: the bank it is at. */
  bank?: string
}

const props = withDefaults(
  defineProps<{
    eyebrow: string
    meta?: string
    label: string
    kind: 'account' | 'meter' | 'plate' | 'container'
    initial?: string
    records: Record[]
    banks?: string[]
    bank?: string
    /** Open with the lookup already done. */
    looked?: boolean
    /** Draw the check-digit sum under the field (wide tiles). */
    showWork?: boolean
  }>(),
  { banks: () => [] },
)

const uid = useId()
const root = ref<HTMLElement | null>(null)
const { later } = useTimers()

const clean = (t: string) => (props.kind === 'account' || props.kind === 'meter' ? t.replace(/\D/g, '') : t.toUpperCase().replace(/[^A-Z0-9]/g, ''))

function format(raw: string): string {
  const t = clean(raw)
  if (props.kind === 'account') return t.slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ')
  if (props.kind === 'meter') return t.slice(0, 12).replace(/(\d{4})(?=\d)/g, '$1 ')
  if (props.kind === 'plate') {
    const m = /^([A-Z]{0,2})(\d{0,4})([A-Z]{0,3})/.exec(t)
    return m ? [m[1], m[2], m[3]].filter(Boolean).join(' ') : t
  }
  const m = /^([A-Z]{0,4})(\d{0,6})(\d?)/.exec(t)
  return m ? [m[1], m[2], m[3]].filter(Boolean).join(' ') : t
}

const text = ref(format(props.initial ?? ''))
const bankPick = ref<string | number | null>(props.bank ?? props.banks[0] ?? null)
const phase = ref<'entry' | 'checking' | 'found' | 'missing'>('entry')

/* ISO 6346: letters count 10–38 skipping multiples of 11, each place doubles its weight. */
const LETTER = 'A10B12C13D14E15F16G17H18I19J20K21L23M24N25O26P27Q28R29S30T31U32V34W35X36Y37Z38'
const letterValue = (ch: string) => Number(/\d+/.exec(LETTER.slice(LETTER.indexOf(ch) + 1))?.[0])
const workings = computed(() => {
  const t = clean(text.value)
  if (props.kind !== 'container' || !/^[A-Z]{4}\d{6}/.test(t)) return null
  const cells = [...t.slice(0, 10)].map((ch, i) => {
    const v = /\d/.test(ch) ? Number(ch) : letterValue(ch)
    return { ch, v, w: 2 ** i, p: v * 2 ** i }
  })
  const sum = cells.reduce((a, c) => a + c.p, 0)
  const check = (sum % 11) % 10
  const given = t.length > 10 ? Number(t[10]) : null
  return { cells, sum, check, given }
})

const formatProblem = computed(() => {
  const t = clean(text.value)
  if (!t) return ''
  if (props.kind === 'container') {
    if (!/^[A-Z]{4}\d{0,7}$/.test(t)) return 'Four letters, then seven digits, like NSLU 907032 1.'
    const w = workings.value
    if (w && w.given != null && w.given !== w.check) return `Check digit should be ${w.check}, not ${w.given}. A digit is mistyped.`
  }
  if (props.kind === 'plate' && !/^[A-Z]{1,2}\d{1,4}[A-Z]{0,3}$/.test(t)) return 'A plate reads like B 1924 KZT.'
  return ''
})

const complete = computed(() => {
  const t = clean(text.value)
  if (props.kind === 'account') return t.length >= 10
  if (props.kind === 'meter') return t.length === 12
  if (props.kind === 'container') return t.length === 11 && !formatProblem.value
  return /^[A-Z]{1,2}\d{1,4}[A-Z]{1,3}$/.test(t)
})

const found = ref<Record | null>(null)
function look() {
  if (!complete.value || formatProblem.value || phase.value === 'checking') return
  keepFocus(root)
  phase.value = 'checking'
  const id = clean(text.value)
  later(() => {
    const hit = props.records.find((r) => r.id === id && (!r.bank || r.bank === bankPick.value))
    found.value = hit ?? null
    phase.value = hit ? 'found' : 'missing'
  }, 550)
}

if (props.looked && props.initial) {
  const id = clean(props.initial)
  found.value = props.records.find((r) => r.id === id) ?? null
  phase.value = found.value ? 'found' : 'missing'
}

function onInput(event: Event) {
  const el = event.target as HTMLInputElement
  text.value = props.kind === 'account' || props.kind === 'meter' ? reformat(el, (d) => format(d)) : (el.value = format(el.value))
  phase.value = 'entry'
  found.value = null
}

function onBank() {
  phase.value = 'entry'
  found.value = null
}

/* The select shows the short name people say ("Sagara"); the value keeps the full one. */
const bankOptions = computed(() => props.banks.map((b) => ({ label: b.replace(/^Bank\s+|\s+Bank$|\s+Syariah$/g, ''), value: b })))
const mono = computed(() => props.kind !== 'plate')
</script>

<template>
  <div ref="root" class="mk en-root look" :class="{ 'look--work': showWork }">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <span v-if="meta" class="en-meta">{{ meta }}</span>
    </div>

    <form class="look__form" novalidate @submit.prevent="look">
      <label :for="`${uid}-in`" class="r-sr-only">{{ label }}</label>
      <RSelect v-if="banks.length" v-model="bankPick" class="look__bank" :options="bankOptions" aria-label="Bank" @change="onBank" />
      <div class="look__box en-box" :class="{ 'is-invalid': !!formatProblem }">
        <input
          :id="`${uid}-in`"
          class="en-control look__input"
          :class="{ 'is-mono': mono, 'is-plate': kind === 'plate' }"
          :value="text"
          :inputmode="kind === 'account' || kind === 'meter' ? 'numeric' : 'text'"
          autocomplete="off"
          spellcheck="false"
          :placeholder="label"
          :aria-invalid="formatProblem ? 'true' : undefined"
          :aria-describedby="`${uid}-msg`"
          @input="onInput"
        />
      </div>
      <RButton type="submit" variant="outline" :loading="phase === 'checking'" :disabled="!complete">Check</RButton>
    </form>

    <div v-if="showWork && workings" class="look__work" aria-hidden="true">
      <span v-for="(c, i) in workings.cells" :key="i" class="look__cell">
        <span class="look__ch">{{ c.ch }}</span>
        <span class="look__v">{{ c.v }}<span class="look__w">×{{ c.w }}</span></span>
      </span>
      <span class="look__cell look__cell--sum">
        <span class="look__ch">=</span>
        <span class="look__v">{{ workings.sum }}</span>
      </span>
      <span class="look__cell look__cell--check" :class="{ 'is-bad': workings.given != null && workings.given !== workings.check, 'is-good': workings.given === workings.check }">
        <span class="look__ch">{{ workings.check }}</span>
        <span class="look__v">mod<span class="look__w"> 11</span></span>
      </span>
    </div>

    <div :id="`${uid}-msg`" class="look__result mk-end" aria-live="polite">
      <p v-if="formatProblem" class="en-msg en-msg--error">
        <CircleAlert aria-hidden="true" />
        <span>{{ formatProblem }}</span>
      </p>
      <template v-else-if="phase === 'found' && found">
        <p class="look__name">
          <CircleCheck class="look__ok" aria-hidden="true" />
          <span class="mk-truncate">{{ found.name }}</span>
        </p>
        <p class="en-note mk-truncate">{{ found.lines.join(' · ') }}</p>
      </template>
      <p v-else-if="phase === 'missing'" class="en-msg en-msg--error">
        <CircleAlert aria-hidden="true" />
        <span>Nothing under {{ text }}{{ banks.length ? ` at ${bankPick}` : '' }}. Check the number.</span>
      </p>
      <p v-else class="en-msg"><span>{{ phase === 'checking' ? 'Looking it up' : 'Enter or Check looks it up; the name comes back to compare' }}</span></p>
    </div>
  </div>
</template>

<style scoped>
.look {
  container-type: inline-size;
}

.look__form {
  display: flex;
  gap: 6px;
  min-width: 0;
}

.look__bank {
  flex: none;
  width: 112px;
}

.look__box {
  flex: 1 1 auto;
  height: var(--r-control-md);
}

.look__input.is-mono {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-sm);
  letter-spacing: 0.04em;
}

.look__input.is-plate {
  font-weight: var(--r-weight-semibold);
  letter-spacing: 0.06em;
}

.look__result {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  min-height: 36px;
}

.look__name {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  font-size: var(--r-text-md);
  font-weight: var(--r-weight-semibold);
  letter-spacing: 0.02em;
}

.look__ok {
  flex: none;
  width: 14px;
  height: 14px;
  color: var(--r-success-text);
}

/* The check-digit sum, worked on the tile: each character, its value and its weight. */
.look__work {
  display: grid;
  grid-auto-columns: minmax(0, 1fr);
  grid-auto-flow: column;
  gap: 2px;
}

.look__cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-width: 0;
  padding: 3px 0;
  border: 1px solid var(--r-border-subtle);
  background: var(--r-bg-muted);
}

.look__ch {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-medium);
  line-height: 1.1;
}

.look__v {
  max-width: 100%;
  overflow: hidden;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  line-height: 1.1;
  text-overflow: clip;
  white-space: nowrap;
}

/* Narrow tiles keep each character's value and drop its weight. */
@container (max-width: 520px) {
  .look__w {
    display: none;
  }
}

.look__cell--check.is-bad {
  border-color: var(--r-danger);
}

.look__cell--check.is-good {
  border-color: var(--r-success);
}
</style>
