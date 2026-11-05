<script setup lang="ts">
/**
 * An action whose result belongs in a toast: done at once, said once at the edge of the screen,
 * with Undo for a few seconds. This uses the page's real toaster. The tile keeps a quiet record of
 * what happened and can restore it after the toast is gone.
 */
import { computed, onBeforeUnmount, ref, type Component } from 'vue'
import { Archive, KeyRound, PackageCheck, Route, Trash2 } from 'lucide-vue-next'
import { RButton, useToast } from '@/design-system'
import { stamp, useFocusKeeper } from './shared'

const props = withDefaults(
  defineProps<{
    /** Mono caps: "Inbox · older than 30 days". */
    eyebrow: string
    title: string
    meta?: string
    action: string
    /** `danger` for removing or revoking. */
    tone?: 'neutral' | 'danger'
    /** The toast's title and line. */
    toast: string
    toastBody?: string
    /** The word the tile keeps after the action: "Archived". */
    done: string
    /** Undo for this long in the toast, in seconds. */
    undoFor?: number
    icon?: 'archive' | 'key' | 'route' | 'trash' | 'shipped'
    /** `square` 1x1 · `row` 2x1. */
    layout?: 'square' | 'row'
  }>(),
  { tone: 'neutral', undoFor: 6, icon: 'archive', layout: 'square' },
)

const ICONS: Record<string, Component> = { archive: Archive, key: KeyRound, route: Route, trash: Trash2, shipped: PackageCheck }

const { show, dismiss } = useToast()
const at = ref<string | null>(null)
let toastId: number | null = null
const { bind, keep } = useFocusKeeper()

function act() {
  keep('[data-focus="restore"]')
  at.value = stamp()
  toastId = show({
    title: props.toast,
    body: props.toastBody,
    tone: props.tone === 'danger' ? 'danger' : 'success',
    duration: props.undoFor * 1000,
    action: { label: 'Undo', onClick: restore },
  })
}

function restore() {
  keep('[data-focus="act"]')
  if (toastId != null) dismiss(toastId)
  toastId = null
  at.value = null
}

onBeforeUnmount(() => {
  if (toastId != null) dismiss(toastId)
})

const status = computed(() => (at.value ? `${props.done} ${at.value}` : ''))
</script>

<template>
  <div :ref="bind" class="mk toastact" :class="[`toastact--${layout}`, { 'is-done': at }]">
    <div class="toastact__head">
      <span class="toastact__icon" aria-hidden="true"><component :is="ICONS[icon]" :size="14" /></span>
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
    </div>
    <div class="toastact__body">
      <p class="toastact__title">{{ title }}</p>
      <p v-if="meta" class="toastact__meta">{{ at ? status : meta }}</p>
    </div>
    <div class="toastact__foot mk-end">
      <RButton v-if="!at" size="sm" :tone="tone" :variant="tone === 'danger' ? 'outline' : 'solid'" data-focus="act" @click="act">
        {{ action }}
      </RButton>
      <RButton v-else size="sm" variant="ghost" data-focus="restore" @click="restore">Restore</RButton>
    </div>
  </div>
</template>

<style scoped>
.toastact {
  gap: 8px;
}

.toastact__head {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.toastact__icon {
  display: grid;
  flex: none;
  place-items: center;
  width: 24px;
  height: 24px;
  border: 1px solid var(--r-border-strong);
  color: var(--r-text-secondary);
}

.toastact__body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.toastact__title {
  display: -webkit-box;
  overflow: hidden;
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-semibold);
  line-height: 1.3;
  letter-spacing: var(--r-tracking-snug);
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  transition: color var(--r-duration-fast) var(--r-ease-out);
}

/* Done: the record stays, quiet and struck through, until it is restored. */
.is-done .toastact__title {
  color: var(--r-text-tertiary);
  text-decoration: line-through;
}

.toastact__meta {
  overflow: hidden;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.04em;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
}

.toastact__foot {
  display: flex;
}

.toastact--square .toastact__foot > * {
  flex: 1 1 auto;
}

.toastact--row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-rows: auto minmax(0, 1fr);
  column-gap: 16px;
}

.toastact--row .toastact__head {
  grid-column: 1 / -1;
}

.toastact--row .toastact__foot {
  align-self: end;
}
</style>
