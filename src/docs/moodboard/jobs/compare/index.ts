/**
 * Chapter 05, compare: shape beats a paragraph. A hundred tiles from 26 patterns, from a pair of
 * columns in a 1x1 to a Gantt chart across four columns. The variants live with their patterns
 * (variants-small, variants-mid, variants-lib); this file only sets the order, so sizes, surfaces
 * and domains alternate down the chapter.
 */
import type { MoodEntry } from '../../types'
import { lib } from './variants-lib'
import { mid } from './variants-mid'
import { small } from './variants-small'

const byId = new Map([...small, ...mid, ...lib].map((e) => [e.id, e]))

const order = [
  'compare-cols-settled', 'compare-month-rain', 'compare-funnel-hiring', 'compare-year-dps',
  'compare-board-stores', 'compare-lines-ports', 'compare-pick-chargebacks', 'compare-div-transfer',
  'compare-bridge-heads', 'compare-then-kwh', 'compare-slope-broadband', 'compare-year-demand',
  'compare-sched-passes', 'compare-strip-courier', 'compare-then-qris', 'compare-lines-monitors',
  'compare-hist-latency', 'compare-waffle-ontime', 'compare-sched-patrols', 'compare-heat-gates',
  'compare-cols-admissions', 'compare-waffle-phish', 'compare-div-flows', 'compare-tally-sorties',
  'compare-then-riders', 'compare-board-shows', 'compare-bullet-revenue', 'compare-share-grid',
  'compare-scatter-stores', 'compare-month-clinic', 'compare-div-yield', 'compare-bullets-budget',
  'compare-sched-berths', 'compare-funnel-checkout', 'compare-pick-plays', 'compare-plan-power',
  'compare-board-hubs', 'compare-waffle-water', 'compare-rank-products', 'compare-candles-cpo',
  'compare-multi-dams', 'compare-bullet-budget', 'compare-month-orders', 'compare-range-temp',
  'compare-hist-trip', 'compare-bridge-energy', 'compare-slope-rice', 'compare-strip-rate',
  'compare-tally-plays', 'compare-then-fuel', 'compare-multi-lines', 'compare-rank-districts',
  'compare-cols-streams', 'compare-share-cloud', 'compare-waffle-desks', 'compare-range-commute',
  'compare-bullet-hydro', 'compare-share-grade', 'compare-multi-cpu', 'compare-bridge-cash',
  'compare-range-humid', 'compare-month-outage', 'compare-bullet-sales', 'compare-lines-latency',
  'compare-hist-age', 'compare-scatter-ports', 'compare-waffle-solar', 'compare-pick-peak',
  'compare-div-budget', 'compare-bullet-vax', 'compare-month-deploys', 'compare-scatter-credit',
  'compare-strip-pm25', 'compare-board-coops', 'compare-then-build', 'compare-heat-signins',
  'compare-pick-boardings', 'compare-share-pay', 'compare-plan-workers', 'compare-multi-stores',
  'compare-candles-usdidr', 'compare-then-wait', 'compare-funnel-alerts', 'compare-bullets-plants',
  'compare-slope-ontime', 'compare-heat-er', 'compare-lines-fx', 'compare-hist-basket',
  'compare-tally-ship', 'compare-pick-rain', 'compare-candles-brent', 'compare-bullets-quarter',
  'compare-slope-ready', 'compare-share-device', 'compare-strip-loud', 'compare-plan-sesi',
  'compare-slope-nim', 'compare-rank-paths', 'compare-year-rain', 'compare-funnel-account',
]

export const entries: MoodEntry[] = order.map((id) => {
  const entry = byId.get(id)
  if (!entry) throw new Error(`compare: no variant called ${id}`)
  return entry
})

if (import.meta.env.DEV && byId.size !== entries.length) {
  const placed = new Set(order)
  console.warn(`[moodboard] compare: not placed: ${[...byId.keys()].filter((id) => !placed.has(id)).join(', ')}`)
}
