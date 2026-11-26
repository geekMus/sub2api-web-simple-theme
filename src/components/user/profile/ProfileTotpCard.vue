<template>
  <div class="st-card st-card--pad profile-panel">
    <header class="profile-block__head">
      <h2 class="st-display-3">{{ t('profile.totp.title') }}</h2>
      <p class="st-body">{{ t('profile.totp.description') }}</p>
    </header>

    <div v-if="loading" class="profile-loading">
      <span class="st-skeleton profile-loading__bar"></span>
    </div>

    <div v-else-if="status && !status.feature_enabled" class="profile-status">
      <span class="profile-status__icon"><Icon name="shield" size="md" /></span>
      <div class="profile-status__copy">
        <p class="st-row__title">{{ t('profile.totp.featureDisabled') }}</p>
        <p class="st-row__meta">{{ t('profile.totp.featureDisabledHint') }}</p>
      </div>
    </div>

    <div v-else-if="status?.enabled" class="profile-status">
      <span class="profile-status__icon profile-status__icon--ok"><Icon name="checkCircle" size="md" /></span>
      <div class="profile-status__copy">
        <p class="st-row__title">{{ t('profile.totp.enabled') }}</p>
        <p v-if="status.enabled_at" class="st-row__meta">{{ t('profile.totp.enabledAt') }}: {{ formatDate(status.enabled_at) }}</p>
      </div>
      <div class="profile-status__action">
        <button type="button" class="st-btn st-btn--ghost st-btn--sm profile-btn-danger" @click="showDisableDialog = true">
          {{ t('profile.totp.disable') }}
        </button>
      </div>
    </div>

    <div v-else class="profile-status">
      <span class="profile-status__icon"><Icon name="shield" size="md" /></span>
      <div class="profile-status__copy">
        <p class="st-row__title">{{ t('profile.totp.notEnabled') }}</p>
        <p class="st-row__meta">{{ t('profile.totp.notEnabledHint') }}</p>
      </div>
      <div class="profile-status__action">
        <button type="button" class="st-btn st-btn--primary st-btn--sm" @click="showSetupModal = true">
          {{ t('profile.totp.enable') }}
        </button>
      </div>
    </div>

    <TotpSetupModal v-if="showSetupModal" @close="showSetupModal = false" @success="handleSetupSuccess" />
    <TotpDisableDialog v-if="showDisableDialog" @close="showDisableDialog = false" @success="handleDisableSuccess" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { totpAPI } from '@/api'
import type { TotpStatus } from '@/types'
import { Icon } from '@/components/icons'
import TotpSetupModal from './TotpSetupModal.vue'
import TotpDisableDialog from './TotpDisableDialog.vue'

const { t } = useI18n()

const loading = ref(true)
const status = ref<TotpStatus | null>(null)
const showSetupModal = ref(false)
const showDisableDialog = ref(false)

const loadStatus = async () => {
  loading.value = true
  try {
    status.value = await totpAPI.getStatus()
  } catch (error) {
    console.error('Failed to load TOTP status:', error)
  } finally {
    loading.value = false
  }
}

const handleSetupSuccess = () => {
  showSetupModal.value = false
  loadStatus()
}

const handleDisableSuccess = () => {
  showDisableDialog.value = false
  loadStatus()
}

const formatDate = (timestamp: number) => {
  // Backend returns Unix timestamp in seconds, convert to milliseconds
  const date = new Date(timestamp * 1000)
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(() => {
  loadStatus()
})
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
