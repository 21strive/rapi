/*
 * Rapi — library entry.
 *
 *   import { RapiPlugin } from '@/design-system'
 *   app.use(RapiPlugin)            // registers every component globally
 *
 * or import components one by one:
 *
 *   import { RButton, RCard } from '@/design-system'
 *
 * Importing this file also brings in the font, the tokens and the base layer.
 */
import '@fontsource-variable/plus-jakarta-sans'
import './tokens/tokens.css'
import './tokens/base.css'

import type { App, Plugin } from 'vue'

import RAvatar from './components/RAvatar.vue'
import RAvatarGroup from './components/RAvatarGroup.vue'
import RBadge from './components/RBadge.vue'
import RButton from './components/RButton.vue'
import RCard from './components/RCard.vue'
import RCheckbox from './components/RCheckbox.vue'
import RChip from './components/RChip.vue'
import RCoachmark from './components/RCoachmark.vue'
import RCommandPalette from './components/RCommandPalette.vue'
import RDialog from './components/RDialog.vue'
import RIconButton from './components/RIconButton.vue'
import RInput from './components/RInput.vue'
import RKbd from './components/RKbd.vue'
import RMenu from './components/RMenu.vue'
import RMeter from './components/RMeter.vue'
import RNavItem from './components/RNavItem.vue'
import RPagination from './components/RPagination.vue'
import RPopover from './components/RPopover.vue'
import RSegmented from './components/RSegmented.vue'
import RSelect from './components/RSelect.vue'
import RStat from './components/RStat.vue'
import RSwitch from './components/RSwitch.vue'
import RTable from './components/RTable.vue'
import RTabs from './components/RTabs.vue'
import RTooltip from './components/RTooltip.vue'
import RTour from './components/RTour.vue'
import RTrend from './components/RTrend.vue'

import RBarList from './charts/RBarList.vue'
import RColumnChart from './charts/RColumnChart.vue'
import RDotMatrixChart from './charts/RDotMatrixChart.vue'
import RHeatmap from './charts/RHeatmap.vue'
import RLineChart from './charts/RLineChart.vue'
import RRadialGauge from './charts/RRadialGauge.vue'
import RRangeBars from './charts/RRangeBars.vue'
import RSparkline from './charts/RSparkline.vue'

export {
  RAvatar,
  RAvatarGroup,
  RBadge,
  RButton,
  RCard,
  RCheckbox,
  RChip,
  RCoachmark,
  RCommandPalette,
  RDialog,
  RIconButton,
  RInput,
  RKbd,
  RMenu,
  RMeter,
  RNavItem,
  RPagination,
  RPopover,
  RSegmented,
  RSelect,
  RStat,
  RSwitch,
  RTable,
  RTabs,
  RTooltip,
  RTour,
  RTrend,
  RBarList,
  RColumnChart,
  RDotMatrixChart,
  RHeatmap,
  RLineChart,
  RRadialGauge,
  RRangeBars,
  RSparkline,
}

export * from './composables/dom'
export * from './composables/floating'
export * from './composables/format'
export * from './composables/identity'
export * from './composables/theme'
export type * from './types'

const components = {
  RAvatar,
  RAvatarGroup,
  RBadge,
  RButton,
  RCard,
  RCheckbox,
  RChip,
  RCoachmark,
  RCommandPalette,
  RDialog,
  RIconButton,
  RInput,
  RKbd,
  RMenu,
  RMeter,
  RNavItem,
  RPagination,
  RPopover,
  RSegmented,
  RSelect,
  RStat,
  RSwitch,
  RTable,
  RTabs,
  RTooltip,
  RTour,
  RTrend,
  RBarList,
  RColumnChart,
  RDotMatrixChart,
  RHeatmap,
  RLineChart,
  RRadialGauge,
  RRangeBars,
  RSparkline,
}

/** `app.use(RapiPlugin)` registers every component under its R-name. */
export const RapiPlugin: Plugin = {
  install(app: App) {
    for (const [name, component] of Object.entries(components)) app.component(name, component)
  },
}

export default RapiPlugin

declare module 'vue' {
  export interface GlobalComponents {
    RAvatar: typeof RAvatar
    RAvatarGroup: typeof RAvatarGroup
    RBadge: typeof RBadge
    RButton: typeof RButton
    RCard: typeof RCard
    RCheckbox: typeof RCheckbox
    RChip: typeof RChip
    RCoachmark: typeof RCoachmark
    RCommandPalette: typeof RCommandPalette
    RDialog: typeof RDialog
    RIconButton: typeof RIconButton
    RInput: typeof RInput
    RKbd: typeof RKbd
    RMenu: typeof RMenu
    RMeter: typeof RMeter
    RNavItem: typeof RNavItem
    RPagination: typeof RPagination
    RPopover: typeof RPopover
    RSegmented: typeof RSegmented
    RSelect: typeof RSelect
    RStat: typeof RStat
    RSwitch: typeof RSwitch
    RTable: typeof RTable
    RTabs: typeof RTabs
    RTooltip: typeof RTooltip
    RTour: typeof RTour
    RTrend: typeof RTrend
    RBarList: typeof RBarList
    RColumnChart: typeof RColumnChart
    RDotMatrixChart: typeof RDotMatrixChart
    RHeatmap: typeof RHeatmap
    RLineChart: typeof RLineChart
    RRadialGauge: typeof RRadialGauge
    RRangeBars: typeof RRangeBars
    RSparkline: typeof RSparkline
  }
}
