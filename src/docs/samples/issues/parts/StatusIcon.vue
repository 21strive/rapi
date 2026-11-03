<script setup lang="ts">
import { Circle, CircleCheck, CircleDashed, CircleDot, Contrast } from 'lucide-vue-next'
import { statusLabel, type StatusId } from '../data'

/** A state mark: always beside its word in group heads, with its name for screen readers in rows. */
defineProps<{ status: StatusId; decorative?: boolean }>()

const ICON = { backlog: CircleDashed, todo: Circle, progress: Contrast, review: CircleDot, done: CircleCheck }
</script>

<template>
  <component
    :is="ICON[status]"
    class="s-issues-si"
    :class="`is-${status}`"
    :aria-hidden="decorative ? 'true' : undefined"
    :aria-label="decorative ? undefined : statusLabel(status)"
    :role="decorative ? undefined : 'img'"
  />
</template>

<style scoped>
.s-issues-si {
  width: 14px;
  height: 14px;
  flex: none;
  stroke-width: 2;
}
.is-backlog {
  color: var(--r-text-tertiary);
}
.is-todo {
  color: var(--r-text-secondary);
}
.is-progress {
  color: var(--r-warning);
}
.is-review {
  color: var(--r-brand);
}
.is-done {
  color: var(--r-success);
}
</style>
