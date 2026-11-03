<script setup lang="ts">
/** An SVG pattern of 45° hairlines. Hatching means forecast, no data or out of window. */
defineProps<{ id: string }>()
</script>

<template>
  <pattern :id="id" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
    <line x1="0" y1="0" x2="0" y2="5" class="r-chart__hatch-line" />
  </pattern>
</template>
