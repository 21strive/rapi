<script setup lang="ts">
/**
 * A rotation waiting for a press: the key, what it keeps, when the old secret stops (said, or
 * Simpul's day of grace), and who still uses it.
 */
import { RefreshCw } from 'lucide-vue-next'
import { RButton } from '@/design-system'
import { lastAt, scopeBadges, type DeskKey } from '../data'
import NeedFrame from './NeedFrame.vue'

defineProps<{ keyRow: DeskKey; until: string; inferred: boolean; primary: boolean }>()
const emit = defineEmits<{ rotate: [] }>()
</script>

<template>
  <NeedFrame
    :eyebrow="`Rotate a ${keyRow.env} key`"
    :title="keyRow.name"
    :sub="`${keyRow.prefix}… · ${scopeBadges(keyRow.scopes).join(', ')}`"
    meta="Waiting for you"
  >
    <dl class="s-akn-rows">
      <div :class="{ 'is-inferred': inferred }">
        <dt>Old secret stops</dt>
        <dd>{{ until }}</dd>
      </div>
      <div>
        <dt>Used</dt>
        <dd>{{ keyRow.lastUsed === 'Never' ? 'Never' : `${lastAt[keyRow.id] ?? keyRow.lastUsed} WIB today · ${keyRow.lastIp}` }}</dd>
      </div>
      <div>
        <dt>New secret</dt>
        <dd>Shown once, here</dd>
      </div>
    </dl>
    <template #foot>
      <RButton :tone="primary ? 'brand' : 'neutral'" @click="emit('rotate')">
        <template #leading><RefreshCw /></template>
        Rotate key
      </RButton>
      <span class="s-akn-create__or">or say “rotate it”</span>
    </template>
  </NeedFrame>
</template>

<style>
.s-akn-rows {
  display: flex;
  flex-direction: column;
  margin: 0;
  border-top: 1px solid var(--r-border-subtle);
}

.s-akn-rows > div {
  display: grid;
  grid-template-columns: minmax(96px, 38%) minmax(0, 1fr);
  gap: 12px;
  padding: 6px 8px;
  border-bottom: 1px solid var(--r-border-subtle);
  font-size: var(--r-text-sm);
}

.s-akn-rows dt {
  color: var(--r-text-tertiary);
}

.s-akn-rows dd {
  min-width: 0;
  margin: 0;
  overflow-wrap: anywhere;
}

.s-akn-rows > div.is-inferred {
  box-shadow: inset 2px 0 0 var(--r-brand);
  background: var(--r-bg-selected);
}
</style>
