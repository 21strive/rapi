<script setup lang="ts">
import {
  RBarList,
  RBulletChart,
  RCandlestickChart,
  RColumnChart,
  RDial,
  RDotMatrixChart,
  RGanttChart,
  RHeatmap,
  RLineChart,
  RRadarScope,
  RRadialGauge,
  RRangeBars,
  RScatterChart,
  RSparkline,
  RWaterfallChart,
  formatCompact,
  formatNumber,
} from '@/design-system'
import DocPage from '../components/DocPage.vue'
import DocSection from '../components/DocSection.vue'
import Demo from '../components/Demo.vue'
import CodeBlock from '../components/CodeBlock.vue'
import PropsTable from '../components/PropsTable.vue'
import DoDont from '../components/DoDont.vue'
import type { PropRow } from '../types'
import * as d from './charts-data'

const idr = (v: number) => `${formatNumber(v, { maximumFractionDigits: 1 })}`
const minutes = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`

const palette = [
  { slot: 1, name: 'Cobalt' },
  { slot: 2, name: 'Orange' },
  { slot: 3, name: 'Teal' },
  { slot: 4, name: 'Amber' },
  { slot: 5, name: 'Magenta' },
  { slot: 6, name: 'Green' },
  { slot: 7, name: 'Periwinkle' },
  { slot: 8, name: 'Red' },
]

const lineCode = `<RLineChart
  :labels="weeks"
  :series="[{ name: 'Net liquidity', values: liquidity }]"
  :forecast-from="12"
  :now="12"
  :references="[{ value: 360, label: 'Min buffer 360', kind: 'threshold' }]"
  y-unit="IDR bn"
  label="Net liquidity by week, IDR billions, with a six-week forecast"
/>`

const lineProps: PropRow[] = [
  { name: 'labels', type: 'string[]', description: 'One per point, left to right.' },
  { name: 'series', type: '{ name, values, color?, area?, dashed? }[]', description: 'null values leave a gap in the line.' },
  { name: 'curve', type: "'linear' | 'step' | 'monotone'", default: "'linear'", description: 'Straight segments by default. Step holds a value until the next sample; monotone smooths without overshooting.' },
  { name: 'forecastFrom', type: 'number', description: 'Index after which lines are dashed and the plot is hatched.' },
  { name: 'now', type: 'number', description: 'Index of the current moment, drawn as the orange NOW line.' },
  { name: 'references', type: 'ChartReference[]', description: 'Dashed targets, thresholds and averages, labelled at the right.' },
  { name: 'highlight', type: 'number', description: 'Index to mark with a value tag.' },
  { name: 'endLabels', type: 'boolean', default: 'false', description: 'Value at the end of each line, four series at most.' },
  { name: 'yUnit', type: 'string', description: 'Unit printed above the y axis in mono caps.' },
  { name: 'label', type: 'string', description: 'Accessible name. Required.' },
]

const columnCode = `<RColumnChart
  :labels="days"
  :values="settled"
  :targets="targets"
  :format="(v) => formatNumber(v, { maximumFractionDigits: 1 })"
  y-unit="IDR bn"
  label="Settled volume by day against target, IDR billions"
/>`

const columnProps: PropRow[] = [
  { name: 'labels', type: 'string[]', description: 'One per column.' },
  { name: 'values', type: 'number[]', description: 'A single series.' },
  { name: 'series', type: 'ChartSeries[]', description: 'Several series, stacked with a 2px surface gap.' },
  { name: 'targets', type: 'number | number[]', description: 'Ink tick per column, or one value for all.' },
  { name: 'highlight', type: 'number', description: 'The one column in colour; the rest turn grey.' },
  { name: 'references', type: 'ChartReference[]', description: 'Dashed horizontal lines.' },
  { name: 'showValues', type: 'boolean', default: '≤ 12 columns', description: 'Values on the column caps.' },
  { name: 'percent', type: 'boolean', default: 'false', description: 'Values are percentages: the scale tops out at 100 and labels get a % sign.' },
  { name: 'max', type: 'number', description: 'Top of the scale. Defaults to a tidy maximum, or 100 with percent.' },
]

const bulletCode = `<RBulletChart
  :rows="[
    { label: 'Revenue', sublabel: 'IDR bn', value: 182.4, target: 200, ranges: [140, 180, 220], previous: 166.2 },
    { label: 'Net new accounts', sublabel: 'thousands', value: 48.2, target: 45, ranges: [30, 42, 55] },
  ]"
  label="Quarter results against targets"
/>`

const bulletProps: PropRow[] = [
  { name: 'rows', type: 'BulletRow[]', description: '{ label, value, target?, ranges?, previous?, sublabel? }. Ranges are the upper edges of the grey bands.' },
  { name: 'max', type: 'number', description: 'Shared maximum. By default each row scales to its own last band.' },
  { name: 'tone', type: "'brand' | 'ink'", default: "'brand'", description: 'Colour of the measure bar.' },
  { name: 'format', type: '(v: number) => string', description: 'Values, ticks and the table.' },
]

const waterfallCode = `<RWaterfallChart
  :steps="[
    { label: 'Opening', value: 48.2, kind: 'total' },
    { label: 'Collections', value: 31.4 },
    { label: 'Payroll', value: -14.8 },
    { label: 'Closing', value: 0, kind: 'total' },
  ]"
  label="Operating cash flow in October, IDR billions"
/>`

const candleCode = `<RCandlestickChart :data="candles" label="STRV, 5-minute candles" />`

const scatterCode = `<RScatterChart
  :series="exposure"
  x-label="PD %"
  y-label="Exposure USD M"
  :y-references="[{ value: 150, label: 'Single-name limit', kind: 'threshold' }]"
  label-points
  label="Exposure against probability of default by segment"
/>`

const heatCode = `<RHeatmap :rows="weekdays" :cols="hours" :values="signIns" label="Sign-ins by weekday and hour" />`

const ganttCode = `<RGanttChart
  :rows="passes"
  :domain="[360, 840]"
  :ticks="[360, 420, 480 /* … */]"
  :format-tick="(m) => toClock(m)"
  :now="581"
  label="Ground-station passes today, UTC"
/>`

const ganttProps: PropRow[] = [
  { name: 'rows', type: 'GanttRow[]', description: '{ id, label, meta?, items: { start, end, label?, tone?, milestone?, hatch? }[] }.' },
  { name: 'domain', type: '[number, number]', description: 'Start and end of the axis, in the same unit as the items.' },
  { name: 'ticks / formatTick', type: 'number[] / (v) => string', description: 'Where the axis is labelled and how.' },
  { name: 'now', type: 'number', description: 'The orange NOW line.' },
  { name: 'rowHeight / labelWidth', type: 'number', default: '32 / 160', description: 'Layout.' },
]

const dialCode = `<RDial
  :value="31240"
  :min="0"
  :max="40000"
  :major-step="10000"
  unit="RPM"
  :zones="[
    { from: 32000, to: 36000, level: 'warning' },
    { from: 36000, to: 40000, level: 'critical' },
  ]"
  :format="(v) => formatCompact(v)"
  label="Turbopump speed"
/>`

const dialProps: PropRow[] = [
  { name: 'value / min / max', type: 'number', default: '— / 0 / 100', description: 'The reading and the scale.' },
  { name: 'zones', type: 'DialZone[]', description: '{ from, to, level } with level good | warning | serious | critical. The current zone is named under the readout.' },
  { name: 'majorStep', type: 'number', description: 'Labelled tick every N units; minor ticks split each into five.' },
  { name: 'variant', type: "'needle' | 'arc'", default: "'needle'", description: 'A needle, or a cobalt arc filled up to the value.' },
  { name: 'unit / size', type: 'string / number', default: '— / 200', description: 'Unit after the readout; width in px.' },
]

const radarCode = `<RRadarScope :contacts="tracks" :range="100" unit="NM" label="Air picture, 100 nautical miles" />`

const radarProps: PropRow[] = [
  { name: 'contacts', type: 'RadarContact[]', description: '{ id, bearing, range, kind?, heading?, label? }. Kind sets shape, colour and the word in the table.' },
  { name: 'range / rings / unit', type: 'number / number / string', default: "100 / 4 / 'NM'", description: 'Scale of the scope.' },
  { name: 'sweep', type: 'boolean', default: 'true', description: 'Rotating sweep line, still under reduced motion.' },
  { name: 'selected', type: 'string', description: 'Id of the selected track. Emits select on click or Enter.' },
]
</script>

<template>
  <DocPage
    eyebrow="Data"
    title="Charts"
    lead="Fifteen charts drawn as plain SVG from the tokens. They read like engineering plots: solid hairline grids, mono ticks, square marks, and colour only where it carries meaning."
  >
    <DocSection
      id="method"
      title="How the charts work"
      description="Every chart follows the same rules, so a dashboard reads as one instrument panel."
    >
      <div class="charts-rules r-grid-ruled">
        <div class="charts-rule">
          <p class="r-eyebrow">Identity</p>
          <div class="charts-swatches">
            <span v-for="p in palette" :key="p.slot" class="charts-swatch">
              <span class="charts-swatch__chip" :style="{ background: `var(--r-chart-${p.slot})` }" />
              <span class="r-index">{{ String(p.slot).padStart(2, '0') }}</span>
              {{ p.name }}
            </span>
          </div>
          <p class="charts-rule__text">
            Eight slots in a fixed order, checked for colour-vision separation in both themes. A series keeps its slot when
            filters hide others. Past eight, fold the tail into Other.
          </p>
        </div>
        <div class="charts-rule">
          <p class="r-eyebrow">Magnitude · polarity</p>
          <div class="charts-ramp">
            <span v-for="i in 9" :key="i" :style="{ background: `var(--r-seq-${i - 1})` }" />
          </div>
          <div class="charts-ramp">
            <span style="background: var(--r-div-neg)" />
            <span style="background: var(--r-div-neg-soft)" />
            <span style="background: var(--r-div-mid)" />
            <span style="background: var(--r-div-pos-soft)" />
            <span style="background: var(--r-div-pos)" />
          </div>
          <p class="charts-rule__text">
            One hue for how much: the cobalt ramp. Two for which side: orange and cobalt through a grey that reads as nothing.
          </p>
        </div>
        <div class="charts-rule">
          <p class="r-eyebrow">State · now</p>
          <div class="charts-states">
            <span><i style="background: var(--r-status-good)" />Good</span>
            <span><i style="background: var(--r-status-warning)" />Warning</span>
            <span><i style="background: var(--r-status-serious)" />Serious</span>
            <span><i style="background: var(--r-status-critical)" />Critical</span>
            <span><i class="is-now" />Now</span>
          </div>
          <p class="charts-rule__text">
            Status colours are reserved and always come with a word. The one orange line on a chart is the present moment.
          </p>
        </div>
        <div class="charts-rule">
          <p class="r-eyebrow">Reading without colour</p>
          <p class="charts-rule__text">
            Every chart takes a <code class="doc-c">label</code>, carries a hidden data table, and can be explored with the
            arrow keys. Tab into one and try it. Dashes always mean a target, a threshold or a forecast, never just a grid.
          </p>
        </div>
      </div>
    </DocSection>

    <!-- Line -->
    <DocSection
      id="line"
      title="Line"
      description="Change over time. Straight segments by default, steps for sampled values. A forecast is dashed over hatching; the orange line is now."
    >
      <Demo surface="plain">
        <div class="charts-frame">
          <header class="charts-frame__head">
            <div>
              <p class="r-eyebrow">Treasury · W32–W50</p>
              <h3 class="charts-frame__title">Net liquidity</h3>
            </div>
            <span class="r-label">IDR bn · weekly close</span>
          </header>
          <RLineChart
            :labels="d.weeks"
            :series="[{ name: 'Net liquidity', values: d.liquidity }]"
            :forecast-from="12"
            :now="12"
            :references="[{ value: d.liquidityBuffer, label: `Min buffer ${d.liquidityBuffer}`, kind: 'threshold' }]"
            :format="idr"
            y-unit="IDR bn"
            :height="260"
            label="Net liquidity by week, IDR billions, with a six-week forecast"
          />
        </div>
      </Demo>
      <Demo title="Step curve, end labels, threshold" surface="plain">
        <div class="charts-frame">
          <header class="charts-frame__head">
            <div>
              <p class="r-eyebrow">API · last 24 h</p>
              <h3 class="charts-frame__title">p95 latency by region</h3>
            </div>
            <span class="r-label">ms</span>
          </header>
          <RLineChart
            :labels="d.hours"
            :series="d.latency"
            curve="step"
            end-labels
            :references="[{ value: 300, label: 'SLO 300 ms', kind: 'threshold' }]"
            :height="240"
            label="p95 latency by region over the last 24 hours, in milliseconds"
          />
        </div>
      </Demo>
      <CodeBlock :code="lineCode" />
      <PropsTable :rows="lineProps" caption="RLineChart props" />
      <DoDont
        do="Dash only what is not measured yet: forecasts, targets, thresholds. Keep the measured line solid."
        dont="Don't smooth sampled data with the monotone curve. It invents values between samples."
      />
    </DocSection>

    <!-- Columns -->
    <DocSection
      id="columns"
      title="Columns"
      description="Comparing amounts across a few categories or periods. Square ends, 24px at most, a 2px surface gap between stacked parts, and an ink tick for the target."
    >
      <div class="doc-grid doc-grid--2">
        <Demo title="Against a target" surface="plain">
          <div class="charts-frame">
            <header class="charts-frame__head">
              <div>
                <p class="r-eyebrow">Settlement</p>
                <h3 class="charts-frame__title">Settled this week</h3>
              </div>
            </header>
            <RColumnChart
              :labels="d.days"
              :values="d.settled"
              :targets="d.settledTargets"
              :format="idr"
              y-unit="IDR bn"
              label="Settled volume by day against target, IDR billions"
            />
          </div>
        </Demo>
        <Demo title="Stacked, with status colours" surface="plain">
          <div class="charts-frame">
            <header class="charts-frame__head">
              <div>
                <p class="r-eyebrow">Edge · today</p>
                <h3 class="charts-frame__title">Responses by status</h3>
              </div>
            </header>
            <RColumnChart
              :labels="d.statusHours"
              :series="d.statusCodes"
              :show-values="false"
              y-unit="K req"
              label="Responses by status class every two hours, thousands of requests"
            />
          </div>
        </Demo>
      </div>
      <CodeBlock :code="columnCode" />
      <PropsTable :rows="columnProps" caption="RColumnChart props" />
    </DocSection>

    <!-- Bar list -->
    <DocSection
      id="bar-list"
      title="Bar list"
      description="A ranked list: names on the left, thin bars, values in mono on the right. The honest answer to most pie-chart requests."
    >
      <Demo surface="plain">
        <div class="charts-frame">
          <header class="charts-frame__head">
            <div>
              <p class="r-eyebrow">Edge · 24 h</p>
              <h3 class="charts-frame__title">Top paths by requests</h3>
            </div>
          </header>
          <RBarList :items="d.topPaths" axis :format="formatCompact" label="Top API paths by requests in the last 24 hours" />
        </div>
      </Demo>
    </DocSection>

    <!-- Bullet -->
    <DocSection
      id="bullet"
      title="Bullet"
      description="Stephen Few's bullet graph: the measure in cobalt, the target as an ink tick, grey bands for poor, fair and good. Many KPIs in the space of one gauge."
    >
      <Demo surface="plain">
        <div class="charts-frame">
          <header class="charts-frame__head">
            <div>
              <p class="r-eyebrow">Q4 2026</p>
              <h3 class="charts-frame__title">Results against targets</h3>
            </div>
            <span class="r-label">Thin bar · Q3</span>
          </header>
          <RBulletChart :rows="d.quarter" label="Quarter results against targets" />
        </div>
      </Demo>
      <CodeBlock :code="bulletCode" />
      <PropsTable :rows="bulletProps" caption="RBulletChart props" />
      <DoDont
        do="Use bullets for a row of KPIs that each have a target. They compare well down a column."
        dont="Don't use a dial or a donut for a value with a target; it takes four times the space and reads worse."
      />
    </DocSection>

    <!-- Waterfall -->
    <DocSection
      id="waterfall"
      title="Waterfall"
      description="How you got from one total to another. Increases in cobalt, decreases in orange, totals in ink, joined by hairline connectors."
    >
      <Demo surface="plain">
        <div class="charts-frame">
          <header class="charts-frame__head">
            <div>
              <p class="r-eyebrow">Cash · October</p>
              <h3 class="charts-frame__title">Operating cash flow</h3>
            </div>
            <span class="r-label">IDR bn</span>
          </header>
          <RWaterfallChart :steps="d.cashflow" :format="idr" label="Operating cash flow in October, IDR billions" />
        </div>
      </Demo>
      <CodeBlock :code="waterfallCode" />
    </DocSection>

    <!-- Candles -->
    <DocSection
      id="candles"
      title="Candlestick"
      description="Open, high, low and close per period, volume on its own strip underneath. Up is cobalt and down is orange, the diverging pair, so it survives colour blindness. The price axis sits on the right, as traders expect."
    >
      <Demo surface="plain">
        <div class="charts-frame" data-theme="dark">
          <header class="charts-frame__head">
            <div>
              <p class="r-eyebrow">STRV · 5 min</p>
              <h3 class="charts-frame__title">21 Strive</h3>
            </div>
            <span class="r-label">USD</span>
          </header>
          <RCandlestickChart :data="d.candles" :height="340" label="STRV, 5-minute candles with volume" />
        </div>
      </Demo>
      <CodeBlock :code="candleCode" />
    </DocSection>

    <!-- Scatter -->
    <DocSection
      id="scatter"
      title="Scatter"
      description="Two measures per item. Up to three series, because past three the colours stop being distinguishable from every other colour. Hover finds the nearest point within 24px."
    >
      <Demo surface="plain">
        <div class="charts-frame">
          <header class="charts-frame__head">
            <div>
              <p class="r-eyebrow">Credit risk</p>
              <h3 class="charts-frame__title">Exposure against probability of default</h3>
            </div>
          </header>
          <RScatterChart
            :series="d.exposure"
            x-label="PD %"
            y-label="Exposure USD M"
            :y-references="[{ value: 150, label: 'Single-name limit', kind: 'threshold' }]"
            label-points
            :format-x="(v) => `${v}%`"
            :height="320"
            label="Exposure in USD millions against probability of default by segment"
          />
        </div>
      </Demo>
      <CodeBlock :code="scatterCode" />
    </DocSection>

    <!-- Heatmap -->
    <DocSection
      id="heatmap"
      title="Heatmap"
      description="Magnitude over two dimensions, in six steps of the cobalt ramp. Zero gets its own grey so nothing reads as a little."
    >
      <Demo surface="plain">
        <div class="charts-frame">
          <header class="charts-frame__head">
            <div>
              <p class="r-eyebrow">Identity · last 4 weeks</p>
              <h3 class="charts-frame__title">Sign-ins by weekday and hour</h3>
            </div>
            <span class="r-label">WIB</span>
          </header>
          <RHeatmap :rows="d.heatRows" :cols="d.heatCols" :values="d.heat" label="Sign-ins by weekday and two-hour block" />
        </div>
      </Demo>
      <CodeBlock :code="heatCode" />
    </DocSection>

    <!-- Gantt -->
    <DocSection
      id="gantt"
      title="Gantt"
      description="Things on a timeline: satellite passes, bookings, deploy windows. Hatching marks the planned and the tentative, a diamond marks a moment, the orange line is now."
    >
      <Demo surface="plain">
        <div class="charts-frame">
          <header class="charts-frame__head">
            <div>
              <p class="r-eyebrow">Ground segment · 12 Nov 2026</p>
              <h3 class="charts-frame__title">Passes today</h3>
            </div>
            <span class="r-label">UTC</span>
          </header>
          <RGanttChart
            :rows="d.passes"
            :domain="d.passDomain"
            :ticks="d.passTicks"
            :format-tick="minutes"
            :now="d.passNow"
            :row-height="40"
            label="Ground-station passes today, UTC"
          />
        </div>
      </Demo>
      <CodeBlock :code="ganttCode" />
      <PropsTable :rows="ganttProps" caption="RGanttChart props" />
    </DocSection>

    <!-- Dial -->
    <DocSection
      id="dial"
      title="Dial"
      description="One reading against a scale with limits, like an instrument. Status zones sit on the outer ring and the current zone is named under the readout."
    >
      <Demo surface="plain">
        <div class="charts-dials">
          <RDial
            :value="31240"
            :min="0"
            :max="40000"
            :major-step="10000"
            unit="RPM"
            :zones="[
              { from: 32000, to: 36000, level: 'warning' },
              { from: 36000, to: 40000, level: 'critical' },
            ]"
            :format="(v) => formatCompact(v)"
            label="Turbopump speed"
          />
          <RDial
            :value="76"
            variant="arc"
            unit="%"
            :zones="[{ from: 0, to: 15, level: 'critical' }, { from: 15, to: 30, level: 'warning' }]"
            label="Battery charge"
          />
          <RDial
            :value="3.2"
            :min="0"
            :max="8"
            :major-step="2"
            unit="bar"
            :zones="[{ from: 6, to: 7, level: 'serious' }, { from: 7, to: 8, level: 'critical' }]"
            :format="(v) => formatNumber(v, { maximumFractionDigits: 1 })"
            label="Line pressure"
          />
        </div>
      </Demo>
      <CodeBlock :code="dialCode" />
      <PropsTable :rows="dialProps" caption="RDial props" />
    </DocSection>

    <!-- Radar -->
    <DocSection
      id="radar"
      title="Radar scope"
      description="Positions by bearing and range. Each kind has its own shape as well as its own colour (friendly circle, hostile diamond, unknown open square, neutral square), and every track is labelled."
    >
      <Demo surface="plain">
        <div class="charts-frame charts-frame--center" data-theme="dark">
          <RRadarScope :contacts="d.tracks" :size="420" label="Air picture, 100 nautical miles" />
        </div>
      </Demo>
      <CodeBlock :code="radarCode" />
      <PropsTable :rows="radarProps" caption="RRadarScope props" />
    </DocSection>

    <!-- Range bars -->
    <DocSection
      id="range-bars"
      title="Range bars"
      description="A spread per period, from low to high, with ink caps at both ends and an average as a dashed reference."
    >
      <Demo surface="plain">
        <div class="charts-frame">
          <header class="charts-frame__head">
            <div>
              <p class="r-eyebrow">API · daily</p>
              <h3 class="charts-frame__title">Response time, p5 to p95</h3>
            </div>
          </header>
          <RRangeBars :labels="d.rangeDays" :ranges="d.responseRanges" :average="168" unit="ms" label="Daily response time spread, p5 to p95, in milliseconds" />
        </div>
      </Demo>
    </DocSection>

    <!-- Radial gauge -->
    <DocSection
      id="radial-gauge"
      title="Tick ring"
      description="A whole split into a few parts, drawn as the ticks of an instrument scale. Keep it to three parts; for more, use a bar list."
    >
      <Demo surface="plain">
        <div class="charts-frame charts-frame--narrow">
          <header class="charts-frame__head">
            <div>
              <p class="r-eyebrow">Storage</p>
              <h3 class="charts-frame__title">Capacity by tier</h3>
            </div>
            <span class="r-label">TB</span>
          </header>
          <RRadialGauge :segments="d.storage" :max="400" caption="TB used of 400" label="Storage used by tier, terabytes" />
        </div>
      </Demo>
    </DocSection>

    <!-- Dot matrix -->
    <DocSection
      id="dot-matrix"
      title="Dot matrix"
      description="Counts as a tally of LEDs, the Teenage Engineering twist. Each dot is the same amount. Set shape to pixel for square pixels."
    >
      <div class="doc-grid doc-grid--2">
        <Demo title="Dots" surface="plain">
          <div class="charts-frame">
            <RDotMatrixChart :labels="d.shipWeeks" :series="d.shipments" :height="220" label="Domestic and export shipments per week" />
          </div>
        </Demo>
        <Demo title="Pixels" surface="plain">
          <div class="charts-frame" data-theme="dark">
            <RDotMatrixChart :labels="d.shipWeeks" :series="d.shipments" :height="220" shape="pixel" label="Domestic and export shipments per week, pixel style" />
          </div>
        </Demo>
      </div>
    </DocSection>

    <!-- Sparkline -->
    <DocSection
      id="sparkline"
      title="Sparkline"
      description="A trend in a table cell. No axes; the colour follows the direction, and invert flips it when lower is better."
    >
      <Demo surface="plain">
        <div class="charts-frame charts-watch">
          <div v-for="w in d.watchlist" :key="w.symbol" class="charts-watch__row">
            <span class="charts-watch__sym">{{ w.symbol }}</span>
            <span class="charts-watch__name">{{ w.name }}</span>
            <RSparkline :values="w.values" :width="120" :label="`${w.name}, last 24 hours`" />
            <span class="charts-watch__price">{{ formatNumber(w.price, { maximumFractionDigits: 2 }) }}</span>
            <span class="charts-watch__chg" :class="w.change < 0 ? 'is-down' : 'is-up'">
              {{ w.change < 0 ? '−' : '+' }}{{ Math.abs(w.change).toFixed(2) }}%
            </span>
          </div>
        </div>
      </Demo>
    </DocSection>
  </DocPage>
</template>

<style>
.charts-frame {
  padding: 16px 20px 18px;
  border: 1px solid var(--r-border);
  background: var(--r-bg-surface);
  color: var(--r-text);
  width: 100%;
}

.charts-frame--center {
  display: flex;
  justify-content: center;
}

.charts-frame--narrow {
  max-width: 420px;
}

.charts-frame__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.charts-frame__title {
  margin-top: 4px;
  font-size: var(--r-text-lg);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-tight);
}

.charts-rules {
  grid-template-columns: repeat(auto-fit, minmax(min(260px, 100%), 1fr));
}

.charts-rule {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 18px 18px;
}

.charts-rule__text {
  color: var(--r-text-secondary);
  font-size: var(--r-text-sm);
  line-height: 1.5;
}

.charts-swatches {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px 12px;
  font-size: var(--r-text-xs);
}

.charts-swatch {
  display: flex;
  align-items: center;
  gap: 8px;
}

.charts-swatch__chip {
  width: 12px;
  height: 12px;
}

.charts-ramp {
  display: flex;
  gap: 2px;
}

.charts-ramp span {
  flex: 1;
  height: 14px;
}

.charts-states {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.charts-states span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.charts-states i {
  width: 7px;
  height: 7px;
  border-radius: var(--r-radius-round);
}

.charts-states i.is-now {
  width: 2px;
  height: 12px;
  border-radius: 0;
  background: var(--r-chart-now);
}

.charts-dials {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-around;
  gap: 24px;
  width: 100%;
  padding: 8px 0;
}

.charts-watch {
  display: flex;
  flex-direction: column;
  padding: 0;
}

.charts-watch__row {
  display: grid;
  grid-template-columns: 56px 1fr 120px 96px 72px;
  align-items: center;
  gap: 16px;
  height: 44px;
  padding: 0 16px;
  border-bottom: 1px solid var(--r-border-subtle);
}

.charts-watch__row:last-child {
  border-bottom: 0;
}

.charts-watch__sym {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: 0.04em;
}

.charts-watch__name {
  color: var(--r-text-secondary);
  font-size: var(--r-text-sm);
}

.charts-watch__price,
.charts-watch__chg {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.charts-watch__chg.is-up {
  color: var(--r-success-text);
}

.charts-watch__chg.is-down {
  color: var(--r-danger-text);
}

@media (max-width: 640px) {
  .charts-watch__row {
    grid-template-columns: 48px 1fr 72px;
  }
  .charts-watch__name,
  .charts-watch__chg {
    display: none;
  }
}
</style>
