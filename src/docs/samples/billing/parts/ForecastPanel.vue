<script setup lang="ts">
import { computed } from 'vue'
import { RCard, RLineChart, RRule, RSpecList, formatNumber } from '@/design-system'
import type { ChartReference, SpecItem } from '@/design-system'
import { type CycleSummary, org, usd } from '../data'

/** Where the cycle is heading: cumulative cost to the end of the month against the spend limit. */
const props = defineProps<{
  summary: CycleSummary
  closed: boolean
  dayName: (day: number) => string
}>()

const labels = computed(() => props.summary.rows.map((r) => r.label))
const values = computed(() => props.summary.rows.map((r) => r.totalCum))

const references = computed<ChartReference[]>(() => [
  { value: org.spendLimit, label: `Limit ${formatNumber(org.spendLimit)}`, kind: 'threshold' },
])

const top = computed(() => {
  const peak = Math.max(org.spendLimit, props.summary.end.totalCum)
  return Math.ceil((peak * 1.06) / 500) * 500
})

const title = computed(() => (props.closed ? `Cost in ${props.summary.spec.monthLong}` : `Cost to 30 ${props.summary.spec.month}`))

const subtitle = computed(() => {
  const s = props.summary
  if (props.closed) return `Closed at ${usd(s.end.totalCum)}, ${usd(org.spendLimit - s.end.totalCum, 0)} under the spend limit.`
  if (s.limitDay) return `Heading for ${usd(s.projected.total)}; passes the ${usd(org.spendLimit, 0)} spend limit on ${props.dayName(s.limitDay)}.`
  return `Heading for ${usd(s.projected.total)}, under the ${usd(org.spendLimit, 0)} spend limit.`
})

const chartLabel = computed(() =>
  props.closed
    ? `Cumulative cost in ${props.summary.spec.monthLong} ${props.summary.spec.year} by day, USD, against the spend limit`
    : `Cumulative cost this cycle by day, USD, measured to ${props.summary.now.label} and forecast to 30 ${props.summary.spec.month}, against the spend limit`,
)

const lines = computed<SpecItem[]>(() => {
  const b = props.summary.byLine
  return [
    { label: 'Platform fee', value: usd(b.fee), mono: true },
    { label: 'Requests', value: usd(b.requests), mono: true },
    { label: 'Storage', value: usd(b.storage), mono: true },
    { label: 'Build minutes', value: usd(b.build), mono: true },
    { label: 'Seats', value: usd(b.seats), mono: true },
    { label: 'Total', value: usd(props.summary.end.totalCum), mono: true },
  ]
})
</script>

<template>
  <RCard index="03" :eyebrow="closed ? 'Closed cycle' : 'Forecast'" :title="title" :subtitle="subtitle" meta="USD · before VAT" class="s-billing-forecast">
    <RLineChart
      :labels="labels"
      :series="[{ name: closed ? 'Cost' : 'Cost to date', values, area: true }]"
      :forecast-from="closed ? null : summary.nowIndex"
      :now="closed ? null : summary.nowIndex"
      :references="references"
      :min="0"
      :max="top"
      :y-ticks="5"
      :format="(v: number) => usd(v)"
      :axis-format="(v: number) => formatNumber(v)"
      y-unit="USD"
      :height="268"
      :legend="!closed"
      :label="chartLabel"
    />
    <RRule :label="closed ? 'By line' : 'By line at 30 Nov'" :meta="closed ? 'Invoiced' : 'Estimate'" />
    <RSpecList :items="lines" :columns="2" dense />
  </RCard>
</template>
