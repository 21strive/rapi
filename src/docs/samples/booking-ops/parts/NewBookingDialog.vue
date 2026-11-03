<script setup lang="ts">
/** A booking for later today: customer, service, who and when. Only free slots are offered. */
import { computed, ref, watch } from 'vue'
import { RButton, RDialog, RInput, RSelect } from '@/design-system'
import {
  SERVICES,
  STAFF,
  TODAY,
  rupiah,
  serviceById,
  slotLabel,
  type NewBooking,
  type PaymentMethod,
  type ServiceId,
  type Slot,
  type StaffId,
} from '../data'

const open = defineModel<boolean>('open', { default: false })

const props = defineProps<{
  slotsFor: (serviceId: ServiceId, staffId: StaffId) => Slot[]
}>()

const emit = defineEmits<{ create: [booking: NewBooking] }>()

const name = ref('')
const phone = ref('')
const serviceId = ref<string | number | null>('reformer')
const staffId = ref<string | number | null>(null)
const slotKey = ref<string | number | null>(null)
const method = ref<string | number | null>('Pay at venue')
const tried = ref(false)

/* Appointments only: classes are booked by seat in the app, walk-ins through the queue. */
const serviceOptions = SERVICES.filter((s) => !s.capacity && s.category !== 'Walk-ins').map((s) => ({
  label: `${s.name} · ${s.minutes} min · ${rupiah(s.price)}`,
  value: s.id,
}))

const staffOptions = computed(() =>
  STAFF.filter((s) => serviceId.value != null && s.services.includes(serviceId.value as ServiceId)).map((s) => ({
    label: s.name,
    value: s.id,
  })),
)

const slots = computed(() =>
  serviceId.value != null && staffId.value != null ? props.slotsFor(serviceId.value as ServiceId, staffId.value as StaffId) : [],
)
const keyOf = (s: Slot) => `${s.day}-${s.start}-${s.roomId}`
const slotOptions = computed(() => slots.value.map((s) => ({ label: slotLabel(s), value: keyOf(s) })))

const methodOptions = ['Pay at venue', 'Virtual account', 'Card', 'E-wallet'].map((m) => ({ label: m, value: m }))

watch(serviceId, () => {
  if (!staffOptions.value.some((o) => o.value === staffId.value)) staffId.value = staffOptions.value[0]?.value ?? null
})
watch(slots, (list) => {
  if (!list.some((s) => keyOf(s) === slotKey.value)) slotKey.value = list[0] ? keyOf(list[0]) : null
})

watch(open, (isOpen) => {
  if (!isOpen) return
  name.value = ''
  phone.value = ''
  serviceId.value = 'reformer'
  staffId.value = staffOptions.value[0]?.value ?? null
  method.value = 'Pay at venue'
  tried.value = false
})

const nameError = computed(() => (tried.value && !name.value.trim() ? 'Enter the customer’s name.' : undefined))
const slotHint = computed(() => {
  if (serviceId.value == null || staffId.value == null) return undefined
  const today = slots.value.filter((s) => s.day === TODAY).length
  if (!slots.value.length) return 'No free time left this week with this person'
  return today ? `${today} free ${today === 1 ? 'slot' : 'slots'} left today` : 'Fully booked today; showing the next days'
})

function submit() {
  tried.value = true
  const slot = slots.value.find((s) => keyOf(s) === slotKey.value)
  if (!name.value.trim() || !slot || serviceId.value == null || staffId.value == null) return
  emit('create', {
    name: name.value.trim(),
    phone: phone.value.trim(),
    serviceId: serviceId.value as ServiceId,
    staffId: staffId.value as StaffId,
    slot,
    method: method.value as PaymentMethod,
  })
  open.value = false
}

const price = computed(() => (serviceId.value != null ? rupiah(serviceById(serviceId.value as ServiceId).price) : ''))
</script>

<template>
  <RDialog v-model:open="open" eyebrow="New booking · Arunika Kemang" title="Book an appointment" size="md">
    <form id="s-booking-ops-new" class="s-booking-ops-new" novalidate @submit.prevent="submit">
      <RInput v-model="name" label="Customer" placeholder="Full name" autocomplete="off" :error="nameError" />
      <RInput v-model="phone" label="Phone" placeholder="+62 812-0000-0000" type="tel" hint="For the reminder message" />
      <RSelect v-model="serviceId" :options="serviceOptions" label="Service" class="s-booking-ops-new__wide" />
      <RSelect v-model="staffId" :options="staffOptions" label="With" placeholder="Choose staff" />
      <RSelect v-model="slotKey" :options="slotOptions" label="Time" placeholder="No free slots" :hint="slotHint" />
      <RSelect v-model="method" :options="methodOptions" label="Payment" :hint="`${price} charged ${method === 'Pay at venue' ? 'at the desk' : 'on booking'}`" class="s-booking-ops-new__wide" />
    </form>
    <template #footer="{ close }">
      <RButton variant="ghost" @click="close">Cancel</RButton>
      <RButton tone="brand" type="submit" form="s-booking-ops-new">Create booking</RButton>
    </template>
  </RDialog>
</template>

<style scoped>
.s-booking-ops-new {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.s-booking-ops-new__wide {
  grid-column: 1 / -1;
}

@media (max-width: 520px) {
  .s-booking-ops-new {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
