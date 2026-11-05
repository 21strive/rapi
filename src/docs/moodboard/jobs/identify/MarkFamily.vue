<script setup lang="ts">
/**
 * The marks of the family, drawn by the library from the brand geometry and never redrawn here.
 * Pick a member and the lockup or the mark; open the construction of the logogram and pick a
 * dimension to see it measured; turn the supergraphic behind a cover.
 */
import { computed, ref } from 'vue'
import { RotateCw } from 'lucide-vue-next'
import { RIconButton, RLogo, RSegmented, RSupergraphic, RSwitch, STRIVE_MARK } from '@/design-system'

type Brand = 'rapi' | '21strive' | 'pakem'

const props = withDefaults(
  defineProps<{
    /** `family` 2x1 · `mark` 1x1 · `construction` 2x2 · `cover` 2x2 with the supergraphic. */
    mode: 'family' | 'mark' | 'construction' | 'cover'
    start?: Brand
  }>(),
  { start: 'rapi' },
)

const FAMILY: { id: Brand; name: string; signs: string; mark: string }[] = [
  { id: 'rapi', name: 'Rapi', signs: 'Signs the design language', mark: 'The r is the 1, turned' },
  { id: '21strive', name: '21 Strive', signs: 'Signs the company', mark: 'A 2 and a 1 from one block' },
  { id: 'pakem', name: 'Pakem', signs: 'Signs the backend standard', mark: 'The 1 mirrored, flag right' },
]

/* ── Family and mark ───────────────────────────────────────────────────────────────── */
const brand = ref<Brand>(props.start)
const markOnly = ref(false)
const member = computed(() => FAMILY.find((f) => f.id === brand.value) ?? FAMILY[0])
const radios = ref<(HTMLElement | null)[]>([])
function onRadioKey(event: KeyboardEvent) {
  const i = FAMILY.findIndex((f) => f.id === brand.value)
  let k = i
  if (event.key === 'ArrowDown' || event.key === 'ArrowRight') k = (i + 1) % FAMILY.length
  else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') k = (i - 1 + FAMILY.length) % FAMILY.length
  else return
  event.preventDefault()
  brand.value = FAMILY[k].id
  radios.value[k]?.focus()
}
function nextBrand() {
  const i = FAMILY.findIndex((f) => f.id === brand.value)
  brand.value = FAMILY[(i + 1) % FAMILY.length].id
}

/* ── Construction ──────────────────────────────────────────────────────────────────── */
const guides = ref(true)
const dim = ref<'width' | 'height' | 'stem' | 'diagonal'>('diagonal')
const dimPick = computed({
  get: () => dim.value,
  set: (v: string | number | undefined) =>
    (dim.value = v === 'width' ? 'width' : v === 'height' ? 'height' : v === 'stem' ? 'stem' : 'diagonal'),
})
const dims = [
  { label: '201.6', value: 'width' },
  { label: '100', value: 'height' },
  { label: '46.5', value: 'stem' },
  { label: '50 / 54.3', value: 'diagonal' },
]
const DIM_TEXT = {
  width: 'The logogram is 201.6 units wide on a grid 100 tall.',
  height: '100 units tall. A lockup sets its word on the middle line, at 50.',
  stem: 'The stem of the 1 is 46.5 wide, and so is the foot of the 2.',
  diagonal: 'Every diagonal rises 50 over a run of 54.3, about 42.6°.',
}
const K = 54.3 / 50
const diag = (x0: number, y: number) => x0 + (50 - y) * K
const guideLines = {
  horizontals: [0, 50, 100],
  verticals: [0, 46.5, 100.8, 155.1, 201.6],
  diagonals: [23.25, 100.8].map((x0) => ({ x1: diag(x0, 124), y1: 124, x2: diag(x0, -24), y2: -24 })),
}

/* ── Cover ─────────────────────────────────────────────────────────────────────────── */
type Variant = 'one' | 'two' | 'mark' | 'construction'
type Anchor = 'top-left' | 'top-right' | 'bottom-right' | 'bottom-left'
const variant = ref<Variant>('one')
const varPick = computed({
  get: () => variant.value,
  set: (v: string | number | undefined) =>
    (variant.value = v === 'two' ? 'two' : v === 'mark' ? 'mark' : v === 'construction' ? 'construction' : 'one'),
})
const variants = [
  { label: 'The 1', value: 'one' },
  { label: 'The 2', value: 'two' },
  { label: 'Mark', value: 'mark' },
  { label: 'Lines', value: 'construction' },
]
const ANCHORS: Anchor[] = ['bottom-right', 'bottom-left', 'top-left', 'top-right']
const anchor = ref<Anchor>('bottom-right')
function turn() {
  anchor.value = ANCHORS[(ANCHORS.indexOf(anchor.value) + 1) % ANCHORS.length]
}
</script>

<template>
  <!-- 2x1: the family, lockup or mark -->
  <div v-if="mode === 'family'" class="mk marks marks--family">
    <div class="marks__stage">
      <span class="r-eyebrow">Logo family</span>
      <div class="marks__logo" aria-live="polite">
        <RLogo :brand="brand" :variant="markOnly ? 'mark' : 'lockup'" :size="30" :label="`${member.name} ${markOnly ? 'mark' : 'lockup'}`" />
      </div>
      <p class="marks__caption mk-truncate">{{ markOnly ? member.mark : member.signs }}</p>
    </div>
    <div class="marks__side">
      <div class="marks__radios" role="radiogroup" aria-label="Family member" @keydown="onRadioKey">
        <div
          v-for="(f, i) in FAMILY"
          :key="f.id"
          :ref="(el) => (radios[i] = el as HTMLElement | null)"
          role="radio"
          class="marks__radio"
          :class="{ 'is-on': brand === f.id }"
          :aria-checked="brand === f.id"
          :tabindex="brand === f.id ? 0 : -1"
          @click="brand = f.id"
        >
          <span class="marks__dot" aria-hidden="true" />
          {{ f.name }}
        </div>
      </div>
      <RSwitch v-model="markOnly" size="sm" label="Mark only" class="mk-end" />
    </div>
  </div>

  <!-- 1x1: the mark alone, press for the next -->
  <div v-else-if="mode === 'mark'" class="mk marks marks--mark">
    <div class="mk-row mk-between">
      <span class="r-eyebrow">The mark</span>
      <span class="r-label">{{ FAMILY.findIndex((f) => f.id === brand) + 1 }}/3</span>
    </div>
    <button type="button" class="marks__press mk-reset" :aria-label="`${member.name} mark. Press for the next one`" @click="nextBrand">
      <RLogo :brand="brand" variant="mark" :size="44" label="" />
    </button>
    <p class="marks__caption mk-truncate" aria-live="polite">{{ member.name }} · {{ member.mark }}</p>
  </div>

  <!-- 2x2: the logogram on its construction grid -->
  <div v-else-if="mode === 'construction'" class="mk marks marks--build">
    <div class="mk-row mk-between">
      <span class="r-eyebrow">Construction</span>
      <RSwitch v-model="guides" size="sm" label="Guides" />
    </div>
    <svg class="marks__draw" viewBox="-30 -30 261.6 166" role="img" :aria-label="`21 Strive logogram, ${DIM_TEXT[dim]}`">
      <g v-if="guides" class="marks__guides">
        <line v-for="y in guideLines.horizontals" :key="`h${y}`" x1="-30" :y1="y" x2="231.6" :y2="y" />
        <line v-for="x in guideLines.verticals" :key="`v${x}`" :x1="x" y1="-30" :x2="x" y2="136" />
        <line v-for="(d, i) in guideLines.diagonals" :key="`d${i}`" :x1="d.x1" :y1="d.y1" :x2="d.x2" :y2="d.y2" />
      </g>
      <g class="marks__glyph">
        <path :d="STRIVE_MARK.two" />
        <path :d="STRIVE_MARK.one" />
      </g>
      <g class="marks__dim">
        <template v-if="dim === 'width'">
          <line x1="0" y1="-14" x2="201.6" y2="-14" />
          <line x1="0" y1="-19" x2="0" y2="-9" />
          <line x1="201.6" y1="-19" x2="201.6" y2="-9" />
          <text x="100.8" y="-20" text-anchor="middle">201.6</text>
        </template>
        <template v-else-if="dim === 'height'">
          <line x1="-14" y1="0" x2="-14" y2="100" />
          <line x1="-19" y1="0" x2="-9" y2="0" />
          <line x1="-19" y1="100" x2="-9" y2="100" />
          <text x="-18" y="53" text-anchor="end">100</text>
        </template>
        <template v-else-if="dim === 'stem'">
          <line x1="155.1" y1="114" x2="201.6" y2="114" />
          <line x1="155.1" y1="109" x2="155.1" y2="119" />
          <line x1="201.6" y1="109" x2="201.6" y2="119" />
          <line x1="0" y1="114" x2="46.5" y2="114" />
          <line x1="0" y1="109" x2="0" y2="119" />
          <line x1="46.5" y1="109" x2="46.5" y2="119" />
          <text x="178.35" y="128" text-anchor="middle">46.5</text>
          <text x="23.25" y="128" text-anchor="middle">46.5</text>
        </template>
        <template v-else>
          <line x1="100.8" y1="50" x2="155.1" y2="0" class="is-strong" />
          <line x1="100.8" y1="62" x2="155.1" y2="62" />
          <line x1="167" y1="0" x2="167" y2="50" />
          <text x="127.95" y="74" text-anchor="middle">54.3</text>
          <text x="171" y="29">50</text>
          <circle cx="100.8" cy="50" r="2.6" />
        </template>
      </g>
    </svg>
    <RSegmented v-model="dimPick" :options="dims" size="sm" block label="Dimension" />
    <p class="marks__caption" aria-live="polite">{{ DIM_TEXT[dim] }}</p>
  </div>

  <!-- 2x2: a cover with the supergraphic behind it -->
  <div v-else class="mk marks marks--cover">
    <RSupergraphic :variant="variant" :anchor="anchor" />
    <div class="marks__cover">
      <span class="r-eyebrow">Annual review · 2026</span>
      <p class="marks__title">Settlement &amp; clearing</p>
      <p class="marks__meta">One supergraphic per view, behind a cover, never behind data.</p>
    </div>
    <div class="marks__controls mk-end">
      <RSegmented v-model="varPick" :options="variants" size="sm" label="Supergraphic" />
      <RIconButton size="sm" variant="outline" :label="`Grow from another corner, now ${anchor.replace('-', ' ')}`" @click="turn">
        <RotateCw />
      </RIconButton>
    </div>
    <RLogo class="marks__corner" brand="21strive" variant="mark" :size="12" label="21 Strive" />
  </div>
</template>

<style scoped>
.marks__caption {
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  line-height: 1.4;
}

/* Family */
.marks--family {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 112px;
  gap: 16px;
}

.marks__stage {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.marks__logo {
  display: flex;
  flex: 1 1 auto;
  align-items: center;
  min-height: 0;
}

.marks__side {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-left: 14px;
  border-left: 1px solid var(--r-border-subtle);
}

.marks__radios {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.marks__radio {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 24px;
  font-size: var(--r-text-sm);
  cursor: pointer;
}

.marks__radio:focus-visible {
  outline: 2px solid var(--r-focus);
  outline-offset: 1px;
}

.marks__dot {
  position: relative;
  width: 12px;
  height: 12px;
  border: 1px solid var(--r-border-control);
  border-radius: var(--r-radius-round);
}

.marks__radio.is-on .marks__dot {
  border-color: var(--r-brand);
}

.marks__radio.is-on .marks__dot::after {
  content: '';
  position: absolute;
  inset: 2px;
  border-radius: var(--r-radius-round);
  background: var(--r-brand);
}

/* Mark */
.marks__press {
  display: grid;
  flex: 1 1 auto;
  place-items: center;
  min-height: 0;
  cursor: pointer;
}

.marks__press:hover {
  background: var(--r-bg-hover);
}

/* Construction */
.marks__draw {
  flex: 1 1 auto;
  width: 100%;
  min-height: 0;
  overflow: hidden;
}

.marks__guides line {
  stroke: var(--r-border-strong);
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
}

.marks__glyph path {
  fill: var(--r-text);
}

.marks__dim line {
  stroke: var(--r-brand);
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
}

.marks__dim line.is-strong {
  stroke-width: 2;
}

.marks__dim circle {
  fill: var(--r-brand);
  stroke: var(--r-bg-muted);
  stroke-width: 1.5;
  vector-effect: non-scaling-stroke;
}

.marks__dim text {
  fill: var(--r-brand-text);
  font-family: var(--r-font-mono);
  font-size: 9px;
}

/* Cover */
.marks--cover {
  position: relative;
  overflow: hidden;
}

.marks__cover,
.marks__controls,
.marks__corner {
  position: relative;
  z-index: 1;
}

.marks__cover {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 6px;
}

.marks__title {
  max-width: 11ch;
  font-size: var(--r-text-3xl);
  font-weight: var(--r-weight-semibold);
  line-height: 1;
  letter-spacing: var(--r-tracking-display);
}

.marks__meta {
  max-width: 26ch;
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  line-height: 1.4;
}

.marks__controls {
  display: flex;
  align-items: center;
  gap: 6px;
}

.marks__controls :deep(.r-segmented) {
  background: var(--r-bg-surface);
}

.marks__corner {
  position: absolute;
  top: 8px;
  right: 12px;
}
</style>
