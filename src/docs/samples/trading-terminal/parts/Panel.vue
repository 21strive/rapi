<script setup lang="ts">
/** A terminal panel: an indexed mono header bar over content, butting its neighbours on rules. */
defineProps<{ index: string; title: string; meta?: string }>()
defineSlots<{ default?(): unknown; actions?(): unknown }>()
</script>

<template>
  <section class="s-tt-panel" :aria-label="title">
    <header class="s-tt-panel__head">
      <span class="s-tt-panel__index">{{ index }}</span>
      <h2 class="s-tt-panel__title">{{ title }}</h2>
      <span v-if="meta" class="s-tt-panel__meta">{{ meta }}</span>
      <div v-if="$slots.actions" class="s-tt-panel__actions"><slot name="actions" /></div>
    </header>
    <div class="s-tt-panel__body"><slot /></div>
  </section>
</template>

<style scoped>
.s-tt-panel {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  background: var(--r-bg-surface);
}

.s-tt-panel__head {
  display: flex;
  flex: none;
  align-items: center;
  gap: 10px;
  min-height: 36px;
  padding: 4px 12px;
  border-bottom: 1px solid var(--r-border);
}

.s-tt-panel__index {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.04em;
}

.s-tt-panel__title {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-caps);
  text-transform: uppercase;
  white-space: nowrap;
}

.s-tt-panel__meta {
  overflow: hidden;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  letter-spacing: 0.04em;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
}

.s-tt-panel__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  margin-left: auto;
}

.s-tt-panel__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}
</style>
