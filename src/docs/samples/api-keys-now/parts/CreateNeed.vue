<script setup lang="ts">
/**
 * The key waiting to be created: its terms in one line, the scope ladder with the evidence for
 * each scope, and the one commit. The same press can be said in the thread: "create it".
 */
import { KeyRound } from 'lucide-vue-next'
import { RButton } from '@/design-system'
import type { ResourceId } from '../data'
import { draftTerms, type Draft } from '../script'
import NeedFrame from './NeedFrame.vue'
import ScopeLadder from './ScopeLadder.vue'

defineProps<{ draft: Draft; asked: ResourceId | null; primary: boolean }>()
const emit = defineEmits<{ create: [] }>()
</script>

<template>
  <NeedFrame :eyebrow="`New ${draft.env} key`" :title="draft.name" :sub="draftTerms(draft)" meta="Waiting for you">
    <ScopeLadder :draft="draft" :asked="asked" />
    <p class="s-akn-create__source">
      {{ draft.useLabel }} in the last 30 days. A scope is on only where {{ draft.job === 'webhook' ? 'an event names it' : 'the job used it' }}.
    </p>
    <template #foot>
      <RButton :tone="primary ? 'brand' : 'neutral'" @click="emit('create')">
        <template #leading><KeyRound /></template>
        Create {{ draft.env }} key
      </RButton>
      <span class="s-akn-create__or">or say “create it”</span>
    </template>
  </NeedFrame>
</template>

<style>
.s-akn-create__source {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
  line-height: 1.4;
}

.s-akn-create__or {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}
</style>
