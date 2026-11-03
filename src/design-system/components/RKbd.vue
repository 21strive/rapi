<script setup lang="ts">
import { computed } from 'vue'
import { isMac } from '../composables/dom'

const props = withDefaults(
  defineProps<{
    /** Named keys are translated per platform: 'mod' is ⌘ on a Mac and Ctrl elsewhere. */
    keys?: string[]
    /** sm 18px · md 20px · lg 24px. */
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
  // Glyphs written by hand still get a spoken name.
  '⌘': ['⌘', 'Command'],
  '⌥': ['⌥', 'Option'],
  '⇧': ['⇧', 'Shift'],
  '⌃': ['⌃', 'Control'],
  '↵': ['↵', 'Enter'],
  '⌫': ['⌫', 'Backspace'],
  '⌦': ['⌦', 'Delete'],
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
  gap: 2px;
}

/* A square keycap: 1px rule, a slightly heavier bottom edge, Geist Mono. */
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
  border-bottom-color: var(--r-border-strong);
  border-radius: var(--r-radius-mark);
  background: var(--r-bg-surface);
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
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
  font-size: var(--r-text-3xs);
}
.r-kbd--sm svg {
  width: 11px;
  height: 11px;
}

.r-kbd--lg {
  min-width: 24px;
  height: 24px;
  padding: 0 6px;
  font-size: var(--r-text-xs);
}
.r-kbd--lg svg {
  width: 14px;
  height: 14px;
}
</style>
