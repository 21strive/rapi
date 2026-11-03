<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

/** Current page, starting at 1. */
const page = defineModel<number>({ default: 1 })

const props = withDefaults(
  defineProps<{
    pageCount: number
    /** Pages shown on each side of the current one. */
    siblings?: number
    /** sm 24px · md 28px square buttons. */
    size?: 'sm' | 'md'
    label?: string
  }>(),
  { siblings: 1, size: 'md', label: 'Pagination' },
)

type Item = number | 'gap-start' | 'gap-end'

/* On a narrow screen the row drops siblings (down to 0) rather than overflow its container. */
const root = ref<HTMLElement | null>(null)
const room = ref(Infinity)
let observer: ResizeObserver | undefined
onMounted(() => {
  const parent = root.value?.parentElement
  if (!parent) return
  observer = new ResizeObserver(([entry]) => (room.value = entry.contentRect.width))
  observer.observe(parent)
})
onBeforeUnmount(() => observer?.disconnect())

const siblings = computed(() => {
  // Button width plus the 2px gap between pages.
  const button = props.size === 'sm' ? 26 : 30
  for (let s = props.siblings; s > 0; s--) {
    // first + last + current + 2 gaps + 2s siblings, plus the two step buttons
    if ((2 * s + 5 + 2) * button <= room.value) return s
  }
  return 0
})

const range = (from: number, to: number) => Array.from({ length: Math.max(0, to - from + 1) }, (_, i) => from + i)

const items = computed<Item[]>(() => {
  const total = Math.max(1, props.pageCount)
  const current = Math.min(Math.max(1, page.value), total)
  const s = siblings.value
  if (total <= s * 2 + 5) return range(1, total)
  const left = Math.max(current - s, 1)
  const right = Math.min(current + s, total)
  const gapStart = left > 3
  const gapEnd = right < total - 2
  if (!gapStart) return [...range(1, 3 + s * 2), 'gap-end', total]
  if (!gapEnd) return [1, 'gap-start', ...range(total - (2 + s * 2), total)]
  return [1, 'gap-start', ...range(left, right), 'gap-end', total]
})

function go(to: number) {
  page.value = Math.min(Math.max(1, to), Math.max(1, props.pageCount))
}
</script>

<template>
  <nav ref="root" class="r-pagination" :class="`r-pagination--${size}`" :aria-label="label">
    <button type="button" class="r-pagination__step" :disabled="page <= 1" aria-label="Previous page" @click="go(page - 1)">
      <ChevronLeft />
    </button>
    <ul class="r-pagination__pages">
      <li v-for="item in items" :key="item">
        <span v-if="typeof item === 'string'" class="r-pagination__gap" aria-hidden="true">…</span>
        <button
          v-else
          type="button"
          class="r-pagination__page"
          :class="{ 'is-current': item === page }"
          :aria-current="item === page ? 'page' : undefined"
          :aria-label="`Page ${item}`"
          @click="go(item)"
        >
          {{ item }}
        </button>
      </li>
    </ul>
    <button type="button" class="r-pagination__step" :disabled="page >= pageCount" aria-label="Next page" @click="go(page + 1)">
      <ChevronRight />
    </button>
  </nav>
</template>

<style>
.r-pagination {
  --r-page-size: var(--r-control-sm);
  display: inline-flex;
  align-items: center;
  gap: 4px;
  max-width: 100%;
}

.r-pagination--sm {
  --r-page-size: var(--r-control-xs);
}

.r-pagination__pages {
  display: flex;
  align-items: center;
  gap: 2px;
}

/* Square keys with mono figures. The current page is filled with ink. */
.r-pagination__page,
.r-pagination__step {
  display: inline-grid;
  place-items: center;
  min-width: var(--r-page-size);
  height: var(--r-page-size);
  padding: 0 6px;
  border: 1px solid transparent;
  border-radius: var(--r-radius-control);
  background: none;
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
  font-weight: var(--r-weight-medium);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0;
  cursor: pointer;
  transition:
    background-color var(--r-duration-fast) var(--r-ease-out),
    border-color var(--r-duration-fast) var(--r-ease-out),
    color var(--r-duration-fast) var(--r-ease-out);
}

.r-pagination--sm .r-pagination__page,
.r-pagination--sm .r-pagination__step {
  padding: 0 4px;
  font-size: var(--r-text-2xs);
}

/* Keys sit 2px apart, so the focus ring hugs the key instead of covering its neighbour. */
.r-pagination__page:focus-visible,
.r-pagination__step:focus-visible {
  outline-offset: 0;
}

.r-pagination__page:hover:not(.is-current) {
  background: var(--r-bg-hover);
  color: var(--r-text);
}

.r-pagination__page.is-current {
  border-color: var(--r-ink);
  background: var(--r-ink);
  color: var(--r-on-ink);
}

.r-pagination__step {
  padding: 0;
  border-color: var(--r-border-strong);
  color: var(--r-text);
}
.r-pagination__step:hover:not(:disabled) {
  border-color: var(--r-text-tertiary);
  background: var(--r-bg-hover);
}
.r-pagination__step:disabled {
  border-color: var(--r-border);
  color: var(--r-text-disabled);
  cursor: not-allowed;
}
.r-pagination__step svg {
  width: 16px;
  height: 16px;
}
.r-pagination--sm .r-pagination__step svg {
  width: 14px;
  height: 14px;
}

.r-pagination__gap {
  display: inline-grid;
  place-items: center;
  min-width: calc(var(--r-page-size) - 8px);
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
}
</style>
