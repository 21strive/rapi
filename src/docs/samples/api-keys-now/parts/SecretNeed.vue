<script setup lang="ts">
/**
 * The secret, shown once: the whole of it in mono, Copy, and the plain warning that it will not
 * be shown again. "I have stored it" takes it off the screen for good.
 */
import { onBeforeUnmount, ref } from 'vue'
import { Check, Copy, TriangleAlert } from 'lucide-vue-next'
import { RButton } from '@/design-system'
import type { Secret } from '../script'
import NeedFrame from './NeedFrame.vue'

const props = defineProps<{ secret: Secret; primary: boolean }>()
const emit = defineEmits<{ stored: [] }>()

const copied = ref(false)
let timer: number | undefined

async function copy() {
  try {
    await navigator.clipboard?.writeText(props.secret.secret)
    copied.value = true
    window.clearTimeout(timer)
    timer = window.setTimeout(() => (copied.value = false), 2400)
  } catch {
    /* The clipboard can be blocked; the secret stays selectable. */
  }
}

onBeforeUnmount(() => window.clearTimeout(timer))
</script>

<template>
  <NeedFrame eyebrow="Secret · shown once" :title="secret.name" :meta="`Created ${secret.at} WIB`">
    <p class="s-akn-secret__value" :aria-label="`Secret for ${secret.name}`">{{ secret.secret }}</p>
    <p class="s-akn-secret__warn">
      <TriangleAlert aria-hidden="true" />
      <span>You won’t see this again. 21 Strive keeps only a hash and the first 12 characters, <span class="r-mono">{{ secret.secret.slice(0, 12) }}</span>.</span>
    </p>
    <template #foot>
      <RButton variant="outline" @click="copy">
        <template #leading><Check v-if="copied" /><Copy v-else /></template>
        {{ copied ? 'Copied' : 'Copy secret' }}
      </RButton>
      <RButton :tone="primary ? 'brand' : 'neutral'" @click="emit('stored')">I have stored it</RButton>
      <span class="r-sr-only" role="status">{{ copied ? 'Secret copied to the clipboard' : '' }}</span>
    </template>
  </NeedFrame>
</template>

<style>
.s-akn-secret__value {
  padding: 10px 12px;
  border: 1px solid var(--r-border);
  background: var(--r-bg-muted);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-sm);
  line-height: 1.5;
  overflow-wrap: anywhere;
  user-select: all;
}

.s-akn-secret__warn {
  display: flex;
  gap: 8px;
  color: var(--r-warning-text);
  font-size: var(--r-text-xs);
  line-height: 1.45;
}

.s-akn-secret__warn svg {
  flex: none;
  width: 14px;
  height: 14px;
  margin-top: 1px;
}
</style>
