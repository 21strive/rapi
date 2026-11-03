<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { Columns2, Download, Printer, Rows3 } from 'lucide-vue-next'
import { RButton, RLogo, RSegmented, useElementSize, useToast } from '@/design-system'
import A4Page from './parts/A4Page.vue'
import PageBody from './parts/PageBody.vue'
import { report } from './data'

const toast = useToast()

const pages = [
  { n: 1, section: '', title: 'Cover', bare: true },
  { n: 2, section: 'Contents', title: 'Contents' },
  { n: 3, section: 'Letter from the founder', title: 'Letter from the founder' },
  { n: 4, section: 'The year in figures', title: 'Key figures' },
  { n: 5, section: 'Financial review', title: 'Financial review' },
  { n: 6, section: 'Results by segment', title: 'Results by segment' },
]
const pad = (n: number) => String(n).padStart(2, '0')

const view = ref<'spreads' | 'pages'>('spreads')
const viewOptions = [
  { label: 'Spreads', value: 'spreads', icon: Columns2 },
  { label: 'Single pages', value: 'pages', icon: Rows3 },
]

const spreads = computed(() => {
  const out: (typeof pages)[] = []
  for (let i = 0; i < pages.length; i += 2) out.push(pages.slice(i, i + 2))
  return out
})

/* Pages scale to the room they have: a spread fits the window's height, a single page its width. */
const main = ref<HTMLElement | null>(null)
const { width } = useElementSize(main)
const viewport = ref(900)
const onResize = () => (viewport.value = window.innerHeight)
const twoUp = computed(() => view.value === 'spreads' && width.value >= 720)
const scale = computed(() => {
  const w = width.value || 1200
  if (twoUp.value) return Math.min(1, (w - 24) / 2 / 796, (viewport.value - 56 - 104) / 1125)
  return Math.min(1, w / 796)
})

function download() {
  toast.show({ title: 'PDF exported', body: `21-strive-annual-report-${report.year}.pdf · ${pages.length} pages · A4` })
}
function print() {
  toast.show({ title: 'Sent to print preview', body: 'A4 portrait, no margins added: the pages carry their own.', duration: 3000 })
}

onMounted(() => {
  onResize()
  window.addEventListener('resize', onResize)
})
onBeforeUnmount(() => window.removeEventListener('resize', onResize))
</script>

<template>
  <div class="s-ar">
    <header class="s-ar-top">
      <div class="s-ar-top__start">
        <RLogo brand="21strive" variant="mark" :size="15" label="21 Strive" />
        <span class="s-ar-top__sep" aria-hidden="true" />
        <div class="s-ar-top__titles">
          <p class="s-ar-top__eyebrow">Investor relations · {{ report.published }}</p>
          <h1 class="s-ar-top__title">{{ report.title }}</h1>
        </div>
      </div>
      <div class="s-ar-top__end">
        <span class="s-ar-top__count">{{ pages.length }} pages · A4 · {{ Math.round(scale * 100) }}%</span>
        <RSegmented v-model="view" :options="viewOptions" size="sm" icon-only label="Layout" />
        <RButton variant="ghost" size="sm" class="s-ar-hide-sm" @click="print">
          <template #leading><Printer /></template>
          Print
        </RButton>
        <RButton variant="outline" size="sm" @click="download">
          <template #leading><Download /></template>
          PDF
        </RButton>
      </div>
    </header>

    <main ref="main" class="s-ar-main">
      <template v-if="twoUp">
        <section v-for="(spread, i) in spreads" :key="i" class="s-ar-spread" :aria-label="`Pages ${pad(spread[0].n)} to ${pad(spread[spread.length - 1].n)}`">
          <div class="s-ar-spread__pages">
            <A4Page
              v-for="p in spread"
              :key="p.n"
              :number="pad(p.n)"
              :section="p.section"
              :scale="scale"
              :bare="p.bare"
              :side="p.n % 2 === 0 ? 'left' : 'right'"
            >
              <PageBody :page="p.n" />
            </A4Page>
          </div>
          <p class="s-ar-spread__cap">
            <span class="r-index">{{ pad(spread[0].n) }}–{{ pad(spread[spread.length - 1].n) }}</span>
            {{ spread.map((p) => p.title).join(' · ') }}
          </p>
        </section>
      </template>
      <template v-else>
        <section v-for="p in pages" :key="p.n" class="s-ar-single" :aria-label="`Page ${pad(p.n)}`">
          <A4Page :number="pad(p.n)" :section="p.section" :scale="scale" :bare="p.bare" :side="p.n % 2 === 0 ? 'left' : 'right'">
            <PageBody :page="p.n" />
          </A4Page>
          <p class="s-ar-spread__cap"><span class="r-index">{{ pad(p.n) }}</span> {{ p.title }}</p>
        </section>
      </template>
    </main>
  </div>
</template>

<style scoped>
.s-ar {
  min-height: 100dvh;
  background: var(--r-bg-muted);
  color: var(--r-text);
}
:global([data-theme='dark']) .s-ar {
  background: var(--r-bg-canvas);
}

.s-ar-top {
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
.s-ar-top__start,
.s-ar-top__end {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}
.s-ar-top__sep {
  width: 1px;
  height: 24px;
  background: var(--r-border);
}
.s-ar-top__titles {
  min-width: 0;
}
.s-ar-top__eyebrow {
  overflow: hidden;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-caps);
  line-height: 1.4;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
}
.s-ar-top__title {
  overflow: hidden;
  font-size: var(--r-text-md);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-snug);
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.s-ar-top__count {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.s-ar-main {
  display: flex;
  flex-direction: column;
  gap: 40px;
  padding: 24px 40px 96px;
}
.s-ar-spread,
.s-ar-single {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}
.s-ar-spread__pages {
  display: flex;
  justify-content: center;
  gap: 24px;
}
.s-ar-spread__cap {
  display: flex;
  align-items: baseline;
  gap: 10px;
  color: var(--r-text-secondary);
  font-size: var(--r-text-sm);
}

@media (max-width: 760px) {
  .s-ar-main {
    gap: 28px;
    padding: 16px 16px 96px;
  }
  .s-ar-top {
    padding: 0 16px;
  }
  .s-ar-top__count,
  .s-ar-top__sep,
  .s-ar-top__start :deep(.r-logo),
  .s-ar-hide-sm {
    display: none;
  }
}
</style>
