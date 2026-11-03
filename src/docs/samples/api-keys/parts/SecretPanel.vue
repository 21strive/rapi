<script setup lang="ts">
import { RAlert, RCodeBlock, RSpecList, type SpecItem } from '@/design-system'

/** The secret, shown once, with the warning that it will not be shown again. */
defineProps<{ secret: string; summary: SpecItem[] }>()
</script>

<template>
  <div class="s-api-keys-secret">
    <RAlert tone="warning" title="Copy the secret now">
      This is the only time it is shown. Store it in your secret manager; we keep only a hash and the first eight characters.
    </RAlert>
    <RCodeBlock :code="secret" title="Secret key" language="Bearer" wrap />
    <RSpecList dense :items="summary" />
  </div>
</template>

<style scoped>
.s-api-keys-secret {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
