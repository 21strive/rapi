# Rapi — handoff

Read this before changing anything. `DESIGN.md` holds the language itself; this file holds the
brief, the decisions behind it and how the work is organised. The 0.1 handoff (the Dribbble-based
first version) is in git history at commit `10c4580`.

## 1. The brief

On 2026-11-03 the founder of 21 Strive asked (Indonesian, paraphrased):

> The radius on every Rapi component is still too soft, too floaty, too frutiger aero. I respect the
> radius of the Cloudflare dashboard, voidzero.dev, IBM's design language and Linear, which barely
> uses radius. Rapi should take that serious approach. The design system, especially the charts,
> needs to be more serious: assume the users are a neo-modern bank, defense and security, or even
> SpaceX, with a Teenage Engineering twist. I want Rapi to be the official design language and
> system of 21 Strive. Afterwards, make at least 30 more sample designs in the new language.

They attached the 21 Strive brand book (March 2025): the logogram, cobalt `#1B3AAB`, periwinkle
`#7E94E2`, black `#151515`, Geist SemiBold −4% for big headers, Geist Mono Bold caps +10% for small
headers, Geist Regular at 1.5 for body, spec pages with a running mono header, the logogram used as
a supergraphic.

How the user likes to work: replies in Indonesian and short; code, comments and docs copy in
English; copy that reads like a person wrote it; decide instead of asking long lists of questions;
push or merge only when asked.

## 2. Decisions

- **Shape.** Every corner is 0 (`--r-radius-surface`, `--r-radius-control`, `--r-radius-mark`).
  Circles only for status lamps, radios and data points (`--r-radius-round`). No pills.
- **Structure.** 1px rules instead of shadows; ruled grids (`.r-grid-ruled`), registration marks
  (`.r-marks`), hatching that means forecast or no data (`.r-hatch`). Shadows only on floating
  panels, short.
- **Type.** Geist and Geist Mono via fontsource variable packages; Geist Pixel (Circle, Square)
  vendored in `src/design-system/fonts/` under the OFL for instrument readouts.
- **Colour.** Ramps built in OKLCH on one lightness scale with the brand colours as exact stops
  (cobalt-700, cobalt-400, neutral-900). Neutrals are pure grey. International Orange `#FF4F00` is
  the signal colour (live, now, needs eyes) and carries black labels. Brand hue switching from 0.1
  is gone.
- **Charts.** Palette order cobalt, orange, teal, amber, magenta, green, periwinkle, red, validated
  with the dataviz validator in both themes (adjacent CVD ΔE ≥ 11.9 light / 9.2 dark; slots 1–3
  pass all-pairs). Sequential = cobalt ramp; diverging = cobalt ↔ orange via grey; status reserved.
  Square marks, 2px gaps, straight or step lines, mono ticks, dashes only for targets, thresholds
  and forecasts, an orange NOW line. Every chart has a label, a hidden table and keyboard reading.
- **Logo.** The user's own commit on main added the Rapi "r" (the stem and flag of the 21 Strive
  "1", flat side on top) and the "rapi" wordmark as outlines. `brand/marks.ts` holds those paths and
  the 21 Strive logogram; never redraw them.
- **Samples.** 36 screens in seven groups, registered in `src/docs/samples/registry.ts`, each at
  `/samples/<id>`, built only from library components and tokens, opening in the theme they were
  designed for (the sample toolbar flips it).

## 3. Status

Branch `feat/21strive-design-language` (from main `b63760c`), not pushed. Built in one session on the
VM on 2026-11-03 with parallel agents: the lead did tokens, brand components, docs chrome and all
charts; agents restyled the 27 existing components, built 15 new ones, rewrote the foundation pages
and built the 36 samples, then the lead folded their component feedback back into the library.

Checks at the end: `npm run build` clean; axe-core (WCAG 2.1 AA + best practice) over every docs
page and every sample in both themes; no horizontal overflow and no page errors at 375px on all 50
routes.

Open questions for the founder:
- Clear space (half the mark's height) and minimum sizes (mark 10px, lockup 16px) on the Brand page
  are proposals; the brand book does not state them.
- The samples invent product names for 21 Strive (Simpul, Sesi) and customers; swap in real names
  if wanted.
- Native date fields still follow the browser locale (time fields are 24-hour by default).

## 4. Working on it

- `source ~/tools/env.sh && npm run dev` (port 5180); `npm run build` = vue-tsc + vite.
- QA scripts (Playwright with the VM's Chromium) live outside the repo in
  `~/worktrees/session-prompts/rapi-21strive/bin`: `shot.cjs` (screenshot any route, theme, width,
  clicks, keys), `slice.cjs`, `sheet.cjs` (contact sheets), `thumbs.cjs` (every sample), `axe.cjs`.
- Code snippets inside `.vue` script blocks must write `<\/script>`, and import lines inside them
  must resolve, or Vite's dependency scanner fails.
- TypeScript stays on 5.9 (vue-tsc 3 does not run on TypeScript 7).
