<script setup lang="ts">
import { ArrowRight, ArrowUpRight, MoreHorizontal } from 'lucide-vue-next'
import {
  RAvatar,
  RBarList,
  RButton,
  RCard,
  RChip,
  RColumnChart,
  RDotMatrixChart,
  RHeatmap,
  RIconButton,
  RLineChart,
  RRadialGauge,
  RRangeBars,
  RSparkline,
  RStat,
  RTrend,
  formatCompact,
  formatCurrency,
  formatNumber,
} from '@/design-system'
import DocPage from '../components/DocPage.vue'
import DocSection from '../components/DocSection.vue'
import Demo from '../components/Demo.vue'
import CodeBlock from '../components/CodeBlock.vue'
import PropsTable from '../components/PropsTable.vue'
import DoDont from '../components/DoDont.vue'
import type { PropRow } from '../types'

/* A tiny seeded wave so the sample data looks lived-in but never changes between reloads. */
const wave = (n: number, base: number, amp: number, seed: number) =>
  Array.from({ length: n }, (_, i) =>
    Math.round(base + amp * (0.6 * Math.sin(i / 2.1 + seed) + 0.3 * Math.sin(i / 0.9 + seed * 2) + 0.1 * Math.cos(i * 1.7))),
  )

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/* ── Dot matrix · Syncrowave sales summary ────────────────────────────────── */
const halfMonths = months.flatMap((m) => [`1–15 ${m}`, `16–${m === 'Feb' ? 28 : 30} ${m}`])
const halfMonthTicks = months.flatMap((m) => [m, ''])
const sales = [28, 34, 31, 42, 39, 47, 36, 44, 52, 58, 61, 70, 48, 41, 46, 53, 38, 44, 57, 63, 49, 55, 60, 66].map((v) => v * 1000)
const insight = [8, 12, 10, 14, 9, 13, 11, 10, 16, 12, 18, 22, 14, 10, 12, 15, 9, 11, 14, 19, 12, 16, 18, 20].map((v) => v * 1000)
const salesSeries = [
  { name: 'Sales', values: sales },
  { name: 'Insight', values: insight, color: 'var(--r-chart-1-soft)' },
]
const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const signups = [{ name: 'Sign-ups', values: [42, 58, 51, 66, 73, 38, 31], color: 'var(--r-chart-4)' }]
const customers = [
  { name: 'New', values: [18, 24, 21, 30, 34, 16, 12] },
  { name: 'Returning', values: [26, 31, 29, 35, 41, 22, 19], color: 'var(--r-chart-1-soft)' },
]

const dotCode = `<RDotMatrixChart
  :labels="['1–15 Jan', '16–31 Jan', /* … */]"
  :ticks="['Jan', '', 'Feb', '', /* … */]"
  :series="[
    { name: 'Sales', values: sales },
    { name: 'Insight', values: insight, color: 'var(--r-chart-1-soft)' },
  ]"
  label="Sales and insight, twice a month"
/>`

const dotProps: PropRow[] = [
  { name: 'labels', type: 'string[]', description: 'One per column. Used in the tooltip and the hidden data table.' },
  { name: 'ticks', type: 'string[]', description: 'Axis text per column; empty strings are skipped. Defaults to the labels, thinned to fit.' },
  { name: 'series', type: 'ChartSeries[]', description: '{ name, values, color? }. Stacked from the bottom up; each dot is the same amount.' },
  { name: 'height', type: 'number', default: '280', description: 'Total height in px. Dots stay round and as large as the columns allow.' },
  { name: 'max', type: 'number', description: 'Top of the scale. Defaults to a tidy number above the tallest stack.' },
  { name: 'yTicks', type: 'number', default: '4', description: 'Roughly how many gridlines.' },
  { name: 'showEmpty', type: 'boolean', default: 'true', description: 'Faint dots above each stack, so the grid reads as a whole.' },
  { name: 'format', type: '(v: number) => string', description: 'Formats values in the tooltip and table.' },
  { name: 'axisFormat', type: '(v: number) => string', description: 'Formats the y axis. Defaults to compact numbers (25K).' },
  { name: 'label', type: 'string', description: 'Accessible name. Required.' },
]

/* ── Line · Makaryo cashflow, banking statistics ──────────────────────────── */
const days = Array.from({ length: 30 }, (_, i) => `${i + 1} May`)
const revenues = wave(30, 11200, 3600, 0.4)
const expenditures = wave(30, 6400, 1900, 2.1)
const budgetSeries = [
  { name: 'Revenues', values: revenues },
  { name: 'Expenditures', values: expenditures, color: 'var(--r-chart-3)', area: false },
]
const statistics = [{ name: 'Visits', values: [412, 486, 451, 398, 727, 604, 538] }]
const balanceMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug']
const balance = [{ name: 'Balance', values: [14200, 15100, 14650, 16900, 16300, 17850, 18900, 19453], color: 'var(--r-chart-1)' }]

const lineCode = `<RLineChart
  :labels="days"
  :series="[
    { name: 'Revenues', values: revenues },
    { name: 'Expenditures', values: expenditures, color: 'var(--r-chart-3)', area: false },
  ]"
  :highlight="17"
  :format="(v) => formatCurrency(v)"
  legend
  label="Revenues and expenditures in May"
/>`

const lineProps: PropRow[] = [
  { name: 'labels', type: 'string[]', description: 'One per point, left to right.' },
  { name: 'series', type: 'LineSeries[]', description: '{ name, values, color?, area?, dashed? }. null values leave a gap in the line.' },
  { name: 'height', type: 'number', default: '240', description: 'Total height in px.' },
  { name: 'area', type: 'boolean', default: 'true', description: 'Soft gradient under the first series. A series can override it with its own area flag.' },
  { name: 'curve', type: "'monotone' | 'linear'", default: "'monotone'", description: 'Monotone is smooth but never overshoots, so a peak in the line is a peak in the data.' },
  { name: 'yTicks', type: 'number', default: '4', description: 'Roughly how many gridlines.' },
  { name: 'min / max', type: 'number', description: 'Fix the scale. By default it starts at 0 (or below, for negative data).' },
  { name: 'highlight', type: 'number | null', default: 'null', description: 'Index to mark with a soft bar and a value pill, like today or the best day.' },
  { name: 'hideYAxis', type: 'boolean', default: 'false', description: 'Drop the y labels in compact cards.' },
  { name: 'legend', type: 'boolean', default: 'false', description: 'Series names above the plot.' },
  { name: 'format / axisFormat', type: '(v: number) => string', description: 'Tooltip and axis formatting.' },
  { name: 'label', type: 'string', description: 'Accessible name. Required.' },
]

/* ── Sparkline · Coinex ───────────────────────────────────────────────────── */
const coins = [
  { name: 'Bitcoin', ticker: 'BTC', price: 1523, change: 3.6, values: [30, 32, 31, 35, 34, 38, 37, 41, 40, 44] },
  { name: 'Ethereum', ticker: 'ETH', price: 510, change: -1.2, values: [44, 41, 42, 39, 40, 37, 38, 35, 36, 34] },
  { name: 'Tezos', ticker: 'XTZ', price: 210, change: 0.8, values: [20, 21, 19, 22, 21, 23, 22, 22, 24, 23] },
]
const watchlist = [
  { name: 'Solana', ticker: 'SOL', price: 142.3, change: 5.1, values: [10, 12, 11, 15, 14, 17, 18, 21] },
  { name: 'Cardano', ticker: 'ADA', price: 0.46, change: -2.4, values: [20, 19, 20, 17, 18, 16, 15, 15] },
  { name: 'Polkadot', ticker: 'DOT', price: 6.82, change: 1.3, values: [14, 13, 15, 14, 15, 16, 15, 17] },
  { name: 'Chainlink', ticker: 'LINK', price: 14.05, change: -0.6, values: [16, 17, 16, 15, 16, 15, 16, 15] },
]

const sparkCode = `<RSparkline :values="[30, 32, 31, 35, 34, 38, 37, 41]" label="Bitcoin, last 7 days" />
<RSparkline :values="prices" :width="96" color="var(--r-chart-1)" :area="false" />`

const sparkProps: PropRow[] = [
  { name: 'values', type: 'number[]', description: 'The series. The scale fits the data, so small moves stay visible.' },
  { name: 'color', type: "'auto' | string", default: "'auto'", description: 'auto is green when the series ends higher than it starts, red when lower.' },
  { name: 'height', type: 'number', default: '32', description: 'Height in px.' },
  { name: 'width', type: 'number', description: 'Fixed width in px. Leave it out to fill the container.' },
  { name: 'area', type: 'boolean', default: 'true', description: 'Soft gradient under the line.' },
  { name: 'strokeWidth', type: 'number', default: '1.75', description: 'Line weight. It stays crisp at any width.' },
  { name: 'label', type: 'string', description: 'Accessible name. Defaults to “Trend from … to …”.' },
]

/* ── Radial gauge · Syncrowave sales category ─────────────────────────────── */
const categories = [
  { label: 'Ecommerce', value: 4820 },
  { label: 'Brand ambassador', value: 2394 },
  { label: 'Direct buy', value: 1000 },
]
const storage = [
  { label: 'Photos', value: 42, color: 'var(--r-chart-2)' },
  { label: 'Documents', value: 18, color: 'var(--r-chart-5)' },
  { label: 'Other', value: 9, color: 'var(--r-chart-6)' },
]

const gaugeCode = `<RRadialGauge
  :segments="[
    { label: 'Ecommerce', value: 4820 },
    { label: 'Brand ambassador', value: 2394 },
    { label: 'Direct buy', value: 1000 },
  ]"
  caption="Product sales"
  label="Product sales by category"
/>`

const gaugeProps: PropRow[] = [
  { name: 'segments', type: '{ label, value, color? }[]', description: 'Parts of the whole, in order around the arc. Defaults: brand, soft brand, grey.' },
  { name: 'max', type: 'number', description: 'Full scale. Leave it out for a full arc; set it to show what is left, like storage.' },
  { name: 'value', type: 'number | string', description: 'The big number in the middle. Defaults to the sum.' },
  { name: 'caption', type: 'string', description: 'Small text under the number.' },
  { name: 'bars', type: 'number', default: '30', description: 'Number of radial bars.' },
  { name: 'legend', type: 'boolean', default: 'true', description: 'Segment names under the arc. Hovering one highlights its bars and shows its value in the middle.' },
  { name: 'format', type: '(v: number) => string', description: 'Formats the numbers.' },
  { name: 'label', type: 'string', description: 'Accessible name. Required.' },
]

/* ── Heatmap · orders by time, attendance ─────────────────────────────────── */
const hours = ['8 AM', '10 AM', '12 PM', '2 PM', '4 PM', '6 PM', '8 PM']
const orders = hours.map((_, r) =>
  weekDays.map((_, c) => {
    const lunch = r === 2 ? 34 : r === 3 ? 22 : 0
    const evening = r >= 5 ? 18 : 0
    const weekend = c >= 5 ? 16 : 0
    return Math.round(12 + lunch + evening + weekend + 8 * Math.sin(r * 1.3 + c * 0.9))
  }),
)
const slots = ['11.00', '10.00', '09.30', '09.00', '08.30']
const workDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
const attendance = [
  [6, 5, 6, 7, 6],
  [14, 8, 9, 31, 12],
  [16, 15, 12, 34, 30],
  [33, 10, 14, 36, 35],
  [38, 36, 37, 40, 39],
]

const heatmapCode = `<RHeatmap
  :rows="['8 AM', '10 AM', '12 PM', '2 PM']"
  :cols="['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']"
  :values="orders"
  :format="(v) => \`\${v} orders\`"
  label="Orders by time of day"
/>`

const heatmapProps: PropRow[] = [
  { name: 'rows / cols', type: 'string[]', description: 'Labels down the side and along the bottom.' },
  { name: 'values', type: 'number[][]', description: 'values[row][col].' },
  { name: 'color', type: 'string', default: "'var(--r-chart-1)'", description: 'Colour at full intensity. Lower values mix toward the track colour.' },
  { name: 'min / max', type: 'number', description: 'Fix the colour scale. Defaults to the data range.' },
  { name: 'cellHeight', type: 'number', default: '30', description: 'Row height in px; columns share the width.' },
  { name: 'gap / radius', type: 'number', default: '4 / 6', description: 'Space between cells and their corner radius.' },
  { name: 'legend', type: 'boolean', default: 'true', description: 'A Less → More scale under the grid.' },
  { name: 'format', type: '(v: number) => string', description: 'Formats the tooltip value.' },
  { name: 'label', type: 'string', description: 'Accessible name. Required.' },
]

/* ── Range bars · heart rate ──────────────────────────────────────────────── */
const heartDays = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
const heartRanges: [number, number][] = [
  [48, 112],
  [40, 189],
  [52, 74],
  [58, 128],
  [42, 176],
  [55, 90],
  [47, 118],
]
const temperatures: [number, number][] = [
  [24, 31],
  [23, 30],
  [25, 33],
  [24, 32],
  [22, 28],
  [23, 29],
  [24, 31],
]

const rangeCode = `<RRangeBars
  :labels="['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']"
  :ranges="[[48, 112], [40, 189], [52, 74], [58, 128], [42, 176], [55, 90], [47, 118]]"
  :average="57"
  color="var(--r-danger)"
  unit="bpm"
  label="Heart rate range per day"
/>`

const rangeProps: PropRow[] = [
  { name: 'labels', type: 'string[]', description: 'One per column.' },
  { name: 'ranges', type: '[min, max][]', description: 'Lowest and highest value per label.' },
  { name: 'average', type: 'number', description: 'Draws a dashed line with an ink pill on the left.' },
  { name: 'averageLabel', type: 'string', description: 'Text for the pill. Defaults to “Avg. 57”.' },
  { name: 'color', type: 'string', default: "'var(--r-chart-1)'", description: 'Bar colour; it fades toward the bottom of each bar.' },
  { name: 'height', type: 'number', default: '240', description: 'Total height in px.' },
  { name: 'min / max', type: 'number', description: 'Fix the scale. Defaults to the data range with a little room.' },
  { name: 'unit', type: 'string', description: 'Added to values in the tooltip, e.g. "bpm".' },
  { name: 'format', type: '(v: number) => string', description: 'Formats the numbers.' },
  { name: 'label', type: 'string', description: 'Accessible name. Required.' },
]

/* ── Bar list · energy activity, countries ───────────────────────────────── */
const energy = [
  { label: 'Q1', values: [1150, 480] },
  { label: 'Q2', values: [2050, 820] },
  { label: 'Q3', values: [1690, 820] },
  { label: 'Q4', values: [2280, 960] },
]
const energySeries = [
  { name: 'Active calories', color: 'var(--r-chart-2)' },
  { name: 'Resting calories', color: 'color-mix(in srgb, var(--r-chart-2) 34%, var(--r-bg-surface))' },
]
const countries = [
  { label: 'Indonesia', values: 7269 },
  { label: 'United States', values: 4812 },
  { label: 'Germany', values: 2931 },
  { label: 'Japan', values: 2110 },
  { label: 'Brazil', values: 1544 },
]

const barCode = `<RBarList
  :items="[
    { label: 'Q1', values: [1150, 480] },
    { label: 'Q2', values: [2050, 820] },
  ]"
  :series="[{ name: 'Active calories' }, { name: 'Resting calories' }]"
  axis
  legend
  :show-values="false"
  label="Average energy per quarter"
/>`

const barProps: PropRow[] = [
  { name: 'items', type: '{ label, values }[]', description: 'values is a number for a plain bar, or one number per series for a stacked bar.' },
  { name: 'series', type: '{ name, color? }[]', description: 'Names and colours of the stacked parts. Defaults: brand, then soft brand.' },
  { name: 'max', type: 'number', description: 'Full scale. Defaults to the longest bar (or a tidy number with an axis).' },
  { name: 'axis', type: 'boolean', default: 'false', description: 'Value axis and gridlines under the bars.' },
  { name: 'showValues', type: 'boolean', default: 'true', description: 'The total at the end of each row.' },
  { name: 'legend', type: 'boolean', default: 'false', description: 'Series names under the chart, when there is more than one.' },
  { name: 'gradient', type: 'boolean', default: 'true', description: 'Soft left-to-right gradient on the first series.' },
  { name: 'barHeight', type: 'number', default: '28', description: 'Bar thickness in px.' },
  { name: 'format', type: '(v: number) => string', description: 'Formats the values.' },
  { name: 'label', type: 'string', description: 'Accessible name. Required.' },
]

/* ── Columns · banking analytics ──────────────────────────────────────────── */
const goals = [62, 74, 58, 81, 88, 46, 35]

const columnCode = `<RColumnChart
  :labels="['Mon', 'Tue', 'Wed']"
  :values="[64, 52, 46]"
  :targets="[70, 56, 50]"
  :highlight="0"
  label="Share of budget spent per day"
/>`

const columnProps: PropRow[] = [
  { name: 'labels', type: 'string[]', description: 'One per column.' },
  { name: 'values', type: 'number[]', description: 'Column values, read against max.' },
  { name: 'max', type: 'number', default: '100', description: 'Full height. The default suits percentages.' },
  { name: 'targets', type: 'number[] | number', description: 'A short tick per column (or one value for all) marking the goal.' },
  { name: 'highlight', type: 'number | null', default: 'null', description: 'The column drawn in full colour; the rest go soft. Leave it out for all solid.' },
  { name: 'color', type: 'string', default: "'var(--r-chart-4)'", description: 'Column colour.' },
  { name: 'labelColor', type: 'string', default: "'#0c0e12'", description: 'Text inside the full-colour column. Near-black suits light and saturated colours; pass #fff for dark ones like the brand blue.' },
  { name: 'height', type: 'number', default: '220', description: 'Height of the plot in px.' },
  { name: 'format', type: '(v: number) => string', description: 'Formats the label inside each column. Defaults to a percentage.' },
  { name: 'label', type: 'string', description: 'Accessible name. Required.' },
]
</script>

<template>
  <DocPage
    eyebrow="Data"
    title="Charts"
    lead="Eight hand-drawn SVG charts, one for each visual the references kept coming back to. They size themselves to their container, take every colour from the tokens, show a tooltip on hover, and can be read with the arrow keys or as a hidden table."
  >
    <p class="doc-p">
      Click into any chart (or Tab to it) and use the arrow keys to step through the values; screen readers hear each one
      as you go. Every chart needs a <code class="doc-c">label</code>, which becomes its accessible name.
    </p>

    <!-- Dot matrix --------------------------------------------------------- -->
    <DocSection
      id="dot-matrix"
      title="Dot matrix"
      description="Stacked columns made of dots, from the Syncrowave sales summary. Every dot is the same amount, so totals read like a tally. Faint empty dots finish the grid."
    >
      <Demo surface="plain" padding="md">
        <RCard class="charts-wide" title="Sales summary">
          <template #actions>
            <RChip caret size="sm">This year</RChip>
            <RChip caret size="sm">Summary</RChip>
            <RIconButton label="More options" size="sm"><MoreHorizontal /></RIconButton>
          </template>
          <ul class="charts-legend" aria-hidden="true">
            <li><span class="charts-legend__dot" style="background: var(--r-chart-1)" /> Sales</li>
            <li><span class="charts-legend__dot" style="background: var(--r-chart-1-soft)" /> Insight</li>
          </ul>
          <RDotMatrixChart
            :labels="halfMonths"
            :ticks="halfMonthTicks"
            :series="salesSeries"
            :height="300"
            label="Sales and insight, twice a month"
          />
        </RCard>
      </Demo>

      <div class="doc-grid doc-grid--2">
        <Demo title="Without empty dots" surface="plain">
          <RCard class="charts-wide" title="Sign-ups this week" padding="sm">
            <RDotMatrixChart :labels="weekDays" :series="signups" :height="180" :show-empty="false" label="Sign-ups per day this week" />
          </RCard>
        </Demo>
        <Demo title="Two series, compact" surface="plain">
          <RCard class="charts-wide" title="Customers this week" padding="sm">
            <RDotMatrixChart :labels="weekDays" :series="customers" :height="180" label="New and returning customers per day this week" />
          </RCard>
        </Demo>
      </div>

      <CodeBlock :code="dotCode" />
      <PropsTable :rows="dotProps" caption="RDotMatrixChart props" />
      <DoDont
        do="Use it for counts over time where the rough total matters more than the exact value."
        dont="Don't stack more than two or three series. Past that the colours blur into noise."
      />
    </DocSection>

    <!-- Line --------------------------------------------------------------- -->
    <DocSection
      id="line"
      title="Line"
      description="Smooth lines over a soft gradient, like the Makaryo cashflow and the Prody budget. Hover anywhere to get a crosshair with every series at that point; a highlight marks one point with a value pill."
    >
      <Demo surface="plain">
        <RCard class="charts-wide" title="Consolidated budget" subtitle="May, daily">
          <template #actions>
            <RIconButton label="Open budget report" size="sm"><ArrowUpRight /></RIconButton>
          </template>
          <RLineChart
            :labels="days"
            :series="budgetSeries"
            :highlight="17"
            :height="260"
            :format="(v: number) => formatCurrency(v)"
            :axis-format="(v: number) => `$${formatCompact(v)}`"
            legend
            label="Revenues and expenditures in May"
          />
        </RCard>
      </Demo>

      <div class="doc-grid doc-grid--2">
        <Demo title="On a flame card" note="Tokens are re-pointed, so the line, pill and grid turn white." surface="plain">
          <RCard variant="flame" class="charts-wide" title="Statistics">
            <template #actions>
              <RIconButton label="Open statistics" variant="soft" size="sm"><ArrowUpRight /></RIconButton>
            </template>
            <RStat :value="184.44" prefix="$" :decimals="2" size="lg" />
            <RLineChart
              :labels="weekDays"
              :series="statistics"
              :highlight="4"
              :height="170"
              :min="300"
              :area="false"
              hide-y-axis
              label="Visits per day this week"
            />
          </RCard>
        </Demo>
        <Demo title="Small, no axis" note="A balance card like the one in Kevin Dukkon's financial dashboard." surface="plain">
          <RCard class="charts-wide" title="Available balance">
            <RStat :value="19453.43" prefix="$" :decimals="2" muted-decimals size="lg" :trend="3" trend-label="vs last month" />
            <RLineChart
              :labels="balanceMonths"
              :series="balance"
              :height="150"
              :min="12000"
              hide-y-axis
              :format="(v: number) => formatCurrency(v)"
              label="Available balance by month"
            />
          </RCard>
        </Demo>
      </div>

      <CodeBlock :code="lineCode" />
      <PropsTable :rows="lineProps" caption="RLineChart props" />
      <DoDont
        do="Highlight the one point people should look at first, like today or the record day."
        dont="Don't fill the area under every series. One gradient is a backdrop; three are a fog."
      />
    </DocSection>

    <!-- Sparkline ---------------------------------------------------------- -->
    <DocSection
      id="sparkline"
      title="Sparkline"
      description="A tiny line with no axes, next to a number. From the Coinex portfolio cards. With color set to auto it turns green when the series ends higher and red when it ends lower."
    >
      <Demo surface="plain">
        <div class="charts-coins">
          <RCard v-for="coin in coins" :key="coin.ticker" padding="sm" class="charts-coin">
            <div class="charts-coin__head">
              <RAvatar :name="coin.name" size="md" decorative />
              <div>
                <p class="charts-coin__ticker">{{ coin.ticker }}</p>
                <p class="charts-coin__name">{{ coin.name }}</p>
              </div>
            </div>
            <div class="charts-coin__price">
              {{ formatCurrency(coin.price, 'USD', { minimumFractionDigits: 2 }) }}
              <RTrend :value="coin.change" size="sm" />
            </div>
            <RSparkline :values="coin.values" :height="44" :label="`${coin.name}, last 10 days`" />
          </RCard>
        </div>
      </Demo>

      <Demo title="In a list" note="Fixed width, so the column lines up." surface="plain">
        <RCard class="charts-wide" title="Watchlist" padding="sm">
          <ul class="charts-watch">
            <li v-for="coin in watchlist" :key="coin.ticker">
              <span class="charts-watch__name">
                <strong>{{ coin.ticker }}</strong>
                {{ coin.name }}
              </span>
              <RSparkline :values="coin.values" :width="96" :height="28" :label="`${coin.name}, last 8 days`" />
              <span class="charts-watch__price">{{ formatCurrency(coin.price, 'USD', { minimumFractionDigits: 2 }) }}</span>
              <RTrend :value="coin.change" variant="plain" />
            </li>
          </ul>
        </RCard>
      </Demo>

      <CodeBlock :code="sparkCode" />
      <PropsTable :rows="sparkProps" caption="RSparkline props" />
      <DoDont
        do="Put the number it describes right next to it. A sparkline shows the shape; the number gives the value."
        dont="Don't use auto colour for things where up is bad, like costs or response time. Pass a neutral colour instead."
      />
    </DocSection>

    <!-- Radial gauge ------------------------------------------------------- -->
    <DocSection
      id="radial-gauge"
      title="Radial gauge"
      description="A half circle of rounded radial bars, from the Syncrowave sales category card. The bars fill in order, each segment in its own colour, with the total in the middle. Hover a segment to see its own value."
    >
      <div class="doc-grid doc-grid--2">
        <Demo title="Full arc" note="The segments add up to the whole." surface="plain">
          <RCard class="charts-wide" title="Sales category">
            <template #actions>
              <RIconButton label="Open sales report" size="sm"><ArrowUpRight /></RIconButton>
            </template>
            <RRadialGauge :segments="categories" caption="Product sales" label="Product sales by category" />
            <div class="charts-pill">
              <RTrend :value="12.2" />
              <span>You sold 2,921 items compared to last month</span>
            </div>
          </RCard>
        </Demo>
        <Demo title="Partly filled" note="Set max to show what is left." surface="plain">
          <RCard class="charts-wide" title="Storage">
            <RRadialGauge
              :segments="storage"
              :max="100"
              value="69 GB"
              caption="of 100 GB used"
              :bars="36"
              :format="(v: number) => `${v} GB`"
              label="Storage used by type"
            />
          </RCard>
        </Demo>
      </div>

      <CodeBlock :code="gaugeCode" />
      <PropsTable :rows="gaugeProps" caption="RRadialGauge props" />
      <DoDont
        do="Use it for a few parts of one whole, with the whole as the headline."
        dont="Don't compare values between two gauges. Bars on a shared axis do that far better."
      />
    </DocSection>

    <!-- Heatmap ------------------------------------------------------------ -->
    <DocSection
      id="heatmap"
      title="Heatmap"
      description="Rows by columns, with intensity mixed from the chart colour into the track colour. From Fireart's orders by time and the Makaryo attendance report. Arrow keys move between cells."
    >
      <div class="doc-grid doc-grid--2">
        <Demo surface="plain">
          <RCard class="charts-wide" title="Orders by time" subtitle="Last 4 weeks">
            <RHeatmap
              :rows="hours"
              :cols="weekDays"
              :values="orders"
              :format="(v: number) => `${v} orders`"
              label="Orders by time of day and weekday"
            />
          </RCard>
        </Demo>
        <Demo surface="plain">
          <RCard class="charts-wide" title="Attendance report" subtitle="Real-time arrivals this week">
            <RHeatmap
              :rows="slots"
              :cols="workDays"
              :values="attendance"
              :cell-height="36"
              :radius="4"
              :format="(v: number) => `${v} people`"
              label="Arrivals by time and weekday"
            />
          </RCard>
        </Demo>
      </div>

      <CodeBlock :code="heatmapCode" />
      <PropsTable :rows="heatmapProps" caption="RHeatmap props" />
      <DoDont
        do="Use it to find the busy and quiet times in a week, when the pattern matters more than any one number."
        dont="Don't rely on colour alone for exact values. The tooltip and the table carry the numbers."
      />
    </DocSection>

    <!-- Range bars --------------------------------------------------------- -->
    <DocSection
      id="range-bars"
      title="Range bars"
      description="Lowest to highest per day as one rounded bar, from the heart rate card in Chart Cards. A dashed line with an ink pill marks the average."
    >
      <div class="doc-grid doc-grid--2">
        <Demo title="With an average" surface="plain">
          <RCard class="charts-wide" title="Heart rate">
            <template #actions>
              <RButton variant="outline" size="sm">
                Full stats
                <template #trailing><ArrowRight /></template>
              </RButton>
            </template>
            <div>
              <RStat value="40–189" unit="bpm" size="lg" />
              <p class="charts-caption">10–17 Sep 2025</p>
            </div>
            <RRangeBars
              :labels="heartDays"
              :ranges="heartRanges"
              :average="57"
              color="var(--r-danger)"
              unit="bpm"
              :height="220"
              label="Heart rate range per day"
            />
            <ul class="charts-readings">
              <li><span>Today (14:00)</span><strong>125</strong></li>
              <li><span>Today (13:00)</span><strong>110</strong></li>
            </ul>
          </RCard>
        </Demo>
        <Demo title="Another unit" surface="plain">
          <RCard class="charts-wide" title="Temperature" subtitle="Jakarta, this week">
            <RRangeBars
              :labels="weekDays"
              :ranges="temperatures"
              :average="27"
              average-label="Avg. 27°"
              color="var(--r-chart-3)"
              unit="°C"
              :height="200"
              label="Daily low and high temperature"
            />
          </RCard>
        </Demo>
      </div>

      <CodeBlock :code="rangeCode" />
      <PropsTable :rows="rangeProps" caption="RRangeBars props" />
      <DoDont
        do="Use it when the spread matters: heart rate, temperatures, response times, prices in a day."
        dont="Don't use it for a single value per day. A column or a line is clearer."
      />
    </DocSection>

    <!-- Bar list ----------------------------------------------------------- -->
    <DocSection
      id="bar-list"
      title="Bar list"
      description="Horizontal bars with the label on the left, single or stacked. From the energy activity card and Fireart's active users by country. Labels stay readable at any length because they are text, not SVG."
    >
      <div class="doc-grid doc-grid--2">
        <Demo surface="plain">
          <RCard class="charts-wide" title="Avg. energy activity">
            <template #actions>
              <RChip caret size="sm">Per day</RChip>
            </template>
            <div>
              <RStat :value="2589" unit="kcal" size="lg" />
              <p class="charts-caption">Avg. per day</p>
            </div>
            <RBarList
              :items="energy"
              :series="energySeries"
              axis
              legend
              :show-values="false"
              :format="(v: number) => `${formatNumber(v)} kcal`"
              label="Average active and resting calories per quarter"
            />
          </RCard>
        </Demo>
        <Demo surface="plain">
          <RCard class="charts-wide" title="Active users by country" subtitle="Last 30 days">
            <RBarList :items="countries" :bar-height="10" label="Active users by country" />
          </RCard>
        </Demo>
      </div>

      <CodeBlock :code="barCode" />
      <PropsTable :rows="barProps" caption="RBarList props" />
      <DoDont
        do="Sort plain bar lists from largest to smallest so the ranking reads top to bottom."
        dont="Don't use it for time. Time runs left to right; use columns or a line."
      />
    </DocSection>

    <!-- Columns ------------------------------------------------------------ -->
    <DocSection
      id="column"
      title="Columns"
      description="Wide columns over a hatched track with a target tick, from the banking analytics card. The track shows the full scale, so a short column still reads as part of a whole."
    >
      <div class="doc-grid doc-grid--2">
        <Demo title="Highlight and targets" surface="plain">
          <RCard class="charts-wide" title="Analytics">
            <template #actions>
              <RIconButton label="Open analytics" variant="soft" size="sm"><ArrowUpRight /></RIconButton>
            </template>
            <RStat :value="242.63" prefix="$" :decimals="2" size="lg" />
            <RColumnChart
              :labels="['Mon', 'Tue', 'Wed']"
              :values="[64, 52, 46]"
              :targets="[70, 56, 50]"
              :highlight="0"
              label="Share of the weekly budget spent per day"
            />
          </RCard>
        </Demo>
        <Demo title="A week against one goal" surface="plain">
          <RCard class="charts-wide" title="Daily goal" subtitle="Target 80%">
            <RColumnChart
              :labels="weekDays"
              :values="goals"
              :targets="80"
              :highlight="4"
              color="var(--r-chart-1)"
              label-color="var(--r-on-brand)"
              :height="200"
              label="Daily goal completion this week"
            />
          </RCard>
        </Demo>
      </div>

      <CodeBlock :code="columnCode" />
      <PropsTable :rows="columnProps" caption="RColumnChart props" />
      <DoDont
        do="Keep it to a handful of columns, and highlight the one that matters now."
        dont="Don't drop the track or the targets to fit more columns. Without them it's just a bar chart."
      />
    </DocSection>
  </DocPage>
</template>

<style>
.charts-wide {
  width: 100%;
}

/* Cards with a row of filter chips: let the chips drop below the title on a phone. */
.charts-wide > .r-card__header {
  flex-wrap: wrap;
}

.charts-legend {
  display: flex;
  gap: 16px;
  margin-top: -6px;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}
.charts-legend li {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.charts-legend__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.charts-caption {
  margin-top: 4px;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-sm);
  font-variant-numeric: tabular-nums;
}

.charts-pill {
  display: flex;
  align-items: center;
  gap: 10px;
  align-self: center;
  max-width: 100%;
  padding: 6px 14px 6px 6px;
  border: 1px solid var(--r-border-subtle);
  border-radius: var(--r-radius-full);
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
}

.charts-coins {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(200px, 100%), 1fr));
  gap: 12px;
  width: 100%;
}

.charts-coin {
  gap: 12px !important;
}

.charts-coin__head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.charts-coin__ticker {
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-semibold);
}

.charts-coin__name {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

.charts-coin__price {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--r-text-xl);
  font-weight: var(--r-weight-semibold);
  font-variant-numeric: tabular-nums;
  letter-spacing: var(--r-tracking-tight);
}

.charts-watch {
  display: flex;
  flex-direction: column;
}

.charts-watch li {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 96px 92px 56px;
  align-items: center;
  gap: 16px;
  min-height: 52px;
  border-bottom: 1px solid var(--r-border-subtle);
  font-size: var(--r-text-sm);
}
.charts-watch li:last-child {
  border-bottom: 0;
}

.charts-watch__name {
  overflow: hidden;
  color: var(--r-text-tertiary);
  text-overflow: ellipsis;
  white-space: nowrap;
}
.charts-watch__name strong {
  margin-right: 6px;
  color: var(--r-text);
  font-weight: var(--r-weight-semibold);
}

.charts-watch__price {
  font-weight: var(--r-weight-medium);
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.charts-watch .r-trend {
  justify-content: flex-end;
}

@media (max-width: 520px) {
  .charts-watch li {
    grid-template-columns: minmax(0, 1fr) 72px auto;
    gap: 10px;
  }
  .charts-watch li .r-trend {
    display: none;
  }
  .charts-watch li .r-sparkline {
    width: 72px !important;
  }
}

.charts-readings {
  display: flex;
  flex-direction: column;
}
.charts-readings li {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-top: 1px solid var(--r-border-subtle);
  color: var(--r-text-tertiary);
  font-size: var(--r-text-md);
}
.charts-readings strong {
  color: var(--r-text);
  font-weight: var(--r-weight-medium);
  font-variant-numeric: tabular-nums;
}
</style>
