<script setup lang="ts">
/**
 * The 32px mono strip across the top of an example screen, from the running header of the
 * 21 Strive brand book: where you are on the left, time and state on the right.
 * Put `<span class="ex-strip__sep">/</span>` between path parts.
 */
withDefaults(defineProps<{ /** Names the strip as a landmark for screen readers. */ label?: string }>(), {
  label: 'Context and status',
})
defineSlots<{ default?(): unknown; end?(): unknown }>()
</script>

<template>
  <div class="ex-strip" role="region" :aria-label="label">
    <div class="ex-strip__start"><slot /></div>
    <div v-if="$slots.end" class="ex-strip__end"><slot name="end" /></div>
  </div>
</template>

<style>
.ex-strip {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  height: 32px;
  padding: 0 24px;
  overflow: hidden;
  border-bottom: 1px solid var(--r-border);
  background: var(--r-bg-surface);
  color: var(--r-text);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-caps);
  line-height: 1;
  text-transform: uppercase;
  white-space: nowrap;
}

.ex-strip__start,
.ex-strip__end {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.ex-strip__end {
  flex-shrink: 1;
  justify-content: flex-end;
  color: var(--r-text-tertiary);
}

.ex-strip__sep {
  color: var(--r-text-disabled);
}

/* Parts of the strip that can go first when the screen is narrow. */
@media (max-width: 720px) {
  .ex-strip {
    padding: 0 16px;
  }
  .ex-strip .ex-strip__wide {
    display: none;
  }
}
</style>
