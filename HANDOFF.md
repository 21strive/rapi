# Rapi Design System — handoff

This file carries everything from the first session (on the user's laptop, 2026-11-02/03) so the work can continue on another machine. Read it fully before writing code.

## 1. The brief

The user asked (Indonesian, verbatim):

> Oke, sekarang tolong kamu buatkan design system dengan beberapa contoh yang terinspirasi dari design2 yang ada di folder dribble-clean-minimalistic tersebut.
> Kamu buat FE design systemnya dengan Vue, dan komponen Vue hasil garapan dari design systemnya.
> Kamu adalah Senior UI/UX designer dribbble MVP yang pernah bekerja di firma design terbaik seperti Pentagram dan Huge inc
> buat project design system ini di folder baru ya

So the deliverable is: a design system (foundations + tokens), a Vue component library built on it, and several example screens built only from those components, in this folder.

How the user likes to work:

- Reply to the user in Indonesian and keep it short. Code, comments and the docs site copy are in English.
- Copy must read like a person wrote it: plain sentences, no marketing fluff, no "**Label:** text" bullet walls.
- Decide from this brief and this file. Do not send the user lists of questions; ask only about a real conflict (one or two at most).
- Do not push anywhere or create remote repos unless asked.

## 2. Where things are

| Path | What |
|---|---|
| `~/Projects/rapi-design-system/` | This project |
| `~/Projects/dribbble-clean-minimalistic/` | The 66 reference images + 2 mp4 animations from the user's Dribbble collection "Clean Minimalistic". Files are `NN-shot-slug-KK.ext`: `NN` = shot order in the collection, `KK` = image order on the shot page. Non-UI images (studio promo banners, testimonial slides, logo outros) were already removed on purpose. |
| `handoff/contact-sheets/sheet-1..5.png` | Numbered thumbnails of all 66 images. `index.txt` maps each number to its file. Look at these first; open the originals only for detail. Local only: `handoff/` is git-ignored because the thumbnails are other designers' work. |
| `handoff/PROMPT.md` | The prompt the user pastes to start this session |

## 3. Status

Done:

- Vite 8 + Vue 3.5 + TypeScript project. `package-lock.json` is committed; run `npm install` first (node_modules was not copied). Vite 8 needs Node ≥ 20.19.
- TypeScript is pinned to `~5.9` on purpose: `vue-tsc` 3 crashes on TypeScript 7 (`ERR_PACKAGE_PATH_NOT_EXPORTED ./lib/tsc`). Do not upgrade it.
- vue-router 5.4 (`createRouter`, `createWebHashHistory`, `RouterLink`, `RouterView` all exist). lucide-vue-next 1.0; these icon names are verified to exist: ArrowUpRight, ArrowDownRight, ArrowRight, ArrowLeft, ArrowUp, ArrowDown, Check, ChevronDown/Right/Left/Up, ChevronsUpDown, X, Search, Bell, Settings, Download, Upload, Plus, Minus, MoreHorizontal, Ellipsis, Calendar, CalendarDays, CalendarClock, Clock, AlarmClock, Copy, Trash2, Pencil, Archive, Filter, SlidersHorizontal, LayoutDashboard, LayoutGrid, Building2, Users, User, UserRound, Store, FolderKanban, Briefcase, Wallet, BookOpen, Truck, Receipt, LogOut, Moon, Sun, Monitor, Command, CornerDownLeft, LoaderCircle, Sparkles, Palette, Type, Ruler, Layers, Component, ChartColumn, ChartLine, Gauge, Grid3x3, Zap, Video, Repeat, Tag, DollarSign, Banknote, CircleDot, Hash, Link, ExternalLink, Menu, PanelLeft, Star, TrendingUp, CircleHelp, Info, Bookmark, Inbox, FileText, Share2, Eye, Keyboard, MousePointerClick, Wand2, Activity, Heart, Flame, Box, Package, Globe, Mail, Phone, MapPin.
- `index.html`: sets `data-theme` and `data-brand` on `<html>` before first paint from localStorage keys `rapi-theme` (`light` | `dark` | `system`) and `rapi-brand` (`blue` | `violet` | `flame`).
- `vite.config.ts`: `base: './'` (built docs work from any static host), alias `@` → `src`, dev port 5180 (strict).
- `src/design-system/tokens/tokens.css`: primitive ramps, brand alias ramp, light and dark semantic roles, brand swaps, type/space/radius/control/motion/z-index tokens, reduced motion.
- `src/design-system/tokens/base.css`: reset, type scale classes, `.r-tone-*` helpers, utilities.

Session 2 (2026-11-02, on the VM, ~/rapi-design-system; references at ~/dribbble-clean-minimalistic):

- Local git repo (no remote yet; the user wants it pushed to a new repo `21strive/rapi` at the end).
- Font check passed: Plus Jakarta Sans has real tabular figures ("111111" and "000000" both 201.6px at 56px), so it stays.
- Built: composables (floating, dom, format, identity, theme), all 27 components, 8 charts, `src/design-system/index.ts`, `src/main.ts`, docs shell (sidebar, top bar, ⌘K palette, theme + brand switch, mobile drawer), doc helpers, Introduction page, Weekly schedule example, README. Remaining pages and the other two examples were built in parallel by helper agents.
- Contrast pass (axe-core, every route, light and dark, blue/violet/flame: 0 violations): neutral-500 is now #646c7a and dark tertiary #868e9c; danger fill rose-600, danger/flame text one step darker; success, warning, flame and sky solids (and the flame brand) carry dark labels.
- QA scripts (Playwright, Chromium on the VM): `~/worktrees/session-prompts/rapi-design-system/bin/shot.cjs` and `probe.cjs`; screenshots land in `../shots/`.

Original plan, for reference:

1. Composables
2. `src/main.ts` (it does not exist yet, so `npm run dev` fails until it is added)
3. Components
4. Charts
5. Library entry `src/design-system/index.ts`
6. Docs site
7. Example screens
8. `npm run build` clean + browser check (light, dark, brand swap, 375px wide, keyboard)
9. README

## 4. What the references taught us

These findings are the design rationale; the docs site should say them in its Introduction.

- **Quiet canvas, loud data.** Measured on the 24 shots: accent colours cover under 1% of pixels in most of them (the orange banking card at 5% is the outlier). Canvases are near-white neutrals (#F8F8F8, #F0F0F0, #E8E8E8). Colour is reserved for meaning: status, data, the one primary action.
- **Numbers are the hero.** KPIs at 40–56px, semibold, tight tracking, tabular figures. Units are muted and smaller ("40–189 bpm", "2,589 kcal"). Deltas are small pills (+1.9% green, −1.2% red) next to "than last month".
- **Soft geometry.** Cards about 20px radius, nested wells 14px, controls 10px, chips and segmented controls fully round. 1px hairlines instead of heavy borders; shadows are wide and very low opacity.
- **Ink for emphasis.** The active nav pill, the "Continue" button, the current pagination page are near-black. Blue means brand and selection.
- **Keyboard first.** ⌘K hints inside search fields, command palette footers ("↑ ↓ to navigate, ↵ to select, esc to close, ← return to parent"), shortcuts in menus (⌘C, ⌘D).
- **Signature data visuals:** dot-matrix bars and a semicircle radial-tick gauge (Syncrowave), heatmaps (Fireart "orders by time", Makaryo attendance), smooth line with gradient area (Makaryo cashflow, Prody budget, banking statistics), min–max range bars (heart rate), horizontal stacked bars (energy activity), columns with a hatched track and target tick (banking analytics), sparklines (Coinex).
- Colour samples taken from the shots: blue #3860F8 / #1870F8 / #2868F0 / #4078F0 / #0040F8, violet #5838F8 / #5848E8 / #9050F8 / #9890F8, flame #F84820, green #08B868, rose #F87080, sky #1890C0.

Good screens to study up close: Syncrowave (01), banking components (06), Makaryo (08), chart cards (10), integrations search (12), onboarding tooltip (15), command menu (17), event editing calendar (18), Finanzen filter (19), add tags filter (24).

## 5. Decisions already made

- **Name:** Rapi (Indonesian for tidy/neat). Component prefix `R` (`RButton`), CSS custom property prefix `--r-`.
- **Font:** Plus Jakarta Sans Variable (`@fontsource-variable/plus-jakarta-sans`, by Tokotype in Jakarta; a nice local story). Check that it has tabular figures: render "111111" and "000000" with `font-variant-numeric: tabular-nums` and compare widths. If they differ, switch `--r-font-sans` to Inter Variable (`@fontsource-variable/inter`).
- **Type:** default UI text 14px. Scale tokens 11/12/13/14/16/18/24/32/40/56. Classes in base.css: `.r-display-xl .r-display .r-h1 .r-h2 .r-h3 .r-title .r-body-lg .r-body .r-body-sm .r-caption .r-overline .r-numeric .r-mono`.
- **Buttons:** `variant` (solid | soft | outline | ghost) × `tone` (neutral | brand | danger | success). Default is solid + neutral, which is ink. Brand blue is for selection controls (checkbox, switch, focus ring, links, selected rows) and brand moments (the hero KPI card, chart series 1).
- **Tone system:** components never hard-code status colours. They read `--tone-solid`, `--tone-solid-hover`, `--tone-on-solid`, `--tone-soft`, `--tone-soft-hover`, `--tone-text`, `--tone-border`, which the classes `.r-tone-{neutral|brand|success|warning|danger|violet|flame|sky}` set.
- **Theming:** components only use semantic tokens. `[data-theme='dark']` works on `<html>` or on any element (a dark island; the command palette is always dark, like the Untitled UI reference). `[data-brand='violet' | 'flame']` swaps the whole brand ramp. Coloured cards (brand, flame, ink) re-point `--r-text`, `--r-text-secondary`, `--r-border` locally so nested components adapt.
- **Accessibility:** neutral-500 #6B7382 passes AA on white (4.78:1); dark tertiary #808896 on #14171C is about 5:1. Focus ring = 3px brand at 26%. Durations drop to 0.01ms under reduced motion (already in tokens). Proper roles: tablist/tab, radiogroup/radio, switch, menu/menuitem, dialog with focus trap and focus restore. Charts get `role="img"`, an `aria-label`, and a visually hidden data table.
- **No external images:** avatars are initials on hashed pastel tones. **No chart library:** every chart is hand-built SVG.
- **Docs copy** in English.

## 6. Build plan

### Composables (`src/design-system/composables/`)

- `floating.ts` — `useFloating(floatingRef, { anchor: () => HTMLElement | {x, y}, placement, offset, open })` returns fixed `x`/`y`, flips when out of space, clamps 8px inside the viewport, updates on scroll/resize. Placements: top, top-start, top-end, bottom, bottom-start, bottom-end, left, left-start, right, right-start.
- `dom.ts` — `useClickOutside`, `useElementSize` (ResizeObserver), `useFocusTrap` (Tab cycling + restore focus), `useScrollLock` (ref-counted), `useHotkey`.
- `format.ts` — `formatNumber`, `formatCompact` (25K), `formatPercent`, all via `Intl.NumberFormat`.

### Components (`src/design-system/components/`), `<script setup lang="ts">`, `defineModel`, `useId`

- **RButton** — variant, tone, size (sm 32 / md 40 / lg 48), shape (rounded | pill), block, loading (LoaderCircle spinner, aria-busy), disabled, type, href (renders `<a>`). Slots: default, leading, trailing. Solid gets `--r-shadow-highlight`; press = slight scale.
- **RIconButton** — label (aria-label, required), variant (outline default | ghost | soft | solid), tone, size, shape (circle | square), dot (notification dot). The round "↗" button in cards and the "…" more button.
- **RKbd** — keyboard key chip.
- **RBadge** — tone, variant (soft | outline | solid), dot, square (radius 6 instead of pill), size. Statuses like Pending / Paid / In progress / Done.
- **RTrend** — value (number), suffix '%', precision, invert (lower is better), variant (soft pill | plain), icon. Auto green/red/neutral.
- **RChip** — filter chip like Finalytic: variant (outline | solid | soft | dashed for "Add filter"), tone, caret, removable (emits remove), size; leading icon slot.
- **RAvatar / RAvatarGroup** — name → initials + hashed pastel tone, size xs 20 → xl 48, ring, status dot; group with max and "+N" bubble.
- **RInput** — v-model, variant (outline | filled), size, invalid, disabled, label, hint, error; slots leading (icon) and trailing (RKbd "⌘K"). Native `type="date"` must look right too (Finanzen filter).
- **RSelect** — styled native select, options [{label, value}], placeholder, leading slot (e.g. status dot).
- **RCheckbox** (indeterminate), **RSwitch** (role="switch").
- **RSegmented** — options [{label, value, icon?}], variant `inset` (track + sliding white thumb, like Ofative Daily/Weekly/Monthly and Include/Exclude) or `pill` (separate pills, active = ink, like Syncrowave's top nav). Radiogroup with arrow keys.
- **RTabs** — underline tabs with animated indicator, counts; arrow keys.
- **RCard** — title, subtitle, padding (none | sm | md | lg), variant (surface | muted | outline | brand | flame | ink), interactive; slots header, actions, default, footer. Brand/flame cards get a soft radial-gradient sheen (no images).
- **RStat** — label, value, prefix, suffix, unit (muted), decimals, mutedDecimals (".43" muted), trend + trendLabel, size md | lg | xl, animate (count-up, respects reduced motion).
- **RMeter** — variant `bar` (segments [{value, color, label}] for stacked, optional gradient) or `ticks` (row of thin vertical bars like Makaryo "Company job levels").
- **RTable** — columns [{key, label, align, width, sortable, numeric}], rows, rowKey, selectable + v-model:selected, v-model:sort, density, stickyHeader, emptyText; slots `cell-{key}`, `header-{key}`, `empty`. Horizontal scroll on small screens.
- **RPagination** — current page as an ink square, ellipsis, prev/next.
- **RMenu** — items [{label, icon, shortcut, description, danger, disabled, children, divider, checked}], header slot (event colour dots), one level of submenu, full keyboard support.
- **RPopover** — v-model:open, placement, offset, anchor = trigger slot or a `point` {x, y} (context menus), teleported, outside click + Esc close, focus returns to trigger.
- **RTooltip**, **RDialog** (sizes sm 400 / md 520 / lg 720, focus trap, scroll lock, Esc, backdrop).
- **RCommandPalette** — always dark island; groups, icons, shortcuts, right-side meta ("2:51 PM"), fuzzy filter, ↑ ↓ ↵ esc, nested pages with breadcrumb ("Remind me"), Backspace/← on empty input returns to parent, footer key hints.
- **RCoachmark** — onboarding card: title, close, body, media slot (coloured illustration well), "1 of 4", Skip/Back + ink Continue.
- **RTour** — steps [{target selector, title, body}], spotlight around the target, positions an RCoachmark next to it, scrolls the target into view.
- **RNavItem** — icon, label, badge, active, variant soft | solid, `as` prop so it can render RouterLink without the library depending on vue-router.

### Charts (`src/design-system/charts/`), responsive SVG via `useElementSize`, tokens for every colour

- **RDotMatrixChart** — stacked series as columns of dots, y gridlines, hover column with tooltip, optional faint empty dots.
- **RLineChart** — multi-series, monotone cubic smoothing, gradient area, highlight index (vertical marker), crosshair tooltip.
- **RSparkline** — tiny line, `color: 'auto'` picks green/red from the trend.
- **RRadialGauge** — semicircle of rounded radial bars, segments coloured, centre value slot, legend, staggered entrance.
- **RHeatmap** — rows × cols, intensity via `color-mix()` from the chart colour into the track colour, legend, tooltip.
- **RRangeBars** — min–max rounded bars with gradient, dashed average line with a pill label ("Avg. 57").
- **RBarList** — horizontal single or stacked bars with legend and value labels.
- **RColumnChart** — columns with a hatched track and a target tick, percentage labels.

### Library entry

`src/design-system/index.ts` re-exports every component and chart, exports a `RapiPlugin` for `app.use()`, and imports `tokens.css` + `base.css` + the font.

### Docs site (`src/docs/`)

- Shell: left sidebar (Introduction · Foundations: Colour, Typography, Layout & elevation · Components: Actions, Forms, Data display, Navigation, Overlays · Charts · Examples · References), top bar with a search field that opens the command palette, theme switch (light / dark / system) and brand dots (blue / violet / flame). Mobile: sidebar becomes a drawer.
- ⌘K anywhere opens RCommandPalette: jump to pages, toggle theme, and a nested "Brand ▸ Blue / Violet / Flame" page (shows nesting).
- Each component section: short description, live demos of variants and states, a usage snippet, a props table, one or two do/don't notes.
- Foundations pages render swatches straight from the CSS variables (show hex + token name + contrast where it matters), the type scale, spacing/radius/shadow specimens, motion tokens.
- References page: the table in section 7 with designer credits and links.

### Example screens (built only from library components)

1. **Sales overview dashboard** (Syncrowave-like): top bar with pill segmented nav, page title, export button, date range chips, three KPI cards (one brand card), dot-matrix sales summary, radial gauge for categories, finance balance meter, recent transactions table, orders-by-hour heatmap, and a "Take the tour" RTour.
2. **Projects list** (Finanzen + Finalytic): sidebar app shell, title with count badge, search with ⌘K hint, filter chips row, filter popover (date range, client type, include/exclude tag search with checkmarks, Reset/Apply), selectable table with status badges and team avatars, row "…" menu, bulk action bar when rows are selected, pagination. Filtering must really work on the sample data.
3. **Weekly schedule** (Ofative event editing): mini month calendar, calendar list with coloured checkboxes, Daily/Weekly/Monthly segmented, week grid with pastel event blocks and avatars, right-click context menu (colour dots, Make flexible, Reschedule ▸ submenu, Copy ⌘C, Duplicate ⌘D, Delete), click opens an edit dialog. This one is close to the user's own product (a scheduling app), so make it good.

### Finish line

- `npm run build` (vue-tsc + vite) passes with no errors.
- Every page checked in light and dark, with the violet and flame brands, at 375px wide, and with the keyboard.
- README explains install, token architecture, theming, using the library in another Vue app, and how to run the docs.
- If the machine has no browser, at least build, then tell the user how to view the dev server from their laptop: `ssh -L 5180:localhost:5180 <user>@<host>` and open http://localhost:5180.

## 7. Reference index

| NN | Shot | Designer | Link |
|---|---|---|---|
| 01 | Syncrowave – CRM Dashboard | Lil Dicky for Odama | https://dribbble.com/shots/24481340-Syncrowave-CRM-Dashboard |
| 02 | Sales Analytics Dashboard | Fireart UI/UX for Fireart Studio | https://dribbble.com/shots/24191273-Sales-Analytics-Dashboard |
| 03 | Project management dashboard · Business Analytics App | George Lov® | https://dribbble.com/shots/24718258-Project-management-dashboard-Business-Analytics-App |
| 04 | Coinex – Dashboard | Barly Design | https://dribbble.com/shots/25204762-Coinex-Dashboard |
| 05 | Coinex – Dashboard | Barly Design | https://dribbble.com/shots/25174144-Coinex-Dashboard |
| 06 | Dashboard UI components for the online banking platform | Outcrowd | https://dribbble.com/shots/24690997-Dashboard-UI-components-for-the-online-banking-platform |
| 07 | Financial Dashboard | Kevin Dukkon | https://dribbble.com/shots/24455638-Financial-Dashboard |
| 08 | Makaryo – HR Management Dashboard | Yoga Satria | https://dribbble.com/shots/24405495-Makaryo-HR-Management-Dashboard |
| 09 | Clario – CRM Platform | Barly Design | https://dribbble.com/shots/23950296-Clario-CRM-Platform |
| 10 | Chart Cards | Michal Parulski | https://dribbble.com/shots/20454370-Chart-Cards |
| 11 | Bento Cards Layout | Moty Weiss | https://dribbble.com/shots/23952700-Bento-Cards-Layout |
| 12 | Integrations search — Untitled UI | Jordan Hughes® | https://dribbble.com/shots/22646467-Integrations-search-Untitled-UI |
| 13 | Chainx – Search Design | Barly Design | https://dribbble.com/shots/24753186-Chainx-Search-Design |
| 14 | Trenning – Report Issues on Learning Materials in SaaS LMS | Bagus Fikri | https://dribbble.com/shots/25250985-Trenning-Report-Issues-on-Learning-Materials-in-SaaS-LMS |
| 15 | Onboarding tooltip | Andrew Mialszygrosz | https://dribbble.com/shots/24022941-Onboarding-tooltip |
| 16 | TimeTracker – Search Modal | Rafiqur Rahman | https://dribbble.com/shots/20448776-TimeTracker-Search-Modal |
| 17 | Command+K search menu — Untitled UI | Jordan Hughes® | https://dribbble.com/shots/23324956-Command-K-search-menu-Untitled-UI |
| 18 | Event Editing | Product SAAS | https://dribbble.com/shots/23816673-Event-Editing |
| 19 | Finanzen – Filter and Search | Fakhri Naufal | https://dribbble.com/shots/23037714-Finanzen-Filter-and-Search |
| 20 | Leads List View | Kevin Bhagat | https://dribbble.com/shots/25091201-Leads-List-View |
| 21 | Product List – UI Design | Uxerflow UI/UX | https://dribbble.com/shots/25116554-Product-List-UI-Design |
| 22 | User List | Tuhel | https://dribbble.com/shots/23620916-User-List |
| 23 | Dashboard | Pixsellz | https://dribbble.com/shots/24671652-Dashboard |
| 24 | Add Tags — Filter System | Kevin Dukkon | https://dribbble.com/shots/21712963-Add-Tags-Filter-System |
