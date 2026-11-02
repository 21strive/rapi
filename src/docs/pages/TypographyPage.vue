<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RStat, RTable, RTrend, formatNumber, type TableColumn } from '@/design-system'
import DocPage from '../components/DocPage.vue'
import DocSection from '../components/DocSection.vue'
import Demo from '../components/Demo.vue'
import CodeBlock from '../components/CodeBlock.vue'
import DoDont from '../components/DoDont.vue'

interface ScaleRow {
  cls: string
  sample: string
  use: string
}

const scale: ScaleRow[] = [
  { cls: 'r-display-xl', sample: '$25,912', use: 'Hero numbers' },
  { cls: 'r-display', sample: '129,521', use: 'KPI values' },
  { cls: 'r-h1', sample: 'Sales overview', use: 'Page titles' },
  { cls: 'r-h2', sample: 'Sales summary', use: 'Section titles' },
  { cls: 'r-h3', sample: 'Recent transactions', use: 'Card titles on big cards' },
  { cls: 'r-title', sample: 'Finance balance', use: 'Card titles, dialog titles' },
  { cls: 'r-body-lg', sample: 'Lead paragraphs and longer reading.', use: 'Intros' },
  { cls: 'r-body', sample: 'The default for UI text, 14px.', use: 'Everything else' },
  { cls: 'r-body-sm', sample: 'Descriptions under labels and in menus.', use: 'Secondary text' },
  { cls: 'r-caption', sample: 'Updated 2 minutes ago', use: 'Hints, axis labels' },
  { cls: 'r-overline', sample: 'Main menu', use: 'Small group labels' },
]

const specimens = ref<(HTMLElement | null)[]>([])
const specs = ref<string[]>([])

function readSpecs() {
  specs.value = specimens.value.map((el) => {
    if (!el) return ''
    const style = getComputedStyle(el)
    const size = parseFloat(style.fontSize)
    const lineHeight = style.lineHeight === 'normal' ? 'normal' : `${Math.round(parseFloat(style.lineHeight))}px`
    const ls = style.letterSpacing === 'normal' ? 0 : parseFloat(style.letterSpacing) / size
    const tracking = Math.abs(ls) < 0.001 ? '0' : `${ls > 0 ? '+' : '−'}${Math.abs(ls).toFixed(3).replace(/0+$/, '')}em`
    return `${Math.round(size)}px / ${lineHeight} · ${tracking} · ${style.fontWeight}`
  })
}

/* Tabular figures, measured live: the same six digits, with and without tnum. */
const digitRefs = ref<(HTMLElement | null)[]>([])
const widths = ref<number[]>([])

function readWidths() {
  widths.value = digitRefs.value.map((el) => (el ? el.getBoundingClientRect().width : 0))
}

onMounted(async () => {
  await document.fonts.ready
  readSpecs()
  readWidths()
})

const weights = [
  { weight: 400, name: 'Regular', use: 'Body text' },
  { weight: 500, name: 'Medium', use: 'Labels, buttons, nav' },
  { weight: 600, name: 'Semibold', use: 'Titles and numbers' },
  { weight: 700, name: 'Bold', use: 'Rarely, for emphasis inside long text' },
]

const sizes = [
  { token: '--r-text-2xs', px: 11 },
  { token: '--r-text-xs', px: 12 },
  { token: '--r-text-sm', px: 13 },
  { token: '--r-text-md', px: 14 },
  { token: '--r-text-lg', px: 16 },
  { token: '--r-text-xl', px: 18 },
  { token: '--r-text-2xl', px: 24 },
  { token: '--r-text-3xl', px: 32 },
  { token: '--r-text-4xl', px: 40 },
  { token: '--r-text-5xl', px: 56 },
]

const ledgerColumns: TableColumn[] = [
  { key: 'item', label: 'Item' },
  { key: 'orders', label: 'Orders', numeric: true, format: (v: number) => formatNumber(v) },
  { key: 'revenue', label: 'Revenue', numeric: true, format: (v: number) => `$${formatNumber(v, { minimumFractionDigits: 2 })}` },
]
const ledger = [
  { id: 1, item: 'Leather jacket', orders: 1141, revenue: 21118.11 },
  { id: 2, item: 'Canvas tote', orders: 98, revenue: 1490.8 },
  { id: 3, item: 'Wool scarf', orders: 4706, revenue: 70901.0 },
  { id: 4, item: 'Rain boots', orders: 311, revenue: 9421.64 },
]

const install = `import '@fontsource-variable/plus-jakarta-sans'

/* tokens.css */
:root {
  --r-font-sans: 'Plus Jakarta Sans Variable', 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif;
}`

const numberSnippet = `<RStat label="Heart rate" value="40–189" unit="bpm" size="xl" />
<RStat :value="25912.43" prefix="$" :decimals="2" muted-decimals size="xl" />

<!-- Anywhere else numbers line up or change -->
<td class="r-numeric">1,141</td>`
</script>

<template>
  <DocPage eyebrow="Foundations" title="Typography">
    <template #lead>
      One family, Plus Jakarta Sans, at a 14px base. Interface text stays small and calm, so the numbers can be the
      biggest thing on the screen, and numbers always use tabular figures.
    </template>

    <DocSection
      id="typeface"
      title="Typeface"
      description="Plus Jakarta Sans comes from Tokotype, a type foundry in Jakarta. It was drawn for the city's own branding and is free to use under the SIL Open Font License."
    >
      <div class="doc-typeface">
        <div class="doc-typeface__specimen" aria-hidden="true">Aa</div>
        <div class="doc-typeface__body">
          <p class="doc-typeface__name">Plus Jakarta Sans</p>
          <p class="doc-typeface__glyphs" aria-hidden="true">
            ABCDEFGHIJKLMNOPQRSTUVWXYZ<br />abcdefghijklmnopqrstuvwxyz<br />0123456789 $ % + − → ⌘
          </p>
        </div>
      </div>
      <p class="doc-p">
        We wanted a typeface that felt as clean as the references without being another neutral grotesque. Jakarta Sans
        has a tall x-height that holds up at 13 and 14px, open shapes, and round, friendly numerals that look good at 56px.
        It ships as one variable file with a weight axis from 200 to 800, and it has true tabular figures, which a
        dashboard cannot do without. It also happens to come from the same city as the name of this system.
      </p>
      <div class="doc-weights">
        <div v-for="w in weights" :key="w.weight" class="doc-weight">
          <span class="doc-weight__sample" :style="{ fontWeight: w.weight }">Rapi 2,589</span>
          <span class="doc-weight__name">{{ w.weight }} · {{ w.name }}</span>
          <span class="doc-weight__use">{{ w.use }}</span>
        </div>
      </div>
      <CodeBlock :code="install" lang="ts" title="Loading the font" />
    </DocSection>

    <DocSection
      id="scale"
      title="Type scale"
      description="Ten sizes from 11 to 56px. Every class sets size, line height, tracking and weight together; the numbers next to each sample are read from the rendered text, so they are always current."
    >
      <div class="doc-scale">
        <div v-for="(row, i) in scale" :key="row.cls" class="doc-scale__row">
          <div class="doc-scale__meta">
            <code class="doc-c">.{{ row.cls }}</code>
            <span class="doc-scale__spec">{{ specs[i] }}</span>
            <span class="doc-scale__use">{{ row.use }}</span>
          </div>
          <p :ref="(el) => (specimens[i] = el as HTMLElement | null)" class="doc-scale__sample" :class="row.cls">
            {{ row.sample }}
          </p>
        </div>
      </div>
      <p class="doc-p">
        Big type gets tighter tracking and shorter line height; small type gets neither. The overline is the only style
        with positive tracking, because uppercase letters need the room.
      </p>
      <div class="doc-sizes">
        <div v-for="s in sizes" :key="s.token" class="doc-size">
          <span class="doc-size__glyph" :style="{ fontSize: `var(${s.token})` }">Ag</span>
          <code class="doc-size__token">{{ s.token.replace('--r-text-', '') }}</code>
          <span class="doc-size__px">{{ s.px }}</span>
        </div>
      </div>
    </DocSection>

    <DocSection
      id="numbers"
      title="Numbers"
      description="KPIs run 40 to 56px, semibold, tightly tracked. Units and decimals step back. And every number that updates or lines up in a column uses tabular figures."
    >
      <Demo title="Tabular figures" note="The same six digits, measured in your browser at 56px.">
        <div class="doc-tnum">
          <div class="doc-tnum__col">
            <span class="doc-label">Proportional (default)</span>
            <span :ref="(el) => (digitRefs[0] = el as HTMLElement | null)" class="doc-tnum__digits">111111</span>
            <span :ref="(el) => (digitRefs[1] = el as HTMLElement | null)" class="doc-tnum__digits">000000</span>
            <span class="doc-tnum__width">{{ Math.round(widths[0] ?? 0) }}px and {{ Math.round(widths[1] ?? 0) }}px wide</span>
          </div>
          <div class="doc-tnum__col">
            <span class="doc-label">Tabular, .r-numeric</span>
            <span :ref="(el) => (digitRefs[2] = el as HTMLElement | null)" class="doc-tnum__digits r-numeric">111111</span>
            <span :ref="(el) => (digitRefs[3] = el as HTMLElement | null)" class="doc-tnum__digits r-numeric">000000</span>
            <span class="doc-tnum__width">{{ Math.round(widths[2] ?? 0) }}px and {{ Math.round(widths[3] ?? 0) }}px wide</span>
          </div>
        </div>
      </Demo>

      <Demo title="KPI sizes" note="Muted units and decimals keep the number itself in front.">
        <div class="doc-kpis">
          <RStat label="Heart rate" value="40–189" unit="bpm" size="xl" />
          <RStat label="Balance" :value="25912.43" prefix="$" :decimals="2" muted-decimals size="xl" />
          <RStat label="Avg. energy" :value="2589" unit="kcal" size="lg" :trend="4.2" trend-label="than last week" />
          <RStat label="Total insight" :value="129521" size="lg" :trend="-1.2" trend-label="than last month" />
        </div>
      </Demo>

      <Demo title="Changes sit next to the number" note="Small pills, coloured by whether the change is good.">
        <RTrend :value="1.9" />
        <RTrend :value="-1.2" />
        <RTrend :value="12.4" icon />
        <RTrend :value="-3.1" invert icon />
        <RTrend :value="0" />
      </Demo>

      <Demo title="Columns line up" note="Numeric table columns are right-aligned and tabular." surface="plain" padding="none">
        <RTable :columns="ledgerColumns" :rows="ledger" caption="Orders and revenue by item" />
      </Demo>

      <CodeBlock :code="numberSnippet" title="Usage" />

      <DoDont
        do="Use tabular figures for anything that updates live, counts up, or sits in a column."
        dont="Set the unit at the same size and colour as the number. '2,589 kcal' reads as one long word."
      />
    </DocSection>
  </DocPage>
</template>

<style>
.doc-typeface {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 24px 40px;
  padding: 32px;
  border: 1px solid var(--r-border-subtle);
  border-radius: var(--r-radius-xl);
  background: var(--r-bg-surface);
}

.doc-typeface__specimen {
  font-size: clamp(96px, 16vw, 168px);
  font-weight: var(--r-weight-semibold);
  line-height: 0.9;
  letter-spacing: var(--r-tracking-tighter);
}

.doc-typeface__body {
  display: flex;
  flex: 1 1 260px;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.doc-typeface__name {
  font-size: var(--r-text-2xl);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-tight);
}

.doc-typeface__glyphs {
  overflow-wrap: anywhere;
  color: var(--r-text-secondary);
  font-size: var(--r-text-lg);
  line-height: 1.6;
}

.doc-weights {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(180px, 100%), 1fr));
  gap: 12px;
}

.doc-weight {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 16px;
  border: 1px solid var(--r-border-subtle);
  border-radius: var(--r-radius-lg);
  background: var(--r-bg-surface);
}

.doc-weight__sample {
  font-size: var(--r-text-2xl);
  font-variant-numeric: tabular-nums;
  letter-spacing: var(--r-tracking-tight);
}

.doc-weight__name {
  margin-top: 6px;
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-medium);
}

.doc-weight__use {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

.doc-scale {
  overflow: hidden;
  border: 1px solid var(--r-border-subtle);
  border-radius: var(--r-radius-xl);
  background: var(--r-bg-surface);
}

.doc-scale__row {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  align-items: center;
  gap: 24px;
  padding: 18px 24px;
  border-bottom: 1px solid var(--r-border-subtle);
}
.doc-scale__row:last-child {
  border-bottom: 0;
}

.doc-scale__meta {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.doc-scale__spec {
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: 11.5px;
  font-variant-numeric: tabular-nums;
}

.doc-scale__use {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

.doc-scale__sample {
  min-width: 0;
  overflow-wrap: anywhere;
}

@media (max-width: 720px) {
  .doc-scale__row {
    grid-template-columns: minmax(0, 1fr);
    gap: 10px;
    padding: 16px;
  }
}

.doc-sizes {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 8px 20px;
  padding: 24px;
  border: 1px solid var(--r-border-subtle);
  border-radius: var(--r-radius-xl);
  background: var(--r-bg-surface);
}

.doc-size {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.doc-size__glyph {
  font-weight: var(--r-weight-semibold);
  line-height: 1;
  letter-spacing: var(--r-tracking-tight);
}

.doc-size__token {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: 11px;
}

.doc-size__px {
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  font-variant-numeric: tabular-nums;
}

.doc-tnum {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(240px, 100%), 1fr));
  gap: 24px 40px;
  width: 100%;
}

.doc-tnum__col {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.doc-tnum__digits {
  font-size: 56px;
  font-weight: var(--r-weight-semibold);
  line-height: 1.05;
  letter-spacing: 0;
  box-shadow: inset -2px 0 0 var(--r-brand);
}

.doc-tnum__width {
  margin-top: 6px;
  color: var(--r-text-secondary);
  font-size: var(--r-text-sm);
  font-variant-numeric: tabular-nums;
}

.doc-kpis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(300px, 100%), 1fr));
  gap: 28px 32px;
  width: 100%;
}
</style>
