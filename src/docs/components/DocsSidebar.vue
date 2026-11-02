<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'
import { RNavItem } from '@/design-system'
import { navGroups, type DocLink } from '../nav'

const route = useRoute()
const isActive = (link: DocLink) => route.path === link.path
</script>

<template>
  <nav class="docs-nav" aria-label="Documentation">
    <div v-for="(group, g) in navGroups" :key="g" class="docs-nav__group">
      <p v-if="group.title" class="docs-nav__title">{{ group.title }}</p>
      <RNavItem
        v-for="link in group.links"
        :key="link.path"
        :as="RouterLink"
        :to="link.path"
        :icon="link.icon"
        :label="link.title"
        :active="isActive(link)"
      />
    </div>
  </nav>
</template>

<style>
.docs-nav {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.docs-nav__group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.docs-nav__title {
  padding: 0 10px 6px;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
  font-weight: var(--r-weight-medium);
}
</style>
