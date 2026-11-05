<script setup lang="ts">
/**
 * "Thursday after lunch with Rina" says what a calendar grid makes a person hunt for. The tile
 * reads the day, the time, the length and the people (English or Indonesian), shows what it
 * understood, and offers the first free slot with two others. Book is the only commitment.
 */
import { computed, ref } from 'vue'
import { Check, CornerDownLeft, MessageSquareText } from 'lucide-vue-next'
import { RButton, RInput } from '@/design-system'
import { pad } from '../../kit'
import Writing from './Writing.vue'
import { norm, useReply } from './shared'

interface Person {
  name: string
  /** How they are said: "rina". */
  match: string
  /** Busy blocks: "12 13:00-14:00" (day of the month, 24-hour times). */
  busy?: string[]
}

const props = withDefaults(
  defineProps<{
    initial: string
    people: Person[]
    /** The person asking is busy here too. */
    busy?: string[]
    /** Minutes when the sentence does not say. */
    length?: number
    /** "Meeting", "Appointment", "Session". */
    what?: string
    /** Where it happens: "Room Lontar", "Klinik Gigi Kemang". */
    place?: string
    /** Bookable hours, 24-hour. */
    hours?: [number, number]
    /** Opening days, 0 Sunday … 6 Saturday. */
    days?: number[]
    /** Today and the time now in the scene. */
    today?: string
    now?: string
    zone?: string
    example: string
    /** After Book: who hears about it. */
    bookedNote?: string
    /** One row for the slot, for strips. */
    compact?: boolean
  }>(),
  {
    busy: () => [],
    length: 30,
    what: 'Meeting',
    hours: () => [9, 17],
    days: () => [1, 2, 3, 4, 5],
    today: '2026-11-05',
    now: '10:00',
    zone: 'WIB',
    bookedNote: 'Invite sent',
  },
)

const DAY = 86400000
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const NAMES: [string, number][] = [
  ['sunday|minggu|ahad', 0],
  ['monday|senin', 1],
  ['tuesday|selasa', 2],
  ['wednesday|rabu', 3],
  ['thursday|kamis', 4],
  ['friday|jum.?at', 5],
  ['saturday|sabtu', 6],
]

const [y, m, d] = props.today.split('-').map(Number)
const today = Date.UTC(y, m - 1, d)
const toMin = (t: string) => {
  const [h, mm] = t.split(':').map(Number)
  return h * 60 + (mm || 0)
}
const nowMin = toMin(props.now)
const hhmm = (min: number) => `${pad(Math.floor(min / 60))}:${pad(min % 60)}`
const dayText = (t: number) => {
  const date = new Date(t)
  return `${WEEKDAYS[date.getUTCDay()]} ${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]}`
}

interface Understood {
  day: number | null
  dayWord: string
  time: number | null
  timeWord: string
  length: number
  lengthSaid: boolean
  who: Person[]
  not: number | null
}

function read(sentence: string): Understood {
  let s = ` ${norm(sentence)} `
  const u: Understood = { day: null, dayWord: '', time: null, timeWord: '', length: props.length, lengthSaid: false, who: [], not: null }

  // Days: "not Tuesday" first, then "next week", then the words.
  const not = s.match(/\b(?:not|bukan|kecuali|except|jangan)\s+(?:on\s+|hari\s+)?([a-z.']+)/)
  if (not) {
    const hit = NAMES.find(([re]) => new RegExp(`^(${re})$`).test(not[1]))
    if (hit) {
      u.not = hit[1]
      s = s.replace(not[0], ' ')
    }
  }
  const nextWeek = /\b(next week|minggu depan|pekan depan)\b/.test(s)
  if (nextWeek) s = s.replace(/\b(next week|minggu depan|pekan depan)\b/, ' ')
  const weekday = NAMES.find(([re]) => new RegExp(`\\b(${re})\\b`).test(s))
  const todayDow = new Date(today).getUTCDay()
  if (/\b(today|hari ini|nanti)\b/.test(s)) u.day = today
  else if (/\b(day after tomorrow|lusa)\b/.test(s)) u.day = today + 2 * DAY
  else if (/\b(tomorrow|besok)\b/.test(s)) u.day = today + DAY
  else if (weekday) {
    let ahead = (weekday[1] - todayDow + 7) % 7 || 7
    if (nextWeek && ahead < 7 - todayDow + 1) ahead += 7
    u.day = today + ahead * DAY
  } else if (nextWeek) {
    u.day = today + (((1 - todayDow + 7) % 7) || 7) * DAY
    u.dayWord = 'next week'
  }
  const date = s.match(/\b(\d{1,2})\s*(nov|november|dec|desember|december)\b/)
  if (date) u.day = Date.UTC(y, /^de/.test(date[2]) ? 11 : 10, Number(date[1]))
  if (u.day != null && !u.dayWord) u.dayWord = dayText(u.day)

  // Length: "2 jam", "45 min", "half an hour", "sejam".
  const len = s.match(/\b(\d+)\s*(min|mins|minutes|menit)\b/)
  const hrs = s.match(/\b(\d+)\s*(hours?|jam)\b/)
  if (len) u.length = Number(len[1])
  else if (/\b(half an hour|setengah jam)\b/.test(s)) u.length = 30
  else if (hrs) u.length = Number(hrs[1]) * 60
  else if (/\b(an hour|one hour|sejam|satu jam)\b/.test(s)) u.length = 60
  u.lengthSaid = !!(len || hrs || /\b(half an hour|setengah jam|an hour|one hour|sejam|satu jam)\b/.test(s))

  // Time: "14:30", "jam 3 sore", "3pm", then the words.
  const clockAt = s.match(/\b(\d{1,2})[:.](\d{2})\b/)
  const jam = s.match(/\bjam\s*(\d{1,2})(?:\s*(pagi|siang|sore|malam))?/)
  const ampm = s.match(/\b(\d{1,2})\s*(am|pm)\b/)
  if (clockAt) u.time = Number(clockAt[1]) * 60 + Number(clockAt[2])
  else if (jam) {
    let h = Number(jam[1])
    if ((jam[2] === 'sore' || jam[2] === 'malam') && h < 12) h += 12
    else if (jam[2] === 'siang' && h < 6) h += 12
    else if (!jam[2] && h < 7) h += 12
    u.time = h * 60
  } else if (ampm) u.time = ((Number(ampm[1]) % 12) + (ampm[2] === 'pm' ? 12 : 0)) * 60
  else if (/\b(after lunch|setelah makan siang|habis makan siang|abis makan siang|sehabis makan siang)\b/.test(s)) {
    u.time = 13 * 60
    u.timeWord = 'after lunch'
  } else if (/\b(first thing|pagi pagi|pagi-pagi)\b/.test(s)) u.time = toMin('08:30')
  else if (/\b(morning|pagi)\b/.test(s)) u.time = 9 * 60
  else if (/\b(lunch|makan siang|noon|siang)\b/.test(s)) u.time = 12 * 60
  else if (/\b(afternoon|sore)\b/.test(s)) u.time = 15 * 60
  else if (/\b(evening|malam|tonight|nanti malam)\b/.test(s)) u.time = 19 * 60
  if (u.time != null && !u.timeWord) u.timeWord = `from ${hhmm(u.time)}`

  u.who = props.people.filter((p) => new RegExp(`\\b(${p.match})\\b`).test(s))
  return u
}

function busyOn(day: number, list: string[]) {
  const dom = new Date(day).getUTCDate()
  return list
    .map((b) => b.match(/^(\d{1,2})\s+(\d{1,2}:\d{2})-(\d{1,2}:\d{2})$/))
    .filter((x): x is RegExpMatchArray => !!x && Number(x[1]) === dom)
    .map((x) => [toMin(x[2]), toMin(x[3])] as const)
}

function free(day: number, at: number, len: number, who: Person[]) {
  const blocks = [...busyOn(day, props.busy), ...who.flatMap((p) => busyOn(day, p.busy ?? []))]
  return blocks.every(([a, b]) => at + len <= a || at >= b)
}

interface Slot {
  day: number
  at: number
}

function slots(u: Understood): Slot[] {
  const out: Slot[] = []
  const [open, close] = [props.hours[0] * 60, props.hours[1] * 60]
  let day = u.day ?? today
  let at = u.time ?? (u.day == null ? Math.max(open, Math.ceil((nowMin + 30) / 30) * 30) : open)
  for (let guard = 0; guard < 400 && out.length < 3; guard++) {
    const dow = new Date(day).getUTCDay()
    const okDay = props.days.includes(dow) && dow !== u.not && (day > today || at > nowMin)
    if (!okDay || at + u.length > close) {
      day += DAY
      at = u.time != null && u.day == null ? u.time : open
      continue
    }
    if (at >= open && free(day, at, u.length, u.who)) out.push({ day, at })
    at += 30
  }
  return out
}

const text = ref(props.initial)
const asked = ref(read(props.initial))
const options = ref(slots(asked.value))
const chosen = ref(0)
const booked = ref(false)
const { busy, reply } = useReply(650)

const understoodAny = computed(() => asked.value.day != null || asked.value.time != null || asked.value.who.length > 0)
const chips = computed(() => {
  const u = asked.value
  return [
    u.dayWord || (u.day == null ? 'Soonest day' : ''),
    u.timeWord,
    u.lengthSaid ? `${u.length >= 60 && u.length % 60 === 0 ? `${u.length / 60} h` : `${u.length} min`}` : '',
    u.not != null ? `Not ${WEEKDAYS[u.not]}` : '',
    ...u.who.map((p) => p.name),
  ].filter(Boolean)
})
const slot = computed(() => options.value[chosen.value])
const outside = computed(() => {
  const t = asked.value.time
  return t != null && (t < props.hours[0] * 60 - 60 || t >= props.hours[1] * 60)
})
const altLabel = (o: Slot) =>
  o.day === options.value[0]?.day ? hhmm(o.at) : `${WEEKDAYS[new Date(o.day).getUTCDay()]} ${hhmm(o.at)}`

function submit() {
  if (!text.value.trim()) return
  booked.value = false
  reply(() => {
    asked.value = read(text.value)
    options.value = slots(asked.value)
    chosen.value = 0
  })
}

const range = (s: Slot) => `${hhmm(s.at)}–${hhmm(s.at + asked.value.length)}`
</script>

<template>
  <div class="mk sched" :class="{ 'sched--compact': compact }">
    <form class="sched__ask" @submit.prevent="submit">
      <RInput v-model="text" size="sm" :aria-label="`${what}, in a sentence`">
        <template #leading><MessageSquareText /></template>
        <template #trailing>
          <button type="submit" class="sched__send mk-reset" aria-label="Find a slot">
            <CornerDownLeft :size="14" />
          </button>
        </template>
      </RInput>
    </form>

    <div class="sched__out mk-grow" aria-live="polite">
      <Writing v-if="busy" label="Checking calendars" />
      <p v-else-if="!understoodAny" class="sched__miss">When should it be? Try “{{ example }}”.</p>
      <template v-else>
        <div v-if="!compact" class="sched__chips">
          <span v-for="c in chips" :key="c" class="sched__chip">{{ c }}</span>
        </div>
        <p v-if="outside" class="sched__miss">
          {{ what }}s are booked between {{ pad(hours[0]) }}:00 and {{ pad(hours[1]) }}:00. Try “{{ example }}”.
        </p>
        <div v-else-if="slot" class="sched__slot">
          <div class="sched__when">
            <p class="sched__day">{{ dayText(slot.day) }}</p>
            <p class="sched__time">{{ range(slot) }} {{ zone }}<template v-if="place"> · {{ place }}</template></p>
          </div>
          <p v-if="!compact" class="sched__free">
            <span v-for="p in asked.who" :key="p.name" class="sched__lamp">{{ p.name.split(' ')[0] }} free</span>
            <span class="sched__lamp">You free</span>
          </p>
          <div v-if="!compact && options.length > 1" class="sched__alts" role="group" aria-label="Free slots">
            <button
              v-for="(o, i) in options"
              :key="i"
              type="button"
              class="sched__alt mk-reset"
              :class="{ 'is-on': i === chosen }"
              :aria-pressed="i === chosen"
              @click="chosen = i; booked = false"
            >
              {{ altLabel(o) }}
            </button>
          </div>
        </div>
        <p v-else class="sched__miss">Nothing free in the next days. Try another week.</p>
      </template>
    </div>

    <div v-if="slot && understoodAny && !busy && !outside" class="sched__foot">
      <p v-if="booked" class="sched__done mk-truncate"><Check :size="14" aria-hidden="true" />Booked · {{ bookedNote }}</p>
      <p v-else class="sched__note mk-truncate">{{ compact ? chips.join(' · ') : `${what}, ${asked.length} min` }}</p>
      <RButton v-if="!booked" size="sm" tone="brand" @click="booked = true">Book</RButton>
      <RButton v-else size="xs" variant="ghost" @click="booked = false">Undo</RButton>
    </div>
  </div>
</template>

<style scoped>
.sched {
  gap: 8px;
}

.sched__ask {
  flex: none;
}

.sched__send {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  color: var(--r-text-tertiary);
  cursor: pointer;
}

.sched__out {
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: hidden;
}

.sched__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.sched__chip {
  height: 20px;
  padding: 0 6px;
  background: var(--r-brand-soft);
  color: var(--r-brand-text);
  font-size: var(--r-text-2xs);
  font-weight: var(--r-weight-medium);
  line-height: 20px;
  white-space: nowrap;
}

.sched__slot {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid var(--r-border-strong);
}

.sched__day {
  font-size: var(--r-text-lg);
  font-weight: var(--r-weight-semibold);
  letter-spacing: var(--r-tracking-snug);
  line-height: 1.2;
}

.sched__time {
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
}

.sched__free {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
}

.sched__lamp {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-3xs);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.sched__lamp::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: var(--r-radius-round);
  background: var(--r-status-good);
}

.sched__alts {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.sched__alt {
  height: 24px;
  padding: 0 8px;
  border: 1px solid var(--r-border-strong);
  color: var(--r-text-secondary);
  font-family: var(--r-font-mono);
  font-size: var(--r-text-2xs);
  cursor: pointer;
}

.sched__alt:hover {
  border-color: var(--r-text-tertiary);
  color: var(--r-text);
}

.sched__alt.is-on {
  border-color: var(--r-brand);
  background: var(--r-bg-selected);
  color: var(--r-brand-text);
}

.sched__miss {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
  line-height: 1.4;
}

.sched__foot {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
}

.sched__note {
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
}

.sched__done {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--r-success-text);
  font-size: var(--r-text-xs);
  font-weight: var(--r-weight-medium);
}

.sched--compact .sched__slot {
  flex-direction: row;
  align-items: baseline;
  gap: 12px;
  padding: 0;
  border: 0;
}

.sched--compact .sched__when {
  display: flex;
  align-items: baseline;
  gap: 10px;
  min-width: 0;
}

.sched--compact .sched__day {
  flex: none;
}

.sched--compact .sched__time {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
