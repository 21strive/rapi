<script setup lang="ts">
/**
 * One cell of the board: a running number and a name in mono caps, then the specimen. The
 * specimen mounts shortly before the tile scrolls into view and stays mounted, so whatever the
 * reader did to it is still there when they scroll back. A specimen that throws shows its error
 * in its own tile and leaves the rest of the board alone.
 */
import { computed, onBeforeUnmount, onErrorCaptured, onMounted, provide, ref } from 'vue'
import { tileVisibleKey } from '../kit/live'
import type { BoardEntry } from '../types'
import { spanOf } from './layout'
import { scheduleMount } from './mounter'
import { inViewport, nearViewport } from './observer'

const props = defineProps<{
  entry: BoardEntry
  /** Columns on the board right now; wider tiles are clamped to it. */
  cols: number
  /** Mount the specimen straight away (screenshots, `?all=1`). */
  eager?: boolean
  /** Shown at the right of the caption on the mixed board. */
  jobName?: string
}>()

const el = ref<HTMLElement | null>(null)
const mounted = ref(!!props.eager)
const visible = ref(false)
const error = ref<string | null>(null)
provide(tileVisibleKey, visible)

const surface = computed(() => props.entry.surface ?? 'surface')
const span = computed(() => {
  const { c, r } = spanOf(props.entry.size)
  return { c: Math.min(c, props.cols), r }
})

/* Mounts go through a shared queue that runs a few per frame, tiles on screen first. */
const mount = () => {
  mounted.value = true
}

onMounted(() => {
  const node = el.value
  if (!node) return
  if (!mounted.value)
    nearViewport.observe(node, (inside) => {
      if (!inside) return
      scheduleMount(mount)
      nearViewport.unobserve(node)
    })
  inViewport.observe(node, (inside) => {
    visible.value = inside
    if (inside && !mounted.value) scheduleMount(mount, true)
  })
})

onBeforeUnmount(() => {
  if (!el.value) return
  nearViewport.unobserve(el.value)
  inViewport.unobserve(el.value)
})

onErrorCaptured((err) => {
  error.value = err instanceof Error ? err.message : String(err)
  console.error(`[moodboard] ${props.entry.id}`, err)
  return false
})
</script>

<template>
  <div
    ref="el"
    class="mood-tile"
    :class="[`mood-tile--${surface}`, { 'r-card--brand': surface === 'brand', 'r-card--signal': surface === 'signal' }]"
    :style="{ gridColumn: `span ${span.c}`, gridRow: `span ${span.r}` }"
    :data-theme="surface === 'dark' ? 'dark' : undefined"
    :data-mood="entry.id"
    role="group"
    :aria-label="`${entry.index} ${entry.name}`"
  >
    <p class="mood-tile__head" aria-hidden="true">
      <span class="mood-tile__index">{{ entry.index }}</span>
      <span class="mood-tile__name">{{ entry.name }}</span>
      <span v-if="jobName" class="mood-tile__job">{{ jobName }}</span>
    </p>
    <p class="r-sr-only">{{ entry.why }} {{ entry.hint }}.</p>
    <div class="mood-tile__body">
      <p v-if="error" class="mood-tile__error">{{ entry.id }}: {{ error }}</p>
      <component :is="entry.is" v-else-if="mounted" v-bind="entry.props" />
    </div>
  </div>
</template>

<style>
.mood-tile {
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: clip;
  border-right: 1px solid var(--r-border);
  border-bottom: 1px solid var(--r-border);
  background: var(--r-bg-surface);
  color: var(--r-text);
  content-visibility: auto;
}

/* Charts draw their 2px gaps and point rings in the chart surface, so it follows the panel. */
.mood-tile--muted {
  --r-chart-surface: var(--r-bg-muted);
  background: var(--r-bg-muted);
}

/* A dark island. On a dark page it drops to the ink panel so the rhythm survives the theme. */
.mood-tile--dark {
  background: var(--r-bg-surface);
}
html[data-theme='dark'] .mood-tile--dark {
  --r-bg-surface: var(--r-feature-ink);
  --r-chart-surface: var(--r-feature-ink);
  --r-focus-ring: 0 0 0 1px var(--r-feature-ink), 0 0 0 3px var(--r-focus);
  background: var(--r-feature-ink);
}

/* Brand and signal tiles take their tokens from RCard's loud panels (r-card--brand,
   r-card--signal), which re-point the surface; their own rules are the panel colour, so the block
   butts against its neighbours like a solid swatch. */
.mood-tile.r-card--brand {
  border-color: var(--r-feature-brand);
}
.mood-tile.r-card--signal {
  border-color: var(--r-signal);
}

/* Registration marks on the corners of the tile under the pointer or the focus. */
.mood-tile::after {
  content: '';
  position: absolute;
  z-index: 3;
  inset: 0;
  pointer-events: none;
  opacity: 0;
  --m: 9px;
  --c: var(--r-text);
  background:
    linear-gradient(var(--c), var(--c)) left top / var(--m) 1px,
    linear-gradient(var(--c), var(--c)) left top / 1px var(--m),
    linear-gradient(var(--c), var(--c)) right top / var(--m) 1px,
    linear-gradient(var(--c), var(--c)) right top / 1px var(--m),
    linear-gradient(var(--c), var(--c)) left bottom / var(--m) 1px,
    linear-gradient(var(--c), var(--c)) left bottom / 1px var(--m),
    linear-gradient(var(--c), var(--c)) right bottom / var(--m) 1px,
    linear-gradient(var(--c), var(--c)) right bottom / 1px var(--m);
  background-repeat: no-repeat;
  transition: opacity var(--r-duration-fast) var(--r-ease-out);
}
.mood-tile:hover::after,
.mood-tile:focus-within::after {
  opacity: 1;
}

.mood-tile__head {
  display: flex;
  flex: none;
  align-items: baseline;
  gap: 8px;
  height: 28px;
  margin: 0;
  padding: 9px 12px 0;
  overflow: hidden;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-medium);
  line-height: 1.4;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  white-space: nowrap;
}

.mood-tile__index {
  flex: none;
  font-variant-numeric: tabular-nums;
}

.mood-tile__name {
  flex: 0 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color var(--r-duration-fast) var(--r-ease-out);
}
.mood-tile:hover .mood-tile__name,
.mood-tile:focus-within .mood-tile__name {
  color: var(--r-text);
}

.mood-tile__job {
  flex: none;
  margin-left: auto;
}

.mood-tile__body {
  position: relative;
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}

.mood-tile__body > * {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
}

.mood-tile__error {
  margin: 0;
  padding: 4px 12px 12px;
  color: var(--r-danger-text);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  overflow-wrap: anywhere;
}
</style>
