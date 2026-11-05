/**
 * The cash desk's script: what Simpul understands, what it answers, and the state the surfaces
 * read. One store per screen. The thread and the surfaces both call the same actions, so a release
 * on the surface writes to the thread and the record, and a revert in the record is reflected in
 * the thread and on the surfaces.
 *
 * Simpul understands, in English and Indonesian: the dividend question and its follow-ups ("why
 * the 25th?", "what if collections slip a week?", "what about the 19th?"), moving rupiah ("kirim 25
 * miliar ke rekening pajak besok", "make it 40 miliar", "hari ini saja", "dari collections", "why
 * RTGS?"), the decisions waiting ("what needs me?", "release the payments", "approve the sweep",
 * "hedge the EUR", "make it EUR 2M"), balances ("saldo payroll?"), the buffer, FX, confirming ("ya",
 * "schedule it", "book it"), cancelling ("batal") and undoing ("undo that", "batalkan").
 */
import { computed, onBeforeUnmount, reactive } from 'vue'
import { type CheckRow, type DeskReply, type TrailItem, count, norm, useDesk } from '../_kit/desk'
import {
  type Account,
  accounts,
  bn,
  dividend,
  eurAfter,
  eurText,
  eurBeforePct,
  fx,
  fxRows,
  fixings,
  hedge,
  idrBn,
  lowDraft,
  lowPlan,
  minimumBuffer,
  money,
  morning,
  openPayments,
  openPaymentsBn,
  people,
  position,
  releaseShort,
  rp,
  scheduledPayments,
  sgdHeld,
  signedBn,
  slip,
  sweep,
  troughValue,
  troughWeek,
  week48,
  weekLabels,
} from './data'

/* ── Shapes ─────────────────────────────────────────────────────────────────────────────── */

export type CardKind = 'dividend' | 'transfer' | 'hedge' | 'release' | 'info'
export type CardStatus = 'open' | 'held' | 'done' | 'reverted' | 'replaced' | 'cancelled' | 'info'

interface Day {
  /** Day of November 2026. */
  n: number
  /** "Wed 4 Nov 2026, 08:00 WIB". */
  label: string
  hint?: string
}

interface TransferDraft {
  amount: number
  from: string
  to: string
  day: Day
  /** The person named the source account; otherwise Simpul chose it. */
  fromSaid: boolean
  ref?: string
}

export interface Card {
  id: string
  kind: CardKind
  eyebrow?: string
  title: string
  rows: CheckRow[]
  /** The commit on the card: "Schedule for 20 Nov". */
  commit?: string
  status: CardStatus
  /** The trail line its commit wrote. */
  trailId?: string
  at?: string
  transfer?: TransferDraft
  hedgeEur?: number
  dividendDay?: number
}

interface Transfer extends TransferDraft {
  ref: string
  trailId: string
  reverted: boolean
}

type Topic = 'dividend' | 'transfer' | 'payments' | 'sweep' | 'hedge' | 'fx' | 'balance' | 'none'

/* ── Accounts, days and amounts ──────────────────────────────────────────────────────────── */

const byId = (id: string) => accounts.find((a) => a.id === id) as Account
const shortBank = (bank: string) => bank.replace(/^Bank /, '').replace(/ Bank$/, '')
const accountLabel = (a: Account) => `${a.name} · ${shortBank(a.bank)} ···· ${a.number.replace(/\D/g, '').slice(-4)}`
const OPERATING_TARGET = 450e9

/** Words for each account, most specific first where two could overlap. */
const ACCOUNT_WORDS: [string, string][] = [
  ['ACC-09', 'usd concentration|concentration|konsentrasi|header account'],
  ['ACC-08', 'usd operating|rekening usd|usd account|dollar|dolar|usd'],
  ['ACC-07', 'sgd operating|sgd|singapore|singapura'],
  ['ACC-10', 'eur operating|euro|eur'],
  ['ACC-11', 'jpy operating|jpy|yen'],
  ['ACC-12', 'cny operating|cny|yuan|rmb'],
  ['ACC-04', 'tax and duties|tax & duties|pajak|tax|duties|bea'],
  ['ACC-03', 'payroll|gaji|salary|salaries'],
  ['ACC-02', 'collections?|penerimaan|koleksi'],
  ['ACC-01', 'operating|operasional|operasi|ops'],
  ['ACC-05', 'term deposit|deposito|deposit|term'],
  ['ACC-06', 'escrow|cikarang'],
]

/** The account named earliest in the text (the longest name wins a tie). */
function accountIn(text: string): string | null {
  let best: { id: string; at: number; len: number } | null = null
  for (const [id, words] of ACCOUNT_WORDS) {
    const m = new RegExp(`\\b(?:${words})\\b`).exec(text)
    if (m && (!best || m.index < best.at || (m.index === best.at && m[0].length > best.len))) {
      best = { id, at: m.index, len: m[0].length }
    }
  }
  return best?.id ?? null
}

function accountAfter(text: string, preps: string): string | null {
  const m = new RegExp(`\\b(?:${preps})\\s+(.{0,48})`).exec(text)
  return m ? accountIn(m[1]) : null
}

/** "25 miliar", "25 M", "25 bn", "25 juta", "Rp 25.000.000.000", "2,5 miliar" → rupiah. */
export function amountIn(raw: string, scaleHint = 1e9): number | null {
  const rpMatch = /rp\.?\s*([\d.]+(?:,\d+)?)/i.exec(raw)
  if (rpMatch) return Number(rpMatch[1].replace(/\./g, '').replace(',', '.')) || null
  const num = '(\\d+(?:[.,]\\d+)?)'
  const big = new RegExp(`${num}\\s*(miliar|milyar|billion|bn|b)\\b`, 'i').exec(raw) ?? new RegExp(`${num}\\s*M\\b`).exec(raw)
  if (big) return Math.round(Number(big[1].replace(',', '.')) * 1e9)
  const small = new RegExp(`${num}\\s*(juta|jt|million|mio|mn|m)\\b`, 'i').exec(raw)
  if (small) return Math.round(Number(small[1].replace(',', '.')) * 1e6)
  // "make it 40": the same scale as the draft on the table.
  const bare = /(?:make it|jadi|jadikan|ubah(?: jadi| ke)?|ganti(?: jadi| ke)?|change (?:it )?to)\s+(\d+(?:[.,]\d+)?)\b(?!\s*(?:nov|th|st|nd|rd))/i.exec(raw)
  return bare ? Math.round(Number(bare[1].replace(',', '.')) * scaleHint) : null
}

/** "EUR 2M", "2 million euro", "EUR 1,500,000". */
function eurIn(raw: string): number | null {
  const a = /eur(?:o)?\s*([\d.,]+)\s*(m|mio|million|juta|jt)?\b/i.exec(raw)
  const b = /([\d.,]+)\s*(m|mio|million|juta|jt)?\s*(?:eur|euro)\b/i.exec(raw)
  const m = a ?? b
  if (!m) return null
  const value = Number(m[1].replace(/,(?=\d{3})/g, '').replace(',', '.'))
  if (!value) return null
  return Math.round(m[2] ? value * 1e6 : value < 100 ? value * 1e6 : value)
}

const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
/** 1 Nov 2026 is a Sunday. */
const weekday = (n: number) => WEEKDAY[(n - 1) % 7]

function dayOf(n: number): Day {
  let d = n
  let hint: string | undefined
  if (weekday(d) === 'Sat' || weekday(d) === 'Sun') {
    const asked = `${weekday(d)} ${d} Nov`
    while (weekday(d) === 'Sat' || weekday(d) === 'Sun') d++
    hint = `${asked} has no clearing; moved to Monday`
  }
  if (d === 3) return { n: 3, label: 'Today, by the 15:00 WIB cut-off', hint }
  return { n: d, label: `${weekday(d)} ${d} Nov 2026, 08:00 WIB`, hint: hint ?? (d === 4 ? 'First clearing window' : undefined) }
}

const DAY_WORDS: [number, RegExp][] = [
  [3, /\b(hari ini|today|now|sekarang|siang ini)\b/],
  [5, /\b(lusa|day after tomorrow)\b/],
  [4, /\b(besok|tomorrow|bsk|rabu|wednesday)\b/],
  [5, /\b(kamis|thursday)\b/],
  [6, /\b(jum'?at|friday)\b/],
  [7, /\b(sabtu|saturday)\b/],
  [8, /\b(minggu|sunday)\b/],
  [9, /\b(senin|monday)\b/],
]

function dayIn(text: string): number | null {
  const explicit = /\b(?:tanggal|tgl|the|on)\s+(\d{1,2})(?:st|nd|rd|th)?\b|\b(\d{1,2})(?:st|nd|rd|th)\b|\b(\d{1,2})\s+nov(?:ember)?\b/.exec(text)
  if (explicit) {
    const n = Number(explicit[1] ?? explicit[2] ?? explicit[3])
    if (n >= 1 && n <= 30) return n
  }
  for (const [n, re] of DAY_WORDS) if (re.test(text)) return n
  return null
}

function railFor(amount: number, from: Account, to: Account) {
  if (from.bank === to.bank) return { rail: 'Book transfer', hint: `Both at ${from.bank}; settles at once` }
  if (amount <= 250e6) return { rail: 'BI-FAST', hint: 'Up to IDR 250 million; arrives in seconds, Rp 2.500' }
  if (amount <= 1e9) return { rail: 'SKNBI', hint: 'Up to IDR 1 bn; clears in the next batch, Rp 2.900' }
  return { rail: 'BI-RTGS', hint: 'Over the IDR 1 bn SKNBI limit; settles in real time' }
}

const minus = (text: string) => text.replace(/-/g, '−')
const r1 = (v: number) => bn(v)

/* ── The desk ─────────────────────────────────────────────────────────────────────────────── */

export function useTreasuryDesk() {
  const state = reactive({
    dividend: 'draft' as 'draft' | 'scheduled' | 'dropped',
    /** The day of November the dividend draft or schedule is on. */
    dividendDay: 20,
    payments: 'awaiting' as 'awaiting' | 'released',
    paymentsAt: '',
    paymentsTrail: '',
    sweep: 'pending' as 'pending' | 'approved',
    sweepAt: '',
    sweepTrail: '',
    hedge: 'proposed' as 'proposed' | 'booked' | 'dealt',
    hedgeEur: hedge.eur,
    hedgeAt: '',
    hedgeTrail: '',
    bremerMoved: true,
    sgdHeld: true,
    transfers: [] as Transfer[],
    /** The account the conversation is about, marked on the cash wall. */
    selected: null as string | null,
    trail: morning.map((t) => ({ ...t })) as TrailItem[],
    cards: {} as Record<string, Card>,
    cardOrder: [] as string[],
    /** Seconds left to undo, by trail id. */
    windows: {} as Record<string, number>,
    topic: 'dividend' as Topic,
    /** Trail ids of what was done in this conversation, oldest first: what "undo that" undoes. */
    session: [] as string[],
  })

  let seq = 0
  let refSeq = 32

  const desk = useDesk({
    agent: 'Simpul',
    start: '10:41',
    opening: [{ who: 'You', mine: true, text: 'Can we pay the dividend on the 20th without dipping under the floor?' }],
    respond,
    delay: 700,
  })

  /* ── Undo windows: a chain of one-second timeouts per action, cleared on leave ─────────── */

  const timers = new Map<string, number>()
  function openWindow(id: string, seconds: number, onEnd?: () => void) {
    closeWindow(id)
    state.windows[id] = seconds
    const tick = () => {
      const left = (state.windows[id] ?? 0) - 1
      if (left <= 0) {
        delete state.windows[id]
        timers.delete(id)
        onEnd?.()
        return
      }
      state.windows[id] = left
      timers.set(id, window.setTimeout(tick, 1000))
    }
    timers.set(id, window.setTimeout(tick, 1000))
  }
  function closeWindow(id: string) {
    window.clearTimeout(timers.get(id))
    timers.delete(id)
    delete state.windows[id]
  }
  onBeforeUnmount(() => timers.forEach((t) => window.clearTimeout(t)))

  /* ── Cards ──────────────────────────────────────────────────────────────────────────── */

  function makeCard(card: Omit<Card, 'id' | 'status'> & { status?: CardStatus }): Card {
    return { ...card, id: `card-${++seq}`, status: card.status ?? (card.kind === 'info' ? 'info' : 'open') }
  }

  /** Puts a card on the table: an older open draft of the same kind is replaced by it. */
  function place(card: Card) {
    for (const id of state.cardOrder) {
      const other = state.cards[id]
      if (other.kind === card.kind && other.status === 'open' && card.kind !== 'info') other.status = 'replaced'
    }
    state.cards[card.id] = card
    state.cardOrder.push(card.id)
    if (card.kind === 'dividend' && card.dividendDay) state.dividendDay = card.dividendDay
  }

  function reply(text: string, card?: Card, after?: () => void): DeskReply {
    return {
      text,
      card: card ? 'check' : undefined,
      data: card ? { id: card.id } : undefined,
      after: () => {
        if (card) place(card)
        after?.()
        desk.chips.value = contextChips()
      },
    }
  }

  const openCards = computed(() =>
    state.cardOrder.map((id) => state.cards[id]).filter((c) => c.kind !== 'info' && cardStatus(c) === 'open'),
  )
  /** The newest open draft: the one with the brand commit. */
  const latestOpen = computed(() => openCards.value[openCards.value.length - 1] ?? null)
  const openOf = (kind: CardKind) => [...openCards.value].reverse().find((c) => c.kind === kind) ?? null

  /** A release card follows the payments themselves, wherever they were released. */
  function cardStatus(card: Card): CardStatus {
    if (card.kind !== 'release' || card.status === 'replaced' || card.status === 'cancelled') return card.status
    if (state.payments === 'awaiting') return 'open'
    return state.windows[state.paymentsTrail] ? 'held' : 'done'
  }

  /* ── The record ─────────────────────────────────────────────────────────────────────── */

  function record(item: Omit<TrailItem, 'at'>) {
    state.trail.unshift({ ...item, at: desk.clock.now() })
    state.session.push(item.id)
  }
  const trailItem = (id: string) => state.trail.find((t) => t.id === id)

  /* ── Actions: the same for the thread and the surfaces ───────────────────────────────── */

  function scheduleDividend(card: Card) {
    const id = `dividend-${++seq}`
    state.dividend = 'scheduled'
    state.dividendDay = card.dividendDay ?? 20
    card.status = 'held'
    card.trailId = id
    card.at = desk.clock.now()
    record({
      id,
      who: people.you,
      text: `Scheduled the Q3 dividend for ${card.dividendDay === 19 ? 'Thu 19' : 'Fri 20'} Nov`,
      detail: `${dividend.id} · ${rp(dividend.amount)} · 1 of 2 signed`,
      canRevert: true,
    })
    openWindow(id, 10, () => card.status === 'held' && (card.status = 'done'))
  }

  function moveMoney(card: Card) {
    const draft = card.transfer
    if (!draft) return
    const id = `transfer-${++seq}`
    const ref = `TRF-261104${++refSeq}`
    state.transfers.push({ ...draft, ref, trailId: id, reverted: false })
    card.status = 'held'
    card.trailId = id
    card.at = desk.clock.now()
    const to = byId(draft.to)
    record({
      id,
      who: people.you,
      text: `Moved ${rp(draft.amount)} to ${to.name}`,
      detail: `${ref} · ${draft.day.n === 3 ? 'today' : `value ${draft.day.n} Nov 08:00 WIB`} · ${railFor(draft.amount, byId(draft.from), to).rail}`,
      canRevert: true,
    })
    openWindow(id, 10, () => card.status === 'held' && (card.status = 'done'))
  }

  function bookHedge(card: Card | null) {
    const eur = card?.hedgeEur ?? state.hedgeEur
    const id = `hedge-${++seq}`
    state.hedge = 'booked'
    state.hedgeEur = eur
    state.hedgeAt = desk.clock.now()
    state.hedgeTrail = id
    if (card) {
      card.status = 'held'
      card.trailId = id
      card.at = desk.clock.now()
    }
    record({
      id,
      who: people.you,
      text: `Sold ${eurText(eur)} forward to 4 Dec`,
      detail: `${hedge.id} · ${bn(hedge.rate, 0)} · sending to ${hedge.bank}`,
      canRevert: true,
    })
    // Once it reaches the bank's desk the trade is dealt: a button cannot take it back.
    openWindow(id, 10, () => {
      state.hedge = 'dealt'
      const line = trailItem(id)
      if (line && !line.revertedAt) {
        line.canRevert = false
        line.detail = `${hedge.id} · ${bn(hedge.rate, 0)} · dealt with ${hedge.bank}`
      }
      if (card?.status === 'held') card.status = 'done'
      desk.chips.value = contextChips()
    })
  }

  function releasePayments() {
    if (state.payments === 'released') return
    const id = `payments-${++seq}`
    state.payments = 'released'
    state.paymentsAt = desk.clock.now()
    state.paymentsTrail = id
    record({
      id,
      who: people.you,
      text: `Released ${openPayments.length} payments`,
      detail: `${openPayments.map((p, i) => (i ? `-${p.id.slice(-2)}` : p.id)).join(', ')} · ${idrBn(openPaymentsBn, 2)} eq.`,
      canRevert: true,
    })
    openWindow(id, 10)
  }

  function approveSweep() {
    if (state.sweep === 'approved') return
    const id = `sweep-${++seq}`
    state.sweep = 'approved'
    state.sweepAt = desk.clock.now()
    state.sweepTrail = id
    record({
      id,
      who: people.you,
      text: 'Approved the USD sweep',
      detail: `${money(sweep.amount, 'USD')} · ${sweep.from} to ${sweep.to} · ${sweep.at}`,
      canRevert: true,
    })
    openWindow(id, 10)
  }

  /** What taking an action back means, said before it is done. */
  function undoText(id: string): string {
    if (id.startsWith('dividend')) return `The dividend is back on ${dividend.planned} and the forecast with it.`
    if (id.startsWith('transfer')) {
      const t = state.transfers.find((x) => x.trailId === id)
      const from = t ? byId(t.from) : null
      return t && from ? `${t.ref} is cancelled before it was sent; ${from.name} keeps ${rp(from.balance)}.` : 'The transfer is cancelled.'
    }
    if (id.startsWith('payments')) return `The ${openPayments.length} payments wait for you again under Needs you.`
    if (id.startsWith('sweep')) return 'The USD sweep waits for you again.'
    if (id.startsWith('hedge')) return `Stopped before it reached ${hedge.bank}: no forward was booked.`
    if (id === 'bremer') {
      return `Bremer Lift goes back to Sat 7 Nov 09:00 WIB. ${hedge.bank} does not settle on Saturdays, so it would land Mon 9 Nov, two days late.`
    }
    if (id === 'sgd-held') {
      return `The SGD sweep runs at 17:00 SGT: ${money(sgdHeld, 'SGD')} converts to USD tonight, and Meridian Port's SGD 312,480.00 on 6 Nov converts back.`
    }
    return ''
  }

  /** Takes an action back. The line stays in the record, struck through. */
  function rollback(id: string) {
    const line = trailItem(id)
    if (!line || line.revertedAt || !line.canRevert) return
    closeWindow(id)
    line.revertedAt = desk.clock.now()
    const card = state.cardOrder.map((c) => state.cards[c]).find((c) => c.trailId === id && c.kind !== 'release')
    // Inside its undo window the draft comes back to be pressed again; later it stays decided.
    if (card) {
      card.status = card.status === 'held' ? 'open' : 'reverted'
      if (card.status === 'open') card.trailId = undefined
    }
    if (id.startsWith('dividend')) state.dividend = card?.status === 'open' ? 'draft' : 'dropped'
    else if (id.startsWith('transfer')) {
      const t = state.transfers.find((x) => x.trailId === id)
      if (t) t.reverted = true
    } else if (id.startsWith('payments')) state.payments = 'awaiting'
    else if (id.startsWith('sweep')) state.sweep = 'pending'
    else if (id.startsWith('hedge')) state.hedge = 'proposed'
    else if (id === 'bremer') state.bremerMoved = false
    else if (id === 'sgd-held') state.sgdHeld = false
  }

  /** From a surface (the hold, an Approve, Undo, Revert): a quiet line in the thread, then the act. */
  function fromSurface(note: string, act: () => void) {
    desk.note(note)
    act()
    desk.chips.value = contextChips()
  }

  const surface = {
    releasePayments: () =>
      fromSurface(`You released ${openPayments.length} payments · ${idrBn(openPaymentsBn, 2)} eq.`, releasePayments),
    approveSweep: () => fromSurface(`You approved the USD sweep · ${money(sweep.amount, 'USD')} at ${sweep.at}`, approveSweep),
    bookHedge: () =>
      fromSurface(`You booked the EUR forward · ${eurText(state.hedgeEur)} at ${bn(hedge.rate, 0)}`, () =>
        bookHedge(openOf('hedge')),
      ),
    /** Undo inside the window, or Revert in the record. Simpul says what it means when it matters. */
    revert(id: string) {
      const line = trailItem(id)
      if (!line || line.revertedAt || !line.canRevert) return
      const said = undoText(id)
      desk.note(`You reverted: ${line.text.charAt(0).toLowerCase()}${line.text.slice(1)}`)
      rollback(id)
      if (id === 'bremer' || id === 'sgd-held') desk.say({ text: said })
      desk.chips.value = contextChips()
    },
    /** The brand commit on a card in the thread. */
    commit(card: Card) {
      if (card.status !== 'open') return
      desk.say(confirmReply(card))
    },
    /** The hold on a release card in the thread. */
    release(card: Card) {
      if (state.payments === 'released') return
      fromSurface(`You released ${openPayments.length} payments · ${idrBn(openPaymentsBn, 2)} eq.`, () => {
        releasePayments()
        card.trailId = state.paymentsTrail
      })
    },
    change(card: Card) {
      const ask: Record<string, DeskReply> = {
        dividend: {
          text: `The amount is fixed by the board resolution of ${dividend.board}; the day can move. Any day from 16 to 25 Nov gives the same low on the 25th.`,
          chips: ['What about the 19th?', 'Keep it on 2 Dec'],
        },
        transfer: {
          text: 'What should change: the amount, the account or the day?',
          chips: ['Make it 40 miliar', 'Dari collections', 'Hari ini saja'],
        },
        hedge: { text: 'The amount or the date can change. A bigger forward takes more of the EUR off the limit.', chips: ['Make it EUR 2M', 'Make it EUR 1M'] },
      }
      desk.say(ask[card.kind] ?? { text: 'What should change?' })
    },
  }

  /* ── Replies ─────────────────────────────────────────────────────────────────────────── */

  function confirmReply(card: Card): DeskReply {
    if (card.kind === 'dividend') {
      return reply(
        `Scheduled as ${dividend.id} for ${card.dividendDay === 19 ? 'Thu 19 Nov' : 'Fri 20 Nov'} 09:00 WIB. It waits for ${people.cfo}'s signature, and the forecast now carries it.`,
        undefined,
        () => scheduleDividend(card),
      )
    }
    if (card.kind === 'transfer' && card.transfer) {
      const t = card.transfer
      return reply(
        t.day.n === 3
          ? `Sent for today by ${railFor(t.amount, byId(t.from), byId(t.to)).rail}. ${byId(t.to).name} has it before the 15:00 WIB cut-off.`
          : `Scheduled for ${t.day.label.replace(' 2026, ', ' ')}. The money stays in ${byId(t.from).name} until then.`,
        undefined,
        () => moveMoney(card),
      )
    }
    if (card.kind === 'hedge') {
      return reply(
        `Booking ${eurText(card.hedgeEur ?? hedge.eur)} at ${bn(hedge.rate, 0)} to 4 Dec with ${hedge.bank}. It goes to their desk in 10 seconds; after that it is a trade, not a draft.`,
        undefined,
        () => bookHedge(card),
      )
    }
    return reply('Releasing money takes the hold: press and hold the button on the card, or under Needs you.')
  }

  function dividendCard(day: 19 | 20 = 20) {
    const op = byId('ACC-01')
    return makeCard({
      kind: 'dividend',
      eyebrow: 'Dividend · draft',
      title: `Pay the Q3 dividend on ${day === 20 ? 'Fri 20 Nov' : 'Thu 19 Nov'}`,
      rows: [
        { label: 'Amount', value: rp(dividend.amount), mono: true, inferred: true, hint: `Board resolution, ${dividend.board}` },
        { label: 'From', value: accountLabel(op), inferred: true },
        { label: 'Value date', value: day === 20 ? dividend.value : 'Thu 19 Nov 2026, 09:00 WIB', hint: `Was ${dividend.planned}` },
        {
          label: 'Lowest day',
          value: `${r1(lowDraft.level)} bn on ${lowDraft.day}`,
          hint: `${signedBn(lowDraft.level - minimumBuffer)} over the ${bn(minimumBuffer, 0)} buffer`,
        },
        { label: 'Signatures', value: `You, then ${people.cfo}`, inferred: true, hint: '2 of 4 above IDR 50 bn' },
      ],
      commit: `Schedule for ${day} Nov`,
      dividendDay: day,
    })
  }

  function transferCard(t: TransferDraft) {
    const from = byId(t.from)
    const to = byId(t.to)
    const after = from.balance - t.amount
    const rail = railFor(t.amount, from, to)
    const two = t.amount > 50e9
    const afterHint =
      from.id === 'ACC-01'
        ? after >= OPERATING_TARGET
          ? `Above its ${bn(OPERATING_TARGET / 1e9, 0)} bn target`
          : `${bn((OPERATING_TARGET - after) / 1e9)} bn under target until the 16:00 sweep`
        : undefined
    return makeCard({
      kind: 'transfer',
      eyebrow: 'Transfer · draft',
      title: `Move ${rp(t.amount)} to ${to.name}`,
      rows: [
        {
          label: 'From',
          value: accountLabel(from),
          inferred: !t.fromSaid,
          hint: t.fromSaid ? undefined : from.id === 'ACC-01' ? 'The one rupiah account above its target' : 'It sweeps to Operating at 16:00',
        },
        { label: 'To', value: accountLabel(to) },
        { label: 'Value date', value: t.day.label, hint: t.day.hint },
        { label: 'Rail', value: rail.rail, inferred: true, hint: rail.hint },
        { label: `${from.name} after`, value: rp(after), mono: true, hint: afterHint },
        {
          label: 'Signatures',
          value: two ? `You, then ${people.cfo}` : 'You',
          inferred: true,
          hint: two ? '2 of 4 above IDR 50 bn' : '1 of 4 under IDR 50 bn',
        },
      ],
      commit: `Move ${rp(t.amount)}`,
      transfer: t,
    })
  }

  function hedgeCard(eur = state.hedgeEur) {
    const after = eurAfter(eur)
    return makeCard({
      kind: 'hedge',
      eyebrow: 'FX hedge · proposal',
      title: `Sell ${eurText(eur)} forward to Fri 4 Dec`,
      rows: [
        { label: 'EUR now', value: `${eurBeforePct}% of its limit`, hint: `USD ${bn(hedge.before)}M eq. against USD ${hedge.limit}M` },
        { label: 'Rate', value: bn(hedge.rate, 0), mono: true, inferred: true, hint: `Fixing ${bn(fx.EUR, 0)} plus ${hedge.points} forward points` },
        { label: 'With', value: hedge.bank, inferred: true, hint: 'Holds the EUR operating account' },
        { label: 'On 4 Dec', value: rp(eur * hedge.rate), mono: true, hint: 'Rupiah received for the euros' },
        { label: 'EUR after', value: `${after.pct}% of its limit`, hint: `USD ${bn(after.value)}M eq.` },
      ],
      commit: 'Book the forward',
      hedgeEur: eur,
    })
  }

  function releaseCard() {
    return makeCard({
      kind: 'release',
      eyebrow: 'Payments · 4–9 Nov',
      title: `Release ${openPayments.length} payments, ${idrBn(openPaymentsBn, 2)} eq.`,
      rows: openPayments.map((p) => ({
        label: releaseShort(p, state.bremerMoved),
        value: money(p.amount, p.currency),
        mono: true,
        hint: p.payee,
      })),
      commit: 'Hold to release',
    })
  }

  const info = (title: string, rows: CheckRow[], eyebrow?: string) => makeCard({ kind: 'info', title, rows, eyebrow })

  /** Suggestions that fit what is on the table now, minus questions already asked. */
  function contextChips(): string[] {
    const said = new Set(desk.messages.value.filter((m) => m.mine && m.text).map((m) => norm(m.text as string)))
    const fresh = (list: string[]) => list.filter((c) => !said.has(norm(c)) || /^(what needs me|undo that)/i.test(c))
    const open = latestOpen.value
    if (open?.kind === 'dividend') {
      return fresh(['Why the 25th?', 'What if collections slip a week?', 'Kirim 25 miliar ke rekening pajak besok', 'What needs me?', 'Schedule it']).slice(0, 4)
    }
    if (open?.kind === 'transfer' && open.transfer) {
      const t = open.transfer
      const small = t.amount < 1e9
      const rail = railFor(t.amount, byId(t.from), byId(t.to)).rail
      return fresh([
        small ? (t.amount >= 40e6 ? 'Make it 25 juta' : 'Make it 40 juta') : t.amount >= 40e9 ? 'Make it 25 miliar' : 'Make it 40 miliar',
        rail === 'Book transfer' ? 'Why a book transfer?' : `Why ${rail.replace('BI-', '')}?`,
        t.day.n === 3 ? 'Besok saja' : 'Hari ini saja',
        'Batal',
      ])
    }
    if (open?.kind === 'hedge') return fresh(['Book it', 'Why now?', open.hedgeEur === 2e6 ? 'Make it EUR 1.5M' : 'Make it EUR 2M', 'Batal'])
    if (open?.kind === 'release') return fresh(['Why these four?', 'What needs me?'])
    const chips: string[] = []
    const last = state.session[state.session.length - 1]
    const lastLine = last ? trailItem(last) : null
    if (lastLine && !lastLine.revertedAt && lastLine.canRevert) chips.push('Undo that')
    if (state.payments === 'awaiting') chips.push('Release the payments')
    if (state.sweep === 'pending') chips.push('Approve the sweep')
    if (state.hedge === 'proposed') chips.push('Hedge the EUR')
    if (!state.transfers.some((t) => !t.reverted)) chips.push('Kirim 25 miliar ke rekening pajak besok')
    if (chips.length < 4) chips.push('What needs me?')
    if (chips.length < 4 && state.dividend !== 'scheduled') chips.push('Saldo payroll?')
    return chips.slice(0, 4)
  }

  /* ── Understanding ───────────────────────────────────────────────────────────────────── */

  const YES = /^(ya|iya|yes|yep|yup|ok|oke|okay|okey|sure|go|go ahead|do it|lanjut(kan)?|gas|jalan(kan)?|setuju|confirm|konfirmasi|benar|betul|sip|schedule it( anyway)?|jadwalkan( saja| aja)?|book it|move it|send it|kirim(kan)?( saja| aja)?|that'?s right|please do)\b/
  const CANCEL = /\b(batal|cancel|hapus|delete|discard|gak jadi|ga jadi|nggak jadi|ngga jadi|tidak jadi|never ?mind|jangan|keep it on 2 dec|tetap(kan)? 2 des)\b/
  const UNDO = /\b(undo|revert|batalkan|urungkan|balikin|kembalikan|take it back)\b/
  const WHY = /\b(why|kenapa|mengapa|knp|alasan(nya)?|how come|explain|jelaskan)\b/

  function respond(said: string): DeskReply | DeskReply[] {
    const t = norm(said)

    if (UNDO.test(t) || CANCEL.test(t)) return undoOrCancel(t)
    if (WHY.test(t)) return why(t)
    if (/\b(what if|kalau|gimana kalau|bagaimana (kalau|jika)|jika|if)\b/.test(t) && /(collection|tagihan|piutang|receipt|penerimaan|slip|telat|late|mundur|terlambat)/.test(t)) {
      return slipReply()
    }

    const amount = amountIn(said, latestOpen.value?.transfer && latestOpen.value.transfer.amount < 1e9 ? 1e6 : 1e9)
    const moving = /\b(kirim\w*|transfer\w*|pindah\w*|move|send|top ?up|isi|tambah\w*|setor\w*)\b/.test(t)
    const named = accountAfter(t, 'ke|to|into|untuk')
    if (amount && (moving || (named && !latestOpen.value?.transfer))) return moveReply(t, amount)
    if (moving && !amount && named) {
      return reply(`How much should go to ${byId(named).name}? Try “Kirim 25 miliar ke rekening pajak besok”.`)
    }

    const change = changeReply(said, t, amount)
    if (change) return change

    if (YES.test(t) && !amount) return commitReply()
    if (/\b(release|rilis|lepas|approve|setujui|bayar|pay)\b/.test(t) && /\b(payments?|pembayaran|semua|all|them|four|empat|tagihan|4)\b/.test(t)) {
      return releaseReply()
    }
    if (/^(release|rilis|lepas)\b/.test(t)) return releaseReply()
    if (/\b(sweeps?|sapu)\b/.test(t)) return sweepReply(/\b(approve|setujui|ok|oke|jalankan|run|go)\b/.test(t))
    if (/\b(saldo|balance|berapa|how much|isi|holds?)\b/.test(t) && accountIn(t)) return balanceReply(accountIn(t) as string)
    if (/\b(hedg\w*|lindung\w*|forwards?|eur|euro)\b/.test(t)) return hedgeReply()
    if (/\b(fx|exposure|eksposur|limits?|kurs|fixing|currenc(y|ies)|valas)\b/.test(t)) return fxReply()
    if (/\b(need|needs|perlu|left|sisa|tunggu|waiting|pending|status|to.?do|belum|what now|apa lagi|ada apa)\b/.test(t) || /^(approve|setujui)\b/.test(t)) {
      return needsReply()
    }
    if (/\b(buffer|floor|batas|minimum|penyangga|cadangan)\b/.test(t)) return bufferReply()
    if (/\b(dividen\w*)\b/.test(t)) return dividendReply()
    if (/\b(total|cash|kas|posisi|position|liquidity|likuiditas)\b/.test(t)) return totalReply()
    if (accountIn(t)) return balanceReply(accountIn(t) as string)
    if (/^(hi|hello|halo|hai|pagi|selamat (pagi|siang)|morning)\b/.test(t)) {
      return reply(`Morning, Ayu. ${needsCount()} waiting for you${openOf('dividend') ? '; the dividend draft is in this thread' : ''}.`)
    }
    if (/\b(thank|thanks|thx)\b/.test(t)) return reply('You are welcome.')
    if (/\b(makasih|terima kasih|tq|trims)\b/.test(t)) return reply('Sama-sama.')
    return reply(
      'I can answer from the accounts and the forecast, move rupiah between accounts, release payments, approve the sweep or hedge. Try “Kirim 25 miliar ke rekening pajak besok”.',
    )
  }

  function needsCount() {
    const n = (state.payments === 'awaiting' ? 1 : 0) + (state.sweep === 'pending' ? 1 : 0) + (state.hedge === 'proposed' ? 1 : 0)
    return n ? `${count(n, 'decision')} are` : 'Nothing is'
  }

  function undoOrCancel(t: string): DeskReply {
    const open = latestOpen.value
    const lastId = state.session[state.session.length - 1]
    const last = lastId ? trailItem(lastId) : null
    const lastLive = last && !last.revertedAt ? last : null
    const cancelFirst = CANCEL.test(t) && !UNDO.test(t)
    if (open && (cancelFirst || !lastLive)) {
      return reply(cancelText(open), undefined, () => {
        open.status = 'cancelled'
        if (open.kind === 'dividend' && state.dividend === 'draft') state.dividend = 'dropped'
      })
    }
    if (lastLive && !lastLive.canRevert) {
      return reply(
        `That forward is dealt with ${hedge.bank}, so a button cannot take it back. Reversing it means booking the opposite trade, which waits for you like this one did.`,
      )
    }
    if (lastLive) return reply(`Undone. ${undoText(lastLive.id)}`, undefined, () => rollback(lastLive.id))
    return reply('Nothing you did here is waiting to be undone. Simpul’s own changes each have a Revert under Done by Simpul.')
  }

  function cancelText(card: Card) {
    if (card.kind === 'dividend') return `Cancelled. The dividend stays on ${dividend.planned}.`
    if (card.kind === 'hedge') return 'Cancelled. No forward was booked.'
    if (card.kind === 'release') return 'Cancelled. The payments still wait under Needs you.'
    return 'Cancelled. Nothing moved.'
  }

  function why(t: string): DeskReply {
    if (/rtgs|rail|fast|skn|book transfer/.test(t)) return railsReply()
    if (/\b(25|25th|tight|ketat|low|rendah)\b/.test(t)) return w48Reply()
    if (/\b(operating|operasional|from|dari)\b/.test(t)) return whyOperating()
    if (/\b(sweeps?|sapu)\b/.test(t)) return sweepReply(false)
    if (/\b(hedg\w*|forwards?|eur|euro|now|sekarang)\b/.test(t) && state.topic !== 'transfer') return whyHedge()
    if (/\b(payments?|pembayaran|four|empat)\b/.test(t)) return whyPayments()
    if (state.topic === 'balance' && state.selected === 'ACC-03') {
      return reply(
        'Payroll is low by design this early in the month: Operating funds it on Tue 24 Nov with IDR 126.4 bn, the day before salaries go out. Topping it up now would only park cash where it earns nothing.',
        undefined,
        () => (state.selected = 'ACC-03'),
      )
    }
    switch (state.topic) {
      case 'transfer':
        return railsReply()
      case 'payments':
        return whyPayments()
      case 'hedge':
      case 'fx':
        return whyHedge()
      case 'sweep':
        return sweepReply(false)
      default:
        return w48Reply()
    }
  }

  function w48Reply(): DeskReply {
    state.topic = 'dividend'
    return reply(
      `Payroll leaves Operating on Tue 24 Nov and the supplier run on Wed 25 Nov; month-end collections only arrive from the 26th. The chart plots weekly closes, so W48 reads ${r1(week48[4].level)} while the 25th dips to ${r1(lowDraft.level)}.`,
      info(
        'W48 day by day, dividend on 20 Nov',
        week48.map((d) => ({
          label: d.day,
          value: `${r1(d.level)} bn`,
          mono: true,
          hint: d.flow ? `${d.note} ${signedBn(d.flow)}${d.day === lowDraft.day ? ' · lowest day' : ''}` : 'After the dividend on Friday',
        })),
        'The working',
      ),
    )
  }

  function slipReply(): DeskReply {
    state.topic = 'dividend'
    const under = slip.under
    return reply(
      `Then the low moves to ${slip.low.day}, when the tax instalment goes: ${r1(slip.low.level)} bn, ${bn(minimumBuffer - slip.low.level)} under the buffer until the 3 Dec receipts. Drawing ${idrBn(slip.draw)} on the revolving facility for those ${slip.nights} nights covers it.`,
      info(
        'If month-end collections slip a week',
        [
          { label: 'Lowest day', value: `${r1(slip.low.level)} bn on ${slip.low.day}`, hint: minus(`${signedBn(slip.low.level - minimumBuffer)} against the buffer`) },
          { label: 'Under the buffer', value: `${under[0].day} to ${under[under.length - 1].day}`, hint: `${under.length} days` },
          { label: 'Cover', value: `Draw ${idrBn(slip.draw)} on the facility`, inferred: true, hint: `${bn(position.undrawn)} undrawn; repay on 3 Dec` },
          { label: 'Cost', value: rp(slip.interest), mono: true, hint: `${bn(slip.rate, 2)}% for ${slip.nights} nights` },
        ],
        'What if',
      ),
    )
  }

  function railsReply(): DeskReply {
    state.topic = 'transfer'
    const open = latestOpen.value?.transfer ?? state.transfers[state.transfers.length - 1]
    if (!open) {
      return reply(
        'Rupiah moves by BI-FAST up to IDR 250 million, by SKNBI up to IDR 1 bn, and by BI-RTGS above that or when it must settle at once.',
      )
    }
    const from = byId(open.from)
    const to = byId(open.to)
    const chosen = railFor(open.amount, from, to).rail
    const text =
      chosen === 'BI-RTGS'
        ? `${rp(open.amount)} is over the BI-FAST limit of IDR 250 million and the SKNBI limit of IDR 1 bn, so it goes by BI-RTGS: settled one by one, in real time, between ${from.bank} and ${to.bank}.`
        : chosen === 'Book transfer'
          ? `Both accounts are at ${from.bank}, so it is a book transfer inside the bank: no clearing, no fee.`
          : `${rp(open.amount)} fits ${chosen}, the cheapest rail that carries it.`
    return reply(
      text,
      info(
        `Rails for ${rp(open.amount)}`,
        [
          { label: 'BI-FAST', value: 'Up to IDR 250 million', hint: 'Seconds, Rp 2.500', inferred: chosen === 'BI-FAST' },
          { label: 'SKNBI', value: 'Up to IDR 1 bn', hint: 'Next clearing batch, Rp 2.900', inferred: chosen === 'SKNBI' },
          { label: 'BI-RTGS', value: 'Any amount', hint: 'Real time until 15:00 WIB, Rp 30.000', inferred: chosen === 'BI-RTGS' },
        ],
        'Why this rail',
      ),
    )
  }

  function whyOperating(): DeskReply {
    state.topic = 'transfer'
    const op = byId('ACC-01')
    return reply(
      `Operating is the one rupiah account above its target: ${r1(op.idr / 1e9)} bn against ${bn(OPERATING_TARGET / 1e9, 0)}. Collections empties into it at 16:00 every day, so it is refilled tonight.`,
      undefined,
      () => (state.selected = 'ACC-01'),
    )
  }

  function whyPayments(): DeskReply {
    state.topic = 'payments'
    const invoices: Record<string, [string, string]> = {
      'PAY-26110412': ['INV/SAK/2610/0412', '2023'],
      'PAY-26110421': ['MPS-INV-88213', '2024'],
      'PAY-26110424': ['RE-2026-11-0457', '2025'],
      'PAY-26110427': ['INV/CRD/X/2026/118', '2024'],
    }
    return reply(
      `Each is due by 9 Nov and matches its invoice and purchase order; none of the payee bank accounts has changed since it was last paid. ${scheduledPayments.map((p) => p.payee.replace(/ Co\., Ltd\.$/, '')).join(' and ')} are already approved.`,
      info(
        'What I checked at 09:12',
        openPayments.map((p) => ({
          label: p.payee.replace(/^PT /, '').replace(/ (Pte\. Ltd\.|GmbH)$/, ''),
          value: invoices[p.id]?.[0] ?? p.id,
          mono: true,
          hint: `Payee bank unchanged since ${invoices[p.id]?.[1] ?? '2024'}`,
        })),
        'The check',
      ),
    )
  }

  function whyHedge(): DeskReply {
    state.topic = 'hedge'
    const eurOpen = (hedge.before * 1e6) / (fx.EUR / fx.USD)
    const loss = (eurOpen * fx.EUR * 0.02) / 1e9
    return reply(
      `The euros from the Hamburg contracts land on 4 Dec, and EUR is at ${eurBeforePct}% of its limit. A 2% fall in EUR/IDR before then would cost about ${idrBn(loss, 1)}; the forward fixes ${bn(hedge.rate, 0)} on a quarter of it.`,
      info(
        `EUR at ${eurBeforePct}% of its limit`,
        [
          { label: 'Open position', value: eurText(Math.round(eurOpen / 1e4) * 1e4), mono: true, hint: `USD ${bn(hedge.before)}M eq. of USD ${hedge.limit}M` },
          { label: 'A 2% fall', value: minus(`-${idrBn(loss, 1)}`), hint: `At the ${bn(fx.EUR, 0)} fixing` },
          { label: 'The forward', value: `${eurText(state.hedgeEur)} at ${bn(hedge.rate, 0)}`, inferred: true, hint: 'Settles Fri 4 Dec' },
        ],
        'Why now',
      ),
    )
  }

  function moveReply(t: string, amount: number): DeskReply {
    state.topic = 'transfer'
    const to = accountAfter(t, 'ke|to|into|untuk') ?? accountIn(t)
    const fromSaid = accountAfter(t, 'dari|from')
    if (!to) return reply(`Where should ${rp(amount)} go? Try “Kirim 25 miliar ke rekening pajak besok”.`)
    const toAcc = byId(to)
    if (toAcc.currency !== 'IDR') {
      return reply(
        `${toAcc.name} is in ${toAcc.currency}: rupiah going in is a conversion at today's rate, which I prepare as an FX deal. Between the rupiah accounts I can move it now.`,
      )
    }
    if (to === 'ACC-06') return reply('Escrow, Cikarang DC is restricted: money goes in or out only under the escrow agreement, at handover.')
    if (to === 'ACC-05') return reply('The 3-month deposit is fixed until 14 Jan 2027. A new deposit is a placement with the bank, not a transfer.')
    const from = fromSaid && fromSaid !== to ? fromSaid : to === 'ACC-01' ? 'ACC-02' : 'ACC-01'
    const fromAcc = byId(from)
    if (fromAcc.currency !== 'IDR' || from === 'ACC-05' || from === 'ACC-06') {
      return reply(`${fromAcc.name} cannot send rupiah from here. Operating or Collections can.`)
    }
    if (amount > fromAcc.balance) {
      return reply(`${fromAcc.name} holds ${rp(fromAcc.balance)}, less than that. Try a smaller amount, or say which account it comes from.`)
    }
    const n = dayIn(t) ?? 3
    if (n < 3) return reply('That day has passed. Today or a later day?')
    const draft: TransferDraft = { amount, from, to, day: dayOf(n), fromSaid: !!fromSaid && fromSaid !== to }
    const card = transferCard(draft)
    const lead =
      from === 'ACC-01' && !draft.fromSaid
        ? 'From Operating, the one rupiah account above its target.'
        : `From ${fromAcc.name}.`
    const rail = railFor(amount, fromAcc, toAcc).rail
    const when = draft.day.n === 3 ? 'today' : draft.day.n === 4 ? 'tomorrow at 08:00 WIB' : `on ${draft.day.label.replace(' 2026, 08:00 WIB', '')}`
    const how = rail === 'Book transfer' ? `It moves inside ${fromAcc.bank} ${when}` : `It arrives by ${rail} ${when}`
    const asked = n !== draft.day.n ? ` ${weekday(n)} ${n} Nov has no clearing, so it goes on the Monday.` : ''
    return reply(`${lead} ${how}.${asked}`, card)
  }

  function changeReply(raw: string, t: string, amount: number | null): DeskReply | null {
    const open = latestOpen.value
    if (!open) return null
    if (open.kind === 'transfer' && open.transfer) {
      const cur = open.transfer
      const n = dayIn(t)
      const fromSaid = accountAfter(t, 'dari|from')
      const dayWords = /\b(instead|aja|saja|make it|ganti|ubah|what about|gimana|bagaimana|jadi)\b/.test(t) || /^(hari ini|today|besok|tomorrow|lusa)/.test(t)
      if (!amount && !(n && dayWords) && !fromSaid) return null
      if (fromSaid && (fromSaid === cur.to || byId(fromSaid).currency !== 'IDR' || fromSaid === 'ACC-05' || fromSaid === 'ACC-06')) {
        return reply(`${byId(fromSaid).name} cannot send this one. Operating or Collections can.`)
      }
      const next: TransferDraft = {
        ...cur,
        amount: amount ?? cur.amount,
        day: n && dayWords ? dayOf(n) : cur.day,
        from: fromSaid ?? cur.from,
        fromSaid: fromSaid ? true : cur.fromSaid,
      }
      const fromAcc = byId(next.from)
      if (next.amount > fromAcc.balance) return reply(`${fromAcc.name} holds ${rp(fromAcc.balance)}, less than that.`)
      if (next.day.n < 3) return reply('That day has passed. Today or a later day?')
      state.topic = 'transfer'
      const after = fromAcc.balance - next.amount
      let text = 'Updated.'
      if (amount && next.amount !== cur.amount) {
        text =
          next.from === 'ACC-01' && after < OPERATING_TARGET
            ? `Updated to ${rp(next.amount)}. Operating drops to ${r1(after / 1e9)} bn, ${bn((OPERATING_TARGET - after) / 1e9)} under its target until the 16:00 sweep from Collections refills it.`
            : `Updated to ${rp(next.amount)}.${next.amount > 50e9 && cur.amount <= 50e9 ? ` Above IDR 50 bn it needs ${people.cfo}'s signature too.` : ''}`
      } else if (fromSaid) {
        text = `From ${fromAcc.name} then; ${byId(next.to).name} gets it the same way.`
      } else if (n) {
        const rail = railFor(next.amount, fromAcc, byId(next.to)).rail
        text =
          next.day.n === 3
            ? rail === 'BI-RTGS'
              ? 'Today then: BI-RTGS, before the 15:00 WIB cut-off.'
              : `Today then: ${rail}, it lands in seconds.`
            : `Moved to ${next.day.label.replace(' 2026, ', ' ')}.`
      }
      return reply(text, transferCard(next))
    }
    if (open.kind === 'dividend') {
      if (amount && /\b(make it|jadi|ubah|ganti|change)\b/.test(t)) {
        return reply(`The amount is fixed by the board resolution of ${dividend.board}; I can only move the day. Try “What about the 19th?”.`)
      }
      const n = dayIn(t)
      if (n === 19) {
        state.topic = 'dividend'
        return reply(`The 19th works the same way: the low stays ${lowDraft.day} at ${r1(lowDraft.level)} bn.`, dividendCard(19))
      }
      if (n === 20 && open.dividendDay !== 20) return reply('Back to the 20th.', dividendCard(20))
      if (n && n !== 20 && /\b(what about|how about|gimana|bagaimana|make it|jadi|tanggal|instead)\b/.test(t)) {
        return reply('I have worked out the 19th and the 20th; any day from 16 to 25 Nov leaves the same low on the 25th. Try “What about the 19th?”.')
      }
      return null
    }
    if (open.kind === 'hedge') {
      const eur = eurIn(raw)
      if (!eur) return null
      if (eur > 4e6) return reply('More than EUR 4M would hedge past the receipts we expect on 4 Dec. Up to EUR 4M?')
      state.topic = 'hedge'
      return reply(`${eurText(eur)} takes EUR to ${eurAfter(eur).pct}% of its limit.`, hedgeCard(eur))
    }
    return null
  }

  function commitReply(): DeskReply {
    const open = latestOpen.value
    if (!open) return reply('There is nothing open to confirm. Try “What needs me?”.')
    return confirmReply(open)
  }

  function releaseReply(): DeskReply {
    state.topic = 'payments'
    if (state.payments === 'released') {
      return reply(`They were released at ${state.paymentsAt}. Sinar Armada goes first, tomorrow at 10:00 WIB.`)
    }
    return reply(
      `${openPayments.length} payments, ${idrBn(openPaymentsBn, 2)} eq., due 4 to 9 Nov. Each matches its invoice and no payee bank has changed. Hold the button to release them.`,
      releaseCard(),
    )
  }

  function sweepReply(approve: boolean): DeskReply {
    state.topic = 'sweep'
    if (state.sweep === 'approved') return reply(`Approved at ${state.sweepAt}; it runs at ${sweep.at}, ${sweep.atWib}.`)
    if (approve) {
      return reply(
        `Approved. ${money(sweep.amount, 'USD')} moves from USD operating to USD concentration at ${sweep.at}, 05:00 WIB tomorrow.`,
        undefined,
        approveSweep,
      )
    }
    return reply(
      `USD operating is ${money(sweep.amount, 'USD')} over its USD 6M target. The rule sweeps the excess to the concentration account at ${sweep.at}, where it earns 4.05% overnight instead of 3.20%; sweeps over USD 200,000 wait for a treasurer.`,
      undefined,
      () => (state.selected = 'ACC-09'),
    )
  }

  function hedgeReply(): DeskReply {
    state.topic = 'hedge'
    if (state.hedge !== 'proposed') {
      return reply(`Booked at ${state.hedgeAt}: ${eurText(state.hedgeEur)} at ${bn(hedge.rate, 0)} to 4 Dec, ${hedge.id}. EUR sits at ${eurAfter(state.hedgeEur).pct}% of its limit.`)
    }
    return reply(
      `EUR is at ${eurBeforePct}% of its USD ${hedge.limit}M limit, mostly the Hamburg receipts due 4 Dec. Selling ${eurText(state.hedgeEur)} forward to that date brings it to ${eurAfter(state.hedgeEur).pct}%.`,
      hedgeCard(),
    )
  }

  function fxReply(): DeskReply {
    state.topic = 'fx'
    const booked = state.hedge !== 'proposed'
    return reply(
      `One currency is close to its limit: EUR at ${booked ? eurAfter(state.hedgeEur).pct : eurBeforePct}%. The rest have room.`,
      info(
        'FX against limits, 10:00 WIB',
        fxRows.map((r) => {
          const value = r.label === 'EUR' && booked ? eurAfter(state.hedgeEur).value : r.value
          const fix = fixings.find((f) => f.pair === r.label)
          return {
            label: r.label,
            value: `${Math.round((value / (r.target ?? 1)) * 100)}% of USD ${r.target}M`,
            hint: `USD ${bn(value)}M eq. · fixing ${fix ? bn(fix.rate, fix.digits) : ''}`,
            inferred: r.label === 'EUR',
          }
        }),
        'Exposure',
      ),
    )
  }

  function needsReply(): DeskReply {
    state.topic = 'none'
    const rows: CheckRow[] = []
    if (state.payments === 'awaiting') rows.push({ label: `${openPayments.length} payments`, value: `${idrBn(openPaymentsBn, 2)} eq.`, hint: 'First release tomorrow 10:00 WIB' })
    if (state.sweep === 'pending') rows.push({ label: 'USD sweep', value: money(sweep.amount, 'USD'), mono: true, hint: `Before ${sweep.at}, ${sweep.atWib}` })
    if (state.hedge === 'proposed') rows.push({ label: 'EUR hedge', value: `Sell ${eurText(state.hedgeEur)} forward`, hint: `EUR at ${eurBeforePct}% of its limit` })
    const draft = openOf('dividend')
    if (draft) rows.push({ label: 'Dividend draft', value: `${draft.dividendDay === 19 ? 'Thu 19' : 'Fri 20'} Nov, above`, hint: `You, then ${people.cfo}` })
    const doneHere = state.session.filter((id) => !trailItem(id)?.revertedAt).length
    if (!rows.length) {
      return reply(`Nothing waits for you. ${doneHere ? `You decided ${count(doneHere, 'thing')} this morning; each is under Done by Simpul.` : ''}`.trim())
    }
    const onDesk = rows.length - (draft ? 1 : 0)
    const words = ['Nothing', 'One decision', 'Two decisions', 'Three decisions']
    return reply(
      `${words[onDesk]} under Needs you, earliest first${draft ? ', and the dividend draft here in the thread' : ''}.`,
      info(`Waiting for you · ${rows.length}`, rows, 'Needs you'),
    )
  }

  function bufferReply(): DeskReply {
    state.topic = 'dividend'
    const draft = state.dividend !== 'dropped'
    return reply(
      `The buffer is ${bn(minimumBuffer, 0)} bn of total cash, set in the treasury policy. Nothing in the forecast goes under it.`,
      info(`The ${bn(minimumBuffer, 0)} bn buffer`, [
        { label: 'Lowest close', value: `${r1(troughValue)} bn in ${weekLabels[troughWeek]}`, hint: `${signedBn(troughValue - minimumBuffer)} over` },
        { label: 'Lowest day', value: `${r1(lowPlan.level)} bn on ${lowPlan.day}`, hint: `${signedBn(lowPlan.level - minimumBuffer)} over, dividend on 2 Dec` },
        ...(draft
          ? [{ label: 'With the draft', value: `${r1(lowDraft.level)} bn on ${lowDraft.day}`, hint: `${signedBn(lowDraft.level - minimumBuffer)} over, dividend on 20 Nov`, inferred: true }]
          : []),
      ]),
    )
  }

  function dividendReply(): DeskReply {
    state.topic = 'dividend'
    if (state.dividend === 'scheduled') return reply(`Scheduled for ${weekday(state.dividendDay)} ${state.dividendDay} Nov as ${dividend.id}; it waits for ${people.cfo}'s signature.`)
    if (openOf('dividend')) return reply(`The draft is above: Fri 20 Nov, ${idrBn(dividend.bn)}. Say “schedule it” or press the button on it.`)
    if (state.dividend === 'dropped') state.dividend = 'draft'
    return reply(`Here it is again: Fri 20 Nov, ${idrBn(dividend.bn)}, low ${r1(lowDraft.level)} bn on ${lowDraft.day}.`, dividendCard(20))
  }

  function totalReply(): DeskReply {
    return reply(
      `Total cash is ${r1(position.total)} bn, ${signedBn(position.totalChange)}% on the 2 Nov close. ${r1(position.available)} bn is available with the ${bn(position.undrawn)} bn undrawn facility, and coverage is ${position.lcr}% against a ${position.lcrPolicy}% minimum.`,
    )
  }

  function balanceReply(id: string): DeskReply {
    state.topic = 'balance'
    const a = byId(id)
    const where = `${a.name} at ${a.bank} ···· ${a.number.replace(/\D/g, '').slice(-4)}`
    const eq = a.currency === 'IDR' ? '' : `, ${r1(a.idr / 1e9)} bn in rupiah`
    const extra: Record<string, string> = {
      'ACC-03': ' It is marked low: Operating funds it on Tue 24 Nov with IDR 126.4 bn for November payroll.',
      'ACC-01': ` Its target is ${bn(OPERATING_TARGET / 1e9, 0)} bn; Collections empties into it at 16:00.`,
      'ACC-09': ` The ${money(sweep.amount, 'USD')} sweep from USD operating ${state.sweep === 'approved' ? 'is approved' : 'waits for you'}.`,
      'ACC-05': ' It earns 5.40% and matures on 14 Jan 2027.',
      'ACC-06': ' It is restricted until the Cikarang handover.',
      'ACC-07': state.sgdHeld ? ` I held tonight's sweep: Meridian Port's SGD 312,480.00 leaves it on 6 Nov.` : '',
    }
    return reply(`${where} holds ${money(a.balance, a.currency)}${eq}.${extra[id] ?? ''}`, undefined, () => (state.selected = id))
  }

  /* ── Opening: Ayu asked; Simpul answered with the working and a draft ──────────────────── */

  const opening = dividendCard(20)
  desk.say(
    reply(
      `Yes. Paid on Fri 20 Nov instead of Wed 2 Dec, the ${idrBn(dividend.bn)} dividend keeps every day above the ${bn(minimumBuffer, 0)} bn buffer. The low moves to ${lowDraft.day}, after payroll and the supplier run: ${r1(lowDraft.level)} bn, ${bn(lowDraft.level - minimumBuffer)} over it. I've drafted the payment and drawn it on the forecast.`,
      opening,
    ),
  )

  /** When the scene stands: the time of the latest line in the thread. */
  const now = computed(() => desk.messages.value[desk.messages.value.length - 1]?.at ?? '10:42')

  return { desk, state, surface, cardStatus, latestOpen, now }
}

export type TreasuryDesk = ReturnType<typeof useTreasuryDesk>
