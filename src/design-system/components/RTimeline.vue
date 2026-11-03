<script setup lang="ts">
import type { TimelineItem } from '../types'

/** A vertical log: mono timestamp, square marker on a 1px rail, title, body. */
withDefaults(
  defineProps<{
    items: TimelineItem[]
    dense?: boolean
    /** Put the timestamp in a left column (default) or above the title. */
    timePosition?: 'left' | 'top'
  }>(),
  { timePosition: 'left' },
)
defineSlots<{ item?(props: { item: TimelineItem; index: number }): unknown }>()

/** Neutral (or no tone) draws a hollow marker; any other tone fills it with the lamp colour. */
const toneClass = (item: TimelineItem) => (item.tone && item.tone !== 'neutral' ? ['is-toned', `r-tone-${item.tone}`] : 'r-tone-neutral')
</script>

<template>
  <ol class="r-timeline" :class="[`r-timeline--time-${timePosition}`, { 'r-timeline--dense': dense }]" role="list">
    <li v-for="(item, index) in items" :key="item.id ?? index" class="r-timeline__item" :class="toneClass(item)">
      <span v-if="timePosition === 'left'" class="r-timeline__time">{{ item.time }}</span>
      <span class="r-timeline__rail" aria-hidden="true"><span class="r-timeline__marker" /></span>
      <div class="r-timeline__content">
        <span v-if="timePosition === 'top'" class="r-timeline__time">{{ item.time }}</span>
        <slot name="item" :item="item" :index="index">
          <div class="r-timeline__head">
            <p class="r-timeline__title">
              <component :is="item.icon" v-if="item.icon" class="r-timeline__icon" aria-hidden="true" />
              <span>{{ item.title }}</span>
            </p>
            <span v-if="item.meta" class="r-timeline__meta">{{ item.meta }}</span>
          </div>
          <p v-if="item.body" class="r-timeline__body">{{ item.body }}</p>
        </slot>
      </div>
    </li>
  </ol>
</template>

<style>
.r-timeline {
  /* Height of the first line, and where the 8px marker sits on it. */
  --r-tl-line: 20px;
  --r-tl-marker: 8px;
  --r-tl-marker-top: calc((var(--r-tl-line) - var(--r-tl-marker)) / 2);
  --r-tl-space: 20px;
  display: grid;
  grid-template-columns: max-content var(--r-tl-marker) minmax(0, 1fr);
  column-gap: 12px;
  min-width: 0;
  margin: 0;
  padding: 0;
  list-style: none;
}

.r-timeline--dense {
  --r-tl-line: 18px;
  --r-tl-space: 10px;
}

.r-timeline--time-top {
  --r-tl-marker-top: calc((16px - var(--r-tl-marker)) / 2);
  grid-template-columns: var(--r-tl-marker) minmax(0, 1fr);
}

/* Each entry is a row of the parent grid, so the time column is as wide as the longest time. */
.r-timeline__item {
  display: grid;
  grid-column: 1 / -1;
  grid-template-columns: subgrid;
  align-items: baseline;
  min-width: 0;
}

.r-timeline__time {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-variant-numeric: tabular-nums;
  line-height: var(--r-tl-line);
  letter-spacing: 0.02em;
  white-space: nowrap;
}
.r-timeline--time-top .r-timeline__time {
  display: block;
  margin-bottom: 2px;
  line-height: 16px;
}

/* ── The rail ──────────────────────────────────────────────────────────── */
.r-timeline__rail {
  position: relative;
  align-self: stretch;
  width: var(--r-tl-marker);
}

.r-timeline__rail::before,
.r-timeline__rail::after {
  position: absolute;
  left: calc(var(--r-tl-marker) / 2 - 0.5px);
  width: 1px;
  background: var(--r-border-strong);
  content: '';
}
.r-timeline__rail::before {
  top: 0;
  height: max(0px, calc(var(--r-tl-marker-top) - 3px));
}
.r-timeline__rail::after {
  top: calc(var(--r-tl-marker-top) + var(--r-tl-marker) + 3px);
  bottom: 0;
}
.r-timeline__item:first-child .r-timeline__rail::before,
.r-timeline__item:last-child .r-timeline__rail::after {
  display: none;
}

.r-timeline__marker {
  position: absolute;
  top: var(--r-tl-marker-top);
  left: 0;
  width: var(--r-tl-marker);
  height: var(--r-tl-marker);
  border: 1px solid var(--r-text-tertiary);
  border-radius: var(--r-radius-mark);
  background: var(--r-bg-surface);
}
.r-timeline__item.is-toned .r-timeline__marker {
  border-color: var(--tone-lamp);
  background: var(--tone-lamp);
}

/* ── Content ───────────────────────────────────────────────────────────── */
.r-timeline__content {
  min-width: 0;
  padding-bottom: var(--r-tl-space);
}
.r-timeline__item:last-child .r-timeline__content {
  padding-bottom: 0;
}

.r-timeline__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
}

.r-timeline__title {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  min-width: 0;
  color: var(--r-text);
  font-size: var(--r-text-md);
  font-weight: var(--r-weight-semibold);
  line-height: var(--r-tl-line);
  letter-spacing: var(--r-tracking-snug);
}
.r-timeline--dense .r-timeline__title {
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-medium);
}

.r-timeline__icon {
  flex: none;
  width: 14px;
  height: 14px;
  margin-top: calc((var(--r-tl-line) - 14px) / 2);
  color: var(--tone-text);
}
.r-timeline__item:not(.is-toned) .r-timeline__icon {
  color: var(--r-text-tertiary);
}

.r-timeline__meta {
  flex: none;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
  white-space: nowrap;
}

.r-timeline__body {
  margin-top: 2px;
  color: var(--r-text-secondary);
  font-size: var(--r-text-sm);
  line-height: 20px;
}
.r-timeline--dense .r-timeline__body {
  margin-top: 0;
  font-size: var(--r-text-xs);
  line-height: 18px;
}
</style>
