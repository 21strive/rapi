/**
 * The firewall desk's conversation and state. A sentence becomes a draft rule; the draft is run
 * against the last 24 hours (whatif.ts) before anything goes live; turning it on starts it in
 * log-only; every change can be said back ("undo that", "batalkan") or reverted from the record.
 * Surfaces and thread stay in step: a press in a surface writes to the thread and the record, a
 * revert in the record writes to the thread.
 */
import { computed, reactive, ref, shallowRef } from 'vue'
import { formatNumber } from '@/design-system'
import { ACTIONS, RULES } from '../firewall/data'
import type { RuleAction } from '../firewall/engine'
import { norm, useDesk, type CheckRow, type DeskReply, type TrailItem } from '../_kit/desk'
import { AGENT, LOG_ONLY_MINUTES, OPENING_CONTEXT, OPENING_SAID, OPENING_SPEC, PERSON, START, TRAIL_SEED } from './data'
import {
  EXCEPTS,
  TARGETS,
  countryNames,
  isExceptOnly,
  nameOf,
  readAction,
  readExcept,
  readRule,
  rowsOf,
  withCountries,
  write,
  type ExceptId,
  type RuleSpec,
  type TargetId,
  type Written,
} from './rule'
import { ALWAYS, HISTORY, NEVER, OFFICES, astOf, preview, type Effect, type SimRule } from './whatif'

/* ── Words ──────────────────────────────────────────────────────────────────────── */

const n = (v: number) => formatNumber(Math.round(v))
/**
 * A name inside a sentence: its first letter drops ("block sign-ins from outside Indonesia"),
 * unless the name starts with a place ("Jakarta office VPN", "Singapore office").
 */
const lower = (name: string) => (/^(Jakarta|Singapore|Selaras|Indonesia)\b/.test(name) ? name : name.charAt(0).toLowerCase() + name.slice(1))
const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine']
const howMany = (k: number) => WORDS[k] ?? String(k)
const pad = (v: number) => String(v).padStart(2, '0')
const toMin = (t: string) => {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}
const toText = (m: number) => `${pad(Math.floor(m / 60) % 24)}:${pad(m % 60)}`

export const NOUN: Record<TargetId, string> = {
  signin: 'sign-ins',
  transfers: 'transfer calls',
  otp: 'OTP resends',
  admin: 'requests to admin paths',
  all: 'requests',
}
const PAST: Record<RuleAction, string> = { block: 'blocked', challenge: 'challenged', log: 'logged', allow: 'allowed' }
const DOES: Record<RuleAction, string> = { block: 'blocks', challenge: 'challenges', log: 'logs', allow: 'allows' }

export const TRANSFERS_SAID = 'Tantang semua request ke /api/transfers dari ASN hosting'

/* ── Shapes ─────────────────────────────────────────────────────────────────────── */

export interface Draft {
  version: number
  spec: RuleSpec
  name: string
  written: Written
  /** Where it would sit in the order, 0-based, out of `total`; `hint` names its neighbour. */
  at: number
  total: number
  hint: string
  effect: Effect
}

export interface LiveRule {
  id: string
  version: number
  spec: RuleSpec
  name: string
  written: Written
  effect: Effect
  mode: 'log' | 'enforce' | 'off'
  since: string
  until: string
  /** When it started to act, if it ended log-only early. */
  acting?: string
  /** Its lines in the record, struck together if it is reverted. */
  lines: string[]
}

/** What a check card in the thread carries: a snapshot of the draft as it was. */
export interface CheckCard {
  version: number
  eyebrow: string
  title: string
  rows: CheckRow[]
  sums: string
}

export interface CardState {
  tone: 'success' | 'danger' | 'neutral' | 'warning'
  label: string
  at?: string
}

export interface ListRow {
  id: string
  no: string
  name: string
  action: RuleAction
  matches: number
  state: 'on' | 'off' | 'draft' | 'log' | 'new'
  /** Its figure is a preview over the last 24 hours, not a count. */
  preview: boolean
}

type Change =
  | { kind: 'draft'; prev: Draft | null }
  | { kind: 'edit'; prev: Draft }
  | { kind: 'discard'; prev: Draft }
  | { kind: 'on'; rule: string; trail: string; draft: Draft }
  | { kind: 'enforce'; rule: string; trail: string }
  | { kind: 'off'; rule: string; trail: string; was: 'log' | 'enforce' }
  | { kind: 'toggle'; rule: string; on: boolean; trail: string }

/* ── The desk ───────────────────────────────────────────────────────────────────── */

export function useFirewallDesk() {
  const order = ref<string[]>(RULES.map((r) => r.id))
  const enabled = reactive<Record<string, boolean>>(Object.fromEntries(RULES.map((r) => [r.id, r.enabled])))
  /** Base rules switched in this session run that way for the whole replayed window. */
  const toggled = new Set<string>()
  const live = ref<LiveRule[]>([])
  const draft = shallowRef<Draft | null>(null)
  const cards = reactive<Record<number, CardState>>({})
  const trail = ref<TrailItem[]>(TRAIL_SEED.map(({ kind: _k, rule: _r, on: _o, ...item }) => item))
  const changes: Change[] = []
  let versions = 0
  let liveSeq = 0
  let trailSeq = 0

  const baseById = new Map(RULES.map((r) => [r.id, r]))
  const liveById = (id: string) => live.value.find((r) => r.id === id)

  /** The rules as they stand, replayed over the last 24 hours. */
  function simRules(without?: string): SimRule[] {
    return order.value.filter((id) => id !== without).map((id) => {
      const past = HISTORY.find((h) => h.id === id)
      if (past) return toggled.has(id) ? { ...past, live: enabled[id] ? ALWAYS : NEVER } : past
      const rule = liveById(id)!
      return {
        id,
        ast: astOf(rule.written.expression),
        scope: rule.written.scope,
        action: rule.mode === 'enforce' ? rule.spec.action : 'log',
        live: rule.mode === 'off' ? NEVER : ALWAYS,
      }
    })
  }

  /** Where a rule on this traffic goes: next to the rule that already covers it. */
  function place(spec: RuleSpec, ids: string[]) {
    const anchor = TARGETS[spec.target].anchor
    const i = ids.indexOf(anchor.id)
    if (i < 0) return { at: 0, hint: TARGETS[spec.target].why }
    return anchor.side === 'after'
      ? { at: i + 1, hint: `Right after rule ${pad(i + 1)}` }
      : { at: i, hint: `Right before rule ${pad(i + 2)}` }
  }

  /** A draft, previewed against the rules as they stand (leaving out one being reverted). */
  function makeDraft(spec: RuleSpec, without?: string): Draft {
    const ids = order.value.filter((id) => id !== without)
    const { at, hint } = place(spec, ids)
    const written = write(spec)
    const effect = preview({ ...written, action: spec.action }, at, simRules(without))
    return { version: ++versions, spec, name: nameOf(spec), written, at, total: ids.length + 1, hint, effect }
  }

  /** A restored draft gets a fresh card, recomputed against the rules as they now stand. */
  const again = (d: Draft, without?: string) => makeDraft(d.spec, without)

  /* ── The list the person sees ──────────────────────────────────────────────── */

  const list = computed<ListRow[]>(() => {
    const rows: Omit<ListRow, 'no'>[] = order.value.map((id) => {
      const base = baseById.get(id)
      if (base) return { id, name: base.name, action: base.action, matches: base.matches, state: enabled[id] ? 'on' : 'off', preview: false }
      const rule = liveById(id)!
      return {
        id,
        name: rule.name,
        action: rule.spec.action,
        matches: rule.effect.matched,
        state: rule.mode === 'off' ? 'off' : rule.mode === 'log' ? 'log' : 'new',
        preview: true,
      }
    })
    const d = draft.value
    if (d) rows.splice(d.at, 0, { id: 'draft', name: d.name, action: d.spec.action, matches: d.effect.matched, state: 'draft', preview: true })
    return rows.map((row, i) => ({ ...row, no: pad(i + 1) }))
  })

  const numberOf = (id: string) => list.value.find((r) => r.id === id)?.no ?? '—'
  const nameOfRule = (id: string) => baseById.get(id)?.name ?? liveById(id)?.name ?? ''
  const draftNo = () => (draft.value ? pad(draft.value.at + 1) : '—')

  const watching = computed(() => [...live.value].reverse().find((r) => r.mode === 'log') ?? null)

  /* ── Cards ─────────────────────────────────────────────────────────────────── */

  function card(d: Draft, changed: (keyof RuleSpec)[] = []): CheckCard {
    const e = d.effect
    const legit = e.customers + e.yours + e.partners
    const sums =
      e.matched === 0
        ? `${ACTIONS[d.spec.action].label}s nothing in the last 24 h`
        : `${ACTIONS[d.spec.action].label}s ${n(e.matched)} / 24 h · ${legit ? `${n(legit)} look legitimate` : 'none look legitimate'}`
    return {
      version: d.version,
      eyebrow: `Rule ${pad(d.at + 1)} · draft · not live`,
      title: d.name,
      rows: rowsOf(d.spec, d.at, d.total, d.hint, changed),
      sums,
    }
  }

  const checkReply = (d: Draft, text: string, changed: (keyof RuleSpec)[] = []): DeskReply => ({
    text,
    card: 'rule',
    data: card(d, changed),
  })

  function retire(d: Draft | null, label: string, at: string) {
    if (d && !cards[d.version]) cards[d.version] = { tone: 'neutral', label, at }
  }

  /* ── The record ────────────────────────────────────────────────────────────── */

  function record(item: Omit<TrailItem, 'id'>) {
    const id = `t-now-${++trailSeq}`
    trail.value = [{ id, ...item }, ...trail.value]
    return id
  }

  function strike(id: string, at: string) {
    trail.value = trail.value.map((t) => (t.id === id && !t.revertedAt ? { ...t, revertedAt: at } : t))
  }

  /* ── What the person can do ────────────────────────────────────────────────── */

  function applyTurnOn(at: string) {
    const d = draft.value
    if (!d) return
    const id = `s-${++liveSeq}`
    const until = toText(toMin(at) + LOG_ONLY_MINUTES)
    order.value = [...order.value.slice(0, d.at), id, ...order.value.slice(d.at)]
    const no = pad(d.at + 1)
    const trailId = record({
      at,
      who: PERSON,
      text: `Turned on rule ${no}, ${d.name}, in log-only`,
      detail: `${DOES[d.spec.action]} at ${until} UTC · ${d.effect.matched ? `would have ${PAST[d.spec.action]} ${n(d.effect.matched)} / 24 h` : 'matched nothing in the last 24 h'}`,
      canRevert: true,
    })
    live.value = [...live.value, { id, version: d.version, spec: d.spec, name: d.name, written: d.written, effect: d.effect, mode: 'log', since: at, until, lines: [trailId] }]
    cards[d.version] = { tone: 'success', label: 'On · log only', at }
    changes.push({ kind: 'on', rule: id, trail: trailId, draft: d })
    draft.value = null
  }

  function applyEnforce(rule: LiveRule, at: string) {
    const trailId = record({
      at,
      who: PERSON,
      text: `Rule ${numberOf(rule.id)} ${DOES[rule.spec.action]} now; log-only ended early`,
      detail: `${rule.written.scope} · was log-only until ${rule.until} UTC`,
      canRevert: true,
    })
    live.value = live.value.map((r) => (r.id === rule.id ? { ...r, mode: 'enforce', acting: at, lines: [...r.lines, trailId] } : r))
    cards[rule.version] = { tone: 'success', label: `On · ${rule.spec.action === 'block' ? 'blocking' : 'enforcing'}`, at }
    changes.push({ kind: 'enforce', rule: rule.id, trail: trailId })
  }

  function applyOff(rule: LiveRule, at: string) {
    const was = rule.mode === 'enforce' ? 'enforce' : 'log'
    const trailId = record({ at, who: PERSON, text: `Switched off rule ${numberOf(rule.id)}, ${rule.name}`, detail: `${rule.written.scope} · on → off`, canRevert: true })
    live.value = live.value.map((r) => (r.id === rule.id ? { ...r, mode: 'off', lines: [...r.lines, trailId] } : r))
    cards[rule.version] = { tone: 'neutral', label: 'Off', at }
    changes.push({ kind: 'off', rule: rule.id, trail: trailId, was })
  }

  function applyToggle(id: string, on: boolean, at: string) {
    enabled[id] = on
    toggled.add(id)
    const trailId = record({
      at,
      who: PERSON,
      text: `Switched ${on ? 'on' : 'off'} ${nameOfRule(id)}`,
      detail: `${id} · ${on ? 'off → on' : 'on → off'}`,
      canRevert: true,
    })
    changes.push({ kind: 'toggle', rule: id, on, trail: trailId })
  }

  /**
   * Undoing one change: what the agent says, computed now, and the change itself in `after`, so
   * the surfaces move when the reply lands. A revert pressed in the record runs `after` at once.
   */
  function undoChange(change: Change, at: string): DeskReply {
    switch (change.kind) {
      case 'draft': {
        const back = change.prev ? again(change.prev) : null
        const after = () => {
          retire(draft.value, 'Undone', at)
          draft.value = back
        }
        return back
          ? { ...checkReply(back, `Undone. Back to the draft before it, ${lower(back.name)}.`), after }
          : { text: 'Undone. The draft is gone; nothing of it went live.', after }
      }
      case 'edit': {
        const back = again(change.prev)
        return {
          ...checkReply(back, `Undone. Back to ${lower(back.name)}${exceptTail(back.spec)}: it would have ${PAST[back.spec.action]} ${n(back.effect.matched)} ${NOUN[back.spec.target]}.`),
          after: () => {
            retire(draft.value, 'Undone', at)
            draft.value = back
          },
        }
      }
      case 'discard': {
        const back = again(change.prev)
        return { ...checkReply(back, `Brought back: ${lower(back.name)}. Still a draft, not live.`), after: () => (draft.value = back) }
      }
      case 'on': {
        const rule = liveById(change.rule)
        const no = numberOf(change.rule)
        const back = draft.value ? null : again(change.draft, change.rule)
        const after = () => {
          rule?.lines.forEach((id) => strike(id, at))
          order.value = order.value.filter((id) => id !== change.rule)
          live.value = live.value.filter((r) => r.id !== change.rule)
          if (rule) cards[rule.version] = { tone: 'neutral', label: 'Turned off', at }
          for (let i = changes.length - 1; i >= 0; i--) {
            const c = changes[i]
            if ((c.kind === 'enforce' || c.kind === 'off') && c.rule === change.rule) changes.splice(i, 1)
          }
          if (back) draft.value = back
        }
        return back
          ? { ...checkReply(back, `Undone. Rule ${no} is off and back to a draft; nothing was blocked.`), after }
          : { text: `Undone. Rule ${no}, ${change.draft.name}, is off and out of the order; nothing was blocked.`, after }
      }
      case 'enforce': {
        const rule = liveById(change.rule)
        return {
          text: `Undone. Rule ${numberOf(change.rule)} is back to log-only until ${rule?.until ?? '—'} UTC.`,
          after: () => {
            strike(change.trail, at)
            if (!rule) return
            live.value = live.value.map((r) => (r.id === rule.id ? { ...r, mode: 'log', acting: undefined } : r))
            cards[rule.version] = { tone: 'success', label: 'On · log only', at }
          },
        }
      }
      case 'off': {
        const rule = liveById(change.rule)
        return {
          text: `Undone. Rule ${numberOf(change.rule)} is on again${change.was === 'log' ? ', in log-only' : ''}.`,
          after: () => {
            strike(change.trail, at)
            if (!rule) return
            live.value = live.value.map((r) => (r.id === rule.id ? { ...r, mode: change.was } : r))
            cards[rule.version] = { tone: 'success', label: change.was === 'log' ? 'On · log only' : 'On · blocking', at }
          },
        }
      }
      case 'toggle': {
        // A line of this session is struck; a line from before (Kevin's) stays, and the switch back is recorded.
        const ours = change.trail.startsWith('t-now-')
        return {
          text: `Undone. ${nameOfRule(change.rule)} is ${change.on ? 'off' : 'on'} again.`,
          after: () => {
            if (ours) {
              strike(change.trail, at)
              enabled[change.rule] = !change.on
            } else {
              applyToggle(change.rule, !change.on, at)
            }
          },
        }
      }
    }
  }

  /* ── Sentences ─────────────────────────────────────────────────────────────── */

  function exceptTail(spec: RuleSpec) {
    return spec.except.length ? `, except ${spec.except.map((id) => EXCEPTS[id].label.replace(/^The /, 'the ')).join(' and ')}` : ''
  }

  /** What a draft would have done, said plainly, for a rule that was just written. */
  function summary(d: Draft): string {
    const e = d.effect
    const noun = NOUN[d.spec.target]
    const verb = PAST[d.spec.action]
    const notes: string[] = []
    if (d.spec.target === 'transfers' && /api\/transfers/.test(lastSaid)) notes.push('There is no /api/transfers; I took the two transfer paths on api.selaras.id.')
    if (e.matched === 0) {
      const reason = d.spec.hosting ? 'no hosting network sent one' : 'nothing matched'
      notes.unshift(`In the last 24 hours it would have ${verb} nothing: ${reason}. It would stand guard.`)
      const partners = e.untouched.find((u) => u.id === 'partners')
      if (partners) notes.push(`Partners call from their own networks and stay untouched: ${n(partners.requests)} calls a day.`)
    } else {
      const legit = e.customers + e.yours + e.partners
      if (!legit) notes.unshift(`In the last 24 hours it would have ${verb} ${n(e.matched)} ${noun}, and none of them look legitimate.`)
      else
        notes.unshift(
          `In the last 24 hours it would have ${verb} ${n(e.matched)} ${noun}. ${n(e.attack)} look like attacks; ${n(e.customers)} look like customers${e.yours ? ` and ${n(e.yours)} come from your own offices` : ''}.`,
        )
    }
    if (d.spec.action === 'challenge' && d.written.scope === 'api.selaras.id') {
      notes.push('One catch: the app and partner servers cannot answer a challenge, so a real call it caught would fail. That is why Kevin switched off the app 3.x challenge at 23:12.')
    }
    return notes.join(' ')
  }

  /** After an exception: what it now spares and what it still catches. */
  function afterExcept(prev: Draft, next: Draft, added: ExceptId[]): string {
    const spared = (e: Effect) => [...e.rows, ...e.spared].reduce((a, r) => a + r.spared, 0)
    const freed = spared(next.effect) - spared(prev.effect)
    const what = added.map((id) =>
      id === 'jkt-vpn'
        ? 'the Jakarta office VPN is left out'
        : id === 'sg-office'
          ? 'the Singapore office is left out'
          : id === 'app'
            ? 'sign-ins from the Selaras app are left out, wherever they come from'
            : 'partners are left out',
    )
    const head = `Done: ${what.join(', and ')}: ${n(freed)} ${NOUN[next.spec.target]} a day.`
    const e = next.effect
    const verb = next.spec.action
    if (e.customers) {
      const web = next.spec.except.includes('app')
      return `${head} It would still ${verb} ${n(e.customers)} ${web ? 'web ' : ''}sign-ins by customers abroad${web ? ', so web banking would work from Indonesia only' : ''}${e.attack ? `, and all ${n(e.attack)} from last night’s proxies` : ''}.`
    }
    if (e.yours) return `${head} It would still ${verb} ${n(e.yours)} from your own offices.`
    return `${head} Nothing it would ${verb} looks legitimate now.`
  }

  /** Why a rule sits where it does: its neighbours, and what an earlier rule ends before it. */
  function whyHere(rule: Draft | LiveRule, no: string, at: number, ids: string[]): string {
    const above = ids[at - 1]
    const below = ids[at]
    const shadow = rule.effect.shadowed
    const neighbours = [above && `after ${nameOfRule(above)}`, below && `before ${nameOfRule(below)}`].filter(Boolean).join(' and ')
    const reason = rule.spec.target === 'transfers' ? ', so open-banking calls are still logged' : ''
    const shadowText = shadow
      ? ` The ${n(shadow.value)} ${NOUN[rule.spec.target]} from ${shadow.group === 'stuffing' ? 'hosting networks' : 'earlier sources'} stay with ${nameOfRule(shadow.rule)}, which ends them first.`
      : ''
    return `Rules run top to bottom and the first Block, Challenge or Allow wins. At ${no} it sits ${neighbours}${reason}.${shadowText}`
  }

  function why(t: string): string {
    const d = draft.value
    if (/\b(log|logging|catat)\b/.test(t)) {
      const when = watching.value ? `At ${watching.value.until} UTC it starts acting` : 'An hour after you turn it on, it starts acting'
      return `So nothing is blocked before you have seen it work. For an hour the rule only records what it would do and lets everything through; the count shows on Needs you as it fills. ${when}, unless you stop it.`
    }
    if (/\b(vpn|jakarta)\b/.test(t)) {
      return `The Jakarta office reaches the internet through a VPN that exits in Singapore, ${OFFICES['jkt-vpn'].range} on Lintas Selat Telecom, so to the edge Jakarta staff are in Singapore. 1,385 sign-ins came from it in the last 24 hours.`
    }
    if (/\b(customers?|pelanggan|legit\w*|nasabah)\b/.test(t)) {
      return 'They sign in with the Selaras app or the web app, from home broadband, and go on to MFA. Last night’s proxies never reached MFA, and the hosting networks never got past rule 02.'
    }
    if (/\b(challenge|tantang\w*)\b/.test(t)) {
      return 'A challenge is a browser check. The app and partner servers cannot answer one, so any real call it caught would fail; Kevin switched off the app 3.x challenge at 23:12 for that reason. A block says the same thing plainly.'
    }
    // A number asks about that row of the list: "why rule 03?", "kenapa urutan 10?".
    const asked = /\b0?(\d{1,2})\b/.exec(t)
    const row = asked ? list.value[Number(asked[1]) - 1] : undefined
    if (asked && !row) return `There is no rule ${asked[1]}; the list runs from 01 to ${pad(list.value.length)}.`
    if (row && row.id !== 'draft') {
      const rule = liveById(row.id)
      if (rule) {
        const ids = order.value.filter((id) => id !== rule.id)
        return whyHere(rule, row.no, order.value.indexOf(rule.id), ids)
      }
      const base = baseById.get(row.id)!
      return `Rule ${row.no}, ${base.name}, is where ${base.author} put it. Rules run top to bottom and the first Block, Challenge or Allow wins, so it only sees what the ${Number(row.no) - 1} rules above it let through.`
    }
    if (d) return whyHere(d, draftNo(), d.at, order.value)
    const w = watching.value
    if (w) return whyHere(w, numberOf(w.id), order.value.indexOf(w.id), order.value.filter((id) => id !== w.id))
    return 'Ask me about a rule once there is one: say it in a sentence, like “block sign-ins from Brazil”.'
  }

  function status(): string {
    const d = draft.value
    const w = watching.value
    const parts: string[] = []
    if (d) {
      const legit = d.effect.customers + d.effect.yours + d.effect.partners
      parts.push(
        `Rule ${draftNo()} is a draft, not live: it would ${d.spec.action} ${n(d.effect.matched)} ${NOUN[d.spec.target]} a day${legit ? `, ${n(legit)} of them legitimate-looking` : ''}. Say “turn it on” to start it in log-only.`,
      )
    }
    if (w) parts.push(`Rule ${numberOf(w.id)} is logging: ${n(logged.value)} ${NOUN[w.spec.target]} it would have ${PAST[w.spec.action]} since ${w.since}. It starts acting at ${w.until} UTC.`)
    if (w && !d) parts.push('Nothing else needs you.')
    if (!parts.length) {
      const on = list.value.filter((r) => r.state !== 'off').length
      return `Nothing needs you. ${list.value.length} rules, ${on} on.`
    }
    return parts.join(' ')
  }

  function sources(): string {
    const rule = draft.value ?? watching.value
    if (!rule) return 'Nothing to look at yet. Say a rule, like “block sign-ins from Brazil”, and I will show who it would stop.'
    const e = rule.effect
    if (!e.rows.length) return `It would stop nobody in the last 24 hours. It looks at ${e.untouched.map((u) => `${lower(u.label)} (${n(u.requests)})`).join(', ')} and leaves them alone.`
    const rows = e.rows.map((r) => `${lower(r.label)} ${n(r.matched)}`).join(', ')
    const shadow = e.shadowed ? ` ${n(e.shadowed.value)} from hosting networks never reach it; ${nameOfRule(e.shadowed.rule)} stops them first.` : ''
    return `In the last 24 hours: ${rows}.${shadow}`
  }

  function rulesSummary(): string {
    const on = list.value.filter((r) => r.state !== 'off' && r.state !== 'draft')
    const off = list.value.filter((r) => r.state === 'off')
    const top = [...RULES].sort((a, b) => b.matches - a.matches)[0]
    return `${list.value.filter((r) => r.state !== 'draft').length} rules, ${on.length} on. ${top.name} does the most: ${n(top.matches)} in 24 hours.${off.length ? ` Off: ${off.map((r) => r.name).join(', ')}.` : ''}`
  }

  /* ── Suggestions ───────────────────────────────────────────────────────────── */

  function chipsFor(): string[] {
    const d = draft.value
    if (d) {
      const out: string[] = []
      if (d.effect.rows.some((r) => r.id === 'jkt-vpn')) out.push('Except the Jakarta VPN')
      if (d.spec.target === 'signin' && !d.spec.except.includes('app') && d.effect.customers) out.push('Kecuali aplikasi')
      else if (d.effect.customers && d.effect.attack && d.spec.countries?.mode !== 'in') out.push('Only where the proxies came from')
      if (d.spec.action === 'challenge' && d.written.scope === 'api.selaras.id') out.push('Jadikan blokir')
      out.push('Turn it on')
      for (const extra of ['Why log-only first?', `Why rule ${pad(d.at + 1)}?`]) if (out.length < 3) out.push(extra)
      return out.slice(0, 3)
    }
    if (watching.value) return ['Enforce it now', 'What’s left?', TRANSFERS_SAID]
    if (!live.value.some((r) => r.spec.target === 'transfers')) return ['What’s left?', 'Undo that', TRANSFERS_SAID]
    return ['What’s left?', 'Block sign-ins from Brazil', 'Undo that']
  }

  /* ── The conversation ──────────────────────────────────────────────────────── */

  let lastSaid = ''
  const P = {
    greet: /^(hi|hello|hey|halo|hai|pagi|siang|sore|malam|selamat (pagi|siang|sore|malam))\b/,
    thanks: /\b(thanks?|thank you|makasih|terima ?kasih|trims)\b/,
    undo: /\b(undo|revert|batalkan|batal|urungkan|kembalikan|take (it|that) back)\b/,
    discard: /\b(discard|cancel|buang|lupakan|never ?mind|gak jadi|nggak jadi|tidak jadi|ga jadi|scrap)\b/,
    ruleNo: /\b(?:rule|aturan)\s*0?(\d{1,2})\b/,
    onWord: /\b(on|nyalakan|hidupkan|aktifkan|enable)\b/,
    offWord: /\b(off|matikan|nonaktifkan|disable)\b/,
    on: /\b(turn (it |this |that )?on|switch (it |this |that )?on|turn on|enable it|go live|nyalakan|hidupkan|aktifkan|jalankan|terapkan|pasang)\b|^(ok(ay)?|yes|ya|iya|setuju|gas|lanjut|sure)\.?$/,
    off: /\b(turn (it |this |that )?off|switch (it |this |that )?off|turn off|disable|matikan|nonaktifkan|hentikan|stop it)\b/,
    enforce: /\b(enforce|enforcing|start blocking|blokir sekarang|block (it )?now|tegakkan|langsung blokir|skip the hour|stop logging)\b/,
    why: /\b(why|kenapa|mengapa|how come|explain|jelaskan|alasan)\b/,
    status: /(what'?s left|what is left|\bstatus\b|apa lagi|what needs|\bsisa\b|left to do|what now|ringkas|summary|where are we)/,
    who: /\b(who|siapa|sources?|sumber|what would it (still )?(block|catch|stop)|what does it (block|catch))\b/,
    rules: /\b(list (the )?rules|which rules|what rules|rules (are )?on|aturan apa|daftar aturan|semua aturan)\b/,
    proxies: /\b(only|hanya|cuma|just)\b.{0,30}\b(prox\w*|negara|countries)\b|\b(where|dari mana) the proxies\b/,
  }

  /** The time the reply will carry: one minute after the person's line. */
  const replyAt = () => toText(toMin(desk.clock.now()) + 1)

  function respond(said: string): DeskReply | DeskReply[] {
    const t = norm(said)
    lastSaid = t
    const at = replyAt()
    const d = draft.value
    const done = (reply: DeskReply): DeskReply => ({ ...reply, after: () => (reply.after?.(), (desk.chips.value = chipsFor())) })

    if (P.thanks.test(t) && t.split(' ').length <= 4) return { text: 'You are welcome.' }
    if (P.greet.test(t) && t.split(' ').length <= 3) return { text: `Hello ${PERSON.split(' ')[0]}. Say a rule in a sentence and I will show what it would have done to the last 24 hours before anything goes live.` }

    if (P.undo.test(t)) {
      const change = changes.pop()
      if (!change) return { text: 'Nothing to undo yet.' }
      return done(undoChange(change, at))
    }

    if (P.discard.test(t)) {
      if (!d) return { text: 'There is no draft to discard.' }
      return done({
        text: `Discarded ${lower(d.name)}. Nothing of it went live.`,
        after: () => {
          retire(d, 'Discarded', at)
          changes.push({ kind: 'discard', prev: d })
          draft.value = null
        },
      })
    }

    if (P.why.test(t)) return { text: why(t) }
    if (P.status.test(t)) return { text: status() }
    if (P.rules.test(t)) return { text: rulesSummary() }

    if (P.enforce.test(t)) {
      const w = watching.value
      if (!w) return { text: d ? 'It is not on yet. Say “turn it on” first; it starts in log-only.' : 'Nothing is in log-only right now.' }
      return done({
        text: `Rule ${numberOf(w.id)} ${DOES[w.spec.action]} now. Over the last 24 hours that would have been ${n(w.effect.matched)} ${NOUN[w.spec.target]}; I will tell you if a customer network starts hitting it.`,
        after: () => applyEnforce(w, at),
      })
    }

    const numbered = P.ruleNo.exec(t)
    if (numbered && (P.onWord.test(t) || P.offWord.test(t))) {
      const row = list.value[Number(numbered[1]) - 1]
      if (!row) return { text: `There is no rule ${numbered[1]}; the list runs from 01 to ${pad(list.value.length)}.` }
      if (row.id === 'draft') return { text: `Rule ${row.no} is the draft. Say “turn it on” to start it in log-only.` }
      const on = !P.offWord.test(t)
      const rule = liveById(row.id)
      if (rule) {
        if (!on && rule.mode !== 'off') return done({ text: `Rule ${row.no} is off. Revert it from the record to bring it back.`, after: () => applyOff(rule, at) })
        return { text: `Rule ${row.no} is already ${rule.mode === 'off' ? 'off' : 'on'}.` }
      }
      if (enabled[row.id] === on) return { text: `${row.name} is already ${on ? 'on' : 'off'}.` }
      const base = baseById.get(row.id)!
      const note =
        row.id === 'r-10' && on
          ? ' Kevin switched it off at 23:12 because app 3.9 cannot answer a challenge; transfers from that app may fail again.'
          : !on && base.action !== 'log'
            ? ` That lets through what it stopped: ${n(base.matches)} requests in the last 24 hours.`
            : ''
      return done({ text: `${row.name} is ${on ? 'on' : 'off'}.${note}`, after: () => applyToggle(row.id, on, at) })
    }

    if (P.off.test(t)) {
      const rule = [...live.value].reverse().find((r) => r.mode !== 'off')
      if (!rule) return { text: d ? 'The draft is not on. Say “discard” to drop it.' : 'Nothing I turned on is running.' }
      return done({ text: `Rule ${numberOf(rule.id)} is off. Nothing else changed.`, after: () => applyOff(rule, at) })
    }

    if (P.on.test(t)) {
      if (!d) {
        const w = watching.value
        return { text: w ? `Rule ${numberOf(w.id)} is already on, in log-only until ${w.until} UTC. Say “enforce it now” to skip the hour.` : 'Nothing to turn on. Say a rule first, like “block sign-ins from Brazil”.' }
      }
      const until = toText(toMin(at) + LOG_ONLY_MINUTES)
      return done({
        text: `Rule ${draftNo()} is on in log-only. Until ${until} UTC it records the ${NOUN[d.spec.target]} it would ${d.spec.action} and lets them through; then it ${DOES[d.spec.action]}. Revert it from the record at any time.`,
        after: () => applyTurnOn(at),
      })
    }

    if (P.proxies.test(t)) {
      const attack = d?.effect.rows.filter((r) => r.kind === 'attack') ?? []
      if (!d || !attack.length) return { text: 'There are no proxies in what this rule catches. Say a rule on sign-ins first.' }
      const codes = [...new Set(attack.flatMap((r) => r.countries))]
      const spec: RuleSpec = { action: d.spec.action, target: d.spec.target, countries: { mode: 'in', codes }, except: [] }
      const next = makeDraft(spec)
      const legit = next.effect.customers + next.effect.yours
      return done({
        ...checkReply(
          next,
          `Rewritten to the ${howMany(codes.length)} countries the proxies came from: ${countryNames(codes)}. It would have ${PAST[spec.action]} ${n(next.effect.attack)} proxy sign-ins and ${legit ? `${n(legit)} legitimate ones` : 'no customer: none signed in from there'}.`,
          ['countries', 'except'],
        ),
        after: () => {
          retire(d, 'Changed', at)
          changes.push({ kind: 'edit', prev: d })
          draft.value = next
        },
      })
    }

    if (isExceptOnly(t)) {
      if (!d) return { text: 'There is no draft to add that to. Say a rule first, like “block sign-ins from Brazil”.' }
      const ex = readExcept(t)
      const spec: RuleSpec = { ...d.spec, countries: d.spec.countries && { ...d.spec.countries }, except: [...d.spec.except] }
      const added = ex.except.filter((id) => !spec.except.includes(id))
      spec.except.push(...added)
      if (ex.countries.length) withCountries(spec, ex.countries)
      if (!added.length && !ex.countries.length) {
        return { text: ex.except.length ? 'That is already left out.' : 'I could not tell what to leave out. Try “except the Jakarta office VPN” or “kecuali aplikasi”.' }
      }
      const next = makeDraft(spec)
      return done({
        ...checkReply(next, added.length ? afterExcept(d, next, added) : `Done: ${countryNames(ex.countries)} left out. It would now ${d.spec.action} ${n(next.effect.matched)} ${NOUN[spec.target]} a day.`, [ex.countries.length ? 'countries' : 'except']),
        after: () => {
          retire(d, 'Changed', at)
          changes.push({ kind: 'edit', prev: d })
          draft.value = next
        },
      })
    }

    const spec = readRule(said)
    if (spec) {
      const next = makeDraft(spec)
      const aside = d ? ` The draft for ${lower(d.name)} is set aside; nothing of it went live.` : ''
      return done({
        ...checkReply(next, `${summary(next)}${aside}`),
        after: () => {
          retire(d, 'Set aside', at)
          changes.push({ kind: 'draft', prev: d })
          draft.value = next
        },
      })
    }

    // After the rule sentences, so "block anyone who signs in from Brazil" is a rule, not a question.
    if (P.who.test(t)) return { text: sources() }

    const action = readAction(t)
    if (action && d) {
      if (action === d.spec.action) return { text: `It already ${DOES[action]}.` }
      const next = makeDraft({ ...d.spec, action })
      const caveat =
        action === 'challenge' && d.written.scope === 'api.selaras.id'
          ? ' The app and partner servers cannot answer a challenge, so a real call it caught would fail.'
          : action === 'challenge'
            ? ' Customers can pass a challenge in a browser; the app cannot.'
            : ''
      const said = next.effect.matched
        ? `Now a ${ACTIONS[action].label.toLowerCase()}: it would have ${PAST[action]} ${n(next.effect.matched)} ${NOUN[next.spec.target]} in the last 24 hours.`
        : `Now a ${ACTIONS[action].label.toLowerCase()}. Nothing in the last 24 hours fits it, so it stands guard; a block fails plainly where a challenge would fail quietly.`
      return done({
        ...checkReply(next, `${said}${next.effect.matched ? caveat : ''}`, ['action']),
        after: () => {
          retire(d, 'Changed', at)
          changes.push({ kind: 'edit', prev: d })
          draft.value = next
        },
      })
    }

    return {
      text: 'I write firewall rules from a sentence and show what they would have done to the last 24 hours before anything goes live. Try “block sign-ins from Brazil” or “except the Jakarta office VPN”.',
    }
  }

  /* ── Opening: mid-flow, the sentence said and the check on the table ───────── */

  const opening = makeDraft(OPENING_SPEC)
  draft.value = opening
  changes.push({ kind: 'draft', prev: null })
  const o = opening.effect

  const desk = useDesk({
    agent: AGENT,
    start: START,
    opening: [
      { who: AGENT, text: OPENING_CONTEXT },
      { who: 'You', mine: true, text: OPENING_SAID },
      {
        who: AGENT,
        text: `This would have blocked ${n(o.matched)} sign-ins in the last 24 hours. Only ${n(o.attack)} were last night’s proxies; the rest look like customers abroad and your Jakarta office VPN, which exits in Singapore.`,
        card: 'rule',
        data: card(opening),
      },
    ],
    chips: chipsFor(),
    respond,
  })

  /* ── Presses in the surfaces ───────────────────────────────────────────────── */

  /** The scene's time now: the latest line in the thread. */
  const now = computed(() => desk.messages.value[desk.messages.value.length - 1]?.at ?? START)

  /** Requests the rule in log-only has recorded since it went on, at this hour's rate. */
  const logged = computed(() => {
    const w = watching.value
    if (!w) return 0
    const minutes = Math.max(0, toMin(now.value) - toMin(w.since))
    return Math.round((w.effect.hourly[w.effect.hourly.length - 1] / 60) * minutes)
  })

  function turnOn() {
    const d = draft.value
    if (!d || desk.writing.value) return
    const no = draftNo()
    desk.note(`You turned on rule ${no} in log-only.`)
    const at = desk.clock.now()
    applyTurnOn(at)
    const rule = live.value[live.value.length - 1]
    desk.say({
      text: `Rule ${no} is recording, not blocking. At ${rule.until} UTC it starts to ${d.spec.action}; I will say so here, and you can revert it from the record before then.`,
      chips: chipsFor(),
    })
  }

  function enforce() {
    const w = watching.value
    if (!w || desk.writing.value) return
    desk.note(`You ended log-only for rule ${numberOf(w.id)}.`)
    applyEnforce(w, desk.clock.now())
    desk.say({ text: `Rule ${numberOf(w.id)} ${DOES[w.spec.action]} now. Revert it from the record to go back to log-only.`, chips: chipsFor() })
  }

  function discard() {
    const d = draft.value
    if (!d || desk.writing.value) return
    desk.note(`You discarded the draft for rule ${draftNo()}.`)
    retire(d, 'Discarded', desk.clock.now())
    changes.push({ kind: 'discard', prev: d })
    draft.value = null
    desk.say({ text: 'Discarded. Nothing of it went live. Say “undo that” to bring it back.', chips: chipsFor() })
  }

  /** A press on Revert in the record. */
  function revert(id: string) {
    if (desk.writing.value) return
    const seed = TRAIL_SEED.find((s) => s.id === id)
    const item = trail.value.find((t) => t.id === id)
    if (!item || item.revertedAt) return
    const index = changes.findIndex((c) => 'trail' in c && c.trail === id)
    if (index < 0 && seed?.kind !== 'toggle') return
    desk.note(`You reverted: ${item.text}.`)
    const at = desk.clock.now()
    if (index < 0 && seed?.kind === 'toggle' && seed.rule) {
      strike(id, at)
      enabled[seed.rule] = !seed.on
      toggled.add(seed.rule)
      changes.push({ kind: 'toggle', rule: seed.rule, on: !seed.on, trail: id })
      desk.say({
        text: `${nameOfRule(seed.rule)} is ${seed.on ? 'off' : 'on'} again. Kevin switched it off because app 3.9 cannot answer a challenge, so transfers from that app may fail; say “undo that” to switch it back off.`,
        chips: chipsFor(),
      })
      return
    }
    const [change] = changes.splice(index, 1)
    const reply = undoChange(change, at)
    reply.after?.()
    desk.say({ text: reply.text, card: reply.card, data: reply.data, chips: chipsFor() })
  }

  return {
    desk,
    draft,
    live,
    watching,
    logged,
    list,
    trail,
    cards,
    now,
    numberOf,
    nameOfRule,
    turnOn,
    enforce,
    discard,
    revert,
  }
}
