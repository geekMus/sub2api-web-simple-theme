<template>
  <div :class="props.embedded ? 'profile-embed' : 'st-card st-card--pad profile-panel'">
    <header v-if="!props.embedded" class="profile-block__head">
      <h2 class="st-display-3">{{ t('profile.editProfile') }}</h2>
    </header>
    <form class="profile-form" @submit.prevent="handleUpdateProfile">
      <p v-if="props.embedded" class="st-display-4">{{ t('profile.editProfile') }}</p>
      <div>
        <label for="username" class="st-label">{{ t('profile.username') }}</label>
        <input id="username" v-model="username" type="text" class="st-input" :placeholder="t('profile.enterUsername')" />
      </div>
      <div class="profile-form__actions">
        <button type="submit" :disabled="loading" class="st-btn st-btn--primary st-btn--sm">
          {{ loading ? t('profile.updating') : t('profile.updateProfile') }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { userAPI } from '@/api'
import { extractApiErrorMessage } from '@/utils/apiError'

const props = withDefaults(defineProps<{
  initialUsername: string
  embedded?: boolean
}>(), {
  embedded: false,
})

const { t } = useI18n()
const authStore = useAuthStore()
const appStore = useAppStore()

const username = ref(props.initialUsername)
let savedUsername = props.initialUsername
const loading = ref(false)

watch(() => props.initialUsername, (val) => {
  if (username.value === savedUsername) username.value = val
  savedUsername = val
})

const handleUpdateProfile = async () => {
  if (!username.value.trim()) {
    appStore.showError(t('profile.usernameRequired'))
    return
  }

  loading.value = true
  const submittedUsername = username.value
  try {
    const updatedUser = await userAPI.updateProfile({
      username: submittedUsername
    })
    if (username.value === submittedUsername) username.value = updatedUser.username
    savedUsername = updatedUser.username
    authStore.user = updatedUser
    appStore.showSuccess(t('profile.updateSuccess'))
  } catch (error: unknown) {
    appStore.showError(extractApiErrorMessage(error, t('profile.updateFailed')))
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.profile-info { display: flex; flex-direction: column; gap: 16px; min-width: 0; }
.profile-hero { display: flex; flex-direction: column; gap: 22px; }
.profile-hero__top { display: flex; flex-direction: column; gap: 16px; min-width: 0; }
.profile-hero__avatar {
  display: grid; place-items: center; flex: none;
  width: 68px; height: 68px; border-radius: var(--st-r-lg);
  background: var(--st-brand); color: var(--st-brand-ink);
  font-family: var(--st-font-display); font-size: 1.5rem; font-weight: 600;
  overflow: hidden;
}
.profile-hero__avatar img { width: 100%; height: 100%; object-fit: cover; }
.profile-hero__copy { min-width: 0; }
.profile-hero__name { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; min-width: 0; }
.profile-hero__name .st-display-3 { min-width: 0; overflow-wrap: anywhere; }
.profile-hero__email { margin-top: 8px; overflow-wrap: anywhere; }
.profile-hero__hints { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
.profile-hero__metrics { display: grid; grid-template-columns: 1fr; gap: 14px; margin: 0; padding-top: 18px; border-top: 1px solid var(--st-line); }
.profile-hero__metrics dt { font-size: 0.72rem; letter-spacing: 0.06em; text-transform: uppercase; color: var(--st-ink-3); }
.profile-hero__metrics dd { margin: 4px 0 0; font-family: var(--st-font-display); font-size: 1.15rem; font-weight: 600; letter-spacing: -0.02em; color: var(--st-ink); }
.profile-block__head { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
.profile-basics { display: grid; grid-template-columns: 1fr; gap: 14px; }
.profile-basics__cell { min-width: 0; padding: 16px; border: 1px solid var(--st-line); border-radius: var(--st-r-md); background: var(--st-bg-soft); }
.profile-source { grid-template-columns: auto minmax(0, 1fr); }
.profile-source__icon { display: grid; place-items: center; width: 30px; height: 30px; border-radius: 9px; background: var(--st-bg-sink); color: var(--st-ink-3); }
.profile-source__text { font-size: 0.86rem; color: var(--st-ink-2); overflow-wrap: anywhere; }
.profile-panel { min-width: 0; }
.profile-embed { display: flex; flex-direction: column; gap: 12px; min-width: 0; }
.profile-form { display: flex; flex-direction: column; gap: 14px; min-width: 0; }
.profile-form__actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 8px; padding-top: 4px; }
.profile-hint { margin-top: 6px; font-size: 0.75rem; line-height: 1.6; color: var(--st-ink-3); }
.profile-avatar { display: flex; flex-direction: column; gap: 16px; min-width: 0; }
.profile-avatar__pic {
  display: grid; place-items: center; flex: none;
  width: 84px; height: 84px; border-radius: var(--st-r-lg);
  background: var(--st-brand); color: var(--st-brand-ink);
  font-family: var(--st-font-display); font-size: 1.9rem; font-weight: 600;
  overflow: hidden;
}
.profile-avatar__pic--sm { width: 60px; height: 60px; font-size: 1.35rem; border-radius: var(--st-r-md); }
.profile-avatar__pic img { width: 100%; height: 100%; object-fit: cover; }
.profile-avatar__body { display: flex; flex-direction: column; gap: 8px; min-width: 0; }
.profile-avatar__hint { font-size: 0.84rem; }
.profile-avatar__actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px; }
.profile-avatar__upload { position: relative; cursor: pointer; }
.profile-avatar__file { position: absolute; width: 1px; height: 1px; opacity: 0; overflow: hidden; }
@media (min-width: 640px) {
  .profile-hero__top { flex-direction: row; align-items: flex-start; }
  .profile-hero__metrics { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .profile-avatar { flex-direction: row; align-items: flex-start; }
}
@media (min-width: 900px) {
  .profile-basics { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

/* ---- 第二轮：字段行式排布，避免一屏输入框 ---- */
.profile-form { gap: 12px; }
@media (min-width: 560px) {
  .profile-form > div { display: grid; grid-template-columns: 148px minmax(0, 1fr); align-items: center; gap: 6px 14px; }
  .profile-form > div > .st-label { margin-bottom: 0; }
  .profile-form > div > .profile-hint { grid-column: 2; margin-top: 0; }
  .profile-form__actions { grid-column: 1 / -1; margin-top: 4px; }
}
</style>
