<template>
  <UserShell>
    <section class="st-section profile-page">
      <div class="st-shell">
        <header class="profile-head">
          <p class="st-eyebrow st-reveal">{{ c('usercore.profile.eyebrow') }}</p>
          <h1 class="st-display-2 st-reveal" style="--i: 1">{{ c('usercore.profile.title') }}</h1>
          <p class="st-lede st-reveal" style="--i: 2">{{ c('usercore.profile.lede') }}</p>
        </header>

        <div class="profile-sections" data-testid="profile-shell">
          <!-- 01 身份 -->
          <section class="profile-section st-reveal" style="--i: 3">
            <header class="profile-section__head">
              <span class="profile-section__index st-num" aria-hidden="true">01</span>
              <div class="profile-section__intro">
                <h2 class="st-display-3">{{ c('usercore.profile.identityTitle') }}</h2>
                <p class="st-body">{{ c('usercore.profile.identityLede') }}</p>
              </div>
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

          <!-- 02 安全 -->
          <section class="profile-section st-reveal" style="--i: 4">
            <header class="profile-section__head">
              <span class="profile-section__index st-num" aria-hidden="true">02</span>
              <div class="profile-section__intro">
                <h2 class="st-display-3">{{ c('usercore.profile.securityTitle') }}</h2>
                <p class="st-body">{{ c('usercore.profile.securityLede') }}</p>
              </div>
            </header>
            <div class="profile-security">
              <ProfilePasswordForm class="profile-security__password" />
              <ProfileTotpCard />
              <ProfilePasskeyCard :enabled="passkeyEnabled" />
            </div>
          </section>

          <!-- 03 余额提醒 -->
          <section v-if="user && balanceLowNotifyEnabled" class="profile-section st-reveal" style="--i: 5">
            <header class="profile-section__head">
              <span class="profile-section__index st-num" aria-hidden="true">03</span>
              <div class="profile-section__intro">
                <h2 class="st-display-3">{{ c('usercore.profile.billingTitle') }}</h2>
                <p class="st-body">{{ c('usercore.profile.billingLede') }}</p>
              </div>
            </header>
            <ProfileBalanceNotifyCard
              :enabled="user.balance_notify_enabled ?? true"
              :threshold="user.balance_notify_threshold"
              :extra-emails="user.balance_notify_extra_emails ?? []"
              :system-default-threshold="systemDefaultThreshold"
              :user-email="user.email"
            />
          </section>

          <!-- 联系客服：沉到页尾，作为兜底通道 -->
          <footer v-if="contactInfo" class="profile-contact st-reveal">
            <span class="profile-contact__icon"><Icon name="chat" size="sm" /></span>
            <div class="profile-contact__copy">
              <p class="profile-contact__label">{{ t('common.contactSupport') }}</p>
              <p class="profile-contact__value">{{ contactInfo }}</p>
            </div>
          </footer>
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
.profile-head { margin-bottom: clamp(26px, 3.4vw, 40px); }
.profile-head .st-display-2 { margin-top: 14px; }
.profile-head .st-lede { margin-top: 14px; }

/* ---- 段落节奏：细线 + 序号，靠排版分层，不再堆卡片 ---- */
.profile-sections { display: flex; flex-direction: column; gap: clamp(30px, 4vw, 52px); min-width: 0; }
.profile-section { display: flex; flex-direction: column; gap: clamp(14px, 1.8vw, 20px); min-width: 0; padding-top: clamp(22px, 2.6vw, 32px); border-top: 1px solid var(--st-line); }
.profile-section:first-child { padding-top: 0; border-top: 0; }
.profile-section__head { display: flex; align-items: baseline; gap: 14px; }
.profile-section__index {
  flex: none;
  font-family: var(--st-font-display);
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  color: var(--st-brand-text);
}
.profile-section__intro { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.profile-section__intro .st-body { font-size: 0.86rem; max-width: 62ch; }

/* ---- 安全：左右两列，密码表单纵向占两格，避免右下留空 ---- */
.profile-security { display: grid; grid-template-columns: 1fr; gap: clamp(14px, 1.8vw, 20px); align-items: start; }
@media (min-width: 960px) {
  .profile-security { grid-template-columns: minmax(0, 1.08fr) minmax(0, 1fr); }
  .profile-security__password { grid-row: span 2; }
}

/* ---- 页尾客服 ---- */
.profile-contact {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding-top: clamp(18px, 2.2vw, 26px);
  border-top: 1px solid var(--st-line);
  min-width: 0;
}
.profile-contact__icon {
  display: grid;
  place-items: center;
  flex: none;
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: var(--st-brand-soft);
  color: var(--st-brand-text);
}
.profile-contact__copy { min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.profile-contact__label { font-size: 0.72rem; letter-spacing: 0.06em; text-transform: uppercase; color: var(--st-ink-3); }
.profile-contact__value { font-size: 0.9rem; color: var(--st-ink); overflow-wrap: anywhere; }

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
