<script setup lang="ts">
/** One booking, class or walk-in in a drawer: who, what, where, the money, and what to do next. */
import { computed, ref, watch } from 'vue'
import { RBadge, RButton, RDialog, RSelect, RSpecList } from '@/design-system'
import type { SpecItem, StatusTone } from '@/design-system'
import {
  TODAY,
  WEEK,
  clock,
  roomById,
  rupiah,
  serviceById,
  slotLabel,
  sourceOf,
  staffById,
  valueOf,
  type DrawerTarget,
  type Slot,
} from '../data'

const open = defineModel<boolean>('open', { default: false })

const props = defineProps<{
  target: DrawerTarget | null
  /** Minutes after midnight, with seconds as a fraction. */
  now: number
  /** Free slots for moving the booking, for today or a later day. */
  slots: Slot[]
}>()

const emit = defineEmits<{
  checkIn: []
  checkOut: []
  noShow: []
  reschedule: [slot: Slot]
  receipt: []
  message: []
}>()

const rescheduling = ref(false)
const slotKey = ref<string | number | null>(null)

const keyOf = (s: Slot) => `${s.day}-${s.start}-${s.roomId}`
const slotOptions = computed(() => props.slots.map((s) => ({ label: slotLabel(s), value: keyOf(s) })))

watch(
  () => [props.target, open.value] as const,
  () => {
    rescheduling.value = false
    slotKey.value = null
  },
)

function startMove() {
  rescheduling.value = true
  slotKey.value = props.slots[0] ? keyOf(props.slots[0]) : null
}

function confirmMove() {
  const slot = props.slots.find((s) => keyOf(s) === slotKey.value)
  if (slot) emit('reschedule', slot)
}

const ordinal = (n: number) => {
  const tail = n % 100 >= 11 && n % 100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ?? 'th'
  return `${n}${tail}`
}

const booking = computed(() => (props.target?.kind === 'booking' ? props.target.booking : null))
const walkIn = computed(() => (props.target?.kind === 'walkin' ? props.target.walkIn : null))
const service = computed(() => {
  const id = booking.value?.serviceId ?? walkIn.value?.serviceId
  return id ? serviceById(id) : null
})

const eyebrow = computed(() => {
  if (booking.value) return `${booking.value.seats ? 'Class' : 'Booking'} ${booking.value.id}`
  if (walkIn.value) return `Walk-in ${walkIn.value.ticket}`
  return ''
})

const title = computed(() => service.value?.name ?? '')

const lateBy = computed(() => (booking.value ? Math.max(1, Math.floor(props.now - booking.value.start)) : 0))

const badge = computed<{ tone: StatusTone; text: string; variant: 'soft' | 'outline' | 'solid' }>(() => {
  const b = booking.value
  if (b) {
    if (b.status === 'late') return { tone: 'signal', text: `Late ${lateBy.value} min`, variant: 'soft' }
    if (b.status === 'no-show') return { tone: 'signal', text: 'No-show', variant: 'soft' }
    if (b.status === 'checked-in') return { tone: 'brand', text: 'Checked in', variant: 'soft' }
    if (b.status === 'completed') return { tone: 'neutral', text: 'Completed', variant: 'soft' }
    return { tone: 'brand', text: b.seats && b.seats.booked >= b.seats.capacity ? 'Booked · full' : 'Booked', variant: 'outline' }
  }
  const w = walkIn.value
  if (w?.state === 'serving') return { tone: 'brand', text: 'Serving', variant: 'soft' }
  if (w?.state === 'waiting') return { tone: 'warning', text: 'Waiting', variant: 'soft' }
  return { tone: 'neutral', text: 'Done', variant: 'soft' }
})

const when = computed(() => {
  const b = booking.value
  if (b) return `${WEEK[b.day].long} · ${clock(b.start)}–${clock(b.end)} WIB`
  const w = walkIn.value
  if (w?.start != null && w.end != null) return `${WEEK[w.day].long} · ${clock(w.start)}–${clock(w.end)} WIB`
  return w ? `Arrived ${clock(w.arrivedAt)} WIB` : ''
})

const groups = computed<{ title: string; items: SpecItem[] }[]>(() => {
  const s = service.value
  const b = booking.value
  if (b && s) {
    const staff = staffById(b.staffId)
    const room = roomById(b.roomId)
    const serviceGroup: SpecItem[] = [
      { label: 'Duration', value: `${b.end - b.start} min` },
      { label: 'Room', value: `${room.name} · ${room.kind}` },
      { label: b.seats ? 'Instructor' : 'Staff', value: staff.name },
      { label: 'Time', value: `${clock(b.start)}–${clock(b.end)} WIB`, mono: true },
      { label: 'Booked through', value: sourceOf(b) },
    ]
    if (b.seats) {
      const full = b.seats.booked >= b.seats.capacity
      return [
        {
          title: 'Class',
          items: [
            { label: 'Seats', value: `${b.seats.booked} of ${b.seats.capacity}${full ? ' · full' : ''}` },
            { label: 'Waitlist', value: b.seats.waitlist ? `${b.seats.waitlist} waiting` : 'None' },
            { label: 'Price', value: `${rupiah(s.price)} a seat`, mono: true },
          ],
        },
        { title: 'Service', items: serviceGroup },
        {
          title: 'Payment',
          items: [
            { label: 'Revenue', value: rupiah(valueOf(b)), mono: true },
            { label: 'Collected', value: 'Paid at booking', tone: 'success' },
          ],
        },
      ]
    }
    const c = b.customer
    const paid = b.payment
    const amount = valueOf(b)
    const state: SpecItem =
      paid.state === 'paid'
        ? { label: 'Status', value: 'Paid', tone: 'success' }
        : paid.state === 'deposit'
          ? { label: 'Status', value: `Deposit ${rupiah(paid.deposit ?? 0)} paid`, hint: `${rupiah(amount - (paid.deposit ?? 0))} due at the desk`, tone: 'warning' }
          : { label: 'Status', value: 'Unpaid', hint: 'Due at the desk after the session', tone: 'neutral' }
    return [
      {
        title: 'Customer',
        items: [
          { label: 'Name', value: c?.name ?? '—' },
          { label: 'Phone', value: c?.phone ?? '—', mono: true },
          { label: 'Visits', value: c ? `${ordinal(c.visits)} visit` : '—', hint: c ? `Customer since ${c.since}` : undefined },
          ...(c?.note ? [{ label: 'Note', value: c.note }] : []),
        ],
      },
      { title: 'Service', items: serviceGroup },
      {
        title: 'Payment',
        items: [{ label: 'Amount', value: rupiah(amount), mono: true }, { label: 'Method', value: paid.method }, state],
      },
    ]
  }
  const w = walkIn.value
  if (w && s) {
    const waited = Math.max(0, Math.floor((w.start ?? props.now) - w.arrivedAt))
    return [
      {
        title: 'Customer',
        items: [
          { label: 'Name', value: w.name },
          { label: 'Phone', value: w.phone, mono: true },
          { label: 'Arrived', value: `${clock(w.arrivedAt)} WIB`, mono: true, hint: `${w.state === 'waiting' ? 'Waiting' : 'Waited'} ${waited} min` },
        ],
      },
      {
        title: 'Service',
        items: [
          { label: 'Duration', value: `${s.minutes} min` },
          { label: 'Room', value: 'Express bay' },
          { label: 'Staff', value: w.staffId ? staffById(w.staffId).name : 'Next free therapist' },
        ],
      },
      {
        title: 'Payment',
        items: [
          { label: 'Amount', value: rupiah(s.price), mono: true },
          { label: 'Method', value: 'Pay at venue' },
          w.state === 'done' ? { label: 'Status', value: 'Paid', tone: 'success' } : { label: 'Status', value: 'Unpaid', hint: 'Due after the session', tone: 'neutral' },
        ],
      },
    ]
  }
  return []
})

const isToday = computed(() => booking.value?.day === TODAY)
const isFuture = computed(() => (booking.value?.day ?? 0) > TODAY)
const staffFirst = computed(() => (booking.value ? staffById(booking.value.staffId).name.replace(/^dr\.\s+/, '').split(' ')[0] : ''))
</script>

<template>
  <RDialog v-model:open="open" side="right" size="md" :eyebrow="eyebrow" :title="title">
    <div v-if="target" class="s-booking-ops-drawer">
      <div class="s-booking-ops-drawer__status">
        <RBadge :tone="badge.tone" :variant="badge.variant" dot>{{ badge.text }}</RBadge>
        <span class="s-booking-ops-drawer__when">{{ when }}</span>
      </div>

      <section v-for="group in groups" :key="group.title" class="s-booking-ops-drawer__group">
        <h3 class="s-booking-ops-drawer__heading">{{ group.title }}</h3>
        <RSpecList :items="group.items" dense />
      </section>

      <section v-if="rescheduling" class="s-booking-ops-drawer__move" aria-label="Reschedule">
        <RSelect
          v-model="slotKey"
          :options="slotOptions"
          label="New time"
          placeholder="Choose a free slot"
          :hint="slots.length ? `Times when ${staffFirst} and a suitable room are both free, this week.` : `${staffFirst} has no free time left this week.`"
        />
      </section>
    </div>

    <template #footer>
      <template v-if="rescheduling">
        <RButton variant="ghost" @click="rescheduling = false">Cancel</RButton>
        <RButton tone="brand" :disabled="slotKey == null" @click="confirmMove">Move booking</RButton>
      </template>
      <template v-else-if="booking && booking.seats">
        <RButton variant="outline" @click="emit('message')">Message attendees</RButton>
      </template>
      <template v-else-if="booking && isToday">
        <RButton v-if="booking.status === 'late'" variant="ghost" tone="danger" @click="emit('noShow')">Mark no-show</RButton>
        <RButton v-if="booking.status === 'booked' || booking.status === 'late'" variant="outline" @click="startMove">Reschedule</RButton>
        <RButton v-if="booking.status === 'booked' || booking.status === 'late'" tone="brand" @click="emit('checkIn')">Check in</RButton>
        <RButton v-if="booking.status === 'checked-in'" tone="brand" @click="emit('checkOut')">Check out</RButton>
        <RButton v-if="booking.status === 'completed'" variant="outline" @click="emit('receipt')">Send receipt</RButton>
        <RButton v-if="booking.status === 'no-show'" variant="outline" @click="startMove">Rebook</RButton>
      </template>
      <template v-else-if="booking && isFuture">
        <RButton variant="outline" @click="startMove">Reschedule</RButton>
      </template>
      <template v-else-if="booking">
        <RButton variant="outline" :disabled="booking.status === 'no-show'" @click="emit('receipt')">Send receipt</RButton>
      </template>
      <template v-else-if="walkIn && walkIn.state === 'done'">
        <RButton variant="outline" @click="emit('receipt')">Send receipt</RButton>
      </template>
      <template v-else>
        <RButton variant="outline" @click="open = false">Close</RButton>
      </template>
    </template>
  </RDialog>
</template>

<style scoped>
.s-booking-ops-drawer {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.s-booking-ops-drawer__status {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
}

.s-booking-ops-drawer__when {
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-xs);
  font-variant-numeric: tabular-nums;
}

.s-booking-ops-drawer__group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.s-booking-ops-drawer__heading {
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-caps);
  text-transform: uppercase;
}

.s-booking-ops-drawer__move {
  padding: 12px;
  border: 1px solid var(--r-brand-border);
  background: var(--r-brand-soft);
}
</style>
