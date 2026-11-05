/** Writing help, summaries, translation, replies and digests. */
import type { MoodEntry } from '../../types'
import { digest, ghost, replies, thread, translate } from './patterns'

export const variantsC: MoodEntry[] = [
  /* ── Tab to accept ───────────────────────────────────────────────────────────────── */
  ghost({
    id: 'ask-ghost-subject',
    size: '3x1',
    domain: 'workspace',
    name: 'Subject line, suggested',
    props: {
      label: 'Subject',
      context: 'Reply to Lina Wijaya · PT Samudra Kargo',
      initial: 'Re: Pickup for PO-2611 mo',
      completions: [
        'Re: Pickup for PO-2611 moved to Friday 6 Nov, 08:00',
        'Re: Pickup for PO-2611 needs a new truck plate',
        'Revised invoice for PO-2611',
      ],
    },
  }),
  ghost({
    id: 'ask-ghost-commit',
    size: '2x1',
    domain: 'devops',
    surface: 'dark',
    name: 'Commit message, suggested',
    props: {
      label: 'Commit',
      context: 'payments-core · 3 files',
      mono: true,
      initial: 'fix(settlement): ',
      completions: [
        'fix(settlement): retry the Bank Pesisir file once before failing',
        'fix(settlement): skip duplicate lines in the acquirer file',
        'chore: raise the settlement retry limit to 3',
      ],
    },
  }),
  ghost({
    id: 'ask-ghost-note',
    size: '4x1',
    domain: 'health',
    name: 'Clinical note, suggested',
    props: {
      label: 'Note',
      context: 'Bed 12 · Hasan, 64 · after the 14:00 round',
      initial: 'BP 140/90, settled after',
      completions: [
        'BP 140/90, settled after amlodipine. Recheck at 16:00; call the doctor if above 160/100.',
        'BP stable, eating well, walked to the chair twice.',
        'Asked about going home; plan for Saturday if BP holds.',
      ],
    },
  }),
  ghost({
    id: 'ask-ghost-transfer',
    size: '2x1',
    domain: 'payments',
    name: 'Transfer note, suggested',
    props: {
      label: 'Note',
      context: 'To CV Rotan Cirebon · Rp 18.750.000',
      agent: 'Simpul',
      initial: 'INV-2611',
      completions: ['INV-2611 rattan chairs, 25 pcs, paid in full', 'INV-2611 deposit 50%', 'INV-2611 balance after delivery'],
    },
  }),

  /* ── Thread in three lines ───────────────────────────────────────────────────────── */
  thread({
    id: 'ask-thread-ops',
    size: '2x2',
    domain: 'logistics',
    name: 'Ops channel, summarised',
    props: {
      channel: '#ops-surabaya',
      since: 'since 07:40',
      messages: [
        { who: 'Hendra Wijaya', at: '07:40', text: 'Forklift 2 at Rungkut won’t start. Hydraulics again.' },
        { who: 'Lina Wijaya', at: '07:52', text: 'How many pallets are waiting on it?' },
        { who: 'Hendra Wijaya', at: '07:55', text: 'About 40, the Samudra Kargo order. The technician says Saturday at the earliest.' },
        { who: 'Fikri Ramadhan', at: '08:10', text: 'I can take a truck to Gresik if they can load there.' },
        { who: 'Lina Wijaya', at: '08:14', text: 'Gresik has a free forklift until 15:00.' },
        { who: 'Hendra Wijaya', at: '08:30', text: 'OK, moving the 40 pallets to Gresik now.' },
        { who: 'Lina Wijaya', at: '09:02', text: 'Told Samudra Kargo the pickup is from Gresik, same time.' },
        { who: 'Fikri Ramadhan', at: '10:45', text: 'All 40 in Gresik. Truck back at Rungkut by 12:00.' },
        { who: 'Hendra Wijaya', at: '11:20', text: 'Forklift part ordered, it arrives Friday.' },
        { who: 'Lina Wijaya', at: '13:05', text: 'Sunday we need overtime for the backlog. Who signs?' },
        { who: 'Hendra Wijaya', at: '13:12', text: 'Not me, I’m off on Sunday.' },
        { who: 'Fikri Ramadhan', at: '13:40', text: 'Ask Pak Andi? He signed it last time.' },
      ],
      summary: [
        { text: 'Forklift 2 at Rungkut is down until Saturday; the part arrives Friday.', cites: [1, 3, 9] },
        { text: 'The 40 Samudra Kargo pallets moved to Gresik, and the customer knows.', cites: [6, 7, 8] },
        { text: 'Open: nobody has signed Sunday’s overtime yet.', cites: [10, 11, 12] },
      ],
    },
  }),
  thread({
    id: 'ask-thread-incident',
    size: '3x2',
    domain: 'security',
    surface: 'dark',
    name: 'Incident channel, summarised',
    props: {
      channel: '#inc-482',
      since: 'since 14:21',
      messages: [
        { who: 'Yusuf Hakim', at: '14:21', text: 'Paging: card payment failures in ap-southeast-3, 3% and rising.' },
        { who: 'Rizky Pratama', at: '14:24', text: 'Started after the 14:15 deploy of payments-core v2.42.0.' },
        { who: 'Fajar Nugroho', at: '14:26', text: 'No sign of attack traffic. It’s a timeout to the Bank Pesisir gateway.' },
        { who: 'Rizky Pratama', at: '14:31', text: 'Rolling back to v2.41.3.' },
        { who: 'Yusuf Hakim', at: '14:33', text: 'Status page set to Investigating.' },
        { who: 'Kevin Tan', at: '14:40', text: 'The connection pool limit in v2.42.0 is 20; it was 200. That’s it.' },
        { who: 'Rizky Pratama', at: '14:52', text: 'Rollback done. Errors back to 0.2%.' },
        { who: 'Sari Wulandari', at: '14:58', text: 'Failed payments were not charged; I checked 50 of them.' },
        { who: 'Yusuf Hakim', at: '15:01', text: 'Moving to Monitoring. Next update at 16:00.' },
        { who: 'Kevin Tan', at: '15:10', text: 'Fix ready: pool limit back to 200, plus an alert on pool saturation.' },
        { who: 'Dewi Anggraini', at: '15:20', text: 'Do we tell the bank? Their gateway was fine.' },
        { who: 'Yusuf Hakim', at: '15:22', text: 'Yes, a short note. Postmortem Monday 10:00.' },
      ],
      summary: [
        { text: 'A pool limit of 20 in v2.42.0 made 3% of card payments time out from 14:15.', cites: [2, 3, 6] },
        { text: 'Rolled back at 14:52; the failed payments were not charged.', cites: [7, 8] },
        { text: 'Next: the fix with a pool alert, a note to Bank Pesisir, the postmortem on Mon 9 Nov at 10:00.', cites: [10, 11, 12] },
      ],
    },
  }),
  thread({
    id: 'ask-thread-supplier',
    size: '2x2',
    domain: 'commerce',
    surface: 'muted',
    name: 'Supplier emails, summarised',
    props: {
      channel: 'PT Kopi Lereng',
      since: 'since 28 Oct',
      noun: 'emails',
      messages: [
        { who: 'Kezia Pattiasina', at: '28 Oct', text: 'Can you quote 300 kg of Gayo arabica for December?' },
        { who: 'Agus · Kopi Lereng', at: '29 Oct', text: 'Rp 148.000 per kg, roasted within 7 days of shipping.' },
        { who: 'Kezia Pattiasina', at: '29 Oct', text: 'Any discount above 250 kg?' },
        { who: 'Agus · Kopi Lereng', at: '30 Oct', text: '5% off above 250 kg, so Rp 140.600 per kg.' },
        { who: 'Kezia Pattiasina', at: '31 Oct', text: 'Can you deliver to Ambon?' },
        { who: 'Agus · Kopi Lereng', at: '1 Nov', text: 'Yes, by sea from Surabaya, 9 to 12 days, Rp 3.200.000 freight.' },
        { who: 'Kezia Pattiasina', at: '2 Nov', text: 'Could we split it into two shipments?' },
        { who: 'Agus · Kopi Lereng', at: '3 Nov', text: 'Two shipments add Rp 1.100.000 freight.' },
        { who: 'Agus · Kopi Lereng', at: '4 Nov', text: 'The price holds until 15 Nov.' },
      ],
      summary: [
        { text: '300 kg of Gayo arabica at Rp 140.600 per kg after the 5% volume discount.', cites: [2, 4] },
        { text: 'Sea freight to Ambon is Rp 3.200.000, 9 to 12 days; two shipments add Rp 1.100.000.', cites: [6, 8] },
        { text: 'The price holds until 15 Nov; nothing is ordered yet.', cites: [9] },
      ],
    },
  }),
  thread({
    id: 'ask-thread-reports',
    size: '2x2',
    domain: 'civic',
    name: 'Resident reports, summarised',
    props: {
      channel: 'Jl. Kaliurang',
      since: 'since 1 Nov',
      noun: 'reports',
      total: 48,
      messages: [
        { who: 'Resident · RT 03', at: '1 Nov 06:10', text: 'Lubang besar di depan minimarket km 7, motor jatuh tadi pagi.' },
        { who: 'Ojek driver', at: '2 Nov 17:42', text: 'Lubang di km 7 makin lebar setelah hujan.' },
        { who: 'Resident · RT 05', at: '2 Nov 21:15', text: 'Lampu jalan km 6,5 sampai km 7 mati tiga malam.' },
        { who: 'Student', at: '3 Nov 08:02', text: 'Pothole near km 7 by the bus stop, two bikes fell today.' },
        { who: 'Resident · RT 03', at: '3 Nov 16:30', text: 'Air menggenang di km 7 setiap hujan, saluran tersumbat sampah.' },
        { who: 'Shop owner', at: '3 Nov 22:05', text: 'Lampu jalan mati, gelap sekali dekat kampus.' },
        { who: 'Resident · RT 07', at: '4 Nov 07:20', text: 'Truk parkir di bahu jalan km 8, bikin macet pagi.' },
        { who: 'Resident · RT 03', at: '4 Nov 10:11', text: 'Lubang km 7 sudah diberi tanda oleh warga.' },
        { who: 'Ojek driver', at: '4 Nov 15:48', text: 'Saluran di km 7 masih tersumbat.' },
        { who: 'Student', at: '4 Nov 20:33', text: 'Street lights at km 6.5 are still off tonight.' },
      ],
      summary: [
        { text: 'A pothole at km 7 has made two riders fall; residents marked it on 4 Nov.', cites: [1, 4, 8] },
        { text: 'Street lights from km 6.5 to km 7 have been off for three nights.', cites: [3, 6, 10] },
        { text: 'The drain at km 7 is blocked with rubbish and floods in every rain.', cites: [5, 9] },
      ],
    },
  }),

  /* ── Translate ID ↔ EN ───────────────────────────────────────────────────────────── */
  translate({
    id: 'ask-translate-buyer',
    size: '2x2',
    domain: 'commerce',
    name: 'Buyer chat, translated',
    props: {
      label: 'Chat with a buyer',
      from: 'id',
      phrases: [
        {
          id: 'Barangnya sudah kami kirim kemarin, nomor resinya KK-8812406.',
          idCasual: 'Barangnya udah dikirim kemarin ya, resinya KK-8812406.',
          en: 'We sent your order yesterday; the tracking number is KK-8812406.',
          matchId: 'kirim|dikirim|resi',
          matchEn: 'sent|shipped|tracking',
          keep: ['KK-8812406'],
        },
        {
          id: 'Mohon maaf, ukuran 42 sedang kosong. Apakah ukuran 43 tidak apa-apa?',
          idCasual: 'Maaf ya, ukuran 42 lagi kosong. Ukuran 43 gimana?',
          en: 'Sorry, size 42 is out of stock. Would size 43 be all right?',
          matchId: 'ukuran|kosong|habis',
          matchEn: 'size|out of stock|sold out',
          keep: ['42', '43'],
        },
        {
          id: 'Total pesanan Anda Rp 450.000, sudah termasuk ongkos kirim ke Ambon.',
          idCasual: 'Totalnya Rp 450.000 ya, udah sama ongkir ke Ambon.',
          en: 'Your order comes to Rp 450.000, including shipping to Ambon.',
          matchId: 'total|harga|ongkir|ongkos',
          matchEn: 'total|price|cost|comes to|shipping',
          keep: ['Rp 450.000', 'Ambon'],
        },
        {
          id: 'Terima kasih sudah berbelanja, semoga sepatunya cocok.',
          idCasual: 'Makasih udah belanja ya, semoga sepatunya pas.',
          en: 'Thank you for your order; we hope the shoes fit well.',
          matchId: 'terima kasih|makasih|belanja',
          matchEn: 'thank',
        },
      ],
    },
  }),
  translate({
    id: 'ask-translate-notice',
    size: '3x1',
    domain: 'civic',
    name: 'Notice, translated',
    props: {
      label: 'Notice for residents',
      from: 'id',
      phrases: [
        {
          id: 'Pengambilan sampah hari Jumat dipindah ke Sabtu 7 November karena truk sedang diperbaiki.',
          en: 'Friday’s rubbish collection moves to Saturday 7 November while the truck is being repaired.',
          matchId: 'sampah|pengambilan',
          matchEn: 'rubbish|garbage|trash|collection',
          keep: ['7 November'],
        },
        {
          id: 'Vaksinasi gratis untuk lansia di balai warga, Rabu 11 November, 08:00–12:00 WIB.',
          en: 'Free vaccination for older residents at the community hall, Wednesday 11 November, 08:00–12:00 WIB.',
          matchId: 'vaksin|lansia',
          matchEn: 'vaccin|older|elderly',
          keep: ['11 November', '08:00–12:00 WIB'],
        },
        {
          id: 'Jalan Kenari ditutup untuk kerja bakti hari Minggu pagi.',
          en: 'Jalan Kenari is closed on Sunday morning for the community clean-up.',
          matchId: 'ditutup|kerja bakti|jalan',
          matchEn: 'closed|clean.?up|road|street',
          keep: ['Jalan Kenari'],
        },
      ],
    },
  }),
  translate({
    id: 'ask-translate-label',
    size: '1x1',
    domain: 'health',
    name: 'Medicine label, translated',
    props: {
      label: 'Medicine label',
      layout: 'flip',
      phrases: [
        { id: 'Diminum 3 kali sehari sesudah makan.', en: 'Take 3 times a day after meals.', matchId: 'minum', matchEn: 'take' },
        { id: 'Habiskan antibiotik walaupun sudah merasa sehat.', en: 'Finish the antibiotics even when you feel better.', matchId: 'antibiotik', matchEn: 'antibiotic' },
        { id: 'Simpan di bawah 25 °C, jauhkan dari anak-anak.', en: 'Store below 25 °C, out of reach of children.', matchId: 'simpan', matchEn: 'store' },
      ],
    },
  }),
  translate({
    id: 'ask-translate-platform',
    size: '1x1',
    domain: 'transit',
    surface: 'dark',
    name: 'Announcement, translated',
    props: {
      label: 'Platform 2 · Gambir',
      layout: 'flip',
      phrases: [
        { id: 'Kereta tujuan Bandung terlambat 15 menit.', en: 'The train to Bandung is 15 minutes late.', matchId: 'terlambat', matchEn: 'late' },
        { id: 'Mohon berdiri di belakang garis kuning.', en: 'Please stand behind the yellow line.', matchId: 'garis', matchEn: 'line' },
        { id: 'Kereta berikutnya berangkat dari jalur 4.', en: 'The next train leaves from platform 4.', matchId: 'jalur', matchEn: 'platform' },
      ],
    },
  }),

  /* ── Suggested replies ───────────────────────────────────────────────────────────── */
  replies({
    id: 'ask-replies-driver',
    size: '2x2',
    domain: 'logistics',
    name: 'Reply to a driver',
    props: {
      from: 'Fikri · driver',
      at: '09:12',
      message: 'Pak, gerbang 3 di Rungkut tutup. Saya masuk lewat mana?',
      replies: [
        { text: 'Lewat gerbang 5, sebelah pos satpam.', answer: 'Siap, Pak. Lima menit lagi sampai.' },
        { text: 'Tunggu 10 menit, saya cek dulu.', answer: 'Baik, saya tunggu di depan.' },
        { text: 'Saya telepon sebentar lagi.', answer: 'Oke, Pak.' },
      ],
    },
  }),
  replies({
    id: 'ask-replies-buyer',
    size: '2x1',
    domain: 'commerce',
    name: 'Reply to a buyer',
    props: {
      compact: true,
      from: 'Ratna · buyer',
      at: '19:40',
      message: 'Masih ada yang ukuran 42?',
      replies: [
        { text: 'Masih, kak. Kirim hari ini?', answer: 'Iya, kirim hari ini ya.' },
        { text: 'Tinggal 43, kak.', answer: 'Ya sudah, 43 saja.' },
        { text: 'Habis, restok Senin.', answer: 'Oke, kabari ya.' },
      ],
    },
  }),
  replies({
    id: 'ask-replies-manager',
    size: '1x2',
    domain: 'workspace',
    surface: 'muted',
    name: 'Reply to your manager',
    props: {
      from: 'Dewi · risk',
      at: '16:05',
      message: 'Can you send the October exposure numbers before the 17:00 call?',
      replies: [
        { text: 'Yes, by 16:45.', answer: 'Thanks.' },
        { text: 'Only the draft; the final comes tomorrow.', answer: 'A draft is fine for the call.' },
        { text: 'Can we move the call to 17:30?', answer: '17:30 works. I’ll move it.' },
      ],
    },
  }),
  replies({
    id: 'ask-replies-courier',
    size: '1x1',
    domain: 'home',
    name: 'Reply to a courier',
    props: {
      compact: true,
      from: 'Courier',
      at: '13:22',
      message: 'Paket di depan pintu ya, Bu.',
      replies: [
        { text: 'Terima kasih, Mas.', answer: 'Sama-sama, Bu.' },
        { text: 'Tolong taruh di pos satpam.', answer: 'Siap, sudah di pos.' },
      ],
    },
  }),

  /* ── What changed ────────────────────────────────────────────────────────────────── */
  digest({
    id: 'ask-digest-cash',
    size: '2x2',
    domain: 'banking',
    name: 'Treasury since yesterday',
    props: {
      periods: [
        {
          id: 'y',
          label: 'Yesterday',
          since: 'Since yesterday, 17:00',
          items: [
            { kind: 'up', tone: 'good', text: 'Cash up', figure: '+IDR 2.1 bn', detail: 'Three client payments landed overnight, the largest IDR 1.4 bn from PT Graha Niaga.' },
            { kind: 'down', tone: 'good', text: 'Card spend down', figure: '−8.4%', detail: 'Fewer travel claims since the 1 Nov travel freeze; hotels fell most.' },
            { kind: 'new', text: '2 approvals wait for you', detail: 'November payroll, and a bank account change for PT Tirta Baja.' },
            { kind: 'note', tone: 'bad', text: 'USD/IDR at 15,912', figure: '+0.4%', detail: 'The rupiah slipped after US data; Friday’s USD invoice costs IDR 25 M more.' },
          ],
        },
        {
          id: 'm',
          label: 'Monday',
          since: 'Since Monday, 09:00',
          items: [
            { kind: 'up', tone: 'good', text: 'Cash up', figure: '+IDR 5.8 bn', detail: 'Month-start receipts from 41 clients; 6 still owe IDR 3.2 bn between them.' },
            { kind: 'down', tone: 'bad', text: 'Deposit rates down', figure: '−0.15 pp', detail: 'Bank Sagara cut its one-month rate to 4.80% on Tuesday.' },
            { kind: 'new', text: 'New signatory', detail: 'Maya Kartika can approve up to IDR 500 M, added by Dewi Anggraini on 3 Nov.' },
          ],
        },
      ],
    },
  }),
  digest({
    id: 'ask-digest-shift',
    size: '1x2',
    domain: 'devops',
    surface: 'dark',
    name: 'Since your last shift',
    props: {
      openFirst: false,
      periods: [
        {
          id: 'shift',
          label: 'Shift',
          since: 'Since 22:00',
          items: [
            { kind: 'note', tone: 'bad', text: 'search timed out, 17 min', figure: 'SEV-3', detail: 'From 02:14 to 02:31 while the index rebuild ran long. Resolved.' },
            { kind: 'new', text: '3 deploys, all healthy', detail: 'auth v5.2.1, ledger v3.8.0 and notifications v1.19.2.' },
            { kind: 'down', tone: 'good', text: 'p95 latency', figure: '−22 ms', detail: 'api-gateway at 182 ms after the cache fix.' },
          ],
        },
        {
          id: 'week',
          label: 'Week',
          since: 'Since Monday',
          items: [
            { kind: 'note', tone: 'bad', text: '2 incidents', figure: 'SEV-2', detail: 'Card payments on Wednesday (482) and search on Thursday night.' },
            { kind: 'up', text: '19 deploys', figure: '+6', detail: 'Six more than last week; no rollbacks except 482.' },
            { kind: 'down', tone: 'good', text: 'Error budget used', figure: '−11 pp', detail: '38% of the month’s budget is used, down from 49%.' },
          ],
        },
      ],
    },
  }),
  digest({
    id: 'ask-digest-fields',
    size: '1x2',
    domain: 'agri',
    name: 'The farm since yesterday',
    props: {
      openFirst: false,
      periods: [
        {
          id: 'y',
          label: 'Today',
          since: 'Since yesterday, 06:00',
          items: [
            { kind: 'down', tone: 'bad', text: 'Soil moisture, block C', figure: '−9 pp', detail: 'Down to 27%, under the 30% line. No rain since 1 Nov.' },
            { kind: 'note', text: 'Rain on Friday', figure: '14 mm', detail: 'Forecast from 15:00 Friday; the next watering could wait.' },
            { kind: 'up', text: 'Pump 2 ran 6 h', detail: 'Longer than usual; the flow is normal and there is no leak alarm.' },
          ],
        },
        {
          id: 'w',
          label: 'Week',
          since: 'Since Monday',
          items: [
            { kind: 'up', tone: 'good', text: 'Canopy, block A', figure: '+0.04 NDVI', detail: 'Closing well 54 days after planting.' },
            { kind: 'new', tone: 'bad', text: 'Planthoppers, block D', figure: '2 traps', detail: 'Two traps over the threshold on 3 Nov; scout again Friday.' },
          ],
        },
      ],
    },
  }),
  digest({
    id: 'ask-digest-store',
    size: '2x1',
    domain: 'commerce',
    name: 'The shop since yesterday',
    props: {
      compact: true,
      periods: [
        {
          id: 'y',
          label: 'Today',
          since: 'Since yesterday',
          items: [
            { kind: 'up', tone: 'good', text: 'Orders', figure: '+18%', detail: '214 orders, most of them the 11.11 early-sale shoes.' },
            { kind: 'down', tone: 'bad', text: 'Size 42 in stock', figure: '−31 pairs', detail: '6 pairs of the Kemang Runner left in 42; a reorder takes 5 days.' },
            { kind: 'new', text: '3 reviews to answer', detail: 'Two about late delivery to Ambon, one about sizing.' },
          ],
        },
        {
          id: 'w',
          label: 'Week',
          since: 'Since Monday',
          items: [
            { kind: 'up', tone: 'good', text: 'Revenue', figure: '+29%', detail: 'Rp 212.400.000 this week against Rp 164.200.000 last week.' },
            { kind: 'down', tone: 'good', text: 'Returns', figure: '−12', detail: '19 returns, down from 31, after the size chart was fixed.' },
          ],
        },
      ],
    },
  }),
]
