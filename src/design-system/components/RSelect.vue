<script setup lang="ts">
import { computed, useAttrs, useId } from 'vue'
import { ChevronDown } from 'lucide-vue-next'
import type { SelectOption, Size } from '../types'

defineOptions({ inheritAttrs: false })

const model = defineModel<string | number | null>()

const props = withDefaults(
  defineProps<{
    options: SelectOption[]
    placeholder?: string
    variant?: 'outline' | 'filled'
    size?: Size
    label?: string
    hint?: string
    error?: string
    invalid?: boolean
    disabled?: boolean
    id?: string
  }>(),
  { variant: 'outline', size: 'md' },
)

defineSlots<{ leading?(props: { option: SelectOption | undefined }): unknown }>()

const attrs = useAttrs()
const autoId = useId()
const selectId = computed(() => props.id ?? autoId)
const descriptionId = computed(() => `${selectId.value}-description`)
const isInvalid = computed(() => props.invalid || !!props.error)
const rootAttrs = computed(() => ({ class: attrs.class, style: attrs.style }))
const selectAttrs = computed(() => {
  const { class: _class, style: _style, ...rest } = attrs
  return rest
})

// null/undefined map to the placeholder option, which has the value "".
const inner = computed({
  get: () => model.value ?? '',
  set: (value: string | number) => (model.value = value === '' ? null : value),
})

const selected = computed(() => props.options.find((option) => option.value === model.value))
</script>

<template>
  <div class="r-field" v-bind="rootAttrs">
    <label v-if="label" class="r-field__label" :for="selectId">{{ label }}</label>
    <div
      class="r-input r-select"
      :class="[`r-input--${variant}`, `r-input--${size}`, { 'is-invalid': isInvalid, 'is-disabled': disabled }]"
    >
      <span v-if="$slots.leading" class="r-input__affix r-input__affix--leading">
        <slot name="leading" :option="selected" />
      </span>
      <select
        :id="selectId"
        v-model="inner"
        class="r-input__control r-select__control"
        :class="{ 'is-placeholder': inner === '' }"
        :disabled="disabled"
        :aria-invalid="isInvalid ? 'true' : undefined"
        :aria-describedby="error || hint ? descriptionId : undefined"
        v-bind="selectAttrs"
      >
        <option v-if="placeholder" value="" disabled hidden>{{ placeholder }}</option>
        <option v-for="option in options" :key="String(option.value)" :value="option.value" :disabled="option.disabled">
          {{ option.label }}
        </option>
      </select>
      <ChevronDown class="r-select__chevron" />
    </div>
    <p v-if="error || hint" :id="descriptionId" class="r-field__hint" :class="{ 'is-error': !!error }">{{ error || hint }}</p>
  </div>
</template>

<style>
.r-select__control {
  padding-right: 36px;
  appearance: none;
  cursor: pointer;
  text-overflow: ellipsis;
}

.r-select__control.is-placeholder {
  color: var(--r-text-tertiary);
}

.r-select__control option {
  background: var(--r-bg-raised);
  color: var(--r-text);
}

.r-select__chevron {
  position: absolute;
  right: 12px;
  width: 16px;
  height: 16px;
  color: var(--r-text-tertiary);
  pointer-events: none;
}

.r-input--sm .r-select__chevron {
  right: 10px;
  width: 14px;
  height: 14px;
}
</style>
