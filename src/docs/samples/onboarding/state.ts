/**
 * The setup flow's state: one reactive form, the current step, which steps are done, and the
 * errors each step would show. The screen creates it and provides it; the step parts inject it.
 */
import { computed, inject, reactive, ref, watch, type InjectionKey } from 'vue'
import {
  EMAIL_PATTERN,
  SLUG_PATTERN,
  countries,
  feePerMonth,
  chargeToday,
  industries,
  initialIntegrations,
  initialInvites,
  integrations,
  inviteRoles,
  ownRoles,
  plans,
  regions,
  slugify,
  steps,
  teamSizes,
  type Cycle,
  type PlanKey,
} from './data'

/** Component models are `string | number`, so the form keeps that type. */
type Choice = string | number

export interface InviteRow {
  id: number
  email: string
  role: Choice | null
}

const labelOf = (list: { label: string; value: string | number }[], value: unknown) =>
  list.find((item) => item.value === value)?.label ?? ''

/** "dimas.prasetyo@sagarafreight.co.id" → "Dimas Prasetyo". */
export function nameFromEmail(email: string) {
  const local = email.trim().split('@')[0] ?? ''
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ')
}

export function createSetup() {
  let seq = 0
  const form = reactive({
    name: 'Sagara Freight',
    slug: slugify('Sagara Freight'),
    slugEdited: false,
    industry: 'logistics' as Choice | null,
    country: 'ID' as Choice | null,
    region: 'jkt-1' as Choice,
    teamSize: '11-50' as Choice,
    role: 'eng-lead' as Choice | null,
    invites: initialInvites.map((row) => ({ ...row, id: ++seq })) as InviteRow[],
    integrations: { ...initialIntegrations } as Record<string, boolean>,
    cycle: 'monthly' as Cycle,
    plan: 'scale' as PlanKey,
    agree: false,
  })

  // The sample opens on step 02 with the company step already filled in.
  const step = ref(1)
  const visited = ref(1)
  const completed = reactive(new Set<number>([0]))
  const showErrors = reactive<boolean[]>(steps.map(() => false))
  const editing = ref(false)
  const creating = ref(false)
  const created = ref(false)

  // The URL follows the name until someone edits it by hand.
  watch(
    () => form.name,
    (name) => {
      if (!form.slugEdited) form.slug = slugify(name)
    },
  )

  function setSlug(value: string) {
    form.slug = value.toLowerCase()
    form.slugEdited = value.trim() !== ''
    if (!form.slugEdited) form.slug = slugify(form.name)
  }

  function addInvite() {
    form.invites.push({ id: ++seq, email: '', role: 'developer' })
    return seq
  }

  function removeInvite(id: number) {
    const at = form.invites.findIndex((row) => row.id === id)
    if (at >= 0) form.invites.splice(at, 1)
  }

  const companyErrors = computed(() => {
    const e: Partial<Record<'name' | 'slug' | 'industry' | 'country', string>> = {}
    if (form.name.trim().length < 2) e.name = 'Enter the name of your company or team.'
    if (!form.slug) e.slug = 'Choose a URL for the workspace.'
    else if (!SLUG_PATTERN.test(form.slug)) e.slug = 'Use 3–40 lowercase letters, numbers or hyphens.'
    if (!form.industry) e.industry = 'Choose an industry.'
    if (!form.country) e.country = 'Choose a country.'
    return e
  })

  const teamErrors = computed(() => {
    const invites: Record<number, string> = {}
    const seen = new Set<string>()
    for (const row of form.invites) {
      const email = row.email.trim().toLowerCase()
      if (!email) continue
      if (!EMAIL_PATTERN.test(email)) invites[row.id] = 'Enter a full email address, like name@company.com.'
      else if (seen.has(email)) invites[row.id] = 'This address is already on the list.'
      seen.add(email)
    }
    return { role: form.role ? undefined : 'Choose your role.', invites }
  })

  const reviewErrors = computed(() => ({ agree: form.agree ? undefined : 'Agree to the terms to create the workspace.' }))

  function isValid(index: number) {
    if (index === 0) return Object.keys(companyErrors.value).length === 0
    if (index === 1) return !teamErrors.value.role && Object.keys(teamErrors.value.invites).length === 0
    if (index === 4) return !reviewErrors.value.agree
    return true
  }

  /** Errors only show after someone tried to continue from that step. */
  const visible = computed(() => ({
    company: showErrors[0] ? companyErrors.value : {},
    team: showErrors[1] ? teamErrors.value : { role: undefined, invites: {} as Record<number, string> },
    review: showErrors[4] ? reviewErrors.value : { agree: undefined },
  }))

  const plan = computed(() => plans.find((p) => p.key === form.plan) ?? plans[1])
  const fee = computed(() => feePerMonth(plan.value, form.cycle))
  const today = computed(() => chargeToday(plan.value, form.cycle))
  const validInvites = computed(() =>
    form.invites.filter((row) => row.email.trim() && !teamErrors.value.invites[row.id]),
  )
  const enabledIntegrations = computed(() => integrations.filter((item) => form.integrations[item.key]))
  const samlConflict = computed(() => !!form.integrations.saml && form.plan !== 'business')

  const labels = computed(() => ({
    industry: labelOf(industries, form.industry),
    country: labelOf(countries, form.country),
    region: labelOf(regions, form.region),
    teamSize: labelOf(teamSizes, form.teamSize),
    role: labelOf(ownRoles, form.role),
  }))

  const roleLabel = (value: Choice | null) => labelOf(inviteRoles, value)

  const progress = computed(() => (created.value ? 100 : (completed.size / steps.length) * 100))

  return {
    form,
    step,
    visited,
    completed,
    showErrors,
    editing,
    creating,
    created,
    setSlug,
    addInvite,
    removeInvite,
    isValid,
    visible,
    plan,
    fee,
    today,
    validInvites,
    enabledIntegrations,
    samlConflict,
    labels,
    roleLabel,
    progress,
  }
}

export type Setup = ReturnType<typeof createSetup>

export const SETUP: InjectionKey<Setup> = Symbol('onboarding-setup')

export function useSetup(): Setup {
  const setup = inject(SETUP)
  if (!setup) throw new Error('useSetup() needs the onboarding screen to provide the setup state.')
  return setup
}
