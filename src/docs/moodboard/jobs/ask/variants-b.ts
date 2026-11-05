/** The model at work, forms from sentences, speech, "why" on a chart, commands from sentences. */
import type { MoodEntry } from '../../types'
import { cli, explain, form, steps, voice } from './patterns'

const hours = Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, '0')}:00`)
const days = (from: number, n: number, month: string, monthDays: number, next: string) =>
  Array.from({ length: n }, (_, i) => (from + i <= monthDays ? `${from + i} ${month}` : `${from + i - monthDays} ${next}`))

export const variantsB: MoodEntry[] = [
  /* ── Agent at work ───────────────────────────────────────────────────────────────── */
  steps({
    id: 'ask-steps-rollback',
    size: '1x2',
    domain: 'devops',
    surface: 'dark',
    name: 'Rollback in progress',
    props: {
      title: 'Rollback · payments-core',
      start: '14:31:10',
      from: 1,
      doneText: 'Rolled back',
      steps: [
        { label: 'Find last good release', secs: 3, note: 'v2.41.3, 2 Nov' },
        { label: 'Drain v2.42.0', secs: 6, detail: '3 of 6 pods', note: 'drained' },
        { label: 'Roll back 6 pods', secs: 9, detail: 'one at a time', note: '6 of 6' },
        { label: 'Errors under 0.5%', secs: 6, detail: 'now 2.8%, falling', note: '0.2%' },
        { label: 'Post in #inc-482', secs: 2, note: 'posted' },
      ],
    },
  }),
  steps({
    id: 'ask-steps-recon',
    size: '2x2',
    domain: 'banking',
    name: 'Reconciliation in progress',
    props: {
      title: 'Month-end reconciliation · October',
      start: '16:02:40',
      from: 2,
      doneText: 'Reconciled',
      steps: [
        { label: 'Pull 1,204 bank lines from 3 accounts', secs: 4, note: 'Arunika, Sagara, Pesisir' },
        { label: 'Match them against the ledger', secs: 5, note: '1,187 matched' },
        { label: 'Group the 17 left by reason', secs: 6, detail: 'fees, timing, unknown', note: '9 fees · 5 timing · 3 unknown' },
        { label: 'Draft a journal for bank fees', secs: 5, detail: 'Rp 1.284.500 in 9 lines', note: 'JV-1031, waits for you' },
        { label: 'Send the 3 unknown lines to Butet', secs: 3, detail: 'with notes', note: 'sent to internal audit' },
      ],
    },
  }),
  steps({
    id: 'ask-steps-contain',
    size: '1x3',
    domain: 'security',
    surface: 'dark',
    name: 'Containment in progress',
    props: {
      title: 'Contain · laptop FIN-0412',
      start: '02:17:05',
      from: 1,
      doneText: 'Contained',
      steps: [
        { label: 'Confirm the alert', secs: 3, note: 'credential dumping, high' },
        { label: 'Isolate FIN-0412', secs: 5, detail: 'network contain', note: 'isolated 02:17' },
        { label: 'Revoke Sari’s sessions', secs: 4, detail: '3 sessions, 2 apps', note: '3 revoked' },
        { label: 'Force a password reset', secs: 3, detail: 'at next sign-in', note: 'policy applied' },
        { label: 'Collect a memory image', secs: 8, detail: '6.1 of 16 GB', note: '16 GB, hashed' },
        { label: 'Open case SEC-3307', secs: 3, detail: 'for Fajar, 08:00', note: 'assigned' },
      ],
    },
  }),
  steps({
    id: 'ask-steps-rebook',
    size: '2x1',
    domain: 'logistics',
    name: 'Rebooking in progress',
    props: {
      compact: true,
      title: 'Rebook · Merak crossing closed',
      start: '06:40:00',
      from: 1,
      doneText: 'Rebooked',
      steps: [
        { label: 'Find 38 shipments on the Merak ferry', secs: 3 },
        { label: 'Move 31 to the Ciwandan crossing', secs: 7 },
        { label: 'Hold 7 cold-chain loads at Cikande', secs: 5 },
        { label: 'Send 12 customers the new ETAs', secs: 6 },
      ],
    },
  }),
  steps({
    id: 'ask-steps-master',
    size: '1x1',
    domain: 'audio',
    surface: 'dark',
    name: 'Mastering in progress',
    props: {
      compact: true,
      title: 'Episode 14',
      start: '21:10:00',
      from: 1,
      doneText: 'Exported',
      steps: [
        { label: 'Trim silences over 2 s', secs: 3 },
        { label: 'Level to −16 LUFS', secs: 6 },
        { label: 'Remove breaths and clicks', secs: 6 },
        { label: 'Export MP3 and WAV', secs: 5 },
      ],
    },
  }),

  /* ── Form from a sentence ────────────────────────────────────────────────────────── */
  form({
    id: 'ask-form-shipment',
    size: '3x2',
    domain: 'logistics',
    name: 'Booking from a sentence',
    props: {
      eyebrow: 'New booking',
      initial: '12 pallets of frozen shrimp from Surabaya to Makassar, pick up Friday morning, keep at −18 °C',
      placeholder: 'What, how much, from where to where, and when',
      action: 'Create booking',
      done: 'Booking SK-48213 created',
      fields: [
        {
          label: 'From',
          required: true,
          rules: [
            { match: '(?:from|dari)\\s+surabaya', value: 'Surabaya · Tanjung Perak' },
            { match: '(?:from|dari)\\s+jakarta', value: 'Jakarta · Tanjung Priok' },
            { match: '(?:from|dari)\\s+semarang', value: 'Semarang · Tanjung Emas' },
            { match: '(?:from|dari)\\s+makassar', value: 'Makassar · Soekarno-Hatta' },
          ],
        },
        {
          label: 'To',
          required: true,
          rules: [
            { match: '(?:to|ke)\\s+makassar', value: 'Makassar · Soekarno-Hatta' },
            { match: '(?:to|ke)\\s+balikpapan', value: 'Balikpapan · Semayang' },
            { match: '(?:to|ke)\\s+ambon', value: 'Ambon · Yos Sudarso' },
            { match: '(?:to|ke)\\s+jakarta', value: 'Jakarta · Tanjung Priok' },
          ],
        },
        {
          label: 'Cargo',
          required: true,
          rules: [
            { match: 'shrimp|udang', value: 'Frozen shrimp' },
            { match: 'fish|ikan', value: 'Frozen fish' },
            { match: 'coffee|kopi', value: 'Coffee beans' },
            { match: 'cement|semen', value: 'Cement' },
          ],
        },
        {
          label: 'Quantity',
          required: true,
          rules: [
            { match: '(\\d+)\\s*(?:pallets?|palet)', value: '$1 pallets' },
            { match: '(\\d+)\\s*(?:containers?|kontainer)', value: '$1 × 20 ft' },
            { match: '(\\d+)\\s*(?:tons?|tonnes?)', value: '$1 t' },
          ],
        },
        {
          label: 'Keep at',
          rules: [
            { match: '(?:−|-|minus\\s*)(\\d+)\\s*°?\\s*c', value: '−$1 °C' },
            { match: 'frozen|beku', value: '−18 °C' },
            { match: 'chilled|dingin', value: '0–4 °C' },
          ],
        },
        {
          label: 'Pickup',
          required: true,
          rules: [
            { match: '(?:friday|jum.?at)\\s+(?:morning|pagi)', value: 'Fri 6 Nov, 08:00–11:00' },
            { match: 'friday|jum.?at|tomorrow|besok', value: 'Fri 6 Nov' },
            { match: 'monday|senin', value: 'Mon 9 Nov' },
          ],
        },
        {
          label: 'Mode',
          required: true,
          options: ['Sea', 'Air'],
          rules: [
            { match: '\\b(?:sea|laut|kapal|ship)\\b', value: 'Sea · reefer container' },
            { match: '\\b(?:air|udara|plane|pesawat)\\b', value: 'Air · cold chain' },
          ],
        },
      ],
    },
  }),
  form({
    id: 'ask-form-leave',
    size: '2x2',
    domain: 'workspace',
    name: 'Leave from a sentence',
    props: {
      eyebrow: 'Leave request',
      initial: 'Cuti 3 hari mulai Senin, pulang ke Padang untuk nikahan sepupu',
      action: 'Send to Andika',
      done: 'Sent to Andika Saputra',
      start: '10:10',
      fields: [
        {
          label: 'Type',
          required: true,
          rules: [
            { match: 'sakit|sick', value: 'Sick leave' },
            { match: 'cuti|leave|libur|off', value: 'Annual leave' },
          ],
        },
        {
          label: 'From',
          required: true,
          rules: [
            { match: 'senin|monday', value: 'Mon 9 Nov' },
            { match: 'selasa|tuesday', value: 'Tue 10 Nov' },
            { match: 'besok|tomorrow', value: 'Fri 6 Nov' },
          ],
        },
        {
          label: 'Days',
          required: true,
          rules: [
            { match: '(\\d+)\\s*(?:hari|days?)', value: '$1 working days' },
            { match: 'seminggu|a week|one week', value: '5 working days' },
          ],
        },
        {
          label: 'Reason',
          rules: [
            { match: 'nikah|wedding', value: 'Family wedding' },
            { match: 'pulang|mudik|home', value: 'Going home' },
          ],
        },
        {
          label: 'Cover',
          required: true,
          options: ['Kevin Tan', 'Rina Hartono'],
          rules: [{ match: '(?:cover|diganti|digantikan|backup)\\s+(?:by|oleh)?\\s*(kevin|rina)', value: '$1' }],
        },
      ],
    },
  }),
  form({
    id: 'ask-form-fault',
    size: '2x2',
    domain: 'energy',
    surface: 'dark',
    name: 'Fault report from a sentence',
    props: {
      eyebrow: 'Fault report',
      initial: 'Trafo di gardu Cempaka bunyi keras sejak tadi pagi, bau hangus juga',
      action: 'Open ticket',
      done: 'Ticket WO-1182 opened',
      start: '09:48',
      fields: [
        {
          label: 'Asset',
          required: true,
          rules: [
            { match: 'trafo|transformer', value: 'Transformer T2' },
            { match: 'breaker|pemutus', value: 'Breaker CB-4' },
            { match: 'kabel|cable', value: 'Feeder cable' },
          ],
        },
        {
          label: 'Site',
          required: true,
          rules: [
            { match: 'cempaka', value: 'Cempaka substation, Sidoarjo' },
            { match: 'rungkut', value: 'Rungkut substation' },
          ],
        },
        {
          label: 'Symptom',
          required: true,
          rules: [
            { match: '(?:bunyi|noise|hum|dengung).*(?:hangus|burn)|(?:hangus|burn).*(?:bunyi|noise|hum)', value: 'Loud hum, burning smell' },
            { match: 'bunyi|noise|hum|dengung', value: 'Loud hum' },
            { match: 'hangus|burn|asap|smoke', value: 'Burning smell' },
            { match: 'mati|trip|padam|outage', value: 'Tripped' },
          ],
        },
        {
          label: 'Since',
          rules: [
            { match: 'tadi pagi|this morning', value: 'This morning, 5 Nov' },
            { match: 'kemarin|yesterday', value: 'Yesterday, 4 Nov' },
          ],
        },
        {
          label: 'Priority',
          required: true,
          options: ['P1 · crew now', 'P2 · today'],
          rules: [{ match: '\\b(?:api|fire|asap|smoke)\\b', value: 'P1 · crew now' }],
        },
      ],
    },
  }),

  /* ── Push to talk ────────────────────────────────────────────────────────────────── */
  voice({
    id: 'ask-voice-meter',
    size: '1x2',
    domain: 'energy',
    surface: 'dark',
    name: 'Reading by voice',
    props: {
      label: 'Meter reading',
      lang: 'ID',
      saved: 'Logged to WO-1182',
      start: '10:42',
      primed: true,
      hint: 'Say the meter, the reading and the seal.',
      utterances: [
        {
          words: 'Meter tujuh angka empat ribu delapan ratus dua belas kilowatt jam, segel utuh',
          result: [
            { label: 'Meter', value: 'M-07' },
            { label: 'Reading', value: '4,812 kWh' },
            { label: 'Seal', value: 'Intact' },
          ],
        },
        {
          words: 'Meter sembilan tidak bisa dibaca, layar pecah, perlu ganti',
          result: [
            { label: 'Meter', value: 'M-09' },
            { label: 'Reading', value: 'None' },
            { label: 'Fault', value: 'Display broken' },
          ],
        },
      ],
    },
  }),
  voice({
    id: 'ask-voice-handover',
    size: '2x2',
    domain: 'health',
    name: 'Handover by voice',
    props: {
      label: 'Shift handover · Ward 3',
      lang: 'EN',
      saved: 'Added to the handover note',
      start: '13:55',
      primed: true,
      hint: 'Say the bed, the reading and the next check.',
      utterances: [
        {
          words: 'Bed twelve, Mr Hasan, blood pressure one forty over ninety, next check at sixteen hundred, nothing by mouth after midnight',
          result: [
            { label: 'Bed', value: '12 · Hasan' },
            { label: 'Blood pressure', value: '140/90 mmHg' },
            { label: 'Next check', value: '16:00' },
            { label: 'Fasting', value: 'From 00:00' },
          ],
        },
        {
          words: 'Bed four goes home today, waiting on the pharmacy for take-home medicine',
          result: [
            { label: 'Bed', value: '4' },
            { label: 'Plan', value: 'Discharge today' },
            { label: 'Waiting on', value: 'Pharmacy' },
          ],
        },
      ],
    },
  }),
  voice({
    id: 'ask-voice-contact',
    size: '1x1',
    domain: 'defense',
    surface: 'dark',
    name: 'Contact by voice',
    props: {
      compact: true,
      label: 'Contact report',
      lang: 'ID',
      start: '03:12',
      hint: 'Hold and report: what, where, heading.',
      utterances: [
        {
          words: 'Kontak kapal ikan empat mil timur Natuna, haluan dua tujuh nol',
          result: [{ label: 'Contact', value: 'Fishing boat · 4 NM E · 270°' }],
        },
        {
          words: 'Kontak hilang dari radar di sektor tujuh',
          result: [{ label: 'Contact', value: 'Lost · sector 7' }],
        },
      ],
    },
  }),
  voice({
    id: 'ask-voice-spray',
    size: '2x1',
    domain: 'agri',
    name: 'Task by voice',
    props: {
      compact: true,
      label: 'Field task',
      lang: 'ID',
      start: '17:20',
      hint: 'Hold and say the task, the block and when.',
      utterances: [
        {
          words: 'Semprot blok C besok pagi jam enam, fungisida dosis biasa',
          result: [
            { label: 'Task', value: 'Spray · block C' },
            { label: 'When', value: 'Fri 6 Nov, 06:00' },
          ],
        },
        {
          words: 'Pompa dua bocor di saluran timur, kirim teknisi',
          result: [
            { label: 'Task', value: 'Repair · pump 2' },
            { label: 'Where', value: 'East channel' },
          ],
        },
      ],
    },
  }),

  /* ── Explain this point ──────────────────────────────────────────────────────────── */
  explain({
    id: 'ask-explain-refunds',
    size: '2x2',
    domain: 'payments',
    name: 'Why the refund spike?',
    props: {
      label: 'Refunds per day',
      unit: 'refunds',
      labels: days(7, 30, 'Oct', 31, 'Nov'),
      values: [372, 401, 388, 365, 342, 398, 410, 395, 377, 389, 402, 415, 380, 361, 397, 405, 392, 386, 371, 399, 412, 1184, 640, 418, 396, 388, 520, 407, 393, 401],
      initial: 21,
      notes: {
        '21': {
          title: 'Double charge at one bank',
          says: 'Bank Pesisir settled card payments twice from 10:05 to 11:40 WIB; 794 customers were refunded the same day.',
          source: 'incident PAY-219 · settlement files 28 Oct',
        },
        '22': {
          title: 'The rest of the double charge',
          says: '246 refunds from 28 Oct went out the next morning, after the bank sent its corrected file.',
          source: 'incident PAY-219 · refund queue 29 Oct',
        },
        '26': {
          title: 'Returns after a promotion',
          says: 'The 11.11 early sale brought 130 extra returns of wrong-size shoes, all from one seller.',
          source: 'returns by seller · 2 Nov',
        },
      },
    },
  }),
  explain({
    id: 'ask-explain-load',
    size: '2x1',
    domain: 'energy',
    surface: 'dark',
    name: 'Why the dip?',
    props: {
      compact: true,
      label: 'Feeder load · Sidoarjo 4',
      unit: 'MW',
      labels: hours,
      values: [36, 34, 33, 33, 35, 39, 44, 49, 52, 54, 55, 56, 55, 54, 21, 38, 53, 57, 60, 61, 58, 52, 45, 40],
      initial: 14,
      notes: {
        '14': {
          title: 'Feeder trip, 14:06–14:41',
          says: 'A kite string across section 7 tripped the breaker; 3,200 homes were off for 35 minutes.',
          source: 'SCADA CB-4 · outage OR-1107',
        },
        '19': {
          title: 'The evening peak',
          says: 'Lights, cooking and air conditioning together, 2% above last Wednesday.',
          source: 'feeder history · 28 Oct',
        },
      },
    },
  }),
  explain({
    id: 'ask-explain-readers',
    size: '2x2',
    domain: 'media',
    name: 'Why the traffic spike?',
    props: {
      label: 'Readers per hour · 4 Nov',
      unit: 'readers',
      labels: hours,
      values: [4200, 3100, 2600, 2400, 3300, 6900, 12800, 17600, 19200, 18400, 17100, 18900, 22300, 20100, 17800, 16400, 17200, 19800, 23600, 25100, 96400, 61200, 30800, 12900],
      initial: 20,
      notes: {
        '20': {
          title: 'The flood story, shared in a group chat',
          says: '“Kemang floods again after three hours of rain” was shared in a neighbourhood group at 19:58; 71% of readers came from that link.',
          source: 'referrers · story 18240',
        },
        '21': {
          title: 'Still the flood story',
          says: 'Readers kept arriving from the same link; the live road map was opened 40,000 times.',
          source: 'referrers · story 18240',
        },
      },
    },
  }),
  explain({
    id: 'ask-explain-air',
    size: '2x1',
    domain: 'civic',
    name: 'Why the haze?',
    props: {
      compact: true,
      label: 'PM2.5 · Bogor',
      unit: 'µg/m³',
      labels: days(23, 14, 'Oct', 31, 'Nov'),
      values: [38, 41, 36, 44, 52, 47, 39, 35, 33, 88, 61, 45, 40, 37],
      initial: 9,
      notes: {
        '9': {
          title: 'Field burning and still air',
          says: 'Rice straw burning south of the city and wind under 1 m/s kept the smoke low all night.',
          source: 'station BGR-02 · fire map 1 Nov',
        },
      },
    },
  }),

  /* ── Command from a sentence ─────────────────────────────────────────────────────── */
  cli({
    id: 'ask-cli-kubectl',
    size: '4x1',
    domain: 'devops',
    surface: 'dark',
    name: 'Cluster by sentence',
    props: {
      context: 'ctl · staging · ap-southeast-3',
      initial: 'restart payments in staging',
      placeholder: 'Say what to do in staging',
      history: ['pods for auth', 'logs for search since 14:00', 'scale search to 6'],
      log: [
        { kind: 'said', text: 'scale search to 6' },
        { kind: 'run', text: 'kubectl scale deploy/search --replicas=6 -n staging' },
        { kind: 'out', text: 'deployment.apps/search scaled' },
      ],
      fallback: 'No command for that yet. Try “logs for auth since 14:00” or “scale search to 4”.',
      commands: [
        { match: 'restart\\s+(?:the\\s+)?payments?', run: 'kubectl rollout restart deploy/payments-core -n staging', out: ['deployment.apps/payments-core restarted'] },
        { match: 'restart\\s+(?:the\\s+)?([a-z][\\w-]*)', run: 'kubectl rollout restart deploy/$1 -n staging', out: ['deployment.apps/$1 restarted'] },
        { match: '(?:scale|skala)\\s+([a-z][\\w-]*)\\s+(?:to|ke|jadi)\\s+(\\d+)', run: 'kubectl scale deploy/$1 --replicas=$2 -n staging', out: ['deployment.apps/$1 scaled'] },
        {
          match: 'logs?\\s+(?:for|of|dari|untuk)?\\s*([a-z][\\w-]*)\\s+(?:since|sejak)\\s+(\\d{1,2}[:.]\\d{2})',
          run: 'kubectl logs deploy/$1 -n staging --since-time=2026-11-05T$2:00+07:00',
          out: ['214 lines · 3 ERROR · last at 14:31:07'],
        },
        { match: 'roll ?back\\s+([a-z][\\w-]*)', run: 'kubectl rollout undo deploy/$1 -n staging', out: ['deployment.apps/$1 rolled back'], risky: 'Rolls back the last release.' },
        { match: '(?:delete|hapus)\\s+(?:the\\s+)?(?:pod\\s+)?([a-z][\\w-]*)', run: 'kubectl delete pod $1 -n staging', out: ['pod "$1" deleted'], risky: 'Deletes a pod.' },
        { match: '^(?:show\\s+|get\\s+)?(?:pods?|status)\\s+(?:of|for|dari)?\\s*([a-z][\\w-]*)', run: 'kubectl get pods -n staging -l app=$1', out: ['$1-7f9c4   1/1   Running   0   2d', '$1-8d21b   1/1   Running   0   2d'] },
      ],
    },
  }),
  cli({
    id: 'ask-cli-home',
    size: '3x1',
    domain: 'home',
    name: 'House by sentence',
    props: {
      context: 'home hub · 12 devices',
      initial: 'dim the living room to 30%',
      placeholder: 'Say what the house should do',
      history: ['lights off downstairs', 'ac bedroom 25'],
      log: [
        { kind: 'said', text: 'ac bedroom 25' },
        { kind: 'run', text: 'ac bedroom set 25 °C' },
        { kind: 'out', text: 'bedroom AC · 25 °C · cooling' },
      ],
      fallback: 'No command for that yet. Try “lights off” or “open the gate”.',
      commands: [
        { match: '(?:dim|redup\\w*|set).*(?:living|tamu)\\D*(\\d+)\\s*%', run: 'lights living set $1%', out: ['4 lights at $1%'] },
        { match: '(?:\\bac\\b|aircon)\\D*(\\d{2})', run: 'ac bedroom set $1 °C', out: ['bedroom AC · $1 °C · cooling'] },
        { match: '(?:open|buka)\\s+(?:the\\s+)?(?:gate|pagar|gerbang)', run: 'gate open 5 min', out: ['gate opening · closes at 18:47'], risky: 'Opens the front gate.' },
        { match: '(?:lights?|lampu)\\s+(?:off|mati)|(?:turn off|matikan)\\s+(?:all\\s+|semua\\s+)?(?:the\\s+)?(?:lights?|lampu)', run: 'lights all off', out: ['9 lights off'] },
        { match: '(?:who|siapa).*(?:home|rumah)', run: 'presence list', out: ['Rina · home since 17:20 · Bima · away'] },
      ],
    },
  }),
  cli({
    id: 'ask-cli-antenna',
    size: '3x2',
    domain: 'aerospace',
    surface: 'dark',
    name: 'Ground station by sentence',
    props: {
      context: 'ground station · Biak · ANT-1',
      initial: 'point to Nusa-3 at the next pass',
      placeholder: 'Say what the antenna should do',
      history: ['stow', 'next pass', 'downlink the images'],
      log: [
        { kind: 'said', text: 'stow' },
        { kind: 'run', text: 'ANT1 STOW' },
        { kind: 'out', text: 'moving to 90° EL · stowed in 40 s' },
        { kind: 'said', text: 'next pass' },
        { kind: 'run', text: 'PASS NEXT NUSA-3' },
        { kind: 'out', text: 'AOS 21:14:08 UTC · LOS 21:25:40 · MAXEL 62°' },
        { kind: 'said', text: 'downlink the images' },
        { kind: 'run', text: 'TC NUSA-3 DUMP X-BAND 1.2 GB' },
        { kind: 'out', text: 'queued for the 21:14 pass · 9 min at 18 Mbps' },
      ],
      fallback: 'No command for that. Try “next pass”, “stow” or “safe mode”.',
      commands: [
        { match: '(?:point|track|arahkan).*nusa-?\\s*(\\d)', run: 'ANT1 TRACK NUSA-$1 AOS 21:14:08 UTC MAXEL 62°', out: ['schedule set · AOS in 00:41:10', 'pre-pass check at 21:04 UTC'] },
        { match: 'stow|park|parkir', run: 'ANT1 STOW', out: ['moving to 90° EL · stowed in 40 s'] },
        { match: 'safe ?mode|mode aman', run: 'TC NUSA-3 SAFE_MODE ON', out: ['queued for the 21:14 pass · 1 command'], risky: 'Puts the satellite in safe mode.' },
        { match: '(?:downlink|unduh|dump).*(?:image|gambar|data)', run: 'TC NUSA-3 DUMP X-BAND 1.2 GB', out: ['queued for the 21:14 pass · 9 min at 18 Mbps'] },
        { match: 'next pass|pass berikut|kapan', run: 'PASS NEXT NUSA-3', out: ['AOS 21:14:08 UTC · LOS 21:25:40 · MAXEL 62°'] },
      ],
    },
  }),
  cli({
    id: 'ask-cli-firewall',
    size: '3x1',
    domain: 'security',
    surface: 'dark',
    name: 'Firewall by sentence',
    props: {
      context: 'edge firewall · ap-southeast-3',
      initial: 'block 198.51.100.23 for 24 hours',
      placeholder: 'Say who to block, limit or let in',
      history: ['top ips last 15 minutes'],
      log: [
        { kind: 'said', text: 'top ips last 15 minutes' },
        { kind: 'run', text: 'fw top src --last 15m' },
        { kind: 'out', text: '198.51.100.23 · 41,220 req · 203.0.113.9 · 12,804 req' },
      ],
      fallback: 'No command for that. Try “top ips” or “unblock 203.0.113.9”.',
      commands: [
        { match: '(?:unblock|buka blokir|lepas)\\s+(\\d{1,3}(?:\\.\\d{1,3}){3})', run: 'fw rm deny src $1', out: ['rule removed · $1 allowed'] },
        {
          match: '\\b(?:block|blokir)\\s+(\\d{1,3}(?:\\.\\d{1,3}){3}(?:/\\d{1,2})?)\\D+(\\d+)\\s*(?:h|hours?|jam)',
          run: 'fw deny src $1 ttl $2h',
          out: ['rule 7731 added · expires in $2 h'],
          risky: 'Blocks it on every edge.',
        },
        {
          match: '\\b(?:block|blokir)\\s+(\\d{1,3}(?:\\.\\d{1,3}){3}(?:/\\d{1,2})?)',
          run: 'fw deny src $1 ttl 24h',
          out: ['rule 7731 added · expires in 24 h'],
          risky: 'Blocks it on every edge.',
        },
        { match: '\\btop\\b.*(?:ip|source|sumber)|(?:ip|source).*\\btop\\b', run: 'fw top src --last 15m', out: ['198.51.100.23 · 41,220 req · 203.0.113.9 · 12,804 req'] },
        { match: '(?:rate.?limit|limit|batasi)\\s+(\\S+)\\s+(?:to|ke)\\s+(\\d+)', run: 'fw limit path $1 $2/min per ip', out: ['limit set on $1'] },
      ],
    },
  }),
]
