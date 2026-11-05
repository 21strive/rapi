/**
 * The workspace as it is being described: one reactive draft, where each setting came from (the
 * person, Simpul's inference, or the launch itself), the record of what was done, and the actions
 * the conversation and the surfaces share. Nothing in here talks; script.ts does.
 */
import { computed, reactive, ref } from 'vue'
import { formatNumber } from '@/design-system'
import type { StatusTone } from '@/design-system'
import type { TrailItem } from '../_kit/desk'
import {
  AGENT,
  FIRST_INVOICE,
  NEEDS_ACCESS,
  RENEWS,
  SAID_ON,
  START,
  URL_HOST,
  accessWhat,
  chargeToday,
  contact,
  feePerMonth,
  integrations,
  owner,
  people,
  plans,
  providers,
  regions,
  roleNames,
  slugify,
  type AccessKey,
  type Cycle,
  type Plan,
  type PlanKey,
  type RoleKey,
} from './data'

/** Who filled a setting: the person, Simpul (marked, to be checked), or the launch (the terms). */
export type Source = 'you' | 'simpul' | 'launch'

export type RegionKey = 'jkt-1' | 'sin-1' | 'fra-1'

type SettingKey = 'name' | 'slug' | 'industry' | 'country' | 'region' | 'size' | 'role' | 'plan' | 'cycle'

export interface Invite {
  key: string
  first: string
  last: string
  role: RoleKey
  roleBy: Source
  emailBy: Source
  /** After the launch: the invite went out and has not been withdrawn. */
  sent: boolean
}

/** One person on a row that lists several: an invite. */
export interface SummaryEntry {
  text: string
  hint?: string
  status?: { tone: StatusTone; label: string }
}

export interface SummaryRow {
  label: string
  value?: string
  /** Several values under one label, e.g. the invites. */
  entries?: SummaryEntry[]
  hint?: string
  mono?: boolean
  hintMono?: boolean
  /** Filled by Simpul: the selection rule, so the person knows what to check. */
  marked?: boolean
  badge?: string
  /** A lamp and a word after the launch: connected, waiting, sent. */
  status?: { tone: StatusTone; label: string }
}

export interface SummaryBlock {
  key: string
  index: string
  title: string
  rows: SummaryRow[]
}

export interface CellGroup {
  key: string
  label: string
  cells: Source[]
}

export const usd = (value: number, decimals = 0) =>
  `USD ${formatNumber(value, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`

export const emailOf = (p: { first: string; last: string }) => `${p.first}.${p.last}@${owner.domain}`.toLowerCase()

const pad = (n: number) => String(n).padStart(2, '0')
const planOf = (key: PlanKey): Plan => plans.find((p) => p.key === key) ?? plans[1]
const SOURCE_ORDER: Record<Source, number> = { you: 0, simpul: 1, launch: 2 }

export function createDraft(now: () => string) {
  const ws = reactive({
    name: 'Sagara Freight',
    slug: slugify('Sagara Freight'),
    industry: 'Logistics & transport',
    country: 'Indonesia',
    region: 'jkt-1' as RegionKey,
    size: '11–50',
    role: 'Engineering lead',
    /** First-project defaults picked from the role; reverting leaves a blank first project. */
    template: true,
    invites: people.map<Invite>((p) => ({
      key: p.first.toLowerCase(),
      first: p.first,
      last: p.last,
      role: p.role,
      roleBy: 'you',
      emailBy: 'simpul',
      sent: false,
    })),
    on: Object.fromEntries(integrations.map((i) => [i.key, SAID_ON.includes(i.key)])) as Record<string, boolean>,
    /** The four named in the sentence are the person's; the five left off are Simpul's call. */
    onBy: Object.fromEntries(integrations.map((i) => [i.key, SAID_ON.includes(i.key) ? 'you' : 'simpul'])) as Record<
      string,
      Source
    >,
    plan: 'scale' as PlanKey,
    cycle: 'monthly' as Cycle,
    by: {
      name: 'you',
      slug: 'simpul',
      industry: 'you',
      country: 'simpul',
      region: 'simpul',
      size: 'you',
      role: 'you',
      plan: 'simpul',
      cycle: 'simpul',
    } as Record<SettingKey, Source>,
    created: false,
    createdAt: '',
    /** A call with the solutions engineer, booked from the conversation. */
    call: false,
    connected: { git: false, chat: false } as Record<AccessKey, boolean>,
  })

  /* ── Derived ──────────────────────────────────────────────────────────────────── */

  const plan = computed(() => planOf(ws.plan))
  const fee = computed(() => feePerMonth(plan.value, ws.cycle))
  const today = computed(() => chargeToday(plan.value, ws.cycle))
  const billedToday = computed(() => usd(today.value, ws.cycle === 'annual' ? 0 : 2))
  const region = computed(() => regions.find((r) => r.value === ws.region) ?? regions[0])
  const enabled = computed(() => integrations.filter((i) => ws.on[i.key]))
  const off = computed(() => integrations.filter((i) => !ws.on[i.key]))
  /** Invites that count: all of them before the launch, the ones still out after it. */
  const invited = computed(() => ws.invites.filter((i) => !ws.created || i.sent))
  const members = computed(() => invited.value.length + 1)
  /** Simpul's pick: Scale, unless single sign-on is wanted. */
  const recommended = computed<PlanKey>(() => (ws.on.saml ? 'business' : 'scale'))
  const waiting = computed(() => NEEDS_ACCESS.filter((k) => ws.on[k] && !ws.connected[k]))

  function reasonFor(key: PlanKey) {
    if (key === 'business') return ws.on.saml ? 'The only plan with SAML single sign-on' : 'SAML and 75 seats, at three times Scale'
    if (key === 'team') return 'Holds 10; about 30 people outgrow it'
    return 'Room for 25; Team stops at 10'
  }

  const nameOf = (i: { first: string; last: string }) => `${i.first} ${i.last}`

  /* ── Where each of the 25 settings came from ──────────────────────────────────── */

  const groups = computed<CellGroup[]>(() => {
    const sorted = (list: Source[]) => [...list].sort((a, b) => SOURCE_ORDER[a] - SOURCE_ORDER[b])
    const by = ws.by
    return [
      { key: 'company', label: 'Company', cells: sorted([by.name, by.slug, by.industry, by.country, by.region]) },
      { key: 'team', label: 'Team', cells: sorted([by.size, by.role, ...ws.invites.flatMap((i) => [i.emailBy, i.roleBy])]) },
      { key: 'integrations', label: 'Integrations', cells: sorted(integrations.map((i) => ws.onBy[i.key])) },
      { key: 'plan', label: 'Plan', cells: sorted([by.cycle, by.plan]) },
      { key: 'terms', label: 'Terms', cells: [ws.created ? 'you' : 'launch'] },
    ]
  })

  const tally = computed(() => {
    const all = groups.value.flatMap((g) => g.cells)
    return {
      total: all.length,
      you: all.filter((c) => c === 'you').length,
      simpul: all.filter((c) => c === 'simpul').length,
      launch: all.filter((c) => c === 'launch').length,
    }
  })

  /* ── The summary: the Then screen's review, with the inferred rows marked ─────── */

  const blocks = computed<SummaryBlock[]>(() => {
    const by = ws.by
    const live = ws.created
    /** Marked until the launch: Simpul filled it in and the person has not said otherwise. */
    const check = (source: Source) => !live && source === 'simpul'
    return [
      {
        key: 'company',
        index: '01',
        title: 'Company',
        rows: [
          { label: 'Name', value: ws.name, marked: check(by.name) },
          { label: 'URL', value: `${URL_HOST}${ws.slug}`, mono: true, marked: check(by.slug) },
          { label: 'Industry', value: ws.industry, marked: check(by.industry) },
          { label: 'Country', value: ws.country, marked: check(by.country) },
          {
            label: 'Data region',
            value: region.value.label,
            marked: check(by.region),
            hint: live ? 'Fixed' : 'Fixed after creation',
          },
        ],
      },
      {
        key: 'team',
        index: '02',
        title: 'Team',
        rows: [
          { label: 'Size', value: `${ws.size} people`, marked: check(by.size) },
          {
            label: 'Your role',
            value: ws.role,
            marked: check(by.role),
            hint: ws.template ? 'Owner · service template' : 'Owner · blank first project',
          },
          {
            label: `Invites · ${pad(ws.invites.length)}`,
            entries: ws.invites.map<SummaryEntry>((i) => ({
              text: `${nameOf(i)} · ${roleNames[i.role]}`,
              hint: emailOf(i),
              status: live ? (i.sent ? { tone: 'success', label: 'Sent' } : { tone: 'neutral', label: 'Withdrawn' }) : undefined,
            })),
            hint: ws.invites.length ? undefined : 'Nobody yet',
            marked: ws.invites.some((i) => check(i.emailBy) || check(i.roleBy)),
          },
        ],
      },
      {
        key: 'integrations',
        index: '03',
        title: 'Integrations',
        rows: [
          ...enabled.value.map<SummaryRow>((i) => {
            const provider = providers[i.key]
            const access = (NEEDS_ACCESS as readonly string[]).includes(i.key)
            const connected = access && ws.connected[i.key as AccessKey]
            return {
              label: i.name,
              value: provider ? `${provider} · ${i.detail}` : i.detail,
              marked: check(ws.onBy[i.key]),
              status: live
                ? access
                  ? connected
                    ? { tone: 'success', label: 'Connected' }
                    : { tone: 'warning', label: 'Needs your OK' }
                  : { tone: 'success', label: 'On' }
                : undefined,
            }
          }),
          {
            label: 'Off',
            value: `${off.value.length} of ${integrations.length}`,
            hint: off.value.map((i, n) => (n ? i.name.toLowerCase() : i.name).replace(' (saml)', '').replace(' (SAML)', '')).join(', '),
            marked: off.value.some((i) => check(ws.onBy[i.key])),
          },
        ],
      },
      {
        key: 'plan',
        index: '04',
        title: 'Plan',
        rows: [
          {
            label: 'Plan',
            value: `${plan.value.name} · ${ws.cycle}`,
            marked: check(by.plan) || check(by.cycle),
            badge: ws.plan === recommended.value ? 'Recommended' : undefined,
            hint: reasonFor(ws.plan),
          },
          { label: 'Platform fee', value: `${usd(fee.value)} / month`, mono: true },
          {
            label: live ? 'Billed' : 'Billed today',
            value: billedToday.value,
            mono: true,
            hint:
              ws.cycle === 'annual'
                ? `12 months up front · renews ${RENEWS}`
                : `18–30 Nov, prorated · then ${usd(fee.value)} on ${FIRST_INVOICE}`,
          },
          { label: 'Seats', value: `${members.value} of ${plan.value.seats}`, mono: true },
        ],
      },
    ]
  })

  /* ── The record ───────────────────────────────────────────────────────────────── */

  let seq = 0
  const trail = ref<TrailItem[]>([])
  const undo = new Map<string, () => void>()
  /** The trail line of each invite once sent, so "withdraw Hendrik" reverts that line. */
  const inviteLine = new Map<string, string>()
  const integrationLine = new Map<string, string>()

  function record(text: string, detail: string, back?: () => void, who = AGENT, at = now()): TrailItem {
    const item: TrailItem = { id: `onboarding-now-${++seq}`, at, who, text, detail, canRevert: !!back }
    trail.value = [item, ...trail.value]
    if (back) undo.set(item.id, back)
    return item
  }

  /** Reverse one line: the change goes back, the line stays, struck through. */
  function revert(id: string): TrailItem | undefined {
    const back = undo.get(id)
    const item = trail.value.find((t) => t.id === id)
    if (!back || !item || item.revertedAt) return undefined
    back()
    undo.delete(id)
    item.revertedAt = now()
    return item
  }

  /** "Undo that": the newest line that can still be reversed. */
  function undoLast(): TrailItem | undefined {
    const last = trail.value.find((t) => t.canRevert && !t.revertedAt && undo.has(t.id))
    return last ? revert(last.id) : undefined
  }

  // What Simpul did with the sentence, before the person saw the check.
  record(
    'Drafted the workspace from your message',
    '10 stated · 13 inferred · 1 asked · address held 24 h',
    undefined,
    AGENT,
    START,
  )
  record('Matched 3 addresses to your domain', `name.surname@${owner.domain}`, undefined, AGENT, START)
  record('Recommended Scale, monthly', '4 of 25 seats · USD 400 / month', undefined, AGENT, START)
  record(
    'Set first-project defaults for an engineering lead',
    'template http-service · main → production',
    () => (ws.template = false),
    AGENT,
    START,
  )

  /* ── Changes, before the launch ───────────────────────────────────────────────── */

  function setCycle(cycle: Cycle) {
    const was = { cycle: ws.cycle, by: ws.by.cycle }
    ws.cycle = cycle
    ws.by.cycle = 'you'
    return record(
      `Switched billing to ${cycle}`,
      `${usd(fee.value)} / month · ${billedToday.value} today`,
      () => {
        ws.cycle = was.cycle
        ws.by.cycle = was.by
      },
    )
  }

  function setPlan(key: PlanKey, alsoSaml = false) {
    const was = { plan: ws.plan, by: ws.by.plan, saml: ws.on.saml, samlBy: ws.onBy.saml }
    ws.plan = key
    ws.by.plan = 'you'
    if (alsoSaml) {
      ws.on.saml = true
      ws.onBy.saml = 'you'
    }
    return record(
      alsoSaml ? 'Moved to Business and turned on SAML' : `Moved to ${planOf(key).name}`,
      `${usd(fee.value)} / month · ${plan.value.seats} seats`,
      () => {
        ws.plan = was.plan
        ws.by.plan = was.by
        ws.on.saml = was.saml
        ws.onBy.saml = was.samlBy
      },
    )
  }

  function setRegion(key: RegionKey) {
    const was = { region: ws.region, by: ws.by.region }
    ws.region = key
    ws.by.region = 'you'
    return record(`Moved the data region to ${region.value.label}`, 'fixed once the workspace exists', () => {
      ws.region = was.region
      ws.by.region = was.by
    })
  }

  function setSize(size: string) {
    const was = { size: ws.size, by: ws.by.size }
    ws.size = size
    ws.by.size = 'you'
    return record(`Changed the team size to ${size}`, 'seats follow the people who join', () => {
      ws.size = was.size
      ws.by.size = was.by
    })
  }

  function setOwnRole(role: string) {
    const was = { role: ws.role, by: ws.by.role }
    ws.role = role
    ws.by.role = 'you'
    const said = /^[A-Z]{2,}/.test(role) ? role : role.toLowerCase()
    return record(`Changed your role to ${said}`, 'first-project defaults follow it', () => {
      ws.role = was.role
      ws.by.role = was.by
    })
  }

  function setInviteRole(key: string, role: RoleKey) {
    const inv = ws.invites.find((i) => i.key === key)
    if (!inv) return undefined
    const was = { role: inv.role, by: inv.roleBy }
    inv.role = role
    inv.roleBy = 'you'
    const article = role === 'admin' ? 'an' : 'a'
    return record(`Made ${nameOf(inv)} ${article} ${role}`, `${emailOf(inv)} · was ${was.role}`, () => {
      inv.role = was.role
      inv.roleBy = was.by
    })
  }

  function addInvite(first: string, last: string, role: RoleKey) {
    const inv: Invite = { key: first.toLowerCase(), first, last, role, roleBy: 'you', emailBy: 'simpul', sent: false }
    ws.invites.push(inv)
    return record(`Added ${nameOf(inv)} as ${role}`, emailOf(inv), () => {
      const at = ws.invites.findIndex((i) => i.key === inv.key)
      if (at >= 0) ws.invites.splice(at, 1)
    })
  }

  function removeInvite(key: string) {
    const at = ws.invites.findIndex((i) => i.key === key)
    if (at < 0) return undefined
    const [inv] = ws.invites.splice(at, 1)
    return record(`Took ${nameOf(inv)} off the invites`, `${emailOf(inv)} · no invite goes out`, () => {
      ws.invites.splice(Math.min(at, ws.invites.length), 0, inv)
    })
  }

  function rename(name: string) {
    const was = { name: ws.name, slug: ws.slug, by: ws.by.name, slugBy: ws.by.slug }
    ws.name = name
    ws.slug = slugify(name)
    ws.by.name = 'you'
    ws.by.slug = 'simpul'
    return record(`Renamed the workspace to ${name}`, `${URL_HOST}${ws.slug} · free`, () => {
      Object.assign(ws, { name: was.name, slug: was.slug })
      ws.by.name = was.by
      ws.by.slug = was.slugBy
    })
  }

  function setIntegration(key: string, on: boolean) {
    const item = integrations.find((i) => i.key === key)
    if (!item) return undefined
    const was = { on: ws.on[key], by: ws.onBy[key] }
    ws.on[key] = on
    ws.onBy[key] = 'you'
    return record(`Turned ${on ? 'on' : 'off'} ${item.name.toLowerCase()}`, on ? item.detail : 'stays off', () => {
      ws.on[key] = was.on
      ws.onBy[key] = was.by
    })
  }

  /* ── The launch, and after it ─────────────────────────────────────────────────── */

  function create() {
    if (ws.created) return false
    ws.created = true
    ws.createdAt = now()
    // Changes made before the launch are part of what was created; they stop reverting one by one.
    for (const item of trail.value) {
      if (item.canRevert && !item.revertedAt) {
        item.canRevert = false
        undo.delete(item.id)
      }
    }
    record(`Created ${ws.name}`, `${URL_HOST}${ws.slug} · ${region.value.label}`, undefined, owner.name)
    for (const inv of ws.invites) {
      inv.sent = true
      const line = record(
        `Invited ${nameOf(inv)} as ${inv.role}`,
        `${emailOf(inv)} · link valid 7 days`,
        () => (inv.sent = false),
      )
      inviteLine.set(inv.key, line.id)
    }
    for (const item of enabled.value) {
      if ((NEEDS_ACCESS as readonly string[]).includes(item.key)) continue
      const line = record(`Turned on ${item.name.toLowerCase()}`, item.detail, () => (ws.on[item.key] = false))
      integrationLine.set(item.key, line.id)
    }
    record(
      `Billed ${billedToday.value}`,
      ws.cycle === 'annual' ? `${plan.value.name}, 12 months · renews ${RENEWS}` : `${plan.value.name}, 18–30 Nov · then ${usd(fee.value)} on ${FIRST_INVOICE}`,
    )
    return true
  }

  function bookCall() {
    if (ws.call) return undefined
    ws.call = true
    return record(`Booked a call with ${contact.name}`, `${contact.slot} · invite to ${owner.email}`, () => (ws.call = false))
  }

  function connect(key: AccessKey) {
    if (!ws.created || !ws.on[key] || ws.connected[key]) return undefined
    ws.connected[key] = true
    const line = record(`Connected ${providers[key]}`, accessWhat[key].detail, () => (ws.connected[key] = false))
    integrationLine.set(key, line.id)
    return line
  }

  /** After the launch, "withdraw Hendrik" or "turn off webhooks" reverse the line that did it. */
  function revertInvite(key: string) {
    const id = inviteLine.get(key)
    return id ? revert(id) : undefined
  }

  function revertIntegration(key: string) {
    const id = integrationLine.get(key)
    return id ? revert(id) : undefined
  }

  return {
    ws,
    plan,
    fee,
    today,
    billedToday,
    region,
    enabled,
    off,
    invited,
    members,
    recommended,
    waiting,
    groups,
    tally,
    blocks,
    trail,
    reasonFor,
    nameOf,
    revert,
    undoLast,
    setCycle,
    setPlan,
    setRegion,
    setSize,
    setOwnRole,
    setInviteRole,
    addInvite,
    removeInvite,
    rename,
    setIntegration,
    create,
    bookCall,
    connect,
    revertInvite,
    revertIntegration,
  }
}

export type Draft = ReturnType<typeof createDraft>

export { planOf }
