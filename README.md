<h1>
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset=".github/assets/rapi-logo-white.svg">
    <img src=".github/assets/rapi-logo-black.svg" alt="Rapi" height="64">
  </picture>
</h1>

A quiet, data-first design system for Vue 3. *Rapi* is Indonesian for tidy.

It grew out of a close reading of 24 dashboard shots from the Dribbble collection *Clean Minimalistic*. We measured colour coverage, type sizes, corner radii and how focus and selection are shown, then kept what those screens agree on: calm near-white surfaces, big tabular numbers, soft corners, ink for emphasis, and a keyboard for everything. The docs site (this repo) shows every token, component and chart, plus three full example screens built only from the library.

- 27 components: buttons, chips, form controls, cards, stats, tables, menus, popovers, dialogs, a command palette, onboarding coachmarks and a guided tour
- 8 charts drawn as plain SVG from the tokens: dot matrix, line, sparkline, radial gauge, heatmap, range bars, bar list and columns
- Light and dark themes, three brand hues (blue, violet, flame), theme islands
- Plus Jakarta Sans Variable, by Tokotype in Jakarta
- No runtime dependencies beyond Vue and lucide-vue-next icons; no chart library

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
src/
  design-system/          the library
    tokens/tokens.css     primitives, brand ramp, semantic roles (light + dark), sizes, motion
    tokens/base.css       reset, type scale classes, tone classes, utilities
    composables/          floating positioning, focus trap, scroll lock, hotkeys, formatting, theme
    components/           R-components (RButton.vue, RTable.vue, …)
    charts/               SVG charts and their shared maths
    types.ts              shared prop types (MenuItem, TableColumn, CommandItem, …)
    index.ts              library entry and RapiPlugin
  docs/                   the documentation site
    pages/                one page per section of the docs
    examples/             Sales overview, Projects, Weekly schedule
    components/           docs-only building blocks (demo frames, code blocks, props tables)
```

## Using the library in another Vue app

The library is plain source; copy `src/design-system/` into your app (or point an alias at it) and install its two dependencies:

```bash
npm install @fontsource-variable/plus-jakarta-sans lucide-vue-next
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
import { RButton, RCard, RStat, RSegmented } from './design-system'

const period = ref('month')
</script>

<template>
  <RCard title="Overall revenue" variant="brand">
    <RStat :value="25912" prefix="$" :trend="1.9" trend-label="than last month" />
  </RCard>
  <RSegmented
    v-model="period"
    :options="[{ label: 'Week', value: 'week' }, { label: 'Month', value: 'month' }]"
    label="Period"
  />
  <RButton>Continue</RButton>
</template>
```

Importing `design-system/index.ts` (directly or through the plugin) also loads the font, `tokens.css` and `base.css`. `RapiPlugin` adds type declarations for every global component, so templates get autocompletion.

## How the tokens work

There are two layers.

**Primitives** are raw ramps: `--r-neutral-*`, `--r-blue-*`, `--r-violet-*`, `--r-flame-*`, `--r-green-*`, `--r-amber-*`, `--r-rose-*`, `--r-sky-*`. Components never read them. A third ramp, `--r-brand-*`, is an alias that points at blue, violet or flame.

**Semantic tokens** describe a role, and components only read these:

| Group | Examples |
|---|---|
| Surfaces | `--r-bg-canvas`, `--r-bg-surface`, `--r-bg-raised`, `--r-bg-muted`, `--r-bg-hover`, `--r-bg-track` |
| Text | `--r-text`, `--r-text-secondary`, `--r-text-tertiary`, `--r-text-disabled` |
| Lines | `--r-border-subtle`, `--r-border`, `--r-border-strong` |
| Emphasis | `--r-ink`, `--r-on-ink`, `--r-brand`, `--r-brand-soft`, `--r-brand-text` |
| Status | `--r-success*`, `--r-warning*`, `--r-danger*`, plus `--r-violet*`, `--r-flame*`, `--r-sky*` |
| Data | `--r-chart-1` … `--r-chart-6`, `--r-chart-track`, `--r-chart-grid`, `--r-chart-axis` |
| Identity | `--r-identity-1` … `8` and `-text` pairs, for avatars and calendar colours |
| Shape and motion | `--r-radius-*`, `--r-space-*`, `--r-control-*`, `--r-shadow-*`, `--r-duration-*`, `--r-ease-*`, `--r-z-*` |

Status colours reach components through **tone classes**. A component reads `--tone-solid`, `--tone-solid-hover`, `--tone-on-solid`, `--tone-soft`, `--tone-soft-hover`, `--tone-text` and `--tone-border`; the classes `.r-tone-neutral`, `.r-tone-brand`, `.r-tone-success`, `.r-tone-warning`, `.r-tone-danger`, `.r-tone-violet`, `.r-tone-flame` and `.r-tone-sky` fill them in. That is why `RBadge`, `RButton` and `RChip` take a `tone` prop instead of a variant per colour.

## Theming

Themes are attributes, not class names or separate stylesheets.

```html
<html data-theme="dark" data-brand="violet">
```

- `data-theme="light" | "dark"` re-points every semantic token. It works on any element, not only `<html>`: the command palette and tooltips are dark islands inside a light page.
- `data-brand="violet" | "flame"` swaps the brand ramp (leave it off for blue). Set it on `<html>`.
- Coloured cards (`RCard variant="brand"` or `"flame"`) re-point text, border and chart tokens locally, so anything inside them reads on colour.

`useTheme()` keeps both attributes in sync with a stored preference (`light`, `dark` or `system`) and the brand, using the localStorage keys `rapi-theme` and `rapi-brand`. The inline script in `index.html` applies them before the first paint, so there is no flash of the wrong theme.

```ts
import { useTheme } from './design-system'

const { theme, brand, resolved, setTheme, setBrand } = useTheme()
setTheme('dark')
setBrand('flame')
```

## Accessibility

- Text colours pass WCAG AA; the tertiary grey is 5.3:1 on white, 4.9:1 on the canvas and 5.4:1 on the dark surface. Solid fills in light tones (success, warning, flame, sky, and the flame brand) carry dark labels, because white on them falls below 4.5:1.
- Focus is always visible: a 2px brand outline on buttons, chips and tabs; a brand border with a soft 3px halo on text fields.
- Widgets use the expected roles and keys: tablist, radiogroup with arrow keys, switch, menu with typeahead and submenus, dialog with a focus trap and focus restore, combobox and listbox in the command palette.
- Charts have a label, a visually hidden data table, and arrow-key exploration with a live region.
- With reduced motion on, durations drop to almost nothing and count-up numbers appear at once.

## Credits

The design references are listed with their designers on the References page of the docs. Nothing was copied from them; they were studied and measured. Plus Jakarta Sans is by Tokotype. Icons are from Lucide.
