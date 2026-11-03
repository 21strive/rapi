<script setup lang="ts">
import { computed, nextTick, ref, useId, watch } from 'vue'
import { ArrowDown, ArrowLeft, ArrowUp, ChevronRight, CircleHelp, CornerDownLeft, Search } from 'lucide-vue-next'
import RKbd from './RKbd.vue'
import { useFocusTrap, useHotkey, useLayer, useScrollLock } from '../composables/dom'
import type { CommandItem } from '../types'

const open = defineModel<boolean>('open', { default: false })

const props = withDefaults(
  defineProps<{
    items: CommandItem[]
    placeholder?: string
    emptyText?: string
    /** Global shortcut that toggles the palette. `null` turns it off. */
    hotkey?: string | null
    label?: string
  }>(),
  {
    placeholder: 'Type an action or navigate',
    emptyText: 'Nothing matches that. Try another word.',
    hotkey: 'mod+k',
    label: 'Command menu',
  },
)

const emit = defineEmits<{ select: [item: CommandItem] }>()

const query = ref('')
const stack = ref<CommandItem[]>([])
const activeId = ref<string | null>(null)
const input = ref<HTMLInputElement | null>(null)
const panel = ref<HTMLElement | null>(null)
const list = ref<HTMLElement | null>(null)
const listId = useId()

const page = computed(() => stack.value[stack.value.length - 1] ?? null)
const pageItems = computed(() => (page.value ? (page.value.children ?? []) : props.items))

/* ── Fuzzy matching ─────────────────────────────────────────────────────────
 * A substring wins outright (more if it starts a word); otherwise every letter
 * has to appear in order, and runs of adjacent letters score higher.
 */
interface Match {
  item: CommandItem
  score: number
  hits: Set<number>
}

function fuzzy(needle: string, haystack: string): { score: number; hits: number[] } | null {
  const text = haystack.toLowerCase()
  const at = text.indexOf(needle)
  if (at >= 0) {
    const wordStart = at === 0 || /[\s\-/]/.test(text[at - 1])
    return { score: 100 + (wordStart ? 40 : 0) - at, hits: Array.from({ length: needle.length }, (_, i) => at + i) }
  }
  const hits: number[] = []
  let from = 0
  let score = 0
  for (const char of needle) {
    if (char === ' ') continue
    const found = text.indexOf(char, from)
    if (found < 0) return null
    score += hits.length && found === hits[hits.length - 1] + 1 ? 6 : 1
    if (found === 0 || /\s/.test(text[found - 1])) score += 3
    hits.push(found)
    from = found + 1
  }
  return { score, hits }
}

const results = computed<Match[]>(() => {
  const needle = query.value.trim().toLowerCase()
  if (!needle) return pageItems.value.map((item) => ({ item, score: 0, hits: new Set<number>() }))
  const matches: Match[] = []
  for (const item of pageItems.value) {
    const onLabel = fuzzy(needle, item.label)
    if (onLabel) {
      matches.push({ item, score: onLabel.score, hits: new Set(onLabel.hits) })
      continue
    }
    if (item.keywords?.some((word) => fuzzy(needle, word))) matches.push({ item, score: 1, hits: new Set() })
  }
  return matches.sort((a, b) => b.score - a.score)
})

const groups = computed(() => {
  const byName = new Map<string, Match[]>()
  for (const match of results.value) {
    const name = match.item.group ?? ''
    if (!byName.has(name)) byName.set(name, [])
    byName.get(name)!.push(match)
  }
  return [...byName.entries()].map(([name, matches], index) => ({ name, matches, id: `${listId}-group-${index}` }))
})

const flat = computed(() => groups.value.flatMap((group) => group.matches))

const optionId = (item: CommandItem) => `${listId}-option-${item.id}`

watch(
  flat,
  (matches) => {
    activeId.value = matches.find((m) => !m.item.disabled)?.item.id ?? null
  },
  { immediate: true },
)

function segments(match: Match) {
  const out: { text: string; hit: boolean }[] = []
  for (const [i, char] of [...match.item.label].entries()) {
    const hit = match.hits.has(i)
    const last = out[out.length - 1]
    if (last && last.hit === hit) last.text += char
    else out.push({ text: char, hit })
  }
  return out
}

function scrollActiveIntoView() {
  nextTick(() => {
    if (!activeId.value || !list.value) return
    const el = list.value.querySelector<HTMLElement>(`[data-command-id="${CSS.escape(activeId.value)}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  })
}

function move(step: 1 | -1) {
  const enabled = flat.value.filter((m) => !m.item.disabled)
  if (!enabled.length) return
  const at = enabled.findIndex((m) => m.item.id === activeId.value)
  const next = at < 0 ? 0 : (at + step + enabled.length) % enabled.length
  activeId.value = enabled[next].item.id
  scrollActiveIntoView()
}

function close() {
  open.value = false
}

function back() {
  if (!stack.value.length) return
  stack.value = stack.value.slice(0, -1)
  query.value = ''
}

function choose(item: CommandItem) {
  if (item.disabled) return
  if (item.children?.length) {
    stack.value = [...stack.value, item]
    query.value = ''
    nextTick(() => input.value?.focus())
    return
  }
  const keepOpen = item.onSelect?.() === false
  emit('select', item)
  if (!keepOpen) close()
}

function onKeydown(event: KeyboardEvent) {
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      move(1)
      break
    case 'ArrowUp':
      event.preventDefault()
      move(-1)
      break
    case 'Enter': {
      event.preventDefault()
      const match = flat.value.find((m) => m.item.id === activeId.value)
      if (match) choose(match.item)
      break
    }
    case 'Escape':
      event.preventDefault()
      close()
      break
    case 'Backspace':
    case 'ArrowLeft':
      if (!query.value && stack.value.length) {
        event.preventDefault()
        back()
      }
      break
    case 'Tab':
      event.preventDefault()
      break
  }
}

const layer = useLayer(open)
useScrollLock(open)
useFocusTrap(panel, open, { isTop: layer.isTop, initialFocus: () => input.value })

useHotkey(props.hotkey ?? 'mod+k', () => (open.value = !open.value), {
  enabled: () => props.hotkey !== null,
  allowInInput: true,
})

watch(open, (isOpen) => {
  if (!isOpen) return
  query.value = ''
  stack.value = []
})

watch(page, () => scrollActiveIntoView())
</script>

<template>
  <Teleport to="body">
    <Transition name="r-command">
      <div v-if="open" class="r-command" @pointerdown.self="close">
        <div ref="panel" class="r-command__panel" data-theme="dark" role="dialog" aria-modal="true" :aria-label="label">
          <div v-if="page" class="r-command__crumb">
            <button type="button" class="r-command__back" aria-label="Back" @click="back">
              <ArrowLeft />
            </button>
            <component :is="page.icon" v-if="page.icon" class="r-command__crumb-icon" />
            <span>{{ page.label }}</span>
          </div>
          <div class="r-command__search">
            <Search class="r-command__search-icon" />
            <input
              ref="input"
              v-model="query"
              class="r-command__input"
              type="text"
              role="combobox"
              aria-expanded="true"
              aria-autocomplete="list"
              :aria-controls="listId"
              :aria-activedescendant="activeId ? `${listId}-option-${activeId}` : undefined"
              :placeholder="page?.placeholder ?? placeholder"
              autocomplete="off"
              spellcheck="false"
              @keydown="onKeydown"
            />
            <CircleHelp class="r-command__help" />
          </div>
          <div :id="listId" ref="list" class="r-command__list" role="listbox" :aria-label="page?.label ?? label">
            <div
              v-for="group in groups"
              :key="group.id"
              class="r-command__group"
              role="group"
              :aria-labelledby="group.name ? group.id : undefined"
            >
              <div v-if="group.name" :id="group.id" class="r-command__group-label" role="presentation">{{ group.name }}</div>
              <div
                v-for="match in group.matches"
                :id="optionId(match.item)"
                :key="match.item.id"
                class="r-command__item"
                :class="{ 'is-active': match.item.id === activeId, 'is-disabled': match.item.disabled, 'has-query': !!query }"
                role="option"
                :aria-selected="match.item.id === activeId ? 'true' : 'false'"
                :aria-disabled="match.item.disabled ? 'true' : undefined"
                :data-command-id="match.item.id"
                @pointermove="!match.item.disabled && (activeId = match.item.id)"
                @click="choose(match.item)"
              >
                <component :is="match.item.icon" v-if="match.item.icon" class="r-command__icon" />
                <span class="r-command__label">
                  <template v-for="(segment, i) in segments(match)" :key="i">
                    <mark v-if="segment.hit">{{ segment.text }}</mark>
                    <template v-else>{{ segment.text }}</template>
                  </template>
                </span>
                <span v-if="match.item.meta" class="r-command__meta">{{ match.item.meta }}</span>
                <RKbd v-if="match.item.shortcut?.length" :keys="match.item.shortcut" size="sm" />
                <ChevronRight v-if="match.item.children?.length" class="r-command__chevron" />
              </div>
            </div>
            <p v-if="!flat.length" class="r-command__empty">{{ emptyText }}</p>
          </div>
          <div class="r-command__footer" aria-hidden="true">
            <span class="r-command__hint">
              <span class="r-command__keys">
                <RKbd><ArrowUp /></RKbd>
                <RKbd><ArrowDown /></RKbd>
              </span>
              Navigate
            </span>
            <span class="r-command__hint">
              <RKbd><CornerDownLeft /></RKbd>
              Select
            </span>
            <span class="r-command__hint">
              <RKbd>esc</RKbd>
              Close
            </span>
            <span v-if="page" class="r-command__hint">
              <RKbd><ArrowLeft /></RKbd>
              Back
            </span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style>
.r-command {
  position: fixed;
  z-index: var(--r-z-modal);
  inset: 0;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: max(12vh, 16px) 12px 16px;
  background: var(--r-bg-overlay);
}

/* Always a dark island (data-theme="dark"): square, flat, a strong rule and a short shadow. */
.r-command__panel {
  display: flex;
  flex-direction: column;
  width: min(640px, 100%);
  max-height: min(560px, calc(100dvh - max(12vh, 16px) - 16px));
  overflow: hidden;
  border: 1px solid var(--r-border-strong);
  border-radius: var(--r-radius-surface);
  background: var(--r-bg-raised);
  box-shadow: var(--r-shadow-lg);
  color: var(--r-text);
}

/* The panel is as tall as its content up to max-height, so the list's flex basis falls back to its
   content: only the list may shrink, never the rows around it. */
.r-command__crumb,
.r-command__search,
.r-command__footer {
  flex-shrink: 0;
}

.r-command__crumb {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 40px;
  padding: 0 12px 0 6px;
  border-bottom: 1px solid var(--r-border);
  background: var(--r-bg-muted);
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-semibold);
}

.r-command__back {
  display: inline-grid;
  place-items: center;
  width: var(--r-control-sm);
  height: var(--r-control-sm);
  padding: 0;
  border: 0;
  border-radius: var(--r-radius-control);
  background: none;
  color: var(--r-text-tertiary);
  cursor: pointer;
}
.r-command__back:hover {
  background: var(--r-bg-hover);
  color: var(--r-text);
}
.r-command__back svg {
  width: 16px;
  height: 16px;
}

.r-command__crumb-icon {
  width: 16px;
  height: 16px;
  color: var(--r-text-secondary);
}

.r-command__search {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 52px;
  padding: 0 16px;
  border-bottom: 1px solid var(--r-border);
}

.r-command__search-icon,
.r-command__help {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  color: var(--r-text-tertiary);
}

.r-command__input {
  flex: 1;
  min-width: 0;
  height: 100%;
  padding: 0;
  border: 0;
  outline: none;
  background: transparent;
  color: var(--r-text);
  font-size: var(--r-text-lg);
}
.r-command__input::placeholder {
  color: var(--r-text-tertiary);
}

.r-command__list {
  flex: 1;
  min-height: 0;
  padding: 4px;
  overflow-y: auto;
  overscroll-behavior: contain;
  scroll-padding: 4px;
}

.r-command__group + .r-command__group {
  margin-top: 4px;
}

/* Group headings are labels: Geist Mono capitals. */
.r-command__group-label {
  padding: 10px 12px 6px;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-caps);
  text-transform: uppercase;
}

.r-command__item {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 36px;
  padding: 0 12px;
  border-radius: var(--r-radius-control);
  color: var(--r-text);
  font-size: var(--r-text-md);
  font-weight: var(--r-weight-medium);
  cursor: pointer;
  user-select: none;
}

/* The active row: the hover grey and a 2px cobalt rule on the leading edge, like a selected table row. */
.r-command__item.is-active {
  background: var(--r-bg-hover);
  box-shadow: inset 2px 0 0 var(--r-brand);
}

.r-command__item.is-disabled {
  color: var(--r-text-disabled);
  cursor: not-allowed;
}

.r-command__icon {
  width: 16px;
  height: 16px;
  color: var(--r-text-secondary);
}

.r-command__label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* While typing, the matched letters stay bright and the rest steps back. */
.r-command__item.has-query .r-command__label {
  color: var(--r-text-secondary);
}
.r-command__label mark {
  background: none;
  color: var(--r-text);
  font-weight: var(--r-weight-semibold);
}

.r-command__meta {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.r-command__item.is-active .r-command__meta {
  color: var(--r-text-secondary);
}

.r-command__chevron {
  width: 14px;
  height: 14px;
  color: var(--r-text-tertiary);
}

.r-command__empty {
  padding: 32px 16px;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-sm);
  text-align: center;
}

/* Key hints in the label voice: keycaps and Geist Mono capitals. */
.r-command__footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 20px;
  padding: 10px 16px;
  border-top: 1px solid var(--r-border);
  background: var(--r-bg-muted);
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-medium);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.r-command__hint {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.r-command__keys {
  display: inline-flex;
  gap: 2px;
}

.r-command__footer .r-kbd {
  border-color: var(--r-border-strong);
  background: transparent;
  color: var(--r-text-secondary);
  text-transform: none;
}

/* Touch screens have no use for key hints. */
@media (max-width: 560px), (pointer: coarse) {
  .r-command__footer {
    display: none;
  }
}

.r-command-enter-active,
.r-command-leave-active {
  transition: opacity var(--r-duration-base) var(--r-ease-out);
}
.r-command-enter-active .r-command__panel,
.r-command-leave-active .r-command__panel {
  transition: transform var(--r-duration-base) var(--r-ease-out);
}
.r-command-enter-from,
.r-command-leave-to {
  opacity: 0;
}
.r-command-enter-from .r-command__panel,
.r-command-leave-to .r-command__panel {
  transform: translateY(-6px);
}
</style>
