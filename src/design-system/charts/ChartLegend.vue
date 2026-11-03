<script setup lang="ts">
/** The legend every multi-series chart shares. The swatch mirrors the mark; the text stays ink. */
defineProps<{
  items: { name: string; color: string; kind?: 'line' | 'rect' | 'dot' | 'hatch'; dashed?: boolean }[]
}>()
</script>

<template>
  <ul class="r-chart__legend" aria-hidden="true">
    <li v-for="item in items" :key="item.name">
      <span
        :class="[`r-chart__legend-${item.kind ?? 'line'}`, { 'is-dashed': item.dashed }]"
        :style="item.kind === 'hatch' ? undefined : item.dashed ? { color: item.color } : { background: item.color }"
      />
      {{ item.name }}
    </li>
  </ul>
</template>
