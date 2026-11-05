/**
 * The chapter's scripted model. There is no real model on the board: each tile matches what a
 * person types against a few patterns, in English and in Indonesian, and answers from a script
 * after a short pause, the way a reply would arrive. Anything it does not understand gets a plain
 * answer and an example to try, never an error.
 */
import { onBeforeUnmount, ref } from 'vue'
import { pad } from '../../kit'

/** Lowercase, no accents, no quotes, single spaces: what the patterns are matched against. */
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

/** Fills `{name}` placeholders: fill('Noted: {text}', { text: 'besok' }). */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (all, key: string) => (key in values ? String(values[key]) : all))
}

/**
 * The pause before a scripted reply: `busy` is true while the "model" writes. One reply at a
 * time; a new one replaces the one being written. Cleared when the tile goes away.
 */
export function useReply(ms = 700) {
  const busy = ref(false)
  let timer: number | undefined
  function reply(fn: () => void, wait = ms) {
    window.clearTimeout(timer)
    busy.value = true
    timer = window.setTimeout(() => {
      busy.value = false
      fn()
    }, wait)
  }
  function cancel() {
    window.clearTimeout(timer)
    busy.value = false
  }
  onBeforeUnmount(() => window.clearTimeout(timer))
  return { busy, reply, cancel }
}

/**
 * A short window a person started (an undo, a hold in a queue): whole seconds down to zero,
 * then `onEnd`. A chain of timeouts that only runs while it counts.
 */
export function useCountdown(onEnd?: () => void) {
  const left = ref(0)
  let timer: number | undefined
  function step() {
    left.value--
    if (left.value <= 0) {
      left.value = 0
      onEnd?.()
      return
    }
    timer = window.setTimeout(step, 1000)
  }
  function start(seconds: number) {
    window.clearTimeout(timer)
    left.value = seconds
    timer = window.setTimeout(step, 1000)
  }
  function stop() {
    window.clearTimeout(timer)
    left.value = 0
  }
  onBeforeUnmount(() => window.clearTimeout(timer))
  return { left, start, stop }
}

/**
 * The scene's clock. A tile opens on a moment ("09:14"); every exchange in it is stamped a
 * minute later, so a conversation reads in order however long the reader takes.
 */
export function useClock(start = '09:14') {
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

/** "1 message", "12 messages". */
export function count(n: number, word: string, plural = `${word}s`): string {
  return `${n.toLocaleString('en-US')} ${n === 1 ? word : plural}`
}
