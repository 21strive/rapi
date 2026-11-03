<script setup lang="ts">
/**
 * Sample 32 · Booking operations. Sesi, the 21 Strive booking platform, open on one venue's day:
 * the schedule by room or staff, the walk-in queue, capacity by hour and the money.
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { Plus } from 'lucide-vue-next'
import {
  RBadge,
  RBarList,
  RButton,
  RCard,
  RHeatmap,
  RMeter,
  RSegmented,
  RSparkline,
  RSpecList,
  RStat,
  RStatus,
  RTrend,
  useToast,
} from '@/design-system'
import SampleShell from '../_kit/SampleShell.vue'
import ScheduleCard from './parts/ScheduleCard.vue'
import WalkInQueue from './parts/WalkInQueue.vue'
import BookingDrawer from './parts/BookingDrawer.vue'
import NewBookingDialog from './parts/NewBookingDialog.vue'
import {
  HEAT_COLS,
  HEAT_ROWS,
  HEAT_VALUES,
  START_SECONDS,
  TODAY,
  TRENDS,
  WEEK,
  clock,
  clockSeconds,
  createBlocks,
  createBookings,
  createWalkIns,
  upcomingSlots,
  roomById,
  rupiah,
  serviceById,
  staffById,
  summarize,
  valueOf,
  type Booking,
  type DrawerTarget,
  type NewBooking,
  type ScheduleTarget,
  type ServiceId,
  type Slot,
  type StaffId,
} from './data'

const toast = useToast()

/* ── State ─────────────────────────────────────────────────────────────── */
const bookings = ref<Booking[]>(createBookings())
const walkIns = ref(createWalkIns())
const blocks = createBlocks()

const view = ref<'day' | 'week'>('day')
const viewOptions = [
  { label: 'Day', value: 'day' },
  { label: 'Week', value: 'week' },
]

/* The clock starts at 14:20:07 WIB and runs in real time. */
const elapsed = ref(0)
let timer = 0
onMounted(() => {
  const started = Date.now()
  timer = window.setInterval(() => (elapsed.value = (Date.now() - started) / 1000), 1000)
})
onBeforeUnmount(() => clearInterval(timer))
const nowSeconds = computed(() => START_SECONDS + elapsed.value)
const now = computed(() => nowSeconds.value / 60)

/* ── Figures ───────────────────────────────────────────────────────────── */
const days = computed(() => (view.value === 'day' ? [TODAY] : WEEK.map((_, i) => i)))
const summary = computed(() => summarize(bookings.value, walkIns.value, blocks, days.value))
const trend = computed(() => TRENDS[view.value])
const noShowRate = computed(() => (summary.value.appointments ? (summary.value.noShows / summary.value.appointments) * 100 : 0))
const pct = (v: number) => `${v.toLocaleString('en-US', { maximumFractionDigits: 1 })}%`

const todayWalkIns = computed(() => walkIns.value.filter((w) => w.day === TODAY))

const money = computed(() => {
  const s = summary.value
  const served = s.appointments - s.noShows + s.seats + walkIns.value.filter((w) => days.value.includes(w.day) && w.state !== 'waiting').length
  return [
    { label: 'Collected', value: rupiah(s.collected), mono: true },
    { label: 'Still to collect', value: rupiah(s.revenue - s.collected), mono: true },
    { label: 'Average a booking', value: rupiah(served ? s.revenue / served : 0), mono: true },
  ]
})

/* ── Drawer ────────────────────────────────────────────────────────────── */
const selected = ref<ScheduleTarget | null>(null)
const drawerOpen = ref(false)

const target = computed<DrawerTarget | null>(() => {
  const s = selected.value
  if (!s) return null
  if (s.kind === 'booking') {
    const booking = bookings.value.find((b) => b.id === s.id)
    return booking ? { kind: 'booking', booking } : null
  }
  const walkIn = walkIns.value.find((w) => w.ticket === s.ticket)
  return walkIn ? { kind: 'walkin', walkIn } : null
})

const selectedBooking = computed(() => (target.value?.kind === 'booking' ? target.value.booking : null))

function openTarget(t: ScheduleTarget) {
  selected.value = t
  drawerOpen.value = true
}

/* Free slots to move the open booking to: later today, or on the following days. */
const moveSlots = computed<Slot[]>(() => {
  const b = selectedBooking.value
  if (!b || b.seats || b.day < TODAY) return []
  return upcomingSlots({
    bookings: bookings.value,
    walkIns: walkIns.value,
    blocks,
    fromDay: b.day,
    now: now.value,
    serviceId: b.serviceId,
    staffId: b.staffId,
    ignoreId: b.id,
  })
})

const who = (b: Booking) => b.customer?.name ?? serviceById(b.serviceId).name

function checkIn() {
  const b = selectedBooking.value
  if (!b) return
  b.status = 'checked-in'
  drawerOpen.value = false
  toast.show({ title: `Checked in · ${who(b)}`, body: `${roomById(b.roomId).name} with ${staffById(b.staffId).name}`, tone: 'success' })
}

function checkOut() {
  const b = selectedBooking.value
  if (!b) return
  const due = b.payment.state === 'paid' ? 0 : valueOf(b) - (b.payment.state === 'deposit' ? (b.payment.deposit ?? 0) : 0)
  b.status = 'completed'
  b.payment.state = 'paid'
  drawerOpen.value = false
  toast.show({
    title: `Checked out · ${who(b)}`,
    body: due ? `${rupiah(due)} settled at the desk` : `Paid in advance by ${b.payment.method.toLowerCase()}`,
    tone: 'success',
  })
}

function markNoShow() {
  const b = selectedBooking.value
  if (!b) return
  b.status = 'no-show'
  drawerOpen.value = false
  toast.show({
    title: `No-show · ${who(b)}`,
    body: b.payment.state === 'unpaid' ? 'No deposit to keep. The slot is free again.' : 'The deposit is kept. The slot is free again.',
    tone: 'warning',
  })
}

function reschedule(slot: Slot) {
  const b = selectedBooking.value
  if (!b) return
  b.day = slot.day
  b.start = slot.start
  b.end = slot.end
  b.roomId = slot.roomId
  if (b.status === 'late' || b.status === 'no-show') b.status = 'booked'
  drawerOpen.value = false
  toast.show({
    title: `Moved · ${who(b)}`,
    body: `${WEEK[b.day].long}, ${clock(slot.start)}–${clock(slot.end)} WIB in ${roomById(slot.roomId).name}`,
    tone: 'brand',
  })
}

function sendReceipt() {
  const t = target.value
  drawerOpen.value = false
  const phone = t?.kind === 'booking' ? t.booking.customer?.phone : t?.walkIn.phone
  toast.show({ title: 'Receipt sent', body: phone ? `By message to ${phone}` : undefined })
}

function messageAttendees() {
  const b = selectedBooking.value
  drawerOpen.value = false
  toast.show({ title: 'Message sent', body: `To ${b?.seats?.booked ?? 0} attendees of ${b ? serviceById(b.serviceId).name.toLowerCase() : 'the class'}` })
}

/* ── Walk-ins ──────────────────────────────────────────────────────────── */
function callNext() {
  const t = now.value
  const current = walkIns.value.find((w) => w.day === TODAY && w.state === 'serving')
  const next = walkIns.value.filter((w) => w.day === TODAY && w.state === 'waiting').sort((a, b) => a.arrivedAt - b.arrivedAt)[0]
  if (!next) return
  let staffId: StaffId = 'clara'
  if (current) {
    current.state = 'done'
    current.end = Math.max((current.start ?? t) + 1, t)
    staffId = current.staffId ?? 'clara'
  }
  next.state = 'serving'
  next.start = t
  next.end = t + serviceById(next.serviceId).minutes
  next.roomId = 'ex'
  next.staffId = staffId
  toast.show({ title: `${next.ticket} · ${next.name} called`, body: `Express bay with ${staffById(staffId).name}`, tone: 'signal' })
}

/* ── New booking ───────────────────────────────────────────────────────── */
const newOpen = ref(false)

const slotsFor = (serviceId: ServiceId, staffId: StaffId) =>
  upcomingSlots({ bookings: bookings.value, walkIns: walkIns.value, blocks, fromDay: TODAY, now: now.value, serviceId, staffId })

function createBooking(input: NewBooking) {
  const sameDay = bookings.value.filter((b) => b.day === input.slot.day)
  const last = Math.max(0, ...sameDay.map((b) => Number(b.id.slice(-4))))
  const booking: Booking = {
    id: `SSI-11${WEEK[input.slot.day].date}-${String(last + 7).padStart(4, '0')}`,
    day: input.slot.day,
    start: input.slot.start,
    end: input.slot.end,
    roomId: input.slot.roomId,
    staffId: input.staffId,
    serviceId: input.serviceId,
    status: 'booked',
    customer: { name: input.name, phone: input.phone || '—', visits: 1, since: 'Nov 2026', note: 'Booked at the desk' },
    payment: { method: input.method, state: input.method === 'Pay at venue' ? 'unpaid' : 'paid' },
  }
  bookings.value.push(booking)
  toast.show({
    title: `Booked · ${input.name}`,
    body: `${serviceById(input.serviceId).name}, ${input.slot.day === TODAY ? 'today' : WEEK[input.slot.day].long} ${clock(input.slot.start)} WIB with ${staffById(input.staffId).name}`,
    tone: 'success',
  })
}
</script>

<template>
  <SampleShell product="Sesi">
    <template #strip>
      <span class="s-booking-ops-strip-venue">Arunika Wellness · Kemang</span>
    </template>
    <template #meta>
      <span class="s-booking-ops-strip-date">Thu 12 Nov 2026 ·</span>
      <span class="r-numeric">{{ clockSeconds(nowSeconds) }} WIB</span>
      <RStatus tone="signal" label="Live" pulse size="sm" />
    </template>

    <template #header>
      <h1 class="s-booking-ops-title">Booking operations</h1>
      <RBadge variant="outline">Open 08:00–21:00</RBadge>
    </template>
    <template #actions>
      <RSegmented v-model="view" :options="viewOptions" size="sm" label="Period" />
      <RButton tone="brand" size="sm" @click="newOpen = true">
        <template #leading><Plus /></template>
        New booking
      </RButton>
    </template>

    <div class="s-booking-ops">
      <!-- 01 · Today or this week in four figures -->
      <section class="s-booking-ops-kpis r-grid-ruled" :aria-label="view === 'day' ? 'Today' : 'This week'">
        <div class="s-booking-ops-kpi">
          <RStat :value="summary.revenue" prefix="Rp " locale="id-ID" size="md">
            <template #label><span class="s-booking-ops-kpi__index">01</span>Revenue booked</template>
            <template #footer>
              <RTrend :value="trend.revenue" size="sm" />
              <span class="s-booking-ops-kpi__note">{{ trend.label }}</span>
            </template>
          </RStat>
          <RSparkline
            :values="summary.revenueSeries"
            color="var(--r-chart-1)"
            :height="28"
            :label="view === 'day' ? 'Revenue booked today, cumulative by start hour' : 'Revenue booked each day this week'"
          />
          <p class="s-booking-ops-kpi__sub">{{ rupiah(summary.collected) }} collected {{ view === 'day' ? 'so far' : 'to date' }}</p>
        </div>

        <div class="s-booking-ops-kpi">
          <RStat :value="summary.appointments + summary.seats" size="md">
            <template #label><span class="s-booking-ops-kpi__index">02</span>Bookings</template>
            <template #footer>
              <RTrend :value="trend.bookings" size="sm" />
              <span class="s-booking-ops-kpi__note">{{ trend.label }}</span>
            </template>
          </RStat>
          <RSparkline
            :values="summary.bookingSeries"
            color="var(--r-chart-1)"
            :height="28"
            :label="view === 'day' ? 'Bookings starting in each hour today' : 'Bookings on each day this week'"
          />
          <p class="s-booking-ops-kpi__sub">{{ summary.appointments }} appointments · {{ summary.seats }} class seats · {{ summary.walkIns }} walk-ins</p>
        </div>

        <div class="s-booking-ops-kpi">
          <RStat :value="Math.round(summary.utilisation)" suffix="%" size="md">
            <template #label><span class="s-booking-ops-kpi__index">03</span>Staff utilisation</template>
            <template #footer>
              <RTrend :value="trend.utilisation" suffix=" pp" size="sm" />
              <span class="s-booking-ops-kpi__note">{{ trend.label }}</span>
            </template>
          </RStat>
          <div class="s-booking-ops-kpi__meter">
            <RMeter variant="segments" :value="summary.utilisation" :max="100" :count="20" :height="12" :label="`Staff utilisation ${Math.round(summary.utilisation)}%`" />
          </div>
          <p class="s-booking-ops-kpi__sub">Booked hours over hours on shift, net of breaks</p>
        </div>

        <div class="s-booking-ops-kpi">
          <RStat :value="summary.noShows" size="md">
            <template #label><span class="s-booking-ops-kpi__index">04</span>No-shows</template>
            <template #footer>
              <RTrend :value="trend.noShows" suffix="" :precision="0" invert size="sm" />
              <span class="s-booking-ops-kpi__note">{{ trend.label }}</span>
            </template>
          </RStat>
          <div class="s-booking-ops-kpi__lamps">
            <RStatus v-if="view === 'day'" :tone="summary.late ? 'signal' : 'neutral'" :label="`${summary.late} late now`" />
            <RStatus v-else tone="neutral" :label="`${summary.noShows} of ${summary.appointments} appointments`" />
          </div>
          <p class="s-booking-ops-kpi__sub">{{ pct(noShowRate) }} of appointments, deposits kept</p>
        </div>
      </section>

      <div class="s-booking-ops-grid">
        <ScheduleCard
          class="s-booking-ops-cell s-booking-ops-cell--schedule"
          :bookings="bookings"
          :walk-ins="walkIns"
          :blocks="blocks"
          :view="view"
          :now="now"
          @open="openTarget"
        />

        <WalkInQueue class="s-booking-ops-cell s-booking-ops-cell--queue" :walk-ins="todayWalkIns" :now="now" @call-next="callNext" />

        <RCard
          index="07"
          eyebrow="Capacity · last 4 weeks"
          title="Booked capacity by weekday and hour"
          meta="% · WIB"
          class="s-booking-ops-cell s-booking-ops-cell--capacity"
        >
          <RHeatmap
            :rows="HEAT_ROWS"
            :cols="HEAT_COLS"
            :values="HEAT_VALUES"
            :cell-height="22"
            :format="(v: number) => `${v}%`"
            label="Booked share of room hours by weekday and hour over the last four weeks, in percent. Sunday opens 09:00 to 17:00."
          />
        </RCard>

        <RCard
          index="08"
          :eyebrow="view === 'day' ? 'Revenue · Thu 12 Nov' : 'Revenue · Week 46'"
          title="By service"
          :meta="rupiah(summary.revenue)"
          class="s-booking-ops-cell s-booking-ops-cell--services"
        >
          <RBarList
            :items="summary.byCategory.map((c) => ({ label: c.label, values: c.value }))"
            :format="rupiah"
            :bar-height="10"
            :label="view === 'day' ? 'Revenue booked today by service, in rupiah' : 'Revenue booked this week by service, in rupiah'"
          />
          <RSpecList :items="money" dense class="s-booking-ops-money" />
        </RCard>
      </div>
    </div>

    <BookingDrawer
      v-model:open="drawerOpen"
      :target="target"
      :now="now"
      :slots="moveSlots"
      @check-in="checkIn"
      @check-out="checkOut"
      @no-show="markNoShow"
      @reschedule="reschedule"
      @receipt="sendReceipt"
      @message="messageAttendees"
    />
    <NewBookingDialog v-model:open="newOpen" :slots-for="slotsFor" @create="createBooking" />
  </SampleShell>
</template>

<style scoped>
.s-booking-ops {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.s-booking-ops-title {
  font-size: var(--r-text-xl);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-tight);
  line-height: 1.2;
}

/* ── KPI row ───────────────────────────────────────────────────────────── */
.s-booking-ops-kpis {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.s-booking-ops-kpi {
  display: grid;
  grid-template-rows: auto 28px auto;
  align-content: start;
  gap: 12px;
  padding: 16px 20px;
}

.s-booking-ops-kpi__index {
  margin-right: 10px;
  color: var(--r-text-tertiary);
  font-size: var(--r-text-3xs);
  font-weight: var(--r-weight-medium);
  letter-spacing: 0.04em;
}

.s-booking-ops-kpi__note {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

.s-booking-ops-kpi__meter,
.s-booking-ops-kpi__lamps {
  display: flex;
  align-items: center;
}
.s-booking-ops-kpi__meter > * {
  flex: 1;
}

.s-booking-ops-kpi__sub {
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  line-height: 1.4;
}

/* ── Panels ────────────────────────────────────────────────────────────── */
.s-booking-ops-grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  grid-auto-flow: row dense;
  gap: 16px;
}

.s-booking-ops-cell--schedule,
.s-booking-ops-cell--capacity {
  grid-column: span 8;
}
.s-booking-ops-cell--queue,
.s-booking-ops-cell--services {
  grid-column: span 4;
}

.s-booking-ops-money {
  margin-top: auto;
}

@media (max-width: 1199px) {
  .s-booking-ops-cell--schedule,
  .s-booking-ops-cell--capacity {
    grid-column: span 12;
  }
  .s-booking-ops-cell--queue,
  .s-booking-ops-cell--services {
    grid-column: span 6;
  }
}

@media (max-width: 1023px) {
  .s-booking-ops-kpis {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 767px) {
  .s-booking-ops-cell--queue,
  .s-booking-ops-cell--services {
    grid-column: span 12;
  }
}

@media (max-width: 640px) {
  .s-booking-ops-strip-venue,
  .s-booking-ops-strip-date {
    display: none;
  }
  .s-booking-ops-kpi {
    padding: 14px 12px;
  }
}

@media (max-width: 420px) {
  .s-booking-ops-kpis {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
