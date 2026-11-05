<script setup lang="ts">
/**
 * Proof of what was done: every action the agent (or a person) took, newest first, with its time,
 * who did it and a way back. A reverted line stays in the record, struck through, with the time it
 * was reversed. Trust comes from this list, not from a promise.
 */
import { nextTick, ref, watch } from 'vue'
import { RButton } from '@/design-system'
import type { TrailItem } from './script'

const props = defineProps<{
  items: TrailItem[]
  /** Accessible name: "Done by Simpul today". */
  label: string
}>()

const emit = defineEmits<{ revert: [id: string] }>()

/* Revert turns into "Reverted 10:49": the line itself takes the focus, so it is never lost. */
const list = ref<HTMLElement | null>(null)
let pending: string | null = null
function revert(id: string) {
  pending = id
  emit('revert', id)
}
watch(
  () => props.items,
  () => {
    const id = pending
    if (!id) return
    nextTick(() => {
      if (props.items.find((i) => i.id === id)?.revertedAt) {
        list.value?.querySelector<HTMLElement>(`[data-trail="${CSS.escape(id)}"]`)?.focus()
        pending = null
      }
    })
  },
  { deep: true },
)
</script>

<template>
  <ol ref="list" class="desk-trail" :aria-label="label">
    <li
      v-for="item in items"
      :key="item.id"
      class="desk-trail__row"
      :class="{ 'is-reverted': item.revertedAt }"
      :data-trail="item.id"
      tabindex="-1"
    >
      <span class="desk-trail__at">{{ item.at }}</span>
      <span class="desk-trail__body">
        <span class="desk-trail__text">{{ item.text }}</span>
        <span v-if="item.detail" class="desk-trail__detail">{{ item.detail }}</span>
      </span>
      <span class="desk-trail__who">{{ item.who }}</span>
      <span class="desk-trail__end">
        <span v-if="item.revertedAt" class="desk-trail__reverted">Reverted {{ item.revertedAt }}</span>
        <RButton
          v-else-if="item.canRevert"
          size="xs"
          variant="ghost"
          :aria-label="`Revert: ${item.text}`"
          @click="revert(item.id)"
        >
          Revert
        </RButton>
      </span>
    </li>
  </ol>
</template>

<style>
.desk-trail {
  container-type: inline-size;
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  list-style: none;
  border-top: 1px solid var(--r-border);
}

.desk-trail__row {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) auto 72px;
  align-items: baseline;
  gap: 12px;
  min-height: 40px;
  padding: 8px 0;
  border-bottom: 1px solid var(--r-border-subtle);
  font-size: var(--r-text-sm);
}

.desk-trail__at,
.desk-trail__who,
.desk-trail__reverted {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-variant-numeric: tabular-nums;
}

.desk-trail__who {
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.desk-trail__body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.desk-trail__detail {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  overflow-wrap: anywhere;
}

.desk-trail__end {
  display: flex;
  justify-content: flex-end;
}

.desk-trail__row:focus-visible {
  outline: 2px solid var(--r-focus);
  outline-offset: -2px;
}

.desk-trail__row.is-reverted .desk-trail__text {
  color: var(--r-text-tertiary);
  text-decoration: line-through;
}

/* In a narrow column the actor moves under the line instead of taking a column. */
@container (max-width: 520px) {
  .desk-trail__row {
    grid-template-columns: 40px minmax(0, 1fr) auto;
    grid-template-areas: 'at body end' '. who end';
    row-gap: 2px;
  }
  .desk-trail__at {
    grid-area: at;
  }
  .desk-trail__body {
    grid-area: body;
  }
  .desk-trail__who {
    grid-area: who;
  }
  .desk-trail__end {
    grid-area: end;
  }
}
</style>
