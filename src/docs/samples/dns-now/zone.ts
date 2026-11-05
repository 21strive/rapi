/**
 * The zone as the desk holds it: the records, every change proposed in the conversation, the trail
 * of what was done, and the propagation watches that turn resolvers over after a change lands.
 *
 * Propagation runs on the scene's clock. A watch knows when each resolver drops its cached answer;
 * the board steps from one turnover to the next (a check, then the answer), and the scene's clock
 * moves with it, so a 30 min wait plays out in seconds and the thread stays in order. The steps are
 * a chain of short timeouts that runs only while something is settling and stops on unmount.
 */
import { computed, onBeforeUnmount, reactive, ref } from 'vue'
import type { TrailItem } from '../_kit/desk'
import { planFor, type MailState, type Style } from './changes'
import {
  AGENT,
  DAY,
  RESOLVERS,
  WEB1,
  ZONE,
  fromMin,
  history,
  later,
  shape,
  startRecords,
  toMin,
  vpnPlan,
  type Change,
  type Op,
  type Probe,
  type ProbeState,
  type Rec,
  type Watch,
  type WatchPlan,
} from './data'

export interface SceneClock {
  now(): string
  next(step?: number): string
}

/** A record action, newest last, so "undo that" knows what "that" is. */
interface Done {
  kind: 'apply' | 'schedule'
  id: string
}

const TICK = 1400
const SWEEP = 900
/** The reader gets a moment with the opening before the board moves on its own. */
const FIRST_LOOK = 8000

export function useZone(
  clock: SceneClock,
  hooks: {
    settled(watch: Watch, change?: Change): void
    /** Someone is mid-exchange: hold the scene's clock so the reply keeps its time. */
    busy?(): boolean
  },
) {
  const records = ref<Rec[]>(startRecords())
  const changes = ref<Change[]>(history())
  const trail = ref<TrailItem[]>(
    changes.value.map((c) => ({ id: c.id, at: c.doneAt ?? c.at, who: c.who ?? AGENT, text: c.summary, detail: c.detail, canRevert: c.ops.length > 0 })),
  )
  const watches = ref<Watch[]>([])
  /** Records the conversation is pointing at: "what points at the old IP?". */
  const highlight = ref<string[]>([])
  /** The scene's time, for display. Actions read the clock itself. */
  const now = ref(clock.now())
  const state = reactive({
    style: 'address' as Style,
    verified: false,
    ttlLowered: false,
    /** Names the last answer was about, for "move them too". */
    lastNames: [ZONE.name, 'www'] as string[],
  })
  const done: Done[] = []
  const restoreAt = new Map<string, number>()
  let seq = 0
  let timer = 0
  let due = 0

  /* ── Reading ───────────────────────────────────────────────────────────────────── */

  const get = (id: string) => changes.value.find((c) => c.id === id)
  const session = (c: Change) => c.topic !== 'history'
  /** Waiting for a person, newest first: the newest is what "apply it" means. */
  const pending = computed(() => changes.value.filter((c) => c.status === 'pending').reverse())
  const scheduled = computed(() => changes.value.filter((c) => c.status === 'scheduled'))
  const settling = computed(() => watches.value.filter((w) => !w.settledAt))
  const pendingIds = computed(() => new Set(pending.value.flatMap((c) => c.ops.map((o) => o.id))))
  const proxiedCount = computed(() => records.value.filter((r) => r.proxied).length)

  const latest = (topic?: Change['topic'], statuses: Change['status'][] = ['pending']) =>
    [...changes.value].reverse().find((c) => session(c) && statuses.includes(c.status) && (!topic || c.topic === topic))

  /** Where the mail move stands, for its warnings. */
  const mail = computed<MailState>(() => {
    const v = latest('verify', ['pending', 'applied'])
    const t = latest('ttl', ['pending', 'applied'])
    const vw = v && watches.value.find((w) => w.key === v.id && !w.back)
    const tw = t && watches.value.find((w) => w.key === t.id && !w.back)
    return {
      verify: state.verified ? 'done' : v?.status === 'applied' ? 'settling' : v ? 'proposed' : 'none',
      verifyBy: vw?.settleBy,
      ttl: state.ttlLowered ? 'done' : t?.status === 'applied' ? 'settling' : t ? 'proposed' : 'none',
      ttlBy: tw?.settleBy,
    }
  })

  /** Commits that do harm are held, not clicked: a delete, or a mail move that would bounce mail. */
  const needsHold = (c: Change) => c.topic === 'remove' || (c.topic === 'mail' && !state.verified)

  function sync() {
    now.value = clock.now()
  }

  /* ── Changing the zone ─────────────────────────────────────────────────────────── */

  function nextId() {
    seq += 1
    return `CHG-${DAY}-${String(seq).padStart(2, '0')}`
  }

  /** A new proposal replaces the one on the same subject that is still waiting. */
  function propose(change: Change) {
    const at = clock.now()
    for (const c of changes.value) {
      if (c.status === 'pending' && c.topic === change.topic) {
        c.status = 'replaced'
        c.doneAt = at
      }
    }
    changes.value.push({ ...change, at })
    if (change.names) state.lastNames = change.names
    highlight.value = []
  }

  function writeOps(ops: Op[], back: boolean, at: string) {
    const list = [...records.value]
    for (const op of ops) {
      const from = back ? op.after : op.before
      const to = back ? op.before : op.after
      const i = list.findIndex((r) => r.id === op.id)
      if (!from && to) {
        if (i !== -1) continue
        const record: Rec = { id: op.id, ...to, touched: { kind: back ? 'edited' : 'new', at } }
        const k = restoreAt.get(op.id)
        if (k != null && k <= list.length) list.splice(k, 0, record)
        else list.unshift(record)
      } else if (from && !to) {
        if (i === -1) continue
        restoreAt.set(op.id, i)
        list.splice(i, 1)
      } else if (from && to && i !== -1) {
        // Only what this change touched goes back, so later changes to the same record survive.
        const r = { ...list[i] }
        if (from.type !== to.type) r.type = to.type
        if (from.content !== to.content) r.content = to.content
        if (from.ttl !== to.ttl) r.ttl = to.ttl
        if (from.proxied !== to.proxied) r.proxied = to.proxied
        r.touched = { kind: 'edited', at }
        list[i] = r
      }
    }
    records.value = list
  }

  /**
   * After the zone changes, a change still waiting is re-read against it: its "before" is what the
   * record is now, and what it does not touch follows the record (a TTL lowered meanwhile shows).
   */
  function rebase() {
    for (const c of changes.value) {
      if (c.status !== 'pending' && c.status !== 'scheduled') continue
      for (const op of c.ops) {
        const r = op.before && records.value.find((x) => x.id === op.id)
        if (!op.before || !r) continue
        const now = shape(r)
        if (op.after) {
          const b = op.before
          const a = { ...op.after }
          if (b.type === a.type) a.type = now.type
          if (b.content === a.content) a.content = now.content
          if (b.ttl === a.ttl) a.ttl = now.ttl
          if (b.proxied === a.proxied) a.proxied = now.proxied
          op.after = a
        }
        op.before = now
      }
    }
  }

  function apply(id: string): Change | undefined {
    const c = get(id)
    if (!c || (c.status !== 'pending' && c.status !== 'scheduled')) return
    const at = clock.now()
    const wasScheduled = c.status === 'scheduled'
    writeOps(c.ops, false, at)
    c.status = 'applied'
    c.doneAt = at
    c.when = undefined
    rebase()
    trail.value = [
      { id: c.id, at, who: AGENT, text: c.summary, detail: `${c.id} · ${c.detail}`, canRevert: true },
      ...trail.value.map((t) => (wasScheduled && t.id === `${c.id}-at` ? { ...t, canRevert: false } : t)),
    ]
    done.push({ kind: 'apply', id: c.id })
    highlight.value = c.ops.filter((o) => o.after).map((o) => o.id)
    const plan = planFor(c, state.ttlLowered)
    if (plan) watch(plan, c.id, AGENT, { sweep: true })
    return c
  }

  function revert(id: string): Change | undefined {
    const c = get(id)
    if (!c || c.status !== 'applied' || !c.ops.length) return
    const at = clock.now()
    writeOps(c.ops, true, at)
    c.status = 'reverted'
    c.doneAt = at
    rebase()
    trail.value = trail.value.map((t) => (t.id === c.id ? { ...t, revertedAt: at } : t))
    if (c.topic === 'ttl') state.ttlLowered = false
    highlight.value = c.ops.filter((o) => o.before).map((o) => o.id)
    // The change no longer stands: stop watching it spread before watching it go back.
    watches.value = watches.value.filter((w) => !(w.key === c.id && !w.back))
    const plan = planFor(c, state.ttlLowered, true)
    if (plan) watch(plan, c.id, c.who && !session(c) ? c.who : AGENT, { sweep: true, back: true })
    return c
  }

  function schedule(id: string, when = '23:00'): Change | undefined {
    const c = get(id)
    if (!c || c.status !== 'pending') return
    const at = clock.now()
    c.status = 'scheduled'
    c.when = when
    c.doneAt = at
    trail.value = [
      { id: `${c.id}-at`, at, who: AGENT, text: `Scheduled for ${when} WIB: ${c.title.charAt(0).toLowerCase()}${c.title.slice(1)}`, detail: `${c.id} · ${c.detail}`, canRevert: true },
      ...trail.value,
    ]
    done.push({ kind: 'schedule', id: c.id })
    return c
  }

  /** Back to waiting for a person: the 23:00 slot is released. */
  function unschedule(id: string): Change | undefined {
    const c = get(id)
    if (!c || c.status !== 'scheduled') return
    const at = clock.now()
    c.status = 'pending'
    c.when = undefined
    c.doneAt = at
    trail.value = trail.value.map((t) => (t.id === `${c.id}-at` ? { ...t, revertedAt: at } : t))
    return c
  }

  function discard(id: string): Change | undefined {
    const c = get(id)
    if (!c || (c.status !== 'pending' && c.status !== 'scheduled')) return
    const at = clock.now()
    if (c.status === 'scheduled') trail.value = trail.value.map((t) => (t.id === `${c.id}-at` ? { ...t, revertedAt: at } : t))
    c.status = 'discarded'
    c.doneAt = at
    return c
  }

  /** The most recent thing done in this conversation that can still be undone. */
  function lastDone(): { kind: Done['kind']; change: Change } | undefined {
    for (let i = done.length - 1; i >= 0; i--) {
      const c = get(done[i].id)
      if (!c) continue
      if (done[i].kind === 'apply' && c.status === 'applied') return { kind: 'apply', change: c }
      if (done[i].kind === 'schedule' && c.status === 'scheduled') return { kind: 'schedule', change: c }
    }
    return undefined
  }

  /* ── Propagation ───────────────────────────────────────────────────────────────── */

  function watch(plan: WatchPlan, key: string, who: string, opts: { sweep?: boolean; back?: boolean; startedAt?: string } = {}) {
    const start = toMin(clock.now())
    const probes: Probe[] = RESOLVERS.map((r, i) => {
      const stale = plan.stale[r.code]
      const timeout = plan.timeout?.code === r.code ? plan.timeout.until : undefined
      const next: ProbeState = timeout != null ? 'timeout' : stale != null ? 'stale' : 'match'
      const probe: Probe = { code: r.code, city: r.city, rtt: r.rtt, state: 'checking', next, answer: '', ms: 0, flipAt: start + (timeout ?? stale ?? 0) }
      if (!opts.sweep) land(probe, plan.expect, plan.old, i)
      return probe
    })
    const last = Math.max(start, ...probes.map((p) => p.flipAt))
    const w: Watch = {
      key,
      host: plan.host,
      type: plan.type,
      ttl: plan.ttl,
      expect: plan.expect,
      old: plan.old,
      note: plan.note,
      who,
      startedAt: opts.startedAt ?? fromMin(start),
      settleBy: fromMin(last),
      back: opts.back,
      probes,
    }
    // Newest first; keep what is still settling and a short history.
    watches.value = [w, ...watches.value.filter((x) => !x.settledAt).slice(0, 4)]
    run(opts.sweep ? SWEEP : FIRST_LOOK)
  }

  /** A probe's answer arrives: the new value, the old one still cached, or nothing. */
  function land(p: Probe, expect: string, old: string, i: number) {
    p.state = p.next ?? 'match'
    p.next = undefined
    p.answer = p.state === 'match' ? expect : p.state === 'stale' ? old : 'No answer'
    p.ms = p.state === 'timeout' ? 2000 : Math.max(3, p.rtt + ((i * 37 + p.flipAt) % 9) - 4)
  }

  /** Steps the board; a sooner request (a change just landed) replaces a later one. */
  function run(delay = TICK) {
    const at = Date.now() + delay
    if (timer && due <= at) return
    window.clearTimeout(timer)
    due = at
    timer = window.setTimeout(step, delay)
  }

  function step() {
    timer = 0
    const live = watches.value.filter((w) => !w.settledAt)
    if (!live.length) return
    let landed = false
    for (const w of live) {
      w.probes.forEach((p, i) => {
        if (p.state === 'checking') {
          land(p, w.expect, w.old, i)
          landed = true
        }
      })
    }
    if (!landed && !hooks.busy?.()) {
      // Jump the scene to the next resolver that drops its cached answer, and check it.
      const waiting = live.flatMap((w) => w.probes.filter((p) => p.state === 'stale' || p.state === 'timeout'))
      if (waiting.length) {
        const next = Math.min(...waiting.map((p) => p.flipAt))
        const at = toMin(clock.now())
        if (next > at) clock.next(next - at)
        const t = toMin(clock.now())
        for (const p of waiting) {
          if (p.flipAt <= t) {
            p.state = 'checking'
            p.next = 'match'
          }
        }
      }
    }
    sync()
    for (const w of live) {
      if (w.probes.every((p) => p.state === 'match')) {
        w.settledAt = clock.now()
        const c = get(w.key)
        // Only news that still holds: a change reverted meanwhile settles quietly.
        const holds = !c || (w.back ? c.status === 'reverted' : c.status === 'applied')
        if (c && !w.back && holds) {
          if (c.topic === 'verify') state.verified = true
          if (c.topic === 'ttl') state.ttlLowered = true
        }
        if (holds) hooks.settled(w, c)
      }
    }
    if (watches.value.some((w) => !w.settledAt)) run()
  }

  // The Then screen's moment: vpn is still turning over from Dimas's failover at 11:41.
  watch(vpnPlan(), 'H-c1', 'Dimas Pratama', { startedAt: '11:41' })

  onBeforeUnmount(() => window.clearTimeout(timer))

  /* ── Questions about the zone ──────────────────────────────────────────────────── */

  /** Records whose content mentions the text: an address, a host. */
  function pointingAt(value: string) {
    return records.value.filter((r) => r.content.toLowerCase().includes(value.toLowerCase()))
  }

  const web1Left = computed(() => records.value.filter((r) => r.content === WEB1.v4 || r.content === WEB1.v6))

  return {
    records,
    changes,
    trail,
    watches,
    highlight,
    now,
    state,
    pending,
    scheduled,
    settling,
    pendingIds,
    proxiedCount,
    mail,
    web1Left,
    get,
    latest,
    needsHold,
    nextId,
    propose,
    apply,
    revert,
    schedule,
    unschedule,
    discard,
    lastDone,
    pointingAt,
    sync,
    time: () => clock.now(),
    later: (minutes: number) => later(clock.now(), minutes),
  }
}

export type Zone = ReturnType<typeof useZone>
