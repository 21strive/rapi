/**
 * The rule language of the firewall sample, small but real: it tokenizes, parses and checks
 * expressions such as
 *
 *   http.path == "/session" and not ip.geo.country in {"ID" "SG"}
 *
 * and evaluates them against traffic profiles. A profile is a slice of the last 24 hours of
 * traffic (one origin, one endpoint, one client); evaluation returns the share of it that
 * matches, so a rule on one address inside a profile spread over a /24 counts 1/256 of it.
 */

export type RuleAction = 'block' | 'challenge' | 'allow' | 'log'

export interface Profile {
  /** First and last address of the range the traffic comes from, as 32-bit integers. */
  ip: [number, number]
  country: string
  asn: number
  host: string
  path: string
  method: string
  ua: string
  /** Requests in the last 24 hours. */
  weight: number
  /** Share of the weight in each hourly bucket; sums to 1. */
  shape: number[]
}

type FieldType = 'ip' | 'text' | 'number'
type ProfileKey = 'ip' | 'country' | 'asn' | 'host' | 'path' | 'method' | 'ua'

export const FIELDS: Record<string, { type: FieldType; key: ProfileKey }> = {
  'ip.src': { type: 'ip', key: 'ip' },
  'ip.geo.country': { type: 'text', key: 'country' },
  asn: { type: 'number', key: 'asn' },
  'http.host': { type: 'text', key: 'host' },
  'http.path': { type: 'text', key: 'path' },
  'http.method': { type: 'text', key: 'method' },
  'http.user_agent': { type: 'text', key: 'ua' },
}

export const FIELD_NAMES = Object.keys(FIELDS)

/* ── Addresses ──────────────────────────────────────────────────────────────────── */

const IPV4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})(?:\/(\d{1,2}))?$/

/** "203.0.113.0/24" → [first, last] as 32-bit integers; null when it is not an address. */
export function parseRange(text: string): [number, number] | null {
  const m = IPV4.exec(text)
  if (!m) return null
  const octets = m.slice(1, 5).map(Number)
  if (octets.some((o) => o > 255)) return null
  const bits = m[5] == null ? 32 : Number(m[5])
  if (bits > 32) return null
  const base = ((octets[0] << 24) >>> 0) + (octets[1] << 16) + (octets[2] << 8) + octets[3]
  const size = 2 ** (32 - bits)
  const first = Math.floor(base / size) * size
  return [first, first + size - 1]
}

/** Share of range `a` that falls inside range `b`. */
function overlap(a: [number, number], b: [number, number]) {
  const lo = Math.max(a[0], b[0])
  const hi = Math.min(a[1], b[1])
  return hi < lo ? 0 : (hi - lo + 1) / (a[1] - a[0] + 1)
}

/* ── Tokens ─────────────────────────────────────────────────────────────────────── */

type TokenKind = 'word' | 'string' | 'number' | 'ip' | 'op' | '(' | ')' | '{' | '}' | ','

interface Token {
  kind: TokenKind
  text: string
  col: number
}

export class RuleError extends Error {
  readonly col: number
  constructor(message: string, col: number) {
    super(message)
    this.col = col
  }
}

function tokenize(source: string): Token[] {
  const tokens: Token[] = []
  let i = 0
  while (i < source.length) {
    const ch = source[i]
    const col = i + 1
    if (/\s/.test(ch)) {
      i++
    } else if ('(){},'.includes(ch)) {
      tokens.push({ kind: ch as TokenKind, text: ch, col })
      i++
    } else if (source.startsWith('==', i) || source.startsWith('!=', i) || source.startsWith('&&', i) || source.startsWith('||', i)) {
      tokens.push({ kind: 'op', text: source.slice(i, i + 2), col })
      i += 2
    } else if (ch === '!') {
      tokens.push({ kind: 'word', text: 'not', col })
      i++
    } else if (ch === '"') {
      let j = i + 1
      let text = ''
      while (j < source.length && source[j] !== '"') {
        if (source[j] === '\\' && j + 1 < source.length) j++
        text += source[j]
        j++
      }
      if (j >= source.length) throw new RuleError(`Close the text that starts at column ${col} with a double quote.`, col)
      tokens.push({ kind: 'string', text, col })
      i = j + 1
    } else if (/[0-9]/.test(ch)) {
      let j = i
      while (j < source.length && /[0-9./]/.test(source[j])) j++
      const text = source.slice(i, j)
      if (/^\d+$/.test(text)) tokens.push({ kind: 'number', text, col })
      else if (parseRange(text)) tokens.push({ kind: 'ip', text, col })
      else throw new RuleError(`"${text}" at column ${col} is neither a number nor an address.`, col)
      i = j
    } else if (/[A-Za-z_$]/.test(ch)) {
      let j = i
      while (j < source.length && /[A-Za-z0-9_.$]/.test(source[j])) j++
      tokens.push({ kind: 'word', text: source.slice(i, j), col })
      i = j
    } else {
      throw new RuleError(`Unexpected "${ch}" at column ${col}.`, col)
    }
  }
  return tokens
}

/* ── Syntax tree ────────────────────────────────────────────────────────────────── */

type Value = { kind: 'text'; text: string } | { kind: 'number'; n: number } | { kind: 'ip'; range: [number, number] }

export type RuleNode =
  | { type: 'and' | 'or'; left: RuleNode; right: RuleNode }
  | { type: 'not'; arg: RuleNode }
  | { type: 'cmp'; field: string; op: 'eq' | 'ne' | 'contains' | 'matches'; value: Value; re?: RegExp }
  | { type: 'in'; field: string; values: Value[] }

const OPS_BY_TYPE: Record<FieldType, string[]> = {
  ip: ['==', '!=', 'in'],
  number: ['==', '!=', 'in'],
  text: ['==', '!=', 'contains', 'matches', 'in'],
}

/** Plain edit distance, to suggest "http.path" for "http.paht". */
function distance(a: string, b: string) {
  const row = Array.from({ length: b.length + 1 }, (_, j) => j)
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0]
    row[0] = i
    for (let j = 1; j <= b.length; j++) {
      const keep = row[j]
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1))
      prev = keep
    }
  }
  return row[b.length]
}

function suggestField(word: string) {
  const best = FIELD_NAMES.map((name) => ({ name, d: distance(word, name) })).sort((x, y) => x.d - y.d)[0]
  return best && best.d <= 3 ? best.name : null
}

class Parser {
  private pos = 0
  private readonly tokens: Token[]
  /** Column just past the last character, for errors at the end. */
  private readonly end: number
  constructor(tokens: Token[], end: number) {
    this.tokens = tokens
    this.end = end
  }

  private peek() {
    return this.tokens[this.pos]
  }

  private isWord(token: Token | undefined, ...words: string[]) {
    return !!token && token.kind === 'word' && words.includes(token.text.toLowerCase())
  }

  parse(): RuleNode {
    const node = this.or()
    const rest = this.peek()
    if (rest) {
      throw new RuleError(`Unexpected "${rest.text}" at column ${rest.col}. Join conditions with and or or.`, rest.col)
    }
    return node
  }

  private or(): RuleNode {
    let left = this.and()
    while (this.isWord(this.peek(), 'or') || this.peek()?.text === '||') {
      this.pos++
      left = { type: 'or', left, right: this.and() }
    }
    return left
  }

  private and(): RuleNode {
    let left = this.unary()
    while (this.isWord(this.peek(), 'and') || this.peek()?.text === '&&') {
      this.pos++
      left = { type: 'and', left, right: this.unary() }
    }
    return left
  }

  private unary(): RuleNode {
    if (this.isWord(this.peek(), 'not')) {
      this.pos++
      return { type: 'not', arg: this.unary() }
    }
    return this.primary()
  }

  private primary(): RuleNode {
    const token = this.peek()
    if (!token) throw new RuleError('The expression stops before a condition. Add a field such as http.path.', this.end)
    if (token.kind === '(') {
      this.pos++
      const node = this.or()
      if (this.peek()?.kind !== ')') throw new RuleError(`Close the bracket opened at column ${token.col}.`, token.col)
      this.pos++
      return node
    }
    if (token.kind !== 'word') {
      throw new RuleError(`Expected a field at column ${token.col}, found "${token.text}".`, token.col)
    }
    return this.comparison()
  }

  private comparison(): RuleNode {
    const token = this.tokens[this.pos++]
    const field = FIELDS[token.text]
    if (!field) {
      const hint = suggestField(token.text)
      throw new RuleError(`Unknown field "${token.text}".${hint ? ` Did you mean ${hint}?` : ''}`, token.col)
    }
    const opToken = this.peek()
    const allowed = OPS_BY_TYPE[field.type]
    if (!opToken) throw new RuleError(`Add an operator after ${token.text}: ${allowed.join(', ')}.`, this.end)
    const opText = opToken.kind === 'op' ? opToken.text : opToken.kind === 'word' ? opToken.text.toLowerCase() : ''
    const op = opText === 'eq' ? '==' : opText === 'ne' ? '!=' : opText
    if (!['==', '!=', 'contains', 'matches', 'in'].includes(op)) {
      throw new RuleError(`Add an operator after ${token.text}: ${allowed.join(', ')}.`, opToken.col)
    }
    if (!allowed.includes(op)) {
      throw new RuleError(`${op} works on text fields, not on ${token.text}.`, opToken.col)
    }
    this.pos++
    if (op === 'in') {
      const open = this.peek()
      if (open?.kind !== '{') throw new RuleError(`Put the values for in between { and }.`, open?.col ?? this.end)
      this.pos++
      const values: Value[] = []
      while (this.peek() && this.peek()!.kind !== '}') {
        const t = this.tokens[this.pos++]
        if (t.kind === ',') continue
        values.push(this.value(t, token.text, field.type))
      }
      if (!this.peek()) throw new RuleError(`Close the set opened at column ${open.col} with }.`, open.col)
      this.pos++
      if (!values.length) throw new RuleError(`The set at column ${open.col} is empty.`, open.col)
      return { type: 'in', field: token.text, values }
    }
    const valueToken = this.tokens[this.pos++]
    if (!valueToken) throw new RuleError(`Add a value after ${op}.`, this.end)
    const value = this.value(valueToken, token.text, field.type)
    if (op === 'matches') {
      try {
        const re = new RegExp((value as { text: string }).text)
        return { type: 'cmp', field: token.text, op: 'matches', value, re }
      } catch {
        throw new RuleError(`The pattern at column ${valueToken.col} is not a valid regular expression.`, valueToken.col)
      }
    }
    return { type: 'cmp', field: token.text, op: op === '==' ? 'eq' : op === '!=' ? 'ne' : 'contains', value }
  }

  private value(t: Token, field: string, type: FieldType): Value {
    if (type === 'ip') {
      const range = parseRange(t.text)
      if ((t.kind === 'ip' || t.kind === 'string') && range) return { kind: 'ip', range }
      throw new RuleError(`${field} takes an address or a range such as 203.0.113.0/24 (column ${t.col}).`, t.col)
    }
    if (type === 'number') {
      const text = t.kind === 'word' && /^as\d+$/i.test(t.text) ? t.text.slice(2) : t.text
      if ((t.kind === 'number' || t.kind === 'word') && /^\d+$/.test(text)) return { kind: 'number', n: Number(text) }
      throw new RuleError(`${field} takes a number such as 64620 (column ${t.col}).`, t.col)
    }
    if (t.kind === 'string') return { kind: 'text', text: t.text }
    throw new RuleError(`Put text values in double quotes, as in "${t.text}" (column ${t.col}).`, t.col)
  }
}

export type ParseResult = { ok: true; ast: RuleNode } | { ok: false; empty: boolean; message: string; col: number }

export function parseRule(source: string): ParseResult {
  if (!source.trim()) return { ok: false, empty: true, message: 'Write an expression to preview what it matches.', col: 1 }
  try {
    return { ok: true, ast: new Parser(tokenize(source), source.length + 1).parse() }
  } catch (error) {
    if (error instanceof RuleError) return { ok: false, empty: false, message: error.message, col: error.col }
    throw error
  }
}

/* ── Evaluation ─────────────────────────────────────────────────────────────────── */

/** Host, country and method compare without case; paths and user agents are exact. */
function norm(key: ProfileKey, text: string) {
  return key === 'host' || key === 'country' || key === 'method' ? text.toLowerCase() : text
}

function cmpOne(key: ProfileKey, profile: Profile, value: Value): number {
  if (value.kind === 'ip') return overlap(profile.ip, value.range)
  if (value.kind === 'number') return profile.asn === value.n ? 1 : 0
  return norm(key, String(profile[key])) === norm(key, value.text) ? 1 : 0
}

/** Share of the profile (0–1) that the expression matches. */
export function evaluate(node: RuleNode, profile: Profile): number {
  switch (node.type) {
    case 'and': {
      const a = evaluate(node.left, profile)
      return a === 0 ? 0 : a * evaluate(node.right, profile)
    }
    case 'or': {
      const a = evaluate(node.left, profile)
      const b = evaluate(node.right, profile)
      return a + b - a * b
    }
    case 'not':
      return 1 - evaluate(node.arg, profile)
    case 'in': {
      const key = FIELDS[node.field].key
      return Math.min(1, node.values.reduce((sum, value) => sum + cmpOne(key, profile, value), 0))
    }
    case 'cmp': {
      const key = FIELDS[node.field].key
      if (node.op === 'eq') return cmpOne(key, profile, node.value)
      if (node.op === 'ne') return 1 - cmpOne(key, profile, node.value)
      const text = String(profile[key])
      if (node.op === 'matches') return node.re?.test(text) ? 1 : 0
      const needle = (node.value as { text: string }).text
      return norm(key, text).includes(norm(key, needle)) ? 1 : 0
    }
  }
}

/* ── Simulation ─────────────────────────────────────────────────────────────────── */

export interface SimRule {
  ast: RuleNode
  /** A hostname, or "all". */
  scope: string
  action: RuleAction
  /** Per hourly bucket, the share of the hour the rule was switched on (0–1). */
  live: number[]
}

export interface Simulation {
  /** Requests each rule matched, per hourly bucket. */
  hourly: number[][]
  /** Requests per hourly bucket by outcome. */
  outcome: Record<RuleAction | 'total', number[]>
  /** Blocked requests per profile, for the top-sources lists. */
  blockedBy: number[]
}

const TERMINAL: Record<RuleAction, boolean> = { block: true, challenge: true, allow: true, log: false }

/** Share of a profile a rule matches, with its scope applied. */
export function shareOf(rule: Pick<SimRule, 'ast' | 'scope'>, profile: Profile) {
  if (rule.scope !== 'all' && profile.host !== rule.scope) return 0
  return evaluate(rule.ast, profile)
}

/**
 * Runs every profile through the rules in order, hour by hour. The first Block, Challenge or
 * Allow that matches ends the evaluation for that share of traffic; Log lets it continue.
 */
export function simulate(rules: SimRule[], profiles: Profile[], hours: number): Simulation {
  const hourly = rules.map(() => new Array<number>(hours).fill(0))
  const outcome = {
    block: new Array<number>(hours).fill(0),
    challenge: new Array<number>(hours).fill(0),
    allow: new Array<number>(hours).fill(0),
    log: new Array<number>(hours).fill(0),
    total: new Array<number>(hours).fill(0),
  }
  const blockedBy = profiles.map(() => 0)
  profiles.forEach((profile, p) => {
    const shares = rules.map((rule) => shareOf(rule, profile))
    for (let h = 0; h < hours; h++) {
      const volume = profile.weight * profile.shape[h]
      outcome.total[h] += volume
      let remaining = 1
      rules.forEach((rule, r) => {
        if (!rule.live[h] || shares[r] === 0 || remaining <= 0) return
        const matched = remaining * shares[r] * rule.live[h]
        hourly[r][h] += volume * matched
        outcome[rule.action][h] += volume * matched
        if (rule.action === 'block') blockedBy[p] += volume * matched
        if (TERMINAL[rule.action]) remaining -= matched
      })
    }
  })
  return { hourly, outcome, blockedBy }
}
