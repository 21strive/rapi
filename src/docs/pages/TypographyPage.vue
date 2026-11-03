<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RReadout, RStat, RTrend, formatNumber } from '@/design-system'
import DocPage from '../components/DocPage.vue'
import DocSection from '../components/DocSection.vue'
import Demo from '../components/Demo.vue'
import CodeBlock from '../components/CodeBlock.vue'
import DoDont from '../components/DoDont.vue'

/* ── Families ───────────────────────────────────────────────────────────────── */
const families = [
  {
    name: 'Geist',
    role: 'Reads',
    cls: 'type-family--sans',
    specimen: 'Aa',
    sample: 'Settlement & clearing',
    text: 'Titles, body text and values. A plain grotesque with true tabular figures, sharp enough at 13px and calm at 72px.',
  },
  {
    name: 'Geist Mono',
    role: 'Labels',
    cls: 'type-family--mono',
    specimen: 'Aa',
    sample: 'Batch 0412 · 14:02 WIB',
    text: 'Eyebrows, table heads, axis ticks, units, ids, timestamps and statuses, in capitals with 10% tracking. Also code.',
  },
  {
    name: 'Geist Pixel',
    role: 'Readouts',
    cls: 'type-family--pixel',
    specimen: '88',
    sample: 'T+00:01:12',
    text: 'One instrument readout per screen at most: a clock, a counter, a launch timer. Two cuts ship with Rapi, Circle and Square.',
  },
]

const weights = [
  { weight: 400, name: 'Regular', use: 'Body text, table cells' },
  { weight: 500, name: 'Medium', use: 'Labels in forms, buttons, nav' },
  { weight: 600, name: 'SemiBold', use: 'Titles, values, mono labels' },
  { weight: 700, name: 'Bold', use: 'Rare: emphasis inside long text' },
]

/* ── The brand book's three styles ─────────────────────────────────────────── */
const styles = [
  {
    name: 'Small header',
    face: 'Geist Mono Bold',
    rule: 'All caps · +10% letter spacing',
    cls: 'type-style--small',
    sample: 'Settlement report',
    note: '.r-eyebrow sets it for screens at 11px, one weight lighter in SemiBold, which stays crisp at that size.',
  },
  {
    name: 'Big header',
    face: 'Geist SemiBold',
    rule: '−4% letter spacing',
    cls: 'type-style--big',
    sample: 'Settlement & clearing',
    note: '.r-display-xl and .r-display use −4%; smaller headings ease off towards 0.',
  },
  {
    name: 'Body text',
    face: 'Geist Regular',
    rule: '1.5 line spacing',
    cls: 'type-style--body',
    sample:
      'Batch 0412 settles 1,284 payments across BI-FAST and RTGS before the 17:00 WIB cut-off. Payments that miss the window roll into the first batch tomorrow, and the treasury desk sees them in the forecast as a hatched bar.',
    note: '.r-body is 14px at 1.5 for interfaces; .r-body-lg is 16px for reading.',
  },
]

/* ── Scale ──────────────────────────────────────────────────────────────────── */
interface ScaleRow {
  cls: string
  sample: string
  use: string
  extra?: string
}

const scale: ScaleRow[] = [
  { cls: 'r-display-xl', sample: '1,284,500', use: 'Hero figures, covers' },
  { cls: 'r-display', sample: 'Cash position', use: 'Page heroes, KPI values' },
  { cls: 'r-h1', sample: 'Settlement batches', use: 'Page titles' },
  { cls: 'r-h2', sample: 'Liquidity forecast', use: 'Section titles' },
  { cls: 'r-h3', sample: 'Payments due this week', use: 'Panel titles' },
  { cls: 'r-title', sample: 'FX exposure against limits', use: 'Small panel and dialog titles' },
  { cls: 'r-body-lg', sample: 'Lead paragraphs and longer reading.', use: 'Intros, docs' },
  { cls: 'r-body', sample: 'The default for interface text, 14px at 1.5.', use: 'Everything else' },
  { cls: 'r-body-sm', sample: 'Descriptions under labels, menu hints, table notes.', use: 'Secondary text' },
  { cls: 'r-caption', sample: 'Updated 14:02 WIB by Dewi Lestari', use: 'Hints, footnotes' },
  { cls: 'r-eyebrow', sample: 'Settlement · Batch 0412', use: 'The small header: eyebrows, table heads' },
  { cls: 'r-label', sample: 'Last sync 07:02 UTC', use: 'Quiet metadata: units, ids, ticks' },
  { cls: 'r-index', sample: '01   02   03', use: 'Running numbers' },
  { cls: 'r-mono', sample: 'txn_7Hq2kP9x · 0x4F2A', use: 'Ids, hashes, code in text', extra: 'r-body' },
  { cls: 'r-pixel', sample: 'T+00:01:12', use: 'One readout per screen', extra: 'type-scale__pixel' },
]

const specimens = ref<(HTMLElement | null)[]>([])
const specs = ref<string[]>([])

function readSpecs() {
  specs.value = specimens.value.map((el) => {
    if (!el) return ''
    const style = getComputedStyle(el)
    const size = parseFloat(style.fontSize)
    const lineHeight = style.lineHeight === 'normal' ? 'normal' : `${Math.round(parseFloat(style.lineHeight))}`
    const ls = style.letterSpacing === 'normal' ? 0 : parseFloat(style.letterSpacing) / size
    const tracking = Math.abs(ls) < 0.001 ? '0' : `${ls > 0 ? '+' : '−'}${Math.round(Math.abs(ls) * 1000) / 10}%`
    const family = style.fontFamily.includes('Pixel') ? 'Pixel' : style.fontFamily.includes('Mono') ? 'Mono' : 'Sans'
    return `${family} · ${Math.round(size)}/${lineHeight} · ${tracking} · ${style.fontWeight}`
  })
}

const sizes = [
  { token: '--r-text-3xs', px: 10 },
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
  { token: '--r-text-6xl', px: 72 },
]

/* ── Numbers ────────────────────────────────────────────────────────────────── */
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

const ledger = [
  { item: 'BI-FAST', count: 1141, amount: 21118.11 },
  { item: 'RTGS', count: 98, amount: 1490.8 },
  { item: 'SKNBI', count: 4706, amount: 70901 },
  { item: 'SWIFT', count: 311, amount: 9421.64 },
]
const money = (v: number) => formatNumber(v, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const formats = [
  { kind: 'Thousands', write: '1,284,500', not: '1284500' },
  { kind: 'Change', write: '+1.9% · −0.4 pp', not: '1.9% · -0.4pp' },
  { kind: 'Unit', write: '37.2 °C · 1,284 RPS', not: '37.2°C · 1284rps' },
  { kind: 'Money', write: 'IDR 48.21 B · USD 4.1 M', not: 'Rp48210000000' },
  { kind: 'Time', write: '14:02 WIB · 07:02 UTC', not: '2:02 PM' },
  { kind: 'Date', write: '12 Nov 2026', not: '11/12/26' },
]

const fontSnippet = [
  "import '@fontsource-variable/geist'",
  "import '@fontsource-variable/geist-mono'",
  '// Geist Pixel ships in src/design-system/fonts and loads the first time a readout needs it.',
].join('\n')

const tokenSnippet = `:root {
  --r-font-sans: 'Geist Variable', 'Geist', ui-sans-serif, system-ui, sans-serif;
  --r-font-mono: 'Geist Mono Variable', 'Geist Mono', ui-monospace, monospace;
  --r-font-pixel: 'Geist Pixel Circle', 'Geist Mono Variable', ui-monospace, monospace;
}`

const numberSnippet = `<RStat label="Cash on hand · IDR" :value="48.21" :decimals="2" unit="B" :trend="1.9" />
<RReadout label="Chamber pressure" :value="97.2" unit="bar" font="pixel" />

<!-- Anywhere else numbers line up or change -->
<td class="r-numeric">1,141</td>

// In script: a true minus for anything you format yourself
withMinus(formatPercent(-0.4))   // "−0.4%"`
</script>

<template>
  <DocPage eyebrow="Foundations" title="Typography">
    <template #lead>
      Two voices. Geist reads: titles, body text and values. Geist Mono labels: eyebrows, table heads, axis ticks,
      units, ids, timestamps and statuses, in capitals with 10% tracking. Geist Pixel is kept for one instrument readout
      per screen at most.
    </template>

    <DocSection
      id="typeface"
      title="Typefaces"
      description="All three come from the Geist family, made by Vercel with basement.studio and free under the SIL Open Font License. Geist and Geist Mono are the faces of the 21 Strive brand book."
    >
      <div class="type-families r-grid-ruled">
        <article v-for="(f, i) in families" :key="f.name" class="type-family" :class="f.cls">
          <span class="type-family__top">
            <span class="r-index">{{ String(i + 1).padStart(2, '0') }}</span>
            <span class="type-family__role">{{ f.role }}</span>
          </span>
          <span class="type-family__specimen" aria-hidden="true">{{ f.specimen }}</span>
          <span class="type-family__name">{{ f.name }}</span>
          <span class="type-family__sample">{{ f.sample }}</span>
          <span class="type-family__text">{{ f.text }}</span>
        </article>
      </div>

      <div class="type-weights r-grid-ruled">
        <div v-for="w in weights" :key="w.weight" class="type-weight">
          <span class="type-weight__sample" :style="{ fontWeight: w.weight }">Rp 2,589</span>
          <span class="type-weight__name">{{ w.weight }} · {{ w.name }}</span>
          <span class="type-weight__use">{{ w.use }}</span>
        </div>
      </div>

      <h3 class="doc-h4">The brand book's three styles</h3>
      <p class="doc-p">
        The 21 Strive brand book names three styles. Everything in the type scale below is one of them at a different
        size.
      </p>
      <div class="type-styles">
        <div v-for="(s, i) in styles" :key="s.name" class="type-style" :class="s.cls">
          <div class="type-style__spec">
            <span class="r-index">{{ String(i + 1).padStart(2, '0') }}</span>
            <span class="type-style__name">{{ s.name }}</span>
            <span class="type-style__face">{{ s.face }}</span>
            <span class="type-style__rule">{{ s.rule }}</span>
          </div>
          <div class="type-style__body">
            <p class="type-style__sample">{{ s.sample }}</p>
            <p class="type-style__note">{{ s.note }}</p>
          </div>
        </div>
      </div>

      <CodeBlock :code="fontSnippet" lang="ts" title="Loading the fonts" />
      <CodeBlock :code="tokenSnippet" lang="css" title="tokens.css" />
    </DocSection>

    <DocSection
      id="scale"
      title="Type scale"
      description="Every class sets size, line height, tracking and weight together. The figures next to each sample are read from the rendered text, so they are always current."
    >
      <div class="type-scale">
        <div v-for="(row, i) in scale" :key="row.cls" class="type-scale__row">
          <div class="type-scale__meta">
            <code class="type-scale__class">.{{ row.cls }}</code>
            <span class="type-scale__spec">{{ specs[i] }}</span>
            <span class="type-scale__use">{{ row.use }}</span>
          </div>
          <p
            :ref="(el) => (specimens[i] = el as HTMLElement | null)"
            class="type-scale__sample"
            :class="[row.cls, row.extra]"
          >
            {{ row.sample }}
          </p>
        </div>
      </div>
      <p class="doc-p">
        Big type gets tighter tracking and a shorter line height; small type gets neither. The mono labels are the only
        styles with positive tracking, because capitals need the room.
      </p>
      <div class="type-sizes">
        <div v-for="s in sizes" :key="s.token" class="type-size">
          <span class="type-size__glyph" :style="{ fontSize: `var(${s.token})` }">Ag</span>
          <code class="type-size__token">{{ s.token.replace('--r-text-', '') }}</code>
          <span class="type-size__px">{{ s.px }}</span>
        </div>
      </div>
    </DocSection>

    <DocSection
      id="numbers"
      title="Numbers"
      description="Numbers are instruments. Figures that line up or update use tabular digits, hero figures use proportional ones, units are small and in mono caps, and a negative number gets a true minus sign."
    >
      <Demo title="Tabular in columns" note="The same six digits in Geist at 56px, measured in your browser.">
        <div class="type-tnum">
          <div class="type-tnum__col">
            <span class="doc-label">Proportional, the default</span>
            <span :ref="(el) => (digitRefs[0] = el as HTMLElement | null)" class="type-tnum__digits">111111</span>
            <span :ref="(el) => (digitRefs[1] = el as HTMLElement | null)" class="type-tnum__digits">000000</span>
            <span class="type-tnum__width">{{ Math.round(widths[0] ?? 0) }} and {{ Math.round(widths[1] ?? 0) }} px wide</span>
          </div>
          <div class="type-tnum__col">
            <span class="doc-label">Tabular, .r-numeric</span>
            <span :ref="(el) => (digitRefs[2] = el as HTMLElement | null)" class="type-tnum__digits r-numeric">111111</span>
            <span :ref="(el) => (digitRefs[3] = el as HTMLElement | null)" class="type-tnum__digits r-numeric">000000</span>
            <span class="type-tnum__width">{{ Math.round(widths[2] ?? 0) }} and {{ Math.round(widths[3] ?? 0) }} px wide</span>
          </div>
        </div>
      </Demo>

      <div class="type-numbers r-grid-ruled">
        <div class="type-numbers__cell">
          <span class="r-eyebrow">Columns line up</span>
          <table class="type-ledger">
            <caption class="r-sr-only">Payments by rail</caption>
            <thead>
              <tr>
                <th scope="col">Rail</th>
                <th scope="col" class="is-num">Count</th>
                <th scope="col" class="is-num">USD</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in ledger" :key="row.item">
                <td>{{ row.item }}</td>
                <td class="is-num">{{ formatNumber(row.count) }}</td>
                <td class="is-num">{{ money(row.amount) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="type-numbers__cell">
          <span class="r-eyebrow">Hero figures are proportional</span>
          <RStat label="Cash on hand · IDR" :value="48.21" :decimals="2" unit="B" :trend="1.9" trend-label="vs yesterday" size="xl" />
        </div>
        <div class="type-numbers__cell">
          <span class="r-eyebrow">Units in mono caps</span>
          <div class="type-units">
            <span class="type-unit"><span class="type-unit__value">1,284</span><span class="type-unit__unit">RPS</span></span>
            <span class="type-unit"><span class="type-unit__value">37.2</span><span class="type-unit__unit">°C</span></span>
            <span class="type-unit"><span class="type-unit__value">182</span><span class="type-unit__unit">ms</span></span>
          </div>
        </div>
        <div class="type-numbers__cell">
          <span class="r-eyebrow">A true minus</span>
          <div class="type-minus">
            <span class="type-minus__row"><span class="type-minus__glyph">−1.9%</span><span class="doc-label">U+2212 minus</span></span>
            <span class="type-minus__row is-wrong"><span class="type-minus__glyph">-1.9%</span><span class="doc-label">Hyphen, not this</span></span>
          </div>
          <div class="doc-row">
            <RTrend :value="1.9" />
            <RTrend :value="-0.4" suffix=" pp" />
          </div>
        </div>
      </div>

      <Demo title="One readout per screen" note="Geist Pixel is the instrument voice. Use it once, for the number people glance at from across the room.">
        <div class="type-readouts">
          <RReadout label="Launch window" value="T−00:04:12" font="pixel" size="lg" tone="signal" sub="Hold at T−00:02:00" />
          <RReadout label="Chamber pressure" :value="97.2" :decimals="1" unit="bar" size="lg" sub="Max 110 · Nominal" />
        </div>
      </Demo>

      <div class="doc-scroll">
        <table class="doc-spec type-formats">
          <caption class="r-sr-only">How to write numbers</caption>
          <thead>
            <tr>
              <th scope="col">Kind</th>
              <th scope="col">Write</th>
              <th scope="col">Not</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="f in formats" :key="f.kind">
              <td>{{ f.kind }}</td>
              <td class="type-formats__write">{{ f.write }}</td>
              <td class="type-formats__not">{{ f.not }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <CodeBlock :code="numberSnippet" title="Usage" />

      <DoDont
        do="Use tabular figures for anything that updates live, counts up, or sits in a column, so digits stop jittering."
        dont="Set a unit at the same size and colour as its number, or glue it on. 2,589KCAL reads as one long word; 2,589 KCAL with a quiet unit reads as a measurement."
      />
    </DocSection>
  </DocPage>
</template>

<style>
/* ── Families ────────────────────────────────────────────────────────────── */
.type-families.r-grid-ruled {
  grid-template-columns: repeat(auto-fit, minmax(min(240px, 100%), 1fr));
}

.type-family {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
  padding: 14px 16px 20px;
}

.type-family__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.type-family__role {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-caps);
  text-transform: uppercase;
}

.type-family__specimen {
  margin: 12px 0 4px;
  font-size: 96px;
  font-weight: var(--r-weight-semibold);
  line-height: 1;
  letter-spacing: var(--r-tracking-display);
}

.type-family--mono .type-family__specimen {
  font-family: var(--r-font-mono);
  font-weight: var(--r-weight-medium);
  letter-spacing: 0;
}

.type-family--pixel .type-family__specimen {
  font-family: var(--r-font-pixel);
  font-weight: 400;
  letter-spacing: 0.02em;
}

.type-family__name {
  font-size: var(--r-text-xl);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-snug);
}

.type-family__sample {
  overflow: hidden;
  color: var(--r-text);
  font-size: var(--r-text-md);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.type-family--mono .type-family__sample {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-caps);
  text-transform: uppercase;
}

.type-family--pixel .type-family__sample {
  font-family: var(--r-font-pixel-square);
  font-size: var(--r-text-xl);
  font-variant-numeric: tabular-nums;
}

.type-family__text {
  color: var(--r-text-secondary);
  font-size: var(--r-text-sm);
  line-height: 1.55;
}

.type-weights.r-grid-ruled {
  grid-template-columns: repeat(auto-fit, minmax(min(170px, 100%), 1fr));
}

.type-weight {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  padding: 14px 16px 16px;
}

.type-weight__sample {
  font-size: var(--r-text-2xl);
  letter-spacing: var(--r-tracking-tight);
}

.type-weight__name {
  margin-top: 6px;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-caps);
  text-transform: uppercase;
}

.type-weight__use {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

/* ── Brand book styles: spec on the left, sample on the right, as on slide 7 ─ */
.type-styles {
  border-top: 1px solid var(--r-border-strong);
}

.type-style {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: 16px 32px;
  padding: 20px 0 24px;
  border-bottom: 1px solid var(--r-border);
}

.type-style__spec {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.type-style__name {
  margin-top: 6px;
  font-size: var(--r-text-md);
  font-weight: var(--r-weight-semibold);
}

.type-style__face {
  color: var(--r-text-secondary);
  font-size: var(--r-text-sm);
}

.type-style__rule {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: var(--r-tracking-caps);
  text-transform: uppercase;
}

.type-style__body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.type-style--small .type-style__sample {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xl);
  font-weight: var(--r-weight-bold);
  letter-spacing: var(--r-tracking-caps);
  text-transform: uppercase;
}

.type-style--big .type-style__sample {
  font-size: clamp(var(--r-text-4xl), 5.4vw, var(--r-text-6xl));
  font-weight: var(--r-weight-semibold);
  line-height: 0.98;
  letter-spacing: var(--r-tracking-display);
}

.type-style--body .type-style__sample {
  max-width: 60ch;
  font-size: var(--r-text-lg);
  line-height: var(--r-leading-normal);
}

.type-style__note {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

@media (max-width: 720px) {
  .type-style {
    grid-template-columns: minmax(0, 1fr);
  }
}

/* ── Scale ───────────────────────────────────────────────────────────────── */
.type-scale {
  border-top: 1px solid var(--r-border-strong);
}

.type-scale__row {
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
  align-items: center;
  gap: 24px;
  padding: 16px 0;
  border-bottom: 1px solid var(--r-border-subtle);
}

.type-scale__meta {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.type-scale__class {
  color: var(--r-text);
  font-family: var(--r-font-mono);
  font-size: 12px;
  font-weight: var(--r-weight-semibold);
}

.type-scale__spec {
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}

.type-scale__use {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

.type-scale__sample {
  min-width: 0;
  overflow-wrap: anywhere;
}

.type-scale__pixel {
  font-size: var(--r-text-3xl);
}

@media (max-width: 720px) {
  .type-scale__row {
    grid-template-columns: minmax(0, 1fr);
    gap: 10px;
  }
}

.type-sizes {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 12px 20px;
  padding: 20px;
  border: 1px solid var(--r-border);
  background: var(--r-bg-surface);
}

.type-size {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.type-size__glyph {
  font-weight: var(--r-weight-semibold);
  line-height: 1;
  letter-spacing: var(--r-tracking-tight);
}

.type-size__token {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: 11px;
}

.type-size__px {
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}

/* ── Numbers ─────────────────────────────────────────────────────────────── */
.type-tnum {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(240px, 100%), 1fr));
  gap: 24px 40px;
  width: 100%;
}

.type-tnum__col {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.type-tnum__digits {
  font-size: 56px;
  font-weight: var(--r-weight-semibold);
  line-height: 1.05;
  letter-spacing: 0;
  box-shadow: inset -2px 0 0 var(--r-brand);
}

.type-tnum__width {
  margin-top: 6px;
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  text-transform: uppercase;
}

.type-numbers.r-grid-ruled {
  grid-template-columns: repeat(auto-fit, minmax(min(300px, 100%), 1fr));
}

.type-numbers__cell {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
  padding: 14px 16px 18px;
}

.type-ledger {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--r-text-sm);
}
.type-ledger th {
  padding: 0 0 8px;
  border-bottom: 1px solid var(--r-border);
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-caps);
  text-align: left;
  text-transform: uppercase;
}
.type-ledger td {
  padding: 7px 0;
  border-bottom: 1px solid var(--r-border-subtle);
}
.type-ledger .is-num {
  font-family: var(--r-font-mono);
  font-size: 12.5px;
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.type-units {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 28px;
}

.type-unit {
  display: inline-flex;
  align-items: baseline;
  gap: 5px;
}

.type-unit__value {
  font-size: var(--r-text-3xl);
  font-weight: var(--r-weight-semibold);
  line-height: 1;
  letter-spacing: var(--r-tracking-tighter);
}

.type-unit__unit {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-caps);
  text-transform: uppercase;
}

.type-minus {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.type-minus__row {
  display: flex;
  align-items: baseline;
  gap: 14px;
}

.type-minus__glyph {
  min-width: 4.2em;
  font-size: var(--r-text-3xl);
  font-weight: var(--r-weight-semibold);
  line-height: 1.1;
  letter-spacing: var(--r-tracking-tight);
  font-variant-numeric: tabular-nums;
}

.type-minus__row.is-wrong .type-minus__glyph {
  color: var(--r-text-tertiary);
}

.type-readouts {
  display: flex;
  flex-wrap: wrap;
  gap: 24px 48px;
}

.type-formats__write {
  font-family: var(--r-font-mono);
  font-size: 12px;
  color: var(--r-text) !important;
}

.type-formats__not {
  font-family: var(--r-font-mono);
  font-size: 12px;
  color: var(--r-text-tertiary) !important;
}
</style>
