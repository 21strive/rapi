/** Conversations that end in a check: chats, answers, citations, drafts, one question back. */
import type { MoodEntry } from '../../types'
import { chat, cited, clarify, draft, figure } from './patterns'

const reserveFrom = { label: 'From', value: 'Operating ···· 2207' }
const reserveTo = { label: 'To', value: 'Tax reserve ···· 9041' }
const shed = { label: 'Delivery', value: 'Sat 7 Nov, morning, block C shed' }

export const variantsA: MoodEntry[] = [
  /* ── Chat to confirm ─────────────────────────────────────────────────────────────── */
  chat({
    id: 'ask-chat-reserve',
    size: '3x2',
    domain: 'banking',
    name: 'Move money by chat',
    props: {
      start: '09:12',
      history: [
        { mine: true, text: 'Move 25 million to the tax reserve before Friday' },
        {
          mine: false,
          text: 'Operating has Rp 412.300.000 today. After this it keeps Rp 387.300.000, above its Rp 250.000.000 floor.',
          card: {
            title: 'Transfer',
            rows: [reserveFrom, reserveTo, { label: 'Amount', value: 'Rp 25.000.000' }, { label: 'When', value: 'Today, arrives at once' }],
            confirm: 'Move Rp 25.000.000',
            done: 'Moved · ref TRF-0511-0412',
          },
        },
      ],
      turns: [
        {
          // An amount and a day in one breath: "kirim 10 juta besok pagi".
          match: '^(?=.*(?:\\d+(?:[.,]\\d+)?\\s*(?:juta|jt|million|mio)|rp\\s*[\\d.]{5,}))(?=.*(?:friday|jum.?at|6 nov|besok|tomorrow)).*',
          reply: 'Scheduled for tomorrow, Friday, at 08:00. The money stays in Operating until then.',
          card: {
            title: 'Scheduled transfer',
            rows: [reserveFrom, reserveTo, { label: 'Amount', value: '{amount}' }, { label: 'When', value: 'Fri 6 Nov, 08:00 WIB' }],
            confirm: 'Schedule {amount}',
            done: 'Scheduled · ref TRF-0611-0102',
          },
          chips: ['What is the floor?', 'What is the balance?'],
        },
        {
          match: '\\d+(?:[.,]\\d+)?\\s*(?:juta|jt|million|mio)|rp\\s*[\\d.]{5,}',
          reply: 'Updated. Operating still stays above its floor.',
          card: {
            title: 'Transfer',
            rows: [reserveFrom, reserveTo, { label: 'Amount', value: '{amount}' }, { label: 'When', value: 'Today, arrives at once' }],
            confirm: 'Move {amount}',
            done: 'Moved · ref TRF-0511-0413',
          },
          chips: ['Do it on Friday instead', 'What is the floor?'],
        },
        {
          match: 'friday|jum.?at|6 nov|besok|tomorrow',
          reply: 'Scheduled for Friday morning instead; the money stays in Operating until then.',
          card: {
            title: 'Scheduled transfer',
            rows: [reserveFrom, reserveTo, { label: 'Amount', value: 'Rp 25.000.000' }, { label: 'When', value: 'Fri 6 Nov, 08:00 WIB' }],
            confirm: 'Schedule Rp 25.000.000',
            done: 'Scheduled · ref TRF-0611-0101',
          },
          chips: ['Make it 30 million', 'What is the balance?'],
        },
        {
          match: 'floor|batas|minimum|minimal',
          reply: 'The floor on Operating is Rp 250.000.000, set by Ayu Lestari on 2 Oct. A transfer that would go below it stops and asks first.',
        },
        {
          match: 'balance|saldo|how much|berapa',
          reply: 'At 09:12 WIB: Operating Rp 412.300.000, Tax reserve Rp 1.204.000.000, Payroll Rp 4.900.000.000.',
        },
        { match: 'cancel|batal|never ?mind|gak jadi|tidak jadi|jangan', reply: 'Cancelled. Nothing moved.', close: true },
        { match: 'thank|makasih|terima kasih', reply: 'You are welcome.' },
        {
          match: '^(hi|hello|halo|hai|pagi|selamat)',
          reply: 'Hello Ayu. I can move money between your accounts, pay a bill or show a balance.',
        },
      ],
      fallback: 'I can move money between your accounts, pay a bill or show a balance. Try “Make it 30 million”.',
      chips: ['Make it 30 million', 'Do it on Friday instead', 'What is the floor?'],
      change: 'Sure. The amount, the account or the day?',
      changeChips: ['Make it 20 million', 'Do it on Friday instead'],
    },
  }),
  chat({
    id: 'ask-chat-train',
    size: '4x2',
    domain: 'transit',
    name: 'Rebook a late train',
    props: {
      agent: 'Sesi',
      start: '16:40',
      history: [
        { mine: false, text: 'Your 17:30 train to Bandung is running 50 minutes late after a signal fault at Jatinegara.' },
        { mine: true, text: 'Get me on something earlier then' },
        {
          mine: false,
          text: 'The 16:55 has 4 seats left in Executive. Your ticket moves at no cost, because the delay is over 45 minutes.',
          card: {
            title: 'Train ticket',
            rows: [
              { label: 'Train', value: '16:55 Gambir → Bandung 19:58' },
              { label: 'Seat', value: 'Executive 3 · 11A, window' },
              { label: 'Fare difference', value: 'Rp 0' },
              { label: 'Passenger', value: 'Rizky Pratama' },
            ],
            confirm: 'Move my ticket',
            done: 'Moved · new code KXB7Q2',
          },
        },
      ],
      turns: [
        {
          match: 'aisle|lorong|gang',
          reply: 'Aisle it is: 11B is free in the same car.',
          card: {
            title: 'Train ticket',
            rows: [
              { label: 'Train', value: '16:55 Gambir → Bandung 19:58' },
              { label: 'Seat', value: 'Executive 3 · 11B, aisle' },
              { label: 'Fare difference', value: 'Rp 0' },
              { label: 'Passenger', value: 'Rizky Pratama' },
            ],
            confirm: 'Move my ticket',
            done: 'Moved · new code KXB7Q3',
          },
        },
        { match: 'window|jendela', reply: '11A is a window seat on the left, facing forward.' },
        {
          match: 'later|nanti|after|malam|tonight|19|20',
          reply: 'The 19:45 has seats in Economy only; Rp 120.000 goes back to your card.',
          card: {
            title: 'Train ticket',
            rows: [
              { label: 'Train', value: '19:45 Gambir → Bandung 22:50' },
              { label: 'Seat', value: 'Economy 6 · 8D' },
              { label: 'Fare difference', value: '−Rp 120.000, back to you' },
              { label: 'Passenger', value: 'Rizky Pratama' },
            ],
            confirm: 'Move my ticket',
            done: 'Moved · new code KXD3N8',
          },
          chips: ['Refund it', 'Aisle seat instead'],
        },
        {
          match: 'refund|uang kembali|cancel|batal',
          reply: 'A full refund of Rp 250.000 goes back to your card within 3 working days.',
          card: {
            title: 'Refund',
            rows: [
              { label: 'Ticket', value: '17:30 Gambir → Bandung' },
              { label: 'Refund', value: 'Rp 250.000 to card ···· 4471' },
            ],
            confirm: 'Refund Rp 250.000',
            done: 'Refunded · ref RF-88213',
          },
        },
        {
          match: 'bus|travel|shuttle|car|mobil',
          reply: 'I can only change train tickets. Shuttles to Bandung leave Gambir every 30 minutes.',
        },
        { match: 'thank|makasih|terima kasih', reply: 'Safe trip.' },
      ],
      fallback: 'I can move this ticket, change the seat or refund it. Try “Something later”.',
      chips: ['Aisle seat instead', 'Something later', 'Refund it'],
      change: 'What should change: the train, the seat or a refund?',
      changeChips: ['Aisle seat instead', 'Something later'],
    },
  }),
  chat({
    id: 'ask-chat-fertiliser',
    size: '3x2',
    domain: 'agri',
    name: 'Order from the co-op',
    props: {
      start: '07:05',
      history: [
        { mine: true, text: 'Pesan pupuk urea buat blok C sama D, kayak bulan lalu' },
        {
          mine: false,
          text: 'Last month it was 12 sacks of urea, 50 kg each, from the co-op. Blocks C and D are 3.4 ha, so 12 is still right.',
          card: {
            title: 'Order · Koperasi Tani Sumber Rejeki',
            rows: [{ label: 'Item', value: 'Urea, 50 kg × 12' }, shed, { label: 'Total', value: 'Rp 3.180.000' }],
            confirm: 'Order 12 sacks',
            done: 'Ordered · PO-0711-C',
          },
        },
      ],
      turns: [
        {
          match: '\\b15\\b|lima belas',
          reply: 'Fifteen sacks leaves enough for a second top-dressing in block D.',
          card: {
            title: 'Order · Koperasi Tani Sumber Rejeki',
            rows: [{ label: 'Item', value: 'Urea, 50 kg × 15' }, shed, { label: 'Total', value: 'Rp 3.960.000' }],
            confirm: 'Order 15 sacks',
            done: 'Ordered · PO-0711-D',
          },
        },
        {
          match: '\\b10\\b|sepuluh',
          reply: 'Ten sacks covers block C and most of block D.',
          card: {
            title: 'Order · Koperasi Tani Sumber Rejeki',
            rows: [{ label: 'Item', value: 'Urea, 50 kg × 10' }, shed, { label: 'Total', value: 'Rp 2.660.000' }],
            confirm: 'Order 10 sacks',
            done: 'Ordered · PO-0711-E',
          },
        },
        { match: 'npk|phonska|kcl|kalium', reply: 'NPK is out at the co-op until Tue 10 Nov. Urea is in stock.' },
        {
          match: 'ambil sendiri|collect|pick ?up|jemput',
          reply: 'Collecting it saves the Rp 60.000 delivery.',
          card: {
            title: 'Order · Koperasi Tani Sumber Rejeki',
            rows: [
              { label: 'Item', value: 'Urea, 50 kg × 12' },
              { label: 'Collect', value: 'At the co-op, Fri 6 Nov from 08:00' },
              { label: 'Total', value: 'Rp 3.120.000' },
            ],
            confirm: 'Order 12 sacks',
            done: 'Ordered · PO-0611-C',
          },
        },
        {
          match: 'besok|tomorrow|jum.?at|friday|cepat|sooner',
          reply: 'The co-op truck only runs on Saturdays. You can collect it yourself from Friday 08:00.',
          chips: ['Saya ambil sendiri', 'Saturday is fine'],
        },
        { match: 'harga|price|mahal|berapa|cost', reply: 'Rp 260.000 a sack, the same as October, plus Rp 60.000 delivery.' },
        { match: 'saturday|sabtu|fine|oke|\\bok\\b|boleh', reply: 'Saturday morning it stays. The order above is still open.' },
        { match: 'batal|cancel|gak jadi|tidak jadi', reply: 'Cancelled. Nothing was ordered.', close: true },
      ],
      fallback: 'I can order from the co-op and change the amount or the delivery. Try “Make it 15 sacks”.',
      chips: ['Make it 15 sacks', 'Bisa besok?', 'Berapa harganya?'],
      change: 'What should change: the amount or the delivery?',
      changeChips: ['Make it 10 sacks', 'Saya ambil sendiri'],
    },
  }),

  /* ── Answer with its working ─────────────────────────────────────────────────────── */
  figure({
    id: 'ask-figure-sweep',
    size: '3x2',
    domain: 'banking',
    surface: 'dark',
    name: 'Cash to deposit',
    props: {
      topic: 'Treasury',
      start: '08:52',
      scope: 'cash, deposits and payments due this month',
      answers: [
        {
          q: 'How much can we put on deposit this week?',
          chip: 'This week',
          match: 'deposit|deposito|sweep|put on|taruh|this week|minggu ini',
          figure: 'IDR 12.4 bn',
          says: 'Safe to place until Friday without touching the payroll and tax buffers.',
          working: [
            'Cash today IDR 41.2 bn in 14 accounts',
            'Less payroll on 25 Nov, IDR 4.81 bn',
            'Less tax on 15 Nov, IDR 3.20 bn',
            'Less a two-week outflow buffer, IDR 20.8 bn',
          ],
          sources: ['ledger 08:45', 'payroll run', 'tax calendar'],
        },
        {
          q: 'Which accounts would it come from?',
          chip: 'Which accounts?',
          match: 'which|account|rekening|dari mana|from where',
          figure: '3 accounts',
          says: 'Arunika Bank ···· 2207 gives IDR 7.1 bn, Bank Sagara ···· 1180 IDR 4.0 bn, Bank Pesisir ···· 5512 IDR 1.3 bn.',
          working: ['Accounts above their own floor after Friday', 'Largest balance first, to keep transfers few', 'Every account keeps at least IDR 500 M'],
          sources: ['ledger 08:45', 'account floors'],
        },
        {
          q: 'What would it earn over a month?',
          chip: 'What would it earn?',
          match: 'earn|interest|bunga|yield|return|hasil',
          figure: 'IDR 49.6 M',
          says: 'At 4.80% a year on a one-month deposit; IDR 39.7 M after the 20% tax on interest.',
          working: ['IDR 12.4 bn × 4.80% ÷ 12 months', 'Best one-month rate on 5 Nov: Bank Sagara', '20% final tax on deposit interest'],
          sources: ['rate sheets 5 Nov', 'tax table'],
        },
        {
          q: 'And next week?',
          chip: 'Next week',
          match: 'next week|minggu depan|after friday|setelah jumat',
          figure: 'IDR 6.9 bn',
          delta: -44.4,
          against: 'vs this week',
          says: 'Less room next week: the PT Tirta Baja supplier run of IDR 5.5 bn falls on 12 Nov.',
          working: ['Same buffers as this week', 'Plus the supplier run on 12 Nov, IDR 5.5 bn', 'No large receipts expected before 16 Nov'],
          sources: ['ledger 08:45', 'payables schedule'],
        },
      ],
    },
  }),
  figure({
    id: 'ask-figure-plant',
    size: '2x2',
    domain: 'energy',
    name: 'Plant output, asked',
    props: {
      topic: 'Cirata floating solar',
      start: '07:30',
      scope: 'output, inverters and weather at the plant',
      answers: [
        {
          q: 'What did the plant export yesterday?',
          chip: 'Yesterday',
          match: 'yesterday|kemarin|export|produce|output|produksi',
          figure: '412.6',
          unit: 'MWh',
          delta: -3.1,
          against: 'vs the day-ahead plan',
          says: 'Cloud sat over the reservoir from 13:00 to 15:00, and inverter 7 was off for 40 min.',
          working: ['Export meter M-01, 00:00–24:00 WIB on 4 Nov', 'Day-ahead plan 425.8 MWh', 'Inverter 7 off from 11:52 to 12:32'],
          sources: ['meter M-01', 'SCADA events', 'forecast D-1'],
        },
        {
          q: 'Why did inverter 7 trip?',
          chip: 'Inverter 7?',
          match: 'inverter|trip|\\b7\\b',
          figure: '40',
          unit: 'min',
          says: 'An insulation fault on string 7-14 after the morning rain; it restarted by itself and has held since.',
          working: ['Event log: insulation fault at 11:52:08', 'Restart at 12:32:40, no repeat in 19 h', 'Same string tripped on 21 Oct'],
          sources: ['SCADA events', 'maintenance log'],
        },
        {
          q: 'How did last week compare?',
          chip: 'Last week',
          match: 'last week|minggu lalu|compare|banding|week',
          figure: '2,941',
          unit: 'MWh',
          delta: 4.2,
          against: 'vs the week before',
          says: 'Fewer rain hours in the afternoons lifted the week.',
          working: ['Daily export summed, 26 Oct–1 Nov', 'Week before: 2,822 MWh', 'Rain hours: 9 against 14'],
          sources: ['meter M-01', 'weather station W-2'],
        },
      ],
    },
  }),
  figure({
    id: 'ask-figure-beds',
    size: '2x2',
    domain: 'health',
    surface: 'muted',
    name: 'Free beds, asked',
    props: {
      topic: 'Ward 3',
      start: '13:05',
      scope: 'beds, admissions and discharges on the ward',
      answers: [
        {
          q: 'How many beds will be free tonight?',
          chip: 'Tonight',
          match: 'tonight|malam|free|kosong|bed|tempat tidur',
          figure: '6',
          unit: 'beds',
          says: 'Free by 20:00 if the four planned discharges leave on time.',
          working: ['32 beds, 26 taken at 13:00', 'Four discharges signed for before 18:00', 'Four admissions booked from the ER and theatre'],
          sources: ['bed board 13:00', 'discharge list', 'admissions'],
        },
        {
          q: 'Who is going home today?',
          chip: 'Discharges',
          match: 'discharge|home|pulang|leaving|going',
          figure: '4',
          unit: 'patients',
          says: 'Beds 4, 11, 17 and 23. Bed 17 waits on the pharmacy for take-home medicine.',
          working: ['Discharge orders signed on the morning round', 'Pharmacy queue: one order open', 'Transport booked for bed 23 at 16:00'],
          sources: ['discharge list', 'pharmacy queue'],
        },
        {
          q: 'And tomorrow morning?',
          chip: 'Tomorrow',
          match: 'tomorrow|besok|morning|pagi',
          figure: '3',
          unit: 'beds',
          says: 'Two planned admissions arrive at 07:00, and the ER usually sends one overnight.',
          working: ['6 free tonight', 'Two planned admissions at 07:00', 'One ER admission overnight, on the average'],
          sources: ['theatre list 6 Nov', 'ER arrivals, 8 weeks'],
        },
      ],
    },
  }),

  /* ── Answer with citations ───────────────────────────────────────────────────────── */
  cited({
    id: 'ask-cited-returns',
    size: '2x2',
    domain: 'commerce',
    name: 'Policy answer, cited',
    props: {
      start: '10:02',
      scope: 'the returns policy',
      example: 'Who pays for the return shipping?',
      answers: [
        {
          q: 'Can a customer return a dented rice cooker after 10 days?',
          match: 'dent|damage|rusak|penyok|cooker|after \\d+ days?|setelah \\d+ hari',
          text: 'Yes. Items damaged in transit can be returned within 14 days of delivery [1]. Ask for a photo of the box and the item [2]; the refund goes back the way they paid [1].',
        },
        {
          q: 'Can the refund go to an e-wallet?',
          match: 'e-?wallet|dompet|ewallet|refund to|ke rekening',
          text: 'Only if they paid with that e-wallet: refunds go back to the original payment method, within 3 working days [1].',
        },
        {
          q: 'Who pays for the return shipping?',
          match: 'ship|ongkir|ongkos|postage|courier|kurir|pays?',
          text: 'We do when the item arrived damaged [3]. The return label is free from the order page [3].',
        },
      ],
      sources: [
        {
          title: 'Returns policy §4.2',
          meta: '2 Oct 2026',
          quote: 'Items damaged in transit may be returned within 14 days of delivery. Refunds are made to the original payment method within 3 working days of the item reaching our warehouse.',
          mark: 'within 14 days of delivery',
        },
        {
          title: 'Courier claims guide §2',
          meta: '18 Aug 2026',
          quote: 'For any transit damage claim, collect a photo of the outer box and of the item before the box is thrown away.',
          mark: 'a photo of the outer box and of the item',
        },
        {
          title: 'Returns policy §4.5',
          meta: '2 Oct 2026',
          quote: 'Return shipping is paid by the store when the item arrived damaged or not as described. The return label is free from the order page.',
          mark: 'paid by the store when the item arrived damaged',
        },
      ],
    },
  }),
  cited({
    id: 'ask-cited-leave',
    size: '2x1',
    domain: 'workspace',
    surface: 'muted',
    name: 'Handbook answer, cited',
    props: {
      compact: true,
      start: '11:40',
      scope: 'the handbook',
      example: 'paternity leave',
      answers: [
        {
          q: 'How many days off do I get for my wedding?',
          match: 'wedding|nikah|menikah|marriage',
          text: 'Three working days of paid leave for your own wedding [1], on top of annual leave. Ask two weeks ahead [2].',
        },
      ],
      sources: [
        {
          title: 'Employee handbook §7.3',
          meta: 'Jan 2026',
          quote: 'Employees receive three working days of paid special leave for their own marriage, in addition to annual leave.',
          mark: 'three working days of paid special leave',
        },
        {
          title: 'Leave procedure §2.1',
          meta: 'Mar 2026',
          quote: 'Special leave is requested in Sesi at least two weeks before the first day and approved by the direct manager.',
          mark: 'at least two weeks before the first day',
        },
      ],
    },
  }),
  cited({
    id: 'ask-cited-abort',
    size: '2x2',
    domain: 'aerospace',
    surface: 'dark',
    name: 'Procedure answer, cited',
    props: {
      start: '05:41',
      scope: 'the static fire procedures',
      example: 'Who can call a hold?',
      answers: [
        {
          q: 'When do we abort on chamber pressure?',
          match: 'abort|chamber|pressure|tekanan|\\bpc\\b',
          text: 'Abort if chamber pressure stays below 82% of nominal for more than 0.4 s after T+2 s [1]. Before T+2 s the engine controller owns the abort [2].',
        },
        {
          q: 'Who can call a hold after ignition?',
          match: 'hold|who|siapa|call|director',
          text: 'Only the test director or the range safety officer [1]. Any station can ask for one on the loop [3].',
        },
        {
          q: 'Where does the crew stand during the test?',
          match: 'distance|jarak|crew|stand|safe|aman|line',
          text: 'Everyone stays behind the 400 m line from the start of tanking until safing is complete [3].',
        },
      ],
      sources: [
        {
          title: 'Static fire SF-2 rev C §5.1',
          meta: '28 Oct 2026',
          quote: 'Abort is commanded if chamber pressure remains below 82% of nominal for more than 0.4 s at any time after T+2 s. Only the test director or the range safety officer may call a hold after ignition.',
          mark: 'below 82% of nominal for more than 0.4 s',
        },
        {
          title: 'Engine start ES-4 §2',
          meta: '12 Sep 2026',
          quote: 'Until T+2 s the engine controller runs the start sequence and owns any abort; ground commands are ignored in this window.',
          mark: 'owns any abort',
        },
        {
          title: 'Range safety RS-7 §3',
          meta: '1 Nov 2026',
          quote: 'All personnel remain behind the 400 m line from the start of tanking until safing is complete. Any station may request a hold on the voice loop.',
          mark: 'behind the 400 m line',
        },
      ],
    },
  }),

  /* ── Draft to approve ────────────────────────────────────────────────────────────── */
  draft({
    id: 'ask-draft-email',
    size: '2x2',
    domain: 'workspace',
    name: 'Reply drafted',
    props: {
      eyebrow: 'Reply · PT Samudra Kargo',
      fields: [
        { label: 'To', value: 'Lina Wijaya' },
        { label: 'Subject', value: 'Re: Pickup for PO-2611 on Friday', edit: true },
      ],
      body: 'Hi Lina,\nFriday 6 Nov at 08:00 works for us. The 12 pallets will be ready at dock 3 in Rungkut; please send the truck plate by Thursday evening.\nThanks, Ayu',
      prepared: 'from the thread of 4 Nov',
      approve: 'Send',
      done: 'Sent',
      start: '09:14',
    },
  }),
  draft({
    id: 'ask-draft-transfer',
    size: '2x2',
    domain: 'payments',
    name: 'Transfer drafted',
    props: {
      agent: 'Simpul',
      eyebrow: 'Transfer · invoice INV-2611',
      fields: [
        { label: 'To', value: 'CV Rotan Cirebon' },
        { label: 'Account', value: 'Bank Pesisir ···· 4410', mono: true },
        { label: 'Amount', value: 'Rp 18.750.000', edit: true },
        { label: 'On', value: 'Fri 6 Nov 2026', edit: true },
        { label: 'Note', value: 'INV-2611 rattan chairs, 25 pcs', edit: true },
      ],
      prepared: 'matched to INV-2611, due 6 Nov',
      approve: 'Approve transfer',
      done: 'Scheduled',
      start: '10:20',
    },
  }),
  draft({
    id: 'ask-draft-status',
    size: '2x2',
    domain: 'devops',
    surface: 'dark',
    name: 'Status update drafted',
    props: {
      eyebrow: 'Status page · incident 482',
      fields: [{ label: 'Status', value: 'Monitoring', edit: true }],
      body: 'Card payments in ap-southeast-3 are working again since 14:52 WIB. Between 14:21 and 14:52 about 3% of card payments failed and were not charged. We are watching error rates and will post again by 16:00 WIB.',
      prepared: 'from #inc-482 and the error graph',
      approve: 'Post update',
      done: 'Posted',
      start: '15:04',
    },
  }),
  draft({
    id: 'ask-draft-notice',
    size: '3x1',
    domain: 'civic',
    surface: 'muted',
    name: 'Notice drafted',
    props: {
      compact: true,
      eyebrow: 'Notice · RW 05 Tebet Barat',
      body: 'Air di RW 05 berhenti Sabtu 7 Nov, 08:00–14:00 WIB, untuk perbaikan pipa di Jl. Tebet Barat IV. Siapkan cadangan air sejak Jumat malam.',
      prepared: 'from the water utility’s email',
      approve: 'Publish',
      done: 'Published',
      start: '19:30',
    },
  }),

  /* ── One question back ───────────────────────────────────────────────────────────── */
  clarify({
    id: 'ask-clarify-truck',
    size: '2x2',
    domain: 'logistics',
    name: 'Which pickup?',
    props: {
      request: 'Book the usual truck for Friday',
      question: 'Which pickup on Fri 6 Nov?',
      options: [
        {
          label: 'Rungkut warehouse, 08:00',
          match: 'rungkut|warehouse|gudang|pagi|08',
          result: 'Booked a CDD box truck from Rungkut to Gresik, Fri 6 Nov 08:00 WIB.',
          detail: 'TRK-48213 · PT Kurir Kilat',
        },
        {
          label: 'Tanjung Perak port, 13:00',
          match: 'perak|port|pelabuhan|siang|13',
          result: 'Booked a CDD box truck from Tanjung Perak, Fri 6 Nov 13:00 WIB.',
          detail: 'TRK-48214 · PT Kurir Kilat',
        },
      ],
      otherReply: 'Noted: “{text}”. Dispatch will confirm a truck by 10:00 today.',
      start: '08:41',
    },
  }),
  clarify({
    id: 'ask-clarify-lights',
    size: '1x1',
    domain: 'home',
    name: 'Which lights?',
    props: {
      compact: true,
      other: '',
      request: 'Turn off the lights',
      question: 'All 9, or just downstairs?',
      options: [
        { label: 'All 9 lights', result: 'All 9 lights are off.' },
        { label: 'Downstairs only', result: '5 downstairs are off; upstairs stays on.' },
      ],
      start: '22:10',
    },
  }),
  clarify({
    id: 'ask-clarify-rina',
    size: '1x1',
    domain: 'workspace',
    surface: 'muted',
    name: 'Which Rina?',
    props: {
      compact: true,
      other: '',
      request: 'Call Rina',
      question: 'Which Rina?',
      options: [
        { label: 'Rina Hartono · Design', result: 'Calling Rina Hartono.' },
        { label: 'Rina Siregar · Finance', result: 'Calling Rina Siregar.' },
      ],
      start: '15:02',
    },
  }),
  clarify({
    id: 'ask-clarify-refill',
    size: '2x1',
    domain: 'health',
    name: 'Which prescription?',
    props: {
      compact: true,
      other: '',
      request: 'Refill my prescription',
      question: 'Which one: metformin or amlodipine?',
      options: [
        { label: 'Metformin 500 mg', result: 'Refill sent to Apotek Kemang Raya, ready after 17:00.', detail: 'RX-20941' },
        { label: 'Amlodipine 5 mg', result: 'Refill sent; it needs the doctor’s signature first, usually within 2 h.', detail: 'RX-20942' },
        { label: 'Both', result: 'Both sent; amlodipine needs the doctor’s signature first.', detail: 'RX-20941, RX-20942' },
      ],
      start: '08:15',
    },
  }),
  clarify({
    id: 'ask-clarify-train',
    size: '2x1',
    domain: 'transit',
    surface: 'muted',
    name: 'Which train?',
    props: {
      compact: true,
      other: '',
      request: 'Get me to Bandung tomorrow',
      question: 'Before work or after?',
      options: [
        { label: '06:10 · arrives 09:05', result: 'Seat 4A on the 06:10 from Gambir, Fri 6 Nov, Rp 250.000 on your card.', detail: 'Booking KXB7Q2' },
        { label: '17:30 · arrives 20:36', result: 'Seat 11C on the 17:30 from Gambir, Fri 6 Nov, Rp 250.000 on your card.', detail: 'Booking KXC9M4' },
      ],
      start: '21:05',
    },
  }),
]
