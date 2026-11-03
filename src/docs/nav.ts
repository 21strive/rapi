import type { Component } from 'vue'
import {
  BookOpen,
  CalendarDays,
  ChartColumn,
  FolderKanban,
  Gauge,
  Hexagon,
  Layers,
  LayoutGrid,
  LayoutTemplate,
  Link,
  MousePointerClick,
  PanelLeft,
  Palette,
  Ruler,
  SlidersHorizontal,
  Type,
} from 'lucide-vue-next'

export interface DocSectionRef {
  id: string
  title: string
}

export interface DocLink {
  title: string
  path: string
  icon: Component
  /** Sections the command palette can jump to. Ids match the DocSection ids on the page. */
  sections?: DocSectionRef[]
  /** Example screens open full-bleed, outside the docs shell. */
  bare?: boolean
}

export interface DocGroup {
  title?: string
  links: DocLink[]
}

export const navGroups: DocGroup[] = [
  {
    links: [{ title: 'Introduction', path: '/', icon: BookOpen }],
  },
  {
    title: 'Foundations',
    links: [
      {
        title: 'Colour',
        path: '/foundations/colour',
        icon: Palette,
        sections: [
          { id: 'neutrals', title: 'Neutrals' },
          { id: 'brand', title: 'Brand' },
          { id: 'status', title: 'Status' },
          { id: 'data', title: 'Data' },
          { id: 'identity', title: 'Identity colours' },
          { id: 'semantic', title: 'Semantic tokens' },
        ],
      },
      {
        title: 'Typography',
        path: '/foundations/typography',
        icon: Type,
        sections: [
          { id: 'typeface', title: 'Typeface' },
          { id: 'scale', title: 'Type scale' },
          { id: 'numbers', title: 'Numbers' },
        ],
      },
      {
        title: 'Shape, space & motion',
        path: '/foundations/layout',
        icon: Ruler,
        sections: [
          { id: 'shape', title: 'Shape' },
          { id: 'rules', title: 'Rules & grids' },
          { id: 'spacing', title: 'Spacing' },
          { id: 'elevation', title: 'Elevation' },
          { id: 'motion', title: 'Motion' },
          { id: 'layers', title: 'Layers' },
        ],
      },
      {
        title: 'Brand',
        path: '/foundations/brand',
        icon: Hexagon,
        sections: [
          { id: 'logo', title: 'Logo' },
          { id: 'construction', title: 'Construction' },
          { id: 'supergraphic', title: 'Supergraphic' },
          { id: 'misuse', title: 'Misuse' },
        ],
      },
    ],
  },
  {
    title: 'Components',
    links: [
      {
        title: 'Actions',
        path: '/components/actions',
        icon: MousePointerClick,
        sections: [
          { id: 'button', title: 'Button' },
          { id: 'icon-button', title: 'Icon button' },
          { id: 'chip', title: 'Chip' },
        ],
      },
      {
        title: 'Forms',
        path: '/components/forms',
        icon: SlidersHorizontal,
        sections: [
          { id: 'input', title: 'Input' },
          { id: 'select', title: 'Select' },
          { id: 'checkbox', title: 'Checkbox' },
          { id: 'switch', title: 'Switch' },
          { id: 'segmented', title: 'Segmented control' },
        ],
      },
      {
        title: 'Data display',
        path: '/components/data-display',
        icon: LayoutGrid,
        sections: [
          { id: 'card', title: 'Card' },
          { id: 'stat', title: 'Stat' },
          { id: 'trend', title: 'Trend' },
          { id: 'badge', title: 'Badge' },
          { id: 'avatar', title: 'Avatar' },
          { id: 'meter', title: 'Meter' },
          { id: 'table', title: 'Table' },
          { id: 'kbd', title: 'Keyboard key' },
        ],
      },
      {
        title: 'Navigation',
        path: '/components/navigation',
        icon: PanelLeft,
        sections: [
          { id: 'nav-item', title: 'Nav item' },
          { id: 'tabs', title: 'Tabs' },
          { id: 'pagination', title: 'Pagination' },
        ],
      },
      {
        title: 'Overlays',
        path: '/components/overlays',
        icon: Layers,
        sections: [
          { id: 'popover', title: 'Popover' },
          { id: 'menu', title: 'Menu' },
          { id: 'tooltip', title: 'Tooltip' },
          { id: 'dialog', title: 'Dialog' },
          { id: 'command-palette', title: 'Command palette' },
          { id: 'coachmark', title: 'Coachmark' },
          { id: 'tour', title: 'Tour' },
        ],
      },
    ],
  },
  {
    title: 'Data',
    links: [
      {
        title: 'Charts',
        path: '/charts',
        icon: ChartColumn,
        sections: [
          { id: 'dot-matrix', title: 'Dot matrix' },
          { id: 'line', title: 'Line' },
          { id: 'sparkline', title: 'Sparkline' },
          { id: 'radial-gauge', title: 'Radial gauge' },
          { id: 'heatmap', title: 'Heatmap' },
          { id: 'range-bars', title: 'Range bars' },
          { id: 'bar-list', title: 'Bar list' },
          { id: 'column', title: 'Columns' },
        ],
      },
    ],
  },
  {
    title: 'Samples',
    links: [
      { title: 'Gallery', path: '/samples', icon: LayoutTemplate },
      { title: 'Sales overview', path: '/examples/sales', icon: Gauge, bare: true },
      { title: 'Projects', path: '/examples/projects', icon: FolderKanban, bare: true },
      { title: 'Weekly schedule', path: '/examples/schedule', icon: CalendarDays, bare: true },
    ],
  },
  {
    links: [{ title: 'References', path: '/references', icon: Link }],
  },
]

export const allLinks = navGroups.flatMap((group) => group.links.map((link) => ({ ...link, group: group.title })))
