<template>
  <UserShell>
    <section class="st-section profile-sec">
      <div class="st-shell">
        <header class="profile-head">
          <p class="st-eyebrow st-reveal">{{ c('profile.eyebrow') }}</p>
          <h1 class="st-display-2 st-reveal" style="--i: 1">{{ c('profile.title') }}</h1>
          <p class="st-lede st-reveal" style="--i: 2">{{ c('profile.lede') }}</p>
        </header>

        <!-- 联系方式 -->
        <div v-if="contactInfo" class="st-card st-card--pad profile-contact st-reveal" style="--i: 4">
          <span class="profile-contact__icon"><Icon name="chat" size="md" /></span>
          <div>
            <p class="st-row__title">{{ t('common.contactSupport') }}</p>
            <p class="st-body">{{ contactInfo }}</p>
          </div>
        </div>

        <!-- 分区卡片 -->
        <div class="profile-grid" data-testid="profile-shell">
          <div class="st-reveal" style="--i: 5"><ProfileInfoCard
            :user="user"
            :linuxdo-enabled="linuxdoOAuthEnabled"
            :dingtalk-enabled="dingtalkOAuthEnabled"
            :oidc-enabled="oidcOAuthEnabled"
            :oidc-provider-name="oidcOAuthProviderName"
            :wechat-enabled="wechatOAuthEnabled"
            :wechat-open-enabled="wechatOAuthOpenEnabled"
            :wechat-mp-enabled="wechatOAuthMPEnabled"
          /></div>
          <div class="st-reveal" style="--i: 6"><ProfilePasswordForm /></div>
          <div class="st-reveal" style="--i: 7"><ProfileTotpCard /></div>
          <div class="st-reveal" style="--i: 8"><ProfilePasskeyCard :enabled="passkeyEnabled" /></div>
          <div v-if="user && balanceLowNotifyEnabled" class="st-reveal" style="--i: 9">
            <ProfileBalanceNotifyCard
              :enabled="user.balance_notify_enabled ?? true"
              :threshold="user.balance_notify_threshold"
              :extra-emails="user.balance_notify_extra_emails ?? []"
              :system-default-threshold="systemDefaultThreshold"
              :user-email="user.email"
            />
          </div>
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
.profile-sec { padding-top: clamp(32px, 4vw, 56px); }
.profile-head { margin-bottom: clamp(24px, 3vw, 40px); }
.profile-head .st-display-2 { margin-top: 14px; }
.profile-head .st-lede { margin-top: 14px; }

.profile-contact { display: flex; align-items: center; gap: 14px; margin-bottom: 18px; }
.profile-contact__icon { display: grid; place-items: center; width: 40px; height: 40px; border-radius: 12px; background: var(--st-accent-soft); color: var(--st-accent); flex-shrink: 0; }

.profile-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
@media (min-width: 900px) {
  .profile-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
</style>
