<script setup lang="ts">
import { ChevronDown, X } from 'lucide-vue-next'
import type { Tone } from '../types'

withDefaults(
  defineProps<{
    /** `solid` is a filter that is on (ink). `dashed` is the quiet "Add filter" chip. */
    variant?: 'outline' | 'solid' | 'soft' | 'dashed'
    tone?: Tone
    /** Shows a chevron, for chips that open a popover. */
    caret?: boolean
    /** Adds a remove button that emits `remove`. */
    removable?: boolean
    /** sm 24px · md 28px. */
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
  --r-chip-h: var(--r-control-sm);
  --r-chip-px: 10px;
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  height: var(--r-chip-h);
  border: 1px solid transparent;
  border-radius: var(--r-radius-control);
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
  --r-chip-h: var(--r-control-xs);
  --r-chip-px: 8px;
  font-size: var(--r-text-xs);
}

.r-chip__main,
.r-chip__remove {
  display: inline-flex;
  align-items: center;
  border: 0;
  border-radius: var(--r-radius-control);
  background: none;
  color: inherit;
  font: inherit;
  letter-spacing: inherit;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.r-chip__main {
  gap: 6px;
  height: 100%;
  padding: 0 var(--r-chip-px);
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
  opacity: 0.72;
}

.r-chip__remove {
  justify-content: center;
  width: 20px;
  height: 20px;
  margin-right: 3px;
  padding: 0;
  opacity: 0.72;
}
.r-chip--sm .r-chip__remove {
  width: 18px;
  height: 18px;
  margin-right: 2px;
}
.r-chip__remove:hover:not(:disabled) {
  background: color-mix(in srgb, currentColor 14%, transparent);
  opacity: 1;
}
.r-chip__remove svg {
  width: 14px;
  height: 14px;
}

.r-chip__main:focus-visible,
.r-chip__remove:focus-visible {
  outline-offset: 1px;
}

.r-chip--outline {
  border-color: var(--r-border-strong);
  background: transparent;
  color: var(--r-text);
}
.r-chip--outline:hover:not(.is-disabled) {
  border-color: var(--r-text-tertiary);
  background: var(--r-bg-hover);
}
/* A toggle chip that is on: the selection colour, cobalt. */
.r-chip--outline.is-selected,
.r-chip--outline.is-selected:hover:not(.is-disabled) {
  border-color: var(--r-brand);
  background: var(--r-bg-selected);
  color: var(--r-brand-text);
}

.r-chip--solid {
  border-color: var(--tone-solid);
  background: var(--tone-solid);
  color: var(--tone-on-solid);
}
.r-chip--solid:hover:not(.is-disabled) {
  border-color: var(--tone-solid-hover);
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
  border-color: var(--r-border);
  border-style: solid;
  background: transparent;
  color: var(--r-text-disabled);
}
.r-chip.is-disabled button {
  cursor: not-allowed;
}
</style>
