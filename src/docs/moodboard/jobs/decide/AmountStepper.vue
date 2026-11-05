<script setup lang="ts">
/**
 * An amount between a minus and a plus key, for the decisions that come with a number: a partial
 * refund, a counter-offer. The figure is a spinbutton: arrows step, Page keys step ten, Home and
 * End go to the ends. Not a specimen on its own.
 */
import { computed } from 'vue'
import { Minus, Plus } from 'lucide-vue-next'
import { RIconButton } from '@/design-system'

const model = defineModel<number>({ required: true })

const props = withDefaults(
  defineProps<{
    /** Accessible name: "Refund amount". */
    label: string
    min: number
    max: number
    step: number
    format: (value: number) => string
    /** Unit after the figure, in its own case: "/kg". */
    unit?: string
    disabled?: boolean
  }>(),
  { unit: undefined },
)

function set(value: number) {
  const snapped = Math.round(value / props.step) * props.step
  model.value = Number(Math.min(props.max, Math.max(props.min, snapped)).toFixed(6))
}

function onKeydown(event: KeyboardEvent) {
  const keys: Record<string, number> = {
    ArrowUp: props.step,
    ArrowRight: props.step,
    ArrowDown: -props.step,
    ArrowLeft: -props.step,
    PageUp: props.step * 10,
    PageDown: -props.step * 10,
  }
  let next: number | undefined
  if (event.key in keys) next = model.value + keys[event.key]
  else if (event.key === 'Home') next = props.min
  else if (event.key === 'End') next = props.max
  if (next === undefined) return
  event.preventDefault()
  set(next)
}

const text = computed(() => props.format(model.value))
</script>

<template>
  <div class="stepper" :class="{ 'is-disabled': disabled }">
    <RIconButton
      :label="`Lower ${label.toLowerCase()}`"
      variant="outline"
      size="sm"
      :disabled="disabled || model <= min"
      @click="set(model - step)"
    >
      <Minus />
    </RIconButton>
    <span
      class="stepper__value"
      role="spinbutton"
      :tabindex="disabled ? -1 : 0"
      :aria-label="label"
      :aria-valuemin="min"
      :aria-valuemax="max"
      :aria-valuenow="model"
      :aria-valuetext="`${text}${unit ? ` ${unit}` : ''}`"
      :aria-disabled="disabled ? 'true' : undefined"
      data-focus="stepper"
      @keydown="onKeydown"
    >
      <span class="mk-fig">{{ text }}</span>
      <span v-if="unit" class="mk-unit">{{ unit }}</span>
    </span>
    <RIconButton
      :label="`Raise ${label.toLowerCase()}`"
      variant="outline"
      size="sm"
      :disabled="disabled || model >= max"
      @click="set(model + step)"
    >
      <Plus />
    </RIconButton>
  </div>
</template>

<style scoped>
.stepper {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
}

.stepper__value {
  display: flex;
  flex: 1 1 auto;
  align-items: baseline;
  justify-content: center;
  gap: 4px;
  min-width: 0;
  height: var(--r-control-sm);
  padding: 0 8px;
  border-top: 1px solid var(--r-border-strong);
  border-bottom: 1px solid var(--r-border-strong);
  line-height: calc(var(--r-control-sm) - 2px);
  white-space: nowrap;
}

.stepper__value .mk-fig {
  overflow: hidden;
  font-size: var(--r-text-md);
  text-overflow: ellipsis;
}

.stepper__value:focus-visible {
  outline: 2px solid var(--r-focus);
  outline-offset: 2px;
}

.stepper.is-disabled .stepper__value {
  color: var(--r-text-tertiary);
}
</style>
