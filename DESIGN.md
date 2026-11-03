# Rapi 0.2 — the design language of 21 Strive

Rapi is the design language and the design system of 21 Strive. This file is the source of truth
for how it looks and why. The docs site says the same things to readers; this file says them to
whoever builds with it.

The starting point is the 21 Strive brand book (March 2025): the logogram, cobalt `#1B3AAB` and
periwinkle `#7E94E2` on black `#151515` and white, Geist for headings and text, Geist Mono in
capitals for small headers, and spec pages ruled into columns with a running header. Around that,
the references are the products that feel serious: IBM Carbon (square, dense, productive), Linear
(restraint, keyboard), Cloudflare's dashboard (tables and traffic charts that do real work),
VoidZero (ruled grids, mono labels), SpaceX telemetry (readouts, timelines, lamps) and, as the
twist, Teenage Engineering (instruments, knobs, dot-matrix digits, one orange).

Picture who uses it: a treasury desk at a neo bank, a security operations floor, launch control.
Nothing floats, nothing bounces, nothing is decorated. The data is the loudest thing on screen.

## Principles

1. **Square by default.** Every corner is 0. A circle always means a point or a state: a status
   lamp, a radio button, a data point. Never a pill, never a rounded card.
2. **Rules, not shadows.** 1px hairlines carry structure: around panels, between rows, between
   cells of a ruled grid. Only things that float above the page (menus, popovers, dialogs, toasts)
   get a shadow, and it is short.
3. **Two voices of type.** Geist reads: titles, body, values. Geist Mono labels: eyebrows, table
   heads, axis ticks, units, ids, timestamps, statuses, in capitals with +10% tracking. Geist Pixel
   is reserved for one instrument readout per screen at most (a clock, a counter).
4. **Colour is a signal.** Ink and greys do almost all the work. Cobalt marks the brand, the
   selection and the one primary action in a flow. International Orange (`#FF4F00`) marks what is
   live, now, or needs eyes, and nothing else. Status colours never appear without an icon or a
   word.
5. **Numbers are instruments.** Tabular figures wherever numbers line up; units small, in mono
   caps; hero figures large, Geist SemiBold, tight tracking, proportional.
6. **Index everything.** Running numbers (01, 02), eyebrows over titles, a mono strip across the
   top of a page with the context on the left and the date or status on the right.

## Tokens to reach for

Components only read semantic tokens. Never hard-code a hex in a component or a screen.

| Need | Token |
|---|---|
| Page, panel, hover, pressed | `--r-bg-canvas`, `--r-bg-surface`, `--r-bg-muted`, `--r-bg-hover`, `--r-bg-pressed`, `--r-bg-selected` |
| Text | `--r-text`, `--r-text-secondary`, `--r-text-tertiary`, `--r-text-disabled` |
| Lines | `--r-border-subtle` (inside panels), `--r-border` (panels, rules), `--r-border-strong` (inputs, floating panels) |
| Ink emphasis | `--r-ink`, `--r-ink-hover`, `--r-on-ink` |
| Brand | `--r-brand`, `--r-brand-hover`, `--r-brand-soft`, `--r-brand-text`, `--r-brand-border`, `--r-brand-secondary` (periwinkle) |
| Signal | `--r-signal`, `--r-signal-soft`, `--r-signal-text`, `--r-on-signal` (black: white fails on orange) |
| Status | `--r-success*`, `--r-warning*`, `--r-danger*`, and lamps `--r-status-good / warning / serious / critical / off` |
| Data | `--r-chart-1` … `--r-chart-8`, `--r-chart-context`, `--r-chart-ink`, `--r-chart-now`, `--r-chart-grid`, `--r-chart-axis`, `--r-chart-label`, `--r-chart-track`, `--r-seq-0` … `--r-seq-8`, `--r-div-pos / -pos-soft / -mid / -neg-soft / -neg` |
| Shape | `--r-radius-surface`, `--r-radius-control`, `--r-radius-mark` (all 0), `--r-radius-round` (lamps, radios, dots only) |
| Size | `--r-control-xs 24` · `sm 28` · `md 32` (default) · `lg 40` · `xl 48`; `--r-space-*` on a 4px grid |
| Motion | `--r-duration-instant 70` · `fast 110` · `base 160` · `slow 240`; `--r-ease-out`, `--r-ease-in-out`. No springs. |

Tone classes `.r-tone-neutral | brand | signal | success | warning | danger` fill `--tone-solid`,
`--tone-on-solid`, `--tone-soft`, `--tone-text`, `--tone-border`, `--tone-lamp` for components that
take a `tone` prop.

Type classes: `.r-display-xl` 72 · `.r-display` 56 · `.r-h1` 32 · `.r-h2` 24 · `.r-h3` 18 ·
`.r-title` 14 semibold · `.r-body-lg` 16 · `.r-body` 14 · `.r-body-sm` 13 · `.r-caption` 12 ·
`.r-eyebrow` (mono caps 11, the brand's Small Header) · `.r-label` (mono caps 11, quiet metadata) ·
`.r-index` (mono 10, "01") · `.r-numeric` (tabular) · `.r-mono` · `.r-pixel`.

Utilities: `.r-grid-ruled` (cells separated by 1px rules), `.r-marks` (registration marks on the
four corners of a panel), `.r-hatch` (45° hatching that means forecast, no data or out of window),
`.r-hairline`, `.r-sr-only`.

## Layout patterns

- **The strip.** A 32px mono-caps bar across the top of an app or page: context on the left
  ("TREASURY / CASH POSITION"), date, clock or status on the right. From the brand book's running
  header. `SampleShell` draws it for the sample screens.
- **The spec header.** Eyebrow (mono caps) over a title (Geist SemiBold, negative tracking), with
  a short description in a narrow column to the right on wide screens, as on the brand book pages.
- **Ruled grid.** Panels butt against each other separated by 1px rules instead of floating apart
  on gaps. Use it for KPI rows and bento layouts. Gaps (16–24px) are fine between unrelated groups.
- **Panels.** `RCard` is a square panel with a 1px border, an optional eyebrow, title, index and
  meta. `marks` adds registration marks for instrument panels. No shadow.
- **Supergraphic.** The logogram blown up behind content (`RSupergraphic`), at most one per view,
  never behind dense data. Brand covers, empty states, sign-in panels, section heroes.
- **Construction lines.** The mark's guide lines as hairlines (`RSupergraphic variant="construction"`)
  behind heroes and empty states.
- **Density.** Rows 32–40px in tables, controls 32px, 24px page padding on desktop, 16px on phones.
  Dense is fine; cramped is not: keep at least 12px inside a panel.

## Components

- **Buttons.** Default is solid ink. `tone="brand"` for the primary action of a flow (one per
  view). `tone="signal"` only for live or urgent actions (Go live, Acknowledge alarm). `danger` for
  destructive. Variants solid, outline, ghost, soft. Square, 32px by default.
- **Badges** are mono caps tags: `PAID`, `IN REVIEW`, `P1`. Square, 20px tall.
- **Status** (`RStatus`) is a lamp plus a mono caps word: `NOMINAL`, `DEGRADED`, `LIVE`. Pulse
  (a two-step blink) only for things that are live right now.
- **Tables** have mono caps heads, hairline rows, numerics right-aligned in Geist Mono, the selected
  row in `--r-bg-selected` with a 2px cobalt rule on its leading edge.
- **Forms** have Geist labels (12px, medium), square 32px fields with a strong 1px border, and a
  2px cobalt focus ring. Errors in danger text with an icon.
- **Overlays** are square panels with a strong border and a short shadow. The command palette and
  tooltips are dark islands.
- **Readouts** (`RReadout`) are for telemetry and instruments: mono caps label, large mono or pixel
  figure, unit in mono caps.
- **Icons** are Lucide at 1.5 stroke with square caps (base.css sets this). 16px in controls,
  14px in dense rows.

## Charts

The method comes from the dataviz guidelines; the look comes from the brand.

- **Square marks.** Bars and columns have square ends, a 2px surface gap between neighbours,
  at most 24px thick. Lines are 2px, straight segments (`curve="linear"`) or steps; smoothing only
  when the data is truly continuous. Points are circles, r ≥ 4, with a 2px surface ring.
- **Recessive frame.** Gridlines are solid 1px `--r-chart-grid`; the baseline is `--r-chart-axis`.
  Axis ticks and labels are Geist Mono 10–11px in `--r-chart-label`, with small outer tick marks
  like an engineering plot. Dashes mean something: a target, a threshold or a forecast.
- **Colour by job.** Identity: `--r-chart-1…8` in order, never cycled, never re-assigned on
  filter. Magnitude: the cobalt sequential ramp. Polarity: cobalt ↔ orange through grey. State:
  status tokens, always with a label. Emphasis: one series in cobalt, the rest in
  `--r-chart-context`. "Now" is a signal-orange line.
- **Text is text.** Labels, values and legends use text tokens, never the series colour; a swatch
  beside the text carries identity. Legend for two or more series; direct labels only on the
  endpoint, the extreme or the series the story is about.
- **Always readable without colour or hover.** Every chart has `label` (its accessible name), a
  hidden data table, keyboard exploration and a crosshair or per-mark tooltip. Amber and periwinkle
  sit under 3:1 on white, so a chart that uses them also labels them directly.
- **Hatching** (45°) marks forecast, no-data and maintenance windows. It is never decoration.

## Copy

- English, sentence case for titles, buttons and labels. Mono caps only where the type style is an
  eyebrow, label, status or table head.
- Plain sentences. No exclamation marks, no emoji, no marketing words ("seamless", "powerful",
  "revolutionary"), no "**Label:** text" lists.
- Realistic data: real-looking names from Indonesia and elsewhere, IDR / USD / SGD amounts with
  correct separators, 24-hour times with a zone (`14:02 WIB`, `07:02 UTC`), dates like
  `12 Nov 2026`. Never lorem ipsum.
- Numbers: thousands separators, units after the figure in mono caps (`1,284 RPS`, `37.2 °C`),
  signed deltas (`+1.9%`, `−0.4 pp`) with the true minus sign.

## Don't

- Rounded corners, pills, gradients, glass and blur (except the frosted docs top bar), glows,
  soft wide shadows on cards.
- More than one supergraphic per view, or a supergraphic behind a chart or a table.
- Orange for errors (that is danger red) or for decoration (it is the signal).
- Colour-only meaning: a red number without a minus sign, a lamp without a word.
- A second y-axis on one plot.
- Hard-coded colours, radii or font stacks in screens; use the tokens and the components.
