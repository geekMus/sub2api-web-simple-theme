<template>
  <UserShell :show-footer="false" :tab-bar="false">
    <section class="st-section consent" aria-labelledby="mcp-consent-title" :aria-busy="loading || submitting">
      <div class="st-shell consent__wrap">
        <header class="consent__head">
          <p class="st-eyebrow">MCP</p>
          <h1 id="mcp-consent-title" class="st-display-2">{{ t('mcp.consentTitle') }}</h1>
          <p class="st-lede">{{ t('mcp.consentDescription') }}</p>
        </header>

        <div v-if="loading" class="st-card st-card--pad consent__state" role="status">
          <span class="consent__spinner" aria-hidden="true"></span>
          <p class="st-body">{{ t('mcp.consentLoading') }}</p>
        </div>

        <div v-else-if="previewError" class="st-card st-card--pad consent__state">
          <p role="alert" class="consent__error">{{ previewError }}</p>
          <p class="st-body">{{ t('mcp.consentRetryHint') }}</p>
          <RouterLink to="/settings/mcp" class="st-btn st-btn--primary">{{ t('mcp.backToConnections') }}</RouterLink>
        </div>

        <form v-else-if="consent" class="consent__grid" @submit.prevent="decide(true)">
          <article class="st-card st-card--pad consent__card">
            <p class="st-eyebrow">{{ t('mcp.applicationName') }}</p>
            <h2 class="st-display-3 consent__app" data-testid="client-name">{{ consent.client_name }}</h2>
            <dl class="consent__meta">
              <div class="consent__row">
                <dt>{{ t('mcp.clientId') }}</dt>
                <dd><span class="st-code">{{ consent.client_id }}</span></dd>
              </div>
              <div class="consent__row">
                <dt>{{ t('mcp.returnAddress') }}</dt>
                <dd>
                  <span data-testid="redirect-origin" class="consent__strong">{{ redirectOrigin }}</span>
                  <span data-testid="redirect-uri" class="st-code">{{ consent.redirect_uri }}</span>
                </dd>
              </div>
              <div class="consent__row">
                <dt>{{ t('mcp.requestedAccess') }}</dt>
                <dd>
                  <span>{{ t('mcp.requestedAccessDescription') }}</span>
                  <span class="st-code">{{ consent.resource }}</span>
                </dd>
              </div>
            </dl>
            <p class="consent__warn">{{ t('mcp.untrustedApplicationHint') }}</p>
          </article>

          <aside class="st-card st-card--pad consent__card consent__side">
            <div class="consent__field">
              <label for="mcp-consent-scope" class="st-label">{{ t('mcp.scope') }}</label>
              <select id="mcp-consent-scope" v-model="scope" class="st-input" :disabled="submitting" aria-describedby="mcp-scope-hint">
                <option value="user">{{ t('mcp.userScope') }}</option>
                <option v-if="authStore.isAdmin" value="admin">{{ t('mcp.adminScope') }}</option>
              </select>
              <p id="mcp-scope-hint" class="consent__hint">{{ scope === 'admin' ? t('mcp.adminScopeHint') : t('mcp.userScopeHint') }}</p>
            </div>

            <div class="consent__field">
              <label for="mcp-consent-permissions" class="st-label">{{ t('mcp.permissions') }}</label>
              <select id="mcp-consent-permissions" v-model="readOnly" class="st-input" :disabled="submitting" aria-describedby="mcp-permissions-hint">
                <option :value="true">{{ t('mcp.readOnly') }}</option>
                <option :value="false">{{ t('mcp.readWrite') }}</option>
              </select>
              <p id="mcp-permissions-hint" class="consent__hint" :class="{ 'consent__hint--warn': !readOnly }">{{ readOnly ? t('mcp.readOnlyHint') : t('mcp.readWriteHint') }}</p>
              <p v-if="scope === 'admin' && !readOnly" data-testid="admin-write-hint" class="consent__hint consent__hint--warn">{{ t('mcp.adminWriteHint') }}</p>
            </div>

            <p v-if="authStore.user?.email" class="consent__who">{{ t('mcp.signedInAs', { email: authStore.user.email }) }}</p>
            <p v-if="submitError" role="alert" class="consent__error">{{ submitError }}</p>

            <div class="consent__actions">
              <button data-testid="deny" type="button" class="st-btn" :disabled="submitting" @click="decide(false)">{{ t('mcp.deny') }}</button>
              <button data-testid="approve" type="submit" class="st-btn st-btn--primary" :disabled="submitting">{{ submitting ? t('common.processing') : t('mcp.approve') }}</button>
            </div>
          </aside>
        </form>
      </div>
    </section>
    <TotpStepUpDialog :controller="stepUp" />
  </UserShell>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { mcpAPI, type MCPAccessScope, type MCPAuthorization, type MCPConsent } from '@/api/mcp'
import TotpStepUpDialog from '@/components/auth/TotpStepUpDialog.vue'
import UserShell from '@/components/shell/UserShell.vue'
import { isStepUpBlocked, isStepUpCancelled, stepUpBlockReason, useStepUp } from '@/composables/useStepUp'
import { useAuthStore } from '@/stores/auth'

const { t } = useI18n()
const route = useRoute()
const authStore = useAuthStore()
const stepUp = useStepUp()
const loading = ref(true)
const submitting = ref(false)
const previewError = ref('')
const submitError = ref('')
const consent = ref<MCPConsent | null>(null)
const scope = ref<MCPAccessScope>('user')
const readOnly = ref(true)
let authorization: MCPAuthorization | null = null
let generation = 0
const redirectOrigin = computed(() => consent.value ? new URL(consent.value.redirect_uri).origin : '')

function errorMessage(error: unknown, fallback: string): string {
  const message = (error as { message?: unknown } | null)?.message
  return typeof message === 'string' && message ? message : fallback
}

function parseAuthorization(): MCPAuthorization {
  const required = ['response_type', 'client_id', 'redirect_uri', 'code_challenge', 'code_challenge_method', 'resource'] as const
  const allowed = [...required, 'scope', 'state']
  const values: Record<string, string> = {}
  for (const [key, value] of Object.entries(route.query)) {
    if (!allowed.includes(key) || typeof value !== 'string' || value.length > 4096) {
      throw new Error(t('mcp.invalidRequest'))
    }
    values[key] = value
  }
  if (required.some(key => !values[key]) || values.response_type !== 'code' ||
    values.code_challenge_method !== 'S256' || !/^[A-Za-z0-9_-]{43}$/.test(values.code_challenge) ||
    (values.scope !== undefined && values.scope !== '' && values.scope !== 'mcp')) {
    throw new Error(t('mcp.invalidRequest'))
  }
  return values as unknown as MCPAuthorization
}

function validatePreview(result: MCPConsent, request: MCPAuthorization): void {
  if (result.client_id !== request.client_id || result.redirect_uri !== request.redirect_uri ||
    result.resource !== request.resource || result.scope !== 'mcp' || typeof result.client_name !== 'string') {
    throw new Error(t('mcp.invalidRequest'))
  }
  const redirect = new URL(result.redirect_uri)
  if (!['https:', 'http:'].includes(redirect.protocol) || redirect.username || redirect.password || redirect.hash) {
    throw new Error(t('mcp.invalidRequest'))
  }
}

async function loadConsent(): Promise<void> {
  const current = ++generation
  stepUp.onCancel()
  loading.value = true
  submitting.value = false
  previewError.value = ''
  submitError.value = ''
  consent.value = null
  authorization = null
  scope.value = 'user'
  readOnly.value = true
  try {
    const request = parseAuthorization()
    const result = await mcpAPI.previewAuthorization({ ...request })
    if (current !== generation) return
    validatePreview(result, request)
    authorization = Object.freeze({ ...request })
    consent.value = result
  } catch (error) {
    if (current === generation) previewError.value = errorMessage(error, t('mcp.consentLoadFailed'))
  } finally {
    if (current === generation) loading.value = false
  }
}

async function decide(approved: boolean): Promise<void> {
  if (loading.value || submitting.value || !consent.value || !authorization) return
  const current = generation
  const expectedRedirect = new URL(consent.value.redirect_uri)
  const input = {
    authorization: { ...authorization },
    approved,
    scope: approved && authStore.isAdmin ? scope.value : 'user' as const,
    read_only: approved ? readOnly.value : true
  }
  submitting.value = true
  submitError.value = ''
  try {
    const action = async () => {
      // A changed route or unmounted page must not retry a previous consent.
      if (current !== generation) throw new Error(t('mcp.invalidRequest'))
      try {
        return await mcpAPI.authorize(input)
      } catch (error) {
        // Do not open a step-up prompt for a request that is no longer shown.
        if (current !== generation) throw new Error(t('mcp.invalidRequest'))
        throw error
      }
    }
    const result = approved && input.scope === 'admin' ? await stepUp.run(action) : await action()
    if (current !== generation) return
    const destination = new URL(result.redirect_url)
    if (destination.origin !== expectedRedirect.origin || destination.pathname !== expectedRedirect.pathname ||
      destination.username || destination.password || destination.hash) {
      throw new Error(t('mcp.invalidRedirect'))
    }
    window.location.assign(result.redirect_url)
  } catch (error) {
    if (current !== generation) return
    if (!isStepUpCancelled(error)) {
      submitError.value = isStepUpBlocked(error)
        ? stepUpBlockReason(error) === 'STEP_UP_ADMIN_API_KEY_FORBIDDEN' ? t('stepUp.adminApiKeyForbidden') : t('stepUp.notEnabled')
        : errorMessage(error, t('mcp.consentSubmitFailed'))
    }
    submitting.value = false
  }
}

watch(() => route.fullPath, loadConsent, { immediate: true })
onBeforeUnmount(() => {
  generation++
  authorization = null
  stepUp.onCancel()
})
</script>

<style scoped>
.consent { padding-top: clamp(36px, 6vw, 84px); }
.consent__wrap { max-width: 980px; }
.consent__head { display: flex; flex-direction: column; gap: 10px; margin-bottom: clamp(24px, 4vw, 40px); }
.consent__head .st-lede { max-width: 52ch; }
.consent__state { display: flex; flex-direction: column; align-items: flex-start; gap: 14px; max-width: 560px; }
.consent__spinner { width: 22px; height: 22px; border-radius: 50%; border: 2px solid var(--st-line); border-top-color: var(--st-brand); animation: consent-spin 800ms linear infinite; }
@keyframes consent-spin { to { transform: rotate(360deg); } }
.consent__grid { display: grid; grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr); gap: 18px; align-items: start; }
.consent__card { display: flex; flex-direction: column; gap: 16px; }
.consent__app { margin-top: -2px; word-break: break-all; }
.consent__meta { display: flex; flex-direction: column; margin: 0; border-top: 1px solid var(--st-line); }
.consent__row { display: grid; grid-template-columns: 132px minmax(0, 1fr); gap: 16px; padding: 13px 0; border-bottom: 1px solid var(--st-line); }
.consent__row dt { margin: 0; font-size: 0.78rem; color: var(--st-ink-3); }
.consent__row dd { margin: 0; display: flex; flex-direction: column; gap: 4px; color: var(--st-ink-2); font-size: 0.88rem; }
.consent__strong { color: var(--st-ink); font-weight: 550; word-break: break-all; }
.consent__warn { margin: 0; padding: 12px 14px; border-radius: var(--st-r-sm); background: var(--st-warn-soft); color: var(--st-warn); font-size: 0.82rem; line-height: 1.55; }
.consent__side { position: sticky; top: 88px; }
.consent__field { display: flex; flex-direction: column; gap: 7px; }
.consent__hint { margin: 0; font-size: 0.78rem; line-height: 1.5; color: var(--st-ink-3); }
.consent__hint--warn { color: var(--st-warn); }
.consent__who { margin: 0; padding-top: 2px; font-size: 0.8rem; color: var(--st-ink-3); word-break: break-all; }
.consent__error { margin: 0; color: var(--st-danger); font-size: 0.86rem; line-height: 1.55; }
.consent__actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 4px; padding-top: 16px; border-top: 1px solid var(--st-line); }
@media (max-width: 900px) {
  .consent__grid { grid-template-columns: 1fr; }
  .consent__side { position: static; }
  .consent__row { grid-template-columns: 1fr; gap: 5px; }
}
@media (max-width: 560px) {
  .consent__actions { flex-direction: column-reverse; }
  .consent__actions .st-btn { width: 100%; }
}
</style>
