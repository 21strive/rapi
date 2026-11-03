<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { Eye, EyeOff, Fingerprint, KeyRound } from 'lucide-vue-next'
import { RButton, RCard, RCheckbox, RIconButton, RInput, RRule, RStatus, useToast } from '@/design-system'
import { account, type Copy } from '../data'

const props = defineProps<{ t: Copy }>()
const emit = defineEmits<{ 'signed-in': [] }>()

const { show } = useToast()
const uid = useId()
const emailId = `${uid}-email`
const passwordId = `${uid}-password`

const email = ref(account.email)
const password = ref(account.password)
const reveal = ref(false)
const remember = ref(true)
const busy = ref(false)
const done = ref(false)
const tried = ref(false)

const emailError = computed(() => {
  if (!tried.value) return ''
  const value = email.value.trim()
  if (!value) return props.t.signIn.errEmailEmpty
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value) ? '' : props.t.signIn.errEmailInvalid
})
const passwordError = computed(() => (tried.value && !password.value ? props.t.signIn.errPassword : ''))

const emailField = ref<InstanceType<typeof RInput> | null>(null)
const passwordField = ref<InstanceType<typeof RInput> | null>(null)

function submit() {
  tried.value = true
  if (emailError.value) return emailField.value?.focus()
  if (passwordError.value) return passwordField.value?.focus()
  busy.value = true
  window.setTimeout(() => {
    busy.value = false
    done.value = true
    show({ title: props.t.toast.signedIn.title, body: props.t.toast.signedIn.body(account.phone), tone: 'success' })
    emit('signed-in')
  }, 900)
}

function edit() {
  done.value = false
}

const forgot = () => show({ title: props.t.toast.forgot.title, body: props.t.toast.forgot.body(email.value.trim() || account.email) })
const sso = () => show({ title: props.t.toast.sso.title, body: props.t.toast.sso.body, tone: 'brand' })
const passkey = () => show({ title: props.t.toast.passkey.title, body: props.t.toast.passkey.body })
</script>

<template>
  <RCard class="s-sign-in-step" :eyebrow="`${t.step} 01`" :title="t.signIn.title" :subtitle="t.signIn.sub">
    <template #actions>
      <span class="s-sign-in-status"><RStatus :tone="done ? 'success' : 'neutral'" :label="done ? t.signIn.statusDone : t.signIn.statusReady" /></span>
    </template>

    <form class="s-sign-in-form" novalidate @submit.prevent="submit">
      <div class="s-sign-in-field">
        <label class="s-sign-in-label" :for="emailId">{{ t.signIn.email }}</label>
        <RInput
          :id="emailId"
          ref="emailField"
          v-model="email"
          size="lg"
          type="email"
          autocomplete="username"
          :error="emailError"
          @update:model-value="edit"
        />
      </div>

      <div class="s-sign-in-field">
        <div class="s-sign-in-label-row">
          <label class="s-sign-in-label" :for="passwordId">{{ t.signIn.password }}</label>
          <button type="button" class="s-sign-in-link" @click="forgot">{{ t.signIn.forgot }}</button>
        </div>
        <RInput
          :id="passwordId"
          ref="passwordField"
          v-model="password"
          size="lg"
          :type="reveal ? 'text' : 'password'"
          autocomplete="current-password"
          :error="passwordError"
          @update:model-value="edit"
        >
          <template #trailing>
            <RIconButton :label="t.signIn.showPassword" variant="ghost" size="sm" :pressed="reveal" @click="reveal = !reveal">
              <EyeOff v-if="reveal" />
              <Eye v-else />
            </RIconButton>
          </template>
        </RInput>
      </div>

      <RCheckbox v-model="remember" :label="t.signIn.remember" />

      <RButton type="submit" size="lg" block :loading="busy">{{ t.signIn.submit }}</RButton>
    </form>

    <RRule :label="t.signIn.or" />

    <div class="s-sign-in-stack">
      <RButton variant="outline" size="lg" block @click="sso">
        <template #leading><KeyRound /></template>
        {{ t.signIn.sso }}
      </RButton>
      <RButton variant="outline" size="lg" block @click="passkey">
        <template #leading><Fingerprint /></template>
        {{ t.signIn.passkey }}
      </RButton>
    </div>

    <template #footer>
      <p class="s-sign-in-note">{{ t.signIn.note }}</p>
    </template>
  </RCard>
</template>

<style scoped>
/* The status sits on the eyebrow's line: the card lifts its actions by 4px, this puts it back. */
.s-sign-in-status {
  display: inline-flex;
  padding-top: 4px;
}

.s-sign-in-form,
.s-sign-in-stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.s-sign-in-stack {
  gap: 8px;
}

.s-sign-in-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.s-sign-in-label-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.s-sign-in-label {
  color: var(--r-text-secondary);
  font-size: var(--r-text-xs);
  font-weight: var(--r-weight-medium);
  line-height: 1.3;
}

.s-sign-in-link {
  padding: 0;
  border: 0;
  background: none;
  color: var(--r-brand-text);
  font-size: var(--r-text-xs);
  font-weight: var(--r-weight-medium);
  line-height: 1.3;
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 3px;
  cursor: pointer;
}
.s-sign-in-link:hover {
  color: var(--r-text);
}

.s-sign-in-note {
  padding-top: 12px;
  border-top: 1px solid var(--r-border-subtle);
  color: var(--r-text-tertiary);
  font-size: var(--r-text-xs);
  line-height: 1.5;
  flex: 1;
  text-wrap: pretty;
}
</style>
