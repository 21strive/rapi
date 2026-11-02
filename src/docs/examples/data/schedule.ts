import type { Component } from 'vue'
import { Briefcase, Dumbbell, FolderKanban, PenTool, TreePalm } from 'lucide-vue-next'

export interface Calendar {
  id: string
  name: string
  /** Identity colour, 1–8 (see --r-identity-*). */
  color: number
  icon: Component
}

export interface ScheduleEvent {
  id: number
  title: string
  calendar: string
  /** Overrides the calendar colour. */
  color?: number
  /** Days from the Monday of the week the page opened on (0 = that Monday). */
  day: number
  /** Minutes from midnight. */
  start: number
  end: number
  guests: string[]
  video?: boolean
  /** Repeats on the same weekday every week. */
  recurring?: boolean
  /** Can be moved by the scheduler; drawn with a dashed edge. */
  flexible?: boolean
  location?: string
}

export const DAY_START = 7 * 60
export const DAY_END = 19 * 60

export const calendars: Calendar[] = [
  { id: 'work', name: 'Work plan', color: 4, icon: Briefcase },
  { id: 'project', name: 'Project', color: 6, icon: FolderKanban },
  { id: 'design', name: 'Design', color: 2, icon: PenTool },
  { id: 'fitness', name: 'Fitness', color: 1, icon: Dumbbell },
  { id: 'holiday', name: 'Holiday', color: 7, icon: TreePalm },
]

export const people = [
  'Anastasia Wijaya',
  'Raka Pratama',
  'Mei Lin',
  'Jonas Berg',
  'Sekar Ayu',
  'Dimas Saputra',
  'Priya Nair',
  'Tomás Ortega',
  'Hana Sato',
]

const [anastasia, raka, mei, jonas, sekar, dimas, priya, tomas, hana] = people
const h = (hours: number, minutes = 0) => hours * 60 + minutes

export const seedEvents: ScheduleEvent[] = [
  { id: 1, title: 'Weekly meeting', calendar: 'work', day: 0, start: h(8), end: h(9), guests: [anastasia, raka, mei, jonas, sekar], video: true, recurring: true },
  { id: 2, title: 'Sprint planning', calendar: 'project', day: 0, start: h(10), end: h(12, 30), guests: [raka, jonas, priya, tomas] },
  { id: 3, title: 'Onboarding copy, deep work', calendar: 'design', day: 1, start: h(9), end: h(11, 30), guests: [anastasia], flexible: true },
  { id: 4, title: '1:1 with Raka', calendar: 'work', day: 1, start: h(13), end: h(13, 30), guests: [anastasia, raka], video: true },
  { id: 5, title: 'Morning run', calendar: 'fitness', day: 2, start: h(7), end: h(7, 45), guests: [anastasia], recurring: true },
  { id: 6, title: 'Prototyping', calendar: 'design', day: 2, start: h(10), end: h(13), guests: [mei, hana, anastasia] },
  { id: 7, title: 'Client call: Handayani Finance', calendar: 'work', day: 2, start: h(15), end: h(16), guests: [anastasia, dimas, sekar], video: true },
  { id: 8, title: 'Sprint review', calendar: 'project', day: 3, start: h(8, 30), end: h(9, 30), guests: [raka, jonas, priya, tomas, mei] },
  { id: 9, title: 'Usability testing', calendar: 'design', day: 3, start: h(12), end: h(15), guests: [mei, hana, sekar, anastasia], location: 'Studio 2' },
  { id: 10, title: 'Design crit', calendar: 'design', day: 3, start: h(13), end: h(14), guests: [hana, mei, jonas] },
  { id: 11, title: 'Wireframe review', calendar: 'design', day: 4, start: h(10), end: h(11), guests: [anastasia, mei, raka, tomas], video: true },
  { id: 12, title: 'High fidelity pass', calendar: 'project', day: 4, start: h(11), end: h(14), guests: [hana, mei], flexible: true },
  { id: 13, title: 'Yoga', calendar: 'fitness', day: 4, start: h(17), end: h(18), guests: [anastasia], recurring: true },
  { id: 14, title: 'Family brunch', calendar: 'holiday', day: 5, start: h(10), end: h(12), guests: [anastasia, sekar] },
  { id: 15, title: 'Hike at Gede Pangrango', calendar: 'holiday', day: 6, start: h(7), end: h(11), guests: [anastasia, dimas], location: 'Cibodas' },
  { id: 16, title: 'Plan the week', calendar: 'work', day: 6, start: h(17), end: h(17, 30), guests: [anastasia], recurring: true, flexible: true },
]

/* ── Dates ─────────────────────────────────────────────────────────────────── */

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

/** Monday of the week that contains `date`. */
export function startOfWeek(date: Date): Date {
  const day = startOfDay(date)
  day.setDate(day.getDate() - ((day.getDay() + 6) % 7))
  return day
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

export function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

/** Whole days from a to b, safe across daylight-saving changes. */
export function daysBetween(a: Date, b: Date): number {
  const utc = (d: Date) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())
  return Math.round((utc(b) - utc(a)) / 86_400_000)
}

const mod = (n: number, m: number) => ((n % m) + m) % m

export function occursOn(event: ScheduleEvent, date: Date, base: Date): boolean {
  const offset = daysBetween(base, date)
  return event.recurring ? mod(offset, 7) === mod(event.day, 7) : offset === event.day
}

/* ── Formatting ───────────────────────────────────────────────────────────── */

export function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  const suffix = hours >= 12 ? 'PM' : 'AM'
  const h12 = hours % 12 === 0 ? 12 : hours % 12
  return `${h12}:${String(mins).padStart(2, '0')} ${suffix}`
}

export function formatHour(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const suffix = hours >= 12 ? 'PM' : 'AM'
  const h12 = hours % 12 === 0 ? 12 : hours % 12
  return `${h12} ${suffix}`
}

/** "8:00 – 9:30 AM", or "11:00 AM – 2:00 PM" when it crosses noon. */
export function formatRange(start: number, end: number): string {
  const a = formatTime(start)
  const b = formatTime(end)
  const sameHalf = (start < 720) === (end < 720)
  return sameHalf ? `${a.replace(/ [AP]M$/, '')} – ${b}` : `${a} – ${b}`
}

export function toTimeInput(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
}

export function fromTimeInput(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value)
  return match ? Number(match[1]) * 60 + Number(match[2]) : null
}

export const timezoneLabel = (() => {
  const offset = -new Date().getTimezoneOffset()
  const sign = offset >= 0 ? '+' : '−'
  const hours = Math.floor(Math.abs(offset) / 60)
  const minutes = Math.abs(offset) % 60
  return `GMT${sign}${hours}${minutes ? `:${String(minutes).padStart(2, '0')}` : ''}`
})()

export const identityNames = ['Blue', 'Violet', 'Pink', 'Rose', 'Orange', 'Amber', 'Green', 'Teal']
