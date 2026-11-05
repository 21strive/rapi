/**
 * What a rule would have done. The Then screen's engine and its 24 hours of traffic (imported, so
 * the two screens can never disagree), run twice: once with the rules as they are and once with
 * the draft in its place in the order. The preview compares the two request by request, so it
 * can say what changes (challenged today, blocked tomorrow), what never reaches the draft (an
 * earlier rule ends it first) and what its exceptions spare.
 *
 * One addition to the Then's data: customer traffic there comes from abstract ranges, so two of
 * Selaras Bank's own egress ranges are carved out of it as labelled slices (the Singapore office
 * and the Jakarta office VPN, which leaves the network in Singapore). The slices keep the weight
 * and the hourly shape of the traffic they come from, and no existing rule tests those ranges,
 * so every figure of the Then screen stays exactly as it is.
 */
import { parseRange, parseRule, shareOf, type Profile, type RuleAction, type RuleNode } from '../firewall/engine'
import { COUNTRIES, HOURS, NETWORKS, RULES, profiles } from '../firewall/data'

export const H = HOURS.length

/* ── Who the traffic is ─────────────────────────────────────────────────────────── */

export type GroupId =
  | 'customers-id'
  | 'customers-sg'
  | 'customers-abroad'
  | 'jkt-vpn'
  | 'sg-office'
  | 'partners'
  | 'monitors'
  | 'stuffing'
  | 'proxies'
  | 'scanners'
  | 'admin-probes'
  | 'scrapers'
  | 'otp-pumps'

export type GroupKind = 'attack' | 'customers' | 'yours' | 'partner' | 'monitor'

/** `short` names the group in a figure's caption: "Last night’s proxies". */
export const GROUPS: Record<GroupId, { label: string; short: string; kind: GroupKind; why: string }> = {
  'customers-id': { label: 'Customers in Indonesia', short: 'customers', kind: 'customers', why: 'App and web on Indonesian broadband and mobile' },
  'customers-sg': { label: 'Customers in Singapore', short: 'customers', kind: 'customers', why: 'App and web on home broadband; they go on to MFA' },
  'customers-abroad': { label: 'Customers elsewhere', short: 'customers', kind: 'customers', why: 'App and web on home broadband; they go on to MFA' },
  'jkt-vpn': { label: 'Jakarta office VPN', short: 'your VPN', kind: 'yours', why: 'Staff in Jakarta; the VPN leaves the network in Singapore' },
  'sg-office': { label: 'Singapore office', short: 'your SG office', kind: 'yours', why: 'Selaras Bank Singapore' },
  partners: { label: 'Partners', short: 'partners', kind: 'partner', why: 'Settlement and open-banking calls from their own networks' },
  monitors: { label: 'Uptime monitors', short: 'monitors', kind: 'monitor', why: 'Health checks with no user agent' },
  stuffing: { label: 'Hosting networks', short: 'Hosting networks', kind: 'attack', why: 'Last night’s credential stuffing' },
  proxies: { label: 'Residential proxies abroad', short: 'Last night’s proxies', kind: 'attack', why: 'Last night’s wave through home connections; none went on to MFA' },
  scanners: { label: 'Scanners', short: 'Scanners', kind: 'attack', why: 'Walking /.env, /.git and friends' },
  'admin-probes': { label: 'Admin probes', short: 'Admin probes', kind: 'attack', why: 'Ordinary user agents on admin paths' },
  scrapers: { label: 'Scrapers on the mobile API', short: 'Scrapers', kind: 'attack', why: 'Hosting networks posing as the app' },
  'otp-pumps': { label: 'OTP pumping', short: 'OTP pumping', kind: 'attack', why: 'Scripted OTP resends' },
}

export interface Office {
  id: 'jkt-vpn' | 'sg-office'
  name: string
  range: string
  asn: number
  /** Share of that network's desktop web traffic that is the office. */
  share: number
}

/** Selaras Bank's own egress ranges, from the zone's Offices list. */
export const OFFICES: Record<Office['id'], Office> = {
  'sg-office': { id: 'sg-office', name: 'Singapore office', range: '192.0.2.192/29', asn: 64577, share: 0.06 },
  'jkt-vpn': { id: 'jkt-vpn', name: 'Jakarta office VPN', range: '192.0.2.160/29', asn: 64561, share: 0.08 },
}

const CUSTOMERS = parseRange('192.0.2.0/24')!
const ABROAD = parseRange('192.0.2.128/25')!
/** Customers abroad apart from the office slices: a range the office ranges do not touch. */
const ABROAD_REST = parseRange('192.0.2.128/27')!
const DESKTOP_WEB = 'selaras-web/2026.10 (desktop)'

export const STUFFING_ASNS = [64620, 64788, 65012]
export const PARTNER_ASNS = [64905, 64921, 64933]
/** Every hosting network seen on the zone this month. */
export const HOSTING_ASNS = [64600, 64620, 64652, 64713, 64788, 65012]

const inside = (a: [number, number], b: [number, number]) => a[0] >= b[0] && a[1] <= b[1]

function classify(p: Profile): GroupId {
  if (inside(p.ip, CUSTOMERS)) return p.country === 'ID' ? 'customers-id' : p.country === 'SG' ? 'customers-sg' : 'customers-abroad'
  if (PARTNER_ASNS.includes(p.asn)) return 'partners'
  if (p.ua === '') return 'monitors'
  if (/sqlprobe|VulnHound|masscrawl/.test(p.ua)) return 'scanners'
  if (p.path === '/session') return STUFFING_ASNS.includes(p.asn) ? 'stuffing' : 'proxies'
  if (p.path === '/v1/otp/resend') return 'otp-pumps'
  if (/^\/(admin|internal|actuator)/.test(p.path)) return 'admin-probes'
  return 'scrapers'
}

export interface Slice extends Profile {
  group: GroupId
}

/** The Then's traffic, with the two office slices carved out of the customers abroad. */
export const traffic: Slice[] = profiles.flatMap((p): Slice[] => {
  const group = classify(p)
  if (!(p.ip[0] === ABROAD[0] && p.ip[1] === ABROAD[1])) return [{ ...p, group }]
  const office = Object.values(OFFICES).find((o) => o.asn === p.asn)
  if (!office || p.ua !== DESKTOP_WEB) return [{ ...p, ip: ABROAD_REST, group }]
  const weight = Math.round(p.weight * office.share)
  return [
    { ...p, ip: parseRange(office.range)!, weight, group: office.id },
    { ...p, ip: ABROAD_REST, weight: p.weight - weight, group },
  ]
})

/* ── Rules as the simulation sees them ──────────────────────────────────────────── */

export interface SimRule {
  id: string
  ast: RuleNode
  scope: string
  action: RuleAction
  /** Per hourly bucket, the share of the hour the rule was on (0–1). */
  live: number[]
}

export function astOf(expression: string): RuleNode {
  const parsed = parseRule(expression)
  if (!parsed.ok) throw new Error(`Rule does not parse: ${expression} (${parsed.message})`)
  return parsed.ast
}

export const ALWAYS = HOURS.map(() => 1)
export const NEVER = HOURS.map(() => 0)
/** Rule 10 was on until 23:12 UTC: bucket 17 (23:00), the first 12 minutes of it. As in the Then. */
const RULE_10_LIVE = HOURS.map((_, h) => (h < 17 ? 1 : h === 17 ? 0.2 : 0))

/** The rules as they ran over the last 24 hours, in order. */
export const HISTORY: SimRule[] = RULES.map((rule) => ({
  id: rule.id,
  ast: astOf(rule.expression),
  scope: rule.scope,
  action: rule.action,
  live: rule.id === 'r-10' ? RULE_10_LIVE : rule.enabled ? ALWAYS : NEVER,
}))

/* ── Simulation ─────────────────────────────────────────────────────────────────── */

export type Outcome = 'block' | 'challenge' | 'allow' | 'pass'
const TERMINAL: Record<RuleAction, Outcome | null> = { block: 'block', challenge: 'challenge', allow: 'allow', log: null }

interface Run {
  /** Per rule, requests matched per hour. */
  hourly: number[][]
  /** Per rule, requests matched per slice over 24 h. */
  matched: number[][]
  /** Per slice, requests by outcome over 24 h. */
  outcome: Record<Outcome, number>[]
  /** Per slice and rule, requests that rule ended (blocked, challenged or allowed). */
  endedBy: number[][]
  /** Requests per hour by outcome. */
  perHour: Record<Outcome, number[]>
}

/** Every slice through the rules in order, hour by hour; the first terminal match ends it. */
export function run(rules: SimRule[]): Run {
  const hourly = rules.map(() => new Array<number>(H).fill(0))
  const matched = rules.map(() => new Array<number>(traffic.length).fill(0))
  const outcome = traffic.map(() => ({ block: 0, challenge: 0, allow: 0, pass: 0 }))
  const endedBy = traffic.map(() => new Array<number>(rules.length).fill(0))
  const perHour: Record<Outcome, number[]> = {
    block: new Array<number>(H).fill(0),
    challenge: new Array<number>(H).fill(0),
    allow: new Array<number>(H).fill(0),
    pass: new Array<number>(H).fill(0),
  }
  traffic.forEach((slice, p) => {
    const shares = rules.map((rule) => shareOf(rule, slice))
    for (let h = 0; h < H; h++) {
      const volume = slice.weight * slice.shape[h]
      let remaining = 1
      rules.forEach((rule, r) => {
        if (!rule.live[h] || shares[r] === 0 || remaining <= 0) return
        const share = remaining * shares[r] * rule.live[h]
        hourly[r][h] += volume * share
        matched[r][p] += volume * share
        const end = TERMINAL[rule.action]
        if (!end) return
        outcome[p][end] += volume * share
        endedBy[p][r] += volume * share
        perHour[end][h] += volume * share
        remaining -= share
      })
      outcome[p].pass += volume * remaining
      perHour.pass[h] += volume * remaining
    }
  })
  return { hourly, matched, outcome, endedBy, perHour }
}

/** The last 24 hours as they happened: the same figures as the Then screen. */
export const PAST = run(HISTORY)

const total = (values: number[]) => values.reduce((a, b) => a + b, 0)
const rounded = (values: number[]) => values.map(Math.round)

export const PAST_TOTALS = {
  blocked: Math.round(total(PAST.perHour.block)),
  challenged: Math.round(total(PAST.perHour.challenge)),
}

/* ── The preview of a draft ─────────────────────────────────────────────────────── */

export interface Draftable {
  /** The full expression, exceptions included. */
  expression: string
  /** The expression without its exceptions, to count what they spare. */
  base: string
  /** The path condition alone ("http.path == \"/session\""), or empty: what the rule looks at. */
  target: string
  scope: string
  action: RuleAction
}

export interface GroupRow {
  id: GroupId
  label: string
  kind: GroupKind
  /** What the matched requests have in common: countries, networks, clients. */
  detail: string
  /** Countries the matched requests came from, most first. */
  countries: string[]
  why: string
  /** Requests of this group the rule matches in its place, over 24 h. */
  matched: number
  /** Requests its exceptions keep out. */
  spared: number
  /** What happened to the matched requests in the last 24 h, and the rule that did it. */
  before: Outcome
  beforeRule?: string
  /** What would happen to them with the rule. */
  after: Outcome
}

export interface Effect {
  /** Requests the rule matches in its place over 24 h (the sum of the rows). */
  matched: number
  /** Matches per hour, for the sparkline. */
  hourly: number[]
  rows: GroupRow[]
  /** Rows that its exceptions keep out entirely. */
  spared: GroupRow[]
  /** The largest groups on the same host and path that it leaves alone. */
  untouched: { id: GroupId; label: string; kind: GroupKind; requests: number }[]
  attack: number
  customers: number
  yours: number
  partners: number
  /** Matched share of the traffic the rule looks at (its host and path), in percent. */
  share: number
  /** Matched by the expression but ended by an earlier rule first: the requests and the rule. */
  shadowed: { value: number; rule: string; group: GroupId } | null
  /** Blocked and challenged per hour with the rule enforcing. */
  blocked: number[]
  challenged: number[]
  totals: { blocked: number; challenged: number }
}

/** "Lintas Selat Telecom" → "Lintas Selat". */
const shortNetwork = (asn: number) => NETWORKS[asn].name.replace(/ (Telecom|Fibre|Fiber|Broadband|Net|Mobile|Seluler)$/, '')

const UA_KIND = (ua: string) => (ua.startsWith('SelarasApp/') ? 'app' : ua.startsWith('selaras-web/') ? 'web' : 'other')

/** "Malaysia, Australia +4 · app and web", from what the rule actually matched. */
function describe(id: GroupId, parts: { slice: Slice; n: number }[]): string {
  const by = <K>(key: (s: Slice) => K) => {
    const m = new Map<K, number>()
    parts.forEach(({ slice, n }) => m.set(key(slice), (m.get(key(slice)) ?? 0) + n))
    return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([k]) => k)
  }
  const list = (names: string[], max = 2) => (names.length > max ? `${names.slice(0, max).join(', ')} +${names.length - max}` : names.join(', '))
  if (id === 'jkt-vpn' || id === 'sg-office') return `${OFFICES[id].range} · AS${OFFICES[id].asn}`
  if (id.startsWith('customers')) {
    const kinds = by((s) => UA_KIND(s.ua))
    const clients = kinds.includes('app') && kinds.includes('web') ? 'app and web' : kinds.includes('app') ? 'app only' : 'web only'
    const where = id === 'customers-sg' ? list(by((s) => shortNetwork(s.asn))) : list(by((s) => COUNTRIES[s.country] ?? s.country))
    return `${where} · ${clients}`
  }
  if (id === 'partners') return list(by((s) => NETWORKS[s.asn].name), 3)
  if (id === 'stuffing' || id === 'scrapers') return list(by((s) => `AS${s.asn}`), 3)
  const addresses = new Set(parts.map(({ slice }) => slice.ip[0])).size
  return `${list(by((s) => COUNTRIES[s.country] ?? s.country), 3)} · ${addresses} ${addresses === 1 ? 'address' : 'addresses'}`
}

function countriesOf(parts: { slice: Slice; n: number }[]) {
  const m = new Map<string, number>()
  parts.forEach(({ slice, n }) => m.set(slice.country, (m.get(slice.country) ?? 0) + n))
  return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([c]) => c)
}

/**
 * What happened to the requests a draft takes over, and what happens to them with it. Per outcome:
 * the requests that ended that way before, less the ones that still end that way through another
 * rule. The largest share is "today"; the rule whose endings dropped most is the one it overrides.
 */
function transition(ids: number[], beforeRun: Run, afterRun: Run, rules: SimRule[], draftAt: number, action: RuleAction) {
  const end = TERMINAL[action]
  const sum = (r: Run, o: Outcome) => ids.reduce((a, p) => a + r.outcome[p][o], 0)
  const drafted = ids.reduce((a, p) => a + afterRun.matched[draftAt][p], 0)
  const outcomes: Outcome[] = ['block', 'challenge', 'allow', 'pass']
  const taken = outcomes.map((o) => ({ o, n: sum(beforeRun, o) - (sum(afterRun, o) - (o === end ? drafted : 0)) }))
  const before = taken.reduce((a, b) => (b.n > a.n ? b : a)).o
  let beforeRule: string | undefined
  if (before !== 'pass') {
    let best = 0.5
    rules.forEach((r, k) => {
      const was = ids.reduce((a, p) => a + beforeRun.endedBy[p][k], 0)
      const now = ids.reduce((a, p) => a + afterRun.endedBy[p][k < draftAt ? k : k + 1], 0)
      if (was - now > best) {
        best = was - now
        beforeRule = r.id
      }
    })
  }
  return { before, beforeRule, after: end ?? before }
}

/**
 * Runs the draft at `at` in the order (0-based) against the last 24 hours. `rules` are the rules
 * in today's order with the history's switches, so a rule turned on in this session is included.
 */
export function preview(draft: Draftable, at: number, rules: SimRule[] = HISTORY): Effect {
  const ast = astOf(draft.expression)
  const baseAst = astOf(draft.base)
  const targetAst = draft.target ? astOf(draft.target) : null
  // The preview shows what the rule does once it enforces; its first hour in log-only changes nothing.
  const sim: SimRule = { id: 'draft', ast, scope: draft.scope, action: draft.action, live: ALWAYS }
  const withDraft = [...rules.slice(0, at), sim, ...rules.slice(at)]
  const beforeRun = rules === HISTORY ? PAST : run(rules)
  const afterRun = run(withDraft)
  const hourly = rounded(afterRun.hourly[at])

  const byGroup = new Map<GroupId, number[]>()
  traffic.forEach((slice, p) => byGroup.set(slice.group, [...(byGroup.get(slice.group) ?? []), p]))

  const rows: GroupRow[] = []
  const spared: GroupRow[] = []
  const untouched: Effect['untouched'] = []
  let shadowed: Effect['shadowed'] = null
  let looked = 0
  for (const [id, ids] of byGroup) {
    let matched = 0
    let spare = 0
    let alone = 0
    let seen = 0
    const parts: { slice: Slice; n: number }[] = []
    for (const p of ids) {
      const slice = traffic[p]
      const m = afterRun.matched[at][p]
      matched += m
      if (m > 0) parts.push({ slice, n: m })
      const full = shareOf({ ast, scope: draft.scope }, slice)
      const base = shareOf({ ast: baseAst, scope: draft.scope }, slice)
      spare += Math.max(0, base - full) * slice.weight
      alone += full * slice.weight
      if (targetAst ? shareOf({ ast: targetAst, scope: draft.scope }, slice) > 0 : draft.scope === 'all' || slice.host === draft.scope) {
        seen += slice.weight
      }
    }
    looked += seen
    const group = GROUPS[id]
    if (Math.round(matched) === 0 && Math.round(spare) === 0 && Math.round(alone) === 0 && seen > 0) {
      untouched.push({ id, label: group.label, kind: group.kind, requests: Math.round(seen) })
    }
    if (Math.round(matched) > 0) {
      rows.push({
        id,
        label: group.label,
        kind: group.kind,
        detail: describe(id, parts),
        countries: countriesOf(parts),
        why: group.why,
        matched: Math.round(matched),
        spared: Math.round(spare),
        ...transition(ids, beforeRun, afterRun, rules, at, draft.action),
      })
    } else if (Math.round(spare) > 0) {
      spared.push({
        id,
        label: group.label,
        kind: group.kind,
        detail: describe(id, ids.map((p) => ({ slice: traffic[p], n: traffic[p].weight }))),
        countries: [],
        why: group.why,
        matched: 0,
        spared: Math.round(spare),
        before: 'pass',
        after: 'pass',
      })
    }
    // Matched on its own, but an earlier rule ends it first.
    const lost = alone - matched
    if (lost > 0.5 && (!shadowed || lost > shadowed.value)) {
      let rule = ''
      let most = 0
      withDraft.slice(0, at).forEach((r, k) => {
        const n = ids.reduce((a, p) => a + afterRun.endedBy[p][k], 0)
        if (n > most) {
          most = n
          rule = r.id
        }
      })
      if (rule) shadowed = { value: Math.round(lost), rule, group: id }
    }
  }
  rows.sort((a, b) => b.matched - a.matched)
  untouched.sort((a, b) => b.requests - a.requests)

  const sumKind = (kind: GroupKind) => rows.filter((r) => r.kind === kind).reduce((a, r) => a + r.matched, 0)
  const matched = rows.reduce((a, r) => a + r.matched, 0)
  return {
    matched,
    hourly,
    rows,
    spared,
    untouched: untouched.slice(0, 3),
    attack: sumKind('attack'),
    customers: sumKind('customers'),
    yours: sumKind('yours'),
    partners: sumKind('partner') + sumKind('monitor'),
    share: looked ? (matched / looked) * 100 : 0,
    shadowed,
    blocked: rounded(afterRun.perHour.block),
    challenged: rounded(afterRun.perHour.challenge),
    totals: { blocked: Math.round(total(afterRun.perHour.block)), challenged: Math.round(total(afterRun.perHour.challenge)) },
  }
}
