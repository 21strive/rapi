<script setup lang="ts">
/**
 * State: what Ayu reads in a look. The four figures of the cash position, the 13-week forecast
 * with the draft the conversation is about drawn on it, and the cash wall: every account in rupiah
 * terms, the exceptions named, the moves already scheduled marked against them.
 */
import { computed } from 'vue'
import { RLineChart, RMeter, RStat, RStatus, type StatusTone } from '@/design-system'
import {
  bn,
  compact,
  dividend,
  forecastSeries,
  lowDraft,
  lowPlan,
  minimumBuffer,
  nowWeek,
  position,
  signedBn,
  sweep,
  troughWeek,
  wall,
  weekLabels,
} from '../data'
import type { TreasuryDesk } from '../script'

const props = defineProps<{ td: TreasuryDesk }>()
const s = props.td.state

const r1 = (v: number) => Math.round(v * 10) / 10
const dayOnly = (day: string) => day.replace(/^\w+ /, '')

/* ── Forecast ─────────────────────────────────────────────────────────────────────────── */

const series = computed(() => forecastSeries(s.dividend, s.dividendDay))
const chartLabel = computed(() => {
  const base = `Total cash by week in IDR billions: 13 weeks of actuals to W45 and a forecast to W51, against a minimum buffer of ${bn(minimumBuffer, 0)}`
  if (s.dividend === 'draft') return `${base}. A draft moves the ${dividend.bn} bn dividend from 2 Dec to ${s.dividendDay} Nov, which lowers W47 and W48 by ${dividend.bn}.`
  if (s.dividend === 'scheduled') return `${base}, with the ${dividend.bn} bn dividend scheduled for ${s.dividendDay} Nov.`
  return `${base}, with the dividend on 2 Dec.`
})

/** The lowest day, which weekly closes hide: the plan's, and the draft's when there is one. */
const low = computed(() => ({
  plan: s.dividend === 'scheduled' ? lowDraft : lowPlan,
  draft: s.dividend === 'draft' ? lowDraft : null,
}))

/* ── Cash wall ────────────────────────────────────────────────────────────────────────── */

/** Scheduled moves against each account: the next one, or how many. */
const moves = computed(() => {
  const list: Record<string, { text: string; day: string }[]> = {}
  const add = (id: string, text: string, day: string) => (list[id] ??= []).push({ text, day })
  for (const t of s.transfers) {
    if (t.reverted) continue
    const day = t.day.n === 3 ? 'today' : `${t.day.n} Nov`
    const digits = t.amount < 1e9 ? 3 : 1
    add(t.from, signedBn(-t.amount / 1e9, digits), day)
    add(t.to, signedBn(t.amount / 1e9, digits), day)
  }
  if (s.dividend === 'scheduled') add('ACC-01', signedBn(-dividend.bn), `${s.dividendDay} Nov`)
  if (s.sweep === 'approved') {
    add(sweep.from, `−${compact(sweep.amount, 'USD')}`, sweep.at)
    add(sweep.to, `+${compact(sweep.amount, 'USD')}`, sweep.at)
  }
  const out: Record<string, string> = {}
  for (const [id, items] of Object.entries(list)) {
    out[id] = items.length === 1 ? `${items[0].text} · ${items[0].day}` : `${items.length} moves`
  }
  return out
})

const rows = computed(() =>
  wall.map((a) => {
    let flag: { label: string; tone: StatusTone } | undefined = a.flag
    if (a.id === 'ACC-09') flag = s.sweep === 'pending' ? { label: 'Sweep', tone: 'brand' } : undefined
    return { ...a, flag, hint: moves.value[a.id] ?? a.native, moving: !!moves.value[a.id] }
  }),
)
const firstFx = wall.findIndex((a) => a.currency !== 'IDR')
</script>

<template>
  <div class="tn-state">
    <div class="tn-state__main">
      <div class="tn-kpis" role="group" aria-label="Cash position">
        <div class="tn-kpi">
          <RStat size="md" label="Total cash" :value="r1(position.total)" :decimals="1" unit="IDR bn" :trend="r1(position.totalChange)" trend-label="today" />
        </div>
        <div class="tn-kpi">
          <RStat size="md" label="Available" :value="r1(position.available)" :decimals="1" unit="IDR bn">
            <template #footer><span class="tn-kpi__note">Incl. {{ bn(position.undrawn) }} undrawn RCF</span></template>
          </RStat>
        </div>
        <div class="tn-kpi">
          <RStat size="md" label="Net flow · today" :value="signedBn(position.net)" unit="IDR bn">
            <template #footer>
              <span class="tn-kpi__flows"><span class="r-label">In</span> {{ bn(position.inflow) }} <span class="r-label">Out</span> {{ bn(position.outflow) }}</span>
            </template>
          </RStat>
        </div>
        <div class="tn-kpi">
          <RStat size="md" label="Coverage" :value="position.lcr" suffix="%">
            <template #footer>
              <div class="tn-kpi__meter">
                <RMeter
                  variant="segments"
                  :value="position.lcr"
                  :max="200"
                  :count="20"
                  :height="6"
                  :label="`Liquidity coverage ${position.lcr}% of a 200% scale, policy minimum ${position.lcrPolicy}%`"
                />
                <span class="tn-kpi__note">Minimum {{ position.lcrPolicy }}%</span>
              </div>
            </template>
          </RStat>
        </div>
      </div>

      <section class="tn-forecast" aria-labelledby="tn-forecast-title">
        <header class="tn-panel-head">
          <h3 id="tn-forecast-title" class="r-eyebrow">13-week liquidity</h3>
          <p class="tn-low">
            <span class="r-label">Lowest day</span>
            <span :class="{ 'is-was': !!low.draft }">{{ dayOnly(low.plan.day) }} {{ bn(low.plan.level) }}</span>
            <template v-if="low.draft">
              <span class="r-sr-only">, with the draft</span>
              <span class="tn-low__arrow" aria-hidden="true">→</span>
              <span class="tn-low__draft">{{ dayOnly(low.draft.day) }} {{ bn(low.draft.level) }}</span>
            </template>
            <span class="tn-low__margin">{{ signedBn((low.draft ?? low.plan).level - minimumBuffer) }} over buffer</span>
          </p>
        </header>
        <RLineChart
          :labels="weekLabels"
          :series="series"
          :forecast-from="nowWeek"
          :now="nowWeek"
          :highlight="troughWeek"
          :references="[{ value: minimumBuffer, label: `Buffer ${bn(minimumBuffer, 0)}`, kind: 'threshold' }]"
          :min="1400"
          :max="2200"
          :height="156"
          y-unit="IDR bn"
          legend
          :format="(v) => bn(v)"
          :axis-format="(v) => bn(v, 0)"
          :label="chartLabel"
        />
      </section>
    </div>

    <section class="tn-wall" aria-labelledby="tn-wall-title">
      <header class="tn-panel-head">
        <h3 id="tn-wall-title" class="r-eyebrow">Cash wall · {{ wall.length }} accounts</h3>
        <span class="tn-unit">IDR bn eq.</span>
      </header>
      <ul class="tn-wall__list">
        <li
          v-for="(a, i) in rows"
          :key="a.id"
          class="tn-wall__row"
          :class="{ 'is-selected': s.selected === a.id, 'is-first-fx': i === firstFx }"
        >
          <span class="tn-wall__name">
            {{ a.name }}<span class="r-sr-only">, ending</span><span class="tn-wall__num">{{ a.last4 }}</span>
          </span>
          <RStatus v-if="a.flag" :tone="a.flag.tone" :label="a.flag.label" size="sm" class="tn-wall__flag" />
          <span class="tn-wall__hint" :class="{ 'is-move': a.moving }">{{ a.hint }}</span>
          <span class="tn-wall__value">{{ bn(a.bn) }}</span>
        </li>
      </ul>
    </section>
  </div>
</template>

<style>
.tn-state {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  border: 1px solid var(--r-border);
  background: var(--r-bg-surface);
}

.tn-state__main {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

/* Four figures in ruled cells. */
.tn-kpis {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  border-bottom: 1px solid var(--r-border);
}

.tn-kpi {
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 10px 14px;
}

.tn-kpi + .tn-kpi {
  border-left: 1px solid var(--r-border-subtle);
}

.tn-kpi .r-stat {
  gap: 5px;
}

.tn-kpi .r-stat__footer {
  width: 100%;
  min-height: 18px;
}

.tn-kpi__note {
  overflow: hidden;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-2xs);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tn-kpi__flows {
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.tn-kpi__flows .r-label:not(:first-child) {
  margin-left: 6px;
}

.tn-kpi__meter {
  display: flex;
  flex-direction: column;
  gap: 3px;
  width: 100%;
}

.tn-kpi__meter .tn-kpi__note {
  font-size: var(--r-text-2xs);
}

.tn-forecast {
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 10px 14px 4px;
}

.tn-forecast .r-chart__legend {
  margin-bottom: 2px;
}

/* The lowest day, the figure a weekly chart cannot show, in the forecast's head. */
.tn-low {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: flex-end;
  gap: 2px 8px;
  min-width: 0;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.tn-low .is-was {
  color: var(--r-text-tertiary);
}

.tn-low__arrow {
  color: var(--r-text-tertiary);
}

/* The draft's figure carries its line's colour as a swatch underneath; the text stays ink. */
.tn-low__draft {
  padding-bottom: 1px;
  border-bottom: 2px solid var(--r-chart-3);
}

.tn-low__margin {
  color: var(--r-text-tertiary);
}

/* The cash wall: one ruled line per account, values aligned on the right. */
.tn-wall {
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 10px 14px 6px;
  border-top: 1px solid var(--r-border);
}

.tn-wall__list {
  margin: 0;
  padding: 0;
  list-style: none;
  border-top: 1px solid var(--r-border-subtle);
}

.tn-wall__row {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto 48px;
  align-items: center;
  gap: 8px;
  min-height: 22px;
  margin: 0 -14px;
  padding: 1px 14px;
  border-bottom: 1px solid var(--r-border-subtle);
  font-size: var(--r-text-sm);
  line-height: 1.4;
}

.tn-wall__row:last-child {
  border-bottom: 0;
}

.tn-wall__row.is-first-fx {
  border-top: 1px solid var(--r-border);
}

/* The account the conversation is about: the selection tint and rule. */
.tn-wall__row.is-selected {
  background: var(--r-bg-selected);
}

.tn-wall__row.is-selected::before {
  content: '';
  position: absolute;
  inset: 0 auto 0 0;
  width: 2px;
  background: var(--r-brand);
}

.tn-wall__name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tn-wall__num {
  margin-left: 6px;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.04em;
}

/* Fixed columns, so a row without a flag keeps its value under the others. */
.tn-wall__name {
  grid-column: 1;
}

.tn-wall__flag {
  grid-column: 2;
}

.tn-wall__hint {
  grid-column: 3;
}

.tn-wall__value {
  grid-column: 4;
}

.tn-wall__hint {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-variant-numeric: tabular-nums;
  text-align: right;
  white-space: nowrap;
}

.tn-wall__hint.is-move {
  color: var(--r-text);
}

.tn-wall__value {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-sm);
  font-variant-numeric: tabular-nums;
  text-align: right;
}

/* Wide: the forecast and the wall side by side, the wall in the same column as the record below. */
@container tn (min-width: 880px) {
  .tn-state {
    grid-template-columns: minmax(0, 1fr) var(--tn-side);
  }
  .tn-wall {
    border-top: 0;
    border-left: 1px solid var(--r-border);
  }
}

@container tn (max-width: 620px) {
  .tn-kpis {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .tn-kpi:nth-child(3) {
    border-left: 0;
  }
  .tn-kpi:nth-child(n + 3) {
    border-top: 1px solid var(--r-border-subtle);
  }
  .tn-panel-head {
    flex-wrap: wrap;
  }
  .tn-low {
    justify-content: flex-start;
  }
}
</style>
