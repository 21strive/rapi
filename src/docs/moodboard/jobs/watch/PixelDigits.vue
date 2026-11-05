<script setup lang="ts">
/**
 * Geist Pixel digits for instrument readouts. The face has proportional digits, so each digit gets
 * a fixed cell (live values stop jittering) and the unlit 8s of an LCD sit exactly behind them.
 * Size it with font-size on the parent.
 */
defineProps<{ value: string; ghost?: boolean }>()
const cells = (v: string) => Array.from(v, (ch) => ({ ch, digit: /\d/.test(ch) }))
</script>

<template>
  <span class="digits r-pixel">
    <span v-if="ghost" class="digits__ghost" aria-hidden="true">
      <span v-for="(c, i) in cells(value.replace(/\d/g, '8'))" :key="i" :class="{ digits__cell: c.digit }">{{ c.ch }}</span>
    </span>
    <span class="r-sr-only">{{ value }}</span>
    <span aria-hidden="true">
      <span v-for="(c, i) in cells(value)" :key="i" :class="{ digits__cell: c.digit }">{{ c.ch }}</span>
    </span>
  </span>
</template>

<style scoped>
.digits {
  display: inline-grid;
  line-height: 1;
  white-space: nowrap;
}

.digits > * {
  grid-area: 1 / 1;
}

.digits__ghost {
  opacity: 0.1;
  user-select: none;
}

.digits__cell {
  display: inline-block;
  width: 0.65em;
  text-align: center;
}
</style>
