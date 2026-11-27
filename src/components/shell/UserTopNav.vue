<template>
  <header v-if="ready" class="nv" :class="{ 'nv--stuck': scrolled }">
    <div class="st-shell nv__in">
      <BrandMark :to="user ? '/dashboard' : '/home'" />

      <nav v-if="user && isAppRoute" class="nv__links" aria-label="primary">
        <router-link v-for="item in links" :key="item.to" :to="item.to" class="nv__link">{{ item.label }}</router-link>
      </nav>

      <div class="nv__right">
        <span class="nv__lang"><LocaleSwitcher /></span>
        <router-link v-if="user" to="/dashboard" class="nv__balance" :title="c('nav.balance')">
          <span class="nv__balance-full">{{ money }}</span>
          <span class="nv__balance-short">{{ moneyShort }}</span>
        </router-link>

        <router-link v-if="!user" to="/login" class="st-btn st-btn--primary st-btn--sm nv__auth">
          {{ c('nav.authEntry') }}
        </router-link>

        <button
          v-if="user"
          ref="avatarRef"
          class="nv__avatar"
          type="button"
          :aria-label="c('nav.account')"
          :aria-expanded="sheetOpen"
          @click="toggleSheet"
        >{{ initial }}</button>

        <button
          ref="burgerRef"
          class="nv__burger"
          :class="{ 'nv__burger--guest': !user }"
          type="button"
          :aria-label="c('nav.menu')"
          :aria-expanded="sheetOpen"
          @click="toggleSheet"
        >
          <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6">
            <path v-if="!sheetOpen" d="M3.5 6h13M3.5 10h13M3.5 14h13" stroke-linecap="round" />
            <path v-else d="M5.5 5.5l9 9M14.5 5.5l-9 9" stroke-linecap="round" />
          </svg>
        </button>
      </div>
    </div>

    <transition name="sheet">
      <div v-if="sheetOpen" ref="sheetRef" class="nv__sheet" role="menu" @click.stop>
        <div v-if="user" class="nv__sheet-account">
          <span class="nv__sheet-avatar" aria-hidden="true">{{ initial }}</span>
          <span class="nv__sheet-who">
            <span class="nv__sheet-name">{{ user.username || user.email }}</span>
            <span class="nv__sheet-mail">{{ user.email }}</span>
          </span>
        </div>

        <div class="nv__sheet-body">
          <div class="nv__sheet-section">
            <span class="nv__sheet-label">{{ c('nav.theme') }}</span>
            <ThemeTabs :label="c('nav.theme')" />
          </div>

          <div class="nv__sheet-section">
            <span class="nv__sheet-label">{{ c('nav.language') }}</span>
            <LocaleSwitcher />
          </div>

          <!-- 只列底部 Tab 之外的页面，避免同一个入口出现两次 -->
          <div v-if="user && sheetPages.length && !isDesktop" class="nv__sheet-section nv__sheet-section--links">
            <span class="nv__sheet-label">{{ c('nav.pages') }}</span>
            <router-link
              v-for="item in sheetPages"
              :key="item.to"
              :to="item.to"
              class="nv__sheet-item"
              @click="sheetOpen = false"
            >
              {{ item.label }}
            </router-link>
          </div>

          <div v-if="user && sheetAccount.length" class="nv__sheet-section nv__sheet-section--links">
            <span class="nv__sheet-label">{{ c('nav.account') }}</span>
            <router-link
              v-for="item in sheetAccount"
              :key="item.to"
              :to="item.to"
              class="nv__sheet-item"
              @click="sheetOpen = false"
            >
              {{ item.label }}
            </router-link>
          </div>

          <div v-if="!user" class="nv__sheet-section nv__sheet-section--links">
            <router-link to="/login" class="nv__sheet-item" @click="sheetOpen = false">{{ c('nav.login') }}</router-link>
            <router-link to="/register" class="nv__sheet-item" @click="sheetOpen = false">{{ c('nav.signup') }}</router-link>
          </div>
        </div>

        <div v-if="user" class="nv__sheet-foot">
          <button class="nv__sheet-item nv__sheet-item--danger" type="button" @click="signOut">{{ c('account.logout') }}</button>
        </div>
      </div>
    </transition>
  </header>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore, useAuthStore } from '@/stores'
import BrandMark from './BrandMark.vue'
import ThemeTabs from './ThemeTabs.vue'
import LocaleSwitcher from '@/components/common/LocaleSwitcher.vue'
import { useSimpleCopy } from '@/composables/useSimpleCopy'
import { useNavLinks } from '@/composables/useNavLinks'
import { useTabBarNav } from '@/composables/useTabBarNav'
import { formatCurrency } from '@/utils/format'

let router: ReturnType<typeof useRouter> | null = null
let route: ReturnType<typeof useRoute> | null = null
let authStore: ReturnType<typeof useAuthStore> | null = null
let appStore: ReturnType<typeof useAppStore> | null = null
let navLinks: ReturnType<typeof useNavLinks> | null = null
let tabNav: ReturnType<typeof useTabBarNav> | null = null
try {
  router = useRouter()
  route = useRoute()
  authStore = useAuthStore()
  appStore = useAppStore()
  navLinks = useNavLinks()
  tabNav = useTabBarNav()
} catch {
  router = null
}
const ready = !!authStore && !!appStore
const { c } = useSimpleCopy()
const isAppRoute = computed(() => route?.meta?.requiresAuth === true)
const links = computed(() => navLinks?.links.value ?? [])
const accountMenu = computed(() => navLinks?.accountMenu.value ?? [{ to: '/profile', label: c('account.profile') }])
const tabPaths = computed(() => tabNav?.paths.value ?? new Set<string>())

/** 抽屉里只放底部 Tab 没有的入口，避免重复 */
const sheetPages = computed(() => links.value.filter((item) => !tabPaths.value.has(item.to)))
const sheetAccount = computed(() => accountMenu.value.filter((item) => !tabPaths.value.has(item.to)))

const user = computed(() => authStore?.user ?? null)
const initial = computed(() => String(user.value?.username || user.value?.email || '?').trim().charAt(0).toUpperCase())
const money = computed(() => formatCurrency(user.value?.balance ?? 0))
/** 窄屏余额可能挤掉菜单按钮：整数部分 + 单位，省掉小数 */
const moneyShort = computed(() => {
  const value = Number(user.value?.balance ?? 0)
  return Number.isFinite(value) ? `$${Math.round(value)}` : money.value
})

/** 桌面端主导航已经列出页面，抽屉里就不再重复，只留语言与账户 */
const isDesktop = ref(false)
let mq: MediaQueryList | null = null
function syncDesktop(e?: MediaQueryListEvent) {
  isDesktop.value = e ? e.matches : !!mq?.matches
}

const sheetOpen = ref(false)
const sheetRef = ref<HTMLElement | null>(null)
const burgerRef = ref<HTMLElement | null>(null)
const avatarRef = ref<HTMLElement | null>(null)

function toggleSheet() {
  sheetOpen.value = !sheetOpen.value
}

/**
 * 点击外部关闭。
 * 用 composedPath 而不是 e.target：按钮里的图标会随开关状态被 v-if 替换，
 * 等冒泡到 document 时原始 <path> 已经脱离 DOM，contains(target) 会误判成「点在外面」，
 * 结果就是刚打开就被自己关掉。
 */
function closeSheetOnOutside(e: MouseEvent) {
  if (!sheetOpen.value) return
  const eventPath = typeof e.composedPath === 'function' ? e.composedPath() : []
  const isInside = (el: HTMLElement | null) => {
    if (!el) return false
    if (eventPath.includes(el)) return true
    const target = e.target as Node | null
    return !!target && target.isConnected && el.contains(target)
  }
  if (isInside(sheetRef.value) || isInside(burgerRef.value) || isInside(avatarRef.value)) return
  sheetOpen.value = false
}

function closeSheetOnEsc(e: KeyboardEvent) {
  if (e.key === 'Escape') sheetOpen.value = false
}

// 切换路由后抽屉自动收起
watch(() => route?.fullPath, () => { sheetOpen.value = false })

const scrolled = ref(false)
function onScroll() { scrolled.value = window.scrollY > 8 }

async function signOut() {
  sheetOpen.value = false
  await authStore?.logout()
  router?.push('/login')
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  document.addEventListener('click', closeSheetOnOutside)
  document.addEventListener('keydown', closeSheetOnEsc)
  if (typeof window.matchMedia === 'function') {
    mq = window.matchMedia('(min-width: 1024px)')
    syncDesktop()
    mq.addEventListener('change', syncDesktop)
  }
  onScroll()
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  document.removeEventListener('click', closeSheetOnOutside)
  document.removeEventListener('keydown', closeSheetOnEsc)
  mq?.removeEventListener('change', syncDesktop)
  mq = null
})
</script>

<style scoped>
.nv {
  position: sticky;
  top: 0;
  z-index: 40;
  /* 顶部透明：让首屏渐变直接透上来 */
  background: transparent;
  border-bottom: 1px solid transparent;
  transition: background-color 260ms var(--st-ease), border-color 260ms var(--st-ease),
    backdrop-filter 260ms var(--st-ease);
}
/* 滚动后才出现底色与描边 */
.nv--stuck {
  background: color-mix(in srgb, var(--st-bg) 86%, transparent);
  backdrop-filter: blur(16px) saturate(160%);
  border-bottom-color: var(--st-line);
}

.nv__in { display: flex; align-items: center; gap: 24px; height: 60px; }

.nv__links { display: none; align-items: center; gap: 2px; margin-left: 6px; }
.nv__link { padding: 6px 10px; border-radius: 7px; font-size: 0.85rem; font-weight: 450; color: var(--st-ink-2); text-decoration: none; transition: color var(--st-t) var(--st-ease), background-color var(--st-t) var(--st-ease); }
.nv__link:hover { color: var(--st-ink); background: var(--st-bg-soft); }
.nv__link.router-link-active { color: var(--st-ink); font-weight: 550; background: var(--st-bg-soft); }

.nv__right { display: flex; align-items: center; gap: 6px; margin-left: auto; }
/* 桌面端语言直接放导航栏；手机上收进菜单 */
.nv__lang { display: none; }
.nv__balance { font-size: 0.82rem; font-weight: 550; color: var(--st-ink); text-decoration: none; padding: 5px 9px; border-radius: 6px; font-variant-numeric: tabular-nums; white-space: nowrap; }
.nv__balance:hover { background: var(--st-bg-soft); }
.nv__balance-short { display: none; }

.nv__auth { display: inline-flex; }

/* 桌面端用头像打开同一个菜单，手机上用汉堡 */
.nv__avatar {
  display: none;
  place-items: center;
  width: 30px; height: 30px;
  border-radius: 50%;
  border: 1px solid var(--st-line-2);
  background: var(--st-bg-soft);
  color: var(--st-ink);
  font-family: inherit; font-size: 0.76rem; font-weight: 600;
  cursor: pointer;
  transition: border-color var(--st-t) var(--st-ease), background-color var(--st-t) var(--st-ease);
}
.nv__avatar:hover { border-color: var(--st-ink-3); }
.nv__avatar:focus-visible { outline: 2px solid var(--st-brand); outline-offset: 2px; }

.nv__burger { display: inline-grid; place-items: center; width: 34px; height: 34px; border-radius: 8px; border: 1px solid var(--st-line-2); background: var(--st-bg-soft); color: var(--st-ink-2); cursor: pointer; transition: color var(--st-t) var(--st-ease), background-color var(--st-t) var(--st-ease), border-color var(--st-t) var(--st-ease); }
.nv__burger:hover { color: var(--st-ink); border-color: var(--st-ink-3); }
.nv__burger:focus-visible { outline: 2px solid var(--st-brand); outline-offset: 2px; }

.nv__sheet {
  position: absolute;
  top: calc(100% + 10px);
  right: var(--st-gutter);
  width: min(268px, calc(100vw - 24px));
  max-height: min(72vh, 520px);
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  border: 1px solid var(--st-line);
  background: var(--st-bg);
  box-shadow: var(--st-shadow-3);
  z-index: 60;
  overflow: hidden;
  transform-origin: top right;
}

.nv__sheet-account {
  display: flex; align-items: center; gap: 10px;
  padding: 14px 14px 12px;
  border-bottom: 1px solid var(--st-line);
  flex: 0 0 auto;
}
.nv__sheet-avatar {
  display: grid; place-items: center; flex: 0 0 auto;
  width: 30px; height: 30px; border-radius: 50%;
  background: var(--st-bg-soft); border: 1px solid var(--st-line-2);
  font-size: 0.76rem; font-weight: 600; color: var(--st-ink);
}
.nv__sheet-who { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.nv__sheet-name { font-size: 0.84rem; font-weight: 600; color: var(--st-ink); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.nv__sheet-mail { font-size: 0.72rem; color: var(--st-ink-3); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* 菜单主体：内容多了自己滚，高度受限 */
.nv__sheet-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.nv__sheet :deep(.ls) { display: flex; width: 100%; }
.nv__sheet :deep(.ls__tab) { flex: 1 1 0; justify-content: center; }
.nv__sheet-section { display: flex; flex-direction: column; gap: 4px; }
.nv__sheet-section--links { border-top: 1px solid var(--st-line); padding-top: 10px; }
.nv__sheet-label { font-size: 0.7rem; letter-spacing: 0.08em; text-transform: uppercase; color: var(--st-ink-3); margin-bottom: 2px; }
.nv__sheet-item {
  display: flex; align-items: center;
  width: 100%; min-height: 38px; text-align: left;
  padding: 7px 8px; border: 0; border-radius: 8px; background: none;
  font-family: inherit; font-size: 0.88rem; color: var(--st-ink-2);
  text-decoration: none; cursor: pointer;
  transition: background-color var(--st-t-fast) var(--st-ease), color var(--st-t-fast) var(--st-ease);
}
.nv__sheet-item:hover { background: var(--st-bg-soft); color: var(--st-ink); }
.nv__sheet-item.router-link-active { color: var(--st-ink); background: var(--st-bg-soft); font-weight: 550; }

.nv__sheet-foot {
  flex: 0 0 auto;
  padding: 8px 14px 12px;
  border-top: 1px solid var(--st-line);
}
.nv__sheet-item--danger { color: var(--st-danger); }
.nv__sheet-item--danger:hover { background: var(--st-danger-soft); color: var(--st-danger); }

/* 抽屉进出场：从右上角展开，收起时轻微回缩 */
.sheet-enter-active { transition: opacity 170ms cubic-bezier(0.16, 1, 0.3, 1), transform 200ms cubic-bezier(0.16, 1, 0.3, 1); }
.sheet-leave-active { transition: opacity 130ms ease, transform 130ms ease; }
.sheet-enter-from { opacity: 0; transform: translateY(-8px) scale(0.96); }
.sheet-leave-to { opacity: 0; transform: translateY(-6px) scale(0.98); }

@media (prefers-reduced-motion: reduce) {
  .sheet-enter-active, .sheet-leave-active { transition: none; }
}

/* 手机端：左边只留品牌，右边只留余额 / 主题 / 菜单 */
@media (max-width: 719px) {
  .nv__in { gap: 10px; height: 56px; }
  .nv__balance { font-size: 0.8rem; padding: 4px 6px; }
  .nv__balance-full { display: none; }
  .nv__balance-short { display: inline; }
  .nv__right { gap: 4px; }
  .nv__sheet { right: 12px; width: min(280px, calc(100vw - 24px)); }
}

@media (min-width: 1024px) {
  .nv__links { display: flex; }
  .nv__lang { display: inline-flex; }
  .nv__avatar { display: grid; }
  .nv__burger { display: none; }
}

/* 未登录：绿色主按钮 + 菜单常显，主题与语言都在菜单里 */
@media (max-width: 420px) {
  .nv__auth { height: 30px; padding-inline: 12px; font-size: 0.8rem; }
}
</style>
