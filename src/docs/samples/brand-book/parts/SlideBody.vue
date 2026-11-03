<script setup lang="ts">
import { ArrowRight, Check } from 'lucide-vue-next'
import { RBadge, RButton, RLogo, RSpecList, RStatus, RSupergraphic } from '@/design-system'
import type { SpecItem } from '@/design-system'

/**
 * The content of each slide, drawn on the 1200 × 675 canvas of BookSlide. Positions are in
 * canvas pixels. The construction numbers come from the mark itself (brand/marks.ts): a block
 * 201.6 wide and 100 high, diagonals rising 50 over 54.3, a stem of 46.5, centre at 100.8, 50.
 */
defineProps<{ id: string }>()

const pad = (n: number) => String(n).padStart(2, '0')

/* ── Construction: the mark at 2 px a unit, its top-left corner at (144, 256) ─────── */
const K = 2
const X0 = 144
const Y0 = 256
const x = (u: number) => X0 + u * K
const y = (u: number) => Y0 + u * K

const horizontal = [
  { from: 0, to: 46.5, text: '46.5' },
  { from: 46.5, to: 100.8, text: '54.3' },
  { from: 100.8, to: 155.1, text: '54.3' },
  { from: 155.1, to: 201.6, text: '46.5' },
]
const vertical = [
  { from: 0, to: 50, text: '50' },
  { from: 50, to: 100, text: '50' },
]

const constructionSpec: SpecItem[] = [
  { label: 'Block', value: '201.6 × 100', mono: true },
  { label: 'Diagonals', value: 'rise 50, run 54.3', mono: true, hint: 'About 42.6°. All four are parallel.' },
  { label: 'Stem of the 1', value: '46.5', mono: true },
  { label: 'Foot of the 2', value: '46.5', mono: true },
  { label: 'Centre', value: '100.8, 50', mono: true, hint: 'The 2 hands over to the 1 here.' },
  { label: 'Lockup gap', value: 'Width of “21”' },
  { label: 'Word size', value: 'Cap height ½ mark' },
]

/* ── Restrictions ────────────────────────────────────────────────────────────────── */
const rules = [
  'Keep clear space of half the logogram’s height on every side.',
  'Use the logo in ink, white or cobalt, on a plain background.',
  'Never stretch, condense, rotate or outline it.',
  'Never recolour the 2 and the 1 separately, or set the word in another face.',
]
const misuses = [
  { id: 'contrast', caption: 'Too little contrast' },
  { id: 'colour', caption: 'Off-brand colour' },
  { id: 'condensed', caption: 'Condensed' },
  { id: 'grey', caption: 'On mid grey' },
  { id: 'red', caption: 'Recoloured' },
  { id: 'stretched', caption: 'Stretched' },
]

/* ── Palette ─────────────────────────────────────────────────────────────────────── */
const ramp = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]
</script>

<template>
  <!-- 01 · Cover -->
  <template v-if="id === 'cover'">
    <RLogo brand="21strive" variant="mark" :size="236" label="21 Strive" class="s-bb-cover-mark" />
    <div class="s-bb-cover-titles">
      <p>Twenty One Strive</p>
      <p>Logo &amp; Branding Presentation</p>
    </div>
    <p class="s-bb-cover-ed">Edition 2 · set in Rapi 0.2</p>
  </template>

  <!-- 02 · The diagonal (the deck's photograph, rebuilt from the mark's own lines) -->
  <template v-else-if="id === 'statement'">
    <div class="s-bb-head">
      <p class="s-bb-head__label">Brand</p>
      <p class="s-bb-head__title">The diagonal</p>
    </div>
    <p class="s-bb-desc">Every diagonal in the logogram rises 50 over a run of 54.3. Layouts borrow the same angle.</p>
    <div class="s-bb-cut s-bb-cut--a" data-theme="dark">
      <RSupergraphic variant="construction" anchor="top-right" />
    </div>
    <div class="s-bb-cut s-bb-cut--b">
      <RSupergraphic variant="one" tone="brand" anchor="bottom-right" />
    </div>
    <RLogo brand="21strive" variant="lockup" :size="46" label="21 Strive" class="s-bb-statement-logo" />
  </template>

  <!-- 03 · Primary logo on light and dark -->
  <template v-else-if="id === 'logo'">
    <div class="s-bb-half">
      <div class="s-bb-head">
        <p class="s-bb-head__label">Primary logo</p>
        <p class="s-bb-head__title">Light background</p>
      </div>
      <RLogo brand="21strive" variant="lockup" :size="76" label="21 Strive on a light background" class="s-bb-half__logo" />
    </div>
    <div class="s-bb-half s-bb-half--dark" data-theme="dark">
      <div class="s-bb-head s-bb-head--top">
        <p class="s-bb-head__label">Primary logo</p>
        <p class="s-bb-head__title">Dark background</p>
      </div>
      <RLogo brand="21strive" variant="lockup" :size="76" label="21 Strive on a dark background" class="s-bb-half__logo" />
    </div>
  </template>

  <!-- 04 · Construction -->
  <template v-else-if="id === 'construction'">
    <div class="s-bb-head">
      <p class="s-bb-head__label">Primary logo</p>
      <p class="s-bb-head__title">Construction</p>
    </div>
    <p class="s-bb-desc">A 2 and a 1 cut from one block. Both diagonals rise 50 over 54.3, the stem is 46.5 wide, and the diagonals meet at the centre.</p>
    <div class="s-bb-con">
      <RSupergraphic variant="construction" anchor="top-left" />
      <RLogo brand="21strive" variant="mark" :size="200" label="21 Strive logogram on its construction grid" class="s-bb-con__mark" />
    </div>
    <span class="s-bb-dim s-bb-dim--h s-bb-dim--above" :style="{ left: `${x(0)}px`, top: `${y(0) - 22}px`, width: `${201.6 * K}px` }">
      <span class="s-bb-dim__text">201.6</span>
    </span>
    <span
      v-for="d in horizontal"
      :key="`h${d.from}`"
      class="s-bb-dim s-bb-dim--h"
      :style="{ left: `${x(d.from)}px`, top: `${y(100) + 22}px`, width: `${(d.to - d.from) * K}px` }"
    >
      <span class="s-bb-dim__text">{{ d.text }}</span>
    </span>
    <span class="s-bb-dim s-bb-dim--v s-bb-dim--left" :style="{ left: `${x(0) - 24}px`, top: `${y(0)}px`, height: `${100 * K}px` }">
      <span class="s-bb-dim__text">100</span>
    </span>
    <span
      v-for="d in vertical"
      :key="`v${d.from}`"
      class="s-bb-dim s-bb-dim--v"
      :style="{ left: `${x(201.6) + 24}px`, top: `${y(d.from)}px`, height: `${(d.to - d.from) * K}px` }"
    >
      <span class="s-bb-dim__text">{{ d.text }}</span>
    </span>
    <span class="s-bb-centre" :style="{ left: `${x(100.8) - 5}px`, top: `${y(50) - 5}px` }" />
    <span class="s-bb-centre-label" :style="{ left: `${x(100.8) + 10}px`, top: `${y(50) + 10}px` }">Centre<br />100.8, 50</span>
    <div class="s-bb-con-spec">
      <p class="s-bb-mini-label">Numbers, in units of the block</p>
      <RSpecList :items="constructionSpec" dense />
    </div>
  </template>

  <!-- 05 · Restrictions -->
  <template v-else-if="id === 'restrictions'">
    <div class="s-bb-head">
      <p class="s-bb-head__label">Primary logo</p>
      <p class="s-bb-head__title">Restrictions</p>
    </div>
    <p class="s-bb-desc">Don’t obscure the logo, change its colour outside the brand palette, or alter its proportions.</p>
    <ol class="s-bb-rules">
      <li v-for="(r, i) in rules" :key="i">
        <span class="s-bb-rules__i">{{ pad(i + 1) }}</span>
        <span>{{ r }}</span>
      </li>
    </ol>
    <div class="s-bb-misuse">
      <figure v-for="m in misuses" :key="m.id" class="s-bb-misuse__item">
        <div class="s-bb-misuse__tile" :class="`is-${m.id}`">
          <RLogo brand="21strive" variant="lockup" :size="26" label="" class="s-bb-misuse__logo" />
          <svg class="s-bb-x" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
            <line x1="0" y1="100" x2="100" y2="0" />
          </svg>
        </div>
        <figcaption>{{ m.caption }}</figcaption>
      </figure>
    </div>
  </template>

  <!-- 06 · Brand palette -->
  <template v-else-if="id === 'palette'">
    <div class="s-bb-head">
      <p class="s-bb-head__label">Colors</p>
      <p class="s-bb-head__title">Brand palette</p>
    </div>
    <p class="s-bb-desc">Cobalt carries the brand, periwinkle supports it and black does the work. Rapi builds every interface colour from these three.</p>
    <div class="s-bb-ramp">
      <p class="s-bb-mini-label">Cobalt ramp in Rapi · 50 to 950</p>
      <div class="s-bb-ramp__row">
        <span v-for="step in ramp" :key="step" class="s-bb-ramp__chip" :class="{ 'is-brand': step === 700 || step === 400 }">
          <span class="s-bb-ramp__swatch" :style="{ background: `var(--r-cobalt-${step})` }" />
          <span class="s-bb-ramp__step">{{ step }}</span>
        </span>
      </div>
      <div class="s-bb-signal">
        <span class="s-bb-signal__swatch" />
        <span><b>International Orange #FF4F00</b> · the signal in Rapi, for what is live or now</span>
      </div>
    </div>
    <div class="s-bb-blocks">
      <div class="s-bb-block s-bb-block--cobalt">
        <p class="s-bb-block__label">Primary brand color</p>
        <p class="s-bb-block__hex">#1B3AAB</p>
        <p class="s-bb-block__meta">RGB 27 58 171 · --r-cobalt-700</p>
      </div>
      <div class="s-bb-block s-bb-block--peri">
        <p class="s-bb-block__label">Secondary brand color</p>
        <p class="s-bb-block__hex">#7E94E2</p>
        <p class="s-bb-block__meta">RGB 126 148 226 · --r-cobalt-400</p>
      </div>
      <div class="s-bb-block s-bb-block--black">
        <p class="s-bb-block__label">Primary black</p>
        <p class="s-bb-block__hex">#151515</p>
        <p class="s-bb-block__meta">RGB 21 21 21 · --r-neutral-900</p>
      </div>
    </div>
  </template>

  <!-- 07 · Typefaces -->
  <template v-else-if="id === 'type'">
    <div class="s-bb-head">
      <p class="s-bb-head__label">Typography</p>
      <p class="s-bb-head__title">Typefaces</p>
    </div>
    <div class="s-bb-type">
      <span class="s-bb-type__i" style="top: 2px">01</span>
      <p class="s-bb-type__small">Operations software</p>
      <span class="s-bb-type__i" style="top: 150px">02</span>
      <p class="s-bb-type__big">Software for operators</p>
      <span class="s-bb-type__i" style="top: 336px">03</span>
      <div class="s-bb-type__body">
        <p>21 Strive designs and builds software for operators, banks and the teams that run them: ledgers, payment flows, scheduling, and the dashboards around them.</p>
        <p>Every screen is set in Geist and Geist Mono, two open typefaces under the SIL Open Font License. Geist reads; Geist Mono labels, in capitals, wherever a value needs a name.</p>
      </div>
    </div>
    <dl class="s-bb-type-spec">
      <div style="top: 0">
        <span class="s-bb-type__i">01</span>
        <dt>Small header</dt>
        <dd>Geist Mono Bold</dd>
        <dd class="s-bb-type-spec__rule">All caps · 10% letter spacing</dd>
      </div>
      <div style="top: 150px">
        <span class="s-bb-type__i">02</span>
        <dt>Big header</dt>
        <dd>Geist Semi Bold</dd>
        <dd class="s-bb-type-spec__rule">−4% letter spacing</dd>
      </div>
      <div style="top: 336px">
        <span class="s-bb-type__i">03</span>
        <dt>Body text</dt>
        <dd>Geist Regular</dd>
        <dd class="s-bb-type-spec__rule">1.5 line spacing</dd>
      </div>
    </dl>
  </template>

  <!-- 08 · Implementation -->
  <template v-else-if="id === 'implementation'">
    <div class="s-bb-head">
      <p class="s-bb-head__label">Branding</p>
      <p class="s-bb-head__title">Implementation</p>
    </div>
    <p class="s-bb-desc">The logogram can be cropped and enlarged into a supergraphic behind a title. One per layout, never behind data.</p>
    <div class="s-bb-impl s-bb-impl--a">
      <div class="s-bb-impl__side">
        <p class="s-bb-word"><b>21</b> Strive</p>
        <RLogo brand="21strive" variant="mark" :size="30" label="" />
      </div>
      <div class="s-bb-impl__art">
        <RSupergraphic variant="one" anchor="bottom-right" />
        <p class="s-bb-impl__title">Ledgers, payments<br />and scheduling</p>
      </div>
    </div>
    <div class="s-bb-impl s-bb-impl--b">
      <RSupergraphic variant="two" anchor="top-right" :scale="0.6" />
      <p class="s-bb-word s-bb-word--sm"><b>21</b> Strive</p>
      <p class="s-bb-impl__title s-bb-impl__title--sm">Rapi 0.2<br />design language</p>
      <RLogo brand="21strive" variant="mark" :size="20" label="" class="s-bb-impl__foot" />
    </div>
  </template>

  <!-- 09 · Collateral -->
  <template v-else-if="id === 'collateral'">
    <div class="s-bb-head">
      <p class="s-bb-head__label">Branding</p>
      <p class="s-bb-head__title">Collateral examples</p>
    </div>
    <div class="s-bb-card s-bb-card--front">
      <RLogo brand="21strive" variant="lockup" :size="16" label="21 Strive" />
      <div class="s-bb-card__who">
        <p class="s-bb-card__name">Nadia Prameswari</p>
        <p class="s-bb-card__role">Head of Product</p>
      </div>
      <p class="s-bb-card__contact"><span>nadia@21strive.com</span><span>+62 21 3000 2121</span></p>
    </div>
    <div class="s-bb-card s-bb-card--back">
      <RLogo brand="21strive" variant="mark" :size="40" label="" />
    </div>
    <div class="s-bb-cover">
      <p class="s-bb-cover__title">Project proposal</p>
      <div class="s-bb-cover__art"><RSupergraphic variant="two" anchor="bottom-right" /></div>
      <dl class="s-bb-cover__meta">
        <div><dt>Client</dt><dd>PT Sinar Pelabuhan</dd></div>
        <div><dt>Status</dt><dd>Confidential</dd></div>
        <div><dt>Date</dt><dd>November 2026</dd></div>
      </dl>
      <div class="s-bb-cover__foot">
        <RLogo brand="21strive" variant="mark" :size="22" label="" />
        <span class="s-bb-cover__word"><b>21</b> Strive</span>
      </div>
    </div>
    <div class="s-bb-env">
      <svg class="s-bb-env__flap" viewBox="0 0 340 64" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <polyline points="0,0 170,62 340,0" />
      </svg>
      <RLogo brand="21strive" variant="mark" :size="24" label="" class="s-bb-env__mark" />
      <p class="s-bb-env__line"><span>hello@21strive.com</span><span>+62 21 3000 2121</span></p>
    </div>
    <p class="s-bb-coll-cap" style="left: 132px; top: 588px">Business card · 85 × 55 mm, front and back</p>
    <p class="s-bb-coll-cap" style="left: 452px; top: 600px">Proposal cover · A4</p>
    <p class="s-bb-coll-cap" style="left: 744px; top: 588px">Envelope · DL, 220 × 110 mm</p>
  </template>

  <!-- 10 · Rapi -->
  <template v-else-if="id === 'rapi'">
    <div class="s-bb-head">
      <p class="s-bb-head__label">Family</p>
      <p class="s-bb-head__title">Rapi</p>
    </div>
    <p class="s-bb-desc">Rapi is the design language and design system of 21 Strive. Its r is the stem and flag of the 1, mirrored, with the flag flipped so its flat side sits on top.</p>
    <ol class="s-bb-derive">
      <li>
        <div class="s-bb-derive__art s-bb-derive__art--wide"><RLogo brand="21strive" variant="mark" :size="112" label="" /></div>
        <p><span class="s-bb-derive__i">01</span>The logogram</p>
      </li>
      <li aria-hidden="true" class="s-bb-derive__arrow"><ArrowRight /></li>
      <li>
        <div class="s-bb-derive__art"><div class="s-bb-derive__one"><RSupergraphic variant="one" tone="line" anchor="top-left" /></div></div>
        <p><span class="s-bb-derive__i">02</span>Its 1, stem and flag</p>
      </li>
      <li aria-hidden="true" class="s-bb-derive__arrow"><ArrowRight /></li>
      <li>
        <div class="s-bb-derive__art"><div class="s-bb-derive__one is-mirrored"><RSupergraphic variant="one" tone="line" anchor="top-left" /></div></div>
        <p><span class="s-bb-derive__i">03</span>Mirrored</p>
      </li>
      <li aria-hidden="true" class="s-bb-derive__arrow"><ArrowRight /></li>
      <li>
        <div class="s-bb-derive__art"><RLogo brand="rapi" variant="mark" :size="112" label="The Rapi r" class="s-bb-derive__r" /></div>
        <p><span class="s-bb-derive__i">04</span>Flag flipped: the r</p>
      </li>
    </ol>
    <div class="s-bb-rapi">
      <p class="s-bb-mini-label">Rapi 0.2 · November 2026</p>
      <ul class="s-bb-rapi__list">
        <li><Check /> Square corners. A circle only means a point or a state.</li>
        <li><Check /> Rules instead of shadows.</li>
        <li><Check /> Cobalt for the brand, orange for what is live.</li>
      </ul>
      <div class="s-bb-rapi__kit">
        <RButton tone="brand" size="sm" tabindex="-1">Primary action</RButton>
        <RButton variant="outline" size="sm" tabindex="-1">Secondary</RButton>
        <RStatus tone="signal" label="Live" />
        <RBadge tone="success">Paid</RBadge>
      </div>
    </div>
    <div class="s-bb-family">
      <div class="s-bb-family__cell">
        <RLogo brand="21strive" variant="lockup" :size="40" label="21 Strive" />
        <p class="s-bb-family__cap"><span>01</span>The company</p>
      </div>
      <div class="s-bb-family__cell">
        <RLogo brand="rapi" variant="lockup" :size="40" label="Rapi" />
        <p class="s-bb-family__cap"><span>02</span>Its design language and component library</p>
      </div>
    </div>
  </template>
</template>

<style scoped>
/* ── Shared: the spec head of the deck ────────────────────────────────────── */
.s-bb-head {
  position: absolute;
  z-index: 2;
  top: 76px;
  left: 32px;
}
.s-bb-head--top {
  top: 26px;
}
.s-bb-head__label,
.s-bb-mini-label {
  font-family: var(--r-font-mono);
  font-size: 11px;
  font-weight: var(--r-weight-bold);
  line-height: 1.3;
  letter-spacing: var(--r-tracking-caps);
  text-transform: uppercase;
}
.s-bb-head__title {
  margin-top: 2px;
  font-size: 17px;
  line-height: 1.3;
  letter-spacing: -0.01em;
}
.s-bb-desc {
  position: absolute;
  z-index: 2;
  top: 76px;
  left: 300px;
  width: 236px;
  color: var(--r-text-secondary);
  font-size: 11.5px;
  line-height: 1.45;
}
.s-bb-mini-label {
  margin-bottom: 12px;
  color: var(--r-text-secondary);
  font-size: 10px;
}

/* ── 01 Cover ─────────────────────────────────────────────────────────────── */
.s-bb-cover-mark {
  position: absolute;
  bottom: 32px;
  left: 32px;
}
.s-bb-cover-titles {
  position: absolute;
  top: 296px;
  left: 744px;
  display: flex;
  flex-direction: column;
  gap: 36px;
  font-size: 26px;
  font-weight: var(--r-weight-semibold);
  line-height: 1.1;
  letter-spacing: -0.02em;
}
.s-bb-cover-ed {
  position: absolute;
  right: 32px;
  bottom: 30px;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: 10px;
  letter-spacing: var(--r-tracking-caps);
  text-transform: uppercase;
}

/* ── 02 The diagonal ──────────────────────────────────────────────────────── */
.s-bb-cut {
  position: absolute;
  inset: 0;
}
/* Both cuts follow the logogram's diagonal: 54.3 across for every 50 down. */
.s-bb-cut--a {
  background: var(--r-bg-surface);
  clip-path: polygon(708px 56px, 1200px 56px, 1200px 248px, 499.5px 248px);
}
.s-bb-cut--b {
  background: var(--r-feature-brand);
  clip-path: polygon(1200px 276px, 1200px 675px, 766.7px 675px);
}
.s-bb-statement-logo {
  position: absolute;
  bottom: 36px;
  left: 32px;
}

/* ── 03 Light and dark ────────────────────────────────────────────────────── */
.s-bb-half {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  height: 337.5px;
}
.s-bb-half--dark {
  top: 337.5px;
  background: var(--r-bg-surface);
  color: var(--r-text);
}
.s-bb-half--dark .s-bb-half__logo {
  color: var(--r-neutral-0);
}
.s-bb-half__logo {
  position: absolute;
  right: 32px;
  bottom: 34px;
}

/* ── 04 Construction ──────────────────────────────────────────────────────── */
.s-bb-con {
  position: absolute;
  top: 196px;
  left: 64px;
  width: 640px;
  height: 320px;
}
.s-bb-con__mark {
  position: absolute;
  top: 60px;
  left: 80px;
  z-index: 1;
}
.s-bb-dim {
  position: absolute;
  z-index: 2;
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: 11px;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}
.s-bb-dim--h {
  height: 0;
  border-top: 1px solid var(--r-text-tertiary);
}
.s-bb-dim--h::before,
.s-bb-dim--h::after {
  content: '';
  position: absolute;
  top: -4px;
  width: 1px;
  height: 7px;
  background: var(--r-text-tertiary);
}
.s-bb-dim--h::before {
  left: 0;
}
.s-bb-dim--h::after {
  right: 0;
}
.s-bb-dim--h .s-bb-dim__text {
  position: absolute;
  top: 7px;
  left: 50%;
  transform: translateX(-50%);
}
.s-bb-dim--above .s-bb-dim__text {
  top: -18px;
}
.s-bb-dim--v {
  width: 0;
  border-left: 1px solid var(--r-text-tertiary);
}
.s-bb-dim--v::before,
.s-bb-dim--v::after {
  content: '';
  position: absolute;
  left: -4px;
  width: 7px;
  height: 1px;
  background: var(--r-text-tertiary);
}
.s-bb-dim--v::before {
  top: 0;
}
.s-bb-dim--v::after {
  bottom: 0;
}
.s-bb-dim--v .s-bb-dim__text {
  position: absolute;
  top: 50%;
  left: 9px;
  transform: translateY(-50%);
}
.s-bb-dim--left .s-bb-dim__text {
  right: 9px;
  left: auto;
}
.s-bb-centre {
  position: absolute;
  z-index: 2;
  width: 10px;
  height: 10px;
  border: 2px solid var(--r-brand);
  border-radius: var(--r-radius-round);
  background: var(--r-bg-surface);
}
.s-bb-centre-label {
  position: absolute;
  z-index: 2;
  color: var(--r-brand-text);
  font-family: var(--r-font-mono);
  font-size: 10px;
  font-weight: var(--r-weight-semibold);
  line-height: 1.35;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.s-bb-con-spec {
  position: absolute;
  top: 200px;
  left: 776px;
  width: 392px;
}

/* ── 05 Restrictions ──────────────────────────────────────────────────────── */
.s-bb-rules {
  position: absolute;
  top: 236px;
  left: 32px;
  width: 380px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  font-size: 15px;
  line-height: 1.45;
  letter-spacing: -0.005em;
}
.s-bb-rules li {
  display: grid;
  grid-template-columns: 32px 1fr;
  padding-top: 14px;
  border-top: 1px solid var(--r-border);
}
.s-bb-rules__i {
  padding-top: 3px;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: 10px;
}
.s-bb-misuse {
  position: absolute;
  top: 236px;
  left: 480px;
  width: 688px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 22px 12px;
}
.s-bb-misuse__item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
}
.s-bb-misuse__item figcaption {
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.s-bb-misuse__tile {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 132px;
  overflow: hidden;
  border: 1px solid var(--r-border);
  background: var(--r-bg-surface);
}
.s-bb-misuse__tile.is-contrast,
.s-bb-misuse__tile.is-condensed,
.s-bb-misuse__tile.is-red {
  border-color: var(--r-neutral-900);
  background: var(--r-neutral-900);
}
.s-bb-misuse__tile.is-contrast .s-bb-misuse__logo {
  color: var(--r-neutral-700);
}
.s-bb-misuse__tile.is-colour .s-bb-misuse__logo {
  color: var(--r-chart-5);
}
.s-bb-misuse__tile.is-condensed .s-bb-misuse__logo {
  color: var(--r-neutral-0);
  transform: scaleX(0.6);
}
.s-bb-misuse__tile.is-grey {
  border-color: var(--r-neutral-300);
  background: var(--r-neutral-300);
}
.s-bb-misuse__tile.is-grey .s-bb-misuse__logo {
  color: var(--r-neutral-0);
}
.s-bb-misuse__tile.is-red .s-bb-misuse__logo {
  color: var(--r-red-500);
}
.s-bb-misuse__tile.is-stretched .s-bb-misuse__logo {
  transform: scale(1.55, 0.7);
}
.s-bb-x {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
}
.s-bb-x line {
  stroke: var(--r-danger);
  stroke-width: 1.5;
  vector-effect: non-scaling-stroke;
}

/* ── 06 Palette ───────────────────────────────────────────────────────────── */
.s-bb-ramp {
  position: absolute;
  top: 76px;
  left: 616px;
  width: 552px;
}
.s-bb-ramp__row {
  display: grid;
  grid-template-columns: repeat(11, minmax(0, 1fr));
  gap: 4px;
}
.s-bb-ramp__chip {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.s-bb-ramp__swatch {
  height: 40px;
}
.s-bb-ramp__step {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: 9.5px;
  font-variant-numeric: tabular-nums;
}
.s-bb-ramp__chip.is-brand .s-bb-ramp__step {
  color: var(--r-text);
  font-weight: var(--r-weight-bold);
}
.s-bb-signal {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 20px;
  color: var(--r-text-secondary);
  font-size: 11.5px;
}
.s-bb-signal b {
  color: var(--r-text);
  font-weight: var(--r-weight-semibold);
}
.s-bb-signal__swatch {
  width: 40px;
  height: 16px;
  background: var(--r-signal);
}
.s-bb-blocks {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  height: 334px;
}
.s-bb-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px 16px;
}
.s-bb-block--cobalt {
  flex: 0 0 648px;
  background: var(--r-cobalt-700);
  color: var(--r-neutral-0);
}
.s-bb-block--peri {
  flex: 0 0 276px;
  background: var(--r-cobalt-400);
  color: var(--r-neutral-900);
}
.s-bb-block--black {
  flex: 1;
  background: var(--r-neutral-900);
  color: var(--r-neutral-0);
}
.s-bb-block__label {
  font-family: var(--r-font-mono);
  font-size: 9.5px;
  font-weight: var(--r-weight-bold);
  letter-spacing: var(--r-tracking-caps);
  text-transform: uppercase;
}
.s-bb-block__hex {
  font-size: 15px;
  letter-spacing: -0.005em;
}
.s-bb-block__meta {
  opacity: 0.78;
  font-family: var(--r-font-mono);
  font-size: 9.5px;
  letter-spacing: 0.04em;
}

/* ── 07 Typefaces ─────────────────────────────────────────────────────────── */
.s-bb-type {
  position: absolute;
  top: 98px;
  left: 300px;
  width: 520px;
  height: 540px;
}
.s-bb-type__i {
  position: absolute;
  left: -36px;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: 9.5px;
  font-variant-numeric: tabular-nums;
}
.s-bb-type__small {
  font-family: var(--r-font-mono);
  font-size: 19px;
  font-weight: var(--r-weight-bold);
  letter-spacing: var(--r-tracking-caps);
  line-height: 1;
  text-transform: uppercase;
}
.s-bb-type__big {
  position: absolute;
  top: 140px;
  width: 500px;
  font-size: 72px;
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-display);
  line-height: 0.96;
}
.s-bb-type__body {
  position: absolute;
  top: 330px;
  width: 470px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  color: var(--r-text-secondary);
  font-size: 13px;
  line-height: 1.5;
}
.s-bb-type-spec {
  position: absolute;
  top: 98px;
  left: 900px;
  width: 260px;
  margin: 0;
}
.s-bb-type-spec > div {
  position: absolute;
  left: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.s-bb-type-spec dt {
  font-size: 18px;
  font-weight: var(--r-weight-semibold);
  letter-spacing: -0.02em;
  line-height: 1;
}
.s-bb-type-spec dd {
  margin: 4px 0 0;
  color: var(--r-text-secondary);
  font-size: 15px;
}
.s-bb-type-spec dd.s-bb-type-spec__rule {
  margin-top: 2px;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: 9px;
  letter-spacing: var(--r-tracking-caps);
  text-transform: uppercase;
}

/* ── 08 Implementation ────────────────────────────────────────────────────── */
.s-bb-impl {
  position: absolute;
  top: 168px;
  height: 474px;
  overflow: hidden;
  border: 1px solid var(--r-border);
  background: var(--r-bg-surface);
  isolation: isolate;
}
.s-bb-impl--a {
  left: 32px;
  width: 716px;
  display: grid;
  grid-template-columns: 216px 1fr;
}
.s-bb-impl--b {
  left: 764px;
  width: 404px;
}
.s-bb-impl__side {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 20px;
}
.s-bb-word {
  font-size: 34px;
  letter-spacing: -0.035em;
  line-height: 1;
}
.s-bb-word b {
  font-weight: var(--r-weight-semibold);
}
.s-bb-word--sm {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 1;
  font-size: 24px;
}
.s-bb-impl__art {
  position: relative;
  overflow: hidden;
}
.s-bb-impl__title {
  position: relative;
  z-index: 1;
  padding: 18px 20px;
  font-size: 36px;
  letter-spacing: -0.035em;
  line-height: 1.02;
}
.s-bb-impl__title--sm {
  position: absolute;
  bottom: 56px;
  left: 0;
  padding: 0 20px;
  font-size: 28px;
}
.s-bb-impl__foot {
  position: absolute;
  bottom: 20px;
  left: 20px;
}

/* ── 09 Collateral ────────────────────────────────────────────────────────── */
.s-bb-card {
  position: absolute;
  left: 132px;
  width: 286px;
  height: 185px;
  border: 1px solid var(--r-border);
}
.s-bb-card--front {
  top: 168px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 16px;
  background: var(--r-bg-surface);
}
.s-bb-card--back {
  top: 384px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-color: var(--r-feature-brand);
  background: var(--r-feature-brand);
  color: var(--r-neutral-0);
}
.s-bb-card__name {
  font-size: 15px;
  letter-spacing: -0.01em;
}
.s-bb-card__role {
  color: var(--r-text-tertiary);
  font-size: 10.5px;
}
.s-bb-card__contact {
  display: flex;
  justify-content: space-between;
  font-family: var(--r-font-mono);
  font-size: 8px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.s-bb-cover {
  position: absolute;
  top: 168px;
  left: 452px;
  width: 262px;
  height: 416px;
  overflow: hidden;
  border: 1px solid var(--r-border);
  background: var(--r-bg-surface);
  isolation: isolate;
}
.s-bb-cover__title {
  position: relative;
  z-index: 1;
  padding: 16px;
  font-size: 18px;
  letter-spacing: -0.02em;
}
.s-bb-cover__art {
  position: absolute;
  top: 60px;
  right: 0;
  left: 0;
  height: 230px;
}
.s-bb-cover__meta {
  position: absolute;
  top: 300px;
  left: 16px;
  display: grid;
  grid-template-columns: repeat(3, auto);
  gap: 16px;
  margin: 0;
}
.s-bb-cover__meta dt {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: 7.5px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.s-bb-cover__meta dd {
  margin: 2px 0 0;
  font-size: 9px;
}
.s-bb-cover__foot {
  position: absolute;
  right: 16px;
  bottom: 16px;
  left: 16px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
}
.s-bb-cover__word {
  font-size: 14px;
  letter-spacing: -0.035em;
}
.s-bb-cover__word b {
  font-weight: var(--r-weight-semibold);
}
.s-bb-env {
  position: absolute;
  top: 384px;
  left: 744px;
  width: 340px;
  height: 185px;
  border: 1px solid var(--r-border);
  background: var(--r-bg-surface);
}
.s-bb-env__flap {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 64px;
  overflow: visible;
}
.s-bb-env__flap polyline {
  fill: none;
  stroke: var(--r-border-strong);
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
}
.s-bb-env__mark {
  position: absolute;
  bottom: 42px;
  left: 18px;
}
.s-bb-env__line {
  position: absolute;
  right: 18px;
  bottom: 16px;
  left: 18px;
  display: flex;
  justify-content: space-between;
  font-family: var(--r-font-mono);
  font-size: 8px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.s-bb-coll-cap {
  position: absolute;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: 9.5px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

/* ── 10 Rapi ──────────────────────────────────────────────────────────────── */
.s-bb-derive {
  position: absolute;
  top: 214px;
  left: 32px;
  display: flex;
  align-items: flex-start;
  gap: 18px;
}
.s-bb-derive > li {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.s-bb-derive p {
  color: var(--r-text-secondary);
  font-size: 12px;
}
.s-bb-derive__i {
  margin-right: 8px;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: 9.5px;
}
.s-bb-derive__art {
  display: flex;
  align-items: center;
  height: 112px;
}
.s-bb-derive__one {
  position: relative;
  width: 112.9px;
  height: 112px;
}
.s-bb-derive__one.is-mirrored {
  transform: scaleX(-1);
}
/* The outline of the 1 in ink: the line supergraphic reads the strong border token. */
.s-bb-derive__one {
  --r-border-strong: var(--r-text);
}
.s-bb-derive__r {
  color: var(--r-brand);
}
.s-bb-derive__arrow {
  align-self: flex-start;
  padding-top: 48px;
  color: var(--r-text-tertiary);
}
.s-bb-derive__arrow svg {
  width: 16px;
  height: 16px;
}
.s-bb-rapi {
  position: absolute;
  top: 206px;
  left: 848px;
  width: 320px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding-left: 24px;
  border-left: 1px solid var(--r-border);
}
.s-bb-family {
  position: absolute;
  right: 32px;
  bottom: 32px;
  left: 32px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  border-top: 1px solid var(--r-border);
}
.s-bb-family__cell {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 26px 0 0;
}
.s-bb-family__cell + .s-bb-family__cell {
  padding-left: 32px;
  border-left: 1px solid var(--r-border);
}
.s-bb-family__cap {
  display: flex;
  gap: 10px;
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: 10px;
  letter-spacing: var(--r-tracking-caps);
  text-transform: uppercase;
}
.s-bb-family__cap span {
  color: var(--r-text-tertiary);
}
.s-bb-rapi__list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 12.5px;
  line-height: 1.4;
}
.s-bb-rapi__list li {
  display: grid;
  grid-template-columns: 18px 1fr;
}
.s-bb-rapi__list svg {
  width: 13px;
  height: 13px;
  margin-top: 2px;
  color: var(--r-brand);
}
.s-bb-rapi__kit {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 12px;
  padding-top: 14px;
  border-top: 1px solid var(--r-border);
}
</style>
