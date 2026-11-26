<template>
  <div :class="props.embedded ? 'profile-embed' : 'st-card st-card--pad profile-panel'">
    <header v-if="!props.embedded" class="profile-block__head">
      <h2 class="st-display-3">{{ t('profile.avatar.title') }}</h2>
      <p class="st-body">{{ t('profile.avatar.description') }}</p>
    </header>
    <div class="profile-avatar">
      <div class="profile-avatar__pic" :class="{ 'profile-avatar__pic--sm': props.embedded }">
        <img v-if="avatarPreviewUrl" data-testid="profile-avatar-preview" :src="avatarPreviewUrl" :alt="displayName" />
        <span v-else>{{ avatarInitial }}</span>
      </div>
      <div class="profile-avatar__body">
        <p class="st-display-4">{{ props.embedded ? t('profile.avatar.title') : displayName }}</p>
        <p class="st-body profile-avatar__hint">{{ t('profile.avatar.uploadHint') }}</p>
        <div class="profile-avatar__actions">
          <label class="st-btn st-btn--quiet st-btn--sm profile-avatar__upload">
            <input
              data-testid="profile-avatar-file-input"
              type="file"
              accept="image/*"
              class="profile-avatar__file"
              @change="handleAvatarFileChange"
            >
            {{ t('profile.avatar.uploadAction') }}
          </label>
          <button
            data-testid="profile-avatar-save"
            type="button"
            class="st-btn st-btn--primary st-btn--sm"
            :disabled="avatarSaving || !avatarDraft"
            @click="handleAvatarSave"
          >
            {{ t('common.save') }}
          </button>
          <button
            data-testid="profile-avatar-delete"
            type="button"
            class="st-btn st-btn--ghost st-btn--sm"
            :disabled="avatarSaving"
            @click="handleAvatarDelete"
          >
            {{ t('common.delete') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { userAPI } from '@/api'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import type { User } from '@/types'
import { extractApiErrorMessage } from '@/utils/apiError'

const props = withDefaults(defineProps<{
  user: User | null
  embedded?: boolean
}>(), {
  embedded: false,
})

const { t } = useI18n()
const authStore = useAuthStore()
const appStore = useAppStore()

const targetAvatarUploadBytes = 20 * 1024
const avatarScaleSteps = [1, 0.92, 0.84, 0.76, 0.68, 0.6, 0.52, 0.44, 0.36]
const avatarQualitySteps = [0.92, 0.84, 0.76, 0.68, 0.6, 0.52, 0.44, 0.36]
const avatarDraft = ref('')
const avatarSaving = ref(false)

const displayName = computed(() => props.user?.username?.trim() || props.user?.email?.trim() || t('profile.user'))
const avatarInitial = computed(() => displayName.value.charAt(0).toUpperCase() || 'U')
const avatarPreviewUrl = computed(() => avatarDraft.value.trim() || props.user?.avatar_url?.trim() || '')

watch(
  () => props.user?.avatar_url,
  () => {
    avatarDraft.value = ''
  }
)

function normalizeUploadedAvatar(value: string): string | null {
  const normalized = value.trim()
  if (!normalized) {
    return null
  }

  if (!/^data:image\/[a-zA-Z0-9.+-]+;base64,/i.test(normalized)) {
    appStore.showError(t('profile.avatar.uploadRequired'))
    return null
  }

  return normalized
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
    reader.onerror = () => reject(reader.error ?? new Error('avatar_read_failed'))
    reader.readAsDataURL(file)
  })
}

function loadImage(dataURL: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(t('profile.avatar.readFailed')))
    image.src = dataURL
  })
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error(t('profile.avatar.compressFailed')))
        return
      }
      resolve(blob)
    }, type, quality)
  })
}

async function compressAvatarFile(file: File): Promise<File> {
  const sourceDataURL = await readFileAsDataURL(file)
  const image = await loadImage(sourceDataURL)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error(t('profile.avatar.compressFailed'))
  }

  for (const scale of avatarScaleSteps) {
    const width = Math.max(1, Math.round(image.naturalWidth * scale))
    const height = Math.max(1, Math.round(image.naturalHeight * scale))
    canvas.width = width
    canvas.height = height
    ctx.clearRect(0, 0, width, height)
    ctx.drawImage(image, 0, 0, width, height)

    for (const quality of avatarQualitySteps) {
      const blob = await canvasToBlob(canvas, 'image/webp', quality)
      if (blob.size <= targetAvatarUploadBytes) {
        const fileName = file.name.replace(/\.[^.]+$/, '') || 'avatar'
        return new File([blob], `${fileName}.webp`, { type: 'image/webp' })
      }
    }
  }

  throw new Error(t('profile.avatar.compressTooLarge'))
}

async function prepareAvatarUpload(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) {
    throw new Error(t('profile.avatar.invalidType'))
  }
  if (file.type === 'image/gif') {
    if (file.size > targetAvatarUploadBytes) {
      throw new Error(t('profile.avatar.gifTooLarge'))
    }
    return file
  }
  if (file.size <= targetAvatarUploadBytes) {
    return file
  }
  return compressAvatarFile(file)
}

async function handleAvatarFileChange(event: Event) {
  const input = event.target as HTMLInputElement | null
  const file = input?.files?.[0]
  if (input) {
    input.value = ''
  }
  if (!file) {
    return
  }

  try {
    const preparedFile = await prepareAvatarUpload(file)
    const dataURL = await readFileAsDataURL(preparedFile)
    const normalized = normalizeUploadedAvatar(dataURL)
    if (!normalized) {
      return
    }
    avatarDraft.value = normalized
  } catch (error: unknown) {
    appStore.showError(extractApiErrorMessage(error, t('common.error')))
  }
}

async function handleAvatarSave() {
  const normalized = normalizeUploadedAvatar(avatarDraft.value)
  if (!normalized) {
    return
  }

  avatarSaving.value = true
  try {
    const updated = await userAPI.updateProfile({ avatar_url: normalized })
    authStore.user = updated
    avatarDraft.value = updated.avatar_url?.trim() || ''
    appStore.showSuccess(t('profile.avatar.saveSuccess'))
  } catch (error: unknown) {
    appStore.showError(extractApiErrorMessage(error, t('common.error')))
  } finally {
    avatarSaving.value = false
  }
}

async function handleAvatarDelete() {
  if (avatarSaving.value) {
    return
  }
  if (!avatarDraft.value.trim() && !props.user?.avatar_url?.trim()) {
    appStore.showError(t('profile.avatar.emptyDeleteHint'))
    return
  }

  avatarSaving.value = true
  try {
    const updated = await userAPI.updateProfile({ avatar_url: '' })
    authStore.user = updated
    avatarDraft.value = ''
    appStore.showSuccess(t('profile.avatar.deleteSuccess'))
  } catch (error: unknown) {
    appStore.showError(extractApiErrorMessage(error, t('common.error')))
  } finally {
    avatarSaving.value = false
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
</style>
