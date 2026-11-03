<script setup lang="ts">
import { ref } from 'vue'
import { RotateCcw } from 'lucide-vue-next'
import {
  RBadge,
  RButton,
  RCheckbox,
  RInput,
  RKbd,
  RRadioGroup,
  RReadout,
  RRule,
  RStatus,
  prefersReducedMotion,
} from '@/design-system'
import DocPage from '../components/DocPage.vue'
import DocSection from '../components/DocSection.vue'
import Demo from '../components/Demo.vue'
import CodeBlock from '../components/CodeBlock.vue'
import DoDont from '../components/DoDont.vue'
import { useTokenValues } from '../components/color'

/* ── Shape ──────────────────────────────────────────────────────────────────── */
const radii = [
  { token: '--r-radius-surface', value: '0', use: 'Cards, panels, tables, dialogs, menus', round: false },
  { token: '--r-radius-control', value: '0', use: 'Buttons, inputs, chips, segmented controls', round: false },
  { token: '--r-radius-mark', value: '0', use: 'Checkboxes, keys, badges, bars in charts', round: false },
  { token: '--r-radius-round', value: '999px', use: 'Lamps, radio buttons, data points. Never a container', round: true },
]
const checked = ref(true)
const mode = ref('auto')
const modes = [
  { label: 'Automatic', value: 'auto' },
  { label: 'Manual', value: 'manual' },
]

/* ── Rules ──────────────────────────────────────────────────────────────────── */
const lines = [
  { token: '--r-border-subtle', use: 'Rules inside a panel: between rows, under a table head' },
  { token: '--r-border', use: 'Around panels, between the cells of a ruled grid, section rules' },
  { token: '--r-border-strong', use: 'Inputs, floating panels, the rule on top of a spec' },
]
const cells = [
  { label: 'Settled', value: '1,284' },
  { label: 'In flight', value: '312' },
  { label: 'Held', value: '9' },
  { label: 'Failed', value: '2' },
]
const bars = [44, 52, 48, 61, 57, 66, 70, 64, 72, 75, 69, 78]
const FORECAST_FROM = 8

const ruledCss = `<div class="r-grid-ruled" style="grid-template-columns: repeat(4, 1fr)">
  <div>…</div>  <!-- each cell draws its own right and bottom rule -->
</div>

<section class="r-marks">…</section>   <!-- corner ticks on an instrument panel -->
<div class="r-hatch" />                  <!-- forecast, no data, out of window -->`

/* ── Spacing ────────────────────────────────────────────────────────────────── */
const spaceSteps = ['px', '0_5', '1', '1_5', '2', '2_5', '3', '4', '5', '6', '7', '8', '10', '12', '16', '20', '24'].map(
  (step) => `--r-space-${step}`,
)
const controls = [
  { token: '--r-control-xs', size: null, use: 'Dense table actions, tags' },
  { token: '--r-control-sm', size: 'sm', use: 'Toolbars, filters, dense forms' },
  { token: '--r-control-md', size: 'md', use: 'The default' },
  { token: '--r-control-lg', size: 'lg', use: 'Sign-in, onboarding, touch' },
  { token: '--r-control-xl', size: null, use: 'Hero actions on a cover' },
] as const

const shadows = [
  { token: '--r-shadow-sm', use: 'Handles and thumbs that sit just above a track' },
  { token: '--r-shadow-md', use: 'Tooltips and toasts' },
  { token: '--r-shadow-lg', use: 'Menus and popovers, the .r-panel surface' },
  { token: '--r-shadow-xl', use: 'Dialogs and the command palette' },
]

const { values } = useTokenValues(() => [...spaceSteps, ...controls.map((c) => c.token), ...shadows.map((s) => s.token)])
const label = (token: string) => token.replace(/^--r-(space|control)-/, '').replace('_', '.')

const density = [
  { what: 'Table rows', value: '32–40 px' },
  { what: 'Controls', value: '32 px' },
  { what: 'Page padding', value: '24 px desktop · 16 px phone' },
  { what: 'Inside a panel', value: '12 px at least' },
  { what: 'Between unrelated groups', value: '16–24 px' },
]

/* ── Motion ─────────────────────────────────────────────────────────────────── */
// Nominal values from tokens.css; the live ones drop to 0.01ms under reduced motion.
const durations = [
  { token: '--r-duration-instant', ms: 70, use: 'Pressed states, toggles' },
  { token: '--r-duration-fast', ms: 110, use: 'Hover colours, small fades' },
  { token: '--r-duration-base', ms: 160, use: 'Menus, popovers, dialogs' },
  { token: '--r-duration-slow', ms: 240, use: 'Sliding indicators, drawers' },
  { token: '--r-duration-slower', ms: 420, use: 'Chart entrances, count-ups' },
]
const easings = [
  { token: '--r-ease-out', value: 'cubic-bezier(0.2, 0, 0, 1)', curve: [0.2, 0, 0, 1], use: 'Most things: a fast start, a soft stop' },
  { token: '--r-ease-in-out', value: 'cubic-bezier(0.4, 0, 0.2, 1)', curve: [0.4, 0, 0.2, 1], use: 'Things that move and stay on screen' },
  { token: '--r-ease-linear', value: 'linear', curve: [0, 0, 1, 1], use: 'Progress bars and loops' },
  { token: '--r-ease-step', value: 'steps(4, end)', curve: null, use: 'Ticking readouts, like an instrument' },
]
const curvePath = ([x1, y1, x2, y2]: number[]) => `M0,100 C${x1 * 100},${100 - y1 * 100} ${x2 * 100},${100 - y2 * 100} 100,0`
const stepPath = 'M0,100 H25 V75 H50 V50 H75 V25 H100 V0'

const reduced = prefersReducedMotion()
const played = ref(true)
const resetting = ref(false)

function replay() {
  resetting.value = true
  played.value = false
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      resetting.value = false
      played.value = true
    }),
  )
}

const motionCss = `.drawer {
  transition: transform var(--r-duration-slow) var(--r-ease-out);
}

/* A live lamp: full for half a cycle, dim for the other half, no fade between. */
@keyframes r-blink {
  0%, 49%   { opacity: 1; }
  50%, 100% { opacity: 0.25; }
}

/* tokens.css already does this */
@media (prefers-reduced-motion: reduce) {
  :root { --r-duration-base: 0.01ms; }
}`

/* ── Layers ─────────────────────────────────────────────────────────────────── */
const layers = [
  { token: '--r-z-tooltip', value: 160, name: 'Tooltip', note: 'Above everything, even dialogs' },
  { token: '--r-z-toast', value: 140, name: 'Toast', note: 'Notices that must not hide behind a popover' },
  { token: '--r-z-popover', value: 120, name: 'Popover', note: 'Menus and popovers, also when opened from a dialog' },
  { token: '--r-z-modal', value: 100, name: 'Modal', note: 'Dialogs, the command palette, tours' },
  { token: '--r-z-overlay', value: 80, name: 'Overlay', note: 'Drawers and their backdrops' },
  { token: '--r-z-dropdown', value: 50, name: 'Dropdown', note: 'In-page dropdowns' },
  { token: '--r-z-sticky', value: 10, name: 'Sticky', note: 'Sticky heads, the strip, top bars' },
]
</script>

<template>
  <DocPage eyebrow="Foundations" title="Shape, space & motion">
    <template #lead>
      Every corner is 0, hairlines carry the structure, space sits on a 4px grid, and motion is short and plain. Nothing
      floats unless it really floats, and nothing bounces.
    </template>

    <DocSection
      id="shape"
      title="Shape"
      description="Square corners line up. Panels butt against each other and share one rule, a table meets its head, a ruled grid stays a grid. A circle is kept for the things that are points or states, so it always means something."
    >
      <div class="shape-radii r-grid-ruled">
        <div v-for="r in radii" :key="r.token" class="shape-radius">
          <span class="shape-radius__tile" :class="{ 'is-round': r.round }" aria-hidden="true" />
          <code class="shape-radius__token">{{ r.token }}</code>
          <span class="shape-radius__value">{{ r.value }}</span>
          <span class="shape-radius__use">{{ r.use }}</span>
        </div>
      </div>

      <Demo title="Squares and circles" note="Things you act on and read are square. Points and states are round." stack>
        <div class="shape-groups">
          <div class="shape-group">
            <span class="doc-label">Square</span>
            <div class="doc-row">
              <RButton size="sm" tabindex="-1">Approve</RButton>
              <RInput size="sm" placeholder="Search" aria-label="Search" class="shape-input" />
              <RBadge>In review</RBadge>
              <RCheckbox v-model="checked" label="Hold" />
              <RKbd :keys="['mod', 'K']" />
            </div>
          </div>
          <div class="shape-group">
            <span class="doc-label">Round</span>
            <div class="doc-row">
              <RStatus tone="success" label="Nominal" />
              <RRadioGroup v-model="mode" :options="modes" label="Mode" hide-label orientation="horizontal" />
              <svg class="shape-point" viewBox="0 0 96 32" aria-label="A data point on a line" role="img">
                <polyline points="0,26 30,20 48,10 70,16 96,6" />
                <circle cx="48" cy="10" r="4" />
              </svg>
            </div>
          </div>
        </div>
      </Demo>

      <DoDont
        do="Keep every container and control square. Use a circle only for a status lamp, a radio button or a data point."
        dont="Round a card, or pill a badge or a button. A rounded corner reads as a consumer app, and once everything is round, a circle stops meaning anything."
      >
        <template #do-example>
          <span class="shape-mini">
            <span class="shape-mini__head">Batch 0412</span>
            <span class="doc-row"><RBadge>In review</RBadge><RStatus tone="warning" label="Held" size="sm" /></span>
          </span>
        </template>
        <template #dont-example>
          <span class="shape-mini is-wrong">
            <span class="shape-mini__head">Batch 0412</span>
            <span class="shape-mini__pill">In review</span>
          </span>
        </template>
      </DoDont>
    </DocSection>

    <DocSection
      id="rules"
      title="Rules & grids"
      description="Structure comes from 1px hairlines instead of shadows and gaps. Three line tokens cover every case, and three utility classes build the layouts the brand book draws."
    >
      <ul class="rules-lines">
        <li v-for="l in lines" :key="l.token" class="rules-line">
          <span class="rules-line__sample" :style="{ borderTopColor: `var(${l.token})` }" aria-hidden="true" />
          <code class="rules-line__token">{{ l.token }}</code>
          <span class="rules-line__use">{{ l.use }}</span>
        </li>
        <li class="rules-line">
          <span class="rules-line__sample is-strong" aria-hidden="true" />
          <code class="rules-line__token">--r-rule-strong</code>
          <span class="rules-line__use">2px: a selected row's leading edge, the current tab, the top of a page header</span>
        </li>
      </ul>

      <Demo title="Ruled grid" note=".r-grid-ruled: cells share one rule instead of floating apart on gaps. Use it for KPI rows and bento layouts." surface="plain" stack>
        <div class="rules-kpis r-grid-ruled">
          <div v-for="(c, i) in cells" :key="c.label" class="rules-kpi">
            <span class="r-index">{{ String(i + 1).padStart(2, '0') }}</span>
            <span class="r-label">{{ c.label }}</span>
            <span class="rules-kpi__value">{{ c.value }}</span>
          </div>
        </div>
      </Demo>

      <div class="rules-pair">
        <Demo title="Registration marks" note=".r-marks: four corner ticks for an instrument panel or a hero frame." center>
          <div class="rules-marked r-marks">
            <RReadout label="Chamber pressure" :value="97.2" :decimals="1" unit="bar" sub="Max 110 · Nominal" />
          </div>
        </Demo>
        <Demo title="Hatching" note=".r-hatch: 45° lines mean forecast, no data, or out of window. Never decoration." center>
          <div class="rules-hatch" role="img" aria-label="Twelve weeks of values, the last four a forecast">
            <span
              v-for="(b, i) in bars"
              :key="i"
              class="rules-hatch__bar"
              :class="{ 'r-hatch': i >= FORECAST_FROM }"
              :style="{ height: `${b}%` }"
            />
            <span class="rules-hatch__tag">Forecast</span>
          </div>
        </Demo>
      </div>

      <Demo title="Section rules" note="RRule: a running number, a mono label, a rule to the edge and quiet metadata." stack>
        <RRule index="01" label="Telemetry" meta="14:02 WIB" />
        <RRule index="02" label="Payment rails" meta="5 watched" />
        <RRule label="Cash position" meta="12 Nov 2026" weight="strong" />
      </Demo>

      <Demo title="The strip" note="A 32px mono bar across the top of an app or page: context on the left, date, clock or status on the right." surface="plain" padding="none">
        <div class="rules-strip">
          <span class="rules-strip__start">Ground station <span aria-hidden="true">/</span> Pass 2207</span>
          <span class="rules-strip__end">07:02:11 UTC <RStatus tone="signal" label="Live" pulse size="sm" /></span>
        </div>
      </Demo>

      <CodeBlock :code="ruledCss" title="Utilities" />
    </DocSection>

    <DocSection
      id="spacing"
      title="Spacing"
      description="Every gap, padding and size sits on a 4px grid, with 2px and 6px steps for the tight spots inside controls. Dense is fine; cramped is not."
    >
      <div class="space-scale">
        <div v-for="token in spaceSteps" :key="token" class="space-scale__row">
          <code class="space-scale__token">space-{{ label(token) }}</code>
          <span class="space-scale__value">{{ values[token] }}</span>
          <span class="space-scale__bar" :style="{ width: `var(${token})` }" />
        </div>
      </div>

      <Demo title="Control heights" note="A field and a button of the same size line up on one row. 32px is the default." stack>
        <div class="space-controls">
          <div v-for="c in controls" :key="c.token" class="space-controls__row">
            <span class="space-controls__token"><code>{{ c.token.replace('--r-', '') }}</code> {{ values[c.token] }}</span>
            <template v-if="c.size">
              <RInput :size="c.size" placeholder="Account or IBAN" :aria-label="`Account, ${c.size}`" class="space-controls__input" />
              <RButton :size="c.size" tabindex="-1">Apply</RButton>
            </template>
            <span v-else class="space-controls__bar" :style="{ height: `var(${c.token})` }" />
            <span class="space-controls__use">{{ c.use }}</span>
          </div>
        </div>
      </Demo>

      <table class="doc-spec space-density">
        <caption class="r-sr-only">Density</caption>
        <thead>
          <tr>
            <th scope="col">Density</th>
            <th scope="col">Value</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="d in density" :key="d.what">
            <td>{{ d.what }}</td>
            <td class="space-density__value">{{ d.value }}</td>
          </tr>
        </tbody>
      </table>
    </DocSection>

    <DocSection
      id="elevation"
      title="Elevation"
      description="Only things that float above the page get a shadow: menus, popovers, tooltips, toasts and dialogs. Panels on the page have none; a hairline separates them. When a shadow is used, it is short."
    >
      <Demo title="On the page and above it" note="The panel is ruled. The menu floats, so it gets the strong border and a short shadow.">
        <div class="lift-scene">
          <div class="lift-panel">
            <span class="r-eyebrow">Settlement</span>
            <span class="lift-panel__value">1,284</span>
            <span class="r-label">Payments today</span>
          </div>
          <div class="lift-menu r-panel" aria-hidden="true">
            <span class="lift-menu__item">Open batch</span>
            <span class="lift-menu__item is-active">Export CSV <RKbd :keys="['mod', 'E']" size="sm" /></span>
            <span class="lift-menu__item">Hold payments</span>
          </div>
        </div>
      </Demo>

      <div class="lift-shadows">
        <div v-for="s in shadows" :key="s.token" class="lift-shadow">
          <div class="lift-shadow__tile" :style="{ boxShadow: `var(${s.token})` }">
            <code>{{ s.token.replace('--r-', '') }}</code>
          </div>
          <p class="lift-shadow__use">{{ s.use }}</p>
          <p class="lift-shadow__value">{{ values[s.token] }}</p>
        </div>
      </div>
      <p class="doc-p">
        <code class="doc-c">--r-shadow-none</code> and <code class="doc-c">--r-shadow-xs</code> are both
        <code class="doc-c">none</code>: cards, tables and inputs sit flat. Dark mode uses the same tokens with much
        stronger values, because a faint shadow disappears on a dark page, and floating panels keep the strong border so
        their edge never depends on the shadow.
      </p>
    </DocSection>

    <DocSection
      id="motion"
      title="Motion"
      description="Short and plain. Things move to show where they came from and where they went, not to entertain. Nothing springs, overshoots or bounces."
    >
      <p v-if="reduced" class="motion-notice">
        <RStatus tone="warning" label="Reduced motion" size="sm" />
        Your system asks for reduced motion, so every duration is 0.01ms right now and the blocks below jump instead of
        sliding. That is the intended behaviour.
      </p>
      <Demo title="Durations" note="All with --r-ease-out." stack>
        <div class="motion" :class="{ 'is-played': played, 'is-resetting': resetting }">
          <div v-for="d in durations" :key="d.token" class="motion__row">
            <span class="motion__label"><code>{{ d.token.replace('--r-duration-', '') }}</code> {{ d.ms }} ms</span>
            <span class="motion__track">
              <span class="motion__block" :style="{ transitionDuration: `var(${d.token})`, transitionTimingFunction: 'var(--r-ease-out)' }" />
            </span>
            <span class="motion__use">{{ d.use }}</span>
          </div>
        </div>
        <RButton size="sm" variant="outline" class="motion__replay" @click="replay">
          <template #leading><RotateCcw /></template>
          Replay
        </RButton>
      </Demo>
      <Demo title="Curves" note="Each over 420 ms, so the shape shows." stack>
        <div class="motion" :class="{ 'is-played': played, 'is-resetting': resetting }">
          <div v-for="e in easings" :key="e.token" class="motion__row motion__row--curve">
            <svg class="motion__curve" viewBox="-4 -4 108 108" aria-hidden="true">
              <path class="motion__axis" d="M0,0 V100 H100" />
              <path class="motion__path" :d="e.curve ? curvePath(e.curve) : stepPath" />
            </svg>
            <span class="motion__label"><code>{{ e.token.replace('--r-', '') }}</code><small>{{ e.value }}</small></span>
            <span class="motion__track">
              <span class="motion__block" :style="{ transitionDuration: 'var(--r-duration-slower)', transitionTimingFunction: `var(${e.token})` }" />
            </span>
            <span class="motion__use">{{ e.use }}</span>
          </div>
        </div>
      </Demo>
      <Demo title="The two-step blink" note="A live lamp blinks like an instrument: on for half the cycle, dim for the other half, with no fade between.">
        <RStatus tone="signal" label="Live" pulse />
        <RStatus tone="danger" label="Alarm" pulse />
        <span class="motion-blink-note">Only for things that are live right now. Off under reduced motion.</span>
      </Demo>
      <CodeBlock :code="motionCss" lang="css" title="Using the tokens" />
    </DocSection>

    <DocSection
      id="layers"
      title="Layers"
      description="Seven z-index steps, far enough apart to slot something in between. Popovers sit above dialogs on purpose: a select or a menu opened inside a dialog has to appear on top of it."
    >
      <ol class="layers">
        <li v-for="(layer, i) in layers" :key="layer.token" class="layer" :style="{ '--i': i }">
          <span class="layer__value">{{ layer.value }}</span>
          <span class="layer__name">{{ layer.name }}</span>
          <code class="layer__token">{{ layer.token }}</code>
          <span class="layer__note">{{ layer.note }}</span>
        </li>
      </ol>
    </DocSection>
  </DocPage>
</template>

<style>
/* ── Shape ───────────────────────────────────────────────────────────────── */
.shape-radii.r-grid-ruled {
  grid-template-columns: repeat(auto-fit, minmax(min(190px, 100%), 1fr));
}

.shape-radius {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  padding: 16px;
}

.shape-radius__tile {
  width: 64px;
  height: 64px;
  margin-bottom: 10px;
  border: 1px solid var(--r-border-strong);
  background: var(--r-bg-muted);
}

.shape-radius__tile.is-round {
  width: 20px;
  height: 20px;
  margin: 22px 0 32px 22px;
  border: 0;
  border-radius: var(--r-radius-round);
  background: var(--r-status-good);
}

.shape-radius__token {
  overflow: hidden;
  font-family: var(--r-font-mono);
  font-size: 12px;
  font-weight: var(--r-weight-semibold);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.shape-radius__value {
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: 11px;
}

.shape-radius__use {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
  line-height: 1.45;
}

.shape-groups {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.shape-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.shape-input {
  width: 160px;
}

.shape-point {
  width: 96px;
  height: 32px;
  overflow: visible;
}
.shape-point polyline {
  fill: none;
  stroke: var(--r-chart-1);
  stroke-width: 2;
}
.shape-point circle {
  fill: var(--r-chart-1);
  stroke: var(--r-chart-surface);
  stroke-width: 2;
}

/* The do / don't miniatures. The rounded one is wrong on purpose. */
.shape-mini {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 200px;
  padding: 14px;
  border: 1px solid var(--r-border-strong);
  background: var(--r-bg-surface);
}

.shape-mini__head {
  font-size: var(--r-text-md);
  font-weight: var(--r-weight-semibold);
}

.shape-mini.is-wrong {
  border-color: var(--r-border);
  border-radius: 18px;
  box-shadow: 0 12px 32px -12px rgb(0 0 0 / 0.25);
}

.shape-mini__pill {
  align-self: flex-start;
  padding: 3px 12px;
  border-radius: var(--r-radius-round);
  background: var(--r-warning-soft);
  color: var(--r-warning-text);
  font-size: var(--r-text-xs);
  font-weight: var(--r-weight-medium);
}

/* ── Rules ───────────────────────────────────────────────────────────────── */
.rules-lines {
  border-top: 1px solid var(--r-border-strong);
}

.rules-line {
  display: grid;
  grid-template-columns: 120px 180px minmax(0, 1fr);
  align-items: center;
  gap: 16px;
  min-height: 48px;
  padding: 8px 0;
  border-bottom: 1px solid var(--r-border-subtle);
}

.rules-line__sample {
  height: 0;
  border-top: 1px solid;
}

.rules-line__sample.is-strong {
  border-top: 2px solid var(--r-ink);
}

.rules-line__token {
  font-family: var(--r-font-mono);
  font-size: 12px;
}

.rules-line__use {
  color: var(--r-text-secondary);
  font-size: var(--r-text-sm);
}

@media (max-width: 720px) {
  .rules-line {
    grid-template-columns: 64px minmax(0, 1fr);
    row-gap: 4px;
  }
  .rules-line__use {
    grid-column: 2;
  }
}

.rules-kpis.r-grid-ruled {
  grid-template-columns: repeat(auto-fit, minmax(min(150px, 100%), 1fr));
}

.rules-kpi {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 14px 16px;
}

.rules-kpi__value {
  margin-top: 6px;
  font-size: var(--r-text-3xl);
  font-weight: var(--r-weight-semibold);
  line-height: 1;
  letter-spacing: var(--r-tracking-tighter);
}

.rules-pair {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(300px, 100%), 1fr));
  gap: 20px;
}

.rules-marked {
  padding: 18px 22px;
  border: 1px solid var(--r-border);
  background: var(--r-bg-surface);
}

.rules-hatch {
  position: relative;
  display: flex;
  align-items: flex-end;
  gap: 2px;
  width: 100%;
  max-width: 280px;
  height: 120px;
  padding-top: 20px;
  border-bottom: 1px solid var(--r-chart-axis);
}

.rules-hatch__bar {
  flex: 1;
  background-color: var(--r-chart-1);
}

.rules-hatch__bar.r-hatch {
  border: 1px solid var(--r-border-strong);
  border-bottom: 0;
  background-color: var(--r-bg-surface);
}

.rules-hatch__tag {
  position: absolute;
  top: 0;
  right: 0;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-caps);
  text-transform: uppercase;
}

.rules-strip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  height: 32px;
  padding: 0 14px;
  background: var(--r-bg-surface);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-caps);
  text-transform: uppercase;
  white-space: nowrap;
}

.rules-strip__start span {
  color: var(--r-text-disabled);
}

.rules-strip__end {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--r-text-tertiary);
}

/* ── Spacing ─────────────────────────────────────────────────────────────── */
.space-scale {
  display: flex;
  flex-direction: column;
  padding: 8px 0;
  border-top: 1px solid var(--r-border-strong);
  border-bottom: 1px solid var(--r-border);
}

.space-scale__row {
  display: grid;
  grid-template-columns: 96px 56px minmax(0, 1fr);
  align-items: center;
  gap: 12px;
  min-height: 26px;
}

.space-scale__token {
  font-family: var(--r-font-mono);
  font-size: 12px;
}

.space-scale__value {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.space-scale__bar {
  height: 10px;
  min-width: 1px;
  background: var(--r-brand);
}

.space-controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.space-controls__row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 12px;
}

.space-controls__token {
  width: 150px;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: 11px;
}

.space-controls__token code {
  margin-right: 6px;
  color: var(--r-text);
  font-size: 12px;
}

.space-controls__input {
  flex: 0 1 220px;
}

.space-controls__bar {
  width: 290px;
  max-width: 100%;
  border: 1px dashed var(--r-border-strong);
  background: var(--r-bg-surface);
}

.space-controls__use {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

.space-density {
  max-width: 560px;
}

.space-density__value {
  font-family: var(--r-font-mono);
  font-size: 12px;
}

/* ── Elevation ───────────────────────────────────────────────────────────── */
.lift-scene {
  position: relative;
  width: 100%;
  max-width: 460px;
  height: 200px;
}

.lift-panel {
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: min(260px, 100%);
  padding: 14px 16px 18px;
  border: 1px solid var(--r-border);
  background: var(--r-bg-surface);
}

.lift-panel__value {
  font-size: var(--r-text-4xl);
  font-weight: var(--r-weight-semibold);
  line-height: 1;
  letter-spacing: var(--r-tracking-tighter);
}

.lift-menu {
  position: absolute;
  top: 64px;
  left: min(180px, calc(100% - 220px));
  display: flex;
  flex-direction: column;
  width: 220px;
  padding: 4px;
}

.lift-menu__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 32px;
  padding: 0 10px;
  font-size: var(--r-text-sm);
}

.lift-menu__item.is-active {
  background: var(--r-bg-hover);
}

.lift-shadows {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(190px, 100%), 1fr));
  gap: 24px 20px;
  padding: 28px;
  border: 1px solid var(--r-border);
  background: var(--r-bg-canvas);
}

.lift-shadow {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.lift-shadow__tile {
  display: grid;
  place-items: center;
  height: 96px;
  margin-bottom: 8px;
  border: 1px solid var(--r-border-strong);
  background: var(--r-bg-raised);
}

.lift-shadow__tile code {
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: 12px;
}

.lift-shadow__use {
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-medium);
}

.lift-shadow__value {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: 10.5px;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

/* ── Motion ──────────────────────────────────────────────────────────────── */
.motion-notice {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
  max-width: 68ch;
  color: var(--r-text-secondary);
  font-size: var(--r-text-sm);
  line-height: 1.55;
}

.motion {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.motion__row {
  display: grid;
  grid-template-columns: 150px minmax(120px, 1fr) minmax(0, 220px);
  align-items: center;
  gap: 16px;
}

.motion__row--curve {
  grid-template-columns: 44px 200px minmax(120px, 1fr) minmax(0, 220px);
}

.motion__label {
  display: flex;
  flex-direction: column;
  gap: 2px;
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}

.motion__label code {
  color: var(--r-text);
  font-size: 12px;
  font-weight: var(--r-weight-semibold);
}

.motion__label small {
  color: var(--r-text-tertiary);
  font-size: 10.5px;
}

.motion__track {
  position: relative;
  height: 24px;
  border: 1px solid var(--r-border);
  background: var(--r-bg-surface);
}

.motion__block {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 16px;
  height: 16px;
  background: var(--r-ink);
  transition-property: left;
}

.motion.is-played .motion__block {
  left: calc(100% - 19px);
}

.motion.is-resetting .motion__block {
  transition: none !important;
}

.motion__use {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
  line-height: 1.4;
}

.motion__replay {
  align-self: flex-start;
}

.motion__curve {
  width: 44px;
  height: 44px;
  overflow: visible;
}

.motion__axis {
  fill: none;
  stroke: var(--r-border-strong);
  stroke-width: 2;
}

.motion__path {
  fill: none;
  stroke: var(--r-brand);
  stroke-width: 4;
  stroke-linecap: square;
}

.motion-blink-note {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-sm);
}

@media (max-width: 720px) {
  .motion__row,
  .motion__row--curve {
    grid-template-columns: minmax(0, 1fr);
    gap: 6px;
  }
  .motion__curve {
    display: none;
  }
}

/* ── Layers: an exploded stack of plates, the highest on top ──────────────── */
.layers {
  display: flex;
  flex-direction: column;
}

.layer {
  display: grid;
  grid-template-columns: 52px 92px minmax(0, 150px) minmax(0, 1fr);
  align-items: center;
  gap: 12px;
  min-height: 52px;
  margin-top: -1px;
  margin-right: calc((6 - var(--i)) * 16px);
  margin-left: calc(var(--i) * 16px);
  padding: 10px 16px;
  border: 1px solid var(--r-border-strong);
  background: var(--r-bg-surface);
}

.layer__value {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-lg);
  font-weight: var(--r-weight-semibold);
  font-variant-numeric: tabular-nums;
}

.layer__name {
  font-weight: var(--r-weight-medium);
}

.layer__token {
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: 11.5px;
}

.layer__note {
  color: var(--r-text-secondary);
  font-size: var(--r-text-sm);
}

@media (max-width: 720px) {
  .layer {
    grid-template-columns: 44px minmax(0, 1fr);
    row-gap: 2px;
    margin-right: 0;
    margin-left: calc(var(--i) * 6px);
  }
  .layer__value {
    grid-row: span 3;
  }
  .layer__token,
  .layer__note {
    grid-column: 2;
  }
}
</style>
