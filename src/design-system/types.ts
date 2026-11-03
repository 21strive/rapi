import type { Component } from 'vue'
import type { Placement } from './composables/floating'

export type Size = 'sm' | 'md' | 'lg'

/** Every tone has a matching `.r-tone-*` class in base.css. */
export type Tone = 'neutral' | 'brand' | 'signal' | 'success' | 'warning' | 'danger'

/** The six tones of the 21 Strive language. */
export type StatusTone = 'neutral' | 'brand' | 'signal' | 'success' | 'warning' | 'danger'

export type ButtonVariant = 'solid' | 'soft' | 'outline' | 'ghost'
export type ButtonTone = 'neutral' | 'brand' | 'signal' | 'danger' | 'success'
/** Control heights: xs 24 · sm 28 · md 32 · lg 40. */
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg'

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
export type AvatarStatus = 'online' | 'away' | 'busy' | 'offline'

export interface SelectOption {
  label: string
  value: string | number
  disabled?: boolean
  /** Anything else you want back in the `leading` slot, e.g. a status colour. */
  [key: string]: unknown
}

export interface SegmentedOption {
  label: string
  value: string | number
  icon?: Component
  disabled?: boolean
}

export interface TabItem {
  label: string
  value: string | number
  count?: number | string
  icon?: Component
  disabled?: boolean
}

export interface MeterSegment {
  value: number
  label?: string
  /** Any CSS colour. Defaults walk the chart palette. */
  color?: string
}

export interface TableColumn<Row = Record<string, any>> {
  key: string
  label: string
  align?: 'left' | 'center' | 'right'
  width?: string
  sortable?: boolean
  /** Right-aligned, tabular figures. */
  numeric?: boolean
  /* Method syntax on purpose: typed columns (TableColumn<Invoice>[]) stay assignable to RTable's
     columns prop, because method parameters are checked bivariantly. */
  /** Value used for sorting when it differs from what is shown. */
  sortValue?(row: Row): string | number | null | undefined
  /** Text for the cell when there is no `cell-{key}` slot. */
  format?(value: any, row: Row): string
}

export interface TableSort {
  key: string
  direction: 'asc' | 'desc'
}

export interface MenuItem {
  /** Stable id, handy in `select` handlers. */
  id?: string
  label?: string
  icon?: Component
  /** Shown right-aligned, e.g. "⌘C". */
  shortcut?: string
  /** Second line under the label. */
  description?: string
  danger?: boolean
  disabled?: boolean
  /** Opens a submenu (one level deep reads best). */
  children?: MenuItem[]
  /** Renders a separator instead of an item. */
  divider?: boolean
  /** Renders a small group label instead of an item. */
  heading?: boolean
  /** Makes it a checkable item and shows a check when true. */
  checked?: boolean
  /** Keep the menu open after selecting (useful for checkable items). */
  keepOpen?: boolean
  onSelect?: () => void
}

export interface CommandItem {
  id: string
  label: string
  icon?: Component
  /** Group heading the item sits under. */
  group?: string
  /** Extra words that should match, e.g. "dark" for "Toggle theme". */
  keywords?: string[]
  /** Keys shown on the right, e.g. ['mod', 'D']. */
  shortcut?: string[]
  /** Quiet text on the right, e.g. "2:51 PM". */
  meta?: string
  /** Opens a nested page with these items. */
  children?: CommandItem[]
  /** Placeholder for the nested page's input. */
  placeholder?: string
  disabled?: boolean
  /** Return `false` to keep the palette open. */
  onSelect?: () => void | boolean
}

export interface TourStep {
  /** CSS selector of the element to highlight. */
  target: string
  title: string
  body: string
  placement?: Placement
  mediaTone?: Tone
}

export interface ChartSeries {
  name: string
  values: (number | null)[]
  /** Any CSS colour; defaults to the chart palette in order. */
  color?: string
}

/* ── 0.2 additions ─────────────────────────────────────────────────────────────────── */

/** A row of a datasheet (RSpecList). */
export interface SpecItem {
  label: string
  value?: string | number
  /** Monospace value: ids, hashes, coordinates, amounts in a column. */
  mono?: boolean
  /** Quiet second line under the value. */
  hint?: string
  /** Shows a status lamp before the value. */
  tone?: StatusTone
}

/** An entry in RTimeline: audit logs, incident updates, mission events. */
export interface TimelineItem {
  id?: string | number
  /** Already formatted, e.g. "14:02:11" or "T+00:01:12". */
  time: string
  title: string
  body?: string
  /** Quiet text on the right, e.g. an actor or an id. */
  meta?: string
  tone?: StatusTone
  icon?: Component
}

export interface StepItem {
  label: string
  description?: string
  /** Overrides what RSteps derives from `current`. */
  status?: 'complete' | 'current' | 'upcoming' | 'error'
}

export interface BreadcrumbItem {
  label: string
  href?: string
  /** Passed to the `as` component (e.g. RouterLink) as its `to`. */
  to?: string | Record<string, unknown>
}

export interface RadioOption {
  label: string
  value: string | number
  description?: string
  disabled?: boolean
}

export interface SliderMark {
  value: number
  label?: string
}

export interface ToastOptions {
  title: string
  body?: string
  tone?: StatusTone
  /** ms; 0 keeps it until dismissed. Default 5000. */
  duration?: number
  action?: { label: string; onClick: () => void }
}

/* ── Chart data ────────────────────────────────────────────────────────────────────── */

/** A horizontal line across a chart: a target, a threshold or an average. Dashed. */
export interface ChartReference {
  value: number
  label?: string
  kind?: 'target' | 'threshold' | 'average'
  /** Which end of the line carries the label. Default `end`. */
  align?: 'start' | 'end'
}

/** One row of a bullet chart (Stephen Few): a measure against a target and qualitative bands. */
export interface BulletRow {
  label: string
  value: number
  target?: number
  /** Upper edges of the qualitative bands, ascending, e.g. [60, 85, 100]. The last is the max. */
  ranges?: number[]
  /** Optional comparison, e.g. last period, drawn as a thin bar inside the measure. */
  previous?: number
  sublabel?: string
  /** For costs, latency, usage against a cap: meeting the target means staying under it. */
  lowerIsBetter?: boolean
}

export interface CandlePoint {
  /** Category label for the x axis, e.g. "09:30" or "12 Nov". */
  t: string
  open: number
  high: number
  low: number
  close: number
  volume?: number
}

export interface WaterfallStep {
  label: string
  value: number
  /** `total` bars start at zero and show the running total at that point. */
  kind?: 'delta' | 'total'
}

export type StatusLevel = 'good' | 'warning' | 'serious' | 'critical'

/** A coloured band on a dial, e.g. the red line of a gauge. */
export interface DialZone {
  from: number
  to: number
  level: StatusLevel
}

export interface ScatterPoint {
  x: number
  y: number
  label?: string
  /** Shown in the tooltip and table. */
  id?: string
}

export interface ScatterSeries {
  name: string
  points: ScatterPoint[]
  color?: string
}

export interface GanttItem {
  start: number
  end: number
  label?: string
  /** brand (default), context (grey), signal, success, warning, danger. */
  tone?: 'brand' | 'context' | 'signal' | 'success' | 'warning' | 'danger'
  /** A point in time drawn as a diamond; `end` is ignored. */
  milestone?: boolean
  /** Hatched: planned, tentative or a maintenance window. */
  hatch?: boolean
}

export interface GanttRow {
  id: string | number
  label: string
  meta?: string
  items: GanttItem[]
}

/** A contact on a radar scope. Bearing in degrees clockwise from north, range in scope units. */
export interface RadarContact {
  id: string
  bearing: number
  range: number
  label?: string
  /** friendly = cobalt, unknown = amber, hostile = signal, neutral = grey. Always labelled. */
  kind?: 'friendly' | 'unknown' | 'hostile' | 'neutral'
  /** Heading in degrees; draws a short velocity leader. */
  heading?: number
}
