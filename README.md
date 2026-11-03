<h1>
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset=".github/assets/rapi-logo-white.svg">
    <img src=".github/assets/rapi-logo-black.svg" alt="Rapi" height="64">
  </picture>
</h1>

Rapi is the design language and the design system of 21 Strive, built for Vue 3. *Rapi* is Indonesian for tidy.

It starts from the 21 Strive brand book (the logogram, cobalt `#1B3AAB` and `#7E94E2` on black `#151515` and white, Geist and Geist Mono, spec pages ruled into columns) and takes its seriousness from IBM Carbon, Linear, Cloudflare's dashboard and VoidZero, with a Teenage Engineering twist: instrument readouts, knobs, dot-matrix digits and one orange. Think of a treasury desk, a security operations floor or launch control. Nothing floats, nothing bounces, and the data is the loudest thing on screen.

- Square by default: every corner is 0. A circle always means a point or a state.
- 1px rules carry the structure; only floating things get a (short) shadow.
- Geist for reading, Geist Mono in capitals for labels, Geist Pixel for the occasional readout.
- Ink and greys do most of the work; cobalt marks the brand and the selection; International Orange (`#FF4F00`) marks what is live or now.
- 42 components, 15 charts drawn as plain SVG from the tokens, light and dark themes, theme islands.
- 36 sample screens across banking, security and defense, aerospace and operations, instruments, developer platforms, workspace tools and brand work, plus the three original examples restyled.
- No runtime dependencies beyond Vue and lucide-vue-next; no chart library.

`DESIGN.md` is the source of truth for the language: principles, tokens to reach for, layout patterns, component and chart rules, copy and what not to do.

## Run the docs

Requires Node 20.19 or newer (Vite 8).

```bash
npm install
npm run dev        # http://localhost:5180
npm run build      # type-checks with vue-tsc, then builds to dist/
npm run preview    # serves dist/
```

The build uses a relative base, so `dist/` works from any static host or sub-path. TypeScript is pinned to 5.9 on purpose: `vue-tsc` 3 does not run on TypeScript 7 yet.

If the dev server runs on a remote machine, forward the port and open it locally:

```bash
ssh -L 5180:localhost:5180 <user>@<host>
# then open http://localhost:5180
```

## Project layout

```
DESIGN.md                 the language, for the people who build with it
src/
  design-system/          the library
    tokens/tokens.css     primitives (OKLCH ramps), semantic roles (light + dark), sizes, motion
    tokens/base.css       fonts, reset, type scale, tone classes, utilities
    fonts/                Geist Pixel (SIL OFL 1.1)
    brand/marks.ts        21 Strive and Rapi logo geometry
    composables/          floating positioning, focus trap, scroll lock, hotkeys, formatting, theme, toasts
    components/           R-components (RButton.vue, RTable.vue, RReadout.vue, …)
    charts/               SVG charts, their shared frame (chart.css) and maths
    types.ts              shared prop types
    index.ts              library entry and RapiPlugin
  docs/                   the documentation site
    pages/                one page per section of the docs
    samples/              the 36 sample screens, one folder each, and their registry
    examples/             the three original examples
    components/           docs-only building blocks
```

## Using the library in another Vue app

The library is plain source; copy `src/design-system/` into your app (or point an alias at it) and install its dependencies:

```bash
npm install @fontsource-variable/geist @fontsource-variable/geist-mono lucide-vue-next
```

Register everything at once:

```ts
import { createApp } from 'vue'
import { RapiPlugin } from './design-system'
import App from './App.vue'

createApp(App).use(RapiPlugin).mount('#app')
```

or import only what you use:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { RButton, RCard, RLineChart, RSegmented, RStat } from './design-system'

const range = ref('30d')
</script>

<template>
  <RCard eyebrow="Treasury" title="Net liquidity" meta="IDR bn">
    <RStat label="Total cash" :value="4820" suffix=" bn" :trend="1.9" trend-label="vs last week" />
    <RLineChart
      :labels="weeks"
      :series="[{ name: 'Net liquidity', values: liquidity }]"
      :forecast-from="12"
      :now="12"
      label="Net liquidity by week with a six-week forecast"
    />
  </RCard>
  <RSegmented v-model="range" :options="[{ label: '7D', value: '7d' }, { label: '30D', value: '30d' }]" label="Range" />
  <RButton tone="brand">New transfer</RButton>
</template>
```

Importing `design-system/index.ts` (directly or through the plugin) also loads Geist, Geist Mono, `tokens.css`, `base.css` and the chart frame. `RapiPlugin` adds type declarations for every global component.

## How the tokens work

There are two layers.

**Primitives** are raw ramps built in OKLCH on one lightness scale: `--r-neutral-*` (pure grey; 900 is the 21 Strive black), `--r-cobalt-*` (700 is `#1B3AAB`, 400 is `#7E94E2`), `--r-signal-*` (500 is International Orange), `--r-green-*`, `--r-amber-*`, `--r-red-*`, and a few teal and magenta steps for data. Components never read them.

**Semantic tokens** describe a role, and components only read these:

| Group | Examples |
|---|---|
| Surfaces | `--r-bg-canvas`, `--r-bg-surface`, `--r-bg-muted`, `--r-bg-hover`, `--r-bg-selected` |
| Text | `--r-text`, `--r-text-secondary`, `--r-text-tertiary`, `--r-text-disabled` |
| Lines | `--r-border-subtle`, `--r-border`, `--r-border-strong` |
| Emphasis | `--r-ink`, `--r-brand`, `--r-brand-soft`, `--r-brand-text`, `--r-signal`, `--r-on-signal` |
| Status | `--r-success*`, `--r-warning*`, `--r-danger*`, lamps `--r-status-good / warning / serious / critical / off` |
| Data | `--r-chart-1` … `--r-chart-8`, `--r-chart-context`, `--r-chart-now`, `--r-chart-grid`, `--r-chart-axis`, `--r-seq-0` … `--r-seq-8`, `--r-div-*` |
| Shape and size | `--r-radius-surface`, `--r-radius-control`, `--r-radius-mark` (all 0), `--r-radius-round`, `--r-control-*`, `--r-space-*` |
| Motion | `--r-duration-*`, `--r-ease-out`, `--r-ease-in-out` |

The chart palette was checked with a colour-vision validator in both themes: neighbouring slots stay apart under protanopia and deuteranopia, and the first three slots stay apart in any pairing, which is what scatter plots need.

Status and brand colours reach components through **tone classes**: `.r-tone-neutral`, `.r-tone-brand`, `.r-tone-signal`, `.r-tone-success`, `.r-tone-warning` and `.r-tone-danger` fill `--tone-solid`, `--tone-on-solid`, `--tone-soft`, `--tone-text`, `--tone-border` and `--tone-lamp`.

## Theming

```html
<html data-theme="dark">
```

`data-theme="light" | "dark"` re-points every semantic token. It works on any element, not only `<html>`: a console panel, a code block or a tooltip can be a dark island inside a light page. `useTheme()` keeps the attribute in sync with a stored preference (`light`, `dark` or `system`); the inline script in `index.html` applies it before the first paint.

Rapi 0.1 could swap brand hues. 0.2 is the 21 Strive language and has one brand, cobalt.

## Accessibility

- Text colours pass WCAG AA in both themes. White fails on International Orange, so signal fills carry black labels.
- Focus is always visible: a 2px cobalt line.
- Widgets use the expected roles and keys: tablist, radiogroup, switch, slider (including the knob), menu with typeahead and submenus, dialog with a focus trap, combobox and listbox in the command palette.
- Every chart has a label, a hidden data table and arrow-key exploration with a live region; no chart relies on colour alone.
- With reduced motion on, durations drop to almost nothing, live lamps stop blinking and the radar sweep stops.

## Credits

The 21 Strive brand book defines the marks, colours and type. Geist, Geist Mono and Geist Pixel are by Vercel with basement.studio, under the SIL Open Font License. Icons are from Lucide. The References page of the docs lists the products that shaped the language.
