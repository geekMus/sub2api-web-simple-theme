import { computed } from 'vue'
import { useAppStore } from '@/stores'
import { useSimpleCopy } from '@/composables/useSimpleCopy'

export interface TabBarItem {
  to: string
  label: string
  paths: string[]
  /** 中间那颗放大的圆形按钮 */
  center?: boolean
}

/**
 * 手机端底部导航：左边两个 + 中间放大的「充值」+ 右边两个。
 * 顶部菜单要排除这些入口，否则同一个页面会出现两次。
 */
export function useTabBarNav() {
  const appStore = useAppStore()
  const { c } = useSimpleCopy()

  const items = computed<TabBarItem[]>(() => {
    const s = appStore.cachedPublicSettings

    // 中间：优先充值；没开支付就看套餐；再退到兑换
    let center: TabBarItem
    if (s?.payment_enabled !== false) {
      center = {
        to: '/purchase',
        label: c('nav.recharge'),
        paths: ['M3 7.5h18v9H3z', 'M3 10.5h18', 'M8.5 14.5h3'],
        center: true,
      }
    } else if (s?.subscription_enabled !== false) {
      center = {
        to: '/subscriptions',
        label: c('nav.plans'),
        paths: ['M12 3l2.6 5.6 6.1.8-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6L3.3 9.4l6.1-.8z'],
        center: true,
      }
    } else {
      center = {
        to: '/redeem',
        label: c('account.redeem'),
        paths: ['M4 9h16v11H4z', 'M2 6h20v3H2z', 'M12 6v14'],
        center: true,
      }
    }

    return [
      {
        to: '/dashboard',
        label: c('nav.overview'),
        paths: ['M4 4h6v6H4z', 'M14 4h6v6h-6z', 'M4 14h6v6H4z', 'M14 14h6v6h-6z'],
      },
      {
        to: '/keys',
        label: c('nav.passes'),
        paths: ['M14.5 4.5l5 5-3 3-1.5-1.5', 'M7.5 9.5l-3 3 2 2 3-3', 'M9.5 3.5l3 3', 'M3.5 12.5l3 3'],
      },
      center,
      {
        to: '/usage',
        label: c('nav.usage'),
        paths: ['M4 19V5', 'M4 19h16', 'M8 15l3.5-4 3 2.5L20 8'],
      },
      {
        to: '/profile',
        label: c('nav.account'),
        paths: ['M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M4.5 20a7.5 7.5 0 0 1 15 0'],
      },
    ]
  })

  const paths = computed(() => new Set(items.value.map((item) => item.to)))

  return { items, paths }
}
