<script setup lang="ts">
/** Records an answer is about, as they were when Simpul answered: type, name, value, TTL or proxy. */
defineProps<{
  items: { id: string; type: string; name: string; content: string; meta: string }[]
}>()
</script>

<template>
  <ul class="dn-rows">
    <li v-for="r in items" :key="r.id" class="dn-rows__row">
      <span class="dn-rows__type">{{ r.type }}</span>
      <span class="dn-rows__name">{{ r.name }}</span>
      <span class="dn-rows__meta">{{ r.meta }}</span>
      <span class="dn-rows__value" :title="r.content">{{ r.content }}</span>
    </li>
  </ul>
</template>

<style scoped>
.dn-rows {
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  list-style: none;
  border-top: 1px solid var(--r-border-subtle);
}

.dn-rows__row {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) auto;
  align-items: baseline;
  gap: 0 8px;
  padding: 6px 8px;
  border-bottom: 1px solid var(--r-border-subtle);
  font-size: var(--r-text-sm);
}

.dn-rows__type {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  letter-spacing: 0.06em;
}

.dn-rows__name {
  overflow: hidden;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dn-rows__meta {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.dn-rows__value {
  grid-column: 2 / -1;
  overflow: hidden;
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
