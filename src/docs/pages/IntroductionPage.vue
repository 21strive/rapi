<script setup lang="ts">
import { ref } from 'vue'
import { ArrowUpRight, CalendarDays, FolderKanban, Gauge, Search } from 'lucide-vue-next'
import {
  RButton,
  RCard,
  RChip,
  RDotMatrixChart,
  RIconButton,
  RInput,
  RKbd,
  RRadialGauge,
  RSegmented,
  RSparkline,
  RStat,
} from '@/design-system'
import DocPage from '../components/DocPage.vue'
import DocSection from '../components/DocSection.vue'
import CodeBlock from '../components/CodeBlock.vue'

const period = ref('month')
const periods = [
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' },
  { label: 'Year', value: 'year' },
]

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const sales = [42, 51, 47, 63, 58, 71, 66, 74, 69, 82, 77, 88].map((v) => v * 1000)
const insight = [12, 9, 14, 11, 16, 12, 18, 10, 15, 13, 17, 9].map((v) => v * 1000)

const examples = [
  {
    to: '/examples/sales',
    icon: Gauge,
    title: 'Sales overview',
    text: 'KPI cards, a dot-matrix summary, a radial gauge, an orders heatmap and a guided tour.',
  },
  {
    to: '/examples/projects',
    icon: FolderKanban,
    title: 'Projects',
    text: 'Search, filter chips, a filter popover that really filters, bulk actions and pagination.',
  },
  {
    to: '/examples/schedule',
    icon: CalendarDays,
    title: 'Weekly schedule',
    text: 'A week grid with pastel events, a right-click menu with a submenu, and an edit dialog.',
  },
]

const install = `import { createApp } from 'vue'
import { RapiPlugin } from '@/design-system'
import App from '@/docs/App.vue'

// Brings in the font, the tokens and every R-component.
createApp(App).use(RapiPlugin).mount('#app')`

const usage = `<RCard title="Overall revenue" variant="brand">
  <RStat :value="25912" prefix="$" :trend="1.9" trend-label="than last month" />
</RCard>`
</script>

<template>
  <DocPage eyebrow="Design system · v0.1" title="Rapi">
    <template #lead>
      A quiet, data-first design system for Vue 3. It grew out of a close reading of 24 dashboard shots from the
      Dribbble collection <em>Clean Minimalistic</em>, and keeps what those screens agree on: calm surfaces, big
      numbers, soft corners, and a keyboard for everything.
    </template>

    <div class="intro-hero" aria-label="A few Rapi components working together">
      <RCard variant="brand" class="intro-hero__revenue">
        <template #header>
          <span class="intro-hero__card-title">Overall revenue</span>
        </template>
        <template #actions>
          <RIconButton label="Open revenue report" variant="soft" size="sm"><ArrowUpRight /></RIconButton>
        </template>
        <RStat :value="25912" prefix="$" size="xl" :trend="1.9" trend-label="than last month" animate />
      </RCard>

      <RCard class="intro-hero__chart" title="Sales summary">
        <template #actions>
          <RSegmented v-model="period" :options="periods" size="sm" label="Period" />
        </template>
        <RDotMatrixChart
          :labels="months"
          :series="[
            { name: 'Sales', values: sales },
            { name: 'Insight', values: insight, color: 'var(--r-chart-1-soft)' },
          ]"
          :height="196"
          label="Sales and insight per month"
        />
      </RCard>

      <RCard class="intro-hero__gauge" title="Sales category">
        <RRadialGauge
          :segments="[
            { label: 'Ecommerce', value: 5120 },
            { label: 'Ambassador', value: 2094 },
            { label: 'Direct', value: 1000 },
          ]"
          caption="Product sales"
          label="Sales by category"
        />
      </RCard>

      <RCard class="intro-hero__search" padding="sm">
        <RInput placeholder="Search anything" aria-label="Search anything">
          <template #leading><Search /></template>
          <template #trailing><RKbd :keys="['mod', 'K']" /></template>
        </RInput>
        <div class="doc-row">
          <RChip variant="solid" tone="violet" caret>Pending</RChip>
          <RChip caret>Tag</RChip>
          <RChip variant="dashed">Add filter</RChip>
        </div>
      </RCard>
    </div>

    <DocSection
      id="principles"
      title="What the references taught us"
      description="Before drawing anything we measured the shots: colour coverage, type sizes, corner radii, how focus and selection are shown. Six patterns came up again and again, and they became the rules for everything here."
    >
      <div class="intro-principles">
        <article class="intro-principle">
          <div class="intro-principle__art intro-art-pixels" aria-hidden="true">
            <span class="intro-art-pixels__quiet" />
            <span class="intro-art-pixels__loud" />
          </div>
          <h3>Quiet canvas, loud data</h3>
          <p>
            In most of the shots, accent colour covers less than 1% of the pixels (one orange banking card reaches 5%).
            Canvases are near-white greys like #F8F8F8 and #F0F0F0. Colour is kept for things that mean something: a
            status, a data series, the one primary action.
          </p>
        </article>
        <article class="intro-principle">
          <div class="intro-principle__art" aria-hidden="true">
            <RStat :value="2589" unit="kcal" size="lg" :trend="12.4" />
          </div>
          <h3>Numbers are the hero</h3>
          <p>
            KPIs run 40 to 56px, semibold, tightly tracked, with tabular figures so columns line up. Units step back in
            size and colour, and the change sits in a small pill beside the number.
          </p>
        </article>
        <article class="intro-principle">
          <div class="intro-principle__art intro-art-radius" aria-hidden="true">
            <span class="intro-art-radius__card"><span class="intro-art-radius__well"><span class="intro-art-radius__control" /></span></span>
          </div>
          <h3>Soft geometry</h3>
          <p>
            Cards around 20px, wells inside them 14px, controls 10px, chips fully round. Edges are 1px hairlines, and
            shadows are wide and faint rather than dark.
          </p>
        </article>
        <article class="intro-principle">
          <div class="intro-principle__art" aria-hidden="true">
            <div class="doc-row">
              <RButton tabindex="-1">Continue</RButton>
              <RButton variant="outline" tabindex="-1">Back</RButton>
            </div>
          </div>
          <h3>Ink for emphasis</h3>
          <p>
            The active nav pill, the Continue button and the current page in a pagination are near-black. Blue is kept
            for the brand and for selection: checkboxes, switches, focus, links.
          </p>
        </article>
        <article class="intro-principle">
          <div class="intro-principle__art" aria-hidden="true">
            <div class="doc-row">
              <RKbd :keys="['mod', 'K']" size="lg" />
              <RKbd size="lg">↑</RKbd>
              <RKbd size="lg">↓</RKbd>
              <RKbd size="lg">esc</RKbd>
            </div>
          </div>
          <h3>Keyboard first</h3>
          <p>
            Search fields show ⌘K, palettes teach their keys in the footer, menus list shortcuts. Every component on
            this site works without a mouse.
          </p>
        </article>
        <article class="intro-principle">
          <div class="intro-principle__art" aria-hidden="true">
            <RSparkline :values="[12, 18, 14, 22, 19, 27, 24, 31, 29, 36]" :height="48" />
          </div>
          <h3>Hand-built data visuals</h3>
          <p>
            Dot-matrix bars, a radial-tick gauge, heatmaps, smooth lines over a gradient, min–max ranges, stacked bars
            and sparklines. All of them are plain SVG drawn from the same tokens, so they follow the theme.
          </p>
        </article>
      </div>
    </DocSection>

    <DocSection
      id="architecture"
      title="How it is put together"
      description="Two layers of tokens, a handful of tone classes, and components that only read semantic names. That is the whole trick behind dark mode and the brand switch."
    >
      <p class="doc-p">
        Primitives are the raw ramps, like <code class="doc-c">--r-blue-500</code>. Components never touch them.
        Semantic tokens such as <code class="doc-c">--r-bg-surface</code> or <code class="doc-c">--r-text-secondary</code>
        point at primitives, and themes work by pointing them somewhere else. Set
        <code class="doc-c">data-theme="dark"</code> on any element and everything inside turns dark; the command palette
        uses this to stay dark on a light page. Set <code class="doc-c">data-brand="violet"</code> and the brand ramp swaps
        everywhere at once.
      </p>
      <p class="doc-p">
        Status colours work the same way. A component reads <code class="doc-c">--tone-solid</code>,
        <code class="doc-c">--tone-soft</code> and friends, and a class like <code class="doc-c">r-tone-success</code>
        fills them in. So one badge, button or chip covers every status without a new variant.
      </p>
      <CodeBlock :code="install" lang="ts" title="main.ts" />
      <CodeBlock :code="usage" title="Usage" />
    </DocSection>

    <DocSection
      id="try"
      title="Try it"
      description="Press ⌘K (Ctrl K on Windows and Linux) to jump anywhere. Switch the theme and brand in the top bar; every page follows, the examples too."
    >
      <div class="intro-examples">
        <RCard
          v-for="example in examples"
          :key="example.to"
          as="RouterLink"
          :to="example.to"
          interactive
          padding="lg"
          class="intro-example"
        >
          <component :is="example.icon" class="intro-example__icon" />
          <h3 class="intro-example__title">{{ example.title }}</h3>
          <p class="intro-example__text">{{ example.text }}</p>
        </RCard>
      </div>
    </DocSection>

    <DocSection
      id="accessibility"
      title="Accessibility"
      description="Quiet does not mean faint. These are the rules every component on the site follows."
    >
      <ul class="doc-list">
        <li>
          Body text and secondary text pass WCAG AA. The tertiary grey, used for hints and axis labels, is tuned to
          4.78:1 on white and about 5:1 on the dark surface.
        </li>
        <li>
          Focus is always visible: buttons, chips and tabs get a 2px brand outline, text fields get a brand border with
          a soft 3px halo.
        </li>
        <li>
          Widgets use the roles people's tools expect: tablist, radiogroup, switch, menu, dialog. Dialogs trap focus and
          give it back when they close.
        </li>
        <li>
          Every chart has a text label and a hidden data table, and you can step through its values with the arrow
          keys.
        </li>
        <li>With reduced motion turned on, transitions drop to almost nothing and the count-up numbers just appear.</li>
      </ul>
      <p class="doc-p">
        The name comes from Indonesian: <em>rapi</em> means tidy. The typeface, Plus Jakarta Sans, was drawn by
        Tokotype in Jakarta.
      </p>
    </DocSection>
  </DocPage>
</template>

<style>
.intro-hero {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 80px;
}

.intro-hero__revenue {
  grid-column: span 2;
}
.intro-hero__chart {
  grid-column: span 4;
  grid-row: span 2;
}
.intro-hero__gauge {
  grid-column: span 2;
  grid-row: span 2;
}
.intro-hero__search {
  grid-column: span 4;
  flex-direction: row !important;
  flex-wrap: wrap;
  align-items: center;
}
.intro-hero__search .r-field {
  flex: 1 1 260px;
}

.intro-hero__card-title {
  font-size: var(--r-text-lg);
  font-weight: var(--r-weight-medium);
}

@media (max-width: 1100px) {
  .intro-hero {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .intro-hero__revenue,
  .intro-hero__gauge {
    grid-column: span 1;
    grid-row: auto;
  }
  .intro-hero__chart,
  .intro-hero__search {
    grid-column: span 2;
    grid-row: auto;
  }
}

@media (max-width: 640px) {
  .intro-hero {
    grid-template-columns: minmax(0, 1fr);
  }
  .intro-hero__revenue,
  .intro-hero__gauge,
  .intro-hero__chart,
  .intro-hero__search {
    grid-column: auto;
  }
}

.intro-principles {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(300px, 100%), 1fr));
  gap: 16px;
}

.intro-principle {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 20px;
  border: 1px solid var(--r-border-subtle);
  border-radius: var(--r-radius-xl);
  background: var(--r-bg-surface);
}

.intro-principle h3 {
  margin-top: 6px;
  font-size: var(--r-text-lg);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-snug);
}

.intro-principle p {
  color: var(--r-text-secondary);
  font-size: var(--r-text-sm);
  line-height: 1.6;
}

.intro-principle__art {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 120px;
  padding: 16px;
  border-radius: var(--r-radius-lg);
  background: var(--r-bg-canvas);
  pointer-events: none;
}

.intro-art-pixels {
  justify-content: flex-start;
  gap: 4px;
}
.intro-art-pixels__quiet {
  flex: 99;
  height: 100%;
  border-radius: 10px;
  background:
    linear-gradient(var(--r-bg-surface), var(--r-bg-surface)) padding-box,
    var(--r-border-subtle);
  box-shadow: inset 0 0 0 1px var(--r-border-subtle);
}
.intro-art-pixels__loud {
  flex: 1.6;
  height: 100%;
  border-radius: 6px;
  background: var(--r-brand);
}

.intro-art-radius__card {
  display: grid;
  place-items: center;
  width: 150px;
  height: 92px;
  border: 1px solid var(--r-border);
  border-radius: 20px;
  background: var(--r-bg-surface);
}
.intro-art-radius__well {
  display: grid;
  place-items: center;
  width: 118px;
  height: 60px;
  border-radius: 14px;
  background: var(--r-bg-track);
}
.intro-art-radius__control {
  width: 82px;
  height: 28px;
  border-radius: 10px;
  background: var(--r-bg-surface);
  box-shadow: var(--r-shadow-sm);
}

.intro-examples {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(240px, 100%), 1fr));
  gap: 16px;
}

.intro-example {
  gap: 10px !important;
}
.intro-example__icon {
  width: 22px;
  height: 22px;
  color: var(--r-brand);
}
.intro-example__title {
  margin-top: 8px;
  font-size: var(--r-text-lg);
  font-weight: var(--r-weight-semibold);
}
.intro-example__text {
  color: var(--r-text-secondary);
  font-size: var(--r-text-sm);
  line-height: 1.55;
}
</style>
