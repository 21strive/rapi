<script setup lang="ts">
import { computed } from 'vue'
import RAvatar from './RAvatar.vue'
import type { AvatarSize } from '../types'

const props = withDefaults(
  defineProps<{
    names: string[]
    /** Avatars shown before the "+N" bubble. */
    max?: number
    size?: AvatarSize
    label?: string
  }>(),
  { max: 4, size: 'sm' },
)

const visible = computed(() => props.names.slice(0, props.max))
const rest = computed(() => Math.max(0, props.names.length - props.max))
const groupLabel = computed(() => {
  if (props.label) return props.label
  const listed = visible.value.join(', ')
  return rest.value ? `${listed} and ${rest.value} more` : listed
})
</script>

<template>
  <span class="r-avatar-group" :class="`r-avatar-group--${size}`" role="img" :aria-label="groupLabel">
    <RAvatar v-for="name in visible" :key="name" :name="name" :size="size" ring decorative single />
    <span v-if="rest" class="r-avatar r-avatar--ring r-avatar-group__more" :class="`r-avatar--${size}`" aria-hidden="true">
      +{{ rest }}
    </span>
  </span>
</template>

<style>
.r-avatar-group {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
}

.r-avatar-group > .r-avatar + .r-avatar {
  margin-left: calc(var(--r-avatar-size) * -0.26);
}

.r-avatar-group__more {
  --r-avatar-bg: var(--r-bg-surface);
  --r-avatar-fg: var(--r-text-secondary);
  border: 1px solid var(--r-border);
  font-size: calc(var(--r-avatar-size) * 0.36);
  font-variant-numeric: tabular-nums;
}
</style>
