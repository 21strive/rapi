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
  MessageSquare,
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
          { id: 'brand', title: 'Cobalt' },
          { id: 'signal', title: 'Signal' },
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
          { id: 'typeface', title: 'Typefaces' },
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
          { id: 'textarea', title: 'Textarea' },
          { id: 'select', title: 'Select' },
          { id: 'checkbox', title: 'Checkbox' },
          { id: 'radio-group', title: 'Radio group' },
          { id: 'switch', title: 'Switch' },
          { id: 'segmented', title: 'Segmented control' },
          { id: 'slider', title: 'Slider' },
          { id: 'knob', title: 'Knob' },
        ],
      },
      {
        title: 'Data display',
        path: '/components/data-display',
        icon: LayoutGrid,
        sections: [
          { id: 'card', title: 'Card' },
          { id: 'stat', title: 'Stat' },
          { id: 'readout', title: 'Readout' },
          { id: 'trend', title: 'Trend' },
          { id: 'badge', title: 'Badge' },
          { id: 'status', title: 'Status' },
          { id: 'avatar', title: 'Avatar' },
          { id: 'meter', title: 'Meter' },
          { id: 'table', title: 'Table' },
          { id: 'spec-list', title: 'Spec list' },
          { id: 'timeline', title: 'Timeline' },
          { id: 'code-block', title: 'Code block' },
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
          { id: 'breadcrumb', title: 'Breadcrumb' },
          { id: 'steps', title: 'Steps' },
          { id: 'pagination', title: 'Pagination' },
          { id: 'rule', title: 'Rule' },
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
      {
        title: 'Feedback',
        path: '/components/feedback',
        icon: MessageSquare,
        sections: [
          { id: 'alert', title: 'Alert' },
          { id: 'toast', title: 'Toast' },
          { id: 'empty', title: 'Empty state' },
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
          { id: 'method', title: 'How the charts work' },
          { id: 'line', title: 'Line' },
          { id: 'columns', title: 'Columns' },
          { id: 'bar-list', title: 'Bar list' },
          { id: 'bullet', title: 'Bullet' },
          { id: 'waterfall', title: 'Waterfall' },
          { id: 'candles', title: 'Candlestick' },
          { id: 'scatter', title: 'Scatter' },
          { id: 'heatmap', title: 'Heatmap' },
          { id: 'gantt', title: 'Gantt' },
          { id: 'dial', title: 'Dial' },
          { id: 'radar', title: 'Radar scope' },
          { id: 'range-bars', title: 'Range bars' },
          { id: 'radial-gauge', title: 'Tick ring' },
          { id: 'dot-matrix', title: 'Dot matrix' },
          { id: 'sparkline', title: 'Sparkline' },
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
