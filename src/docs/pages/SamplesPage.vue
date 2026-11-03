<script setup lang="ts">
import { computed } from 'vue'
import { ArrowUpRight } from 'lucide-vue-next'

const originals = [
  { path: '/examples/sales', title: 'Sales overview', summary: 'The first Rapi example, restyled: KPIs, a sales dot matrix, categories on a tick ring, transactions and orders by hour.' },
  { path: '/examples/projects', title: 'Projects', summary: 'A filterable projects list with a filter popover, bulk actions, row menus and pagination.' },
  { path: '/examples/schedule', title: 'Weekly schedule', summary: 'A week calendar with a mini month, calendar list, context menu and an event dialog.' },
]
import DocPage from '../components/DocPage.vue'
import { sampleGroups, samples } from '../samples/registry'

const groups = computed(() =>
  sampleGroups.map((group) => ({ group, items: samples.filter((s) => s.group === group) })),
)
</script>

<template>
  <DocPage
    eyebrow="Samples"
    title="Thirty-six screens"
    lead="Each screen is built only from Rapi components and tokens, in the light or dark theme it was designed for. Open one, then flip the theme from the toolbar at the bottom."
  >
    <section v-for="(g, gi) in groups" :key="g.group" class="samples-group">
      <header class="samples-group__head">
        <span class="r-index">{{ String(gi + 1).padStart(2, '0') }}</span>
        <h2 class="r-eyebrow">{{ g.group }}</h2>
        <span class="samples-group__count r-label">{{ g.items.length }} screens</span>
      </header>
      <div class="samples-grid r-grid-ruled">
        <RouterLink v-for="s in g.items" :key="s.id" :to="`/samples/${s.id}`" class="samples-card">
          <span class="samples-card__top">
            <span class="r-index">{{ s.index }}</span>
            <span class="samples-card__theme r-label">{{ s.theme }}</span>
          </span>
          <span class="samples-card__title">{{ s.title }}</span>
          <span class="samples-card__summary">{{ s.summary }}</span>
          <ArrowUpRight class="samples-card__arrow" :size="16" aria-hidden="true" />
        </RouterLink>
      </div>
    </section>

    <section class="samples-group">
      <header class="samples-group__head">
        <span class="r-index">{{ String(groups.length + 1).padStart(2, '0') }}</span>
        <h2 class="r-eyebrow">From Rapi 0.1</h2>
        <span class="samples-group__count r-label">3 screens</span>
      </header>
      <div class="samples-grid r-grid-ruled">
        <RouterLink v-for="(o, i) in originals" :key="o.path" :to="o.path" class="samples-card">
          <span class="samples-card__top">
            <span class="r-index">E{{ i + 1 }}</span>
            <span class="samples-card__theme r-label">restyled</span>
          </span>
          <span class="samples-card__title">{{ o.title }}</span>
          <span class="samples-card__summary">{{ o.summary }}</span>
          <ArrowUpRight class="samples-card__arrow" :size="16" aria-hidden="true" />
        </RouterLink>
      </div>
    </section>
  </DocPage>
</template>

<style>
.samples-group + .samples-group {
  margin-top: 48px;
}

.samples-group__head {
  display: flex;
  align-items: baseline;
  gap: 12px;
  padding-bottom: 12px;
}

.samples-group__count {
  margin-left: auto;
}

.samples-grid {
  grid-template-columns: repeat(auto-fill, minmax(min(260px, 100%), 1fr));
}

.samples-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 176px;
  padding: 16px 18px 20px;
  color: inherit;
  text-decoration: none;
  transition: background-color var(--r-duration-fast) var(--r-ease-out);
}

.samples-card:hover {
  background: var(--r-bg-muted);
}

.samples-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}

.samples-card__title {
  font-size: var(--r-text-lg);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-tight);
  line-height: 1.25;
}

.samples-card__summary {
  color: var(--r-text-secondary);
  font-size: var(--r-text-sm);
  line-height: 1.5;
}

.samples-card__arrow {
  position: absolute;
  top: 16px;
  right: 46px;
  color: var(--r-text-tertiary);
  opacity: 0;
  transition: opacity var(--r-duration-fast) var(--r-ease-out);
}

.samples-card:hover .samples-card__arrow,
.samples-card:focus-visible .samples-card__arrow {
  opacity: 1;
}

.samples-card:focus-visible {
  outline-offset: -2px;
}
</style>
