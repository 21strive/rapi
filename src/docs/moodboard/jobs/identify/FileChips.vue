<script setup lang="ts">
/**
 * Files, known by their type, name and size before they are opened. Press a file to read what is
 * in it; remove it with its cross or the Delete key, and take that back for a few seconds.
 */
import { computed, onBeforeUnmount, ref } from 'vue'
import { X } from 'lucide-vue-next'
import { RButton } from '@/design-system'

interface FileItem {
  name: string
  /** "PDF", "CSV", "DCM". */
  type: string
  size: string
  /** What is inside and who put it there: "14 pages · Sari Wulandari, 09:14 WIB". */
  meta: string
}

const props = withDefaults(
  defineProps<{
    eyebrow: string
    files: FileItem[]
    /** `stack` one per row · `strip` all in one row. */
    layout?: 'stack' | 'strip'
  }>(),
  { layout: 'stack' },
)

const list = ref<FileItem[]>([...props.files])
const picked = ref<string | null>(props.files[0]?.name ?? null)
const removed = ref<{ file: FileItem; at: number } | null>(null)
let undoTimer: number | undefined

const current = computed(() => list.value.find((f) => f.name === picked.value) ?? null)

function remove(file: FileItem) {
  const at = list.value.indexOf(file)
  if (at < 0) return
  list.value = list.value.filter((f) => f !== file)
  removed.value = { file, at }
  if (picked.value === file.name) picked.value = list.value[Math.min(at, list.value.length - 1)]?.name ?? null
  window.clearTimeout(undoTimer)
  undoTimer = window.setTimeout(() => (removed.value = null), 5000)
}

function undo() {
  if (!removed.value) return
  const next = [...list.value]
  next.splice(removed.value.at, 0, removed.value.file)
  list.value = next
  picked.value = removed.value.file.name
  removed.value = null
  window.clearTimeout(undoTimer)
}

function onKeydown(event: KeyboardEvent, file: FileItem) {
  if (event.key === 'Delete' || event.key === 'Backspace') {
    event.preventDefault()
    remove(file)
  }
}

function restoreAll() {
  list.value = [...props.files]
  removed.value = null
  picked.value = props.files[0]?.name ?? null
}

onBeforeUnmount(() => window.clearTimeout(undoTimer))
const total = computed(() => `${list.value.length} ${list.value.length === 1 ? 'file' : 'files'}`)
</script>

<template>
  <div class="mk files" :class="`files--${layout}`">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <span class="r-label">{{ total }}</span>
    </div>

    <ul class="files__list" :aria-label="eyebrow">
      <li v-for="f in list" :key="f.name" class="files__chip" :class="{ 'is-picked': picked === f.name }">
        <button
          type="button"
          class="files__main mk-reset"
          :aria-pressed="picked === f.name"
          :aria-label="`${f.name}, ${f.type}, ${f.size}`"
          @click="picked = f.name"
          @keydown="onKeydown($event, f)"
        >
          <span class="files__type">{{ f.type }}</span>
          <span class="files__name">{{ f.name }}</span>
          <span class="files__size">{{ f.size }}</span>
        </button>
        <button type="button" class="files__remove mk-reset" :aria-label="`Remove ${f.name}`" @click="remove(f)">
          <X :size="12" aria-hidden="true" />
        </button>
      </li>
      <li v-if="!list.length" class="files__empty">
        <span>No files attached.</span>
        <RButton v-if="!removed" size="xs" variant="ghost" @click="restoreAll">Put them back</RButton>
      </li>
    </ul>

    <div class="files__foot mk-end" aria-live="polite">
      <template v-if="removed">
        <span class="files__said mk-truncate">Removed {{ removed.file.name }}</span>
        <RButton size="xs" variant="outline" @click="undo">Undo</RButton>
      </template>
      <span v-else-if="current" class="files__said mk-truncate">{{ current.meta }}</span>
    </div>
  </div>
</template>

<style scoped>
.files {
  gap: 6px;
}

.files__list {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.files--strip .files__list {
  grid-auto-flow: column;
  grid-auto-columns: minmax(0, 1fr);
}

.files__chip {
  display: flex;
  align-items: stretch;
  min-width: 0;
  height: 28px;
  border: 1px solid var(--r-border);
  background: var(--r-bg-surface);
  transition: border-color var(--r-duration-fast) var(--r-ease-out);
}

.files__chip:hover {
  border-color: var(--r-border-strong);
}

.files__chip.is-picked {
  border-color: var(--r-brand);
  background: var(--r-bg-selected);
}

.files__main {
  display: flex;
  flex: 1 1 auto;
  align-items: center;
  gap: 8px;
  min-width: 0;
  padding: 0 4px 0 4px;
  cursor: pointer;
}

.files__main:focus-visible,
.files__remove:focus-visible {
  outline-offset: -2px;
}

/* The type is a key, like a label on a folder tab. */
.files__type {
  flex: none;
  min-width: 34px;
  padding: 2px 0;
  border: 1px solid var(--r-border-strong);
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: 0.06em;
  line-height: 1.2;
  text-align: center;
}

.is-picked .files__type {
  border-color: var(--r-brand);
  color: var(--r-brand-text);
}

.files__name {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  font-size: var(--r-text-xs);
  font-weight: var(--r-weight-medium);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.files__size {
  flex: none;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-variant-numeric: tabular-nums;
}

.files__remove {
  display: grid;
  flex: none;
  place-items: center;
  width: 24px;
  border-left: 1px solid var(--r-border-subtle);
  color: var(--r-text-tertiary);
  cursor: pointer;
}

.files__remove:hover {
  background: var(--r-bg-hover);
  color: var(--r-text);
}

.files__empty {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  height: 28px;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

.files__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
  min-height: 24px;
}

.files__said {
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
}
</style>
