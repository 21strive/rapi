<script setup lang="ts">
import { ArrowRight, CalendarDays, FolderKanban, Gauge } from 'lucide-vue-next'
import { RAvatarGroup, RBadge, RCard, RStat } from '@/design-system'
import DocPage from '../components/DocPage.vue'
import DocSection from '../components/DocSection.vue'

const examples = [
  {
    to: '/examples/sales',
    icon: Gauge,
    title: 'Sales overview',
    text: 'A dashboard: KPI cards, a dot-matrix summary, a radial gauge, an orders heatmap and a guided tour.',
    shows: 'Card, Stat, Meter, Table, Tour, and five charts.',
  },
  {
    to: '/examples/projects',
    icon: FolderKanban,
    title: 'Projects',
    text: 'A list you can actually work with: search, filter chips, a filter popover, bulk actions and pages.',
    shows: 'Nav item, Input, Chip, Popover, Menu, Table, Pagination.',
  },
  {
    to: '/examples/schedule',
    icon: CalendarDays,
    title: 'Weekly schedule',
    text: 'A week of meetings in pastel blocks, with a right-click menu, a submenu and an edit dialog.',
    shows: 'Segmented control, Checkbox, Menu, Dialog, Avatar group.',
  },
]

/* Tiny dot grid for the sales preview: column heights out of six. */
const dotColumns = [2, 3, 3, 4, 3, 5, 4, 5, 6, 5, 4, 6]
const weekBlocks = [
  { day: 0, top: 10, height: 28, tone: 5 },
  { day: 1, top: 40, height: 46, tone: 2 },
  { day: 2, top: 4, height: 22, tone: 7 },
  { day: 2, top: 52, height: 34, tone: 8 },
  { day: 3, top: 22, height: 26, tone: 1 },
  { day: 4, top: 46, height: 40, tone: 4 },
  { day: 4, top: 6, height: 20, tone: 6 },
]
</script>

<template>
  <DocPage eyebrow="Examples" title="Examples">
    <template #lead>
      Three screens built only from Rapi components, with no extra styling libraries. They are full-size, so they open
      on their own. A small toolbar at the bottom lets you switch theme and brand, or come back here.
    </template>

    <div class="doc-examples">
      <RCard
        v-for="example in examples"
        :key="example.to"
        as="RouterLink"
        :to="example.to"
        interactive
        padding="none"
        class="doc-example"
      >
        <div class="doc-example__preview" inert>
          <!-- Sales overview -->
          <div v-if="example.to.endsWith('sales')" class="doc-preview-sales">
            <RCard variant="brand" padding="sm" class="doc-preview-sales__kpi">
              <RStat label="Revenue" :value="25912" prefix="$" size="md" :trend="1.9" />
              <span class="doc-preview-sales__meter"><span /></span>
            </RCard>
            <div class="doc-preview-sales__chart">
              <span v-for="(height, c) in dotColumns" :key="c" class="doc-preview-sales__col">
                <span v-for="k in 6" :key="k" class="doc-preview-sales__dot" :class="{ 'is-on': k <= height }" />
              </span>
            </div>
          </div>

          <!-- Projects -->
          <div v-else-if="example.to.endsWith('projects')" class="doc-preview-projects">
            <div class="doc-preview-projects__chips">
              <span class="doc-preview-projects__chip is-solid">Pending</span>
              <span class="doc-preview-projects__chip">Type</span>
              <span class="doc-preview-projects__chip is-dashed">+ Filter</span>
            </div>
            <div v-for="(row, i) in ['Travearth', 'Nganter', 'Aturuang', 'Coinmu']" :key="row" class="doc-preview-projects__row">
              <span class="doc-preview-projects__box" :class="{ 'is-checked': i === 1 }" />
              <span class="doc-preview-projects__name">{{ row }}</span>
              <RAvatarGroup :names="['Kim Ji-soo', 'Agus Santoso', 'Dewi Lestari', 'Mary Shelley'].slice(0, 2 + (i % 3))" size="xs" :max="3" />
              <RBadge :tone="i === 0 ? 'warning' : i === 3 ? 'success' : 'brand'" size="sm" dot>
                {{ i === 0 ? 'Pending' : i === 3 ? 'Done' : 'In progress' }}
              </RBadge>
            </div>
          </div>

          <!-- Weekly schedule -->
          <div v-else class="doc-preview-week">
            <span v-for="d in 5" :key="d" class="doc-preview-week__day" />
            <span
              v-for="(block, i) in weekBlocks"
              :key="i"
              class="doc-preview-week__block"
              :style="{
                left: `calc(${block.day} * 20% + 3px)`,
                top: `${block.top}%`,
                height: `${block.height}%`,
                background: `var(--r-identity-${block.tone})`,
                color: `var(--r-identity-${block.tone}-text)`,
              }"
            />
          </div>
        </div>
        <div class="doc-example__body">
          <component :is="example.icon" class="doc-example__icon" />
          <h2 class="doc-example__title">{{ example.title }}</h2>
          <p class="doc-example__text">{{ example.text }}</p>
          <p class="doc-example__shows">{{ example.shows }}</p>
          <span class="doc-example__open">Open example <ArrowRight /></span>
        </div>
      </RCard>
    </div>

    <DocSection id="notes" title="A few notes">
      <ul class="doc-list">
        <li>Everything on these screens is a Rapi component or a plain layout wrapper. If something looks off, it is a bug in the system, not in the example.</li>
        <li>The data is made up. Filtering on the Projects screen works on that sample data, so try it.</li>
        <li>
          ⌘K (Ctrl K on Windows and Linux) opens the command menu everywhere except on Projects, where it focuses the
          page's own search. The toolbar button opens the command menu on every screen.
        </li>
        <li>At phone width the sidebars fold away and wide tables scroll sideways inside their card.</li>
      </ul>
    </DocSection>
  </DocPage>
</template>

<style>
.doc-examples {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(300px, 100%), 1fr));
  gap: 20px;
  margin-bottom: 72px;
}

.doc-example {
  overflow: hidden;
  gap: 0 !important;
}

.doc-example__preview {
  position: relative;
  height: 200px;
  overflow: hidden;
  border-bottom: 1px solid var(--r-border-subtle);
  background: var(--r-bg-canvas);
}

.doc-example__body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 20px 22px 22px;
}

.doc-example__icon {
  width: 20px;
  height: 20px;
  color: var(--r-brand);
}

.doc-example__title {
  margin-top: 4px;
  font-size: var(--r-text-lg);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-snug);
}

.doc-example__text {
  color: var(--r-text-secondary);
  font-size: var(--r-text-sm);
  line-height: 1.55;
}

.doc-example__shows {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
  line-height: 1.5;
}

.doc-example__open {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-medium);
}
.doc-example__open svg {
  width: 16px;
  height: 16px;
  transition: transform var(--r-duration-base) var(--r-ease-out);
}
.doc-example:hover .doc-example__open svg {
  transform: translateX(3px);
}

/* Sales preview */
.doc-preview-sales {
  display: grid;
  grid-template-columns: 1fr 1.25fr;
  gap: 10px;
  height: 100%;
  padding: 16px;
}

.doc-preview-sales__kpi {
  justify-content: space-between;
  border-radius: var(--r-radius-lg) !important;
}

.doc-preview-sales__meter {
  display: block;
  height: 8px;
  overflow: hidden;
  border-radius: var(--r-radius-full);
  background: rgb(255 255 255 / 0.22);
}
.doc-preview-sales__meter span {
  display: block;
  width: 64%;
  height: 100%;
  border-radius: inherit;
  background: #fff;
}

.doc-preview-sales__chart {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 3px;
  padding: 12px;
  border: 1px solid var(--r-border-subtle);
  border-radius: var(--r-radius-lg);
  background: var(--r-bg-surface);
}

.doc-preview-sales__col {
  display: flex;
  flex-direction: column-reverse;
  gap: 3px;
}

.doc-preview-sales__dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--r-chart-track);
}
.doc-preview-sales__dot.is-on {
  background: var(--r-chart-1);
}

/* Projects preview */
.doc-preview-projects {
  display: flex;
  flex-direction: column;
  gap: 6px;
  height: 100%;
  padding: 16px;
}

.doc-preview-projects__chips {
  display: flex;
  gap: 6px;
  margin-bottom: 4px;
}

.doc-preview-projects__chip {
  padding: 4px 10px;
  border: 1px solid var(--r-border);
  border-radius: var(--r-radius-full);
  background: var(--r-bg-surface);
  font-size: 11px;
  font-weight: var(--r-weight-medium);
}
.doc-preview-projects__chip.is-solid {
  border-color: transparent;
  background: var(--r-violet);
  color: #fff;
}
.doc-preview-projects__chip.is-dashed {
  border-style: dashed;
  background: transparent;
  color: var(--r-text-tertiary);
}

.doc-preview-projects__row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 10px;
  border-radius: var(--r-radius-md);
  background: var(--r-bg-surface);
  font-size: var(--r-text-xs);
}

.doc-preview-projects__box {
  width: 12px;
  height: 12px;
  border: 1.5px solid var(--r-border-strong);
  border-radius: 3px;
}
.doc-preview-projects__box.is-checked {
  border-color: var(--r-brand);
  background: var(--r-brand);
}

.doc-preview-projects__name {
  flex: 1;
  font-weight: var(--r-weight-medium);
}

/* Week preview */
.doc-preview-week {
  position: absolute;
  inset: 16px;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0;
  overflow: hidden;
  border: 1px solid var(--r-border-subtle);
  border-radius: var(--r-radius-lg);
  background: var(--r-bg-surface);
}

.doc-preview-week__day {
  border-right: 1px solid var(--r-border-subtle);
}
.doc-preview-week__day:last-of-type {
  border-right: 0;
}

.doc-preview-week__block {
  position: absolute;
  display: flex;
  flex-direction: column;
  gap: 5px;
  width: calc(20% - 6px);
  padding: 7px 6px;
  overflow: hidden;
  border-radius: 8px;
}
.doc-preview-week__block::before,
.doc-preview-week__block::after {
  height: 4px;
  border-radius: 2px;
  background: currentColor;
  content: '';
}
.doc-preview-week__block::before {
  width: 70%;
  opacity: 0.8;
}
.doc-preview-week__block::after {
  width: 45%;
  opacity: 0.4;
}
</style>
