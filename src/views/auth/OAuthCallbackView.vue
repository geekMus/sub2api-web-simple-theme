<template>
  <UserShell :show-footer="false" :tab-bar="false">
    <section class="st-section oauth">
      <div class="st-shell oauth__wrap">
        <div v-if="isProcessing" class="st-card st-card--pad oauth__card oauth__center">
          <span class="oauth__spinner" aria-hidden="true"></span>
          <h1 class="st-display-3">{{ t('auth.oauth.callbackTitle') }}</h1>
          <p class="st-body">{{ t('auth.oauth.callbackHint') }}</p>
        </div>

        <div v-else-if="needsRegistrationCompletion" class="st-card st-card--pad oauth__card">
          <p class="st-eyebrow">{{ providerName }}</p>
          <h1 class="st-display-3">{{ t('auth.oidc.callbackTitle', { providerName }) }}</h1>
          <p class="st-body">{{ registrationHint }}</p>

          <div class="oauth__form">
            <div class="oauth__field">
              <label class="st-label">{{ t('auth.emailLabel') }}</label>
              <input class="st-input" type="email" :value="registrationEmail" readonly disabled />
            </div>
            <div class="oauth__field">
              <label class="st-label">{{ t('auth.passwordLabel') }}</label>
              <input v-model="password" type="password" class="st-input" :placeholder="t('auth.createPasswordPlaceholder')" :disabled="isSubmitting" autocomplete="new-password" @keyup.enter="handleSubmitRegistration" />
            </div>
            <div class="oauth__field">
              <label class="st-label">{{ t('auth.confirmPassword') }}</label>
              <input v-model="confirmPassword" type="password" class="st-input" :placeholder="t('auth.confirmPasswordPlaceholder')" :disabled="isSubmitting" autocomplete="new-password" @keyup.enter="handleSubmitRegistration" />
            </div>
            <div v-if="invitationRequired" class="oauth__field">
              <label class="st-label">{{ t('auth.invitationCodeLabel') }}</label>
              <input v-model="invitationCode" type="text" class="st-input" :placeholder="t('auth.invitationCodePlaceholder')" :disabled="isSubmitting" @keyup.enter="handleSubmitRegistration" />
            </div>
            <p v-if="registrationError" class="oauth__error">{{ registrationError }}</p>
            <button class="st-btn st-btn--primary oauth__submit" type="button" :disabled="isSubmitting || !canSubmitRegistration" @click="handleSubmitRegistration">
              {{ isSubmitting ? t('common.processing') : t('auth.oidc.completeRegistration') }}
            </button>
          </div>
        </div>

        <div v-else-if="invalidCallback" class="st-card st-card--pad oauth__card oauth__center">
          <span class="oauth__mark oauth__mark--warn" aria-hidden="true">!</span>
          <h1 class="st-display-3">{{ t('auth.oauth.invalidCallbackTitle') }}</h1>
          <p class="st-body">{{ t('auth.oauth.invalidCallbackHint') }}</p>
          <button class="st-btn st-btn--primary" type="button" @click="router.replace('/login')">{{ t('auth.backToLogin') }}</button>
        </div>

        <div v-else class="st-card st-card--pad oauth__card">
          <p class="st-eyebrow">OAuth</p>
          <h1 class="st-display-3">{{ t('auth.oauth.callbackTitle') }}</h1>
          <p class="st-body">{{ t('auth.oauth.callbackHint') }}</p>
          <div class="oauth__form">
            <div class="oauth__field">
              <label class="st-label">{{ t('auth.oauth.code') }}</label>
              <div class="oauth__copyrow">
                <input class="st-input oauth__mono" :value="code" readonly />
                <button class="st-btn st-btn--sm" type="button" :disabled="!code" @click="copy(code)">{{ t('common.copy') }}</button>
              </div>
            </div>
            <div class="oauth__field">
              <label class="st-label">{{ t('auth.oauth.state') }}</label>
              <div class="oauth__copyrow">
                <input class="st-input oauth__mono" :value="state" readonly />
                <button class="st-btn st-btn--sm" type="button" :disabled="!state" @click="copy(state)">{{ t('common.copy') }}</button>
              </div>
            </div>
            <div class="oauth__field">
              <label class="st-label">{{ t('auth.oauth.fullUrl') }}</label>
              <div class="oauth__copyrow">
                <input class="st-input oauth__mono" :value="fullUrl" readonly />
                <button class="st-btn st-btn--sm" type="button" :disabled="!fullUrl" @click="copy(fullUrl)">{{ t('common.copy') }}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </UserShell>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useClipboard } from '@/composables/useClipboard'
import { useAppStore, useAuthStore } from '@/stores'
import UserShell from '@/components/shell/UserShell.vue'
import { apiClient } from '@/api/client'
import { buildApiUrl } from '@/api/url'
import {
  exchangePendingOAuthCompletion,
  persistOAuthTokenContext,
  type OAuthTokenResponse
} from '@/api/auth'
import {
  clearAllAffiliateReferralCodes,
  loadOAuthAffiliateCode,
  oauthAffiliatePayload
} from '@/utils/oauthAffiliate'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const { copyToClipboard } = useClipboard()
const appStore = useAppStore()
const authStore = useAuthStore()
const isProcessing = ref(false)
const isSubmitting = ref(false)
const needsRegistrationCompletion = ref(false)
const invitationRequired = ref(false)
const registrationEmail = ref('')
const password = ref('')
const confirmPassword = ref('')
const invitationCode = ref('')
const registrationError = ref('')
const pendingProvider = ref<'github' | 'google'>('github')
const redirectTo = ref('/dashboard')
const invalidCallback = ref(false)
const EMAIL_OAUTH_PENDING_PROVIDER_KEY = 'email_oauth_pending_provider'

type EmailOAuthPendingCompletion = Partial<OAuthTokenResponse> & {
  error?: string
  provider?: string
  redirect?: string
  email?: string
  resolved_email?: string
  invitation_required?: boolean
}

const code = computed(() => (route.query.code as string) || '')
const state = computed(() => (route.query.state as string) || '')
const error = computed(
  () => (route.query.error as string) || (route.query.error_description as string) || ''
)

const fullUrl = computed(() => {
  if (typeof window === 'undefined') return ''
  return window.location.href
})
const providerName = computed(() =>
  pendingProvider.value === 'google' ? 'Google' : 'GitHub'
)
const registrationHint = computed(() =>
  invitationRequired.value
    ? t('auth.oidc.invitationRequired', { providerName: providerName.value })
    : t('auth.oidc.completeRegistration')
)
const canSubmitRegistration = computed(() => {
  if (!registrationEmail.value.trim()) return false
  if (password.value.length < 6) return false
  if (password.value !== confirmPassword.value) return false
  if (invitationRequired.value && !invitationCode.value.trim()) return false
  return true
})

function parseFragmentParams(): URLSearchParams {
  const raw = typeof window !== 'undefined' ? window.location.hash : ''
  const hash = raw.startsWith('#') ? raw.slice(1) : raw
  return new URLSearchParams(hash)
}

function readTokenResponse(params: URLSearchParams): OAuthTokenResponse | null {
  const accessToken = params.get('access_token')?.trim() || ''
  if (!accessToken) return null

  const response: OAuthTokenResponse = { access_token: accessToken }
  const refreshToken = params.get('refresh_token')?.trim() || ''
  if (refreshToken) response.refresh_token = refreshToken
  const expiresIn = Number.parseInt(params.get('expires_in')?.trim() || '', 10)
  if (Number.isFinite(expiresIn) && expiresIn > 0) response.expires_in = expiresIn
  const tokenType = params.get('token_type')?.trim() || ''
  if (tokenType) response.token_type = tokenType
  return response
}

function sanitizeRedirectPath(path: string | null | undefined): string {
  if (!path) return '/dashboard'
  if (!path.startsWith('/')) return '/dashboard'
  if (path.startsWith('//')) return '/dashboard'
  if (path.includes('://')) return '/dashboard'
  if (path.includes('\n') || path.includes('\r')) return '/dashboard'
  return path
}

function readPendingEmailOAuthProvider(): 'github' | 'google' | null {
  if (typeof window === 'undefined') return null
  const provider = window.sessionStorage.getItem(EMAIL_OAUTH_PENDING_PROVIDER_KEY)
  if (provider === 'github' || provider === 'google') return provider
  return null
}

function redirectProviderCallbackToBackend(provider: 'github' | 'google'): void {
  if (typeof window === 'undefined') return
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(route.query)) {
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item != null) params.append(key, String(item))
      })
    } else if (value != null) {
      params.set(key, String(value))
    }
  }
  const suffix = params.toString() ? `?${params.toString()}` : ''
  window.location.href = buildApiUrl(`/auth/oauth/${provider}/callback${suffix}`)
}

async function finalizeTokenResponse(tokenResponse: OAuthTokenResponse, redirect: string) {
  persistOAuthTokenContext(tokenResponse)
  await authStore.setToken(tokenResponse.access_token)
  if (typeof window !== 'undefined') {
    window.sessionStorage.removeItem(EMAIL_OAUTH_PENDING_PROVIDER_KEY)
  }
  clearAllAffiliateReferralCodes()
  appStore.showSuccess(t('auth.loginSuccess'))
  await router.replace(sanitizeRedirectPath(redirect))
}

function hasOAuthTokenResponse(value: Partial<OAuthTokenResponse>): value is OAuthTokenResponse {
  return typeof value.access_token === 'string' && value.access_token.trim() !== ''
}

async function resumePendingEmailOAuth() {
  isProcessing.value = true
  try {
    const completion = await exchangePendingOAuthCompletion() as EmailOAuthPendingCompletion
    const completionRedirect = completion.redirect || '/dashboard'
    if (hasOAuthTokenResponse(completion)) {
      await finalizeTokenResponse(completion, completionRedirect)
      return
    }

    const provider = String(completion.provider || '').toLowerCase()
    if (provider === 'github' || provider === 'google') {
      pendingProvider.value = provider
    }
    redirectTo.value = sanitizeRedirectPath(completionRedirect)

    if (completion.error === 'invitation_required' || completion.error === 'registration_completion_required') {
      invitationRequired.value = completion.error === 'invitation_required' || completion.invitation_required === true
      registrationEmail.value = String(completion.resolved_email || completion.email || '').trim()
      needsRegistrationCompletion.value = true
      isProcessing.value = false
      return
    }

    appStore.showError(completion.error || t('auth.loginFailed'))
  } catch (e: unknown) {
    const err = e as { message?: string; response?: { data?: { message?: string } } }
    const message = err.response?.data?.message || err.message || t('auth.loginFailed')
    appStore.showError(message)
    invalidCallback.value = true
  } finally {
    if (!needsRegistrationCompletion.value) {
      isProcessing.value = false
    }
  }
}

async function handleSubmitRegistration() {
  registrationError.value = ''
  if (!registrationEmail.value.trim()) {
    registrationError.value = t('auth.emailRequired')
    return
  }
  if (password.value.length < 6) {
    registrationError.value = t('auth.passwordMinLength')
    return
  }
  if (password.value !== confirmPassword.value) {
    registrationError.value = t('auth.passwordsDoNotMatch')
    return
  }
  const code = invitationCode.value.trim()
  if (invitationRequired.value && !code) return

  isSubmitting.value = true
  try {
    const payload: { password: string; invitation_code?: string; aff_code?: string } = {
      password: password.value,
      ...oauthAffiliatePayload(loadOAuthAffiliateCode())
    }
    if (invitationRequired.value) {
      payload.invitation_code = code
    }
    const { data } = await apiClient.post<OAuthTokenResponse>(
      `/auth/oauth/${pendingProvider.value}/complete-registration`,
      payload
    )
    await finalizeTokenResponse(data, redirectTo.value)
  } catch (e: unknown) {
    const err = e as { message?: string; response?: { data?: { message?: string } } }
    registrationError.value =
      err.response?.data?.message || err.message || t('auth.oidc.completeRegistrationFailed')
  } finally {
    isSubmitting.value = false
  }
}

onMounted(async () => {
  const params = parseFragmentParams()
  const tokenResponse = readTokenResponse(params)
  const fragmentError = params.get('error') || ''
  const fragmentErrorDescription =
    params.get('error_description') || params.get('error_message') || ''

  if (fragmentError) {
    appStore.showError(fragmentErrorDescription || fragmentError)
    return
  }
  if (!tokenResponse) {
    if (route.path === '/auth/oauth/callback') {
      const pendingEmailOAuthProvider = readPendingEmailOAuthProvider()
      if (pendingEmailOAuthProvider && code.value && state.value) {
        redirectProviderCallbackToBackend(pendingEmailOAuthProvider)
        return
      }
      await resumePendingEmailOAuth()
    }
    return
  }

  isProcessing.value = true
  try {
    await finalizeTokenResponse(tokenResponse, params.get('redirect') || '/dashboard')
  } catch (error: unknown) {
    const message = (error as { message?: string })?.message || t('auth.loginFailed')
    appStore.showError(message)
    isProcessing.value = false
  }
})

watch(
  error,
  (message) => {
    if (message) {
      appStore.showError(message)
    }
  },
  { immediate: true }
)

const copy = (value: string) => {
  if (!value) return
  copyToClipboard(value)
}
</script>

<style scoped>
.oauth { padding-top: clamp(36px, 6vw, 80px); }
.oauth__wrap { max-width: 720px; }
.oauth__card { display: flex; flex-direction: column; gap: 12px; }
.oauth__center { align-items: center; text-align: center; padding-block: clamp(32px, 5vw, 52px); }
.oauth__center .st-body { max-width: 44ch; }
.oauth__spinner { width: 24px; height: 24px; border-radius: 50%; border: 2px solid var(--st-line); border-top-color: var(--st-brand); animation: oauth-spin 800ms linear infinite; }
@keyframes oauth-spin { to { transform: rotate(360deg); } }
.oauth__mark { display: grid; place-items: center; width: 42px; height: 42px; border-radius: 50%; background: var(--st-warn-soft); color: var(--st-warn); font-size: 1.15rem; font-weight: 700; }
.oauth__form { display: flex; flex-direction: column; gap: 16px; margin-top: 8px; }
.oauth__field { display: flex; flex-direction: column; gap: 7px; }
.oauth__copyrow { display: flex; gap: 8px; }
.oauth__copyrow .st-input { flex: 1; min-width: 0; }
.oauth__mono { font-family: var(--st-font-mono); font-size: 0.82rem; }
.oauth__error { margin: 0; color: var(--st-danger); font-size: 0.86rem; }
.oauth__submit { width: 100%; margin-top: 4px; }
@media (max-width: 560px) {
  .oauth__copyrow { flex-direction: column; }
  .oauth__copyrow .st-btn { align-self: flex-end; }
}
</style>
