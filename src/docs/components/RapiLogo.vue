<script setup lang="ts">
withDefaults(defineProps<{ compact?: boolean }>(), { compact: false })
</script>

<template>
  <span class="rapi-logo">
    <svg class="rapi-logo__mark" viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="9" />
      <path d="M10.5 22V10h6a3.8 3.8 0 0 1 0 7.6h-6m5.8 0 5 4.4" />
    </svg>
    <span v-if="!compact" class="rapi-logo__word">Rapi</span>
  </span>
</template>

<style>
.rapi-logo {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: var(--r-text);
}

.rapi-logo__mark {
  width: 28px;
  height: 28px;
}
.rapi-logo__mark rect {
  fill: var(--r-ink);
}
.rapi-logo__mark path {
  fill: none;
  stroke: var(--r-on-ink);
  stroke-width: 2.6;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.rapi-logo__word {
  font-size: 19px;
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-tight);
}
</style>
