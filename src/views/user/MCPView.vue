<template>
  <UserShell>
    <section class="st-section--tight mcp">
      <div class="st-shell">
        <header class="mcp__hero">
          <p class="st-eyebrow st-reveal">{{ c('mcp.eyebrow') }}</p>
          <h1 class="st-display-2 mcp__title st-reveal" style="--i: 1">{{ c('mcp.title') }}</h1>
          <p class="st-lede mcp__lede st-reveal" style="--i: 2">{{ c('mcp.ledeShort') }}</p>
        </header>

        <div class="mcp__grid">
          <!-- 连接信息 -->
          <section class="st-card st-card--pad mcp__connect st-reveal" style="--i: 2" aria-labelledby="mcp-connection-title" :aria-busy="connectionLoading">
            <div class="mcp__connect-head">
              <h2 id="mcp-connection-title" class="st-display-3">{{ t('mcp.connectionTitle') }}</h2>
              <p class="st-body">{{ t('mcp.connectionDescription') }}</p>
            </div>

            <div class="mcp__endpoint-block">
              <div class="mcp__endpoint-head">
                <span class="st-label mcp__endpoint-label">{{ t('mcp.endpoint') }}</span>
                <span class="mcp__state-pill" :class="endpoint ? 'mcp__state-pill--on' : 'mcp__state-pill--off'">
                  <span class="mcp__state-dot" aria-hidden="true"></span>
                  {{ endpoint ? lc('可用', 'Ready') : lc('未开启', 'Off') }}
                </span>
              </div>
              <div class="mcp__endpoint">
                <input
                  id="mcp-endpoint"
                  :value="endpoint"
                  :placeholder="connectionLoading ? t('mcp.connectionLoading') : lc('开通后这里会显示服务地址', 'The address shows up here once it is on')"
                  class="st-input mcp__endpoint-input"
                  readonly
                />
                <button
                  data-testid="copy-endpoint"
                  class="st-btn st-btn--primary mcp__copy"
                  type="button"
                  :disabled="!endpoint || connectionLoading"
                  @click="copyToClipboard(endpoint)"
                >{{ t('mcp.copyEndpoint') }}</button>
              </div>

              <!-- 未开启 / 取不到：先讲人话，再放技术原文 -->
              <div v-if="connectionError" class="mcp__notice" role="alert">
                <div class="mcp__notice-main">
                  <span class="mcp__notice-title">{{ configIssueTitle }}</span>
                  <p class="mcp__notice-body">{{ configIssueBody }}</p>
                </div>
                <p class="mcp__notice-raw">{{ connectionError }}</p>
                <button data-testid="retry-connection" class="st-btn st-btn--quiet st-btn--sm mcp__notice-btn" type="button" :disabled="connectionLoading" @click="loadConnection">
                  {{ t('common.refresh') }}
                </button>
              </div>
            </div>

            <ol class="mcp__steps">
              <li class="mcp__step" :class="{ 'mcp__step--muted': !endpoint }">
                <span class="mcp__step-num st-num">01</span>
                <span class="mcp__step-text">{{ t('mcp.connectStep1') }}</span>
              </li>
              <li class="mcp__step" :class="{ 'mcp__step--muted': !endpoint }">
                <span class="mcp__step-num st-num">02</span>
                <span class="mcp__step-text">{{ t('mcp.connectStep2') }}</span>
              </li>
              <li class="mcp__step" :class="{ 'mcp__step--muted': !endpoint }">
                <span class="mcp__step-num st-num">03</span>
                <span class="mcp__step-text">{{ t('mcp.connectStep3') }}</span>
              </li>
            </ol>

            <p class="mcp__cap">{{ t('mcp.capabilities') }}</p>
          </section>

          <!-- 授权列表 -->
          <section class="st-card st-card--pad mcp__grants st-reveal" style="--i: 3" aria-labelledby="mcp-grants-title" :aria-busy="loading">
            <div class="mcp__grants-head">
              <div class="mcp__grants-copy">
                <h2 id="mcp-grants-title" class="st-display-3">{{ t('mcp.grantsTitle') }}</h2>
                <p class="st-body">{{ t('mcp.grantsDescription') }}</p>
              </div>
              <button data-testid="refresh-grants" type="button" class="st-btn st-btn--quiet st-btn--sm" :disabled="loading || revoking" @click="loadGrants">
                {{ t('common.refresh') }}
              </button>
            </div>

            <div v-if="loadError" class="mcp__grant-error">
              <span role="alert" class="mcp__error-text">{{ loadError }}</span>
              <button data-testid="retry-grants" type="button" class="st-btn st-btn--quiet st-btn--sm" :disabled="loading" @click="loadGrants">
                {{ t('common.refresh') }}
              </button>
            </div>
            <div v-else-if="loading" class="mcp__skeleton" aria-hidden="true">
              <div v-for="i in 2" :key="i" class="st-skeleton mcp__skeleton-row"></div>
            </div>
            <div v-else-if="grants.length === 0" class="mcp__empty">
              <span class="mcp__empty-mark" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6">
                  <path d="M7 12h10M12 7v10" stroke-linecap="round" />
                  <circle cx="12" cy="12" r="9" />
                </svg>
              </span>
              <p class="mcp__empty-title">{{ t('mcp.empty') }}</p>
              <p class="mcp__empty-hint">{{ lc('连接一次，授权记录就会出现在这里，之后可以随时撤销。', 'Connect once and the authorization shows up here, ready to revoke whenever you want.') }}</p>
            </div>
            <ul v-else class="st-list mcp__list">
              <li v-for="grant in grants" :key="grant.id" class="st-row mcp__row" :data-grant-id="grant.id">
                <div class="mcp__row-main">
                  <div class="mcp__row-title">
                    <span class="mcp__client">{{ grant.client_name }}</span>
                    <span class="st-pill">{{ grant.scope === 'admin' ? t('mcp.adminScope') : t('mcp.userScope') }}</span>
                    <span class="st-pill st-pill--accent">{{ grant.read_only ? t('mcp.readOnly') : t('mcp.readWrite') }}</span>
                    <span class="mcp__state" :class="isActive(grant) ? 'mcp__state--on' : 'mcp__state--off'">{{ grantStatus(grant) }}</span>
                  </div>
                  <p class="mcp__client-id" :title="grant.client_id">{{ grant.client_id }}</p>
                  <p class="mcp__dates">
                    <span>{{ t('mcp.createdAt', { date: formatDate(grant.created_at) }) }}</span>
                    <span>{{ t('mcp.expiresAt', { date: formatDate(grant.expires_at) }) }}</span>
                    <span>{{ grant.last_used_at ? t('mcp.lastUsedAt', { date: formatDate(grant.last_used_at) }) : t('mcp.neverUsed') }}</span>
                  </p>
                </div>
                <button
                  v-if="!grant.revoked_at"
                  type="button"
                  class="st-btn st-btn--ghost st-btn--sm mcp__revoke"
                  :aria-label="`${t('mcp.revoke')} ${grant.client_name}`"
                  @click="revokeTarget = grant"
                >{{ t('mcp.revoke') }}</button>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </section>

    <BaseDialog :show="!!revokeTarget" :title="t('mcp.revokeTitle')" width="narrow" :close-on-escape="!revoking" :show-close-button="!revoking" @close="closeRevoke">
      <p class="mcp__dialog-text">{{ t('mcp.revokeConfirm', { name: revokeTarget?.client_name || '' }) }}</p>
      <p v-if="revokeError" role="alert" class="mcp__error-text">{{ revokeError }}</p>
      <template #footer>
        <div class="mcp__dialog-actions">
          <button type="button" class="st-btn st-btn--quiet st-btn--sm" :disabled="revoking" @click="closeRevoke">{{ t('common.cancel') }}</button>
          <button data-testid="confirm-revoke" type="button" class="st-btn st-btn--primary st-btn--sm" :disabled="revoking || loading" @click="revokeGrant">
            {{ revoking ? t('common.processing') : t('mcp.revoke') }}
          </button>
        </div>
      </template>
    </BaseDialog>
  </UserShell>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { mcpAPI, type MCPGrant } from '@/api/mcp'
import BaseDialog from '@/components/common/BaseDialog.vue'
import UserShell from '@/components/shell/UserShell.vue'
import { useClipboard } from '@/composables/useClipboard'
import { useAppStore } from '@/stores/app'
import { formatDate } from '@/utils/format'
import { useMiscCopy } from '@/composables/copy/misc'

const { t, locale } = useI18n()
const { c } = useMiscCopy()
const appStore = useAppStore()
const { copyToClipboard } = useClipboard()
const endpoint = ref('')
const connectionLoading = ref(false)
const connectionError = ref('')
const grants = ref<MCPGrant[]>([])
const loading = ref(false)
const loadError = ref('')
const revokeTarget = ref<MCPGrant | null>(null)
const revoking = ref(false)
const revokeError = ref('')
let unmounted = false

/** 页面内小文案：服务端只给英文原文，这里补一层人话。 */
const isZh = computed(() => {
  const raw = (locale as unknown as { value?: unknown })?.value ?? locale
  return String(raw ?? '').toLowerCase().startsWith('zh')
})
function lc(zh: string, en: string): string {
  return isZh.value ? zh : en
}

/** 后端把「没配 MCP_PUBLIC_URL」当成 4xx/5xx 抛回来，原文不适合直接给人看。 */
const configDisabled = computed(() =>
  /mcp is disabled|public_url|not configured|not set|未配置|未开启/i.test(connectionError.value)
)
const configIssueTitle = computed(() =>
  configDisabled.value ? lc('MCP 还没开启', 'MCP is not switched on yet') : lc('服务地址没取到', 'Could not load the endpoint')
)
const configIssueBody = computed(() =>
  configDisabled.value
    ? lc(
        '管理员还没有配置 MCP 的对外地址。开通之后，这里会给出可以直接复制进编辑器的服务地址。',
        'An administrator has not configured the public MCP URL yet. Once it is on, the address to paste into your editor appears here.',
      )
    : lc('网络或服务暂时不可用，稍后再试一次。', 'The network or the service is unavailable right now. Try again in a moment.')
)

function errorMessage(error: unknown, fallback: string): string {
  const message = (error as { message?: unknown } | null)?.message
  return typeof message === 'string' && message ? message : fallback
}

async function loadConnection(): Promise<void> {
  if (connectionLoading.value) return
  connectionLoading.value = true
  connectionError.value = ''
  endpoint.value = ''
  try {
    const result = await mcpAPI.getConnectionConfig()
    if (!unmounted) endpoint.value = result.resource
  } catch (error) {
    if (!unmounted) connectionError.value = errorMessage(error, t('mcp.connectionLoadFailed'))
  } finally {
    connectionLoading.value = false
  }
}

function isActive(grant: MCPGrant): boolean {
  return !grant.revoked_at && !grant.invalidated && new Date(grant.expires_at).getTime() > Date.now()
}

function grantStatus(grant: MCPGrant): string {
  if (grant.revoked_at) return t('mcp.revoked')
  if (grant.invalidated) return t('mcp.invalidated')
  return isActive(grant) ? t('mcp.active') : t('mcp.expired')
}

async function loadGrants(): Promise<void> {
  if (loading.value || revoking.value) return
  loading.value = true
  loadError.value = ''
  try {
    const result = await mcpAPI.listGrants()
    if (!unmounted) grants.value = result
  } catch (error) {
    if (!unmounted) loadError.value = errorMessage(error, t('mcp.loadFailed'))
  } finally {
    loading.value = false
  }
}

function closeRevoke(): void {
  if (revoking.value) return
  revokeTarget.value = null
  revokeError.value = ''
}

async function revokeGrant(): Promise<void> {
  if (!revokeTarget.value || revoking.value || loading.value) return
  revoking.value = true
  revokeError.value = ''
  const id = revokeTarget.value.id
  try {
    await mcpAPI.revokeGrant(id)
    if (unmounted) return
    grants.value = grants.value.map(grant => grant.id === id ? { ...grant, revoked_at: new Date().toISOString() } : grant)
    revokeTarget.value = null
    appStore.showSuccess(t('mcp.revokeSuccess'))
  } catch (error) {
    if (!unmounted) revokeError.value = errorMessage(error, t('mcp.revokeFailed'))
  } finally {
    revoking.value = false
  }
}

onMounted(() => {
  void loadConnection()
  void loadGrants()
})
onBeforeUnmount(() => { unmounted = true })
</script>

<style scoped>
.mcp { padding-bottom: clamp(56px, 8vw, 96px); }
.mcp__hero { max-width: 58ch; margin-bottom: clamp(24px, 3.4vw, 40px); }
.mcp__title { margin-top: 14px; }
.mcp__lede { margin-top: 14px; }
.mcp .st-card { box-shadow: var(--st-shadow-2); }
.mcp .st-pill { font-size: 0.75rem; }
.mcp .st-btn { min-height: 44px; }

.mcp__grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: clamp(14px, 2vw, 22px); align-items: stretch; }
@media (min-width: 1024px) {
  .mcp__grid { grid-template-columns: minmax(0, 1fr) minmax(0, 1.04fr); }
}

/* ---- 连接卡 ---- */
.mcp__connect { display: flex; flex-direction: column; gap: clamp(14px, 1.8vw, 20px); }
.mcp__connect-head { display: flex; flex-direction: column; gap: 6px; }
.mcp__connect-head .st-body { font-size: 0.86rem; }

.mcp__endpoint-block { display: flex; flex-direction: column; gap: 8px; }
.mcp__endpoint-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.mcp__endpoint-label { margin-bottom: 0; }
.mcp__state-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.72rem;
  letter-spacing: 0.04em;
  color: var(--st-ink-3);
}
.mcp__state-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--st-ink-3); }
.mcp__state-pill--on { color: var(--st-brand-text); }
.mcp__state-pill--on .mcp__state-dot { background: var(--st-brand); }
.mcp__state-pill--off .mcp__state-dot { background: var(--st-line-2); }

.mcp__endpoint { display: flex; gap: 8px; align-items: stretch; }
.mcp__endpoint-input { min-height: 46px; font-family: var(--st-font-mono); font-size: 0.82rem; }
.mcp__endpoint .st-btn { flex-shrink: 0; min-height: 46px; }

/* ---- 未开启 / 取不到：人话在前，技术原文退到最后 ---- */
.mcp__notice {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  padding: 14px 16px;
  border: 1px solid var(--st-line);
  border-radius: var(--st-r-md);
  background: var(--st-bg-soft);
}
.mcp__notice-main { display: flex; flex-direction: column; gap: 3px; }
.mcp__notice-title { font-size: 0.86rem; font-weight: 600; color: var(--st-ink); }
.mcp__notice-body { font-size: 0.82rem; line-height: 1.65; color: var(--st-ink-2); max-width: 54ch; }
.mcp__notice-raw { font-family: var(--st-font-mono); font-size: 0.7rem; line-height: 1.5; color: var(--st-ink-3); overflow-wrap: anywhere; }
.mcp__notice-btn { margin-top: 2px; }

/* ---- 接入步骤 ---- */
.mcp__steps { display: flex; flex-direction: column; margin: 0; padding: 0; list-style: none; }
.mcp__step {
  display: grid;
  grid-template-columns: 30px 1fr;
  align-items: baseline;
  gap: 10px;
  padding: 11px 0;
  border-top: 1px solid var(--st-line);
  transition: opacity var(--st-t) var(--st-ease);
}
.mcp__step:first-child { border-top: 0; }
.mcp__step--muted { opacity: 0.55; }
.mcp__step-num {
  font-family: var(--st-font-display);
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: var(--st-brand-text);
}
.mcp__step-text { font-size: 0.86rem; line-height: 1.7; color: var(--st-ink-2); }

.mcp__cap {
  margin: 0;
  padding-top: 14px;
  border-top: 1px solid var(--st-line);
  font-size: 0.78rem;
  line-height: 1.7;
  color: var(--st-ink-3);
}

/* ---- 授权列表 ---- */
.mcp__grants { display: flex; flex-direction: column; gap: clamp(12px, 1.6vw, 16px); height: 100%; }
.mcp__grants-head { display: flex; flex-wrap: wrap; align-items: flex-start; justify-content: space-between; gap: 12px; }
.mcp__grants-copy { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.mcp__grants-copy .st-body { font-size: 0.85rem; max-width: 56ch; }

.mcp__error-text { font-size: 0.84rem; line-height: 1.6; color: var(--st-danger); overflow-wrap: anywhere; }
.mcp__grant-error {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  padding: 14px;
  border-radius: var(--st-r-md);
  background: var(--st-danger-soft);
  color: var(--st-danger);
}

.mcp__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex: 1;
  padding: clamp(28px, 4vw, 40px) 16px;
  text-align: center;
  border: 1px dashed var(--st-line-2);
  border-radius: var(--st-r-md);
}
.mcp__empty-mark {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: 1px solid var(--st-line);
  background: var(--st-bg-soft);
  color: var(--st-ink-3);
}
.mcp__empty-title { margin: 2px 0 0; font-size: 0.88rem; line-height: 1.65; color: var(--st-ink-2); max-width: 38ch; }
.mcp__empty-hint { font-size: 0.78rem; line-height: 1.65; color: var(--st-ink-3); max-width: 40ch; }

.mcp__list { display: flex; flex-direction: column; gap: 8px; margin-top: 2px; }
.mcp__row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  padding: 14px;
  border: 1px solid var(--st-line);
  border-radius: var(--st-r-md);
  background: var(--st-bg);
  transition: border-color var(--st-t) var(--st-ease), background-color var(--st-t) var(--st-ease);
}
.mcp__row:hover { border-color: var(--st-line-2); background: var(--st-bg-soft); }
.mcp__row-main { min-width: 0; display: flex; flex-direction: column; gap: 6px; }
.mcp__row-title { display: flex; flex-wrap: wrap; align-items: center; gap: 7px; }
.mcp__client { font-size: 0.92rem; font-weight: 600; color: var(--st-ink); overflow-wrap: anywhere; }
.mcp__state { font-size: 0.74rem; font-weight: 550; }
.mcp__state--on { color: var(--st-brand-text); }
.mcp__state--off { color: var(--st-ink-3); }
.mcp__client-id {
  margin: 0;
  font-family: var(--st-font-mono);
  font-size: 0.72rem;
  color: var(--st-ink-3);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.mcp__dates { display: flex; flex-wrap: wrap; gap: 4px 14px; margin: 0; font-size: 0.74rem; color: var(--st-ink-3); }
.mcp__revoke { flex-shrink: 0; color: var(--st-danger); }
.mcp__revoke:hover { background: var(--st-danger-soft); color: var(--st-danger); }

.mcp__skeleton { display: flex; flex-direction: column; gap: 8px; }
.mcp__skeleton-row { height: 72px; }

.mcp__dialog-text { font-size: 0.88rem; line-height: 1.7; color: var(--st-ink-2); }
.mcp__dialog-actions { display: flex; justify-content: flex-end; gap: 8px; }

@media (max-width: 640px) {
  .mcp__endpoint { flex-direction: column; }
  .mcp__endpoint .st-btn { width: 100%; }
  .mcp__row { flex-direction: column; }
  .mcp__revoke { width: 100%; }
}
</style>
