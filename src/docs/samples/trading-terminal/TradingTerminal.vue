<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import {
  RButton,
  RCandlestickChart,
  RKbd,
  RReadout,
  RSegmented,
  RStatus,
  RTable,
  RTabs,
  RTrend,
  useToast,
  type TableColumn,
} from '@/design-system'
import SampleShell from '../_kit/SampleShell.vue'
import OrderBook from './parts/OrderBook.vue'
import OrderTicket from './parts/OrderTicket.vue'
import Panel from './parts/Panel.vue'
import Watchlist from './parts/Watchlist.vue'
import {
  type Level,
  type Order,
  type Position,
  type Timeframe,
  type Trade,
  LOT,
  book,
  buyingPower,
  candles,
  clock,
  clockStart,
  compact,
  composite,
  feeRate,
  dayStats,
  hhmmOf,
  idr,
  idrScale,
  initialTape,
  instruments,
  intraday,
  lotSize,
  lots,
  mulberry32,
  openOrders,
  pct,
  positions as positionSeed,
  price,
  sessionAt,
  seriesByTicker,
  signed,
  signedIdr,
  timeframes,
} from './data'

const { show } = useToast()

/* ── Selection ──────────────────────────────────────────────────────────────────────────── */
const ticker = ref('SGRD')
const tf = ref<Timeframe>('5m')
const instrument = computed(() => instruments.find((i) => i.ticker === ticker.value) ?? instruments[0])
const series = computed(() => seriesByTicker[ticker.value])

/** Bumped on every live update; the computeds below read it to re-derive from the series. */
const version = ref(0)

const bars = computed(() => {
  void version.value
  return candles(series.value, tf.value)
})
const stats = computed(() => {
  void version.value
  return dayStats(series.value)
})
const change = computed(() => stats.value.last - stats.value.prevClose)
const changePct = computed(() => (change.value / stats.value.prevClose) * 100)
const lastBar = computed(() => bars.value[bars.value.length - 1])
const tfLabel = computed(() => ({ '1m': '1 min', '5m': '5 min', '15m': '15 min', '1H': '1 hour', '1D': '1 day' })[tf.value])

const watchRows = computed(() => {
  void version.value
  return instruments.map((i) => {
    const s = seriesByTicker[i.ticker]
    const last = s.minutes[s.minutes.length - 1].close
    return { ticker: i.ticker, name: i.name, last, change: (last / s.prevClose - 1) * 100, spark: intraday(s) }
  })
})

/* ── Live market: the clock, the book and the tape ─────────────────────────────────────── */
const rand = mulberry32(20261103)
const startSecs = clockStart.h * 3600 + clockStart.m * 60 + clockStart.s
const simSecs = ref(startSecs)
const session = computed(() => sessionAt(Math.floor(simSecs.value / 60)))
const sessionLabel = computed(
  () => ({ 'session-1': 'Session 1 · live', break: 'Lunch break', 'session-2': 'Session 2 · live', closed: 'Closed' })[session.value],
)
const indexLevel = ref(composite.value)

const books = reactive<Record<string, { bids: Level[]; asks: Level[] }>>({})
const tapes = reactive<Record<string, Trade[]>>({})
let tradeSeq = 1000

function bookOf(t: string) {
  if (!books[t]) {
    const s = seriesByTicker[t]
    books[t] = book(s, s.minutes[s.minutes.length - 1].close, 10)
  }
  return books[t]
}
function tapeOf(t: string) {
  if (!tapes[t]) tapes[t] = initialTape(seriesByTicker[t])
  return tapes[t]
}
bookOf(ticker.value)
tapeOf(ticker.value)
watch(ticker, (t) => {
  bookOf(t)
  tapeOf(t)
})

function levelLots(liquidity: number) {
  return Math.round(liquidity * (0.15 + rand() * 0.6))
}

/** One print: hits the touch, consumes it when the size is large enough, and the book follows. */
function trade(t: string, record: boolean) {
  const s = seriesByTicker[t]
  const bk = bookOf(t)
  const tick = s.tick
  const anchor = s.instrument.last
  const bar = s.minutes[s.minutes.length - 1]
  // Lean against the drift, so the price stays near where the day has been trading.
  const pBuy = Math.min(0.7, Math.max(0.3, 0.52 - (bar.close / anchor - 1) * 9))
  const side: 'buy' | 'sell' = rand() < pBuy ? 'buy' : 'sell'
  const size = lotSize(rand, s.instrument.liquidity)
  const near = side === 'buy' ? bk.asks : bk.bids
  const far = side === 'buy' ? bk.bids : bk.asks
  const at = near[0].price
  near[0].lots -= size
  if (near[0].lots <= 0) {
    near.shift()
    const edge = near[near.length - 1]
    near.push({ price: edge.price + (side === 'buy' ? tick : -tick), lots: levelLots(s.instrument.liquidity), orders: 1 + Math.floor(rand() * 30) })
    // The other side steps up behind the print, so the spread stays one tick.
    const inside = side === 'buy' ? near[0].price - tick : near[0].price + tick
    if ((side === 'buy' && far[0].price < inside) || (side === 'sell' && far[0].price > inside)) {
      far.unshift({ price: inside, lots: levelLots(s.instrument.liquidity), orders: 1 + Math.floor(rand() * 20) })
      far.splice(10)
    }
  }
  // Resting orders come and go.
  for (let k = 0; k < 2; k++) {
    const sideLevels = rand() < 0.5 ? bk.bids : bk.asks
    const level = sideLevels[Math.floor(rand() * sideLevels.length)]
    level.lots = Math.max(5, Math.round(level.lots * (0.82 + rand() * 0.4)))
  }
  bar.close = at
  bar.high = Math.max(bar.high, at)
  bar.low = Math.min(bar.low, at)
  bar.volume += size
  if (record) {
    const tape = tapeOf(t)
    tape.unshift({ id: ++tradeSeq, time: clock(simSecs.value), price: at, lots: size, side })
    tape.splice(40)
  }
}

/** A new minute opens a new bar on every instrument. */
function rollMinute(minute: number) {
  for (const s of Object.values(seriesByTicker)) {
    const prev = s.minutes[s.minutes.length - 1]
    s.minutes.push({ t: hhmmOf(minute), day: prev.day, minute, open: prev.close, high: prev.close, low: prev.close, close: prev.close, volume: 0 })
  }
}

let timer = 0
function step() {
  const before = Math.floor(simSecs.value / 60)
  simSecs.value += 1
  const now = Math.floor(simSecs.value / 60)
  const open = session.value === 'session-1' || session.value === 'session-2'
  if (now !== before && open) rollMinute(now)
  if (open) {
    trade(ticker.value, true)
    if (rand() < 0.35) trade(ticker.value, true)
    const others = instruments.filter((i) => i.ticker !== ticker.value)
    trade(others[Math.floor(rand() * others.length)].ticker, false)
    indexLevel.value = Math.round((indexLevel.value + (rand() - 0.48) * 0.9) * 100) / 100
  }
  version.value++
}
onMounted(() => (timer = window.setInterval(step, 1000)))
onBeforeUnmount(() => clearInterval(timer))

const currentBook = computed(() => bookOf(ticker.value))
const tape = computed(() => tapeOf(ticker.value))
const indexChange = computed(() => (indexLevel.value / (composite.value / (1 + composite.change / 100)) - 1) * 100)

/* ── Ticket ─────────────────────────────────────────────────────────────────────────────── */
const side = ref<'buy' | 'sell'>('buy')
const limit = ref<string | number | null>(String(instrument.value.last))
const share = ref(20)
/** The opening size: 20% of buying power at the last price, fee included. */
const qty = ref<string | number | null>(
  String(Math.floor((buyingPower * share.value) / 100 / (instrument.value.last * LOT * (1 + feeRate.buy)))),
)
watch(ticker, () => {
  limit.value = String(stats.value.last)
})

function pick(at: number, pickedSide: 'buy' | 'sell') {
  side.value = pickedSide
  limit.value = String(at)
}

const portfolio = ref<Position[]>(positionSeed.map((p) => ({ ...p })))
const orders = ref<Order[]>(openOrders.map((o) => ({ ...o })))
const held = computed(() => portfolio.value.find((p) => p.ticker === ticker.value)?.lots ?? 0)
let orderSeq = 3

function placeOrder(order: { side: 'buy' | 'sell'; type: 'Limit' | 'Market'; price: number; lots: number }) {
  const bk = currentBook.value
  const marketable =
    order.type === 'Market' || (order.side === 'buy' ? order.price >= bk.asks[0].price : order.price <= bk.bids[0].price)
  const fill = order.type === 'Market' ? (order.side === 'buy' ? bk.asks[0].price : bk.bids[0].price) : order.price
  const time = clock(simSecs.value)
  const id = `ORD-${time.slice(0, 5).replace(':', '')}-${String(4700 + orderSeq++)}`
  orders.value.unshift({
    id,
    time,
    ticker: ticker.value,
    side: order.side,
    type: order.type,
    price: order.type === 'Market' ? null : order.price,
    lots: order.lots,
    filled: marketable ? order.lots : 0,
    status: marketable ? 'Filled' : 'Open',
  })
  if (marketable) {
    const pos = portfolio.value.find((p) => p.ticker === ticker.value)
    if (order.side === 'buy') {
      if (pos) {
        pos.avg = Math.round((pos.avg * pos.lots + fill * order.lots) / (pos.lots + order.lots))
        pos.lots += order.lots
      } else portfolio.value.push({ ticker: ticker.value, lots: order.lots, avg: fill })
    } else if (pos) {
      pos.lots -= order.lots
      if (pos.lots <= 0) portfolio.value = portfolio.value.filter((p) => p !== pos)
    }
  }
  blotterTab.value = 'orders'
  show({
    title: marketable ? 'Order filled' : 'Order placed',
    body: `${order.side === 'buy' ? 'Buy' : 'Sell'} ${lots(order.lots)} lots ${ticker.value} @ ${price(fill)} · ${id}`,
    tone: marketable ? 'success' : 'neutral',
  })
}

function withdraw(order: Order) {
  order.status = 'Withdrawn'
  show({ title: 'Order withdrawn', body: `${order.id} · ${order.side === 'buy' ? 'Buy' : 'Sell'} ${lots(order.lots - order.filled)} lots ${order.ticker}` })
}

/* ── Blotter ────────────────────────────────────────────────────────────────────────────── */
const blotterTab = ref<string | number>('positions')
const positionRows = computed(() => {
  void version.value
  return portfolio.value.map((p) => {
    const s = seriesByTicker[p.ticker]
    const last = s.minutes[s.minutes.length - 1].close
    const value = last * p.lots * LOT
    const pnl = (last - p.avg) * p.lots * LOT
    return { ...p, id: p.ticker, last, value, pnl, pnlPct: (last / p.avg - 1) * 100, day: (last / s.prevClose - 1) * 100 }
  })
})
const totals = computed(() => ({
  value: positionRows.value.reduce((sum, r) => sum + r.value, 0),
  pnl: positionRows.value.reduce((sum, r) => sum + r.pnl, 0),
}))
const openCount = computed(() => orders.value.filter((o) => o.status === 'Open' || o.status === 'Partial').length)

const positionColumns: TableColumn[] = [
  { key: 'ticker', label: 'Ticker' },
  { key: 'lots', label: 'Lots', numeric: true },
  { key: 'avg', label: 'Avg', numeric: true },
  { key: 'last', label: 'Last', numeric: true },
  { key: 'day', label: 'Day', numeric: true },
  { key: 'value', label: 'Market value', numeric: true },
  { key: 'pnl', label: 'Unrealised P&L', numeric: true },
  { key: 'pnlPct', label: 'P&L %', numeric: true },
]

const orderColumns: TableColumn[] = [
  { key: 'time', label: 'Time' },
  { key: 'id', label: 'Order' },
  { key: 'ticker', label: 'Ticker' },
  { key: 'side', label: 'Side' },
  { key: 'type', label: 'Type' },
  { key: 'price', label: 'Price', numeric: true },
  { key: 'lots', label: 'Lots', numeric: true },
  { key: 'filled', label: 'Filled', numeric: true },
  { key: 'status', label: 'Status' },
  { key: 'action', label: '', align: 'right' },
]

const tapeColumns: TableColumn[] = [
  { key: 'time', label: 'Time' },
  { key: 'price', label: 'Price', numeric: true },
  { key: 'lots', label: 'Lots', numeric: true },
  { key: 'side', label: 'Side', align: 'right' },
]

const ORDER_TONE = { Open: 'brand', Partial: 'warning', Filled: 'success', Withdrawn: 'neutral' } as const

/* ── Keyboard ───────────────────────────────────────────────────────────────────────────── */
function onKey(event: KeyboardEvent) {
  if (event.metaKey || event.ctrlKey || event.altKey) return
  const el = event.target as HTMLElement | null
  if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return
  const key = event.key.toLowerCase()
  if (key === 'b') side.value = 'buy'
  else if (key === 's') side.value = 'sell'
  else if (/^[1-5]$/.test(key)) tf.value = timeframes[Number(key) - 1].value
  else return
  event.preventDefault()
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <SampleShell product="Markets" padding="none">
    <h1 class="r-sr-only">Markets terminal</h1>
    <template #strip>
      <span class="s-tt-strip-ctx">/ BNX · Equities</span>
    </template>
    <template #meta>
      <span class="s-tt-strip-index">
        {{ composite.name }} <span class="s-tt-strip-value">{{ indexLevel.toFixed(2) }}</span>
        <span :class="indexChange < 0 ? 's-tt-loss' : 's-tt-gain'">{{ pct(indexChange) }}</span>
      </span>
      <span class="s-tt-strip-clock">{{ clock(simSecs) }} WIB</span>
      <RStatus
        :tone="session === 'session-1' || session === 'session-2' ? 'signal' : 'neutral'"
        :label="sessionLabel"
        size="sm"
        :pulse="session === 'session-1' || session === 'session-2'"
      />
    </template>

    <template #header>
      <div class="s-tt-instrument">
        <div class="s-tt-instrument__id">
          <p class="s-tt-instrument__ticker">{{ instrument.ticker }}</p>
          <p class="s-tt-instrument__name">{{ instrument.name }}</p>
          <p class="r-label">BNX · IDR · {{ instrument.sector }}</p>
        </div>
        <RReadout label="Last · IDR" :value="price(stats.last)" size="lg" ghost class="s-tt-instrument__last" />
        <div class="s-tt-instrument__change">
          <RTrend :value="Math.round(changePct * 100) / 100" :precision="2" />
          <span class="s-tt-instrument__abs" :class="change < 0 ? 's-tt-loss' : 's-tt-gain'">{{ signed(change) }}</span>
        </div>
      </div>
    </template>
    <template #actions>
      <dl class="s-tt-stats">
        <div><dt>Open</dt><dd>{{ price(stats.open) }}</dd></div>
        <div><dt>High</dt><dd>{{ price(stats.high) }}</dd></div>
        <div><dt>Low</dt><dd>{{ price(stats.low) }}</dd></div>
        <div><dt>Prev</dt><dd>{{ price(stats.prevClose) }}</dd></div>
        <div><dt>VWAP</dt><dd>{{ price(Math.round(stats.vwap)) }}</dd></div>
        <div><dt>Volume · lots</dt><dd>{{ compact(stats.volume) }}</dd></div>
        <div><dt>Value · IDR</dt><dd>{{ idrScale(stats.value) }}</dd></div>
        <div><dt>Mkt cap · IDR</dt><dd>{{ idrScale(stats.last * instrument.shares * 1e9) }}</dd></div>
      </dl>
    </template>

    <div class="s-tt">
      <!-- Left: watchlist and the tape -->
      <div class="s-tt__col s-tt__col--left">
        <Panel index="01" title="Watchlist" :meta="`${instruments.length} names`">
          <Watchlist :rows="watchRows" :selected="ticker" @select="(t) => (ticker = t)" />
        </Panel>
        <Panel index="02" title="Time and sales" :meta="instrument.ticker" class="s-tt__grow">
          <div class="s-tt-tape">
            <RTable
              :columns="tapeColumns"
              :rows="tape"
              density="compact"
              sticky-header
              max-height="100%"
              :caption="`Latest trades in ${instrument.ticker}`"
            >
              <template #cell-time="{ row }"><span class="s-tt-mono">{{ row.time }}</span></template>
              <template #cell-price="{ row }">
                <span :class="row.side === 'buy' ? 's-tt-up' : 's-tt-down'">{{ price(row.price) }}</span>
              </template>
              <template #cell-lots="{ row }">{{ lots(row.lots) }}</template>
              <template #cell-side="{ row }">
                <span class="s-tt-side" :class="row.side === 'buy' ? 's-tt-up' : 's-tt-down'">{{ row.side === 'buy' ? 'Buy' : 'Sell' }}</span>
              </template>
            </RTable>
          </div>
        </Panel>
      </div>

      <!-- Centre: chart and blotter -->
      <div class="s-tt__col s-tt__col--main">
        <Panel index="03" :title="`${instrument.ticker} · ${tfLabel}`">
          <template #actions>
            <span v-if="lastBar" class="s-tt-ohlc" aria-label="Open, high, low and close of the latest bar">
              <span><span class="r-label">O</span> {{ price(lastBar.open) }}</span>
              <span><span class="r-label">H</span> {{ price(lastBar.high) }}</span>
              <span><span class="r-label">L</span> {{ price(lastBar.low) }}</span>
              <span><span class="r-label">C</span> {{ price(lastBar.close) }}</span>
            </span>
            <RSegmented v-model="tf" :options="timeframes" size="sm" label="Timeframe" />
            <span class="s-tt-hint"><RKbd :keys="['1']" size="sm" />–<RKbd :keys="['5']" size="sm" /></span>
          </template>
          <div class="s-tt-chart">
            <RCandlestickChart
              :data="bars"
              :height="392"
              :references="tf === '1D' ? [] : [{ value: stats.prevClose, label: 'Prev close', kind: 'average' }]"
              :format="(v) => price(Math.round(v))"
              :label="`${instrument.name}, ${tfLabel} candles with volume, prices in IDR`"
            />
          </div>
        </Panel>

        <Panel index="04" title="Blotter" class="s-tt__grow">
          <template #actions>
            <span class="s-tt-pnl">
              <span class="r-label">Market value</span> {{ idr(totals.value) }}
              <span class="r-label">Unrealised</span>
              <span :class="totals.pnl < 0 ? 's-tt-loss' : 's-tt-gain'">{{ signedIdr(totals.pnl) }}</span>
            </span>
          </template>
          <RTabs
            v-model="blotterTab"
            size="sm"
            label="Blotter"
            :items="[
              { label: 'Positions', value: 'positions', count: positionRows.length },
              { label: 'Orders', value: 'orders', count: openCount },
            ]"
            class="s-tt-tabs"
          >
            <template #default="{ value }">
              <RTable
                v-if="value === 'positions'"
                :columns="positionColumns"
                :rows="positionRows"
                row-key="ticker"
                density="compact"
                caption="Positions with unrealised profit and loss"
                :selected="[ticker]"
                @row-click="(row) => (ticker = row.ticker)"
              >
                <template #cell-ticker="{ row }"><span class="s-tt-ticker">{{ row.ticker }}</span></template>
                <template #cell-lots="{ row }">{{ lots(row.lots) }}</template>
                <template #cell-avg="{ row }">{{ price(row.avg) }}</template>
                <template #cell-last="{ row }">{{ price(row.last) }}</template>
                <template #cell-day="{ row }">
                  <span :class="row.day < 0 ? 's-tt-loss' : 's-tt-gain'">{{ pct(row.day) }}</span>
                </template>
                <template #cell-value="{ row }">{{ idr(row.value) }}</template>
                <template #cell-pnl="{ row }">
                  <span :class="row.pnl < 0 ? 's-tt-loss' : 's-tt-gain'">{{ signedIdr(row.pnl) }}</span>
                </template>
                <template #cell-pnlPct="{ row }">
                  <span :class="row.pnl < 0 ? 's-tt-loss' : 's-tt-gain'">{{ pct(row.pnlPct) }}</span>
                </template>
              </RTable>
              <RTable
                v-else
                :columns="orderColumns"
                :rows="orders"
                density="compact"
                caption="Orders placed today"
              >
                <template #cell-time="{ row }"><span class="s-tt-mono">{{ row.time }}</span></template>
                <template #cell-id="{ row }"><span class="s-tt-mono s-tt-quiet">{{ row.id }}</span></template>
                <template #cell-ticker="{ row }"><span class="s-tt-ticker">{{ row.ticker }}</span></template>
                <template #cell-side="{ row }">
                  <span class="s-tt-side" :class="row.side === 'buy' ? 's-tt-up' : 's-tt-down'">{{ row.side === 'buy' ? 'Buy' : 'Sell' }}</span>
                </template>
                <template #cell-price="{ row }">{{ row.price == null ? 'MKT' : price(row.price) }}</template>
                <template #cell-lots="{ row }">{{ lots(row.lots) }}</template>
                <template #cell-filled="{ row }">{{ lots(row.filled) }}</template>
                <template #cell-status="{ row }">
                  <RStatus :tone="ORDER_TONE[row.status as Order['status']]" :label="row.status" size="sm" />
                </template>
                <template #cell-action="{ row }">
                  <RButton
                    v-if="row.status === 'Open' || row.status === 'Partial'"
                    size="xs"
                    variant="ghost"
                    @click.stop="withdraw(row as Order)"
                  >
                    Withdraw
                  </RButton>
                </template>
              </RTable>
            </template>
          </RTabs>
        </Panel>
      </div>

      <!-- Right: book and ticket -->
      <div class="s-tt__col s-tt__col--side">
        <Panel index="05" title="Order book" :meta="`${instrument.ticker} · 6 levels`">
          <OrderBook :bids="currentBook.bids" :asks="currentBook.asks" :depth="6" @pick="pick" />
        </Panel>
        <Panel index="06" title="Order ticket" :meta="side === 'buy' ? 'Buy side' : 'Sell side'" class="s-tt__grow">
          <OrderTicket
            v-model:side="side"
            v-model:price="limit"
            v-model:lots="qty"
            v-model:share="share"
            :ticker="instrument.ticker"
            :last="stats.last"
            :tick="series.tick"
            :buying-power="buyingPower"
            :held="held"
            @submit="placeOrder"
          />
        </Panel>
      </div>
    </div>
  </SampleShell>
</template>

<style scoped>
.s-tt-strip-ctx {
  color: var(--r-text-tertiary);
}
.s-tt-strip-index {
  display: inline-flex;
  gap: 8px;
}
.s-tt-strip-value,
.s-tt-strip-clock {
  color: var(--r-text);
  font-variant-numeric: tabular-nums;
}

.s-tt-up {
  color: var(--r-brand-text);
}
.s-tt-down {
  color: var(--r-signal-text);
}
.s-tt-gain {
  color: var(--r-success-text);
}
.s-tt-loss {
  color: var(--r-danger-text);
}

/* Header: the instrument and its day */
.s-tt-instrument {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 8px 24px;
}
.s-tt-instrument__id {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}
.s-tt-instrument__ticker {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-lg);
  font-weight: var(--r-weight-semibold);
  letter-spacing: 0.06em;
  line-height: 1.2;
}
.s-tt-instrument__name {
  font-size: var(--r-text-sm);
  font-weight: var(--r-weight-medium);
}
.s-tt-instrument__change {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  padding-bottom: 4px;
}
.s-tt-instrument__abs {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-sm);
  font-variant-numeric: tabular-nums;
}

.s-tt-stats {
  display: grid;
  grid-template-columns: repeat(8, auto);
  gap: 0;
}
.s-tt-stats > div {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 2px 14px;
  border-left: 1px solid var(--r-border-subtle);
}
.s-tt-stats dt {
  color: var(--r-text-tertiary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  white-space: nowrap;
}
.s-tt-stats dd {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-sm);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

/* Terminal grid: three columns of panels on rules */
.s-tt {
  display: grid;
  grid-template-columns: 272px minmax(0, 1fr) 312px;
  background: var(--r-bg-surface);
}
.s-tt__col {
  display: flex;
  flex-direction: column;
  min-width: 0;
  border-right: 1px solid var(--r-border);
}
.s-tt__col:last-child {
  border-right: 0;
}
.s-tt__col > * + * {
  border-top: 1px solid var(--r-border);
}
.s-tt__grow {
  flex: 1;
}

.s-tt-tape {
  position: relative;
  flex: 1;
  min-height: 300px;
}
.s-tt-tape > :deep(.r-table) {
  position: absolute;
  inset: 0;
}

.s-tt-mono {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
  font-variant-numeric: tabular-nums;
}
.s-tt-quiet {
  color: var(--r-text-tertiary);
}
.s-tt-side {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-weight: var(--r-weight-medium);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.s-tt-ticker {
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: 0.04em;
}

.s-tt-chart {
  padding: 8px 4px 4px 12px;
}

.s-tt-ohlc {
  display: inline-flex;
  gap: 10px;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
  font-variant-numeric: tabular-nums;
}
.s-tt-ohlc .r-label {
  margin-right: 2px;
}
.s-tt-hint {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  color: var(--r-text-tertiary);
}

.s-tt-pnl {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px 8px;
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
  font-variant-numeric: tabular-nums;
}
.s-tt-pnl .r-label + * {
  margin-right: 8px;
}

.s-tt-tabs :deep(.r-tabs__list) {
  padding: 0 12px;
}

@media (max-width: 1360px) {
  .s-tt-stats {
    grid-template-columns: repeat(4, auto);
    row-gap: 6px;
  }
}

@media (max-width: 1279px) {
  .s-tt {
    grid-template-columns: minmax(0, 1fr) 312px;
  }
  .s-tt__col--left {
    grid-column: 1 / -1;
    grid-row: 2;
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    border-top: 1px solid var(--r-border);
    border-right: 0;
  }
  .s-tt__col--left > * + * {
    border-top: 0;
    border-left: 1px solid var(--r-border);
  }
}

@media (max-width: 900px) {
  .s-tt {
    grid-template-columns: minmax(0, 1fr);
  }
  .s-tt__col {
    border-right: 0;
  }
  .s-tt__col--side {
    border-top: 1px solid var(--r-border);
  }
  .s-tt__col--main {
    order: 1;
  }
  .s-tt__col--side {
    order: 2;
  }
  .s-tt__col--left {
    order: 3;
    grid-row: auto;
    grid-template-columns: minmax(0, 1fr);
    border-top: 1px solid var(--r-border);
  }
  .s-tt__col--left > * + * {
    border-left: 0;
    border-top: 1px solid var(--r-border);
  }
  .s-tt-ohlc,
  .s-tt-hint {
    display: none;
  }
}

@media (max-width: 640px) {
  .s-tt-strip-ctx,
  .s-tt-strip-index {
    display: none;
  }
  .s-tt-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    width: 100%;
  }
  .s-tt-stats > div {
    padding-left: 10px;
  }
}
</style>
