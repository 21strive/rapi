<script setup lang="ts">
import { ChevronDown, X } from 'lucide-vue-next'
import type { Tone } from '../types'

withDefaults(
  defineProps<{
    /** `dashed` is the quiet "+ Add filter" chip. */
    variant?: 'outline' | 'solid' | 'soft' | 'dashed'
    tone?: Tone
    /** Shows a chevron, for chips that open a popover. */
    caret?: boolean
    /** Adds a remove button that emits `remove`. */
    removable?: boolean
    size?: 'sm' | 'md'
    /** For toggle chips. Leave unset for plain chips. */
    selected?: boolean
    disabled?: boolean
    removeLabel?: string
  }>(),
  { variant: 'outline', tone: 'neutral', size: 'md', selected: undefined, removeLabel: 'Remove filter' },
)

const emit = defineEmits<{ click: [event: MouseEvent]; remove: [] }>()
defineSlots<{ default?(): unknown; leading?(): unknown }>()
</script>

<template>
  <span
    class="r-chip"
    :class="[
      `r-chip--${variant}`,
      `r-chip--${size}`,
      `r-tone-${tone}`,
      { 'is-selected': selected, 'is-disabled': disabled, 'r-chip--removable': removable },
    ]"
  >
    <button
      type="button"
      class="r-chip__main"
      :disabled="disabled"
      :aria-pressed="selected"
      @click="emit('click', $event)"
    >
      <slot name="leading" />
      <span class="r-chip__label"><slot /></span>
      <ChevronDown v-if="caret" class="r-chip__caret" />
    </button>
    <button v-if="removable" type="button" class="r-chip__remove" :aria-label="removeLabel" :disabled="disabled" @click="emit('remove')">
      <X />
    </button>
  </span>
</template>

<style>
.r-chip {
  --r-chip-h: 32px;
  --r-chip-px: 12px;
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  height: var(--r-chip-h);
  border: 1px solid transparent;
  border-radius: var(--r-radius-full);
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-medium);
  line-height: 1;
  white-space: nowrap;
  transition:
    background-color var(--r-duration-fast) var(--r-ease-out),
    border-color var(--r-duration-fast) var(--r-ease-out),
    color var(--r-duration-fast) var(--r-ease-out);
}

.r-chip--sm {
  --r-chip-h: 28px;
  --r-chip-px: 10px;
  font-size: var(--r-text-xs);
}

.r-chip__main,
.r-chip__remove {
  display: inline-flex;
  align-items: center;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.r-chip__main {
  gap: 6px;
  height: 100%;
  padding: 0 var(--r-chip-px);
  border-radius: inherit;
}

.r-chip--removable .r-chip__main {
  padding-right: 4px;
}

.r-chip__main svg {
  width: 14px;
  height: 14px;
}

.r-chip__caret {
  margin-right: -2px;
  opacity: 0.7;
}

.r-chip__remove {
  justify-content: center;
  width: 20px;
  height: 20px;
  margin-right: 6px;
  padding: 0;
  border-radius: 50%;
  opacity: 0.7;
}
.r-chip__remove:hover {
  background: color-mix(in srgb, currentColor 14%, transparent);
  opacity: 1;
}
.r-chip__remove svg {
  width: 13px;
  height: 13px;
}

.r-chip--outline {
  border-color: var(--r-border);
  background: var(--r-bg-surface);
  color: var(--r-text);
}
.r-chip--outline:hover:not(.is-disabled) {
  background: var(--r-bg-hover);
}
.r-chip--outline.is-selected {
  border-color: var(--r-brand-border);
  background: var(--r-brand-soft);
  color: var(--r-brand-text);
}

.r-chip--solid {
  background: var(--tone-solid);
  color: var(--tone-on-solid);
  box-shadow: var(--r-shadow-highlight);
}
.r-chip--solid:hover:not(.is-disabled) {
  background: var(--tone-solid-hover);
}

.r-chip--soft {
  background: var(--tone-soft);
  color: var(--tone-text);
}
.r-chip--soft.r-tone-neutral {
  color: var(--r-text);
}
.r-chip--soft:hover:not(.is-disabled) {
  background: var(--tone-soft-hover);
}

.r-chip--dashed {
  border-style: dashed;
  border-color: var(--r-border-strong);
  color: var(--r-text-secondary);
}
.r-chip--dashed:hover:not(.is-disabled) {
  border-color: var(--r-text-tertiary);
  color: var(--r-text);
}

.r-chip.is-disabled {
  opacity: 0.5;
}
.r-chip.is-disabled button {
  cursor: not-allowed;
}
</style>
