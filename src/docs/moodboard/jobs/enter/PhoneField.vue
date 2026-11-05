<script setup lang="ts">
/**
 * A phone number, typed or pasted the way it is written on a slip: "0812 3456 7890" or "+65 9123
 * 4567". The field drops the trunk 0, picks the country from a pasted code, groups the digits and
 * says plainly what is missing before anything is sent to it.
 */
import { computed, ref, useId } from 'vue'
import { CircleAlert, CircleCheck } from 'lucide-vue-next'
import { RButton, RCheckbox, RSelect } from '@/design-system'
import { timeZ } from '../../kit'
import { group, keepFocus, reformat } from './shared'

interface Country {
  code: string
  iso: string
  name: string
  min: number
  max: number
  first: RegExp
  firstText: string
  groups: number[]
}

const COUNTRIES: Country[] = [
  { code: '62', iso: 'ID', name: 'Indonesia', min: 9, max: 12, first: /^8/, firstText: 'start with 8', groups: [3, 4, 5] },
  { code: '65', iso: 'SG', name: 'Singapore', min: 8, max: 8, first: /^[89]/, firstText: 'start with 8 or 9', groups: [4, 4] },
  { code: '60', iso: 'MY', name: 'Malaysia', min: 9, max: 10, first: /^1/, firstText: 'start with 1', groups: [2, 3, 5] },
  { code: '61', iso: 'AU', name: 'Australia', min: 9, max: 9, first: /^4/, firstText: 'start with 4', groups: [3, 3, 3] },
]

const props = withDefaults(
  defineProps<{
    eyebrow: string
    title?: string
    body?: string
    label?: string
    /** As typed or pasted; it is cleaned up when the tile opens. */
    initial?: string
    country?: string
    action: string
    /** The line after it lands, before the number: "Receipt sent to". */
    doneText: string
    /** An optional tick under the field: "Send in Bahasa Indonesia". */
    option?: string
  }>(),
  { label: 'Phone number', country: '62' },
)

const uid = useId()
const root = ref<HTMLElement | null>(null)
const cc = ref<string | number | null>(props.country)
const country = computed(() => COUNTRIES.find((c) => c.code === cc.value) ?? COUNTRIES[0])
const optionOn = ref(true)
const state = ref<'entry' | 'done'>('entry')
const tried = ref(false)
const at = ref<Date | null>(null)
const dropped = ref(false)

/** Takes the national number out of whatever was typed: a +62 or 0062 prefix, a trunk 0. */
function national(raw: string): string {
  let d = raw.replace(/[^\d+]/g, '')
  const intl = d.startsWith('+') || d.startsWith('00')
  d = d.replace(/^\+|^00/, '')
  if (intl) {
    const hit = COUNTRIES.find((c) => d.startsWith(c.code))
    if (hit) {
      cc.value = hit.code
      d = d.slice(hit.code.length)
    }
  }
  if (d.startsWith('0')) {
    d = d.replace(/^0+/, '')
    dropped.value = true
  }
  return d.slice(0, country.value.max)
}

const format = (digits: string) => group(digits, country.value.groups, '-')
const text = ref(props.initial ? format(national(props.initial)) : '')
const digits = computed(() => text.value.replace(/\D/g, ''))

function onInput(event: Event) {
  const el = event.target as HTMLInputElement
  if (/^\s*(\+|00)/.test(el.value) || /^\s*0/.test(el.value)) el.value = national(el.value)
  text.value = reformat(el, (d) => format(d.slice(0, country.value.max)))
  tried.value = false
}

const problem = computed(() => {
  const d = digits.value
  const c = country.value
  if (!d) return 'Type a number first.'
  if (!c.first.test(d)) return `Mobile numbers in ${c.name} ${c.firstText} after +${c.code}.`
  if (d.length < c.min) return `Too short: ${c.min === c.max ? c.min : `${c.min} to ${c.max}`} digits after +${c.code}.`
  return ''
})

const showProblem = computed(() => (tried.value || (digits.value.length >= country.value.min && !!problem.value)) && !!problem.value)

function submit() {
  tried.value = true
  if (problem.value) return
  keepFocus(root)
  state.value = 'done'
  at.value = new Date()
}

function change() {
  keepFocus(root)
  state.value = 'entry'
  tried.value = false
}

const options = COUNTRIES.map((c) => ({ label: `${c.iso} +${c.code}`, value: c.code }))
const full = computed(() => `+${country.value.code} ${text.value}`)
</script>

<template>
  <div ref="root" class="mk en-root phone" :class="{ 'phone--big': title }">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <span v-if="state === 'done'" class="r-label">Saved</span>
    </div>
    <p v-if="title" class="en-title">{{ title }}</p>
    <p v-if="body" class="en-note">{{ body }}</p>

    <form class="phone__form mk-end" novalidate @submit.prevent="submit">
      <label class="phone__label" :for="`${uid}-in`">{{ label }}</label>
      <div class="phone__row">
        <RSelect v-model="cc" class="phone__cc" :options="options" aria-label="Country code" :disabled="state === 'done'" />
        <div class="phone__box en-box" :class="{ 'is-invalid': showProblem, 'is-readonly': state === 'done' }">
          <input
            :id="`${uid}-in`"
            class="en-control phone__input"
            :value="text"
            type="tel"
            inputmode="tel"
            autocomplete="off"
            :placeholder="format(country.code === '62' ? '81234567890' : '91234567')"
            :readonly="state === 'done'"
            :aria-invalid="showProblem ? 'true' : undefined"
            :aria-describedby="`${uid}-msg`"
            @input="onInput"
          />
        </div>
        <template v-if="!title">
          <RButton v-if="state === 'entry'" type="submit">{{ action }}</RButton>
          <RButton v-else variant="outline" @click="change">Change</RButton>
        </template>
      </div>
      <RCheckbox v-if="option && state === 'entry'" v-model="optionOn" size="sm" :label="option" />

      <div :id="`${uid}-msg`" class="phone__msg" aria-live="polite">
        <p v-if="state === 'done' && at" class="en-msg en-msg--ok">
          <CircleCheck aria-hidden="true" />
          <span class="mk-truncate">{{ doneText }} {{ full }} · {{ timeZ(at) }}</span>
        </p>
        <p v-else-if="showProblem" class="en-msg en-msg--error">
          <CircleAlert aria-hidden="true" />
          <span>{{ problem }}</span>
        </p>
        <p v-else-if="dropped" class="en-msg"><span>The leading 0 is dropped after +{{ country.code }}.</span></p>
        <p v-else class="en-msg"><span>Digits only; spaces and dashes are added for you.</span></p>
      </div>

      <template v-if="title">
        <RButton v-if="state === 'entry'" type="submit" tone="brand" block>{{ action }}</RButton>
        <RButton v-else variant="outline" block @click="change">Change number</RButton>
      </template>
    </form>
  </div>
</template>

<style scoped>
.phone__form {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.phone--big .phone__form {
  gap: 10px;
}

.phone__label {
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  font-weight: var(--r-weight-medium);
  line-height: 1.3;
}

.phone__row {
  display: flex;
  gap: 6px;
  min-width: 0;
}

.phone__cc {
  flex: none;
  width: 92px;
}

.phone__cc :deep(.r-select__control) {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-sm);
}

.phone__box {
  flex: 1 1 auto;
  height: var(--r-control-md);
}

.phone__input {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-md);
  letter-spacing: 0.02em;
}

.phone__msg {
  min-height: 17px;
}

</style>
