<script setup lang="ts">
import { computed } from 'vue'
import { STRIVE_MARK } from '../brand/marks'

/**
 * The 21 Strive logogram used as a supergraphic: blown up, cropped by its container and laid
 * behind content, the way the brand book uses it on covers and cards. Purely decorative.
 * Put it inside a positioned element; it fills that element and never takes pointer events.
 */
const props = withDefaults(
  defineProps<{
    /**
     * `one` — the flag and stem of the 1. `two` — the Z of the 2. `mark` — both.
     * `construction` — the guide lines the mark is built on, as hairlines.
     */
    variant?: 'one' | 'two' | 'mark' | 'construction'
    /** Corner the shape grows from. */
    anchor?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
    /** `muted` is a wash one step off the surface; `brand` and `inverse` are for coloured panels. */
    tone?: 'muted' | 'brand' | 'inverse' | 'line'
    /** How much of the container's height the mark covers, as a fraction (1 = full height). */
    scale?: number
  }>(),
  { variant: 'one', anchor: 'bottom-right', tone: 'muted', scale: 1 },
)

const W = STRIVE_MARK.width
const H = STRIVE_MARK.height

// Crop to the part of the mark that reads best large: the 1 alone, the 2 alone, or both.
const view = computed(() => {
  if (props.variant === 'one') return { x: 100.8, w: W - 100.8 }
  if (props.variant === 'two') return { x: 0, w: 100.8 }
  return { x: 0, w: W }
})

const align = computed(() => {
  const x = props.anchor.endsWith('right') ? 'xMax' : 'xMin'
  const y = props.anchor.startsWith('top') ? 'YMin' : 'YMax'
  return `${x}${y} meet`
})

// Guide lines: three horizontals and the diagonals of both glyphs, extended past the box.
const guides = computed(() => {
  const run = 54.3
  const xs = [23.25, 77.55, 100.8, 155.1]
  const diagonals = xs.map((x) => {
    // every diagonal in the mark rises 50 over 54.3; extend it 2.5 times each way
    const k = 2.5
    return { x1: x - run * k, y1: 50 + 50 * k, x2: x + run * k, y2: 50 - 50 * k }
  })
  return {
    horizontals: [0, 50, 100],
    verticals: [0, 46.5, 155.1, 201.6],
    diagonals,
  }
})
</script>

<template>
  <div
    class="r-supergraphic"
    :class="[`r-supergraphic--${tone}`, `r-supergraphic--${anchor}`]"
    :style="{ '--sg-scale': String(scale) }"
    aria-hidden="true"
  >
    <svg
      v-if="variant !== 'construction'"
      class="r-supergraphic__svg"
      :viewBox="`${view.x} 0 ${view.w} ${H}`"
      :preserveAspectRatio="align"
      focusable="false"
    >
      <path v-if="variant !== 'one'" :d="STRIVE_MARK.two" />
      <path v-if="variant !== 'two'" :d="STRIVE_MARK.one" />
    </svg>
    <svg
      v-else
      class="r-supergraphic__svg r-supergraphic__svg--lines"
      :viewBox="`-40 -30 ${W + 80} ${H + 60}`"
      :preserveAspectRatio="align"
      focusable="false"
    >
      <line v-for="y in guides.horizontals" :key="`h${y}`" x1="-400" :y1="y" :x2="W + 400" :y2="y" />
      <line v-for="x in guides.verticals" :key="`v${x}`" :x1="x" y1="-400" :x2="x" :y2="H + 400" />
      <line
        v-for="(d, i) in guides.diagonals"
        :key="`d${i}`"
        :x1="d.x1"
        :y1="d.y1"
        :x2="d.x2"
        :y2="d.y2"
      />
    </svg>
  </div>
</template>

<style>
.r-supergraphic {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
  --sg-fill: var(--r-bg-muted);
}

.r-supergraphic--brand {
  --sg-fill: color-mix(in srgb, #ffffff 9%, transparent);
}

.r-supergraphic--inverse {
  --sg-fill: color-mix(in srgb, var(--r-text) 7%, transparent);
}

.r-supergraphic__svg {
  position: absolute;
  height: calc(100% * var(--sg-scale));
  width: 100%;
  fill: var(--sg-fill);
}

.r-supergraphic--top-left .r-supergraphic__svg,
.r-supergraphic--top-right .r-supergraphic__svg {
  top: 0;
}

.r-supergraphic--bottom-left .r-supergraphic__svg,
.r-supergraphic--bottom-right .r-supergraphic__svg {
  bottom: 0;
}

.r-supergraphic__svg--lines {
  height: 100%;
  fill: none;
  stroke: var(--r-border);
  stroke-width: 1;
}

.r-supergraphic__svg--lines line {
  vector-effect: non-scaling-stroke;
}

.r-supergraphic--line .r-supergraphic__svg:not(.r-supergraphic__svg--lines) {
  fill: none;
  stroke: var(--r-border-strong);
  stroke-width: 1;
}

.r-supergraphic--line .r-supergraphic__svg path {
  vector-effect: non-scaling-stroke;
}
</style>
