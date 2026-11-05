/**
 * The changes Simpul proposes, built from the zone as it is right now: which records move, what
 * each one was and becomes, which values the conversation filled in, and the warnings that matter
 * before anyone approves. Pure functions; the desk decides when to call them.
 */
import type { CheckRow } from '../_kit/desk'
import {
  EDGE_V4,
  EDGE_V6,
  NEWMAIL,
  LB,
  SHOP,
  WEB1,
  ZONE,
  fqdn,
  later,
  proxiable,
  shape,
  short,
  spread,
  ttlLabel,
  ttlOf,
  type Change,
  type Note,
  type Op,
  type Rec,
  type Shape,
  type WatchPlan,
} from './data'

export type Style = 'address' | 'cname'

interface Ctx {
  id: string
  at: string
}

const isWeb = (r: Rec) => r.type === 'A' || r.type === 'AAAA' || r.type === 'CNAME'

/** "shop", "lintang.example and www", "api, app and www". */
export function listOf(names: string[]): string {
  const n = names.map(short)
  return n.length < 3 ? n.join(' and ') : `${n.slice(0, -1).join(', ')} and ${n[n.length - 1]}`
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`

/** "Three records", for the start of a sentence. */
export function counted(n: number, one: string, many = `${one}s`): string {
  const words = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine']
  return `${words[n] ?? n} ${n === 1 ? one : many}`
}

/** Every name that still answers with web-1's addresses. */
export function onWeb1(records: Rec[]): Rec[] {
  return records.filter((r) => r.content === WEB1.v4 || r.content === WEB1.v6)
}

/** True when a name already answers from lb-jkt-2. */
export function onLb(records: Rec[], name: string): boolean {
  const own = records.filter((r) => r.name === name && isWeb(r))
  return own.length > 0 && own.every((r) => r.content === LB.v4 || r.content === LB.v6 || r.content === LB.host)
}

/* ── Load balancer: "point shop at the new load balancer" ───────────────────────────── */

export function lbChange(records: Rec[], names: string[], style: Style, { id, at }: Ctx): Change {
  const ops: Op[] = []
  const added: string[] = []
  const moved: string[] = []
  let seq = 0
  const newId = (name: string, type: string) => `${id}-${name}-${type}-${++seq}`.toLowerCase()

  for (const name of names) {
    const apex = name === ZONE.name
    const own = records.filter((r) => r.name === name && isWeb(r))
    const a = own.find((r) => r.type === 'A')
    const aaaa = own.find((r) => r.type === 'AAAA')
    const cname = own.find((r) => r.type === 'CNAME')
    const proxied = own.length ? own.some((r) => r.proxied) : true
    ;(own.length ? moved : added).push(name)

    if (style === 'cname') {
      // A CNAME stands alone at its name. At the apex it is flattened: the edge answers with the
      // load balancer's addresses, so the MX, TXT and CAA records there keep working.
      const base = a ?? cname
      const after: Shape = { type: 'CNAME', name, content: LB.host, ttl: 1, proxied: apex ? true : proxied }
      if (base) {
        if (!(base.type === 'CNAME' && base.content === LB.host)) {
          ops.push({
            id: base.id,
            before: shape(base),
            after,
            inferred: base.type === 'CNAME' ? ['content'] : ['type', 'content'],
            note: apex ? 'Flattened: answers with lb-jkt-2’s addresses' : undefined,
          })
        }
      } else {
        ops.push({ id: newId(name, 'cname'), after, inferred: ['type', 'content', 'ttl', 'proxied'] })
      }
      for (const r of own) {
        if (r !== base) ops.push({ id: r.id, before: shape(r), note: apex ? 'The flattened CNAME answers IPv6 too' : 'A CNAME cannot share its name' })
      }
    } else {
      const v4: Shape = { type: 'A', name, content: LB.v4, ttl: 1, proxied }
      const v6: Shape = { type: 'AAAA', name, content: LB.v6, ttl: 1, proxied }
      if (a) {
        if (a.content !== LB.v4) ops.push({ id: a.id, before: shape(a), after: v4, inferred: ['content'] })
      } else if (cname) {
        ops.push({ id: cname.id, before: shape(cname), after: v4, inferred: ['type', 'content'] })
      } else {
        ops.push({ id: newId(name, 'a'), after: v4, inferred: ['content', 'ttl', 'proxied'] })
      }
      if (aaaa) {
        if (aaaa.content !== LB.v6) ops.push({ id: aaaa.id, before: shape(aaaa), after: v6, inferred: ['content'] })
      } else if (!own.length || cname) {
        // New names get the pair, the way app and api have one.
        ops.push({ id: newId(name, 'aaaa'), after: v6, inferred: ['type', 'content', 'ttl', 'proxied'] })
      }
    }
  }

  const all = [...added, ...moved]
  const apexIn = names.includes(ZONE.name)
  const shopIn = added.includes(SHOP.name)
  const clearBy = later(at, SHOP.missFor)
  const fromWeb1 = moved.filter((n) => records.some((r) => r.name === n && (r.content === WEB1.v4 || r.content === WEB1.v6)))
  const leftOnWeb1 = onWeb1(records).filter((r) => !ops.some((o) => o.id === r.id))

  const title = !moved.length
    ? `Add ${added.length === 1 ? fqdn(added[0]) : listOf(added)}`
    : !added.length
      ? `Move ${listOf(moved)} to lb-jkt-2`
      : `Point ${listOf(all)} at lb-jkt-2`

  /* What Simpul understood, for the check in the thread. */
  const rows: CheckRow[] = []
  const lbHint = `Set up by ${LB.by} at ${LB.at} · ${LB.pools}`
  if (added.length && !moved.length) {
    rows.push({ label: 'Points at', value: LB.name, inferred: true, hint: lbHint })
  } else {
    rows.push({
      label: 'Moves',
      value: listOf(moved),
      hint: fromWeb1.length === moved.length ? `On web-1 at ${WEB1.v4} today` : undefined,
    })
    if (added.length) rows.push({ label: 'Adds', value: listOf(added) })
    rows.push({ label: 'To', value: LB.name, inferred: true, hint: lbHint })
  }
  if (style === 'cname') {
    rows.push({ label: 'CNAME', value: LB.host, mono: true, inferred: true, hint: 'Follows the load balancer if its addresses change' })
    if (apexIn) rows.push({ label: 'Apex', value: 'Flattened CNAME', inferred: true, hint: 'A plain CNAME would hide its MX, TXT and CAA' })
  } else {
    rows.push({ label: 'A record', value: LB.v4, mono: true, inferred: true })
    if (ops.some((o) => o.after?.type === 'AAAA')) {
      rows.push({ label: 'AAAA record', value: LB.v6, mono: true, inferred: true, hint: added.length ? 'app and api have both' : undefined })
    }
  }
  rows.push(
    added.length && !moved.length
      ? { label: 'Proxy', value: 'On · TTL Auto', inferred: true, hint: 'Like every web host in the zone' }
      : { label: 'Proxy', value: 'Stays on', inferred: true, hint: 'Visitors move at the edge in about 30 s' },
  )
  if (shopIn) rows.push({ label: 'Live', value: 'When you approve', hint: `Cached misses clear by ${clearBy}` })

  /* The warnings that matter, and what is already fine. */
  const notes: Note[] = []
  if (shopIn) {
    notes.push({
      tone: 'warning',
      word: 'Cached miss',
      text: `${SHOP.lookups} lookups since ${SHOP.since} got “no such name”. Resolvers keep that answer for up to ${SHOP.missFor} min, so some visitors see an error until ${clearBy}.`,
    })
  }
  if (added.length) {
    notes.push({ tone: 'success', word: 'HTTPS', text: `The *.lintang.example certificate covers ${listOf(added)}, so HTTPS works at once.` })
  }
  if (apexIn) {
    notes.push(
      style === 'cname'
        ? {
            tone: 'warning',
            word: 'Apex',
            text: 'A plain CNAME at lintang.example would hide its MX, TXT and CAA records, and mail would stop. I flattened it instead: the edge looks up lb-jkt-2 and answers with its addresses.',
          }
        : {
            tone: 'neutral',
            word: 'Apex',
            text: 'lintang.example keeps A and AAAA records. A CNAME cannot share the apex with its MX, TXT and CAA records.',
          },
    )
  }
  if (moved.length) {
    notes.push({
      tone: 'neutral',
      word: 'At the edge',
      text: 'Proxied, so visitors move within about 30 s. Resolvers answer the edge address before and after: there is nothing to wait for.',
    })
  }
  if (fromWeb1.length && !leftOnWeb1.length) {
    notes.push({ tone: 'success', word: 'web-1', text: `Nothing points at web-1 (${WEB1.v4}) after this.` })
  }

  const afters = [...new Set(ops.filter((o) => o.after).map((o) => `${o.after!.type} ${o.after!.content}`))]
  const detail = `${plural(ops.length, 'record')} · ${afters.slice(0, 2).join(' · ')}${afters.length > 2 ? ` · +${afters.length - 2}` : ''}`

  return {
    id,
    topic: 'lb',
    title,
    summary: !moved.length ? `${listOf(added)} added on lb-jkt-2` : `${listOf(all)} moved to lb-jkt-2`,
    detail,
    ops,
    notes,
    rows,
    status: 'pending',
    at,
    names: [...names],
    style,
    revertSay: !moved.length
      ? `${listOf(added)} ${added.length === 1 ? 'is' : 'are'} gone again. Resolvers that cached the new answer keep it for up to 5 min, then say “no such name”.`
      : `${listOf(moved)} point${moved.length === 1 ? 's' : ''} back where ${moved.length === 1 ? 'it was' : 'they were'}. Proxied, so the edge switches back within a minute.`,
  }
}

/* ── Mail: "move mail to the new provider" ──────────────────────────────────────────── */

export function mailChange(records: Rec[], { id, at }: Ctx): Change {
  const ops: Op[] = []
  const mx1 = records.find((r) => r.id === 'r15')
  const mx2 = records.find((r) => r.id === 'r16')
  const spf = records.find((r) => r.id === 'r17')
  if (mx1) ops.push({ id: mx1.id, before: shape(mx1), after: { ...shape(mx1), content: NEWMAIL.mx }, inferred: ['content'] })
  if (mx2) ops.push({ id: mx2.id, before: shape(mx2) })
  if (spf) ops.push({ id: spf.id, before: shape(spf), after: { ...shape(spf), content: NEWMAIL.spf }, inferred: ['content'] })
  if (!records.some((r) => r.name === NEWMAIL.dkimName)) {
    ops.push({
      id: `${id}-dkim`.toLowerCase(),
      after: { type: 'TXT', name: NEWMAIL.dkimName, content: NEWMAIL.dkim, ttl: 3600, proxied: false },
      inferred: ['content', 'ttl'],
    })
  }
  return {
    id,
    topic: 'mail',
    title: 'Move mail to Kotak Surat',
    summary: 'Mail moved to Kotak Surat',
    detail: `MX ${NEWMAIL.mx} · SPF allows both · DKIM kotaksurat`,
    ops,
    notes: [],
    rows: [
      { label: 'Provider', value: NEWMAIL.name, inferred: true, hint: `From your ticket ${NEWMAIL.ticket}, ${NEWMAIL.opened}` },
      { label: 'Inbound', value: NEWMAIL.mx, mono: true, inferred: true, hint: 'Replaces mx1 and mx2.mailroute.example' },
      { label: 'SPF', value: 'Allows both while mail moves', inferred: true, hint: `Mailroute comes out after ${NEWMAIL.spfUntil}` },
      { label: 'DKIM', value: NEWMAIL.dkimName, mono: true, inferred: true, hint: 'Key from the Admin console' },
      { label: 'TTL', value: ttlOf(mx1 ?? { ttl: 3600, proxied: false }), hint: 'As now' },
    ],
    status: 'pending',
    at,
    revertSay: 'Mail points at Mailroute again. Senders that already have mx.kotaksurat.example keep delivering there until their answer runs out, so keep both accounts open today.',
  }
}

/** Where the mail move stands: verified yet, and how long resolvers keep MX. */
export interface MailState {
  verify: 'none' | 'proposed' | 'settling' | 'done'
  verifyBy?: string
  ttl: 'none' | 'proposed' | 'settling' | 'done'
  ttlBy?: string
}

/** The mail move's warnings change as the verification and the TTL land. */
export function mailNotes(s: MailState): Note[] {
  const notes: Note[] = []
  if (s.verify === 'done') {
    notes.push({ tone: 'success', word: 'Verified', text: 'Kotak Surat has verified lintang.example, so it accepts mail for the domain.' })
  } else if (s.verify === 'settling') {
    notes.push({
      tone: 'warning',
      word: 'Verifying',
      text: `The verification record is in; Kotak Surat should see it by ${s.verifyBy}. Mail delivered there before then bounces.`,
    })
  } else {
    notes.push({
      tone: 'danger',
      word: 'Bounces',
      text:
        s.verify === 'proposed'
          ? 'Kotak Surat has not verified lintang.example yet, so it rejects mail for the domain. Apply the verification first.'
          : 'Kotak Surat has not verified lintang.example yet, so it rejects mail for the domain. Anything delivered there before it does bounces back to the sender.',
      action: s.verify === 'proposed' ? undefined : { label: 'Add the verification', say: 'Tambahkan record verifikasi Kotak Surat' },
    })
  }
  if (s.ttl === 'done') {
    notes.push({ tone: 'success', word: 'TTL 5 min', text: 'Every resolver holds MX for 5 min, so senders follow the switch within 5 min.' })
  } else if (s.ttl === 'settling') {
    notes.push({ tone: 'warning', word: 'TTL 1 hr', text: `The 5 min TTL is on its way; every resolver holds it by ${s.ttlBy}. Until then senders may keep the old MX for an hour.` })
  } else {
    notes.push({
      tone: 'warning',
      word: 'TTL 1 hr',
      text: 'Senders keep the old MX for up to an hour after the switch, so Mailroute must accept mail until then. Lower the TTL to 5 min first and the overlap is 5 min.',
      action: s.ttl === 'proposed' ? undefined : { label: 'Lower the TTL first', say: 'Lower the TTL first' },
    })
  }
  notes.push({
    tone: 'neutral',
    word: 'SPF',
    text: `Mailroute stays allowed in SPF, so mail still leaving through it passes checks. It comes out after ${NEWMAIL.spfUntil}.`,
  })
  return notes
}

/* ── "Tambahkan record verifikasi Kotak Surat" ─────────────────────────────────── */

export function verifyChange({ id, at }: Ctx): Change {
  return {
    id,
    topic: 'verify',
    title: 'Add the Kotak Surat verification',
    summary: 'Kotak Surat verification added',
    detail: 'TXT kotaksurat-verification at lintang.example',
    ops: [
      {
        id: `${id}-verify`.toLowerCase(),
        after: { type: 'TXT', name: ZONE.name, content: NEWMAIL.verify, ttl: 3600, proxied: false },
        inferred: ['content', 'ttl'],
      },
    ],
    notes: [
      {
        tone: 'warning',
        word: 'Up to 1 hr',
        text: 'Resolvers that cached the TXT answer at lintang.example keep it for up to 1 hr, so Kotak Surat may take that long to see the token.',
      },
      { tone: 'success', word: 'No mail moves', text: 'It only proves the domain is yours. Mail keeps going to Mailroute.' },
    ],
    rows: [
      { label: 'Record', value: 'TXT at lintang.example' },
      { label: 'Token', value: 'kotaksurat-verification=Kp3v…6oXr', mono: true, inferred: true, hint: `From the Admin console, in your ticket ${NEWMAIL.ticket}` },
      { label: 'TTL', value: '1 hr', inferred: true, hint: 'Like the other TXT records at the apex' },
    ],
    status: 'pending',
    at,
    revertSay: 'The verification record is gone. Kotak Surat keeps a domain verified once it has seen the token, so mail is not affected.',
  }
}

/* ── "Lower the TTL first" ──────────────────────────────────────────────────────────── */

export function ttlChange(records: Rec[], { id, at }: Ctx): Change {
  const mx = records.filter((r) => r.type === 'MX' && r.ttl !== 300)
  return {
    id,
    topic: 'ttl',
    title: 'Lower the MX TTL to 5 min',
    summary: 'MX TTL lowered to 5 min',
    detail: `${plural(mx.length, 'MX record')} · 1 hr → 5 min`,
    ops: mx.map((r) => ({ id: r.id, before: shape(r), after: { ...shape(r), ttl: 300 }, inferred: ['ttl'] })),
    notes: [
      {
        tone: 'neutral',
        word: 'Takes 1 hr',
        text: `Resolvers that cached MX in the last hour keep the 1 hr answer until it runs out. By ${later(at, 57)} every one holds 5 min.`,
      },
      { tone: 'success', word: 'No mail moves', text: 'Only the TTL changes. Mail keeps going to Mailroute.' },
    ],
    rows: [
      { label: 'Records', value: mx.map((r) => r.content.replace('.mailroute.example', '')).join(', '), mono: true, hint: 'MX at lintang.example' },
      { label: 'TTL', value: '1 hr → 5 min', inferred: true, hint: 'Short enough to switch quickly' },
      { label: 'Mail', value: 'Still goes to Mailroute' },
    ],
    status: 'pending',
    at,
    revertSay: 'MX is back to a 1 hr TTL. The mail move overlaps with Mailroute for up to an hour again.',
  }
}

/* ── "Turn the proxy off for staging" ───────────────────────────────────────────────── */

export function proxyChange(records: Rec[], name: string, on: boolean, { id, at }: Ctx): Change | null {
  const own = records.filter((r) => r.name === name && proxiable(r.type) && r.proxied !== on)
  if (!own.length) return null
  const first = own[0]
  const notes: Note[] = []
  if (on && name === 'vpn') {
    notes.push({ tone: 'danger', word: 'Breaks VPN', text: 'The edge proxies HTTP and HTTPS only. VPN connections through it would fail.' })
  } else if (on && name === 'status') {
    notes.push({ tone: 'warning', word: 'Certificate', text: 'The status page serves its own certificate. Behind the edge, visitors get *.lintang.example instead; Kevin turned the proxy off on 31 Oct for that.' })
  } else if (on) {
    notes.push({ tone: 'success', word: 'Private', text: `Resolvers will answer the edge address; ${first.content} stays private.` })
  } else {
    notes.push({ tone: 'warning', word: 'Exposed', text: `Anyone who looks up ${fqdn(name)} sees ${first.content}, and traffic skips the edge firewall.` })
  }
  return {
    id,
    topic: 'proxy',
    title: `Turn the proxy ${on ? 'on' : 'off'} for ${short(name)}`,
    summary: `${short(name)} proxy turned ${on ? 'on' : 'off'}`,
    detail: on ? 'Answers with edge addresses · TTL Auto' : `Answers with ${first.content} · TTL 5 min`,
    ops: own.map((r) => ({ id: r.id, before: shape(r), after: { ...shape(r), proxied: on, ttl: on ? 1 : 300 }, inferred: on ? [] : ['ttl'] })),
    notes,
    rows: [
      { label: 'Record', value: own.map((r) => `${r.type} ${short(r.name)}`).join(', '), mono: true },
      { label: 'Proxy', value: on ? 'On' : 'Off, DNS only' },
      { label: 'TTL', value: on ? 'Auto' : '5 min', inferred: !on, hint: on ? 'Set by the edge' : 'Short, in case it goes back' },
    ],
    status: 'pending',
    at,
    revertSay: `${short(name)} is ${on ? 'DNS only' : 'proxied'} again.`,
  }
}

/* ── "Hapus staging" ────────────────────────────────────────────────────────────────── */

export function removeChange(records: Rec[], name: string, { id, at }: Ctx): Change | null {
  const own = records.filter((r) => r.name === name)
  if (!own.length || name === ZONE.name) return null
  const longest = Math.max(...own.map((r) => (r.proxied ? 300 : r.ttl)))
  return {
    id,
    topic: 'remove',
    title: `Delete ${fqdn(name)}`,
    summary: `${short(name)} deleted`,
    detail: own.map((r) => `${r.type} ${r.content}`).join(' · '),
    ops: own.map((r) => ({ id: r.id, before: shape(r) })),
    notes: [
      {
        tone: 'danger',
        word: 'Deletes',
        text: `Anyone who looks up ${fqdn(name)} gets “no such name” once their cached answer runs out, within ${ttlLabel(longest)}.`,
      },
      { tone: 'neutral', word: 'Way back', text: 'The trail keeps it: Revert puts the same records back.' },
    ],
    rows: [
      { label: 'Deletes', value: own.map((r) => `${r.type} ${r.content}`).join(', '), mono: true },
      { label: 'Then', value: '“No such name”', hint: `Within ${ttlLabel(longest)}, as caches run out` },
    ],
    status: 'pending',
    at,
    revertSay: `${short(name)} is back with the same ${own.length === 1 ? 'record' : 'records'}.`,
  }
}

/* ── What to watch once a change lands ──────────────────────────────────────────────── */

const answerOf = (s?: Shape) => (!s ? 'NXDOMAIN' : s.proxied ? (s.type === 'AAAA' ? EDGE_V6 : EDGE_V4) : s.content)

/** Watch the first record of a change: the old answer expires after the old TTL. */
function genericPlan(op: Op, back: boolean): WatchPlan {
  const from = back ? op.after : op.before
  const to = back ? op.before : op.after
  const s = (to ?? from)!
  const expect = answerOf(to)
  const old = answerOf(from)
  const holds = !from ? 0 : from.proxied ? 5 : Math.round(from.ttl / 60)
  return { host: fqdn(s.name), type: s.type, ttl: ttlOf(s), expect, old, stale: expect === old || !holds ? {} : spread(holds) }
}

export function planFor(change: Change, ttlLowered: boolean, back = false): WatchPlan | null {
  const ops = change.ops
  if (!ops.length) return null
  if (change.topic === 'lb') {
    const added = ops.filter((o) => !o.before && o.after)
    if (added.length) {
      const s = added[0].after!
      const shop = s.name === SHOP.name
      return back
        ? { host: fqdn(s.name), type: 'A', ttl: 'Auto', expect: 'NXDOMAIN', old: EDGE_V4, stale: spread(5) }
        : {
            host: fqdn(s.name),
            type: 'A',
            ttl: 'Auto',
            expect: EDGE_V4,
            old: 'NXDOMAIN',
            stale: shop ? { CGK: 16, SUB: 22, SIN: 28 } : {},
            note: shop
              ? 'Proxied: each resolver answers the edge address once its cached “no such name” runs out.'
              : 'Proxied: resolvers answer the edge address.',
          }
    }
    const names = change.names ?? []
    return {
      host: fqdn(names[0] ?? ZONE.name),
      type: 'A',
      ttl: 'Auto',
      expect: EDGE_V4,
      old: EDGE_V4,
      stale: {},
      note: `Proxied: resolvers answer the edge address before and after. The edge moved ${listOf(names)} ${back ? 'back' : 'to lb-jkt-2'} in 9 s.`,
    }
  }
  if (change.topic === 'mail') {
    const minutes = ttlLowered ? 5 : 60
    return {
      host: ZONE.name,
      type: 'MX',
      ttl: ttlLowered ? '5 min' : '1 hr',
      expect: back ? '10 mx1.mailroute.example' : NEWMAIL.mx,
      old: back ? NEWMAIL.mx : '10 mx1.mailroute.example',
      stale: spread(minutes),
      note: back ? 'Senders follow Mailroute again as their MX answers run out.' : 'Senders deliver to Kotak Surat as their MX answers run out; until then Mailroute still gets mail.',
    }
  }
  if (change.topic === 'verify') {
    return {
      host: ZONE.name,
      type: 'TXT',
      ttl: '1 hr',
      expect: back ? 'No token' : 'kotaksurat-verification=Kp3v…',
      old: back ? 'kotaksurat-verification=Kp3v…' : 'No token yet',
      stale: spread(60),
      note: back ? undefined : 'Kotak Surat checks the same answer; it verifies once its resolver has the token.',
    }
  }
  if (change.topic === 'ttl') {
    return {
      host: ZONE.name,
      type: 'MX',
      ttl: back ? '1 hr' : '5 min',
      expect: back ? 'TTL 1 hr' : 'TTL 5 min',
      old: back ? 'TTL 5 min' : 'TTL 1 hr',
      stale: spread(back ? 5 : 60),
      note: 'The answer stays the same; what changes is how long resolvers may keep it.',
    }
  }
  return genericPlan(ops[0], back)
}
