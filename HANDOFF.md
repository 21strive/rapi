# Rapi — handoff

Read this before changing anything. `DESIGN.md` holds the language itself; this file holds the
brief, the decisions behind it and how the work is organised. The 0.1 handoff is in git history at
commit `10c4580`.

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

## 5. The moodboard (2026-11-05)

**Brief.** The founder asked (Indonesian, paraphrased) for a thousand more samples, not as full use
cases like the 36 screens but as a moodboard of components, all on one page in a hybrid grid, each
one usable on the spot, so a reader grasps what Rapi offers at once. And a principle to lead Rapi
from now on: we make UI to make things easier for people, not harder, and only build the UI that
matters, because language models can now replace complex interactions with conversation.

**Decisions.**
- The principle is now the first section of `DESIGN.md`, "What gets a screen", and of the docs
  Introduction: a screen earns its place when seeing beats saying, touch beats describing, or a
  person decides; everything else is a conversation with a small surface for the check.
- The moodboard lives in the docs (`#/moodboard`, `src/docs/moodboard/`), not in a new repo: it
  documents Rapi and uses the library directly, so it cannot drift from it.
- Ten chapters, one per job a piece of UI does for a person: glance, decide, tune, watch,
  compare, ask, verify, respond, enter, identify. 100 tiles each, 248 patterns, 18 domains.
- The board is a ruled bento grid of square modules (172 px at least; columns stretch to fill),
  `grid-auto-flow: dense`, tiles from 1x1 to 4x3, surfaces surface / muted / dark / brand /
  signal. "Mixed" shuffles all thousand into one wall; a scale control zooms the board to 75% or
  50%; the filter matches names, gestures, domains and surfaces; a strip at the bottom says why the
  tile under the pointer earned a screen.
- Tiles mount shortly before they scroll into view, through a queue that runs a few per frame
  (on-screen tiles first), and stay mounted. Live tiles share one interval per period (`useTick`)
  and only tick while on screen. Each chapter is its own chunk; a broken chapter or tile shows its
  error in place.

**How it was built.** The lead wrote the frame, the kit and four reference patterns; ten agents
then built one chapter each in parallel against a written brief, checking their own work with a
per-chapter type-check, a static lint of the Rapi rules (`scripts/moodboard/moodlint.mjs`) and
headless screenshots in both themes. The lead reviewed every chapter and audited the whole board.

**Status at the end of the session.** `npm run build` clean. All 1,000 tiles mount with no render
errors and no tile spills out of its cell at 375, 768 and 1425 px. Production build on an M1 at
1440 × 900: tiles ready about 0.4 s after navigation; scrolling the whole 65,000 px board at speed
holds about 53 fps by job and 50 mixed, with the longest task near 60 ms; about 50 MB of JS heap
with everything mounted. The 50% scale scrolls at about 26 fps at the same speed (four times the
tiles per screen).

**Library gaps the chapters worked around** (left for the library, not fixed in this session):
- `.r-card--brand` does not re-point `--r-brand`, `--r-brand-fill`, `--r-warning-text`,
  `--r-border-control`, `--tone-border` or the lamp colours, and `.r-card--signal` does not
  re-point `--r-signal`: cobalt marks vanish on cobalt panels and signal lamps on orange ones.
- `RButton`: `loading` sets `disabled`, so keyboard focus drops to the page; `aria-pressed="true"`
  turns a ghost button solid.
- `RStatus` shrinks and cuts its own word inside a flex row (chapters set `flex: none`).
- `RDial` uses one `format` for the readout and the ticks; `RSpecList`'s value slot only knows
  `SpecItem` fields; `RRadioGroup` collapses its columns on a viewport query, not a container query.
- Charts: `RLineChart` and `RGanttChart` tick thinning ignores the start-anchored first label;
  `RColumnChart` and `RWaterfallChart` thin labels by band width; `RColumnChart` has no column
  click event; `RWaterfallChart`'s legend cannot be hidden; `RScatterChart` labels can collide;
  the candlestick last-price tag can cover an axis label; `RLineChart` includes 0 unless `min` is set.
- `RTextarea`: an `aria-describedby` attribute replaces the counter's description.
  `RChip` is always a button (a dead tab stop for tags). `REmpty` always draws its supergraphic.
  `RSlider` uppercases mark labels (units lose their case). `RSegmented` wraps when it runs out of room.
- Headless Chrome will not lay a window out narrower than about 500 px, so phone checks were done in
  the browser with device emulation.

**Working on it.** See `src/docs/moodboard/README.md` for adding a tile and the query flags
(`?job=tune&all=1&bare=1&from=0&to=25` is what the screenshot checks use). Before handing in tiles,
run `node scripts/moodboard/moodlint.mjs <job>` and `scripts/moodboard/moodshot.sh <job> 0 25 light`.
