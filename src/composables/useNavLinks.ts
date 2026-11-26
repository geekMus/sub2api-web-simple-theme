import { computed } from 'vue'
import { useAppStore, useAuthStore } from '@/stores'
import { useSimpleCopy } from '@/composables/useSimpleCopy'

/** 主导航与账户菜单：导航栏和落地页顶部栏共用 */
export function useNavLinks() {
  const appStore = useAppStore()
  const authStore = useAuthStore()
  const { c } = useSimpleCopy()

  const links = computed(() => {
    const settings = appStore.cachedPublicSettings
    const items = [
      { to: '/dashboard', label: c('nav.overview') },
      { to: '/keys', label: c('nav.passes') },
      { to: '/usage', label: c('nav.usage') },
    ]
    if (settings?.subscription_enabled !== false) items.push({ to: '/subscriptions', label: c('nav.plans') })
    if (settings?.model_plaza_enabled) items.push({ to: '/model-plaza', label: c('nav.models') })
    if (settings?.available_channels_enabled) items.push({ to: '/available-channels', label: c('nav.channels') })
    return items
  })

  const accountMenu = computed(() => {
    const items = [{ to: '/profile', label: c('account.profile') }]
    if (appStore.cachedPublicSettings?.affiliate_enabled) items.push({ to: '/affiliate', label: c('account.affiliate') })
    if (appStore.cachedPublicSettings?.mcp_enabled) items.push({ to: '/mcp', label: c('account.mcp') })
    if (authStore.isAdmin) items.push({ to: '/admin/dashboard', label: c('account.admin') })
    return items
  })

  return { links, accountMenu }
}
