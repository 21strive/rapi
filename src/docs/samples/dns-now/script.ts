/**
 * What Simpul understands on the DNS desk. There is no model in the sample: each sentence is
 * matched against patterns in English and Indonesian, and every answer is built from the zone as
 * it is at that moment, so a question after a change gets the changed answer. Each reply lands on
 * something visible: a check to read, a change waiting under Needs you, highlighted records, a
 * line in the trail. Anything outside the script gets a plain answer and an example to try.
 */
import { hits, norm, type DeskReply } from '../_kit/desk'
import { NEWMAIL, LB, ME, SHOP, WEB1, ZONE, later, proxiable, short, ttlOf, zoneFile, type Change, type Rec, type Topic } from './data'
import { counted, lbChange, listOf, mailChange, onLb, proxyChange, removeChange, ttlChange, verifyChange, type Style } from './changes'
import type { Zone } from './zone'

/** What the thread's card slot renders. */
export type CardData =
  | { id: string }
  | { title: string; items: { id: string; type: string; name: string; content: string; meta: string }[] }
  | { code: string; count: number }

const P = {
  hello: '^(hi|hello|hey|halo|hai|pagi|siang|sore|selamat \\w+)\\b',
  thanks: '\\b(thanks?|thank you|makasih|terima ?kasih|thx|tq)\\b',
  undo: '\\b(undo|roll ?back|revert|kembalikan|balikin|urungkan)\\b',
  cancel: '\\b(batal\\w*|cancel\\w*|never ?mind|gak jadi|ga jadi|nggak jadi|tidak jadi|discard|drop it)\\b',
  status: "(what'?s left|whats left|what is left|apa lagi|\\bstatus\\b|\\bsisa\\w*|what needs me|\\bprogress\\b|how far|sampai mana|gimana)",
  why: '\\b(why|kenapa|mengapa|how come|alasan\\w*)\\b',
  export: '\\b(export|ekspor|zone ?file|bind file|unduh|download)\\b',
  schedule: '(\\b23[:.]?00\\b|\\b11 ?pm\\b|\\btonight\\b|nanti malam|malam ini|\\bjadwal\\w*|\\bschedul\\w*|\\bjam 23\\b)',
  nowWord: '\\b(now|sekarang)\\b',
  commit: '^(apply|approve|go ahead|do it|ship it|yes|yep|ya|iya|ok|okay|oke|lanjut\\w*|terapkan|setuju|jalankan|gas|confirm|konfirmasi)\\b',
  anyway: '\\b(anyway|tetap|force|paksa)\\b',
  ttl: '\\bttl\\b',
  cname: '\\bcname\\b',
  addr: '\\b(a records?|a and aaaa|addresses|address|alamat|ip)\\b',
  styleVerb: '\\b(use|pakai|ganti|switch|make|jadikan|instead|saja)\\b',
  oldIp: '(\\bold (ip|address|origin|server|provider)\\b|ip lama|alamat lama|server lama|what (still )?points|\\bpoints? (at|to)\\b|mengarah|still on mailroute|masih (di|ke))',
  ip: '\\b\\d{1,3}(\\.\\d{1,3}){3}\\b|\\b[0-9a-f]{1,4}(:[0-9a-f]{0,4}){2,7}\\b',
  show: "\\b(show|list|tampilkan|lihat|find|cari|which|apa saja|what are|what'?s on|whats on|what is on|isi)\\b",
  verify: '\\b(verif\\w*|kotak|surat|workspace)\\b',
  mail: '\\b(mail|email|e-mail|surel|mx|provider|penyedia)\\b',
  proxy: '\\b(proxy|proxied|dns only|dns-only)\\b',
  remove: '\\b(hapus|delete|remove)\\b',
  lb: '\\b(shop|toko|load ?balancer|lb-jkt-2|lb)\\b',
}

/** Names Simpul recognises in a sentence. */
const KNOWN = ['www', 'api', 'app', 'cdn', 'pay', 'docs', 'status', 'staging', 'vpn', 'shop']

export function createScript(zone: Zone, setChips: (chips: string[]) => void) {
  const first = ME.split(' ')[0]
  const has = (pattern: string, t: string) => new RegExp(pattern, 'i').test(t)
  /** The reply lands a minute after the person speaks: times in it are counted from then. */
  const at = () => later(zone.time(), 1)

  /* ── Suggestions that still make sense once this reply has landed ─────────────── */

  function fits(chip: string): boolean {
    const s = zone.state
    switch (chip) {
      case 'Apply it':
      case 'Why A records?':
      case 'Use a CNAME instead':
        return zone.pending.value.length > 0
      case 'Apply it now':
        return zone.pending.value.length > 0 || zone.scheduled.value.length > 0
      case 'Schedule it for 23:00 WIB':
        return zone.pending.value.length > 0 && !zone.needsHold(zone.pending.value[0])
      case 'Move them to lb-jkt-2 too':
        return zone.web1Left.value.length > 0
      case 'Point shop at the new load balancer':
        return !onLb(zone.records.value, SHOP.name) && !zone.pending.value.some((c) => c.names?.includes(SHOP.name))
      case 'Move mail to the new provider':
        return !zone.latest('mail', ['pending', 'scheduled', 'applied'])
      case 'Tambahkan record verifikasi Kotak Surat':
        return !s.verified && !zone.latest('verify', ['pending', 'applied'])
      case 'Lower the TTL first':
        return !s.ttlLowered && !zone.latest('ttl', ['pending', 'applied'])
      case 'Schedule the mail move for 23:00 WIB':
      case 'Apply the mail move now':
        return !!zone.latest('mail') && s.verified
      case 'Undo that':
      case 'Roll back':
        return !!zone.lastDone()
      default:
        return true
    }
  }

  /** The suggestions from a list that still fit the zone as it is now. */
  function suggest(list: string[]): string[] {
    const chips = list.filter(fits)
    return (chips.length ? chips : ['What’s left?', 'Show the MX records', 'Export the zone file']).slice(0, 4)
  }

  /** A reply whose suggestions are chosen after its action has landed. */
  function reply(text: string, next: string[], opts: { card?: string; data?: CardData; act?: () => void } = {}): DeskReply {
    return {
      text,
      card: opts.card,
      data: opts.data,
      after: () => {
        opts.act?.()
        setChips(suggest(next))
      },
    }
  }

  const check = (change: Change, text: string, next: string[]) =>
    reply(text, next, { card: 'check', data: { id: change.id }, act: () => zone.propose(change) })

  function recordsCard(title: string, list: Rec[]): CardData {
    return {
      title,
      items: list.map((r) => ({
        id: r.id,
        type: r.type,
        name: short(r.name),
        content: r.content,
        meta: proxiable(r.type) && r.proxied ? 'Proxied' : ttlOf(r),
      })),
    }
  }

  function namesIn(t: string): string[] {
    const out: string[] = []
    if (/(^|[\s,(])(apex|root|@)(?=$|[\s,.?)])/.test(t) || /(^|[\s,(])lintang\.example\b/.test(t)) out.push(ZONE.name)
    if (/\b(site|website|situs)\b/.test(t)) out.push(ZONE.name, 'www')
    for (const n of KNOWN) if (new RegExp(`(^|[^\\w.-])${n}(\\.lintang\\.example)?(?![\\w-])`).test(t)) out.push(n)
    if (!out.length && /\b(them|those|both|semua|keduanya)\b/.test(t)) out.push(...zone.state.lastNames)
    return [...new Set(out)]
  }

  function topicIn(t: string): Topic | undefined {
    if (has(P.verify, t)) return 'verify'
    if (has(P.ttl, t)) return 'ttl'
    if (has(P.mail, t)) return 'mail'
    if (has(P.proxy, t)) return 'proxy'
    if (has(P.lb, t) || /\b(www|apex|site)\b/.test(t)) return 'lb'
    return undefined
  }

  const lower = (title: string) => title.charAt(0).toLowerCase() + title.slice(1)

  /* ── What Simpul says once a change lands ──────────────────────────────────────── */

  function appliedSay(c: Change, when: string): string {
    switch (c.topic) {
      case 'lb': {
        const added = [...new Set(c.ops.filter((o) => !o.before).map((o) => o.after!.name))]
        if (added.includes(SHOP.name)) {
          return `Applied. shop answers from the edge now. Jakarta, Surabaya and Singapore cached the miss; they turn over by ${later(when, 28)}.`
        }
        if (added.length) return `Applied. ${listOf(added)} answers from the edge now.`
        return `Applied. ${listOf(c.names ?? [])} now reach lb-jkt-2 through the edge. Resolvers see no change, so there is nothing to wait for.`
      }
      case 'mail': {
        const lowered = zone.state.ttlLowered
        return `Applied. Senders with a fresh answer deliver to Kotak Surat now; the rest follow within ${lowered ? '5 min' : 'the hour'}. Keep Mailroute accepting mail until ${later(when, lowered ? 5 : 60)}.`
      }
      case 'verify':
        return `Added. Kotak Surat sees the token as resolvers drop the old TXT answer, by ${later(when, 56)} at the latest. I will post here when it verifies.`
      case 'ttl':
        return `Lowered. Resolvers pick up the 5 min TTL as their 1 hr answers run out, by ${later(when, 56)}. Mail still goes to Mailroute.`
      case 'proxy':
        return `Applied: ${lower(c.title)}.`
      case 'remove':
        return `Deleted. ${c.ops[0]?.before ? short(c.ops[0].before.name) : 'It'} answers “no such name” as cached answers run out. Revert under Done by Simpul brings it back.`
      default:
        return 'Applied.'
    }
  }

  function nextAfterApply(c: Change): string[] {
    switch (c.topic) {
      case 'lb':
        return c.ops.some((o) => !o.before && o.after?.name === SHOP.name)
          ? ['What points at the old IP?', 'Move mail to the new provider', 'Undo that']
          : ['Move mail to the new provider', 'What’s left?', 'Roll back']
      case 'verify':
        return ['Lower the TTL first', 'What’s left?', 'Undo that']
      case 'ttl':
        return ['Schedule the mail move for 23:00 WIB', 'What’s left?', 'Undo that']
      case 'mail':
        return ['What’s left?', 'Roll back', 'Export the zone file']
      default:
        return ['What’s left?', 'Undo that']
    }
  }

  /* ── Turns ─────────────────────────────────────────────────────────────────────── */

  function undo(): DeskReply {
    const last = zone.lastDone()
    if (last?.kind === 'apply') {
      const c = last.change
      return reply(`Reverted ${c.id}. ${c.revertSay}`, ['What’s left?', 'What points at the old IP?'], { act: () => zone.revert(c.id) })
    }
    if (last?.kind === 'schedule') {
      const c = last.change
      return reply(`${c.title} is no longer scheduled for 23:00; it is back under Needs you.`, ['Apply it now', 'What’s left?'], {
        act: () => zone.unschedule(c.id),
      })
    }
    const p = zone.pending.value[0]
    if (p) return discardReply(p)
    return reply(
      'Nothing from this conversation to undo. The last change to the zone was Dimas’s vpn failover at 11:41; revert it under Done by Simpul if you mean that one.',
      ['What’s left?', 'Point shop at the new load balancer'],
    )
  }

  function discardReply(c: Change): DeskReply {
    return reply(`Discarded ${c.id}. Nothing changed in the zone.`, ['What’s left?', 'Point shop at the new load balancer', 'Move mail to the new provider'], {
      act: () => zone.discard(c.id),
    })
  }

  function cancel(): DeskReply {
    const p = zone.pending.value[0]
    if (p) return discardReply(p)
    const s = zone.scheduled.value[zone.scheduled.value.length - 1]
    if (s) {
      return reply(`Cancelled: ${lower(s.title)} will not run at 23:00.`, ['What’s left?'], { act: () => zone.discard(s.id) })
    }
    return undo()
  }

  function status(): DeskReply {
    const bits: string[] = []
    const p = zone.pending.value
    const s = zone.scheduled.value
    const live = zone.settling.value
    if (p.length) bits.push(`Waiting for you: ${p.map((c) => lower(c.title)).join('; ')}.`)
    if (s.length) bits.push(`At 23:00 WIB: ${s.map((c) => lower(c.title)).join('; ')}.`)
    if (live.length) {
      bits.push(`Settling: ${live.map((w) => `${w.host} ${w.type}, ${w.probes.filter((x) => x.state === 'match').length} of 10 resolvers`).join('; ')}.`)
    }
    const m = zone.mail.value
    if (zone.latest('mail', ['pending', 'scheduled', 'applied'])) {
      bits.push(`Mail: ${m.verify === 'done' ? 'Kotak Surat has verified the domain' : 'Kotak Surat has not verified the domain yet'}, and MX ${m.ttl === 'done' ? 'is at 5 min' : 'still has a 1 hr TTL'}.`)
    }
    const text = bits.length ? bits.join(' ') : `Nothing is waiting for you, settling or scheduled. lintang.example has ${zone.records.value.length} records.`
    return reply(text, ['Apply it', 'Move mail to the new provider', 'Lower the TTL first', 'Undo that', 'Show the MX records', 'Export the zone file'])
  }

  /* Why: the reason behind what was proposed, with the records it rests on highlighted. */
  function why(t: string): DeskReply {
    const lb = zone.latest('lb', ['pending', 'scheduled', 'applied'])
    if (has('\\b(flatten\\w*|apex|root)\\b', t)) return whyApex(lb)
    if (has('\\b(cached|miss|error|no such name|nxdomain|wait\\w*)\\b', t)) return whyMiss()
    if (has(P.cname, t) && !has('\\bnot a cname\\b', t)) return whyCname(lb)
    if (has('\\b(a records?|aaaa|addresses|address|alamat|ip|not a cname)\\b', t)) return whyAddress()
    if (has('\\b(spf|mailroute|keep)\\b', t)) return whySpf()
    if (has('\\b(bounce\\w*|verif\\w*|kotak|surat)\\b', t)) return whyBounce()
    if (has('\\b(ttl|lower\\w*|first|dulu)\\b', t)) return whyTtl()
    if (has('\\b(vpn|gateway)\\b', t)) return whyVpn()
    const c = zone.pending.value[0] ?? zone.latest(undefined, ['pending', 'scheduled', 'applied'])
    switch (c?.topic) {
      case 'lb':
        return c.style === 'cname' ? (c.names?.includes(ZONE.name) ? whyApex(c) : whyCname(c)) : whyAddress()
      case 'mail':
        return whyMail()
      case 'verify':
        return whyBounce()
      case 'ttl':
        return whyTtl()
      case 'proxy':
        return reply(c.notes[0]?.text ?? 'That is the setting you asked for.', ['Apply it', 'What’s left?'])
      default:
        return reply('Ask about anything waiting or done: why an address, why a warning. For example “Why A records?”.', ['What points at the old IP?'])
    }
  }

  function whyAddress(): DeskReply {
    return reply(
      `lb-jkt-2 has fixed addresses, and app and api already answer with an A and AAAA pair, so I matched them. A CNAME to ${LB.host} would follow the load balancer if those addresses ever change.`,
      ['Use a CNAME instead', 'Apply it', 'What points at the old IP?'],
      { act: () => (zone.highlight.value = ['r04', 'r05', 'r06', 'r07']) },
    )
  }

  function whyCname(c?: Change): DeskReply {
    const name = c?.names?.length ? listOf(c.names) : 'shop'
    return reply(
      `A CNAME follows lb-jkt-2 if its addresses change, so nobody has to edit ${name} again. It is proxied, so the edge flattens it and visitors still get edge addresses.`,
      ['Apply it', 'Schedule it for 23:00 WIB', 'What points at the old IP?'],
    )
  }

  function whyApex(c?: Change): DeskReply {
    const ids = zone.records.value.filter((r) => r.name === ZONE.name && ['MX', 'TXT', 'CAA'].includes(r.type)).map((r) => r.id)
    const text =
      c?.style === 'cname'
        ? 'A CNAME cannot share its name with other records, and lintang.example also holds MX, TXT and CAA. A plain CNAME there would hide them and mail would stop. Flattened, the edge looks up lb-jkt-2 and answers with its addresses, so those records keep working.'
        : 'lintang.example keeps A and AAAA records because a CNAME cannot share the apex with its MX, TXT and CAA records. With addresses there, nothing is hidden.'
    return reply(text, ['Apply it', 'Schedule it for 23:00 WIB', 'Move mail to the new provider'], { act: () => (zone.highlight.value = ids) })
  }

  function whyMiss(): DeskReply {
    return reply(
      `Resolvers remember a “no such name” answer for the zone’s negative TTL, ${SHOP.missFor} min. Anyone whose resolver asked for shop before it existed keeps that answer until it runs out; nothing on our side can clear it sooner.`,
      ['Apply it', 'What points at the old IP?'],
    )
  }

  function whySpf(): DeskReply {
    return reply(
      `Some mail still leaves through Mailroute until every system has switched. Keeping both in SPF lets it pass checks; Mailroute comes out after ${NEWMAIL.spfUntil}.`,
      ['Tambahkan record verifikasi Kotak Surat', 'Lower the TTL first', 'What’s left?'],
      { act: () => (zone.highlight.value = ['r17']) },
    )
  }

  /** Why the mail move is shaped the way it is, given what has already landed. */
  function whyMail(): DeskReply {
    const m = zone.mail.value
    if (m.verify !== 'done') return whyBounce()
    if (m.ttl !== 'done') return whyTtl()
    return reply(
      `Both things it waited for are in place: Kotak Surat has verified the domain, and every resolver holds MX for 5 min, so the switch overlaps with Mailroute for 5 min at most. Mailroute stays in SPF until ${NEWMAIL.spfUntil} for mail already queued there.`,
      ['Apply it now', 'Schedule the mail move for 23:00 WIB', 'What’s left?'],
    )
  }

  function whyBounce(): DeskReply {
    return reply(
      'Kotak Surat rejects mail for a domain it has not verified, so anything sent to mx.kotaksurat.example before then bounces back to the sender. The verification goes first, and the move waits until Kotak Surat has seen it.',
      ['Tambahkan record verifikasi Kotak Surat', 'Lower the TTL first', 'What’s left?'],
    )
  }

  function whyTtl(): DeskReply {
    return reply(
      'Resolvers keep an MX answer for its TTL. At 1 hr, some senders still deliver to Mailroute an hour after the switch. Lowered first, the overlap is 5 min; it has to happen an hour ahead, because answers already cached carry the old TTL.',
      ['Apply it', 'Schedule the mail move for 23:00 WIB', 'What’s left?'],
      { act: () => (zone.highlight.value = ['r15', 'r16']) },
    )
  }

  function whyVpn(): DeskReply {
    return reply(
      'Dimas moved vpn to gateway 2 at 11:41, after gateway 1 failed its health check at 11:39. Frankfurt and São Paulo were the last resolvers to follow.',
      ['What’s left?', 'Point shop at the new load balancer'],
      { act: () => (zone.highlight.value = ['r13']) },
    )
  }

  function exportZone(): DeskReply {
    const list = zone.records.value
    return reply(
      `lintang.example as a BIND zone file, ${list.length} records. Proxied records publish edge addresses; the origin values in it stay private to your account.`,
      ['What’s left?', 'Show the MX records'],
      { card: 'zonefile', data: { code: zoneFile(list, at()), count: list.length } },
    )
  }

  function scheduleIt(t: string): DeskReply {
    const topic = topicIn(t)
    const c = topic ? zone.latest(topic) : zone.pending.value[0]
    if (!c) {
      return reply(
        topic === 'mail' && zone.latest('mail', ['scheduled'])
          ? 'The mail move is already scheduled for 23:00 WIB.'
          : 'Nothing is waiting to schedule yet. Say the change first, then “schedule it for 23:00”.',
        ['Move mail to the new provider', 'Point www at the new load balancer', 'What’s left?'],
      )
    }
    if (zone.needsHold(c) && zone.mail.value.verify !== 'settling') {
      return reply(
        'At 23:00 it would still bounce, unless Kotak Surat has verified the domain by then. Add the verification first and I will schedule the move.',
        ['Tambahkan record verifikasi Kotak Surat', 'Why does it bounce?'],
      )
    }
    const act = () => zone.schedule(c.id)
    if (c.topic === 'lb' && c.ops.some((o) => !o.before && o.after?.name === SHOP.name)) {
      return reply(
        'Scheduled for 23:00 WIB. Until then shop keeps answering “no such name”, including to everyone who clicks the 11:20 email. Say “apply it now” if that is not what you want.',
        ['Apply it now', 'What points at the old IP?', 'What’s left?'],
        { act },
      )
    }
    if (c.topic === 'lb') {
      return reply(
        'Scheduled for 23:00 WIB, when lintang.example sees about 9% of its midday traffic. I will apply it then and post here.',
        ['Move mail to the new provider', 'What’s left?', 'Undo that'],
        { act },
      )
    }
    if (c.topic === 'mail') {
      return reply(
        `Scheduled for 23:00 WIB. ${zone.state.ttlLowered ? 'With MX at 5 min, Mailroute only has to accept mail until 23:05.' : 'MX still has a 1 hr TTL, so Mailroute has to accept mail until 00:00.'}`,
        ['What’s left?', 'Undo that', 'Export the zone file'],
        { act },
      )
    }
    return reply(`Scheduled for 23:00 WIB: ${lower(c.title)}.`, ['What’s left?', 'Undo that'], { act })
  }

  function commit(t: string): DeskReply {
    const topic = topicIn(t)
    const c = topic ? zone.latest(topic, ['pending', 'scheduled']) : (zone.pending.value[0] ?? zone.scheduled.value[zone.scheduled.value.length - 1])
    if (!c) {
      return reply('Nothing is waiting for approval. Say a change, like “Point www at the new load balancer”.', [
        'Point www at the new load balancer',
        'Move mail to the new provider',
      ])
    }
    if (c.topic === 'remove') {
      const name = c.ops[0]?.before?.name ?? ''
      if (!namesIn(t).includes(name) && !has(P.anyway, t)) {
        return reply(`Deleting is held, not clicked: hold Delete under Needs you, or type “delete ${short(name)}” to confirm.`, ['Batal', 'What’s left?'])
      }
    } else if (zone.needsHold(c) && !has(P.anyway, t)) {
      return reply(
        'That one bounces mail until Kotak Surat verifies lintang.example. Hold Apply under Needs you, or say “apply anyway”, if you mean it; or add the verification first.',
        ['Tambahkan record verifikasi Kotak Surat', 'Why does it bounce?'],
      )
    }
    return reply(appliedSay(c, at()), nextAfterApply(c), { act: () => zone.apply(c.id) })
  }

  function lowerTtl(t: string): DeskReply {
    const mailContext = has(P.mail, t) || !!zone.latest('mail', ['pending', 'scheduled', 'applied'])
    if (!mailContext) {
      const c = zone.pending.value[0]
      const name = c?.topic === 'lb' && c.names?.length ? listOf(c.names) : 'shop'
      return reply(
        `${name} is proxied, so its TTL is Auto: resolvers only ever see the edge, and there is nothing to lower. Where TTL matters today is mail: MX still has 1 hr.`,
        ['Move mail to the new provider', 'Apply it'],
      )
    }
    if (zone.state.ttlLowered) return reply('MX already has a 5 min TTL everywhere.', ['Apply the mail move now', 'Schedule the mail move for 23:00 WIB'])
    const applied = zone.latest('ttl', ['applied'])
    if (applied) return reply(`Already lowered at ${applied.doneAt}; every resolver holds 5 min by ${zone.mail.value.ttlBy}.`, ['What’s left?'])
    const waiting = zone.latest('ttl')
    if (waiting) return reply(`It is waiting under Needs you as ${waiting.id}.`, ['Apply it', 'Why lower it first?'])
    const change = ttlChange(zone.records.value, { id: zone.nextId(), at: at() })
    return check(
      change,
      `MX goes to 5 min now, and mail keeps going to Mailroute. Once every resolver has the short TTL, by ${later(at(), 57)}, the switch itself overlaps for 5 min at most.`,
      ['Apply it', 'Why lower it first?', 'Schedule the mail move for 23:00 WIB'],
    )
  }

  function restyle(style: Style): DeskReply {
    const c = zone.latest('lb')
    if (!c?.names) {
      return reply(`Noted: names I point at lb-jkt-2 from now on get ${style === 'cname' ? 'a CNAME' : 'an A and AAAA pair'}.`, ['Point www at the new load balancer'], {
        act: () => (zone.state.style = style),
      })
    }
    const change = lbChange(zone.records.value, c.names, style, { id: zone.nextId(), at: at() })
    const text =
      style === 'cname'
        ? `Done: one CNAME to ${LB.host} instead of the address pair. It is proxied, so the edge flattens it and visitors still get edge addresses.`
        : 'Done: an A and AAAA pair on lb-jkt-2’s addresses instead of the CNAME.'
    return reply(text, ['Apply it', style === 'cname' ? 'Why a CNAME?' : 'Why A records?', 'Schedule it for 23:00 WIB'], {
      card: 'check',
      data: { id: change.id },
      act: () => {
        zone.state.style = style
        zone.propose(change)
      },
    })
  }

  function pointsAt(t: string): DeskReply {
    const ip = t.match(new RegExp(P.ip, 'i'))?.[0]
    if (ip) {
      const list = zone.pointingAt(ip)
      return reply(
        list.length ? `${counted(list.length, 'record')} point${list.length === 1 ? 's' : ''} at ${ip}.` : `Nothing in lintang.example points at ${ip}.`,
        list.length ? ['Move them to lb-jkt-2 too', 'What’s left?'] : ['What points at the old IP?'],
        {
          card: list.length ? 'records' : undefined,
          data: list.length ? recordsCard(`Pointing at ${ip}`, list) : undefined,
          act: () => {
            zone.highlight.value = list.map((r) => r.id)
            if (list.length) zone.state.lastNames = [...new Set(list.map((r) => r.name))]
          },
        },
      )
    }
    const mailFocus = has(P.mail, t) || has('mailroute|old provider|provider lama', t) || ['mail', 'verify', 'ttl'].includes(zone.latest(undefined, ['pending', 'scheduled', 'applied'])?.topic ?? '')
    if (mailFocus) {
      const list = zone.records.value.filter((r) => r.content.includes('mailroute') || r.id === 'r19')
      if (!list.some((r) => r.type === 'MX')) {
        return reply('Inbound mail no longer points at Mailroute. SPF still allows it until 4 Nov, for mail already queued there.', ['What’s left?'], {
          act: () => (zone.highlight.value = list.map((r) => r.id)),
        })
      }
      return reply(
        'Still on Mailroute: both MX records, the SPF include and the DKIM key sel1._domainkey. mail.lintang.example (198.51.100.20) is your own relay and stays as it is.',
        ['Tambahkan record verifikasi Kotak Surat', 'Lower the TTL first', 'What’s left?'],
        { card: 'records', data: recordsCard('Still on Mailroute', list), act: () => (zone.highlight.value = list.map((r) => r.id)) },
      )
    }
    const left = zone.web1Left.value
    if (!left.length) {
      return reply(`Nothing in lintang.example points at web-1 (${WEB1.v4}) any more, so it can be retired.`, ['Move mail to the new provider', 'What’s left?'])
    }
    const names = [...new Set(left.map((r) => r.name))]
    const text =
      names.length === 2 && names.includes(ZONE.name) && names.includes('www')
        ? `lb-jkt-2 replaces web-1 at ${WEB1.v4}. Two names still point at it: lintang.example (with ${WEB1.v6} for IPv6) and www. Nothing else does.`
        : `lb-jkt-2 replaces web-1 at ${WEB1.v4}. Still pointing at it: ${listOf(names)}.`
    return reply(text, ['Move them to lb-jkt-2 too', 'Apply it', 'Move mail to the new provider'], {
      card: 'records',
      data: recordsCard(`Still on web-1, ${WEB1.v4}`, left),
      act: () => {
        zone.highlight.value = left.map((r) => r.id)
        zone.state.lastNames = names
      },
    })
  }

  function show(t: string): DeskReply | null {
    const type = (t.match(/\b(aaaa|cname|mx|txt|caa)\b/)?.[1] ?? (/\ba records?\b/.test(t) ? 'a' : '')).toUpperCase()
    const name = namesIn(t)[0]
    let list: Rec[] = []
    let title = ''
    if (type) {
      list = zone.records.value.filter((r) => r.type === type)
      title = `${type} records`
    } else if (name) {
      list = zone.records.value.filter((r) => r.name === name)
      title = `On ${short(name)}`
    } else if (has('\\bproxied\\b', t)) {
      list = zone.records.value.filter((r) => r.proxied)
      title = 'Proxied'
    } else if (has('dns only', t)) {
      list = zone.records.value.filter((r) => proxiable(r.type) && !r.proxied)
      title = 'DNS only'
    } else {
      return null
    }
    const head = type ? counted(list.length, `${type} record`) : name ? `${counted(list.length, 'record')} on ${short(name)}` : `${title}: ${list.length} ${list.length === 1 ? 'record' : 'records'}`
    return reply(
      list.length ? `${head}.` : `No ${type || 'such'} records in lintang.example.`,
      ['What points at the old IP?', 'Move mail to the new provider', 'What’s left?'],
      {
        card: list.length ? 'records' : undefined,
        data: list.length ? recordsCard(title, list) : undefined,
        act: () => (zone.highlight.value = list.map((r) => r.id)),
      },
    )
  }

  function verify(): DeskReply {
    if (zone.state.verified) return reply('Kotak Surat has already verified lintang.example. Nothing to add.', ['Move mail to the new provider', 'What’s left?'])
    const applied = zone.latest('verify', ['applied'])
    if (applied) return reply(`The verification is in since ${applied.doneAt}; Kotak Surat should see it by ${zone.mail.value.verifyBy}.`, ['Lower the TTL first', 'What’s left?'])
    const waiting = zone.latest('verify')
    if (waiting) return reply(`It is waiting under Needs you as ${waiting.id}.`, ['Apply it'])
    const change = verifyChange({ id: zone.nextId(), at: at() })
    return check(
      change,
      `Kotak Surat gives every domain its own token; the one in your ticket ${NEWMAIL.ticket} goes in a TXT record at lintang.example. It moves no mail, and the move should wait until Kotak Surat has seen it.`,
      ['Apply it', 'Lower the TTL first', 'Why does it bounce?'],
    )
  }

  function mailMove(): DeskReply {
    const applied = zone.latest('mail', ['applied'])
    if (applied) return reply(`Mail already goes to Kotak Surat, since ${applied.doneAt}.`, ['What’s left?', 'Roll back'])
    if (zone.latest('mail', ['scheduled'])) return reply('The mail move is scheduled for 23:00 WIB.', ['What’s left?', 'Apply the mail move now'])
    const change = mailChange(zone.records.value, { id: zone.nextId(), at: at() })
    const m = zone.mail.value
    const todo = [m.verify !== 'done' ? 'Kotak Surat has not verified the domain yet' : '', m.ttl !== 'done' ? 'MX still has a 1 hr TTL' : ''].filter(Boolean)
    const first = todo.length ? `${todo.length === 2 ? 'Two things first' : 'One thing first'}: ${todo.join(', and ')}.` : 'Kotak Surat has verified the domain and MX is at 5 min, so it can go any time.'
    return check(
      change,
      `The new provider is Kotak Surat, from your ticket ${NEWMAIL.ticket}. ${counted(change.ops.length, 'record')} change. ${first}`,
      ['Tambahkan record verifikasi Kotak Surat', 'Lower the TTL first', 'Why keep Mailroute in SPF?', 'Schedule the mail move for 23:00 WIB'],
    )
  }

  function proxy(t: string): DeskReply {
    const name = namesIn(t).find((n) => zone.records.value.some((r) => r.name === n && proxiable(r.type)))
    if (!name) return reply('Which record? For example “Turn the proxy off for staging”.', ['Turn the proxy off for staging', 'Show the proxied records'])
    const own = zone.records.value.filter((r) => r.name === name && proxiable(r.type))
    const wantsOn = has('\\b(on|nyalakan|hidupkan|aktifkan|enable)\\b', t)
    const wantsOff = has('\\b(off|matikan|disable|dns only|dns-only)\\b', t)
    const on = wantsOn && !wantsOff ? true : wantsOff ? false : !own[0].proxied
    const change = proxyChange(zone.records.value, name, on, { id: zone.nextId(), at: at() })
    if (!change) return reply(`${short(name)} is already ${on ? 'proxied' : 'DNS only'}.`, ['Show the proxied records'])
    return check(
      change,
      on
        ? `${short(name)} goes behind the edge: resolvers will answer the edge address, and the origin stays private.`
        : `${short(name)} answers with its own address once this lands. I set the TTL to 5 min so it can go back quickly.`,
      ['Apply it', 'Why?', 'What’s left?'],
    )
  }

  function remove(t: string): DeskReply {
    const name = namesIn(t).find((n) => n !== ZONE.name && zone.records.value.some((r) => r.name === n))
    if (!name) {
      return reply('Which name? I delete one name at a time, and never the apex in one go. For example “Hapus staging”.', ['Show the A records', 'What’s left?'])
    }
    const change = removeChange(zone.records.value, name, { id: zone.nextId(), at: at() })
    if (!change) return reply(`There is nothing at ${short(name)} to delete.`, ['What’s left?'])
    return check(
      change,
      `This deletes everything at ${short(name)}. Delete is held, not clicked: hold it under Needs you, or type “delete ${short(name)}” again to confirm.`,
      ['Batal', 'What’s left?'],
    )
  }

  function pointLb(t: string): DeskReply | null {
    let names = namesIn(t)
    if (!names.length && has(P.lb, t)) names = [SHOP.name]
    if (!names.length) return null
    const todo = names.filter((n) => !onLb(zone.records.value, n))
    if (!todo.length) {
      return reply(`${listOf(names)} already point${names.length === 1 ? 's' : ''} at lb-jkt-2.`, ['What points at the old IP?', 'What’s left?'])
    }
    const base = zone.latest('lb')
    const all = [...new Set([...(base?.names ?? []), ...todo])]
    const style = zone.state.style
    const change = lbChange(zone.records.value, all, style, { id: zone.nextId(), at: at() })
    const apex = all.includes(ZONE.name)
    let text: string
    if (all.length === 1 && all[0] === SHOP.name) {
      text = `shop isn’t in lintang.example yet, so this adds it on lb-jkt-2. It has had ${SHOP.lookups} lookups since ${SHOP.since}, all answered “no such name”.`
    } else if (base) {
      text = `Added to the same change: ${listOf(todo)} move${todo.length === 1 ? 's' : ''} to lb-jkt-2 along with ${listOf(base.names ?? [])}.`
    } else if (style === 'cname' && apex) {
      text = 'www becomes a CNAME to lb-jkt-2. The apex cannot take a plain CNAME, so I flattened it: it answers with lb-jkt-2’s addresses and keeps its MX, TXT and CAA records.'
    } else {
      const n = change.ops.length
      text = `${counted(n, 'record')} move${n === 1 ? 's' : ''} to lb-jkt-2. ${n === 1 ? 'It is' : 'All'} proxied, so visitors switch at the edge in about 30 s and nothing waits on caches.`
    }
    return check(change, text, [
      'Schedule it for 23:00 WIB',
      apex ? (style === 'cname' ? 'Why flatten the apex?' : 'Why not a CNAME at the apex?') : style === 'cname' ? 'Why a CNAME?' : 'Why A records?',
      'Apply it',
    ])
  }

  const FALLBACK = 'I can change records in lintang.example, explain a value, undo a change or watch one settle. Try “Point www at the new load balancer” or “Show the MX records”.'

  /** One sentence in, one or more replies out. */
  function respond(said: string): DeskReply | DeskReply[] {
    const t = norm(said)
    if (!t) return reply(FALLBACK, ['What points at the old IP?'])
    if (has(P.hello, t) && t.split(' ').length <= 4) {
      return reply(`Hello ${first}. I can change records in lintang.example, say why a value was chosen, undo a change or watch one settle.`, [
        'What points at the old IP?',
        'Show the MX records',
        'Apply it',
      ])
    }
    if (has(P.thanks, t)) return reply('You’re welcome.', ['What’s left?'])
    if (has(P.undo, t)) return undo()
    if (has(P.cancel, t)) return cancel()
    if (has(P.status, t)) return status()
    if (has(P.why, t)) return why(t)
    if (has(P.export, t)) return exportZone()
    if (has(P.schedule, t) && !has(P.nowWord, t)) return scheduleIt(t)
    if (has(P.commit, t)) return commit(t)
    if (has(P.ttl, t)) return lowerTtl(t)
    if (has(P.styleVerb, t) && has(P.cname, t)) return restyle('cname')
    if (has(P.styleVerb, t) && has(P.addr, t)) return restyle('address')
    if (has(P.oldIp, t) || hits(P.ip, said)) return pointsAt(t)
    if (has(P.show, t)) {
      const shown = show(t)
      if (shown) return shown
    }
    if (has(P.verify, t)) return verify()
    if (has(P.mail, t)) return mailMove()
    if (has(P.proxy, t)) return proxy(t)
    if (has(P.remove, t)) {
      const waiting = zone.latest('remove')
      const name = waiting?.ops[0]?.before?.name
      if (waiting && name && namesIn(t).includes(name)) return commit(t)
      return remove(t)
    }
    return pointLb(t) ?? reply(FALLBACK, ['Point www at the new load balancer', 'Show the MX records', 'What’s left?'])
  }

  return { respond, appliedSay, nextAfterApply, suggest }
}
