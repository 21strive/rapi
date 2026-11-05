<script setup lang="ts">
/**
 * The calm end of an alarm queue: nothing needs you. An empty state still earns its screen when it
 * says why it is empty and offers the next useful thing, so the person is not left guessing.
 */
import { ref, type Component } from 'vue'
import { CircleCheck, Inbox, Truck } from 'lucide-vue-next'
import { RButton, REmpty } from '@/design-system'
import { stamp, useFocusKeeper } from './shared'

withDefaults(
  defineProps<{
    title: string
    body: string
    icon?: 'check' | 'inbox' | 'truck'
    /** The next useful thing: "Hand over to Kevin". */
    action: string
    /** Said after it: "Handed over to Kevin Tan". */
    done: string
    /** The mark's construction lines behind it. One per view at most, so most variants leave them off. */
    lines?: boolean
  }>(),
  { icon: 'check', lines: false },
)

const ICONS: Record<string, Component> = { check: CircleCheck, inbox: Inbox, truck: Truck }
const at = ref<string | null>(null)
const { bind, keep } = useFocusKeeper()

function act() {
  keep('[data-focus="undo"]')
  at.value = stamp()
}

function undo() {
  keep('[data-focus="act"]')
  at.value = null
}
</script>

<template>
  <div :ref="bind" class="mk mk--bleed empty" :class="{ 'no-lines': !lines }">
    <REmpty :title="title" :body="body" :icon="ICONS[icon]" size="sm">
      <template #actions>
        <RButton v-if="!at" size="sm" data-focus="act" @click="act">{{ action }}</RButton>
        <span v-else class="empty__done">
          <span class="empty__said" aria-live="polite">{{ done }} · {{ at }}</span>
          <RButton size="xs" variant="ghost" data-focus="undo" @click="undo">Undo</RButton>
        </span>
      </template>
    </REmpty>
  </div>
</template>

<style scoped>
.empty :deep(.r-empty) {
  flex: 1 1 auto;
  min-height: 0;
  padding: 12px;
  border: 0;
  background: transparent;
}

.empty :deep(.r-empty__content) {
  background: var(--r-bg-surface);
}

.empty.no-lines :deep(.r-supergraphic) {
  display: none;
}

.empty.no-lines :deep(.r-empty__content) {
  background: transparent;
}

.empty__done {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 4px 8px;
}

.empty__said {
  color: var(--r-success-text);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
</style>
