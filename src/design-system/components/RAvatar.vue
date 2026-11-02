<script setup lang="ts">
import { computed } from 'vue'
import { identityIndex, initialsOf } from '../composables/identity'
import type { AvatarSize, AvatarStatus } from '../types'

const props = withDefaults(
  defineProps<{
    name: string
    size?: AvatarSize
    /** A surface-coloured ring, for avatars that overlap or sit on images. */
    ring?: boolean
    status?: AvatarStatus
    /** Optional photo. Initials are the default and always the fallback. */
    src?: string
    /** Hide from screen readers when the name is already written next to it. */
    decorative?: boolean
  }>(),
  { size: 'md' },
)

const initials = computed(() => initialsOf(props.name))
const tone = computed(() => identityIndex(props.name))
</script>

<template>
  <span
    class="r-avatar"
    :class="[`r-avatar--${size}`, { 'r-avatar--ring': ring }]"
    :style="{ '--r-avatar-bg': `var(--r-identity-${tone})`, '--r-avatar-fg': `var(--r-identity-${tone}-text)` }"
    :role="decorative ? undefined : 'img'"
    :aria-label="decorative ? undefined : name"
    :aria-hidden="decorative ? 'true' : undefined"
  >
    <img v-if="src" class="r-avatar__image" :src="src" alt="" />
    <span v-else class="r-avatar__initials" aria-hidden="true">{{ initials }}</span>
    <span v-if="status" class="r-avatar__status" :class="`r-avatar__status--${status}`" aria-hidden="true" />
  </span>
</template>

<style>
.r-avatar {
  --r-avatar-size: 32px;
  --r-avatar-ring: var(--r-bg-surface);
  position: relative;
  display: inline-grid;
  flex-shrink: 0;
  place-items: center;
  width: var(--r-avatar-size);
  height: var(--r-avatar-size);
  border-radius: 50%;
  background: var(--r-avatar-bg);
  color: var(--r-avatar-fg);
  font-size: calc(var(--r-avatar-size) * 0.38);
  font-weight: var(--r-weight-semibold);
  line-height: 1;
  letter-spacing: 0;
  user-select: none;
}

.r-avatar--xs {
  --r-avatar-size: 20px;
  font-size: 8.5px;
}
.r-avatar--sm {
  --r-avatar-size: 24px;
  font-size: 10px;
}
.r-avatar--md {
  --r-avatar-size: 32px;
}
.r-avatar--lg {
  --r-avatar-size: 40px;
}
.r-avatar--xl {
  --r-avatar-size: 48px;
}

.r-avatar--ring {
  box-shadow: 0 0 0 2px var(--r-avatar-ring);
}

.r-avatar__image {
  width: 100%;
  height: 100%;
  border-radius: inherit;
  object-fit: cover;
}

.r-avatar__status {
  position: absolute;
  right: -1px;
  bottom: -1px;
  width: max(8px, calc(var(--r-avatar-size) * 0.28));
  height: max(8px, calc(var(--r-avatar-size) * 0.28));
  border-radius: 50%;
  box-shadow: 0 0 0 2px var(--r-avatar-ring);
}
.r-avatar__status--online {
  background: var(--r-success);
}
.r-avatar__status--away {
  background: var(--r-warning);
}
.r-avatar__status--busy {
  background: var(--r-danger);
}
.r-avatar__status--offline {
  background: var(--r-text-disabled);
}
</style>
