<script setup lang="ts">
/**
 * A small decision Simpul noticed on its own: active members without two-factor. One line, one
 * control, and not the brand one: the change set keeps that.
 */
import { useId } from 'vue'
import { RButton, RStatus } from '@/design-system'
import { list } from '../model'

defineProps<{ names: string[] }>()
const emit = defineEmits<{ send: [] }>()
const titleId = useId()
</script>

<template>
  <section class="s-orgnow-remind" data-decision :aria-labelledby="titleId">
    <RStatus class="s-orgnow-remind__lamp" tone="warning" size="sm" :label="`${names.length} not set up`" />
    <h3 :id="titleId" class="s-orgnow-remind__title">
      {{ list(names) }} {{ names.length === 1 ? 'has' : 'have' }} no two-factor yet and {{ names.length === 1 ? 'is' : 'are' }} asked at the next
      sign-in. A reminder emails the steps now.
    </h3>
    <RButton variant="outline" size="sm" data-primary @click="emit('send')">Send reminder</RButton>
  </section>
</template>

<style scoped>
.s-orgnow-remind {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 16px;
  padding: 8px 14px;
  border: 1px solid var(--r-border);
  background: var(--r-bg-surface);
}

.s-orgnow-remind__lamp {
  flex: none;
}

.s-orgnow-remind__title {
  flex: 1 1 320px;
  min-width: 0;
  color: var(--r-text-secondary);
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-regular);
  line-height: 1.4;
}
</style>
