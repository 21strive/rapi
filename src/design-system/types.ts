import type { Component } from 'vue'
import type { Placement } from './composables/floating'

export type Size = 'sm' | 'md' | 'lg'

/** Every tone has a matching `.r-tone-*` class in base.css. */
export type Tone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'violet' | 'flame' | 'sky'

export type ButtonVariant = 'solid' | 'soft' | 'outline' | 'ghost'
export type ButtonTone = 'neutral' | 'brand' | 'danger' | 'success'

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
  /** Value used for sorting when it differs from what is shown. */
  sortValue?: (row: Row) => string | number | null | undefined
  /** Text for the cell when there is no `cell-{key}` slot. */
  format?: (value: any, row: Row) => string
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
