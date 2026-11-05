<script setup lang="ts">
/**
 * A row of small mono keys for switching a period, a group or a scale inside a tile: a radio
 * group, arrow keys move and select, the chosen key sits on a ruled surface like the inset
 * segmented control, only smaller, so it fits the head of a 1x1 tile.
 */
import { ref } from 'vue'
import { focusItem, stepKeys } from './shared'

const model = defineModel<string>({ required: true })

const props = defineProps<{
  options: { value: string; label: string }[]
  /** Accessible name of the group: "Period". */
  label: string
}>()

const group = ref<HTMLElement | null>(null)

function onKey(event: KeyboardEvent) {
  const at = props.options.findIndex((o) => o.value === model.value)
  const next = stepKeys(event, Math.max(0, at), props.options.length)
  if (next === null) return
  model.value = props.options[next].value
  focusItem(group.value, next)
}
</script>

<template>
  <div ref="group" class="keys" role="radiogroup" :aria-label="label" @keydown="onKey">
    <button
      v-for="o in options"
      :key="o.value"
      type="button"
      role="radio"
      class="keys__key mk-reset"
      :class="{ 'is-on': o.value === model }"
      :aria-checked="o.value === model"
      :tabindex="o.value === model ? 0 : -1"
      @click="model = o.value"
    >
      {{ o.label }}
    </button>
  </div>
</template>

<style scoped>
.keys {
  display: inline-flex;
  flex: none;
  gap: 2px;
}

.keys__key {
  height: 20px;
  padding: 0 6px;
  border: 1px solid transparent;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: 0.06em;
  line-height: 18px;
  text-transform: uppercase;
  white-space: nowrap;
  cursor: pointer;
  transition:
    color var(--r-duration-fast) var(--r-ease-out),
    border-color var(--r-duration-fast) var(--r-ease-out);
}

.keys__key:hover {
  color: var(--r-text);
}

.keys__key.is-on {
  border-color: var(--r-border-strong);
  background: var(--r-bg-surface);
  color: var(--r-text);
}

.keys__key:focus-visible {
  outline-offset: 1px;
}
</style>
