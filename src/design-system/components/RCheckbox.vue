<script setup lang="ts">
import { computed, ref, useAttrs, useId, watchEffect } from 'vue'
import { Check } from 'lucide-vue-next'
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
    /** sm 14px · md 16px box. */
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
      {
        'is-checked': checked || indeterminate,
        'is-indeterminate': indeterminate,
        'is-disabled': disabled,
        'r-checkbox--colored': !!color,
      },
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
      <span v-if="indeterminate" class="r-checkbox__bar" aria-hidden="true" />
      <Check v-else class="r-checkbox__icon" aria-hidden="true" />
    </span>
    <span v-if="label || $slots.default || description" class="r-checkbox__text">
      <span class="r-checkbox__label"><slot>{{ label }}</slot></span>
      <span v-if="description" class="r-checkbox__description">{{ description }}</span>
    </span>
  </label>
</template>

<style>
.r-checkbox {
  --r-checkbox-box: 16px;
  --r-checkbox-line: 20px;
  display: inline-flex;
  align-items: flex-start;
  gap: 10px;
  color: var(--r-text);
  font-size: var(--r-text-md);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.r-checkbox--sm {
  --r-checkbox-box: 14px;
  --r-checkbox-line: 18px;
  gap: 8px;
  font-size: var(--r-text-sm);
}

/* A square box. Its 1px rule is dark enough to find (3:1); checked fills with the brand. */
.r-checkbox__box {
  position: relative;
  display: inline-grid;
  flex-shrink: 0;
  place-items: center;
  width: var(--r-checkbox-box);
  height: var(--r-checkbox-box);
  margin-top: calc((var(--r-checkbox-line) - var(--r-checkbox-box)) / 2);
  border: 1px solid var(--r-border-control);
  border-radius: var(--r-radius-mark);
  background: var(--r-bg-surface);
  transition:
    background-color var(--r-duration-fast) var(--r-ease-out),
    border-color var(--r-duration-fast) var(--r-ease-out);
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
  width: calc(var(--r-checkbox-box) - 4px);
  height: calc(var(--r-checkbox-box) - 4px);
  color: var(--tone-on-solid);
  pointer-events: none;
  opacity: 0;
  stroke-width: 3;
  transition: opacity var(--r-duration-fast) var(--r-ease-out);
}

/* "Some of these": a flat bar instead of the check. */
.r-checkbox__bar {
  width: calc(var(--r-checkbox-box) - 6px);
  height: 2px;
  background: var(--tone-on-solid);
  pointer-events: none;
}

.r-checkbox:hover:not(.is-disabled, .is-checked) .r-checkbox__box {
  border-color: var(--r-text-secondary);
}

.r-checkbox--colored .r-checkbox__box {
  border-color: var(--tone-solid);
}

/* Identity colours turn light in dark mode, so a coloured box gets a dark mark there. */
[data-theme='dark'] .r-checkbox--colored :is(.r-checkbox__icon, .r-checkbox__bar) {
  color: var(--r-bg-canvas);
}
[data-theme='dark'] .r-checkbox--colored .r-checkbox__bar {
  background: var(--r-bg-canvas);
}

.r-checkbox.is-checked .r-checkbox__box {
  border-color: var(--tone-solid);
  background: var(--tone-solid);
}

.r-checkbox.is-checked .r-checkbox__icon {
  opacity: 1;
}

.r-checkbox__box:has(.r-checkbox__input:focus-visible) {
  outline: 2px solid var(--r-focus);
  outline-offset: 2px;
}

.r-checkbox__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.r-checkbox__label {
  line-height: var(--r-checkbox-line);
}

.r-checkbox__description {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-sm);
  line-height: 1.45;
}

.r-checkbox.is-disabled {
  color: var(--r-text-disabled);
  cursor: not-allowed;
}
.r-checkbox.is-disabled .r-checkbox__box {
  border-color: var(--r-border-strong);
  background: var(--r-bg-muted);
}
.r-checkbox.is-disabled.is-checked .r-checkbox__box {
  border-color: var(--r-text-disabled);
  background: var(--r-text-disabled);
}
.r-checkbox.is-disabled .r-checkbox__description {
  color: var(--r-text-disabled);
}
</style>
