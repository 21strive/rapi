/** Sample data for the Sales overview example. Numbers are made up but add up. */

export const kpis = {
  revenue: { value: 25912, trend: 1.9 },
  insight: { value: 129521, trend: -1.2 },
  balance: {
    value: 9421642,
    segments: [
      { label: 'Profit', value: 5120000, color: 'var(--r-chart-1)' },
      { label: 'Total earning', value: 2380000, color: 'var(--r-chart-1-soft)' },
      { label: 'Total target', value: 1921642, color: 'color-mix(in srgb, var(--r-chart-1) 12%, var(--r-chart-track))' },
    ],
  },
}

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** Two columns a month: the 1st–15th and the 16th to month end. */
export const summaryLabels = months.flatMap((m) => [`${m} 1–15`, `${m} 16–end`])
export const summaryTicks = months.flatMap((m) => [m, ''])

export const summarySales = [
  18, 24, 21, 29, 26, 33, 22, 28, 31, 38, 47, 58, 52, 61, 44, 49, 36, 42, 39, 51, 57, 63, 48, 55,
].map((v) => v * 1000)

export const summaryInsight = [
  9, 6, 11, 8, 12, 7, 13, 9, 10, 8, 14, 12, 11, 9, 13, 10, 12, 8, 9, 11, 13, 10, 12, 9,
].map((v) => v * 1000)

export const categories = [
  { label: 'Ecommerce', value: 5120 },
  { label: 'Brand ambassador', value: 2094 },
  { label: 'Direct buy', value: 1000 },
]

export type PaymentStatus = 'Paid' | 'Pending' | 'Refunded' | 'Failed'

export interface Transaction {
  id: string
  customer: string
  email: string
  product: string
  date: string
  amount: number
  status: PaymentStatus
}

export const transactions: Transaction[] = [
  {
    id: 'INV-2051',
    customer: 'Dewi Lestari',
    email: 'dewi@lestari.id',
    product: 'Linen shirt, sand',
    date: '2026-06-15',
    amount: 48.5,
    status: 'Paid',
  },
  {
    id: 'INV-2050',
    customer: 'Marcus Webb',
    email: 'marcus.webb@mail.com',
    product: 'Canvas tote',
    date: '2026-06-15',
    amount: 24,
    status: 'Pending',
  },
  {
    id: 'INV-2049',
    customer: 'Rahmat Hidayat',
    email: 'rahmat.h@kopisenja.co',
    product: 'Leather card holder',
    date: '2026-06-14',
    amount: 36,
    status: 'Paid',
  },
  {
    id: 'INV-2048',
    customer: 'Sarah Chen',
    email: 'sarah@chenstudio.com',
    product: 'Wool beanie, charcoal',
    date: '2026-06-14',
    amount: 19.9,
    status: 'Refunded',
  },
  {
    id: 'INV-2047',
    customer: 'Putri Ayu',
    email: 'putri.ayu@gmail.com',
    product: 'Denim jacket',
    date: '2026-06-13',
    amount: 89,
    status: 'Paid',
  },
  {
    id: 'INV-2046',
    customer: 'Liam Walker',
    email: 'liam@walker.dev',
    product: 'Running socks, 3 pack',
    date: '2026-06-13',
    amount: 15,
    status: 'Failed',
  },
]

export const heatmapHours = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00']
export const heatmapDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

/** Orders per two-hour slot, one row per slot, one column per day. */
export const heatmapOrders = [
  [12, 14, 11, 15, 18, 26, 22],
  [24, 22, 27, 25, 30, 41, 38],
  [38, 35, 40, 37, 44, 52, 47],
  [29, 31, 28, 33, 36, 48, 44],
  [33, 30, 34, 36, 42, 55, 50],
  [41, 44, 39, 46, 58, 63, 54],
  [22, 25, 21, 27, 35, 39, 30],
]
