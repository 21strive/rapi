<script setup lang="ts">
/**
 * What comes next, and how soon: one item, the minutes to it, and the one thing to do about it.
 * The arrows page through the rest of the day; the action records when it was done and can be
 * taken back.
 */
import { computed, ref } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { RButton, RIconButton, RStatus } from '@/design-system'
import { pad, timeZ, useNow, type Zone } from '../../kit'

interface Item {
  title: string
  /** "14:15–14:30 WIB". */
  when: string
  /** Minutes until it starts, when the tile opens. */
  inMin: number
  where?: string
  detail?: string
  /** A figure that is the point of the item: "Rp 37.415.000". */
  figure?: string
}

const props = withDefaults(
  defineProps<{
    /** "Next meeting", "Manggarai → Bogor". */
    kind: string
    items: Item[]
    /** The one action: "Join", "Mark given". */
    action?: string
    /** Its result as a status word: "Joined", "Given". */
    done?: string
    /** The minutes are the figure: departure boards. */
    minutes?: boolean
    pixel?: boolean
    zone?: Zone
  }>(),
  { minutes: false, pixel: false, zone: 'WIB' },
)

const at = ref(0)
const item = computed(() => props.items[at.value] ?? props.items[0])
/* Minutes run down from when the tile opened, measured by the clock, not by ticks seen. */
const opened = Date.now()
const now = useNow(30000)
const left = computed(() => Math.max(0, item.value.inMin - Math.floor((now.value.getTime() - opened) / 60000)))
const soon = computed(() => {
  const m = left.value
  if (m <= 0) return 'now'
  if (m < 60) return `in ${m} min`
  if (m < 1440) return `in ${Math.floor(m / 60)} h ${pad(m % 60)} min`
  const days = Math.floor(m / 1440)
  return `in ${days} ${days === 1 ? 'day' : 'days'}`
})

const doneAt = ref<Record<number, Date>>({})
const isDone = computed(() => doneAt.value[at.value])
function act() {
  doneAt.value = { ...doneAt.value, [at.value]: new Date() }
}
function undo() {
  const next = { ...doneAt.value }
  delete next[at.value]
  doneAt.value = next
}
function page(step: number) {
  const n = props.items.length
  at.value = (at.value + step + n) % n
}
</script>

<template>
  <div class="mk next" :class="{ 'next--minutes': minutes }">
    <div class="mk-row mk-between">
      <span class="r-label mk-truncate">{{ kind }}<span v-if="!minutes" class="next__soon"> · {{ soon }}</span></span>
      <span v-if="items.length > 1" class="next__pager">
        <RIconButton label="Previous" size="xs" variant="ghost" @click="page(-1)"><ChevronLeft /></RIconButton>
        <span class="next__count" aria-hidden="true">{{ at + 1 }}/{{ items.length }}</span>
        <RIconButton label="Next" size="xs" variant="ghost" @click="page(1)"><ChevronRight /></RIconButton>
      </span>
    </div>

    <div class="next__body" aria-live="polite">
      <p v-if="minutes" class="next__mins" :class="{ 'is-pixel': pixel }">
        <span class="next__mins-fig">{{ left }}</span>
        <span class="mk-unit">min</span>
      </p>
      <p v-else-if="item.figure" class="next__figure mk-fig">{{ item.figure }}</p>
      <p class="next__title mk-truncate" :class="{ 'is-small': item.figure }">{{ item.title }}</p>
      <p class="next__when mk-truncate">{{ item.when }}<template v-if="item.where"> · {{ item.where }}</template></p>
      <p v-if="item.detail" class="next__detail mk-truncate">{{ item.detail }}</p>
    </div>

    <div v-if="action" class="next__foot mk-end">
      <template v-if="isDone">
        <RStatus size="sm" tone="success" :label="`${done ?? 'Done'} ${timeZ(isDone, zone)}`" />
        <RButton size="sm" variant="ghost" @click="undo">Undo</RButton>
      </template>
      <RButton v-else size="sm" tone="brand" @click="act">{{ action }}</RButton>
    </div>
  </div>
</template>

<style scoped>
.next {
  gap: 6px;
}

.next__pager {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 2px;
  margin: -4px -6px -4px 0;
}

.next {
  container-type: inline-size;
}

@container (max-width: 200px) {
  .next__count,
  .next__soon {
    display: none;
  }
}

.next__count {
  min-width: 26px;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-variant-numeric: tabular-nums;
  text-align: center;
}

.next__body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.next__mins {
  display: flex;
  align-items: baseline;
  gap: 4px;
  line-height: 1;
}

.next__mins-fig {
  font-size: var(--r-text-4xl);
  font-weight: var(--r-weight-semibold);
  font-variant-numeric: tabular-nums;
  letter-spacing: var(--r-tracking-tighter);
}

.next__mins.is-pixel .next__mins-fig {
  font-family: var(--r-font-pixel);
  font-weight: var(--r-weight-regular);
  letter-spacing: 0;
}

.next__figure {
  overflow: hidden;
  font-size: var(--r-text-xl);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.next__title {
  font-size: var(--r-text-lg);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-snug);
  line-height: 1.3;
}

.next__title.is-small {
  font-size: var(--r-text-sm);
}

.next--minutes .next__title {
  margin-top: 4px;
  font-size: var(--r-text-md);
}

.next__when {
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
}

.next__detail {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

.next__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
}
</style>
