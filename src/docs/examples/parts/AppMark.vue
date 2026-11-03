<script setup lang="ts">
/**
 * Square marks for the made-up products in the examples. A solid square with a monoline
 * glyph drawn with square ends, so they sit in the same family as the 21 Strive logogram
 * without borrowing it.
 */
withDefaults(
  defineProps<{
    /** `arus` rising steps (sales) · `neraca` a monoline N (accounting) · `pekan` a week block (calendar) */
    glyph: 'arus' | 'neraca' | 'pekan'
    tone?: 'ink' | 'brand'
    size?: number
  }>(),
  { tone: 'ink', size: 28 },
)
</script>

<template>
  <svg
    class="ex-mark"
    :class="`ex-mark--${tone}`"
    viewBox="0 0 32 32"
    :width="size"
    :height="size"
    aria-hidden="true"
    focusable="false"
  >
    <rect class="ex-mark__plate" width="32" height="32" />
    <path v-if="glyph === 'arus'" class="ex-mark__line" d="M7 23H13V16.5H19V10H25" />
    <path v-else-if="glyph === 'neraca'" class="ex-mark__line" d="M9.5 23V9L22.5 23V9" />
    <template v-else>
      <path class="ex-mark__line" d="M8 10H24V23H8Z" />
      <path class="ex-mark__fill" d="M8 10H24V14.5H8Z" />
      <path class="ex-mark__fill" d="M17 17.5H21V20.5H17Z" />
    </template>
  </svg>
</template>

<style>
.ex-mark {
  display: block;
  flex: none;
}

.ex-mark__plate {
  fill: var(--r-ink);
}
.ex-mark--brand .ex-mark__plate {
  fill: var(--r-brand);
}

.ex-mark__line {
  fill: none;
  stroke: var(--r-on-ink);
  stroke-width: 2.4;
  stroke-linecap: square;
  stroke-linejoin: miter;
}
.ex-mark__fill {
  fill: var(--r-on-ink);
}

.ex-mark--brand .ex-mark__line {
  stroke: var(--r-on-brand);
}
.ex-mark--brand .ex-mark__fill {
  fill: var(--r-on-brand);
}
</style>
