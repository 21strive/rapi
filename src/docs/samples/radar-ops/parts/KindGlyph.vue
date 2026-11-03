<script setup lang="ts">
/** The scope's own symbol for a track kind, for keys and table cells: circle, diamond, open or filled square. */
import type { TrackKind } from '../data'

withDefaults(defineProps<{ kind: TrackKind; size?: number }>(), { size: 12 })
</script>

<template>
  <svg class="glyph" :class="`is-${kind}`" :width="size" :height="size" viewBox="0 0 12 12" aria-hidden="true">
    <circle v-if="kind === 'friendly'" cx="6" cy="6" r="4.5" />
    <rect v-else-if="kind === 'hostile'" x="2.4" y="2.4" width="7.2" height="7.2" transform="rotate(45 6 6)" />
    <rect v-else-if="kind === 'neutral'" x="2" y="2" width="8" height="8" />
    <rect v-else x="2.5" y="2.5" width="7" height="7" />
  </svg>
</template>

<style scoped>
.glyph {
  flex: none;
  overflow: visible;
}
.is-friendly circle {
  fill: var(--r-chart-1);
}
.is-hostile rect {
  fill: var(--r-signal);
}
.is-neutral rect {
  fill: var(--r-chart-context);
}
.is-unknown rect {
  fill: none;
  stroke: var(--r-status-warning);
  stroke-width: 1.6;
}
</style>
