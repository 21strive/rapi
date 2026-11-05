<script setup lang="ts">
import { computed, watch, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import { RToaster, useTheme } from '@/design-system'
import DocsShell from './components/DocsShell.vue'
import DocsCommandPalette from './components/DocsCommandPalette.vue'
import ExampleToolbar from './components/ExampleToolbar.vue'
import { sampleById } from './samples/registry'
import { sampleTheme } from './samples/theme'

const { resolved } = useTheme()

const route = useRoute()
const bare = computed(() => !!route.meta.bare)

// A sample opens in its own theme; everything else follows the reader's preference.
const sample = computed(() => (route.meta.sample ? sampleById(route.meta.sample) : undefined))
watch(
  () => sample.value?.id,
  () => {
    if (sample.value) sampleTheme.value = sample.value.theme
    // ?theme=dark|light opens a sample in the other theme (links, screenshots).
    const asked = route.query.theme
    if (sample.value && (asked === 'dark' || asked === 'light')) sampleTheme.value = asked
  },
  { immediate: true },
)
watchEffect(() => {
  document.documentElement.dataset.theme = sample.value ? sampleTheme.value : resolved.value
})
</script>

<template>
  <template v-if="bare">
    <RouterView />
    <!-- ?chrome=0 leaves the floating toolbar out, for gallery thumbnails. -->
    <ExampleToolbar v-if="!route.meta.ownToolbar && route.query.chrome !== '0'" />
  </template>
  <DocsShell v-else>
    <RouterView />
  </DocsShell>
  <DocsCommandPalette />
  <RToaster />
</template>
