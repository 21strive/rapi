/**
 * The desk's scripted model. There is no real model in the samples: each screen matches what a
 * person says against its own patterns, in English and in Indonesian, and answers after a short
 * pause, the way a reply arrives. Anything it does not understand gets a plain answer and an
 * example to try, never an error.
 */
import { onBeforeUnmount, ref, shallowRef } from 'vue'

/** Lowercase, no accents, no quotes, single spaces: what patterns are matched against. */
export function norm(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[“”"‘’`]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** True when the pattern (a regular expression, no case) is found in the text. */
export function hits(pattern: string, text: string): boolean {
  return new RegExp(pattern, 'i').test(norm(text))
}

/** The first entry whose `match` is found in the text. */
export function understand<T extends { match: string }>(text: string, list: readonly T[]): T | undefined {
  const t = norm(text)
  if (!t) return undefined
  return list.find((item) => new RegExp(item.match, 'i').test(t))
}

/** Fills `{name}` placeholders: fill('Noted: {when}', { when: 'besok' }). */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (all, key: string) => (key in values ? String(values[key]) : all))
}

/** "1 record", "12 records". */
export function count(n: number, word: string, plural = `${word}s`): string {
  return `${n.toLocaleString('en-US')} ${n === 1 ? word : plural}`
}

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * The scene's clock. A screen opens on a moment ("09:12"); every exchange is stamped a minute later,
 * so the conversation reads in order however long the reader takes.
 */
export function useSceneClock(start = '09:12') {
  const [h, m] = start.split(':').map(Number)
  let minutes = (h || 0) * 60 + (m || 0)
  const text = () => `${pad(Math.floor(minutes / 60) % 24)}:${pad(minutes % 60)}`
  return {
    now: text,
    next(step = 1) {
      minutes += step
      return text()
    },
  }
}

/* ── The conversation ──────────────────────────────────────────────────────────────── */

export interface DeskMessage {
  id: number
  /** "You", "Simpul", or empty for a system line. */
  who: string
  at: string
  mine?: boolean
  /** A quiet line in the thread: "You released 3 payments". */
  system?: boolean
  text?: string
  /** A key the screen renders in the thread's `card` slot: a summary to check, a diff, options. */
  card?: string
  data?: unknown
}

export interface DeskReply {
  text?: string
  card?: string
  data?: unknown
  /** Suggestions offered after this reply. */
  chips?: string[]
  /** Runs once the reply lands: change a surface, add to the inbox, write to the trail. */
  after?: () => void
}

export interface DeskOptions {
  /** The agent's name in the thread: "Simpul". */
  agent: string
  /** The scene's clock at the first message: "09:12". */
  start: string
  /** Messages already in the thread when the screen opens. Give each its own `at` ("09:04") to
   *  stagger them; without one they carry the scene's start time. */
  opening?: (Omit<DeskMessage, 'id' | 'at'> & { at?: string })[]
  /** Suggestions shown before the person has said anything. */
  chips?: string[]
  /** What the agent answers to a sentence. Return several replies for a short sequence. */
  respond: (said: string) => DeskReply | DeskReply[]
  /** Pause before a reply, in ms. */
  delay?: number
}

/**
 * The thread, the "writing" pause and the suggestions, in one place. Screens call `send` from the
 * composer, `say` when a surface answers on the agent's behalf, and `note` for a quiet system line
 * ("You approved PAY-0412").
 */
export function useDesk(options: DeskOptions) {
  const clock = useSceneClock(options.start)
  let seq = 0
  const messages = ref<DeskMessage[]>(
    (options.opening ?? []).map((m) => ({ ...m, id: ++seq, at: m.at ?? clock.now() })),
  )
  const writing = ref(false)
  const chips = shallowRef<string[]>(options.chips ?? [])
  const timers: number[] = []

  function push(message: Omit<DeskMessage, 'id'>) {
    messages.value = [...messages.value, { ...message, id: ++seq }]
  }

  function land(replies: DeskReply[]) {
    for (const r of replies) {
      if (r.text || r.card) push({ who: options.agent, at: clock.now(), text: r.text, card: r.card, data: r.data })
      if (r.chips) chips.value = r.chips
      r.after?.()
    }
  }

  /** The person says something; the agent writes, then answers. */
  function send(text: string) {
    const said = text.trim()
    if (!said || writing.value) return
    push({ who: 'You', mine: true, at: clock.next(), text: said })
    writing.value = true
    const replies = ([] as DeskReply[]).concat(options.respond(said))
    timers.push(
      window.setTimeout(() => {
        writing.value = false
        clock.next()
        land(replies)
      }, options.delay ?? 650),
    )
  }

  /** The agent says something now, e.g. after a person approved a card. */
  function say(reply: DeskReply | DeskReply[]) {
    clock.next()
    land(([] as DeskReply[]).concat(reply))
  }

  /** A quiet system line in the thread. */
  function note(text: string) {
    push({ who: '', system: true, at: clock.next(), text })
  }

  onBeforeUnmount(() => timers.forEach((t) => window.clearTimeout(t)))

  return { messages, writing, chips, send, say, note, clock }
}

/* ── Shapes shared by the desk's parts ─────────────────────────────────────────────── */

/** A row of DeskCheck. */
export interface CheckRow {
  label: string
  value: string
  mono?: boolean
  /** Filled or changed by the conversation: marked so it can be checked. */
  inferred?: boolean
  /** A quiet second line under the value. */
  hint?: string
}

/** A line of DeskTrail. */
export interface TrailItem {
  id: string
  /** "14:02". */
  at: string
  /** "Simpul", "Ayu Lestari". */
  who: string
  text: string
  /** A mono detail: an id, a reference, a diff summary. */
  detail?: string
  canRevert?: boolean
  /** Set once reversed: "14:05". */
  revertedAt?: string
}
