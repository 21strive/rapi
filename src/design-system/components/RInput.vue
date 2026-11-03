<script setup lang="ts">
import { computed, ref, useAttrs, useId, watch } from 'vue'
import { CircleAlert, X } from 'lucide-vue-next'
import type { Size } from '../types'

defineOptions({ inheritAttrs: false })

const model = defineModel<string | number | null>({ default: '' })

const props = withDefaults(
  defineProps<{
    /** `outline`: a square field with a strong 1px rule. `filled`: a muted field with a bottom rule only. */
    variant?: 'outline' | 'filled'
    /** sm 28px · md 32px · lg 40px. */
    size?: Size
    type?: string
    label?: string
    hint?: string
    /** Shows under the field in red and marks it invalid. */
    error?: string
    placeholder?: string
    invalid?: boolean
    disabled?: boolean
    readonly?: boolean
    /** Adds a clear button while there is a value. */
    clearable?: boolean
    /**
     * For `type="time"`. `24h`: a text field that always reads HH:MM (a number pad on phones, the
     * colon typed for you, the `step` attribute applied on blur). `locale`: the browser's own time
     * field, which follows the browser language and may show AM and PM.
     */
    clock?: '24h' | 'locale'
    id?: string
  }>(),
  { variant: 'outline', size: 'md', type: 'text', clock: '24h' },
)

defineSlots<{ leading?(): unknown; trailing?(): unknown }>()

const attrs = useAttrs()
const autoId = useId()
const inputId = computed(() => props.id ?? autoId)
const descriptionId = computed(() => `${inputId.value}-description`)
const isInvalid = computed(() => props.invalid || !!props.error)

// class and style style the wrapper; everything else (name, autocomplete, aria-*, events) goes to <input>.
const rootAttrs = computed(() => ({ class: attrs.class, style: attrs.style }))
const inputAttrs = computed(() => {
  const { class: _class, style: _style, ...rest } = attrs
  return rest
})

const input = ref<HTMLInputElement | null>(null)

function clear() {
  model.value = ''
  timeText.value = ''
  input.value?.focus()
}

/* 24-hour time: the model holds "HH:MM" (or ""), exactly like a native time field, so code that
   reads it does not change. The text can be partial while someone is typing. */
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/
const isTime24 = computed(() => props.type === 'time' && props.clock === '24h')
const timeText = ref('')

watch(
  model,
  (value) => {
    const text = value == null ? '' : String(value)
    if (isTime24.value && (text === '' || TIME.test(text)) && text !== timeText.value) timeText.value = text
  },
  { immediate: true },
)

function onTimeInput(event: Event) {
  const el = event.target as HTMLInputElement
  let digits = el.value.replace(/\D/g, '')
  // A first digit of 3–9 can only be the hour 0X, so the zero is filled in as you type.
  if (/^[3-9]/.test(digits)) digits = `0${digits}`
  digits = digits.slice(0, 4)
  const text = digits.length > 2 ? `${digits.slice(0, 2)}:${digits.slice(2)}` : digits
  el.value = text
  timeText.value = text
  if (TIME.test(text)) model.value = text
  else if (!text) model.value = ''
}

// "9" → 09:00, "930" → 09:30, "2675" → 23:59; then snap to `step` (seconds), like the native field.
function onTimeBlur() {
  let digits = timeText.value.replace(/\D/g, '')
  if (!digits) return
  if (digits.length <= 2) digits = `${digits.padStart(2, '0')}00`
  else if (digits.length === 3) digits = `0${digits}`
  let minutes = Math.min(23, Number(digits.slice(0, 2))) * 60 + Math.min(59, Number(digits.slice(2, 4)))
  const step = Number(attrs.step)
  if (step >= 60) {
    const size = step / 60
    minutes = Math.round(minutes / size) * size
    if (minutes >= 24 * 60) minutes -= size
  }
  const text = `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
  timeText.value = text
  model.value = text
}

defineExpose({ focus: () => input.value?.focus(), input })
</script>

<template>
  <div class="r-field" v-bind="rootAttrs">
    <label v-if="label" class="r-field__label" :for="inputId">{{ label }}</label>
    <div
      class="r-input"
      :class="[`r-input--${variant}`, `r-input--${size}`, { 'is-invalid': isInvalid, 'is-disabled': disabled, 'is-readonly': readonly }]"
    >
      <span v-if="$slots.leading" class="r-input__affix r-input__affix--leading"><slot name="leading" /></span>
      <input
        v-if="isTime24"
        :id="inputId"
        ref="input"
        class="r-input__control r-input__control--time"
        type="text"
        inputmode="numeric"
        autocomplete="off"
        maxlength="5"
        pattern="([01][0-9]|2[0-3]):[0-5][0-9]"
        :value="timeText"
        :placeholder="placeholder ?? 'HH:MM'"
        :disabled="disabled"
        :readonly="readonly"
        :aria-invalid="isInvalid ? 'true' : undefined"
        :aria-describedby="error || hint ? descriptionId : undefined"
        v-bind="inputAttrs"
        @input="onTimeInput"
        @blur="onTimeBlur"
      />
      <input
        v-else
        :id="inputId"
        ref="input"
        v-model="model"
        class="r-input__control"
        :type="type"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :aria-invalid="isInvalid ? 'true' : undefined"
        :aria-describedby="error || hint ? descriptionId : undefined"
        v-bind="inputAttrs"
      />
      <button v-if="clearable && model !== '' && model != null && !disabled" type="button" class="r-input__clear" aria-label="Clear" @click="clear">
        <X />
      </button>
      <span v-if="$slots.trailing" class="r-input__affix r-input__affix--trailing"><slot name="trailing" /></span>
    </div>
    <p v-if="error || hint" :id="descriptionId" class="r-field__hint" :class="{ 'is-error': !!error }">
      <CircleAlert v-if="error" class="r-field__icon" aria-hidden="true" />
      <span>{{ error || hint }}</span>
    </p>
  </div>
</template>

<style>
.r-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.r-field__label {
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  font-weight: var(--r-weight-medium);
  line-height: 1.3;
}

.r-field__hint {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
  line-height: 1.4;
}
.r-field__hint.is-error {
  color: var(--r-danger-text);
}
.r-field__icon {
  flex-shrink: 0;
  width: 14px;
  height: 14px;
  margin-top: 1px;
}

/* A square field: surface fill, a strong 1px rule, a 2px cobalt ring on focus. No inner shadow. */
.r-input {
  --r-input-h: var(--r-control-md);
  --r-input-px: 10px;
  position: relative;
  display: flex;
  align-items: center;
  height: var(--r-input-h);
  border: 1px solid var(--r-border-strong);
  border-radius: var(--r-radius-control);
  background: var(--r-bg-surface);
  color: var(--r-text);
  font-size: var(--r-text-md);
  transition:
    border-color var(--r-duration-fast) var(--r-ease-out),
    background-color var(--r-duration-fast) var(--r-ease-out),
    box-shadow var(--r-duration-fast) var(--r-ease-out);
}

.r-input:hover:not(.is-disabled, .is-readonly, :focus-within) {
  border-color: var(--r-text-tertiary);
}

.r-input:focus-within {
  box-shadow: var(--r-focus-ring);
}

.r-input--sm {
  --r-input-h: var(--r-control-sm);
  --r-input-px: 8px;
  font-size: var(--r-text-sm);
}

.r-input--lg {
  --r-input-h: var(--r-control-lg);
  --r-input-px: 12px;
}

/* Filled: a muted field with only a bottom rule, the way Carbon draws its fields. */
.r-input--filled {
  border-color: transparent;
  border-bottom-color: var(--r-border-strong);
  background: var(--r-bg-muted);
}
.r-input--filled:hover:not(.is-disabled, .is-readonly, :focus-within) {
  border-color: transparent;
  border-bottom-color: var(--r-text-tertiary);
  background: var(--r-bg-hover);
}

.r-input.is-invalid,
.r-input.is-invalid:hover:not(:focus-within) {
  border-color: var(--r-danger);
}

.r-input.is-readonly {
  border-color: var(--r-border);
  background: var(--r-bg-muted);
}

.r-input.is-disabled {
  border-color: var(--r-border);
  background: var(--r-bg-muted);
  color: var(--r-text-disabled);
  cursor: not-allowed;
}
.r-input.is-disabled .r-input__affix,
.r-input.is-disabled .r-input__control::placeholder {
  color: var(--r-text-disabled);
}

.r-input__control {
  flex: 1;
  min-width: 0;
  height: 100%;
  padding: 0 var(--r-input-px);
  border: 0;
  border-radius: inherit;
  outline: none;
  background: transparent;
  color: inherit;
  font-size: inherit;
}
.r-input__control:focus-visible {
  outline: none;
}
.r-input__control::placeholder {
  color: var(--r-text-tertiary);
  opacity: 1;
}
.r-input__control:disabled {
  cursor: not-allowed;
}

.r-input__affix {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 6px;
  color: var(--r-text-tertiary);
}
.r-input__affix svg {
  width: 16px;
  height: 16px;
}
.r-input--sm .r-input__affix svg {
  width: 14px;
  height: 14px;
}
.r-input__affix--leading {
  padding-left: var(--r-input-px);
}
.r-input__affix--leading + .r-input__control {
  padding-left: 8px;
}
.r-input__affix--trailing {
  padding-right: calc(var(--r-input-px) - 4px);
}
.r-input__control:has(+ .r-input__affix--trailing),
.r-input__control:has(+ .r-input__clear) {
  padding-right: 6px;
}

.r-input__clear {
  display: inline-grid;
  flex-shrink: 0;
  place-items: center;
  width: 20px;
  height: 20px;
  margin-right: 6px;
  padding: 0;
  border: 0;
  border-radius: var(--r-radius-control);
  background: none;
  color: var(--r-text-tertiary);
  cursor: pointer;
}
.r-input__clear:hover {
  background: var(--r-bg-hover);
  color: var(--r-text);
}
.r-input__clear svg {
  width: 14px;
  height: 14px;
}
.r-input__clear + .r-input__affix--trailing {
  padding-left: 0;
}

/* Native date and time fields: keep the text aligned and the picker icon quiet. */
.r-input__control::-webkit-datetime-edit {
  padding: 0;
}
.r-input__control::-webkit-date-and-time-value {
  text-align: left;
}
.r-input__control::-webkit-calendar-picker-indicator {
  margin-right: -4px;
  padding: 4px;
  border-radius: var(--r-radius-control);
  cursor: pointer;
  opacity: 0.55;
  transition: opacity var(--r-duration-fast) var(--r-ease-out);
}
.r-input__control::-webkit-calendar-picker-indicator:hover {
  background-color: var(--r-bg-hover);
  opacity: 0.9;
}
.r-input__control[type='date'],
.r-input__control[type='time'],
.r-input__control[type='number'],
.r-input__control--time {
  font-variant-numeric: tabular-nums;
}

.r-input__control[type='search']::-webkit-search-cancel-button {
  display: none;
}
</style>
