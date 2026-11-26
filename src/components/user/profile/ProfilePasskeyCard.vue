<template>
  <div class="st-card st-card--pad profile-panel">
    <header class="profile-block__head profile-block__head--row">
      <div>
        <h2 class="st-display-3">{{ t('profile.passkey.title') }}</h2>
        <p class="st-body">{{ t('profile.passkey.description') }}</p>
      </div>
      <button
        v-if="enabled && supported && !showAddForm"
        type="button"
        class="st-btn st-btn--primary st-btn--sm"
        :disabled="busy"
        @click="showAddForm = true"
      >
        {{ t('profile.passkey.add') }}
      </button>
    </header>

    <p v-if="!enabled" class="st-body profile-note">{{ t('profile.passkey.featureDisabled') }}</p>
    <p v-if="enabled && !supported" class="st-body profile-note profile-note--warn">{{ t('profile.passkey.unsupported') }}</p>

    <form
      v-if="enabled && supported && showAddForm"
      class="profile-inline-form"
      @submit.prevent="addPasskey"
    >
      <div class="profile-inline-form__grid">
        <div>
          <label for="passkey-name" class="st-label">{{ t('profile.passkey.name') }}</label>
          <input
            id="passkey-name"
            v-model="newName"
            class="st-input"
            maxlength="100"
            :placeholder="t('profile.passkey.namePlaceholder')"
            autofocus
          />
        </div>
        <div>
          <label for="passkey-add-password" class="st-label">{{ t('profile.currentPassword') }}</label>
          <input
            id="passkey-add-password"
            v-model="newPassword"
            type="password"
            autocomplete="current-password"
            class="st-input"
            :placeholder="t('profile.passkey.passwordPlaceholder')"
          />
        </div>
      </div>
      <div class="profile-form__actions">
        <button type="button" class="st-btn st-btn--quiet st-btn--sm" :disabled="busy" @click="cancelAdd">
          {{ t('common.cancel') }}
        </button>
        <button type="submit" class="st-btn st-btn--primary st-btn--sm" :disabled="busy || newPassword.length === 0">
          {{ busy ? t('common.processing') : t('profile.passkey.continue') }}
        </button>
      </div>
    </form>

    <div v-if="loading" class="profile-loading">
      <span class="st-skeleton profile-loading__bar"></span>
    </div>

    <p v-else-if="credentials.length === 0" class="profile-empty">{{ t('profile.passkey.empty') }}</p>

    <div v-else class="st-list">
      <div v-for="credential in credentials" :key="credential.id" class="st-row profile-credential">
        <div class="profile-credential__main">
          <div class="profile-credential__name">
            <Icon name="key" size="sm" class="profile-credential__icon" />
            <span class="st-row__title profile-credential__label">{{ credential.name }}</span>
            <span v-if="credential.backup" class="st-pill st-pill--ok">{{ t('profile.passkey.synced') }}</span>
          </div>
          <p class="st-row__meta">
            {{ t('profile.passkey.createdAt', { date: formatDate(credential.created_at) }) }}
            <template v-if="credential.last_used_at">
              · {{ t('profile.passkey.lastUsed', { date: formatDate(credential.last_used_at) }) }}
            </template>
          </p>
        </div>
        <div class="profile-credential__actions">
          <button type="button" class="st-btn st-btn--quiet st-btn--sm" :disabled="busy" @click="renamePasskey(credential)">
            {{ t('common.edit') }}
          </button>
          <button type="button" class="st-btn st-btn--ghost st-btn--sm profile-btn-danger" :disabled="busy" @click="deletePasskey(credential)">
            {{ t('common.delete') }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="deleteTarget" class="profile-sheet" role="dialog" aria-modal="true">
      <div class="profile-sheet__scrim" @click="closeDeleteDialog"></div>
      <div class="st-card st-card--pad profile-sheet__panel">
        <h3 class="st-display-3">{{ t('profile.passkey.deleteTitle') }}</h3>
        <p class="st-body profile-sheet__body">{{ t('profile.passkey.deleteConfirm', { name: deleteTarget.name }) }}</p>
        <form class="profile-form" @submit.prevent="confirmDelete">
          <div>
            <label for="passkey-delete-password" class="st-label">{{ t('profile.currentPassword') }}</label>
            <input
              id="passkey-delete-password"
              v-model="deletePassword"
              type="password"
              autocomplete="current-password"
              class="st-input"
              :placeholder="t('profile.passkey.passwordPlaceholder')"
              autofocus
            />
          </div>
          <div class="profile-form__actions">
            <button type="button" class="st-btn st-btn--quiet st-btn--sm" :disabled="busy" @click="closeDeleteDialog">
              {{ t('common.cancel') }}
            </button>
            <button type="submit" class="st-btn st-btn--primary st-btn--sm" :disabled="busy || deletePassword.length === 0">
              {{ busy ? t('common.processing') : t('common.delete') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { passkeyAPI, type PasskeyCredentialSummary } from '@/api'
import { Icon } from '@/components/icons'
import { useAppStore } from '@/stores/app'

const props = defineProps<{ enabled: boolean }>()

const { t } = useI18n()
const appStore = useAppStore()
const supported = passkeyAPI.isSupported()
const loading = ref(false)
const busy = ref(false)
const showAddForm = ref(false)
const newName = ref('')
const newPassword = ref('')
const deleteTarget = ref<PasskeyCredentialSummary | null>(null)
const deletePassword = ref('')
const credentials = ref<PasskeyCredentialSummary[]>([])

// apiClient 拦截器把错误规范化为 { code, reason, message }；
// 透出后端消息（如密码错误），否则回退到通用文案。
function extractErrorMessage(error: unknown, fallback: string): string {
  const message = (error as { message?: string }).message
  return typeof message === 'string' && message.length > 0 ? message : fallback
}

async function loadCredentials(): Promise<void> {
  if (!props.enabled) {
    credentials.value = []
    return
  }
  loading.value = true
  try {
    credentials.value = await passkeyAPI.list()
  } catch (error) {
    // 字符串错误码在 reason 字段（code 是数字状态码）；
    // 设置变更竞态下后端仍可能返回 PASSKEY_DISABLED，静默处理
    const reason = (error as { reason?: string }).reason
    if (reason !== 'PASSKEY_DISABLED') {
      appStore.showError(t('profile.passkey.loadFailed'))
    }
  } finally {
    loading.value = false
  }
}

async function addPasskey(): Promise<void> {
  if (newPassword.value.length === 0) return
  busy.value = true
  try {
    await passkeyAPI.register(newName.value.trim(), newPassword.value)
    appStore.showSuccess(t('profile.passkey.added'))
    cancelAdd()
    await loadCredentials()
  } catch (error) {
    if (!(error instanceof DOMException && error.name === 'NotAllowedError')) {
      appStore.showError(extractErrorMessage(error, t('profile.passkey.addFailed')))
    }
  } finally {
    busy.value = false
  }
}

function cancelAdd(): void {
  showAddForm.value = false
  newName.value = ''
  newPassword.value = ''
}

async function renamePasskey(credential: PasskeyCredentialSummary): Promise<void> {
  const name = window.prompt(t('profile.passkey.renamePrompt'), credential.name)?.trim()
  if (!name || name === credential.name) return
  busy.value = true
  try {
    await passkeyAPI.rename(credential.id, name)
    credential.name = name
    appStore.showSuccess(t('profile.passkey.renamed'))
  } catch {
    appStore.showError(t('profile.passkey.renameFailed'))
  } finally {
    busy.value = false
  }
}

function deletePasskey(credential: PasskeyCredentialSummary): void {
  deleteTarget.value = credential
  deletePassword.value = ''
}

function closeDeleteDialog(): void {
  deleteTarget.value = null
  deletePassword.value = ''
}

async function confirmDelete(): Promise<void> {
  const credential = deleteTarget.value
  if (!credential || deletePassword.value.length === 0) return
  busy.value = true
  try {
    await passkeyAPI.remove(credential.id, deletePassword.value)
    credentials.value = credentials.value.filter((item) => item.id !== credential.id)
    appStore.showSuccess(t('profile.passkey.deleted'))
    closeDeleteDialog()
  } catch (error) {
    // 密码错误等失败保持对话框打开，允许重试
    appStore.showError(extractErrorMessage(error, t('profile.passkey.deleteFailed')))
  } finally {
    busy.value = false
  }
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(new Date(value))
}

watch(
  () => props.enabled,
  () => {
    void loadCredentials()
  },
  { immediate: true }
)
</script>

<style scoped>
.profile-panel { min-width: 0; }
.profile-block__head { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
.profile-block__head--row { gap: 12px; }
.profile-status { display: flex; flex-wrap: wrap; align-items: center; gap: 14px; }
.profile-status__icon {
  display: grid; place-items: center; flex: none;
  width: 42px; height: 42px; border-radius: 12px;
  background: var(--st-bg-soft); color: var(--st-ink-2);
}
.profile-status__icon--ok { background: var(--st-ok-soft); color: var(--st-ok); }
.profile-status__copy { min-width: 0; flex: 1 1 180px; }
.profile-status__action { flex: none; }
.profile-loading { padding: 12px 0; }
.profile-loading__bar { display: block; height: 16px; width: 60%; }
.profile-note { margin-bottom: 10px; }
.profile-note--warn { color: var(--st-warn); }
.profile-empty {
  padding: 22px 16px; text-align: center;
  font-size: 0.86rem; color: var(--st-ink-3);
  border: 1px dashed var(--st-line-2); border-radius: var(--st-r-md);
}
.profile-inline-form { display: flex; flex-direction: column; gap: 12px; margin-bottom: 18px; padding: 16px; border: 1px solid var(--st-line); border-radius: var(--st-r-md); background: var(--st-bg-soft); }
.profile-inline-form__grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
.profile-form { display: flex; flex-direction: column; gap: 14px; min-width: 0; }
.profile-form__actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 8px; }
.profile-credential { grid-template-columns: minmax(0, 1fr); align-items: start; }
.profile-credential__main { min-width: 0; }
.profile-credential__name { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; min-width: 0; }
.profile-credential__icon { color: var(--st-ink-3); flex: none; }
.profile-credential__label { min-width: 0; overflow-wrap: anywhere; }
.profile-credential__actions { display: flex; flex-wrap: wrap; gap: 6px; }
.profile-btn-danger { color: var(--st-danger); }
.profile-btn-danger:hover { background: var(--st-danger-soft); color: var(--st-danger); }
.profile-sheet { position: fixed; inset: 0; z-index: 60; display: grid; place-items: center; padding: 16px; }
.profile-sheet__scrim { position: absolute; inset: 0; background: var(--st-overlay); backdrop-filter: blur(4px); }
.profile-sheet__panel { position: relative; width: 100%; max-width: 420px; box-shadow: var(--st-shadow-3); }
.profile-sheet__body { margin: 10px 0 16px; }
@media (min-width: 640px) {
  .profile-block__head--row { flex-direction: row; align-items: flex-start; justify-content: space-between; }
  .profile-inline-form__grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .profile-credential { grid-template-columns: minmax(0, 1fr) auto; align-items: center; }
}
</style>
