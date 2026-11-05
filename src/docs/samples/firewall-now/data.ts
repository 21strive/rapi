/**
 * Edge firewall, now · Selaras Bank, zone selaras.id, 03 Nov 2026 at 05:30 UTC: the same zone,
 * rules, traffic and people as the Then screen (../firewall), whose data and engine this screen
 * imports. What is new here is the scene: who is talking, what was done overnight, and what the
 * same job costs on each screen.
 */
import type { TrailItem } from '../_kit/desk'
import { CURRENT_USER, RULES } from '../firewall/data'
import { readRule, termsOf, write } from './rule'

export const AGENT = 'Simpul'
/** Rizky Pratama, who wrote rule 02 in the Then screen and is at the desk today. */
export const PERSON = CURRENT_USER
export const START = '05:30'
export const DATE = '03 Nov 2026'
/** A rule turned on here records for this long before it acts. */
export const LOG_ONLY_MINUTES = 60

/** The one sentence the screen opens on. */
export const OPENING_SAID = 'Block logins from outside Indonesia except the Singapore office'
export const OPENING_SPEC = readRule(OPENING_SAID)!

export const OPENING_CONTEXT =
  'Last night’s sign-in wave is over. Rule 02 blocked the hosting networks; 34,900 attempts through home connections abroad were only challenged.'

/**
 * What the job costs. Then: the rule editor is one dialog with a name, an expression, an action
 * and a scope, and the expression for this rule is three conditions of field, operator and value
 * written by hand (the office's range looked up first). Now: one sentence, one check, one confirm.
 */
export const COST = {
  then: [
    { value: 1, unit: 'dialog' },
    { value: 4, unit: 'fields' },
    { value: termsOf(write(OPENING_SPEC).expression), unit: 'expression terms' },
  ],
  now: [
    { value: 1, unit: 'sentence' },
    { value: 1, unit: 'check' },
    { value: 1, unit: 'confirm' },
  ],
}

const ruleTen = RULES.find((r) => r.id === 'r-10')!

/** The record as the screen opens: last night, newest first. */
export const TRAIL_SEED: (TrailItem & { kind?: 'toggle'; rule?: string; on?: boolean })[] = [
  {
    id: 't-0005',
    at: '00:05',
    who: AGENT,
    text: 'Closed the page: blocked requests back under the alert line',
    detail: 'login.selaras.id · 17,043 / h at 00:00 UTC',
  },
  {
    id: 't-2312',
    at: '23:12',
    who: ruleTen.author,
    text: `Switched off ${ruleTen.name}`,
    detail: 'r-10 · on → off · app 3.9 cannot answer a challenge',
    canRevert: true,
    kind: 'toggle',
    rule: 'r-10',
    on: false,
  },
  {
    id: 't-2004',
    at: '20:04',
    who: AGENT,
    text: 'Paged security on-call: blocked requests above the alert line',
    detail: 'login.selaras.id · 32,001 / h at 20:00 UTC · rule 02 holding',
  },
]
