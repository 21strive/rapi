<script setup lang="ts">
/**
 * A bar of LED blocks lit from the start up to `lit`, with an optional target mark. A part of
 * LedLevel, not a specimen of its own.
 */
import { reducedMotion } from '../../kit'

withDefaults(
  defineProps<{
    count: number
    lit: number
    vertical?: boolean
    /** Colour of the lit blocks. */
    color?: string
    /** Target position along the bar, 0–1. */
    target?: number | null
  }>(),
  { vertical: false, color: 'var(--r-text)', target: null },
)

const still = reducedMotion()
</script>

<template>
  <span class="led-bar" :class="{ 'is-vertical': vertical }" :style="{ '--lit': color }" aria-hidden="true">
    <span
      v-for="i in count"
      :key="i"
      class="led-bar__block"
      :class="{ 'is-lit': i <= lit }"
      :style="still ? undefined : { transitionDelay: `${(i - 1) * 5}ms` }"
    />
    <span
      v-if="target != null"
      class="led-bar__target"
      :style="vertical ? { bottom: `${target * 100}%` } : { left: `${target * 100}%` }"
    />
  </span>
</template>

<style scoped>
.led-bar {
  position: relative;
  display: flex;
  gap: 2px;
  min-width: 0;
  min-height: 0;
}

.led-bar.is-vertical {
  flex-direction: column-reverse;
}

.led-bar__block {
  flex: 1 1 0;
  min-width: 2px;
  min-height: 2px;
  background: var(--r-chart-track);
  transition: background-color var(--r-duration-fast) var(--r-ease-out);
}

.led-bar__block.is-lit {
  background: var(--lit);
}

/* The target: a short ink rule across the bar, standing proud of it on both sides. */
.led-bar__target {
  position: absolute;
  top: -4px;
  bottom: -4px;
  width: 2px;
  background: var(--r-text);
  transform: translateX(-1px);
}

.led-bar.is-vertical .led-bar__target {
  top: auto;
  right: -4px;
  bottom: auto;
  left: -4px;
  width: auto;
  height: 2px;
  transform: translateY(1px);
}
</style>
