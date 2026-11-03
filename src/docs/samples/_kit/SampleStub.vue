<script setup lang="ts">
import { computed } from 'vue'
import { RLogo, RSupergraphic } from '@/design-system'
import { sampleById } from '../registry'

const props = defineProps<{ id: string }>()
const sample = computed(() => sampleById(props.id))
</script>

<template>
  <div class="sample-stub" :data-theme="sample?.theme">
    <RSupergraphic variant="construction" anchor="bottom-right" />
    <div class="sample-stub__body">
      <RLogo brand="21strive" variant="mark" :size="20" label="" />
      <p class="r-eyebrow">{{ sample?.index }} · {{ sample?.group }}</p>
      <h1 class="r-display">{{ sample?.title }}</h1>
      <p class="r-body-lg r-text-secondary">{{ sample?.summary }}</p>
      <p class="r-label">In production</p>
    </div>
  </div>
</template>

<style>
.sample-stub {
  position: relative;
  min-height: 100dvh;
  background: var(--r-bg-canvas);
  color: var(--r-text);
}
.sample-stub__body {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 720px;
  padding: 96px 48px;
}
</style>
