/**
 * Kopra Labs as one model the conversation and the surfaces share: the settings and the members,
 * the change set waiting for approval (and its diff), the settings history with Revert, the two
 * deliberate actions (ownership and deletion) and an undo stack. It never writes to the thread;
 * script.ts does, so a change approved anywhere is said in one place.
 */
import { computed, reactive, ref } from 'vue'
import { count } from '../_kit/desk'
import type { CheckRow, TrailItem } from '../_kit/desk'
import {
  channelsText,
  defaultNotifications,
  digestPhrase,
  digestText,
  directory,
  eventLabel,
  footprint,
  localeExample,
  localeText,
  org,
  regionCity,
  regionText,
  roleLabel,
  roleScope,
  scene,
  seedHistory,
  seedMembers,
  sessionText,
  zoneAbbr,
  zoneText,
  type Channel,
  type Member,
  type Person,
  type Role,
  type SessionLength,
} from './data'

/** One change to the organization. `inferred`: the conversation filled part of it in. */
export type Change = (
  | { kind: 'sso'; on: boolean }
  | { kind: 'session'; to: SessionLength }
  | { kind: 'password'; to: number }
  | { kind: 'twofactor'; on: boolean }
  | { kind: 'role'; id: string; to: Role }
  | { kind: 'invite'; id: string; role: Role }
  | { kind: 'uninvite'; id: string }
  | { kind: 'status'; id: string; to: 'active' | 'suspended' }
  | { kind: 'notify'; event: string; channels: Channel[] }
  | { kind: 'digest'; to: string }
  | { kind: 'region'; to: string }
  | { kind: 'timezone'; to: string }
  | { kind: 'locale'; to: string }
  | { kind: 'slug'; to: string }
  | { kind: 'name'; to: string }
) & { inferred?: boolean }

export interface OrgState {
  name: string
  slug: string
  region: string
  timezone: string
  locale: string
  sso: boolean
  twofactor: boolean
  session: SessionLength
  password: number
  notifications: Record<string, Channel[]>
  digest: string
  /** Sign-in policy version: v12 since 12 Nov. */
  policy: number
  members: Member[]
}

export interface ChangeSet {
  id: string
  items: Change[]
  state: 'pending' | 'applied' | 'discarded'
  askedAt: string
  /** When it was applied or discarded. */
  at?: string
}

/** One line of the diff to approve: current value → new value, and who it affects. */
export interface DiffRow {
  key: string
  label: string
  from: string
  to: string
  affects: string
  inferred: boolean
  mono: boolean
}

/** A line of the settings history: a DeskTrail item that knows how to undo itself. */
export interface HistoryLine extends TrailItem {
  /** Month × 100 + day: 1118 is 18 Nov. */
  stamp: number
  time: string
  kind: 'change' | 'event' | 'reminder' | 'transfer' | 'deletion'
  inverse?: Change
  /** The change set it came from. */
  group?: string
}

export type TileKey = 'members' | 'twofactor' | 'signin' | 'region'

type UndoEntry =
  | { kind: 'edit'; setId: string; before: Change[] | null }
  | { kind: 'apply'; setId: string }
  | { kind: 'discard'; setId: string }
  | { kind: 'transfer' }
  | { kind: 'deletion' }

export type Undone =
  | { kind: 'edit'; set: ChangeSet; was: Change[]; back: Change[] }
  | { kind: 'edit-new'; set: ChangeSet }
  | { kind: 'apply'; set: ChangeSet; lines: HistoryLine[] }
  | { kind: 'discard'; set: ChangeSet }
  | { kind: 'transfer' }
  | { kind: 'deletion' }

const TODAY = 1118
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const same = (a: Change[], b: Change[]) => JSON.stringify(a) === JSON.stringify(b)
const pad = (n: number) => String(n).padStart(2, '0')

/* ── People ─────────────────────────────────────────────────────────────────────────── */

export const memberOf = (s: OrgState, id: string) => s.members.find((m) => m.id === id)
export const personOf = (id: string): Person | undefined => directory.find((p) => p.id === id)
const seedOf = (id: string) => seedMembers.find((m) => m.id === id)

export function nameOf(id: string): string {
  return seedOf(id)?.name ?? personOf(id)?.name ?? id
}

/** "Mei Ling", "Rina". */
export function firstOf(id: string): string {
  return id === 'm06' ? 'Mei Ling' : nameOf(id).split(' ')[0]
}

/** "Raka W.", "Mei Ling T.". */
export function shortOf(id: string): string {
  const parts = nameOf(id).split(' ')
  const first = firstOf(id)
  const last = parts[parts.length - 1]
  return last && last !== first ? `${first} ${last[0]}.` : first
}

/** "Hendra, Arif and Yusuf". */
export function list(words: string[]): string {
  if (words.length <= 1) return words.join('')
  return `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`
}

const article = (word: string) => (/^[aeiou]/i.test(word) ? `an ${word}` : `a ${word}`)
export const aRole = (role: Role) => article(roleLabel[role])

/** Counts the screen shows, from any state (the real one, or one with the change set applied). */
export function stats(s: OrgState) {
  const live = s.members.filter((m) => m.status !== 'suspended')
  const active = s.members.filter((m) => m.status === 'active')
  const roles: Record<Role, number> = { owner: 0, admin: 0, developer: 0, billing: 0, viewer: 0 }
  for (const m of s.members) roles[m.role] += 1
  return {
    members: s.members.length,
    seats: live.length,
    /** Everyone with access except the owner. */
    others: live.length - 1,
    active: active.length,
    invited: s.members.filter((m) => m.status === 'invited').length,
    suspended: s.members.filter((m) => m.status === 'suspended').length,
    twofactorOn: active.filter((m) => m.twoFactor).length,
    missing: active.filter((m) => m.twoFactor === false),
    admins: active.filter((m) => m.role === 'admin'),
    roles,
  }
}

/* ── Changes: apply, invert, describe ───────────────────────────────────────────────── */

export function initialState(): OrgState {
  return {
    name: org.name,
    slug: org.slug,
    region: org.region,
    timezone: org.timezone,
    locale: org.locale,
    sso: false,
    twofactor: true,
    session: '24h',
    password: 12,
    notifications: defaultNotifications(),
    digest: 'daily',
    policy: scene.policy,
    members: clone(seedMembers),
  }
}

export function applyChange(s: OrgState, c: Change) {
  switch (c.kind) {
    case 'sso':
      s.sso = c.on
      break
    case 'session':
      s.session = c.to
      break
    case 'password':
      s.password = c.to
      break
    case 'twofactor':
      s.twofactor = c.on
      break
    case 'role': {
      const m = memberOf(s, c.id)
      if (m) m.role = c.to
      break
    }
    case 'invite': {
      const m = memberOf(s, c.id)
      if (m) {
        m.role = c.role
        m.status = 'invited'
        break
      }
      const p = personOf(c.id) ?? seedOf(c.id)
      if (p) {
        s.members.push({
          id: c.id,
          name: p.name,
          email: p.email,
          role: c.role,
          status: 'invited',
          twoFactor: null,
          lastActive: `Invited ${scene.today}`,
        })
      }
      break
    }
    case 'uninvite':
      s.members = s.members.filter((m) => m.id !== c.id)
      break
    case 'status': {
      const m = memberOf(s, c.id)
      if (m) m.status = c.to
      break
    }
    case 'notify':
      s.notifications = { ...s.notifications, [c.event]: [...c.channels] }
      break
    case 'digest':
      s.digest = c.to
      break
    case 'region':
      s.region = c.to
      break
    case 'timezone':
      s.timezone = c.to
      break
    case 'locale':
      s.locale = c.to
      break
    case 'slug':
      s.slug = c.to
      break
    case 'name':
      s.name = c.to
      break
  }
}

/** What puts a change back, worked out before it is applied. */
export function inverseOf(s: OrgState, c: Change): Change {
  switch (c.kind) {
    case 'sso':
      return { kind: 'sso', on: s.sso }
    case 'session':
      return { kind: 'session', to: s.session }
    case 'password':
      return { kind: 'password', to: s.password }
    case 'twofactor':
      return { kind: 'twofactor', on: s.twofactor }
    case 'role':
      return { kind: 'role', id: c.id, to: memberOf(s, c.id)?.role ?? c.to }
    case 'invite': {
      const m = memberOf(s, c.id)
      return m ? { kind: 'role', id: c.id, to: m.role } : { kind: 'uninvite', id: c.id }
    }
    case 'uninvite':
      return { kind: 'invite', id: c.id, role: memberOf(s, c.id)?.role ?? 'developer' }
    case 'status':
      return { kind: 'status', id: c.id, to: memberOf(s, c.id)?.status === 'suspended' ? 'suspended' : 'active' }
    case 'notify':
      return { kind: 'notify', event: c.event, channels: [...(s.notifications[c.event] ?? [])] }
    case 'digest':
      return { kind: 'digest', to: s.digest }
    case 'region':
      return { kind: 'region', to: s.region }
    case 'timezone':
      return { kind: 'timezone', to: s.timezone }
    case 'locale':
      return { kind: 'locale', to: s.locale }
    case 'slug':
      return { kind: 'slug', to: s.slug }
    case 'name':
      return { kind: 'name', to: s.name }
  }
}

/** Two changes with one key cannot sit in one change set: the later one wins. */
export function keyOf(c: Change): string {
  switch (c.kind) {
    case 'role':
      return `role:${c.id}`
    case 'invite':
    case 'uninvite':
      return `invite:${c.id}`
    case 'status':
      return `status:${c.id}`
    case 'notify':
      return `notify:${c.event}`
    default:
      return c.kind
  }
}

export const isPolicy = (c: Change) => c.kind === 'sso' || c.kind === 'session' || c.kind === 'password' || c.kind === 'twofactor'
export const personIn = (c: Change): string | undefined => ('id' in c ? c.id : undefined)

/** A copy of the state with the changes applied: what the organization would look like. */
export function project(s: OrgState, items: Change[]): OrgState {
  const copy = clone(s)
  for (const c of items) applyChange(copy, c)
  return copy
}

/** The setting a change touches, as it reads in a given state. */
export function valueText(s: OrgState, c: Change): string {
  switch (c.kind) {
    case 'sso':
      return s.sso ? 'Required' : 'Optional'
    case 'session':
      return sessionText(s.session)
    case 'password':
      return `${s.password} characters`
    case 'twofactor':
      return s.twofactor ? 'Required' : 'Optional'
    case 'role':
    case 'invite':
    case 'uninvite':
    case 'status': {
      const m = memberOf(s, c.id)
      if (!m) return 'Not a member'
      if (c.kind === 'status') return m.status === 'suspended' ? 'Suspended' : m.status === 'invited' ? 'Invited' : 'Active'
      const role = roleLabel[m.role]
      return m.status === 'invited' ? `${role}, invited` : m.status === 'suspended' ? `${role}, suspended` : role
    }
    case 'notify':
      return channelsText(s.notifications[c.event] ?? [])
    case 'digest':
      return digestText(s.digest)
    case 'region':
      return regionText(s.region)
    case 'timezone':
      return zoneText(s.timezone)
    case 'locale':
      return localeText(s.locale)
    case 'slug':
      return `simpul.app/${s.slug}`
    case 'name':
      return s.name
  }
}

export function labelOf(c: Change): string {
  switch (c.kind) {
    case 'sso':
      return 'Single sign-on'
    case 'session':
      return 'Session length'
    case 'password':
      return 'Minimum password'
    case 'twofactor':
      return 'Two-factor'
    case 'role':
    case 'invite':
    case 'uninvite':
    case 'status':
      return nameOf(c.id)
    case 'notify':
      return eventLabel(c.event)
    case 'digest':
      return 'Digest'
    case 'region':
      return 'Default region'
    case 'timezone':
      return 'Timezone'
    case 'locale':
      return 'Locale'
    case 'slug':
      return 'URL'
    case 'name':
      return 'Organization name'
  }
}

/** Who a change reaches, read from the organization as it would be after the whole set. */
export function affects(c: Change, before: OrgState, after: OrgState): string {
  const now = stats(after)
  switch (c.kind) {
    case 'sso':
      return c.on
        ? `${count(now.others, 'person', 'people')} sign in through ${scene.idp} from their next sign-in. Raka keeps a password as break-glass.`
        : `${count(now.others, 'person', 'people')} go back to a password and two-factor at their next sign-in.`
    case 'session':
      return `All ${now.seats} people with access, from their next sign-in.`
    case 'password':
      return after.sso ? 'Only the break-glass password, at its next change.' : `New and changed passwords, for all ${now.seats} people.`
    case 'twofactor': {
      if (!c.on) return `${now.active} active members can sign in with a password alone.`
      const missing = now.missing.map((m) => firstOf(m.id))
      return missing.length
        ? `${count(missing.length, 'active member')} without it ${missing.length === 1 ? 'is' : 'are'} asked at the next sign-in: ${list(missing)}.`
        : 'Every active member already has it on.'
    }
    case 'role': {
      const m = memberOf(after, c.id)
      const was = memberOf(before, c.id)?.role
      const parts = [roleScope[c.to]]
      if (c.to === 'admin' && m) parts.push(m.twoFactor ? 'two-factor on' : m.twoFactor === false ? 'two-factor off, asked at next sign-in' : 'two-factor when they join')
      if (was === 'admin' && c.to !== 'admin') parts.push('loses members and policy')
      if (m?.status === 'invited') parts.push('applies when they accept')
      return parts.join(' · ')
    }
    case 'invite': {
      const email = personOf(c.id)?.email ?? seedOf(c.id)?.email ?? ''
      return `${email}, from ${scene.idp} · takes a seat · open until ${scene.inviteUntil}`
    }
    case 'uninvite':
      return 'The invitation link stops working · frees a seat'
    case 'status': {
      const m = memberOf(before, c.id)
      if (c.to === 'suspended') return `Signed out now · frees a seat · last active ${m?.lastActive ?? '—'}`
      return `Takes a seat · two-factor ${m?.twoFactor ? 'on' : 'off, asked at next sign-in'}`
    }
    case 'notify':
      return 'The default for everyone; members can mute it'
    case 'digest':
      return 'Everything without its own alert, in WIB'
    case 'region':
      return `New projects start there; the ${footprint.projects} existing projects stay where they are`
    case 'timezone':
      return `Schedules, digests and invoice dates; the clock reads ${zoneAbbr(c.to)}`
    case 'locale':
      return localeExample(c.to)
    case 'slug':
      return `Old links redirect for 30 days, until ${scene.redirectUntil}`
    case 'name':
      return 'Shown in the dashboard, on invoices and in emails'
  }
}

/** The history line once it is done: "Single sign-on required". */
export function pastText(c: Change, after: OrgState): string {
  switch (c.kind) {
    case 'sso':
      return c.on ? 'Single sign-on required' : 'Single sign-on no longer required'
    case 'session':
      return `Session length set to ${sessionText(c.to)}`
    case 'password':
      return `Minimum password length set to ${c.to}`
    case 'twofactor':
      return c.on ? 'Two-factor required for all members' : 'Two-factor no longer required'
    case 'role':
      return `${nameOf(c.id)} is now ${roleLabel[c.to]}`
    case 'invite':
      return `${nameOf(c.id)} invited as ${roleLabel[c.role]}`
    case 'uninvite':
      return `${nameOf(c.id)}'s invitation withdrawn`
    case 'status':
      return `${nameOf(c.id)} ${c.to === 'suspended' ? 'suspended' : 'reinstated'}`
    case 'notify':
      return `${eventLabel(c.event)} alerts: ${channelsText(after.notifications[c.event] ?? []).toLowerCase()}`
    case 'digest':
      return `Digest set to ${digestPhrase(c.to)}`
    case 'region':
      return `New projects start in ${regionCity(c.to)}`
    case 'timezone':
      return `Timezone set to ${zoneAbbr(c.to)}`
    case 'locale':
      return `Locale set to ${localeText(c.to)}`
    case 'slug':
      return `URL changed to simpul.app/${c.to}`
    case 'name':
      return `Renamed to ${c.to}`
  }
}

/** A few words for a reply: "sessions of 24 hours", "Yusuf Hakim suspended". */
export function phrase(c: Change): string {
  switch (c.kind) {
    case 'sso':
      return c.on ? 'single sign-on required' : 'single sign-on optional'
    case 'session':
      return `sessions of ${sessionText(c.to)}`
    case 'password':
      return `passwords of at least ${c.to} characters`
    case 'twofactor':
      return c.on ? 'two-factor required' : 'two-factor optional'
    case 'role':
      return `${nameOf(c.id)} as ${roleLabel[c.to]}`
    case 'invite':
      return `${nameOf(c.id)} invited as ${roleLabel[c.role]}`
    case 'uninvite':
      return `${nameOf(c.id)}'s invitation withdrawn`
    case 'status':
      return `${nameOf(c.id)} ${c.to === 'suspended' ? 'suspended' : 'reinstated'}`
    case 'notify':
      return `${eventLabel(c.event).toLowerCase()} by ${channelsText(c.channels).toLowerCase()}`
    case 'digest':
      return `the digest ${digestPhrase(c.to)}`
    case 'region':
      return `new projects in ${regionCity(c.to)}`
    case 'timezone':
      return `the timezone ${zoneAbbr(c.to)}`
    case 'locale':
      return `the locale ${localeText(c.to)}`
    case 'slug':
      return `simpul.app/${c.to}`
    case 'name':
      return `the name ${c.to}`
  }
}

/** What the conversation understood, as rows of the check in the thread. */
export function understood(c: Change, s: OrgState): CheckRow[] {
  switch (c.kind) {
    case 'sso':
      return c.on
        ? [
            { label: 'Single sign-on', value: 'Required for everyone' },
            { label: 'Directory', value: `${scene.idp} · SAML 2.0`, inferred: true, hint: `The only one connected; test passed ${scene.idpTested}` },
          ]
        : [{ label: 'Single sign-on', value: 'Optional again' }]
    case 'session':
      return [{ label: 'Sessions', value: sessionText(c.to) }]
    case 'password':
      return [{ label: 'Passwords', value: `At least ${c.to} characters` }]
    case 'twofactor':
      return [{ label: 'Two-factor', value: c.on ? 'Required for everyone' : 'Optional' }]
    case 'role':
      return [{ label: nameOf(c.id), value: roleLabel[c.to] }]
    case 'invite': {
      const p = personOf(c.id)
      return p
        ? [{ label: firstOf(c.id), value: `${p.name}, ${p.team} · ${roleLabel[c.role]}`, inferred: true, hint: `${p.email}, from the directory` }]
        : [{ label: nameOf(c.id), value: `Invited again as ${roleLabel[c.role]}` }]
    }
    case 'uninvite':
      return [{ label: nameOf(c.id), value: 'Invitation withdrawn' }]
    case 'status':
      return [
        c.to === 'suspended'
          ? { label: nameOf(c.id), value: 'Access removed', hint: 'Suspended: signed out at once, the account stays' }
          : { label: nameOf(c.id), value: 'Access back', hint: 'Reinstated with the same role' },
      ]
    case 'notify': {
      const was = s.notifications[c.event] ?? []
      const added = c.channels.filter((ch) => !was.includes(ch))
      const value =
        added.length && was.length && c.channels.length > was.length
          ? `${channelsText(added)} as well as ${channelsText(was).toLowerCase()}`
          : channelsText(c.channels)
      const label = c.event === 'member-joined' ? 'Someone joins' : eventLabel(c.event)
      return [{ label, value, inferred: c.inferred, hint: c.inferred ? 'For everyone by default; members can mute it' : undefined }]
    }
    case 'digest':
      return [{ label: 'Digest', value: digestText(c.to) }]
    case 'region':
      return [{ label: 'New projects', value: regionText(c.to) }]
    case 'timezone':
      return [{ label: 'Timezone', value: zoneText(c.to) }]
    case 'locale':
      return [{ label: 'Locale', value: localeText(c.to), hint: localeExample(c.to) }]
    case 'slug':
      return [{ label: 'URL', value: `simpul.app/${c.to}`, mono: true }]
    case 'name':
      return [{ label: 'Name', value: c.to }]
  }
}

/* ── The store ──────────────────────────────────────────────────────────────────────── */

export function createOrg() {
  const state = reactive<OrgState>(initialState()) as OrgState
  const sets = ref<ChangeSet[]>([])
  const history = ref<HistoryLine[]>(
    seedHistory.map((h) => ({
      id: h.id,
      at: h.day,
      who: h.who,
      text: h.text,
      detail: h.detail,
      canRevert: !!h.inverse,
      stamp: h.stamp,
      time: h.time,
      kind: h.kind,
      inverse: h.inverse,
    })),
  )
  /** Tiles whose value changed in this session, and when. */
  const marks = reactive<Partial<Record<TileKey, string>>>({})
  const transferDraft = ref<string | null>(null)
  const transfer = ref<{ to: string; at: string; until: string; lineId: string; withdrawnAt?: string } | null>(null)
  const deletionDraft = ref(false)
  const deletion = ref<{ at: string; runs: string; lineId: string; cancelledAt?: string } | null>(null)
  const reminder = ref<{ at: string; names: string[] } | null>(null)
  const stack: UndoEntry[] = []
  let setSeq = 0
  let lineSeq = 0

  const pending = computed(() => sets.value.find((s) => s.state === 'pending') ?? null)
  const facts = computed(() => stats(state))
  /** The organization as it would be with the change set applied. */
  const projected = computed(() => project(state, pending.value?.items ?? []))

  const diff = computed<DiffRow[]>(() => {
    const set = pending.value
    if (!set) return []
    const after = projected.value
    return set.items.map((c) => ({
      key: keyOf(c),
      label: labelOf(c),
      from: valueText(state, c),
      to: valueText(after, c),
      affects: affects(c, state, after),
      inferred: !!c.inferred,
      mono: c.kind === 'slug',
    }))
  })

  const seatsAfter = computed(() => stats(projected.value).seats)
  const policyAfter = computed(() => (pending.value?.items.some(isPolicy) ? state.policy + 1 : state.policy))
  const transferOpen = computed(() => !!transfer.value && !transfer.value.withdrawnAt)
  const deletionOpen = computed(() => !!deletion.value && !deletion.value.cancelledAt)

  const setById = (id: string) => sets.value.find((s) => s.id === id) ?? null
  const peekSetId = () => `CS-1118-${pad(setSeq + 1)}`
  const takeSetId = () => `CS-1118-${pad(++setSeq)}`

  function mark(c: Change, at: string) {
    if (c.kind === 'sso' || c.kind === 'session' || c.kind === 'password') marks.signin = at
    if (c.kind === 'twofactor') marks.twofactor = at
    if (c.kind === 'role' || c.kind === 'invite' || c.kind === 'uninvite' || c.kind === 'status') marks.members = at
    if (c.kind === 'status') marks.twofactor = at
    if (c.kind === 'region') marks.region = at
  }

  /** A change that would leave the setting as it is: it does not belong in a change set. */
  const isNoop = (c: Change) => valueText(state, c) === valueText(project(state, [c]), c)

  function upsert(items: Change[], c: Change): Change[] {
    // A role for someone invited in this set changes the invitation.
    if (c.kind === 'role') {
      const invite = items.find((i) => i.kind === 'invite' && i.id === c.id)
      if (invite?.kind === 'invite') return items.map((i) => (i === invite ? { ...invite, role: c.to } : i))
    }
    // Removing someone invited in this set takes the invitation out.
    if ((c.kind === 'status' && c.to === 'suspended') || c.kind === 'uninvite') {
      if (items.some((i) => i.kind === 'invite' && i.id === c.id)) return items.filter((i) => !(i.kind === 'invite' && i.id === c.id))
    }
    const key = keyOf(c)
    const at = items.findIndex((i) => keyOf(i) === key)
    if (at < 0) return [...items, c]
    const next = [...items]
    next[at] = c
    return next
  }

  /** The change set after a sentence: changes merged in, `drops` (people or keys) taken out. */
  function merge(changes: Change[], drops: string[] = []): Change[] {
    let next = (pending.value?.items ?? []).filter((c) => !drops.includes(personIn(c) ?? '') && !drops.includes(keyOf(c)))
    for (const c of changes) next = upsert(next, c)
    return next.filter((c) => !isNoop(c))
  }

  function propose(changes: Change[], drops: string[], at: string) {
    const current = pending.value
    const before = current ? clone(current.items) : null
    const items = merge(changes, drops)
    if (same(before ?? [], items)) return current
    if (current) {
      current.items = items
      if (!items.length) {
        current.state = 'discarded'
        current.at = at
      }
      stack.push({ kind: 'edit', setId: current.id, before })
      return current
    }
    sets.value.push({ id: takeSetId(), items, state: 'pending', askedAt: at })
    const created = sets.value[sets.value.length - 1]
    stack.push({ kind: 'edit', setId: created.id, before: null })
    return created
  }

  function applyPending(at: string) {
    const set = pending.value
    if (!set) return null
    const lines: HistoryLine[] = []
    let policy = false
    set.items.forEach((c, i) => {
      const inverse = inverseOf(state, c)
      const from = valueText(state, c)
      applyChange(state, c)
      const to = valueText(state, c)
      policy ||= isPolicy(c)
      mark(c, at)
      lines.push({
        id: `${set.id}-${i + 1}`,
        at,
        stamp: TODAY,
        time: at,
        who: 'Simpul',
        text: pastText(c, state),
        detail: `${from} → ${to} · ${set.id} · asked and approved by ${scene.you}`,
        canRevert: true,
        kind: 'change',
        inverse,
        group: set.id,
      })
    })
    if (policy) state.policy += 1
    history.value = [...lines, ...history.value]
    set.state = 'applied'
    set.at = at
    stack.push({ kind: 'apply', setId: set.id })
    return { set, lines, policy }
  }

  function discardPending(at: string) {
    const set = pending.value
    if (!set) return null
    set.state = 'discarded'
    set.at = at
    stack.push({ kind: 'discard', setId: set.id })
    return set
  }

  /**
   * Revert one line of the history. Reverted lines stay, struck through. A policy revert is a new
   * policy version; `bump: false` lets "undo" revert a whole set as one version.
   */
  function revert(id: string, at: string, bump = true): HistoryLine | null {
    const line = history.value.find((h) => h.id === id)
    if (!line || line.revertedAt || !line.canRevert) return null
    if (line.kind === 'transfer') {
      if (transfer.value) transfer.value.withdrawnAt = at
    } else if (line.kind === 'deletion') {
      if (deletion.value) deletion.value.cancelledAt = at
    } else if (line.inverse) {
      applyChange(state, line.inverse)
      if (bump && isPolicy(line.inverse)) state.policy += 1
      mark(line.inverse, at)
    }
    line.revertedAt = at
    return line
  }

  /** What "undo" would take back, without doing it: the newest entry that still means something. */
  function resolve(entry: UndoEntry): Undone | null {
    if (entry.kind === 'edit') {
      const set = setById(entry.setId)
      if (!set || set.state === 'applied') return null
      if (entry.before === null) return set.state === 'pending' ? { kind: 'edit-new', set } : null
      if (set.state === 'discarded' && pending.value) return null
      return { kind: 'edit', set, was: clone(set.items), back: clone(entry.before) }
    }
    if (entry.kind === 'apply') {
      const set = setById(entry.setId)
      const lines = history.value.filter((h) => h.group === entry.setId && !h.revertedAt)
      return set && lines.length ? { kind: 'apply', set, lines } : null
    }
    if (entry.kind === 'discard') {
      const set = setById(entry.setId)
      return set && set.state === 'discarded' && !pending.value ? { kind: 'discard', set } : null
    }
    if (entry.kind === 'transfer') return transfer.value && !transfer.value.withdrawnAt ? { kind: 'transfer' } : null
    return deletion.value && !deletion.value.cancelledAt ? { kind: 'deletion' } : null
  }

  function peekUndo(): Undone | null {
    for (let i = stack.length - 1; i >= 0; i--) {
      const found = resolve(stack[i])
      if (found) return found
    }
    return null
  }

  /** Take back the last thing done in this conversation. */
  function undo(at: string): Undone | null {
    while (stack.length) {
      const found = resolve(stack.pop() as UndoEntry)
      if (!found) continue
      if (found.kind === 'edit-new') {
        found.set.state = 'discarded'
        found.set.at = at
      } else if (found.kind === 'edit') {
        found.set.items = found.back
        found.set.state = found.back.length ? 'pending' : 'discarded'
        found.set.at = found.back.length ? undefined : at
      } else if (found.kind === 'apply') {
        for (const line of [...found.lines].reverse()) revert(line.id, at, false)
        if (found.lines.some((l) => l.inverse && isPolicy(l.inverse))) state.policy += 1
      } else if (found.kind === 'discard') {
        found.set.state = 'pending'
        found.set.at = undefined
      } else if (found.kind === 'transfer' && transfer.value) {
        revert(transfer.value.lineId, at)
      } else if (found.kind === 'deletion' && deletion.value) {
        revert(deletion.value.lineId, at)
      }
      return found
    }
    return null
  }

  function sendReminder(at: string) {
    const missing = facts.value.missing
    if (!missing.length || reminder.value) return null
    const names = missing.map((m) => m.name)
    reminder.value = { at, names }
    history.value = [
      {
        id: `r${++lineSeq}`,
        at,
        stamp: TODAY,
        time: at,
        who: 'Simpul',
        text: `Two-factor reminder sent to ${count(names.length, 'member')}`,
        detail: `${missing.map((m) => shortOf(m.id)).join(', ')} · setup steps by email · asked by ${scene.you}`,
        canRevert: false,
        kind: 'reminder',
      },
      ...history.value,
    ]
    marks.twofactor = at
    return reminder.value
  }

  function sendTransfer(at: string) {
    const to = transferDraft.value
    if (!to) return null
    const until = `${scene.acceptBy} ${at} ${scene.zone}`
    const lineId = `t${++lineSeq}`
    history.value = [
      {
        id: lineId,
        at,
        stamp: TODAY,
        time: at,
        who: scene.you,
        text: `Ownership transfer sent to ${nameOf(to)}`,
        detail: `Held to confirm · ${firstOf(to)} accepts by ${until}`,
        canRevert: true,
        kind: 'transfer',
      },
      ...history.value,
    ]
    transfer.value = { to, at, until, lineId }
    transferDraft.value = null
    stack.push({ kind: 'transfer' })
    return transfer.value
  }

  function scheduleDeletion(at: string) {
    if (!deletionDraft.value) return null
    const runs = `${scene.deletionOn} ${at} ${scene.zone}`
    const lineId = `x${++lineSeq}`
    history.value = [
      {
        id: lineId,
        at,
        stamp: TODAY,
        time: at,
        who: scene.you,
        text: `Deletion of ${state.name} scheduled`,
        detail: `Name typed to confirm · runs ${runs} · any admin can cancel until then`,
        canRevert: true,
        kind: 'deletion',
      },
      ...history.value,
    ]
    deletion.value = { at, runs, lineId }
    deletionDraft.value = false
    stack.push({ kind: 'deletion' })
    return deletion.value
  }

  return {
    state,
    sets,
    history,
    marks,
    pending,
    facts,
    projected,
    diff,
    seatsAfter,
    policyAfter,
    transferDraft,
    transfer,
    transferOpen,
    deletionDraft,
    deletion,
    deletionOpen,
    reminder,
    setById,
    peekSetId,
    merge,
    propose,
    applyPending,
    discardPending,
    revert,
    undo,
    peekUndo,
    sendReminder,
    sendTransfer,
    scheduleDeletion,
  }
}

export type OrgModel = ReturnType<typeof createOrg>
