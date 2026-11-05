<script setup lang="ts">
/**
 * "What changed since yesterday" in four lines instead of a dashboard to scan. Each line opens
 * to say why, in one sentence; the period key moves the starting point.
 */
import { computed, ref, watch } from 'vue'
import { ArrowDownRight, ArrowLeft, ArrowUpRight, Plus, Minus } from 'lucide-vue-next'
import { RSegmented } from '@/design-system'

interface Item {
  kind: 'up' | 'down' | 'new' | 'note'
  /** Good or bad for this reader; colours the mark, never alone (the figure has its sign). */
  tone?: 'good' | 'bad'
  text: string
  figure?: string
  detail: string
}

interface Period {
  id: string
  label: string
  /** "Since yesterday, 17:00". */
  since: string
  items: Item[]
}

const props = withDefaults(
  defineProps<{
    periods: Period[]
    agent?: string
    /** Open the first line when the tile opens, so its reason shows before any press. */
    openFirst?: boolean
    /** Small strips: an opened line replaces the list. */
    compact?: boolean
  }>(),
  { agent: 'Simpul', openFirst: true },
)

const period = ref(props.periods[0].id)
const first = props.compact || !props.openFirst ? null : 0
const open = ref<number | null>(first)
const current = computed(() => props.periods.find((p) => p.id === period.value) ?? props.periods[0])
const options = computed(() => props.periods.map((p) => ({ label: p.label, value: p.id })))
watch(period, () => (open.value = first))

const icons = { up: ArrowUpRight, down: ArrowDownRight, new: Plus, note: Minus }
</script>

<template>
  <div class="mk digest" :class="{ 'digest--compact': compact }">
    <div class="digest__head">
      <span class="r-label mk-truncate">{{ current.since }}</span>
      <RSegmented v-model="period" :options="options" size="sm" label="Since when" />
    </div>

    <div v-if="compact && open != null" class="digest__one mk-grow" aria-live="polite">
      <p class="digest__text">{{ current.items[open].text }} <span class="digest__fig">{{ current.items[open].figure }}</span></p>
      <p class="digest__detail">{{ current.items[open].detail }}</p>
      <button type="button" class="digest__back mk-reset" @click="open = null">
        <ArrowLeft :size="12" aria-hidden="true" />All {{ current.items.length }} changes
      </button>
    </div>

    <ul v-else class="digest__list mk-grow">
      <li v-for="(item, i) in current.items" :key="item.text" class="digest__item">
        <button
          type="button"
          class="digest__row mk-reset"
          :aria-expanded="open === i"
          @click="open = open === i ? null : i"
        >
          <component :is="icons[item.kind]" :size="14" class="digest__mark" :class="item.tone ? `is-${item.tone}` : ''" aria-hidden="true" />
          <span class="digest__text">{{ item.text }}</span>
          <span v-if="item.figure" class="digest__fig" :class="item.tone ? `is-${item.tone}` : ''">{{ item.figure }}</span>
        </button>
        <p v-if="open === i && !compact" class="digest__detail">{{ item.detail }}</p>
      </li>
    </ul>

    <p class="digest__by">{{ current.items.length }} changes · {{ agent }}</p>
  </div>
</template>

<style scoped>
.digest {
  container-type: inline-size;
  gap: 8px;
}

.digest__head {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
}

.digest__list {
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  overflow: hidden;
  border-top: 1px solid var(--r-border-subtle);
  list-style: none;
}

.digest__item {
  border-bottom: 1px solid var(--r-border-subtle);
}

.digest__row {
  display: grid;
  grid-template-columns: 14px minmax(0, 1fr) auto;
  gap: 8px;
  align-items: start;
  width: 100%;
  padding: 6px 0;
  font-size: var(--r-text-xs);
  line-height: 16px;
  cursor: pointer;
}

.digest__row:hover .digest__text {
  color: var(--r-brand-text);
}

.digest__mark {
  margin-top: 1px;
  color: var(--r-text-tertiary);
}

.digest__mark.is-good,
.digest__fig.is-good {
  color: var(--r-success-text);
}

.digest__mark.is-bad,
.digest__fig.is-bad {
  color: var(--r-danger-text);
}

.digest__text {
  min-width: 0;
}

.digest__fig {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.digest__detail {
  margin: 0 0 6px 22px;
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  line-height: 1.4;
}

.digest__one {
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow: hidden;
}

.digest__one .digest__detail {
  margin: 0;
}

.digest__one .digest__text {
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-medium);
}

.digest__back {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  gap: 4px;
  margin-top: auto;
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  cursor: pointer;
}

.digest__by {
  flex: none;
  overflow: hidden;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.digest--compact .digest__by {
  display: none;
}

.digest--compact .digest__row {
  padding: 4px 0;
}

.digest--compact .digest__text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Narrow column: the period key under the date, the figure under the line. */
@container (max-width: 260px) {
  .digest__head {
    flex-direction: column;
    align-items: stretch;
  }
  .digest__row {
    grid-template-columns: 14px minmax(0, 1fr);
  }
  .digest__fig {
    grid-column: 2;
  }
}
</style>
