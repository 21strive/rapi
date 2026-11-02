/** Sample data for the Projects example: 36 client projects at a small studio. */

export type ProjectStatus = 'pending' | 'progress' | 'done'

export interface Project {
  id: number
  name: string
  client: string
  type: string
  team: string[]
  /** ISO date, YYYY-MM-DD */
  due: string
  budget: number
  status: ProjectStatus
  tags: string[]
}

export const STATUS_LABEL: Record<ProjectStatus, string> = {
  pending: 'Pending',
  progress: 'In progress',
  done: 'Done',
}

export const TAGS = [
  { name: 'Web', color: 'var(--r-identity-1-text)' },
  { name: 'Mobile', color: 'var(--r-identity-2-text)' },
  { name: 'Redesign', color: 'var(--r-identity-3-text)' },
  { name: 'Retainer', color: 'var(--r-identity-7-text)' },
  { name: 'Urgent', color: 'var(--r-identity-4-text)' },
  { name: 'Internal', color: 'var(--r-identity-6-text)' },
]

const PEOPLE = [
  'Kim Ji-soo',
  'Rahmat Hidayat',
  'Siti Rahayu',
  'Budi Santoso',
  'Dewi Lestari',
  'Agus Pratama',
  'Putri Ayu',
  'Andi Wijaya',
  'Maya Sari',
  'Fajar Nugroho',
  'Rina Kurnia',
  'Tommy Hartono',
  'Sarah Chen',
  'Liam Walker',
  'Nadia Putri',
  'Marcus Webb',
]

/** name, client, type */
const ROWS: [string, string, string][] = [
  ['Pasar Pagi', 'Koperasi Tani Maju', 'Ecommerce'],
  ['Kirim Cepat', 'Agus Cargo', 'Courier logistics app'],
  ['Ruang Tamu', 'Rumah Kreatif', 'Company profile'],
  ['Dompet Kita', 'Bank Mandala', 'Finance website'],
  ['Laut Biru', 'Hotel Laut Biru', 'Booking app'],
  ['Kopi Senja', 'Kopi Senja', 'Ecommerce'],
  ['Teman Belajar', 'Yayasan Cerdas', 'Education platform'],
  ['Sehatku', 'Klinik Sehat Bunda', 'Booking app'],
  ['Batik Ayu', 'Toko Batik Ayu', 'Ecommerce'],
  ['Antar Jemput', 'Nurul Travel', 'Travel app'],
  ['Kas Kecil', 'CV Maju Bersama', 'Finance dashboard'],
  ['Kota Lama', 'Dinas Pariwisata', 'Travel app'],
  ['Bengkel Online', 'Bengkel Pak Darto', 'Booking app'],
  ['Cerita Anak', 'Penerbit Pelangi', 'Education platform'],
  ['Arsip Kantor', 'PT Sinar Jaya', 'Internal tool'],
  ['Mitra Dagang', 'Handayani Finance', 'Finance website'],
  ['Gudang Rapi', 'Logistik Nusantara', 'Courier logistics app'],
  ['Sewa Kamera', 'Studio Lensa', 'Booking app'],
  ['Resep Nenek', 'Dapur Ibu', 'Company profile'],
  ['Galeri Kecil', 'Galeri Kecil', 'Company profile'],
  ['Koin Kita', 'Coinmu', 'Cryptocurrency'],
  ['Kurir Hijau', 'Kurir Hijau', 'Courier logistics app'],
  ['Satu Atap', 'Rumah Kos Melati', 'Booking app'],
  ['Kebun Kota', 'Komunitas Kebun Kota', 'Company profile'],
  ['Bayar Mudah', 'Bank Mandala', 'Finance dashboard'],
  ['Toko Sepeda', 'Sepeda Ontel Jaya', 'Ecommerce'],
  ['Langkah Sehat', 'Klinik Sehat Bunda', 'Education platform'],
  ['Panen Raya', 'Koperasi Tani Maju', 'Sales management'],
  ['Halte Info', 'Dinas Perhubungan', 'Travel app'],
  ['Pelangi Cafe', 'Pelangi Cafe', 'Ecommerce'],
  ['Neraca Tim', 'Studio internal', 'Internal tool'],
  ['Tukar Valas', 'Coinmu', 'Cryptocurrency'],
  ['Jualan Live', 'Toko Batik Ayu', 'Sales management'],
  ['Perjalanan Dinas', 'PT Sinar Jaya', 'Travel app'],
  ['Laporan Pajak', 'Handayani Finance', 'Finance dashboard'],
  ['Katalog Mebel', 'Jodir Furniture', 'Ecommerce'],
]

const TODAY = '2026-11-02'

/** Spread due dates from early October 2026 into January 2027, in no tidy order. */
function dueDate(i: number): string {
  const start = Date.UTC(2026, 9, 3)
  const offset = (i * 53 + i * i * 7) % 112
  return new Date(start + offset * 86_400_000).toISOString().slice(0, 10)
}

/** Work that was due is mostly done; a couple of projects ran late. */
function statusFor(i: number, due: string): ProjectStatus {
  if (due < TODAY) return i % 6 === 0 ? 'progress' : i % 7 === 0 ? 'pending' : 'done'
  if (i % 9 === 0) return 'done'
  return (i * 5 + Math.floor(i / 3)) % 2 ? 'progress' : 'pending'
}

export const projects: Project[] = ROWS.map(([name, client, type], i) => {
  const teamSize = 2 + ((i * 5) % 4)
  const team = Array.from({ length: teamSize }, (_, k) => PEOPLE[(i * 3 + k * 5) % PEOPLE.length])
  const tags = [TAGS[(i * 3) % 4].name]
  if (i % 5 === 0) tags.push('Urgent')
  if (type === 'Internal tool') tags.push('Internal')
  if (i % 4 === 1 && !tags.includes('Mobile')) tags.push('Mobile')
  const due = dueDate(i)
  return {
    id: 1000 + i,
    name,
    client,
    type,
    team: [...new Set(team)],
    due,
    budget: 4000 + Math.round((((i * 37 + i * i * 11) % 47) * 960) / 100) * 100,
    status: statusFor(i, due),
    tags: [...new Set(tags)],
  }
})

export const PROJECT_TYPES = [...new Set(ROWS.map((r) => r[2]))].sort()
