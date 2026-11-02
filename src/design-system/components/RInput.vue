<script setup lang="ts">
import { computed, ref, useAttrs, useId } from 'vue'
import { X } from 'lucide-vue-next'
import type { Size } from '../types'

defineOptions({ inheritAttrs: false })

const model = defineModel<string | number | null>({ default: '' })

const props = withDefaults(
  defineProps<{
    variant?: 'outline' | 'filled'
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
    id?: string
  }>(),
  { variant: 'outline', size: 'md', type: 'text' },
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
  input.value?.focus()
}

defineExpose({ focus: () => input.value?.focus(), input })
</script>

<template>
  <div class="r-field" v-bind="rootAttrs">
    <label v-if="label" class="r-field__label" :for="inputId">{{ label }}</label>
    <div
      class="r-input"
      :class="[`r-input--${variant}`, `r-input--${size}`, { 'is-invalid': isInvalid, 'is-disabled': disabled }]"
    >
      <span v-if="$slots.leading" class="r-input__affix r-input__affix--leading"><slot name="leading" /></span>
      <input
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
    <p v-if="error || hint" :id="descriptionId" class="r-field__hint" :class="{ 'is-error': !!error }">{{ error || hint }}</p>
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
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-medium);
}

.r-field__hint {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
  line-height: 1.45;
}
.r-field__hint.is-error {
  color: var(--r-danger-text);
}

.r-input {
  --r-input-h: var(--r-control-md);
  --r-input-px: 12px;
  position: relative;
  display: flex;
  align-items: center;
  height: var(--r-input-h);
  border: 1px solid var(--r-border);
  border-radius: var(--r-radius-md);
  background: var(--r-bg-surface);
  box-shadow: var(--r-shadow-xs);
  color: var(--r-text);
  font-size: var(--r-text-md);
  transition:
    border-color var(--r-duration-fast) var(--r-ease-out),
    background-color var(--r-duration-fast) var(--r-ease-out),
    box-shadow var(--r-duration-fast) var(--r-ease-out);
}

.r-input:hover:not(.is-disabled) {
  border-color: var(--r-border-strong);
}

.r-input:focus-within {
  border-color: var(--r-brand);
  box-shadow: var(--r-focus-ring);
}

.r-input--sm {
  --r-input-h: var(--r-control-sm);
  --r-input-px: 10px;
  border-radius: var(--r-radius-sm);
  font-size: var(--r-text-sm);
}

.r-input--lg {
  --r-input-h: var(--r-control-lg);
  --r-input-px: 14px;
  border-radius: 12px;
  font-size: var(--r-text-lg);
}

.r-input--filled {
  border-color: transparent;
  background: var(--r-bg-track);
  box-shadow: none;
}
.r-input--filled:hover:not(.is-disabled) {
  border-color: transparent;
  background: var(--r-bg-hover);
}
.r-input--filled:focus-within {
  border-color: var(--r-brand);
  background: var(--r-bg-surface);
}

.r-input.is-invalid,
.r-input.is-invalid:hover {
  border-color: var(--r-danger);
}
.r-input.is-invalid:focus-within {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--r-danger) 22%, transparent);
}

.r-input.is-disabled {
  cursor: not-allowed;
  opacity: 0.55;
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
.r-input__affix--leading {
  padding-left: var(--r-input-px);
}
.r-input__affix--leading + .r-input__control {
  padding-left: 8px;
}
.r-input__affix--trailing {
  padding-right: calc(var(--r-input-px) - 2px);
}
.r-input__control:has(+ .r-input__affix--trailing),
.r-input__control:has(+ .r-input__clear) {
  padding-right: 6px;
}

.r-input__clear {
  display: inline-grid;
  flex-shrink: 0;
  place-items: center;
  width: 22px;
  height: 22px;
  margin-right: 8px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: var(--r-bg-hover);
  color: var(--r-text-secondary);
  cursor: pointer;
}
.r-input__clear:hover {
  background: var(--r-bg-pressed);
  color: var(--r-text);
}
.r-input__clear svg {
  width: 13px;
  height: 13px;
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
  border-radius: 6px;
  cursor: pointer;
  opacity: 0.55;
  transition: opacity var(--r-duration-fast) var(--r-ease-out);
}
.r-input__control::-webkit-calendar-picker-indicator:hover {
  background-color: var(--r-bg-hover);
  opacity: 0.9;
}
.r-input__control[type='date'],
.r-input__control[type='time'] {
  font-variant-numeric: tabular-nums;
}

.r-input__control[type='search']::-webkit-search-cancel-button {
  display: none;
}
</style>
