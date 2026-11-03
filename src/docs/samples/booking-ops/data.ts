/**
 * Sesi · booking operations for one venue: Arunika Wellness, Kemang (Jakarta).
 * Today is Thursday 12 Nov 2026; the screen opens at 14:20:07 WIB and the clock runs on.
 * Times are minutes after midnight, WIB. Days are 0 = Mon 9 Nov … 6 = Sun 15 Nov.
 */
import { formatNumber } from '@/design-system'

/* ── Calendar ────────────────────────────────────────────────────────────────────── */

export const TODAY = 3
export const OPEN = 8 * 60
export const CLOSE = 21 * 60
/** Opening hours in a day, the width of one day on the week axis. */
export const SPAN = CLOSE - OPEN
/** 14:20:07 WIB, in seconds after midnight. */
export const START_SECONDS = 14 * 3600 + 20 * 60 + 7

export const WEEK = [
  { short: 'Mon', date: '09', long: 'Mon 9 Nov' },
  { short: 'Tue', date: '10', long: 'Tue 10 Nov' },
  { short: 'Wed', date: '11', long: 'Wed 11 Nov' },
  { short: 'Thu', date: '12', long: 'Thu 12 Nov' },
  { short: 'Fri', date: '13', long: 'Fri 13 Nov' },
  { short: 'Sat', date: '14', long: 'Sat 14 Nov' },
  { short: 'Sun', date: '15', long: 'Sun 15 Nov' },
] as const

/** Sunday opens 09:00–17:00; every other day 08:00–21:00. */
export const hoursOf = (day: number): [number, number] => (day === 6 ? [9 * 60, 17 * 60] : [OPEN, CLOSE])

/* ── Resources ───────────────────────────────────────────────────────────────────── */

export type RoomId = 'r1' | 'r2' | 'r3' | 'sa' | 'ex'
export type StaffId = 'nadia' | 'bayu' | 'rizky' | 'maya' | 'clara'
export type ServiceId =
  | 'physio-follow'
  | 'physio-assess'
  | 'dry-needling'
  | 'rehab-reformer'
  | 'sports'
  | 'deep'
  | 'lymph'
  | 'stretch'
  | 'reformer'
  | 'mat'
  | 'prenatal'
  | 'barre'
  | 'slow-flow'
  | 'w-express'
  | 'w-neck'
  | 'w-foot'
  | 'w-stretch'

export type Category = 'Physio' | 'Massage' | 'Reformer & stretch' | 'Classes' | 'Walk-ins'
export const CATEGORIES: Category[] = ['Physio', 'Massage', 'Reformer & stretch', 'Classes', 'Walk-ins']

export interface Room {
  id: RoomId
  name: string
  kind: string
}

export interface Staff {
  id: StaffId
  name: string
  role: string
  /** Shift, clipped to the opening hours of the day. */
  shift: [number, number]
  breakAt: [number, number]
  daysOff: number[]
  services: ServiceId[]
}

export interface Service {
  id: ServiceId
  name: string
  minutes: number
  /** Per appointment, or per seat for a class. */
  price: number
  category: Category
  rooms: RoomId[]
  /** Seats, for classes. */
  capacity?: number
}

export const ROOMS: Room[] = [
  { id: 'r1', name: 'Room 1', kind: 'Physio' },
  { id: 'r2', name: 'Room 2', kind: 'Massage' },
  { id: 'r3', name: 'Room 3', kind: 'Reformer' },
  { id: 'sa', name: 'Studio A', kind: 'Group class' },
  { id: 'ex', name: 'Express bay', kind: 'Walk-ins' },
]

const T = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

export const STAFF: Staff[] = [
  {
    id: 'nadia',
    name: 'dr. Nadia Putri',
    role: 'Physio',
    shift: [T('08:00'), T('18:30')],
    breakAt: [T('12:00'), T('13:00')],
    daysOff: [6],
    services: ['physio-follow', 'physio-assess', 'dry-needling', 'rehab-reformer', 'stretch'],
  },
  {
    id: 'bayu',
    name: 'Bayu Santoso',
    role: 'Therapist',
    shift: [T('12:00'), T('20:30')],
    breakAt: [T('15:30'), T('16:00')],
    daysOff: [0],
    services: ['sports', 'deep', 'lymph', 'stretch'],
  },
  {
    id: 'rizky',
    name: 'Rizky Pratama',
    role: 'Therapist',
    shift: [T('08:00'), T('15:00')],
    breakAt: [T('12:30'), T('13:00')],
    daysOff: [5, 6],
    services: ['sports', 'deep', 'lymph', 'stretch'],
  },
  {
    id: 'maya',
    name: 'Maya Lestari',
    role: 'Instructor',
    shift: [T('08:00'), T('20:30')],
    breakAt: [T('12:45'), T('13:45')],
    daysOff: [],
    services: ['reformer', 'mat', 'prenatal', 'barre', 'slow-flow', 'stretch'],
  },
  {
    id: 'clara',
    name: 'Clara Wijaya',
    role: 'Walk-ins',
    shift: [T('09:00'), T('18:00')],
    breakAt: [T('12:00'), T('12:30')],
    daysOff: [6],
    services: ['w-express', 'w-neck', 'w-foot', 'w-stretch', 'sports', 'lymph'],
  },
]

export const SERVICES: Service[] = [
  { id: 'physio-follow', name: 'Physio follow-up', minutes: 60, price: 450_000, category: 'Physio', rooms: ['r1', 'r3'] },
  { id: 'physio-assess', name: 'Physio assessment', minutes: 90, price: 650_000, category: 'Physio', rooms: ['r1'] },
  { id: 'dry-needling', name: 'Dry needling', minutes: 60, price: 480_000, category: 'Physio', rooms: ['r1'] },
  { id: 'rehab-reformer', name: 'Reformer rehab', minutes: 60, price: 520_000, category: 'Physio', rooms: ['r3'] },
  { id: 'sports', name: 'Sports massage', minutes: 60, price: 380_000, category: 'Massage', rooms: ['r2'] },
  { id: 'deep', name: 'Deep tissue massage', minutes: 90, price: 520_000, category: 'Massage', rooms: ['r2'] },
  { id: 'lymph', name: 'Lymphatic drainage', minutes: 60, price: 420_000, category: 'Massage', rooms: ['r2'] },
  { id: 'stretch', name: 'Assisted stretch', minutes: 60, price: 300_000, category: 'Reformer & stretch', rooms: ['r1', 'r2', 'r3'] },
  { id: 'reformer', name: 'Reformer private', minutes: 60, price: 420_000, category: 'Reformer & stretch', rooms: ['r3'] },
  { id: 'mat', name: 'Mat pilates class', minutes: 60, price: 180_000, category: 'Classes', rooms: ['sa'], capacity: 12 },
  { id: 'prenatal', name: 'Prenatal pilates class', minutes: 60, price: 200_000, category: 'Classes', rooms: ['sa'], capacity: 8 },
  { id: 'barre', name: 'Barre class', minutes: 60, price: 180_000, category: 'Classes', rooms: ['sa'], capacity: 12 },
  { id: 'slow-flow', name: 'Slow flow pilates class', minutes: 75, price: 180_000, category: 'Classes', rooms: ['sa'], capacity: 12 },
  { id: 'w-express', name: 'Express massage', minutes: 30, price: 200_000, category: 'Walk-ins', rooms: ['ex'] },
  { id: 'w-neck', name: 'Neck and shoulder', minutes: 20, price: 150_000, category: 'Walk-ins', rooms: ['ex'] },
  { id: 'w-foot', name: 'Foot reflexology', minutes: 30, price: 180_000, category: 'Walk-ins', rooms: ['ex'] },
  { id: 'w-stretch', name: 'Express stretch', minutes: 20, price: 150_000, category: 'Walk-ins', rooms: ['ex'] },
]

export const roomById = (id: RoomId) => ROOMS.find((r) => r.id === id) as Room
export const staffById = (id: StaffId) => STAFF.find((s) => s.id === id) as Staff
export const serviceById = (id: ServiceId) => SERVICES.find((s) => s.id === id) as Service

/* ── Bookings ────────────────────────────────────────────────────────────────────── */

export type BookingStatus = 'completed' | 'checked-in' | 'booked' | 'late' | 'no-show'
export type PaymentMethod = 'Virtual account' | 'Card' | 'E-wallet' | 'Pay at venue'
export type PaymentState = 'paid' | 'deposit' | 'unpaid'

export interface Customer {
  name: string
  phone: string
  visits: number
  since: string
  note?: string
}

export interface Booking {
  id: string
  day: number
  start: number
  end: number
  roomId: RoomId
  staffId: StaffId
  serviceId: ServiceId
  status: BookingStatus
  /** One customer for an appointment; classes have seats instead. */
  customer?: Customer
  seats?: { booked: number; capacity: number; waitlist: number }
  payment: { method: PaymentMethod; state: PaymentState; deposit?: number }
}

export type WalkInState = 'waiting' | 'serving' | 'done'

export interface WalkIn {
  ticket: string
  day: number
  name: string
  phone: string
  serviceId: ServiceId
  arrivedAt: number
  state: WalkInState
  start?: number
  end?: number
  roomId?: RoomId
  staffId?: StaffId
}

/** Hatched time on the schedule: breaks, closed hours, cleaning, repairs. */
export interface Block {
  day: number
  start: number
  end: number
  label: string
  roomId?: RoomId
  staffId?: StaffId
  /** Applies to every row (the venue is closed). */
  all?: boolean
}

/** What the schedule opens in the drawer. */
export type ScheduleTarget = { kind: 'booking'; id: string } | { kind: 'walkin'; ticket: string }
export type DrawerTarget = { kind: 'booking'; booking: Booking } | { kind: 'walkin'; walkIn: WalkIn }

/** What the new-booking dialog hands back. */
export interface NewBooking {
  name: string
  phone: string
  serviceId: ServiceId
  staffId: StaffId
  slot: Slot
  method: PaymentMethod
}

const SOURCES = ['Sesi app', 'Sesi app', 'Booking page', 'Front desk', 'Sesi app', 'Phone call', 'Booking page']

/** Where and when the booking was made, a few days before it. */
export const sourceOf = (b: Booking) => {
  const seq = Number(b.id.slice(-4)) || 0
  const date = Number(WEEK[b.day].date) - ((seq % 7) + 1)
  return `${SOURCES[seq % SOURCES.length]} · ${date} Nov 2026`
}

/** What a booking is worth: the service price, or seats × price for a class. */
export const valueOf = (b: Booking) => serviceById(b.serviceId).price * (b.seats ? b.seats.booked : 1)

/* Today's customers. Phones are Indonesian mobiles, one visitor from Singapore. */
const PEOPLE: Record<string, Omit<Customer, 'name'>> = {
  'Dewi Kartika': { phone: '+62 812-2210-4471', visits: 18, since: 'Feb 2025', note: 'Lower back, works at a desk all day' },
  'Andi Wijaya': { phone: '+62 813-8842-1093', visits: 7, since: 'Jun 2026', note: 'Shoulder impingement, week 4 of 8' },
  'Hartono Gunawan': { phone: '+62 811-1907-3385', visits: 1, since: 'Nov 2026', note: 'First visit, referred by his GP' },
  'Kevin Tanoto': { phone: '+62 878-5531-2208', visits: 22, since: 'Sep 2025', note: 'ACL reconstruction, rehab week 12' },
  'Sari Dewanti': { phone: '+62 812-9034-7712', visits: 6, since: 'Aug 2026', note: 'Runner, pain on the outside of the left knee' },
  'Yosef Manurung': { phone: '+62 852-6620-1184', visits: 11, since: 'Apr 2026' },
  'Lina Hartati': { phone: '+62 821-4417-9026', visits: 3, since: 'Oct 2026', note: 'Prefers a female practitioner' },
  'Raka Pradipta': { phone: '+62 815-7781-3340', visits: 9, since: 'May 2026' },
  'Gita Ramadhani': { phone: '+62 857-1123-6609', visits: 14, since: 'Jan 2026', note: 'Firm pressure' },
  'Hana Kusuma': { phone: '+62 812-3398-1175', visits: 5, since: 'Jul 2026' },
  'Mei Lin': { phone: '+65 9123 4471', visits: 2, since: 'Oct 2026', note: 'Visiting from Singapore until 20 Nov' },
  'Tomo Saputra': { phone: '+62 813-2290-5518', visits: 27, since: 'Nov 2024' },
  'Putri Ayu': { phone: '+62 819-4402-7731', visits: 8, since: 'Mar 2026' },
  'Ilham Akbar': { phone: '+62 822-6618-0045', visits: 4, since: 'Sep 2026' },
  'Intan Permata': { phone: '+62 812-7705-2290', visits: 16, since: 'Dec 2025', note: 'Allergic to lavender oil' },
  'Wulan Sari': { phone: '+62 856-9910-3327', visits: 12, since: 'Feb 2026' },
  'Bima Aditya': { phone: '+62 811-8826-4410', visits: 1, since: 'Nov 2026', note: 'First visit' },
  'Farah Nabila': { phone: '+62 813-4471-9902', visits: 19, since: 'Oct 2025' },
  'Joko Susilo': { phone: '+62 878-2204-6618', visits: 6, since: 'Jun 2026' },
  'Oki Firmansyah': { phone: '+62 812-5509-1176', visits: 10, since: 'Apr 2026' },
  'Rani Puspita': { phone: '+62 821-7731-0084', visits: 31, since: 'Aug 2024', note: 'Postnatal, five months' },
  'Vino Hartanto': { phone: '+62 815-0098-4423', visits: 5, since: 'Sep 2026' },
  'Sinta Maharani': { phone: '+62 852-3314-7790', visits: 24, since: 'Jan 2025' },
  'Tegar Wibisono': { phone: '+62 813-6627-5501', visits: 2, since: 'Oct 2026' },
}

const person = (name: string): Customer => ({ name, ...PEOPLE[name] })

type PlanRow = [StaffId, RoomId, ServiceId, string, string, BookingStatus, PaymentState, PaymentMethod]

/** Today's appointments. Also the weekly template the other days are drawn from. */
const TODAY_PLAN: PlanRow[] = [
  ['nadia', 'r1', 'physio-follow', '08:00', 'Dewi Kartika', 'completed', 'paid', 'Card'],
  ['nadia', 'r1', 'physio-follow', '09:00', 'Andi Wijaya', 'completed', 'paid', 'Virtual account'],
  ['nadia', 'r1', 'physio-assess', '10:00', 'Hartono Gunawan', 'no-show', 'deposit', 'Virtual account'],
  ['nadia', 'r3', 'rehab-reformer', '13:00', 'Kevin Tanoto', 'completed', 'paid', 'E-wallet'],
  ['nadia', 'r1', 'physio-assess', '14:00', 'Sari Dewanti', 'late', 'paid', 'Virtual account'],
  ['nadia', 'r1', 'physio-follow', '15:30', 'Yosef Manurung', 'booked', 'unpaid', 'Pay at venue'],
  ['nadia', 'r1', 'dry-needling', '16:30', 'Lina Hartati', 'booked', 'paid', 'Card'],
  ['nadia', 'r1', 'physio-follow', '17:30', 'Raka Pradipta', 'booked', 'deposit', 'E-wallet'],
  ['rizky', 'r2', 'sports', '08:00', 'Gita Ramadhani', 'completed', 'paid', 'E-wallet'],
  ['rizky', 'r2', 'lymph', '09:00', 'Hana Kusuma', 'completed', 'paid', 'Card'],
  ['rizky', 'r2', 'sports', '10:00', 'Mei Lin', 'completed', 'paid', 'Card'],
  ['rizky', 'r2', 'deep', '11:00', 'Tomo Saputra', 'completed', 'paid', 'Virtual account'],
  ['rizky', 'r1', 'stretch', '13:00', 'Putri Ayu', 'completed', 'paid', 'E-wallet'],
  ['bayu', 'r2', 'sports', '12:30', 'Ilham Akbar', 'completed', 'paid', 'Pay at venue'],
  ['bayu', 'r2', 'sports', '13:30', 'Intan Permata', 'checked-in', 'paid', 'Card'],
  ['bayu', 'r2', 'sports', '14:30', 'Wulan Sari', 'booked', 'paid', 'E-wallet'],
  ['bayu', 'r2', 'deep', '16:00', 'Bima Aditya', 'booked', 'unpaid', 'Pay at venue'],
  ['bayu', 'r2', 'sports', '17:30', 'Farah Nabila', 'booked', 'paid', 'Virtual account'],
  ['bayu', 'r2', 'lymph', '18:30', 'Joko Susilo', 'booked', 'deposit', 'Card'],
  ['bayu', 'r2', 'sports', '19:30', 'Oki Firmansyah', 'booked', 'unpaid', 'Pay at venue'],
  ['maya', 'r3', 'reformer', '09:15', 'Rani Puspita', 'completed', 'paid', 'Card'],
  ['maya', 'r3', 'reformer', '11:45', 'Vino Hartanto', 'completed', 'paid', 'E-wallet'],
  ['maya', 'r3', 'reformer', '14:00', 'Sinta Maharani', 'checked-in', 'paid', 'Virtual account'],
  ['maya', 'r3', 'reformer', '16:00', 'Tegar Wibisono', 'booked', 'deposit', 'Card'],
]

type ClassRow = [ServiceId, string, number, number, BookingStatus]

/** Today's timetable in Studio A, all taught by Maya: seats booked and the waitlist. */
const TODAY_CLASSES: ClassRow[] = [
  ['mat', '08:00', 9, 0, 'completed'],
  ['prenatal', '10:30', 6, 0, 'completed'],
  ['barre', '18:00', 12, 3, 'booked'],
  ['slow-flow', '19:15', 10, 0, 'booked'],
]

/* Seeded random numbers, so the generated days are the same on every load. */
function mulberry32(seed: number) {
  let s = seed
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const FIRST = ['Agus', 'Bunga', 'Cahya', 'Dimas', 'Elisa', 'Fajar', 'Gilang', 'Hesti', 'Indra', 'Jessica', 'Kartika', 'Lukas', 'Melati', 'Nanda', 'Oscar', 'Pandu', 'Rizka', 'Sekar', 'Taufik', 'Umar', 'Vania', 'Wira', 'Yuni', 'Zahra', 'Arif', 'Bella', 'Chandra', 'Dian', 'Erwin', 'Laila']
const LAST = ['Santoso', 'Wibowo', 'Halim', 'Siregar', 'Nasution', 'Kusumo', 'Hidayat', 'Lim', 'Tanudjaja', 'Saragih', 'Putra', 'Rahayu', 'Setiawan', 'Gunadi', 'Hakim', 'Sihombing']
const SINCE = ['Mar 2025', 'Jul 2025', 'Nov 2025', 'Jan 2026', 'Apr 2026', 'Jun 2026', 'Aug 2026', 'Oct 2026']
const METHODS: PaymentMethod[] = ['Virtual account', 'Card', 'E-wallet', 'Pay at venue']

const pick = <T,>(rand: () => number, list: readonly T[]) => list[Math.floor(rand() * list.length)]
const digits = (rand: () => number, n: number) => Array.from({ length: n }, () => Math.floor(rand() * 10)).join('')
const phoneOf = (rand: () => number) => `+62 8${pick(rand, ['11', '12', '13', '15', '21', '52', '56', '57', '78'])}-${digits(rand, 4)}-${digits(rand, 4)}`

const randomCustomer = (rand: () => number): Customer => ({
  name: `${pick(rand, FIRST)} ${pick(rand, LAST)}`,
  phone: phoneOf(rand),
  visits: 1 + Math.floor(rand() * 30),
  since: pick(rand, SINCE),
})

const idOf = (day: number, seq: number) => `SSI-11${WEEK[day].date}-${String(seq).padStart(4, '0')}`

/** Cancellations already in on the coming days: the openings a reschedule can use. */
const OPENINGS: Record<number, [StaffId, string][]> = {
  4: [
    ['nadia', '09:00'],
    ['nadia', '10:00'],
    ['bayu', '14:30'],
    ['maya', '11:45'],
  ],
  5: [
    ['nadia', '15:30'],
    ['nadia', '16:30'],
    ['bayu', '17:30'],
    ['maya', '16:00'],
  ],
}

/** The week Mon 9 – Sun 15 Nov: today as planned, the other days drawn from the same timetable. */
export function createBookings(): Booking[] {
  const rand = mulberry32(20261112)
  const all: Booking[] = []
  for (let day = 0; day < 7; day++) {
    const [open, close] = hoursOf(day)
    const past = day < TODAY
    const rows: Booking[] = []

    for (const [staffId, roomId, serviceId, at, who, status, state, method] of TODAY_PLAN) {
      const service = serviceById(serviceId)
      const start = T(at)
      const end = start + service.minutes
      if (day === TODAY) {
        rows.push({ id: '', day, start, end, roomId, staffId, serviceId, status, customer: person(who), payment: { method, state, deposit: state === 'deposit' ? 200_000 : undefined } })
        continue
      }
      if (staffById(staffId).daysOff.includes(day) || start < open || end > close) continue
      if (OPENINGS[day]?.some(([who, time]) => who === staffId && time === at)) continue
      // Past days lost a few slots to cancellations; later days are still filling up.
      const drop = past ? 0.06 : day === 4 ? 0.12 : day === 5 ? 0.1 : 0.32
      if (rand() < drop) continue
      const noShow = past && rand() < 0.05
      const st: PaymentState = past ? (noShow ? 'deposit' : 'paid') : rand() < 0.5 ? 'paid' : rand() < 0.5 ? 'deposit' : 'unpaid'
      const m = st === 'unpaid' ? 'Pay at venue' : pick(rand, METHODS.slice(0, 3))
      rows.push({
        id: '',
        day,
        start,
        end,
        roomId,
        staffId,
        serviceId,
        status: past ? (noShow ? 'no-show' : 'completed') : 'booked',
        customer: randomCustomer(rand),
        payment: { method: m, state: st, deposit: st === 'deposit' ? 200_000 : undefined },
      })
    }

    for (const [serviceId, at, booked, waitlist, status] of TODAY_CLASSES) {
      const service = serviceById(serviceId)
      const start = T(at)
      const end = start + service.minutes
      const capacity = service.capacity ?? 12
      if (day !== TODAY && (start < open || end > close)) continue
      const seats =
        day === TODAY
          ? { booked, capacity, waitlist }
          : { booked: Math.max(3, Math.min(capacity, Math.round(capacity * (past ? 0.6 + rand() * 0.4 : 0.35 + rand() * 0.55)))), capacity, waitlist: 0 }
      rows.push({
        id: '',
        day,
        start,
        end,
        roomId: 'sa',
        staffId: 'maya',
        serviceId,
        status: day === TODAY ? status : past ? 'completed' : 'booked',
        seats,
        payment: { method: 'Card', state: 'paid' },
      })
    }

    rows.sort((a, b) => a.start - b.start || a.roomId.localeCompare(b.roomId))
    rows.forEach((b, i) => (b.id = idOf(day, 401 + i * 3 + day)))
    all.push(...rows)
  }
  return all
}

type WalkRow = [string, string, ServiceId, string, string | null, WalkInState]

/** Walk-ins take a running ticket number across the week. Today so far, and the four waiting now. */
const TODAY_WALKINS: WalkRow[] = [
  ['W-021', 'Ayu Lestari', 'w-neck', '09:02', '09:05', 'done'],
  ['W-022', 'Bram Setiadi', 'w-express', '09:20', '09:28', 'done'],
  ['W-023', 'Citra Anjani', 'w-foot', '10:10', '10:12', 'done'],
  ['W-024', 'Daniel Kho', 'w-stretch', '10:55', '11:00', 'done'],
  ['W-025', 'Eka Prasetya', 'w-express', '11:20', '11:25', 'done'],
  ['W-026', 'Fitri Handayani', 'w-neck', '12:28', '12:32', 'done'],
  ['W-027', 'Galih Ramadhan', 'w-express', '12:50', '12:55', 'done'],
  ['W-028', 'Hendra Saputra', 'w-foot', '13:20', '13:28', 'done'],
  ['W-029', 'Irene Tan', 'w-neck', '13:45', '13:58', 'done'],
  ['W-030', 'Joni Pratama', 'w-express', '13:52', '14:18', 'serving'],
  ['W-031', 'Siti Rahma', 'w-foot', '14:02', null, 'waiting'],
  ['W-032', 'Kevin Halim', 'w-neck', '14:09', null, 'waiting'],
  ['W-033', 'Putu Wirawan', 'w-express', '14:14', null, 'waiting'],
  ['W-034', 'Laras Ayuningtyas', 'w-stretch', '14:18', null, 'waiting'],
]

const WALK_SERVICES: ServiceId[] = ['w-express', 'w-neck', 'w-foot', 'w-stretch']

export function createWalkIns(): WalkIn[] {
  const rand = mulberry32(31)
  const out: WalkIn[] = []
  let ticket = 1
  // Mon–Wed: seven, six and seven walk-ins, served one after another in the express bay.
  for (const [day, count] of [
    [0, 7],
    [1, 6],
    [2, 7],
  ] as const) {
    let t = T('09:10') + Math.floor(rand() * 20)
    for (let i = 0; i < count; i++) {
      const serviceId = pick(rand, WALK_SERVICES)
      const minutes = serviceById(serviceId).minutes
      // Clara's break is 12:00–12:30 and her shift ends at 18:00.
      if (t < T('12:30') && t + minutes > T('12:00')) t = T('12:30') + Math.floor(rand() * 10)
      if (t + minutes > T('17:45')) break
      const arrivedAt = t - 2 - Math.floor(rand() * 8)
      out.push({
        ticket: `W-${String(ticket++).padStart(3, '0')}`,
        day,
        name: `${pick(rand, FIRST)} ${pick(rand, LAST)}`,
        phone: phoneOf(rand),
        serviceId,
        arrivedAt,
        state: 'done',
        start: t,
        end: t + minutes,
        roomId: 'ex',
        staffId: 'clara',
      })
      t += minutes + 20 + Math.floor(rand() * 45)
    }
  }
  for (const [code, name, serviceId, arrived, start, state] of TODAY_WALKINS) {
    const s = start ? T(start) : undefined
    out.push({
      ticket: code,
      day: TODAY,
      name,
      phone: phoneOf(rand),
      serviceId,
      arrivedAt: T(arrived),
      state,
      start: s,
      end: s != null ? s + serviceById(serviceId).minutes : undefined,
      roomId: s != null ? 'ex' : undefined,
      staffId: s != null ? 'clara' : undefined,
    })
  }
  return out
}

/** Breaks, time outside shifts, days off, closed hours and today's cleaning and repair. */
export function createBlocks(): Block[] {
  const out: Block[] = []
  for (let day = 0; day < 7; day++) {
    const [open, close] = hoursOf(day)
    if (open > OPEN) out.push({ day, start: OPEN, end: open, label: 'Closed', all: true })
    if (close < CLOSE) out.push({ day, start: close, end: CLOSE, label: 'Closed', all: true })
    for (const s of STAFF) {
      if (s.daysOff.includes(day)) {
        out.push({ day, start: open, end: close, label: 'Day off', staffId: s.id })
        continue
      }
      const from = Math.max(open, s.shift[0])
      const to = Math.min(close, s.shift[1])
      if (from > open) out.push({ day, start: open, end: from, label: 'Off shift', staffId: s.id })
      if (to < close) out.push({ day, start: to, end: close, label: 'Off shift', staffId: s.id })
      if (s.breakAt[0] >= from && s.breakAt[1] <= to) out.push({ day, start: s.breakAt[0], end: s.breakAt[1], label: 'Break', staffId: s.id })
    }
  }
  out.push(
    { day: TODAY, start: T('14:00'), end: T('15:00'), label: 'Training', staffId: 'rizky' },
    { day: TODAY, start: T('13:00'), end: T('14:00'), label: 'Clean', roomId: 'sa' },
    { day: TODAY, start: T('15:00'), end: T('16:00'), label: 'Repair', roomId: 'r3' },
    { day: TODAY, start: T('20:00'), end: T('21:00'), label: 'Clean', roomId: 'r1' },
  )
  return out
}

/* ── Capacity heatmap · booked share of room hours, last four weeks ─────────────── */

export const HEAT_ROWS = WEEK.map((d) => d.short)
export const HEAT_COLS = Array.from({ length: 13 }, (_, i) => String(8 + i).padStart(2, '0'))

/* Weekdays fill before work and after 17:00; Friday evenings thin out; Saturday is a morning
   venue; Sunday opens 09:00–17:00, so its early and late hours are zero. */
export const HEAT_VALUES: number[][] = [
  [74, 61, 47, 42, 58, 51, 40, 44, 59, 84, 93, 88, 66],
  [79, 64, 52, 46, 61, 55, 44, 49, 63, 87, 95, 91, 71],
  [81, 66, 55, 49, 64, 57, 47, 52, 66, 89, 96, 93, 74],
  [78, 65, 53, 47, 62, 56, 45, 51, 64, 86, 94, 90, 72],
  [72, 60, 50, 45, 57, 50, 42, 46, 55, 71, 77, 66, 44],
  [68, 91, 97, 95, 86, 73, 65, 61, 56, 50, 44, 36, 22],
  [0, 66, 81, 84, 70, 59, 51, 47, 39, 0, 0, 0, 0],
]

/* ── Comparisons (the same day last week, the week before) ───────────────────────── */

export const TRENDS = {
  day: { revenue: 8.3, bookings: 5.2, utilisation: 3.1, noShows: -1, label: 'vs last Thu' },
  week: { revenue: 4.6, bookings: 3.8, utilisation: 1.4, noShows: 2, label: 'vs last week' },
}

/* ── Derived figures ─────────────────────────────────────────────────────────────── */

const overlaps = (a0: number, a1: number, b0: number, b1: number) => a0 < b1 && b0 < a1

export interface Summary {
  revenue: number
  collected: number
  appointments: number
  seats: number
  walkIns: number
  noShows: number
  late: number
  /** Booked staff time over available staff time, percent. */
  utilisation: number
  byCategory: { label: Category; value: number }[]
  /** Day: cumulative revenue by start hour. Week: revenue per day. */
  revenueSeries: number[]
  /** Day: bookings starting each hour. Week: bookings per day. */
  bookingSeries: number[]
}

const minutesOf = (w: WalkIn) => serviceById(w.serviceId).minutes

/** Staff minutes on shift, net of breaks and training, for the given days. */
export function availableMinutes(staffId: StaffId, days: number[], blocks: Block[]) {
  const s = staffById(staffId)
  let total = 0
  for (const day of days) {
    if (s.daysOff.includes(day)) continue
    const [open, close] = hoursOf(day)
    total += Math.max(0, Math.min(close, s.shift[1]) - Math.max(open, s.shift[0]))
    total -= blocks
      .filter((b) => b.day === day && b.staffId === staffId && (b.label === 'Break' || b.label === 'Training'))
      .reduce((sum, b) => sum + (b.end - b.start), 0)
  }
  return total
}

export function summarize(bookings: Booking[], walkIns: WalkIn[], blocks: Block[], days: number[]): Summary {
  const inDays = bookings.filter((b) => days.includes(b.day))
  const served = walkIns.filter((w) => days.includes(w.day) && w.state !== 'waiting')
  const earning = inDays.filter((b) => b.status !== 'no-show')
  const revenue = earning.reduce((sum, b) => sum + valueOf(b), 0) + served.reduce((sum, w) => sum + serviceById(w.serviceId).price, 0)
  const collected =
    earning.filter((b) => b.status === 'completed' || b.status === 'checked-in').reduce((sum, b) => sum + valueOf(b), 0) +
    served.filter((w) => w.state === 'done').reduce((sum, w) => sum + serviceById(w.serviceId).price, 0)
  const appointments = inDays.filter((b) => !b.seats).length
  const seats = inDays.reduce((sum, b) => sum + (b.seats?.booked ?? 0), 0)

  const byCategory = CATEGORIES.map((label) => ({
    label,
    value:
      earning.filter((b) => serviceById(b.serviceId).category === label).reduce((sum, b) => sum + valueOf(b), 0) +
      served.filter((w) => serviceById(w.serviceId).category === label).reduce((sum, w) => sum + serviceById(w.serviceId).price, 0),
  }))

  const bookedMinutes = inDays.reduce((sum, b) => sum + (b.end - b.start), 0) + served.reduce((sum, w) => sum + minutesOf(w), 0)
  const available = STAFF.reduce((sum, s) => sum + availableMinutes(s.id, days, blocks), 0)

  let revenueSeries: number[]
  let bookingSeries: number[]
  if (days.length === 1) {
    const hours = Array.from({ length: 13 }, (_, i) => OPEN + i * 60)
    let running = 0
    revenueSeries = hours.map((h) => {
      running +=
        earning.filter((b) => b.start >= h && b.start < h + 60).reduce((sum, b) => sum + valueOf(b), 0) +
        served.filter((w) => (w.start ?? 0) >= h && (w.start ?? 0) < h + 60).reduce((sum, w) => sum + serviceById(w.serviceId).price, 0)
      return running
    })
    bookingSeries = hours.map((h) => inDays.filter((b) => b.start >= h && b.start < h + 60).reduce((sum, b) => sum + (b.seats?.booked ?? 1), 0))
  } else {
    revenueSeries = days.map((d) => summarize(bookings, walkIns, blocks, [d]).revenue)
    bookingSeries = days.map((d) => inDays.filter((b) => b.day === d).reduce((sum, b) => sum + (b.seats?.booked ?? 1), 0))
  }

  return {
    revenue,
    collected,
    appointments,
    seats,
    walkIns: walkIns.filter((w) => days.includes(w.day)).length,
    noShows: inDays.filter((b) => b.status === 'no-show').length,
    late: inDays.filter((b) => b.status === 'late').length,
    utilisation: available ? (bookedMinutes / available) * 100 : 0,
    byCategory,
    revenueSeries,
    bookingSeries,
  }
}

export interface Slot {
  day: number
  start: number
  end: number
  roomId: RoomId
}

/**
 * Free slots for a service with one staff member on one day, on the half hour, from `after`:
 * the staff member is on shift and free, and one of the service's rooms is free.
 */
export function freeSlots(opts: {
  bookings: Booking[]
  walkIns: WalkIn[]
  blocks: Block[]
  day: number
  serviceId: ServiceId
  staffId: StaffId
  after: number
  ignoreId?: string
  limit?: number
}): Slot[] {
  const { bookings, walkIns, blocks, day, serviceId, staffId, after, ignoreId, limit = 8 } = opts
  const staff = staffById(staffId)
  const service = serviceById(serviceId)
  if (staff.daysOff.includes(day)) return []
  const [open, close] = hoursOf(day)
  const from = Math.max(open, staff.shift[0])
  const to = Math.min(close, staff.shift[1])
  const sameDay = bookings.filter((b) => b.day === day && b.id !== ignoreId && b.status !== 'no-show')
  const walks = walkIns.filter((w) => w.day === day && w.start != null && w.end != null)
  const dayBlocks = blocks.filter((b) => b.day === day)
  const busy = (start: number, end: number, match: (x: { roomId?: RoomId; staffId?: StaffId }) => boolean) =>
    sameDay.some((b) => match(b) && overlaps(start, end, b.start, b.end)) ||
    walks.some((w) => match(w) && overlaps(start, end, w.start as number, w.end as number)) ||
    dayBlocks.some((b) => (b.all || match(b)) && overlaps(start, end, b.start, b.end))

  const slots: Slot[] = []
  for (let start = Math.ceil(Math.max(after, from) / 30) * 30; start + service.minutes <= to && slots.length < limit; start += 30) {
    const end = start + service.minutes
    if (busy(start, end, (x) => x.staffId === staffId)) continue
    const room = service.rooms.find((roomId) => !busy(start, end, (x) => x.roomId === roomId))
    if (room) slots.push({ day, start, end, roomId: room })
  }
  return slots
}

/** Free slots from now on: the rest of today first, then the following days of the week. */
export function upcomingSlots(opts: {
  bookings: Booking[]
  walkIns: WalkIn[]
  blocks: Block[]
  fromDay: number
  now: number
  serviceId: ServiceId
  staffId: StaffId
  ignoreId?: string
  perDay?: number
  limit?: number
}): Slot[] {
  const { fromDay, now, perDay = 4, limit = 10, ...rest } = opts
  const out: Slot[] = []
  for (let day = fromDay; day < 7 && out.length < limit; day++) {
    const after = day === TODAY ? now : hoursOf(day)[0]
    out.push(...freeSlots({ ...rest, day, after, limit: Math.min(perDay, limit - out.length) }))
  }
  return out
}

/** "Today · 17:00–18:00 · Room 3" or "Fri 13 Nov · 08:00–09:00 · Room 1" */
export const slotLabel = (s: Slot) => `${s.day === TODAY ? 'Today' : WEEK[s.day].long} · ${clock(s.start)}–${clock(s.end)} · ${roomById(s.roomId).name}`

/* ── Formatting ──────────────────────────────────────────────────────────────────── */

/** 450000 → "Rp 450.000" */
export const rupiah = (value: number) => `Rp ${formatNumber(Math.round(value), { locale: 'id-ID' })}`

/** 870 → "14:30" */
export const clock = (minutes: number) => {
  const m = Math.round(minutes)
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

/** 51607 → "14:20:07" */
export const clockSeconds = (seconds: number) => {
  const s = Math.floor(seconds)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(Math.floor(s / 3600) % 24)}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`
}

export const firstName = (name: string) => name.replace(/^dr\.\s+/, '').split(' ')[0]
