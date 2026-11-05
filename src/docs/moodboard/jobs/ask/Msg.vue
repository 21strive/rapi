<script setup lang="ts">
/**
 * One message of a conversation: a square block with a mono head (who, when). The person's own
 * messages carry a faint fill; the other side's sit on a hairline. Never a rounded bubble.
 */
import Writing from './Writing.vue'

withDefaults(
  defineProps<{
    /** Who wrote it, shown in mono caps: "You", "Simpul", "Fikri". */
    who: string
    /** "09:14". */
    at?: string
    mine?: boolean
    /** Still being written: shows the writing segments instead of the text. */
    pending?: boolean
    /** Smaller text, for narrow tiles. */
    dense?: boolean
  }>(),
  {},
)
</script>

<template>
  <div class="msg" :class="{ 'msg--mine': mine, 'msg--dense': dense }">
    <p class="msg__head">
      <span class="mk-truncate">{{ who }}</span>
      <span v-if="at" class="msg__at">{{ at }}</span>
    </p>
    <Writing v-if="pending" />
    <div v-else class="msg__text"><slot /></div>
  </div>
</template>

<style scoped>
.msg {
  display: flex;
  flex: none;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  padding: 5px 8px 7px;
  border: 1px solid var(--r-border-subtle);
}

.msg--mine {
  border-color: transparent;
  background: color-mix(in srgb, var(--r-text) 6%, transparent);
}

.msg__head {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-medium);
  line-height: 16px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.msg__at {
  flex: none;
  font-variant-numeric: tabular-nums;
}

.msg__text {
  min-width: 0;
  color: var(--r-text);
  font-size: var(--r-text-sm);
  line-height: 1.4;
  overflow-wrap: anywhere;
}

.msg--dense .msg__text {
  font-size: var(--r-text-xs);
}
</style>
