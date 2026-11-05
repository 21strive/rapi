<script setup lang="ts">
/**
 * Search with its history. Most searches are repeats, so the last few sit one press away under an
 * empty field; typing narrows the results live, Enter keeps the query for next time, and any
 * recent one can be taken out.
 */
import { computed, ref, useId } from 'vue'
import { History, Search, X } from 'lucide-vue-next'
import { RInput } from '@/design-system'
import { num } from '../../kit'

interface Item {
  title: string
  sub?: string
  meta?: string
}

const props = withDefaults(
  defineProps<{
    eyebrow: string
    meta?: string
    placeholder: string
    /** Plural noun of what is searched: "shipments". */
    noun: string
    recent: string[]
    items: Item[]
    /** Titles in Geist Mono: ids, log lines. */
    mono?: boolean
    limit?: number
    /** Typed already when the tile opens, so the results show. */
    initial?: string
  }>(),
  { limit: 4 },
)

const uid = useId()
const query = ref<string | number | null>(props.initial ?? '')
const recents = ref([...props.recent])
const q = computed(() => String(query.value ?? '').trim())

const words = computed(() => q.value.toLowerCase().split(/\s+/).filter(Boolean))
const hits = computed(() =>
  props.items.filter((it) => {
    const hay = `${it.title} ${it.sub ?? ''} ${it.meta ?? ''}`.toLowerCase()
    return words.value.every((w) => hay.includes(w))
  }),
)

function run(text: string) {
  const t = text.trim()
  query.value = t
  if (!t) return
  recents.value = [t, ...recents.value.filter((r) => r.toLowerCase() !== t.toLowerCase())].slice(0, 5)
}

function forget(text: string) {
  recents.value = recents.value.filter((r) => r !== text)
}
</script>

<template>
  <div class="mk en-root rs">
    <div class="mk-row mk-between">
      <span class="r-eyebrow mk-truncate">{{ eyebrow }}</span>
      <span v-if="meta" class="en-meta">{{ meta }}</span>
    </div>

    <form class="rs__form" role="search" @submit.prevent="run(q)">
      <RInput
        v-model="query"
        type="search"
        clearable
        autocomplete="off"
        spellcheck="false"
        :placeholder="placeholder"
        :aria-label="`Search ${noun}`"
        :aria-describedby="`${uid}-count`"
      >
        <template #leading><Search /></template>
      </RInput>
    </form>

    <div v-if="!q" class="rs__recent mk-grow">
      <div class="mk-row mk-between rs__head">
        <span class="r-label">Recent</span>
        <button v-if="recents.length" type="button" class="en-link rs__clear" @click="recents = []">Clear</button>
      </div>
      <ul v-if="recents.length" class="rs__rows">
        <li v-for="r in recents" :key="r" class="rs__row">
          <button type="button" class="rs__again mk-reset" @click="run(r)">
            <History class="rs__icon" aria-hidden="true" />
            <span class="mk-truncate" :class="{ 'r-mono': mono }">{{ r }}</span>
          </button>
          <button type="button" class="rs__x mk-reset" :aria-label="`Remove ${r} from recent searches`" @click="forget(r)">
            <X aria-hidden="true" />
          </button>
        </li>
      </ul>
      <p v-else class="en-note rs__empty">No recent searches. What you search for next is kept here.</p>
    </div>

    <div v-else class="rs__results mk-grow">
      <p :id="`${uid}-count`" class="r-label rs__count" aria-live="polite">
        {{ num(hits.length) }} {{ hits.length === 1 ? noun.replace(/s$/, '') : noun }}
      </p>
      <ul class="rs__rows">
        <li v-for="h in hits.slice(0, limit)" :key="h.title" class="rs__hit">
          <span class="rs__text">
            <span class="rs__title mk-truncate" :class="{ 'r-mono': mono }">{{ h.title }}</span>
            <span v-if="h.sub" class="rs__sub mk-truncate">{{ h.sub }}</span>
          </span>
          <span v-if="h.meta" class="rs__meta">{{ h.meta }}</span>
        </li>
      </ul>
      <p v-if="!hits.length" class="en-note">Nothing matches every word. Take one out.</p>
      <p v-else-if="hits.length > limit" class="en-note rs__more">and {{ hits.length - limit }} more · Enter keeps this search</p>
    </div>
  </div>
</template>

<style scoped>
.rs__form {
  flex: none;
}

.rs__recent,
.rs__results {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-height: 0;
  overflow: hidden;
}

.rs__head {
  min-height: 18px;
}

.rs__clear {
  font-size: var(--r-text-2xs);
}

.rs__rows {
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--r-border-subtle);
}

.rs__row,
.rs__hit {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  border-bottom: 1px solid var(--r-border-subtle);
}

.rs__again {
  display: flex;
  flex: 1 1 auto;
  align-items: center;
  gap: 8px;
  min-width: 0;
  height: 30px;
  padding: 0 4px;
  color: var(--r-text-secondary);
  font-size: var(--r-text-sm);
  cursor: pointer;
}

.rs__again:hover {
  background: var(--r-bg-hover);
  color: var(--r-text);
}

.rs__again:focus-visible,
.rs__x:focus-visible {
  outline-offset: -2px;
}

.rs__icon {
  flex: none;
  width: 14px;
  height: 14px;
  color: var(--r-text-tertiary);
}

.rs__x {
  display: grid;
  flex: none;
  place-items: center;
  width: 24px;
  height: 24px;
  color: var(--r-text-tertiary);
  cursor: pointer;
}

.rs__x:hover {
  background: var(--r-bg-hover);
  color: var(--r-text);
}

.rs__x svg {
  width: 14px;
  height: 14px;
}

.rs__count {
  font-variant-numeric: tabular-nums;
}

.rs__hit {
  min-height: 34px;
  padding: 3px 0;
}

.rs__text {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-width: 0;
  line-height: 1.3;
}

.rs__title {
  font-size: var(--r-text-sm);
}

.rs__title.r-mono {
  font-size: var(--r-text-xs);
}

.rs__sub {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

.rs__meta {
  flex: none;
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.rs__empty,
.rs__more {
  padding-top: 4px;
}
</style>
