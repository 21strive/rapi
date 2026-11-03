/**
 * The settings page is one form. The page owns this state and provides it; each section part
 * injects it. A baseline snapshot tells what is unsaved.
 */
import { computed, inject, provide, reactive, ref, type InjectionKey } from 'vue'
import type { TimelineItem } from '@/design-system'
import {
  auditTrail,
  members as seedMembers,
  notificationDefaults,
  notificationEvents,
  org,
  roleLabel,
  sessionLabel,
  timezones,
  NOW_UTC_MINUTES,
  type Channel,
  type Member,
  type Role,
} from './data'

export interface SettingsForm {
  name: string
  slug: string
  description: string
  timezone: string
  locale: string
  region: string
  roles: Record<string, Role>
  sso: boolean
  require2fa: boolean
  session: string
  minPassword: number
  notifications: Record<string, Channel[]>
  digest: string
  webhook: string
}

export interface Change {
  key: string
  label: string
}

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const sameList = (a: Channel[], b: Channel[]) => a.length === b.length && a.every((c) => b.includes(c))

export const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/

function initialForm(): SettingsForm {
  return {
    name: org.name,
    slug: org.slug,
    description: org.description,
    timezone: org.timezone,
    locale: org.locale,
    region: org.region,
    roles: Object.fromEntries(seedMembers.map((m) => [m.id, m.role])),
    sso: false,
    require2fa: true,
    session: '24h',
    minPassword: 12,
    notifications: clone(notificationDefaults),
    digest: 'daily',
    webhook: 'https://hooks.kopralabs.io/simpul/events',
  }
}

function createSettings() {
  const members = reactive<Member[]>(clone(seedMembers))
  const form = reactive<SettingsForm>(initialForm())
  const baseline = ref<SettingsForm>(initialForm())
  const audit = ref<TimelineItem[]>(clone(auditTrail))
  const startedAt = Date.now()

  const memberName = (id: string) => members.find((m) => m.id === id)?.name ?? id

  const changes = computed<Change[]>(() => {
    const base = baseline.value
    const list: Change[] = []
    const simple: [keyof SettingsForm, string][] = [
      ['name', 'Organization name'],
      ['slug', 'URL slug'],
      ['description', 'Description'],
      ['timezone', 'Timezone'],
      ['locale', 'Locale'],
      ['region', 'Default region'],
    ]
    for (const [key, label] of simple) if (form[key] !== base[key]) list.push({ key, label })
    for (const id of Object.keys(form.roles)) {
      if (form.roles[id] !== base.roles[id]) list.push({ key: `role:${id}`, label: `Role of ${memberName(id)}` })
    }
    if (form.sso !== base.sso) list.push({ key: 'sso', label: 'Single sign-on' })
    if (form.require2fa !== base.require2fa) list.push({ key: 'require2fa', label: 'Two-factor requirement' })
    if (form.session !== base.session) list.push({ key: 'session', label: 'Session length' })
    if (form.minPassword !== base.minPassword) list.push({ key: 'minPassword', label: 'Minimum password length' })
    for (const event of notificationEvents) {
      if (!sameList(form.notifications[event.id] ?? [], base.notifications[event.id] ?? [])) {
        list.push({ key: `notify:${event.id}`, label: `${event.label} alerts` })
      }
    }
    if (form.digest !== base.digest) list.push({ key: 'digest', label: 'Digest' })
    if (form.webhook !== base.webhook) list.push({ key: 'webhook', label: 'Webhook endpoint' })
    return list
  })

  const nameError = computed(() => (form.name.trim() ? '' : 'Give the organization a name.'))
  const slugError = computed(() =>
    SLUG_PATTERN.test(form.slug) ? '' : 'Use 3–40 lowercase letters, numbers and hyphens.',
  )
  const errors = computed(() => [nameError.value, slugError.value].filter(Boolean))

  const seatsUsed = computed(() => members.filter((m) => m.status !== 'suspended').length)
  const missingTwoFactor = computed(() => members.filter((m) => m.status === 'active' && m.twoFactor === false))

  /** Org-local clock from the saved timezone, ticking with real minutes since the page opened. */
  function clock(tick = 0) {
    void tick
    const tz = timezones.find((t) => t.value === baseline.value.timezone) ?? timezones[0]
    const elapsed = Math.floor((Date.now() - startedAt) / 60000)
    let minutes = NOW_UTC_MINUTES + tz.offset + elapsed
    let day = 18
    if (minutes < 0) {
      minutes += 1440
      day -= 1
    } else if (minutes >= 1440) {
      minutes -= 1440
      day += 1
    }
    const hh = String(Math.floor(minutes / 60)).padStart(2, '0')
    const mm = String(minutes % 60).padStart(2, '0')
    return { date: `${day} Nov 2026`, time: `${hh}:${mm}`, abbr: tz.abbr }
  }

  /** One change in the words the audit log uses. */
  function describe(change: Change): string {
    if (change.key.startsWith('role:')) {
      const id = change.key.slice(5)
      return `${memberName(id)} is now ${roleLabel[form.roles[id]]}`
    }
    switch (change.key) {
      case 'session':
        return `Session length set to ${sessionLabel[form.session]}`
      case 'sso':
        return form.sso ? 'Single sign-on required' : 'Single sign-on no longer required'
      case 'require2fa':
        return form.require2fa ? 'Two-factor required for all members' : 'Two-factor no longer required'
      case 'minPassword':
        return `Minimum password length set to ${form.minPassword}`
      case 'timezone':
        return `Timezone set to ${timezones.find((t) => t.value === form.timezone)?.abbr ?? form.timezone}`
      default:
        return `${change.label} changed`
    }
  }

  function save(by = 'Raka W.') {
    const done = changes.value
    if (!done.length) return done
    const now = clock()
    const short = now.date.replace(' 2026', '')
    const title = done.length === 1 ? describe(done[0]) : `${done.length} settings changed`
    audit.value = [
      {
        id: `s${Date.now()}`,
        time: `${short} ${now.time}`,
        title,
        body: done.length > 1 ? done.map((c) => c.label).join(' · ') : undefined,
        meta: by,
        tone: 'brand',
      },
      ...audit.value,
    ]
    baseline.value = clone(form)
    return done
  }

  function discard() {
    const base = clone(baseline.value)
    Object.assign(form, base)
  }

  function invite(emails: string[], role: Role) {
    const now = clock()
    const added: Member[] = emails.map((email, i) => {
      const local = email.split('@')[0]
      const name = local
        .split(/[._-]+/)
        .filter(Boolean)
        .map((part) => part[0].toUpperCase() + part.slice(1))
        .join(' ')
      return {
        id: `n${Date.now()}${i}`,
        name: name || email,
        email,
        role,
        status: 'invited',
        twoFactor: null,
        lastActive: `Invited ${now.date.replace(' 2026', '')}`,
      }
    })
    members.push(...added)
    for (const m of added) {
      form.roles[m.id] = role
      baseline.value.roles[m.id] = role
    }
    audit.value = [
      {
        id: `i${Date.now()}`,
        time: `${now.date.replace(' 2026', '')} ${now.time}`,
        title: added.length === 1 ? `${added[0].name} invited as ${role[0].toUpperCase()}${role.slice(1)}` : `${added.length} people invited`,
        meta: 'Raka W.',
      },
      ...audit.value,
    ]
    return added
  }

  return { members, form, baseline, audit, changes, errors, nameError, slugError, seatsUsed, missingTwoFactor, clock, save, discard, invite }
}

export type SettingsStore = ReturnType<typeof createSettings>

const KEY: InjectionKey<SettingsStore> = Symbol('org-settings')

export function provideSettings(): SettingsStore {
  const store = createSettings()
  provide(KEY, store)
  return store
}

export function useSettings(): SettingsStore {
  const store = inject(KEY)
  if (!store) throw new Error('useSettings() needs provideSettings() in OrgSettings.vue')
  return store
}

export const sectionDomId = (id: string) => `s-org-settings-${id}`
