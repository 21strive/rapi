/**
 * Identify — who and what, at a glance. People, places, accounts and objects, each recognised by
 * the marks a person already reads (a face, a plate, a last four, a callsign), plus the marks of
 * the Rapi language itself. Variants are declared per pattern below and placed on the board by
 * ORDER, so neighbours differ in size, surface and domain.
 */
import { archetype } from '../../kit'
import type { MoodEntry } from '../../types'
import AccessPass from './AccessPass.vue'
import AccountPick from './AccountPick.vue'
import AvatarStack from './AvatarStack.vue'
import Callsign from './Callsign.vue'
import CardFace from './CardFace.vue'
import ContainerCode from './ContainerCode.vue'
import EnvStrip from './EnvStrip.vue'
import FileChips from './FileChips.vue'
import FormRule from './FormRule.vue'
import MarkFamily from './MarkFamily.vue'
import OnCallRota from './OnCallRota.vue'
import PairingCode from './PairingCode.vue'
import PersonCard from './PersonCard.vue'
import PlaceChip from './PlaceChip.vue'
import PlateFleet from './PlateFleet.vue'
import ProductTag from './ProductTag.vue'
import RefId from './RefId.vue'
import ShortcutKeys from './ShortcutKeys.vue'
import StateBadges from './StateBadges.vue'
import TokenSwatch from './TokenSwatch.vue'
import TravelPass from './TravelPass.vue'
import TypeVoice from './TypeVoice.vue'
import VersionChannel from './VersionChannel.vue'
import Wristband from './Wristband.vue'

/* ── Patterns ──────────────────────────────────────────────────────────────────────── */

const person = archetype(PersonCard, {
  name: 'Person',
  hint: 'Press a copy button to take the contact; on your own card, press the lamp to set your status',
  why: 'A face, a lamp and a local time say who someone is and whether to call now faster than any sentence about them.',
  tags: ['person', 'contact', 'presence', 'avatar', 'copy'],
})

const crowd = archetype(AvatarStack, {
  name: 'Who is here',
  hint: 'Point at a face or move along the stack with the arrow keys; the last key pages through the rest',
  why: 'A row of faces answers “who is in here” in one look; a list of names has to be read.',
  tags: ['people', 'avatars', 'presence', 'team'],
})

const rota = archetype(OnCallRota, {
  name: 'On call',
  hint: 'Step through the rota with the slot keys or the arrows; the orange lamp marks the slot that is now',
  why: 'Who answers right now is one face and one lamp; asking for it means searching a calendar.',
  tags: ['on call', 'rota', 'shift', 'person'],
})

const card = archetype(CardFace, {
  name: 'Card face',
  hint: 'Flip the switch to freeze or unfreeze the card',
  why: 'People recognise a card by its face and last four; freezing it is the one control that has to be at hand.',
  tags: ['card', 'payments', 'masked', 'freeze', 'switch'],
})

const account = archetype(AccountPick, {
  name: 'Account',
  hint: 'Pick an account with a press or the arrow keys; the sentence says what the choice means',
  why: 'A bank monogram and the last four tell accounts apart at once; reading full numbers aloud never does.',
  tags: ['account', 'bank', 'masked', 'radio'],
})

const pair = archetype(PairingCode, {
  name: 'Pairing code',
  hint: 'Read the code across; press New code for a fresh one, the rule under it runs down with the time left',
  why: 'A short grouped code is faster to read off one screen and type into another than any instruction.',
  tags: ['code', 'pairing', 'device', 'countdown', 'mono'],
})

const pass = archetype(TravelPass, {
  name: 'Travel pass',
  hint: 'Press Show code for the gate; copy the booking code',
  why: 'At a gate the pass must be read in a second: route, seat, gate, and a code to scan.',
  tags: ['ticket', 'boarding pass', 'travel', 'code'],
})

const callsign = archetype(Callsign, {
  name: 'Callsign',
  hint: 'Move along the letters with the arrow keys or the pointer to hear each spelled',
  why: 'A callsign is said letter by letter; seeing the spelling word under each letter removes the guess.',
  tags: ['callsign', 'radio', 'spelling', 'aviation'],
})

const plate = archetype(PlateFleet, {
  name: 'Vehicle plate',
  hint: 'Step through the fleet with the arrows',
  why: 'A plate is how a vehicle is known on the road; drawn as pressed, it is recognised before it is read.',
  tags: ['vehicle', 'plate', 'fleet', 'indonesia'],
})

const container = archetype(ContainerCode, {
  name: 'Container number',
  hint: 'Pick a part of the number to read what it says; the check digit shows its sum',
  why: 'A container number carries owner, serial and a check digit; the parts are read by eye in the yard, not in a sentence.',
  tags: ['container', 'iso 6346', 'check digit', 'logistics'],
})

const tag = archetype(ProductTag, {
  name: 'Shelf tag',
  hint: 'Pick the pack: price, SKU and barcode change with it',
  why: 'A tag is read at arm’s length: name, pack, price and the bars the till scans.',
  tags: ['product', 'price', 'barcode', 'ean-13', 'sku'],
})

const files = archetype(FileChips, {
  name: 'Attachments',
  hint: 'Press a file to read what is inside; remove it with its cross or Delete, and undo',
  why: 'Type, name and size identify a file before it is opened; a paragraph about the files would not.',
  tags: ['files', 'attachments', 'chips', 'undo'],
})

const version = archetype(VersionChannel, {
  name: 'Version',
  hint: 'Switch channels to compare what each is running; copy the exact version',
  why: 'The exact build is a string people paste, not a sentence; the channel beside it says where it runs.',
  tags: ['version', 'release', 'channel', 'firmware'],
})

const env = archetype(EnvStrip, {
  name: 'Environment',
  hint: 'Switch the environment and watch the mark change; live gets the orange lamp',
  why: 'Whether a screen touches the real thing has to be seen before anything is pressed.',
  tags: ['environment', 'production', 'live', 'test mode'],
})

const keys = archetype(ShortcutKeys, {
  name: 'Shortcut',
  hint: 'Focus the tile and press the keys, or press the keycaps',
  why: 'Keys are learned by pressing them; a keycap that lights is faster than a list of chords to memorise.',
  tags: ['keyboard', 'shortcuts', 'kbd', 'keys'],
})

const band = archetype(Wristband, {
  name: 'Wristband',
  hint: 'Press Scan band to match the band to what is about to happen',
  why: 'The right person is confirmed by matching what is on their wrist, not by asking their name twice.',
  tags: ['wristband', 'patient', 'scan', 'identity'],
})

const access = archetype(AccessPass, {
  name: 'Access pass',
  hint: 'Turn the pass over with Front and Back, or the arrow keys',
  why: 'A pass is checked in a glance at a door: face, name, until when, and where it opens.',
  tags: ['badge', 'pass', 'access', 'lanyard'],
})

const place = archetype(PlaceChip, {
  name: 'Place',
  hint: 'Switch between decimal and degrees, minutes, seconds; copy the coordinates',
  why: 'A pin, a local time and coordinates someone can paste identify a place better than directions.',
  tags: ['place', 'location', 'coordinates', 'time zone'],
})

const badges = archetype(StateBadges, {
  name: 'Status tags',
  hint: 'Press a tag to move it along its workflow; arrow keys on a tag step forward and back',
  why: 'PAID, IN REVIEW, P1: a tag reads in a glance down a column, where sentences would have to be read one by one.',
  tags: ['badge', 'status', 'tag', 'workflow'],
})

const ref = archetype(RefId, {
  name: 'Reference',
  hint: 'Copy takes the whole value; open the parts and walk them with the arrow keys',
  why: 'An identifier is pasted, not paraphrased; its parts and check digit say what it is at a look.',
  tags: ['id', 'reference', 'check digit', 'copy', 'mono'],
})

const token = archetype(TokenSwatch, {
  name: 'Colour token',
  hint: 'Point at a token or move with the arrow keys to read its live value; press to copy its name',
  why: 'A colour is learned by seeing it in use and taking its name; a hex in a sentence teaches nothing.',
  tags: ['rapi', 'colour', 'token', 'swatch'],
})

const voice = archetype(TypeVoice, {
  name: 'Type voice',
  hint: 'Use the control on each specimen: drag the weight, switch the voice, change the cut',
  why: 'Type is recognised by its look; one specimen with a control shows the rule faster than a style guide.',
  tags: ['rapi', 'type', 'geist', 'mono', 'pixel'],
})

const marks = archetype(MarkFamily, {
  name: 'The marks',
  hint: 'Pick a member of the family, a dimension of the construction, or the shape behind the cover',
  why: 'A mark is known by sight; the family and its construction are faster seen than described.',
  tags: ['rapi', 'logo', 'brand', 'mark'],
})

const rule = archetype(FormRule, {
  name: 'Form rule',
  hint: 'Do the rule: sort, lift, drag or play',
  why: 'A rule of form is understood the moment it is done once; a paragraph about corners convinces nobody.',
  tags: ['rapi', 'shape', 'rules', 'motion', 'grid'],
})

/* ── Variants ──────────────────────────────────────────────────────────────────────── */

const v = {
  /* Person */
  personDesigner: person({
    id: 'identify-person-designer',
    size: '2x1',
    domain: 'workspace',
    props: { name: 'Rina Hartono', role: 'Product designer', team: 'Design', presence: 'online', email: 'rina@kopralabs.id' },
  }),
  personNurse: person({
    id: 'identify-person-nurse',
    size: '1x1',
    domain: 'health',
    surface: 'muted',
    props: { name: 'Nadia Rahman', role: 'Clinical nurse · Ward 3', presence: 'online', status: 'On shift', ext: '3104', layout: 'tile' },
  }),
  personOncall: person({
    id: 'identify-person-oncall',
    size: '2x2',
    domain: 'devops',
    surface: 'dark',
    name: 'Person on call',
    props: {
      name: 'Rizky Pratama',
      role: 'Site reliability engineer',
      team: 'Platform',
      eyebrow: 'Platform · on call',
      presence: 'online',
      status: 'On call',
      email: 'rizky.pratama@lentera.co.id',
      phone: '+62 812-0417-2290',
      lines: [{ label: 'Escalate', value: 'Kevin Tan, then Arjun Mehta' }],
      note: 'On call until Mon 9 Nov, 09:00 WIB.',
      layout: 'card',
    },
  }),
  personFarmer: person({
    id: 'identify-person-farmer',
    size: '2x2',
    domain: 'agri',
    name: 'Contact card',
    props: {
      name: 'Ahmad Fauzi',
      role: 'Farm manager · Koperasi Tani Sumber Rejeki',
      eyebrow: 'Agronomy · Ngawi',
      presence: 'away',
      status: 'In the field',
      phone: '+62 852-1290-4471',
      email: 'ahmad.fauzi@sumberrejeki.coop',
      lines: [
        { label: 'Plots', value: 'C-12, C-14, D-3 · 6.1 ha' },
        { label: 'Speaks', value: 'Javanese, Indonesian' },
      ],
      note: 'Back on signal around 15:00 WIB. A text reaches him first.',
      layout: 'card',
    },
  }),
  personSelf: person({
    id: 'identify-person-self',
    size: '1x1',
    domain: 'banking',
    name: 'Your status',
    props: { name: 'Butet Simanjuntak', role: 'Auditor · Internal audit', presence: 'busy', status: 'In a review', layout: 'tile', self: true },
  }),

  /* Who is here */
  crowdDoc: crowd({
    id: 'identify-crowd-doc',
    size: '2x1',
    domain: 'workspace',
    props: {
      eyebrow: 'Editing now',
      title: 'Rencana Q4 · peluncuran Sesi',
      summary: '2 typing',
      people: [
        { name: 'Rina Hartono', note: 'typing on slide 4', presence: 'online' },
        { name: 'Kevin Tan', note: 'commenting on slide 2', presence: 'online' },
        { name: 'Putri Maharani', note: 'viewing', presence: 'away' },
        { name: 'Arjun Mehta', note: 'typing on slide 9', presence: 'online' },
        { name: 'Laras Wulandari', note: 'viewing', presence: 'online' },
        { name: 'Sofia Marques', note: 'viewing from Lisbon', presence: 'away' },
      ],
    },
  }),
  crowdBridge: crowd({
    id: 'identify-crowd-bridge',
    size: '3x2',
    domain: 'security',
    surface: 'dark',
    name: 'Incident bridge',
    hint: 'Pick a person with a press or the arrow keys to see their role and when they joined',
    props: {
      layout: 'list',
      eyebrow: 'Incident bridge · INC-2207',
      title: 'Card testing on checkout',
      people: [
        { name: 'Yusuf Hakim', note: 'Incident commander', since: '13:41 WIB', place: 'SOC · Jakarta', presence: 'online', live: 'Speaking' },
        { name: 'Fajar Nugroho', note: 'Investigator', since: '13:42 WIB', place: 'SOC · Jakarta', presence: 'online' },
        { name: 'Daniel Okafor', note: 'Network', since: '13:44 WIB', place: 'Infrastructure · Singapore', presence: 'online' },
        { name: 'Kevin Tan', note: 'Payments engineer', since: '13:46 WIB', place: 'Platform · Bandung', presence: 'online' },
        { name: 'Sari Wulandari', note: 'Payments analyst', since: '13:47 WIB', place: 'Finance · Jakarta', presence: 'online' },
        { name: 'Maya Kartika', note: 'Compliance', since: '13:50 WIB', place: 'Risk · Jakarta', presence: 'online' },
        { name: 'Andika Saputra', note: 'Data, pulling logs', since: '13:52 WIB', place: 'Data · Yogyakarta', presence: 'busy' },
        { name: 'Putri Maharani', note: 'Customer comms', since: '13:58 WIB', place: 'Support · Surabaya', presence: 'away' },
        { name: 'Dewi Anggraini', note: 'Head of risk', since: '14:05 WIB', place: 'Risk · Jakarta', presence: 'online' },
      ],
    },
  }),
  crowdLoop: crowd({
    id: 'identify-crowd-loop',
    size: '1x1',
    domain: 'aerospace',
    name: 'On the net',
    props: {
      layout: 'mini',
      eyebrow: 'Count net',
      title: 'Static fire · Stand 2',
      people: [
        { name: 'Bima Prasetyo', note: 'Launch director', presence: 'online' },
        { name: 'Dimas Pratama', note: 'Flight dynamics', presence: 'online' },
        { name: 'Andi Makkasau', note: 'Ground station', presence: 'online' },
        { name: 'Rahmat Hidayat', note: 'Propulsion', presence: 'online' },
        { name: 'Yosef Kambu', note: 'Range safety', presence: 'online' },
        { name: 'Ketut Arya', note: 'Weather', presence: 'online' },
        { name: 'Mega Lestari', note: 'Avionics', presence: 'online' },
        { name: 'Galih Permana', note: 'Pad lead', presence: 'online' },
        { name: 'Nur Aini', note: 'Telemetry', presence: 'online' },
        { name: 'Hendra Gunawan', note: 'Fuel', presence: 'away' },
        { name: 'Rudi Hartanto', note: 'Comms', presence: 'online' },
        { name: 'Wulan Sari', note: 'Recovery', presence: 'online' },
        { name: 'Ivan Lim', note: 'Flight software', presence: 'online' },
        { name: 'Rani Kusuma', note: 'Safety', presence: 'online' },
      ],
    },
  }),
  crowdNewsroom: crowd({
    id: 'identify-crowd-newsroom',
    size: '2x1',
    domain: 'media',
    surface: 'muted',
    props: {
      eyebrow: 'On the front page',
      title: 'Edisi Jumat, 6 Nov 2026',
      summary: 'closes 22:00 WIB',
      people: [
        { name: 'Laras Wulandari', note: 'editor, page one', presence: 'online' },
        { name: 'Bayu Aji', note: 'reporter in Makassar', presence: 'online' },
        { name: 'Citra Dewi', note: 'photo desk', presence: 'busy' },
        { name: 'Reza Mahendra', note: 'copy desk, headline', presence: 'online' },
        { name: 'Tania Hutagalung', note: 'data desk, flood map', presence: 'away' },
      ],
    },
  }),

  /* On call */
  rotaPlatform: rota({
    id: 'identify-rota-platform',
    size: '2x2',
    domain: 'devops',
    props: {
      eyebrow: 'On call · Platform',
      team: 'Platform SRE',
      channel: '#platform-oncall',
      slots: [
        { label: 'Now', name: 'Rizky Pratama', role: 'Site reliability engineer', from: 'Thu 5 Nov 09:00 WIB', to: 'Mon 9 Nov 09:00 WIB', backup: 'Kevin Tan' },
        { label: 'Next', name: 'Kevin Tan', role: 'Backend engineer', from: 'Mon 9 Nov 09:00 WIB', to: 'Mon 16 Nov 09:00 WIB', backup: 'Arjun Mehta' },
        { label: '16 Nov', name: 'Arjun Mehta', role: 'Solutions architect', from: 'Mon 16 Nov 09:00 WIB', to: 'Mon 23 Nov 09:00 WIB', backup: 'Andika Saputra' },
      ],
    },
  }),
  rotaWard: rota({
    id: 'identify-rota-ward',
    size: '2x1',
    domain: 'health',
    name: 'Duty doctor',
    props: {
      layout: 'row',
      eyebrow: 'Duty doctor · Ward 3',
      team: 'Ward 3',
      nowLabel: 'On duty now',
      slots: [
        { label: 'Tonight', name: 'Hana Pradipta', role: 'Internist, Sp.PD', from: 'Thu 21:00', to: 'Fri 07:00 WIB', backup: 'Yohanes Sitorus' },
        { label: 'Fri day', name: 'Yohanes Sitorus', role: 'General practitioner', from: 'Fri 07:00', to: 'Fri 14:00 WIB', backup: 'Melati Anwar' },
        { label: 'Fri evening', name: 'Melati Anwar', role: 'Internist, Sp.PD', from: 'Fri 14:00', to: 'Fri 21:00 WIB', backup: 'Hana Pradipta' },
      ],
    },
  }),
  rotaGrid: rota({
    id: 'identify-rota-grid',
    size: '2x2',
    domain: 'energy',
    surface: 'dark',
    name: 'Shift at the desk',
    props: {
      eyebrow: 'Control room · Jawa–Bali',
      team: 'Grid control',
      channel: 'Radio · ch 4',
      nowLabel: 'On shift now',
      slots: [
        { label: 'Siang', name: 'Yoga Pranata', role: 'Grid operator', from: 'Thu 5 Nov 15:00 WIB', to: 'Thu 5 Nov 23:00 WIB', backup: 'Teuku Rahmat, field' },
        { label: 'Malam', name: 'Agung Wicaksono', role: 'Grid operator', from: 'Thu 5 Nov 23:00 WIB', to: 'Fri 6 Nov 07:00 WIB', backup: 'Teuku Rahmat, field' },
        { label: 'Pagi', name: 'Rina Septiani', role: 'Senior grid operator', from: 'Fri 6 Nov 07:00 WIB', to: 'Fri 6 Nov 15:00 WIB', backup: 'Dedi Kurniawan, field' },
      ],
    },
  }),
  rotaLine: rota({
    id: 'identify-rota-line',
    size: '2x1',
    domain: 'transit',
    surface: 'muted',
    name: 'Train controller',
    props: {
      layout: 'row',
      eyebrow: 'Train control · Line 2',
      team: 'Line 2',
      now: 1,
      nowLabel: 'At the desk now',
      slots: [
        { label: 'Early', name: 'Wahyu Setiawan', role: 'Train controller', from: '06:00', to: '14:00 WIB', backup: 'Dian Puspita' },
        { label: 'Late', name: 'Dian Puspita', role: 'Train controller', from: '14:00', to: '22:00 WIB', backup: 'Fransiskus Lake' },
        { label: 'Night', name: 'Fransiskus Lake', role: 'Train controller', from: '22:00', to: '06:00 WIB', backup: 'Wahyu Setiawan' },
      ],
    },
  }),

  /* Card face */
  cardVirtual: card({
    id: 'identify-card-virtual',
    size: '2x2',
    domain: 'payments',
    surface: 'brand',
    name: 'Virtual card',
    props: {
      issuer: 'Arunika Business',
      kind: 'Virtual',
      holder: 'Kevin Tan',
      purpose: 'Cloud and software',
      last4: '4417',
      expiry: '09/28',
      limit: 'Limit Rp 25.000.000 a month · Rp 8.412.300 used',
      face: 'line',
    },
  }),
  cardPhysical: card({
    id: 'identify-card-physical',
    size: '2x2',
    domain: 'banking',
    surface: 'dark',
    props: {
      issuer: 'Bank Sagara Corporate',
      kind: 'Physical',
      holder: 'Lina Wijaya',
      purpose: 'Operations · travel',
      last4: '6631',
      expiry: '03/29',
      limit: 'Limit Rp 40.000.000 a month · travel and lodging',
      face: 'ink',
    },
  }),
  cardRow: card({
    id: 'identify-card-row',
    size: '2x1',
    domain: 'commerce',
    name: 'Store card',
    props: {
      issuer: 'Bank Pesisir',
      kind: 'Debit',
      holder: 'Kezia Pattiasina',
      purpose: 'Store petty cash · Ambon',
      last4: '8830',
      expiry: '11/27',
      limit: 'Limit Rp 5.000.000 a week',
      layout: 'row',
    },
  }),
  cardFuel: card({
    id: 'identify-card-fuel',
    size: '2x1',
    domain: 'logistics',
    surface: 'muted',
    name: 'Fuel card',
    props: {
      issuer: 'Arunika Fleet',
      kind: 'Fuel',
      holder: 'Fikri Ramadhan',
      purpose: 'Fuel · B 9124 UXT',
      last4: '1156',
      expiry: '06/28',
      frozen: true,
      frozenNote: 'Frozen 4 Nov · odometer mismatch',
      limit: 'Diesel only · Rp 3.500.000 a week',
      layout: 'row',
    },
  }),

  /* Account */
  accountPayout: account({
    id: 'identify-account-payout',
    size: '2x2',
    domain: 'commerce',
    name: 'Payout account',
    props: {
      eyebrow: 'Payout account',
      subject: 'Toko Kelontong Bu Ratna',
      mark: 'Payouts',
      selected: 'shop',
      footer: 'Today’s payout, Rp 3.418.500, goes to {account} at 17:00 WIB.',
      accounts: [
        { id: 'own', bank: 'Bank Pesisir', name: 'Ratna Sari', last4: '7731', currency: 'IDR' },
        { id: 'shop', bank: 'Arunika Bank', name: 'Toko Kelontong Bu Ratna', last4: '2207', currency: 'IDR' },
        { id: 'save', bank: 'Kencana Syariah', name: 'Tabungan usaha', last4: '0954', currency: 'IDR' },
      ],
    },
  }),
  accountTreasury: account({
    id: 'identify-account-treasury',
    size: '3x2',
    domain: 'banking',
    surface: 'dark',
    name: 'Sweep target',
    props: {
      layout: 'table',
      eyebrow: 'Sweep target',
      subject: 'PT Graha Niaga · 6 accounts',
      mark: 'Sweep',
      selected: 'conc',
      footer: 'Surplus above IDR 50 bn on Operating sweeps to {account} at 16:30 WIB.',
      accounts: [
        { id: 'op', bank: 'Arunika Bank', name: 'Operating', last4: '5068', currency: 'IDR', balance: '48.21 bn' },
        { id: 'pay', bank: 'Bank Sagara', name: 'Payroll', last4: '1180', currency: 'IDR', balance: '6.40 bn' },
        { id: 'conc', bank: 'Bank Lestari Jaya', name: 'Concentration', last4: '5521', currency: 'IDR', balance: '12.90 bn' },
        { id: 'usd', bank: 'Arunika Bank', name: 'Dollar operating', last4: '0310', currency: 'USD', balance: '2,412,800' },
        { id: 'sgd', bank: 'Bank Sagara', name: 'Singapore', last4: '7004', currency: 'SGD', balance: '640,200' },
        { id: 'tax', bank: 'Bank Pesisir', name: 'Tax reserve', last4: '3398', currency: 'IDR', balance: '1.82 bn' },
      ],
    },
  }),
  accountSource: account({
    id: 'identify-account-source',
    size: '1x1',
    domain: 'payments',
    name: 'Pay from',
    hint: 'Press the account to switch to the next one',
    props: {
      layout: 'chip',
      eyebrow: 'Pay from',
      accounts: [
        { id: 'ops', bank: 'Arunika Bank', name: 'Operasional', last4: '4128', currency: 'IDR', balance: '2.84 bn' },
        { id: 'gaji', bank: 'Bank Sagara', name: 'Gaji kurir', last4: '7710', currency: 'IDR', balance: '910.5 M' },
        { id: 'cad', bank: 'Bank Pesisir', name: 'Cadangan', last4: '2045', currency: 'IDR', balance: '380.2 M' },
      ],
    },
  }),
  accountCoop: account({
    id: 'identify-account-coop',
    size: '2x1',
    domain: 'agri',
    surface: 'muted',
    props: {
      eyebrow: 'Payments in',
      subject: 'Koperasi Sumber Rejeki',
      mark: 'Receives',
      accounts: [
        { id: 'kas', bank: 'Bank Pesisir', name: 'Kas koperasi', last4: '4410', currency: 'IDR' },
        { id: 'sim', bank: 'Kencana Syariah', name: 'Simpanan anggota', last4: '7302', currency: 'IDR' },
      ],
    },
  }),

  /* Pairing code */
  pairTv: pair({
    id: 'identify-pair-tv',
    size: '1x1',
    domain: 'home',
    props: { eyebrow: 'Pair a screen', device: 'Living room TV', seed: 'identify-pair-tv', ttl: 300, where: 'Settings · Pair phone' },
  }),
  pairTerminal: pair({
    id: 'identify-pair-terminal',
    size: '2x2',
    domain: 'commerce',
    surface: 'dark',
    name: 'Enrol a terminal',
    props: {
      layout: 'card',
      eyebrow: 'Enrol a terminal',
      device: 'EDC Kasir 2 · Toko Kelontong Bu Ratna',
      seed: 'identify-pair-terminal',
      alphabet: '0123456789',
      groups: [4, 4],
      ttl: 600,
      font: 'pixel',
      steps: ['On the terminal, open Menu, then Admin, then Enrol.', 'Type the eight digits.', 'Wait for the beep and a test receipt.'],
    },
  }),
  pairCli: pair({
    id: 'identify-pair-cli',
    size: '2x1',
    domain: 'devops',
    surface: 'muted',
    name: 'Device login',
    hint: 'Copy the code, or press New code for a fresh one',
    props: {
      layout: 'row',
      eyebrow: 'Device login',
      device: 'Simpul CLI on build-runner-07',
      seed: 'identify-pair-cli',
      groups: [4, 4],
      joiner: '-',
      ttl: 900,
      where: 'Open simpul.app/device and type the code.',
      copyable: true,
    },
  }),
  pairRecovery: pair({
    id: 'identify-pair-recovery',
    size: '2x2',
    domain: 'security',
    name: 'Recovery codes',
    hint: 'Copy the unused codes; New codes asks for a second press before replacing them all',
    props: {
      layout: 'list',
      eyebrow: 'Recovery codes',
      device: 'Fajar Nugroho · SOC console',
      seed: 'identify-pair-recovery',
      alphabet: '0123456789',
      groups: [4, 4],
      joiner: '-',
      count: 8,
      used: [2, 5],
    },
  }),
  pairMonitor: pair({
    id: 'identify-pair-monitor',
    size: '1x1',
    domain: 'audio',
    name: 'Pairing PIN',
    props: {
      eyebrow: 'Pair monitor',
      device: 'Studio monitor L',
      seed: 'identify-pair-monitor',
      alphabet: '0123456789',
      groups: [3, 3],
      ttl: 120,
      where: 'Hold Pair on the back',
    },
  }),

  /* Travel pass */
  passFlight: pass({
    id: 'identify-pass-flight',
    size: '4x2',
    domain: 'aerospace',
    name: 'Boarding pass',
    props: {
      layout: 'full',
      mode: 'air',
      carrier: 'Nusa Air',
      service: 'NA 712',
      from: { code: 'CGK', city: 'Jakarta', time: '14:05', zone: 'WIB' },
      to: { code: 'DPS', city: 'Denpasar', time: '16:55', zone: 'WITA' },
      date: 'Thu 12 Nov 2026',
      passenger: 'PRATAMA/DIMAS MR',
      booking: 'K7QX2M',
      trip: '1 h 50 min · PK-NAX',
      fields: [
        { label: 'Gate', value: 'D7' },
        { label: 'Boards', value: '13:25' },
        { label: 'Seat', value: '14A' },
        { label: 'Group', value: '2' },
        { label: 'Class', value: 'Economy' },
      ],
    },
  }),
  passTrain: pass({
    id: 'identify-pass-train',
    size: '2x2',
    domain: 'transit',
    surface: 'muted',
    name: 'Train ticket',
    props: {
      mode: 'rail',
      carrier: 'Rel Nusantara',
      service: 'Ekspres Selatan 42',
      from: { code: 'GMR', city: 'Gambir, Jakarta', time: '08:15', zone: 'WIB' },
      to: { code: 'YK', city: 'Yogyakarta', time: '14:02', zone: 'WIB' },
      date: 'Fri 6 Nov 2026',
      passenger: 'WULANDARI/LARAS',
      booking: 'RN8K2Q4T',
      trip: '5 h 47 min · 6 stops',
      fields: [
        { label: 'Car', value: '3' },
        { label: 'Seat', value: '12C' },
        { label: 'Class', value: 'Eksekutif' },
        { label: 'Platform', value: '2' },
      ],
    },
  }),
  passFerry: pass({
    id: 'identify-pass-ferry',
    size: '2x1',
    domain: 'transit',
    name: 'Crossing ticket',
    props: {
      layout: 'stub',
      mode: 'ferry',
      carrier: 'Selat Ferry',
      service: 'KMP Bahari 3',
      from: { code: 'KTP', city: 'Ketapang', time: '20:00', zone: 'WIB' },
      to: { code: 'GLM', city: 'Gilimanuk', time: '22:00', zone: 'WITA' },
      date: 'Sat 7 Nov',
      passenger: 'SARI/NI LUH PUTU',
      booking: 'SF20461K',
      fields: [
        { label: 'Vehicle', value: 'DK 3051 FB' },
        { label: 'Class', value: 'Gol IV' },
        { label: 'Lane', value: '4' },
      ],
    },
  }),
  passStub: pass({
    id: 'identify-pass-stub',
    size: '2x1',
    domain: 'aerospace',
    surface: 'dark',
    name: 'Boarding pass stub',
    props: {
      layout: 'stub',
      mode: 'air',
      carrier: 'Nusa Air',
      service: 'NA 638',
      from: { code: 'UPG', city: 'Makassar', time: '06:40', zone: 'WITA' },
      to: { code: 'DJJ', city: 'Jayapura', time: '11:30', zone: 'WIT' },
      date: 'Fri 6 Nov',
      passenger: 'WANGGAI/MARTHEN MR',
      booking: 'P4LZ9W',
      fields: [
        { label: 'Seat', value: '3C' },
        { label: 'Gate', value: 'A2' },
        { label: 'Boards', value: '06:05' },
      ],
    },
  }),

  /* Callsign */
  callsignFlight: callsign({
    id: 'identify-callsign-flight',
    size: '2x1',
    domain: 'aerospace',
    props: {
      eyebrow: 'Callsign',
      callsign: 'NUSA 712',
      lines: [
        { label: 'Flight', value: 'NA 712 · CGK–DPS' },
        { label: 'Aircraft', value: 'PK-NAX · 180 seats' },
        { label: 'Squawk', value: '4521' },
      ],
    },
  }),
  callsignPatrol: callsign({
    id: 'identify-callsign-patrol',
    size: '1x1',
    domain: 'defense',
    surface: 'dark',
    name: 'Patrol callsign',
    props: { eyebrow: 'Air patrol', callsign: 'ELANG 21', font: 'pixel', layout: 'tile' },
  }),
  callsignVessel: callsign({
    id: 'identify-callsign-vessel',
    size: '2x2',
    domain: 'logistics',
    surface: 'dark',
    name: 'Vessel callsign',
    props: {
      eyebrow: 'Vessel callsign',
      callsign: 'YBKX',
      meta: 'Flag Indonesia',
      font: 'mono',
      layout: 'card',
      lines: [
        { label: 'Vessel', value: 'KM Samudra Jaya' },
        { label: 'MMSI', value: '525 012 345' },
        { label: 'IMO', value: '9384215' },
        { label: 'Type', value: 'Container ship · 1,740 TEU' },
        { label: 'Port', value: 'Surabaya' },
      ],
    },
  }),
  callsignRescue: callsign({
    id: 'identify-callsign-rescue',
    size: '1x1',
    domain: 'civic',
    name: 'Team callsign',
    props: { eyebrow: 'BPBD rescue', callsign: 'BADAK 7', font: 'mono', layout: 'tile' },
  }),

  /* Vehicle plate */
  plateTrucks: plate({
    id: 'identify-plate-trucks',
    size: '2x2',
    domain: 'logistics',
    name: 'Fleet plate',
    props: {
      eyebrow: 'Fleet · Surabaya depot',
      noun: 'truck',
      vehicles: [
        {
          plate: 'L 8812 UA',
          expiry: '08·29',
          kind: 'Box truck 8 t',
          status: 'Loading',
          tone: 'neutral',
          note: 'Dock 3 · 62 of 80 crates',
          lines: [
            { label: 'Driver', value: 'Hendra Wijaya' },
            { label: 'Odometer', value: '182,440 km' },
            { label: 'Service', value: 'Due at 185,000 km' },
          ],
        },
        {
          plate: 'B 9124 UXT',
          expiry: '03·28',
          kind: 'Wingbox 12 t',
          status: 'On route',
          tone: 'success',
          note: 'ETA Semarang 16:40 WIB',
          lines: [
            { label: 'Driver', value: 'Fikri Ramadhan' },
            { label: 'Odometer', value: '241,905 km' },
            { label: 'Fuel card', value: '···· 1156, frozen' },
          ],
        },
        {
          plate: 'W 1729 NK',
          expiry: '11·27',
          kind: 'Pickup 1 t',
          status: 'At depot',
          tone: 'neutral',
          note: 'Bay 6 since 07:10 WIB',
          lines: [
            { label: 'Driver', value: 'Not assigned' },
            { label: 'Odometer', value: '64,118 km' },
            { label: 'Service', value: 'Due at 70,000 km' },
          ],
        },
        {
          plate: 'AG 4410 RT',
          expiry: '05·30',
          kind: 'Box truck 8 t',
          status: 'In workshop',
          tone: 'warning',
          note: 'Brakes · back Mon 9 Nov',
          lines: [
            { label: 'Driver', value: 'Joko Susilo' },
            { label: 'Odometer', value: '155,302 km' },
            { label: 'Workshop', value: 'Bengkel Rungkut' },
          ],
        },
      ],
    },
  }),
  plateBus: plate({
    id: 'identify-plate-bus',
    size: '2x1',
    domain: 'transit',
    surface: 'dark',
    name: 'Bus plate',
    props: {
      layout: 'row',
      eyebrow: 'Koridor 6 · Ragunan–Dukuh Atas',
      noun: 'bus',
      vehicles: [
        { plate: 'B 7621 TGA', expiry: '04·28', kind: 'Bus 12 · low entry', status: 'In service', tone: 'success', note: '4 min to Dukuh Atas' },
        { plate: 'B 7633 TGA', expiry: '04·28', kind: 'Bus 14 · low entry', status: 'In service', tone: 'success', note: 'At Kuningan now' },
        { plate: 'B 7648 TGA', expiry: '09·28', kind: 'Bus 19 · articulated', status: 'Diverted', tone: 'warning', note: 'Flooding at Mampang' },
      ],
    },
  }),
  plateEv: plate({
    id: 'identify-plate-ev',
    size: '1x1',
    domain: 'energy',
    name: 'Charging bay',
    props: {
      layout: 'tile',
      eyebrow: 'Charging bays',
      noun: 'bay',
      vehicles: [
        { label: 'Bay 1', plate: 'B 1924 KZT', expiry: '02·29', kind: 'EV', status: 'Charging', tone: 'success', note: '64% · 22 kW' },
        { label: 'Bay 2', plate: 'B 2087 SJA', expiry: '07·30', kind: 'EV', status: 'Full · move', tone: 'warning', note: 'Full since 13:20 WIB' },
        { label: 'Bay 3', plate: 'D 4407 RX', expiry: '01·28', kind: 'EV', status: 'Charging', tone: 'success', note: '31% · 50 kW' },
      ],
    },
  }),
  platePermit: plate({
    id: 'identify-plate-permit',
    size: '1x1',
    domain: 'civic',
    surface: 'muted',
    name: 'Parking permit',
    props: {
      layout: 'tile',
      eyebrow: 'Parking permit',
      vehicles: [
        { label: 'Zona 2 · car', plate: 'L 1288 ND', expiry: '06·28', kind: 'Car', status: 'Valid', tone: 'success', note: 'To 31 Dec 2026' },
        { label: 'Zona 2 · motorbike', plate: 'L 4417 QA', expiry: '10·27', kind: 'Motorbike', status: 'Renew', tone: 'warning', note: 'Ends 30 Nov 2026' },
      ],
    },
  }),

  /* Container number */
  containerDry: container({
    id: 'identify-container-dry',
    size: '3x1',
    domain: 'logistics',
    props: {
      eyebrow: 'Tanjung Priok · bay 14, row 06, tier 82',
      owner: 'SKR',
      ownerName: 'PT Samudra Kargo',
      serial: '482913',
      sizeType: '45G1',
      sizeTypeText: '40 ft high cube, general purpose',
    },
  }),
  containerReefer: container({
    id: 'identify-container-reefer',
    size: '2x2',
    domain: 'agri',
    surface: 'dark',
    name: 'Reefer number',
    props: {
      layout: 'card',
      eyebrow: 'Reefer · Benoa',
      owner: 'NSL',
      ownerName: 'PT Nusantara Logistik',
      serial: '120488',
      sizeType: '45R1',
      sizeTypeText: '40 ft high cube, refrigerated',
      lines: [
        { label: 'Setpoint', value: '13.0 °C · humidity 90%' },
        { label: 'Cargo', value: 'Fresh mangosteen, 18.2 t' },
        { label: 'Plug', value: 'Reefer rack R4 · plug 12' },
      ],
    },
  }),
  containerTank: container({
    id: 'identify-container-tank',
    size: '2x1',
    domain: 'energy',
    surface: 'muted',
    name: 'Tank container',
    props: {
      layout: 'row',
      eyebrow: 'Tank container',
      owner: 'SGD',
      ownerName: 'PT Sagara Daya',
      serial: '300412',
      sizeType: '22T0',
      sizeTypeText: '20 ft tank for non-dangerous liquids, here biodiesel B40, 24,000 L',
    },
  }),

  /* Shelf tag */
  tagCoffee: tag({
    id: 'identify-tag-coffee',
    size: '2x2',
    domain: 'commerce',
    props: {
      eyebrow: 'Shelf C2 · kopi',
      name: 'Kopi Arabika Gayo',
      maker: 'PT Kopi Lereng · roasted 2 Nov 2026',
      notes: ['Medium roast'],
      packs: [
        { label: '250 g', sku: 'KL-GAYO-250', ean: '899100210521', price: 89000, per: 'Rp 356 / g', stock: 24 },
        { label: '500 g', sku: 'KL-GAYO-500', ean: '899100210522', price: 168000, per: 'Rp 336 / g', stock: 11 },
        { label: '1 kg', sku: 'KL-GAYO-1000', ean: '899100210523', price: 315000, per: 'Rp 315 / g', stock: 4 },
      ],
    },
  }),
  tagMedicine: tag({
    id: 'identify-tag-medicine',
    size: '2x1',
    domain: 'health',
    name: 'Pharmacy tag',
    props: {
      layout: 'row',
      eyebrow: 'Apotek · rak B4',
      name: 'Paracetamol 500 mg',
      maker: 'Tablet, generic · ED 08 2028',
      notes: ['Batch PCT26K031'],
      packs: [
        { label: 'Strip of 10', sku: 'PCT-500-10', ean: '899200431107', price: 4500, per: 'Rp 450 / tablet' },
        { label: 'Box of 100', sku: 'PCT-500-100', ean: '899200431114', price: 38000, per: 'Rp 380 / tablet' },
      ],
    },
  }),
  tagSeed: tag({
    id: 'identify-tag-seed',
    size: '2x1',
    domain: 'agri',
    surface: 'muted',
    name: 'Seed tag',
    props: {
      layout: 'row',
      eyebrow: 'Kios tani',
      name: 'Benih jagung hibrida SR-7',
      maker: 'Koperasi Tani Sumber Rejeki',
      notes: ['Germinates 95%'],
      packs: [
        { label: '1 kg', sku: 'SR7-1', ean: '899300887012', price: 92000, per: 'Sows 0.05 ha' },
        { label: '5 kg', sku: 'SR7-5', ean: '899300887029', price: 430000, per: 'Sows 0.25 ha' },
      ],
    },
  }),
  tagBulb: tag({
    id: 'identify-tag-bulb',
    size: '1x2',
    domain: 'home',
    name: 'Shelf tag, tall',
    props: {
      layout: 'tall',
      eyebrow: 'Shelf A1 · lampu',
      name: 'Lampu LED 9 W · E27',
      maker: '806 lm · 15,000 h',
      packs: [
        { label: '2700 K', sku: 'LED9-E27-27', ean: '899400152036', price: 32500, per: 'Warm white' },
        { label: '6500 K', sku: 'LED9-E27-65', ean: '899400152043', price: 29900, per: 'Daylight' },
      ],
    },
  }),

  /* Attachments */
  filesStatement: files({
    id: 'identify-files-statement',
    size: '2x1',
    domain: 'banking',
    props: {
      eyebrow: 'Statement · Arunika ···· 5068',
      files: [
        { name: 'rekening-koran-okt-2026.pdf', type: 'PDF', size: '1.2 MB', meta: '14 pages · sent by the bank 1 Nov, 06:00 WIB' },
        { name: 'mutasi-okt-2026.csv', type: 'CSV', size: '86 KB', meta: '1,284 rows · exported by Sari Wulandari, 09:14 WIB' },
      ],
    },
  }),
  filesLab: files({
    id: 'identify-files-lab',
    size: '2x2',
    domain: 'health',
    surface: 'muted',
    name: 'Results',
    props: {
      eyebrow: 'Results · Sri Rahayu',
      files: [
        { name: 'hematologi-lengkap.pdf', type: 'PDF', size: '220 KB', meta: '2 pages · laboratory, 4 Nov 10:12 WIB' },
        { name: 'ekg-12-lead.pdf', type: 'PDF', size: '1.8 MB', meta: '1 page · cardiology, 4 Nov 11:40 WIB' },
        { name: 'thorax-pa.dcm', type: 'DCM', size: '48.6 MB', meta: '1 series, 2 images · radiology, 4 Nov 13:05 WIB' },
        { name: 'resume-medis.pdf', type: 'PDF', size: '140 KB', meta: '3 pages · dr. Hana Pradipta, 5 Nov 08:30 WIB' },
      ],
    },
  }),
  filesRelease: files({
    id: 'identify-files-release',
    size: '4x1',
    domain: 'devops',
    surface: 'dark',
    name: 'Release files',
    props: {
      layout: 'strip',
      eyebrow: 'Release · rapi 0.2.0',
      files: [
        { name: 'rapi-0.2.0.tgz', type: 'TGZ', size: '412 KB', meta: 'Package · built 5 Nov, 02:14 WIB' },
        { name: 'sbom.cdx.json', type: 'JSON', size: '96 KB', meta: '214 components, CycloneDX' },
        { name: 'checksums.txt', type: 'TXT', size: '1 KB', meta: 'SHA-256 of every file in the release' },
      ],
    },
  }),
  filesStory: files({
    id: 'identify-files-story',
    size: '2x1',
    domain: 'media',
    props: {
      eyebrow: 'Story · banjir Kampung Melayu',
      files: [
        { name: 'naskah-v3.docx', type: 'DOCX', size: '48 KB', meta: '1,140 words · Bayu Aji, 13:02 WIB' },
        { name: 'foto-lapangan.zip', type: 'ZIP', size: '212 MB', meta: '36 photos · Citra Dewi, 12:40 WIB' },
      ],
    },
  }),

  /* Version */
  versionService: version({
    id: 'identify-version-service',
    size: '2x1',
    domain: 'devops',
    props: {
      eyebrow: 'payments-core',
      product: 'payments-core',
      current: 'stable',
      channels: [
        { id: 'stable', label: 'Stable', version: '4.12.0', build: 'a3f9c2e', note: '3 Nov 2026 · 100% of traffic', state: { label: 'Serving', tone: 'success' } },
        { id: 'canary', label: 'Canary', version: '4.13.0-rc.2', build: '7d10b4e', note: '5 Nov 2026 · 5% of traffic', state: { label: 'Canary', tone: 'neutral' } },
        { id: 'nightly', label: 'Nightly', version: '4.13.0-nightly.1105', build: 'e81c55d', note: '5 Nov 2026, 02:00 WIB · not deployed', state: { label: 'Build only', tone: 'neutral' } },
      ],
    },
  }),
  versionThermostat: version({
    id: 'identify-version-thermostat',
    size: '1x1',
    domain: 'home',
    surface: 'dark',
    name: 'Firmware',
    hint: 'Switch the channel to see what it would run',
    props: {
      layout: 'tile',
      eyebrow: 'Thermostat · kamar',
      current: 'stable',
      channels: [
        { id: 'stable', label: 'Stable', version: 'fw 2.8.1', state: { label: 'Installed', tone: 'success' } },
        { id: 'beta', label: 'Beta', version: 'fw 2.9.0-b3', state: { label: 'Available', tone: 'neutral' } },
      ],
    },
  }),
  versionConsole: version({
    id: 'identify-version-console',
    size: '1x1',
    domain: 'audio',
    surface: 'muted',
    name: 'Mixer OS',
    hint: 'Switch the channel to see what it would run',
    props: {
      layout: 'tile',
      eyebrow: 'Mixer OS',
      font: 'pixel',
      current: 'stable',
      channels: [
        { id: 'stable', label: 'Stable', version: '3.2.0', state: { label: 'Installed', tone: 'success' } },
        { id: 'beta', label: 'Beta', version: '3.3.0 b1', state: { label: 'Available', tone: 'neutral' } },
      ],
    },
  }),
  versionFlight: version({
    id: 'identify-version-flight',
    size: '2x1',
    domain: 'aerospace',
    surface: 'dark',
    name: 'Flight software',
    props: {
      eyebrow: 'Flight software · NUSA-SAT 2',
      product: 'nusasat2-fsw',
      current: 'flight',
      channels: [
        { id: 'flight', label: 'Flight', version: 'FSW 7.4.2', build: '9c4a0e1', note: 'Uplinked 28 Oct 2026, pass 2207', state: { label: 'On board', tone: 'success' } },
        { id: 'ground', label: 'Ground test', version: 'FSW 7.5.0-rc1', build: '1f7b3d2', note: 'On the flatsat since 2 Nov', state: { label: 'Testing', tone: 'neutral' } },
      ],
    },
  }),

  /* Environment */
  envCluster: env({
    id: 'identify-env-cluster',
    size: '4x1',
    domain: 'devops',
    props: {
      context: 'Ledger · api-gateway',
      current: 'prod',
      envs: [
        { id: 'prod', label: 'Production', detail: 'ap-southeast-3', live: true, note: 'Changes here reach 1.2 million customers. Deploys need two approvals.' },
        { id: 'staging', label: 'Staging', detail: 'ap-southeast-3 · staging', note: 'Production data from 02:00 WIB, masked. Safe to break.' },
        { id: 'preview', label: 'Preview', detail: 'pr-1902', note: 'Built from pull request 1902 by Kevin Tan. Gone in 7 days.' },
      ],
    },
  }),
  envKeys: env({
    id: 'identify-env-keys',
    size: '1x1',
    domain: 'payments',
    surface: 'muted',
    name: 'Test or live',
    hint: 'Flip the switch between test mode and live mode',
    props: {
      layout: 'switch',
      context: 'API keys',
      current: 'test',
      envs: [
        { id: 'live', label: 'Live mode', detail: 'sk_live_····9KD1', live: true, note: 'Real money moves.' },
        { id: 'test', label: 'Test mode', detail: 'sk_test_····4Q2A', note: 'Test cards only.' },
      ],
    },
  }),
  envPlant: env({
    id: 'identify-env-plant',
    size: '2x2',
    domain: 'energy',
    surface: 'dark',
    name: 'Live or simulator',
    props: {
      layout: 'card',
      context: 'Sagara Daya · Unit 2',
      current: 'sim',
      envs: [
        { id: 'live', label: 'Live plant', detail: 'Unit 2 · 600 MW · on the grid', live: true, note: 'Commands from this console move real equipment.' },
        { id: 'sim', label: 'Simulator', detail: 'Scenario 14 · feed pump trip', note: 'Training run by Yoga Pranata. Nothing here reaches the plant.' },
      ],
    },
  }),
  envExercise: env({
    id: 'identify-env-exercise',
    size: '3x1',
    domain: 'defense',
    surface: 'dark',
    name: 'Exercise or real',
    props: {
      layout: 'banner',
      context: 'Sector 7 air picture',
      current: 'exercise',
      envs: [
        { id: 'exercise', label: 'Exercise', detail: '', note: 'tracks are injected by the exercise cell' },
        { id: 'real', label: 'Real world', detail: '', live: true, note: 'tracks come from the radars' },
      ],
    },
  }),

  /* Shortcut */
  keysEditor: keys({
    id: 'identify-keys-editor',
    size: '2x2',
    domain: 'workspace',
    name: 'Shortcuts',
    props: {
      eyebrow: 'Shortcuts · Simpul docs',
      shortcuts: [
        { keys: ['mod', 'K'], label: 'Command menu', done: 'Command menu opened' },
        { keys: ['mod', 'shift', 'P'], label: 'Publish page', done: 'Ready to publish' },
        { keys: ['mod', '/'], label: 'Comment on a line', done: 'Comment started' },
        { keys: ['G'], then: 'I', label: 'Go to inbox', done: 'Went to the inbox' },
        { keys: ['?'], label: 'All shortcuts', done: 'Shortcut sheet shown' },
      ],
    },
  }),
  keysShuttle: keys({
    id: 'identify-keys-shuttle',
    size: '2x1',
    domain: 'media',
    surface: 'dark',
    name: 'Shuttle keys',
    hint: 'Focus the tile and press J, K and L; press twice to go faster',
    props: { layout: 'shuttle', eyebrow: 'Shuttle · J K L', clip: 'Wawancara Kampung Melayu, take 3' },
  }),
  keysTransport: keys({
    id: 'identify-keys-transport',
    size: '1x1',
    domain: 'audio',
    name: 'Transport keys',
    hint: 'Focus the tile and press Space to play, R to record',
    props: { layout: 'transport', eyebrow: 'Transport' },
  }),
  keysQueue: keys({
    id: 'identify-keys-queue',
    size: '2x1',
    domain: 'security',
    surface: 'muted',
    name: 'Triage keys',
    hint: 'Focus the tile: J and K move, A acknowledges, E escalates',
    props: {
      layout: 'queue',
      eyebrow: 'Alert queue',
      escalateTo: 'Yusuf Hakim',
      alerts: [
        { id: 'ALR-88213', title: 'Sign-in from a new country', severity: 'P2' },
        { id: 'ALR-88214', title: 'Card testing on checkout', severity: 'P1' },
        { id: 'ALR-88219', title: 'Admin role granted', severity: 'P3' },
        { id: 'ALR-88221', title: 'Firewall rule changed', severity: 'P3' },
        { id: 'ALR-88230', title: 'Many failed PINs on one card', severity: 'P2' },
      ],
    },
  }),

  /* Wristband */
  bandPatient: band({
    id: 'identify-band-patient',
    size: '4x1',
    domain: 'health',
    name: 'Patient band',
    props: {
      eyebrow: 'Inpatient · RSUD Sagara',
      name: 'RAHAYU, SRI',
      place: 'Melati 3 · bed 12',
      ids: [
        { label: 'RM', value: '12-04-88-31' },
        { label: 'Born', value: '14 Mar 1979' },
      ],
      flags: [
        { label: 'Allergy · penicillin', tone: 'danger', solid: true },
        { label: 'Fall risk', tone: 'warning' },
      ],
      seed: 'identify-band-patient',
      idle: 'Not scanned yet. Scan before every dose.',
      match: { title: 'Identity confirmed', detail: 'Name and date of birth match the order for paracetamol 1 g IV' },
    },
  }),
  bandNewborn: band({
    id: 'identify-band-newborn',
    size: '3x1',
    domain: 'health',
    surface: 'muted',
    name: 'Newborn band',
    props: {
      eyebrow: 'Newborn · RSUD Sagara',
      name: 'BY. NY. LESTARI',
      place: 'Girl · 3,120 g · 5 Nov, 03:14 WIB',
      ids: [
        { label: 'RM', value: '12-04-91-07' },
        { label: 'Mother', value: '12-04-90-55' },
      ],
      seed: 'identify-band-newborn',
      idle: 'Not scanned yet. Scan with the mother’s band at every handover.',
      match: { title: 'Mother and baby match', detail: 'Band 12-04-91-07 pairs with the mother’s 12-04-90-55' },
    },
  }),
  bandFestival: band({
    id: 'identify-band-festival',
    size: '2x1',
    domain: 'media',
    surface: 'dark',
    name: 'Event band',
    props: {
      layout: 'short',
      eyebrow: 'Pekan Musik Lereng 2026',
      name: 'BACKSTAGE · DAY 2',
      ids: [{ label: 'NFC', value: '04:A2:91:3C' }],
      flags: [{ label: 'Crew', tone: 'neutral', solid: true }],
      seed: 'identify-band-festival',
      match: { title: 'Access granted', detail: 'Backstage, until 23:00 WIB' },
    },
  }),
  bandVisitor: band({
    id: 'identify-band-visitor',
    size: '2x1',
    domain: 'security',
    name: 'Visitor band',
    props: {
      layout: 'short',
      eyebrow: 'Visitor · data hall B',
      name: 'OKAFOR, DANIEL',
      ids: [
        { label: 'Pass', value: 'V-0419' },
        { label: 'Host', value: 'F. Nugroho' },
      ],
      flags: [{ label: 'Escort', tone: 'warning' }],
      seed: 'identify-band-visitor',
      match: { title: 'Door B2 open', detail: 'Escort present' },
    },
  }),

  /* Access pass */
  accessStaff: access({
    id: 'identify-access-staff',
    size: '1x2',
    domain: 'workspace',
    name: 'Staff pass',
    props: {
      org: '21 Strive',
      strive: true,
      name: 'Rina Hartono',
      role: 'Product designer',
      id: '21S-0412',
      level: { label: 'Staff · all floors', tone: 'ink' },
      valid: 'to 31 Dec 2026',
      zones: [
        { name: 'Floors 2–4', allowed: true },
        { name: 'Server room', allowed: false },
        { name: 'Roof', allowed: false },
      ],
      back: [{ label: 'If found', value: 'Reception, floor 2' }],
      seed: 'identify-access-staff',
    },
  }),
  accessVisitor: access({
    id: 'identify-access-visitor',
    size: '1x2',
    domain: 'energy',
    surface: 'dark',
    name: 'Visitor pass',
    props: {
      org: 'Sagara Daya',
      name: 'Arjun Mehta',
      role: 'Visitor from Kopra Labs',
      id: 'V-1106-031',
      level: { label: 'Visitor · escort', tone: 'warning' },
      valid: 'today, to 17:00 WITA',
      zones: [
        { name: 'Admin building', allowed: true },
        { name: 'Control room', allowed: true, note: 'Escorted' },
        { name: 'Turbine hall', allowed: false },
        { name: 'Coal yard', allowed: false },
      ],
      back: [
        { label: 'Host', value: 'Yoga Pranata' },
        { label: 'Emergency', value: 'Ext. 222, muster point B' },
      ],
      seed: 'identify-access-visitor',
    },
  }),
  accessPort: access({
    id: 'identify-access-port',
    size: '2x2',
    domain: 'logistics',
    surface: 'muted',
    name: 'Port pass',
    props: {
      layout: 'landscape',
      org: 'Terminal 3 · Tanjung Perak',
      name: 'Marthen Wanggai',
      role: 'Port supervisor, PT Samudra Kargo',
      id: 'TPK-0388-2026',
      level: { label: 'Terminal · all berths', tone: 'ink' },
      valid: 'to 30 Jun 2027',
      zones: [
        { name: 'Berths 1–4', allowed: true },
        { name: 'Reefer yard', allowed: true },
        { name: 'Customs hold', allowed: false },
        { name: 'Fuel jetty', allowed: false },
      ],
      back: [{ label: 'Issued', value: 'Port security, 12 Jan 2026' }],
      seed: 'identify-access-port',
    },
  }),
  accessPress: access({
    id: 'identify-access-press',
    size: '1x3',
    domain: 'civic',
    name: 'Press pass',
    props: {
      layout: 'tall',
      org: 'Forum Kota Lestari',
      name: 'Laras Wulandari',
      role: 'Media · Harian Pagi Nusantara',
      id: 'MED-2026-0147',
      level: { label: 'Media', tone: 'ink' },
      valid: '10–12 Nov 2026',
      zones: [
        { name: 'Plenary hall', allowed: true },
        { name: 'Press room', allowed: true },
        { name: 'Delegates’ lounge', allowed: false },
        { name: 'Stage', allowed: false },
      ],
      back: [
        { label: 'Press desk', value: 'Hall B, ext. 140' },
        { label: 'If found', value: 'Accreditation desk, gate 1' },
      ],
      seed: 'identify-access-press',
    },
  }),

  /* Place */
  placeWarehouse: place({
    id: 'identify-place-warehouse',
    size: '1x1',
    domain: 'logistics',
    hint: 'Press the coordinates to switch their format; copy them',
    props: { layout: 'tile', eyebrow: 'Warehouse', name: 'Gudang Sentani', area: 'Jayapura, Papua', lat: -2.5634, lon: 140.5156, zone: 'WIT' },
  }),
  placePlot: place({
    id: 'identify-place-plot',
    size: '2x2',
    domain: 'agri',
    name: 'Field plot',
    props: {
      layout: 'card',
      eyebrow: 'Plot C-14',
      name: 'Sawah blok C-14',
      area: 'Ngawi, Jawa Timur',
      lat: -7.4039,
      lon: 111.4461,
      zone: 'WIB',
      extra: [
        { label: 'Area', value: '2.4 ha' },
        { label: 'Elevation', value: '58 m' },
        { label: 'Crop', value: 'Padi, day 64 of 110' },
      ],
      outline: [
        [-92, -54],
        [104, -61],
        [110, 57],
        [-86, 63],
      ],
    },
  }),
  placeTower: place({
    id: 'identify-place-tower',
    size: '1x1',
    domain: 'energy',
    name: 'Tower',
    hint: 'Press the coordinates to switch their format; copy them',
    props: { layout: 'tile', eyebrow: 'Tower', name: 'T-112 · 500 kV', area: 'Ungaran–Pedan line', lat: -7.1428, lon: 110.4064, zone: 'WIB', format: 'dms' },
  }),
  placeStation: place({
    id: 'identify-place-station',
    size: '2x1',
    domain: 'transit',
    surface: 'muted',
    name: 'Station',
    props: { eyebrow: 'Station', name: 'Manggarai · MRI', area: 'Jakarta Selatan · Bogor, Bekasi and airport lines', lat: -6.2101, lon: 106.8502, zone: 'WIB', format: 'dms' },
  }),
  placePost: place({
    id: 'identify-place-post',
    size: '1x1',
    domain: 'civic',
    name: 'Flood post',
    hint: 'Press the coordinates to switch their format; copy them',
    props: { layout: 'tile', eyebrow: 'Flood post', name: 'Posko banjir 3', area: 'Kampung Melayu', lat: -6.2245, lon: 106.8665, zone: 'WIB' },
  }),

  /* Status tags */
  badgesInvoices: badges({
    id: 'identify-badges-invoices',
    size: '3x2',
    domain: 'payments',
    name: 'Invoice status',
    props: {
      layout: 'table',
      eyebrow: 'Invoices · November',
      subject: '5 open',
      heads: ['Invoice', 'Customer', 'Amount', 'Due'],
      states: [
        { id: 'draft', label: 'Draft', tone: 'neutral', variant: 'outline' },
        { id: 'sent', label: 'Sent', tone: 'neutral' },
        { id: 'review', label: 'In review', tone: 'warning' },
        { id: 'paid', label: 'Paid', tone: 'success' },
        { id: 'overdue', label: 'Overdue', tone: 'danger' },
      ],
      items: [
        { id: 'INV-1184', title: 'INV-1184', meta: 'PT Graha Niaga', amount: 'Rp 18.400.000', due: '12 Nov', state: 'paid' },
        { id: 'INV-1185', title: 'INV-1185', meta: 'CV Rotan Cirebon', amount: 'Rp 6.250.000', due: '15 Nov', state: 'sent' },
        { id: 'INV-1186', title: 'INV-1186', meta: 'PT Kurir Kilat', amount: 'Rp 41.900.000', due: '1 Nov', state: 'overdue' },
        { id: 'INV-1187', title: 'INV-1187', meta: 'Toko Bu Ratna', amount: 'Rp 2.180.000', due: '20 Nov', state: 'draft' },
        { id: 'INV-1188', title: 'INV-1188', meta: 'PT Merapi Semen', amount: 'Rp 112.500.000', due: '18 Nov', state: 'review' },
      ],
    },
  }),
  badgesTicket: badges({
    id: 'identify-badges-ticket',
    size: '1x1',
    domain: 'devops',
    name: 'Priority',
    props: {
      layout: 'single',
      eyebrow: 'Priority',
      subject: 'Checkout',
      states: [
        { id: 'p1', label: 'P1', tone: 'danger', variant: 'solid', note: 'Respond in 15 min. Pages on-call.' },
        { id: 'p2', label: 'P2', tone: 'warning', variant: 'solid', note: 'Respond within the hour.' },
        { id: 'p3', label: 'P3', tone: 'neutral', note: 'Next business day.' },
        { id: 'p4', label: 'P4', tone: 'neutral', variant: 'outline', note: 'Backlog, no clock.' },
      ],
      items: [{ id: 'INC-4471', title: 'Checkout returns 502', state: 'p1' }],
    },
  }),
  badgesTriage: badges({
    id: 'identify-badges-triage',
    size: '2x2',
    domain: 'health',
    surface: 'dark',
    name: 'Triage tags',
    props: {
      eyebrow: 'IGD · triage board',
      subject: '4 waiting',
      states: [
        { id: 't1', label: '1 · Resuscitation', tone: 'danger', variant: 'solid', note: 'Seen now' },
        { id: 't2', label: '2 · Emergency', tone: 'danger', note: 'Seen within 10 min' },
        { id: 't3', label: '3 · Urgent', tone: 'warning', note: 'Seen within 30 min' },
        { id: 't4', label: '4 · Semi-urgent', tone: 'neutral', note: 'Seen within 60 min' },
        { id: 't5', label: '5 · Non-urgent', tone: 'neutral', variant: 'outline', note: 'Seen within 120 min' },
      ],
      items: [
        { id: 'Bed 1', title: 'Bed 1 · man, 58', meta: 'Chest pain for 40 min', state: 't2' },
        { id: 'Bed 2', title: 'Bed 2 · woman, 24', meta: 'Wrist fracture, left', state: 't4' },
        { id: 'Bed 3', title: 'Bed 3 · child, 6', meta: 'Fever 39.4 °C', state: 't3' },
        { id: 'Chair 4', title: 'Chair 4 · man, 31', meta: 'Cut on the hand', state: 't5' },
      ],
    },
  }),
  badgesShipments: badges({
    id: 'identify-badges-shipments',
    size: '1x3',
    domain: 'logistics',
    name: 'Shipment status',
    props: {
      layout: 'tall',
      eyebrow: 'Shipments today',
      states: [
        { id: 'booked', label: 'Booked', tone: 'neutral', variant: 'outline' },
        { id: 'picked', label: 'Picked up', tone: 'neutral' },
        { id: 'transit', label: 'In transit', tone: 'neutral', variant: 'solid' },
        { id: 'customs', label: 'Customs hold', tone: 'warning' },
        { id: 'delivered', label: 'Delivered', tone: 'success' },
        { id: 'returned', label: 'Returned', tone: 'danger' },
      ],
      items: [
        { id: 'NLX-48213', title: 'NLX-48213', meta: 'Surabaya → Makassar', state: 'transit' },
        { id: 'NLX-48220', title: 'NLX-48220', meta: 'Jakarta → Medan', state: 'delivered' },
        { id: 'NLX-48226', title: 'NLX-48226', meta: 'Batam → Singapore', state: 'customs' },
        { id: 'NLX-48231', title: 'NLX-48231', meta: 'Bandung → Denpasar', state: 'picked' },
        { id: 'NLX-48238', title: 'NLX-48238', meta: 'Semarang → Pontianak', state: 'booked' },
        { id: 'NLX-48244', title: 'NLX-48244', meta: 'Ambon → Jayapura', state: 'returned' },
      ],
    },
  }),
  badgesPermits: badges({
    id: 'identify-badges-permits',
    size: '2x1',
    domain: 'civic',
    surface: 'muted',
    name: 'Permit status',
    props: {
      eyebrow: 'Building approval · PBG',
      subject: 'Surabaya',
      states: [
        { id: 'submitted', label: 'Submitted', tone: 'neutral', variant: 'outline' },
        { id: 'verified', label: 'Verified', tone: 'neutral' },
        { id: 'returned', label: 'Returned', tone: 'warning', note: 'The applicant has 14 days to fix it' },
        { id: 'approved', label: 'Approved', tone: 'success', note: 'The permit can be printed' },
      ],
      items: [
        { id: 'PBG-0412', title: 'House, Jl. Kenjeran 12', state: 'verified' },
        { id: 'PBG-0419', title: 'Shophouse, Jl. Darmo 88', state: 'returned' },
      ],
    },
  }),

  /* Reference */
  refCommit: ref({
    id: 'identify-ref-commit',
    size: '1x1',
    domain: 'devops',
    surface: 'dark',
    name: 'Commit',
    hint: 'Copy takes the full hash; Whole value shows all forty characters',
    props: { layout: 'tile', eyebrow: 'Commit', value: 'a3f9c2e81d4b07f6c95e2a1d38b0c7e4f19a6d25', head: 7, title: 'Fix batch rounding', meta: 'main · Kevin Tan' },
  }),
  refTransfer: ref({
    id: 'identify-ref-transfer',
    size: '2x1',
    domain: 'payments',
    name: 'Transfer reference',
    props: {
      eyebrow: 'Transfer reference',
      value: 'FT26309ARUN04128821',
      head: 7,
      tail: 4,
      title: 'Rp 18.400.000 to PT Graha Niaga · BI-FAST',
      meta: 'Settled 14:02 WIB',
      parts: [
        { len: 2, label: 'Type', read: 'FT: a funds transfer' },
        { len: 5, label: 'Date', read: '26309: day 309 of 2026, Thu 5 Nov' },
        { len: 4, label: 'Bank', read: 'ARUN: sent by Arunika Bank' },
        { len: 8, label: 'Sequence', read: '04128821: the bank’s running number that day' },
      ],
    },
  }),
  refImei: ref({
    id: 'identify-ref-imei',
    size: '1x1',
    domain: 'security',
    name: 'Device IMEI',
    props: {
      layout: 'tile',
      eyebrow: 'IMEI',
      value: '352911084829136',
      scheme: 'luhn',
      title: 'Lost, reported 4 Nov',
      parts: [
        { len: 8, label: 'TAC', read: 'Type allocation code: the maker and the model' },
        { len: 6, label: 'Serial', read: 'Serial number of this handset' },
        { len: 1, label: 'Check', read: 'Check digit 6' },
      ],
    },
  }),
  refIsbn: ref({
    id: 'identify-ref-isbn',
    size: '1x1',
    domain: 'media',
    surface: 'muted',
    name: 'ISBN',
    props: {
      layout: 'tile',
      eyebrow: 'ISBN',
      value: '9786237451280',
      scheme: 'isbn',
      title: 'Catatan dari Lereng',
      parts: [
        { len: 3, label: 'EAN', read: '978: a book' },
        { len: 3, label: 'Group', read: '623: published in Indonesia' },
        { len: 4, label: 'Pub', read: '7451: the publisher' },
        { len: 2, label: 'Title', read: '28: this title' },
        { len: 1, label: 'Chk', read: 'Check digit 0' },
      ],
    },
  }),
  refAwb: ref({
    id: 'identify-ref-awb',
    size: '2x1',
    domain: 'aerospace',
    name: 'Air waybill',
    props: {
      eyebrow: 'Air waybill',
      value: '98144127731',
      scheme: 'awb',
      title: 'CGK → DJJ · 2 pieces · 48.5 kg',
      meta: 'Booked on NA 3812, Sat 7 Nov',
      parts: [
        { len: 3, label: 'Airline', read: '981: Nusa Air Cargo' },
        { len: 7, label: 'Serial', read: '4412773: the waybill number' },
        { len: 1, label: 'Check', read: 'Check digit 1' },
      ],
    },
  }),

  /* The language: colour */
  tokenCobalt: token({
    id: 'identify-token-cobalt',
    size: '2x1',
    domain: 'rapi',
    surface: 'brand',
    name: 'Cobalt',
    props: {
      title: 'Cobalt · 21 Strive primary',
      note: 'Brand, selection, focus and the one primary action in a flow.',
      tokens: [
        { token: '--r-feature-brand', label: 'feature-brand', role: 'The flat cobalt of a loud panel' },
        { token: '--r-brand', label: 'brand', role: 'Selection, focus, the current tab' },
        { token: '--r-brand-fill', label: 'brand-fill', role: 'Fills behind white labels' },
        { token: '--r-brand-text', label: 'brand-text', role: 'Links and selected labels' },
      ],
    },
  }),
  tokenSignal: token({
    id: 'identify-token-signal',
    size: '1x1',
    domain: 'rapi',
    name: 'Signal',
    hint: 'Press the swatch to copy its token',
    props: {
      title: 'Signal',
      tokens: [{ token: '--r-signal', label: 'signal', word: 'Live', role: 'Live, now, needs eyes. Never an error.' }],
    },
  }),
  tokenNeutral: token({
    id: 'identify-token-neutral',
    size: '4x1',
    domain: 'rapi',
    name: 'Neutral ramp',
    props: {
      layout: 'ramp',
      title: 'Neutral · 15 steps',
      note: 'Pure grey, no tint',
      start: 13,
      tokens: [
        { token: '--r-neutral-0', label: '0', role: 'Panels and inputs in light' },
        { token: '--r-neutral-25', label: '25', role: 'The light canvas' },
        { token: '--r-neutral-50', label: '50', role: 'Wells and table heads in light' },
        { token: '--r-neutral-100', label: '100', role: 'Hover, rules inside a panel' },
        { token: '--r-neutral-150', label: '150', role: 'Pressed, the rules between panels' },
        { token: '--r-neutral-200', label: '200', role: 'A step of the ramp, no role of its own' },
        { token: '--r-neutral-300', label: '300', role: 'Strong rules, chart axes' },
        { token: '--r-neutral-400', label: '400', role: 'Disabled text, the lamp that is off' },
        { token: '--r-neutral-500', label: '500', role: 'Tertiary text: 5.3 to 1 on white' },
        { token: '--r-neutral-600', label: '600', role: 'Secondary text' },
        { token: '--r-neutral-700', label: '700', role: 'Ink on hover' },
        { token: '--r-neutral-800', label: '800', role: 'Pressed in dark' },
        { token: '--r-neutral-850', label: '850', role: 'A step of the ramp, no role of its own' },
        { token: '--r-neutral-900', label: '900', role: 'Text and ink in light, the 21 Strive black' },
        { token: '--r-neutral-950', label: '950', role: 'The dark canvas' },
      ],
    },
  }),
  tokenStatus: token({
    id: 'identify-token-status',
    size: '2x2',
    domain: 'rapi',
    surface: 'dark',
    name: 'Lamps',
    hint: 'Change the lamp shape; switch Live to see the only blink; press a lamp to copy its token',
    props: {
      layout: 'lamps',
      title: 'Status lamps',
      tokens: [
        { token: '--r-status-good', label: 'good', word: 'Nominal', role: 'Good: done, settled, nominal' },
        { token: '--r-status-warning', label: 'warning', word: 'Degraded', role: 'Warning: waiting, close to a limit' },
        { token: '--r-status-serious', label: 'serious', word: 'Serious', role: 'Serious: worse than a warning, not yet critical' },
        { token: '--r-status-critical', label: 'critical', word: 'Critical', role: 'Critical: failed, blocked, an alarm' },
        { token: '--r-status-off', label: 'off', word: 'Offline', role: 'Off: no signal, not running' },
        { token: '--r-signal', label: 'signal', word: 'Live', role: 'Live: the only lamp that blinks' },
      ],
    },
  }),

  /* The language: type */
  voiceSans: voice({
    id: 'identify-voice-sans',
    size: '2x2',
    domain: 'rapi',
    name: 'Geist',
    hint: 'Drag across the letters or use the arrow keys to set the weight',
    props: { voice: 'sans' },
  }),
  voiceMono: voice({
    id: 'identify-voice-mono',
    size: '2x1',
    domain: 'rapi',
    name: 'Geist Mono',
    hint: 'Switch between plain, label and eyebrow; the spec is measured from the text',
    props: { voice: 'mono' },
  }),
  voicePixel: voice({
    id: 'identify-voice-pixel',
    size: '1x1',
    domain: 'rapi',
    surface: 'dark',
    name: 'Geist Pixel',
    hint: 'Switch between the square and the circle cut',
    props: { voice: 'pixel' },
  }),
  voiceFigures: voice({
    id: 'identify-voice-figures',
    size: '2x2',
    domain: 'rapi',
    surface: 'muted',
    name: 'Figures',
    hint: 'Switch between tabular and proportional figures; the widths are measured',
    props: { voice: 'figures' },
  }),

  /* The language: marks */
  marksFamily: marks({
    id: 'identify-marks-family',
    size: '2x1',
    domain: 'rapi',
    name: 'Logo family',
    hint: 'Pick a member with a press or the arrow keys; switch to the mark alone',
    props: { mode: 'family' },
  }),
  marksMark: marks({
    id: 'identify-marks-mark',
    size: '1x1',
    domain: 'rapi',
    surface: 'brand',
    name: 'The mark',
    hint: 'Press the mark for the next member of the family',
    props: { mode: 'mark' },
  }),
  marksConstruction: marks({
    id: 'identify-marks-construction',
    size: '2x2',
    domain: 'rapi',
    surface: 'muted',
    name: 'Construction',
    hint: 'Pick a dimension to see it measured; switch the guides off',
    props: { mode: 'construction' },
  }),
  marksCover: marks({
    id: 'identify-marks-cover',
    size: '2x2',
    domain: 'rapi',
    name: 'Supergraphic',
    hint: 'Pick the part of the logogram behind the cover; turn it to another corner',
    tags: ['supergraphic', 'cover'],
    props: { mode: 'cover' },
  }),

  /* The language: form */
  ruleSquare: rule({
    id: 'identify-rule-square',
    size: '2x1',
    domain: 'rapi',
    name: 'Square and round',
    hint: 'Switch Sort by shape to group the parts',
    props: { rule: 'square' },
  }),
  ruleRules: rule({
    id: 'identify-rule-rules',
    size: '2x2',
    domain: 'rapi',
    name: 'Rules, not shadows',
    hint: 'Open the menu: only what floats gets a shadow',
    props: { rule: 'rules' },
  }),
  ruleGrid: rule({
    id: 'identify-rule-grid',
    size: '1x2',
    domain: 'rapi',
    name: 'The 4px grid',
    hint: 'Drag the ruler or use the arrow keys: the padding snaps to 4 px',
    props: { rule: 'grid' },
  }),
  ruleMotion: rule({
    id: 'identify-rule-motion',
    size: '2x1',
    domain: 'rapi',
    surface: 'dark',
    name: 'Motion',
    hint: 'Pick a duration and press Play; switch Steps for an instrument readout',
    props: { rule: 'motion' },
  }),
}

/* ── Board order: neighbours differ in size, surface, domain and pattern ───────────── */

const ORDER: (keyof typeof v)[] = [
  'personOncall', 'marksFamily', 'passFerry', 'cardVirtual', 'placeWarehouse', 'versionThermostat', 'crowdDoc', 'tokenSignal',
  'plateEv', 'passFlight', 'badgesTicket', 'personNurse', 'containerTank', 'keysEditor', 'callsignPatrol', 'tagMedicine',
  'voiceSans', 'accountSource', 'envCluster', 'refIsbn', 'rotaGrid', 'filesStatement', 'pairTv', 'accessStaff',
  'tokenCobalt', 'plateTrucks', 'callsignFlight', 'personSelf', 'bandPatient', 'versionConsole', 'containerReefer', 'placeStation',
  'ruleSquare', 'crowdBridge', 'refCommit', 'tagCoffee', 'keysTransport', 'accountCoop', 'envExercise', 'marksMark',
  'passTrain', 'personDesigner', 'badgesShipments', 'pairTerminal', 'placePost', 'versionFlight', 'voiceFigures', 'cardRow',
  'refImei', 'filesRelease', 'rotaWard', 'platePermit', 'accessPort', 'keysShuttle', 'tokenStatus', 'callsignRescue',
  'accountPayout', 'bandVisitor', 'ruleGrid', 'badgesInvoices', 'pairMonitor', 'crowdNewsroom', 'envPlant', 'placeTower',
  'containerDry', 'personFarmer', 'voicePixel', 'refTransfer', 'accessVisitor', 'filesLab', 'crowdLoop', 'tagSeed',
  'marksConstruction', 'plateBus', 'envKeys', 'accountTreasury', 'keysQueue', 'rotaPlatform', 'bandFestival', 'tokenNeutral',
  'placePlot', 'pairCli', 'refAwb', 'cardPhysical', 'accessPress', 'ruleRules', 'passStub', 'filesStory',
  'badgesTriage', 'versionService', 'callsignVessel', 'tagBulb', 'rotaLine', 'marksCover', 'badgesPermits', 'cardFuel',
  'bandNewborn', 'pairRecovery', 'ruleMotion', 'voiceMono',
]

export const entries: MoodEntry[] = ORDER.map((key) => v[key])

if (import.meta.env.DEV) {
  const missing = Object.keys(v).filter((key) => !ORDER.includes(key as keyof typeof v))
  if (missing.length || new Set(ORDER).size !== ORDER.length) console.warn('[identify] board order is off:', missing)
}
