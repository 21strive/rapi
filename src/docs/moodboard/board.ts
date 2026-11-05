/**
 * The ten jobs, in board order, and the loader that numbers their tiles. Each job lives in
 * `jobs/<id>/index.ts` and exports `entries`: exactly 100 tiles. Jobs load as separate chunks, so
 * one broken job shows an error band instead of taking the board down.
 */
import type { BoardEntry, JobId, MoodEntry } from './types'

export interface Job {
  id: JobId
  /** "01". */
  index: string
  name: string
  /** The claim of the chapter, in sentence case. */
  title: string
  body: string
  /** Which of the three tests puts this job on a screen. */
  test: 'see' | 'touch' | 'decide' | 'talk'
}

export const PER_JOB = 100

export const jobs: Job[] = [
  {
    id: 'glance',
    index: '01',
    name: 'Glance',
    title: 'Faster to see than to ask',
    body: 'Readouts, lamps, figures and gauges. A look answers before a question can be typed, so the state of things keeps a surface of its own.',
    test: 'see',
  },
  {
    id: 'decide',
    index: '02',
    name: 'Decide',
    title: 'A person signs off',
    body: 'Approve, reject, choose, release. The model can prepare the work; the moment a person commits gets one clear control and nothing around it.',
    test: 'decide',
  },
  {
    id: 'tune',
    index: '03',
    name: 'Tune',
    title: 'Hands are more precise than words',
    body: '“A bit warmer” is a guess; a dial is exact. Knobs, faders, steppers and pads for values a person feels their way to.',
    test: 'touch',
  },
  {
    id: 'watch',
    index: '04',
    name: 'Watch',
    title: 'Live things need a live surface',
    body: 'Counters, timers, streams and progress. When the answer changes every second, looking is faster than asking again.',
    test: 'see',
  },
  {
    id: 'compare',
    index: '05',
    name: 'Compare',
    title: 'Shape beats a paragraph',
    body: 'Lines, columns, ranks, before and after. A chart shows in one look what a sentence has to spell out item by item.',
    test: 'see',
  },
  {
    id: 'ask',
    index: '06',
    name: 'Ask',
    title: 'The conversation does the rest',
    body: 'Filters, forms and settings become a sentence. UI stays only where the answer needs a check: the chips, the draft, the source, the confirm.',
    test: 'talk',
  },
  {
    id: 'verify',
    index: '07',
    name: 'Verify',
    title: 'Proof a person can check',
    body: 'Receipts, audit lines, versions and undo. Trust comes from records a person can read, compare and reverse.',
    test: 'decide',
  },
  {
    id: 'respond',
    index: '08',
    name: 'Respond',
    title: 'Needs eyes now',
    body: 'Alarms, pages and warnings. When something needs a person this minute, it interrupts once, with the one action next to it.',
    test: 'decide',
  },
  {
    id: 'enter',
    index: '09',
    name: 'Enter',
    title: 'The few fields worth a field',
    body: 'A code, an amount, a date, a signature. Some input is quicker typed, tapped or drawn than spoken, so it keeps a field.',
    test: 'touch',
  },
  {
    id: 'identify',
    index: '10',
    name: 'Identify',
    title: 'Who and what, at a glance',
    body: 'People, places, accounts, objects and the marks of the language itself. Recognising is faster than reading.',
    test: 'see',
  },
]

export const tests = [
  { id: 'see', index: '01', title: 'Seeing beats saying', body: 'State, change and shape are read in a look.' },
  { id: 'touch', index: '02', title: 'Touch beats describing', body: 'Values a hand finds faster than a sentence.' },
  { id: 'decide', index: '03', title: 'A person decides', body: 'Commitments, proof and interruptions.' },
  { id: 'talk', index: '04', title: 'Everything else is a conversation', body: 'The model does the work; UI shows what to check.' },
] as const

const loaders = import.meta.glob<{ entries: MoodEntry[] }>('./jobs/*/index.ts')

export type JobLoad = { status: 'ok'; entries: BoardEntry[] } | { status: 'error'; message: string }

export async function loadJob(job: Job): Promise<JobLoad> {
  const load = loaders[`./jobs/${job.id}/index.ts`]
  if (!load) return { status: 'error', message: `jobs/${job.id}/index.ts is missing` }
  try {
    const mod = await load()
    const offset = (Number(job.index) - 1) * PER_JOB
    const entries = mod.entries.map<BoardEntry>((entry, i) => ({
      ...entry,
      job: job.id,
      n: offset + i,
      index: String(offset + i + 1).padStart(4, '0'),
    }))
    if (import.meta.env.DEV) check(job, entries)
    return { status: 'ok', entries }
  } catch (error) {
    return { status: 'error', message: error instanceof Error ? error.message : String(error) }
  }
}

function check(job: Job, entries: BoardEntry[]) {
  if (entries.length !== PER_JOB) console.warn(`[moodboard] ${job.id} has ${entries.length} tiles, expected ${PER_JOB}`)
  const seen = new Set<string>()
  for (const e of entries) {
    if (seen.has(e.id)) console.warn(`[moodboard] duplicate id ${e.id}`)
    seen.add(e.id)
    if (!e.id.startsWith(`${job.id}-`)) console.warn(`[moodboard] ${e.id} should start with "${job.id}-"`)
  }
}

/** Every word the filter matches a tile on. */
export function haystack(entry: BoardEntry, job: Job): string {
  return [entry.index, entry.name, entry.hint, entry.domain, entry.surface ?? '', job.name, ...(entry.tags ?? [])]
    .join(' ')
    .toLowerCase()
}
