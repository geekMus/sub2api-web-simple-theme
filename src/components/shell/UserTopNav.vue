<template>
  <header v-if="ready" class="nv" :class="{ 'nv--stuck': scrolled }">
    <div class="st-shell nv__in">
      <BrandMark />

      <div class="nv__right">
        <router-link v-if="user" to="/dashboard" class="nv__balance" :title="c('nav.balance')">{{ money }}</router-link>
        <span class="nv__lang"><LocaleSwitcher /></span>
        <ThemeToggle />

        <template v-if="user">
          <div class="nv__acct">
            <button class="nv__avatar" type="button" :aria-label="c('account.profile')" @click="menuOpen = !menuOpen">{{ initial }}</button>
            <transition name="pop">
              <div v-if="menuOpen" class="nv__menu">
                <div class="nv__menu-head">
                  <p class="nv__menu-name">{{ user.username || user.email }}</p>
                  <p class="nv__menu-mail">{{ user.email }}</p>
                </div>
                <router-link v-for="m in accountMenu" :key="m.to" :to="m.to" class="nv__menu-item" @click="menuOpen = false">{{ m.label }}</router-link>
                <button class="nv__menu-item nv__menu-item--danger" type="button" @click="signOut">{{ c('account.logout') }}</button>
              </div>
            </transition>
          </div>
        </template>
        <router-link v-else to="/login" class="st-btn st-btn--primary st-btn--sm">
          {{ c('nav.authEntry') }}
        </router-link>

        <button class="nv__burger" type="button" :aria-label="c('nav.menu')" @click="sheetOpen = !sheetOpen">
          <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5">
            <path v-if="!sheetOpen" d="M3 6h14M3 10h14M3 14h14" stroke-linecap="round" />
            <path v-else d="M5 5l10 10M15 5L5 15" stroke-linecap="round" />
          </svg>
        </button>
      </div>
    </div>

    <transition name="sheet">
      <div v-if="sheetOpen" class="nv__sheet">
        <div class="nv__sheet-lang"><LocaleSwitcher /></div>
        <div class="nv__sheet-foot">
          <template v-if="!user">
            <router-link to="/login" class="st-btn st-btn--quiet st-btn--sm" @click="sheetOpen = false">{{ c('nav.login') }}</router-link>
            <router-link to="/register" class="st-btn st-btn--primary st-btn--sm" @click="sheetOpen = false">{{ c('nav.signup') }}</router-link>
          </template>
          <template v-else>
            <router-link v-for="m in accountMenu" :key="m.to" :to="m.to" class="nv__sheet-link nv__sheet-link--sub" @click="sheetOpen = false">{{ m.label }}</router-link>
          </template>
        </div>
      </div>
    </transition>
  </header>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore, useAuthStore } from '@/stores'
import BrandMark from './BrandMark.vue'
import ThemeToggle from './ThemeToggle.vue'
import LocaleSwitcher from '@/components/common/LocaleSwitcher.vue'
import { useSimpleCopy } from '@/composables/useSimpleCopy'
import { formatCurrency } from '@/utils/format'

let router: ReturnType<typeof useRouter> | null = null
let authStore: ReturnType<typeof useAuthStore> | null = null
let appStore: ReturnType<typeof useAppStore> | null = null
try {
  router = useRouter()
  authStore = useAuthStore()
  appStore = useAppStore()
} catch {
  router = null
}
const ready = !!authStore && !!appStore
const { c } = useSimpleCopy()

const user = computed(() => authStore?.user ?? null)
const initial = computed(() => String(user.value?.username || user.value?.email || '?').trim().charAt(0).toUpperCase())
const money = computed(() => formatCurrency(user.value?.balance ?? 0))
const menuOpen = ref(false)
const sheetOpen = ref(false)
const scrolled = ref(false)

const accountMenu = computed(() => {
  const items = [{ to: '/profile', label: c('account.profile') }]
  if (appStore?.cachedPublicSettings?.affiliate_enabled) items.push({ to: '/affiliate', label: c('account.affiliate') })
  if (appStore?.cachedPublicSettings?.mcp_enabled) items.push({ to: '/mcp', label: c('account.mcp') })
  if (authStore?.isAdmin) items.push({ to: '/admin/dashboard', label: c('account.admin') })
  return items
})

function onScroll() { scrolled.value = window.scrollY > 8 }

async function signOut() {
  menuOpen.value = false
  await authStore?.logout()
  router?.push('/login')
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
})
onBeforeUnmount(() => window.removeEventListener('scroll', onScroll))
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

.nv__right { display: flex; align-items: center; gap: 6px; margin-left: auto; }
.nv__balance { font-size: 0.82rem; font-weight: 550; color: var(--st-ink); text-decoration: none; padding: 5px 9px; border-radius: 6px; font-variant-numeric: tabular-nums; }
.nv__balance:hover { background: var(--st-bg-soft); }

.nv__acct { position: relative; }
.nv__avatar { width: 28px; height: 28px; border-radius: 50%; border: 1px solid var(--st-line-2); background: var(--st-bg-soft); color: var(--st-ink); font-family: inherit; font-size: 0.75rem; font-weight: 600; cursor: pointer; }
.nv__menu { position: absolute; top: 38px; right: 0; min-width: 200px; padding: 5px; border-radius: var(--st-r-md); border: 1px solid var(--st-line); background: var(--st-bg); box-shadow: var(--st-shadow-3); z-index: 50; }
.nv__menu-head { padding: 9px 9px 10px; border-bottom: 1px solid var(--st-line); margin-bottom: 4px; }
.nv__menu-name { font-size: 0.83rem; font-weight: 600; color: var(--st-ink); }
.nv__menu-mail { margin-top: 1px; font-size: 0.74rem; color: var(--st-ink-3); word-break: break-all; }
.nv__menu-item { display: block; width: 100%; text-align: left; padding: 7px 9px; border-radius: 6px; border: 0; background: none; font-family: inherit; font-size: 0.84rem; color: var(--st-ink-2); text-decoration: none; cursor: pointer; }
.nv__menu-item:hover { background: var(--st-bg-soft); color: var(--st-ink); }
.nv__menu-item--danger:hover { background: var(--st-danger-soft); color: var(--st-danger); }

.nv__burger { display: inline-grid; place-items: center; width: 34px; height: 34px; border-radius: 8px; border: 1px solid var(--st-line-2); background: var(--st-bg-soft); color: var(--st-ink-2); cursor: pointer; }
.nv__sheet { position: absolute; inset: 60px 0 auto; padding: 8px var(--st-gutter) 18px; background: var(--st-bg); border-bottom: 1px solid var(--st-line); display: flex; flex-direction: column; }
.nv__sheet-link { padding: 11px 4px; font-size: 0.95rem; color: var(--st-ink); text-decoration: none; border-bottom: 1px solid var(--st-line); }
.nv__sheet-link--sub { font-size: 0.86rem; color: var(--st-ink-2); border-bottom: 0; }
.nv__sheet-lang { display: flex; justify-content: flex-start; padding-top: 12px; }
.nv__sheet-foot { display: flex; flex-wrap: wrap; gap: 8px; padding-top: 12px; }

.pop-enter-active, .pop-leave-active { transition: opacity var(--st-t-fast) var(--st-ease), transform var(--st-t-fast) var(--st-ease); }
.pop-enter-from, .pop-leave-to { opacity: 0; transform: translateY(-4px); }
.sheet-enter-active, .sheet-leave-active { transition: opacity var(--st-t) var(--st-ease), transform var(--st-t) var(--st-ease); }
.sheet-enter-from, .sheet-leave-to { opacity: 0; transform: translateY(-6px); }

/* 窄屏：语言切换收进抽屉，导航只留品牌 + 主题 + 主按钮 + 菜单 */
@media (max-width: 560px) {
  .nv__lang { display: none; }
  .nv__in { gap: 10px; }
}

@media (min-width: 920px) {
  .nv__burger { display: none; }
}
</style>
