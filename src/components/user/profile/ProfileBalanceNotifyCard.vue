<template>
  <div class="st-card st-card--pad profile-panel">
    <header class="profile-block__head">
      <h2 class="st-display-3">{{ t('profile.balanceNotify.title') }}</h2>
      <p class="st-body">{{ t('profile.balanceNotify.description') }}</p>
    </header>

    <div class="profile-body">
      <div class="profile-switch-row">
        <span class="st-label profile-switch-row__label">{{ t('profile.balanceNotify.enabled') }}</span>
        <label class="profile-switch">
          <input type="checkbox" v-model="notifyEnabled" class="profile-switch__input" @change="handleToggle" />
          <span class="profile-switch__track" aria-hidden="true"><span class="profile-switch__knob"></span></span>
        </label>
      </div>

      <template v-if="notifyEnabled">
        <div class="profile-field">
          <label class="st-label">
            {{ t('profile.balanceNotify.threshold') }}
            <span class="profile-hint profile-hint--inline">{{ t('profile.balanceNotify.thresholdHint') }}</span>
          </label>
          <div class="profile-inline">
            <span class="profile-prefix">$</span>
            <input
              v-model.number="customThreshold"
              type="number"
              min="0"
              step="0.01"
              class="st-input profile-inline__input profile-inline__input--prefix"
              :placeholder="systemDefaultThreshold > 0 ? `${t('profile.balanceNotify.systemDefault')} $${systemDefaultThreshold}` : t('profile.balanceNotify.thresholdPlaceholder')"
            />
            <button @click="handleThresholdUpdate" :disabled="savingThreshold" class="st-btn st-btn--primary st-btn--sm">
              {{ savingThreshold ? t('common.saving') : t('common.save') }}
            </button>
          </div>
        </div>

        <div class="profile-field">
          <label class="st-label">{{ t('profile.balanceNotify.extraEmails') }}</label>
          <p class="profile-hint profile-hint--warn">{{ t('profile.balanceNotify.extraEmailsHint') }}</p>

          <div v-if="emailEntries.length > 0" class="profile-email-list">
            <div v-for="(entry, idx) in emailEntries" :key="idx" class="profile-email">
              <div class="profile-email__main">
                <label class="profile-switch profile-switch--sm">
                  <input type="checkbox" :checked="!entry.disabled" class="profile-switch__input" @change="handleEmailToggle(entry)" />
                  <span class="profile-switch__track" aria-hidden="true"><span class="profile-switch__knob"></span></span>
                </label>
                <span class="profile-email__address">{{ entry.email }}</span>
              </div>
              <div class="profile-email__actions">
                <template v-if="!entry.verified">
                  <template v-if="verifyingEmail === entry.email">
                    <input
                      v-model="verifyCode"
                      type="text"
                      maxlength="6"
                      class="st-input profile-code"
                      :placeholder="t('profile.balanceNotify.codePlaceholder')"
                    />
                    <button @click="verifySavedEmail(entry.email)" :disabled="!verifyCode || verifyCode.length !== 6 || verifyingSaved" class="profile-link">
                      {{ t('profile.balanceNotify.verify') }}
                    </button>
                    <span v-if="verifyCountdown > 0" class="profile-hint">{{ verifyCountdown }}s</span>
                    <button v-else @click="sendCodeForSaved(entry.email)" :disabled="sendingSavedCode" class="profile-link profile-link--muted">
                      {{ t('profile.balanceNotify.resend') }}
                    </button>
                    <button @click="verifyingEmail = ''" class="profile-link profile-link--muted">
                      {{ t('common.cancel') }}
                    </button>
                  </template>
                  <template v-else>
                    <button @click="sendCodeForSaved(entry.email)" :disabled="sendingSavedCode" class="profile-link">
                      {{ t('profile.balanceNotify.verify') }}
                    </button>
                    <span class="profile-tag profile-tag--warn">{{ t('profile.balanceNotify.unverified') }}</span>
                  </template>
                </template>
                <span v-else class="profile-tag profile-tag--ok">{{ t('profile.balanceNotify.verified') }}</span>
                <button @click="handleRemoveEmail(entry.email)" class="profile-link profile-link--danger">
                  {{ t('profile.balanceNotify.removeEmail') }}
                </button>
              </div>
            </div>
          </div>

          <div v-if="pendingEmails.length > 0" class="profile-email-list">
            <div v-for="(pe, idx) in pendingEmails" :key="pe.email" class="profile-email profile-email--pending">
              <span class="profile-email__address profile-email__address--pending">{{ pe.email }}</span>
              <div v-if="!pe.codeSent" class="profile-email__actions">
                <button @click="sendCodeFor(idx)" :disabled="pe.sending" class="profile-link">
                  {{ t('profile.balanceNotify.sendCode') }}
                </button>
                <button @click="pendingEmails.splice(idx, 1)" class="profile-link profile-link--danger">
                  {{ t('profile.balanceNotify.removeEmail') }}
                </button>
              </div>
              <div v-else class="profile-email__actions">
                <input
                  v-model="pe.code"
                  type="text"
                  maxlength="6"
                  class="st-input profile-code"
                  :placeholder="t('profile.balanceNotify.codePlaceholder')"
                />
                <button @click="verifyPending(idx)" :disabled="!pe.code || pe.code.length !== 6 || pe.verifying" class="profile-link">
                  {{ t('profile.balanceNotify.verify') }}
                </button>
                <span v-if="pe.countdown > 0" class="profile-hint">{{ pe.countdown }}s</span>
                <button v-else @click="sendCodeFor(idx)" :disabled="pe.sending" class="profile-link profile-link--muted">
                  {{ t('profile.balanceNotify.resend') }}
                </button>
              </div>
            </div>
          </div>

          <div v-if="canAddMore" class="profile-inline">
            <input
              v-model="newEmail"
              type="email"
              class="st-input profile-inline__input"
              :placeholder="t('profile.balanceNotify.emailPlaceholder')"
              @keyup.enter="addPendingEmail"
            />
            <button @click="addPendingEmail" :disabled="!newEmail" class="st-btn st-btn--quiet st-btn--sm">
              {{ t('common.add') }}
            </button>
          </div>
          <p v-else class="profile-hint">{{ t('profile.balanceNotify.maxEmailsReached') }}</p>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { userAPI } from '@/api'
import { extractApiErrorMessage } from '@/utils/apiError'
import type { NotifyEmailEntry } from '@/types'

const maxTotalEmails = 3

interface PendingEmail {
  email: string
  codeSent: boolean
  code: string
  sending: boolean
  verifying: boolean
  countdown: number
  timer: ReturnType<typeof setInterval> | null
}

const props = defineProps<{
  enabled: boolean
  threshold: number | null
  extraEmails: NotifyEmailEntry[]
  systemDefaultThreshold: number
  userEmail: string
}>()

const { t } = useI18n()
const authStore = useAuthStore()
const appStore = useAppStore()

const notifyEnabled = ref(props.enabled)
const customThreshold = ref<number | null>(props.threshold)
const emailEntries = ref<NotifyEmailEntry[]>([...props.extraEmails])
const pendingEmails = ref<PendingEmail[]>([])
const newEmail = ref('')
const savingThreshold = ref(false)

// State for verifying saved unverified emails
const verifyingEmail = ref('')
const verifyCode = ref('')
const verifyingSaved = ref(false)
const sendingSavedCode = ref(false)
const verifyCountdown = ref(0)
let verifyTimer: ReturnType<typeof setInterval> | null = null
let disposed = false

const canAddMore = computed(() => {
  return emailEntries.value.length + pendingEmails.value.length < maxTotalEmails
})

watch(() => props.enabled, (val) => { notifyEnabled.value = val })
watch(() => props.threshold, (val) => { customThreshold.value = val })
watch(() => props.extraEmails, (val) => { emailEntries.value = [...val] })

// When list is empty on mount, pre-fill the add input with user's email
onMounted(() => {
  if (emailEntries.value.length === 0 && props.userEmail) {
    newEmail.value = props.userEmail
  }
})

onUnmounted(() => {
  disposed = true
  for (const pe of pendingEmails.value) {
    if (pe.timer) clearInterval(pe.timer)
  }
  if (verifyTimer) clearInterval(verifyTimer)
})

const handleToggle = async () => {
  try {
    const updated = await userAPI.updateProfile({ balance_notify_enabled: notifyEnabled.value })
    authStore.user = updated
  } catch (err: unknown) {
    appStore.showError(extractApiErrorMessage(err, t('common.error')))
    notifyEnabled.value = !notifyEnabled.value
  }
}

const handleThresholdUpdate = async () => {
  savingThreshold.value = true
  try {
    const threshold = customThreshold.value && customThreshold.value > 0 ? customThreshold.value : 0
    const updated = await userAPI.updateProfile({ balance_notify_threshold: threshold })
    authStore.user = updated
    appStore.showSuccess(t('common.saved'))
  } catch (err: unknown) {
    appStore.showError(extractApiErrorMessage(err, t('common.error')))
  } finally {
    savingThreshold.value = false
  }
}

async function handleEmailToggle(entry: NotifyEmailEntry) {
  const newDisabled = !entry.disabled
  try {
    const updated = await userAPI.toggleNotifyEmail(entry.email, newDisabled)
    authStore.user = updated
    emailEntries.value = [...updated.balance_notify_extra_emails]
  } catch (err: unknown) {
    appStore.showError(extractApiErrorMessage(err, t('common.error')))
  }
}

function addPendingEmail() {
  const email = newEmail.value.trim()
  if (!email) return
  // Check duplicates
  const isDuplicate = emailEntries.value.some(e => e.email.toLowerCase() === email.toLowerCase())
    || pendingEmails.value.some(p => p.email.toLowerCase() === email.toLowerCase())
  if (isDuplicate) {
    appStore.showError(t('profile.balanceNotify.emailDuplicate'))
    return
  }
  pendingEmails.value.push({ email, codeSent: false, code: '', sending: false, verifying: false, countdown: 0, timer: null })
  newEmail.value = ''
}

async function sendCodeFor(idx: number) {
  const pe = pendingEmails.value[idx]
  if (!pe) return
  pe.sending = true
  try {
    await userAPI.sendNotifyEmailCode(pe.email)
    if (disposed || !pendingEmails.value.includes(pe)) return
    pe.codeSent = true
    pe.countdown = 60
    pe.timer = setInterval(() => {
      pe.countdown--
      if (pe.countdown <= 0 && pe.timer) {
        clearInterval(pe.timer)
        pe.timer = null
      }
    }, 1000)
    appStore.showSuccess(t('profile.balanceNotify.codeSent'))
  } catch (err: unknown) {
    appStore.showError(extractApiErrorMessage(err, t('common.error')))
  } finally {
    pe.sending = false
  }
}

async function verifyPending(idx: number) {
  const pe = pendingEmails.value[idx]
  if (!pe || !pe.code || pe.code.length !== 6) return
  pe.verifying = true
  try {
    await userAPI.verifyNotifyEmail(pe.email, pe.code)
    if (pe.timer) clearInterval(pe.timer)
    pendingEmails.value = pendingEmails.value.filter(entry => entry !== pe)
    appStore.showSuccess(t('profile.balanceNotify.verifySuccess'))
    const updated = await userAPI.getProfile()
    authStore.user = updated
    emailEntries.value = [...updated.balance_notify_extra_emails]
  } catch (err: unknown) {
    appStore.showError(extractApiErrorMessage(err, t('common.error')))
  } finally {
    pe.verifying = false
  }
}

const handleRemoveEmail = async (email: string) => {
  try {
    await userAPI.removeNotifyEmail(email)
    appStore.showSuccess(t('profile.balanceNotify.removeSuccess'))
    const updated = await userAPI.getProfile()
    authStore.user = updated
    emailEntries.value = [...updated.balance_notify_extra_emails]
  } catch (err: unknown) {
    appStore.showError(extractApiErrorMessage(err, t('common.error')))
  }
}

// Verify saved unverified emails
async function sendCodeForSaved(email: string) {
  sendingSavedCode.value = true
  try {
    await userAPI.sendNotifyEmailCode(email)
    if (disposed) return
    verifyingEmail.value = email
    verifyCode.value = ''
    verifyCountdown.value = 60
    if (verifyTimer) clearInterval(verifyTimer)
    verifyTimer = setInterval(() => {
      verifyCountdown.value--
      if (verifyCountdown.value <= 0 && verifyTimer) {
        clearInterval(verifyTimer)
        verifyTimer = null
      }
    }, 1000)
    appStore.showSuccess(t('profile.balanceNotify.codeSent'))
  } catch (err: unknown) {
    appStore.showError(extractApiErrorMessage(err, t('common.error')))
  } finally {
    sendingSavedCode.value = false
  }
}

async function verifySavedEmail(email: string) {
  if (!verifyCode.value || verifyCode.value.length !== 6) return
  verifyingSaved.value = true
  try {
    await userAPI.verifyNotifyEmail(email, verifyCode.value)
    verifyingEmail.value = ''
    verifyCode.value = ''
    if (verifyTimer) { clearInterval(verifyTimer); verifyTimer = null }
    appStore.showSuccess(t('profile.balanceNotify.verifySuccess'))
    const updated = await userAPI.getProfile()
    authStore.user = updated
    emailEntries.value = [...updated.balance_notify_extra_emails]
  } catch (err: unknown) {
    appStore.showError(extractApiErrorMessage(err, t('common.error')))
  } finally {
    verifyingSaved.value = false
  }
}
</script>

<style scoped>
.profile-panel { min-width: 0; }
.profile-embed { display: flex; flex-direction: column; gap: 12px; min-width: 0; }
.profile-block__head { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
.profile-block__head--tight { margin-bottom: 4px; }
.profile-body { display: flex; flex-direction: column; gap: 20px; min-width: 0; }
.profile-field { min-width: 0; }
.profile-switch-row { display: flex; align-items: center; justify-content: space-between; gap: 14px; }
.profile-switch-row__label { margin-bottom: 0; }
.profile-switch { position: relative; display: inline-flex; align-items: center; flex: none; cursor: pointer; }
.profile-switch__input { position: absolute; width: 1px; height: 1px; opacity: 0; }
.profile-switch__track { display: block; width: 40px; height: 23px; border-radius: 999px; background: var(--st-bg-sink); border: 1px solid var(--st-line-2); transition: background-color var(--st-t) var(--st-ease), border-color var(--st-t) var(--st-ease); }
.profile-switch__knob { display: block; width: 17px; height: 17px; margin: 2px; border-radius: 50%; background: var(--st-bg); border: 1px solid var(--st-line-2); transition: transform var(--st-t) var(--st-ease); }
.profile-switch__input:checked + .profile-switch__track { background: var(--st-brand); border-color: var(--st-brand); }
.profile-switch__input:checked + .profile-switch__track .profile-switch__knob { transform: translateX(17px); background: var(--st-brand-ink); border-color: transparent; }
.profile-switch__input:focus-visible + .profile-switch__track { outline: 2px solid var(--st-brand); outline-offset: 2px; }
.profile-switch--sm .profile-switch__track { width: 34px; height: 20px; }
.profile-switch--sm .profile-switch__knob { width: 14px; height: 14px; }
.profile-switch--sm .profile-switch__input:checked + .profile-switch__track .profile-switch__knob { transform: translateX(14px); }
.profile-inline { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; position: relative; }
.profile-inline__input { flex: 1 1 160px; min-width: 0; }
.profile-inline__input--prefix { padding-left: 28px; }
.profile-prefix { position: absolute; left: 12px; transform: translateY(-50%); top: 50%; font-size: 0.86rem; color: var(--st-ink-3); pointer-events: none; }
.profile-hint { font-size: 0.74rem; line-height: 1.6; color: var(--st-ink-3); }
.profile-hint--inline { margin-left: 6px; }
.profile-hint--warn { color: var(--st-warn); margin-bottom: 10px; }
.profile-email-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }
.profile-email { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; padding: 10px 12px; border: 1px solid var(--st-line); border-radius: var(--st-r-sm); background: var(--st-bg-soft); }
.profile-email--pending { border-color: var(--st-warn); background: var(--st-warn-soft); }
.profile-email__main { display: flex; align-items: center; gap: 10px; min-width: 0; flex: 1 1 180px; }
.profile-email__address { font-size: 0.85rem; color: var(--st-ink); overflow-wrap: anywhere; min-width: 0; }
.profile-email__address--pending { flex: 1 1 180px; }
.profile-email__actions { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.profile-code { width: 88px; padding: 7px 9px; font-size: 0.82rem; }
.profile-link { border: 0; background: none; padding: 0; font: inherit; font-size: 0.76rem; color: var(--st-brand-text); cursor: pointer; }
.profile-link:hover { text-decoration: underline; }
.profile-link--muted { color: var(--st-ink-3); }
.profile-link--danger { color: var(--st-danger); }
.profile-tag { display: inline-flex; align-items: center; height: 22px; padding-inline: 9px; border-radius: 999px; font-size: 0.72rem; }
.profile-tag--ok { background: var(--st-ok-soft); color: var(--st-ok); }
.profile-tag--warn { background: var(--st-warn-soft); color: var(--st-warn); }
.profile-providers { display: flex; flex-direction: column; }
.profile-bind { padding: 14px 0; }
.profile-bind + .profile-bind { border-top: 1px solid var(--st-line); }
</style>
