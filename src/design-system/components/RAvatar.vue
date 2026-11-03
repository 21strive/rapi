<script setup lang="ts">
import { computed } from 'vue'
import { identityIndex, initialsOf } from '../composables/identity'
import type { AvatarSize, AvatarStatus } from '../types'

const props = withDefaults(
  defineProps<{
    name: string
    /** xs 20 · sm 24 · md 32 · lg 40 · xl 48px. */
    size?: AvatarSize
    /** A surface-coloured ring, for avatars that overlap or sit on images. */
    ring?: boolean
    status?: AvatarStatus
    /** Optional photo. Initials are the default and always the fallback. */
    src?: string
    /** Hide from screen readers when the name is already written next to it. */
    decorative?: boolean
    /** One initial instead of two. Groups use this so the overlap never cuts a letter in half. */
    single?: boolean
  }>(),
  { size: 'md' },
)

const initials = computed(() => (props.single ? initialsOf(props.name).slice(0, 1) : initialsOf(props.name)))
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
/* A square tile with mono initials on the person's identity colour. */
.r-avatar {
  --r-avatar-size: 32px;
  --r-avatar-ring: var(--r-bg-surface);
  position: relative;
  display: inline-grid;
  flex-shrink: 0;
  place-items: center;
  width: var(--r-avatar-size);
  height: var(--r-avatar-size);
  border-radius: var(--r-radius-mark);
  background: var(--r-avatar-bg);
  color: var(--r-avatar-fg);
  font-family: var(--r-font-mono);
  font-size: calc(var(--r-avatar-size) * 0.36);
  font-weight: var(--r-weight-semibold);
  line-height: 1;
  letter-spacing: 0;
  user-select: none;
}

.r-avatar--xs {
  --r-avatar-size: 20px;
  font-size: 9px;
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

/* Presence is a lamp: the only round thing on an avatar. */
.r-avatar__status {
  position: absolute;
  right: -2px;
  bottom: -2px;
  width: max(6px, calc(var(--r-avatar-size) * 0.22));
  height: max(6px, calc(var(--r-avatar-size) * 0.22));
  border-radius: var(--r-radius-round);
  box-shadow: 0 0 0 2px var(--r-avatar-ring);
}
.r-avatar__status--online {
  background: var(--r-status-good);
}
.r-avatar__status--away {
  background: var(--r-status-warning);
}
.r-avatar__status--busy {
  background: var(--r-status-critical);
}
.r-avatar__status--offline {
  background: var(--r-status-off);
}
</style>
