/**
 * The conversation with Simpul about Kopra Labs' settings. A sentence, in English or Indonesian,
 * becomes changes; changes gather in one change set that waits in "Needs you" with its diff. Ask
 * why, ask what is left or what changed last week, undo, apply from the thread or the surface.
 * Ownership and deletion never happen from a sentence: they wait for a hold or a typed name.
 * Anything outside the script gets a plain answer and an example, never an error.
 */
import type { CheckRow, DeskMessage, DeskReply, useDesk } from '../_kit/desk'
import { count, hits, norm } from '../_kit/desk'
import {
  OPENING,
  SESSIONS,
  eventLabel,
  footprint,
  namePattern,
  notificationEvents,
  regionCity,
  regionText,
  regionValues,
  scene,
  sessionText,
  zoneValues,
  type CardData,
  type Channel,
  type Role,
  type SessionLength,
} from './data'
import {
  aRole,
  firstOf,
  keyOf,
  labelOf,
  list,
  memberOf,
  nameOf,
  personIn,
  personOf,
  phrase,
  understood,
  valueText,
  type Change,
  type OrgModel,
  type Undone,
} from './model'

export type Desk = ReturnType<typeof useDesk>

/* ── Words ──────────────────────────────────────────────────────────────────────────── */

const RX = {
  why: '\\b(why|kenapa|mengapa|how come|alasannya)\\b|how did you (know|find|get)|\\bdari mana\\b',
  undo: '\\b(undo|revert|roll ?back|put (it|that|them) back|withdraw|kembalikan|urungkan|batalkan|batalin)\\b',
  discard: '\\b(discard|buang)\\b',
  cancel: '\\b(cancel|discard|never ?mind|forget it|batal|gak jadi|ga jadi|nggak jadi|enggak jadi|tidak jadi|lupakan)\\b',
  commitWord: '\\b(apply|approve|commit|terapkan|simpan|save|setujui)\\b',
  commit:
    '\\b(apply|approve|confirm|commit|go ahead|do it|ship it|looks good|lgtm|terapkan|setuju|setujui|simpan|jalankan|lakukan|save)\\b|^(ok|oke|okay|yes|ya|yep|sure|siap|gas|lanjut|go)\\b',
  status:
    "\\bwhat('?s| is) (left|pending|waiting|open|next)\\b|\\banything (else|left)\\b|\\bwhat needs me\\b|\\bstatus\\b|\\bapa lagi\\b|\\byang tersisa\\b|\\btinggal apa\\b|\\bsisanya\\b|\\bapa yang (belum|tersisa|menunggu)\\b",
  history:
    "\\b(history|riwayat)\\b|\\bwhat changed\\b|\\b(what|apa|show|lihat|tampilkan|which)\\b.*\\b(chang\\w*|ubah|diubah|ganti|berubah)\\b|\\b(last week|minggu lalu|pekan lalu|this week|minggu ini)\\b",
  regionStays:
    '\\b(region|wilayah|lokasi data|data)\\b.*\\b(stay|stays|tetap|keep|remain|remains|still)\\b|\\b(stay|stays|tetap|keep|remain)\\b.*\\b(jakarta|jkt)\\b',
  remind: '\\b(remind|reminder|nudge|ingatkan|ingetin|pengingat)\\b',
  deleteOrg:
    '\\b(delete|hapus|remove|close|tutup|shut down)\\b.*\\b(organi[sz]ation|organisasi|workspace|kopra labs|the org|whole org)\\b|\\b(organi[sz]ation|organisasi|workspace)\\b.*\\b(delete|hapus|dihapus)\\b',
  transfer:
    '\\b(transfer|hand over|handover|give|pass|serahkan|alihkan|pindahkan|kasih)\\b.*\\b(owner(ship)?|kepemilikan|pemilik)\\b',
  transferWord: '\\b(transfer|ownership|owner|kepemilikan|pemilik)\\b',
  deletionWord: '\\b(delet\\w*|hapus\\w*|penghapusan)\\b',
  greet: '^(hi|hello|hey|halo|hai|pagi|siang|sore|malam|selamat (pagi|siang|sore|malam))\\b',
  thanks: '\\b(thanks|thank you|thx|makasih|terima kasih|tq|nuhun)\\b',
  email: '[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}',
}

const VERB = {
  drop: "\\b(don'?t|do not|jangan|tanpa|skip|drop|leave out|without)\\b|\\b(keep|take|leave)\\b.*\\bout\\b",
  restore: '\\b(reinstate|restore|unsuspend|reactivate|re-?enable|pulihkan)\\b|\\baktifkan (lagi|kembali)\\b|\\bkembalikan akses\\b',
  remove:
    '\\b(remove|suspend|revoke|kick|deactivate|hapus|cabut|nonaktifkan|keluarkan|blokir|block|withdraw|tarik|cancel|batalkan)\\b',
  invite: '\\b(invite|add|tambah|tambahkan|tambahin|undang|masukkan|bring in|onboard)\\b',
  role: '\\b(make|set|jadikan|jadiin|ubah|ganti|change|promote|naikkan|turunkan|demote|switch|turn)\\b',
}

const ROLE_WORDS: [Role, string][] = [
  ['owner', '\\b(owner|pemilik)\\b'],
  ['admin', '\\badmin(istrator)?s?\\b'],
  ['billing', '\\b(billing|tagihan|keuangan)\\b'],
  ['viewer', '\\b(viewers?|read-?only|pembaca|view only|lihat saja)\\b'],
  ['developer', '\\b(developers?|devs?|engineers?|pengembang)\\b'],
]

const ON = '\\b(require|required|requiring|enforce|turn on|switch on|enable|wajib|wajibkan|aktifkan|nyalakan|mandatory|harus)\\b'
const OFF =
  "\\b(turn off|switch off|disable|stop requiring|no longer|don'?t require|matikan|nonaktifkan|tidak perlu|tidak wajib|jangan wajib|optional|opsional)\\b"

const EVENTS: [string, string][] = [
  [
    'member-joined',
    '\\b(someone|somebody|anyone|a member|members?|people|orang|anggota|seseorang)( new| baru)? (joins?|joined|bergabung|gabung|masuk)\\b|\\bnew (members?|people|joiners?)\\b|\\banggota baru\\b',
  ],
  ['deploy-failed', '\\bdeploy(ment)?s? (fail\\w*|gagal)\\b|\\bfail(ed|ing)? deploy\\w*|\\bgagal deploy\\b|\\bbuild (fail\\w*|gagal)\\b'],
  ['usage-80', '\\b(usage|quota|kuota|pemakaian)\\b'],
  ['invoice', '\\b(invoices?|tagihan|faktur|receipts?)\\b'],
  ['security', '\\bsecurity (alerts?|emails?)\\b|\\b(alert|peringatan) keamanan\\b'],
  ['weekly', '\\bweekly (usage )?reports?\\b|\\blaporan mingguan\\b'],
]

const CHANNEL_WORDS: [Channel, string][] = [
  ['email', '\\b(e-?mails?|emailing|surel)\\b'],
  ['inapp', '\\b(in-?app|in the app|di aplikasi)\\b'],
  ['webhook', '\\bwebhooks?\\b'],
]

const SLUG = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/

const ZONES: [string, string][] = [
  ['Asia/Jakarta', '\\b(jakarta|wib)\\b'],
  ['Asia/Makassar', '\\b(makassar|wita|bali|denpasar)\\b'],
  ['Asia/Jayapura', '\\b(jayapura|wit|papua)\\b'],
  ['Asia/Singapore', '\\b(singapore|singapura|sgt)\\b'],
  ['Asia/Kuala_Lumpur', '\\b(kuala lumpur|malaysia|myt)\\b'],
  ['UTC', '\\b(utc|gmt)\\b'],
  ['Europe/Amsterdam', '\\b(amsterdam|cet|belanda|netherlands)\\b'],
  ['America/Los_Angeles', '\\b(los angeles|pst|california)\\b'],
]

const LOCALES: [string, string][] = [
  ['id-ID', '\\b(bahasa indonesia|indonesian|indonesia|id-id)\\b'],
  ['en-US', '\\b(english \\(?us\\)?|american|en-us|us english)\\b'],
  ['en-GB', '\\b(english \\(?uk\\)?|british|en-gb|uk english|english)\\b'],
  ['nl-NL', '\\b(dutch|nederlands|nl-nl)\\b'],
]

/** Session lengths a sentence can name, by hours or by days. */
const HOURS: Record<number, SessionLength> = { 8: '8h', 24: '24h', 168: '7d', 720: '30d' }
const DAYS: Record<number, SessionLength> = { 1: '24h', 7: '7d', 30: '30d' }

const find = (pattern: string, text: string) => new RegExp(pattern, 'i').exec(text)
const cap = (text: string) => (text ? text[0].toUpperCase() + text.slice(1) : text)

/** Everyone the sentence names, members and directory people, in the order they are named. */
function peopleIn(t: string): string[] {
  const found: { id: string; at: number }[] = []
  for (const [id, pattern] of Object.entries(namePattern)) {
    const m = find(`\\b(${pattern})\\b`, t)
    if (m) found.push({ id, at: m.index })
  }
  return found.sort((a, b) => a.at - b.at).map((f) => f.id)
}

/* ── From a sentence to changes ─────────────────────────────────────────────────────── */

interface Parsed {
  changes: Change[]
  /** People (or setting keys) to take out of the change set. */
  drops: string[]
  notes: string[]
  /** A member named as the new owner: the transfer flow takes it from here. */
  owner?: string
  /** A card that answers instead, when nothing changed: "two-factor is already required". */
  card?: CardData
}

function parse(said: string, org: OrgModel): Parsed {
  const t = norm(said)
  const now = org.projected.value
  const found: { at: number; change: Change }[] = []
  const out: Parsed = { changes: [], drops: [], notes: [] }
  const add = (at: number, change: Change) => found.push({ at, change })

  /* Single sign-on */
  const sso = find('\\b(sso|single sign-?on|saml)\\b', t)
  if (sso) {
    if (hits(OFF, t)) add(sso.index, { kind: 'sso', on: false })
    else if (hits(ON, t) || hits('\\b(for everyone|for all|untuk semua|semua orang)\\b', t)) add(sso.index, { kind: 'sso', on: true, inferred: true })
  }

  /* Sessions: "8-hour sessions", "24 jam", "seminggu" */
  const hours = find('\\b(\\d+)\\s*-?\\s*(hours?|hrs?|h|jam)\\b', t)
  const days = find('\\b(\\d+)\\s*-?\\s*(days?|d|hari)\\b', t)
  const word = find('\\b(a week|one week|seminggu|a day|one day|sehari|a month|one month|sebulan)\\b', t)
  const span = hours ?? days ?? word
  if (span) {
    let value: SessionLength | undefined
    if (hours) value = HOURS[Number(hours[1])]
    else if (days) value = DAYS[Number(days[1])]
    else value = /week|minggu/.test(span[0]) ? '7d' : /month|bulan/.test(span[0]) ? '30d' : '24h'
    if (value && SESSIONS.includes(value)) add(span.index, { kind: 'session', to: value })
    else out.notes.push('Sessions can be 8 hours, 24 hours, 7 days or 30 days. Eight hours is one working day.')
  } else if (hits('\\b(keep|leave|don.?t change|jangan ubah|biarkan)\\b.*\\b(sessions?|sesi)\\b|\\b(sessions?|sesi)\\b.*\\b(as (it is|they are)|tetap|stay)\\b', t)) {
    out.drops.push('session')
  }

  /* Minimum password length */
  const chars = find('\\b(\\d+)\\s*-?\\s*(char(acter)?s?|karakter|huruf)\\b', t)
  if (chars) {
    const n = Number(chars[1])
    if (n >= 8 && n <= 32) add(chars.index, { kind: 'password', to: n })
    else out.notes.push('Passwords can be required to be 8 to 32 characters long.')
  }

  /* Two-factor */
  const twofa = find('\\b(two-?factor|2fa|mfa|dua faktor|authenticator)\\b', t)
  if (twofa) {
    const off = hits(OFF, t)
    if (!off && now.twofactor) {
      const s = org.facts.value
      const missing = s.missing.map((m) => firstOf(m.id))
      out.notes.push(
        `Two-factor has been required for every member since 12 Nov, admins included, and ${list(s.admins.map((m) => firstOf(m.id)))} have it on.${
          missing.length ? ` ${list(missing)} haven't set it up yet and are asked at their next sign-in.` : ''
        }`,
      )
      out.card = twofactorCard(org)
    } else add(twofa.index, { kind: 'twofactor', on: !off })
  }

  /* Alerts: an event and a channel */
  const channelHits = CHANNEL_WORDS.map(([channel, pattern]) => ({ channel, m: find(pattern, t) })).filter((c) => c.m)
  if (channelHits.length) {
    for (const [event, pattern] of EVENTS) {
      const e = find(pattern, t)
      if (!e) continue
      const off = hits("\\b(stop|no more|don'?t|turn off|mute|matikan|jangan|tanpa|berhenti|without|no)\\b", t)
      const current = now.notifications[event] ?? []
      let next = [...current]
      for (const { channel } of channelHits) {
        const locked = notificationEvents.find((n) => n.id === event)?.locked?.includes(channel)
        if (off && locked) {
          out.notes.push('Security alerts always go by email; that one stays on.')
          continue
        }
        next = off ? next.filter((c) => c !== channel) : next.includes(channel) ? next : [...next, channel]
      }
      add(e.index, { kind: 'notify', event, channels: next, inferred: hits('\\b(us|me|kami|saya|kita|aku)\\b', t) })
    }
  }

  /* Digest */
  const digest = find('\\b(digest|ringkasan)\\b', t)
  if (digest) {
    const to = hits('\\b(weekly|mingguan|monday|senin)\\b', t)
      ? 'weekly'
      : hits('\\b(daily|harian|every day|setiap hari)\\b', t)
        ? 'daily'
        : hits('\\b(off|stop|turn off|matikan|no)\\b', t)
          ? 'off'
          : null
    if (to) add(digest.index, { kind: 'digest', to })
  }

  /* Default region for new projects */
  const REGION_NAMES: [string, string][] = [
    ['jkt-1', '\\b(jakarta|jkt-?1?)\\b'],
    ['sin-1', '\\b(singapore|singapura|sin-?1)\\b'],
    ['fra-1', '\\b(frankfurt|fra-?1)\\b'],
    ['iad-1', '\\b(virginia|iad-?1|us east)\\b'],
  ]
  const aboutZone = hits('\\b(time ?zones?|zona waktu|tz)\\b', t) && !hits('\\b(region|wilayah|new projects?|proyek baru)\\b', t)
  if (!aboutZone && hits('\\b(move|pindah\\w*|start|mulai|default|new projects?|proyek baru|region|wilayah)\\b', t)) {
    for (const [value, pattern] of REGION_NAMES) {
      const r = find(pattern, t)
      if (r && regionValues.includes(value)) add(r.index, { kind: 'region', to: value })
    }
  }

  /* Timezone and locale, as in the General section of the Then screen */
  if (hits('\\b(time ?zones?|zona waktu|tz)\\b', t)) {
    const zone = ZONES.map(([value, pattern]) => ({ value, m: find(pattern, t) })).find((z) => z.m && zoneValues.includes(z.value))
    if (zone?.m) add(zone.m.index, { kind: 'timezone', to: zone.value })
    else out.notes.push('The timezone can be WIB, WITA, WIT, Singapore, Kuala Lumpur, UTC, Amsterdam or Los Angeles.')
  }
  if (hits('\\b(locale|language|bahasa|date format|format tanggal)\\b', t)) {
    const locale = LOCALES.map(([value, pattern]) => ({ value, m: find(pattern, t) })).find((l) => l.m)
    if (locale?.m) add(locale.m.index, { kind: 'locale', to: locale.value })
  }

  /* URL slug */
  const slug = find('\\b(url|slug|link|address)\\b.*?\\b(to|jadi|ke|menjadi)\\s+(?:simpul\\.app\\/)?([a-z0-9][a-z0-9-]*)', t)
  if (slug) {
    if (SLUG.test(slug[3])) add(slug.index, { kind: 'slug', to: slug[3] })
    else out.notes.push('A URL can use 3 to 40 lowercase letters, numbers and hyphens, like simpul.app/kopra.')
  }

  /* Organization name, kept as typed */
  const rename = /\b(?:rename(?: us| it| the org(?:anization)?| kopra labs)?|ganti nama(?: organisasi)?|ubah nama(?: organisasi)?)\s+(?:to|jadi|menjadi|ke)\s+["“]?(.+?)["”]?[.!]?\s*$/i.exec(said.trim())
  if (rename) {
    const name = rename[1].trim()
    if (name.length >= 2 && name.length <= 60) add(t.search(/rename|ganti nama|ubah nama/), { kind: 'name', to: name })
  }

  /* Members: clause by clause, "make Putri an admin, invite Rina from ops as admin" */
  const clauses = t
    .split(/\s*(?:,|;|\band\b|\bdan\b|\bserta\b|\blalu\b|\bthen\b|\bplus\b|\balso\b|\bjuga\b)\s*/)
    .map((text) => {
      const at = t.indexOf(text)
      const verb = hits(VERB.drop, text)
        ? 'drop'
        : hits(VERB.restore, text)
          ? 'restore'
          : hits(VERB.remove, text)
            ? 'remove'
            : hits(VERB.invite, text)
              ? 'invite'
              : hits(VERB.role, text)
                ? 'role'
                : null
      const role = ROLE_WORDS.find(([, pattern]) => hits(pattern, text))?.[0] ?? null
      return { text, at, verb, role, people: peopleIn(text) }
    })
  // A clause without a verb borrows the one before ("make Putri an admin and Tomás a developer");
  // a verb without a role borrows the next one ("make Putri and Tomás developers").
  clauses.forEach((c, i) => {
    if (!c.verb && c.people.length && (c.role || i > 0)) c.verb = clauses[i - 1]?.verb ?? (c.role ? 'role' : null)
  })
  for (let i = clauses.length - 2; i >= 0; i--) {
    const c = clauses[i]
    if (!c.role && (c.verb === 'role' || c.verb === 'invite') && clauses[i + 1].verb === c.verb) c.role = clauses[i + 1].role
  }

  for (const c of clauses) {
    if (!c.verb) continue
    for (const id of c.people) {
      const m = memberOf(now, id)
      const first = firstOf(id)
      const isPerson = !!personOf(id)
      if (c.verb === 'drop') {
        out.drops.push(id)
        continue
      }
      if (id === scene.ownerId) {
        if (c.verb === 'remove' || c.role) out.notes.push(OWNER_RULE)
        continue
      }
      if (!m) {
        if (c.verb === 'remove' || c.verb === 'restore') {
          out.notes.push(
            isPerson
              ? `${nameOf(id)} isn't a member of Kopra Labs, so there is no access to remove. ${first} is in ${scene.idp} (${personOf(id)?.team}); with no invitation, ${first} can't get in.`
              : `${nameOf(id)} isn't a member of Kopra Labs any more.`,
          )
          continue
        }
        if (c.role === 'owner') {
          out.notes.push(`${nameOf(id)} isn't a member yet. Ownership can only go to an admin.`)
          continue
        }
        const role = c.role ?? 'developer'
        add(c.at, { kind: 'invite', id, role, inferred: true })
        continue
      }
      if (c.verb === 'remove') {
        if (m.status === 'invited') add(c.at, { kind: 'uninvite', id })
        else if (m.status === 'suspended') out.notes.push(`${m.name} has been suspended since 2 Sep; there is no access left to remove.`)
        else add(c.at, { kind: 'status', id, to: 'suspended' })
        continue
      }
      if (c.verb === 'restore') {
        if (m.status === 'suspended') add(c.at, { kind: 'status', id, to: 'active' })
        else out.notes.push(`${m.name} already has access.`)
        continue
      }
      if (c.role === 'owner') {
        out.owner = id
        continue
      }
      if (c.verb === 'invite' && !c.role) {
        out.notes.push(`${m.name} is already a member, as ${aRole(m.role)}.`)
        continue
      }
      if (!c.role) {
        out.notes.push(`Which role should ${first} have: admin, developer, billing or viewer?`)
        continue
      }
      if (m.status === 'suspended') {
        out.notes.push(`${m.name} is suspended. Say “reinstate ${first}” first, then the role can change.`)
        continue
      }
      if (m.role === c.role) {
        // Already so in the change set (an invitation or a role change): say so in the reply.
        if (org.pending.value?.items.some((i) => personIn(i) === id)) add(c.at, { kind: 'role', id, to: c.role })
        else out.notes.push(`${first} is already ${aRole(c.role)}.`)
        continue
      }
      add(c.at, { kind: 'role', id, to: c.role })
    }
  }

  out.changes = found.sort((a, b) => a.at - b.at).map((f) => f.change)
  return out
}

const OWNER_RULE =
  'Raka is the owner, and Kopra Labs always has exactly one. To step down, transfer ownership to an admin first; you stay on as an admin.'

/* ── Cards ──────────────────────────────────────────────────────────────────────────── */

const facts = (eyebrow: string, title: string, rows: CheckRow[]): CardData => ({ kind: 'facts', eyebrow, title, rows })

function twofactorCard(org: OrgModel): CardData {
  const s = org.facts.value
  const rows: CheckRow[] = [
    { label: 'Required', value: org.state.twofactor ? 'For every member, since 12 Nov' : 'Not required' },
    { label: 'Admins', value: s.admins.map((m) => `${firstOf(m.id)} ${m.twoFactor ? 'on' : 'off'}`).join(' · ') },
    { label: 'Coverage', value: `${s.twofactorOn} of ${s.active} active members` },
  ]
  if (s.missing.length) rows.push({ label: 'Not set up', value: list(s.missing.map((m) => m.name)), hint: org.reminder.value ? `Reminder sent ${org.reminder.value.at}` : 'Asked at their next sign-in' })
  return facts('Two-factor', 'Already required', rows)
}

/* ── The conversation ───────────────────────────────────────────────────────────────── */

export function createTalk(org: OrgModel) {
  let desk: Desk | null = null
  const said = new Set<string>()
  /** The deliberate draft opened last, so "batal" closes the right thing. */
  let lastDraft: 'transfer' | 'deletion' | null = null

  const now = () => desk?.clock.now() ?? scene.start

  /* Suggestions: what is worth saying next, from the state of things. */
  function suggest(extra: string[] = []): string[] {
    const out: string[] = []
    const push = (s: string, always = false) => {
      if (out.length < 4 && !out.includes(s) && (always || !said.has(norm(s)))) out.push(s)
    }
    if (org.transferDraft.value || org.deletionDraft.value) push('Batal', true)
    const p = org.pending.value
    if (p) push(`Apply the ${count(p.items.length, 'change')}`, true)
    extra.forEach((s) => push(s))
    const last = org.peekUndo()?.kind
    if (last === 'apply' || last === 'transfer' || last === 'deletion') push('Undo that', true)
    if (needsReminder()) push('Send the two-factor reminder')
    for (const s of [
      'Hapus akses Yusuf dan tambahkan Dimas sebagai developer',
      "What's left?",
      'What did we change last week?',
      "Why can't I remove the last owner?",
      'Make Hendra a viewer',
      'Data region stays Jakarta, right?',
      'Transfer ownership to Sekar',
    ])
      push(s)
    return out
  }

  const needsReminder = () => org.state.twofactor && org.facts.value.missing.length > 0 && !org.reminder.value

  /* Replies that change the change set */

  function stays(c: Change): string {
    switch (c.kind) {
      case 'invite':
        return `${nameOf(c.id)} is not invited`
      case 'uninvite':
        return `${nameOf(c.id)}'s invitation stays open`
      case 'status':
        return c.to === 'suspended' ? `${nameOf(c.id)} keeps access` : `${nameOf(c.id)} stays suspended`
      case 'role':
        return `${nameOf(c.id)} stays ${valueText(org.state, c)}`
      case 'sso':
        return `single sign-on stays ${valueText(org.state, c).toLowerCase()}`
      case 'session':
        return `sessions stay ${valueText(org.state, c)}`
      case 'password':
        return `passwords stay at ${org.state.password} characters`
      case 'twofactor':
        return `two-factor stays ${valueText(org.state, c).toLowerCase()}`
      case 'notify':
        return `${eventLabel(c.event).toLowerCase()} stays ${valueText(org.state, c).toLowerCase()}`
      case 'region':
        return `new projects stay in ${regionCity(org.state.region)}`
      default:
        return `${labelOf(c).toLowerCase()} stays ${valueText(org.state, c)}`
    }
  }

  function editReplies(p: Parsed, commit: boolean): DeskReply[] {
    const before = org.pending.value?.items ?? []
    const after = org.merge(p.changes, p.drops)
    const key = (c: Change) => keyOf(c)
    const added = after.filter((c) => !before.some((b) => key(b) === key(c)))
    const updated = after.filter((c) => before.some((b) => key(b) === key(c) && JSON.stringify(b) !== JSON.stringify(c)))
    const removed = before.filter((b) => !after.some((c) => key(c) === key(b)))
    const setId = org.pending.value?.id ?? org.peekSetId()

    const parts: string[] = []
    if (added.length) parts.push(`Added to the change set: ${list(added.map(phrase))}.`)
    if (updated.length) parts.push(`Updated: ${list(updated.map(phrase))}.`)
    if (removed.length) parts.push(`${cap(list(removed.map(stays)))}, so ${removed.length === 1 ? "that's" : 'those are'} out of the change set.`)
    const changed = added.length + updated.length + removed.length > 0
    if (!changed && p.changes.length) parts.push(`Already in the change set: ${list(p.changes.map(phrase))}.`)
    parts.push(...p.notes)
    if (changed || p.changes.length) {
      parts.push(after.length ? `${count(after.length, 'change')} ${after.length === 1 ? 'waits' : 'wait'} in Needs you.` : 'Nothing is left to approve.')
    }

    const rows: CheckRow[] = []
    for (const c of p.changes) {
      // A role for someone invited in this set lives on the invitation.
      const kept = after.find((a) => key(a) === key(c) || (c.kind === 'role' && a.kind === 'invite' && a.id === c.id))
      if (!kept) {
        rows.push({ label: labelOf(c), value: `${valueText(org.state, c)}, as now`, hint: 'Same as today, so not in the change set' })
        continue
      }
      const already = before.some((b) => JSON.stringify(b) === JSON.stringify(kept))
      const described = understood(kept, org.state)
      rows.push(...(already ? described.map((r) => ({ ...r, hint: 'Already in the change set' })) : described))
    }
    for (const id of p.drops) {
      if (id === 'session') rows.push({ label: 'Sessions', value: `${valueText(org.state, { kind: 'session', to: org.state.session })}, as now` })
      else rows.push({ label: nameOf(id), value: 'Taken out of the change set' })
    }

    const title = !after.length
      ? 'Nothing left to approve'
      : added.length && !updated.length && !removed.length
        ? `${count(added.length, before.length ? 'more change' : 'change', before.length ? 'more changes' : 'changes')} to Kopra Labs`
        : 'Change set updated'

    const replies: DeskReply[] = [
      {
        text: parts.join(' '),
        card: rows.length ? 'understood' : undefined,
        data: rows.length ? ({ kind: 'understood', setId, title, rows } satisfies CardData) : undefined,
        after: () => {
          org.propose(p.changes, p.drops, now())
          if (!commit && desk) desk.chips.value = suggest()
        },
      },
    ]
    if (commit && after.length) replies.push(applyReply(after))
    return replies
  }

  function appliedText(items: Change[]): string {
    const policy = items.some((c) => c.kind === 'sso' || c.kind === 'session' || c.kind === 'password' || c.kind === 'twofactor')
    const head = `Applied ${count(items.length, 'change')}${policy ? `; sign-in policy v${org.state.policy + 1} is live` : ''}.`
    const said: string[] = []
    if (items.some((c) => c.kind === 'sso' && c.on)) said.push("Single sign-on starts at each person's next sign-in.")
    else if (items.some((c) => c.kind === 'session')) said.push("The new session length starts at each person's next sign-in.")
    const invites = items.filter((c) => c.kind === 'invite').map((c) => firstOf(personIn(c) ?? ''))
    if (invites.length) said.push(`${list(invites)} ${invites.length === 1 ? 'has an invitation' : 'have invitations'} open until ${scene.inviteUntil}.`)
    const out = items.filter((c) => c.kind === 'status' && c.to === 'suspended').map((c) => firstOf(personIn(c) ?? ''))
    if (out.length) said.push(`${list(out)} ${out.length === 1 ? 'is' : 'are'} signed out.`)
    const revert = items.length === 1 ? 'It has its own Revert in the history.' : 'Each change has its own Revert in the history.'
    return [head, ...said.slice(0, 2), revert].join(' ')
  }

  function applyReply(items: Change[]): DeskReply {
    return {
      text: appliedText(items),
      after: () => {
        org.applyPending(now())
        if (desk) desk.chips.value = suggest(['What did we change last week?'])
      },
    }
  }

  /* Questions */

  function whyReply(t: string): DeskReply {
    if (hits('\\b(password|break-?glass|kata sandi|sandi)\\b', t)) {
      return {
        text: "If Kopra Labs Directory is down, single sign-on can't let anyone in. So the owner keeps a password with two-factor as the break-glass account, for that case only, and every use of it is on the record.",
        card: 'facts',
        data: facts('Why', 'Break-glass account', [
          { label: 'Account', value: 'raka.wibisono@kopralabs.io', mono: true },
          { label: 'Signs in with', value: `Password of ${org.state.password}+ characters and two-factor` },
          { label: 'Used when', value: `${scene.idp} is down` },
        ]),
        chips: suggest(),
      }
    }
    if (hits('\\b(owner|pemilik|raka)\\b', t)) {
      const admins = org.facts.value.admins.filter((m) => m.twoFactor)
      return {
        text: 'Kopra Labs always has exactly one owner: the person who holds the plan, the break-glass password and the right to delete the organization. Removing the last owner would leave nobody who can. To step down, transfer ownership to an admin first; you stay on as an admin.',
        card: 'facts',
        data: facts('Why', 'One owner, always', [
          { label: 'Owner', value: 'Raka Wibisono' },
          { label: 'Can take over', value: list(admins.map((m) => m.name)), hint: 'Active admins with two-factor on' },
          { label: 'They accept', value: 'Within 72 hours of the request' },
          { label: 'Then you are', value: 'An admin' },
        ]),
        chips: suggest(['Transfer ownership to Sekar']),
      }
    }
    if (hits('\\b(sessions?|sesi|hours?|jam)\\b', t)) {
      const pendingSession = org.pending.value?.items.find((c) => c.kind === 'session')
      const rows: CheckRow[] = [{ label: 'Today', value: sessionText(org.state.session) }]
      if (pendingSession?.kind === 'session') rows.push({ label: 'In the change set', value: sessionText(pendingSession.to) })
      rows.push({ label: 'Choices', value: SESSIONS.map(sessionText).join(' · ') })
      return {
        text: 'Eight hours is one working day: a laptop left open overnight asks again in the morning, and with single sign-on that is one click through the directory, not a password. Say “make it 24 hours” to keep today’s length.',
        card: 'facts',
        data: facts('Why', 'Session length', rows),
        chips: suggest(['Make it 24 hours']),
      }
    }
    const who = peopleIn(t).find((id) => personOf(id)) ?? (hits('\\b(email|address|alamat|directory|direktori|know|find|dari mana)\\b', t) ? 'd01' : null)
    if (who) {
      const p = personOf(who)
      if (p) {
        return {
          text: `${scene.idp}, connected on 12 Nov, has one ${firstOf(who)}: ${p.name} in ${p.team}. The address comes from there, which is why that row is marked as filled in.`,
          card: 'facts',
          data: facts('Why', 'From the directory', [
            { label: 'Name', value: p.name },
            { label: 'Team', value: p.team },
            { label: 'Email', value: p.email, mono: true },
            { label: 'Source', value: `${scene.idp} · SAML 2.0` },
          ]),
          chips: suggest(),
        }
      }
    }
    if (hits('\\b(two-?factor|2fa|mfa|dua faktor)\\b', t)) {
      return {
        text: 'An authenticator app or a security key stops a leaked password from being enough on its own. Text-message codes are not accepted.',
        card: 'facts',
        data: twofactorCard(org),
        chips: suggest(),
      }
    }
    if (hits('\\b(sso|single sign-?on|saml|directory)\\b', t)) {
      return {
        text: 'With single sign-on, people use their Kopra Labs account and lose access the moment they leave the directory. Sekar connected it on 12 Nov and the test sign-in passed yesterday.',
        card: 'facts',
        data: facts('Why', 'Single sign-on', [
          { label: 'Directory', value: `${scene.idp} · SAML 2.0` },
          { label: 'Test sign-in', value: 'Passed 17 Nov 16:42', hint: 'Sekar Ayuningtyas' },
          { label: 'Certificate', value: 'SHA-256 · expires 14 Mar 2027', mono: true },
        ]),
        chips: suggest(),
      }
    }
    return {
      text: 'Ask about a part by name: “why 8 hours?”, “why does Raka keep a password?” or “why can’t I remove the last owner?”.',
      chips: suggest(['Why 8 hours?', 'Why does Raka keep a password?']),
    }
  }

  function statusReply(): DeskReply {
    const rows: CheckRow[] = []
    const yours: string[] = []
    const p = org.pending.value
    if (p) {
      rows.push({ label: p.id, value: `${count(p.items.length, 'change')} to approve`, hint: 'Needs you' })
      yours.push(`the change set with ${count(p.items.length, 'change')}`)
    }
    if (org.transferDraft.value) {
      rows.push({ label: 'Ownership', value: `Transfer to ${nameOf(org.transferDraft.value)}`, hint: 'Needs your hold' })
      yours.push('the ownership transfer')
    }
    if (org.deletionDraft.value) {
      rows.push({ label: 'Deletion', value: 'Waiting for the name', hint: 'Needs you to type it' })
      yours.push('the deletion')
    }
    if (needsReminder()) {
      const missing = org.facts.value.missing
      rows.push({ label: 'Two-factor', value: `${list(missing.map((m) => firstOf(m.id)))} not set up`, hint: 'Reminder not sent yet' })
      yours.push('the two-factor reminder')
    }
    const invited = org.state.members.filter((m) => m.status === 'invited')
    if (invited.length) rows.push({ label: 'Invitations', value: list(invited.map((m) => firstOf(m.id))), hint: 'Waiting on them to accept' })
    if (org.transferOpen.value && org.transfer.value) {
      const to = firstOf(org.transfer.value.to)
      rows.push({ label: 'Ownership', value: `${to} accepts by ${org.transfer.value.until}`, hint: `Waiting on ${to}` })
    }
    if (org.deletionOpen.value && org.deletion.value) rows.push({ label: 'Deletion', value: `Runs ${org.deletion.value.runs}`, hint: 'Any admin can cancel until then' })
    const text = yours.length
      ? `${cap(count(yours.length, 'thing'))} ${yours.length === 1 ? 'needs' : 'need'} you: ${list(yours)}. The rest waits on other people.`
      : 'Nothing needs you. The rest waits on other people.'
    return { text, card: 'facts', data: facts('Status', 'What is left', rows), chips: suggest() }
  }

  function historyReply(t: string): DeskReply {
    const range: [number, number, string] = hits('\\b(last week|minggu lalu|pekan lalu|minggu kemarin)\\b', t)
      ? [1109, 1115, 'Last week, 9–15 Nov']
      : hits('\\b(today|hari ini|tadi)\\b', t)
        ? [1118, 1118, 'Today']
        : hits('\\b(this week|minggu ini|pekan ini)\\b', t)
          ? [1116, 1118, 'This week, since Monday 16 Nov']
          : [1111, 1118, 'In the last 7 days']
    const lines = org.history.value.filter((h) => h.stamp >= range[0] && h.stamp <= range[1])
    if (!lines.length) return { text: `${range[2]}: nothing changed.`, chips: suggest() }
    const changes = lines.filter((l) => l.kind !== 'event')
    const days = new Set(lines.map((l) => (l.stamp === 1118 ? scene.today : l.at)))
    const text = `${range[2]}: ${count(changes.length, 'change')}${lines.length > changes.length ? ` and ${count(lines.length - changes.length, 'event')}` : ''}${
      days.size === 1 && lines.length > 1 ? `, ${lines.length === 2 ? 'both' : 'all'} on ${[...days][0]}` : ''
    }. Each one is below with who asked and who approved; the history has Revert.`
    const rows: CheckRow[] = lines.slice(0, 6).map((l) => ({
      label: `${l.stamp === 1118 ? scene.today : l.at} ${l.time}`,
      value: l.revertedAt ? `${l.text} (reverted ${l.revertedAt})` : l.text,
      hint: l.detail,
    }))
    return { text, card: 'facts', data: facts('History', range[2], rows), chips: suggest(['What changed today?']) }
  }

  function regionReply(): DeskReply {
    const pendingRegion = org.pending.value?.items.find((c) => c.kind === 'region')
    if (pendingRegion || org.state.region !== 'jkt-1') return editReplies({ changes: [{ kind: 'region', to: 'jkt-1' }], drops: [], notes: [] }, false)[0]
    return {
      text: 'Yes. New projects keep starting in Jakarta, and nothing waiting for you touches the region. Existing projects never move on their own.',
      card: 'facts',
      data: facts('Data region', regionText(org.state.region), [
        { label: 'Default', value: regionText(org.state.region) },
        { label: 'Projects', value: `${footprint.projects} · ${footprint.storage}` },
        { label: 'Change set', value: 'No change to the region' },
      ]),
      chips: suggest(),
    }
  }

  function reminderReply(): DeskReply {
    if (org.reminder.value) return { text: `Already sent at ${org.reminder.value.at} to ${list(org.reminder.value.names.map((n) => n.split(' ')[0]))}.`, chips: suggest() }
    if (!org.state.twofactor) return { text: 'Two-factor isn’t required right now, so there is nobody to remind. Say “require two-factor” first.', chips: suggest(['Require two-factor for everyone']) }
    const missing = org.facts.value.missing
    if (!missing.length) return { text: 'Every active member has two-factor on; there is nobody to remind.', chips: suggest() }
    return {
      text: `Sent. ${list(missing.map((m) => firstOf(m.id)))} ${missing.length === 1 ? 'has' : 'have'} an email with the setup steps, and ${missing.length === 1 ? 'is' : 'are'} asked again at the next sign-in.`,
      after: () => {
        org.sendReminder(now())
        if (desk) desk.chips.value = suggest()
      },
    }
  }

  function addressReply(t: string): DeskReply {
    const billing = hits('\\b(billing|invoices?|tagihan|faktur|finance|keuangan)\\b', t)
    if (billing) {
      return {
        text: 'Invoices go by email to the billing contact, Nadia Kusuma, and Simpul only sends to members, not to outside addresses. Wulan Sari from Finance is in the directory: invite her as billing and she gets them too.',
        card: 'facts',
        data: facts('Invoices', 'Who gets the invoice emails', [
          { label: 'Sent to', value: 'Nadia Kusuma · Billing' },
          { label: 'Outside address', value: 'Not possible; members only' },
          { label: 'In Finance', value: 'Wulan Sari', inferred: true, hint: 'wulan.sari@kopralabs.io, from the directory' },
        ]),
        chips: suggest(['Invite Wulan as billing']),
      }
    }
    return { text: 'Simpul only sends to members. Invite someone by name from the directory instead, like “invite Wulan as billing”.', chips: suggest(['Invite Wulan as billing']) }
  }

  /* The two deliberate actions */

  function transferReply(t: string, target?: string): DeskReply {
    const id = target ?? peopleIn(t).find((p) => p !== scene.ownerId)
    const admins = org.facts.value.admins.filter((m) => m.twoFactor)
    const names = list(admins.map((m) => firstOf(m.id)))
    if (org.transferOpen.value && org.transfer.value) {
      const to = org.transfer.value.to
      return { text: `A transfer to ${nameOf(to)} is already waiting for ${firstOf(to)} to accept, until ${org.transfer.value.until}. Say “undo that” to withdraw it.`, chips: suggest() }
    }
    if (!id) return { text: `Who should take over? Ownership goes to an admin with two-factor on: ${names}.`, chips: suggest(admins.slice(0, 2).map((m) => `Transfer ownership to ${firstOf(m.id)}`)) }
    const m = memberOf(org.state, id)
    if (!m) return { text: `${nameOf(id)} isn't a member of Kopra Labs. Ownership goes to an admin: ${names}.`, chips: suggest() }
    if (m.role !== 'admin' || m.status !== 'active') {
      const coming = org.pending.value?.items.some((c) => c.kind === 'role' && c.id === id && c.to === 'admin')
      return {
        text: coming
          ? `${firstOf(id)} becomes an admin when you apply the change set; after that ${firstOf(id)} can take ownership.`
          : `Ownership can only go to an active admin, and ${firstOf(id)} is ${aRole(m.role)}. ${names} can take it now.`,
        chips: suggest(),
      }
    }
    lastDraft = 'transfer'
    const first = firstOf(id)
    return {
      text: `That one is deliberate, so it waits in Needs you: hold the button to send it. ${first} then has 72 hours to accept, and once ${first} accepts, only ${first} can give ownership back.`,
      card: 'transfer',
      data: {
        kind: 'transfer',
        to: id,
        at: now(),
        title: `Transfer ownership to ${m.name}`,
        rows: [
          { label: 'Owner', value: `Raka Wibisono → ${m.name}` },
          { label: 'You become', value: 'Admin' },
          { label: 'Accept within', value: '72 hours of sending' },
          { label: 'Cannot be undone', value: `After ${firstOf(id)} accepts, only ${firstOf(id)} can transfer it back` },
        ],
      } satisfies CardData,
      after: () => {
        org.transferDraft.value = id
        if (desk) desk.chips.value = suggest(["Why can't I remove the last owner?"])
      },
    }
  }

  function deletionReply(): DeskReply {
    if (org.deletionOpen.value && org.deletion.value) {
      return { text: `Kopra Labs is already scheduled for deletion on ${org.deletion.value.runs}. Say “batalkan penghapusan” to cancel it.`, chips: suggest(['Batalkan penghapusan']) }
    }
    lastDraft = 'deletion'
    return {
      text: 'That needs your hand, not a sentence: type the organization’s name in Needs you to schedule it. Deletion would run on 25 Nov; until then everything keeps working and any admin can cancel. After that, nothing comes back.',
      card: 'deletion',
      data: {
        kind: 'deletion',
        at: now(),
        title: `Delete ${org.state.name}`,
        rows: [
          { label: 'Removes', value: `${footprint.projects} projects, ${footprint.deployments.toLocaleString('en-US')} deployments, ${footprint.domains} custom domains, ${footprint.storage}` },
          { label: 'API keys', value: `${footprint.apiKeys}, revoked at once` },
          { label: 'Runs', value: `${scene.deletionOn}, 7 days after you confirm` },
          { label: 'Cannot be undone', value: `After ${scene.deletionOn}, nothing can be recovered` },
        ],
      } satisfies CardData,
      after: () => {
        org.deletionDraft.value = true
        if (desk) desk.chips.value = suggest()
      },
    }
  }

  /* Undo and cancel */

  function undoText(u: Undone): string {
    switch (u.kind) {
      case 'edit-new':
        return 'Undone: that change set is gone, and nothing changed.'
      case 'edit': {
        const back = u.back
        const gone = u.was.filter((c) => !back.some((b) => keyOf(b) === keyOf(c)))
        const returned = back.filter((b) => !u.was.some((c) => keyOf(c) === keyOf(b)))
        const parts: string[] = []
        if (gone.length) parts.push(`${cap(list(gone.map(phrase)))} ${gone.length === 1 ? 'is' : 'are'} out of the change set again.`)
        if (returned.length) parts.push(`${cap(list(returned.map(phrase)))} ${returned.length === 1 ? 'is' : 'are'} back in it.`)
        if (!parts.length) parts.push('The change set is back to how it was.')
        return `Undone. ${parts.join(' ')} ${count(back.length, 'change')} ${back.length === 1 ? 'waits' : 'wait'} in Needs you.`
      }
      case 'apply': {
        const sso = u.lines.some((l) => l.inverse?.kind === 'sso')
        return `Undone: the ${count(u.lines.length, 'change')} from ${u.set.id} are reverted and struck through in the history.${sso ? ' Sign-in is back to a password and two-factor.' : ''}`
      }
      case 'discard':
        return `Back: the ${count(u.set.items.length, 'change')} from ${u.set.id} ${u.set.items.length === 1 ? 'waits' : 'wait'} in Needs you again.`
      case 'transfer':
        return 'Withdrawn: the transfer link no longer works, and you stay the owner.'
      case 'deletion':
        return 'Cancelled: Kopra Labs stays as it is. The scheduled deletion is struck through in the history.'
    }
  }

  function undoReply(t: string): DeskReply {
    const done = (fn: () => void): Pick<DeskReply, 'after'> => ({
      after: () => {
        fn()
        if (desk) desk.chips.value = suggest()
      },
    })
    if (hits(RX.transferWord, t) || (lastDraft === 'transfer' && org.transferDraft.value)) {
      if (org.transferDraft.value) return { text: 'Closed: nothing was sent, and you stay the owner.', ...done(() => (org.transferDraft.value = null)) }
      if (org.transferOpen.value && org.transfer.value) {
        const lineId = org.transfer.value.lineId
        return { text: 'Withdrawn: the transfer link no longer works, and you stay the owner.', ...done(() => org.revert(lineId, now())) }
      }
    }
    if (hits(RX.deletionWord, t) || (lastDraft === 'deletion' && org.deletionDraft.value)) {
      if (org.deletionDraft.value) return { text: 'Closed: nothing is scheduled.', ...done(() => (org.deletionDraft.value = false)) }
      if (org.deletionOpen.value && org.deletion.value) {
        const lineId = org.deletion.value.lineId
        return { text: 'Cancelled: Kopra Labs stays as it is. The scheduled deletion is struck through in the history.', ...done(() => org.revert(lineId, now())) }
      }
    }
    if (org.transferDraft.value || org.deletionDraft.value) {
      return {
        text: 'Closed: nothing was sent or scheduled.',
        ...done(() => {
          org.transferDraft.value = null
          org.deletionDraft.value = false
        }),
      }
    }
    // "Discard" with a change set waiting drops all of it; "batal" and "undo" take back the last step.
    if (hits(RX.discard, t) && org.pending.value) {
      const p = org.pending.value
      return { text: `Discarded ${p.id}: nothing changed.`, ...done(() => org.discardPending(now())) }
    }
    const next = org.peekUndo()
    if (!next) return { text: 'Nothing to undo since you opened this. Every change in the history has its own Revert.', chips: suggest() }
    return { text: undoText(next), ...done(() => org.undo(now())) }
  }

  /* The reply to a sentence */

  function respond(text: string): DeskReply | DeskReply[] {
    const t = norm(text)
    said.add(t)
    const people = peopleIn(t)

    if (hits(RX.why, t)) return whyReply(t)
    if (!people.length && (hits(RX.undo, t) || hits(RX.cancel, t) || hits(RX.discard, t))) return undoReply(t)
    if (people.length && hits(RX.transferWord, t) && (hits(RX.undo, t) || hits(RX.cancel, t)) && (org.transferDraft.value || org.transferOpen.value)) return undoReply(t)
    if (hits(RX.deleteOrg, t)) return deletionReply()
    if (hits(RX.transfer, t)) return transferReply(t)
    if (hits(RX.status, t)) return statusReply()
    if (hits(RX.history, t)) return historyReply(t)
    if (hits(RX.regionStays, t)) return regionReply()
    if (hits(RX.remind, t)) return reminderReply()

    const address = find(RX.email, t)
    if (address && !people.length) return addressReply(t)

    const parsed = parse(text, org)
    if (parsed.owner) return transferReply(t, parsed.owner)
    const commit = hits(RX.commitWord, t)
    if (parsed.changes.length || parsed.drops.length) return editReplies(parsed, commit)
    if (parsed.notes.length) {
      return {
        text: parsed.notes.join(' '),
        card: parsed.card ? parsed.card.kind : undefined,
        data: parsed.card,
        chips: suggest(parsed.card ? ['Send the two-factor reminder'] : []),
      }
    }

    if (hits(RX.commit, t)) {
      const p = org.pending.value
      if (p) return applyReply(p.items)
      if (org.transferDraft.value) return { text: 'The transfer needs your hold in Needs you; it can’t be sent from a sentence.', chips: suggest() }
      if (org.deletionDraft.value) return { text: 'Deletion needs the name typed in Needs you; it can’t be confirmed from a sentence.', chips: suggest() }
      return { text: 'Nothing is waiting to apply. Say what should change, like “make Hendra a viewer”.', chips: suggest() }
    }
    if (hits(RX.thanks, t)) return { text: 'You’re welcome.', chips: suggest() }
    if (hits(RX.greet, t) && t.split(' ').length <= 4) {
      const p = org.pending.value
      return {
        text: p
          ? `Hello Raka. ${count(p.items.length, 'change')} ${p.items.length === 1 ? 'waits' : 'wait'} for you in Needs you; say “apply them” or change any part.`
          : 'Hello Raka. Say what should change in Kopra Labs, and it comes back as a change set to approve.',
        chips: suggest(),
      }
    }
    return {
      text: 'I can change Kopra Labs’ members and roles, sign-in policy, alerts, and its name, URL, timezone, locale and default region, and tell you what changed and why. Try “make Hendra a viewer” or “what did we change last week?”.',
      chips: suggest(['Make Hendra a viewer', 'What did we change last week?']),
    }
  }

  /* The opening: the sentence was said, the change set is waiting */

  const first = parse(OPENING, org)
  const opened = org.propose(first.changes, [], scene.start)
  const openingRows = first.changes.flatMap((c) => understood(c, org.state))
  const inferredCount = openingRows.filter((r) => r.inferred).length
  const opening: Omit<DeskMessage, 'id' | 'at'>[] = [
    { who: 'You', mine: true, text: OPENING },
    {
      who: 'Simpul',
      text: `${cap(count(first.changes.length, 'change'))}, waiting for your approval in Needs you. I filled in ${inferredCount === 3 ? 'three parts' : count(inferredCount, 'part')} and marked them: the directory to sign in through, Rina’s address, and who gets the email.`,
      card: 'understood',
      data: { kind: 'understood', setId: opened?.id ?? org.peekSetId(), title: `${count(first.changes.length, 'change')} to Kopra Labs`, rows: openingRows } satisfies CardData,
    },
  ]
  const openingChips = [
    `Apply the ${count(first.changes.length, 'change')}`,
    'Sessions 24 hours instead',
    'Hapus akses Yusuf dan tambahkan Dimas sebagai developer',
    'Why does Raka keep a password?',
  ]

  /* What the surfaces do, said in the thread too */

  function bind(d: Desk) {
    desk = d
  }

  function approveFromSurface() {
    const p = org.pending.value
    if (!p || !desk) return
    const items = [...p.items]
    desk.note(`You applied ${count(items.length, 'change')} · ${p.id}`)
    const text = appliedText(items)
    org.applyPending(now())
    desk.say({ text, chips: suggest(['What did we change last week?']) })
  }

  function discardFromSurface() {
    const p = org.pending.value
    if (!p || !desk) return
    desk.note(`You discarded ${p.id} · nothing changed`)
    org.discardPending(now())
    desk.chips.value = suggest()
  }

  function remindFromSurface() {
    if (!desk || !needsReminder()) return
    const names = org.facts.value.missing.map((m) => firstOf(m.id))
    desk.note(`You sent the two-factor reminder to ${list(names)}`)
    org.sendReminder(now())
    desk.chips.value = suggest()
  }

  function transferFromSurface() {
    const to = org.transferDraft.value
    if (!to || !desk) return
    desk.note(`You held to send the ownership transfer to ${nameOf(to)}`)
    const sent = org.sendTransfer(now())
    desk.say({
      text: `Sent. ${firstOf(to)} has until ${sent?.until ?? scene.acceptBy} to accept. Until then you are the owner, and you can withdraw it from the history.`,
      chips: suggest(),
    })
  }

  function closeTransferFromSurface() {
    if (!desk || !org.transferDraft.value) return
    desk.note('You closed the ownership transfer · nothing was sent')
    org.transferDraft.value = null
    desk.chips.value = suggest()
  }

  function deleteFromSurface() {
    if (!desk || !org.deletionDraft.value) return
    desk.note(`You typed ${org.state.name} to confirm the deletion`)
    const scheduled = org.scheduleDeletion(now())
    desk.say({
      text: `Scheduled for ${scheduled?.runs ?? scene.deletionOn}. Kopra Labs keeps working until then and any admin can cancel: say “batalkan penghapusan” or press Revert in the history.`,
      chips: suggest(['Batalkan penghapusan']),
    })
  }

  function closeDeletionFromSurface() {
    if (!desk || !org.deletionDraft.value) return
    desk.note('You closed the deletion · nothing is scheduled')
    org.deletionDraft.value = false
    desk.chips.value = suggest()
  }

  function revertFromTrail(id: string) {
    const line = org.history.value.find((h) => h.id === id)
    if (!line || !desk) return
    desk.note(`You reverted “${line.text}”`)
    org.revert(id, now())
    if (line.inverse?.kind === 'twofactor' && !line.inverse.on) {
      desk.say({ text: 'Two-factor is optional again: members without it can sign in with a password alone. Say “require two-factor” to put it back.', chips: suggest(['Require two-factor for everyone']) })
    } else if (line.inverse?.kind === 'sso' && !line.inverse.on) {
      desk.say({ text: 'Single sign-on is optional again; people can sign in with a password and two-factor from their next sign-in.', chips: suggest() })
    } else desk.chips.value = suggest()
  }

  return {
    opening,
    openingChips,
    respond,
    bind,
    suggest,
    needsReminder,
    approveFromSurface,
    discardFromSurface,
    remindFromSurface,
    transferFromSurface,
    closeTransferFromSurface,
    deleteFromSurface,
    closeDeletionFromSurface,
    revertFromTrail,
  }
}

export type Talk = ReturnType<typeof createTalk>
