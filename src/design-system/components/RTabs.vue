<script setup lang="ts">
import { computed, nextTick, onMounted, ref, useId, watch } from 'vue'
import { useElementSize } from '../composables/dom'
import type { TabItem } from '../types'

const model = defineModel<string | number>()

const props = withDefaults(
  defineProps<{
    items: TabItem[]
    /** sm 32px · md 40px tall. */
    size?: 'sm' | 'md'
    /** Accessible name for the tab list. */
    label?: string
    id?: string
  }>(),
  { size: 'md' },
)

defineSlots<{ default?(props: { value: string | number | undefined }): unknown }>()

const autoId = useId()
const baseId = computed(() => props.id ?? autoId)
const list = ref<HTMLElement | null>(null)
const tabs: (HTMLButtonElement | null)[] = []
const indicator = ref({ x: 0, width: 0, visible: false, animated: false })

const activeIndex = computed(() => props.items.findIndex((item) => item.value === model.value))
const focusIndex = computed(() => (activeIndex.value >= 0 ? activeIndex.value : props.items.findIndex((i) => !i.disabled)))

function measure() {
  const el = tabs[activeIndex.value]
  if (!el) {
    indicator.value = { ...indicator.value, visible: false }
    return
  }
  const first = !indicator.value.visible
  indicator.value = { x: el.offsetLeft, width: el.offsetWidth, visible: true, animated: !first }
  if (first) requestAnimationFrame(() => (indicator.value = { ...indicator.value, animated: true }))
}

const { width } = useElementSize(list)
watch([activeIndex, width, () => props.items.map((i) => `${i.label}${i.count ?? ''}`).join()], () => nextTick(measure))
onMounted(measure)

function select(index: number, focus = false) {
  const item = props.items[index]
  if (!item || item.disabled) return
  model.value = item.value
  if (focus) {
    tabs[index]?.focus()
    tabs[index]?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }
}

function nextEnabled(from: number, step: number) {
  const n = props.items.length
  let i = from
  for (let k = 0; k < n; k++) {
    i = (i + step + n) % n
    if (!props.items[i].disabled) return i
  }
  return from
}

function onKeydown(event: KeyboardEvent) {
  const from = focusIndex.value
  let to: number | null = null
  if (event.key === 'ArrowRight') to = nextEnabled(from, 1)
  else if (event.key === 'ArrowLeft') to = nextEnabled(from, -1)
  else if (event.key === 'Home') to = nextEnabled(-1, 1)
  else if (event.key === 'End') to = nextEnabled(props.items.length, -1)
  if (to === null) return
  event.preventDefault()
  select(to, true)
}
</script>

<template>
  <div class="r-tabs" :class="`r-tabs--${size}`">
    <div ref="list" class="r-tabs__list" role="tablist" :aria-label="label" @keydown="onKeydown">
      <button
        v-for="(item, i) in items"
        :id="`${baseId}-tab-${i}`"
        :key="String(item.value)"
        :ref="(el) => (tabs[i] = el as HTMLButtonElement | null)"
        type="button"
        role="tab"
        class="r-tabs__tab"
        :class="{ 'is-active': i === activeIndex }"
        :aria-selected="i === activeIndex ? 'true' : 'false'"
        :aria-controls="$slots.default ? `${baseId}-panel` : undefined"
        :tabindex="i === focusIndex ? 0 : -1"
        :disabled="item.disabled"
        @click="select(i)"
      >
        <component :is="item.icon" v-if="item.icon" />
        <span>{{ item.label }}</span>
        <span v-if="item.count != null" class="r-tabs__count">{{ item.count }}</span>
      </button>
      <span
        class="r-tabs__indicator"
        :class="{ 'is-visible': indicator.visible, 'is-animated': indicator.animated }"
        :style="{ transform: `translateX(${indicator.x}px)`, width: `${indicator.width}px` }"
        aria-hidden="true"
      />
    </div>
    <div
      v-if="$slots.default"
      :id="`${baseId}-panel`"
      class="r-tabs__panel"
      role="tabpanel"
      :aria-labelledby="activeIndex >= 0 ? `${baseId}-tab-${activeIndex}` : undefined"
      tabindex="0"
    >
      <slot :value="model" />
    </div>
  </div>
</template>

<style>
.r-tabs {
  min-width: 0;
}

.r-tabs__list {
  position: relative;
  display: flex;
  gap: 24px;
  overflow-x: auto;
  border-bottom: 1px solid var(--r-border);
  scrollbar-width: none;
}
.r-tabs__list::-webkit-scrollbar {
  display: none;
}

.r-tabs__tab {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 8px;
  height: var(--r-control-lg);
  padding: 0 2px;
  border: 0;
  border-radius: var(--r-radius-control);
  background: none;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-md);
  font-weight: var(--r-weight-medium);
  white-space: nowrap;
  cursor: pointer;
  transition: color var(--r-duration-fast) var(--r-ease-out);
}
.r-tabs__tab:hover:not(.is-active, :disabled) {
  color: var(--r-text);
}
.r-tabs__tab.is-active {
  color: var(--r-text);
}
.r-tabs__tab:focus-visible {
  outline-offset: -2px;
}
.r-tabs__tab:disabled {
  color: var(--r-text-disabled);
  cursor: not-allowed;
}
.r-tabs__tab svg {
  width: 16px;
  height: 16px;
}

.r-tabs--sm .r-tabs__list {
  gap: 16px;
}
.r-tabs--sm .r-tabs__tab {
  height: var(--r-control-md);
  gap: 6px;
  font-size: var(--r-text-sm);
}
.r-tabs--sm .r-tabs__tab svg {
  width: 14px;
  height: 14px;
}

/* Counts are mono tags; the selected tab's count turns to ink. */
.r-tabs__count {
  display: inline-grid;
  place-items: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: var(--r-radius-mark);
  background: var(--r-bg-hover);
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-medium);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.04em;
  transition:
    background-color var(--r-duration-fast) var(--r-ease-out),
    color var(--r-duration-fast) var(--r-ease-out);
}
.r-tabs__tab.is-active .r-tabs__count {
  background: var(--r-ink);
  color: var(--r-on-ink);
}
.r-tabs__tab:disabled .r-tabs__count {
  color: var(--r-text-disabled);
}

/* A 2px ink rule under the selected tab, square at the ends, sitting on the list's rule. */
.r-tabs__indicator {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 2px;
  background: var(--r-ink);
  opacity: 0;
}
.r-tabs__indicator.is-visible {
  opacity: 1;
}
.r-tabs__indicator.is-animated {
  transition:
    transform var(--r-duration-base) var(--r-ease-out),
    width var(--r-duration-base) var(--r-ease-out);
}

.r-tabs__panel {
  padding-top: 16px;
}
.r-tabs__panel:focus-visible {
  outline-offset: 4px;
}
</style>
