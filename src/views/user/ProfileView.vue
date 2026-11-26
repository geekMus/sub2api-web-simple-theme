<template>
  <UserShell>
    <section class="st-section profile-page">
      <div class="st-shell">
        <header class="profile-head">
          <p class="st-eyebrow st-reveal">{{ c('usercore.profile.eyebrow') }}</p>
          <h1 class="st-display-2 st-reveal" style="--i: 1">{{ c('usercore.profile.title') }}</h1>
          <p class="st-lede st-reveal" style="--i: 2">{{ c('usercore.profile.lede') }}</p>
        </header>

        <div v-if="contactInfo" class="st-card st-card--pad profile-contact st-reveal" style="--i: 3">
          <span class="profile-contact__icon"><Icon name="chat" size="md" /></span>
          <div class="profile-contact__copy">
            <p class="st-row__title">{{ t('common.contactSupport') }}</p>
            <p class="st-body">{{ contactInfo }}</p>
          </div>
        </div>

        <div class="profile-sections" data-testid="profile-shell">
          <!-- 身份 -->
          <section class="profile-section st-reveal" style="--i: 4">
            <header class="profile-section__head">
              <h2 class="st-display-3">{{ c('usercore.profile.identityTitle') }}</h2>
              <p class="st-body">{{ c('usercore.profile.identityLede') }}</p>
            </header>
            <ProfileInfoCard
              :user="user"
              :linuxdo-enabled="linuxdoOAuthEnabled"
              :dingtalk-enabled="dingtalkOAuthEnabled"
              :oidc-enabled="oidcOAuthEnabled"
              :oidc-provider-name="oidcOAuthProviderName"
              :wechat-enabled="wechatOAuthEnabled"
              :wechat-open-enabled="wechatOAuthOpenEnabled"
              :wechat-mp-enabled="wechatOAuthMPEnabled"
            />
          </section>

          <!-- 安全 -->
          <section class="profile-section st-reveal" style="--i: 5">
            <header class="profile-section__head">
              <h2 class="st-display-3">{{ c('usercore.profile.securityTitle') }}</h2>
              <p class="st-body">{{ c('usercore.profile.securityLede') }}</p>
            </header>
            <div class="profile-grid">
              <ProfilePasswordForm />
              <ProfileTotpCard />
              <ProfilePasskeyCard :enabled="passkeyEnabled" />
            </div>
          </section>

          <!-- 余额与提醒 -->
          <section v-if="user && balanceLowNotifyEnabled" class="profile-section st-reveal" style="--i: 6">
            <header class="profile-section__head">
              <h2 class="st-display-3">{{ c('usercore.profile.billingTitle') }}</h2>
              <p class="st-body">{{ c('usercore.profile.billingLede') }}</p>
            </header>
            <ProfileBalanceNotifyCard
              :enabled="user.balance_notify_enabled ?? true"
              :threshold="user.balance_notify_threshold"
              :extra-emails="user.balance_notify_extra_emails ?? []"
              :system-default-threshold="systemDefaultThreshold"
              :user-email="user.email"
            />
          </section>
        </div>
      </div>
    </section>
  </UserShell>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Icon } from '@/components/icons'
import UserShell from '@/components/shell/UserShell.vue'
import { useUserCoreCopy } from '@/composables/copy/userCore'
import ProfileBalanceNotifyCard from '@/components/user/profile/ProfileBalanceNotifyCard.vue'
import ProfileInfoCard from '@/components/user/profile/ProfileInfoCard.vue'
import ProfilePasswordForm from '@/components/user/profile/ProfilePasswordForm.vue'
import ProfileTotpCard from '@/components/user/profile/ProfileTotpCard.vue'
import ProfilePasskeyCard from '@/components/user/profile/ProfilePasskeyCard.vue'
import { isWeChatWebOAuthEnabled } from '@/api/auth'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'


const { t } = useI18n()
const { c } = useUserCoreCopy()
const appStore = useAppStore()
const authStore = useAuthStore()
const user = computed(() => authStore.user)

const contactInfo = ref('')
const balanceLowNotifyEnabled = ref(false)
const systemDefaultThreshold = ref(0)
const linuxdoOAuthEnabled = ref(false)
const dingtalkOAuthEnabled = ref(false)
const wechatOAuthEnabled = ref(false)
const wechatOAuthOpenEnabled = ref<boolean | undefined>(undefined)
const wechatOAuthMPEnabled = ref<boolean | undefined>(undefined)
const oidcOAuthEnabled = ref(false)
const oidcOAuthProviderName = ref('OIDC')
const passkeyEnabled = ref(false)

onMounted(async () => {
  const profileRefresh = authStore.refreshUser().catch((error) => {
    console.error('Failed to refresh profile:', error)
  })

  const settingsLoad = appStore.fetchPublicSettings()
    .then((settings) => {
      if (!settings) {
        return
      }
      contactInfo.value = settings.contact_info || ''
      balanceLowNotifyEnabled.value = settings.balance_low_notify_enabled ?? false
      systemDefaultThreshold.value = settings.balance_low_notify_threshold ?? 0
      linuxdoOAuthEnabled.value = settings.linuxdo_oauth_enabled ?? false
      dingtalkOAuthEnabled.value = settings.dingtalk_oauth_enabled ?? false
      wechatOAuthEnabled.value = isWeChatWebOAuthEnabled(settings)
      wechatOAuthOpenEnabled.value = typeof settings.wechat_oauth_open_enabled === 'boolean'
        ? settings.wechat_oauth_open_enabled
        : undefined
      wechatOAuthMPEnabled.value = typeof settings.wechat_oauth_mp_enabled === 'boolean'
        ? settings.wechat_oauth_mp_enabled
        : undefined
      oidcOAuthEnabled.value = settings.oidc_oauth_enabled ?? false
      oidcOAuthProviderName.value = settings.oidc_oauth_provider_name || 'OIDC'
      passkeyEnabled.value = settings.passkey_enabled === true
    })
    .catch((error) => {
      console.error('Failed to load settings:', error)
    })

  await Promise.all([profileRefresh, settingsLoad])
})
</script>

<style scoped>
.profile-page { padding-top: clamp(32px, 4vw, 56px); }
.profile-head { margin-bottom: clamp(22px, 3vw, 34px); }
.profile-head .st-display-2 { margin-top: 14px; }
.profile-head .st-lede { margin-top: 14px; }

.profile-contact { display: flex; align-items: center; gap: 14px; margin-bottom: clamp(22px, 3vw, 34px); min-width: 0; }
.profile-contact__icon { display: grid; place-items: center; flex: none; width: 40px; height: 40px; border-radius: 12px; background: var(--st-brand-soft); color: var(--st-brand-text); }
.profile-contact__copy { min-width: 0; }
.profile-contact__copy .st-body { overflow-wrap: anywhere; }

.profile-sections { display: flex; flex-direction: column; gap: clamp(26px, 3.4vw, 40px); min-width: 0; }
.profile-section { display: flex; flex-direction: column; gap: 16px; min-width: 0; }
.profile-section__head { display: flex; flex-direction: column; gap: 6px; }
.profile-grid { display: grid; grid-template-columns: 1fr; gap: 16px; align-items: start; }

@media (min-width: 900px) {
  .profile-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

/* ---- 第二轮：区块节奏与卡片浮起 ---- */
.profile-sections { gap: clamp(28px, 4vw, 56px); }
.profile-contact { box-shadow: var(--st-shadow-1); }
.profile-section { gap: clamp(14px, 1.8vw, 20px); }
.profile-grid { gap: clamp(16px, 2vw, 22px); }
:deep(.st-card) { box-shadow: var(--st-shadow-2); }
:deep(.profile-hero) { box-shadow: var(--st-shadow-2); }
@media (max-width: 719px) {
  :deep(.st-btn) { min-height: 44px; }
  :deep(.profile-switch) { min-height: 44px; }
}

/* 禁用态主按钮：保持品牌色 + 半透明，与其他主按钮一致 */
:deep(.st-btn--primary[disabled]),
:deep(.st-btn--primary[aria-disabled="true"]) {
  background: var(--st-brand);
  border-color: var(--st-brand-text);
  color: var(--st-brand-ink);
  opacity: 0.4;
}
</style>
