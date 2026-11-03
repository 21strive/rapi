<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ChevronLeft, ChevronRight, Download, Presentation, Rows3 } from 'lucide-vue-next'
import { RButton, RIconButton, RLogo, RNavItem, RSegmented, RSpecList, isEditable, useToast } from '@/design-system'
import type { SpecItem } from '@/design-system'
import BookSlide from './parts/BookSlide.vue'
import SlideBody from './parts/SlideBody.vue'

const toast = useToast()

const slides = [
  { id: 'cover', title: 'Cover' },
  { id: 'statement', title: 'The diagonal' },
  { id: 'logo', title: 'Logo on light and dark' },
  { id: 'construction', title: 'Construction' },
  { id: 'restrictions', title: 'Restrictions' },
  { id: 'palette', title: 'Brand palette' },
  { id: 'type', title: 'Typefaces' },
  { id: 'implementation', title: 'Implementation' },
  { id: 'collateral', title: 'Collateral examples' },
  { id: 'rapi', title: 'Rapi, the design language' },
]
const pad = (n: number) => String(n).padStart(2, '0')

const view = ref<'scroll' | 'present'>('scroll')
const viewOptions = [
  { label: 'All slides', value: 'scroll', icon: Rows3 },
  { label: 'Present', value: 'present', icon: Presentation },
]
const current = ref(0)

const docSpec: SpecItem[] = [
  { label: 'Owner', value: 'Brand, 21 Strive' },
  { label: 'Edition', value: '2 · Nov 2026', mono: true },
  { label: 'First edition', value: 'Mar 2025', mono: true },
  { label: 'Geometry', value: 'brand/marks.ts', mono: true },
]

/* ── Scroll view: the index follows the slide in view ────────────────────────────── */
let observer: IntersectionObserver | undefined
function watchSlides() {
  observer?.disconnect()
  if (view.value !== 'scroll') return
  observer = new IntersectionObserver(
    (entries) => {
      const seen = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
      if (!seen.length) return
      const i = slides.findIndex((s, k) => seen[0].target.id === `slide-${pad(k + 1)}` && s)
      if (i >= 0) current.value = i
    },
    { rootMargin: '-30% 0px -60% 0px' },
  )
  slides.forEach((_, k) => {
    const el = document.getElementById(`slide-${pad(k + 1)}`)
    if (el) observer!.observe(el)
  })
}

function go(i: number) {
  const next = Math.min(slides.length - 1, Math.max(0, i))
  current.value = next
  if (view.value === 'scroll') {
    document.getElementById(`slide-${pad(next + 1)}`)?.scrollIntoView({ block: 'start' })
  }
}

/* ── Present view: one slide, as large as the window allows ──────────────────────── */
const viewport = ref(900)
const presentHeight = computed(() => Math.max(240, viewport.value - 56 - 64 - 72))
const onResize = () => (viewport.value = window.innerHeight)

watch(view, async () => {
  await nextTick()
  watchSlides()
  if (view.value === 'scroll') go(current.value)
  else window.scrollTo({ top: 0 })
})

function onKeydown(event: KeyboardEvent) {
  if (event.metaKey || event.ctrlKey || event.altKey || isEditable(event.target)) return
  if ((event.target as HTMLElement | null)?.closest('[role="radiogroup"], [role="slider"], [role="tablist"]')) return
  const keys: Record<string, number> = { ArrowRight: 1, PageDown: 1, ArrowLeft: -1, PageUp: -1 }
  if (event.key in keys) {
    event.preventDefault()
    go(current.value + keys[event.key])
  } else if (event.key === 'Home') {
    event.preventDefault()
    go(0)
  } else if (event.key === 'End') {
    event.preventDefault()
    go(slides.length - 1)
  }
}

function download() {
  toast.show({
    title: 'PDF exported',
    body: `21-strive-logo-and-branding-ed2.pdf · ${slides.length} slides · 1920 × 1080`,
  })
}

onMounted(() => {
  onResize()
  window.addEventListener('resize', onResize)
  window.addEventListener('keydown', onKeydown)
  watchSlides()
})
onBeforeUnmount(() => {
  observer?.disconnect()
  window.removeEventListener('resize', onResize)
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div class="s-bb">
    <header class="s-bb-top">
      <div class="s-bb-top__start">
        <RLogo brand="21strive" variant="lockup" :size="15" label="21 Strive" />
        <span class="s-bb-top__sep" aria-hidden="true" />
        <div class="s-bb-top__titles">
          <p class="s-bb-top__eyebrow">Brand guidelines · Edition 2</p>
          <h1 class="s-bb-top__title">Logo &amp; branding</h1>
        </div>
      </div>
      <div class="s-bb-top__end">
        <span class="s-bb-top__count">{{ pad(current + 1) }} / {{ pad(slides.length) }}</span>
        <RSegmented v-model="view" :options="viewOptions" size="sm" icon-only label="View" />
        <RButton variant="outline" size="sm" @click="download">
          <template #leading><Download /></template>
          <span class="s-bb-hide-sm">Download PDF</span>
          <span class="s-bb-show-sm">PDF</span>
        </RButton>
      </div>
    </header>

    <div class="s-bb-body">
      <nav class="s-bb-index" aria-label="Slides">
        <p class="s-bb-index__head"><span class="r-index">{{ pad(slides.length) }}</span><span class="r-eyebrow">Contents</span></p>
        <ol class="s-bb-index__list">
          <li v-for="(s, i) in slides" :key="s.id">
            <RNavItem as="button" type="button" :label="s.title" :active="i === current" @click="go(i)">
              <template #trailing><span class="s-bb-index__num">{{ pad(i + 1) }}</span></template>
            </RNavItem>
          </li>
        </ol>
        <div class="s-bb-index__meta">
          <RSpecList :items="docSpec" dense />
          <p class="s-bb-index__hint">Arrow keys move between slides.</p>
        </div>
      </nav>

      <main class="s-bb-main">
        <div v-if="view === 'scroll'" class="s-bb-stack">
          <BookSlide v-for="(s, i) in slides" :key="s.id" :index="pad(i + 1)" :title="s.title" :total="slides.length">
            <SlideBody :id="s.id" />
          </BookSlide>
        </div>
        <div v-else class="s-bb-present">
          <BookSlide :index="pad(current + 1)" :title="slides[current].title" :total="slides.length" :max-height="presentHeight">
            <SlideBody :id="slides[current].id" />
          </BookSlide>
          <div class="s-bb-pager">
            <RIconButton label="Previous slide" :disabled="current === 0" @click="go(current - 1)"><ChevronLeft /></RIconButton>
            <span class="s-bb-pager__count" aria-live="polite">{{ pad(current + 1) }} / {{ pad(slides.length) }} · {{ slides[current].title }}</span>
            <RIconButton label="Next slide" :disabled="current === slides.length - 1" @click="go(current + 1)"><ChevronRight /></RIconButton>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.s-bb {
  min-height: 100dvh;
  background: var(--r-bg-canvas);
  color: var(--r-text);
}

/* ── Top bar ──────────────────────────────────────────────────────────────── */
.s-bb-top {
  position: sticky;
  top: 0;
  z-index: var(--r-z-sticky);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  height: 56px;
  padding: 0 24px;
  border-bottom: 1px solid var(--r-border);
  background: var(--r-bg-surface);
}
.s-bb-top__start,
.s-bb-top__end {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
}
.s-bb-top__sep {
  width: 1px;
  height: 24px;
  background: var(--r-border);
}
.s-bb-top__titles {
  min-width: 0;
}
.s-bb-top__eyebrow {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-caps);
  line-height: 1.4;
  text-transform: uppercase;
  white-space: nowrap;
}
.s-bb-top__title {
  overflow: hidden;
  font-size: var(--r-text-md);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-snug);
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.s-bb-top__count {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.s-bb-show-sm {
  display: none;
}

/* ── Body ─────────────────────────────────────────────────────────────────── */
.s-bb-body {
  display: grid;
  grid-template-columns: 248px minmax(0, 1fr);
}

.s-bb-index {
  position: sticky;
  top: 56px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: calc(100dvh - 56px);
  padding: 20px 12px;
  overflow-y: auto;
  border-right: 1px solid var(--r-border);
  background: var(--r-bg-surface);
}
.s-bb-index__head {
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding: 0 10px;
}
.s-bb-index__head .r-eyebrow {
  color: var(--r-text-secondary);
}
.s-bb-index__list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.s-bb-index__list :deep(.r-nav-item) {
  width: 100%;
}
.s-bb-index__num {
  margin-left: auto;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-variant-numeric: tabular-nums;
}
.s-bb-index__meta {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: auto;
  padding: 12px 10px 0;
  border-top: 1px solid var(--r-border);
}
.s-bb-index__hint {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

.s-bb-main {
  min-width: 0;
  padding: 32px 40px 96px;
}
.s-bb-stack {
  display: flex;
  flex-direction: column;
  gap: 40px;
  max-width: 1200px;
  margin: 0 auto;
}
.s-bb-present {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.s-bb-pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
}
.s-bb-pager__count {
  min-width: 260px;
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
  text-align: center;
  font-variant-numeric: tabular-nums;
}

@media (max-width: 1023px) {
  .s-bb-body {
    grid-template-columns: minmax(0, 1fr);
  }
  .s-bb-index {
    display: none;
  }
  .s-bb-main {
    padding: 24px 16px 96px;
  }
}

@media (max-width: 640px) {
  .s-bb-top {
    padding: 0 16px;
  }
  .s-bb-top__sep,
  .s-bb-top__count,
  .s-bb-top :deep(.r-logo) {
    display: none;
  }
  .s-bb-hide-sm {
    display: none;
  }
  .s-bb-show-sm {
    display: inline;
  }
  .s-bb-stack {
    gap: 28px;
  }
  .s-bb-pager__count {
    min-width: 0;
  }
}
</style>
