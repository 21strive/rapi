<script setup lang="ts">
import { RLogo } from '@/design-system'

// The docs sign with the Rapi marks. RLogo holds the geometry (src/design-system/brand/marks.ts),
// so the docs and the library can never drift apart.
withDefaults(defineProps<{ compact?: boolean }>(), { compact: false })
</script>

<template>
  <RLogo class="rapi-logo" brand="rapi" :variant="compact ? 'mark' : 'lockup'" :size="28" label="Rapi" />
</template>

<style>
.rapi-logo {
  color: var(--r-text);
}
</style>
