<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { RLogo, RSpecList, RSupergraphic, STRIVE_MARK, type SpecItem } from '@/design-system'
import DocPage from '../components/DocPage.vue'
import DocSection from '../components/DocSection.vue'
import Demo from '../components/Demo.vue'
import CodeBlock from '../components/CodeBlock.vue'
import DoDont from '../components/DoDont.vue'

/* ── The six marks ─────────────────────────────────────────────────────────── */
const marks = [
  { brand: '21strive', variant: 'lockup', name: '21 Strive lockup', use: 'The company signature: documents, sites, the corner of a product.' },
  { brand: '21strive', variant: 'mark', name: '21 Strive mark', use: 'Favicons, app icons, the start of a strip, anywhere the name is already close.' },
  { brand: 'rapi', variant: 'lockup', name: 'Rapi lockup', use: 'The design language: these docs, the library, talks about the system.' },
  { brand: 'rapi', variant: 'mark', name: 'Rapi mark', use: 'The docs favicon and small corners where Rapi is already written.' },
  { brand: 'pakem', variant: 'lockup', name: 'Pakem lockup', use: 'The backend standard: its docs site and anything that speaks for it.' },
  { brand: 'pakem', variant: 'mark', name: 'Pakem mark', use: 'The Pakem favicon. Its p is the r closed into a bowl and cut at the family diagonal.' },
] as const
const grounds = [
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
  { id: 'cobalt', label: 'Cobalt' },
]

// On a phone the three grounds share one row, so the marks step down a size.
const narrow = ref(false)
let narrowQuery: MediaQueryList | null = null
const onNarrow = (event: MediaQueryListEvent) => (narrow.value = event.matches)
onMounted(() => {
  narrowQuery = window.matchMedia('(max-width: 760px)')
  narrow.value = narrowQuery.matches
  narrowQuery.addEventListener('change', onNarrow)
})
onBeforeUnmount(() => narrowQuery?.removeEventListener('change', onNarrow))
const markSize = (variant: 'lockup' | 'mark') => (variant === 'lockup' ? (narrow.value ? 14 : 22) : narrow.value ? 18 : 26)

const logoSnippet = `<RLogo brand="21strive" :size="24" />              <!-- lockup -->
<RLogo brand="21strive" variant="mark" :size="16" />
<RLogo brand="rapi" :size="24" />
<RLogo brand="rapi" variant="mark" :size="16" label="" />  <!-- next to the word already -->`

/* ── Construction ───────────────────────────────────────────────────────────── */
// Every diagonal of the mark rises 50 over a run of 54.3. A line through (x0, 50) at that slope:
const K = 54.3 / 50
const diag = (x0: number, y: number) => x0 + (50 - y) * K
const TOP = -40
const BOTTOM = 140
const guides = {
  horizontals: [0, 50, 100],
  verticals: [0, 46.5, 100.8, 155.1, 201.6],
  // The 2's upper diagonal, and the line that carries the 2's lower diagonal and the 1's flag.
  diagonals: [23.25, 100.8].map((x0) => ({ x1: diag(x0, BOTTOM), y1: BOTTOM, x2: diag(x0, TOP), y2: TOP })),
}

const facts: SpecItem[] = [
  { label: 'Width', value: '201.6', mono: true },
  { label: 'Height', value: '100', mono: true },
  { label: 'Diagonals', value: '50 over 54.3', mono: true, hint: 'About 42.6°, every one of them' },
  { label: 'Stem of the 1', value: '46.5', mono: true },
  { label: 'Foot of the 2', value: '46.5', mono: true },
  { label: 'Centre', value: '100.8, 50', mono: true, hint: 'The long diagonal passes through it' },
]

// The 21 Strive lockup, measured live: the gap is the width of "21" and the cap height is half the mark.
const ghost = ref<SVGTextElement | null>(null)
const word = ref<SVGTextElement | null>(null)
const a = ref(59)
const wordWidth = ref(275)
onMounted(async () => {
  await document.fonts.ready
  if (ghost.value) a.value = Math.round(ghost.value.getComputedTextLength() * 10) / 10
  if (word.value) wordWidth.value = Math.round(word.value.getComputedTextLength() * 10) / 10
})
const lockupEnd = computed(() => 201.6 + a.value + wordWidth.value)

/* ── Supergraphic ───────────────────────────────────────────────────────────── */
const superSnippet = `<!-- The parent is positioned and clips; the graphic fills it and ignores the pointer. -->
<section class="cover">
  <RSupergraphic variant="one" anchor="bottom-right" />
  <h1>Settlement & clearing</h1>
</section>

<style>
.cover { position: relative; overflow: hidden; }
.cover h1 { position: relative; }
<\/style>`

/* ── Misuse ─────────────────────────────────────────────────────────────────── */
const misuse = [
  { id: 'recolour', name: 'Recolour', text: 'Do not recolour the mark, not even in a hue that sits near the brand.', ground: 'light' },
  { id: 'stretch', name: 'Stretch', text: 'Do not stretch, squash or skew it. Scale it by its height only.', ground: 'dark' },
  { id: 'outline', name: 'Outline', text: 'Do not draw it as an outline. It is a solid cut from one block.', ground: 'light' },
  { id: 'contrast', name: 'Low contrast', text: 'Do not set it on a ground it sinks into: grey on black, grey on grey.', ground: 'dark' },
  { id: 'effects', name: 'Effects', text: 'Do not add shadows, glows, gradients or bevels.', ground: 'light' },
  { id: 'rearrange', name: 'Rearrange', text: 'Do not change the gap, the size or the order of the mark and the word.', ground: 'dark' },
]
</script>

<template>
  <DocPage eyebrow="Foundations" title="Brand">
    <template #lead>
      The 21 Strive logogram is a 2 and a 1 cut from one block. Rapi, the design language, takes its r from the same
      geometry. This page shows the six marks, how they are built, how they become supergraphics, and what not to do
      with them.
    </template>

    <DocSection
      id="logo"
      title="Logo"
      description="21 Strive signs the company and its products. Rapi signs the design language. Use the lockup by default, and the mark alone where the name is already close by or space is short. The marks come in ink, in white, and in white on cobalt."
    >
      <div class="brand-marks">
        <div class="brand-marks__head" aria-hidden="true">
          <span />
          <span v-for="g in grounds" :key="g.id" class="brand-marks__ground-label">{{ g.label }}</span>
        </div>
        <div v-for="(m, i) in marks" :key="m.name" class="brand-marks__row">
          <div class="brand-marks__info">
            <span class="r-index">{{ String(i + 1).padStart(2, '0') }}</span>
            <span class="brand-marks__name">{{ m.name }}</span>
            <span class="brand-marks__use">{{ m.use }}</span>
          </div>
          <div v-for="g in grounds" :key="g.id" class="brand-marks__tile" :class="`is-${g.id}`">
            <RLogo :brand="m.brand" :variant="m.variant" :size="markSize(m.variant)" :label="`${m.name} on ${g.label.toLowerCase()}`" />
          </div>
        </div>
      </div>
      <CodeBlock :code="logoSnippet" title="RLogo" />
      <p class="doc-p">
        <code class="doc-c">size</code> is the height of the logogram in pixels; the word of a lockup is sized from it.
        The logo is an image with the brand name as its accessible name. Pass an empty
        <code class="doc-c">label</code> when the same words already sit next to it, so screen readers do not hear the
        name twice.
      </p>
    </DocSection>

    <DocSection
      id="construction"
      title="Construction"
      description="The logogram is drawn on a grid 201.6 units wide and 100 tall. Every diagonal rises 50 over a run of 54.3, the stem of the 1 is 46.5 wide, and the long diagonal that runs through the 2 and into the 1 passes exactly through the centre."
    >
      <div class="brand-build r-grid-ruled">
        <div class="brand-build__drawing">
          <div class="brand-build__scroll">
            <svg class="brand-draw" viewBox="-40 -40 285.6 180" role="img" aria-labelledby="brand-draw-title">
              <title id="brand-draw-title">
                The 21 Strive logogram on its construction grid: 201.6 wide, 100 tall, diagonals rising 50 over 54.3,
                both 46.5 wide at the stem and the foot, the long diagonal through the centre.
              </title>
              <g class="brand-draw__guides">
                <line v-for="y in guides.horizontals" :key="`h${y}`" x1="-40" :y1="y" x2="245.6" :y2="y" />
                <line v-for="x in guides.verticals" :key="`v${x}`" :x1="x" y1="-40" :x2="x" y2="140" />
                <line v-for="(d, i) in guides.diagonals" :key="`d${i}`" :x1="d.x1" :y1="d.y1" :x2="d.x2" :y2="d.y2" />
              </g>
              <g class="brand-draw__mark">
                <path :d="STRIVE_MARK.two" />
                <path :d="STRIVE_MARK.one" />
              </g>
              <g class="brand-draw__dims">
                <line x1="0" y1="-22" x2="201.6" y2="-22" />
                <line x1="0" y1="-26" x2="0" y2="-18" />
                <line x1="201.6" y1="-26" x2="201.6" y2="-18" />
                <line x1="-22" y1="0" x2="-22" y2="100" />
                <line x1="-26" y1="0" x2="-18" y2="0" />
                <line x1="-26" y1="50" x2="-18" y2="50" />
                <line x1="-26" y1="100" x2="-18" y2="100" />
                <line x1="0" y1="118" x2="46.5" y2="118" />
                <line x1="0" y1="114" x2="0" y2="122" />
                <line x1="46.5" y1="114" x2="46.5" y2="122" />
                <line x1="155.1" y1="118" x2="201.6" y2="118" />
                <line x1="155.1" y1="114" x2="155.1" y2="122" />
                <line x1="201.6" y1="114" x2="201.6" y2="122" />
                <line x1="100.8" y1="64" x2="155.1" y2="64" />
                <line x1="100.8" y1="60" x2="100.8" y2="68" />
                <line x1="155.1" y1="60" x2="155.1" y2="68" />
              </g>
              <g class="brand-draw__labels">
                <text x="100.8" y="-28" text-anchor="middle">201.6</text>
                <text x="-27" y="27" text-anchor="end">50</text>
                <text x="-27" y="77" text-anchor="end">50</text>
                <text x="23.25" y="132" text-anchor="middle">46.5</text>
                <text x="178.35" y="132" text-anchor="middle">46.5</text>
                <text x="127.95" y="77" text-anchor="middle">54.3</text>
                <text x="95" y="45" text-anchor="end">Centre</text>
              </g>
              <circle class="brand-draw__centre" cx="100.8" cy="50" r="3" />
            </svg>
          </div>
        </div>
        <div class="brand-build__facts">
          <span class="r-eyebrow">The logogram</span>
          <RSpecList :items="facts" dense />
        </div>
      </div>

      <h3 class="doc-h4">The r is the 1, turned</h3>
      <p class="doc-p">
        The r of Rapi is built from the 1 of 21 Strive: the same 46.5 stem and the same flag, with the flag moved to the
        other side of the stem and flipped so its flat side is on top. Its diagonal keeps the family's 50 over 54.3.
      </p>
      <Demo surface="plain" padding="md" center>
        <div class="brand-build__scroll">
          <svg class="brand-turn" viewBox="0 -26 332 178" role="img" aria-labelledby="brand-turn-title">
            <title id="brand-turn-title">The 1 of 21 Strive next to the r of Rapi: same stem, same flag, flag moved and flipped.</title>
            <g class="brand-draw__guides">
              <line v-for="y in [0, 50, 100]" :key="y" x1="0" :y1="y" x2="332" :y2="y" />
            </g>
            <g transform="translate(10 0)">
              <rect class="brand-turn__stem" x="54.3" y="0" width="46.5" height="100" />
              <polygon class="brand-turn__flag" points="0,50 54.3,0 54.3,50" />
            </g>
            <g class="brand-turn__arrow">
              <line x1="134" y1="50" x2="194" y2="50" />
              <polyline points="186,44 194,50 186,56" />
            </g>
            <g transform="translate(221.2 0)">
              <rect class="brand-turn__stem" x="0" y="0" width="46.5" height="100" />
              <polygon class="brand-turn__flag" points="46.5,0 100.8,0 46.5,50" />
            </g>
            <g class="brand-draw__dims">
              <line x1="64.3" y1="114" x2="110.8" y2="114" />
              <line x1="221.2" y1="114" x2="267.7" y2="114" />
              <line x1="10" y1="-10" x2="64.3" y2="-10" />
              <line x1="267.7" y1="-10" x2="322" y2="-10" />
            </g>
            <g class="brand-draw__labels">
              <text x="87.55" y="126" text-anchor="middle">46.5</text>
              <text x="244.45" y="126" text-anchor="middle">46.5</text>
              <text x="37.15" y="-15" text-anchor="middle">54.3</text>
              <text x="294.85" y="-15" text-anchor="middle">54.3</text>
              <text x="60.4" y="146" text-anchor="middle" class="is-caption">1 · 21 Strive</text>
              <text x="271.6" y="146" text-anchor="middle" class="is-caption">r · Rapi</text>
            </g>
          </svg>
        </div>
      </Demo>

      <h3 class="doc-h4">The 21 Strive lockup</h3>
      <p class="doc-p">
        Two values set the lockup, as in the brand book. The gap between the mark and the word is <strong>a</strong>, the
        width of "21". The cap height of the word is <strong>b</strong>, half the height of the mark, so the word sits
        on the mark's middle line. "21" is set in Geist SemiBold and "Strive" in Geist Regular.
      </p>
      <Demo surface="plain" padding="md" center>
        <div class="brand-build__scroll">
          <svg
            class="brand-lockup"
            :viewBox="`-12 -30 ${lockupEnd + 60} 172`"
            role="img"
            aria-labelledby="brand-lockup-title"
          >
            <title id="brand-lockup-title">
              The 21 Strive lockup: the gap between mark and word equals the width of 21, and the cap height of the word
              is half the mark.
            </title>
            <g class="brand-draw__guides">
              <line v-for="y in [0, 50, 100]" :key="y" x1="-12" :y1="y" :x2="lockupEnd + 32" :y2="y" />
              <line v-for="x in [0, 201.6, 201.6 + a, 201.6 + 2 * a]" :key="x" :x1="x" y1="-30" :x2="x" y2="142" />
            </g>
            <g class="brand-draw__mark">
              <path :d="STRIVE_MARK.two" />
              <path :d="STRIVE_MARK.one" />
            </g>
            <text ref="ghost" class="brand-lockup__ghost" x="201.6" y="100">21</text>
            <text ref="word" class="brand-lockup__word" :x="201.6 + a" y="100"><tspan class="is-semibold">21</tspan> Strive</text>
            <g class="brand-draw__dims">
              <line x1="201.6" y1="118" :x2="201.6 + a" y2="118" />
              <line :x1="201.6 + a" y1="118" :x2="201.6 + 2 * a" y2="118" />
              <line :x1="lockupEnd + 16" y1="0" :x2="lockupEnd + 16" y2="100" />
              <line :x1="lockupEnd + 12" y1="0" :x2="lockupEnd + 20" y2="0" />
              <line :x1="lockupEnd + 12" y1="50" :x2="lockupEnd + 20" y2="50" />
              <line :x1="lockupEnd + 12" y1="100" :x2="lockupEnd + 20" y2="100" />
            </g>
            <g class="brand-draw__labels is-large">
              <text :x="201.6 + a / 2" y="134" text-anchor="middle">a</text>
              <text :x="201.6 + 1.5 * a" y="134" text-anchor="middle">a</text>
              <text :x="lockupEnd + 26" y="29">b</text>
              <text :x="lockupEnd + 26" y="79">b</text>
            </g>
          </svg>
        </div>
      </Demo>

      <h3 class="doc-h4">Clear space and minimum size</h3>
      <p class="doc-p">
        Keep a margin of <strong>b</strong>, half the height of the mark, clear on every side of a mark or a lockup.
        Nothing enters it: no text, no rule, not the edge of the panel. On screen the mark alone holds up down to 10px
        tall; a lockup needs 16px, which sets its word at 11px.
      </p>
      <div class="brand-space r-grid-ruled">
        <div class="brand-space__cell">
          <span class="r-eyebrow">Clear space</span>
          <div class="brand-clear">
            <span class="brand-clear__label is-top">b</span>
            <span class="brand-clear__label is-left">b</span>
            <div class="brand-clear__box">
              <span class="brand-clear__logo"><RLogo brand="21strive" :size="40" label="21 Strive" /></span>
            </div>
            <span class="brand-clear__label is-right">b</span>
            <span class="brand-clear__label is-bottom">b</span>
          </div>
        </div>
        <div class="brand-space__cell">
          <span class="r-eyebrow">Minimum size</span>
          <div class="brand-min">
            <div class="brand-min__item">
              <RLogo brand="21strive" variant="mark" :size="10" label="21 Strive mark at 10 pixels" />
              <span class="r-label">Mark · 10 px</span>
            </div>
            <div class="brand-min__item">
              <RLogo brand="rapi" variant="mark" :size="10" label="Rapi mark at 10 pixels" />
              <span class="r-label">Mark · 10 px</span>
            </div>
            <div class="brand-min__item">
              <RLogo brand="21strive" :size="16" label="21 Strive lockup at 16 pixels" />
              <span class="r-label">Lockup · 16 px</span>
            </div>
            <div class="brand-min__item">
              <RLogo brand="rapi" :size="16" label="Rapi lockup at 16 pixels" />
              <span class="r-label">Lockup · 16 px</span>
            </div>
          </div>
        </div>
      </div>
    </DocSection>

    <DocSection
      id="supergraphic"
      title="Supergraphic"
      description="The brand book blows the logogram up and crops it behind content. RSupergraphic does the same: the 1, the 2 or the whole mark as a wash one step off the surface, or the construction lines as hairlines. One per view at most, and never behind data."
    >
      <div class="brand-super">
        <div class="brand-cover">
          <RSupergraphic variant="one" anchor="bottom-right" />
          <div class="brand-cover__content">
            <RLogo brand="21strive" :size="22" label="21 Strive" />
            <h3 class="brand-cover__title">Settlement &amp; clearing</h3>
            <span class="brand-cover__meta">Annual review · March 2026</span>
          </div>
          <RLogo class="brand-cover__corner" brand="21strive" variant="mark" :size="14" label="" />
        </div>
        <div class="brand-super__grid r-grid-ruled">
          <div class="brand-tile">
            <RSupergraphic variant="two" anchor="top-right" />
            <div class="brand-tile__content">
              <span class="r-eyebrow">The 2 · muted</span>
              <span class="brand-tile__title">Sign in to Treasury</span>
            </div>
          </div>
          <div class="brand-tile is-cobalt" data-theme="dark">
            <RSupergraphic variant="mark" anchor="bottom-right" tone="brand" :scale="0.8" />
            <div class="brand-tile__content">
              <span class="r-eyebrow">The mark · on cobalt</span>
              <RLogo brand="21strive" variant="mark" :size="22" label="21 Strive" />
            </div>
          </div>
          <div class="brand-tile">
            <RSupergraphic variant="construction" anchor="bottom-right" />
            <div class="brand-tile__content">
              <span class="r-eyebrow">Construction lines</span>
              <span class="brand-tile__title">No batches held</span>
              <span class="brand-tile__text">Payments that miss a cut-off show up here.</span>
            </div>
          </div>
          <div class="brand-tile">
            <RSupergraphic variant="one" anchor="bottom-left" tone="line" />
            <div class="brand-tile__content">
              <span class="r-eyebrow">The 1 · line</span>
              <span class="brand-tile__title">Ground station</span>
            </div>
          </div>
        </div>
      </div>
      <p class="doc-p">
        Good places for it: brand covers and title slides, empty states, sign-in panels, and the hero of a section. It
        fills its positioned parent, is cropped by it, and never takes pointer events, so it cannot get in the way of
        what sits on top.
      </p>
      <CodeBlock :code="superSnippet" title="Usage" />
      <DoDont
        do="Use one supergraphic per view, behind a cover, an empty state or a sign-in panel, where nothing underneath needs reading."
        dont="Put it behind a chart, a table or a form, or use two in one view. It turns data into decoration and competes for attention with the thing people came to read."
      />
    </DocSection>

    <DocSection
      id="misuse"
      title="Misuse"
      description="The marks come in ink, in white, and in white on cobalt, at their own proportions. The brand book crosses out what breaks them; these are the same mistakes."
    >
      <div class="brand-misuse r-grid-ruled">
        <figure v-for="(m, i) in misuse" :key="m.id" class="brand-wrong">
          <div class="brand-wrong__tile" :class="[`is-${m.ground}`, `is-${m.id}`]">
            <svg
              v-if="m.id !== 'rearrange'"
              class="brand-wrong__mark"
              :viewBox="`0 0 ${STRIVE_MARK.width} ${STRIVE_MARK.height}`"
              :preserveAspectRatio="m.id === 'stretch' ? 'none' : 'xMidYMid meet'"
              role="img"
              :aria-label="`21 Strive mark, ${m.name.toLowerCase()}: wrong`"
            >
              <path :d="STRIVE_MARK.two" />
              <path :d="STRIVE_MARK.one" />
            </svg>
            <span v-else class="brand-wrong__rearranged" role="img" aria-label="21 Strive lockup with the word too big and too close: wrong">
              <RLogo brand="21strive" variant="mark" :size="22" label="" />
              <span>21 Strive</span>
            </span>
            <svg class="brand-wrong__strike" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              <line x1="0" y1="0" x2="100" y2="100" />
            </svg>
          </div>
          <figcaption class="brand-wrong__caption">
            <span class="brand-wrong__name"><span class="r-index">{{ String(i + 1).padStart(2, '0') }}</span>{{ m.name }}</span>
            <span class="brand-wrong__text">{{ m.text }}</span>
          </figcaption>
        </figure>
      </div>
    </DocSection>
  </DocPage>
</template>

<style>
/* ── The six marks on three grounds ─────────────────────────────────────── */
.brand-marks {
  border-top: 1px solid var(--r-border-strong);
}

.brand-marks__head,
.brand-marks__row {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) repeat(3, minmax(0, 1fr));
}

.brand-marks__head {
  border-bottom: 1px solid var(--r-border);
}

.brand-marks__ground-label {
  padding: 8px 12px;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-caps);
  text-transform: uppercase;
}

.brand-marks__row {
  border-bottom: 1px solid var(--r-border);
}

.brand-marks__info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  padding: 14px 16px 16px 0;
}

.brand-marks__name {
  margin-top: 4px;
  font-size: var(--r-text-md);
  font-weight: var(--r-weight-semibold);
}

.brand-marks__use {
  color: var(--r-text-secondary);
  font-size: var(--r-text-sm);
  line-height: 1.5;
}

/* Fixed grounds: these show the marks as they are printed, whatever the page theme. */
.brand-marks__tile {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  min-height: 112px;
  padding: 16px;
  border-left: 1px solid var(--r-border);
  overflow: hidden;
}

.brand-marks__tile.is-light {
  background: var(--r-neutral-0);
  color: var(--r-neutral-900);
}

.brand-marks__tile.is-dark {
  background: var(--r-neutral-900);
  color: var(--r-neutral-0);
}

.brand-marks__tile.is-cobalt {
  background: var(--r-cobalt-700);
  color: var(--r-neutral-0);
}

@media (max-width: 760px) {
  .brand-marks__head {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .brand-marks__head > span:first-child {
    display: none;
  }
  .brand-marks__row {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .brand-marks__info {
    grid-column: 1 / -1;
    padding-right: 0;
  }
  .brand-marks__tile {
    min-height: 88px;
    padding: 10px 6px;
  }
  .brand-marks__tile:nth-child(2) {
    border-left: 0;
  }
}

/* ── Construction drawings ───────────────────────────────────────────────── */
.brand-build.r-grid-ruled {
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
}

@media (max-width: 900px) {
  .brand-build.r-grid-ruled {
    grid-template-columns: minmax(0, 1fr);
  }
}

.brand-build__drawing {
  min-width: 0;
  padding: 20px 16px;
}

.brand-build__facts {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
  padding: 16px;
}

/* Drawings keep a legible size on phones and scroll sideways instead of shrinking their labels. */
.brand-build__scroll {
  width: 100%;
  overflow-x: auto;
}

.brand-draw {
  width: 100%;
  min-width: 420px;
  height: auto;
}

.brand-turn {
  width: 100%;
  max-width: 560px;
  min-width: 400px;
  height: auto;
  margin: 0 auto;
}

.brand-lockup {
  width: 100%;
  max-width: 720px;
  min-width: 460px;
  height: auto;
  margin: 0 auto;
}

.brand-draw__guides line {
  stroke: var(--r-border-strong);
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
}

.brand-draw__mark path {
  fill: var(--r-text);
}

.brand-draw__dims line {
  stroke: var(--r-text-tertiary);
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
}

.brand-draw__labels text {
  fill: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: 6px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.brand-draw__labels text.is-caption {
  fill: var(--r-text);
  font-weight: var(--r-weight-semibold);
  letter-spacing: 0.1em;
}

.brand-draw__labels.is-large text {
  font-size: 11px;
  font-style: italic;
  text-transform: none;
}

/* The centre is a point, so it is the one circle in the drawing. */
.brand-draw__centre {
  fill: var(--r-brand);
  stroke: var(--r-bg-surface);
  stroke-width: 1.5;
  vector-effect: non-scaling-stroke;
}

.brand-turn__stem {
  fill: var(--r-text);
}

.brand-turn__flag {
  fill: var(--r-brand);
}

.brand-turn__arrow line,
.brand-turn__arrow polyline {
  fill: none;
  stroke: var(--r-text-tertiary);
  stroke-width: 1.5;
  stroke-linecap: square;
  vector-effect: non-scaling-stroke;
}

.brand-lockup__ghost {
  fill: var(--r-border-strong);
  font-family: var(--r-font-sans);
  font-size: 70px;
  font-weight: var(--r-weight-semibold);
  letter-spacing: -0.035em;
}

.brand-lockup__word {
  fill: var(--r-text);
  font-family: var(--r-font-sans);
  font-size: 70px;
  font-weight: var(--r-weight-regular);
  letter-spacing: -0.035em;
}

.brand-lockup__word .is-semibold {
  font-weight: var(--r-weight-semibold);
}

/* ── Clear space and minimum size ────────────────────────────────────────── */
.brand-space.r-grid-ruled {
  grid-template-columns: repeat(auto-fit, minmax(min(300px, 100%), 1fr));
}

.brand-space__cell {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
  padding: 16px 16px 24px;
}

.brand-clear {
  position: relative;
  align-self: center;
  padding: 18px;
}

/* The tinted band is the clear space: b on every side of the logo's own box. */
.brand-clear__box {
  padding: 20px;
  outline: 1px dashed var(--r-brand);
  background: color-mix(in srgb, var(--r-brand) 8%, transparent);
}

.brand-clear__logo {
  display: block;
  outline: 1px solid var(--r-border-strong);
  background: var(--r-bg-surface);
  line-height: 0;
}

.brand-clear__label {
  position: absolute;
  color: var(--r-brand-text);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-style: italic;
}
.brand-clear__label.is-top {
  top: 0;
  left: 50%;
}
.brand-clear__label.is-bottom {
  bottom: 0;
  left: 50%;
}
.brand-clear__label.is-left {
  top: 50%;
  left: 4px;
  transform: translateY(-50%);
}
.brand-clear__label.is-right {
  top: 50%;
  right: 4px;
  transform: translateY(-50%);
}

.brand-min {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: end;
  gap: 24px;
}

.brand-min__item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
}

/* ── Supergraphic ────────────────────────────────────────────────────────── */
.brand-super {
  display: flex;
  flex-direction: column;
}

.brand-cover {
  position: relative;
  min-height: 280px;
  overflow: hidden;
  border: 1px solid var(--r-border);
  border-bottom: 0;
  background: var(--r-bg-surface);
}

.brand-cover__content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 60%;
  padding: 24px 24px 72px;
}

.brand-cover__title {
  margin-top: 28px;
  font-size: clamp(var(--r-text-3xl), 4.6vw, var(--r-text-5xl));
  font-weight: var(--r-weight-semibold);
  line-height: 1;
  letter-spacing: var(--r-tracking-display);
}

.brand-cover__meta {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: var(--r-tracking-caps);
  text-transform: uppercase;
}

.brand-cover__corner {
  position: absolute;
  z-index: 1;
  bottom: 20px;
  left: 24px;
}

.brand-super__grid.r-grid-ruled {
  grid-template-columns: repeat(auto-fit, minmax(min(200px, 100%), 1fr));
}

.brand-tile {
  position: relative;
  min-width: 0;
  min-height: 200px;
  overflow: hidden;
}

.brand-tile.is-cobalt {
  background: var(--r-cobalt-700);
}

.brand-tile__content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  padding: 14px 16px;
}

.brand-tile__title {
  font-size: var(--r-text-xl);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-tight);
}

.brand-tile__text {
  max-width: 24ch;
  color: var(--r-text-secondary);
  font-size: var(--r-text-sm);
}

.brand-tile.is-cobalt .r-eyebrow,
.brand-tile.is-cobalt .r-logo {
  color: var(--r-neutral-0);
}

@media (max-width: 640px) {
  .brand-cover__content {
    max-width: 100%;
  }
}

/* ── Misuse: crossed out, like the brand book ────────────────────────────── */
.brand-misuse.r-grid-ruled {
  grid-template-columns: repeat(auto-fill, minmax(min(240px, 100%), 1fr));
}

.brand-wrong {
  display: flex;
  flex-direction: column;
  min-width: 0;
  margin: 0;
}

.brand-wrong__tile {
  position: relative;
  display: grid;
  place-items: center;
  height: 140px;
  overflow: hidden;
  border-bottom: 1px solid var(--r-border);
}

.brand-wrong__tile.is-light {
  background: var(--r-neutral-0);
  color: var(--r-neutral-900);
}

.brand-wrong__tile.is-dark {
  background: var(--r-neutral-900);
  color: var(--r-neutral-0);
}

.brand-wrong__mark {
  width: 120px;
  height: 60px;
  overflow: visible;
  fill: currentColor;
}

.is-recolour .brand-wrong__mark {
  fill: var(--r-magenta-500);
}

.is-stretch .brand-wrong__mark {
  width: 168px;
  height: 40px;
}

.is-outline .brand-wrong__mark {
  fill: none;
  stroke: currentColor;
  stroke-width: 1.5;
}

.is-outline .brand-wrong__mark path {
  vector-effect: non-scaling-stroke;
}

.brand-wrong__tile.is-contrast {
  color: var(--r-neutral-800);
}

.is-effects .brand-wrong__mark {
  filter: drop-shadow(0 6px 6px rgb(0 0 0 / 0.35)) drop-shadow(0 0 12px rgb(27 58 171 / 0.55));
}

.brand-wrong__rearranged {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 30px;
  font-weight: var(--r-weight-bold);
  letter-spacing: -0.02em;
}

.brand-wrong__strike {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.brand-wrong__strike line {
  stroke: var(--r-danger);
  stroke-width: 1.5;
  vector-effect: non-scaling-stroke;
}

.brand-wrong__caption {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 14px 16px;
}

.brand-wrong__name {
  display: flex;
  align-items: baseline;
  gap: 10px;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-caps);
  text-transform: uppercase;
}

.brand-wrong__text {
  color: var(--r-text-secondary);
  font-size: var(--r-text-sm);
  line-height: 1.5;
}
</style>
