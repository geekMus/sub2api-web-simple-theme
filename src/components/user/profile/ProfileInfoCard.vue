<template>
  <div class="profile-info">
    <section data-testid="profile-overview-hero" class="st-card st-card--pad profile-hero">
      <div class="profile-hero__top">
        <div class="profile-hero__avatar">
          <img v-if="avatarUrl" :src="avatarUrl" :alt="displayName" />
          <span v-else>{{ avatarInitial }}</span>
        </div>
        <div class="profile-hero__copy">
          <div class="profile-hero__name">
            <h2 class="st-display-3">{{ displayName }}</h2>
            <span class="st-pill" :class="user?.role === 'admin' ? 'st-pill--accent' : ''">
              {{ user?.role === 'admin' ? t('profile.administrator') : t('profile.user') }}
            </span>
            <span class="st-pill" :class="user?.status === 'active' ? 'st-pill--ok' : 'st-pill--danger'">
              {{ user?.status === 'active' ? t('common.active') : t('common.disabled') }}
            </span>
          </div>
          <p v-if="primaryEmailDisplay" class="st-body profile-hero__email">{{ primaryEmailDisplay }}</p>
          <div v-if="sourceHints.length" class="profile-hero__hints">
            <span v-for="hint in sourceHints" :key="hint.key" class="st-pill">
              <Icon name="link" size="sm" />
              {{ hint.text }}
            </span>
          </div>
        </div>
      </div>

      <dl class="profile-hero__metrics">
        <div data-testid="profile-overview-metric-balance">
          <dt>{{ t('profile.accountBalance') }}</dt>
          <dd class="st-num">{{ formatCurrency(user?.balance || 0) }}</dd>
        </div>
        <div data-testid="profile-overview-metric-concurrency">
          <dt>{{ t('profile.concurrencyLimit') }}</dt>
          <dd class="st-num">{{ user?.concurrency || 0 }}</dd>
        </div>
        <div data-testid="profile-overview-metric-member-since">
          <dt>{{ t('profile.memberSince') }}</dt>
          <dd>{{ memberSinceLabel }}</dd>
        </div>
      </dl>
    </section>

    <section data-testid="profile-basics-panel" class="st-card st-card--pad">
      <header class="profile-block__head">
        <h3 class="st-display-3">{{ t('profile.basicsTitle') }}</h3>
        <p class="st-body">{{ t('profile.basicsDescription') }}</p>
      </header>
      <div class="profile-basics">
        <div class="profile-basics__cell">
          <ProfileAvatarCard :user="user" embedded />
        </div>
        <div class="profile-basics__cell">
          <ProfileEditForm :initial-username="user?.username || ''" embedded />
        </div>
      </div>
    </section>

    <section data-testid="profile-auth-bindings-panel" class="st-card st-card--pad">
      <ProfileIdentityBindingsSection
        :user="user"
        :linuxdo-enabled="linuxdoEnabled"
        :dingtalk-enabled="dingtalkEnabled"
        :oidc-enabled="oidcEnabled"
        :oidc-provider-name="oidcProviderName"
        :wechat-enabled="wechatEnabled"
        :wechat-open-enabled="wechatOpenEnabled"
        :wechat-mp-enabled="wechatMpEnabled"
        embedded
        compact
      />
    </section>

    <section v-if="sourceHints.length" class="st-card st-card--pad">
      <header class="profile-block__head">
        <h3 class="st-display-3">{{ t('profile.linkedProfileSources') }}</h3>
        <p class="st-body">{{ t('profile.linkedProfileSourcesDescription') }}</p>
      </header>
      <div class="st-list">
        <div v-for="hint in sourceHints" :key="hint.key" class="st-row profile-source">
          <span class="profile-source__icon"><Icon name="link" size="sm" /></span>
          <span class="profile-source__text">{{ hint.text }}</span>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Icon from '@/components/icons/Icon.vue'
import ProfileAvatarCard from '@/components/user/profile/ProfileAvatarCard.vue'
import ProfileEditForm from '@/components/user/profile/ProfileEditForm.vue'
import ProfileIdentityBindingsSection from '@/components/user/profile/ProfileIdentityBindingsSection.vue'
import type { User, UserAuthBindingStatus, UserAuthProvider, UserProfileSourceContext } from '@/types'

const props = withDefaults(defineProps<{
  user: User | null
  linuxdoEnabled?: boolean
  dingtalkEnabled?: boolean
  oidcEnabled?: boolean
  oidcProviderName?: string
  wechatEnabled?: boolean
  wechatOpenEnabled?: boolean
  wechatMpEnabled?: boolean
}>(), {
  linuxdoEnabled: false,
  dingtalkEnabled: false,
  oidcEnabled: false,
  oidcProviderName: 'OIDC',
  wechatEnabled: false,
  wechatOpenEnabled: undefined,
  wechatMpEnabled: undefined,
})

const { t } = useI18n()

function normalizeBindingStatus(binding: boolean | UserAuthBindingStatus | undefined): boolean | null {
  if (typeof binding === 'boolean') {
    return binding
  }
  if (!binding) {
    return null
  }
  if (typeof binding.bound === 'boolean') {
    return binding.bound
  }
  return Boolean(binding.provider_subject || binding.issuer || binding.provider_key)
}

function isEmailBound(user: User | null | undefined): boolean {
  if (typeof user?.email_bound === 'boolean') {
    return user.email_bound
  }

  const nested = user?.auth_bindings?.email ?? user?.identity_bindings?.email
  const normalized = normalizeBindingStatus(nested)
  return normalized ?? false
}

const avatarUrl = computed(() => props.user?.avatar_url?.trim() || '')
const displayName = computed(() => props.user?.username?.trim() || props.user?.email?.trim() || t('profile.user'))
const primaryEmailDisplay = computed(() => {
  const email = props.user?.email?.trim() || ''
  if (!email) {
    return ''
  }
  if (email.endsWith('.invalid') && !isEmailBound(props.user)) {
    return ''
  }
  return email
})
const avatarInitial = computed(() => displayName.value.charAt(0).toUpperCase() || 'U')
const memberSinceLabel = computed(() => {
  const raw = props.user?.created_at?.trim()
  if (!raw) {
    return '-'
  }

  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) {
    return '-'
  }

  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
  }).format(date)
})

const providerLabels = computed<Record<UserAuthProvider, string>>(() => ({
  email: t('profile.authBindings.providers.email'),
  linuxdo: t('profile.authBindings.providers.linuxdo'),
  dingtalk: t('profile.authBindings.providers.dingtalk'),
  oidc: t('profile.authBindings.providers.oidc', { providerName: props.oidcProviderName }),
  wechat: t('profile.authBindings.providers.wechat'),
  github: 'GitHub',
  google: 'Google'
}))

function formatCurrency(value: number): string {
  return `$${value.toFixed(2)}`
}

function normalizeProvider(value: string): UserAuthProvider | null {
  const normalized = value.trim().toLowerCase()
  if (
    normalized === 'email' ||
    normalized === 'linuxdo' ||
    normalized === 'dingtalk' ||
    normalized === 'wechat' ||
    normalized === 'github' ||
    normalized === 'google'
  ) {
    return normalized
  }
  if (normalized === 'oidc' || normalized.startsWith('oidc:') || normalized.startsWith('oidc/')) {
    return 'oidc'
  }
  return null
}

function readObjectString(source: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = source[key]
    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }
  return ''
}

function resolveThirdPartySource(
  rawSource: string | UserProfileSourceContext | null | undefined
): { provider: UserAuthProvider; label: string } | null {
  if (!rawSource) {
    return null
  }

  if (typeof rawSource === 'string') {
    const provider = normalizeProvider(rawSource)
    if (!provider || provider === 'email') {
      return null
    }
    return {
      provider,
      label: providerLabels.value[provider]
    }
  }

  const sourceRecord = rawSource as Record<string, unknown>
  const provider = normalizeProvider(
    readObjectString(sourceRecord, 'provider', 'source', 'provider_type', 'auth_provider')
  )
  if (!provider || provider === 'email') {
    return null
  }

  const explicitLabel = readObjectString(
    sourceRecord,
    'provider_label',
    'label',
    'provider_name',
    'providerName'
  )

  return {
    provider,
    label: explicitLabel || providerLabels.value[provider]
  }
}

const sourceHints = computed(() => {
  const currentUser = props.user
  if (!currentUser) {
    return []
  }

  const hints: Array<{ key: string; text: string }> = []
  const avatarSource = resolveThirdPartySource(
    currentUser.profile_sources?.avatar ?? currentUser.avatar_source
  )
  const usernameSource = resolveThirdPartySource(
    currentUser.profile_sources?.username ??
      currentUser.profile_sources?.display_name ??
      currentUser.profile_sources?.nickname ??
      currentUser.display_name_source ??
      currentUser.username_source ??
      currentUser.nickname_source
  )

  if (avatarSource) {
    hints.push({
      key: 'avatar',
      text: t('profile.authBindings.source.avatar', { providerName: avatarSource.label })
    })
  }

  if (usernameSource) {
    hints.push({
      key: 'username',
      text: t('profile.authBindings.source.username', { providerName: usernameSource.label })
    })
  }

  return hints
})
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
