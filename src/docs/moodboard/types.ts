/**
 * The moodboard: a thousand small Rapi components on one page, sorted by the job each one does
 * for a person. Every tile is a specimen of a moment that deserves a screen; everything else is
 * left to a conversation.
 */
import type { Component } from 'vue'

/** The ten jobs a piece of UI can do for a person. Each is a chapter of the board. */
export type JobId =
  | 'glance'
  | 'decide'
  | 'tune'
  | 'watch'
  | 'compare'
  | 'ask'
  | 'verify'
  | 'respond'
  | 'enter'
  | 'identify'

/**
 * Columns × rows on the board's square module (about 172px on a laptop, so 1x1 is 172 × 172,
 * 2x1 is 344 × 172, 3x2 is 516 × 344). On a phone the board has two columns and wider tiles are
 * clamped to two, keeping their rows.
 */
export type TileSize =
  | '1x1'
  | '2x1'
  | '3x1'
  | '4x1'
  | '1x2'
  | '2x2'
  | '3x2'
  | '4x2'
  | '1x3'
  | '2x3'
  | '3x3'
  | '4x3'

/**
 * The panel the tile sits on.
 * `surface` the page panel (default) · `muted` one step off it · `dark` a dark island in either
 * theme (consoles, instruments) · `brand` flat cobalt with white text, a loud tile, rare ·
 * `signal` International Orange with black text, only for something live or that needs eyes now.
 */
export type Surface = 'surface' | 'muted' | 'dark' | 'brand' | 'signal'

/** Where the specimen comes from. Used for variety and for the filter. */
export type Domain =
  | 'banking'
  | 'payments'
  | 'security'
  | 'defense'
  | 'aerospace'
  | 'energy'
  | 'logistics'
  | 'transit'
  | 'devops'
  | 'workspace'
  | 'health'
  | 'commerce'
  | 'audio'
  | 'home'
  | 'agri'
  | 'civic'
  | 'media'
  | 'rapi'

/** One tile on the board. */
export interface MoodEntry {
  /** Unique on the whole board, prefixed with the job: "tune-fader-mix". */
  id: string
  /** The component that draws the specimen. It fills the tile body. */
  is: Component
  props?: Record<string, unknown>
  size: TileSize
  /** Short name in sentence case, shown in mono caps on the tile: "Channel fader". */
  name: string
  /** How to use it, for the inspector strip: "Drag the cap, or use the arrow keys". */
  hint: string
  /** Why this is a screen and not a sentence. One plain sentence. */
  why: string
  domain: Domain
  surface?: Surface
  /** Extra words for the filter: "knob", "audio", "live". */
  tags?: string[]
}

/** An entry once it is placed on the board. */
export interface BoardEntry extends MoodEntry {
  job: JobId
  /** Running number across the board, "0137". */
  index: string
  /** Position on the board, 0-based. */
  n: number
}

/** A pattern shared by several tiles: the component and what is true of every variant. */
export interface Archetype {
  is: Component
  name: string
  hint: string
  why: string
  tags?: string[]
}

export interface Variant {
  id: string
  size: TileSize
  domain: Domain
  props?: Record<string, unknown>
  surface?: Surface
  /** Overrides the archetype's name, e.g. "Hold to release payroll". */
  name?: string
  /** Overrides the archetype's hint. */
  hint?: string
  tags?: string[]
}
