<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useTheme } from '@/design-system'
import DocsShell from './components/DocsShell.vue'
import DocsCommandPalette from './components/DocsCommandPalette.vue'
import ExampleToolbar from './components/ExampleToolbar.vue'

useTheme()

const route = useRoute()
const bare = computed(() => !!route.meta.bare)
</script>

<template>
  <template v-if="bare">
    <RouterView />
    <ExampleToolbar />
  </template>
  <DocsShell v-else>
    <RouterView />
  </DocsShell>
  <DocsCommandPalette />
</template>
