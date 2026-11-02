<script setup lang="ts">
import { computed } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

/** Current page, starting at 1. */
const page = defineModel<number>({ default: 1 })

const props = withDefaults(
  defineProps<{
    pageCount: number
    /** Pages shown on each side of the current one. */
    siblings?: number
    size?: 'sm' | 'md'
    label?: string
  }>(),
  { siblings: 1, size: 'md', label: 'Pagination' },
)

type Item = number | 'gap-start' | 'gap-end'

const range = (from: number, to: number) => Array.from({ length: Math.max(0, to - from + 1) }, (_, i) => from + i)

const items = computed<Item[]>(() => {
  const total = Math.max(1, props.pageCount)
  const current = Math.min(Math.max(1, page.value), total)
  const s = props.siblings
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
  <nav class="r-pagination" :class="`r-pagination--${size}`" :aria-label="label">
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
  --r-page-size: 36px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 100%;
}

.r-pagination--sm {
  --r-page-size: 30px;
}

@media (max-width: 480px) {
  .r-pagination {
    --r-page-size: 32px;
    gap: 2px;
  }
}

.r-pagination__pages {
  display: flex;
  align-items: center;
  gap: 2px;
}

.r-pagination__page,
.r-pagination__step {
  display: inline-grid;
  place-items: center;
  min-width: var(--r-page-size);
  height: var(--r-page-size);
  padding: 0 6px;
  border: 1px solid transparent;
  border-radius: var(--r-radius-md);
  background: none;
  color: var(--r-text-secondary);
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-medium);
  font-variant-numeric: tabular-nums;
  cursor: pointer;
  transition:
    background-color var(--r-duration-fast) var(--r-ease-out),
    color var(--r-duration-fast) var(--r-ease-out);
}

.r-pagination--sm .r-pagination__page,
.r-pagination--sm .r-pagination__step {
  border-radius: var(--r-radius-sm);
  font-size: var(--r-text-xs);
}

.r-pagination__page:hover:not(.is-current) {
  background: var(--r-bg-hover);
  color: var(--r-text);
}

.r-pagination__page.is-current {
  background: var(--r-ink);
  box-shadow: var(--r-shadow-highlight);
  color: var(--r-on-ink);
}

.r-pagination__step {
  border-color: var(--r-border);
  background: var(--r-bg-surface);
  color: var(--r-text);
}
.r-pagination__step:hover:not(:disabled) {
  background: var(--r-bg-hover);
}
.r-pagination__step:disabled {
  cursor: not-allowed;
  opacity: 0.4;
}
.r-pagination__step svg {
  width: 16px;
  height: 16px;
}

.r-pagination__gap {
  display: inline-grid;
  place-items: center;
  min-width: calc(var(--r-page-size) - 8px);
  color: var(--r-text-tertiary);
}
</style>
