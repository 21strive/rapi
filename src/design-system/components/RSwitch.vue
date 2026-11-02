<script setup lang="ts">
import { computed, useAttrs, useId } from 'vue'

defineOptions({ inheritAttrs: false })

const model = defineModel<boolean>({ default: false })

const props = withDefaults(
  defineProps<{
    label?: string
    description?: string
    disabled?: boolean
    size?: 'sm' | 'md'
    id?: string
  }>(),
  { size: 'md' },
)

defineSlots<{ default?(): unknown }>()

const attrs = useAttrs()
const autoId = useId()
const switchId = computed(() => props.id ?? autoId)
const descriptionId = computed(() => `${switchId.value}-description`)
const rootAttrs = computed(() => ({ class: attrs.class, style: attrs.style }))
const buttonAttrs = computed(() => {
  const { class: _class, style: _style, ...rest } = attrs
  return rest
})
</script>

<template>
  <label class="r-switch" :class="[`r-switch--${size}`, { 'is-on': model, 'is-disabled': disabled }]" v-bind="rootAttrs">
    <button
      :id="switchId"
      type="button"
      role="switch"
      class="r-switch__track"
      :aria-checked="model ? 'true' : 'false'"
      :aria-describedby="description ? descriptionId : undefined"
      :disabled="disabled"
      v-bind="buttonAttrs"
      @click="model = !model"
    >
      <span class="r-switch__thumb" />
    </button>
    <span v-if="label || $slots.default || description" class="r-switch__text">
      <span class="r-switch__label"><slot>{{ label }}</slot></span>
      <span v-if="description" :id="descriptionId" class="r-switch__description">{{ description }}</span>
    </span>
  </label>
</template>

<style>
.r-switch {
  --r-switch-w: 36px;
  --r-switch-h: 20px;
  --r-switch-gap: 2px;
  display: inline-flex;
  align-items: flex-start;
  gap: 10px;
  color: var(--r-text);
  font-size: var(--r-text-md);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.r-switch--sm {
  --r-switch-w: 28px;
  --r-switch-h: 16px;
}

.r-switch__track {
  position: relative;
  flex-shrink: 0;
  width: var(--r-switch-w);
  height: var(--r-switch-h);
  padding: 0;
  border: 0;
  border-radius: var(--r-radius-full);
  background: var(--r-text-disabled);
  cursor: inherit;
  transition: background-color var(--r-duration-base) var(--r-ease-out);
}

.r-switch.is-on .r-switch__track {
  background: var(--r-brand);
}

.r-switch__thumb {
  position: absolute;
  top: var(--r-switch-gap);
  left: var(--r-switch-gap);
  width: calc(var(--r-switch-h) - var(--r-switch-gap) * 2);
  height: calc(var(--r-switch-h) - var(--r-switch-gap) * 2);
  border-radius: 50%;
  background: #fff;
  box-shadow:
    0 1px 2px rgb(16 20 28 / 0.2),
    0 1px 1px rgb(16 20 28 / 0.06);
  transition: transform var(--r-duration-base) var(--r-ease-spring);
}

.r-switch.is-on .r-switch__thumb {
  transform: translateX(calc(var(--r-switch-w) - var(--r-switch-h)));
}

.r-switch:hover:not(.is-disabled, .is-on) .r-switch__track {
  background: var(--r-text-tertiary);
}

.r-switch__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.r-switch__label {
  line-height: var(--r-switch-h);
}

.r-switch--md .r-switch__label {
  line-height: 20px;
}

.r-switch__description {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-sm);
  line-height: 1.45;
}

.r-switch.is-disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
</style>
