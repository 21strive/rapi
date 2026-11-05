/**
 * The conversation. There is no model in the sample: what the person says is matched against the
 * turns below, in English and in Indonesian, and answered after a short pause. Each turn lands on
 * something visible: a check in the thread, a row of the summary, a line in the trail. Simpul asks
 * one question at a time, with the likely answers as quick replies. Anything it does not follow
 * gets a plain answer and an example to try, never an error.
 */
import { computed, ref } from 'vue'
import { norm, type CheckRow, type DeskReply } from '../_kit/desk'
import {
  ANNUAL_DISCOUNT,
  FIRST_INVOICE,
  HELD_UNTIL,
  INVITES_EXPIRE,
  RENEWS,
  URL_HOST,
  chargeToday,
  contact,
  feePerMonth,
  integrations,
  newcomer,
  owner,
  ownRoles,
  providers,
  regions,
  roleNames,
  roleWhat,
  type AccessKey,
  type PlanKey,
  type RoleKey,
} from './data'
import { emailOf, planOf, usd, type Draft, type RegionKey } from './state'

/** What a `check` message in the thread shows: a DeskCheck, decided or not. */
export interface CardData {
  eyebrow?: string
  title: string
  rows: CheckRow[]
  state?: { tone: 'success' | 'danger' | 'neutral' | 'warning'; label: string; at?: string }
}

export interface ScriptEnv {
  /** The scene's clock: "14:16". */
  now: () => string
  setChips: (chips: string[]) => void
  /** The launch, the same one the surface's button makes. */
  create: () => void
  connect: (key: AccessKey) => void
  open: () => void
}

type Pending =
  | { kind: 'invite-role'; first: string; last: string }
  | { kind: 'sso' }
  | { kind: 'region'; to: RegionKey }
  | { kind: 'call' }
  | null

type Turn = { match: string; reply: (t: string) => DeskReply | DeskReply[] | undefined }

const cap = (word: string) => word.charAt(0).toUpperCase() + word.slice(1)
const lower = (text: string) => text.charAt(0).toLowerCase() + text.slice(1)
const pad = (n: number) => String(n).padStart(2, '0')
const card = (data: CardData): Pick<DeskReply, 'card' | 'data'> => ({ card: 'check', data })
const has = (pattern: string, t: string) => new RegExp(pattern, 'i').test(t)
/** "Webhooks are", "Error tracking is". */
const isAre = (name: string) => (/s$/i.test(name) ? 'are' : 'is')

/** The minute after "14:16", for a card stamped when its reply lands. */
function plusMinute(at: string) {
  const [h, m] = at.split(':').map(Number)
  const total = h * 60 + m + 1
  return `${pad(Math.floor(total / 60) % 24)}:${pad(total % 60)}`
}

function roleIn(t: string): RoleKey | undefined {
  if (has('\\b(admin|administrator)\\b', t)) return 'admin'
  if (has('\\b(billing|penagihan|keuangan|finance)\\b', t)) return 'billing'
  if (has('\\b(viewer|view only|read only|baca saja|lihat saja|pembaca)\\b', t)) return 'viewer'
  if (has('\\b(developer|dev|pengembang|engineer)\\b', t)) return 'developer'
  return undefined
}

function regionIn(t: string): RegionKey | undefined {
  if (has('singapore|singapura|\\bsin-?1\\b', t)) return 'sin-1'
  if (has('frankfurt|\\bfra-?1\\b|\\beu\\b|europe|eropa', t)) return 'fra-1'
  if (has('jakarta|\\bjkt-?1\\b', t)) return 'jkt-1'
  return undefined
}

const INTEGRATION_WORDS: [string, string][] = [
  ['git', 'github|gitlab|git repo|repositor'],
  ['chat', 'slack|chat alert'],
  ['issues', 'issue|jira|linear'],
  ['errors', 'error tracking|errors|sentry'],
  ['storage', 'object storage|storage|bucket'],
  ['webhooks', 'webhook'],
  ['status', 'status page|statuspage'],
  ['paging', 'paging|on-?call|pager'],
]

/** Words after "add" or "tambah" that are not a name: "add SSO", "tambah paging". */
const NOT_NAMES = /^(sso|saml|scim|paging|slack|github|webhooks?|errors?|storage|status|issues?|the|a|an|more|lagi)$/
/** Words that mean "a person" without naming one: "tambah orang", "invite someone". */
const PERSON_WORDS = /^(someone|somebody|person|people|orang|seseorang|another|satu|one|member|members|anggota)$/

function integrationIn(t: string): string | undefined {
  return INTEGRATION_WORDS.find(([, words]) => has(words, t))?.[0]
}

export function createScript(d: Draft, env: ScriptEnv) {
  const pending = ref<Pending>(null)
  const told = new Set<string>()
  const ws = d.ws

  /** The open question as the surface shows it, with the same quick replies as the thread. */
  function questionOf(q: Pending): { title: string; options: string[] } | null {
    if (!q) return null
    if (q.kind === 'invite-role') return { title: `${q.first} ${q.last}: which role?`, options: ['Billing', 'Developer', 'Viewer'] }
    if (q.kind === 'sso') return { title: 'Single sign-on needs Business', options: ['Move to Business', `Keep ${d.plan.value.name}`] }
    if (q.kind === 'call') return { title: `A call with ${contact.name}, ${contact.slot}?`, options: ['Book the call', 'Not now'] }
    const to = regions.find((r) => r.value === q.to)?.label ?? q.to
    return {
      title: `Move the data region to ${to}?`,
      options: [`Switch to ${to.split(' · ')[0]}`, `Keep ${d.region.value.label.split(' · ')[0]}`],
    }
  }

  const question = computed(() => questionOf(pending.value))

  /* ── Suggestions that fit the moment ───────────────────────────────────────────── */

  function suggest(lead: string[] = []): string[] {
    const list: string[] = []
    if (ws.created) {
      if (ws.on.git && !ws.connected.git) list.push('Connect GitHub')
      if (ws.on.chat && !ws.connected.chat) list.push('Sambungkan Slack')
      if (ws.invites.some((i) => i.key === 'hendrik' && i.sent)) list.push("Withdraw Hendrik's invite")
      list.push("What's left?")
      if (!d.waiting.value.length) list.push('Open the workspace')
    } else {
      if (!told.has('plan')) list.push(`Why ${d.plan.value.name}?`)
      if (ws.cycle === 'monthly') list.push('Make it annual')
      if (!ws.invites.some((i) => i.key === newcomer.first.toLowerCase())) list.push(`Tambah ${newcomer.first} ${newcomer.last}`)
      const rina = ws.invites.find((i) => i.key === 'rina')
      if (rina && rina.role !== 'admin') list.push('Rina as admin')
      if (!told.has('region')) list.push('Kenapa Jakarta?')
      list.push("What's left?")
    }
    const merged = [...new Set([...lead, ...list])]
    return ws.created ? merged.slice(0, 3) : [...merged.filter((c) => c !== 'Create it').slice(0, 3), 'Create it']
  }

  /** After a change lands: fresh suggestions, with "Undo that" first. */
  const settle = (lead: string[] = ['Undo that']) => env.setChips(suggest(lead))

  /** The `after` of a reply that changes something: the change, then fresh suggestions. */
  const apply =
    (change: () => unknown, lead?: string[]) =>
    () => {
      change()
      settle(lead)
    }

  /** The `after` of a reply that asks: the one open question. */
  const ask = (question: NonNullable<Pending>) => () => {
    pending.value = question
  }

  /* ── Cards ─────────────────────────────────────────────────────────────────────── */

  /**
   * The check the thread opens on: what the sentence was understood as. The person's own words
   * read plain; what Simpul filled in is marked: the address, the region, the invite addresses
   * and the plan.
   */
  function understood(): CardData {
    return {
      title: 'What I understood',
      rows: [
        { label: 'Company', value: `Logistics, ${ws.size} people` },
        { label: 'Address', value: `${URL_HOST}${ws.slug}`, mono: true, inferred: true },
        { label: 'Data region', value: d.region.value.label, inferred: true, hint: 'Nearest to Surabaya' },
        { label: 'Invites', value: 'Dimas, Rina, Hendrik', inferred: true, hint: `name.surname@${owner.domain}` },
        { label: 'Integrations', value: 'GitHub, Slack, error tracking, webhooks' },
        { label: 'Plan', value: `${d.plan.value.name}, ${ws.cycle}`, inferred: true, hint: d.reasonFor(ws.plan) },
      ],
    }
  }

  /** The receipt after the launch, from the thread or the button: stamped with the minute it lands. */
  function created(): DeskReply {
    const at = plusMinute(env.now())
    const people = d.invited.value.map((i) => i.first)
    const list = people.length > 1 ? `${people.slice(0, -1).join(', ')} and ${people[people.length - 1]}` : people[0]
    const builtIn = d.enabled.value.filter((i) => !providers[i.key]).map((i) => i.name.toLowerCase())
    const asks = d.enabled.value.filter((i) => providers[i.key]).map((i) => providers[i.key])
    return {
      text:
        `${ws.name} is live at ${URL_HOST}${ws.slug}. ` +
        (people.length ? `Invites are on their way to ${list}. ` : '') +
        (builtIn.length ? `${cap(builtIn.join(' and '))} ${builtIn.length > 1 ? 'are' : 'is'} on. ` : '') +
        (asks.length ? `${asks.join(' and ')} need your OK once.` : ''),
      ...card({
        eyebrow: 'Done',
        title: `${ws.name} is live`,
        rows: [
          { label: 'Address', value: `${URL_HOST}${ws.slug}`, mono: true, hint: d.region.value.label },
          { label: 'Invites', value: `${people.length} sent`, hint: `Links valid until ${INVITES_EXPIRE}` },
          { label: 'Billed', value: d.billedToday.value, mono: true, hint: `${d.plan.value.name}, ${ws.cycle}` },
          { label: 'Terms', value: 'Accepted', hint: `Terms of service and the data processing addendum for ${d.region.value.label}` },
        ],
        state: { tone: 'success', label: 'Created', at },
      }),
    }
  }

  function connected(key: AccessKey): DeskReply {
    return {
      text:
        key === 'git'
          ? `GitHub is connected: every push to main deploys to ${d.region.value.label}.`
          : 'Slack is connected: deploys and incidents post to #ops-deploys.',
    }
  }

  /* ── Answers to the one open question ─────────────────────────────────────────── */

  function answer(t: string): DeskReply | undefined {
    const q = pending.value
    if (!q) return undefined
    const no = has('^(no|nope|not now|tidak|nggak|gak|enggak|ga|batal|cancel|skip|never ?mind|lewati|nanti)\\b', t)

    if (q.kind === 'invite-role') {
      const role = roleIn(t)
      const name = `${q.first} ${q.last}`
      if (role) {
        const seats = d.members.value + 1
        return {
          text: `Added ${name} as ${role}. That's ${seats} of ${d.plan.value.seats} seats.`,
          ...card({
            eyebrow: 'Added',
            title: `${name}, ${roleNames[role].toLowerCase()}`,
            rows: [
              { label: `Invite ${pad(ws.invites.length + 1)}`, value: `${name} · ${roleNames[role]}`, inferred: true, hint: emailOf(q) },
              { label: 'Seats', value: `${seats} of ${d.plan.value.seats}`, mono: true },
            ],
          }),
          after: apply(() => {
            pending.value = null
            d.addInvite(q.first, q.last, role)
          }),
        }
      }
      if (no) {
        return {
          text: `Leaving ${q.first} out.`,
          after: apply(() => {
            pending.value = null
          }, []),
        }
      }
      return undefined
    }

    if (q.kind === 'sso') {
      if (has('business|bisnis|move|pindah|naik|upgrade|^(yes|ya|iya|ok(e|ay)?)\\b', t)) {
        const p = planOf('business')
        return {
          text: 'Business it is, with SAML on. Your identity provider asks for its metadata after setup.',
          ...card({
            eyebrow: 'Changed',
            title: 'Plan: Business',
            rows: [
              { label: 'Plan', value: `Business · ${ws.cycle}`, inferred: true, hint: `was ${d.plan.value.name}` },
              { label: 'Single sign-on', value: 'SAML and SCIM', inferred: true },
              { label: 'Billed today', value: usd(chargeToday(p, ws.cycle), ws.cycle === 'annual' ? 0 : 2), mono: true },
            ],
          }),
          after: apply(() => {
            pending.value = null
            d.setPlan('business', true)
          }),
        }
      }
      if (no || has('keep|tetap|later|nanti|scale', t)) {
        return {
          text: `Keeping ${d.plan.value.name}. Say “turn on SAML” when you need single sign-on.`,
          after: apply(() => {
            pending.value = null
          }, []),
        }
      }
      return undefined
    }

    if (q.kind === 'call') {
      if (has('book|pesan|boleh|^(yes|ya|iya|ok(e|ay)?)\\b', t)) {
        return {
          text: `Booked. ${contact.name.split(' ')[0]} calls you on ${contact.slot}; the invite is on its way to ${owner.email}.`,
          after: apply(() => {
            pending.value = null
            d.bookCall()
          }),
        }
      }
      if (no || has('not now|nanti|later|skip', t)) {
        return {
          text: 'No call, then. Say “talk to someone” any time.',
          after: apply(() => {
            pending.value = null
          }, []),
        }
      }
      return undefined
    }

    // A new region, which is permanent.
    const to = regions.find((r) => r.value === q.to)?.label ?? q.to
    if (has('switch|pindah|move|ganti|^(yes|ya|iya|ok(e|ay)?)\\b', t) || regionIn(t) === q.to) {
      return {
        text: `Moved to ${to}. It's fixed once the workspace exists.`,
        ...card({
          eyebrow: 'Changed',
          title: `Data region: ${to}`,
          rows: [
            { label: 'Data region', value: to, inferred: true, hint: `was ${d.region.value.label}` },
            { label: 'Distance', value: regions.find((r) => r.value === q.to)?.description ?? '' },
          ],
        }),
        after: apply(() => {
          pending.value = null
          d.setRegion(q.to)
        }),
      }
    }
    if (no || has('keep|tetap|stay', t) || regionIn(t) === ws.region) {
      return {
        text: `Keeping ${d.region.value.label}.`,
        after: apply(() => {
          pending.value = null
        }, []),
      }
    }
    return undefined
  }

  /* ── Explanations ──────────────────────────────────────────────────────────────── */

  function whyPlan(): DeskReply {
    const p = d.plan.value
    const team = planOf('team')
    const business = planOf('business')
    const text =
      p.key === 'scale'
        ? `Scale fits what you described. Team stops at ${team.seats} seats; Business adds SAML, which you didn't ask for. Moving up later keeps everything.`
        : p.key === 'business'
          ? ws.on.saml
            ? 'Business, because you want SAML: it is the only plan with single sign-on.'
            : 'You picked Business. Without SAML, Scale covers you for a third of the price.'
          : `You picked Team. It holds ${team.seats} seats; with about 30 people, Scale is the one I'd choose.`
    return {
      text,
      ...card({
        eyebrow: `Why ${p.name}`,
        title: `${p.name}, ${usd(feePerMonth(p, ws.cycle))} a month`,
        rows: [
          { label: 'Seats', value: `${d.members.value} of ${p.seats}`, mono: true, hint: p.key === 'team' ? 'Fills up at 10' : `Team stops at ${team.seats}` },
          { label: 'Requests', value: `${p.requests} / month`, mono: true },
          { label: 'Logs', value: p.logs, hint: p.key === 'team' ? undefined : `Team keeps ${team.logs}` },
          { label: 'Support', value: p.support },
          {
            label: 'Single sign-on',
            value: p.sso,
            hint: p.key === 'business' ? undefined : `Business only, ${usd(business.monthly)} a month`,
          },
        ],
      }),
      after: apply(() => told.add('plan'), []),
    }
  }

  function whyRegion(): DeskReply {
    const text =
      ws.region === 'jkt-1'
        ? "You're in Surabaya. Jakarta · JKT-1 is about 9 ms away and keeps builds, logs and databases in Indonesia. Singapore is about 24 ms with three availability zones; Frankfurt is for EU data. The region is the one setting you can't change later."
        : `You moved it to ${d.region.value.label}. ${d.region.value.description} Jakarta · JKT-1 would keep the data in Indonesia.`
    return {
      text,
      after: apply(() => told.add('region'), ws.region === 'jkt-1' && !ws.created ? ['Use Singapore instead'] : []),
    }
  }

  /* ── Turns, in the order they are tried ───────────────────────────────────────── */

  const live = () => ws.created
  const afterLaunch = (what: string): DeskReply => ({
    text: `${ws.name} is live, so ${what} changes in the workspace now. Here I can connect GitHub and Slack, withdraw an invite or turn a tool off.`,
  })

  const turns: Turn[] = [
    {
      // Undo the newest change: "undo that", "batalkan", "gak jadi".
      match:
        '^(undo( that| it| the last( one| change)?)?|batal(kan)?( (itu|tadi|yang tadi))?|revert( that| it)?|urungkan|(gak|nggak|ngga|ga|tidak|enggak) jadi|cancel that|kembalikan( lagi)?|balikin)$',
      reply: () => {
        const target = d.trail.value.find((t) => t.canRevert && !t.revertedAt)
        if (!target) {
          return {
            text: live()
              ? `Nothing here to undo. ${ws.name} itself stays; I can withdraw an invite or turn a tool off.`
              : 'Nothing to undo yet. Anything you change here can be undone until you create the workspace.',
          }
        }
        return {
          text: `Undone: ${lower(target.text)}.`,
          after: apply(() => d.revert(target.id), []),
        }
      },
    },
    {
      // The launch, said: "create it", "buat sekarang", "gas".
      match:
        "^((ok(e|ay)?|ya|yes|good|sip|oke)[ ,]+)?(create|launch|ship|buat|bikin|luncurkan|jalankan|go live|gas|go ahead|lanjut(kan)?|let'?s go)( it| this| the workspace| workspace(nya)?| now| sekarang| aja| saja|kan)*$|create (the )?workspace|looks (good|right)|(semua |sudah |udah )(benar|bener|oke|ok)",
      reply: () => {
        if (live()) return { text: `${ws.name} already exists at ${URL_HOST}${ws.slug}. Ask me what's left, or open it.` }
        pending.value = null
        return { ...created(), after: () => env.create() }
      },
    },
    {
      // After the launch: give GitHub or Slack their OK.
      match: '\\b(connect|sambung(kan)?|hubungkan|allow|izinkan|authori[sz]e)\\b.*\\b(github|git|slack|chat)\\b',
      reply: (t) => {
        const key: AccessKey = has('slack|chat', t) ? 'chat' : 'git'
        const name = providers[key]
        if (!live()) return { text: `${name} connects right after you create the workspace; you give it your OK once, at ${name}.` }
        if (!ws.on[key]) return { text: `${name} is off. Say “turn on ${name}” first.` }
        if (ws.connected[key]) return { text: `${name} is already connected.` }
        return { ...connected(key), after: apply(() => env.connect(key), []) }
      },
    },
    {
      match: '^(open|buka|masuk|go to)\\b',
      reply: () =>
        live()
          ? { text: `Opening ${URL_HOST}${ws.slug}, signed in as owner.`, after: () => env.open() }
          : { text: 'It opens once it exists. Say “create it” when the summary looks right.' },
    },
    {
      // "Kirim undangannya": invites go out with the launch.
      match: '\\b(kirim|send)\\b.*\\b(undangan(nya)?|invites?|invitations?)\\b',
      reply: () =>
        live()
          ? { text: `They went out at ${ws.createdAt} to ${d.invited.value.map((i) => i.first).join(', ')}. Links stay valid until ${INVITES_EXPIRE}.` }
          : {
              text: `Invites go out the moment the workspace exists, to ${ws.invites.map((i) => i.first).join(', ')}. Say “create it” and they're sent.`,
              chips: ['Create it', "What's left?"],
            },
    },
    {
      // Not now: "besok", "save and exit", "nanti saja".
      match:
        "^((create|buat|lanjut)( it)? )?(besok|tomorrow|later|nanti)( saja| aja| ya)?$|^(save( and exit)?|simpan( dulu)?|not now|lain kali|i'?ll finish (it )?(later|tomorrow))$",
      reply: () =>
        live()
          ? { text: `${ws.name} is already live. Whatever is left keeps until you come back.` }
          : {
              text: `Saved. The draft stays here and ${URL_HOST}${ws.slug} is held for you until ${HELD_UNTIL}. Say “create it” when you're ready.`,
            },
    },
    {
      // A person: the Then screen's "Need a hand" card, as a handoff.
      match:
        '^(help|tolong|bantu( saya)?)$|need (a )?hand|butuh bantuan|book a call|call me|\\b(talk|speak) to (someone|a person|a human|sales|an engineer|galih)|\\b(bicara|ngobrol|telepon|telpon) (dengan|sama|ke) (orang|manusia|sales|galih)',
      reply: () => {
        if (ws.call) return { text: `${contact.name.split(' ')[0]} is booked for ${contact.slot}.` }
        return {
          text: `${contact.name}, solutions engineer at Simpul, replies in about 2 h between 09:00 and 18:00 WIB. His next 20-minute slot is ${contact.slot}. Book it?`,
          chips: questionOf({ kind: 'call' })?.options,
          after: ask({ kind: 'call' }),
        }
      },
    },
    {
      match: '(why|kenapa|mengapa|alasan|how come).*(scale|plan|paket|recommend|rekomendasi|business|bisnis|team)',
      reply: () => whyPlan(),
    },
    {
      match: '(why|kenapa|mengapa|alasan|how come).*(jakarta|jkt|region|wilayah|lokasi|indonesia|singapore|singapura|frankfurt)',
      reply: () => whyRegion(),
    },
    {
      match: '^(why|kenapa|mengapa)\\b',
      reply: () => ({
        text: 'Each marked row is my inference: the address from the name, country and region from Surabaya, the emails from yours, the plan from your team. Ask about one, like “why Jakarta?”.',
      }),
    },
    {
      // Take someone off the list, or withdraw their invite once it went out.
      match:
        "\\b(remove|drop|hapus|keluarkan|jangan undang|don'?t invite|withdraw|cabut|tarik|batalkan|uninvite|cancel|skip|without|tanpa)\\b",
      reply: (t) => {
        const inv = ws.invites.find((i) => has(`\\b${i.key}`, t))
        if (!inv) return undefined
        const name = d.nameOf(inv)
        if (live()) {
          if (!inv.sent) return { text: `${inv.first}'s invite is already withdrawn.` }
          return {
            text: `Withdrew ${inv.first}'s invite; the link in that email no longer works.`,
            after: apply(() => d.revertInvite(inv.key), []),
          }
        }
        const seats = d.members.value - 1
        return {
          text: `${name} is off the list; no invite goes out. That's ${seats} of ${d.plan.value.seats} seats.`,
          ...card({
            eyebrow: 'Changed',
            title: `Without ${name}`,
            rows: [
              {
                label: 'Invites',
                value: ws.invites.filter((i) => i !== inv).map((i) => i.first).join(', ') || 'None',
                inferred: true,
                hint: `${name} taken off`,
              },
              { label: 'Seats', value: `${seats} of ${d.plan.value.seats}`, mono: true },
            ],
          }),
          after: apply(() => d.removeInvite(inv.key)),
        }
      },
    },
    {
      match: '\\bsaml\\b|\\bsso\\b|single sign|okta|entra|azure ad|\\bscim\\b',
      reply: (t) => {
        if (has('\\b(no|tanpa|without|matikan|turn off|disable|nggak|gak|tidak)\\b', t)) {
          return { text: ws.on.saml ? 'Say “turn off SAML” and I will.' : 'SAML stays off.' }
        }
        if (has('\\b(later|nanti|after|setelah|next month|bulan depan)\\b', t)) {
          return { text: 'Noted: single sign-on later. Say “turn on SAML” when you need it; it moves you to Business.' }
        }
        if (live()) return afterLaunch('single sign-on')
        if (ws.on.saml) return { text: 'SAML is already on.' }
        if (ws.plan === 'business') {
          return { text: 'SAML is on. Your identity provider asks for its metadata after setup.', after: apply(() => d.setIntegration('saml', true)) }
        }
        const p = planOf('business')
        return {
          text: `Single sign-on needs Business: ${usd(feePerMonth(p, ws.cycle))} a month instead of ${usd(d.fee.value)}. Move to Business, or keep ${d.plan.value.name} and add it later?`,
          chips: questionOf({ kind: 'sso' })?.options,
          after: ask({ kind: 'sso' }),
        }
      },
    },
    {
      // Turn a tool on or off: "turn on paging", "matikan webhooks", "tanpa Slack".
      match:
        '\\b(turn on|turn off|enable|disable|aktifkan|nyalakan|hidupkan|matikan|nonaktifkan|add|tambah(kan)?|pakai|use|no|tanpa|without|remove|hapus|drop|stop|disconnect|putus(kan)?)\\b',
      reply: (t) => {
        const key = integrationIn(t)
        if (!key) return undefined
        const item = integrations.find((i) => i.key === key)!
        const on = !has('\\b(turn off|disable|matikan|nonaktifkan|no|tanpa|without|remove|hapus|drop|stop|disconnect|putus(kan)?)\\b', t)
        const name = providers[key] ?? item.name
        if (live()) {
          if (on) return afterLaunch('adding a tool')
          return {
            text: `${name} ${isAre(name)} off now.`,
            after: apply(() => d.revertIntegration(key) ?? d.setIntegration(key, false), []),
          }
        }
        if (ws.on[key] === on) return { text: `${name} ${isAre(name)} already ${on ? 'on' : 'off'}.` }
        return {
          text: on
            ? `${name} ${isAre(name)} on: ${lower(item.detail)}.`
            : `${name} ${isAre(name)} off. ${d.enabled.value.length - 1} integrations stay on.`,
          ...card({
            eyebrow: 'Changed',
            title: `${item.name}: ${on ? 'on' : 'off'}`,
            rows: [
              { label: item.name, value: on ? 'On' : 'Off', inferred: true, hint: on ? item.detail : undefined },
              { label: 'On', value: `${d.enabled.value.length + (on ? 1 : -1)} of ${integrations.length}`, mono: true },
            ],
          }),
          after: apply(() => d.setIntegration(key, on)),
        }
      },
    },
    {
      // A role for someone on the list, or someone new: "Rina as admin", "tambah Bayu Santoso".
      match: `\\b(${['dimas', 'rina', 'hendrik', newcomer.first.toLowerCase()].join('|')})|\\b(invite|add|tambah(kan)?|undang|ajak)\\s+[a-z]+`,
      reply: (t) => {
        const role = roleIn(t)
        const existing = ws.invites.find((i) => has(`\\b${i.key}`, t))
        if (existing) {
          if (!role) return { text: `${d.nameOf(existing)} is already invited, as ${existing.role}.` }
          if (live()) return afterLaunch("a member's role")
          if (existing.role === role) return { text: `${existing.first} is already ${role === 'admin' ? 'an' : 'a'} ${role}.` }
          const others = ws.invites.filter((i) => i !== existing && i.role === role).map((i) => i.first)
          return {
            text: `${d.nameOf(existing)} is ${role === 'admin' ? 'an' : 'a'} ${role} now${others.length ? `, next to ${others.join(' and ')}` : ''}. ${cap(role)}s ${roleWhat[role]}.`,
            ...card({
              eyebrow: 'Changed',
              title: `${d.nameOf(existing)}: ${role}`,
              rows: [
                { label: 'Role', value: roleNames[role], inferred: true, hint: `was ${existing.role}` },
                { label: 'Email', value: emailOf(existing), mono: true },
              ],
            }),
            after: apply(() => d.setInviteRole(existing.key, role)),
          }
        }
        const words = t.match(/\b(?:invite|add|tambah(?:kan)?|undang|ajak)\s+([a-z]+)(?:\s+(?!as\b|sebagai\b|jadi\b|to\b|ke\b|for\b|untuk\b)([a-z]+))?/)
        if (!words) return undefined
        if (PERSON_WORDS.test(words[1])) {
          return { text: `Who should I invite? Give me the full name, like “invite ${newcomer.first} ${newcomer.last} as viewer”.` }
        }
        if (NOT_NAMES.test(words[1])) return undefined
        if (!words[2]) {
          return { text: `I need the full name for the address, like “invite ${newcomer.first} ${newcomer.last} as viewer”.` }
        }
        if (live()) return afterLaunch('inviting someone')
        const first = cap(words[1])
        const last = cap(words[2])
        if (!role) {
          return {
            text: `${first} ${last}, at ${emailOf({ first, last })}. As what? Billing ${roleWhat.billing}; viewers ${roleWhat.viewer}.`,
            chips: questionOf({ kind: 'invite-role', first, last })?.options,
            after: ask({ kind: 'invite-role', first, last }),
          }
        }
        const seats = d.members.value + 1
        return {
          text: `Added ${first} ${last} as ${role}. That's ${seats} of ${d.plan.value.seats} seats.`,
          ...card({
            eyebrow: 'Added',
            title: `${first} ${last}, ${role}`,
            rows: [
              { label: `Invite ${pad(ws.invites.length + 1)}`, value: `${first} ${last} · ${roleNames[role]}`, inferred: true, hint: emailOf({ first, last }) },
              { label: 'Seats', value: `${seats} of ${d.plan.value.seats}`, mono: true },
            ],
          }),
          after: apply(() => d.addInvite(first, last, role)),
        }
      },
    },
    {
      match: 'singapore|singapura|\\bsin-?1\\b|frankfurt|\\bfra-?1\\b|\\beu\\b|europe|eropa|jakarta|\\bjkt-?1\\b',
      reply: (t) => {
        const to = regionIn(t)!
        const label = regions.find((r) => r.value === to)?.label ?? to
        if (live()) return { text: `The region is fixed now: ${ws.name} lives in ${d.region.value.label}. Moving it means a new workspace.` }
        if (to === ws.region) return { text: `${label} it stays.` }
        if (to === 'jkt-1') {
          return {
            text: 'Back to Jakarta · JKT-1: data stays in Indonesia.',
            ...card({
              eyebrow: 'Changed',
              title: 'Data region: Jakarta · JKT-1',
              rows: [{ label: 'Data region', value: label, inferred: true, hint: `was ${d.region.value.label}` }],
            }),
            after: apply(() => d.setRegion(to)),
          }
        }
        const description = regions.find((r) => r.value === to)?.description ?? ''
        return {
          text: `${label}: ${lower(description)} Builds, logs and databases would leave Indonesia, and the region can't change after creation. Switch?`,
          chips: questionOf({ kind: 'region', to })?.options,
          after: ask({ kind: 'region', to }),
        }
      },
    },
    {
      match: '\\b(annual(ly)?|yearly|tahunan|per tahun|setahun|12 (months|bulan))\\b|\\b(monthly|bulanan|per bulan|tiap bulan)\\b',
      reply: (t) => {
        const cycle = has('monthly|bulanan|per bulan|tiap bulan', t) ? 'monthly' : 'annual'
        if (live()) return afterLaunch('billing')
        if (ws.cycle === cycle) return { text: `It is already ${cycle}.` }
        const p = d.plan.value
        const fee = feePerMonth(p, cycle)
        const today = chargeToday(p, cycle)
        const was = { fee: d.fee.value, today: d.billedToday.value }
        return {
          text:
            cycle === 'annual'
              ? `Annual, then: ${ANNUAL_DISCOUNT * 100}% off, paid up front. ${usd(today)} today instead of ${was.today}, and nothing more until ${RENEWS}.`
              : `Monthly again: ${usd(today, 2)} today for 18–30 Nov, then ${usd(fee)} on ${FIRST_INVOICE}.`,
          ...card({
            eyebrow: 'Changed',
            title: `Billing: ${cycle}`,
            rows: [
              { label: 'Platform fee', value: `${usd(fee)} / month`, mono: true, inferred: true, hint: `was ${usd(was.fee)}` },
              {
                label: 'Billed today',
                value: usd(today, cycle === 'annual' ? 0 : 2),
                mono: true,
                inferred: true,
                hint: cycle === 'annual' ? `12 months up front · was ${was.today}` : `18–30 Nov, prorated · was ${was.today}`,
              },
              { label: cycle === 'annual' ? 'Renews' : 'Next invoice', value: cycle === 'annual' ? RENEWS : FIRST_INVOICE },
            ],
          }),
          after: apply(() => d.setCycle(cycle)),
        }
      },
    },
    {
      // Another plan: "make it Business", "pakai Team", "back to Scale".
      match:
        '\\b(business|bisnis)\\b|(make it|switch|ganti|pakai|use|move|pindah|turun|downgrade|go|back|balik|kembali|keep|tetap)\\b.*\\b(team|scale)\\b|\\b(team|scale) plan\\b|paket (team|scale)',
      reply: (t) => {
        const key: PlanKey = has('business|bisnis', t) ? 'business' : has('\\bteam\\b', t) ? 'team' : 'scale'
        if (live()) return afterLaunch('the plan')
        const p = planOf(key)
        if (ws.plan === key) return { text: `${p.name} it stays.` }
        const lines: Record<PlanKey, string> = {
          business: `Business it is: ${p.seats} seats, SAML and SCIM, ${p.logs} of logs, ${p.support} support.`,
          team: `Team it is: ${p.seats} seats. You're ${d.members.value} now; at 10 people you'll need Scale.`,
          scale: `Back to Scale: room for ${p.seats} seats.`,
        }
        const today = chargeToday(p, ws.cycle)
        return {
          text: `${lines[key]} ${usd(feePerMonth(p, ws.cycle))} a month; ${usd(today, ws.cycle === 'annual' ? 0 : 2)} today.`,
          ...card({
            eyebrow: 'Changed',
            title: `Plan: ${p.name}`,
            rows: [
              { label: 'Plan', value: `${p.name} · ${ws.cycle}`, inferred: true, hint: `was ${d.plan.value.name}` },
              { label: 'Seats', value: `${d.members.value} of ${p.seats}`, mono: true },
              { label: 'Platform fee', value: `${usd(feePerMonth(p, ws.cycle))} / month`, mono: true },
            ],
          }),
          after: apply(() => d.setPlan(key)),
        }
      },
    },
    {
      // The person's own role: "I'm the CTO", "saya platform engineer".
      match: "\\b(i'?m|i am|saya|aku)\\b.*\\b(cto|founder|platform|developer|engineer|product|pm|ops|operations|finance|lead)\\b",
      reply: (t) => {
        const role =
          ownRoles.find((r) => t.includes(r.toLowerCase())) ??
          (has('cto|founder', t)
            ? 'CTO or founder'
            : has('platform', t)
              ? 'Platform engineer'
              : has('product|\\bpm\\b', t)
                ? 'Product manager'
                : has('\\bops\\b|operations', t)
                  ? 'Operations'
                  : has('finance', t)
                    ? 'Finance or billing'
                    : has('lead', t)
                      ? 'Engineering lead'
                      : 'Developer')
        if (live()) return afterLaunch('your profile')
        const said = /^[A-Z]{2,}/.test(role) ? role : lower(role)
        if (role === ws.role) return { text: `Your role is already ${said}.` }
        return { text: `Noted: your role is ${said}. Your first project's defaults follow from it.`, after: apply(() => d.setOwnRole(role)) }
      },
    },
    {
      match: '\\b(\\d{1,4})\\s*(people|orang|staff|karyawan|employees|pegawai|of us)\\b',
      reply: (t) => {
        const n = Number(t.match(/\b(\d{1,4})\s*(?:people|orang|staff|karyawan|employees|pegawai|of us)\b/)?.[1] ?? 0)
        const size = n <= 10 ? '1–10' : n <= 50 ? '11–50' : n <= 200 ? '51–200' : '201+'
        if (live()) return afterLaunch('the team size')
        if (size === ws.size) return { text: `Still ${size} people. ${d.plan.value.name} covers the ${d.members.value} joining now.` }
        return {
          text: `${size} people, then. ${d.plan.value.name} still covers the ${d.members.value} joining now; seats grow as people join.`,
          after: apply(() => d.setSize(size)),
        }
      },
    },
    {
      match: '\\b(rename( it)?( to)?|call it|name it|ganti nama( jadi| ke)?|namanya( jadi)?|nama(nya)? jadi)\\s+(.+)$',
      reply: (t) => {
        const raw = t.match(/(?:rename(?: it)?(?: to)?|call it|name it|ganti nama(?: jadi| ke)?|namanya(?: jadi)?|nama(?:nya)? jadi)\s+(.+)$/)?.[1] ?? ''
        const name = raw.split(' ').filter(Boolean).map(cap).join(' ')
        if (name.length < 2) return undefined
        if (live()) return afterLaunch('the name')
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
        return {
          text: `Renamed to ${name}; the address follows: ${URL_HOST}${slug}. It's free.`,
          ...card({
            eyebrow: 'Changed',
            title: name,
            rows: [
              { label: 'Name', value: name, hint: `was ${ws.name}` },
              { label: 'Address', value: `${URL_HOST}${slug}`, mono: true, inferred: true },
            ],
          }),
          after: apply(() => d.rename(name)),
        }
      },
    },
    {
      match: "what'?s left|anything (left|else)|what now|what next|what remains|status|apa lagi|sisa(nya)?|tinggal apa|masih ada|\\bready\\b|siap|next step|langkah|to ?do",
      reply: () => {
        if (live()) {
          const waiting = d.waiting.value.map((k) => providers[k])
          return {
            text: waiting.length
              ? `${waiting.join(' and ')} ${waiting.length > 1 ? 'wait' : 'waits'} for your OK; everything else is done. Invites expire ${INVITES_EXPIRE}.`
              : `Nothing. ${ws.name} is live, the tools are connected and invites expire ${INVITES_EXPIRE}.`,
            chips: suggest([]),
          }
        }
        const { simpul, total } = d.tally.value
        return {
          text: `Nothing to fill in. ${simpul} of ${total} settings are my inference, marked in the summary; the data region is the one you can't change later.`,
          ...card({
            eyebrow: 'Left to do',
            title: 'One confirm',
            rows: [
              { label: 'To fill in', value: 'Nothing' },
              { label: 'To check', value: `${simpul} marked settings`, inferred: true, hint: 'Address, country, region, emails, plan, tools left off' },
              { label: 'To confirm', value: 'Create workspace' },
            ],
          }),
          chips: suggest(['Create it']),
        }
      },
    },
    {
      match: 'how much|\\bcost|price|\\bpay\\b|berapa|harga|biaya|bayar|tagihan|invoice|charge',
      reply: () => {
        const p = d.plan.value
        const annual = chargeToday(p, 'annual')
        return {
          text:
            ws.cycle === 'annual'
              ? `${d.billedToday.value} ${live() ? 'was billed' : 'today'} for 12 months, ${ANNUAL_DISCOUNT * 100}% off; it renews on ${RENEWS}. Prices exclude tax.`
              : `${d.billedToday.value} ${live() ? 'was billed' : 'today'} for 18–30 Nov, then ${usd(d.fee.value)} on ${FIRST_INVOICE} and every month after. Prices exclude tax.${live() ? '' : ` Annual would be ${usd(annual)} up front, ${ANNUAL_DISCOUNT * 100}% off.`}`,
        }
      },
    },
    {
      match: '^(hi|hello|hey|halo|hai|pagi|siang|sore|malam|selamat)\\b',
      reply: () => ({
        text: live()
          ? `Hello ${owner.name.split(' ')[0]}. ${ws.name} is live; ask what's left, or connect GitHub and Slack.`
          : `Hello ${owner.name.split(' ')[0]}. Say what to change in the summary, ask why I picked something, or say “create it”.`,
      }),
    },
    {
      match: 'thank|makasih|terima ?kasih|\\bthx\\b|suwun|nuhun',
      reply: () => ({ text: live() ? `You're welcome. I'll tell you when people join.` : `You're welcome.` }),
    },
    {
      match: '^(yes|ya|iya|yup|ok(e|ay)?|sip|no|nope|tidak|nggak|gak|enggak)$',
      reply: () => ({ text: live() ? 'Noted.' : 'Say what to change, or “create it” if the summary looks right.' }),
    },
  ]

  function fallback(): DeskReply {
    return {
      text: live()
        ? `${ws.name} is live. I can connect GitHub and Slack, withdraw an invite or turn a tool off. Try “connect GitHub”.`
        : 'I can set up the workspace from a description, change anything in the summary or explain a choice. Try “make it annual” or “kenapa Jakarta?”.',
    }
  }

  function respond(said: string): DeskReply | DeskReply[] {
    const t = norm(said).replace(/[.!?,;:]+$/g, '')
    let dropped = false
    if (pending.value) {
      const reply = answer(t)
      if (reply) return reply
      // Something else was said: the question is dropped, the new instruction is handled.
      pending.value = null
      dropped = true
    }
    let reply: DeskReply | DeskReply[] | undefined
    for (const turn of turns) {
      if (!has(turn.match, t)) continue
      reply = turn.reply(t)
      if (reply) break
    }
    reply ??= fallback()
    // The quick replies of a dropped question no longer apply.
    if (dropped && !Array.isArray(reply) && !reply.chips) reply = { ...reply, chips: suggest() }
    return reply
  }

  return { respond, pending, question, suggest, understood, created, connected }
}

export type Script = ReturnType<typeof createScript>
