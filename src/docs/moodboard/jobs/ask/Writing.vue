<script setup lang="ts">
/**
 * The pause while the model writes: three square segments lit one after the other, in steps, and
 * a mono word. Still under reduced motion.
 */
withDefaults(defineProps<{ label?: string }>(), { label: 'Writing' })
</script>

<template>
  <span class="writing" role="status">
    <span class="writing__dots" aria-hidden="true"><i /><i /><i /></span>
    <span class="writing__label">{{ label }}</span>
  </span>
</template>

<style scoped>
.writing {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-medium);
  line-height: 16px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  white-space: nowrap;
}

.writing__dots {
  display: inline-flex;
  flex: none;
  gap: 2px;
}

.writing__dots i {
  width: 4px;
  height: 4px;
  background: var(--r-text-secondary);
  opacity: 0.25;
  animation: writing-step 960ms steps(1, end) infinite;
}

.writing__dots i:nth-child(2) {
  animation-delay: 320ms;
}

.writing__dots i:nth-child(3) {
  animation-delay: 640ms;
}

@keyframes writing-step {
  0% {
    opacity: 1;
  }
  33.3% {
    opacity: 0.25;
  }
}

@media (prefers-reduced-motion: reduce) {
  .writing__dots i {
    opacity: 0.6;
    animation: none;
  }
}
</style>
