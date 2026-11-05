/**
 * The API keys desk: what Simpul understands, in English and Indonesian, and what each turn changes
 * on the surfaces. The keys, the key being drafted, the decisions waiting and the trail live in one
 * store, so the thread and the surfaces never disagree: a press on a surface writes to the thread
 * and the trail, a sentence in the thread changes the surface, and a Revert shows in both.
 */
import { computed, reactive, ref } from 'vue'
import { hits, norm, useDesk, type CheckRow, type DeskReply, type TrailItem } from '../_kit/desk'
import {
  AGENT,
  JOB_IP,
  OFFICE,
  PERSON,
  SCENE,
  WEBHOOK,
  dateIn,
  lastAt,
  makeSecret,
  reportingCalls,
  reportingUse,
  resourceIds,
  resourceLabel,
  resourceWords,
  scopeBadges,
  snippet,
  startKeys,
  webhookUse,
  whatStops,
  type DeskKey,
  type Env,
  type Lang,
  type ResourceId,
  type Scope,
  type Tone,
} from './data'

/* ── Shapes ────────────────────────────────────────────────────────────────────────── */

type Field = 'read' | 'write' | 'env' | 'expires' | 'allow'

/** The key being asked for, before anyone creates it. Every change makes a new version. */
export interface Draft {
  version: number
  job: 'nightly' | 'webhook'
  name: string
  env: Env
  read: ResourceId[]
  write: ResourceId[]
  /** Days from today; null: never. */
  days: number | null
  /** Addresses it works from; null: any. */
  allow: string[] | null
  /** Filled in by Simpul rather than said: marked on the check. */
  inferred: Record<Field, boolean>
  hints: Record<Field, string>
  /** Resources the person took off or put on, against what the job used. */
  changed: Partial<Record<ResourceId, 'removed' | 'added'>>
  /** The row the last change touched. */
  touched?: Field
  /** What the job used, by resource: the evidence for each scope. */
  use: Record<ResourceId, number>
  useLabel: string
}

export type Grace = 'now' | '1h' | '24h'
export interface Rotation {
  version: number
  keyId: string
  grace: Grace
}
export interface Revocation {
  version: number
  keyId: string
  /** The person asked by word to revoke: the panel asks for the hand. */
  called: boolean
}
export interface Secret {
  id: string
  keyId: string
  name: string
  secret: string
  at: string
}
export interface Outcome {
  tone: Tone
  label: string
  at?: string
}

/** What a thread card shows: a check (rows) or a snippet. `ref` ties a check to its decision. */
export type CardData =
  | { kind: 'check'; ref?: string; eyebrow: string; title: string; rows: CheckRow[] }
  | { kind: 'code'; title: string; language: string; code: string }

type Undo = { kind: 'draft'; before: Draft } | { kind: 'trail'; id: string } | { kind: 'final'; text: string }

/* ── Small helpers ─────────────────────────────────────────────────────────────────── */

const fmt = (n: number) => n.toLocaleString('en-US')
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const low = (s: string) => s.charAt(0).toLowerCase() + s.slice(1)
const sum = (v: number[]) => v.reduce((a, b) => a + b, 0)

/** "Payments, refunds, payouts, balance". */
export function listOf(ids: ResourceId[]): string {
  return ids.length ? cap(ids.map((id) => resourceLabel[id].toLowerCase()).join(', ')) : 'None'
}

function inOrder(ids: Iterable<ResourceId>): ResourceId[] {
  const set = new Set(ids)
  return resourceIds.filter((r) => set.has(r))
}

/** Resources named in a sentence, in the order of the catalogue. */
function resourcesIn(t: string): ResourceId[] {
  return resourceIds.filter((r) => new RegExp(`\\b(${resourceWords[r]})\\b`).test(t))
}

function ipsIn(t: string): string[] {
  return t.match(/\b\d{1,3}(?:\.\d{1,3}){3}(?:\/\d{1,2})?\b/g) ?? []
}

const OFFICE_WORDS = /\b(office|kantor)\b/
const ANY_IP = /any (ip|address|where)|anywhere|semua (ip|alamat)|tanpa batas(an)? ip|no (ip )?(limit|allow.?list|restriction)|dari mana (saja|aja)/
const TIME_WORDS = /\b(now|sekarang|langsung|immediately|right away|at once|1 ?h|an? hour|1 hour|1 jam|sejam|24 ?h|24 hours|24 jam|a day|sehari|tomorrow|besok)\b/

/** Days asked for: a number, null for never, undefined when the sentence says nothing. */
function daysIn(t: string): number | null | undefined {
  if (/\bnever\b|tidak (pernah )?(kedaluwarsa|kadaluarsa|expire)|selamanya|no expiry|tanpa (batas waktu|kedaluwarsa|kadaluarsa|expiry)|forever/.test(t)) return null
  const m = t.match(/\b(\d+)\s*(d|days?|hari|weeks?|minggu|months?|bulan|years?|tahun)\b/)
  if (m) {
    const n = Number(m[1])
    const u = m[2]
    if (/^(weeks?|minggu)$/.test(u)) return n * 7
    if (/^(months?|bulan)$/.test(u)) return n * 30
    if (/^(years?|tahun)$/.test(u)) return n * 365
    return n
  }
  if (/\b(a|one|satu)\s+(year|tahun)\b|setahun/.test(t)) return 365
  if (/\b(a|one|satu)\s+(month|bulan)\b|sebulan/.test(t)) return 30
  return undefined
}

/** "11:52" plus minutes. */
function addMinutes(at: string, minutes: number): string {
  const [h, m] = at.split(':').map(Number)
  const total = (h * 60 + m + minutes) % (24 * 60)
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

/** Before the press: when the old secret stops, counted from the rotation itself. */
export function graceAfter(grace: Grace): string {
  return grace === 'now' ? 'The moment you rotate' : grace === '1h' ? '1 hour after you rotate' : '24 hours after you rotate'
}

/** When an old secret stops, from the moment of the rotation. */
export function graceUntil(grace: Grace, at: string): { long: string; short: string } {
  if (grace === 'now') return { long: 'at once', short: 'now' }
  if (grace === '1h') return { long: `at ${addMinutes(at, 60)} WIB today`, short: addMinutes(at, 60) }
  return { long: `at ${at} WIB on 4 Nov`, short: `4 Nov ${at}` }
}

/** "payments:write +2", the way the State list shows scopes. */
export function scopeLine(scopes: Scope[]): string {
  const badges = scopeBadges(scopes)
  return badges.length > 1 ? `${badges[0]} +${badges.length - 1}` : (badges[0] ?? 'none')
}

/* ── Drafts: what a job needs, from what it did ────────────────────────────────────── */

function expiryHint(days: number | null | undefined): string {
  if (days === undefined) return 'You did not say; live keys made this year run a year'
  if (days === null) return 'You asked for no expiry'
  return `${days} days, as you said`
}

function allowFor(t: string, fallback: string) {
  const ips = ipsIn(t)
  if (ANY_IP.test(t)) return { allow: null, inferred: false, hint: 'You asked for any address' }
  if (OFFICE_WORDS.test(t)) return { allow: [OFFICE.cidr], inferred: true, hint: `You said “${t.match(OFFICE_WORDS)?.[0]}”: ${OFFICE.name}` }
  if (ips.length) return { allow: ips, inferred: false, hint: 'As you said' }
  return { allow: [fallback], inferred: true, hint: '' }
}

let seq = 1

function nightlyDraft(t: string): Draft {
  const days = daysIn(t)
  const test = /\b(test|sandbox)\b/.test(t)
  const allow = allowFor(t, JOB_IP)
  return {
    version: seq++,
    job: 'nightly',
    name: 'Nightly reporting',
    env: test ? 'test' : 'live',
    read: resourceIds.filter((r) => reportingUse[r] > 0),
    write: [],
    days: days === undefined ? 365 : days,
    allow: allow.allow,
    inferred: { read: true, write: false, env: !test, expires: days === undefined, allow: allow.inferred },
    hints: {
      read: 'What the job read in 30 days',
      write: /read[- ]?only|hanya baca|baca saja/.test(t) ? 'You asked for read only' : 'The job wrote nothing in 30 days',
      env: test ? 'You asked for test' : 'The job reads real settlements',
      expires: expiryHint(days),
      allow: allow.hint || 'The only address the job used',
    },
    changed: {},
    use: reportingUse,
    useLabel: 'Requests by Reporting export',
  }
}

function webhookDraft(t: string): Draft {
  const days = daysIn(t)
  const allow = allowFor(t, WEBHOOK.ip)
  return {
    version: seq++,
    job: 'webhook',
    name: 'Payment webhooks',
    env: 'live',
    read: ['payments', 'refunds'],
    write: [],
    days: days === undefined ? 365 : days,
    allow: allow.allow,
    inferred: { read: true, write: true, env: true, expires: days === undefined, allow: allow.inferred },
    hints: {
      read: 'What your endpoint’s events name',
      write: 'Your endpoint only reads',
      env: 'Your endpoint is on the live account',
      expires: expiryHint(days),
      allow: allow.hint || 'Where your endpoint calls from',
    },
    changed: {},
    use: webhookUse,
    useLabel: 'Events to your endpoint',
  }
}

export function draftRows(d: Draft): CheckRow[] {
  const mark = (f: Field) => d.inferred[f] || d.touched === f
  return [
    { label: 'Read', value: listOf(d.read), inferred: mark('read'), hint: d.hints.read },
    { label: 'Write', value: listOf(d.write), inferred: mark('write'), hint: d.hints.write },
    { label: 'Environment', value: d.env === 'live' ? 'Live' : 'Test', inferred: mark('env'), hint: d.hints.env },
    { label: 'Expires', value: d.days === null ? 'Never' : dateIn(d.days), inferred: mark('expires'), hint: d.hints.expires },
    { label: 'Allowed from', value: d.allow ? d.allow.join(', ') : 'Any address', mono: !!d.allow, inferred: mark('allow'), hint: d.hints.allow },
  ]
}

function draftCard(d: Draft): CardData {
  return { kind: 'check', ref: `draft:${d.version}`, eyebrow: `New ${d.env} key`, title: d.name, rows: draftRows(d) }
}

/** The terms in one line, for a panel head or a status row. */
export function draftTerms(d: Draft): string {
  const access = d.write.length ? 'read and write' : 'read only'
  const from = d.allow ? d.allow.join(', ') : 'any address'
  const until = d.days === null ? 'no expiry' : `until ${dateIn(d.days)}`
  return `${cap(d.env)} · ${access} · ${from} · ${until}`
}

/* ── The desk ──────────────────────────────────────────────────────────────────────── */

const OPENING = 'A read-only key for the nightly reporting job, expires in 90 days'
const OPENING_REPLY =
  'Reporting export runs that job today and can read all seven resources. In 30 days it read four, so the new key gets those four and nothing else, from the one address the job runs on.'

export function useKeysDesk() {
  const keys = ref<DeskKey[]>(startKeys())
  const draft = ref<Draft | null>(nightlyDraft(norm(OPENING)))
  const rotation = ref<Rotation | null>(null)
  const revocation = ref<Revocation | null>(null)
  const secrets = ref<Secret[]>([])
  /** The key the conversation is about: marked in the State list. */
  const focusId = ref<string | null>('k5')
  /** A resource the conversation just asked about: marked in the scope ladder. */
  const asked = ref<ResourceId | null>(null)
  const outcomes = reactive<Record<string, Outcome>>({})
  const trail = ref<TrailItem[]>([
    {
      id: 't3',
      at: SCENE.start,
      who: AGENT,
      text: 'Read 30 days of requests by Reporting export',
      detail: `rk_live_Lp4x · ${fmt(sum(Object.values(reportingUse)))} requests · 4 of 7 resources`,
    },
    {
      id: 't2',
      at: '06:52',
      who: AGENT,
      text: 'Posted in #payments-oncall: 203.0.113.19 still uses the old checkout secret',
      detail: 'rk_live_2Xa8 · last request 06:47 WIB',
    },
    {
      id: 't1',
      at: '05:47',
      who: 'Wulan Sari',
      text: 'Set Checkout server · old to stop working in 24 h',
      detail: 'rk_live_2Xa8 · stops 4 Nov 05:47 WIB',
      canRevert: true,
    },
  ])

  /** The decision asked about last: what a plain "yes" or "cancel" applies to. */
  let lastAsked: 'create' | 'rotate' | 'revoke' | null = 'create'
  let secretSeed = 2611
  let keySeq = 9
  let trailSeq = 4
  let snippetShown = false
  const history: Undo[] = []
  const reverts = new Map<string, () => DeskReply>()

  const keyById = (id: string | null | undefined) => keys.value.find((k) => k.id === id)
  const patch = (id: string, changes: Partial<DeskKey>) => {
    keys.value = keys.value.map((k) => (k.id === id ? { ...k, ...changes } : k))
  }
  const nightlyKey = () => keys.value.find((k) => k.name === 'Nightly reporting' && k.state !== 'revoked')
  const madeKey = (name: string) => keys.value.find((k) => k.name === name && k.state !== 'revoked')

  /** Which key each revertible line acts on: a revoke retires the reverts that would revive it. */
  const revertKey = new Map<string, string>([['t1', 'k6']])

  function addTrail(item: Omit<TrailItem, 'id'>, revert?: () => DeskReply, keyId?: string): string {
    const id = `t${trailSeq++}`
    trail.value = [{ ...item, id }, ...trail.value]
    if (revert) {
      reverts.set(id, revert)
      history.push({ kind: 'trail', id })
      if (keyId) revertKey.set(id, keyId)
    }
    return id
  }

  function retireReverts(keyId: string) {
    const ids = [...revertKey].filter(([, k]) => k === keyId).map(([id]) => id)
    for (const id of ids) {
      reverts.delete(id)
      revertKey.delete(id)
      const h = history.findIndex((u) => u.kind === 'trail' && u.id === id)
      if (h >= 0) history.splice(h, 1)
    }
    trail.value = trail.value.map((i) => (ids.includes(i.id) && !i.revertedAt ? { ...i, canRevert: false } : i))
  }

  /* Wulan's change at 05:47 can be reverted like any other line. */
  reverts.set('t1', () => {
    patch('k6', { state: 'active', expires: null, flag: undefined })
    focusId.value = 'k6'
    return { text: 'Checkout server · old keeps working with no end date. 203.0.113.19 still uses it; say “revoke the old checkout key” once it has moved.' }
  })

  /* ── Decisions ──────────────────────────────────────────────────────────────────── */

  const waiting = computed(() => secrets.value.length + (draft.value ? 1 : 0) + (rotation.value ? 1 : 0) + (revocation.value ? 1 : 0))

  /** The one decision whose commit is the brand button: the first in the Needs you column. */
  const primary = computed(() => {
    if (secrets.value[0]) return `secret:${secrets.value[0].id}`
    if (draft.value) return 'create'
    if (rotation.value) return 'rotate'
    return null
  })

  /** A thread card's line under its rows: waiting, then what became of it. */
  function cardState(refKey?: string): Outcome | undefined {
    if (!refKey) return undefined
    const done = outcomes[refKey]
    if (done) return done
    const [kind, v] = refKey.split(':')
    const pending = kind === 'draft' ? draft.value?.version : kind === 'rotate' ? rotation.value?.version : revocation.value?.version
    if (pending === Number(v)) return { tone: 'neutral', label: kind === 'revoke' ? 'Waiting for your hold' : 'Waiting for you' }
    return { tone: 'neutral', label: 'Replaced' }
  }

  /* Create */
  function prepareCreate(d: Draft) {
    secretSeed += 37
    const secret = makeSecret(d.env, secretSeed)
    const scopes = resourceIds.flatMap((r) =>
      d.write.includes(r) ? [`${r}:write` as Scope] : d.read.includes(r) ? [`${r}:read` as Scope] : [],
    )
    const key: DeskKey = {
      id: `k${keySeq++}`,
      name: d.name,
      prefix: secret.slice(0, 12),
      env: d.env,
      scopes,
      created: SCENE.date,
      lastUsed: 'Never',
      lastIp: '—',
      daily: new Array(30).fill(0),
      expires: d.days === null ? null : dateIn(d.days),
      state: 'active',
      team: d.job === 'nightly' ? 'Data' : 'Payments',
      allow: d.allow ? [...d.allow] : null,
      flag: { tone: 'neutral', label: 'Not used yet' },
    }
    return { draft: d, key, secret }
  }

  function applyCreate(p: ReturnType<typeof prepareCreate>, at: string) {
    keys.value = [p.key, ...keys.value]
    draft.value = null
    asked.value = null
    secrets.value = [...secrets.value, { id: `s${p.key.id}`, keyId: p.key.id, name: p.key.name, secret: p.secret, at }]
    outcomes[`draft:${p.draft.version}`] = { tone: 'success', label: `Created · ${p.key.prefix}`, at }
    focusId.value = p.key.id
    lastAsked = null
    addTrail(
      {
        at,
        who: PERSON,
        text: `Created ${p.key.name}, a ${p.key.env} key`,
        detail: `${p.key.prefix}… · ${scopeLine(p.key.scopes)} · ${p.key.allow?.join(', ') ?? 'any address'} · ${p.key.expires ? `until ${p.key.expires}` : 'no expiry'}`,
        canRevert: true,
      },
      () => {
        // Nothing has used it: revoke it, take it off the list, put the draft back.
        keys.value = keys.value.filter((k) => k.id !== p.key.id)
        secrets.value = secrets.value.filter((s) => s.keyId !== p.key.id)
        outcomes[`draft:${p.draft.version}`] = { tone: 'neutral', label: 'Created, then reverted' }
        const back: Draft = { ...p.draft, version: seq++, touched: undefined }
        draft.value = back
        focusId.value = back.job === 'nightly' ? 'k5' : null
        lastAsked = 'create'
        return {
          text: `${p.key.name} is revoked before anything used it: ${p.key.prefix}… gets 401. The draft is back in Needs you.`,
          card: 'check',
          data: draftCard(back),
        }
      },
      p.key.id,
    )
  }

  /* Rotate */
  function prepareRotate(r: Rotation) {
    const k = keyById(r.keyId)!
    secretSeed += 37
    const secret = makeSecret(k.env, secretSeed)
    return { r, k, secret, prefix: secret.slice(0, 12) }
  }

  function applyRotate(p: ReturnType<typeof prepareRotate>, at: string) {
    const until = graceUntil(p.r.grace, at)
    const before = { prefix: p.k.prefix, flag: p.k.flag }
    patch(p.k.id, {
      prefix: p.prefix,
      flag: p.r.grace === 'now' ? { tone: 'neutral', label: 'New secret' } : { tone: 'warning', label: `Old secret stops ${until.short}` },
    })
    rotation.value = null
    secrets.value = [...secrets.value, { id: `s${p.k.id}-${p.r.version}`, keyId: p.k.id, name: p.k.name, secret: p.secret, at }]
    outcomes[`rotate:${p.r.version}`] = { tone: 'success', label: `Rotated · ${p.prefix}`, at }
    focusId.value = p.k.id
    lastAsked = null
    addTrail(
      {
        at,
        who: PERSON,
        text: `Rotated ${p.k.name}`,
        detail: `new ${p.prefix}… · old ${before.prefix}… ${p.r.grace === 'now' ? 'stopped at once' : `stops ${until.short} WIB`}`,
        canRevert: p.r.grace !== 'now',
      },
      p.r.grace === 'now'
        ? undefined
        : () => {
            patch(p.k.id, { prefix: before.prefix, flag: before.flag })
            secrets.value = secrets.value.filter((s) => s.keyId !== p.k.id)
            outcomes[`rotate:${p.r.version}`] = { tone: 'neutral', label: 'Rotated, then reverted' }
            focusId.value = p.k.id
            return { text: `${p.k.name} is back on ${before.prefix}…, with no end date. The new secret ${p.prefix}… is revoked.` }
          },
      p.k.id,
    )
    if (p.r.grace === 'now') history.push({ kind: 'final', text: `The old secret of ${p.k.name} stopped at once, so that rotation cannot be undone. Rotate again if you need another secret.` })
  }

  /* Revoke */
  function applyRevoke(keyId: string, at: string) {
    const k = keyById(keyId)!
    patch(keyId, { state: 'revoked', expires: 'Revoked', flag: { tone: 'neutral', label: `Revoked ${at}` } })
    if (revocation.value?.keyId === keyId) {
      outcomes[`revoke:${revocation.value.version}`] = { tone: 'neutral', label: 'Revoked', at }
      revocation.value = null
    }
    focusId.value = keyId
    lastAsked = null
    retireReverts(keyId)
    addTrail({ at, who: PERSON, text: `Revoked ${k.name}`, detail: `${k.prefix}… · requests now get 401 · cannot be undone` })
    history.push({ kind: 'final', text: `Revoking ${k.name} cannot be undone: requests with ${k.prefix}… get 401 for good. If you need it back, ask for a new key by what it is for.` })
  }

  /* Revoke later, once the job has moved: only the data team's key, whose job Simpul can see. */
  function applySchedule(at: string) {
    const r = revocation.value
    if (r?.keyId === 'k5') {
      outcomes[`revoke:${r.version}`] = { tone: 'warning', label: 'Scheduled · 4 Nov 10:00', at }
      revocation.value = null
    }
    patch('k5', { flag: { tone: 'warning', label: 'Revokes 4 Nov 10:00' } })
    focusId.value = 'k5'
    lastAsked = null
    addTrail(
      {
        at,
        who: AGENT,
        text: 'Will revoke Reporting export once the job runs on Nightly reporting',
        detail: 'rk_live_Lp4x · 4 Nov 10:00 WIB · only if the 01:00 and 09:45 runs used the new key',
        canRevert: true,
      },
      () => {
        patch('k5', { flag: undefined })
        focusId.value = 'k5'
        return { text: 'Reporting export stays as it is: nothing will revoke it tomorrow.' }
      },
      'k5',
    )
  }

  /** Revert a trail line, from its button or from "undo that". Returns what Simpul says. */
  function revertTrail(id: string, at: string): DeskReply | null {
    const run = reverts.get(id)
    const item = trail.value.find((i) => i.id === id)
    if (!run || !item || item.revertedAt) return null
    reverts.delete(id)
    trail.value = trail.value.map((i) => (i.id === id ? { ...i, revertedAt: at } : i))
    const h = history.findIndex((u) => u.kind === 'trail' && u.id === id)
    if (h >= 0) history.splice(h, 1)
    return run()
  }

  /* ── The conversation ───────────────────────────────────────────────────────────── */

  /** Suggestions for where the desk is now: the next thing worth saying. */
  function chipsNow(): string[] {
    const nk = nightlyKey()
    const k5 = keyById('k5')
    const k5Open = !!k5 && k5.state !== 'revoked' && !k5.flag
    if (revocation.value) {
      const forK5 = revocation.value.keyId === 'k5'
      if (forK5 && nk) return ['What breaks?', 'Revoke it after tonight’s run', 'Keep it']
      if (forK5 && draft.value) return ['What breaks?', 'Create it', 'Keep it']
      return ['What breaks?', 'Keep it']
    }
    if (rotation.value) return rotation.value.grace === '24h' ? ['Old one stops in 1 hour', 'Why 24 hours?', 'Rotate it'] : ['Rotate it', 'Cancel']
    if (draft.value) {
      const d = draft.value
      if (d.job === 'nightly') return ['Why does it need payouts?', 'Remove refunds', 'Create it']
      return d.allow && !d.allow.includes(WEBHOOK.ip) ? ['Also allow 203.0.113.24', 'Why payments?', 'Create it'] : ['Why payments?', 'Make it 30 days', 'Create it']
    }
    if (nk && !snippetShown) return ['Show it in curl', k5Open ? 'Cabut key lama tim data' : 'What’s left?', 'Undo that']
    if (k5Open) return ['Cabut key lama tim data', 'What’s left?', 'Undo that']
    if (!madeKey('Payment webhooks')) return ['Buat key untuk webhook pembayaran, hanya dari IP kantor', 'Rotate the Kopi Senja key', 'What’s left?']
    if (!trail.value.some((i) => i.text.startsWith('Rotated') && !i.revertedAt)) return ['Rotate the Kopi Senja key', 'What’s left?', 'Undo that']
    return ['What’s left?', 'Revoke the old checkout key', 'Undo that']
  }

  const now = () => desk.clock.now()

  /** How the person named a key, when it was not by its name: the hint on an inferred row. */
  function saidFor(k: DeskKey, said: string): string | undefined {
    if (said.toLowerCase().includes(k.name.toLowerCase())) return undefined
    const words = ['key lama tim data', 'tim data', 'data team', 'kopi senja', 'old checkout key', 'old checkout', 'checkout lama', 'partner', 'staging', 'mobile', 'settlement', 'checkout', 'laporan', 'reporting', 'the old one']
    const hit = words.find((w) => said.toLowerCase().includes(w))
    if (!hit) return 'The key the conversation is about'
    const at = said.toLowerCase().indexOf(hit)
    return `You said “${said.slice(at, at + hit.length)}”`
  }

  /** The key a sentence names: "tim data", "the old checkout key", "Kopi Senja", "it". */
  function keyIn(t: string): DeskKey | undefined {
    const nk = nightlyKey()
    const wk = madeKey('Payment webhooks')
    if (nk && /\bnightly\b|tiap malam/.test(t)) return nk
    if (wk && /webhook/.test(t)) return wk
    const words: [string, string][] = [
      ['k6', 'checkout[^.]*\\b(old|lama)\\b|\\b(old|lama)\\b[^.]*checkout|rk_live_2xa8'],
      ['k1', 'checkout|rk_live_7hk2'],
      ['k2', 'settlement|rk_live_qm8d'],
      ['k3', 'mobile|\\bapp\\b|aplikasi|rk_live_3fz9'],
      ['k4', 'kopi senja|kopi|senja|partner|mitra|\\bpos\\b|rk_live_vw2c'],
      ['k5', 'reporting export|tim data|data team|\\bdata\\b|reporting|report|laporan|export|ekspor|rk_live_lp4x'],
      ['k7', 'staging|rk_test_9td1'],
      ['k8', '\\bci\\b|integration|integrasi|rk_test_hy6s'],
    ]
    for (const [id, pattern] of words) if (new RegExp(pattern).test(t)) return keyById(id)
    if (/\b(it|that|this|itu|ini)\b|nya\b/.test(t)) return keyById(revocation.value?.keyId ?? rotation.value?.keyId ?? focusId.value)
    return undefined
  }

  function stopsFor(k: DeskKey): string {
    if (k.id === 'k5') return nightlyKey() ? 'Tonight’s 01:00 export and the 09:45 re-run, until they use Nightly reporting.' : whatStops.k5
    if (k.lastUsed === 'Never') return 'Nothing yet: no request has used it.'
    return whatStops[k.id] ?? 'Whatever sends it.'
  }

  function usedLine(k: DeskKey): string {
    if (k.lastUsed === 'Never') return `${k.name} has not been used yet.`
    const today = k.daily[k.daily.length - 1] ?? 0
    return `It sent ${fmt(today)} requests today, the last at ${lastAt[k.id] ?? k.lastUsed} WIB from ${k.lastIp}.`
  }

  function revokeCard(k: DeskKey, version: number, words: string): CardData {
    const said = saidFor(k, words)
    const today = k.daily[k.daily.length - 1] ?? 0
    return {
      kind: 'check',
      ref: `revoke:${version}`,
      eyebrow: `Revoke a ${k.env} key`,
      title: k.name,
      rows: [
        { label: 'Key', value: `${k.prefix}… · ${k.team} team`, inferred: !!said, hint: said },
        { label: 'Can', value: scopeBadges(k.scopes).join(', '), mono: true },
        { label: 'Last used', value: k.lastUsed === 'Never' ? 'Never' : `${lastAt[k.id] ?? k.lastUsed} WIB today · ${k.lastIp}` },
        { label: 'Requests', value: `${fmt(today)} today · ${fmt(sum(k.daily))} in 30 days` },
        { label: 'Stops', value: stopsFor(k) },
      ],
    }
  }

  function rotateCard(k: DeskKey, r: Rotation, words: string): CardData {
    const said = saidFor(k, words)
    return {
      kind: 'check',
      ref: `rotate:${r.version}`,
      eyebrow: `Rotate a ${k.env} key`,
      title: k.name,
      rows: [
        { label: 'Key', value: `${k.prefix}… · ${k.team === 'Partners' ? 'Kopi Senja' : `${k.team} team`}`, inferred: !!said, hint: said },
        { label: 'Keeps', value: scopeBadges(k.scopes).join(', '), mono: true },
        {
          label: 'Old secret stops',
          value: graceAfter(r.grace),
          inferred: r.grace === '24h',
          hint: r.grace === '24h' ? 'In use every few minutes: a day to switch' : r.grace === '1h' ? 'One hour, as you said' : 'At once, as you said',
        },
        { label: 'New secret', value: 'Shown once, in Needs you' },
      ],
    }
  }

  function evidenceCard(d: Draft, r: ResourceId): CardData {
    const calls = reportingCalls[r]
    const rows: CheckRow[] = [{ label: 'Requests', value: `${fmt(d.use[r])} in 30 days` }]
    if (calls) rows.unshift({ label: 'Calls', value: calls.calls, mono: true })
    if (calls) rows.push({ label: 'Last read', value: calls.last }, { label: 'From', value: JOB_IP, mono: true })
    return { kind: 'check', eyebrow: 'What it rests on', title: `${resourceLabel[r]} · read`, rows }
  }

  /** What an undo put back on the draft, in one sentence. */
  function undoneText(current: Draft | null, back: Draft): string {
    if (!current || current.job !== back.job) return `${back.name} is back in Needs you, as it was.`
    if (current.name !== back.name) return `Named ${back.name} again.`
    if (current.env !== back.env) return `A ${back.env} key again.`
    if ((current.allow ?? []).join() !== (back.allow ?? []).join()) return `Allowed from ${back.allow?.join(', ') ?? 'any address'} again.`
    if (current.days !== back.days) return back.days === null ? 'No expiry again.' : `It stops on ${dateIn(back.days)} again.`
    if (current.write.join() !== back.write.join()) return `Write is back to ${listOf(back.write).toLowerCase()}.`
    return `It reads ${listOf(back.read).toLowerCase()} again.`
  }

  /** The reply to a change of the draft: the new check, with the change marked. */
  function change(before: Draft, next: Draft, effect: string): DeskReply {
    return {
      text: effect,
      card: 'check',
      data: draftCard(next),
      after: () => {
        history.push({ kind: 'draft', before })
        draft.value = next
        asked.value = null
        lastAsked = 'create'
      },
      chips: next.job === 'nightly' ? ['Undo that', 'Why does it need payouts?', 'Create it'] : ['Undo that', 'Why payments?', 'Create it'],
    }
  }

  function noDraft(): DeskReply {
    return {
      text: 'No key is waiting. The scopes of a key that exists do not change: I can make a new key with the scopes you want and retire the old one. Ask for it by what it is for.',
      chips: ['A read-only key for the nightly reporting job', 'What’s left?'],
    }
  }

  function commitCreate(): DeskReply {
    const d = draft.value!
    const p = prepareCreate(d)
    return {
      text: `Created ${p.key.name}. Copy its secret from Needs you now: it is shown once, and 21 Strive keeps only a hash and the first 12 characters, ${p.key.prefix}.${d.job === 'nightly' ? ' Once the job runs on it, Reporting export can go.' : ''}`,
      after: () => applyCreate(p, now()),
    }
  }

  function commitRotate(): DeskReply {
    const r = rotation.value!
    const p = prepareRotate(r)
    return {
      text: `Rotated ${p.k.name}: the new secret is shown once in Needs you. ${r.grace === 'now' ? 'The old one has stopped.' : `The old one stops ${graceUntil(r.grace, addMinutes(now(), 1)).long}.`}`,
      after: () => applyRotate(p, now()),
    }
  }

  function askForHand(k: DeskKey): DeskReply {
    return {
      text: `Revoking cannot be undone, so it takes your hand: hold Revoke in Needs you, or type its name, “revoke ${k.name}”.`,
      after: () => {
        if (revocation.value) revocation.value = { ...revocation.value, called: true }
      },
    }
  }

  /** Why, with what each answer rests on. */
  function explain(t: string): DeskReply {
    const d = draft.value
    const rot = rotation.value
    if (rot && /24|hours?|jam|grace|day|hari/.test(t)) {
      const rk = keyById(rot.keyId)!
      return {
        text: `${rk.name} is used every few minutes from ${rk.lastIp}. A day gives whoever holds the secret time to put in the new one without a failed request. Say “old one stops in 1 hour” to make it shorter.`,
      }
    }
    const k5 = keyById('k5')
    if (k5?.state !== 'revoked' && /reporting export|\bexport\b|tim data|data team|lp4x/.test(t) && /everything|semua|\ball\b|seven|tujuh|broad|customers?|webhooks?|disputes?/.test(t)) {
      return { text: 'Reporting export was made on 9 Jan 2026 with read on everything. In 30 days it never read customers, webhooks or disputes; Nightly reporting leaves them out.' }
    }
    if (rot && !d) {
      const rk = keyById(rot.keyId)!
      return {
        text: `${rk.name} gets a new secret with the same scopes, ${scopeBadges(rk.scopes).join(', ')}. The old one stops ${low(graceAfter(rot.grace))}${rot.grace === '24h' ? ': it is used every few minutes, and a day lets whoever holds it switch' : ', as you asked'}.`,
      }
    }
    if (!d) {
      if (revocation.value) {
        const rk = keyById(revocation.value.keyId)!
        return { text: `Revoking cannot be undone: every request with ${rk.prefix}… gets 401 from that moment. That is why it takes a hold, not a click.` }
      }
      return { text: 'Ask about a key or a scope, for example “why does Reporting export read everything?”.' }
    }
    if (/\b(write|tulis)\b/.test(t)) {
      if (d.write.length) return { text: `Write on ${listOf(d.write).toLowerCase()} is there because you added it. The job wrote nothing in 30 days.` }
      return {
        text:
          d.job === 'nightly'
            ? `It does not need write, so it has none. You asked for read only, and Reporting export wrote nothing in 30 days: all ${fmt(sum(Object.values(reportingUse)))} of its requests were reads.`
            : 'It does not need write, so it has none: your endpoint only reads the payment or refund each event names.',
      }
    }
    const res = resourcesIn(t)
    if (res.length) {
      const r = res[0]
      const on = d.read.includes(r) || d.write.includes(r)
      const used = d.use[r] ?? 0
      const evidence = on && used > 0 && d.job === 'nightly'
      return {
        text: whyScope(d, r, on, used),
        card: evidence ? 'check' : undefined,
        data: evidence ? evidenceCard(d, r) : undefined,
        after: () => {
          asked.value = r
          if (d.job === 'nightly') focusId.value = 'k5'
        },
        chips:
          d.job === 'nightly'
            ? [r === 'refunds' ? 'Remove refunds' : r === 'customers' ? 'Why only from 192.0.2.18?' : 'Why no customers?', r === 'customers' ? 'Remove refunds' : 'Why only from 192.0.2.18?', 'Create it']
            : ['Why no write?', 'Create it'],
      }
    }
    if (/\b(live|production|produksi|test)\b/.test(t)) {
      if (d.env === 'test') return { text: 'It is a test key because you asked for one. The report itself needs live: the test account has none of Lintang’s sales.' }
      return { text: d.job === 'nightly' ? 'The report reads real settlements, and the test account has none of Lintang’s sales.' : 'Your endpoint is on the live account; test events go to a different address.' }
    }
    if (/\b(ip|address|alamat|from|dari|192|203|office|kantor)\b/.test(t)) {
      if (d.allow?.includes(JOB_IP)) return { text: `Every request Reporting export made in 30 days came from ${JOB_IP}, the data team’s server. A copy of the secret used anywhere else gets 403.` }
      if (d.allow?.includes(OFFICE.cidr))
        return { text: `You said office only: ${OFFICE.cidr} is ${OFFICE.name}, saved on the account.${d.job === 'webhook' && !d.allow.includes(WEBHOOK.ip) ? ` Your endpoint calls from ${WEBHOOK.ip}, which is outside it.` : ''}` }
      return { text: d.allow ? `You set it to ${d.allow.join(', ')}.` : 'You asked for any address.' }
    }
    if (/expir|90|days?|hari|year|tahun|berlaku/.test(t)) {
      return {
        text: d.inferred.expires
          ? `You did not say. Lintang’s live keys made this year run for a year, so this one stops on ${dateIn(d.days ?? 365)}.`
          : d.days === null
            ? 'You asked for no expiry.'
            : `You said ${d.days} days, so it stops on ${dateIn(d.days)}.`,
      }
    }
    return {
      text:
        d.job === 'nightly'
          ? 'Each scope is on because the job used it in the last 30 days, and nothing else is. Ask about one, like “why payouts?”.'
          : 'Each scope is on because an event your endpoint takes names it. Ask about one, like “why payments?”.',
    }
  }

  function whyScope(d: Draft, r: ResourceId, on: boolean, used: number): string {
    const label = resourceLabel[r]
    const lower = label.toLowerCase()
    if (d.job === 'webhook') {
      if (r === 'payments' && on) return `Your endpoint gets payment.succeeded and payment.failed: ${fmt(used)} events in 30 days. It reads the payment each one names before it marks an order paid.`
      if (r === 'refunds' && on) return `It gets refund.succeeded, ${fmt(used)} events in 30 days, and reads the refund before it updates the order.`
      return on ? `${label} is on because you added it.` : `None of the events your endpoint takes name ${lower}, so the key does not get it.`
    }
    const calls = reportingCalls[r]
    if (on && used > 0 && calls) return `${calls.why} That is ${fmt(used)} requests in 30 days, all from ${JOB_IP}.`
    if (on) return `${label} is on because you added it. The export never read it in 30 days.`
    if (used > 0) return `You took it off. The export read ${lower} ${fmt(used)} times in 30 days, so tonight’s ${lower} sheet will get 403.`
    return `The export never read ${lower} in 30 days, so the key does not get it.${r === 'customers' ? ' Customers holds names, emails and phone numbers: a reporting key is better without them.' : ''}`
  }

  /* Each turn: a pattern over the normalised sentence, and an answer. An answer of null passes
     the sentence on, so a word means what its context says ("stops" with a rotation waiting). */
  interface Turn {
    match: string
    reply: (t: string, said: string) => DeskReply | null
  }

  const turns: Turn[] = [
    /* Undo: the last change to the draft, or the last action that can still be reverted. */
    {
      match: '\\b(undo|revert|urungkan|kembalikan|batalkan)\\b',
      reply: () => {
        const last = history.pop()
        if (!last) return { text: 'Nothing to undo yet. A revoke cannot be undone; anything else is in Done by Simpul with a Revert.' }
        if (last.kind === 'final') return { text: last.text }
        if (last.kind === 'draft') {
          const back: Draft = { ...last.before, version: seq++ }
          return {
            text: undoneText(draft.value, back),
            card: 'check',
            data: draftCard(back),
            after: () => {
              draft.value = back
              asked.value = null
              lastAsked = 'create'
            },
          }
        }
        const item = trail.value.find((i) => i.id === last.id)
        if (!item || !reverts.has(last.id)) return { text: 'That can no longer be reverted.' }
        // The revert happens as the reply lands; Simpul then says what it changed.
        return {
          after: () => {
            const r = revertTrail(last.id, addMinutes(now(), 1))
            if (r) desk.say({ ...r, chips: chipsNow() })
          },
        }
      },
    },

    /* Cancel what was asked last, or keep a key that was about to be revoked. */
    {
      match: '\\b(cancel|batal|gak jadi|ga jadi|nggak jadi|ngga jadi|tidak jadi|never ?mind|forget it|lupakan|keep it|keep the key|biarkan)\\b|^(no|nope|tidak|nggak|enggak)$',
      reply: () => {
        const pending = { revoke: revocation.value, rotate: rotation.value, create: draft.value }
        const which = ([lastAsked, 'revoke', 'rotate', 'create'] as const).find((w) => w && pending[w])
        const at = () => now()
        if (which === 'revoke' && revocation.value) {
          const r = revocation.value
          return {
            text: `Kept. ${keyById(r.keyId)?.name ?? 'The key'} stays as it is.`,
            after: () => {
              outcomes[`revoke:${r.version}`] = { tone: 'neutral', label: 'Kept', at: at() }
              revocation.value = null
              lastAsked = null
            },
          }
        }
        if (which === 'rotate' && rotation.value) {
          const r = rotation.value
          return {
            text: `Cancelled. ${keyById(r.keyId)?.name ?? 'The key'} keeps its secret.`,
            after: () => {
              outcomes[`rotate:${r.version}`] = { tone: 'neutral', label: 'Cancelled', at: at() }
              rotation.value = null
              lastAsked = null
            },
          }
        }
        if (which === 'create' && draft.value) {
          const d = draft.value
          return {
            text: `Cancelled. No key was made${d.job === 'nightly' ? '; Reporting export still runs the job' : ''}.`,
            after: () => {
              outcomes[`draft:${d.version}`] = { tone: 'neutral', label: 'Cancelled', at: at() }
              draft.value = null
              asked.value = null
              lastAsked = null
            },
          }
        }
        return { text: 'Nothing is waiting, so there is nothing to cancel.' }
      },
    },

    /* Why: each answer comes with what it rests on. */
    { match: '\\b(why|kenapa|mengapa|knp|buat apa|untuk apa|alasan|how come)\\b', reply: (t) => explain(t) },

    /* Retire the data team's key once the job has moved: a revoke that waits for proof. */
    {
      match: '\\b(after|setelah|sesudah|once|begitu|habis)\\b.*(tonight|\\brun|export|ekspor|malam|jalan|job|01:00|besok|moved|pindah)',
      reply: (t) => {
        const about = revocation.value?.keyId ?? (hits('revoke|cabut|retire|matikan', t) ? keyIn(t)?.id : undefined)
        if (!about) return null
        if (about !== 'k5') {
          return about === 'k6'
            ? { text: 'Checkout server · old already stops at 05:47 tomorrow, as Wulan Sari set it. Hold Revoke in Needs you to stop it now, or keep it.' }
            : { text: 'I can wait for a job I can see in the requests, like the nightly export. For this key, hold Revoke in Needs you now, or keep it.' }
        }
        if (!nightlyKey()) {
          return {
            text: 'Nightly reporting is not created yet, so the job has nothing to move to. Create it first; then I can retire Reporting export once the job runs on it.',
            chips: ['Create it', 'Keep it'],
          }
        }
        return {
          text: 'Set for 4 Nov 10:00 WIB, after the 01:00 export and the 09:45 re-run. I revoke Reporting export only if both ran on Nightly reporting; if either still used the old key, I stop and ask you.',
          after: () => applySchedule(now()),
        }
      },
    },

    /* Revoke in a word: show what stops, then ask for a hold (or the key's name, typed). */
    {
      match: '\\b(revoke|cabut|retire|matikan|nonaktifkan|disable)\\b|\\b(hapus|delete|remove|buang)\\b[^.]*\\b(key|kunci)\\b',
      reply: (t, said) => {
        const k = keyIn(t)
        if (!k) return { text: 'Which key? For example “revoke Staging” or “cabut key lama tim data”.', chips: ['Cabut key lama tim data', 'Revoke the old checkout key'] }
        if (k.state === 'revoked') return { text: `${k.name} is already revoked: requests with ${k.prefix}… get 401.` }
        if (k.id === 'k5' && k.flag?.label.startsWith('Revokes'))
          return { text: 'Reporting export is already set to be revoked at 4 Nov 10:00 WIB, once the job has moved. Say “undo that” to keep it.' }
        const pending = revocation.value?.keyId === k.id
        if (pending && t.includes(k.name.toLowerCase())) {
          return { text: `Revoked. Requests with ${k.prefix}… now get 401.`, after: () => applyRevoke(k.id, now()) }
        }
        if (pending) return askForHand(k)
        const version = seq++
        const lead =
          k.id === 'k5'
            ? `Reporting export is the data team’s key: read on all seven resources, ${fmt(sum(k.daily))} requests in 30 days.`
            : `${k.name} is ${k.team === 'Partners' ? 'Kopi Senja’s' : `the ${k.team.toLowerCase()} team’s`} ${k.env} key.`
        return {
          text: `${lead} ${usedLine(k)} Revoking it stops ${low(stopsFor(k))}`,
          card: 'check',
          data: revokeCard(k, version, said),
          after: () => {
            if (revocation.value) outcomes[`revoke:${revocation.value.version}`] = { tone: 'neutral', label: 'Replaced' }
            revocation.value = { version, keyId: k.id, called: false }
            focusId.value = k.id
            asked.value = null
            lastAsked = 'revoke'
          },
        }
      },
    },

    /* Rotate: a new secret, the same scopes, the old one stops after a grace. */
    {
      match: '\\b(rotate|rotasi|roll|regenerate|putar)\\b|ganti (secret|kunci|key)|new secret|secret baru',
      reply: (t, said) => {
        if (rotation.value && /^(rotate|rotasi|roll|putar)( it| sekarang| now| aja)?$/.test(t)) return commitRotate()
        const k = keyIn(t)
        if (!k) return { text: 'Which key? For example “rotate the Kopi Senja key”.', chips: ['Rotate the Kopi Senja key', 'Rotate Staging'] }
        if (k.state === 'revoked') return { text: `${k.name} is revoked; there is nothing to rotate. Ask for a new key by what it is for.` }
        const grace: Grace = /\b(now|sekarang|langsung|immediately|right away)\b/.test(t) ? 'now' : /\b(1 ?h|1 hour|an hour|1 jam|sejam)\b/.test(t) ? '1h' : '24h'
        const r: Rotation = { version: seq++, keyId: k.id, grace }
        const used = k.lastUsed === 'Never' ? `${k.name} has not been used yet.` : `${k.name} was used at ${lastAt[k.id] ?? k.lastUsed} WIB from ${k.lastIp}.`
        const keeps =
          grace === '24h'
            ? 'keeps working for 24 hours, so whoever holds it can switch without a failed request'
            : grace === '1h'
              ? 'keeps working for one hour'
              : 'stops the moment you rotate'
        return {
          text: `${used} A new secret keeps ${scopeBadges(k.scopes).join(', ')}; the old one ${keeps}.`,
          card: 'check',
          data: rotateCard(k, r, said),
          after: () => {
            if (rotation.value) outcomes[`rotate:${rotation.value.version}`] = { tone: 'neutral', label: 'Replaced' }
            rotation.value = r
            focusId.value = k.id
            lastAsked = 'rotate'
          },
        }
      },
    },

    /* What breaks, who uses a key. */
    {
      match: 'what (breaks|stops|happens)|\\bbreaks?\\b|rusak|putus|dampak|impact|who (uses|is using)|what uses|siapa (yang )?(pakai|memakai|menggunakan)|dipakai|last used|terakhir',
      reply: (t) => {
        if (rotation.value && !revocation.value && !keyIn(t)) {
          const rk = keyById(rotation.value.keyId)!
          return { text: `Nothing, if whoever holds ${rk.prefix}… puts in the new secret before the old one stops. After that, ${low(stopsFor(rk))}` }
        }
        const k = keyIn(t) ?? keyById(revocation.value?.keyId) ?? keyById(focusId.value)
        if (!k) return { text: 'Which key? For example “who uses Checkout server?”.' }
        if (k.id === 'k5' && k.state !== 'revoked' && /break|stop|happen|rusak|putus|dampak|impact/.test(t)) {
          const nk = nightlyKey()
          return {
            text: nk
              ? `Revoked now, tonight’s 01:00 export gets 401 on its first request, and so does the 09:45 re-run. Nightly reporting is ready but nothing has used it yet: switch the job first, or say “revoke it after tonight’s run”.`
              : 'Revoked now, tonight’s 01:00 export gets 401 on its first request, and so does the 09:45 re-run, with no key to move to.',
            after: () => (focusId.value = k.id),
          }
        }
        const total = sum(k.daily)
        const used = k.lastUsed === 'Never' ? `${k.name} has not been used yet.` : `${k.name} sent ${fmt(k.daily[29] ?? 0)} requests today and ${fmt(total)} in 30 days, the last at ${lastAt[k.id] ?? k.lastUsed} WIB from ${k.lastIp}.`
        return { text: `${used} Revoking it stops ${low(stopsFor(k))}`, after: () => (focusId.value = k.id) }
      },
    },

    /* The grace of a rotation waiting for a press. */
    {
      match: TIME_WORDS.source,
      reply: (t, said) => {
        const r = rotation.value
        if (!r) return null
        const grace: Grace = /\b(now|sekarang|langsung|immediately|right away|at once)\b/.test(t) ? 'now' : /\b(1 ?h|an? hour|1 hour|1 jam|sejam)\b/.test(t) ? '1h' : '24h'
        const k = keyById(r.keyId)!
        const next: Rotation = { ...r, version: seq++, grace }
        return {
          text:
            grace === 'now'
              ? `The old secret stops the moment you rotate. Anything still sending ${k.prefix}… gets 401 from then.`
              : `The old secret now stops ${grace === '1h' ? 'an hour' : 'a day'} after you rotate.`,
          card: 'check',
          data: rotateCard(k, next, said),
          after: () => {
            outcomes[`rotate:${r.version}`] = { tone: 'neutral', label: 'Replaced' }
            rotation.value = next
            lastAsked = 'rotate'
          },
        }
      },
    },

    /* What is left. */
    {
      match: "what'?s left|what is left|\\bleft\\b|what needs me|anything else|apa lagi|\\bsisa|status|ringkas|summary|overview|what'?s open",
      reply: () => {
        const rows: CheckRow[] = []
        for (const s of secrets.value) rows.push({ label: 'Secret to copy', value: s.name, hint: 'Shown once, in Needs you' })
        if (draft.value) rows.push({ label: 'To create', value: draft.value.name, hint: draftTerms(draft.value) })
        if (rotation.value) rows.push({ label: 'To rotate', value: keyById(rotation.value.keyId)?.name ?? '', hint: 'Press Rotate key in Needs you' })
        if (revocation.value) rows.push({ label: 'To revoke', value: keyById(revocation.value.keyId)?.name ?? '', hint: 'Hold Revoke in Needs you' })
        const n = rows.length
        const k5 = keyById('k5')
        if (k5 && k5.state !== 'revoked' && !k5.flag) rows.push({ label: 'Broad key', value: 'Reporting export', hint: 'Reads all seven resources; the job uses four', inferred: true })
        if (k5?.flag?.label.startsWith('Revokes')) rows.push({ label: 'Scheduled', value: 'Reporting export, 4 Nov 10:00 WIB', hint: 'Only if the job ran on Nightly reporting' })
        const k6 = keyById('k6')
        if (k6?.state === 'expiring') rows.push({ label: 'Stops in 18 h', value: 'Checkout server · old', hint: '203.0.113.19 still used it at 06:47 WIB', inferred: true })
        const extra = rows.length - n
        const word = (x: number) => ['no', 'one', 'two', 'three', 'four', 'five', 'six'][x] ?? String(x)
        const more = extra === 1 ? 'one more is worth knowing' : `${word(extra)} more are worth knowing`
        const text = n
          ? `${cap(word(n))} ${n === 1 ? 'thing waits' : 'things wait'} for you${extra ? `; ${more}` : ''}.`
          : extra
            ? `Nothing waits for you; ${extra === 1 ? 'one thing is' : `${word(extra)} things are`} worth knowing.`
            : 'Nothing waits for you, and no key needs a look.'
        return {
          text,
          card: rows.length ? 'check' : undefined,
          data: rows.length ? ({ kind: 'check', eyebrow: `Open at ${addMinutes(now(), 1)} WIB`, title: 'What’s left', rows } satisfies CardData) : undefined,
        }
      },
    },

    /* A new key, asked for by what it is for. */
    {
      match: '\\b(key|kunci)\\b',
      reply: (t) => {
        const nightly = /report|laporan|nightly|tiap malam|\bmalam|reconcil|rekonsiliasi/.test(t)
        const webhook = /webhook/.test(t)
        if (!nightly && !webhook) {
          if (!/\b(for|untuk|bagi)\b/.test(t)) return null
          return {
            text: 'I do not see that job in your requests yet, so I cannot tell what it needs. Say what it reads or writes, or name a job I can see, like “a read-only key for the nightly reporting job”.',
            chips: ['A read-only key for the nightly reporting job', 'Buat key untuk webhook pembayaran, hanya dari IP kantor'],
          }
        }
        const exists = webhook ? madeKey('Payment webhooks') : nightlyKey()
        if (exists) return { text: `${exists.name} exists already: ${exists.prefix}…, made today. Rotate it if the secret is lost, or ask for another key by what it is for.` }
        const d = webhook ? webhookDraft(t) : nightlyDraft(t)
        const replaced = draft.value && draft.value.job !== d.job ? ` This replaces the ${draft.value.name.toLowerCase()} draft, which was not created.` : ''
        const outside = d.allow && !d.allow.includes(WEBHOOK.ip)
        const text = webhook
          ? `Your endpoint at ${WEBHOOK.url} takes ${WEBHOOK.events}, and reads the payment or refund each event names before it acts. So: read on payments and refunds, nothing else.${outside ? ` One thing: it calls the API from ${WEBHOOK.ip}, outside the office network, so with office only those calls get 403.` : ''}${replaced}`
          : `${OPENING_REPLY}${replaced}`
        const old = draft.value
        return {
          text,
          card: 'check',
          data: draftCard(d),
          after: () => {
            if (old && old.job !== d.job) {
              outcomes[`draft:${old.version}`] = { tone: 'neutral', label: 'Set aside' }
              history.push({ kind: 'draft', before: old })
            }
            draft.value = d
            asked.value = null
            focusId.value = webhook ? null : 'k5'
            lastAsked = 'create'
          },
        }
      },
    },

    /* Take a scope off the draft. */
    {
      match: '\\b(remove|drop|without|tanpa|hapus|buang|minus|exclude|take off|lepas|no)\\b',
      reply: (t) => {
        const res = resourcesIn(t)
        const writeOnly = /\b(write|tulis)\b/.test(t)
        if (!res.length && !writeOnly) return null
        const d = draft.value
        if (!d) return noDraft()
        if (writeOnly && !res.length) {
          if (!d.write.length) return { text: 'It already reads only: there is no write on it.' }
          return change(d, { ...d, version: seq++, write: [], touched: 'write', hints: { ...d.hints, write: 'You asked for read only' } }, 'Write is off: the key reads only.')
        }
        const r = res[0]
        const on = d.read.includes(r) || d.write.includes(r)
        if (!on && !writeOnly) return { text: `It does not read ${resourceLabel[r].toLowerCase()}, so nothing changes.` }
        const changed = { ...d.changed }
        if (!writeOnly) for (const x of res) changed[x] = d.use[x] > 0 ? 'removed' : undefined
        const next: Draft = {
          ...d,
          version: seq++,
          read: writeOnly ? d.read : d.read.filter((x) => !res.includes(x)),
          write: d.write.filter((x) => !res.includes(x)),
          changed,
          touched: writeOnly ? 'write' : 'read',
          hints: { ...d.hints, [writeOnly ? 'write' : 'read']: `${listOf(res)} taken off by you` },
        }
        const used = d.use[r] ?? 0
        const effect = writeOnly
          ? `${listOf(res)} is read only now.`
          : used > 0
            ? `Read on ${resourceLabel[r].toLowerCase()} is off. ${d.job === 'nightly' ? `The export read it ${fmt(used)} times in 30 days, so tonight’s ${resourceLabel[r].toLowerCase()} sheet will get 403 and come back empty.` : `Your endpoint gets ${fmt(used)} of those events a month and will get 403 when it reads one.`}`
            : `Read on ${resourceLabel[r].toLowerCase()} is off.`
        return change(d, next, effect)
      },
    },

    /* Put a scope on the draft. */
    {
      match: '\\b(add|tambah|tambahkan|include|plus|also|juga|with|dengan|give|kasih|beri|need|needs|perlu|butuh)\\b',
      reply: (t) => {
        const res = resourcesIn(t)
        if (!res.length) return null
        const d = draft.value
        if (!d) return noDraft()
        const write = /\b(write|tulis)\b/.test(t)
        const r = res[0]
        if (!write && d.read.includes(r)) return { text: `It reads ${resourceLabel[r].toLowerCase()} already.` }
        const changed = { ...d.changed }
        for (const x of res) changed[x] = d.use[x] > 0 ? undefined : 'added'
        const next: Draft = {
          ...d,
          version: seq++,
          read: inOrder([...d.read, ...res]),
          write: write ? inOrder([...d.write, ...res]) : d.write,
          changed,
          touched: write ? 'write' : 'read',
          hints: { ...d.hints, [write ? 'write' : 'read']: `${listOf(res)} added by you` },
        }
        const effect = write
          ? `${listOf(res)} can be written now. The job wrote nothing in 30 days; with this the key could change ${resourceLabel[r].toLowerCase()}.`
          : d.use[r] > 0
            ? `Read on ${resourceLabel[r].toLowerCase()} is back.`
            : `Read on ${resourceLabel[r].toLowerCase()} is on. The job never read it in 30 days.${r === 'customers' ? ' Customers holds names, emails and phone numbers.' : ''}`
        return change(d, next, effect)
      },
    },

    /* Read only. */
    {
      match: 'read[- ]?only|hanya baca|baca saja|no write|tanpa (write|tulis)',
      reply: () => {
        const d = draft.value
        if (!d) return noDraft()
        if (!d.write.length) return { text: 'It already reads only: there is no write on it.' }
        return change(d, { ...d, version: seq++, write: [], touched: 'write', hints: { ...d.hints, write: 'You asked for read only' } }, 'Write is off: the key reads only.')
      },
    },

    /* Expiry. */
    {
      match: '\\b(expire|expires|expiry|berlaku|kedaluwarsa|kadaluarsa|valid|never)\\b|\\b\\d+\\s*(d|days?|hari|weeks?|minggu|months?|bulan|years?|tahun)\\b|setahun|sebulan|selamanya',
      reply: (t) => {
        const days = daysIn(t)
        if (days === undefined) return null
        const d = draft.value
        if (!d) return noDraft()
        const next: Draft = {
          ...d,
          version: seq++,
          days,
          touched: 'expires',
          inferred: { ...d.inferred, expires: false },
          hints: { ...d.hints, expires: days === null ? 'You asked for no expiry' : `${days} days, as you said` },
        }
        return change(d, next, days === null ? 'No expiry, then. If the secret leaks, it works until someone revokes it.' : `It stops on ${dateIn(days)}.`)
      },
    },

    /* Environment. */
    {
      match: '\\b(test|sandbox|testing|uji ?coba|live|production|produksi)\\b',
      reply: (t) => {
        const d = draft.value
        if (!d) return null
        const env: Env = /\b(test|sandbox|testing|uji ?coba)\b/.test(t) ? 'test' : 'live'
        if (env === d.env) return { text: `It is a ${env} key already.` }
        const next: Draft = { ...d, version: seq++, env, touched: 'env', inferred: { ...d.inferred, env: false }, hints: { ...d.hints, env: env === 'test' ? 'You asked for test' : 'You asked for live' } }
        return change(d, next, env === 'test' ? 'A test key, then: it reads only the test account, where the job has nothing to report.' : 'Live again: it reads real settlements.')
      },
    },

    /* Where it may be used from. */
    {
      match: '\\d{1,3}(\\.\\d{1,3}){3}|\\b(ip|office|kantor|address|alamat|anywhere)\\b',
      reply: (t) => {
        const d = draft.value
        if (!d) return null
        const ips = ipsIn(t)
        const adding = /\b(also|juga|tambah|add|plus|allow|izinkan)\b/.test(t)
        let allow: string[] | null
        let note: string
        if (ANY_IP.test(t)) {
          allow = null
          note = 'Any address, then. A copied secret would work from anywhere until it expires.'
        } else if (OFFICE_WORDS.test(t) && !ips.length) {
          allow = adding && d.allow ? [...new Set([...d.allow, OFFICE.cidr])] : [OFFICE.cidr]
          note = `Only ${OFFICE.name}, ${OFFICE.cidr}.`
        } else if (ips.length) {
          allow = adding && d.allow ? [...new Set([...d.allow, ...ips])] : ips
          note = d.job === 'webhook' && ips.includes(WEBHOOK.ip) ? `${WEBHOOK.ip} is on, so your endpoint’s calls back to the API work.` : `${ips.join(', ')} ${adding ? 'is added' : 'only'}.`
        } else return null
        const next: Draft = { ...d, version: seq++, allow, touched: 'allow', inferred: { ...d.inferred, allow: false }, hints: { ...d.hints, allow: adding ? 'Added by you' : 'As you said' } }
        return change(d, next, note)
      },
    },

    /* A name. */
    {
      match: '\\b(call it|name it|rename|namanya|namai|beri nama|kasih nama)\\b',
      reply: (_t, said) => {
        const d = draft.value
        if (!d) return noDraft()
        const m = said.match(/(?:call it|name it|rename(?: it)?(?: to)?|namanya|namai|beri nama|kasih nama)\s+(.+)$/i)
        const name = m?.[1]?.replace(/["“”'‘’.]/g, '').trim().slice(0, 40)
        if (!name) return { text: 'What should it be called? For example “call it Data export”.' }
        return change(d, { ...d, version: seq++, name: cap(name) }, `Named ${cap(name)}.`)
      },
    },

    /* A first request for this job, in the language asked for. */
    {
      match: '\\b(curl|node|nodejs|javascript|js|golang|snippet|code|kode|contoh|example|quick ?start|first request)\\b|\\b(in|pakai|dengan|with|using) go\\b|how (do i|to) use|cara pakai',
      reply: (t) => {
        const lang: Lang = /\b(node|nodejs|javascript|js)\b/.test(t) ? 'node' : /\bgolang\b|\b(in|pakai|dengan|with|using) go\b/.test(t) ? 'go' : 'curl'
        const k = nightlyKey()
        snippetShown = true
        return {
          text: `${k ? 'With STRIVE_KEY set to the Nightly reporting secret' : 'Once the key exists, with STRIVE_KEY set to its secret'}, this lists yesterday’s payments, 100 a page. A key without payments read gets 403 here.`,
          card: 'code',
          data: { kind: 'code', ...snippet(lang, k?.prefix ?? null) } satisfies CardData,
          chips: lang === 'curl' ? ['In Node', 'In Go', 'Cabut key lama tim data'] : [lang === 'node' ? 'In Go' : 'In Node', 'Cabut key lama tim data'],
        }
      },
    },

    /* Yes: commit what was asked last. */
    {
      match: '^(ok(e|ay)?|yes|ya|yep|yup|sure|go( ahead)?|gas|lanjut|setuju|sip|do it|approve|confirm|create( it| the key| key| now)?|buat( saja| aja| sekarang)?( key(nya)?)?|bikin( aja)?|make it)\\b',
      reply: () => {
        if (lastAsked === 'rotate' && rotation.value) return commitRotate()
        if (lastAsked === 'revoke' && revocation.value) return askForHand(keyById(revocation.value.keyId)!)
        if (draft.value) return commitCreate()
        if (rotation.value) return commitRotate()
        if (revocation.value) return askForHand(keyById(revocation.value.keyId)!)
        return { text: 'Nothing is waiting for a yes. Ask for a key by what it is for, or say “what’s left?”.' }
      },
    },

    {
      match: '^(hi|hello|halo|hai|hey|pagi|siang|sore|selamat (pagi|siang|sore|malam))\\b',
      reply: () => ({ text: `Hello ${PERSON.split(' ')[0]}. I can make a key for a job, change what it can do, rotate a key or revoke one. Try “what’s left?”.` }),
    },
    { match: '\\b(thanks?|thank you|makasih|terima ?kasih|thx|nuhun)\\b', reply: () => ({ text: 'You’re welcome.' }) },
    {
      match: '\\b(help|bantu|bantuan|what can you do|bisa apa)\\b',
      reply: () => ({
        text: 'Ask for a key by what it is for, and I give it the least it needs from what the job really did. I can also rotate a key, revoke one, say who uses a key, and write the first request.',
      }),
    },
  ]

  /** A reply that changes the desk without naming its chips gets the chips of where it lands. */
  function settle(r: DeskReply): DeskReply {
    if (r.chips) return r
    const after = r.after
    return {
      ...r,
      after: () => {
        after?.()
        desk.chips.value = chipsNow()
      },
    }
  }

  function respond(said: string): DeskReply {
    const t = norm(said)
    for (const turn of turns) {
      if (!new RegExp(turn.match, 'i').test(t)) continue
      const reply = turn.reply(t, said)
      if (reply) return settle(reply)
    }
    return settle({
      text: 'I can make a key for a job, change what it can do, rotate a key or revoke one. Try “remove refunds” or “cabut key lama tim data”.',
    })
  }

  const desk = useDesk({
    agent: AGENT,
    start: SCENE.start,
    opening: [
      { who: 'You', mine: true, text: OPENING },
      { who: AGENT, text: OPENING_REPLY, card: 'check', data: draftCard(draft.value!) },
    ],
    chips: chipsNow(),
    respond,
  })

  /* ── Presses on the surfaces: they write to the thread and the trail too ────────── */

  function pressCreate() {
    const d = draft.value
    if (!d || desk.writing.value) return
    const p = prepareCreate(d)
    desk.note(`You created ${p.key.name} · ${p.key.prefix}…`)
    applyCreate(p, now())
    desk.say({
      text: `Created. Copy the secret now: it is shown once, and 21 Strive keeps only a hash and the first 12 characters.${d.job === 'nightly' ? ' Once the job runs on it, Reporting export can go.' : ''}`,
      chips: chipsNow(),
    })
  }

  function pressStored(id: string) {
    const s = secrets.value.find((x) => x.id === id)
    if (!s) return
    secrets.value = secrets.value.filter((x) => x.id !== id)
    desk.note(`You stored the secret of ${s.name}`)
    desk.chips.value = chipsNow()
  }

  function pressRotate() {
    const r = rotation.value
    if (!r || desk.writing.value) return
    const p = prepareRotate(r)
    desk.note(`You rotated ${p.k.name}`)
    applyRotate(p, now())
    desk.say({ text: `Rotated. The new secret is shown once in Needs you; the old one ${r.grace === 'now' ? 'has stopped' : `stops ${graceUntil(r.grace, now()).long}`}.`, chips: chipsNow() })
  }

  function heldRevoke() {
    const r = revocation.value
    if (!r || desk.writing.value) return
    const k = keyById(r.keyId)!
    desk.note(`You revoked ${k.name} · ${k.prefix}…`)
    applyRevoke(k.id, now())
    desk.say({ text: `Revoked. Requests with ${k.prefix}… now get 401.${k.id === 'k5' && nightlyKey() ? ' Nightly reporting is the data team’s only live key now.' : ''}`, chips: chipsNow() })
  }

  function pressRevert(id: string) {
    const item = trail.value.find((i) => i.id === id)
    if (!item || desk.writing.value) return
    desk.note(`You reverted: ${low(item.text).replace(/, a (live|test) key$/, '')}`)
    const reply = revertTrail(id, now())
    if (reply) desk.say({ ...reply, chips: chipsNow() })
  }

  return {
    desk,
    keys,
    draft,
    rotation,
    revocation,
    secrets,
    trail,
    focusId,
    asked,
    waiting,
    primary,
    cardState,
    keyById,
    stopsFor,
    pressCreate,
    pressStored,
    pressRotate,
    heldRevoke,
    pressRevert,
    /** When a waiting rotation's old secret stops, counted from the press. */
    graceText: (r: Rotation) => graceAfter(r.grace),
  }
}
