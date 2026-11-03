<script setup lang="ts">
import { computed, useAttrs, useId } from 'vue'

defineOptions({ inheritAttrs: false })

const model = defineModel<boolean>({ default: false })

const props = withDefaults(
  defineProps<{
    label?: string
    description?: string
    disabled?: boolean
    /** sm 26 × 14px · md 32 × 18px track. */
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
/* A hardware toggle: a square slot with a square key that slides. Off is an empty slot,
   on fills with the brand and the key turns white. */
.r-switch {
  --r-switch-w: 32px;
  --r-switch-h: 18px;
  --r-switch-thumb: 12px;
  --r-switch-line: 20px;
  display: inline-flex;
  align-items: flex-start;
  gap: 10px;
  color: var(--r-text);
  font-size: var(--r-text-md);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.r-switch--sm {
  --r-switch-w: 26px;
  --r-switch-h: 14px;
  --r-switch-thumb: 8px;
  --r-switch-line: 18px;
  gap: 8px;
  font-size: var(--r-text-sm);
}

.r-switch__track {
  position: relative;
  flex-shrink: 0;
  width: var(--r-switch-w);
  height: var(--r-switch-h);
  margin-top: calc((var(--r-switch-line) - var(--r-switch-h)) / 2);
  padding: 0;
  border: 1px solid var(--r-border-control);
  border-radius: var(--r-radius-control);
  background: var(--r-bg-surface);
  cursor: inherit;
  transition:
    background-color var(--r-duration-fast) var(--r-ease-out),
    border-color var(--r-duration-fast) var(--r-ease-out);
}

.r-switch__thumb {
  position: absolute;
  top: calc((var(--r-switch-h) - 2px - var(--r-switch-thumb)) / 2);
  left: calc((var(--r-switch-h) - 2px - var(--r-switch-thumb)) / 2);
  width: var(--r-switch-thumb);
  height: var(--r-switch-thumb);
  border-radius: var(--r-radius-mark);
  background: var(--r-text-tertiary);
  transition:
    transform var(--r-duration-fast) var(--r-ease-out),
    background-color var(--r-duration-fast) var(--r-ease-out);
}

.r-switch:hover:not(.is-disabled, .is-on) .r-switch__track {
  border-color: var(--r-text-secondary);
}
.r-switch:hover:not(.is-disabled, .is-on) .r-switch__thumb {
  background: var(--r-text-secondary);
}

/* On: the brand fill (the shade that carries white), so the white key keeps its contrast. */
.r-switch.is-on .r-switch__track {
  border-color: var(--r-brand-fill);
  background: var(--r-brand-fill);
}
.r-switch.is-on:hover:not(.is-disabled) .r-switch__track {
  border-color: var(--r-brand-fill-hover);
  background: var(--r-brand-fill-hover);
}

.r-switch.is-on .r-switch__thumb {
  background: var(--r-on-brand);
  transform: translateX(calc(var(--r-switch-w) - var(--r-switch-h)));
}

.r-switch__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.r-switch__label {
  line-height: var(--r-switch-line);
}

.r-switch__description {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-sm);
  line-height: 1.45;
}

.r-switch.is-disabled {
  color: var(--r-text-disabled);
  cursor: not-allowed;
}
.r-switch.is-disabled .r-switch__track {
  border-color: var(--r-border-strong);
  background: var(--r-bg-muted);
}
.r-switch.is-disabled .r-switch__thumb {
  background: var(--r-border-strong);
}
.r-switch.is-disabled.is-on .r-switch__track {
  border-color: var(--r-text-disabled);
  background: var(--r-text-disabled);
}
.r-switch.is-disabled.is-on .r-switch__thumb {
  background: var(--r-bg-surface);
}
.r-switch.is-disabled .r-switch__description {
  color: var(--r-text-disabled);
}
</style>
