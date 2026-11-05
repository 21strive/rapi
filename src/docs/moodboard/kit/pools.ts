/**
 * Realistic data for the specimens: people, places and organisations from Indonesia and
 * elsewhere. Companies, banks, airlines and products are invented for 21 Strive's samples; places
 * are real. Never lorem ipsum.
 */
import type { Zone } from './format'

export interface Person {
  name: string
  role: string
  team: string
}

export const people: Person[] = [
  { name: 'Ayu Lestari', role: 'Treasury lead', team: 'Finance' },
  { name: 'Rizky Pratama', role: 'Site reliability engineer', team: 'Platform' },
  { name: 'Sari Wulandari', role: 'Payments analyst', team: 'Finance' },
  { name: 'Dimas Pratama', role: 'Flight dynamics', team: 'Mission' },
  { name: 'Dewi Anggraini', role: 'Head of risk', team: 'Risk' },
  { name: 'Kevin Tan', role: 'Backend engineer', team: 'Platform' },
  { name: 'Fajar Nugroho', role: 'Security analyst', team: 'SOC' },
  { name: 'Rina Hartono', role: 'Product designer', team: 'Design' },
  { name: 'Lina Wijaya', role: 'Operations manager', team: 'Logistics' },
  { name: 'Fikri Ramadhan', role: 'Dispatcher', team: 'Fleet' },
  { name: 'Nadia Rahman', role: 'Clinical nurse', team: 'Ward 3' },
  { name: 'Yoga Pranata', role: 'Grid operator', team: 'Control room' },
  { name: 'Bima Prasetyo', role: 'Launch director', team: 'Mission' },
  { name: 'Andika Saputra', role: 'Data engineer', team: 'Data' },
  { name: 'Putri Maharani', role: 'Customer success', team: 'Support' },
  { name: 'Maya Kartika', role: 'Compliance officer', team: 'Risk' },
  { name: 'Hendra Wijaya', role: 'Warehouse lead', team: 'Logistics' },
  { name: 'Grace Liu', role: 'FX trader', team: 'Markets' },
  { name: 'Arjun Mehta', role: 'Solutions architect', team: 'Platform' },
  { name: 'Sofia Marques', role: 'Partner manager', team: 'Partnerships' },
  { name: 'Daniel Okafor', role: 'Network engineer', team: 'Infrastructure' },
  { name: 'Ahmad Fauzi', role: 'Farm manager', team: 'Agronomy' },
  { name: 'Ni Luh Putu Sari', role: 'Front office', team: 'Hospitality' },
  { name: 'Marthen Wanggai', role: 'Port supervisor', team: 'Maritime' },
  { name: 'Teuku Rahmat', role: 'Field engineer', team: 'Energy' },
  { name: 'Butet Simanjuntak', role: 'Auditor', team: 'Internal audit' },
  { name: 'Andi Makkasau', role: 'Ground station operator', team: 'Mission' },
  { name: 'Clara Siahaan', role: 'Pharmacist', team: 'Pharmacy' },
  { name: 'Wahyu Setiawan', role: 'Train controller', team: 'Transit' },
  { name: 'Laras Wulandari', role: 'Editor', team: 'Newsroom' },
  { name: 'Kezia Pattiasina', role: 'Store manager', team: 'Retail' },
  { name: 'Yusuf Hakim', role: 'Incident commander', team: 'SOC' },
]

export interface City {
  name: string
  province: string
  zone: Zone
  /** IATA code of the main airport. */
  airport: string
}

export const cities: City[] = [
  { name: 'Jakarta', province: 'DKI Jakarta', zone: 'WIB', airport: 'CGK' },
  { name: 'Surabaya', province: 'Jawa Timur', zone: 'WIB', airport: 'SUB' },
  { name: 'Bandung', province: 'Jawa Barat', zone: 'WIB', airport: 'BDO' },
  { name: 'Medan', province: 'Sumatera Utara', zone: 'WIB', airport: 'KNO' },
  { name: 'Semarang', province: 'Jawa Tengah', zone: 'WIB', airport: 'SRG' },
  { name: 'Yogyakarta', province: 'DI Yogyakarta', zone: 'WIB', airport: 'YIA' },
  { name: 'Palembang', province: 'Sumatera Selatan', zone: 'WIB', airport: 'PLM' },
  { name: 'Pontianak', province: 'Kalimantan Barat', zone: 'WIB', airport: 'PNK' },
  { name: 'Denpasar', province: 'Bali', zone: 'WITA', airport: 'DPS' },
  { name: 'Makassar', province: 'Sulawesi Selatan', zone: 'WITA', airport: 'UPG' },
  { name: 'Balikpapan', province: 'Kalimantan Timur', zone: 'WITA', airport: 'BPN' },
  { name: 'Manado', province: 'Sulawesi Utara', zone: 'WITA', airport: 'MDC' },
  { name: 'Kupang', province: 'Nusa Tenggara Timur', zone: 'WITA', airport: 'KOE' },
  { name: 'Ambon', province: 'Maluku', zone: 'WIT', airport: 'AMQ' },
  { name: 'Jayapura', province: 'Papua', zone: 'WIT', airport: 'DJJ' },
  { name: 'Singapore', province: 'Singapore', zone: 'SGT', airport: 'SIN' },
]

/** Invented organisations used across Rapi's samples. */
export const companies = [
  'PT Nusantara Logistik',
  'PT Sinar Armada',
  'PT Samudra Kargo',
  'PT Sagara Daya',
  'PT Lentera Telekomunikasi',
  'PT Kopi Lereng',
  'PT Graha Niaga',
  'PT Cahaya Rantai',
  'PT Tirta Baja',
  'PT Merapi Semen',
  'PT Kurir Kilat',
  'PT Sawit Lestari',
  'Kopra Labs',
  'Koperasi Tani Sumber Rejeki',
  'CV Rotan Cirebon',
  'Toko Kelontong Bu Ratna',
] as const

export const banks = ['Arunika Bank', 'Bank Sagara', 'Bank Lestari Jaya', 'Bank Pesisir', 'Kencana Syariah'] as const

/** 21 Strive's own product names in the samples. */
export const products = ['Simpul', 'Sesi', 'Racik', 'Pakem', 'Rapi'] as const

export const airline = 'Nusa Air'

export const services = [
  'api-gateway',
  'payments-core',
  'ledger',
  'auth',
  'notifications',
  'search',
  'risk-engine',
  'kyc-worker',
  'settlement',
  'edge-cache',
  'billing',
  'ingest',
] as const

export const regions = ['ap-southeast-3', 'ap-southeast-1', 'eu-west-1', 'us-east-1'] as const

/** Indonesian number plates by region code. */
export const plates = ['B 1924 KZT', 'L 8812 UA', 'D 4407 RX', 'BK 1288 ND', 'DK 3051 FB', 'DD 7710 KM', 'KT 2219 PA', 'AB 6632 JT'] as const
