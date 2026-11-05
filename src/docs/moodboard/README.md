# The moodboard

`/moodboard` in the docs: a thousand live Rapi components on one page, in a ruled bento grid, sorted
by the job each one does for a person. It exists to show what Rapi offers in a few minutes of
scrolling, and to make the rule in `DESIGN.md` ("What gets a screen") concrete: a screen earns its
place when seeing beats saying, when touch beats describing, or when a person decides; everything
else is a conversation, with a small surface for the check.

## Layout of this folder

```
MoodboardPage.vue   the page: strip, hero, toolbar, chapters or the mixed wall, inspector strip
board.ts            the ten jobs (order, claim, test) and the loader that numbers their tiles
types.ts            MoodEntry, TileSize, Surface, Domain, …
parts/              page chrome: MoodTile (one cell), ChapterBand, MoodHero, grid layout, observers
kit/                what specimens share: archetype(), useTick/useNow, gestures, formatting,
                    seeded data, pools of realistic names and places, and kit.css helpers
jobs/<job>/         one folder per chapter: the pattern components and index.ts with 100 entries
```

Each `jobs/<job>/index.ts` loads as its own chunk, so a broken chapter shows an error band and the
rest of the board still works. A tile that throws shows its error inside the tile.

## Adding or changing a tile

1. Write (or reuse) a pattern in `jobs/<job>/`: a Vue SFC whose root fills the tile body, usually
   `<div class="mk">…</div>` (`mk--bleed` for edge to edge). Only Rapi components and tokens.
2. Declare it once and add variants in `index.ts`:

   ```ts
   const fader = archetype(Fader, {
     name: 'Channel fader',
     hint: 'Drag the cap or click the rail; arrow and Page keys step; double-click resets',
     why: 'A level is found by ear and hand in a second; describing it in words takes three tries.',
     tags: ['fader', 'slider', 'audio'],
   })

   export const entries: MoodEntry[] = [
     fader({ id: 'tune-fader-vox', size: '1x2', domain: 'audio', props: { label: 'Vox 1', value: -4.5 } }),
   ]
   ```

3. Keep each chapter at 100 entries (the running numbers are `job × 100 + position`); the dev
   console warns otherwise, and about duplicate ids.

### Sizes and surfaces

The grid module is at least 172 px square (columns stretch to fill the width; rows match them).
A tile is `columns x rows` of modules: `1x1` up to `4x3`. Every tile has a 28 px caption, so a
`1x1` body is 172 × 144 at the minimum. On phones the board has two columns and wider tiles clamp
to two, so wide patterns must stay fluid.

`surface`: `surface` (default), `muted`, `dark` (a dark island in both themes), `brand` (cobalt,
rare), `signal` (International Orange, only for something live or needing eyes now).

### Live tiles

Use `useTick(ms)` or `useNow(ms)` from the kit for anything that changes on its own. They share one
interval per period across the board and only tick while the tile is on screen and the tab is
visible. Don't start your own long-running intervals or animation loops in a specimen.

## Query flags

`q` filter · `view=mixed` the shuffled wall · `seed` · `job=<id>` one chapter · `from` / `to` a
slice of each chapter · `all=1` mount every tile at once · `bare=1` the chapters without the page
chrome. `#/moodboard?job=tune&all=1&bare=1&from=0&to=25` is what the screenshot checks use.

## Checks before handing in tiles

- `node scripts/moodboard/moodlint.mjs <job>`: a static lint of the Rapi rules (no hex or raw
  colours, no radius but the round token, Rapi fonts only, no h1/h2 in tiles, no marketing words or
  emoji, ids prefixed with the job). "rule" lines must be fixed; "review" lines need a reason.
- `scripts/moodboard/moodshot.sh <job> <from> <to> <light|dark>`: a headless screenshot of a slice of
  one chapter against the dev server, with the page's console errors printed after it.
- `npm run build` type-checks everything.
