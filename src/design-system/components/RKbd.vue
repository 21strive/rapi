<script setup lang="ts">
import { computed } from 'vue'
import { isMac } from '../composables/dom'

const props = withDefaults(
  defineProps<{
    /** Named keys are translated per platform: 'mod' is ⌘ on a Mac and Ctrl elsewhere. */
    keys?: string[]
    size?: 'sm' | 'md' | 'lg'
  }>(),
  { size: 'md' },
)

defineSlots<{ default?(): unknown }>()

const KEYS: Record<string, [glyph: string, spoken: string]> = {
  mod: isMac ? ['⌘', 'Command'] : ['Ctrl', 'Control'],
  cmd: ['⌘', 'Command'],
  meta: ['⌘', 'Command'],
  ctrl: isMac ? ['⌃', 'Control'] : ['Ctrl', 'Control'],
  alt: isMac ? ['⌥', 'Option'] : ['Alt', 'Alt'],
  option: ['⌥', 'Option'],
  shift: ['⇧', 'Shift'],
  enter: ['↵', 'Enter'],
  return: ['↵', 'Return'],
  esc: ['esc', 'Escape'],
  escape: ['esc', 'Escape'],
  up: ['↑', 'Up arrow'],
  down: ['↓', 'Down arrow'],
  left: ['←', 'Left arrow'],
  right: ['→', 'Right arrow'],
  backspace: ['⌫', 'Backspace'],
  delete: ['⌦', 'Delete'],
  tab: ['Tab', 'Tab'],
  space: ['Space', 'Space'],
}

const labels = computed(() =>
  (props.keys ?? []).map((key) => {
    const known = KEYS[key.toLowerCase()]
    return known ? { glyph: known[0], spoken: known[1] } : { glyph: key, spoken: key }
  }),
)
</script>

<template>
  <span v-if="labels.length" class="r-kbd-group">
    <kbd v-for="(key, i) in labels" :key="i" class="r-kbd" :class="`r-kbd--${size}`">
      <span aria-hidden="true">{{ key.glyph }}</span>
      <span class="r-sr-only">{{ key.spoken }}</span>
    </kbd>
  </span>
  <kbd v-else class="r-kbd" :class="`r-kbd--${size}`"><slot /></kbd>
</template>

<style>
.r-kbd-group {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 3px;
}

.r-kbd {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  gap: 2px;
  min-width: 20px;
  height: 20px;
  padding: 0 5px;
  border: 1px solid var(--r-border);
  border-radius: 6px;
  background: var(--r-bg-surface);
  box-shadow: 0 1px 0 var(--r-border-subtle);
  color: var(--r-text-tertiary);
  font-family: var(--r-font-sans);
  font-size: var(--r-text-2xs);
  font-weight: var(--r-weight-medium);
  line-height: 1;
  letter-spacing: 0;
  white-space: nowrap;
}

.r-kbd svg {
  width: 12px;
  height: 12px;
}

.r-kbd--sm {
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  border-radius: 5px;
  font-size: 10px;
}

.r-kbd--lg {
  min-width: 26px;
  height: 26px;
  padding: 0 7px;
  border-radius: 7px;
  font-size: var(--r-text-xs);
}
.r-kbd--lg svg {
  width: 14px;
  height: 14px;
}
</style>
