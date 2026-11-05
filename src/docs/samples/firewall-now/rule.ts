/**
 * A rule said in a sentence, the way Simpul reads it: what it acts on, where the traffic comes
 * from, what to leave out and what to do. It becomes the firewall's own expression (the one the
 * Then screen asks a person to write by hand) and the readable rows of the check.
 *
 * Patterns run on the normalised sentence (lowercase, no accents) and cover English and
 * Indonesian: "block logins from outside Indonesia except the Singapore office", "tantang semua
 * request ke /api/transfers dari ASN hosting".
 */
import type { RuleAction } from '../firewall/engine'
import { ACTIONS, COUNTRIES, NETWORKS } from '../firewall/data'
import type { CheckRow } from '../_kit/desk'
import { norm } from '../_kit/desk'
import { HOSTING_ASNS, OFFICES, PARTNER_ASNS } from './whatif'

export type TargetId = 'signin' | 'transfers' | 'otp' | 'admin' | 'all'
export type ExceptId = 'sg-office' | 'jkt-vpn' | 'app' | 'partners'

export interface RuleSpec {
  action: RuleAction
  target: TargetId
  /** Countries the rule applies to (`in`) or leaves out (`not`: "outside Indonesia"). */
  countries?: { mode: 'in' | 'not'; codes: string[] }
  hosting?: boolean
  asns?: number[]
  ips?: string[]
  except: ExceptId[]
}

interface Target {
  /** "sign-ins", for the rule's name. */
  noun: string
  scope: string
  /** The path condition in the firewall's language; empty for every path. */
  path: string
  label: string
  hint: string
  /** Where a rule on this traffic goes in the order: next to the rule that already covers it. */
  anchor: { id: string; side: 'after' | 'before' }
  /** Said with the order: why there. */
  why: string
  /** "logins" and "/api/transfers" are not paths: the check says what they were taken to mean. */
  inferred: boolean
}

export const TARGETS: Record<TargetId, Target> = {
  signin: {
    noun: 'sign-ins',
    scope: 'login.selaras.id',
    path: 'http.path == "/session"',
    label: 'Sign-ins on login.selaras.id',
    hint: 'POST /session only',
    anchor: { id: 'r-02', side: 'after' },
    why: 'After Block credential-stuffing networks',
    inferred: true,
  },
  transfers: {
    noun: 'transfer calls',
    scope: 'api.selaras.id',
    path: 'http.path matches "/transfers$"',
    label: 'Transfer calls on api.selaras.id',
    hint: '/mobile/v3 and /v2 transfers',
    anchor: { id: 'r-08', side: 'after' },
    why: 'After Log open-banking transfer calls, so they are still logged',
    inferred: true,
  },
  otp: {
    noun: 'OTP resends',
    scope: 'api.selaras.id',
    path: 'http.path == "/v1/otp/resend"',
    label: 'OTP resends on api.selaras.id',
    hint: 'POST /v1/otp/resend',
    anchor: { id: 'r-06', side: 'before' },
    why: 'Before Challenge OTP resends from non-app clients',
    inferred: true,
  },
  admin: {
    noun: 'admin paths',
    scope: 'all',
    path: 'http.path matches "^/(admin|internal|actuator)"',
    label: 'Admin paths on every hostname',
    hint: '/admin, /internal and /actuator',
    anchor: { id: 'r-05', side: 'after' },
    why: 'After Block admin paths from the internet',
    inferred: true,
  },
  all: {
    noun: 'requests',
    scope: 'all',
    path: '',
    label: 'Every request in the zone',
    hint: 'All hostnames and paths',
    anchor: { id: 'r-01', side: 'after' },
    why: 'After Allow partner settlement callbacks, so partners stay allowed',
    inferred: false,
  },
}

export const EXCEPTS: Record<ExceptId, { label: string; hint: string }> = {
  'sg-office': { label: OFFICES['sg-office'].name, hint: `${OFFICES['sg-office'].range} · Offices list` },
  'jkt-vpn': { label: OFFICES['jkt-vpn'].name, hint: `${OFFICES['jkt-vpn'].range} · exits in SG` },
  app: { label: 'The Selaras app', hint: 'User agent SelarasApp/' },
  partners: { label: 'Partners', hint: 'AS64905, AS64921, AS64933' },
}

/* ── Reading a sentence ─────────────────────────────────────────────────────────── */

const ACTION_WORDS: [RuleAction, string][] = [
  ['block', '\\b(block|blok|blokir|blokirlah|tolak|deny|drop|cegah|larang|stop)\\b'],
  ['challenge', '\\b(challenge|challenged|tantang|tantangan|verify|verifikasi|captcha)\\b'],
  ['log', '\\b(log|catat|pantau|monitor|record)\\b'],
  ['allow', '\\b(allow|izinkan|ijinkan|bolehkan|loloskan|whitelist)\\b'],
]

/** The first action word in the text: "block", "tantang". */
export function readAction(text: string): RuleAction | null {
  const t = norm(text)
  let best: { action: RuleAction; at: number } | null = null
  for (const [action, pattern] of ACTION_WORDS) {
    const m = new RegExp(pattern).exec(t)
    if (m && (!best || m.index < best.at)) best = { action, at: m.index }
  }
  return best?.action ?? null
}

const TARGET_WORDS: [TargetId, string][] = [
  ['transfers', 'transfer'],
  ['otp', '\\botp\\b'],
  ['admin', '\\badmin'],
  ['signin', '\\b(log(s|ging)? ?-?ins?|logins?|sign(s|ing)? ?-?ins?|signins?|masuk|sesi|session)\\b'],
]

const COUNTRY_WORDS: [string, string][] = [
  ['ID', '\\b(indonesia|ri)\\b'],
  ['SG', '\\b(singapore|singapura)\\b'],
  ['MY', '\\bmalaysia\\b'],
  ['AU', '\\baustralia\\b'],
  ['NL', '\\b(netherlands|belanda|holland)\\b'],
  ['JP', '\\b(japan|jepang)\\b'],
  ['US', '\\b(united states|usa|amerika|america)\\b'],
  ['GB', '\\b(united kingdom|uk|britain|inggris)\\b'],
  ['NO', '\\b(norway|norwegia)\\b'],
  ['BR', '\\b(brazil|brasil)\\b'],
  ['DE', '\\b(germany|jerman)\\b'],
  ['IN', '\\bindia\\b'],
  ['VN', '\\b(vietnam|viet nam)\\b'],
  ['FR', '\\b(france|prancis|perancis)\\b'],
]

const OFFICE_WORDS: [ExceptId, string][] = [
  ['sg-office', '(singapore|singapura|sg) ?(office|kantor)|(office|kantor) ?(di )?(singapore|singapura|sg)'],
  ['jkt-vpn', '\\bvpn\\b|(jakarta|jkt) ?(office|kantor|hq)|(office|kantor) ?(di )?(jakarta|jkt)'],
]

const SPLIT_EXCEPT = /\b(except|excepting|kecuali|selain|but not|other than|minus)\b/

function countriesIn(text: string): string[] {
  return COUNTRY_WORDS.filter(([, pattern]) => new RegExp(pattern).test(text)).map(([code]) => code)
}

/** The things an "except …" leaves out, and any countries it names. */
export function readExcept(text: string): { except: ExceptId[]; countries: string[] } {
  let t = norm(text)
  const except: ExceptId[] = []
  for (const [id, pattern] of OFFICE_WORDS) {
    const re = new RegExp(pattern, 'g')
    if (re.test(t)) {
      except.push(id)
      t = t.replace(new RegExp(pattern, 'g'), ' ')
    }
  }
  if (!except.length && /\b(offices|our office|kantor kami|kantor kita|semua kantor|kantor)\b/.test(t)) except.push('sg-office', 'jkt-vpn')
  if (/\b(app|apps|aplikasi|mobile app)\b/.test(t)) except.push('app')
  if (/\b(partners?|mitra)\b/.test(t)) except.push('partners')
  return { except, countries: countriesIn(t) }
}

/** True when the sentence is only an exception to add: "except the Jakarta office VPN". */
export function isExceptOnly(text: string): boolean {
  const t = norm(text)
  const m = SPLIT_EXCEPT.exec(t)
  return !!m && !readAction(t.slice(0, m.index)) && !TARGET_WORDS.some(([, p]) => new RegExp(p).test(t.slice(0, m.index)))
}

/** A new rule, or null when the sentence does not say one (no action, or nothing to act on). */
export function readRule(said: string): RuleSpec | null {
  const t = norm(said)
  const cut = SPLIT_EXCEPT.exec(t)
  const main = cut ? t.slice(0, cut.index) : t
  const action = readAction(main)
  if (!action) return null
  const target = TARGET_WORDS.find(([, p]) => new RegExp(p).test(main))?.[0] ?? 'all'
  const spec: RuleSpec = { action, target, except: [] }

  const named = countriesIn(main)
  const outside = /\b(outside|luar|abroad|overseas|foreign|asing|mancanegara)\b/.test(main)
  if (outside) spec.countries = { mode: 'not', codes: named.length ? named : ['ID'] }
  else if (named.length) spec.countries = { mode: 'in', codes: named }
  if (/\b(hosting|cloud|data ?cent(er|re)s?|datacenters?|vps)\b/.test(main)) spec.hosting = true
  const asns = [...main.matchAll(/\bas ?(\d{4,6})\b/g)].map((m) => Number(m[1])).filter((n) => NETWORKS[n])
  if (asns.length) spec.asns = asns
  const ips = [...main.matchAll(/\b(\d{1,3}(?:\.\d{1,3}){3}(?:\/\d{1,2})?)\b/g)].map((m) => m[1])
  if (ips.length) spec.ips = ips

  if (cut) {
    const ex = readExcept(t.slice(cut.index))
    spec.except = ex.except
    if (ex.countries.length) withCountries(spec, ex.countries)
  }
  const hasSource = !!(spec.countries || spec.hosting || spec.asns || spec.ips)
  return target === 'all' && !hasSource ? null : spec
}

/** Adds countries an exception names: "except Singapore" leaves Singapore out. */
export function withCountries(spec: RuleSpec, codes: string[]) {
  if (!spec.countries) spec.countries = { mode: 'not', codes: [...codes] }
  else if (spec.countries.mode === 'not') spec.countries.codes = [...new Set([...spec.countries.codes, ...codes])]
  else spec.countries.codes = spec.countries.codes.filter((c) => !codes.includes(c))
}

/* ── Writing it down ────────────────────────────────────────────────────────────── */

const quoteList = (codes: string[]) => `{${codes.map((c) => `"${c}"`).join(' ')}}`

function andList(items: string[]) {
  return items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`
}

export function countryNames(codes: string[]) {
  return andList(codes.map((c) => COUNTRIES[c] ?? c))
}

/** "from outside Indonesia", "from hosting networks", or empty. */
export function fromPhrase(spec: RuleSpec): string {
  if (spec.countries?.mode === 'not') return `from outside ${countryNames(spec.countries.codes)}`
  if (spec.countries?.mode === 'in' && spec.countries.codes.length) return `from ${countryNames(spec.countries.codes)}`
  if (spec.hosting) return 'from hosting networks'
  if (spec.asns) return `from ${andList(spec.asns.map((a) => `AS${a}`))}`
  if (spec.ips) return `from ${andList(spec.ips)}`
  return ''
}

/** "Block sign-ins from outside Indonesia". */
export function nameOf(spec: RuleSpec): string {
  return [ACTIONS[spec.action].label, TARGETS[spec.target].noun, fromPhrase(spec)].filter(Boolean).join(' ')
}

export interface Written {
  expression: string
  base: string
  target: string
  scope: string
}

/** The rule in the firewall's own language, with and without its exceptions. */
export function write(spec: RuleSpec): Written {
  const target = TARGETS[spec.target]
  const parts: string[] = []
  if (target.path) parts.push(target.path)
  if (spec.countries?.codes.length) {
    parts.push(`${spec.countries.mode === 'not' ? 'not ' : ''}ip.geo.country in ${quoteList(spec.countries.codes)}`)
  }
  if (spec.hosting) parts.push(`asn in {${HOSTING_ASNS.join(' ')}}`)
  if (spec.asns) parts.push(`asn in {${spec.asns.join(' ')}}`)
  if (spec.ips) parts.push(`ip.src in {${spec.ips.join(' ')}}`)
  const base = parts.join(' and ') || 'http.method != ""'
  const outs: string[] = []
  const ranges = (['sg-office', 'jkt-vpn'] as const).filter((id) => spec.except.includes(id)).map((id) => OFFICES[id].range)
  if (ranges.length) outs.push(`not ip.src in {${ranges.join(' ')}}`)
  if (spec.except.includes('app')) outs.push('not http.user_agent contains "SelarasApp/"')
  if (spec.except.includes('partners')) outs.push(`not asn in {${PARTNER_ASNS.join(' ')}}`)
  return { expression: [base, ...outs].join(' and '), base, target: target.path, scope: target.scope }
}

/** Field, operator and value per condition: what the Then's expression box asks for by hand. */
export function termsOf(expression: string): number {
  return (expression.match(/\b(http\.path|http\.user_agent|http\.method|ip\.src|ip\.geo\.country|asn)\b/g) ?? []).length * 3
}

/* ── The check ──────────────────────────────────────────────────────────────────── */

const pad = (n: number) => String(n).padStart(2, '0')

export const START_LABEL: Record<RuleAction, string> = {
  block: 'then blocks',
  challenge: 'then challenges',
  allow: 'then allows',
  log: 'and keeps logging',
}

/**
 * The rows to check. A row the conversation filled in (a path read from "logins", an office's
 * range, the place in the order) or just changed is marked, so the eye goes to it first.
 */
export function rowsOf(spec: RuleSpec, position: number, total: number, orderHint: string, changed: (keyof RuleSpec)[] = []): CheckRow[] {
  const target = TARGETS[spec.target]
  const from = fromPhrase(spec).replace(/^from /, '')
  const offices = (['sg-office', 'jkt-vpn'] as const).filter((id) => spec.except.includes(id))
  const exceptHint = [
    offices.length === 1 ? EXCEPTS[offices[0]].hint : offices.length ? `${offices.map((id) => OFFICES[id].range).join(' and ')} · Offices list` : '',
    spec.except.includes('app') ? EXCEPTS.app.hint : '',
    spec.except.includes('partners') ? EXCEPTS.partners.hint : '',
  ]
    .filter(Boolean)
    .join('; ')
  return [
    { label: 'Matches', value: target.label, hint: target.hint, inferred: target.inferred || changed.includes('target') },
    {
      label: 'From',
      value: from ? from.charAt(0).toUpperCase() + from.slice(1) : 'Anywhere',
      hint: spec.hosting ? `${HOSTING_ASNS.length} seen on the zone this month` : undefined,
      inferred: !!spec.hosting || changed.includes('countries'),
    },
    {
      label: 'Except',
      value: spec.except.length ? andList(spec.except.map((id) => EXCEPTS[id].label)) : 'Nothing',
      hint: exceptHint || undefined,
      inferred: spec.except.some((id) => id === 'sg-office' || id === 'jkt-vpn') || changed.includes('except'),
    },
    { label: 'Action', value: ACTIONS[spec.action].label, inferred: changed.includes('action') },
    { label: 'Order', value: `${pad(position + 1)} of ${total}`, hint: orderHint, inferred: true },
    {
      label: 'Starts',
      value: spec.action === 'log' ? 'Logging' : 'Log only for 1 hour',
      hint: spec.action === 'log' ? 'Records, lets requests through' : `Records first, ${START_LABEL[spec.action]}`,
      inferred: true,
    },
  ]
}
