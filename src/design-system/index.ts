/*
 * Rapi — library entry. The design language of 21 Strive.
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
import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import './tokens/tokens.css'
import './tokens/base.css'
import './charts/chart.css'

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
import RAlert from './components/RAlert.vue'
import RBreadcrumb from './components/RBreadcrumb.vue'
import RCodeBlock from './components/RCodeBlock.vue'
import REmpty from './components/REmpty.vue'
import RKnob from './components/RKnob.vue'
import RLogo from './components/RLogo.vue'
import RRadioGroup from './components/RRadioGroup.vue'
import RReadout from './components/RReadout.vue'
import RRule from './components/RRule.vue'
import RSlider from './components/RSlider.vue'
import RSpecList from './components/RSpecList.vue'
import RStatus from './components/RStatus.vue'
import RSteps from './components/RSteps.vue'
import RSupergraphic from './components/RSupergraphic.vue'
import RTextarea from './components/RTextarea.vue'
import RTimeline from './components/RTimeline.vue'
import RToaster from './components/RToaster.vue'
import RBulletChart from './charts/RBulletChart.vue'
import RCandlestickChart from './charts/RCandlestickChart.vue'
import RDial from './charts/RDial.vue'
import RGanttChart from './charts/RGanttChart.vue'
import RRadarScope from './charts/RRadarScope.vue'
import RScatterChart from './charts/RScatterChart.vue'
import RWaterfallChart from './charts/RWaterfallChart.vue'

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
  RAlert,
  RBreadcrumb,
  RCodeBlock,
  REmpty,
  RKnob,
  RLogo,
  RRadioGroup,
  RReadout,
  RRule,
  RSlider,
  RSpecList,
  RStatus,
  RSteps,
  RSupergraphic,
  RTextarea,
  RTimeline,
  RToaster,
  RBulletChart,
  RCandlestickChart,
  RDial,
  RGanttChart,
  RRadarScope,
  RScatterChart,
  RWaterfallChart,
}

export * from './composables/dom'
export * from './composables/floating'
export * from './composables/format'
export * from './composables/identity'
export * from './composables/theme'
export * from './composables/toast'
export * from './brand/marks'
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
  RAlert,
  RBreadcrumb,
  RCodeBlock,
  REmpty,
  RKnob,
  RLogo,
  RRadioGroup,
  RReadout,
  RRule,
  RSlider,
  RSpecList,
  RStatus,
  RSteps,
  RSupergraphic,
  RTextarea,
  RTimeline,
  RToaster,
  RBulletChart,
  RCandlestickChart,
  RDial,
  RGanttChart,
  RRadarScope,
  RScatterChart,
  RWaterfallChart,
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
    RAlert: typeof RAlert
    RBreadcrumb: typeof RBreadcrumb
    RCodeBlock: typeof RCodeBlock
    REmpty: typeof REmpty
    RKnob: typeof RKnob
    RLogo: typeof RLogo
    RRadioGroup: typeof RRadioGroup
    RReadout: typeof RReadout
    RRule: typeof RRule
    RSlider: typeof RSlider
    RSpecList: typeof RSpecList
    RStatus: typeof RStatus
    RSteps: typeof RSteps
    RSupergraphic: typeof RSupergraphic
    RTextarea: typeof RTextarea
    RTimeline: typeof RTimeline
    RToaster: typeof RToaster
    RBulletChart: typeof RBulletChart
    RCandlestickChart: typeof RCandlestickChart
    RDial: typeof RDial
    RGanttChart: typeof RGanttChart
    RRadarScope: typeof RRadarScope
    RScatterChart: typeof RScatterChart
    RWaterfallChart: typeof RWaterfallChart
  }
}
