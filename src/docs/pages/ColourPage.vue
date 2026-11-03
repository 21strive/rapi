<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  RAvatar,
  RBadge,
  RButton,
  RCheckbox,
  RColumnChart,
  RHeatmap,
  RLineChart,
  RStatus,
  RSwitch,
  formatNumber,
  identityIndex,
  initialsOf,
  type StatusTone,
} from '@/design-system'
import DocPage from '../components/DocPage.vue'
import DocSection from '../components/DocSection.vue'
import Demo from '../components/Demo.vue'
import CodeBlock from '../components/CodeBlock.vue'
import DoDont from '../components/DoDont.vue'
import ColorRamp from '../components/ColorRamp.vue'
import TokenRows, { type TokenRow } from '../components/TokenRows.vue'
import { contrast, describe, useTokenColors, type RGBA } from '../components/color'

const RAMP = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950']
const ramp = (name: string) => RAMP.map((step) => ({ token: `--r-${name}-${step}`, label: step }))

/* ── The brand book palette ─────────────────────────────────────────────────── */
const palette = [
  { token: '--r-cobalt-700', role: 'Primary brand colour', hex: '#1B3AAB', on: '#fff', grow: 5 },
  { token: '--r-cobalt-400', role: 'Secondary brand colour', hex: '#7E94E2', on: '#151515', grow: 2.2 },
  { token: '--r-neutral-900', role: 'Primary black', hex: '#151515', on: '#fff', grow: 2.2 },
  { token: '--r-signal-500', role: 'Signal', hex: '#FF4F00', on: '#151515', grow: 1.4 },
]

/* ── Neutrals ───────────────────────────────────────────────────────────────── */
const neutralSteps = ['0', '25', '50', '100', '150', '200', '300', '400', '500', '600', '700', '800', '850', '900', '950'].map(
  (step) => ({ token: `--r-neutral-${step}`, label: step }),
)

const neutralRows: TokenRow[] = [
  { token: '--r-neutral-900', sample: 'text', on: '--r-neutral-0', note: 'Primary text, the 21 Strive black' },
  { token: '--r-neutral-600', sample: 'text', on: '--r-neutral-0', note: 'Secondary text' },
  { token: '--r-neutral-500', sample: 'text', on: '--r-neutral-0', note: 'Tertiary text: hints, axis labels, placeholders' },
  { token: '--r-neutral-500', sample: 'text', on: '--r-neutral-25', note: 'The same tertiary text on the light canvas' },
  { token: '--r-neutral-500', sample: 'text', on: '--r-neutral-100', note: 'And on a hovered row' },
  { token: '--r-neutral-400', sample: 'text', on: '--r-neutral-0', note: 'Disabled text only, never for reading' },
]

/* ── Cobalt ─────────────────────────────────────────────────────────────────── */
const cobaltMarks = { '--r-cobalt-700': 'Primary', '--r-cobalt-400': 'Secondary' }
const brandRows: TokenRow[] = [
  { token: '--r-brand', note: 'The primary action, selection, the current tab' },
  { token: '--r-on-brand', sample: 'text', on: '--r-brand', note: 'Label on a cobalt fill' },
  { token: '--r-brand-text', sample: 'text', on: '--r-bg-surface', note: 'Links and selected labels' },
  { token: '--r-brand-text', sample: 'text', on: '--r-brand-soft', note: 'On a selected row or a soft badge' },
  { token: '--r-brand-secondary', note: 'Periwinkle: supergraphics and chart slot 7. Under 3:1 on white, so never text' },
  { token: '--r-focus', sample: 'border', note: 'The 2px focus line' },
]
const weekends = ref(true)
const sync = ref(true)

/* ── Signal ─────────────────────────────────────────────────────────────────── */
const signalRows: TokenRow[] = [
  { token: '--r-signal', note: 'Live lamps, the now line, live and urgent buttons' },
  { token: '--r-on-signal', sample: 'text', on: '--r-signal', note: 'Labels on orange are black: white only reaches 3.3:1' },
  { token: '--r-signal-text', sample: 'text', on: '--r-bg-surface', note: 'Signal text on a surface' },
  { token: '--r-signal-text', sample: 'text', on: '--r-signal-soft', note: 'On the soft tint' },
]
const minutes = ['13:50', '13:52', '13:54', '13:56', '13:58', '14:00', '14:02', '14:04', '14:06', '14:08']
const throughput = [1180, 1214, 1196, 1242, 1268, 1251, 1284, null, null, null]

/* ── Status ─────────────────────────────────────────────────────────────────── */
const tones = [
  { tone: 'success', name: 'Success', ramp: 'green', words: ['Paid', 'Settled'], note: 'Done, paid, settled, a change for the better' },
  { tone: 'warning', name: 'Warning', ramp: 'amber', words: ['In review', 'Pending'], note: 'Waiting, degraded, close to a limit' },
  { tone: 'danger', name: 'Danger', ramp: 'red', words: ['Failed', 'Blocked'], note: 'Errors, critical alarms, destructive actions' },
] as const

const toneRows = (tone: string): TokenRow[] => [
  { token: `--r-${tone}`, note: 'Solid: filled badges and buttons' },
  { token: `--r-${tone}-soft`, note: 'Soft tint' },
  { token: `--r-${tone}-text`, sample: 'text', on: `--r-${tone}-soft`, note: 'Text on the tint' },
  { token: `--r-${tone}-border`, sample: 'border', note: 'Outline variants' },
]

const lamps: { tone: StatusTone; label: string; token: string }[] = [
  { tone: 'success', label: 'Nominal', token: '--r-status-good' },
  { tone: 'warning', label: 'Degraded', token: '--r-status-warning' },
  { tone: 'danger', label: 'Critical', token: '--r-status-critical' },
  { tone: 'neutral', label: 'Offline', token: '--r-status-off' },
]

const toneVars = [
  { name: '--tone-solid', use: 'Filled backgrounds: solid buttons and badges, checked boxes.' },
  { name: '--tone-solid-hover', use: 'Hover state of the filled background.' },
  { name: '--tone-on-solid', use: 'Text and icons on the filled background.' },
  { name: '--tone-soft', use: 'Tinted backgrounds: soft badges and buttons.' },
  { name: '--tone-soft-hover', use: 'Hover state of the tint.' },
  { name: '--tone-text', use: 'Text on the tint and in outline variants.' },
  { name: '--tone-border', use: 'Borders of outline variants.' },
  { name: '--tone-lamp', use: 'The status lamp of that tone.' },
]

const toneSnippet = `<RBadge tone="success">Paid</RBadge>
<RButton variant="soft" tone="danger">Delete key</RButton>
<RStatus tone="signal" label="Live" pulse />

<!-- Or on your own markup: the class fills in the --tone-* variables -->
<span class="my-tag r-tone-warning">In review</span>`

const toneCss = `.my-tag {
  border: 1px solid var(--tone-border);
  background: var(--tone-soft);
  color: var(--tone-text);
}`

/* ── Data ───────────────────────────────────────────────────────────────────── */
const slotTokens = Array.from({ length: 8 }, (_, i) => `--r-chart-${i + 1}`)
const slotNames = ['Cobalt', 'Orange', 'Teal', 'Amber', 'Magenta', 'Green', 'Periwinkle', 'Red']

const lightIsland = ref<HTMLElement | null>(null)
const darkIsland = ref<HTMLElement | null>(null)
const islandTokens = () => [...slotTokens, '--r-chart-surface']
const { colors: lightColors } = useTokenColors(lightIsland, islandTokens)
const { colors: darkColors } = useTokenColors(darkIsland, islandTokens)

function slotRows(colors: Record<string, RGBA | null>) {
  const surface = colors['--r-chart-surface']
  return slotTokens.map((token, i) => {
    const c = colors[token]
    const ratio = c && surface ? contrast(c, surface) : null
    return { token, index: String(i + 1).padStart(2, '0'), name: slotNames[i], hex: describe(c), ratio }
  })
}
const lightSlots = computed(() => slotRows(lightColors.value))
const darkSlots = computed(() => slotRows(darkColors.value))

const checks = [
  { check: 'Lightness band, OKLCH L', light: 'All 8 inside 0.43–0.77', dark: 'All 8 inside 0.48–0.67' },
  { check: 'Chroma floor, OKLCH C', light: 'All 8 ≥ 0.10', dark: 'All 8 ≥ 0.10' },
  { check: 'Neighbours, colour-blind ΔE', light: '≥ 11.9 (target 8)', dark: '≥ 9.2 (target 8)' },
  { check: 'Neighbours, normal vision ΔE', light: '≥ 25.0 (floor 15)', dark: '≥ 20.6 (floor 15)' },
  { check: 'All pairs, slots 1–3', light: 'Pass, ΔE ≥ 16.4', dark: 'Pass, ΔE ≥ 16.4' },
  { check: 'Contrast against the surface', light: '6 of 8 ≥ 3:1. Amber 2.3:1, periwinkle 2.9:1', dark: 'All 8 ≥ 3:1' },
]

const weeks = ['W36', 'W37', 'W38', 'W39', 'W40', 'W41', 'W42', 'W43', 'W44', 'W45']
const railSeries = [
  { name: 'BI-FAST', values: [41, 44, 43, 47, 49, 48, 52, 55, 54, 58] },
  { name: 'RTGS', values: [28, 27, 29, 31, 30, 32, 31, 33, 35, 34] },
  { name: 'SKNBI', values: [19, 21, 20, 18, 22, 21, 23, 22, 21, 24] },
  { name: 'SWIFT', values: [9, 10, 9, 11, 12, 11, 13, 12, 14, 13] },
]
const branches = ['JKT', 'SBY', 'BDG', 'MDN', 'SMG', 'DPS', 'MKS', 'PLM']
const branchVolume = [64, 41, 37, 29, 26, 22, 18, 15]

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const hours = ['00', '02', '04', '06', '08', '10', '12', '14', '16', '18', '20', '22']
const load = days.map((_, d) =>
  hours.map((_, h) => {
    const day = d < 5 ? 1 : 0.55
    const curve = Math.max(0.08, Math.sin(((h - 2.5) / 12) * Math.PI))
    return Math.round(1200 * day * curve + ((d * 7 + h * 3) % 11) * 18)
  }),
)

const seqSteps = Array.from({ length: 9 }, (_, i) => ({ token: `--r-seq-${i}`, label: String(i) }))
const divSteps = [
  { token: '--r-div-neg', label: 'neg' },
  { token: '--r-div-neg-soft', label: 'neg soft' },
  { token: '--r-div-mid', label: 'mid' },
  { token: '--r-div-pos-soft', label: 'pos soft' },
  { token: '--r-div-pos', label: 'pos' },
]
const levels = [
  { token: '--r-status-good', label: 'Good', note: 'green 500' },
  { token: '--r-status-warning', label: 'Warning', note: 'amber 400' },
  { token: '--r-status-serious', label: 'Serious', note: 'signal 400' },
  { token: '--r-status-critical', label: 'Critical', note: 'red 600' },
  { token: '--r-status-off', label: 'Off', note: 'neutral 400' },
]

const chartRows: TokenRow[] = [
  { token: '--r-chart-context', note: 'Everything that is not the story, in emphasis charts' },
  { token: '--r-chart-ink', note: 'Targets and reference marks' },
  { token: '--r-chart-now', note: 'The current-time line and live points' },
  { token: '--r-chart-grid', sample: 'border', note: 'Gridlines, solid 1px' },
  { token: '--r-chart-axis', sample: 'border', note: 'The baseline and tick marks' },
  { token: '--r-chart-label', sample: 'text', on: '--r-bg-surface', note: 'Axis ticks and labels' },
  { token: '--r-chart-track', note: 'Empty tracks behind meters and bars' },
]

/* ── Identity ───────────────────────────────────────────────────────────────── */
const identities = Array.from({ length: 8 }, (_, i) => i + 1)
const identityHues = ['Cobalt', 'Orange', 'Teal', 'Amber', 'Magenta', 'Green', 'Grey', 'Red']
const identityRows: TokenRow[] = identities.map((i) => ({
  token: `--r-identity-${i}-text`,
  sample: 'text',
  on: `--r-identity-${i}`,
  note: `${identityHues[i - 1]}: text on --r-identity-${i}`,
}))

const people = [
  'Anastasia Wijaya',
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
  'Raka Pratama',
  'Priya Nair',
  'Tomás Ortega',
  'Hana Sato',
  'Mei Lin',
]
const peopleByIndex = computed(() => identities.map((i) => people.find((name) => identityIndex(name) === i) ?? null))

/* ── Semantic ───────────────────────────────────────────────────────────────── */
const semanticGroups: { title: string; rows: TokenRow[] }[] = [
  {
    title: 'Surfaces',
    rows: [
      { token: '--r-bg-canvas', note: 'The page behind the panels' },
      { token: '--r-bg-surface', note: 'Panels, tables, inputs' },
      { token: '--r-bg-raised', note: 'Menus, popovers, dialogs' },
      { token: '--r-bg-muted', note: 'Table heads, wells' },
      { token: '--r-bg-hover', note: 'Hovered rows and items' },
      { token: '--r-bg-selected', note: 'The selected row' },
      { token: '--r-bg-overlay', note: 'Behind dialogs' },
    ],
  },
  {
    title: 'Lines',
    rows: [
      { token: '--r-border-subtle', sample: 'border', note: 'Rules inside a panel' },
      { token: '--r-border', sample: 'border', note: 'Panels and section rules' },
      { token: '--r-border-strong', sample: 'border', note: 'Inputs and floating panels' },
    ],
  },
  {
    title: 'Text',
    rows: [
      { token: '--r-text', sample: 'text', on: '--r-bg-surface', note: 'Titles, values, body' },
      { token: '--r-text-secondary', sample: 'text', on: '--r-bg-surface', note: 'Descriptions, labels' },
      { token: '--r-text-tertiary', sample: 'text', on: '--r-bg-surface', note: 'Hints, axis labels, metadata' },
      { token: '--r-text-tertiary', sample: 'text', on: '--r-bg-canvas', note: 'Tertiary on the canvas' },
      { token: '--r-text-tertiary', sample: 'text', on: '--r-bg-hover', note: 'Tertiary on hover' },
      { token: '--r-text-disabled', sample: 'text', on: '--r-bg-surface', note: 'Disabled only' },
    ],
  },
  {
    title: 'Ink, brand and signal',
    rows: [
      { token: '--r-ink', note: 'The default button, the current page' },
      { token: '--r-on-ink', sample: 'text', on: '--r-ink', note: 'Text on ink' },
      { token: '--r-brand', note: 'The primary action, selection' },
      { token: '--r-on-brand', sample: 'text', on: '--r-brand', note: 'Text on cobalt' },
      { token: '--r-brand-text', sample: 'text', on: '--r-bg-surface', note: 'Links' },
      { token: '--r-signal', note: 'Live and now' },
      { token: '--r-on-signal', sample: 'text', on: '--r-signal', note: 'Text on orange' },
    ],
  },
]
</script>

<template>
  <DocPage eyebrow="Foundations" title="Colour">
    <template #lead>
      Ink and greys do almost all the work. Cobalt marks the brand, the selection and the one primary action in a flow;
      International Orange marks what is live, now, or needs eyes. Every ramp is built in OKLCH on one lightness scale,
      so step 600 of any hue sits at the same perceived lightness.
    </template>

    <figure class="colour-palette">
      <div class="colour-palette__band">
        <div
          v-for="p in palette"
          :key="p.token"
          class="colour-palette__block"
          :style="{ background: `var(${p.token})`, color: p.on, flexGrow: p.grow }"
        >
          <span class="colour-palette__role">{{ p.role }}</span>
          <span class="colour-palette__hex">{{ p.hex }}</span>
        </div>
      </div>
      <figcaption class="colour-palette__caption">
        The three colours of the 21 Strive brand book, in their proportions, with International Orange added as the
        signal. Tokens never use these hex values directly: they sit inside the ramps below.
      </figcaption>
    </figure>

    <DocSection
      id="neutrals"
      title="Neutrals"
      description="Pure grey with no tint, fifteen steps from white to near black. Step 900 is the 21 Strive black. Hints and axis labels sit on white, on the canvas and on hovered rows, so step 500 is tuned to pass AA on all three."
    >
      <ColorRamp :steps="neutralSteps" :columns="8" highlight="--r-neutral-500" :marks="{ '--r-neutral-900': 'Black' }" />
      <TokenRows :rows="neutralRows" />
      <p class="doc-p">
        The light canvas is <code class="doc-c">--r-neutral-25</code> and panels are pure white, so panels separate
        from the page by a hairline more than by tone. Dark mode does not run this ramp backwards; it has its own greys
        around #151515, listed under semantic tokens below.
      </p>
    </DocSection>

    <DocSection
      id="brand"
      title="Cobalt"
      description="21 Strive cobalt, #1B3AAB, is step 700 and the brand book's periwinkle, #7E94E2, is step 400. The steps around them were built in OKLCH so the ramp stays even from tint to ink."
    >
      <ColorRamp :steps="ramp('cobalt')" :marks="cobaltMarks" />
      <Demo title="Where cobalt goes" note="The primary action, selection, focus and links. Nothing else.">
        <RButton tone="brand">Approve batch</RButton>
        <RCheckbox v-model="weekends" label="Include weekends" />
        <RSwitch v-model="sync" aria-label="Sync ledger" />
        <RBadge tone="brand">Selected</RBadge>
        <a class="doc-link" href="#brand" @click.prevent>View statement</a>
      </Demo>
      <TokenRows :rows="brandRows" />
      <DoDont
        do="Use cobalt for the one primary action in a flow, for selection (checked boxes, the selected row, the current tab) and for focus."
        dont="Paint headings, icons or illustrations cobalt to add some brand. When everything is cobalt, the action people came to do stops standing out."
      />
    </DocSection>

    <DocSection
      id="signal"
      title="Signal"
      description="International Orange, #FF4F00, is the colour of aerospace safety markings. In Rapi it marks what is live, what is happening now, and the one thing on a screen that needs eyes. It is never an error and never decoration."
    >
      <ColorRamp :steps="ramp('signal')" :marks="{ '--r-signal-500': 'Signal' }" />
      <Demo title="Live, now, needs eyes" note="A live lamp, a live action and the now line on a chart." stack>
        <div class="doc-row">
          <RStatus tone="signal" label="Live" pulse />
          <RButton tone="signal">Go live</RButton>
          <RBadge tone="signal">T−00:04:12</RBadge>
        </div>
        <div class="colour-now">
          <RLineChart
            :labels="minutes"
            :series="[{ name: 'Payments per minute', values: throughput }]"
            :height="140"
            :now="6"
            :min="1100"
            :max="1300"
            :y-ticks="2"
            :axis-format="(v: number) => formatNumber(v)"
            :format="(v: number) => formatNumber(v)"
            y-unit="Per min"
            label="Payments settled per minute, 13:50 to 14:02 WIB, with the current minute marked"
          />
        </div>
      </Demo>
      <TokenRows :rows="signalRows" />
      <DoDont
        do="Keep one orange thing per view: the live lamp, the now line, the alarm that needs acknowledging."
        dont="Use orange for errors, warnings or emphasis. Errors are red with an icon, warnings are amber with a word, and emphasis is ink."
      />
    </DocSection>

    <DocSection
      id="status"
      title="Status"
      description="Green for good, amber for warning, red for critical and destructive. Each comes with a solid, a soft tint, a text colour that passes AA on the tint, and a border. A status colour never appears without a word or an icon."
    >
      <div class="colour-tones r-grid-ruled">
        <div v-for="t in tones" :key="t.tone" class="colour-tone">
          <div class="colour-tone__head">
            <span class="colour-tone__name">{{ t.name }}</span>
            <span class="colour-tone__note">{{ t.note }}</span>
          </div>
          <ColorRamp :steps="ramp(t.ramp)" size="sm" :title="t.ramp" />
          <div class="doc-row">
            <RBadge :tone="t.tone">{{ t.words[0] }}</RBadge>
            <RBadge :tone="t.tone" variant="outline">{{ t.words[1] }}</RBadge>
            <RBadge :tone="t.tone" variant="solid">{{ t.words[0] }}</RBadge>
          </div>
          <TokenRows :rows="toneRows(t.tone)" />
        </div>
      </div>

      <Demo title="Lamps" note="A lamp is a circle because it is a state. It always comes with its word.">
        <div v-for="l in lamps" :key="l.token" class="colour-lamp">
          <RStatus :tone="l.tone" :label="l.label" />
          <code>{{ l.token }}</code>
        </div>
      </Demo>

      <p class="doc-p">
        Components never hard-code these colours. A badge, a button, a lamp or an alert reads a small set of
        <code class="doc-c">--tone-*</code> variables, and a class such as <code class="doc-c">r-tone-warning</code> fills
        them in. That is why one component covers every status, and why your own markup can borrow a tone with a single
        class. The tones are neutral, brand, signal, success, warning and danger.
      </p>
      <div class="doc-scroll">
        <table class="doc-spec">
          <caption class="r-sr-only">Tone variables</caption>
          <thead>
            <tr>
              <th scope="col">Variable</th>
              <th scope="col">What reads it</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="v in toneVars" :key="v.name">
              <td><code>{{ v.name }}</code></td>
              <td>{{ v.use }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <CodeBlock :code="toneSnippet" title="Usage" />
      <CodeBlock :code="toneCss" lang="css" title="Your own CSS" />
      <DoDont
        do="Pair every status colour with a word, a lamp label or an icon: PAID, DEGRADED, a triangle on a warning."
        dont="Tell two states apart by red and green alone. About one in twelve men cannot see the difference."
      />
    </DocSection>

    <DocSection
      id="data"
      title="Data"
      description="Charts have their own tokens, and every colour in a chart does one job: identity, magnitude, polarity, state or emphasis. The categorical palette was checked with a validator in both themes, not picked by eye."
    >
      <h3 class="doc-h4">Identity: eight categorical slots</h3>
      <p class="doc-p">
        Series take slots in order, 1 to 8, and keep them: a filter that hides a series never repaints the others, and
        a ninth series folds into Other instead of getting a new hue. Slot 1 is cobalt, so a chart with one series is
        always in the brand colour.
      </p>
      <div class="colour-slots">
        <div
          v-for="island in [
            { theme: 'light', title: 'Light, on #FFFFFF', rows: lightSlots },
            { theme: 'dark', title: 'Dark, on #151515', rows: darkSlots },
          ]"
          :key="island.theme"
          :ref="(el) => (island.theme === 'light' ? (lightIsland = el as HTMLElement | null) : (darkIsland = el as HTMLElement | null))"
          class="colour-slots__island"
          :data-theme="island.theme"
        >
          <p class="colour-slots__title">{{ island.title }}</p>
          <ol class="colour-slots__list">
            <li v-for="row in island.rows" :key="row.token" class="colour-slot">
              <span class="colour-slot__index">{{ row.index }}</span>
              <span class="colour-slot__swatch" :style="{ background: `var(${row.token})` }" aria-hidden="true" />
              <span class="colour-slot__name">{{ row.name }}</span>
              <code class="colour-slot__hex">{{ row.hex }}</code>
              <span class="colour-slot__ratio" :class="{ 'is-low': row.ratio !== null && row.ratio < 3 }">
                {{ row.ratio ? `${row.ratio.toFixed(1)}:1` : '' }}
              </span>
            </li>
          </ol>
        </div>
      </div>
      <div class="doc-scroll">
        <table class="doc-spec colour-checks">
          <caption class="r-sr-only">Palette validation results</caption>
          <thead>
            <tr>
              <th scope="col">Check</th>
              <th scope="col">Light</th>
              <th scope="col">Dark</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in checks" :key="c.check">
              <td>{{ c.check }}</td>
              <td>{{ c.light }}</td>
              <td>{{ c.dark }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="doc-p">
        ΔE is the distance between two colours in OKLab, times 100. The colour-blind check simulates protanopia and
        deuteranopia and compares neighbours, because in lines, stacks and bars only neighbours touch. Amber and
        periwinkle sit under 3:1 on white, so a chart that uses slot 4 or 7 labels those series directly and keeps its
        data table.
      </p>
      <Demo title="Four series" surface="plain" note="Slots 1 to 4 in order, with a legend.">
        <div class="colour-chart">
          <RLineChart :labels="weeks" :series="railSeries" :height="220" legend y-unit="IDR T" label="Weekly settlement value by payment rail, in trillions of rupiah" />
        </div>
      </Demo>

      <h3 class="doc-h4">Emphasis: one in cobalt, the rest in grey</h3>
      <p class="doc-p">
        When a chart is about one thing, that thing is cobalt and everything else is
        <code class="doc-c">--r-chart-context</code>. It is the fastest way to say what to look at without a single word.
      </p>
      <Demo title="Emphasis" surface="plain">
        <div class="colour-chart">
          <RColumnChart
            :labels="branches"
            :values="branchVolume"
            :highlight="0"
            :height="200"
            :max="80"
            :format="(v: number) => String(v)"
            :axis-format="(v: number) => String(v)"
            y-unit="IDR B"
            label="Settlement value by branch in billions of rupiah, Jakarta highlighted"
          />
        </div>
      </Demo>

      <h3 class="doc-h4">Magnitude: the cobalt ramp</h3>
      <p class="doc-p">
        How much of something is one hue from light to dark, never a rainbow. In dark mode the ramp flips, so more always
        means more contrast with the page.
      </p>
      <div class="colour-pair">
        <div data-theme="light" class="colour-pair__island"><ColorRamp :steps="seqSteps" title="Light" size="md" /></div>
        <div data-theme="dark" class="colour-pair__island"><ColorRamp :steps="seqSteps" title="Dark" size="md" /></div>
      </div>
      <Demo title="Payment load by hour" surface="plain">
        <div class="colour-chart">
          <RHeatmap :rows="days" :cols="hours" :values="load" :cell-height="22" legend label="Payments per hour by weekday and hour of day, WIB" />
        </div>
      </Demo>

      <h3 class="doc-h4">Polarity: cobalt and orange through grey</h3>
      <p class="doc-p">
        Above or below a baseline, gain or loss, ahead or behind plan. Cobalt is the positive side, orange the negative,
        and the midpoint is a grey that reads as nothing, so zero never looks like a value.
      </p>
      <div class="colour-pair">
        <div data-theme="light" class="colour-pair__island"><ColorRamp :steps="divSteps" title="Light" /></div>
        <div data-theme="dark" class="colour-pair__island"><ColorRamp :steps="divSteps" title="Dark" /></div>
      </div>

      <h3 class="doc-h4">State: four levels</h3>
      <p class="doc-p">
        When a value means good or bad, like an error rate or a pass rate, it wears the status levels instead of a series
        colour, and never both in one chart. They do not change with the theme, and they always come with a label.
      </p>
      <ul class="colour-levels r-grid-ruled">
        <li v-for="l in levels" :key="l.token" class="colour-level">
          <span class="colour-level__swatch" :style="{ background: `var(${l.token})` }" aria-hidden="true" />
          <span class="colour-level__label">{{ l.label }}</span>
          <code class="colour-level__token">{{ l.token }}</code>
          <span class="colour-level__note">{{ l.note }}</span>
        </li>
      </ul>

      <h3 class="doc-h4">Chart furniture</h3>
      <TokenRows :rows="chartRows" />
    </DocSection>

    <DocSection
      id="identity"
      title="Identity colours"
      description="Eight tinted pairs for avatars, calendars and tags. The hues are fixed, so a person or a calendar keeps its colour on every screen; dark mode uses deeper tints of the same hues."
    >
      <div class="colour-identity r-grid-ruled">
        <div v-for="(i, k) in identities" :key="i" class="colour-identity__item">
          <span class="colour-identity__chip" :style="{ background: `var(--r-identity-${i})`, color: `var(--r-identity-${i}-text)` }">
            {{ peopleByIndex[k] ? initialsOf(peopleByIndex[k] as string) : 'Aa' }}
          </span>
          <span class="colour-identity__name">{{ identityHues[k] }}</span>
          <code class="colour-identity__token">identity-{{ i }}</code>
        </div>
      </div>
      <TokenRows :rows="identityRows" />
      <Demo title="Same name, same colour" note="The colour comes from a hash of the name, so it never changes between screens.">
        <RAvatar v-for="name in people.slice(0, 12)" :key="name" :name="name" size="lg" />
      </Demo>
    </DocSection>

    <DocSection
      id="semantic"
      title="Semantic tokens"
      description="These are the names components use. Both themes are side by side and measured live: the contrast figures come from the colours your browser is drawing right now."
    >
      <div class="colour-themes">
        <div v-for="theme in ['light', 'dark']" :key="theme" class="colour-theme" :data-theme="theme">
          <p class="colour-theme__title">{{ theme === 'light' ? 'Light' : 'Dark' }}</p>
          <div v-for="group in semanticGroups" :key="group.title" class="colour-theme__group">
            <p class="colour-theme__group-title">{{ group.title }}</p>
            <TokenRows :rows="group.rows" />
          </div>
        </div>
      </div>
      <p class="doc-p">
        A theme is a block that re-points these names. It keys off <code class="doc-c">data-theme</code> rather than the
        page, so any element can be a theme island: the command palette and the tooltips stay dark on a light page, and
        the two panels above show both themes at once.
      </p>
      <DoDont
        do="Read semantic tokens in components and screens: --r-bg-surface, --r-text-secondary, --r-border."
        dont="Reach for a primitive like --r-cobalt-600 or --r-neutral-200 in a component. It will look right in one theme and wrong in the other."
      />
    </DocSection>
  </DocPage>
</template>

<style>
/* ── The brand book palette ──────────────────────────────────────────────── */
.colour-palette {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 0;
}

.colour-palette__band {
  display: flex;
  min-height: 184px;
  border: 1px solid var(--r-border);
}

.colour-palette__block {
  display: flex;
  flex-basis: 0;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  padding: 12px;
}

.colour-palette__role,
.colour-palette__hex {
  overflow: hidden;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: var(--r-tracking-caps);
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
}

.colour-palette__role {
  font-weight: var(--r-weight-semibold);
}

.colour-palette__caption {
  max-width: 68ch;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-sm);
  line-height: 1.5;
}

@media (max-width: 640px) {
  .colour-palette__band {
    flex-direction: column;
    min-height: 0;
  }
  .colour-palette__block {
    flex-basis: auto;
    min-height: 64px;
  }
}

/* ── Signal ──────────────────────────────────────────────────────────────── */
.colour-now {
  width: 100%;
  max-width: 560px;
  padding: 12px 16px 8px;
  border: 1px solid var(--r-border);
  background: var(--r-bg-surface);
}

/* ── Status ──────────────────────────────────────────────────────────────── */
.colour-tones.r-grid-ruled {
  grid-template-columns: repeat(auto-fit, minmax(min(260px, 100%), 1fr));
}

.colour-tone {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
  padding: 16px 16px 6px;
}

.colour-tone__head {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.colour-tone__name {
  font-weight: var(--r-weight-semibold);
}

.colour-tone__note {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-sm);
}

.colour-lamp {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 140px;
}

.colour-lamp code {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: 11px;
}

/* ── Data ────────────────────────────────────────────────────────────────── */
.colour-slots {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(300px, 100%), 1fr));
  border-top: 1px solid var(--r-border);
  border-left: 1px solid var(--r-border);
}

.colour-slots__island {
  min-width: 0;
  padding: 12px 16px 8px;
  border-right: 1px solid var(--r-border);
  border-bottom: 1px solid var(--r-border);
  background: var(--r-bg-surface);
}

.colour-slots__title {
  padding-bottom: 8px;
  color: var(--r-text);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-caps);
  text-transform: uppercase;
}

.colour-slot {
  display: grid;
  grid-template-columns: 22px 40px minmax(0, 1fr) auto 52px;
  align-items: center;
  gap: 10px;
  min-height: 34px;
  border-top: 1px solid var(--r-border-subtle);
}

.colour-slot__index {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
}

.colour-slot__swatch {
  height: 18px;
}

.colour-slot__name {
  font-size: var(--r-text-sm);
}

.colour-slot__hex,
.colour-slot__ratio {
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}

.colour-slot__ratio {
  text-align: right;
}

.colour-slot__ratio.is-low {
  color: var(--r-warning-text);
}

.colour-checks td:not(:first-child) {
  font-family: var(--r-font-mono);
  font-size: 12px;
}

.colour-chart {
  width: 100%;
  padding: 16px;
  border: 1px solid var(--r-border);
  background: var(--r-bg-surface);
}

.colour-pair {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  border-top: 1px solid var(--r-border);
  border-left: 1px solid var(--r-border);
}

.colour-pair__island {
  min-width: 0;
  padding: 14px 16px 16px;
  border-right: 1px solid var(--r-border);
  border-bottom: 1px solid var(--r-border);
  background: var(--r-bg-surface);
}

.colour-levels.r-grid-ruled {
  grid-template-columns: repeat(auto-fit, minmax(min(150px, 100%), 1fr));
}

.colour-level {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  padding: 12px 12px 14px;
}

.colour-level__swatch {
  height: 28px;
  margin-bottom: 6px;
}

.colour-level__label {
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-semibold);
}

.colour-level__token {
  overflow: hidden;
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.colour-level__note {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

/* ── Identity ────────────────────────────────────────────────────────────── */
.colour-identity.r-grid-ruled {
  grid-template-columns: repeat(8, minmax(0, 1fr));
}

@media (max-width: 900px) {
  .colour-identity.r-grid-ruled {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

.colour-identity__item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  padding: 10px;
}

.colour-identity__chip {
  display: grid;
  place-items: center;
  aspect-ratio: 1.4;
  font-size: var(--r-text-xl);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-tight);
}

.colour-identity__name {
  margin-top: 4px;
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-medium);
}

.colour-identity__token {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: 11px;
}

/* ── Semantic ────────────────────────────────────────────────────────────── */
.colour-themes {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(380px, 100%), 1fr));
  border-top: 1px solid var(--r-border);
  border-left: 1px solid var(--r-border);
}

.colour-theme {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
  padding: 16px 16px 8px;
  border-right: 1px solid var(--r-border);
  border-bottom: 1px solid var(--r-border);
  background: var(--r-bg-canvas);
}

.colour-theme__title {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-caps);
  text-transform: uppercase;
}

.colour-theme__group {
  padding: 2px 12px;
  border: 1px solid var(--r-border);
  background: var(--r-bg-surface);
}

.colour-theme__group-title {
  padding: 10px 0 4px;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-caps);
  text-transform: uppercase;
}
</style>
