<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Trash2, UserPlus } from 'lucide-vue-next'
import { RButton, RChip, RDialog, RInput, RSelect, RSwitch } from '@/design-system'
import { addDays, calendars, formatRange, fromTimeInput, toTimeInput, type ScheduleEvent } from '../data/schedule'

const open = defineModel<boolean>('open', { default: false })

const props = defineProps<{
  /** The event being edited, or a fresh draft for a new one. */
  event: ScheduleEvent | null
  isNew: boolean
  /** Monday of the week the events are counted from. */
  base: Date
  /** Monday of the week on screen, for the day picker. */
  week: Date
}>()

const emit = defineEmits<{ save: [event: ScheduleEvent]; delete: [event: ScheduleEvent] }>()

const title = ref('')
const calendar = ref<string | number | null>('work')
const day = ref<string | number | null>(0)
const start = ref('09:00')
const end = ref('10:00')
const guests = ref<string[]>([])
const guestDraft = ref<string | number | null>('')
const video = ref(false)
const tried = ref(false)

watch(
  () => [open.value, props.event] as const,
  ([isOpen, event]) => {
    if (!isOpen || !event) return
    title.value = event.title
    calendar.value = event.calendar
    day.value = event.day
    start.value = toTimeInput(event.start)
    end.value = toTimeInput(event.end)
    guests.value = [...event.guests]
    guestDraft.value = ''
    video.value = !!event.video
    tried.value = false
  },
  { immediate: true },
)

const calendarOptions = calendars.map((c) => ({ label: c.name, value: c.id, color: c.color }))

const dayOptions = computed(() => {
  const offset = Math.round((props.week.getTime() - props.base.getTime()) / 86_400_000)
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(props.week, i)
    return { label: date.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short' }), value: offset + i }
  })
})

const startMinutes = computed(() => fromTimeInput(start.value))
const endMinutes = computed(() => fromTimeInput(end.value))

const titleError = computed(() => (tried.value && !title.value.trim() ? 'Give the event a name.' : ''))
const timeError = computed(() => {
  if (startMinutes.value === null || endMinutes.value === null) return 'Pick a start and end time.'
  if (endMinutes.value <= startMinutes.value) return 'The event ends before it starts.'
  return ''
})

const summary = computed(() =>
  startMinutes.value !== null && endMinutes.value !== null && !timeError.value
    ? formatRange(startMinutes.value, endMinutes.value)
    : '',
)

function addGuest() {
  const name = String(guestDraft.value ?? '').trim()
  if (name && !guests.value.includes(name)) guests.value = [...guests.value, name]
  guestDraft.value = ''
}

function removeGuest(name: string) {
  guests.value = guests.value.filter((g) => g !== name)
}

function save() {
  tried.value = true
  if (!props.event || titleError.value || timeError.value) return
  emit('save', {
    ...props.event,
    title: title.value.trim(),
    calendar: String(calendar.value),
    day: Number(day.value),
    start: startMinutes.value!,
    end: endMinutes.value!,
    guests: guests.value,
    video: video.value,
  })
  open.value = false
}

function remove() {
  if (!props.event) return
  emit('delete', props.event)
  open.value = false
}
</script>

<template>
  <RDialog v-model:open="open" :title="isNew ? 'New event' : 'Edit event'" :description="summary || undefined" size="md">
    <form class="pk-form" novalidate @submit.prevent="save">
      <RInput v-model="title" label="Title" placeholder="What is it?" :error="titleError" autocomplete="off" />
      <div class="pk-form__row">
        <RSelect v-model="calendar" label="Calendar" :options="calendarOptions">
          <template #leading="{ option }">
            <span class="pk-form__swatch" :style="{ background: `var(--r-identity-${option?.color ?? 1}-text)` }" />
          </template>
        </RSelect>
        <RSelect v-model="day" label="Day" :options="dayOptions" />
      </div>
      <div class="pk-form__row">
        <RInput v-model="start" label="Starts" type="time" step="900" :invalid="!!timeError" />
        <RInput v-model="end" label="Ends" type="time" step="900" :error="timeError" />
      </div>
      <div class="pk-form__guests">
        <RInput v-model="guestDraft" label="Guests" placeholder="Add someone by name" @keydown.enter.prevent="addGuest">
          <template #leading><UserPlus /></template>
        </RInput>
        <div v-if="guests.length" class="pk-form__guest-list">
          <RChip v-for="g in guests" :key="g" size="sm" removable :remove-label="`Remove ${g}`" @remove="removeGuest(g)">
            {{ g }}
          </RChip>
        </div>
      </div>
      <RSwitch v-model="video" label="Video call" description="Adds a meeting link to the invite." />
      <button type="submit" hidden />
    </form>
    <template #footer>
      <RButton v-if="!isNew" variant="ghost" tone="danger" class="pk-form__delete" @click="remove">
        <template #leading><Trash2 /></template>
        Delete
      </RButton>
      <RButton variant="outline" @click="open = false">Cancel</RButton>
      <RButton @click="save">{{ isNew ? 'Add event' : 'Save changes' }}</RButton>
    </template>
  </RDialog>
</template>

<style>
.pk-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.pk-form__row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  align-items: start;
}

@media (max-width: 420px) {
  .pk-form__row {
    grid-template-columns: minmax(0, 1fr);
  }
}

.pk-form__swatch {
  width: 10px;
  height: 10px;
  border-radius: 3px;
}

.pk-form__guests {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.pk-form__guest-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.pk-form__delete {
  margin-right: auto;
}
</style>
