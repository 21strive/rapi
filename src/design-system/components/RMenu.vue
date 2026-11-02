<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Check, ChevronRight } from 'lucide-vue-next'
import { getFocusable } from '../composables/dom'
import { provideFloatingRegistry, transformOrigin, useFloating } from '../composables/floating'
import type { MenuItem } from '../types'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    items: MenuItem[]
    label?: string
    /** Where focus goes on mount: the first item (opened by keyboard), the menu itself (opened by pointer), or nowhere. */
    initialFocus?: 'first' | 'menu' | 'none'
    /** Set internally on nested menus. */
    submenu?: boolean
  }>(),
  { initialFocus: 'first' },
)

const emit = defineEmits<{
  select: [item: MenuItem]
  close: [reason: 'select' | 'escape' | 'tab']
  /** A submenu asking its parent to close it and take focus back. */
  back: []
}>()

defineSlots<{ header?(): unknown }>()

const root = ref<HTMLElement | null>(null)
const header = ref<HTMLElement | null>(null)
const sub = ref<HTMLElement | null>(null)
const subMenu = ref<{ focusFirst: () => void } | null>(null)
const itemEls: (HTMLElement | null)[] = []
const openIndex = ref<number | null>(null)
const submenuFocus = ref<'first' | 'none'>('none')
let lastItem = -1
let openTimer = 0
let closeTimer = 0
let typeahead = ''
let typeaheadTimer = 0

const hasIcons = computed(() => props.items.some((item) => item.icon))
const openItem = computed(() => (openIndex.value === null ? null : props.items[openIndex.value]))

/* Submenus are teleported; they register so a parent popover treats clicks inside as inside. */
const registry = provideFloatingRegistry()
let releaseSub: (() => void) | undefined
watch(sub, (el) => {
  releaseSub?.()
  releaseSub = el ? registry.register(() => sub.value) : undefined
})

const subFloating = useFloating(sub, {
  anchor: () => (openIndex.value === null ? null : itemEls[openIndex.value]),
  open: () => openIndex.value !== null,
  placement: 'right-start',
  offset: 6,
  crossOffset: -7,
  fitHeight: true,
})

const subStyle = computed(() => [subFloating.style.value, { '--r-origin': transformOrigin(subFloating.placement.value) }])

function isEnabled(item: MenuItem | undefined) {
  return !!item && !item.divider && !item.heading && !item.disabled
}

function enabledIndexes() {
  return props.items.flatMap((item, i) => (isEnabled(item) ? [i] : []))
}

function focusItem(index: number) {
  const el = itemEls[index]
  if (!el) return
  lastItem = index
  el.focus()
}

function currentIndex() {
  return itemEls.findIndex((el) => !!el && el === document.activeElement)
}

function focusFirst() {
  const list = enabledIndexes()
  if (list.length) focusItem(list[0])
}

function move(step: 1 | -1) {
  const list = enabledIndexes()
  if (!list.length) return
  const position = list.indexOf(currentIndex())
  const next =
    position < 0 ? (step > 0 ? list[0] : list[list.length - 1]) : list[(position + step + list.length) % list.length]
  focusItem(next)
}

function openSub(index: number, focus: 'first' | 'none') {
  clearTimeout(openTimer)
  clearTimeout(closeTimer)
  submenuFocus.value = focus
  if (openIndex.value === index) {
    if (focus === 'first') subMenu.value?.focusFirst()
    return
  }
  openIndex.value = index
}

function closeSub(refocus = false) {
  clearTimeout(openTimer)
  clearTimeout(closeTimer)
  const index = openIndex.value
  openIndex.value = null
  if (refocus && index !== null) focusItem(index)
}

function cancelClose() {
  clearTimeout(closeTimer)
}

function activate(index: number, viaKeyboard: boolean) {
  const item = props.items[index]
  if (!isEnabled(item)) return
  if (item.children?.length) {
    if (openIndex.value === index && !viaKeyboard) closeSub()
    else openSub(index, viaKeyboard ? 'first' : 'none')
    return
  }
  item.onSelect?.()
  emit('select', item)
  if (!item.keepOpen) emit('close', 'select')
}

function onPointerMove(index: number) {
  const item = props.items[index]
  if (!isEnabled(item)) return
  if (document.activeElement !== itemEls[index]) focusItem(index)
  if (item.children?.length) {
    clearTimeout(closeTimer)
    if (openIndex.value !== index) {
      clearTimeout(openTimer)
      openTimer = window.setTimeout(() => openSub(index, 'none'), 90)
    }
  } else if (openIndex.value !== null) {
    clearTimeout(openTimer)
    clearTimeout(closeTimer)
    closeTimer = window.setTimeout(() => closeSub(), 160)
  }
}

function searchByLetter(char: string) {
  clearTimeout(typeaheadTimer)
  typeahead += char.toLowerCase()
  typeaheadTimer = window.setTimeout(() => (typeahead = ''), 500)
  const list = enabledIndexes()
  const start = Math.max(0, list.indexOf(currentIndex()) + (typeahead.length === 1 ? 1 : 0))
  const ordered = [...list.slice(start), ...list.slice(0, start)]
  const hit = ordered.find((i) => props.items[i].label?.toLowerCase().startsWith(typeahead))
  if (hit !== undefined) focusItem(hit)
}

function onKeydown(event: KeyboardEvent) {
  const inHeader = !!header.value?.contains(event.target as Node)

  if (event.key === 'Escape') {
    if (props.submenu) {
      event.preventDefault()
      event.stopPropagation()
      emit('back')
    } else {
      emit('close', 'escape')
    }
    return
  }

  if (event.key === 'Tab') {
    event.preventDefault()
    const headerItems = header.value ? getFocusable(header.value) : []
    if (!headerItems.length) {
      emit('close', 'tab')
    } else if (inHeader) {
      lastItem >= 0 ? focusItem(lastItem) : focusFirst()
    } else {
      ;(headerItems.find((el) => el.getAttribute('tabindex') === '0' || el.getAttribute('aria-checked') === 'true') ?? headerItems[0]).focus()
    }
    return
  }

  // Arrow keys inside the header belong to whatever widget lives there.
  if (inHeader) return

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      move(1)
      break
    case 'ArrowUp':
      event.preventDefault()
      move(-1)
      break
    case 'Home':
      event.preventDefault()
      focusFirst()
      break
    case 'End': {
      event.preventDefault()
      const list = enabledIndexes()
      if (list.length) focusItem(list[list.length - 1])
      break
    }
    case 'ArrowRight': {
      const index = currentIndex()
      if (index >= 0 && props.items[index].children?.length) {
        event.preventDefault()
        openSub(index, 'first')
      }
      break
    }
    case 'ArrowLeft':
      if (props.submenu) {
        event.preventDefault()
        event.stopPropagation()
        emit('back')
      }
      break
    default:
      if (event.key.length === 1 && event.key !== ' ' && !event.ctrlKey && !event.metaKey && !event.altKey) {
        searchByLetter(event.key)
      }
  }
}

function onChildSelect(item: MenuItem) {
  emit('select', item)
}

function onChildClose(reason: 'select' | 'escape' | 'tab') {
  if (reason === 'escape') {
    closeSub(true)
    return
  }
  closeSub()
  emit('close', reason)
}

onMounted(async () => {
  await nextTick()
  if (props.initialFocus === 'first') focusFirst()
  else if (props.initialFocus === 'menu') root.value?.focus({ preventScroll: true })
})

onBeforeUnmount(() => {
  clearTimeout(openTimer)
  clearTimeout(closeTimer)
  clearTimeout(typeaheadTimer)
  releaseSub?.()
})

defineExpose({ focusFirst })
</script>

<template>
  <div ref="root" class="r-menu" role="menu" :aria-label="label" tabindex="-1" v-bind="$attrs" @keydown="onKeydown">
    <div v-if="$slots.header" ref="header" class="r-menu__header"><slot name="header" /></div>
    <template v-for="(item, i) in items" :key="item.id ?? i">
      <div v-if="item.divider" class="r-menu__divider" role="separator" />
      <div v-else-if="item.heading" class="r-menu__heading" role="presentation">{{ item.label }}</div>
      <button
        v-else
        :ref="(el) => (itemEls[i] = el as HTMLElement | null)"
        type="button"
        tabindex="-1"
        class="r-menu__item"
        :class="{ 'is-danger': item.danger, 'is-expanded': openIndex === i }"
        :role="item.checked !== undefined ? 'menuitemcheckbox' : 'menuitem'"
        :aria-checked="item.checked"
        :aria-haspopup="item.children?.length ? 'menu' : undefined"
        :aria-expanded="item.children?.length ? openIndex === i : undefined"
        :aria-disabled="item.disabled ? 'true' : undefined"
        @click="activate(i, $event.detail === 0)"
        @pointermove="onPointerMove(i)"
      >
        <span v-if="hasIcons" class="r-menu__icon"><component :is="item.icon" v-if="item.icon" /></span>
        <span class="r-menu__text">
          <span class="r-menu__label">{{ item.label }}</span>
          <span v-if="item.description" class="r-menu__description">{{ item.description }}</span>
        </span>
        <span v-if="item.shortcut" class="r-menu__shortcut">{{ item.shortcut }}</span>
        <Check v-if="item.checked" class="r-menu__check" />
        <ChevronRight v-if="item.children?.length" class="r-menu__chevron" />
      </button>
    </template>
  </div>
  <Teleport to="body">
    <Transition name="r-pop">
      <div v-if="openItem?.children?.length" ref="sub" class="r-panel r-menu-sub" :style="subStyle" @pointerenter="cancelClose">
        <RMenu
          ref="subMenu"
          :items="openItem.children"
          :label="openItem.label"
          submenu
          :initial-focus="submenuFocus"
          @select="onChildSelect"
          @close="onChildClose"
          @back="closeSub(true)"
        />
      </div>
    </Transition>
  </Teleport>
</template>

<style>
.r-menu {
  display: flex;
  flex-direction: column;
  min-width: 208px;
  outline: none;
}

.r-menu__header {
  margin: 0 -6px 6px;
  padding: 6px 12px 10px;
  border-bottom: 1px solid var(--r-border-subtle);
}

.r-menu__item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-height: 36px;
  padding: 6px 10px;
  border: 0;
  border-radius: var(--r-radius-sm);
  background: none;
  color: var(--r-text);
  font-size: var(--r-text-md);
  text-align: left;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.r-menu__item:focus,
.r-menu__item.is-expanded {
  outline: none;
  background: var(--r-bg-hover);
}

.r-menu__item:focus-visible {
  box-shadow: inset 0 0 0 1px var(--r-border-strong);
}

.r-menu__item[aria-disabled='true'] {
  cursor: not-allowed;
  opacity: 0.45;
}

.r-menu__item.is-danger {
  color: var(--r-danger-text);
}
.r-menu__item.is-danger .r-menu__icon {
  color: inherit;
}
.r-menu__item.is-danger:focus {
  background: var(--r-danger-soft);
}

.r-menu__icon {
  display: inline-grid;
  flex-shrink: 0;
  place-items: center;
  width: 18px;
  color: var(--r-text-tertiary);
}
.r-menu__icon svg {
  width: 17px;
  height: 17px;
}

.r-menu__text {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.r-menu__label {
  overflow: hidden;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.r-menu__description {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
  line-height: 1.35;
}

.r-menu__shortcut {
  margin-left: 20px;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
  letter-spacing: 0.08em;
  white-space: nowrap;
}

.r-menu__check,
.r-menu__chevron {
  width: 16px;
  height: 16px;
  margin-left: 8px;
  color: var(--r-text-tertiary);
}
.r-menu__check {
  color: var(--r-brand);
}

.r-menu__divider {
  height: 1px;
  margin: 6px -6px;
  background: var(--r-border-subtle);
}

.r-menu__heading {
  padding: 8px 10px 4px;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-2xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-wide);
  text-transform: uppercase;
}

.r-menu-sub {
  z-index: calc(var(--r-z-popover) + 1);
  max-height: calc(100dvh - 16px);
  padding: 6px;
  overflow: auto;
  transform-origin: var(--r-origin, top left);
}
</style>
