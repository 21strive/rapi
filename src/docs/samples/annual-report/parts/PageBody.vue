<script setup lang="ts">
import { computed } from 'vue'
import {
  RCard,
  RColumnChart,
  RLineChart,
  RLogo,
  RMeter,
  RSparkline,
  RStat,
  RSupergraphic,
  RTable,
  RWaterfallChart,
  formatNumber,
  formatPercent,
} from '@/design-system'
import type { TableColumn } from '@/design-system'
import {
  cashBridge,
  contents,
  glance,
  keyFigures,
  keyNotes,
  months,
  quarters,
  report,
  revenueBySegment,
  segments,
  volume2024,
  volume2025,
} from '../data'

defineProps<{ page: number }>()

const bn = (v: number) => formatNumber(v, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
const signedPct = (v: number) => formatPercent(v, { decimals: 1, signed: true }).replace('-', '−')

const total = segments.reduce((s, x) => s + x.rev, 0)
const totalPrev = segments.reduce((s, x) => s + x.prev, 0)
const grossProfit = segments.reduce((s, x) => s + (x.rev * x.margin) / 100, 0)

const shareSegments = segments.map((s) => ({ label: s.name, value: s.rev }))

const segmentColumns: TableColumn[] = [
  { key: 'name', label: 'Segment' },
  { key: 'rev', label: '2025', numeric: true },
  { key: 'prev', label: '2024', numeric: true },
  { key: 'change', label: 'Change', numeric: true },
  { key: 'share', label: 'Share', numeric: true },
  { key: 'gp', label: 'Gross profit', numeric: true },
  { key: 'margin', label: 'Margin', numeric: true },
]
const segmentRows = computed(() => [
  ...segments.map((s) => ({
    id: s.name,
    name: s.name,
    rev: bn(s.rev),
    prev: bn(s.prev),
    change: signedPct(((s.rev - s.prev) / s.prev) * 100),
    share: formatPercent((s.rev / total) * 100),
    gp: bn((s.rev * s.margin) / 100),
    margin: formatPercent(s.margin),
    total: false,
  })),
  {
    id: 'total',
    name: 'Total',
    rev: bn(total),
    prev: bn(totalPrev),
    change: signedPct(((total - totalPrev) / totalPrev) * 100),
    share: formatPercent(100),
    gp: bn(grossProfit),
    margin: formatPercent((grossProfit / total) * 100),
    total: true,
  },
])

const segmentNotes = [
  'Volume rose 64%. Fees per payment fell as larger customers moved to tiered pricing.',
  'The fastest grower. Most new revenue came from wallets for existing payment customers.',
  'Reminders in local time and a new walk-in queue. Monthly churn fell to 1.9%.',
  'Three engagements, all with customers of our products. Day rates unchanged since 2024.',
]

const volumeSeries = [
  { name: '2025', values: volume2025 },
  { name: '2024', values: volume2024, color: 'var(--r-chart-context)' },
]
</script>

<template>
  <!-- 01 · Cover -->
  <template v-if="page === 1">
    <RCard variant="brand" padding="lg" class="s-ar-cover">
      <div class="s-ar-cover__top">
        <RLogo brand="21strive" variant="lockup" :size="26" label="21 Strive" />
        <span class="s-ar-cover__kicker">Annual report · FY{{ report.year }}</span>
      </div>
      <h1 class="s-ar-cover__title">Annual<br />report {{ report.year }}</h1>
    </RCard>
    <div class="s-ar-cover__below">
      <p class="s-ar-cover__period">{{ report.period }}</p>
      <dl class="s-ar-cover__facts">
        <div><dt>Revenue</dt><dd>IDR 48.6 bn</dd></div>
        <div><dt>Payment volume</dt><dd>IDR 1.92 tn</dd></div>
        <div><dt>Availability</dt><dd>99.97%</dd></div>
      </dl>
      <p class="s-ar-cover__note">Specimen document set in Rapi 0.2. Every figure in it is illustrative. Published {{ report.published }}.</p>
    </div>
  </template>

  <!-- 02 · Contents and the year at a glance -->
  <template v-else-if="page === 2">
    <div class="s-ar-body">
      <p class="s-ar-kicker">Contents</p>
      <ol class="s-ar-toc">
        <li v-for="c in contents" :key="c.page">
          <span class="s-ar-toc__title">{{ c.title }}</span>
          <span class="s-ar-toc__page">{{ c.page }}</span>
        </li>
      </ol>
      <p class="s-ar-kicker s-ar-kicker--gap">2025 at a glance</p>
      <ol class="s-ar-glance">
        <li v-for="(g, i) in glance" :key="g">
          <span class="s-ar-glance__i">{{ String(i + 1).padStart(2, '0') }}</span>
          <span>{{ g }}</span>
        </li>
      </ol>
      <div class="s-ar-about">
        <p class="s-ar-kicker">About this report</p>
        <p>
          This report covers the work and results of 21 Strive for the fiscal year from 1 January to 31 December 2025. Amounts are
          in Indonesian rupiah. IDR bn means billions and IDR tn trillions; percentages compare with 2024 unless a note says
          otherwise.
        </p>
        <p>
          It is also a specimen: it shows how Rapi sets a financial document, with running heads, folios, figures with footnotes and
          charts with their sources. Every figure in it is illustrative.
        </p>
      </div>
    </div>
  </template>

  <!-- 03 · Letter -->
  <template v-else-if="page === 3">
    <div class="s-ar-body">
      <p class="s-ar-kicker">Letter from the founder</p>
      <h2 class="s-ar-h2">Fewer, sturdier things</h2>
      <p class="s-ar-lead">
        In 2025 we chose to do fewer things and to do them properly. Revenue grew 38% to IDR 48.6 billion, and the systems our
        customers rely on were up for all but about three hours of the year.
      </p>
      <div class="s-ar-letter">
        <p>
          The year began with a decision: no new products. We had three, each with customers who depended on it, and each with debts
          we had promised ourselves we would pay. We spent the first quarter on the ledger. Every balance in it is now the sum of its
          entries, every entry has a reason, and the nightly reconciliation with partner banks runs without anyone watching it.
        </p>
        <p>
          Payments carried IDR 1.92 trillion for our customers, 64% more than in 2024. Most of the growth came from businesses that
          were already with us and sent more of their volume our way. That is the kind of growth we want: it means the product did
          its job.
        </p>
        <p>
          Scheduling grew more slowly, by 25%. We moved reminders onto each customer’s own time zone, which sounds small and was
          not, and we rebuilt the queue that clinics and studios use when people walk in without a booking.
        </p>
        <p>
          We also wrote down how our products should look and behave. Rapi, our design language, now sets every screen we ship. It
          is deliberately plain: square corners, rules instead of shadows, one colour for the brand and one for what needs
          attention. Operators spend their days in these screens. They should be calm.
        </p>
        <p>
          We grew from 27 to 38 people, and four of the new colleagues work in operations, close to the exceptions our customers
          see. Gross margin rose 3.4 points to 61.2%, mostly because the ledger now needs less of our time to run.
        </p>
        <p>
          For 2026 the plan has the same shape: keep the systems up, make the common tasks faster, and say no more often than yes.
          Thank you to our customers for their patience and their reports, and to the team for the care they take with other
          people’s money.
        </p>
        <p class="s-ar-sign">
          <span>The founder, for everyone at 21 Strive</span>
          <span class="s-ar-sign__date">March 2026</span>
        </p>
      </div>
      <figure class="s-ar-quote">
        <RSupergraphic variant="construction" anchor="bottom-right" />
        <blockquote>“Operators spend their days in these screens. They should be calm.”</blockquote>
        <figcaption>From the letter · on Rapi, the design language</figcaption>
      </figure>
    </div>
  </template>

  <!-- 04 · Key figures -->
  <template v-else-if="page === 4">
    <div class="s-ar-body">
      <p class="s-ar-kicker">The year in figures</p>
      <h2 class="s-ar-h2">Eight numbers for 2025</h2>
      <div class="s-ar-figures r-grid-ruled">
        <div v-for="(f, i) in keyFigures" :key="f.label" class="s-ar-figure">
          <span class="s-ar-figure__i">{{ String(i + 1).padStart(2, '0') }}</span>
          <RStat
            :value="f.value"
            :decimals="f.decimals"
            :prefix="f.prefix"
            :suffix="f.suffix"
            :unit="f.unit"
            :trend="f.trend"
            :invert-trend="f.invert"
            :trend-label="f.trendText ?? 'vs 2024'"
            size="lg"
          >
            <template #label>{{ f.label }}<sup v-if="f.note" class="s-ar-sup">{{ f.note }}</sup></template>
          </RStat>
        </div>
      </div>
      <ol class="s-ar-notes">
        <li v-for="n in keyNotes" :key="n"><sup class="s-ar-sup">{{ n.slice(0, 1) }}</sup>{{ n.slice(2) }}</li>
      </ol>
    </div>
  </template>

  <!-- 05 · Financial review -->
  <template v-else-if="page === 5">
    <div class="s-ar-body">
      <p class="s-ar-kicker">Financial review</p>
      <h2 class="s-ar-h2">Growth from customers we already had</h2>
      <p class="s-ar-intro">
        Every quarter was larger than the one before. Payments led, the ledger grew fastest, and cash rose by IDR 5.0 bn after we
        paid for equipment and capitalised development.
      </p>
      <figure class="s-ar-fig">
        <figcaption class="s-ar-fig__title"><span>Fig. 1</span>Revenue by quarter and segment, IDR bn</figcaption>
        <RColumnChart
          :labels="quarters"
          :series="revenueBySegment"
          :height="164"
          y-unit="IDR bn"
          :format="bn"
          label="Revenue by quarter and segment in 2025, IDR billions: Q1 9.8, Q2 11.4, Q3 12.9, Q4 14.5"
        />
        <p class="s-ar-source">Source: management accounts, note 4. Quarters add up to the year: 9.8 + 11.4 + 12.9 + 14.5 = 48.6.</p>
      </figure>
      <figure class="s-ar-fig">
        <figcaption class="s-ar-fig__title"><span>Fig. 2</span>Cash, 1 January to 31 December 2025, IDR bn</figcaption>
        <RWaterfallChart :steps="cashBridge" :height="172" :format="bn" label="Cash bridge for 2025 in IDR billions, from 21.4 at opening to 26.4 at closing" />
        <p class="s-ar-source">Source: statement of cash flows, note 9. Development is capitalised software, amortised over three years.</p>
      </figure>
      <figure class="s-ar-fig">
        <figcaption class="s-ar-fig__title"><span>Fig. 3</span>Payment volume by month, IDR bn</figcaption>
        <RLineChart
          :labels="months"
          :series="volumeSeries"
          :height="150"
          :y-ticks="4"
          end-labels
          :format="(v: number) => formatNumber(v)"
          label="Payment volume by month in 2025 against 2024, IDR billions. 2025 totals 1,920; 2024 totals 1,171."
        />
        <p class="s-ar-source">Source: payment switch records. Volume is the value customers moved, not revenue. December includes year-end payroll.</p>
      </figure>
    </div>
  </template>

  <!-- 06 · Segments -->
  <template v-else-if="page === 6">
    <div class="s-ar-body">
      <p class="s-ar-kicker">Results by segment</p>
      <h2 class="s-ar-h2">Four segments, all growing</h2>
      <p class="s-ar-intro">
        Payments is the largest segment and the one with the thinnest margin, because partner bank fees sit inside its cost. The
        ledger earns the most per rupiah of revenue.
      </p>
      <div class="s-ar-share">
        <p class="s-ar-fig__title"><span>Fig. 4</span>Share of revenue, 2025</p>
        <RMeter :segments="shareSegments" :height="14" legend="list" :format="(v: number) => `IDR ${bn(v)} bn`" label="Share of 2025 revenue by segment" />
      </div>
      <p class="s-ar-fig__title s-ar-fig__title--table"><span>Table 1</span>Revenue and gross profit by segment, IDR bn</p>
      <RTable :columns="segmentColumns" :rows="segmentRows" density="compact" caption="Revenue and gross profit by segment, 2025 against 2024, IDR billions">
        <template #cell-name="{ row }">
          <span :class="{ 's-ar-total': row.total }">{{ row.name }}</span>
        </template>
        <template #cell-rev="{ row }">
          <span :class="{ 's-ar-total': row.total }">{{ row.rev }}</span>
        </template>
        <template #cell-gp="{ row }">
          <span :class="{ 's-ar-total': row.total }">{{ row.gp }}</span>
        </template>
      </RTable>
      <p class="s-ar-source">
        Segments as reviewed by management (PSAK 5). Gross profit is revenue less partner bank fees, hosting and the cost of staff who
        deliver services. Totals may differ from the sum of rows by rounding.
      </p>
      <div class="s-ar-segnotes">
        <div v-for="(seg, i) in segments" :key="seg.name" class="s-ar-segnote">
          <p class="s-ar-segnote__head">
            <span class="s-ar-segnote__swatch" :style="{ background: `var(--r-chart-${i + 1})` }" />
            <span>{{ seg.name }}</span>
            <span class="s-ar-segnote__q">{{ bn(revenueBySegment[i].values[0]) }} → {{ bn(revenueBySegment[i].values[3]) }}</span>
          </p>
          <RSparkline
            :values="revenueBySegment[i].values"
            :color="`var(--r-chart-${i + 1})`"
            :height="34"
            :label="`${seg.name} revenue by quarter, IDR bn: ${revenueBySegment[i].values.map(bn).join(', ')}`"
          />
          <p class="s-ar-segnote__text">{{ segmentNotes[i] }}</p>
        </div>
      </div>
      <div class="s-ar-outlook">
        <p class="s-ar-kicker">Outlook</p>
        <p>
          We expect revenue in 2026 to grow by between 25% and 30%, slower than in 2025 because we will add no new product. Gross margin
          should hold above 60%. The ledger and payments will move to a second region, so that one data centre can fail without
          customers noticing.
        </p>
      </div>
    </div>
  </template>
</template>

<style scoped>
/* ── The text block: 64px margins, below the running head ─────────────────── */
.s-ar-body {
  position: absolute;
  top: 92px;
  right: 64px;
  bottom: 72px;
  left: 64px;
  display: flex;
  flex-direction: column;
}
.s-ar-kicker {
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: 9.5px;
  font-weight: var(--r-weight-bold);
  letter-spacing: var(--r-tracking-caps);
  text-transform: uppercase;
}
.s-ar-kicker--gap {
  margin-top: 44px;
}
.s-ar-h2 {
  margin-top: 10px;
  font-size: 38px;
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-display);
  line-height: 1.04;
}
.s-ar-intro {
  max-width: 560px;
  margin-top: 14px;
  color: var(--r-text-secondary);
  font-size: 13px;
  line-height: 1.55;
}
.s-ar-sup {
  margin-left: 1px;
  color: var(--r-brand-text);
  font-family: var(--r-font-mono);
  font-size: 0.75em;
  font-weight: var(--r-weight-bold);
}

/* ── 01 Cover ─────────────────────────────────────────────────────────────── */
.s-ar-cover {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  height: 724px;
  justify-content: space-between;
  border: 0;
  padding: 56px 64px 60px;
}
.s-ar-cover__top {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.s-ar-cover__kicker {
  font-family: var(--r-font-mono);
  font-size: 10px;
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-caps);
  text-transform: uppercase;
}
.s-ar-cover__title {
  position: relative;
  z-index: 1;
  font-size: 104px;
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-display);
  line-height: 0.94;
}
.s-ar-cover__below {
  position: absolute;
  top: 724px;
  right: 64px;
  bottom: 48px;
  left: 64px;
  display: flex;
  flex-direction: column;
  padding-top: 36px;
}
.s-ar-cover__period {
  font-size: 18px;
  letter-spacing: -0.01em;
}
.s-ar-cover__facts {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin: 36px 0 0;
  border-top: 1px solid var(--r-border);
}
.s-ar-cover__facts div {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px 16px 0 0;
}
.s-ar-cover__facts div + div {
  padding-left: 16px;
  border-left: 1px solid var(--r-border);
}
.s-ar-cover__facts dt {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: 9px;
  letter-spacing: var(--r-tracking-caps);
  text-transform: uppercase;
}
.s-ar-cover__facts dd {
  margin: 0;
  font-size: 24px;
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-tight);
}
.s-ar-cover__note {
  margin-top: auto;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: 9px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

/* ── 02 Contents ──────────────────────────────────────────────────────────── */
.s-ar-toc {
  margin-top: 16px;
  border-top: 1px solid var(--r-text);
}
.s-ar-toc li {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid var(--r-border);
}
.s-ar-toc__title {
  font-size: 20px;
  letter-spacing: -0.015em;
}
.s-ar-toc__page {
  font-family: var(--r-font-mono);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}
.s-ar-glance {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px 32px;
  margin-top: 16px;
}
.s-ar-glance li {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid var(--r-border);
  font-size: 23px;
  line-height: 1.25;
  letter-spacing: -0.02em;
}
.s-ar-glance__i {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: 9.5px;
}
.s-ar-about {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 32px;
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid var(--r-border);
  color: var(--r-text-secondary);
  font-size: 11px;
  line-height: 1.55;
}
.s-ar-about .s-ar-kicker {
  grid-column: 1 / -1;
}

/* ── 03 Letter ────────────────────────────────────────────────────────────── */
.s-ar-lead {
  margin-top: 18px;
  font-size: 19px;
  line-height: 1.4;
  letter-spacing: -0.012em;
}
.s-ar-letter {
  margin-top: 28px;
  padding-top: 20px;
  border-top: 1px solid var(--r-border);
  column-count: 2;
  column-gap: 36px;
  column-rule: 1px solid var(--r-border-subtle);
  font-size: 12.5px;
  line-height: 1.62;
}
.s-ar-quote {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 14px;
  height: 236px;
  margin: auto 0 0;
  padding: 24px 28px 22px;
  overflow: hidden;
  border: 1px solid var(--r-border);
  isolation: isolate;
}
.s-ar-quote blockquote {
  position: relative;
  max-width: 520px;
  margin: 0;
  font-size: 28px;
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-tight);
  line-height: 1.15;
}
.s-ar-quote figcaption {
  position: relative;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: 9px;
  letter-spacing: var(--r-tracking-caps);
  text-transform: uppercase;
}
.s-ar-letter p + p {
  margin-top: 10px;
}
.s-ar-sign {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-top: 10px;
  break-inside: avoid;
  font-weight: var(--r-weight-semibold);
}
.s-ar-sign__date {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: 9.5px;
  font-weight: var(--r-weight-medium);
  letter-spacing: var(--r-tracking-caps);
  text-transform: uppercase;
}

/* ── 04 Figures ───────────────────────────────────────────────────────────── */
.s-ar-figures {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-top: 28px;
}
.s-ar-figure {
  position: relative;
  min-height: 178px;
  padding: 22px 20px 18px;
}
.s-ar-figure__i {
  position: absolute;
  top: 10px;
  right: 12px;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: 9px;
}
.s-ar-notes {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid var(--r-border);
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: 8.5px;
  line-height: 1.5;
}
.s-ar-notes .s-ar-sup {
  margin-right: 6px;
}

/* ── 05 Charts ────────────────────────────────────────────────────────────── */
.s-ar-fig {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 18px 0 0;
}
.s-ar-fig__title {
  display: flex;
  gap: 10px;
  font-size: 12px;
  font-weight: var(--r-weight-semibold);
  letter-spacing: -0.005em;
}
.s-ar-fig__title span {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: 9.5px;
  font-weight: var(--r-weight-medium);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.s-ar-fig__title--table {
  margin: 22px 0 8px;
}
.s-ar-source {
  margin-top: 6px;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: 8.5px;
  line-height: 1.5;
}

/* ── 06 Segments ──────────────────────────────────────────────────────────── */
.s-ar-share {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 22px;
}
.s-ar-total {
  font-weight: var(--r-weight-bold);
}
.s-ar-segnotes {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin-top: 24px;
  border-top: 1px solid var(--r-text);
}
.s-ar-segnote {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 14px 0 0;
}
.s-ar-segnote + .s-ar-segnote {
  padding-left: 14px;
  border-left: 1px solid var(--r-border);
}
.s-ar-segnote__head {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: var(--r-weight-semibold);
}
.s-ar-segnote__swatch {
  width: 8px;
  height: 8px;
}
.s-ar-segnote__q {
  margin-left: auto;
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: 8.5px;
  font-weight: var(--r-weight-medium);
  font-variant-numeric: tabular-nums;
}
.s-ar-segnote__text {
  color: var(--r-text-secondary);
  font-size: 10.5px;
  line-height: 1.5;
}
.s-ar-outlook {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: auto;
  padding-top: 14px;
  border-top: 1px solid var(--r-border);
  font-size: 12px;
  line-height: 1.6;
}
</style>
