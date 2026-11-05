<script setup lang="ts">
import { ArrowUpRight, Download } from 'lucide-vue-next'
import {
  RButton,
  RCard,
  RLineChart,
  RLogo,
  RMeter,
  RSpecList,
  RStat,
  RStatus,
  type SpecItem,
  type StatusTone,
} from '@/design-system'
import DocPage from '../components/DocPage.vue'
import DocSection from '../components/DocSection.vue'
import CodeBlock from '../components/CodeBlock.vue'
import { samples } from '../samples/registry'

/* ── The page header datasheet ─────────────────────────────────────────────── */
const facts: SpecItem[] = [
  { label: 'Version', value: '0.2 · Nov 2026', mono: true },
  { label: 'Owner', value: '21 Strive' },
  { label: 'Framework', value: 'Vue 3.5, TypeScript' },
  { label: 'Type', value: 'Geist, Geist Mono' },
  { label: 'Samples', value: String(samples.length), mono: true },
]

/* ── The language at a glance: a treasury desk at 14:02 WIB ─────────────────── */
const weeks = ['29 Sep', '06 Oct', '13 Oct', '20 Oct', '27 Oct', '03 Nov', '10 Nov', '17 Nov', '24 Nov', '01 Dec', '08 Dec', '15 Dec', '22 Dec']
const balance = [41.2, 43.8, 42.5, 45.1, 44.0, 46.7, 48.2, 47.1, 45.9, 49.4, 50.2, 48.8, 51.6]
const NOW = 6
const billions = (v: number) => v.toFixed(1)

interface Rail {
  name: string
  meta: string
  tone: StatusTone
  status: string
  pulse?: boolean
}

const rails: Rail[] = [
  { name: 'BI-FAST', meta: '0.8 s median', tone: 'success', status: 'Nominal' },
  { name: 'RTGS', meta: 'Window to 17:00', tone: 'success', status: 'Nominal' },
  { name: 'SKNBI', meta: 'Queue 14 min', tone: 'warning', status: 'Degraded' },
  { name: 'SWIFT', meta: 'Opens 15:00', tone: 'neutral', status: 'Closed' },
  { name: 'Batch 0412', meta: '1,284 payments', tone: 'signal', status: 'Live', pulse: true },
]

/* ── What gets a screen: the rule before the rules ──────────────────────────── */
const tests = [
  {
    title: 'Seeing beats saying',
    text: 'State, change and shape read in one look: readouts, lamps, live values, charts, who and what.',
    jobs: 'Glance · Watch · Compare · Identify',
  },
  {
    title: 'Touch beats describing',
    text: 'A hand finds the value faster than a sentence: knobs, faders, and the few fields worth a field.',
    jobs: 'Tune · Enter',
  },
  {
    title: 'A person decides',
    text: 'Commitments, proof and interruptions: approve, release, undo, verify, acknowledge.',
    jobs: 'Decide · Verify · Respond',
  },
  {
    title: 'Everything else is a conversation',
    text: 'Filters, forms and settings become a sentence; the screen keeps only what needs a check.',
    jobs: 'Ask',
  },
] as const

/* ── Principles ─────────────────────────────────────────────────────────────── */
const principles = [
  {
    art: 'square',
    title: 'Square by default',
    text: 'Every corner is 0. A circle always means a point or a state: a status lamp, a radio button, a data point. Never a pill, never a rounded card.',
  },
  {
    art: 'rules',
    title: 'Rules, not shadows',
    text: 'Hairlines carry the structure: around panels, between rows, between the cells of a ruled grid. Only things that float above the page get a shadow, and it is short.',
  },
  {
    art: 'type',
    title: 'Two voices of type',
    text: 'Geist reads: titles, body text and values. Geist Mono labels: eyebrows, table heads, axis ticks, units, ids, timestamps and statuses, in capitals with 10% tracking.',
  },
  {
    art: 'colour',
    title: 'Colour is a signal',
    text: 'Ink and greys do almost all the work. Cobalt marks the brand, the selection and the one primary action. International Orange marks what is live, now, or needs eyes.',
  },
  {
    art: 'numbers',
    title: 'Numbers are instruments',
    text: 'Tabular figures wherever numbers line up, units small and in mono caps, hero figures large and tightly tracked. A negative number gets a true minus sign.',
  },
  {
    art: 'index',
    title: 'Index everything',
    text: 'Running numbers, eyebrows over titles, and a mono strip across the top of a page with the context on the left and the date or status on the right.',
  },
] as const

// Column heights for the "colour is a signal" drawing: one selected column, one now line.
const columns = [38, 52, 44, 61, 57, 70, 64, 76, 69, 58, 66, 81, 73, 62, 55, 68]
const SELECTED = 11
const NOW_AT = 13

/* ── Layers ─────────────────────────────────────────────────────────────────── */
const layers = [
  {
    name: 'Tokens',
    path: 'tokens/tokens.css',
    text: 'Primitive ramps built in OKLCH, and the semantic roles on top of them. Components read only the roles, so a theme is a block that re-points them.',
  },
  {
    name: 'Components',
    path: 'components/',
    text: 'Vue 3 single-file components: square, ruled, usable from the keyboard. A tone prop picks the colour; nothing takes a hex.',
  },
  {
    name: 'Charts',
    path: 'charts/',
    text: 'Hand-built SVG on the dataviz method. Colour by job, a hidden data table, arrow keys and a tooltip on every chart.',
  },
  {
    name: 'Samples',
    path: 'docs/samples/',
    text: `${samples.length} full screens, from a treasury desk to launch control, built only from the three layers before them.`,
  },
]

const island = `<!-- A dark console inside a light page: every token inside re-points. -->
<section data-theme="dark">
  <RStatus tone="signal" label="Live" pulse />
  <RStat label="Chamber pressure" :value="97.2" unit="bar" />
</section>`

const install = `$ npm install vue lucide-vue-next @fontsource-variable/geist @fontsource-variable/geist-mono`

// Joined from lines so no line starts with an import: Vite's dependency scanner reads those.
const main = [
  "import { createApp } from 'vue'",
  "import { RapiPlugin } from './design-system'",
  "import App from './App.vue'",
  '',
  '// Loads Geist, Geist Mono, the tokens and the base layer, and registers every R-component.',
  "createApp(App).use(RapiPlugin).mount('#app')",
].join('\n')

const usage = `<RCard title="Cash on hand">
  <RStat label="Today, IDR" :value="48.21" unit="B" :decimals="2" :trend="1.9" trend-label="vs yesterday" />
  <RButton tone="brand">Approve batch</RButton>
</RCard>`

const routes = [
  { to: '/samples', title: 'Samples', text: `${samples.length} screens for banking, security, aerospace, instruments and developer tools.` },
  { to: '/components/actions', title: 'Components', text: 'Every component with its variants, states, props and the rules for using it.' },
  { to: '/charts', title: 'Charts', text: 'Lines, columns, heatmaps, candles and dials, with the method behind their colours.' },
]

/* ── What changed from 0.1 ──────────────────────────────────────────────────── */
const changes = [
  {
    topic: 'Shape',
    before: 'Soft corners: 20px cards, 10px controls, pills, wide faint shadows.',
    after: 'Square everywhere. Circles only for points and states. Hairline rules instead of shadows.',
  },
  {
    topic: 'Type',
    before: 'Plus Jakarta Sans for everything.',
    after: 'Geist for reading, Geist Mono in capitals for labels, Geist Pixel for the odd readout.',
  },
  {
    topic: 'Colour',
    before: 'Three brand hues (blue, violet, flame) you could switch at runtime.',
    after: 'One brand, 21 Strive cobalt, with International Orange as the signal. The brand switch is gone.',
  },
  {
    topic: 'Components',
    before: '27 components.',
    after: 'Plus status, readout, spec list, alert, rule, timeline, steps, code block, knob, slider, radio group, textarea, breadcrumb, empty state, toaster, logo and supergraphic.',
  },
  {
    topic: 'Charts',
    before: '8 charts with smooth curves and gradient fills.',
    after: 'Rebuilt on the dataviz method, plus candlestick, waterfall, bullet, scatter, Gantt, dial and radar scope.',
  },
  {
    topic: 'Screens',
    before: 'Three examples: sales overview, projects, weekly schedule.',
    after: `${samples.length} samples. The three originals are still here, restyled.`,
  },
]
</script>

<template>
  <DocPage eyebrow="Rapi 0.2 · 21 Strive" title="Rapi">
    <template #lead>
      <span class="intro-motive">We make UI to make things easier for people, not harder.</span>
      A language model can now carry a complex interaction as a conversation, so a screen earns its place only where
      seeing, touching or deciding is faster than saying it.
    </template>
    <template #aside>
      <RSpecList :items="facts" dense />
    </template>

    <p class="intro-about">
      Rapi is the design language and design system of 21 Strive: the tokens, the Vue 3 components, the charts, and the
      rules for putting them together, for screens where people decide things from numbers. Its
      <RouterLink to="/moodboard">moodboard</RouterLink> holds a thousand of the moments that earn a screen, and its
      <RouterLink to="/samples">gallery</RouterLink> shows classic screens beside their AI-first rewrite.
      <em>Rapi</em> is Indonesian for tidy.
    </p>

    <!-- The language at a glance -->
    <figure class="intro-glance r-marks" aria-label="A treasury screen built from Rapi components">
      <div class="intro-strip">
        <span class="intro-strip__start">
          <RLogo brand="21strive" variant="mark" :size="10" label="" />
          <span>21 Strive</span>
          <span class="intro-strip__sep" aria-hidden="true">/</span>
          <span>Treasury</span>
          <span class="intro-strip__sep intro-strip__wide" aria-hidden="true">/</span>
          <span class="intro-strip__wide">Cash position</span>
        </span>
        <span class="intro-strip__end">
          <span class="intro-strip__wide">12 Nov 2026 · 14:02 WIB</span>
          <RStatus tone="success" label="Nominal" size="sm" />
        </span>
      </div>

      <div class="intro-glance__head">
        <div class="intro-glance__heading">
          <span class="r-eyebrow">Liquidity · Desk JKT-01</span>
          <h2 class="intro-glance__title">Cash position</h2>
        </div>
        <div class="intro-glance__actions">
          <RButton variant="outline" size="sm" tabindex="-1">
            <template #leading><Download /></template>
            Export
          </RButton>
          <RButton tone="brand" size="sm" tabindex="-1">Approve batch 0412</RButton>
        </div>
      </div>

      <div class="intro-kpis r-grid-ruled">
        <div class="intro-kpi">
          <span class="r-index">01</span>
          <RStat label="Cash on hand · IDR" :value="48.21" :decimals="2" unit="B" :trend="1.9" trend-label="vs yesterday" size="lg" />
        </div>
        <div class="intro-kpi">
          <span class="r-index">02</span>
          <RStat label="Due this week · IDR" :value="6.42" :decimals="2" unit="B" size="lg">
            <template #footer><span class="intro-kpi__note">312 payments to 41 banks</span></template>
          </RStat>
        </div>
        <div class="intro-kpi">
          <span class="r-index">03</span>
          <RStat label="FX exposure · USD" :value="4.1" :decimals="1" unit="M" size="lg">
            <template #footer>
              <RMeter
                class="intro-kpi__meter"
                :segments="[{ value: 62, label: 'Used', color: 'var(--r-chart-1)' }]"
                :max="100"
                :height="6"
                label="62% of the USD 6.6 M limit"
              />
              <span class="intro-kpi__note">62% of the USD 6.6 M limit</span>
            </template>
          </RStat>
        </div>
        <div class="intro-kpi">
          <span class="r-index">04</span>
          <RStat label="Settlement p95" :value="182" unit="ms" :trend="-12" invert-trend trend-label="vs last hour" size="lg" />
        </div>
      </div>

      <div class="intro-glance__body">
        <div class="intro-glance__chart">
          <div class="intro-panel-head">
            <span class="r-eyebrow">Liquidity, 13 weeks</span>
            <span class="r-label">Actual to 10 Nov, then forecast</span>
          </div>
          <RLineChart
            :labels="weeks"
            :series="[{ name: 'Balance', values: balance }]"
            :height="220"
            :now="NOW"
            :forecast-from="NOW"
            :references="[{ value: 40, label: 'Floor', kind: 'threshold' }]"
            :min="35"
            :max="55"
            y-unit="IDR B"
            :format="billions"
            label="Cash balance in billions of rupiah over 13 weeks, actual to 10 November and forecast after"
          />
        </div>
        <div class="intro-glance__rails">
          <div class="intro-panel-head">
            <span class="r-eyebrow">Payment rails</span>
            <span class="r-label">5 watched</span>
          </div>
          <ul class="intro-rails">
            <li v-for="rail in rails" :key="rail.name" class="intro-rail">
              <span class="intro-rail__name">{{ rail.name }}</span>
              <span class="intro-rail__meta">{{ rail.meta }}</span>
              <RStatus class="intro-rail__status" :tone="rail.tone" :label="rail.status" :pulse="rail.pulse" size="sm" />
            </li>
          </ul>
        </div>
      </div>
    </figure>

    <DocSection
      id="what-gets-a-screen"
      title="What gets a screen"
      description="We make UI to make things easier for people, not harder, so we only build the UI that matters. A language model can now carry most complex interactions as a conversation; a screen earns its place only when one of three things is true."
    >
      <div class="intro-tests r-grid-ruled">
        <article v-for="(t, i) in tests" :key="t.title" class="intro-test">
          <span class="r-index">{{ String(i + 1).padStart(2, '0') }}</span>
          <h3 class="intro-test__title">{{ t.title }}</h3>
          <p class="intro-test__text">{{ t.text }}</p>
          <p class="intro-test__jobs r-label">{{ t.jobs }}</p>
        </article>
      </div>
      <RouterLink to="/moodboard" class="intro-tests__link">
        See a thousand of these moments on the moodboard
        <ArrowUpRight :size="14" aria-hidden="true" />
      </RouterLink>
    </DocSection>

    <DocSection
      id="principles"
      title="Principles"
      description="Six rules decide almost every question about how something should look. When two of them pull in different directions, the data wins."
    >
      <div class="intro-principles r-grid-ruled">
        <article v-for="(p, i) in principles" :key="p.art" class="intro-principle">
          <span class="r-index">{{ String(i + 1).padStart(2, '0') }}</span>
          <div class="intro-art" :class="`intro-art--${p.art}`" aria-hidden="true">
            <template v-if="p.art === 'square'">
              <span class="intro-art__panel">
                <span class="intro-art__panel-id">RTN-0412</span>
                <span class="intro-art__lamp-row"><span class="intro-art__lamp" />Nominal</span>
              </span>
            </template>
            <template v-else-if="p.art === 'rules'">
              <span class="intro-art__ruled">
                <span v-for="n in 6" :key="n">{{ String(n).padStart(2, '0') }}</span>
              </span>
            </template>
            <template v-else-if="p.art === 'type'">
              <span class="intro-art__type">
                <span class="intro-art__sans">Settlement</span>
                <span class="intro-art__mono">Batch 0412 · 14:02 WIB</span>
              </span>
            </template>
            <template v-else-if="p.art === 'colour'">
              <svg class="intro-art__columns" viewBox="0 0 160 84">
                <rect
                  v-for="(h, c) in columns"
                  :key="c"
                  :x="c * 10"
                  :y="84 - h"
                  width="8"
                  :height="h"
                  :class="{ 'is-selected': c === SELECTED }"
                />
                <line :x1="NOW_AT * 10 + 4" y1="6" :x2="NOW_AT * 10 + 4" y2="84" class="intro-art__now" />
              </svg>
            </template>
            <template v-else-if="p.art === 'numbers'">
              <span class="intro-art__figure">
                <span class="intro-art__value">1,284</span><span class="intro-art__unit">RPS</span>
              </span>
              <span class="intro-art__deltas"><span>+1.9%</span><span>−0.4 PP</span></span>
            </template>
            <template v-else>
              <span class="intro-art__index">
                <span><b>01</b>Treasury</span>
                <span><b>02</b>Ledger</span>
                <span><b>03</b>Cards</span>
              </span>
            </template>
          </div>
          <h3 class="intro-principle__title">{{ p.title }}</h3>
          <p class="intro-principle__text">{{ p.text }}</p>
        </article>
      </div>
    </DocSection>

    <DocSection
      id="architecture"
      title="How it is put together"
      description="Four layers, each built only from the one before it. A screen never reaches past a component to a token, and a component never reaches past a role to a raw colour."
    >
      <ol class="intro-layers r-grid-ruled">
        <li v-for="(layer, i) in layers" :key="layer.name" class="intro-layer">
          <span class="intro-layer__top">
            <span class="r-index">{{ String(i + 1).padStart(2, '0') }}</span>
            <span v-if="i < layers.length - 1" class="intro-layer__arrow" aria-hidden="true">→</span>
          </span>
          <span class="intro-layer__name">{{ layer.name }}</span>
          <code class="intro-layer__path">{{ layer.path }}</code>
          <span class="intro-layer__text">{{ layer.text }}</span>
        </li>
      </ol>
      <p class="doc-p">
        Primitives are the raw ramps, like <code class="doc-c">--r-cobalt-700</code>. Semantic tokens such as
        <code class="doc-c">--r-bg-surface</code> and <code class="doc-c">--r-text-secondary</code> point at them, and a
        theme works by pointing them somewhere else. Set <code class="doc-c">data-theme="dark"</code> on any element and
        everything inside turns dark, so a console can sit inside a light page. Components that take a
        <code class="doc-c">tone</code> read six <code class="doc-c">--tone-*</code> variables, and a class such as
        <code class="doc-c">r-tone-signal</code> fills them in.
      </p>
      <CodeBlock :code="island" title="Theme island" />
    </DocSection>

    <DocSection
      id="try"
      title="Try it"
      description="The library is plain source: Vue single-file components, TypeScript and CSS. Copy src/design-system into your app, or point an alias at it, then install what it needs."
    >
      <CodeBlock :code="install" lang="bash" title="Terminal" />
      <CodeBlock :code="main" lang="ts" title="main.ts" />
      <CodeBlock :code="usage" title="Usage" />
      <p class="doc-p">
        Geist and Geist Mono come from <code class="doc-c">@fontsource-variable/geist</code> and
        <code class="doc-c">@fontsource-variable/geist-mono</code>. Geist Pixel ships inside the library, in
        <code class="doc-c">src/design-system/fonts/</code>, under the SIL Open Font License, and loads only when a
        readout asks for it. Press <kbd class="doc-c">/</kbd> or <kbd class="doc-c">⌘K</kbd> on this site to jump
        anywhere.
      </p>
      <div class="intro-routes">
        <RCard v-for="r in routes" :key="r.to" as="RouterLink" :to="r.to" interactive class="intro-route">
          <span class="intro-route__top">
            <span class="intro-route__title">{{ r.title }}</span>
            <ArrowUpRight class="intro-route__arrow" />
          </span>
          <span class="intro-route__text">{{ r.text }}</span>
        </RCard>
      </div>
    </DocSection>

    <DocSection
      id="changes"
      title="What changed from 0.1"
      description="Rapi 0.1 was a soft, rounded system. In 0.2 it became the language of 21 Strive, and almost every surface changed with it."
    >
      <dl class="intro-changes">
        <div v-for="c in changes" :key="c.topic" class="intro-change">
          <dt class="intro-change__topic">{{ c.topic }}</dt>
          <dd class="intro-change__before"><span class="intro-change__version">0.1</span>{{ c.before }}</dd>
          <dd class="intro-change__after"><span class="intro-change__version">0.2</span>{{ c.after }}</dd>
        </div>
      </dl>
      <p class="doc-p">
        The 0.1 token names are gone. Code written for 0.1 moves over with a short list: radius tokens become
        <code class="doc-c">--r-radius-surface</code> and <code class="doc-c">--r-radius-control</code>, the violet and
        flame tones become brand and signal, and the brand ramp becomes the cobalt ramp.
      </p>
    </DocSection>

    <DocSection
      id="accessibility"
      title="Accessibility"
      description="Serious does not mean faint or fiddly. Every component on this site follows these rules, and the Colour page measures its contrast live."
    >
      <ul class="doc-list">
        <li>
          Text passes WCAG AA. The tertiary grey used for hints and axis labels is 5.3:1 on white, 5.1:1 on the canvas
          and 4.6:1 on a hovered row; in dark mode it is 5.7:1 on the surface.
        </li>
        <li>
          Focus is always a crisp 2px cobalt line, never a soft halo, so it shows on every surface and in both
          themes.
        </li>
        <li>
          State is never colour alone. A status lamp always comes with a word, a negative number with a minus sign, an
          error with an icon.
        </li>
        <li>
          Labels on orange are black: white text reaches only 3.3:1 on International Orange, black reaches 5.5:1.
        </li>
        <li>
          Widgets use the roles assistive tools expect: tablist, radiogroup, switch, slider, menu, dialog. Dialogs trap
          focus and give it back when they close.
        </li>
        <li>
          Every chart has an accessible name, a hidden data table and arrow-key exploration. Colours under 3:1, like
          amber and periwinkle on white, are always labelled directly.
        </li>
        <li>With reduced motion on, durations drop to almost nothing and live lamps stop blinking.</li>
      </ul>
    </DocSection>
  </DocPage>
</template>

<style>
/* ── At a glance ─────────────────────────────────────────────────────────── */
.intro-glance {
  margin: 0 0 24px;
  border: 1px solid var(--r-border-strong);
  background: var(--r-bg-surface);
}

.intro-strip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  height: 32px;
  padding: 0 14px;
  border-bottom: 1px solid var(--r-border);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-caps);
  text-transform: uppercase;
  white-space: nowrap;
}

.intro-strip__start,
.intro-strip__end {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.intro-strip__end {
  color: var(--r-text-tertiary);
}

.intro-strip__sep {
  color: var(--r-text-disabled);
}

.intro-glance__head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px 24px;
  padding: 20px 20px 18px;
}

.intro-glance__heading {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.intro-glance__title {
  font-size: var(--r-text-3xl);
  font-weight: var(--r-weight-semibold);
  line-height: 1.05;
  letter-spacing: var(--r-tracking-tighter);
}

.intro-glance__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

/* The KPI row sits inside the frame, so it drops the outer rules and keeps the inner ones. */
.intro-kpis.r-grid-ruled {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  border-left: 0;
}
.intro-kpis.r-grid-ruled > *:last-child {
  border-right: 0;
}

.intro-kpi {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
  padding: 14px 16px 18px;
}

/* A full row of the stat's footer, so the bar has a width to fill. */
.intro-kpi__meter {
  flex: 1 0 100%;
  margin-top: 2px;
}

.intro-kpi__note {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

.intro-glance__body {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
}

.intro-glance__chart,
.intro-glance__rails {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
  padding: 16px 18px 18px;
}

.intro-glance__rails {
  border-left: 1px solid var(--r-border);
}

.intro-panel-head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 4px 12px;
}

.intro-rails {
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--r-border-subtle);
}

.intro-rail {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-areas:
    'name status'
    'meta status';
  align-items: center;
  column-gap: 12px;
  padding: 9px 0;
  border-bottom: 1px solid var(--r-border-subtle);
}

.intro-rail__name {
  grid-area: name;
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-medium);
}

.intro-rail__meta {
  grid-area: meta;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.intro-rail__status {
  grid-area: status;
  justify-self: end;
}

@media (max-width: 1100px) {
  .intro-kpis.r-grid-ruled {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .intro-kpis.r-grid-ruled > *:nth-child(2n) {
    border-right: 0;
  }
  .intro-glance__body {
    grid-template-columns: minmax(0, 1fr);
  }
  .intro-glance__rails {
    border-top: 1px solid var(--r-border);
    border-left: 0;
  }
}

@media (max-width: 640px) {
  .intro-strip__wide {
    display: none;
  }
  .intro-glance__head {
    padding: 16px 14px 14px;
  }
  .intro-glance__title {
    font-size: var(--r-text-2xl);
  }
  .intro-kpi {
    padding: 12px 12px 14px;
  }
  .intro-glance__chart,
  .intro-glance__rails {
    padding: 14px 12px;
  }
}

/* ── Principles ──────────────────────────────────────────────────────────── */
/* The ground motivation of Rapi: the first words a reader meets. */
.intro-motive {
  display: block;
  margin-bottom: 6px;
  color: var(--r-text);
  font-size: var(--r-text-2xl);
  font-weight: var(--r-weight-semibold);
  line-height: 1.2;
  letter-spacing: var(--r-tracking-tight);
  text-wrap: balance;
}

.intro-about {
  max-width: 72ch;
  margin-bottom: 32px;
  color: var(--r-text-secondary);
  font-size: var(--r-text-md);
}

.intro-about a {
  color: var(--r-brand-text);
}

.intro-tests.r-grid-ruled {
  grid-template-columns: minmax(0, 1fr);
}

@media (min-width: 560px) {
  .intro-tests.r-grid-ruled {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1200px) {
  .intro-tests.r-grid-ruled {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

.intro-test {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
  padding: 14px 16px 18px;
}

.intro-test:last-child {
  background: var(--r-bg-muted);
}

.intro-test__title {
  margin-top: 4px;
  font-size: var(--r-text-lg);
  font-weight: var(--r-weight-semibold);
  line-height: 1.25;
  letter-spacing: var(--r-tracking-snug);
}

.intro-test__text {
  color: var(--r-text-secondary);
  font-size: var(--r-text-sm);
}

.intro-test__jobs {
  margin-top: auto;
  padding-top: 8px;
}

.intro-tests__link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 16px;
  color: var(--r-brand-text);
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-medium);
  text-decoration: none;
}
.intro-tests__link:hover {
  text-decoration: underline;
}

.intro-principles.r-grid-ruled {
  grid-template-columns: repeat(auto-fill, minmax(min(250px, 100%), 1fr));
}

.intro-principle {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
  padding: 14px 16px 20px;
}

.intro-principle__title {
  margin-top: 4px;
  font-size: var(--r-text-lg);
  font-weight: var(--r-weight-semibold);
  line-height: 1.25;
  letter-spacing: var(--r-tracking-snug);
}

.intro-principle__text {
  color: var(--r-text-secondary);
  font-size: var(--r-text-sm);
  line-height: 1.55;
}

.intro-art {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 10px;
  height: 120px;
  padding: 0 4px;
  border-bottom: 1px solid var(--r-border-subtle);
  pointer-events: none;
}

.intro-art__panel {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 148px;
  height: 80px;
  padding: 10px 12px;
  border: 1px solid var(--r-border-strong);
  background: var(--r-bg-surface);
}

.intro-art__panel-id,
.intro-art__lamp-row,
.intro-art__mono,
.intro-art__unit,
.intro-art__deltas,
.intro-art__index {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-caps);
  text-transform: uppercase;
}

.intro-art__panel-id {
  color: var(--r-text-tertiary);
}

.intro-art__lamp-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.intro-art__lamp {
  width: 8px;
  height: 8px;
  border-radius: var(--r-radius-round);
  background: var(--r-status-good);
}

.intro-art__ruled {
  display: grid;
  grid-template-columns: repeat(3, 52px);
  border-top: 1px solid var(--r-border-strong);
  border-left: 1px solid var(--r-border-strong);
}
.intro-art__ruled span {
  height: 36px;
  padding: 4px 6px;
  border-right: 1px solid var(--r-border-strong);
  border-bottom: 1px solid var(--r-border-strong);
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
}

.intro-art__type {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.intro-art__sans {
  font-size: 30px;
  font-weight: var(--r-weight-semibold);
  line-height: 1;
  letter-spacing: var(--r-tracking-display);
}
.intro-art__mono {
  color: var(--r-text-secondary);
}

.intro-art__columns {
  width: 100%;
  max-width: 200px;
  height: 84px;
  overflow: visible;
}
.intro-art__columns rect {
  fill: var(--r-chart-context);
}
.intro-art__columns rect.is-selected {
  fill: var(--r-brand);
}
.intro-art__now {
  stroke: var(--r-chart-now);
  stroke-width: 2;
}

.intro-art__figure {
  display: flex;
  align-items: baseline;
  gap: 6px;
}
.intro-art__value {
  font-size: 44px;
  font-weight: var(--r-weight-semibold);
  line-height: 1;
  letter-spacing: var(--r-tracking-display);
}
.intro-art__unit {
  color: var(--r-text-tertiary);
}
.intro-art__deltas {
  display: flex;
  gap: 12px;
  color: var(--r-text-secondary);
  font-variant-numeric: tabular-nums;
}

.intro-art__index {
  display: flex;
  flex-direction: column;
  width: 160px;
  border-top: 1px solid var(--r-border-strong);
}
.intro-art__index span {
  display: flex;
  gap: 12px;
  padding: 6px 0;
  border-bottom: 1px solid var(--r-border);
}
.intro-art__index b {
  color: var(--r-text-tertiary);
  font-weight: var(--r-weight-medium);
}

/* ── Layers ──────────────────────────────────────────────────────────────── */
.intro-layers.r-grid-ruled {
  grid-template-columns: repeat(auto-fit, minmax(min(190px, 100%), 1fr));
}

.intro-layer {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
  padding: 14px 16px 18px;
}

.intro-layer__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 18px;
}

.intro-layer__arrow {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-sm);
}

.intro-layer__name {
  margin-top: 6px;
  font-size: var(--r-text-lg);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-snug);
}

.intro-layer__path {
  color: var(--r-brand-text);
  font-family: var(--r-font-mono);
  font-size: 11.5px;
}

.intro-layer__text {
  color: var(--r-text-secondary);
  font-size: var(--r-text-sm);
  line-height: 1.55;
}

/* ── Try it ──────────────────────────────────────────────────────────────── */
.intro-routes {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(220px, 100%), 1fr));
  gap: 16px;
}

.intro-route {
  gap: 8px !important;
}

.intro-route__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.intro-route__title {
  font-size: var(--r-text-lg);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-snug);
}

.intro-route__arrow {
  width: 16px;
  height: 16px;
  color: var(--r-text-tertiary);
}

.intro-route__text {
  color: var(--r-text-secondary);
  font-size: var(--r-text-sm);
  line-height: 1.55;
}

/* ── Changes ─────────────────────────────────────────────────────────────── */
.intro-changes {
  border-top: 1px solid var(--r-border-strong);
}

.intro-change {
  display: grid;
  grid-template-columns: 136px minmax(0, 1fr) minmax(0, 1fr);
  gap: 8px 24px;
  padding: 14px 0 16px;
  border-bottom: 1px solid var(--r-border);
}

.intro-change__topic {
  padding-top: 2px;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-caps);
  text-transform: uppercase;
}

.intro-change__before,
.intro-change__after {
  margin: 0;
  font-size: var(--r-text-sm);
  line-height: 1.55;
}

.intro-change__before {
  color: var(--r-text-tertiary);
}

.intro-change__after {
  color: var(--r-text);
}

.intro-change__version {
  display: block;
  margin-bottom: 4px;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-medium);
  letter-spacing: 0.04em;
}

.intro-change__after .intro-change__version {
  color: var(--r-brand-text);
}

@media (max-width: 720px) {
  .intro-change {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
