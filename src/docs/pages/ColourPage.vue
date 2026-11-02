<script setup lang="ts">
import { computed } from 'vue'
import { Check } from 'lucide-vue-next'
import {
  RAvatar,
  RBadge,
  RButton,
  RCheckbox,
  RLineChart,
  RSwitch,
  RTable,
  RTrend,
  identityIndex,
  initialsOf,
  useTheme,
  type Brand,
  type TableColumn,
} from '@/design-system'
import DocPage from '../components/DocPage.vue'
import DocSection from '../components/DocSection.vue'
import Demo from '../components/Demo.vue'
import CodeBlock from '../components/CodeBlock.vue'
import DoDont from '../components/DoDont.vue'
import ColorRamp from '../components/ColorRamp.vue'
import TokenRows, { type TokenRow } from '../components/TokenRows.vue'

const { resolved, brand } = useTheme()

const RAMP = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950']
const ramp = (name: string) => RAMP.map((step) => ({ token: `--r-${name}-${step}`, label: step }))

const neutralSteps = ['0', '25', '50', '100', '200', '300', '400', '500', '600', '700', '800', '850', '900', '950'].map(
  (step) => ({ token: `--r-neutral-${step}`, label: step }),
)

const brandNames: Record<Brand, string> = { blue: 'Blue', violet: 'Violet', flame: 'Flame' }
const brands = Object.keys(brandNames) as Brand[]

/* Measured on the reference shots. */
const samples = [
  { name: 'Blue', note: 'Coinex, Finanzen, Untitled UI', colors: ['#3860F8', '#1870F8', '#2868F0', '#4078F0', '#0040F8'] },
  { name: 'Violet', note: 'Chainx, Trenning, Finalytic', colors: ['#5838F8', '#5848E8', '#9050F8', '#9890F8'] },
  { name: 'Flame', note: 'Banking statistics card', colors: ['#F84820'] },
  { name: 'Green', note: 'Positive deltas', colors: ['#08B868'] },
  { name: 'Rose', note: 'Heart rate, negative deltas', colors: ['#F87080'] },
  { name: 'Sky', note: 'Syncrowave', colors: ['#1890C0'] },
  { name: 'Canvas', note: 'Behind the cards', colors: ['#F8F8F8', '#F0F0F0', '#E8E8E8'] },
]

const neutralRows: TokenRow[] = [
  { token: '--r-neutral-900', sample: 'text', on: '--r-neutral-0', note: 'Primary text in light mode' },
  { token: '--r-neutral-600', sample: 'text', on: '--r-neutral-0', note: 'Secondary text' },
  { token: '--r-neutral-500', sample: 'text', on: '--r-neutral-0', note: 'Tertiary text: hints, axis labels, placeholders' },
  { token: '--r-neutral-500', sample: 'text', on: '--r-neutral-50', note: 'The same tertiary text on the canvas' },
  { token: '--r-neutral-500', sample: 'text', on: '--r-neutral-100', note: 'And on a hovered row or a nav group' },
  { token: '--r-neutral-400', sample: 'text', on: '--r-neutral-0', note: 'Disabled text only, never for reading' },
]

const tones = [
  { tone: 'success', label: 'Success', badge: 'Done', note: 'Done, paid, positive change' },
  { tone: 'warning', label: 'Warning', badge: 'Pending', note: 'Pending, waiting for approval' },
  { tone: 'danger', label: 'Danger', badge: 'Overdue', note: 'Errors, destructive actions, negative change' },
] as const

const extraTones = [
  { tone: 'violet', label: 'Violet', badge: 'Design' },
  { tone: 'flame', label: 'Flame', badge: 'Urgent' },
  { tone: 'sky', label: 'Sky', badge: 'In review' },
  { tone: 'brand', label: 'Brand', badge: 'Selected' },
  { tone: 'neutral', label: 'Neutral', badge: 'Draft' },
] as const

const toneRows = (tone: string): TokenRow[] => [
  { token: `--r-${tone}`, note: 'Solid: dots, solid badges, filled buttons' },
  { token: `--r-${tone}-soft`, note: 'Soft background' },
  { token: `--r-${tone}-text`, sample: 'text', on: `--r-${tone}-soft`, note: 'Text on the soft background' },
  { token: `--r-${tone}-border`, sample: 'border', note: 'Outline variants' },
]

const toneVarColumns: TableColumn[] = [
  { key: 'name', label: 'Variable', width: '34%' },
  { key: 'use', label: 'What reads it' },
]
const toneVars = [
  { name: '--tone-solid', use: 'Filled backgrounds: solid buttons and badges, checked boxes.' },
  { name: '--tone-solid-hover', use: 'Hover state of the filled background.' },
  { name: '--tone-on-solid', use: 'Text and icons on the filled background.' },
  { name: '--tone-soft', use: 'Tinted backgrounds: soft badges and buttons, trend pills.' },
  { name: '--tone-soft-hover', use: 'Hover state of the tinted background.' },
  { name: '--tone-text', use: 'Text on tinted backgrounds and in outline variants.' },
  { name: '--tone-border', use: 'Borders of outline variants.' },
]

const chartSteps = [
  { token: '--r-chart-1', label: '1 · brand' },
  { token: '--r-chart-1-soft', label: '1 soft' },
  { token: '--r-chart-2', label: '2' },
  { token: '--r-chart-3', label: '3' },
  { token: '--r-chart-4', label: '4' },
  { token: '--r-chart-5', label: '5' },
  { token: '--r-chart-6', label: '6' },
]

const chartSupportRows: TokenRow[] = [
  { token: '--r-chart-track', note: 'Empty dots, bar tracks, heatmap floor' },
  { token: '--r-chart-grid', sample: 'border', note: 'Gridlines and hatching' },
  { token: '--r-chart-axis', sample: 'text', on: '--r-bg-surface', note: 'Axis labels' },
]

const weeks = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10']
const lineSeries = [
  { name: 'Revenue', values: [32, 38, 35, 44, 41, 52, 49, 58, 55, 63] },
  { name: 'Expenses', values: [24, 22, 27, 25, 30, 28, 33, 31, 29, 34] },
  { name: 'Refunds', values: [6, 8, 7, 9, 6, 10, 8, 7, 9, 8] },
]

const identities = Array.from({ length: 8 }, (_, i) => i + 1)
const identityRows: TokenRow[] = identities.map((i) => ({
  token: `--r-identity-${i}-text`,
  sample: 'text',
  on: `--r-identity-${i}`,
  note: `Text on --r-identity-${i}`,
}))

const people = [
  'Anastasia William',
  'Kim Ji-soo',
  'Nurul Huda',
  'Bessie Cooper',
  'Agus Santoso',
  'Mary Shelley',
  'Jansen Truman',
  'Kathryn Murphy',
  'Dewi Lestari',
  'Rizky Pratama',
  'Jenny Wilson',
  'Lina Marlina',
]
const peopleByIndex = computed(() =>
  identities.map((i) => people.find((name) => identityIndex(name) === i) ?? null),
)

const semanticGroups: { title: string; rows: TokenRow[] }[] = [
  {
    title: 'Surfaces',
    rows: [
      { token: '--r-bg-canvas', note: 'The page behind the cards' },
      { token: '--r-bg-surface', note: 'Cards, inputs, tables' },
      { token: '--r-bg-raised', note: 'Popovers, menus, dialogs' },
      { token: '--r-bg-muted', note: 'Wells and table headers' },
      { token: '--r-bg-hover', note: 'Hovered rows and items' },
      { token: '--r-bg-pressed', note: 'Pressed and toggled' },
      { token: '--r-bg-track', note: 'Behind segmented controls' },
      { token: '--r-bg-overlay', note: 'Behind dialogs' },
    ],
  },
  {
    title: 'Borders',
    rows: [
      { token: '--r-border-subtle', sample: 'border', note: 'Card edges, row lines' },
      { token: '--r-border', sample: 'border', note: 'Inputs, outline buttons' },
      { token: '--r-border-strong', sample: 'border', note: 'Hovered inputs' },
    ],
  },
  {
    title: 'Text',
    rows: [
      { token: '--r-text', sample: 'text', on: '--r-bg-surface', note: 'Headings, values, body' },
      { token: '--r-text-secondary', sample: 'text', on: '--r-bg-surface', note: 'Descriptions, labels' },
      { token: '--r-text-tertiary', sample: 'text', on: '--r-bg-surface', note: 'Hints, axis labels' },
      { token: '--r-text-tertiary', sample: 'text', on: '--r-bg-canvas', note: 'Tertiary on the canvas' },
      { token: '--r-text-tertiary', sample: 'text', on: '--r-bg-hover', note: 'Tertiary on hover' },
      { token: '--r-text-disabled', sample: 'text', on: '--r-bg-surface', note: 'Disabled only' },
    ],
  },
  {
    title: 'Ink and brand',
    rows: [
      { token: '--r-ink', note: 'Primary buttons, active pills' },
      { token: '--r-on-ink', sample: 'text', on: '--r-ink', note: 'Text on ink' },
      { token: '--r-brand', note: 'Selection, focus, series 1' },
      { token: '--r-on-brand', sample: 'text', on: '--r-brand', note: 'Text on brand' },
      { token: '--r-brand-text', sample: 'text', on: '--r-bg-surface', note: 'Links' },
      { token: '--r-brand-text', sample: 'text', on: '--r-brand-soft', note: 'Selected rows, soft badges' },
    ],
  },
]

const brandSnippet = `<!-- One attribute on any ancestor re-colours every brand role inside it. -->
<html data-theme="light" data-brand="violet">`

const brandCss = `/* tokens.css: the brand ramp is an alias layer */
:root {
  --r-brand-500: var(--r-blue-500);
  /* …all eleven steps */
}

[data-brand='violet'] {
  --r-brand-500: var(--r-violet-500);
}

/* Semantic roles point at the alias, never at blue itself */
:root {
  --r-brand: var(--r-brand-500);
  --r-brand-soft: var(--r-brand-50);
}`

const toneSnippet = `<RBadge tone="success" dot>Done</RBadge>
<RButton variant="soft" tone="danger">Delete</RButton>

<!-- Or on your own markup: the class fills in the --tone-* variables -->
<span class="my-pill r-tone-warning">Pending</span>`

const toneCss = `.my-pill {
  background: var(--tone-soft);
  color: var(--tone-text);
}`

</script>

<template>
  <DocPage eyebrow="Foundations" title="Colour">
    <template #lead>
      Quiet canvas, loud data. In most of the 24 reference shots, accent colour covers less than 1% of the pixels;
      one orange banking card reaches 5%. Rapi keeps that balance: neutrals do the work, and colour shows up only
      when it means something, such as a status, a data series, or the one primary action.
    </template>

    <Demo title="Sampled from the shots" note="The raw colours we measured before building any ramp." surface="plain">
      <div class="doc-samples">
        <div v-for="group in samples" :key="group.name" class="doc-sample-group">
          <div class="doc-sample-group__chips">
            <span
              v-for="color in group.colors"
              :key="color"
              class="doc-sample"
              :style="{ background: color }"
              :title="color"
            />
          </div>
          <span class="doc-sample-group__name">{{ group.name }}</span>
          <span class="doc-sample-group__note">{{ group.colors.join(' ') }}</span>
          <span class="doc-sample-group__note">{{ group.note }}</span>
        </div>
      </div>
    </Demo>

    <p class="doc-p doc-colour-intro">
      Each sample became an eleven-step ramp, tuned so that the 500 step matches what the shots use and the steps either
      side stay usable for text and tints. Components never read a ramp directly. They read semantic names like
      <code class="doc-c">--r-text-secondary</code>, and the theme decides what those point at.
    </p>

    <DocSection
      id="neutrals"
      title="Neutrals"
      description="A cool grey, slightly blue, so white cards on the light canvas look clean rather than dirty. Tertiary text sits on white, on the canvas and on hover backgrounds, so step 500 is tuned to pass AA on all three."
    >
      <ColorRamp :steps="neutralSteps" :columns="7" highlight="--r-neutral-500" />
      <TokenRows :rows="neutralRows" />
      <p class="doc-p">
        The light canvas is <code class="doc-c">--r-neutral-50</code> and cards are pure white, which is the same
        near-white-on-white contrast the references use. Dark mode does not reuse this ramp backwards; it has its own
        hand-picked greys, listed under semantic tokens below.
      </p>
    </DocSection>

    <DocSection
      id="brand"
      title="Brand"
      description="The brand ramp is an alias. By default it points at blue; data-brand on any ancestor points it at violet or flame instead, and every brand role follows."
    >
      <ColorRamp
        :steps="ramp('brand')"
        :title="`--r-brand-* · now ${brandNames[brand]}`"
        note="Switch the brand in the top bar and this ramp changes with it."
        highlight="--r-brand-500"
      />

      <div class="doc-grid doc-grid--3-ramps">
        <div v-for="b in brands" :key="b" class="doc-brand-ramp" :class="{ 'is-active': b === brand }">
          <ColorRamp :steps="ramp(b)" :title="brandNames[b]" size="sm" />
          <RBadge v-if="b === brand" tone="brand" size="sm" class="doc-brand-ramp__badge">
            <template #leading><Check /></template>
            In use
          </RBadge>
        </div>
      </div>

      <Demo title="Same components, three brands" note="Each panel sets data-brand on itself.">
        <div class="doc-brand-islands">
          <div
            v-for="b in brands"
            :key="b"
            class="doc-brand-island"
            :data-theme="resolved"
            :data-brand="b"
            inert
          >
            <span class="doc-brand-island__name">{{ brandNames[b] }}</span>
            <div class="doc-row">
              <RButton tone="brand" size="sm">Save</RButton>
              <RBadge tone="brand">Selected</RBadge>
            </div>
            <div class="doc-row">
              <RCheckbox :model-value="true" label="Checked" />
              <RSwitch :model-value="true" aria-label="On" />
            </div>
          </div>
        </div>
      </Demo>

      <CodeBlock :code="brandSnippet" title="index.html" />
      <CodeBlock :code="brandCss" lang="css" title="tokens.css" />

      <DoDont
        do="Use brand for selection (checkboxes, switches, focus, links, selected rows) and for one brand moment per screen, like the hero KPI card."
        dont="Use brand blue for information messages, decoration or headings. When blue means everything, it stops meaning anything."
      />
    </DocSection>

    <DocSection
      id="status"
      title="Status"
      description="Three status colours do almost all the work: green for done, amber for waiting, rose for problems. Each one comes with a soft background, a text colour that passes AA on it, and a border."
    >
      <div class="doc-tones">
        <div v-for="t in tones" :key="t.tone" class="doc-tone">
          <div class="doc-tone__head">
            <span class="doc-tone__name">{{ t.label }}</span>
            <span class="doc-tone__note">{{ t.note }}</span>
          </div>
          <div class="doc-row">
            <RBadge :tone="t.tone" dot>{{ t.badge }}</RBadge>
            <RBadge :tone="t.tone" variant="outline">{{ t.badge }}</RBadge>
            <RBadge :tone="t.tone" variant="solid">{{ t.badge }}</RBadge>
            <RTrend v-if="t.tone === 'success'" :value="1.9" />
            <RTrend v-if="t.tone === 'danger'" :value="-1.2" />
          </div>
          <TokenRows :rows="toneRows(t.tone)" />
        </div>
      </div>

      <Demo title="More tones" note="For categories and tags, not for status.">
        <RBadge v-for="t in extraTones" :key="t.tone" :tone="t.tone" dot>{{ t.badge }}</RBadge>
      </Demo>

      <p class="doc-p">
        Components never hard-code these colours. A badge, a button or a chip reads a small set of
        <code class="doc-c">--tone-*</code> variables, and a class such as
        <code class="doc-c">r-tone-success</code> fills them in. That is why one badge component covers every status,
        and why your own markup can borrow a tone with a single class.
      </p>
      <div class="doc-props">
        <RTable :columns="toneVarColumns" :rows="toneVars" row-key="name" density="compact" caption="Tone variables">
          <template #cell-name="{ value }">
            <code class="doc-props__name">{{ value }}</code>
          </template>
          <template #cell-use="{ value }">
            <span class="doc-props__description">{{ value }}</span>
          </template>
        </RTable>
      </div>
      <CodeBlock :code="toneSnippet" title="Usage" />
      <CodeBlock :code="toneCss" lang="css" title="Your own CSS" />

      <DoDont
        do="Pair colour with a word, a dot or an icon. A green badge says Done in text too."
        dont="Use red and green as the only difference between two states; around one in twelve men cannot tell them apart."
      />
    </DocSection>

    <DocSection
      id="data"
      title="Data"
      description="Series 1 is always the brand, so charts re-colour with the brand switch. The rest of the palette is picked to stay apart from each other and to read on both light and dark surfaces."
    >
      <ColorRamp :steps="chartSteps" />
      <TokenRows :rows="chartSupportRows" />
      <Demo title="Three series" surface="plain">
        <div class="doc-colour-chart">
          <RLineChart :labels="weeks" :series="lineSeries" :height="200" legend label="Revenue, expenses and refunds per week" />
        </div>
      </Demo>
      <p class="doc-p">
        Use <code class="doc-c">--r-chart-1-soft</code> for the second half of a pair, like Sales against Insight in the
        dot-matrix chart. Empty dots, tracks and the floor of a heatmap all use
        <code class="doc-c">--r-chart-track</code>, so the data sits on the same quiet grey everywhere.
      </p>
    </DocSection>

    <DocSection
      id="identity"
      title="Identity colours"
      description="Eight pastel pairs for avatars and calendar events. They do not follow the brand, so a person or a calendar keeps its colour when you switch."
    >
      <div class="doc-identity">
        <div v-for="(i, k) in identities" :key="i" class="doc-identity__item">
          <span class="doc-identity__chip" :style="{ background: `var(--r-identity-${i})`, color: `var(--r-identity-${i}-text)` }">
            {{ peopleByIndex[k] ? initialsOf(peopleByIndex[k] as string) : 'Aa' }}
          </span>
          <code class="doc-identity__token">identity-{{ i }}</code>
        </div>
      </div>
      <TokenRows :rows="identityRows" />
      <Demo title="Same name, same colour" note="The colour comes from a hash of the name, so it never changes between screens.">
        <RAvatar v-for="name in people" :key="name" :name="name" size="lg" />
      </Demo>
    </DocSection>

    <DocSection
      id="semantic"
      title="Semantic tokens"
      description="These are the names components actually use. Below are both themes side by side, measured live: the contrast numbers are real, worked out from the colours your browser is drawing."
    >
      <div class="doc-themes">
        <div v-for="theme in ['light', 'dark']" :key="theme" class="doc-theme-panel" :data-theme="theme">
          <p class="doc-theme-panel__title">{{ theme === 'light' ? 'Light' : 'Dark' }}</p>
          <div v-for="group in semanticGroups" :key="group.title" class="doc-theme-panel__group">
            <p class="doc-theme-panel__group-title">{{ group.title }}</p>
            <TokenRows :rows="group.rows" />
          </div>
        </div>
      </div>
      <p class="doc-p">
        A theme is just a block that re-points these names. Because the block keys off
        <code class="doc-c">data-theme</code> rather than the page, any element can be a theme island. The command
        palette and the tooltips use this to stay dark on a light page, and the two panels above use it to show both
        themes at once.
      </p>
      <DoDont
        do="Read semantic tokens in components: --r-bg-surface, --r-text-secondary, --r-border."
        dont="Reach for a primitive like --r-blue-500 or --r-neutral-200 in a component. It will look right in one theme and wrong in the other."
      />
    </DocSection>
  </DocPage>
</template>

<style>
.doc-samples {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 20px 16px;
  width: 100%;
}

.doc-sample-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.doc-sample-group__chips {
  display: flex;
  overflow: hidden;
  height: 44px;
  margin-bottom: 6px;
  border-radius: var(--r-radius-md);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--r-text) 8%, transparent);
}

.doc-sample {
  flex: 1;
}

.doc-sample-group__name {
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-semibold);
}

.doc-sample-group__note {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: 11px;
  line-height: 1.45;
}
.doc-sample-group__note:last-child {
  font-family: var(--r-font-sans);
  font-size: var(--r-text-xs);
}

.doc-colour-intro {
  margin: 28px 0 72px;
}

.doc-grid--3-ramps {
  grid-template-columns: repeat(auto-fit, minmax(min(240px, 100%), 1fr));
}

.doc-brand-ramp {
  position: relative;
  padding: 12px;
  border: 1px solid var(--r-border-subtle);
  border-radius: var(--r-radius-lg);
  background: var(--r-bg-surface);
}
.doc-brand-ramp.is-active {
  border-color: var(--r-brand-border);
}

.doc-brand-ramp__badge {
  position: absolute;
  top: 10px;
  right: 12px;
}

.doc-brand-islands {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(200px, 100%), 1fr));
  gap: 12px;
  width: 100%;
}

.doc-brand-island {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px;
  border: 1px solid var(--r-border-subtle);
  border-radius: var(--r-radius-lg);
  background: var(--r-bg-surface);
  pointer-events: none;
}

.doc-brand-island__name {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
  font-weight: var(--r-weight-medium);
}

.doc-tones {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(280px, 100%), 1fr));
  gap: 16px;
}

.doc-tone {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 18px 18px 8px;
  border: 1px solid var(--r-border-subtle);
  border-radius: var(--r-radius-lg);
  background: var(--r-bg-surface);
}

.doc-tone__head {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.doc-tone__name {
  font-weight: var(--r-weight-semibold);
}

.doc-tone__note {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-sm);
}

.doc-colour-chart {
  width: 100%;
  padding: 20px;
  border-radius: var(--r-radius-lg);
  background: var(--r-bg-surface);
}

.doc-identity {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(84px, 1fr));
  gap: 12px;
}

.doc-identity__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.doc-identity__chip {
  display: grid;
  place-items: center;
  width: 100%;
  aspect-ratio: 1.3;
  border-radius: var(--r-radius-lg);
  font-size: var(--r-text-xl);
  font-weight: var(--r-weight-semibold);
}

.doc-identity__token {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: 11px;
}

.doc-themes {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(380px, 100%), 1fr));
  gap: 16px;
}

.doc-theme-panel {
  display: flex;
  flex-direction: column;
  gap: 18px;
  min-width: 0;
  padding: 20px 20px 8px;
  border: 1px solid var(--r-border);
  border-radius: var(--r-radius-xl);
  background: var(--r-bg-canvas);
}

.doc-theme-panel__title {
  font-size: var(--r-text-lg);
  font-weight: var(--r-weight-semibold);
}

.doc-theme-panel__group {
  padding: 4px 14px;
  border: 1px solid var(--r-border-subtle);
  border-radius: var(--r-radius-lg);
  background: var(--r-bg-surface);
}

.doc-theme-panel__group-title {
  padding: 10px 0 4px;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
  font-weight: var(--r-weight-medium);
}
</style>
