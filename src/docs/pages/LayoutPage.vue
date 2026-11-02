<script setup lang="ts">
import { ref } from 'vue'
import { RotateCcw } from 'lucide-vue-next'
import { RBadge, RButton, RChip, RInput, RSegmented, prefersReducedMotion } from '@/design-system'
import DocPage from '../components/DocPage.vue'
import DocSection from '../components/DocSection.vue'
import Demo from '../components/Demo.vue'
import CodeBlock from '../components/CodeBlock.vue'
import DoDont from '../components/DoDont.vue'
import { useTokenValues } from '../components/color'

const spaceSteps = ['px', '0_5', '1', '1_5', '2', '2_5', '3', '4', '5', '6', '7', '8', '10', '12', '16', '20'].map(
  (step) => `--r-space-${step}`,
)
const radiusSteps = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', 'full'].map((step) => `--r-radius-${step}`)
const controlSteps = ['xs', 'sm', 'md', 'lg'].map((step) => `--r-control-${step}`)
const shadows = [
  { token: '--r-shadow-xs', use: 'Cards, inputs and outline buttons at rest' },
  { token: '--r-shadow-sm', use: 'The thumb of a segmented control' },
  { token: '--r-shadow-md', use: 'Hover lift, tooltips, chart tooltips' },
  { token: '--r-shadow-lg', use: 'Popovers, menus, coachmarks' },
  { token: '--r-shadow-xl', use: 'Dialogs and the command palette' },
  { token: '--r-shadow-highlight', use: 'The inner top edge of solid buttons' },
]

const { values } = useTokenValues(() => [...spaceSteps, ...radiusSteps, ...controlSteps, ...shadows.map((s) => s.token)])

const label = (token: string) => token.replace(/^--r-(space|radius|control)-/, '').replace('_', '.')

/* Motion: nominal values as written in tokens.css (the live ones drop to 0.01ms under reduced motion). */
const durations = [
  { token: '--r-duration-instant', ms: 80, use: 'Pressed states' },
  { token: '--r-duration-fast', ms: 140, use: 'Hover colours, small fades' },
  { token: '--r-duration-base', ms: 200, use: 'Popovers, dialogs, switches' },
  { token: '--r-duration-slow', ms: 320, use: 'Sliding thumbs and indicators' },
  { token: '--r-duration-slower', ms: 600, use: 'Chart entrances, count-ups' },
]
const easings = [
  { token: '--r-ease-out', curve: [0.2, 0.8, 0.2, 1], use: 'Most things: fast start, gentle stop' },
  { token: '--r-ease-in-out', curve: [0.65, 0, 0.35, 1], use: 'Things that move and stay on screen' },
  { token: '--r-ease-spring', curve: [0.34, 1.36, 0.64, 1], use: 'Check marks and switch thumbs, a small overshoot' },
]

const curvePath = ([x1, y1, x2, y2]: number[]) => `M0,100 C${x1 * 100},${100 - y1 * 100} ${x2 * 100},${100 - y2 * 100} 100,0`

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

const layers = [
  { token: '--r-z-tooltip', value: 160, name: 'Tooltip', note: 'Above everything, even dialogs' },
  { token: '--r-z-toast', value: 140, name: 'Toast', note: 'Notices that should not hide behind a popover' },
  { token: '--r-z-popover', value: 120, name: 'Popover', note: 'Menus and popovers, also when opened inside a dialog' },
  { token: '--r-z-modal', value: 100, name: 'Modal', note: 'Dialogs, the command palette, tours' },
  { token: '--r-z-overlay', value: 80, name: 'Overlay', note: 'Drawers and their backdrops' },
  { token: '--r-z-dropdown', value: 50, name: 'Dropdown', note: 'In-page dropdowns' },
  { token: '--r-z-sticky', value: 10, name: 'Sticky', note: 'Sticky headers and top bars' },
]

const controlSizes = ['sm', 'md', 'lg'] as const

const view = ref('week')
const views = [
  { label: 'Day', value: 'day' },
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' },
]

const radiusCss = `.card    { border-radius: var(--r-radius-xl); padding: 6px; } /* 20 */
.well    { border-radius: var(--r-radius-lg); padding: 4px; } /* 20 − 6 = 14 */
.control { border-radius: var(--r-radius-md); }              /* 14 − 4 = 10 */
.chip    { border-radius: var(--r-radius-full); }`

const motionCss = `.thing {
  transition: transform var(--r-duration-base) var(--r-ease-out);
}

/* tokens.css already does this for you */
@media (prefers-reduced-motion: reduce) {
  :root {
    --r-duration-base: 0.01ms;
  }
}`
</script>

<template>
  <DocPage eyebrow="Foundations" title="Layout & elevation">
    <template #lead>
      A 4px grid, corners that get smaller as you go inward, shadows you only notice when they are gone, and motion
      that gets out of the way.
    </template>

    <DocSection
      id="spacing"
      title="Spacing"
      description="Every gap, padding and size sits on a 4px grid, with 2px and 6px steps for the tight spots inside controls."
    >
      <div class="doc-space">
        <div v-for="token in spaceSteps" :key="token" class="doc-space__row">
          <code class="doc-space__token">space-{{ label(token) }}</code>
          <span class="doc-space__value">{{ values[token] }}</span>
          <span class="doc-space__bar" :style="{ width: `var(${token})` }" />
        </div>
      </div>
      <p class="doc-p">
        A few pairs come up again and again. Cards use 20 to 24px of padding and sit 16px apart. Controls pad 12 to 16px
        on the sides. Sections on a page are 48 to 72px apart, so a screen breathes without feeling empty.
      </p>

      <Demo title="Control heights" note="32, 40 and 48px. A button and a field of the same size line up on one row.">
        <div class="doc-controls">
          <div v-for="size in controlSizes" :key="size" class="doc-controls__row">
            <code class="doc-controls__token">control-{{ size }} · {{ values[`--r-control-${size}`] }}</code>
            <RInput :size="size" placeholder="Search" :aria-label="`Search, ${size}`" class="doc-controls__input" />
            <RButton :size="size">Apply</RButton>
            <RButton :size="size" variant="outline">Reset</RButton>
          </div>
        </div>
      </Demo>
    </DocSection>

    <DocSection
      id="radius"
      title="Radius"
      description="Soft, but never bubbly. The rule for nesting is simple: the inner radius is the outer radius minus the padding between them, so the curves stay parallel."
    >
      <div class="doc-radii">
        <div v-for="token in radiusSteps" :key="token" class="doc-radius">
          <span class="doc-radius__tile" :style="{ borderRadius: `var(${token})` }" />
          <code class="doc-radius__token">radius-{{ label(token) }}</code>
          <span class="doc-radius__value">{{ token.endsWith('full') ? 'full' : values[token] }}</span>
        </div>
      </div>

      <Demo title="Nested radius" note="Card 20 → well 14 → control 10 → chip full.">
        <div class="doc-nest">
          <div class="doc-nest__card">
            <span class="doc-nest__tag">Card · 20px, padding 6</span>
            <div class="doc-nest__well">
              <span class="doc-nest__tag">Well · 14px, padding 4</span>
              <div class="doc-nest__control">
                <span class="doc-nest__tag">Control · 10px</span>
                <RChip variant="soft" size="sm" tabindex="-1">Chip · full</RChip>
              </div>
            </div>
          </div>
          <div class="doc-nest__live">
            <span class="doc-label">The same rule on real components</span>
            <RSegmented v-model="view" :options="views" label="View" />
          </div>
        </div>
      </Demo>
      <CodeBlock :code="radiusCss" lang="css" title="The rule in CSS" />
      <DoDont
        do="Shrink the radius as you nest, by the padding in between."
        dont="Use the same radius inside and out. The inner corners look fat and the gap looks uneven."
      >
        <template #do-example>
          <span class="doc-nest-mini"><span class="doc-nest-mini__inner" style="border-radius: 10px" /></span>
        </template>
        <template #dont-example>
          <span class="doc-nest-mini"><span class="doc-nest-mini__inner" style="border-radius: 22px" /></span>
        </template>
      </DoDont>
    </DocSection>

    <DocSection
      id="elevation"
      title="Elevation"
      description="Shadows in the references are wide and faint: a big blur, a negative spread, a few percent of opacity. They lift a surface off the canvas without drawing a dark edge around it."
    >
      <div class="doc-shadows">
        <div v-for="s in shadows" :key="s.token" class="doc-shadow">
          <div class="doc-shadow__card" :class="{ 'is-highlight': s.token.endsWith('highlight') }" :style="{ boxShadow: `var(${s.token})` }">
            <code>{{ s.token.replace('--r-shadow-', 'shadow-') }}</code>
          </div>
          <p class="doc-shadow__use">{{ s.use }}</p>
          <p class="doc-shadow__value">{{ values[s.token] }}</p>
        </div>
      </div>
      <p class="doc-p">
        In dark mode the same tokens get far stronger values, because a faint shadow vanishes on a dark canvas. Most of
        the separation there comes from 1px borders instead, which is why floating panels switch to the stronger border
        in dark mode.
      </p>
    </DocSection>

    <DocSection
      id="motion"
      title="Motion"
      description="Five durations and three easings. Most movement uses ease-out: it starts quickly, so the interface feels responsive, and settles gently."
    >
      <p v-if="reduced" class="doc-motion-notice">
        <RBadge tone="warning" dot>Reduced motion is on</RBadge>
        Your system asks for reduced motion, so every duration is 0.01ms right now and the dots below jump instead of
        gliding. That is the intended behaviour.
      </p>
      <Demo title="Durations" note="All with ease-out.">
        <div class="doc-motion" :class="{ 'is-played': played, 'is-resetting': resetting }">
          <div v-for="d in durations" :key="d.token" class="doc-motion__row">
            <span class="doc-motion__label"><code>{{ d.token.replace('--r-duration-', '') }}</code> {{ d.ms }}ms</span>
            <span class="doc-motion__track">
              <span class="doc-motion__dot" :style="{ transitionDuration: `var(${d.token})`, transitionTimingFunction: 'var(--r-ease-out)' }" />
            </span>
            <span class="doc-motion__use">{{ d.use }}</span>
          </div>
          <RButton size="sm" variant="outline" class="doc-motion__replay" @click="replay">
            <template #leading><RotateCcw /></template>
            Replay
          </RButton>
        </div>
      </Demo>
      <Demo title="Easings" note="Each at 600ms, so you can see the shape.">
        <div class="doc-motion" :class="{ 'is-played': played, 'is-resetting': resetting }">
          <div v-for="e in easings" :key="e.token" class="doc-motion__row doc-motion__row--ease">
            <svg class="doc-motion__curve" viewBox="-6 -24 112 148" aria-hidden="true">
              <path class="doc-motion__axis" d="M0,0 V100 H100" />
              <path class="doc-motion__path" :d="curvePath(e.curve)" />
            </svg>
            <span class="doc-motion__label"><code>{{ e.token.replace('--r-', '') }}</code></span>
            <span class="doc-motion__track">
              <span class="doc-motion__dot" :style="{ transitionDuration: 'var(--r-duration-slower)', transitionTimingFunction: `var(${e.token})` }" />
            </span>
            <span class="doc-motion__use">{{ e.use }}</span>
          </div>
        </div>
      </Demo>
      <CodeBlock :code="motionCss" lang="css" title="Using the tokens" />
    </DocSection>

    <DocSection
      id="layers"
      title="Layers"
      description="Seven z-index steps, far enough apart to slot something in between. Popovers sit above dialogs on purpose: a select or a menu opened inside a dialog has to appear on top of it."
    >
      <div class="doc-layers" role="list">
        <div
          v-for="(layer, i) in layers"
          :key="layer.token"
          class="doc-layer"
          role="listitem"
          :style="{ '--i': layers.length - 1 - i, zIndex: layers.length - i }"
        >
          <span class="doc-layer__value">{{ layer.value }}</span>
          <span class="doc-layer__name">{{ layer.name }}</span>
          <code class="doc-layer__token">{{ layer.token }}</code>
          <span class="doc-layer__note">{{ layer.note }}</span>
        </div>
      </div>
    </DocSection>
  </DocPage>
</template>

<style>
.doc-space {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 16px 20px;
  border: 1px solid var(--r-border-subtle);
  border-radius: var(--r-radius-xl);
  background: var(--r-bg-surface);
}

.doc-space__row {
  display: grid;
  grid-template-columns: 96px 48px minmax(0, 1fr);
  align-items: center;
  gap: 12px;
  min-height: 28px;
}

.doc-space__token {
  color: var(--r-text);
  font-family: var(--r-font-mono);
  font-size: 12px;
}

.doc-space__value {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.doc-space__bar {
  height: 12px;
  min-width: 1px;
  border-radius: 3px;
  background: color-mix(in srgb, var(--r-brand) 70%, var(--r-bg-surface));
}

.doc-controls {
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
}

.doc-controls__row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.doc-controls__token {
  width: 150px;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: 12px;
}

.doc-controls__input {
  flex: 1 1 180px;
  max-width: 280px;
}

.doc-radii {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(104px, 1fr));
  gap: 16px;
}

.doc-radius {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.doc-radius__tile {
  height: 88px;
  margin-bottom: 6px;
  border: 1.5px solid var(--r-border-strong);
  background: var(--r-bg-surface);
}

.doc-radius__token {
  font-family: var(--r-font-mono);
  font-size: 12px;
}

.doc-radius__value {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

.doc-nest {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 32px;
  width: 100%;
}

.doc-nest__card {
  flex: 1 1 300px;
  max-width: 440px;
  padding: 6px;
  border: 1px solid var(--r-border);
  border-radius: var(--r-radius-xl);
  background: var(--r-bg-surface);
  box-shadow: var(--r-shadow-sm);
}

.doc-nest__well {
  padding: 4px;
  border-radius: var(--r-radius-lg);
  background: var(--r-bg-track);
}

.doc-nest__control {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 12px;
  border-radius: var(--r-radius-md);
  background: var(--r-bg-surface);
  box-shadow: var(--r-shadow-sm);
}

.doc-nest__tag {
  display: block;
  padding: 6px 10px 8px;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
  font-weight: var(--r-weight-medium);
}

.doc-nest__control .doc-nest__tag {
  padding: 0;
}

.doc-nest__live {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.doc-nest-mini {
  display: grid;
  width: 150px;
  height: 96px;
  padding: 12px;
  border: 1px solid var(--r-border);
  border-radius: 22px;
  background: var(--r-bg-surface);
}

.doc-nest-mini__inner {
  background: var(--r-bg-track);
}

.doc-shadows {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(220px, 100%), 1fr));
  gap: 28px 20px;
  padding: 32px;
  border-radius: var(--r-radius-xl);
  background: var(--r-bg-canvas);
  box-shadow: inset 0 0 0 1px var(--r-border-subtle);
}

.doc-shadow {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.doc-shadow__card {
  display: grid;
  place-items: center;
  height: 110px;
  margin-bottom: 8px;
  border-radius: var(--r-radius-lg);
  background: var(--r-bg-surface);
}
.doc-shadow__card code {
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: 12px;
}
.doc-shadow__card.is-highlight {
  background: var(--r-ink);
}
.doc-shadow__card.is-highlight code {
  color: var(--r-on-ink);
}

.doc-shadow__use {
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-medium);
}

.doc-shadow__value {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: 10.5px;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.doc-motion-notice {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
  max-width: 68ch;
  color: var(--r-text-secondary);
  font-size: var(--r-text-sm);
  line-height: 1.55;
}

.doc-motion {
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
}

.doc-motion__row {
  display: grid;
  grid-template-columns: 140px minmax(120px, 1fr) minmax(0, 220px);
  align-items: center;
  gap: 16px;
}

.doc-motion__row--ease {
  grid-template-columns: 56px 140px minmax(120px, 1fr) minmax(0, 220px);
}

.doc-motion__label {
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  font-variant-numeric: tabular-nums;
}
.doc-motion__label code {
  margin-right: 4px;
  color: var(--r-text);
  font-family: var(--r-font-mono);
  font-size: 12px;
}

.doc-motion__track {
  position: relative;
  height: 28px;
  border-radius: var(--r-radius-full);
  background: var(--r-bg-track);
}

.doc-motion__dot {
  position: absolute;
  top: 4px;
  left: 4px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--r-brand);
  box-shadow: var(--r-shadow-sm);
  transition-property: left;
}

.doc-motion.is-played .doc-motion__dot {
  left: calc(100% - 24px);
}

.doc-motion.is-resetting .doc-motion__dot {
  transition: none !important;
}

.doc-motion__use {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
  line-height: 1.4;
}

.doc-motion__replay {
  align-self: flex-start;
}

.doc-motion__curve {
  width: 48px;
  height: 64px;
  overflow: visible;
}

.doc-motion__axis {
  fill: none;
  stroke: var(--r-border);
  stroke-width: 2;
}

.doc-motion__path {
  fill: none;
  stroke: var(--r-brand);
  stroke-width: 5;
  stroke-linecap: round;
}

@media (max-width: 640px) {
  .doc-motion__row,
  .doc-motion__row--ease {
    grid-template-columns: minmax(0, 1fr);
    gap: 6px;
  }
  .doc-motion__curve {
    display: none;
  }
}

.doc-layers {
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 24px 0 8px;
}

.doc-layer {
  position: relative;
  display: grid;
  grid-template-columns: 56px 90px minmax(0, 150px) minmax(0, 1fr);
  align-items: center;
  gap: 12px;
  min-height: 56px;
  margin-top: -10px;
  margin-left: calc(var(--i) * 3%);
  padding: 12px 18px;
  border: 1px solid var(--r-border-subtle);
  border-radius: var(--r-radius-lg);
  background: color-mix(in srgb, var(--r-brand) calc(4% + var(--i) * 2.5%), var(--r-bg-surface));
  box-shadow: var(--r-shadow-md);
}

.doc-layer__value {
  font-size: var(--r-text-xl);
  font-weight: var(--r-weight-semibold);
  font-variant-numeric: tabular-nums;
}

.doc-layer__name {
  font-weight: var(--r-weight-medium);
}

.doc-layer__token {
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: 11.5px;
}

.doc-layer__note {
  color: var(--r-text-secondary);
  font-size: var(--r-text-sm);
}

@media (max-width: 720px) {
  .doc-layer {
    grid-template-columns: 48px minmax(0, 1fr);
    row-gap: 2px;
    margin-left: calc(var(--i) * 1.5%);
  }
  .doc-layer__value {
    grid-row: span 3;
  }
  .doc-layer__token,
  .doc-layer__note {
    grid-column: 2;
  }
}
</style>
