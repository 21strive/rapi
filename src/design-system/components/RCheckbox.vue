<script setup lang="ts">
import { computed, ref, useAttrs, useId, watchEffect } from 'vue'
import { Check, Minus } from 'lucide-vue-next'
import type { Tone } from '../types'

defineOptions({ inheritAttrs: false })

/** A boolean, or an array when several checkboxes share one model (pass `value`). */
const model = defineModel<boolean | (string | number)[]>({ default: false })

const props = withDefaults(
  defineProps<{
    value?: string | number
    label?: string
    description?: string
    indeterminate?: boolean
    disabled?: boolean
    size?: 'sm' | 'md'
    tone?: Tone
    /** Any CSS colour, e.g. a calendar colour. Overrides the tone. */
    color?: string
    id?: string
  }>(),
  { size: 'md', tone: 'brand' },
)

defineSlots<{ default?(): unknown }>()

const attrs = useAttrs()
const autoId = useId()
const inputId = computed(() => props.id ?? autoId)
const rootAttrs = computed(() => ({ class: attrs.class, style: attrs.style }))
const inputAttrs = computed(() => {
  const { class: _class, style: _style, ...rest } = attrs
  return rest
})

const input = ref<HTMLInputElement | null>(null)
watchEffect(() => {
  if (input.value) input.value.indeterminate = !!props.indeterminate
})

const checked = computed(() =>
  Array.isArray(model.value) ? props.value !== undefined && model.value.includes(props.value) : !!model.value,
)
</script>

<template>
  <label
    class="r-checkbox"
    :class="[
      `r-checkbox--${size}`,
      `r-tone-${tone}`,
      { 'is-checked': checked || indeterminate, 'is-disabled': disabled, 'r-checkbox--colored': !!color },
    ]"
    :style="color ? { '--tone-solid': color } : undefined"
    v-bind="rootAttrs"
  >
    <span class="r-checkbox__box">
      <input
        :id="inputId"
        ref="input"
        v-model="model"
        type="checkbox"
        class="r-checkbox__input"
        :value="value"
        :disabled="disabled"
        v-bind="inputAttrs"
      />
      <Minus v-if="indeterminate" class="r-checkbox__icon" />
      <Check v-else class="r-checkbox__icon" />
    </span>
    <span v-if="label || $slots.default || description" class="r-checkbox__text">
      <span class="r-checkbox__label"><slot>{{ label }}</slot></span>
      <span v-if="description" class="r-checkbox__description">{{ description }}</span>
    </span>
  </label>
</template>

<style>
.r-checkbox {
  display: inline-flex;
  align-items: flex-start;
  gap: 10px;
  color: var(--r-text);
  font-size: var(--r-text-md);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.r-checkbox__box {
  position: relative;
  display: inline-grid;
  flex-shrink: 0;
  place-items: center;
  width: 18px;
  height: 18px;
  margin-top: 1px;
  border: 1.5px solid var(--r-border-strong);
  border-radius: 5px;
  background: var(--r-bg-surface);
  transition:
    background-color var(--r-duration-fast) var(--r-ease-out),
    border-color var(--r-duration-fast) var(--r-ease-out);
}

.r-checkbox--sm .r-checkbox__box {
  width: 16px;
  height: 16px;
  margin-top: 2px;
  border-radius: 4px;
}

.r-checkbox__input {
  position: absolute;
  inset: -5px;
  width: calc(100% + 10px);
  height: calc(100% + 10px);
  margin: 0;
  cursor: inherit;
  opacity: 0;
}

.r-checkbox .r-checkbox__icon {
  width: 12px;
  height: 12px;
  color: var(--tone-on-solid);
  pointer-events: none;
  opacity: 0;
  stroke-width: 3;
  transform: scale(0.5);
  transition:
    opacity var(--r-duration-fast) var(--r-ease-out),
    transform var(--r-duration-base) var(--r-ease-spring);
}

.r-checkbox--sm .r-checkbox__icon {
  width: 11px;
  height: 11px;
}

.r-checkbox:hover:not(.is-disabled, .is-checked) .r-checkbox__box {
  border-color: var(--r-text-tertiary);
}

.r-checkbox--colored .r-checkbox__box {
  border-color: var(--tone-solid);
}

/* Identity colours turn light in dark mode, so a coloured box gets a dark check there. */
[data-theme='dark'] .r-checkbox--colored .r-checkbox__icon {
  color: var(--r-bg-canvas);
}

.r-checkbox.is-checked .r-checkbox__box {
  border-color: var(--tone-solid);
  background: var(--tone-solid);
}

.r-checkbox.is-checked .r-checkbox__icon {
  opacity: 1;
  transform: none;
}

.r-checkbox__box:has(.r-checkbox__input:focus-visible) {
  outline: 2px solid var(--r-brand);
  outline-offset: 2px;
}

.r-checkbox__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.r-checkbox__label {
  line-height: 20px;
}

.r-checkbox--sm .r-checkbox__label {
  font-size: var(--r-text-sm);
}

.r-checkbox__description {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-sm);
  line-height: 1.45;
}

.r-checkbox.is-disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
</style>
